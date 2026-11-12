// Demo state for the team portal. Everything lives in this browser only (localStorage), so
// Daniel can click through sign-offs, reports and the office side, then reset.
//
// The portal is one blanket portal for the whole team: no accounts, no logins. Anyone with
// the link or a sticker scan gets in. `me` is just the name picked on this phone, so rule
// signatures and reports carry a name; it isn't a login and isn't verified. The real
// version keeps this in a shared database instead of the browser.
import { useSyncExternalStore } from 'react';
import { PEOPLE, RULES } from './data';

export type ReportKind = 'Defect' | 'Damage' | 'Crash' | 'Breakdown' | 'Roadside inspection' | 'Other';
export const REPORT_KINDS: ReportKind[] = ['Defect', 'Damage', 'Crash', 'Breakdown', 'Roadside inspection', 'Other'];
export type ReportStatus = 'Open' | 'In the shop' | 'Fixed';
export const REPORT_STATUSES: ReportStatus[] = ['Open', 'In the shop', 'Fixed'];

// A crash report carries what FX4's accident register needs (49 CFR 390.15); `copies` = the
// office has filed the police and insurer reports. A roadside inspection carries its result;
// `certified` = the office signed off the repairs (due within 15 days, 49 CFR 396.9(d)).
export type Towed = 'Yes' | 'No' | 'Not sure';
export type CrashInfo = { place: string; state: string; hurt: number; deaths: number; towed: Towed; hazmat: boolean; police: string; copies?: number };
export type InspectionResult = 'No violations' | 'Violations' | 'Out of service';
export const INSPECTION_RESULTS: InspectionResult[] = ['No violations', 'Violations', 'Out of service'];
export type RoadsideInfo = { place: string; state: string; result: InspectionResult; certified?: number };

export type Report = {
  id: string;
  unit: string;
  kind: ReportKind;
  text: string;
  urgent: boolean;
  by: string;
  at: number;
  status: ReportStatus;
  photos: number;
  sample?: boolean;
  crash?: CrashInfo;
  roadside?: RoadsideInfo;
};
export type Signoff = { person: string; rule: string; version: number; at: number };
export type RuleVersion = { rule: string; version: number; at: number; note: string };
export type LeavingStep = 'codes' | 'keys' | 'fuel' | 'files';
export type Post = { id: string; title: string; body: string; at: number; by: string; sample?: boolean };
export type Feedback = { guide: string; helped: boolean; by: string; at: number };

export type State = {
  v: 3;
  me: string | null; // name picked on this phone (a person id), not a login
  listed: Record<string, boolean>; // office overrides: show this person's number on the Team page
  versions: RuleVersion[];
  signoffs: Signoff[];
  reports: Report[];
  leaving: Record<string, Partial<Record<LeavingStep, number>>>;
  posts: Post[];
  seen: Record<string, string[]>;
  feedback: Feedback[];
};

const KEY = 'fx4-portal-demo-v3';
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

function load(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s && s.v === 3) return { ...seed(), ...s };
    }
  } catch {
    /* storage blocked: run in memory */
  }
  return seed();
}

let state: State | null = null;
const listeners = new Set<() => void>();
const get = () => (state ??= load());

function set(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* memory only */
  }
  listeners.forEach((l) => l());
}
const update = (fn: (s: State) => State) => set(fn(get()));

const SERVER = seed();
export function usePortal(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    get,
    () => SERVER,
  );
}

const uid = () => Math.random().toString(36).slice(2, 9);
export const viewer = (s: State) => s.me ?? PHONE;

export const actions = {
  setMe: (person: string | null) => update((s) => ({ ...s, me: person })),
  sign: (person: string, rule: string) =>
    update((s) => ({ ...s, me: person, signoffs: [...s.signoffs, { person, rule, version: currentVersion(s, rule).version, at: Date.now() }] })),
  publish: (rule: string, note: string) =>
    update((s) => ({ ...s, versions: [...s.versions, { rule, version: currentVersion(s, rule).version + 1, at: Date.now(), note }] })),
  report: (r: Omit<Report, 'id' | 'at' | 'status'>) =>
    update((s) => ({ ...s, me: r.by, reports: [{ ...r, id: uid(), at: Date.now(), status: 'Open' }, ...s.reports] })),
  setStatus: (id: string, status: ReportStatus) => update((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, status } : r)) })),
  // Office: police and insurer report copies filed (crash), repairs certified (roadside). Tap again to undo.
  copiesFiled: (id: string) =>
    update((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id && r.crash ? { ...r, crash: { ...r.crash, copies: r.crash.copies ? undefined : Date.now() } } : r)) })),
  certify: (id: string) =>
    update((s) => ({
      ...s,
      reports: s.reports.map((r) => (r.id === id && r.roadside ? { ...r, roadside: { ...r.roadside, certified: r.roadside.certified ? undefined : Date.now() } } : r)),
    })),
  setListed: (person: string, listed: boolean) => update((s) => ({ ...s, listed: { ...s.listed, [person]: listed } })),
  tick: (person: string, step: LeavingStep) =>
    update((s) => {
      const cur = { ...(s.leaving[person] ?? {}) };
      if (cur[step]) delete cur[step];
      else cur[step] = Date.now();
      return { ...s, leaving: { ...s.leaving, [person]: cur } };
    }),
  post: (by: string, title: string, body: string) => update((s) => ({ ...s, posts: [{ id: uid(), title, body, at: Date.now(), by }, ...s.posts] })),
  seen: (ids: string[]) =>
    update((s) => {
      const who = viewer(s);
      const had = s.seen[who] ?? [];
      if (ids.every((id) => had.includes(id))) return s;
      return { ...s, seen: { ...s.seen, [who]: [...new Set([...had, ...ids])] } };
    }),
  feedback: (guide: string, helped: boolean) =>
    update((s) => {
      const by = viewer(s);
      return { ...s, feedback: [...s.feedback.filter((f) => !(f.guide === guide && f.by === by)), { guide, helped, by, at: Date.now() }] };
    }),
  reset: () => set({ ...seed(), me: get().me }),
};

export const isListed = (s: State, person: string) => s.listed[person] ?? PEOPLE.find((p) => p.id === person)?.listed ?? false;

export const currentVersion = (s: State, rule: string) =>
  s.versions.filter((v) => v.rule === rule).reduce((a, b) => (b.version > a.version ? b : a));

export const lastSignoff = (s: State, person: string, rule: string) =>
  s.signoffs.filter((x) => x.person === person && x.rule === rule).reduce<Signoff | undefined>((a, b) => (!a || b.version > a.version ? b : a), undefined);

export const toSign = (s: State, person: string) =>
  RULES.filter((r) => (lastSignoff(s, person, r.id)?.version ?? 0) < currentVersion(s, r.id).version);

// 49 CFR 390.5: an accident is a death, an injury treated away from the scene, or a vehicle
// towed away. Only those go on the register; "Not sure" about a tow means the office checks.
export const dotAccident = (c: CrashInfo): 'Yes' | 'No' | 'Check' =>
  c.deaths > 0 || c.hurt > 0 || c.towed === 'Yes' ? 'Yes' : c.towed === 'Not sure' ? 'Check' : 'No';
export const DAY_MS = DAY;

export const unseenPosts = (s: State) => s.posts.filter((p) => !(s.seen[viewer(s)] ?? []).includes(p.id));

const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
const fmtDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
export const when = (t: number) => fmt.format(t);
export const whenDay = (t: number) => fmtDay.format(t);
