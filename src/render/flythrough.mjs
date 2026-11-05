import { clamp } from '../shared/mapping.mjs';
import { SPACE } from './space.mjs';
// Nebula flythrough (docs/SPEC_NEBULA_FLYTHROUGH.md). A real-looking emission
// nebula (coloured gas, dark dusty pillars with bright rims) lies across the
// route. The black hole travels right, so the cloud comes in from the right
// (ahead), slides past the hole and leaves to the left (behind), exactly like
// the stars and galaxies. It is a stack of gas sheets at different depths:
// near sheets are larger and slide faster, far ones are smaller and slower, so
// the near wisps and pillars sweep across while the far body drifts by. The
// sheets line up over the hole at odometer 'meet' - that is where the hole is
// inside the cloud.
//
// Everything follows the voyage odometer (flight.drift, px of near-star sail),
// never a clock: quiet Max drifts through slowly, overdrive races through,
// release slows it down without restarting, and the same odometer always gives
// the same picture. A passage starts with every sheet off to the right and ends
// with every sheet gone off to the left, so nothing pops; the next cloud comes
// 'period' px later. seed = passage index.
const ANCHOR = SPACE.railX + SPACE.thumbInset + SPACE.travel;   // the Max hole
export const FLY = Object.freeze({
  start: 40,                                   // odometer of the first passage
  speeds: Object.freeze([.3, .42, .58, .78, 1.02, 1.3]),  // share of the near-star sail, far → near
  size: Object.freeze([150, 480]),             // sheet radius px, far → near
  anchor: ANCHOR, centreY: SPACE.centerY,
  meet: 1900,                                  // odometer (into a passage) where all sheets are over the hole
  length: 4700,                                // a passage, until the far body has left on the left
  period: 8000,                                // odometer between clouds
  split: .7,                                   // sheets faster than this pass in front of the stars
  opacity: .3,
});
// Passage index and odometer u into it; null before the first.
export function flyState(drift) {
  const d = drift - FLY.start;
  if (!(d >= 0)) return null;
  const index = Math.floor(d / FLY.period), u = d - index * FLY.period;
  return { index, u, q: u / FLY.length };
}
export const sheetSize = j => FLY.size[0] + (FLY.size[1] - FLY.size[0]) * (FLY.speeds[j] - FLY.speeds[0]) / (FLY.speeds.at(-1) - FLY.speeds[0]);
// Centre x of sheet j at odometer u: it moves left at its own speed.
export const sheetX = (u, j) => FLY.anchor + (FLY.meet - u) * FLY.speeds[j];
// Uniform values for the renderer: [u, seed, dust, strength]. reveal: how far
// space has opened (no cloud before it has). dust: progress (0-1) of the thin
// dust that sweeps past on the High → Max entry (evolution entryDust).
export function flyUniform(world, reveal = 1, reduced = false, dust = 0) {
  const s = flyState(world.flight?.drift ?? 0), z = reduced || (world.elements?.nebulae ?? 1) <= 0 ? 0 : clamp(dust);
  if (!s || s.u > FLY.length) return [0, 0, z, 0];
  const strength = clamp(reveal) * (world.elements?.nebulae ?? 1) * (reduced ? .6 : 1);
  return [s.u, s.index + 1, z, strength];
}
// The entry dust: two thin layers, the nearer one faster, that cross the whole
// view from right to left while space opens and the surge eases out: streaks
// drawn out along the flight with a few darker grains, in front of the stars.
export const ENTRY_DUST = Object.freeze({ from: SPACE.width + 440, travel: 1760, extra: Object.freeze([0, 260]), speed: Object.freeze([1, 1.45]), size: Object.freeze([[430, 95], [520, 120]]), opacity: .2 });
export const dustX = (z, i) => ENTRY_DUST.from + ENTRY_DUST.extra[i] - z * ENTRY_DUST.travel * ENTRY_DUST.speed[i];
// Lensing of the passing nebula near the hole (SPEC part 6): only where its
// detail is seen changes, never the cloud itself. A point-mass lens: the gas
// a pixel shows is offset toward the hole by einstein²/r, so detail near the
// hole is stretched round it into arcs; it fades out by reach[1] px. lens:
// the lens setting × hole visibility (uLens).
export const FLY_LENS = Object.freeze({ einstein: 24, reach: Object.freeze([60, 130]), floor: 10 });
export function flyLensPoint(p, k, lens) {
  const dx = p.x - k.x, dy = p.y - k.y, r = Math.hypot(dx, dy);
  if (!(lens > 0) || !(r > 0) || r >= FLY_LENS.reach[1]) return p;
  const t = Math.min(1, Math.max(0, (r - FLY_LENS.reach[0]) / (FLY_LENS.reach[1] - FLY_LENS.reach[0]))), fade = 1 - t * t * (3 - 2 * t), shift = lens * fade * FLY_LENS.einstein ** 2 / Math.max(r, FLY_LENS.floor) / r;
  return { x: p.x - dx * shift, y: p.y - dy * shift };
}
const num = v => (Number.isInteger(v) ? `${v}.` : String(v));
// Expects hash, noise, fbm. uFly = (u, seed, -, strength); uFlyRange = (min,
// max) speed of the sheets a pass draws (far body behind the stars, near
// sheets in front of them). Returns (colour, alpha).
export const FLY_GLSL = `
uniform vec4 uFly;uniform vec2 uFlyRange;
float flyRidge(float v){return 1.-abs(2.*v-1.);}
float flyHash(float a,float b){return fract(sin(a*127.1+b*311.7)*43758.5453);}
// Gas of a real emission nebula (after Hubble's colour images): teal where
// oxygen glows, gold and rose where sulphur and hydrogen do, threaded with
// bright filaments and cut by dark dust lanes.
vec4 flySheet(vec2 w,float sd){
 vec2 warp=vec2(fbm(w*1.1+sd),fbm(w*1.1+sd+4.3))-.5,q=w+warp*.6;
 float env=smoothstep(1.05,.25,length(q*vec2(.85,1.25))+.3*(fbm(q*1.7+sd+2.)-.5));if(env<.002)return vec4(0.);
 float body=smoothstep(.38,.8,fbm(q*2.3+sd+1.)),fil=pow(flyRidge(fbm(q*4.6+sd+7.)),5.),dust=smoothstep(.6,.78,fbm(q*3.4+sd+13.));
 vec3 col=mix(vec3(.3,.7,.72),vec3(.45,.6,.95),flyHash(sd,3.)*.6);
 col=mix(col,vec3(.95,.75,.4),smoothstep(.45,.75,fbm(q*1.6+sd+30.))*.8);col=mix(col,vec3(.92,.4,.48),smoothstep(.55,.8,fbm(q*2.1+sd+40.))*.8);
 col=mix(col*(1.+fil*.5),vec3(.03,.025,.03),dust*.85);
 return vec4(col,clamp(env*(body*.55+fil*.6)+dust*env*.35,0.,1.));}
// Pillars (after the Pillars of Creation and Carina): dark dusty columns
// rising from the bottom of some sheets, their tops and edges lit gold-pink
// by hot stars. Seen close, the voyage carries the eye right past them.
vec4 flyPillars(vec2 w,float sd){
 float body=0.,rim=0.;
 // Bodies are near-black and mottled with knobby, irregular outlines; only a
 // thin, broken rim catches the light, mostly near the top; the bases melt
 // into the gas. Some sheets carry fewer, varied columns.
 for(int i=0;i<3;i++){float fi=float(i);if(flyHash(sd,fi+21.)<.3)continue;
  float x0=-.55+fi*.5+(flyHash(sd,fi+5.)-.5)*.3,top=-.35+flyHash(sd,fi+9.)*.75,wd=(.06+.08*flyHash(sd,fi+13.))*(1.+1.8*smoothstep(top,1.4,w.y));
  float bend=(w.y-1.3)*(flyHash(sd,fi+17.)-.5)*.45,edge=.6*(fbm(w*3.5+sd+fi*3.)-.5)+.28*(fbm(w*11.+sd+fi)-.5),u=(w.x-x0-bend)/wd;
  float cap=length(vec2(u,(w.y-top)/(wd*1.4)))+edge,inside=max(smoothstep(1.05,.7,abs(u)+edge)*step(top,w.y),smoothstep(1.05,.7,cap))*smoothstep(1.55,.95,w.y);
  float lit=smoothstep(.7,-.15,w.y-top)*(.25+.75*smoothstep(.45,.75,fbm(w*9.+sd+fi*7.)));
  body=max(body,inside);rim=max(rim,inside*(1.-inside)*4.*lit);}
 float mottle=.6+.4*fbm(w*6.+sd+50.);
 return vec4(mix(vec3(.07,.045,.035)*mottle,vec3(1.,.74,.48),clamp(rim*1.3,0.,1.)),body*.82);}
vec2 flyLens(vec2 p){vec2 d=p-vec2(cx(),uSize.y*.5);float r=length(d);if(uLens<.001||r<.001||r>=${num(FLY_LENS.reach[1])})return p;return p-d*uLens*(1.-smoothstep(${num(FLY_LENS.reach[0])},${num(FLY_LENS.reach[1])},r))*${num(FLY_LENS.einstein ** 2)}/max(r,${num(FLY_LENS.floor)})/r;}
// High → Max entry (SPEC 4.1): very thin interstellar dust streaks past.
vec4 entryDust(vec2 p){float z=uFly.z;if(z<.001||z>.999)return vec4(0.);vec3 c=vec3(0.);float a=0.,fade=sin(z*3.14159);
 for(int i=0;i<2;i++){float fi=float(i),sd=31.7+fi*9.1;vec2 size=mix(vec2(${ENTRY_DUST.size[0].map(num).join(',')}),vec2(${ENTRY_DUST.size[1].map(num).join(',')}),fi);
  vec2 w=(p-vec2(${num(ENTRY_DUST.from)}+${num(ENTRY_DUST.extra[1])}*fi-z*${num(ENTRY_DUST.travel)}*mix(${num(ENTRY_DUST.speed[0])},${num(ENTRY_DUST.speed[1])},fi),${num(FLY.centreY)}+(fi-.5)*70.))/size;if(max(abs(w.x),abs(w.y))>1.3)continue;
  float env=smoothstep(1.,.15,length(w*vec2(1.,1.15))+.35*(fbm(w*2.+sd)-.5)),streak=smoothstep(.42,.82,fbm(vec2(w.x*1.4,w.y*9.)+sd)),grain=smoothstep(.62,.8,fbm(w*vec2(3.,12.)+sd+5.));
  vec3 col=mix(vec3(.62,.57,.52),vec3(.55,.64,.8),fi)*(1.-.6*grain);float ga=env*(streak*.85+grain*.3)*${num(ENTRY_DUST.opacity)}*fade;
  c=c*(1.-ga)+col*ga;a=a+ga*(1.-a);}
 return vec4(a>.0001?c/a:vec3(0.),a*unfoldMask(p));}
const float FLY_SPEED[${FLY.speeds.length}]=float[${FLY.speeds.length}](${FLY.speeds.map(num).join(',')});
vec4 flythrough(vec2 p){
 if(uFly.w<.001&&uFly.z<.001)return vec4(0.);vec3 c=vec3(0.);float a=0.;
 // Far (slow) sheets first, near (fast) ones over them.
 for(int i=0;i<${FLY.speeds.length};i++){float j=float(i),s=FLY_SPEED[i];if(uFly.w<.001||s<uFlyRange.x||s>=uFlyRange.y)continue;
  float size=${num(FLY.size[0])}+${num(FLY.size[1] - FLY.size[0])}*(s-${num(FLY.speeds[0])})/${num(FLY.speeds.at(-1) - FLY.speeds[0])},sd=uFly.y*7.31+j*1.93;
  vec2 centre=vec2(${num(FLY.anchor)}+(${num(FLY.meet)}-uFly.x)*s,${num(FLY.centreY)}+(flyHash(sd,2.)-.5)*size*.4);
  vec2 w=(p-centre)/size;if(max(abs(w.x),abs(w.y))>1.7)continue;
  vec4 g=flySheet(w,sd);float ga=g.a*${num(FLY.opacity)}*(.8+.35*j/${num(FLY.speeds.length - 1)})*uFly.w;
  c=c*(1.-ga)+g.rgb*ga;a=a+ga*(1.-a);
  if(mod(j,2.)>.5){vec4 pl=flyPillars(w,sd);float pa=pl.a*uFly.w;c=c*(1.-pa)+pl.rgb*pa;a=a+pa*(1.-a);}}
 if(uFlyRange.y>${num(FLY.speeds.at(-1))}){vec4 e=entryDust(p);c=c*(1.-e.a)+e.rgb*e.a;a=a+e.a*(1.-a);}
 return vec4(a>.0001?c/a:vec3(0.),a);}
`;
