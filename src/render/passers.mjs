import { clamp, smooth } from '../shared/mapping.mjs';
import { SPACE, worldPoint } from './space.mjs';
import { VANISH } from './flight.mjs';
import { PASSER_SLOTS } from './deep-sky.mjs';
// Near passing stars (Phase 5): now and then a single nearby star comes out of
// the distance, grows and brightens, and streams past the hole and out of view.
// Low rate at quiet Max (one every ~9 s), more often and faster in overdrive or
// the short plunge. Near the hole its image is pushed slightly outward (lensing).
export const PASSER = Object.freeze({ interval: 9, z0: 4.2, zEnd: .42, quiet: .38, warp: 2.4, surge: 3.4, lens: 9, lensRange: 22 });
const TINTS = Object.freeze([[.72, .8, 1], [1, .93, .82], [1, .82, .62], [.86, .9, 1]]);
// rand(a, b) → uniform; returns a new passer starting far away near the
// vanishing point (with a lateral offset so it does not fly straight at the eye).
export function spawnPasser(rand) {
  const angle = rand(0, Math.PI * 2), reach = rand(26, 70);
  return { ox: Math.cos(angle) * reach, oy: Math.sin(angle) * reach * .7, z: PASSER.z0, lateral: 0, age: 0, tint: TINTS[Math.floor(rand(0, TINTS.length)) % TINTS.length], size: rand(.85, 1.25) };
}
// Passers draw from their own random stream so they never shift the seeded
// sequences of stars and meteors.
function stream(world){if(world.passerRandom)return world.passerRandom;let s=0x2545f491;world.passerRandom=()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};return world.passerRandom;}
// Advances the passers and fills world.passers with what the renderer draws.
export function stepPassers(world, dt, { position, reveal, warp = 0, surge = 0, holeVisibility = 0, reduced = false, enabled = true, rate = 1 }) {
  world.passerState ??= [];const random = stream(world), rand = (a, b) => a + (b - a) * random();
  const list = world.passerState, active = enabled && !reduced && reveal > .6 && position > .9;
  if (active && list.length < PASSER_SLOTS) {
    const perSecond = rate * (1 + 3 * warp + 5 * surge) / PASSER.interval;
    if (random() < dt * perSecond) list.push(spawnPasser(rand));
  }
  const hole = worldPoint(world.position, 0), sail = world.flight?.sail ?? 0, speed = PASSER.quiet + PASSER.warp * warp + PASSER.surge * surge;
  world.passers = [];
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    s.age += dt; s.z -= dt * speed * (reduced ? .2 : 1); s.lateral += dt * sail;
    const factor = PASSER.z0 / Math.max(s.z, .05);
    let x = VANISH.x + s.ox * factor - s.lateral, y = VANISH.y + s.oy * factor;
    // Gravitational lensing near the hole: the image is nudged outward.
    if (holeVisibility > .01) { const dx = x - hole.x, dy = y - hole.y, d = Math.hypot(dx, dy) || 1, push = PASSER.lens * holeVisibility * Math.exp(-d / PASSER.lensRange); x += dx / d * push; y += dy / d * push; }
    const near = 1 - (s.z - PASSER.zEnd) / (PASSER.z0 - PASSER.zEnd), radius = s.size * (.45 + 2.3 * near * near);
    const fadeIn = smooth(0, .8, s.age), fadeOut = 1 - smooth(.85, 1, near), edge = smooth(-30, 10, Math.min(x, SPACE.width - x, y, SPACE.height - y));
    if (s.z <= PASSER.zEnd || edge <= 0 && s.age > 1) { list.splice(i, 1); continue; }
    world.passers.push({ x, y, radius, alpha: clamp(fadeIn * fadeOut * (.35 + .65 * near) * (active ? 1 : smooth(0, .6, reveal))), tint: s.tint });
  }
  if (!active && reveal < .3) list.length = 0;
}
