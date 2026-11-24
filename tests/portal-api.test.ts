// The portal server against a real Postgres (PGlite, in memory), with fake text codes, Google
// sign-in, photo storage and email. Run: npm test
import { PGlite } from '@electric-sql/pglite';
import { beforeEach, describe, expect, it } from 'vitest';
import { createPortal, e164, looksLikeACode, missingConfig, type Deps } from '../api/portal';
import type { State, StateReply } from '../src/portal/types';

const SECRET = 'x'.repeat(40);
let now = Date.UTC(2026, 10, 24, 17, 0);
let handle: (r: Request) => Promise<Response>;
let texts: string[];
let mails: { subject: string; text: string }[];
let files: Map<string, { body: ArrayBuffer; type: string }>;

beforeEach(async () => {
  const pg = new PGlite();
  texts = [];
  mails = [];
  files = new Map();
  const deps: Deps = {
    db: { q: async (text, params = []) => (await pg.query(text, params as unknown[])).rows as Record<string, unknown>[] },
    env: { SESSION_SECRET: SECRET, OFFICE_EMAILS: 'daniel@fx4logistics.com, David@fx4logistics.com', GOOGLE_CLIENT_ID: 'test' },
    sms: { send: async (to) => void texts.push(to), check: async (_to, code) => code === '123456' },
    google: { verify: async (c) => (c.startsWith('ok:') ? { email: c.slice(3) } : null) },
    files: {
      put: async (path, body, type) => void files.set(path, { body, type }),
      get: async (path) => {
        const f = files.get(path);
        return f ? { stream: new Blob([f.body]).stream(), type: f.type } : null;
      },
    },
    mail: { send: async (subject, text) => void mails.push({ subject, text }) },
    now: () => now,
  };
  handle = createPortal(deps);
});

const cookieOf = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0];
async function post(op: string, body: unknown, cookie = '', headers: Record<string, string> = { 'x-fx4-portal': '1', 'content-type': 'application/json' }) {
  return handle(new Request(`https://www.fx4logistics.com/api/portal?op=${op}`, { method: 'POST', headers: { ...headers, cookie }, body: JSON.stringify(body) }));
}
async function get(query: string, cookie = '') {
  return handle(new Request(`https://www.fx4logistics.com/api/portal?${query}`, { headers: { cookie } }));
}
async function state(cookie = '') {
  const r = await get('op=state', cookie);
  expect(r.status).toBe(200);
  return (await r.json()) as Extract<StateReply, { mode: 'live' }>;
}
async function office(email = 'daniel@fx4logistics.com') {
  const r = await post('office-signin', { credential: `ok:${email}` });
  expect(r.status).toBe(200);
  return cookieOf(r);
}
async function addDriver(o: string, name = 'Sam Driver', phone = '(503) 555-0101', listed = false) {
  const r = await post('person-save', { name, role: 'driver', title: 'Class A driver', phone, listed }, o);
  expect(r.status).toBe(200);
  return ((await r.json()) as { id: string }).id;
}
async function driver(person: string) {
  expect((await post('code-send', { person })).status).toBe(200);
  const r = await post('code-check', { person, code: '123456' });
  expect(r.status).toBe(200);
  return cookieOf(r);
}
async function addUnit(o: string, id = '101', kind = 'truck') {
  const r = await post('unit-save', { id, isNew: true, label: `Truck ${id}`, kind, lock: { what: 'Truck keys', how: 'Ask David where the keys are.' }, guides: ['pre-trip'], specs: [{ k: 'Plate' }] }, o);
  expect(r.status).toBe(200);
}

describe('switching on', () => {
  it('stays the demo until the database and session secret are set', () => {
    expect(missingConfig({})).toEqual(['DATABASE_URL', 'SESSION_SECRET']);
    expect(missingConfig({ DATABASE_URL: 'postgres://x', SESSION_SECRET: 'short' })).toEqual(['SESSION_SECRET']);
    expect(missingConfig({ DATABASE_URL: 'postgres://x', SESSION_SECRET: SECRET })).toEqual([]);
  });
  it('normalizes US cell numbers', () => {
    expect(e164('(503) 555-0101')).toBe('+15035550101');
    expect(e164('1 503 555 0101')).toBe('+15035550101');
    expect(() => e164('555-0101')).toThrow();
  });
});

describe('office sign-in', () => {
  it('lets in only the office list', async () => {
    expect((await post('office-signin', { credential: 'ok:david@fx4logistics.com' })).status).toBe(200);
    expect((await post('office-signin', { credential: 'ok:someone@gmail.com' })).status).toBe(403);
    expect((await post('office-signin', { credential: 'bad' })).status).toBe(401);
    const s = await state(await office());
    expect(s.session).toEqual({ kind: 'office', email: 'daniel@fx4logistics.com' });
  });
  it('refuses requests without the portal header', async () => {
    const o = await office();
    expect((await post('post', { title: 'Hi' }, o, { 'content-type': 'application/json' })).status).toBe(403);
  });
});

describe('driver sign-in', () => {
  it('texts a code, checks it and remembers the phone', async () => {
    const o = await office();
    const sam = await addDriver(o);
    const open = await state();
    expect(open.session.kind).toBe('none');
    expect(open.state.people).toEqual([{ id: sam, name: 'Sam Driver', role: 'driver', title: 'Class A driver', listed: false, last2: '01' }]);
    expect(open.state.units).toEqual([]);

    expect((await post('code-send', { person: sam })).status).toBe(200);
    expect(texts).toEqual(['+15035550101']);
    expect((await post('code-check', { person: sam, code: '000000' })).status).toBe(400);
    const c = cookieOf(await post('code-check', { person: sam, code: '123456' }));
    expect(c).toMatch(/^__Host-fx4p=/);
    const s = await state(c);
    expect(s.session).toEqual({ kind: 'driver', person: sam });
    expect(s.state.me).toBe(sam);
  });
  it('limits how many codes go to one name', async () => {
    const sam = await addDriver(await office());
    for (let i = 0; i < 3; i++) expect((await post('code-send', { person: sam })).status).toBe(200);
    expect((await post('code-send', { person: sam })).status).toBe(429);
    now += 16 * 60_000;
    expect((await post('code-send', { person: sam })).status).toBe(200);
  });
  it('switching a phone off signs it out', async () => {
    const o = await office();
    const sam = await addDriver(o);
    const c = await driver(sam);
    expect((await state(o)).state.devices).toHaveLength(1);
    expect((await post('phone-off', { person: sam }, o)).status).toBe(200);
    expect((await state(c)).session.kind).toBe('none');
  });
  it('leaving FX4 switches off their phones, and they drop off the sign-in list', async () => {
    const o = await office();
    const sam = await addDriver(o);
    const c = await driver(sam);
    expect((await post('person-save', { id: sam, name: 'Sam Driver', role: 'driver', title: '', phone: '(503) 555-0101', active: false }, o)).status).toBe(200);
    expect((await state(c)).session.kind).toBe('none');
    expect((await state()).state.people).toEqual([]);
    expect((await state(o)).state.people[0].active).toBe(false);
  });
});

describe('what each side may do', () => {
  it('keeps office actions with the office', async () => {
    const o = await office();
    const sam = await addDriver(o);
    const c = await driver(sam);
    await addUnit(o);
    for (const [op, body] of [
      ['post', { title: 'Hi' }],
      ['person-save', { name: 'X', role: 'driver' }],
      ['phone-off', { person: sam }],
      ['rule-save', { title: 'T', points: ['p'] }],
    ] as const)
      expect((await post(op, body, c)).status).toBe(403);
    expect((await post('report', { unit: '101', kind: 'Defect', text: 'Marker light out' })).status).toBe(401);
    expect((await get('op=export&what=reports', c)).status).toBe(403);
  });
  it('shows drivers only listed numbers, open everyday problems and their own records', async () => {
    const o = await office();
    const sam = await addDriver(o, 'Sam Driver', '(503) 555-0101', true);
    const lee = await addDriver(o, 'Lee Driver', '(503) 555-0102', false);
    await addUnit(o);
    const cs = await driver(sam);
    const cl = await driver(lee);
    await post('report', { unit: '101', kind: 'Defect', text: 'Right rear marker light is out.' }, cl);
    await post('report', { unit: '101', kind: 'Crash', text: 'Backed into a post.', crash: { place: 'Gresham', state: 'or', hurt: 0, deaths: 0, towed: 'No', hazmat: false, police: '' } }, cl);
    const s = (await state(cs)).state;
    expect(s.people.find((p) => p.id === sam)?.phone).toBe('(503) 555-0101');
    expect(s.people.find((p) => p.id === lee)?.phone).toBeUndefined();
    expect(s.reports.map((r) => r.kind)).toEqual(['Defect']);
    expect(s.reports[0].photoIds).toBeUndefined();
    const mine = (await state(cl)).state;
    expect(mine.reports.map((r) => r.kind).sort()).toEqual(['Crash', 'Defect']);
    expect(mine.reports.find((r) => r.kind === 'Crash')?.crash?.state).toBe('OR');
  });
});

describe('reports, photos and alerts', () => {
  it('saves a report, its photos and emails the office for urgent ones', async () => {
    const o = await office();
    const sam = await addDriver(o);
    const lee = await addDriver(o, 'Lee Driver', '(503) 555-0102');
    await addUnit(o);
    const c = await driver(sam);
    expect((await post('report', { unit: '101', kind: 'Defect', text: 'ok' }, c)).status).toBe(400);
    const r = await post('report', { unit: '101', kind: 'Defect', text: 'Air leak at the glad hands.', urgent: true }, c);
    expect(r.status).toBe(200);
    const { id } = (await r.json()) as { id: string };
    expect(mails).toHaveLength(1);
    expect(mails[0].subject).toContain('Urgent');
    expect(mails[0].text).toContain('Sam Driver');

    const up = await handle(new Request(`https://www.fx4logistics.com/api/portal?op=photo&report=${id}`, { method: 'POST', headers: { cookie: c, 'x-fx4-portal': '1', 'content-type': 'image/jpeg' }, body: new Uint8Array([1, 2, 3]) }));
    expect(up.status).toBe(200);
    const photo = ((await up.json()) as { id: string }).id;
    expect((await state(c)).state.reports[0].photoIds).toEqual([photo]);
    expect((await get(`op=photo&id=${photo}`, c)).status).toBe(200);
    expect((await get(`op=photo&id=${photo}`, await driver(lee))).status).toBe(403);
    const view = await get(`op=photo&id=${photo}`, o);
    expect(view.headers.get('content-type')).toBe('image/jpeg');
    expect(new Uint8Array(await view.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));

    expect((await post('status', { id, status: 'In the shop' }, o)).status).toBe(200);
    expect((await state(o)).state.reports[0].status).toBe('In the shop');
    now += 2 * 86_400_000;
    const late = await handle(new Request(`https://www.fx4logistics.com/api/portal?op=photo&report=${id}`, { method: 'POST', headers: { cookie: c, 'x-fx4-portal': '1', 'content-type': 'image/jpeg' }, body: new Uint8Array([4]) }));
    expect(late.status).toBe(403);
  });
  it('keeps the crash register and inspection sign-off fields', async () => {
    const o = await office();
    const sam = await addDriver(o);
    await addUnit(o);
    const c = await driver(sam);
    const bad = await post('report', { unit: '101', kind: 'Roadside inspection', text: 'One violation.', roadside: { place: 'Port of entry', state: 'OR' } }, c);
    expect(bad.status).toBe(400);
    const r = await post('report', { unit: '101', kind: 'Roadside inspection', text: 'One violation.', roadside: { place: 'Port of entry', state: 'OR', result: 'Violations' } }, c);
    const { id } = (await r.json()) as { id: string };
    expect((await post('certify', { id }, o)).status).toBe(200);
    expect((await state(o)).state.reports[0].roadside?.certified).toBe(now);
    const csv = await (await get('op=export&what=inspections', o)).text();
    expect(csv.split('\r\n')[0]).toContain('Repairs signed off');
    expect(csv).toContain('Port of entry');
  });
  it('keeps spreadsheet formulas out of exports', async () => {
    const o = await office();
    const sam = await addDriver(o);
    await addUnit(o);
    await post('report', { unit: '101', kind: 'Other', text: '=HYPERLINK("x")' }, await driver(sam));
    const csv = await (await get('op=export&what=reports', o)).text();
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});

describe('rules and sign-offs', () => {
  it('a new version means everyone signs again', async () => {
    const o = await office();
    const sam = await addDriver(o);
    const c = await driver(sam);
    const r = await post('rule-save', { title: 'Lock codes and keys', points: ['Codes come by phone.'] }, o);
    const { rule } = (await r.json()) as { rule: string };
    expect((await post('sign', { rule }, c)).status).toBe(200);
    expect((await post('sign', { rule }, c)).status).toBe(200); // signing twice keeps one signature
    let s: State = (await state(c)).state;
    expect(s.signoffs).toHaveLength(1);
    expect((await post('rule-save', { rule, title: 'Lock codes and keys', points: ['Codes come by phone.', 'Never text a code.'] }, o)).status).toBe(400); // needs a note
    expect((await post('rule-save', { rule, title: 'Lock codes and keys', points: ['Codes come by phone.', 'Never text a code.'], note: 'Added: never text a code' }, o)).status).toBe(200);
    s = (await state(c)).state;
    expect(s.rules[0].points).toHaveLength(2);
    expect(s.versions.map((v) => v.version)).toEqual([1, 2]);
    expect(s.signoffs.map((x) => x.version)).toEqual([1]);
  });
});

describe('units', () => {
  it('refuses a lock code in a unit’s lock note, but not a phone number', async () => {
    expect(looksLikeACode('Padlock. The code is 4521.')).toBe(true);
    expect(looksLikeACode('Call David at (503) 555-0101 for the code.')).toBe(false);
    const o = await office();
    const r = await post('unit-save', { id: '203', label: 'Dry van 203', kind: 'dryvan', lock: { what: 'Padlock', how: 'Combo 4521' }, guides: [], specs: [] }, o);
    expect(r.status).toBe(400);
  });
});
