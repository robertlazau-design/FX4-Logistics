// The team portal's server: one Vercel Function at /api/portal.
//
// - Records live in Neon Postgres (DATABASE_URL), report photos in a private Vercel Blob store
//   (BLOB_READ_WRITE_TOKEN), opened only through this function.
// - Drivers sign in once per phone with a code texted by Twilio Verify. The office (Daniel and
//   David) signs in with Google; only the accounts in OFFICE_EMAILS get in. Every office action
//   is checked here, on the server.
// - Nothing is ever deleted: drivers can add records, the office can update them, and every
//   change goes in the change log. Lock codes never go in the portal.
// - Without DATABASE_URL and SESSION_SECRET the portal stays the in-browser demo.
//
// Everything is in this one file on purpose: it imports only npm packages, so Vercel can run it
// as is. src/portal/types.ts is types only.
import { neon } from '@neondatabase/serverless';
import { get as blobGet, put as blobPut } from '@vercel/blob';
import { SignJWT, createRemoteJWKSet, jwtVerify } from 'jose';
import type {
  CrashInfo,
  Device,
  Feedback,
  InspectionResult,
  LeavingStep,
  Person,
  Post,
  Report,
  ReportKind,
  ReportStatus,
  RoadsideInfo,
  Role,
  Rule,
  RuleVersion,
  Session,
  Signoff,
  State,
  StateReply,
  Towed,
  Unit,
  UnitKind,
} from '../src/portal/types';

/* ---------- Plumbing ---------- */

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type Db = { q: (text: string, params?: unknown[]) => Promise<Row[]> };
export type Env = Record<string, string | undefined>;
export type Deps = {
  db: Db;
  env: Env;
  sms: { send(to: string): Promise<void>; check(to: string, code: string): Promise<boolean> } | null;
  google: { verify(credential: string): Promise<{ email: string } | null> } | null;
  files: { put(path: string, body: ArrayBuffer, type: string): Promise<void>; get(path: string): Promise<{ stream: ReadableStream<Uint8Array>; type: string } | null> } | null;
  mail: { send(subject: string, text: string): Promise<void> } | null;
  now: () => number;
};

const KINDS: ReportKind[] = ['Defect', 'Damage', 'Crash', 'Breakdown', 'Roadside inspection', 'Other'];
const STATUSES: ReportStatus[] = ['Open', 'In the shop', 'Fixed'];
const RESULTS: InspectionResult[] = ['No violations', 'Violations', 'Out of service'];
const TOWS: Towed[] = ['Yes', 'No', 'Not sure'];
const ROLE_LIST: Role[] = ['driver', 'dispatch', 'owner'];
const UNIT_LIST: { kind: UnitKind; label: string }[] = [
  { kind: 'truck', label: 'Tractor' },
  { kind: 'flatbed', label: 'Flatbed' },
  { kind: 'stepdeck', label: 'Step deck' },
  { kind: 'dryvan', label: 'Dry van' },
];
const STEPS: LeavingStep[] = ['codes', 'keys', 'fuel', 'files', 'phone'];
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const COOKIE = '__Host-fx4p';
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const DRIVER_DAYS = 400; // browsers cap cookies near 400 days
const OFFICE_DAYS = 7;
const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const SCHEMA = '1';

class Fail extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const fail = (status: number, message: string): never => {
  throw new Fail(status, message);
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

const rid = (prefix: string) => {
  const b = crypto.getRandomValues(new Uint8Array(10));
  return prefix + Array.from(b, (x) => (x % 36).toString(36)).join('');
};
const token = () => {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/* ---------- Checking what comes in ---------- */

const str = (v: unknown, name: string, min: number, max: number) => {
  if (typeof v !== 'string') return fail(400, `${name} is missing.`);
  const t = v.trim();
  if (t.length < min) return fail(400, min <= 1 ? `${name} is missing.` : `${name} is too short.`);
  if (t.length > max) return fail(400, `${name} is too long (${max} characters at most).`);
  return t;
};
const optStr = (v: unknown, name: string, max: number) => (v === undefined || v === null || v === '' ? '' : str(v, name, 0, max));
const oneOf = <T extends string>(v: unknown, list: readonly T[], name: string): T => (list.includes(v as T) ? (v as T) : fail(400, `${name} isn’t one of the choices.`));
const bool = (v: unknown) => v === true;
const count = (v: unknown, name: string) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 99 ? (v as number) : fail(400, `${name} should be a number from 0 to 99.`));
const usState = (v: unknown) => {
  const t = str(v, 'State', 2, 2).toUpperCase();
  return /^[A-Z]{2}$/.test(t) ? t : fail(400, 'Use the 2-letter state, like OR.');
};
const id = (v: unknown, name: string) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : fail(400, `${name} is missing.`));

// A US cell number, stored as +1XXXXXXXXXX (what Twilio needs).
export function e164(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return fail(400, 'Use a 10-digit US cell number, like (503) 555-0101.');
}
// A lock code typed into a unit's lock note ("the code is 4521"). Phone numbers don't count.
export const looksLikeACode = (t: string) => /\b(code|combo|combination|pin)\b\D{0,20}\d{3,8}\b/i.test(t.replace(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, ''));
const display = (p: string) => `(${p.slice(2, 5)}) ${p.slice(5, 8)}-${p.slice(8)}`;

/* ---------- The database ---------- */

const DDL = [
  `CREATE TABLE IF NOT EXISTS portal_meta (k text PRIMARY KEY, v text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS people (id text PRIMARY KEY, name text NOT NULL, role text NOT NULL, title text NOT NULL DEFAULT '', phone text, listed boolean NOT NULL DEFAULT false,
     active boolean NOT NULL DEFAULT true, created_at float8 NOT NULL, left_at float8)`,
  `CREATE TABLE IF NOT EXISTS units (id text PRIMARY KEY, label text NOT NULL, kind text NOT NULL, lock jsonb NOT NULL, guides jsonb NOT NULL, specs jsonb NOT NULL,
     active boolean NOT NULL DEFAULT true, created_at float8 NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS rules (id text PRIMARY KEY, sort integer NOT NULL, active boolean NOT NULL DEFAULT true)`,
  `CREATE TABLE IF NOT EXISTS rule_versions (rule text NOT NULL REFERENCES rules(id), version integer NOT NULL, title text NOT NULL, points jsonb NOT NULL, note text NOT NULL,
     at float8 NOT NULL, by text NOT NULL, PRIMARY KEY (rule, version))`,
  `CREATE TABLE IF NOT EXISTS signoffs (id bigserial PRIMARY KEY, person text NOT NULL REFERENCES people(id), rule text NOT NULL, version integer NOT NULL, at float8 NOT NULL, device text)`,
  `CREATE TABLE IF NOT EXISTS reports (id text PRIMARY KEY, unit text NOT NULL, kind text NOT NULL, text text NOT NULL, urgent boolean NOT NULL, by text NOT NULL REFERENCES people(id),
     at float8 NOT NULL, status text NOT NULL, crash jsonb, roadside jsonb, device text)`,
  `CREATE TABLE IF NOT EXISTS photos (id text PRIMARY KEY, report text NOT NULL REFERENCES reports(id), path text NOT NULL, type text NOT NULL, bytes integer NOT NULL,
     at float8 NOT NULL, by text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS posts (id text PRIMARY KEY, title text NOT NULL, body text NOT NULL, at float8 NOT NULL, by text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS seen (person text NOT NULL, post text NOT NULL, PRIMARY KEY (person, post))`,
  `CREATE TABLE IF NOT EXISTS feedback (guide text NOT NULL, person text NOT NULL, helped boolean NOT NULL, at float8 NOT NULL, PRIMARY KEY (guide, person))`,
  `CREATE TABLE IF NOT EXISTS leaving (person text NOT NULL, step text NOT NULL, at float8 NOT NULL, PRIMARY KEY (person, step))`,
  `CREATE TABLE IF NOT EXISTS devices (id text PRIMARY KEY, person text NOT NULL REFERENCES people(id), at float8 NOT NULL, seen float8 NOT NULL, off_at float8, off_by text)`,
  `CREATE TABLE IF NOT EXISTS attempts (id bigserial PRIMARY KEY, kind text NOT NULL, key text NOT NULL, at float8 NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS attempts_kind_key_at ON attempts (kind, key, at)`,
  `CREATE TABLE IF NOT EXISTS changes (id bigserial PRIMARY KEY, at float8 NOT NULL, actor text NOT NULL, op text NOT NULL, target text, detail jsonb)`,
];

async function migrate(db: Db) {
  try {
    const r = await db.q(`SELECT v FROM portal_meta WHERE k = 'schema'`);
    if (r[0]?.v === SCHEMA) return;
  } catch {
    /* first run: no tables yet */
  }
  for (const s of DDL) await db.q(s);
  await db.q(`INSERT INTO portal_meta (k, v) VALUES ('schema', $1) ON CONFLICT (k) DO UPDATE SET v = $1`, [SCHEMA]);
}

/* ---------- Sessions ---------- */

type Auth = { kind: 'none' } | { kind: 'driver'; person: string; device: string; deviceAt: number } | { kind: 'office'; email: string };

const officeList = (env: Env) =>
  (env.OFFICE_EMAILS ?? '')
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

function readCookie(req: Request) {
  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return null;
}
const setCookie = (value: string, days: number) => `${COOKIE}=${value}; Path=/; Max-Age=${Math.round(days * 86400)}; HttpOnly; Secure; SameSite=Lax`;
const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

const key = (env: Env) => new TextEncoder().encode(env.SESSION_SECRET);
const sign = (env: Env, claims: Record<string, string>, days: number, now: number) =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(Math.floor(now / 1000 + days * 86400))
    .sign(key(env));

async function authOf(req: Request, d: Deps): Promise<Auth> {
  const raw = readCookie(req);
  if (!raw) return { kind: 'none' };
  let claims: Record<string, unknown>;
  try {
    claims = (await jwtVerify(raw, key(d.env), { algorithms: ['HS256'], currentDate: new Date(d.now()) })).payload as Record<string, unknown>;
  } catch {
    return { kind: 'none' };
  }
  if (claims.k === 'o' && typeof claims.e === 'string') return officeList(d.env).includes(claims.e) ? { kind: 'office', email: claims.e } : { kind: 'none' };
  if (claims.k === 'd' && typeof claims.dev === 'string') {
    const r = await d.db.q(`SELECT d.person, d.at, d.seen FROM devices d JOIN people p ON p.id = d.person WHERE d.id = $1 AND d.off_at IS NULL AND p.active`, [claims.dev]);
    if (!r[0]) return { kind: 'none' };
    if (d.now() - r[0].seen > HOUR) await d.db.q(`UPDATE devices SET seen = $2 WHERE id = $1`, [claims.dev, d.now()]);
    return { kind: 'driver', person: r[0].person, device: claims.dev, deviceAt: r[0].at };
  }
  return { kind: 'none' };
}

const actorOf = (a: Auth) => (a.kind === 'office' ? `office:${a.email}` : a.kind === 'driver' ? a.person : 'anyone');
const viewerOf = (a: Auth) => (a.kind === 'office' ? `office:${a.email}` : a.kind === 'driver' ? a.person : '');
const needOffice = (a: Auth) => (a.kind === 'office' ? a : fail(403, 'Only the office can do that. Sign in on the office side.'));
const needDriver = (a: Auth) => (a.kind === 'driver' ? a : fail(401, 'Sign in on this phone first.'));
const needSignedIn = (a: Auth) => (a.kind === 'none' ? fail(401, 'Sign in on this phone first.') : a);

async function log(d: Deps, a: Auth, op: string, target: string | null, detail: unknown = null) {
  await d.db.q(`INSERT INTO changes (at, actor, op, target, detail) VALUES ($1, $2, $3, $4, $5)`, [d.now(), actorOf(a), op, target, detail === null ? null : JSON.stringify(detail)]);
}

// Counts recent tries and refuses past the limit, so nobody can flood a driver with texts.
async function limit(d: Deps, kind: string, k: string, max: number, windowMs: number, message: string) {
  const r = await d.db.q(`SELECT count(*)::int AS n FROM attempts WHERE kind = $1 AND key = $2 AND at > $3`, [kind, k, d.now() - windowMs]);
  if (r[0].n >= max) fail(429, message);
}
const attempt = (d: Deps, kind: string, k: string) => d.db.q(`INSERT INTO attempts (kind, key, at) VALUES ($1, $2, $3)`, [kind, k, d.now()]);
const ipOf = (req: Request) => (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown').split(',')[0].trim();

/* ---------- Turning rows into what the screens use ---------- */

const kindLabel = (k: string) => UNIT_LIST.find((u) => u.kind === k)?.label ?? k;

function personOut(r: Row, view: 'none' | 'driver' | 'office'): Person {
  const p: Person = { id: r.id, name: r.name, role: r.role, title: r.title, listed: r.listed };
  if (view === 'none') {
    if (r.phone) p.last2 = String(r.phone).slice(-2);
    else p.noPhone = true;
    return p;
  }
  if (r.phone && (view === 'office' || r.listed)) {
    p.phone = display(r.phone);
    p.tel = `tel:${r.phone}`;
  }
  if (view === 'office') p.active = r.active;
  return p;
}

const unitOut = (r: Row): Unit => ({ id: r.id, label: r.label, kind: r.kind, kindLabel: kindLabel(r.kind), lock: r.lock, guides: r.guides, specs: r.specs, active: r.active });

function reportOut(r: Row, photos: Row[], showPhotos: boolean): Report {
  const mine = photos.filter((p) => p.report === r.id);
  const x: Report = { id: r.id, unit: r.unit, kind: r.kind, text: r.text, urgent: r.urgent, by: r.by, at: r.at, status: r.status, photos: mine.length };
  if (showPhotos) x.photoIds = mine.map((p) => p.id);
  if (r.crash) x.crash = r.crash as CrashInfo;
  if (r.roadside) x.roadside = r.roadside as RoadsideInfo;
  return x;
}

async function rulesOut(d: Deps) {
  const rows = await d.db.q(`SELECT v.rule, v.version, v.title, v.points, v.note, v.at FROM rule_versions v JOIN rules r ON r.id = v.rule WHERE r.active ORDER BY r.sort, v.version`);
  const latest = new Map<string, Row>();
  for (const r of rows) latest.set(r.rule, r);
  const rules: Rule[] = [...latest.values()].map((r) => ({ id: r.rule, title: r.title, points: r.points }));
  const versions: RuleVersion[] = rows.map((r) => ({ rule: r.rule, version: r.version, at: r.at, note: r.note }));
  return { rules, versions };
}

const empty = (): State => ({ v: 3, me: null, meAt: null, people: [], units: [], rules: [], listed: {}, versions: [], signoffs: [], reports: [], leaving: {}, posts: [], seen: {}, feedback: [] });

async function stateFor(d: Deps, a: Auth): Promise<State> {
  const s = empty();
  if (a.kind === 'none') {
    // The sign-in screen: names to pick from, and nothing else.
    const rows = await d.db.q(`SELECT * FROM people WHERE active AND role <> 'owner' ORDER BY name`);
    s.people = rows.map((r) => personOut(r, 'none'));
    return s;
  }
  const office = a.kind === 'office';
  const view = office ? 'office' : 'driver';
  const [people, units, posts, photos] = await Promise.all([
    d.db.q(office ? `SELECT * FROM people ORDER BY active DESC, name` : `SELECT * FROM people WHERE active ORDER BY name`),
    d.db.q(office ? `SELECT * FROM units ORDER BY id` : `SELECT * FROM units WHERE active ORDER BY id`),
    d.db.q(`SELECT * FROM posts ORDER BY at DESC LIMIT 100`),
    d.db.q(office ? `SELECT id, report, by FROM photos ORDER BY at` : `SELECT id, report, by FROM photos WHERE by = $1 ORDER BY at`, office ? [] : [a.person]),
  ]);
  s.people = people.map((r) => personOut(r, view));
  s.units = units.map(unitOut);
  s.posts = posts.map((r): Post => ({ id: r.id, title: r.title, body: r.body, at: r.at, by: r.by }));
  Object.assign(s, await rulesOut(d));

  if (office) {
    const [reports, signoffs, leaving, feedback, devices] = await Promise.all([
      d.db.q(`SELECT * FROM reports ORDER BY at DESC`),
      d.db.q(`SELECT person, rule, version, at FROM signoffs ORDER BY at`),
      d.db.q(`SELECT * FROM leaving`),
      d.db.q(`SELECT * FROM feedback`),
      d.db.q(`SELECT id, person, at, seen FROM devices WHERE off_at IS NULL ORDER BY at`),
    ]);
    s.reports = reports.map((r) => reportOut(r, photos, true));
    s.signoffs = signoffs as Signoff[];
    for (const l of leaving) (s.leaving[l.person] ??= {})[l.step as LeavingStep] = l.at;
    s.feedback = feedback.map((f): Feedback => ({ guide: f.guide, helped: f.helped, by: f.person, at: f.at }));
    s.devices = devices as Device[];
    s.seen[viewerOf(a)] = (await d.db.q(`SELECT post FROM seen WHERE person = $1`, [viewerOf(a)])).map((r) => r.post);
    return s;
  }

  // A driver sees their own records, and the open everyday problems on any unit (so they know
  // about the marker light before they hook up). Crashes and inspections stay with the office.
  const [reports, signoffs, seen, feedback] = await Promise.all([
    d.db.q(`SELECT * FROM reports WHERE by = $1 OR (status <> 'Fixed' AND kind NOT IN ('Crash', 'Roadside inspection')) ORDER BY at DESC LIMIT 300`, [a.person]),
    d.db.q(`SELECT person, rule, version, at FROM signoffs WHERE person = $1 ORDER BY at`, [a.person]),
    d.db.q(`SELECT post FROM seen WHERE person = $1`, [a.person]),
    d.db.q(`SELECT * FROM feedback WHERE person = $1`, [a.person]),
  ]);
  s.me = a.person;
  s.meAt = a.deviceAt;
  s.reports = reports.map((r) => reportOut(r, photos, r.by === a.person));
  s.signoffs = signoffs as Signoff[];
  s.seen[a.person] = seen.map((r) => r.post);
  s.feedback = feedback.map((f): Feedback => ({ guide: f.guide, helped: f.helped, by: f.person, at: f.at }));
  return s;
}

/* ---------- What each request does ---------- */

type Body = Record<string, unknown>;
type Ctx = { req: Request; d: Deps; a: Auth; url: URL };

async function personRow(d: Deps, pid: unknown) {
  const r = await d.db.q(`SELECT * FROM people WHERE id = $1`, [id(pid, 'Person')]);
  return r[0] ?? fail(404, 'That person isn’t on the team list.');
}
async function reportRow(d: Deps, rptId: unknown) {
  const r = await d.db.q(`SELECT * FROM reports WHERE id = $1`, [id(rptId, 'Report')]);
  return r[0] ?? fail(404, 'That report isn’t there.');
}

async function alert(d: Deps, r: Row, who: string, unit: string) {
  if (!d.mail) return;
  const base = (d.env.PORTAL_URL ?? 'https://www.fx4logistics.com').replace(/\/$/, '');
  const head = r.kind === 'Crash' ? 'Crash reported' : `Urgent: ${r.kind.toLowerCase()} report`;
  const lines = [
    `${head} on ${unit} by ${who}.`,
    '',
    r.text,
    '',
    r.crash ? `Where: ${r.crash.place}, ${r.crash.state}. Hurt: ${r.crash.hurt}. Deaths: ${r.crash.deaths}. Towed: ${r.crash.towed}.` : '',
    `Open it on the office side: ${base}/portal/office/${r.kind === 'Crash' ? 'records' : 'maintenance'}`,
    '',
    'Sent by the FX4 team portal.',
  ].filter((l, i, all) => l || all[i - 1]);
  try {
    await d.mail.send(`FX4 portal: ${head} · ${unit}`, lines.join('\n'));
    await log(d, { kind: 'none' }, 'alert-sent', r.id);
  } catch (e) {
    await log(d, { kind: 'none' }, 'alert-failed', r.id, { error: String(e).slice(0, 200) });
  }
}

const POSTS: Record<string, (c: Ctx, b: Body) => Promise<Response>> = {
  /* Signing in */

  async 'code-send'({ req, d }, b) {
    const p = await personRow(d, b.person);
    if (!p.active || p.role === 'owner') fail(400, 'That name signs in on the office side.');
    if (!p.phone) fail(400, 'There’s no cell number on file for that name yet. Call the office.');
    if (!d.sms) fail(503, 'Text codes aren’t switched on yet. Call the office.');
    await limit(d, 'send', p.id, 3, 15 * MIN, 'That’s 3 codes in 15 minutes. Wait a bit, or call the office.');
    await limit(d, 'send', p.id, 10, DAY, 'Too many codes today for that name. Call the office.');
    await limit(d, 'send-ip', ipOf(req), 20, HOUR, 'Too many codes from here. Try again in an hour, or call the office.');
    await attempt(d, 'send', p.id);
    await attempt(d, 'send-ip', ipOf(req));
    try {
      await d.sms!.send(p.phone);
    } catch {
      fail(502, 'The text didn’t go out. Try again in a minute, or call the office.');
    }
    return json({ ok: true, last2: String(p.phone).slice(-2) });
  },

  async 'code-check'({ d }, b) {
    const p = await personRow(d, b.person);
    const code = typeof b.code === 'string' ? b.code.trim() : '';
    if (!/^\d{4,10}$/.test(code)) fail(400, 'Type the numbers from the text.');
    if (!p.active || !p.phone || p.role === 'owner') fail(400, 'That name can’t sign in here.');
    if (!d.sms) fail(503, 'Text codes aren’t switched on yet. Call the office.');
    await limit(d, 'check', p.id, 10, HOUR, 'Too many tries. Wait an hour, or call the office.');
    await attempt(d, 'check', p.id);
    let ok = false;
    try {
      ok = await d.sms!.check(p.phone, code);
    } catch {
      fail(502, 'Couldn’t check the code just now. Try again in a minute.');
    }
    if (!ok) fail(400, 'That code doesn’t match, or it ran out. Check the text, or send a new code.');
    const dev = token();
    await d.db.q(`INSERT INTO devices (id, person, at, seen) VALUES ($1, $2, $3, $3)`, [dev, p.id, d.now()]);
    await log(d, { kind: 'driver', person: p.id, device: dev, deviceAt: d.now() }, 'phone-on', p.id);
    const cookie = await sign(d.env, { k: 'd', dev }, DRIVER_DAYS, d.now());
    return json({ ok: true }, 200, { 'set-cookie': setCookie(cookie, DRIVER_DAYS) });
  },

  async 'office-signin'({ d }, b) {
    if (!d.google) fail(503, 'Office sign-in isn’t switched on yet.');
    const credential = typeof b.credential === 'string' ? b.credential : fail(400, 'Google sign-in didn’t finish. Try again.');
    let who: { email: string } | null = null;
    try {
      who = await d.google!.verify(credential);
    } catch {
      who = null;
    }
    if (!who) fail(401, 'Google sign-in didn’t check out. Try again.');
    const email = who!.email.toLowerCase();
    if (!officeList(d.env).includes(email)) fail(403, `${email} isn’t on the office list.`);
    await log(d, { kind: 'office', email }, 'office-signin', email);
    const cookie = await sign(d.env, { k: 'o', e: email }, OFFICE_DAYS, d.now());
    return json({ ok: true }, 200, { 'set-cookie': setCookie(cookie, OFFICE_DAYS) });
  },

  async signout({ d, a }) {
    if (a.kind === 'driver') {
      await d.db.q(`UPDATE devices SET off_at = $2, off_by = 'self' WHERE id = $1`, [a.device, d.now()]);
      await log(d, a, 'phone-off', a.person, { by: 'self' });
    }
    return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
  },

  /* Drivers */

  async sign({ d, a }, b) {
    const me = needDriver(a);
    const rule = id(b.rule, 'Rule');
    const v = await d.db.q(`SELECT max(v.version)::int AS version FROM rule_versions v JOIN rules r ON r.id = v.rule WHERE v.rule = $1 AND r.active`, [rule]);
    const version = v[0]?.version ?? fail(404, 'That rule isn’t in the handbook.');
    const had = await d.db.q(`SELECT 1 FROM signoffs WHERE person = $1 AND rule = $2 AND version = $3`, [me.person, rule, version]);
    if (!had.length) {
      await d.db.q(`INSERT INTO signoffs (person, rule, version, at, device) VALUES ($1, $2, $3, $4, $5)`, [me.person, rule, version, d.now(), me.device]);
      await log(d, a, 'sign', rule, { version });
    }
    return json({ ok: true, version });
  },

  async report({ d, a }, b) {
    const me = needDriver(a);
    const u = await d.db.q(`SELECT * FROM units WHERE id = $1 AND active`, [id(b.unit, 'Truck or trailer')]);
    if (!u[0]) fail(400, 'Pick the truck or trailer.');
    const kind = oneOf(b.kind, KINDS, 'What happened');
    const text = str(b.text, 'What’s wrong', 3, 2000);
    let crash: CrashInfo | null = null;
    let roadside: RoadsideInfo | null = null;
    if (kind === 'Crash') {
      const c = (b.crash ?? {}) as Body;
      crash = {
        place: str(c.place, 'Town or city', 1, 80),
        state: usState(c.state),
        hurt: count(c.hurt, 'People hurt'),
        deaths: count(c.deaths, 'Deaths'),
        towed: oneOf(c.towed, TOWS, 'Towed'),
        hazmat: bool(c.hazmat),
        police: optStr(c.police, 'Police report number', 40),
      };
    }
    if (kind === 'Roadside inspection') {
      const c = (b.roadside ?? {}) as Body;
      roadside = { place: str(c.place, 'Where', 1, 80), state: usState(c.state), result: oneOf(c.result, RESULTS, 'Result') };
    }
    const rpt = { id: rid('r_'), unit: u[0].id, kind, text, urgent: bool(b.urgent), by: me.person, at: d.now(), status: 'Open', crash, roadside };
    await d.db.q(`INSERT INTO reports (id, unit, kind, text, urgent, by, at, status, crash, roadside, device) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
      rpt.id, rpt.unit, rpt.kind, rpt.text, rpt.urgent, rpt.by, rpt.at, rpt.status, crash && JSON.stringify(crash), roadside && JSON.stringify(roadside), me.device,
    ]);
    await log(d, a, 'report', rpt.id, { unit: rpt.unit, kind, urgent: rpt.urgent });
    if (rpt.urgent || kind === 'Crash') {
      const who = (await d.db.q(`SELECT name FROM people WHERE id = $1`, [me.person]))[0]?.name ?? 'a driver';
      await alert(d, rpt, who, u[0].label);
    }
    return json({ ok: true, id: rpt.id });
  },

  async seen({ d, a }, b) {
    const who = viewerOf(needSignedIn(a));
    const ids = Array.isArray(b.ids) ? b.ids.slice(0, 200).map((x) => id(x, 'Announcement')) : [];
    for (const post of ids) await d.db.q(`INSERT INTO seen (person, post) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [who, post]);
    return json({ ok: true });
  },

  async feedback({ d, a }, b) {
    const who = viewerOf(needSignedIn(a));
    const guide = id(b.guide, 'Guide');
    await d.db.q(`INSERT INTO feedback (guide, person, helped, at) VALUES ($1, $2, $3, $4) ON CONFLICT (guide, person) DO UPDATE SET helped = $3, at = $4`, [guide, who, bool(b.helped), d.now()]);
    return json({ ok: true });
  },

  /* The office */

  async status({ d, a }, b) {
    needOffice(a);
    const r = await reportRow(d, b.id);
    const status = oneOf(b.status, STATUSES, 'Status');
    await d.db.q(`UPDATE reports SET status = $2 WHERE id = $1`, [r.id, status]);
    await log(d, a, 'status', r.id, { from: r.status, to: status });
    return json({ ok: true });
  },

  async copies({ d, a }, b) {
    needOffice(a);
    const r = await reportRow(d, b.id);
    if (!r.crash) fail(400, 'That report isn’t a crash.');
    const crash = { ...r.crash };
    if (crash.copies) delete crash.copies;
    else crash.copies = d.now();
    await d.db.q(`UPDATE reports SET crash = $2 WHERE id = $1`, [r.id, JSON.stringify(crash)]);
    await log(d, a, 'copies', r.id, { filed: !!crash.copies });
    return json({ ok: true });
  },

  async certify({ d, a }, b) {
    needOffice(a);
    const r = await reportRow(d, b.id);
    if (!r.roadside) fail(400, 'That report isn’t a roadside inspection.');
    const roadside = { ...r.roadside };
    if (roadside.certified) delete roadside.certified;
    else roadside.certified = d.now();
    await d.db.q(`UPDATE reports SET roadside = $2 WHERE id = $1`, [r.id, JSON.stringify(roadside)]);
    await log(d, a, 'certify', r.id, { signed: !!roadside.certified });
    return json({ ok: true });
  },

  async listed({ d, a }, b) {
    needOffice(a);
    const p = await personRow(d, b.person);
    await d.db.q(`UPDATE people SET listed = $2 WHERE id = $1`, [p.id, bool(b.listed)]);
    await log(d, a, 'listed', p.id, { listed: bool(b.listed) });
    return json({ ok: true });
  },

  async tick({ d, a }, b) {
    needOffice(a);
    const p = await personRow(d, b.person);
    const step = oneOf(b.step, STEPS, 'Step');
    const had = await d.db.q(`SELECT 1 FROM leaving WHERE person = $1 AND step = $2`, [p.id, step]);
    if (had.length) await d.db.q(`DELETE FROM leaving WHERE person = $1 AND step = $2`, [p.id, step]);
    else await d.db.q(`INSERT INTO leaving (person, step, at) VALUES ($1, $2, $3)`, [p.id, step, d.now()]);
    await log(d, a, 'leaving', p.id, { step, done: !had.length });
    return json({ ok: true });
  },

  async post({ d, a }, b) {
    needOffice(a);
    const p = { id: rid('n_'), title: str(b.title, 'Headline', 1, 120), body: optStr(b.body, 'Details', 2000), at: d.now(), by: 'office' };
    await d.db.q(`INSERT INTO posts (id, title, body, at, by) VALUES ($1, $2, $3, $4, $5)`, [p.id, p.title, p.body, p.at, p.by]);
    await log(d, a, 'post', p.id, { title: p.title });
    return json({ ok: true, id: p.id });
  },

  // A new rule, or a new version of one: everyone signs again.
  async 'rule-save'({ d, a }, b) {
    needOffice(a);
    const title = str(b.title, 'Rule title', 1, 120);
    const points = Array.isArray(b.points) ? b.points.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean) : [];
    if (!points.length) fail(400, 'Write at least one line of the rule.');
    if (points.length > 20 || points.some((x) => x.length > 500)) fail(400, 'Keep a rule to 20 lines of 500 characters at most.');
    let rule = typeof b.rule === 'string' && b.rule ? id(b.rule, 'Rule') : '';
    let version = 1;
    if (rule) {
      const v = await d.db.q(`SELECT max(version)::int AS version FROM rule_versions WHERE rule = $1`, [rule]);
      if (v[0]?.version == null) fail(404, 'That rule isn’t in the handbook.');
      version = v[0].version + 1;
    } else {
      rule = rid('rule_');
      const s = await d.db.q(`SELECT coalesce(max(sort), 0)::int + 1 AS sort FROM rules`);
      await d.db.q(`INSERT INTO rules (id, sort) VALUES ($1, $2)`, [rule, s[0].sort]);
    }
    const note = version === 1 ? optStr(b.note, 'What changed', 200) || 'First version' : str(b.note, 'What changed', 1, 200);
    await d.db.q(`INSERT INTO rule_versions (rule, version, title, points, note, at, by) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [rule, version, title, JSON.stringify(points), note, d.now(), actorOf(a)]);
    await log(d, a, 'rule', rule, { version, note });
    return json({ ok: true, rule, version });
  },

  async 'person-save'({ d, a }, b) {
    needOffice(a);
    const name = str(b.name, 'Name', 1, 80);
    const role = oneOf(b.role, ROLE_LIST, 'Role');
    const title = optStr(b.title, 'Job title', 80);
    const phone = typeof b.phone === 'string' && b.phone.trim() ? e164(b.phone) : null;
    const listed = bool(b.listed) && !!phone;
    const active = b.active !== false;
    if (b.id) {
      const p = await personRow(d, b.id);
      await d.db.q(`UPDATE people SET name = $2, role = $3, title = $4, phone = $5, listed = $6, active = $7, left_at = $8 WHERE id = $1`, [
        p.id, name, role, title, phone, listed, active, active ? null : p.left_at ?? d.now(),
      ]);
      // A new number or leaving FX4 switches off every phone signed in under the old one.
      if (!active || phone !== p.phone) await d.db.q(`UPDATE devices SET off_at = $2, off_by = $3 WHERE person = $1 AND off_at IS NULL`, [p.id, d.now(), actorOf(a)]);
      await log(d, a, 'person', p.id, { name, role, phoneChanged: phone !== p.phone, active });
      return json({ ok: true, id: p.id });
    }
    const pid = rid('p_');
    await d.db.q(`INSERT INTO people (id, name, role, title, phone, listed, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, true, $7)`, [pid, name, role, title, phone, listed, d.now()]);
    await log(d, a, 'person-add', pid, { name, role });
    return json({ ok: true, id: pid });
  },

  async 'phone-off'({ d, a }, b) {
    needOffice(a);
    const p = await personRow(d, b.person);
    const r = await d.db.q(`UPDATE devices SET off_at = $2, off_by = $3 WHERE person = $1 AND off_at IS NULL RETURNING id`, [p.id, d.now(), actorOf(a)]);
    await log(d, a, 'phone-off', p.id, { phones: r.length });
    return json({ ok: true, phones: r.length });
  },

  async 'unit-save'({ d, a }, b) {
    needOffice(a);
    const uid = typeof b.id === 'string' && /^[A-Za-z0-9-]{1,12}$/.test(b.id.trim()) ? b.id.trim() : fail(400, 'Use the unit number painted on it: letters, numbers and dashes.');
    const kind = oneOf(b.kind, UNIT_LIST.map((u) => u.kind), 'Kind');
    const label = str(b.label, 'Name on the screen', 1, 40);
    const l = (b.lock ?? {}) as Body;
    const lock = { what: str(l.what, 'Lock', 1, 80), how: str(l.how, 'How to get the code or key', 1, 300) };
    if (looksLikeACode(`${lock.what} ${lock.how}`)) fail(400, 'Lock codes never go in the portal. Say who to call for it instead.');
    const guides = Array.isArray(b.guides) ? b.guides.slice(0, 16).map((g) => id(g, 'Guide')) : [];
    const specs = Array.isArray(b.specs)
      ? b.specs.slice(0, 12).map((x) => {
          const o = (x ?? {}) as Body;
          const v = optStr(o.v, 'Spec', 80);
          return v ? { k: str(o.k, 'Spec name', 1, 40), v } : { k: str(o.k, 'Spec name', 1, 40) };
        })
      : [];
    const active = b.active !== false;
    const had = await d.db.q(`SELECT 1 FROM units WHERE id = $1`, [uid]);
    if (had.length && b.isNew === true) fail(409, `There’s already a unit ${uid}.`);
    await d.db.q(
      `INSERT INTO units (id, label, kind, lock, guides, specs, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET label = $2, kind = $3, lock = $4, guides = $5, specs = $6, active = $7`,
      [uid, label, kind, JSON.stringify(lock), JSON.stringify(guides), JSON.stringify(specs), active, d.now()],
    );
    await log(d, a, had.length ? 'unit' : 'unit-add', uid, { label, kind, active });
    return json({ ok: true, id: uid });
  },
};

/* ---------- Photos ---------- */

async function photoUpload({ req, d, a, url }: Ctx) {
  const who = needSignedIn(a);
  if (!d.files) fail(503, 'Photo storage isn’t switched on yet. The report is saved without photos.');
  const r = await reportRow(d, url.searchParams.get('report'));
  if (who.kind === 'driver' && (r.by !== who.person || d.now() - r.at > DAY)) fail(403, 'Photos can only be added to your own report, the same day.');
  const type = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const ext = IMAGE_TYPES[type] ?? fail(415, 'Send a photo (JPEG, PNG or WebP).');
  const n = await d.db.q(`SELECT count(*)::int AS n FROM photos WHERE report = $1`, [r.id]);
  if (n[0].n >= MAX_PHOTOS) fail(400, `A report holds ${MAX_PHOTOS} photos at most.`);
  const body = await req.arrayBuffer();
  if (!body.byteLength) fail(400, 'The photo was empty.');
  if (body.byteLength > MAX_PHOTO_BYTES) fail(413, 'That photo is too big (10 MB at most).');
  const pid = rid('f_');
  const path = `portal/reports/${r.id}/${pid}.${ext}`;
  await d.files!.put(path, body, type);
  await d.db.q(`INSERT INTO photos (id, report, path, type, bytes, at, by) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [pid, r.id, path, type, body.byteLength, d.now(), actorOf(a)]);
  await log(d, a, 'photo', r.id, { photo: pid, bytes: body.byteLength });
  return json({ ok: true, id: pid });
}

async function photoView({ d, a, url }: Ctx) {
  const who = needSignedIn(a);
  if (!d.files) fail(503, 'Photo storage isn’t switched on yet.');
  const rows = await d.db.q(`SELECT p.*, r.by AS reporter FROM photos p JOIN reports r ON r.id = p.report WHERE p.id = $1`, [id(url.searchParams.get('id'), 'Photo')]);
  const p = rows[0] ?? fail(404, 'That photo isn’t there.');
  if (who.kind === 'driver' && p.reporter !== who.person) fail(403, 'Only the office and the driver who sent it can open this photo.');
  const f = await d.files!.get(p.path);
  if (!f) fail(404, 'That photo isn’t there.');
  return new Response(f!.stream, { headers: { 'content-type': p.type, 'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff' } });
}

/* ---------- Exports for an auditor or the insurer ---------- */

const csvCell = (v: unknown) => {
  const t = v === null || v === undefined ? '' : String(v);
  const safe = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t; // keep spreadsheet apps from running a cell as a formula
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
const day = (t: number | null | undefined) => (t ? new Date(t).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }) : '');
const stamp = (t: number | null | undefined) => (t ? new Date(t).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) : '');
const plusMonths = (t: number, m: number) => {
  const x = new Date(t);
  x.setMonth(x.getMonth() + m);
  return x.getTime();
};

async function exportCsv({ d, a, url }: Ctx) {
  needOffice(a);
  const what = url.searchParams.get('what');
  const people = new Map((await d.db.q(`SELECT id, name FROM people`)).map((r) => [r.id, r.name]));
  const units = new Map((await d.db.q(`SELECT id, label FROM units`)).map((r) => [r.id, r.label]));
  let rows: unknown[][];
  if (what === 'signoffs') {
    const r = await d.db.q(`SELECT s.*, v.title FROM signoffs s LEFT JOIN rule_versions v ON v.rule = s.rule AND v.version = s.version ORDER BY s.at`);
    rows = [['Signed (Pacific)', 'Person', 'Rule', 'Version'], ...r.map((x) => [stamp(x.at), people.get(x.person) ?? x.person, x.title ?? x.rule, x.version])];
  } else if (what === 'accidents') {
    const r = await d.db.q(`SELECT * FROM reports WHERE kind = 'Crash' ORDER BY at`);
    rows = [
      ['Date', 'Town or city', 'State', 'Driver', 'Unit', 'Treated away from scene', 'Deaths', 'Towed', 'Hazmat spilled', 'Police report', 'Copies filed', 'What happened', 'Keep until'],
      ...r.map((x) => [day(x.at), x.crash?.place, x.crash?.state, people.get(x.by) ?? x.by, units.get(x.unit) ?? x.unit, x.crash?.hurt, x.crash?.deaths, x.crash?.towed, x.crash?.hazmat ? 'Yes' : 'No', x.crash?.police, day(x.crash?.copies), x.text, day(plusMonths(x.at, 36))]),
    ];
  } else if (what === 'inspections') {
    const r = await d.db.q(`SELECT * FROM reports WHERE kind = 'Roadside inspection' ORDER BY at`);
    rows = [
      ['Date', 'Where', 'State', 'Driver', 'Unit', 'Result', 'Sign off by', 'Repairs signed off', 'What they found', 'Keep until'],
      ...r.map((x) => [day(x.at), x.roadside?.place, x.roadside?.state, people.get(x.by) ?? x.by, units.get(x.unit) ?? x.unit, x.roadside?.result, x.roadside?.result === 'No violations' ? '' : day(x.at + 15 * DAY), day(x.roadside?.certified), x.text, day(plusMonths(x.at, 12))]),
    ];
  } else if (what === 'reports') {
    const r = await d.db.q(`SELECT * FROM reports ORDER BY at`);
    rows = [['Sent (Pacific)', 'Unit', 'Kind', 'Urgent', 'Status', 'Driver', 'What they wrote'], ...r.map((x) => [stamp(x.at), units.get(x.unit) ?? x.unit, x.kind, x.urgent ? 'Yes' : 'No', x.status, people.get(x.by) ?? x.by, x.text])];
  } else return fail(400, 'Pick signoffs, accidents, inspections or reports.');
  await log(d, a, 'export', what);
  return new Response(csv(rows), {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="fx4-${what}-${new Date(d.now()).toISOString().slice(0, 10)}.csv"`, 'cache-control': 'no-store' },
  });
}

/* ---------- The handler ---------- */

export function missingConfig(env: Env) {
  const missing: string[] = [];
  if (!env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) missing.push('SESSION_SECRET');
  return missing;
}

export function createPortal(d: Deps) {
  let ready: Promise<void> | null = null;
  return async function handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const op = url.searchParams.get('op') ?? '';
    try {
      ready ??= migrate(d.db).catch((e) => {
        ready = null;
        throw e;
      });
      await ready;
      const a = await authOf(req, d);
      const c: Ctx = { req, d, a, url };
      if (req.method === 'GET') {
        if (op === 'state') {
          const session: Session = a.kind === 'office' ? { kind: 'office', email: a.email } : a.kind === 'driver' ? { kind: 'driver', person: a.person } : { kind: 'none' };
          const reply: StateReply = {
            mode: 'live',
            session,
            state: await stateFor(d, a),
            ready: { sms: !!d.sms, google: d.google ? (d.env.GOOGLE_CLIENT_ID ?? null) : null, photos: !!d.files, mail: !!d.mail },
          };
          return json(reply);
        }
        if (op === 'photo') return await photoView(c);
        if (op === 'export') return await exportCsv(c);
        return fail(404, 'Unknown request.');
      }
      if (req.method !== 'POST') return fail(405, 'Use GET or POST.');
      // Only the portal's own pages send this header; another site can't without the browser
      // asking first, and this server never says yes.
      if (req.headers.get('x-fx4-portal') !== '1') return fail(403, 'Not from the portal.');
      if (op === 'photo') return await photoUpload(c);
      const fn = POSTS[op] ?? fail(404, 'Unknown request.');
      const text = await req.text();
      if (text.length > 64_000) fail(413, 'That’s too much text.');
      let body: Body = {};
      try {
        body = text ? (JSON.parse(text) as Body) : {};
      } catch {
        fail(400, 'That request didn’t make sense.');
      }
      return await fn(c, body ?? {});
    } catch (e) {
      if (e instanceof Fail) return json({ error: e.message }, e.status);
      console.error('portal error', op, e);
      return json({ error: 'Something went wrong on our side. Try again in a minute, or call the office.' }, 500);
    }
  };
}

/* ---------- Wiring for Vercel ---------- */

function realDeps(env: Env): Deps {
  const sql = neon(env.DATABASE_URL!);
  const db: Db = { q: (text, params = []) => sql.query(text, params) as Promise<Row[]> };

  const sid = env.TWILIO_ACCOUNT_SID;
  const tok = env.TWILIO_AUTH_TOKEN;
  const svc = env.TWILIO_VERIFY_SID;
  const twilio = (path: string, form: Record<string, string>) =>
    fetch(`https://verify.twilio.com/v2/Services/${svc}/${path}`, {
      method: 'POST',
      headers: { authorization: `Basic ${btoa(`${sid}:${tok}`)}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form),
    });
  const sms: Deps['sms'] =
    sid && tok && svc
      ? {
          async send(to) {
            const r = await twilio('Verifications', { To: to, Channel: 'sms' });
            if (!r.ok) throw new Error(`Twilio ${r.status}`);
          },
          async check(to, code) {
            const r = await twilio('VerificationCheck', { To: to, Code: code });
            if (r.status === 404) return false; // expired, used, or never sent
            if (!r.ok) throw new Error(`Twilio ${r.status}`);
            return ((await r.json()) as { status?: string }).status === 'approved';
          },
        }
      : null;

  const clientId = env.GOOGLE_CLIENT_ID;
  const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
  const google: Deps['google'] =
    clientId && officeList(env).length
      ? {
          async verify(credential) {
            const { payload } = await jwtVerify(credential, jwks, { issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: clientId });
            return payload.email_verified === true && typeof payload.email === 'string' ? { email: payload.email } : null;
          },
        }
      : null;

  const files: Deps['files'] = env.BLOB_READ_WRITE_TOKEN
    ? {
        async put(path, body, type) {
          await blobPut(path, Buffer.from(body), { access: 'private', contentType: type, addRandomSuffix: false, token: env.BLOB_READ_WRITE_TOKEN });
        },
        async get(path) {
          const r = await blobGet(path, { access: 'private', token: env.BLOB_READ_WRITE_TOKEN });
          return r && r.statusCode === 200 ? { stream: r.stream, type: r.blob.contentType } : null;
        },
      }
    : null;

  const to = (env.ALERT_TO ?? '').split(/[,\s]+/).filter(Boolean);
  const mail: Deps['mail'] =
    env.RESEND_API_KEY && env.ALERT_FROM && to.length
      ? {
          async send(subject, text) {
            const r = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
              body: JSON.stringify({ from: env.ALERT_FROM, to, subject, text }),
            });
            if (!r.ok) throw new Error(`Resend ${r.status}`);
          },
        }
      : null;

  return { db, env, sms, google, files, mail, now: () => Date.now() };
}

let live: ((req: Request) => Promise<Response>) | null = null;

async function serve(req: Request) {
  const env = process.env as Env;
  const missing = missingConfig(env);
  if (missing.length) {
    const op = new URL(req.url).searchParams.get('op');
    const reply: StateReply = { mode: 'demo', missing };
    return op === 'state' && req.method === 'GET' ? json(reply) : json({ error: 'The portal isn’t switched on yet.' }, 503);
  }
  live ??= createPortal(realDeps(env));
  return live(req);
}

export const GET = serve;
export const POST = serve;
