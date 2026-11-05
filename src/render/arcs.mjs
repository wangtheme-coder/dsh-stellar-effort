// Lightning on the charged knob (evolution charge, 0-1): arcs crawl over its
// face and race along its rim, redrawn several times a second. The closer the
// knob gets to the critical point, the more arcs, the brighter and quicker
// they are, and the knob starts to shake, until it collapses into the hole.
// With reduced motion they are redrawn far less often and the knob holds still.
export const ARCS = Object.freeze({ count: 7, rate: [6, 24], calm: .12, shake: .6 });
// Arcs in play at a charge: share of the slots lit (as in the shader).
export const arcShare = charge => Math.min(1, .18 + .8 * charge * charge);
const num = v => (Number.isInteger(v) ? `${v}.` : String(v));
// Expects uTime, noise(). R: knob radius (px).
export const ARCS_GLSL = `
uniform float uCharge,uCalm;
float arcHash(float n){return fract(sin(n*91.3458)*47453.5453);}
vec3 knobArcs(vec2 d,float R){
 if(uCharge<.02)return vec3(0.);
 float q=uCharge*uCharge,r=length(d),th=atan(d.y,d.x),rate=mix(${num(ARCS.rate[0])},${num(ARCS.rate[1])},uCharge)*mix(1.,${ARCS.calm},uCalm),tick=floor(uTime*rate),light=0.;
 for(int i=0;i<${ARCS.count};i++){float fi=float(i),seed=tick*13.17+fi*7.31;
  if(arcHash(seed)>.18+.8*q)continue;
  // The first four race along the rim, the others cross the face.
  float a0=arcHash(seed+1.)*6.28318,span=.6+1.8*arcHash(seed+2.),rim=step(fi,3.5),
   rr=R*mix(mix(.3,.85,arcHash(seed+3.)),mix(.97,1.12,arcHash(seed+3.)),rim),da=mod(th-a0,6.28318);
  if(da>span)continue;
  float u=da/span,amp=(1.6+2.2*q)*sin(u*3.14159),
   jag=(noise(vec2(u*11.,seed))-.5)*2.+(noise(vec2(u*29.,seed+5.))-.5)*.9+(abs(fract(u*7.+arcHash(seed+4.))-.5)-.25)*1.6,
   dist=abs(r-rr-jag*amp),w=.5+.3*q;
  light+=(exp(-dist*dist/(w*w))*1.3+exp(-dist/2.2)*.3)*(.55+.45*arcHash(seed+9.))*smoothstep(0.,.1,u)*smoothstep(1.,.9,u);}
 float aura=exp(-pow((r-R)/4.,2.))*.35*q*(.75+.25*sin(uTime*31.*(1.-uCalm)+th*3.));
 return vec3(.55,.62,1.)*light*(.4+.6*uCharge)+vec3(.92,.95,1.)*min(1.,light*light)*.6*uCharge+vec3(.55,.3,.95)*aura;}
// The knob shakes a little just before it collapses.
vec2 knobShake(){float j=pow(uCharge,3.)*(1.-uCalm);return vec2(sin(uTime*53.1),cos(uTime*61.7))*${ARCS.shake}*j;}
float knobWobble(){return 1.+.025*pow(uCharge,3.)*(1.-uCalm)*sin(uTime*37.);}
`;
// Canvas twins: the same arcs as polylines around the knob centre, and its shake.
const hash = n => { const v = Math.sin(n * 91.3458) * 47453.5453; return v - Math.floor(v); };
const wiggle = (u, seed) => { const i = Math.floor(u), f = u - i, a = hash(i * 17.1 + seed), b = hash((i + 1) * 17.1 + seed); return a + (b - a) * f * f * (3 - 2 * f); };
export function arcStrokes(charge, time, calm, R) {
  if (!(charge >= .02)) return [];
  const q = charge * charge, rate = (ARCS.rate[0] + (ARCS.rate[1] - ARCS.rate[0]) * charge) * (1 + (ARCS.calm - 1) * calm), tick = Math.floor(time * rate), out = [];
  for (let i = 0; i < ARCS.count; i++) {
    const seed = tick * 13.17 + i * 7.31;
    if (hash(seed) > arcShare(charge)) continue;
    const a0 = hash(seed + 1) * Math.PI * 2, span = .6 + 1.8 * hash(seed + 2), rim = i < 4, h3 = hash(seed + 3), rr = R * (rim ? .97 + .15 * h3 : .3 + .55 * h3), amp = 1.6 + 2.2 * q, points = [];
    for (let k = 0; k <= 24; k++) { const u = k / 24, jag = (wiggle(u * 11, seed) - .5) * 2 + (wiggle(u * 29, seed + 5) - .5) * .9 + (Math.abs(((u * 7 + hash(seed + 4)) % 1) - .5) - .25) * 1.6, r = rr + jag * amp * Math.sin(u * Math.PI), a = a0 + u * span; points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
    out.push({ points, width: .5 + .3 * q, alpha: (.55 + .45 * hash(seed + 9)) * (.4 + .6 * charge) });
  }
  return out;
}
export function knobJitter(charge, time, calm) { const j = charge ** 3 * (1 - calm); return { x: Math.sin(time * 53.1) * ARCS.shake * j, y: Math.cos(time * 61.7) * ARCS.shake * j, scale: 1 + .025 * j * Math.sin(time * 37) }; }
