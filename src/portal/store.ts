// Demo state for the team portal. Everything lives in this browser only (localStorage), so
// Daniel can click through sign-offs, reports and switching a driver off, then reset.
// The real portal keeps this in a database behind each person's one-time-code sign-in.
import { useSyncExternalStore } from 'react';
import { RULES } from './data';

export type ReportKind = 'Defect' | 'Damage' | 'Crash' | 'Breakdown' | 'Inspection' | 'Other';
export const REPORT_KINDS: ReportKind[] = ['Defect', 'Damage', 'Crash', 'Breakdown', 'Inspection', 'Other'];
export type ReportStatus = 'Open' | 'In the shop' | 'Fixed';
export const REPORT_STATUSES: ReportStatus[] = ['Open', 'In the shop', 'Fixed'];

export type Report = { id: string; unit: string; kind: ReportKind; text: string; urgent: boolean; by: string; at: number; status: ReportStatus; photos: number; sample?: boolean };
export type Signoff = { person: string; rule: string; version: number; at: number };
export type RuleVersion = { rule: string; version: number; at: number; note: string };
export type LeavingStep = 'access' | 'codes' | 'keys' | 'fuel' | 'files';
export type Post = { id: string; title: string; body: string; at: number; by: string; sample?: boolean };
export type Feedback = { guide: string; helped: boolean; by: string; at: number };

export type State = {
  v: 1;
  me: string | null;
  off: Record<string, number>;
  versions: RuleVersion[];
  signoffs: Signoff[];
  reports: Report[];
  leaving: Record<string, Partial<Record<LeavingStep, number>>>;
  posts: Post[];
  seen: Record<string, string[]>;
  feedback: Feedback[];
};

const KEY = 'fx4-portal-demo-v1';
const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 10, 17, 0); // Nov 10, 2026, 9 am Pacific: the sample handbook's first version

function seed(): State {
  const versions = RULES.map((r) => ({ rule: r.id, version: 1, at: T0, note: 'First version' }));
  const sign = (person: string, rules: string[], at: number) => rules.map((rule) => ({ person, rule, version: 1, at }));
  const all = RULES.map((r) => r.id);
  return {
    v: 1,
    me: null,
    off: {},
    versions,
    signoffs: [...sign('d1', all, T0 + 3_600_000), ...sign('d2', all.slice(0, 3), T0 + 5_400_000), ...sign('d4', all, T0 + DAY)],
    reports: [
      { id: 'r1', unit: '203', kind: 'Defect', text: 'Right rear marker light is out.', urgent: false, by: 'd2', at: T0 + DAY + 7_200_000, status: 'Open', photos: 1, sample: true },
      { id: 'r2', unit: '101', kind: 'Defect', text: 'Air leak at the glad hands, can hear it hiss.', urgent: true, by: 'd1', at: T0 + 3_000_000, status: 'In the shop', photos: 2, sample: true },
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
      if (s && s.v === 1) return { ...seed(), ...s };
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

export const actions = {
  signIn: (person: string) => update((s) => ({ ...s, me: person })),
  signOut: () => update((s) => ({ ...s, me: null })),
  sign: (person: string, rule: string) =>
    update((s) => ({ ...s, signoffs: [...s.signoffs, { person, rule, version: currentVersion(s, rule).version, at: Date.now() }] })),
  publish: (rule: string, note: string) =>
    update((s) => ({ ...s, versions: [...s.versions, { rule, version: currentVersion(s, rule).version + 1, at: Date.now(), note }] })),
  report: (r: Omit<Report, 'id' | 'at' | 'status'>) =>
    update((s) => ({ ...s, reports: [{ ...r, id: uid(), at: Date.now(), status: 'Open' }, ...s.reports] })),
  setStatus: (id: string, status: ReportStatus) => update((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, status } : r)) })),
  setOff: (person: string, off: boolean) =>
    update((s) => {
      const next = { ...s.off };
      if (off) next[person] = Date.now();
      else delete next[person];
      return { ...s, off: next };
    }),
  tick: (person: string, step: LeavingStep) =>
    update((s) => {
      const cur = { ...(s.leaving[person] ?? {}) };
      if (cur[step]) delete cur[step];
      else cur[step] = Date.now();
      return { ...s, leaving: { ...s.leaving, [person]: cur } };
    }),
  post: (by: string, title: string, body: string) => update((s) => ({ ...s, posts: [{ id: uid(), title, body, at: Date.now(), by }, ...s.posts] })),
  seen: (person: string, ids: string[]) =>
    update((s) => {
      const had = s.seen[person] ?? [];
      if (ids.every((id) => had.includes(id))) return s;
      return { ...s, seen: { ...s.seen, [person]: [...new Set([...had, ...ids])] } };
    }),
  feedback: (guide: string, helped: boolean) =>
    update((s) => (s.me ? { ...s, feedback: [...s.feedback.filter((f) => !(f.guide === guide && f.by === s.me)), { guide, helped, by: s.me, at: Date.now() }] } : s)),
  reset: () => set({ ...seed(), me: get().me }),
};

export const currentVersion = (s: State, rule: string) =>
  s.versions.filter((v) => v.rule === rule).reduce((a, b) => (b.version > a.version ? b : a));

export const lastSignoff = (s: State, person: string, rule: string) =>
  s.signoffs.filter((x) => x.person === person && x.rule === rule).reduce<Signoff | undefined>((a, b) => (!a || b.version > a.version ? b : a), undefined);

export const toSign = (s: State, person: string) =>
  RULES.filter((r) => (lastSignoff(s, person, r.id)?.version ?? 0) < currentVersion(s, r.id).version);

export const unseenPosts = (s: State, person: string) => s.posts.filter((p) => !(s.seen[person] ?? []).includes(p.id));

const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
const fmtDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
export const when = (t: number) => fmt.format(t);
export const whenDay = (t: number) => fmtDay.format(t);
