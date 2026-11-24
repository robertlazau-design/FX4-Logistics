// The team portal's shapes, shared by the screens (src/portal) and the server (api/portal.ts).
// Types only: nothing here runs, so the server can import it without pulling in the site.

export type Role = 'driver' | 'dispatch' | 'owner';
export const ROLES: Role[] = ['driver', 'dispatch', 'owner'];

export type Person = {
  id: string;
  name: string;
  role: Role;
  title: string;
  phone?: string; // display form, e.g. (503) 555-0101
  tel?: string; // tel: link
  sample?: boolean;
  listed: boolean; // agreed to show their number on the Team page
  active?: boolean; // false once they've left (live only; their records stay)
  last2?: string; // sign-in screen only: the last 2 digits of the number the code goes to
  noPhone?: boolean; // sign-in screen only: no cell number on file yet
};

export type UnitKind = 'truck' | 'flatbed' | 'stepdeck' | 'dryvan';
export const UNIT_KINDS: { kind: UnitKind; label: string }[] = [
  { kind: 'truck', label: 'Tractor' },
  { kind: 'flatbed', label: 'Flatbed' },
  { kind: 'stepdeck', label: 'Step deck' },
  { kind: 'dryvan', label: 'Dry van' },
];

export type Unit = {
  id: string;
  label: string;
  kind: UnitKind;
  kindLabel: string;
  sample?: boolean;
  lock: { what: string; how: string };
  guides: string[]; // guide slugs, in the order they show on the unit page
  specs: { k: string; v?: string }[]; // no v = still to fill in from Daniel
  active?: boolean;
};

export type Rule = { id: string; title: string; points: string[] };

export type ReportKind = 'Defect' | 'Damage' | 'Crash' | 'Breakdown' | 'Roadside inspection' | 'Other';
export const REPORT_KINDS: ReportKind[] = ['Defect', 'Damage', 'Crash', 'Breakdown', 'Roadside inspection', 'Other'];
export type ReportStatus = 'Open' | 'In the shop' | 'Fixed';
export const REPORT_STATUSES: ReportStatus[] = ['Open', 'In the shop', 'Fixed'];

// A crash report carries what FX4's accident register needs (49 CFR 390.15); `copies` = the
// office has filed the police and insurer reports. A roadside inspection carries its result;
// `certified` = the office signed off the repairs (due within 15 days, 49 CFR 396.9(d)).
export type Towed = 'Yes' | 'No' | 'Not sure';
export const TOWED: Towed[] = ['Yes', 'No', 'Not sure'];
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
  photoIds?: string[]; // live only: photos the viewer may open
  sample?: boolean;
  crash?: CrashInfo;
  roadside?: RoadsideInfo;
};
export type Signoff = { person: string; rule: string; version: number; at: number };
export type RuleVersion = { rule: string; version: number; at: number; note: string };
export type LeavingStep = 'codes' | 'keys' | 'fuel' | 'files' | 'phone';
export const LEAVING_STEPS: LeavingStep[] = ['codes', 'keys', 'fuel', 'files', 'phone'];
export type Post = { id: string; title: string; body: string; at: number; by: string; sample?: boolean };
export type Feedback = { guide: string; helped: boolean; by: string; at: number };
// A phone signed in with a texted code (office view only).
export type Device = { id: string; person: string; at: number; seen: number };

export type State = {
  v: 3;
  me: string | null; // who signed in on this phone (a person id)
  meAt?: number | null; // when this phone was checked by text code
  people: Person[];
  units: Unit[];
  rules: Rule[];
  listed: Record<string, boolean>; // demo only: office overrides of `listed`
  versions: RuleVersion[];
  signoffs: Signoff[];
  reports: Report[];
  leaving: Record<string, Partial<Record<LeavingStep, number>>>;
  posts: Post[];
  seen: Record<string, string[]>;
  feedback: Feedback[];
  devices?: Device[];
};

export type Session = { kind: 'none' } | { kind: 'driver'; person: string } | { kind: 'office'; email: string };

// What GET /api/portal?op=state answers.
export type StateReply =
  | { mode: 'demo'; missing: string[] }
  | { mode: 'live'; session: Session; state: State; ready: { sms: boolean; google: string | null; photos: boolean; mail: boolean } };
