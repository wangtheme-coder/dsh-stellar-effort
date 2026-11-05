import { SPACE } from './space.mjs';
// Max overdrive: a few pixels of extra travel past the Max anchor, hidden in the
// hole's own shadow (the 31px shadow then just reaches past the rail end). It is
// purely visual: the controller only ever receives positions within 0–1.
export const OVERDRIVE = Object.freeze({ px: 7, soft: 26 });
export const OVERDRIVE_T = OVERDRIVE.px / SPACE.travel;
// Pointer pixels dragged beyond Max → drive 0–1 with elastic resistance: the
// first pixels respond quickly, then the knob creeps toward its safe end.
export function overdriveFromPointer(excessPx) { return excessPx > 0 ? 1 - Math.exp(-excessPx / OVERDRIVE.soft) : 0; }
// Near stars sweep past fastest; far stars barely move (lateral parallax).
export const parallax = z => .04 + .96 * Math.max(0, Math.min(1, z)) ** 3;
// Sailing speed in px/s for parallax 1: quiet at Max, fast in full overdrive.
export const SAIL = Object.freeze({ quiet: 5, full: 150, entry: 230 });
