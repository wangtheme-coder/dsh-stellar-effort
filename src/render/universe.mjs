import {opticalProfile,opticalColor,softenMotion} from './optics.mjs';
import {METEOR} from './meteor.mjs';
import {stepPassers} from './passers.mjs';
import {classicOffset} from './classics.mjs';
import {nebulaLayers,nebulaTransmission} from './nebula.mjs';
import {Flight,perspective,VANISH} from './flight.mjs';
import {visualState,unfoldMask,LIMITS} from './evolution.mjs';
import {burstRadius} from './reveal.mjs';
import {swallowPoint} from './implode.mjs';
import { clamp, smooth } from '../shared/mapping.mjs';
import { DEFAULTS } from '../shared/config.mjs';
import { SPACE, worldPoint } from './space.mjs';
import { holeState, lensPoint } from './hole.mjs';
import { OVERDRIVE_T, parallax } from './overdrive.mjs';

export function randomSource(seed) {
  let value = seed ?? globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Date.now();
  return () => { value |= 0; value = value + 0x6D2B79F5 | 0; let t = Math.imul(value ^ value >>> 15, 1 | value); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const STYLE_COLORS = Object.freeze({ realistic: [1, .65, .34], scifi: [.65, .38, 1], hybrid: [.88, .66, .64], minimal: [.65, .78, 1] });
// Rail units: x is knob travel (0–1, 282px), y is 18px. The world reaches
// beyond the rail on every side; about half the stars live outside the rail.
const OUTER = .5, WORLD_X = [-(SPACE.railX + SPACE.thumbInset) / SPACE.travel, (SPACE.width - SPACE.railX - SPACE.thumbInset) / SPACE.travel], WORLD_Y = SPACE.centerY / 18;
export class Universe {
  constructor({ seed, config = DEFAULTS } = {}) {
    this.random = randomSource(seed); this.config = { ...config }; this.target = { ...config }; this.palette = [...STYLE_COLORS[config.style]];
    this.styleMix={realistic:0,scifi:0,hybrid:0,minimal:0};this.styleMix[config.style]=1;
    this.elements=Object.fromEntries(['stars','meteors','nebulae','clusters','lens'].map(k=>[k,config[k]?1:0]));this.accretion=0;
    this.stars = []; this.meteors = []; this.clouds = []; this.nextId = 1; this.time = 0; this.spinTime = 0; this.warp = 0; this.pull = 0; this.position = 1;
    this.flight=new Flight();this.skyOffset=classicOffset(Math.random);this.overdrive=0;this.base=1;this.diskSize=1;this.captured = 0; this.expired = 0; this.births = 0; this.ticks = 0; this.cluster = null; this.clusterCooldown = 0; this.meteorCooldown = 0;this.inactiveTime=0;this.awake=0;
    for (let i = 0; i < 640; i++) this.stars.push(this.star(true));
    this.clouds.push(this.cloud(true), this.cloud(true));
  }
  rand(a = 0, b = 1) { return a + (b - a) * this.random(); }
  // Outer stars: anywhere in the world band above or below the rail (rail units
  // of 18px), so the scene is larger than the control.
  outerY() { return (this.random() < .5 ? -1 : 1) * this.rand(.94, WORLD_Y - .2); }
  star(initial = false) {
    const clustered = this.cluster && this.random() < .22;
    const life = this.rand(12, 65);
    // Many faint far stars, fewer mid, a handful of bright near ones; magnitude
    // is skewed so only a few stars per layer stand out.
    const roll = this.random(), z = roll < .6 ? this.rand(.18, .45) : roll < .9 ? this.rand(.45, .75) : this.rand(.75, 1);
    const size = z < .45 ? this.rand(.3, .65) : z < .75 ? this.rand(.5, 1) : this.rand(.85, 1.45), magnitude = .7 + .6 * this.random() ** 2;
    const s = { id: this.nextId++, ...(clustered ? { x: clamp(this.cluster.x + this.rand(-.08, .08)), y: clamp(this.cluster.y + this.rand(-.3, .3), -.9, .9), inner: true } : this.random() < OUTER ? { x: this.rand(WORLD_X[0], WORLD_X[1]), y: this.outerY() } : { x: this.rand(.006, .996), y: this.rand(-.94, .94), inner: true }), z, size, magnitude, tone: this.random(), phase: this.rand(0, 6.283), frequency: this.rand(.2, .65), vx: this.rand(-.0013, .0008), vy: this.rand(-.008, .008), age: initial ? this.rand(1, life * .8) : 0, life };
    this.births++; return s;
  }
  cloud(initial = false) {
    return { id: this.nextId++, x: this.rand(-.3, 1.2), y: this.rand(-3.6, 3.6), radius: this.rand(.1, .24), age: initial ? this.rand(2, 8) : 0, life: this.rand(18, 42), tone: this.random(), opacity: this.rand(.14, .28), twist: 0 };
  }
  meteor(p = this.base) {
    // A meteor streaks across the whole view, rail included, roughly left to
    // right. With the hole present its straight-line path is aimed to miss the
    // hole by 16–130 px (nearer misses more likely), so each one bends by a
    // different amount; without it the path is just a random crossing.
    const hole = worldPoint(p, 0), heading = this.rand(-.38, .38), dir = { x: Math.cos(heading), y: Math.sin(heading) }, speed = this.rand(...METEOR.speed);
    const aimed = p >= LIMITS.collapse, side = this.random() < .5 ? -1 : 1, miss = side * (METEOR.miss[0] + (METEOR.miss[1] - METEOR.miss[0]) * this.random() ** 2);
    const through = aimed ? { x: hole.x - dir.y * miss, y: hole.y + dir.x * miss } : { x: this.rand(250, 650), y: this.rand(60, SPACE.height - 60) }, back = this.rand(320, 420);
    const start = { x: through.x - dir.x * back, y: through.y - dir.y * back };
    return { id: this.nextId++, x: (start.x - SPACE.railX - SPACE.thumbInset) / SPACE.travel, y: (start.y - SPACE.centerY) / 18, vx: speed * dir.x / SPACE.travel, vy: speed * dir.y / 18, age: 0, life: (back * 2 + 120) / speed, points: [], tone: this.random(), near: aimed && Math.abs(miss) < 60 };
  }
  setConfig(config) { this.target = { ...config }; }
  step(delta, { position, pressed = false, reduced = false, budget = 1, overdrive = 0 } = {}) {
    const dt = clamp(delta, 0, .05); this.ticks++;
    const beforeCapture=this.captured;this.accretion*=Math.exp(-dt*2.5);
    const p = clamp(position ?? this.base); const movement = this.base - p;
    const retreat = clamp(movement / Math.max(dt, .001) * 1.3);
    this.base = p;
    // Overdrive is visual travel past Max: the knob follows the drag quickly and
    // eases back without overshoot on release. It never changes the level.
    const drive = reduced || !pressed ? 0 : clamp(overdrive) * smooth(.985, 1, p);
    this.overdrive += (drive - this.overdrive) * (1 - Math.exp(-dt * (drive > this.overdrive ? 14 : 3.2)));
    if (this.overdrive < 1e-4 && !drive) this.overdrive = 0;
    this.position = p + this.overdrive * OVERDRIVE_T;
    const ease = 1 - Math.exp(-dt * 3);
    for (const key of Object.keys(DEFAULTS)) {
      const target = this.target[key];
      this.config[key] = typeof target === 'number' ? this.config[key] + (target - this.config[key]) * ease : target;
    }
    const color = STYLE_COLORS[this.target.style]; this.palette = this.palette.map((v, i) => v + (color[i] - v) * ease);
    for(const style of Object.keys(this.styleMix))this.styleMix[style]+=((this.target.style===style?1:0)-this.styleMix[style])*ease;
    for(const key of Object.keys(this.elements))this.elements[key]+=((this.target[key]?1:0)-this.elements[key])*ease;
    const c = this.config; const speed = c.speed;const evolved=visualState(this);this.flight.step(dt,{position:p,pressed,reveal:evolved.spaceReveal,reduced,speed,drive,boost:evolved.entryWarp??0});
    const simulated = Math.min(dt * speed * (reduced?.12:1), .25); this.time += simulated;this.awake=Math.min(1,this.awake+dt/.4);
    // The accretion disk grows from a thin newborn ring past collapse to its full
    // size at Max, easing so a fast drag still shows it grow. Spin follows the
    // disk's size and speeds up in overdrive (and slows again with its decay).
    const sizeTarget = evolved.holeVisibility > .01 ? .12 + .88 * smooth(LIMITS.collapse, 1, p) : .12;
    this.diskSize += (sizeTarget - this.diskSize) * (1 - Math.exp(-dt * (reduced ? 20 : 2.2)));
    this.spinTime += dt * Math.min(2.5, Math.sqrt(speed) * c.spin) * (.35 + .65 * this.diskSize) * (1 + 1.6 * this.flight.driveWarp) * (reduced ? .15 : 1);
    stepPassers(this, dt, { position: p, reveal: evolved.spaceReveal, warp: this.flight.driveWarp, surge: evolved.entryWarp ?? 0, holeVisibility: evolved.holeVisibility, reduced, enabled: !!c.stars, rate: c.activity });
    const depth = smooth(2 / 3, .96, p);
    this.warp = this.flight.warp;
    this.pull += (retreat - this.pull) * (1 - Math.exp(-dt * 9));
    this.inactiveTime=depth<.001?this.inactiveTime+dt:0;
    // Lower effort hides the deep-space layer, not its world. Retain the bounded
    // population so returning through High does not reseed the entire sky.
    const desired = Math.round((c.stars ? 660 : 0) * c.density * budget);
    this.clusterCooldown -= simulated; this.meteorCooldown -= simulated;
    if (c.clusters && this.clusterCooldown < 0 && this.random() < simulated * .045 * c.activity * c.clusterRate) {
      this.cluster = { x: this.rand(.08, Math.max(.12, p - .12)), y: this.rand(-.45, .45), life: this.rand(8, 15) }; this.clusterCooldown = this.rand(12, 30);
    }
    if (this.cluster && (this.cluster.life -= simulated) < 0) this.cluster = null;
    const localRadius = 28 + this.pull * 90;
    this.stars = this.stars.filter(s => {
      s.age += simulated;
      if (s.age > s.life || s.x < WORLD_X[0] - .04 || Math.abs(s.y) > WORLD_Y + .1) { this.expired++; return false; }
      if (s.age < 1 && this.stars.length > desired + 4) return false;
      // Far stars follow their original trajectories. Gravity is an image-plane
      // lens only; their world positions/velocities are never captured or pulled.
      s.x += clamp(s.vx, -.035, .035) * simulated; s.y += clamp(s.vy, -.3, .3) * simulated;
      return true;
    });
    const deficit = desired - this.stars.length;
    if (deficit > 0 && this.pull < .15) {
      const count = Math.min(deficit, Math.max(1, Math.round(simulated * 30)));
      for (let i = 0; i < count; i++) { const s = this.star(); s.x *= Math.max(p, LIMITS.collapse); this.stars.push(s); }
    } else if (deficit < -4) {
      for (const s of this.stars.slice(0, Math.min(2, -deficit))) s.life = Math.min(s.life, s.age + .8);
    }
    if (delta<=.25 && depth > .05 && c.meteors && this.meteorCooldown < 0 && this.meteors.length < METEOR.limit && this.random() < simulated * METEOR.rate * c.activity * c.meteorRate) { this.meteors.push(this.meteor(p)); this.meteorCooldown = METEOR.cooldown+this.rand(0,2); }
    const hole = worldPoint(this.position, 0), holeOn = visualState(this).holeVisibility, sailing = this.flight.sail * parallax(.6) / SPACE.travel;
    this.meteors = this.meteors.filter(m => {
      m.age += simulated;
      // A softened point mass in pixels bends the meteor's real path (head and
      // tail alike); far meteors are barely touched. Inside the shadow it is gone.
      const head = worldPoint(m.x, m.y), dx = hole.x - head.x, dy = hole.y - head.y, d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1;
      if (depth > .05 && c.gravity > 0 && holeOn > .05 && !reduced) {
        const a = METEOR.pull * c.gravity * holeOn / (d2 + METEOR.soft * METEOR.soft) * simulated;
        m.vx += dx / d * a / SPACE.travel; m.vy += dy / d * a / 18;
        if (d < 12) { this.captured++; return false; }
      }
      m.x += m.vx * simulated - sailing * dt; m.y += m.vy * simulated;
      m.points.unshift([m.x, m.y]); m.points = m.points.slice(0, 28);
      // Leaving the viewport never ends a meteor; only its life, the hole or the
      // edge of the world does.
      return m.age < m.life && m.x < WORLD_X[1] && m.x > WORLD_X[0] && Math.abs(m.y) < SPACE.height / 2 / 18;
    });
    this.clouds = this.clouds.filter(n => {
      n.age += simulated; n.x -= simulated * .0008 + this.flight.sail * .03 / SPACE.travel * dt;
      const dx = p - n.x;
      const local = depth * Math.pow(clamp(1 - Math.abs(dx) / .27), 2) * c.gravity;
      n.twist += (local * (1 + this.pull * 2) - n.twist) * ease;

      return n.age < n.life;
    });
    if (c.nebulae && this.clouds.length < 4 && this.random() < simulated * .08 * c.activity * c.nebulaRate && this.pull < .15) this.clouds.push(this.cloud());
    this.accretion=Math.min(.35,this.accretion+Math.min(5,this.captured-beforeCapture)*.018);
  }
  snapshot() { return { stars: this.stars.length, meteors: this.meteors.length, clouds: this.clouds.length, births: this.births, captured: this.captured, expired: this.expired, ticks: this.ticks, warp: this.warp }; }
}

export function projectStar(star, world, reduced = false, clouds = nebulaLayers(world,reduced),look=opticalProfile(world)) {
  const c = world.config; const p = world.position; const visual=visualState(world),depth=visual.spaceReveal;
  const projection=perspective(star,world.flight,reduced);let { x, y } = projection;
  const { x: cx, y: cy } = worldPoint(p, 0);
  if (world.elements.lens>.001 && !reduced) {
    const lensed=lensPoint({x,y},{x:cx,y:cy},c.lensStrength*world.elements.lens*visual.holeVisibility);
    x=lensed.x;y=lensed.y;
  }
  // BOOM opens space: stars start drawn in toward the origin and spread to
  // their true positions, near layers travelling further than far ones.
  if((visual.expansion??1)<1&&!reduced&&world.evolution){const origin=world.evolution.origin,k=(1-visual.expansion)*(.25+.55*star.z);x=origin.x+(x-origin.x)*(1-k);y=origin.y+(y-origin.y)*(1-k);}
  // Max → High: the hole swallows the stars with the rest of the sky.
  if((visual.swallow??0)>0&&!reduced)({x,y}=swallowPoint({x,y},{x:cx,y:cy},visual.swallow));
  // The burst pushes space aside: stars near its racing front are shoved
  // outward from the hole.
  if(visual.boomEnvelope>0&&!reduced){const dx=x-cx,dy=y-SPACE.centerY,r=Math.hypot(dx,dy)||1,push=6*visual.boomEnvelope*Math.exp(-Math.pow((r-burstRadius(visual.unfold))/12,2));x+=dx/r*push;y+=dy/r*push;}
  const life = smooth(0, 1.5, star.age) * (1 - smooth(star.life - 1.5, star.life, star.age));
  const shimmer = reduced ? .84 : .76 + .2 * Math.sin(world.time * star.frequency + star.phase);
  const tone = star.tone < .12 ? [1, .81, .65] : star.tone < .43 ? [.65, .78, 1] : [.88, .92, 1];
  const motion=softenMotion((star.vx??0)*282*projection.scale+(projection.x-VANISH.x)*(world.flight?.velocity??0)/projection.viewDepth*(world.flight?.gain??0),(star.vy??0)*18*projection.scale+(projection.y-VANISH.y)*(world.flight?.velocity??0)/projection.viewDepth*(world.flight?.gain??0),world,reduced);
  return { x, y, size: Math.min(2.2,star.size * (.4 + star.z * .85)*projection.sizeScale), alpha: unfoldMask(x,y,cx,visual.unfold) * look.stars * nebulaTransmission({...projection,x,y},clouds,p) * projection.alpha * life * shimmer * (.3 + .75 * star.z) * (star.magnitude ?? 1) * depth * c.brightness * world.awake * world.elements.stars, tone:opticalColor(tone,{...look,gain:1}),softening:motion, layer:projection.layer,viewDepth:projection.viewDepth,trailX:projection.trailX,trailY:projection.trailY,trailLength:projection.trailLength*c.trails };
}



