// Step-by-step guides. Each step has a photo slot (to shoot on FX4's own equipment) and,
// where it helps, one line of context. Steps come from the published sources named on each
// guide; Daniel's own procedure replaces or adds to them. Videos can drop into the photo
// slots later. Keep every step short enough to read in a cab.
import type { IconName } from './ui';

export type Step = { title: string; text: string; photo: string; note?: { label: string; text: string } };

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  icon: IconName;
  group: 'Right now' | 'Equipment' | 'On the road' | 'Paperwork';
  urgent?: boolean;
  intro?: string;
  steps: Step[];
  after?: string;
  calculator?: boolean;
  links?: { label: string; href: string }[];
  source: string;
  fx4?: string; // what Daniel still needs to add
};

export const GUIDES: Guide[] = [
  {
    slug: 'accident',
    title: 'After a crash',
    summary: 'Flashers, 911 if anyone is hurt, triangles, then call David.',
    icon: 'alert',
    group: 'Right now',
    urgent: true,
    steps: [
      { title: 'Stop and turn on your flashers', text: 'Hazard flashers on right away, and keep them on until your triangles are out.', photo: 'Hazard switch on the dash' },
      { title: 'Call 911 if anyone is hurt', text: 'People first. Stay at the scene.', photo: 'Phone in hand, truck stopped on the shoulder' },
      {
        title: 'Put out your triangles',
        text: 'Within 10 minutes: one 10 feet (4 paces) behind on the traffic side, one 100 feet (40 paces) behind, one 100 feet ahead.',
        photo: 'Triangles laid out behind the trailer',
        note: { label: 'Divided highway', text: 'One within 10 feet of the rear, one at 100 feet and one at 200 feet, all behind you.' },
      },
      {
        title: 'Call David now',
        text: 'Call dispatch before anything else that can wait.',
        photo: 'Dispatch number on the phone screen',
        note: { label: 'Why it matters', text: 'A drug and alcohol test may be required, and the clock starts at the crash: 8 hours for alcohol, 32 for drugs.' },
      },
      { title: 'Take photos', text: 'Every vehicle, the damage, plates, the whole scene and the road.', photo: 'Wide shot of the scene' },
      { title: 'Get the details', text: 'Names, phone numbers, insurance, plate numbers and the police report number.', photo: 'Notes on a phone' },
      { title: 'Report it here', text: 'Send a report from the portal with your photos the same day.', photo: 'The Report a problem screen' },
    ],
    source: 'Triangles: 49 CFR 392.22. Testing time limits: 49 CFR 382.303.',
    fx4: 'Daniel adds FX4’s own rules: what to say at the scene and who else to call.',
  },
  {
    slug: 'breakdown',
    title: 'Breakdown',
    summary: 'Get safe, triangles out, call David, report it.',
    icon: 'wrench',
    group: 'Right now',
    urgent: true,
    steps: [
      { title: 'Get as far off the road as you can', text: 'Flashers on right away.', photo: 'Truck pulled well onto the shoulder' },
      {
        title: 'Put out your triangles',
        text: 'Within 10 minutes: 10 feet behind on the traffic side, 100 feet behind and 100 feet ahead.',
        photo: 'Triangles laid out behind the trailer',
        note: { label: 'Hill or curve', text: 'Stopped within 500 feet of a curve or hilltop? Put the triangle on that side 100 to 500 feet out.' },
      },
      { title: 'Call David', text: 'Tell him where you are, what happened and what’s loaded.', photo: 'Dispatch number on the phone screen' },
      { title: 'Report it here', text: 'Pick the unit, say what broke and add photos.', photo: 'The Report a problem screen' },
    ],
    source: 'Flashers and triangles: 49 CFR 392.22.',
    fx4: 'Daniel adds FX4’s approved repair shops and tow companies, and where to wait safely.',
  },
  {
    slug: 'inspection',
    title: 'Inspection stop',
    summary: 'What to hand the officer, and the ELD papers that stay in the cab.',
    icon: 'clipboard',
    group: 'Right now',
    steps: [
      {
        title: 'Have the ELD packet ready',
        text: 'It must be in the cab: how to send your logs to an officer, what to do if the ELD breaks, and 8 days of blank paper logs.',
        photo: 'The ELD packet in its folder',
      },
      { title: 'Send your logs when asked', text: 'Follow the data-transfer sheet in the packet.', photo: 'ELD screen on the transfer step' },
      { title: 'Hand over what the officer asks for', text: 'Stay calm and answer what’s asked.', photo: 'Paperwork on the dash' },
      { title: 'Send the report to David', text: 'Photo of the inspection report, sent from the portal the same day.', photo: 'An inspection report, photographed' },
    ],
    source: 'ELD packet: 49 CFR 395.22(h).',
    fx4: 'Daniel adds FX4’s list of papers each truck carries.',
  },
  {
    slug: 'open-trailer',
    title: 'Open or lock a trailer',
    summary: 'Codes come from David by phone. Never written down.',
    icon: 'lock',
    group: 'Equipment',
    steps: [
      { title: 'Call David for the code or key', text: 'Codes are given by phone, every time. They’re never in this portal.', photo: 'Calling dispatch at the trailer' },
      { title: 'Open it', text: 'Kingpin lock, gladhand lock or door padlock: open it the way David tells you.', photo: 'The lock on this trailer' },
      {
        title: 'Sealed load? Leave it closed',
        text: 'Don’t break a seal unless the shipper, receiver or David says so.',
        photo: 'A door seal with its number',
        note: { label: 'Paperwork', text: 'Write the seal number on your paperwork.' },
      },
      { title: 'Lock it again', text: 'Relock it and pull on the lock to be sure it holds.', photo: 'Locked padlock on the doors' },
      { title: 'Keep the code to yourself', text: 'Don’t write it down, text it or pass it on, even to another FX4 driver.', photo: 'No photo needed' },
    ],
    source: 'FX4 rule: lock codes by phone only. Sealed loads: 49 CFR 392.9(b)(4).',
    fx4: 'Daniel confirms which lock each trailer has.',
  },
  {
    slug: 'hook-up',
    title: 'Hook up a trailer',
    summary: 'The 16 coupling steps, with the tug test and coupling check.',
    icon: 'link',
    group: 'Equipment',
    steps: [
      { title: 'Inspect the fifth wheel', text: 'No damage, mounted tight, greased, tilted down, jaws open, handle in auto-lock, slider locked.', photo: 'Fifth wheel ready to couple', note: { label: 'Stop', text: 'Kingpin bent or broken? Don’t hook up. Report it.' } },
      { title: 'Check the area, chock the wheels', text: 'Area clear, trailer wheels chocked or its spring brakes set, cargo secured.', photo: 'Chocks at the trailer wheels' },
      { title: 'Line up the tractor', text: 'Directly in front of the trailer.', photo: 'Tractor lined up straight', note: { label: 'Never', text: 'Never back under at an angle.' } },
      { title: 'Back slowly', text: 'Until the fifth wheel just touches the trailer.', photo: 'Fifth wheel touching the trailer' },
      { title: 'Secure the tractor', text: 'Parking brake on, transmission in neutral.', photo: 'Parking brake knob pulled' },
      { title: 'Check trailer height', text: 'Low enough that the tractor lifts it slightly. Kingpin and fifth wheel lined up.', photo: 'Trailer nose height against the fifth wheel' },
      { title: 'Connect the air lines', text: 'Emergency and service lines to the matching glad hands. Support them so they can’t be crushed.', photo: 'Glad hands connected' },
      { title: 'Supply air', text: 'Push in the air supply knob and wait for normal pressure. Engine off, apply and release the trailer brakes and listen to check for crossed lines, then start the engine.', photo: 'Air supply knob pushed in' },
      { title: 'Lock the trailer brakes', text: 'Pull out the air supply knob.', photo: 'Air supply knob pulled out' },
      { title: 'Back under', text: 'Lowest reverse gear, slowly, until the kingpin locks into the fifth wheel.', photo: 'Kingpin locking into the jaws' },
      { title: 'Do the tug test', text: 'Landing gear up slightly, then pull forward gently with the trailer brakes locked.', photo: 'Tug test in progress' },
      { title: 'Secure the vehicle', text: 'Neutral, parking brake on, engine off, keys with you.', photo: 'Keys in hand' },
      {
        title: 'Inspect the coupling',
        text: 'With a flashlight: no gap between upper and lower fifth wheel, jaws closed around the kingpin shank, lever in lock, safety latch over the lever.',
        photo: 'Flashlight on the locked jaws',
        note: { label: 'Not right?', text: 'Don’t drive it. Call David.' },
      },
      { title: 'Plug in the electrical cord', text: 'Fasten the safety catch. Keep air lines and cord clear of moving parts.', photo: 'Cord plugged in and latched' },
      { title: 'Raise the landing gear', text: 'All the way up, never partway, and secure the crank.', photo: 'Landing gear fully up, crank stowed' },
      { title: 'Remove the chocks', text: 'And put them away.', photo: 'Chocks stowed' },
    ],
    source: 'Oregon DMV Commercial Driver Manual, section 6.4.1.',
  },
  {
    slug: 'drop',
    title: 'Drop a trailer',
    summary: 'The 10 uncoupling steps.',
    icon: 'unlink',
    group: 'Equipment',
    steps: [
      { title: 'Position the rig', text: 'Ground that can hold the trailer, tractor lined up with it.', photo: 'Rig lined up on firm ground' },
      { title: 'Ease pressure on the jaws', text: 'Shut off trailer air to lock its brakes, back up gently, set the parking brake.', photo: 'Air supply knob pulled out' },
      { title: 'Chock the trailer wheels', text: 'If it has no spring brakes, or if you’re not sure.', photo: 'Chocks at the trailer wheels' },
      { title: 'Lower the landing gear', text: 'Until it touches. Loaded? A few extra turns in low gear, without lifting the trailer off the fifth wheel.', photo: 'Landing gear on the ground' },
      { title: 'Disconnect air and electrical', text: 'Air lines to dummy couplers, cable hung plug-down, lines supported.', photo: 'Lines stowed on the tractor' },
      { title: 'Unlock the fifth wheel', text: 'Raise the release handle lock, pull the handle to open.', photo: 'Release handle pulled', note: { label: 'Careful', text: 'Keep your legs and feet clear of the rear tractor wheels.' } },
      { title: 'Pull partway out', text: 'Until the fifth wheel clears, with the frame still under the trailer.', photo: 'Tractor partway out' },
      { title: 'Secure the tractor', text: 'Parking brake on, transmission in neutral.', photo: 'Parking brake knob pulled' },
      { title: 'Check the trailer supports', text: 'Ground holding, landing gear not damaged.', photo: 'Landing gear feet on the ground' },
      { title: 'Pull clear', text: 'Release the parking brake, check around you, drive forward until clear.', photo: 'Tractor pulling away' },
    ],
    source: 'Oregon DMV Commercial Driver Manual, section 6.4.2.',
  },
  {
    slug: 'tandems',
    title: 'Slide the tandems',
    summary: 'Pins out, move the trailer, pins in, check every pin.',
    icon: 'arrows',
    group: 'Equipment',
    steps: [
      { title: 'Set up', text: 'Tractor and trailer straight, on solid level ground, area clear.', photo: 'Rig straight on level ground', note: { label: 'Watch for', text: 'Gravel, snow or ice make the tandems hard to slide.' } },
      { title: 'Brakes and air', text: 'Set the tractor and trailer parking brakes and build air to full.', photo: 'Gauges at full pressure' },
      { title: 'Power divider and trailer hold', text: 'Lock the power divider. Turn on the trailer hold switch, or use the trailer brake valve.', photo: 'Power divider and trailer hold switches' },
      { title: 'Pull the pins', text: 'Pull the slider handle out and lock it in its holder.', photo: 'Slider handle pulled and hooked', note: { label: 'If it sticks', text: 'Use a tool or call for help. Don’t force it.' } },
      { title: 'Mark the hole', text: 'Mark where the front pin should land.', photo: 'Chalk mark at the target hole' },
      { title: 'Move the trailer', text: 'Release only the tractor brakes and ease the truck. The tandems stay put; the trailer moves.', photo: 'Trailer moving over the tandems', note: { label: 'Why it matters', text: 'Each hole moves about 250 lb of weight.' } },
      { title: 'Lock the pins', text: 'Brakes on, let the handle go in, rock gently so the pins seat.', photo: 'Handle back in' },
      { title: 'Look at every pin', text: 'Every pin all the way through its hole, handle fully in.', photo: 'Pins through the holes, close up', note: { label: 'Before you go', text: 'Match the axle setting to the strictest state on your route.' } },
      { title: 'Switch things back', text: 'Unlock the power divider and turn off the trailer hold switch.', photo: 'Switches back off' },
    ],
    source: 'Condensed from Schneider’s published 16-step tandem guide.',
    fx4: 'Daniel adds FX4’s axle settings for its usual lanes.',
  },
  {
    slug: 'secure',
    title: 'Secure the load',
    summary: 'Strap calculator built on the federal minimums.',
    icon: 'strap',
    group: 'Equipment',
    calculator: true,
    intro: 'Enter each piece’s length and weight to see the minimum number of tiedowns.',
    steps: [
      { title: 'Check before you drive', text: 'Cargo and every tiedown, before you leave.', photo: 'Walking the load' },
      { title: 'Check again in the first 50 miles', text: 'Pull over safely and look at every strap and chain.', photo: 'Retightening a strap' },
      { title: 'Then keep checking', text: 'Every 3 hours or 150 miles, whichever comes first, and whenever your duty status changes.', photo: 'Strap check at a rest stop' },
    ],
    source: 'Tiedown minimums: 49 CFR 393.110. Working load limit: 393.106(d). Re-checks: 392.9.',
    fx4: 'Logs, metal coils and heavy machinery have their own federal rules (49 CFR part 393, subpart I); Daniel adds FX4’s.',
  },
  {
    slug: 'chains',
    title: 'Chains and snow',
    summary: 'Oregon chain rules and where to check the passes.',
    icon: 'snow',
    group: 'On the road',
    steps: [
      { title: 'Carry chains', text: 'In Oregon, trucks over 10,000 lb must carry chains when conditions call for them or Snow Zone signs are up.', photo: 'Chains stowed on the truck' },
      { title: 'Check the pass before you go', text: 'TripCheck shows chain requirements and closures.', photo: 'TripCheck on a phone' },
      {
        title: 'Chain up when signs say so',
        text: 'Single drive axle with a semitrailer: both tires on each side of the drive axle, plus one tire on each side of any trailer axle.',
        photo: 'Chained drive tires',
        note: { label: 'Other setups', text: 'Tandem drive and others: see the TripCheck diagram.' },
      },
      { title: 'Don’t skip it', text: 'Oregon’s fine for a truck that doesn’t chain up is $880.', photo: 'Chain-up area sign' },
    ],
    links: [
      { label: 'TripCheck: minimum chain requirements', href: 'https://tripcheck.com/Pages/Minimum-Chain-Requirements' },
      { label: 'ODOT: winter rules for commercial vehicles', href: 'https://www.oregon.gov/odot/Pages/Winter-Commercial-Vehicles.aspx' },
    ],
    source: 'ODOT and TripCheck.',
    fx4: 'Daniel adds a page for each state on FX4’s lanes.',
  },
  {
    slug: 'california',
    title: 'Before a California load',
    summary: 'Check the truck’s emissions status first.',
    icon: 'map',
    group: 'On the road',
    steps: [
      {
        title: 'Ask David before you go',
        text: 'California says it still enforces its Clean Truck Check on out-of-state diesel and other non-gasoline trucks over 14,000 lb.',
        photo: 'Truck at the state line',
        note: { label: 'Why it matters', text: 'The EPA said in January 2026 that California can’t; California says it will anyway. Check before every run.' },
      },
    ],
    links: [{ label: 'California Air Resources Board: Clean Truck Check', href: 'https://ww2.arb.ca.gov/our-work/programs/inspection-and-maintenance-program' }],
    source: 'CCJ and Heavy Duty Trucking reporting, 2026.',
  },
  {
    slug: 'oregon-miles',
    title: 'Oregon mileage records',
    summary: 'What to write down for the weight-mile tax.',
    icon: 'file',
    group: 'Paperwork',
    steps: [
      {
        title: 'Write down every Oregon trip',
        text: 'Trip dates, start and end points, Oregon pickup and delivery points, where you entered and left Oregon, routes, Oregon miles, and start and end odometer each day.',
        photo: 'A trip sheet filled in',
        note: { label: 'Tracker on the truck?', text: 'Ask David whether it already records this.' },
      },
      { title: 'Keep it with the load papers', text: 'FX4 has to keep it with the load tickets or bills of lading.', photo: 'Trip sheet with a bill of lading' },
    ],
    after: 'FX4 keeps these records for 3 years.',
    source: 'ODOT Commerce and Compliance: recordkeeping.',
  },
];

export const guideBySlug = (slug?: string) => GUIDES.find((g) => g.slug === slug);

// Minimum tiedowns for one article (49 CFR 393.110). blocked = held from moving forward by a
// headerboard, bulkhead, other cargo or blocking.
export function minTiedowns(lengthFt: number, weightLb: number, blocked: boolean) {
  if (!(lengthFt > 0) || !(weightLb > 0)) return 0;
  if (blocked) return Math.ceil(lengthFt / 10);
  if (lengthFt <= 5) return weightLb <= 1100 ? 1 : 2;
  if (lengthFt <= 10) return 2;
  return 2 + Math.ceil((lengthFt - 10) / 10);
}
