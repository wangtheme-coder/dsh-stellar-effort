import { KNOB } from './hole.mjs';
// Knob motion outside a drag. While pressed the knob follows the pointer
// exactly; on release (or any change of level from outside) it settles on its
// level with a short ease-out, like a physical detent: past the midpoint
// between two levels it lands on the next one, otherwise back on its own (the
// controller picks the nearest level; this only animates the way there).
export const SNAP = Object.freeze({ ms: 260 });
export class Snap {
  constructor() { this.from = 0; this.to = null; this.t = 1; }
  step(shown, target, dt, { follow = false, reduced = false } = {}) {
    if (follow || reduced || shown == null) { this.to = target; this.t = 1; return target; }
    if (target !== this.to) { this.from = shown; this.to = target; this.t = 0; }
    this.t = Math.min(1, this.t + Math.max(0, dt) * 1000 / SNAP.ms);
    return this.from + (this.to - this.from) * (1 - (1 - this.t) ** 3);
  }
}
// The knob (and the hole) grows a little while pressed or dragged.
export function knobScale(previous, pressed, dt, reduced = false) {
  const goal = pressed ? KNOB.pressed : 1;
  return reduced ? goal : previous + (goal - previous) * (1 - Math.exp(-Math.max(0, dt) * 18));
}
