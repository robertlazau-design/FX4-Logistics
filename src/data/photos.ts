// FX4's own truck photos (Daniel's, Nov 2026). Each lives in public/photos at full size and
// at half size (-sm), with GPS and camera data stripped. Heroes are 1920px wide, the Driver Jobs
// frame 1400px, the "On the road" row 1200px. `pos` is the CSS object-position for the crop.
export type Photo = { src: string; sm: string; w: number; alt: string; pos?: string };

const p = (name: string, w: number, alt: string, pos?: string): Photo => ({
  src: `/photos/${name}.jpg`,
  sm: `/photos/${name}-sm.jpg`,
  w,
  alt,
  pos,
});

export const PHOTOS = {
  home: p('home-night-peterbilt', 1920, 'An FX4 Peterbilt at night with its cab and marker lights glowing amber', '50% 60%'),
  trucking: p('trucking-flatbed-load', 1920, 'A white FX4 Peterbilt with a loaded flatbed in a building-supply yard', '50% 62%'),
  about: p('about-peterbilt-yard', 1920, 'A white FX4 Peterbilt with a tarped trailer parked in a lot', '50% 62%'),
  serviceArea: p('service-area-volvo-hills', 1920, 'A white FX4 Volvo with a tarped trailer, dry hills behind it', '50% 62%'),
  driver: p('driver-snow-peterbilt', 1400, 'A white FX4 Peterbilt pulling a tarped trailer through heavy snow'),
  road: [
    p('road-boat-haul', 1200, 'An FX4 truck hauling a boat at night'),
    p('road-volvo-plant', 1200, 'A white FX4 Volvo with a covered trailer at an industrial plant'),
    p('road-kenworth-snow', 1200, 'A blue FX4 Kenworth with a tarped trailer in a snowy lot'),
  ],
} as const;

// srcset for a photo: the half-size copy and the full one.
export const srcSet = (ph: Photo) => `${ph.sm} ${Math.round(ph.w / 2)}w, ${ph.src} ${ph.w}w`;
