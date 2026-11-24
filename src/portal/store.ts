// The portal's data layer. Every screen reads through usePortal() and saves through `actions`,
// so the screens don't care where the data lives:
//
// - Live: the shared database behind /api/portal (api/portal.ts). Drivers sign in once per
//   phone with a texted code; Daniel and David sign in to the office side with Google. A
//   driver's last copy is kept on the phone, so the screens still open with no signal.
// - Demo: when the server isn't switched on (no database yet, or `npm run dev`), everything is
//   saved in this browser only, with sample people and units, so Daniel can click through.
import { useSyncExternalStore } from 'react';
import { PEOPLE, RULES, UNITS } from './data';
import type { CrashInfo, LeavingStep, Person, Report, ReportStatus, Rule, Session, Signoff, State, StateReply, Unit } from './types';

export * from './types';

/* ---------- Demo data ---------- */

const KEY = 'fx4-portal-demo-v3';
const LIVE_KEY = 'fx4-portal-live-v1';
const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 10, 17, 0); // Nov 10, 2026, 9 am Pacific: the sample handbook's first version
const PHONE = 'this-phone'; // who "seen" and feedback belong to before a name is picked

function seed(): State {
  const versions = RULES.map((r) => ({ rule: r.id, version: 1, at: T0, note: 'First version' }));
  const sign = (person: string, rules: string[], at: number) => rules.map((rule) => ({ person, rule, version: 1, at }));
  const all = RULES.map((r) => r.id);
  return {
    v: 3,
    me: null,
    people: PEOPLE,
    units: UNITS,
    rules: RULES,
    listed: {},
    versions,
    signoffs: [...sign('d1', all, T0 + 3_600_000), ...sign('d2', all.slice(0, 3), T0 + 5_400_000), ...sign('d4', all, T0 + DAY)],
    reports: [
      { id: 'r1', unit: '203', kind: 'Defect', text: 'Right rear marker light is out.', urgent: false, by: 'd2', at: T0 + DAY + 7_200_000, status: 'Open', photos: 1, sample: true },
      { id: 'r2', unit: '101', kind: 'Defect', text: 'Air leak at the glad hands, can hear it hiss.', urgent: true, by: 'd1', at: T0 + 3_000_000, status: 'In the shop', photos: 2, sample: true },
      {
        id: 'r3', unit: '102', kind: 'Crash', text: 'Rear-ended a car at low speed in stop-and-go traffic. Its driver was fine; the car was towed.',
        urgent: true, by: 'd3', at: T0 + DAY + 10_800_000, status: 'Open', photos: 4, sample: true,
        crash: { place: 'Portland', state: 'OR', hurt: 0, deaths: 0, towed: 'Yes', hazmat: false, police: '' },
      },
      {
        id: 'r4', unit: '201', kind: 'Roadside inspection', text: 'Inspection at a port of entry. One violation: a clearance light out.',
        urgent: false, by: 'd1', at: T0 + 21_600_000, status: 'Open', photos: 1, sample: true,
        roadside: { place: 'I-84 port of entry', state: 'OR', result: 'Violations' },
      },
    ],
    leaving: {},
    posts: [
      {
        id: 'p1',
        title: 'Welcome to the FX4 team portal',
        body: 'Everything you need on the road is here: guides, the handbook, who to call. Lock codes still come from David by phone.',
        at: T0,
        by: 'daniel',
        sample: true,
      },
    ],
    seen: {},
    feedback: [{ guide: 'tandems', helped: false, by: 'd3', at: T0 + DAY + 9_000_000 }],
  };
}

function loadDemo(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      // Sample people, units and rules always come from data.ts unless the demo added some.
      if (s && s.v === 3) return { ...seed(), ...s, people: s.people?.length ? s.people : PEOPLE, units: s.units?.length ? s.units : UNITS, rules: s.rules?.length ? s.rules : RULES };
    }
  } catch {
    /* storage blocked: run in memory */
  }
  return seed();
}

/* ---------- Where we are: demo or live, who's signed in ---------- */

export type Mode = 'loading' | 'demo' | 'live';
export type Ready = { sms: boolean; google: string | null; photos: boolean; mail: boolean };
export type Meta = {
  mode: Mode;
  session: Session;
  ready: Ready;
  missing: string[]; // demo: what the server still needs to switch on
  offline: boolean; // live, but showing the copy saved on this phone
  savedAt: number | null; // when that copy was saved
  error: string | null;
};

const EMPTY: State = { v: 3, me: null, people: [], units: [], rules: [], listed: {}, versions: [], signoffs: [], reports: [], leaving: {}, posts: [], seen: {}, feedback: [] };
const NONE: Session = { kind: 'none' };

let state: State = EMPTY;
let meta: Meta = { mode: 'loading', session: NONE, ready: { sms: false, google: null, photos: false, mail: false }, missing: [], offline: false, savedAt: null, error: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const isLive = () => meta.mode === 'live';
const setMeta = (m: Partial<Meta>) => {
  meta = { ...meta, ...m };
  emit();
};

function set(next: State) {
  state = next;
  if (meta.mode === 'demo') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* memory only */
    }
  }
  emit();
}
const update = (fn: (s: State) => State) => set(fn(state));

// A driver's last copy, so guides, units, the team list and the rules open with no signal.
// The office side isn't kept on the device.
function keepCopy(session: Session, s: State) {
  try {
    if (session.kind === 'driver') window.localStorage.setItem(LIVE_KEY, JSON.stringify({ at: Date.now(), session, state: s }));
    else window.localStorage.removeItem(LIVE_KEY);
  } catch {
    /* fine: no copy */
  }
}
function savedCopy(): { at: number; session: Session; state: State } | null {
  try {
    const raw = window.localStorage.getItem(LIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyLive(r: Extract<StateReply, { mode: 'live' }>) {
  meta = { ...meta, mode: 'live', session: r.session, ready: r.ready, offline: false, savedAt: null };
  keepCopy(r.session, r.state);
  set(r.state);
}

let booting: Promise<void> | null = null;
// Called once when the portal opens: live if the server answers that it's switched on.
export function boot() {
  return (booting ??= (async () => {
    try {
      const r = await fetch('/api/portal?op=state', { credentials: 'same-origin', cache: 'no-store' });
      const j = (await r.json()) as StateReply;
      if (j.mode === 'live') return applyLive(j);
      meta = { ...meta, mode: 'demo', missing: j.missing ?? [] };
      set(loadDemo());
    } catch {
      const copy = savedCopy();
      if (copy) {
        meta = { ...meta, mode: 'live', session: copy.session, offline: true, savedAt: copy.at };
        set(copy.state);
      } else {
        // No server here (local dev) and nothing saved: the demo.
        meta = { ...meta, mode: 'demo' };
        set(loadDemo());
      }
    }
  })());
}

async function refresh() {
  try {
    const r = await fetch('/api/portal?op=state', { credentials: 'same-origin', cache: 'no-store' });
    const j = (await r.json()) as StateReply;
    if (j.mode === 'live') applyLive(j);
  } catch {
    setMeta({ offline: true });
  }
}
// Back online: fetch a fresh copy.
if (typeof window !== 'undefined') window.addEventListener('online', () => isLive() && refresh());

/* ---------- Talking to the server ---------- */

export type Result = { ok: true; id?: string; last2?: string } | { ok: false; error: string };

async function call(op: string, body: unknown = {}, query = ''): Promise<Result> {
  try {
    const r = await fetch(`/api/portal?op=${op}${query}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'x-fx4-portal': '1' },
      body: JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string; id?: string; last2?: string };
    if (!r.ok) return { ok: false, error: j.error ?? 'That didn’t save. Try again.' };
    return { ok: true, id: j.id, last2: j.last2 };
  } catch {
    return { ok: false, error: navigator.onLine === false ? 'No signal right now. Try again when you have signal, or call David.' : 'That didn’t reach the office. Try again in a minute.' };
  }
}

// Change the screen right away, then save on the server and fetch the result. If the save
// fails, the screen goes back to what the server has and shows why.
async function save(local: (s: State) => State, op: string, body: unknown): Promise<Result> {
  update(local);
  if (!isLive()) return { ok: true };
  const r = await call(op, body);
  if (!r.ok) setMeta({ error: r.error });
  await refresh();
  return r;
}

/* ---------- Report photos: shrunk on the phone before they're sent ---------- */

async function shrink(file: File, max = 1600): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return await new Promise<Blob>((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error('no blob'))), 'image/jpeg', 0.8));
  } catch {
    return file; // the server takes JPEG, PNG and WebP as they are
  }
}

async function sendPhoto(report: string, file: File) {
  const body = await shrink(file);
  const r = await fetch(`/api/portal?op=photo&report=${encodeURIComponent(report)}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': body.type || 'image/jpeg', 'x-fx4-portal': '1' },
    body,
  });
  return r.ok;
}

export const photoUrl = (photo: string) => `/api/portal?op=photo&id=${encodeURIComponent(photo)}`;
export const exportUrl = (what: 'signoffs' | 'accidents' | 'inspections' | 'reports') => `/api/portal?op=export&what=${what}`;

/* ---------- Hooks ---------- */

export function usePortal(): State {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}
export function useMeta(): Meta {
  return useSyncExternalStore(subscribe, () => meta, () => meta);
}

const uid = () => Math.random().toString(36).slice(2, 9);
export const viewer = (s: State) => (meta.session.kind === 'office' ? `office:${meta.session.email}` : (s.me ?? PHONE));

export type NewReport = Omit<Report, 'id' | 'at' | 'status' | 'photos' | 'by'>;
export type PersonInput = { id?: string; name: string; role: Person['role']; title: string; phone: string; listed: boolean; active: boolean };
export type UnitInput = Omit<Unit, 'kindLabel' | 'sample'> & { isNew?: boolean };

/* ---------- Actions ---------- */

export const actions = {
  /* Signing in */

  // Demo only: who's using this phone. Live, the server decides from the texted code.
  setMe: (person: string | null) => update((s) => ({ ...s, me: person, meAt: person ? Date.now() : null })),
  sendCode: (person: string) => call('code-send', { person }),
  async checkCode(person: string, code: string) {
    const r = await call('code-check', { person, code });
    if (r.ok) await refresh();
    return r;
  },
  async officeSignIn(credential: string) {
    const r = await call('office-signin', { credential });
    if (r.ok) await refresh();
    return r;
  },
  async signOut() {
    if (!isLive()) return void update((s) => ({ ...s, me: null, meAt: null }));
    await call('signout');
    keepCopy(NONE, EMPTY);
    await refresh();
  },
  clearError: () => setMeta({ error: null }),

  /* Drivers */

  sign: (person: string, rule: string) =>
    save((s) => ({ ...s, signoffs: [...s.signoffs, { person, rule, version: currentVersion(s, rule).version, at: Date.now() }] }), 'sign', { rule }),

  // Saves the report, then sends its photos one by one. Live, nothing shows as saved until the
  // server has it.
  async report(r: NewReport, files: File[] = []): Promise<Result & { photosFailed?: number }> {
    const by = state.me ?? '';
    if (!isLive()) {
      update((s) => ({ ...s, me: by, reports: [{ ...r, by, photos: files.length, id: uid(), at: Date.now(), status: 'Open' }, ...s.reports] }));
      return { ok: true };
    }
    const res = await call('report', r);
    if (!res.ok) return res;
    let failed = 0;
    for (const f of files.slice(0, 6)) if (!(await sendPhoto(res.id!, f).catch(() => false))) failed++;
    await refresh();
    return { ...res, photosFailed: failed };
  },

  seen: (ids: string[]) => {
    const who = viewer(state);
    const had = state.seen[who] ?? [];
    if (!ids.length || ids.every((id) => had.includes(id))) return;
    const local = (s: State) => ({ ...s, seen: { ...s.seen, [who]: [...new Set([...had, ...ids])] } });
    if (meta.session.kind === 'none') return update(local); // not signed in: remembered on this phone only
    void save(local, 'seen', { ids });
  },
  feedback: (guide: string, helped: boolean) => {
    const by = viewer(state);
    const local = (s: State) => ({ ...s, feedback: [...s.feedback.filter((f) => !(f.guide === guide && f.by === by)), { guide, helped, by, at: Date.now() }] });
    if (isLive() && meta.session.kind === 'none') return Promise.resolve(update(local)).then((): Result => ({ ok: true }));
    return save(local, 'feedback', { guide, helped });
  },

  /* The office */

  publish: (rule: string, note: string) => {
    const r = state.rules.find((x) => x.id === rule)!;
    return actions.saveRule({ rule, title: r.title, points: r.points, note });
  },
  saveRule: ({ rule, title, points, note }: { rule?: string; title: string; points: string[]; note: string }) =>
    save(
      (s) => {
        const id = rule ?? `rule-${uid()}`;
        const version = rule ? currentVersion(s, id).version + 1 : 1;
        const rules = rule ? s.rules.map((x) => (x.id === id ? { id, title, points } : x)) : [...s.rules, { id, title, points }];
        return { ...s, rules, versions: [...s.versions, { rule: id, version, at: Date.now(), note: note || 'First version' }] };
      },
      'rule-save',
      { rule, title, points, note },
    ),
  setStatus: (id: string, status: ReportStatus) => save((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, status } : r)) }), 'status', { id, status }),
  // Office: police and insurer report copies filed (crash), repairs certified (roadside). Tap again to undo.
  copiesFiled: (id: string) =>
    save((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id && r.crash ? { ...r, crash: { ...r.crash, copies: r.crash.copies ? undefined : Date.now() } } : r)) }), 'copies', { id }),
  certify: (id: string) =>
    save(
      (s) => ({ ...s, reports: s.reports.map((r) => (r.id === id && r.roadside ? { ...r, roadside: { ...r.roadside, certified: r.roadside.certified ? undefined : Date.now() } } : r)) }),
      'certify',
      { id },
    ),
  setListed: (person: string, listed: boolean) =>
    save((s) => ({ ...s, listed: { ...s.listed, [person]: listed }, people: s.people.map((p) => (p.id === person ? { ...p, listed } : p)) }), 'listed', { person, listed }),
  tick: (person: string, step: LeavingStep) =>
    save(
      (s) => {
        const cur = { ...(s.leaving[person] ?? {}) };
        if (cur[step]) delete cur[step];
        else cur[step] = Date.now();
        return { ...s, leaving: { ...s.leaving, [person]: cur } };
      },
      'tick',
      { person, step },
    ),
  post: (by: string, title: string, body: string) => save((s) => ({ ...s, posts: [{ id: uid(), title, body, at: Date.now(), by }, ...s.posts] }), 'post', { title, body }),
  savePerson: (p: PersonInput) =>
    save(
      (s) => {
        const digits = p.phone.replace(/\D/g, '').slice(-10);
        const phone = digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : undefined;
        const next: Person = { id: p.id ?? `p-${uid()}`, name: p.name, role: p.role, title: p.title, phone, tel: phone ? `tel:+1${digits}` : undefined, listed: p.listed && !!phone, active: p.active };
        return { ...s, people: p.id ? s.people.map((x) => (x.id === p.id ? { ...x, ...next, sample: x.sample } : x)) : [...s.people, next] };
      },
      'person-save',
      p,
    ),
  phoneOff: (person: string) => save((s) => ({ ...s, devices: (s.devices ?? []).filter((d) => d.person !== person) }), 'phone-off', { person }),
  saveUnit: (u: UnitInput) =>
    save(
      (s) => {
        const next: Unit = { ...u, kindLabel: kindLabelOf(u.kind) };
        return { ...s, units: s.units.some((x) => x.id === u.id) ? s.units.map((x) => (x.id === u.id ? { ...next, sample: x.sample } : x)) : [...s.units, next] };
      },
      'unit-save',
      u,
    ),

  // Demo only.
  reset: () => set({ ...seed(), me: state.me, meAt: state.meAt }),
};

/* ---------- Reading the state ---------- */

export const kindLabelOf = (k: Unit['kind']) => ({ truck: 'Tractor', flatbed: 'Flatbed', stepdeck: 'Step deck', dryvan: 'Dry van' })[k];
export const personOf = (s: State, id?: string | null) => (id ? s.people.find((p) => p.id === id) : undefined);
export const unitOf = (s: State, id?: string) => (id ? s.units.find((u) => u.id === id) : undefined);
// Who wrote an announcement or made a change: a person, or the office.
export const nameOf = (s: State, id: string) => personOf(s, id)?.name ?? (id === 'office' || id.startsWith('office:') ? 'FX4 office' : id === 'daniel' ? 'Daniel' : 'Someone who left');

export const isListed = (s: State, person: string) => s.listed[person] ?? personOf(s, person)?.listed ?? false;

export const currentVersion = (s: State, rule: string) =>
  s.versions.filter((v) => v.rule === rule).reduce((a, b) => (b.version > a.version ? b : a), { rule, version: 0, at: 0, note: '' });

export const lastSignoff = (s: State, person: string, rule: string) =>
  s.signoffs.filter((x) => x.person === person && x.rule === rule).reduce<Signoff | undefined>((a, b) => (!a || b.version > a.version ? b : a), undefined);

export const toSign = (s: State, person: string): Rule[] => s.rules.filter((r) => (lastSignoff(s, person, r.id)?.version ?? 0) < currentVersion(s, r.id).version);

// 49 CFR 390.5: an accident is a death, an injury treated away from the scene, or a vehicle
// towed away. Only those go on the register; "Not sure" about a tow means the office checks.
export const dotAccident = (c: CrashInfo): 'Yes' | 'No' | 'Check' =>
  c.deaths > 0 || c.hurt > 0 || c.towed === 'Yes' ? 'Yes' : c.towed === 'Not sure' ? 'Check' : 'No';
export const DAY_MS = DAY;

// The least time FX4 must keep each kind of record. Nothing in the portal is ever deleted;
// this is the earliest date a record could be cleared out.
// Crashes: the accident register, 3 years (49 CFR 390.15(b)). Roadside inspections: 12 months
// (396.9(d)). Everyday problem reports work like the daily inspection report: 3 months (396.11).
export function keepUntil(r: Pick<Report, 'kind' | 'at'>) {
  const months = r.kind === 'Crash' ? 36 : r.kind === 'Roadside inspection' ? 12 : 3;
  const d = new Date(r.at);
  d.setMonth(d.getMonth() + months);
  return { at: d.getTime(), why: r.kind === 'Crash' ? '3 years (49 CFR 390.15)' : r.kind === 'Roadside inspection' ? '12 months (49 CFR 396.9(d))' : '3 months, like a daily inspection report (49 CFR 396.11)' };
}

export const unseenPosts = (s: State) => s.posts.filter((p) => !(s.seen[viewer(s)] ?? []).includes(p.id));

const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
const fmtDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
export const when = (t: number) => fmt.format(t);
export const whenDay = (t: number) => fmtDay.format(t);
