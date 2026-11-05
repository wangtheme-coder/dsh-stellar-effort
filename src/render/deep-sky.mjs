import { SPACE } from './space.mjs';
// The far deep sky beyond the rail (Phase 5): galaxies of the main kinds seen in
// NASA/ESA imagery, a dusty Milky Way band and the glow of near passing stars.
// Everything is procedural; denser than the real sky by design.
//
// Galaxy kinds: 0 spiral (warm bulge, blue knotted arms, dark dust lanes),
// 1 barred spiral, 2 edge-on disk (thin, central dust lane), 3 elliptical
// (smooth, warm, no structure), 4 irregular (grainy, blue clumps).
// [x, y, size px, angle rad, tilt (minor/major), kind, seed, gain]. Placed off
// the rail band; they drift slowly with the voyage (bigger = a little nearer).
export const GALAXIES = Object.freeze([
  [150, 78, 30, .5, .55, 0, 1.3, .85],
  [700, 300, 19, -.35, .7, 0, 4.1, .8],
  [430, 198, 11, 1.1, .92, 0, 7.7, .75],
  [330, 322, 17, .9, .6, 1, 2.6, .8],
  [770, 74, 27, -.24, .13, 2, 5.2, .8],
  [64, 300, 12, .42, .18, 2, 8.4, .7],
  [566, 338, 13, .3, .75, 3, 3.3, .7],
  [246, 36, 7, 0, .85, 3, 6.6, .6],
  [826, 228, 28, .2, .7, 4, 9.1, .8],
  [36, 150, 10, 1.4, .7, 4, 2.2, .7],
  [404, 292, 5, .7, .7, 3, 1.1, .55],
  [628, 112, 6, -.6, .4, 0, 5.9, .6],
].map(Object.freeze));
// Lateral parallax of a galaxy (fraction of the near-star sail): slower than
// the near stars, but enough to see them drift (≈1–2.5 px/s at quiet Max,
// ≈40–75 px/s in full overdrive).
export const galaxyParallax = size => .25 + .25 * Math.min(1, size / 30);
// Milky Way band: a straight diagonal through these two world points.
export const MILKY_WAY = Object.freeze({ from: [0, 250], to: [SPACE.width, 22], width: 52, parallax: .06 });
// Deep nebulae, few but distinct: 0 emission (red-pink H-alpha glow with
// magenta outskirts, dark filaments and young stars), 1 reflection (blue haze
// around a bright star), 2 planetary (small glowing ring), 3 dark (an absorbing
// cloud that hides the stars and Milky Way behind it).
// [x, y, size px, angle rad, aspect, kind, seed, gain]
export const NEBULAE = Object.freeze([
  [590, 92, 58, .3, .7, 0, 2.7, .55],
  [110, 258, 34, -.5, .8, 0, 6.1, .5],
  [738, 252, 26, 0, .9, 1, 4.4, .55],
  [420, 334, 7, .4, 1, 2, 1.9, .85],
  [196, 186, 34, -.4, .5, 3, 8.8, .75],
].map(Object.freeze));
export const nebulaParallax = size => .15 + .15 * Math.min(1, size / 60);
// Other sights of the deep sky, after NASA/ESA imagery: 0 supernova remnant
// (a broken shell of teal and red filaments around a faint pulsar, like the
// Crab or Veil), 1 galaxy cluster (a crowd of small warm ellipticals around a
// bright central giant, with a faint common glow), 2 open star cluster (a few
// hot blue-white stars in a blue reflection haze, like the Pleiades),
// 3 globular cluster (a dense round ball of old yellowish stars).
// [x, y, size px, angle rad, aspect, kind, seed, gain]
export const SIGHTS = Object.freeze([
  [360, 100, 26, .5, .85, 0, 3.7, .8],
  [800, 330, 14, -.3, .9, 0, 7.3, .7],
  [230, 266, 20, .2, .8, 1, 5.5, .8],
  [690, 150, 18, 0, .9, 2, 2.4, .8],
  [40, 62, 10, 0, 1, 3, 6.2, .85],
  [400, 182, 7, 0, 1, 3, 1.4, .7],
].map(Object.freeze));
export const sightParallax = size => .2 + .2 * Math.min(1, size / 26);
export const PASSER_SLOTS = 3;
const num = v => (Number.isInteger(v) ? `${v}.` : String(v));
const glslNebulae = NEBULAE.map(([x, y, s, a, t, k, seed, gain]) => `N(p,vec4(${num(x)},${num(y)},${num(s)},${num(a)}),vec4(${num(t)},${num(k)},${num(seed)},${num(gain)}),${num(nebulaParallax(s))})`);
const glslSights = SIGHTS.map(([x, y, s, a, t, k, seed, gain]) => `S(p,vec4(${num(x)},${num(y)},${num(s)},${num(a)}),vec4(${num(t)},${num(k)},${num(seed)},${num(gain)}),${num(sightParallax(s))})`);
const glslGalaxies = GALAXIES.map(([x, y, s, a, t, k, seed, gain]) => `G(p,vec4(${num(x)},${num(y)},${num(s)},${num(a)}),vec4(${num(t)},${num(k)},${num(seed)},${num(gain)}),${num(galaxyParallax(s))})`).join(';');
// Expects hash, noise, fbm, fieldStars, uDrift, uPassers[], uPasserTint[].
export const DEEP_SKY_GLSL = `
uniform vec4 uPassers[${PASSER_SLOTS}];uniform vec3 uPasserTint[${PASSER_SLOTS}];
// A round point of light in some cells of a grid (q in cell units): star knots
// and grains, never filled squares.
float speck(vec2 q,float seed,float rarity){vec2 g=floor(q),f=fract(q);if(hash(g+seed)<rarity)return 0.;vec2 c=vec2(hash(g+seed+3.1),hash(g+seed+7.7))*.6+.2,d=f-c;return exp(-dot(d,d)*40.);}
vec3 galaxy(vec2 p,vec4 g,vec4 k){
 vec2 d=p-g.xy;float reach=g.z*1.9;if(abs(d.x)>reach||abs(d.y)>reach)return vec3(0.);
 float c=cos(g.w),s=sin(g.w);d=mat2(c,-s,s,c)*d;vec2 u=vec2(d.x,d.y/k.x)/g.z;float r=length(u),a=atan(u.y,u.x),kind=k.y,seed=k.z;
 vec3 warm=vec3(1.,.85,.64),cool=vec3(.6,.73,1.);vec3 col;
 if(kind<1.5){
  // Logarithmic trailing arms with flocculent breakup; dust lanes run along
  // the arms' inner edges; blue-white knots of young stars (and a few pink
  // emission knots) sit on the arms.
  float ph=2.*(a+seed)-log(max(r,.06))*3.3,arm=pow(.5+.5*cos(ph),3.),dust=pow(.5+.5*cos(ph+1.15),7.);
  float floc=.55+.9*noise(u*8.+seed*7.),disk=exp(-r*2.5)*smoothstep(1.45,.5,r),bulge=exp(-r*r*(kind>.5?20.:28.));
  float bar=kind>.5?exp(-pow(u.x/.48,2.)-pow(u.y/.11,2.)):0.;
  float h=hash(floor(u*24.)+seed+1.),knot=speck(u*24.,seed,.88)*arm*disk*2.2;
  col=cool*disk*(.3+1.1*arm*floc)+mix(vec3(.75,.85,1.),vec3(1.,.55,.8),step(.97,h))*knot*.7+warm*(bulge*1.7+bar*1.);
  col*=1.-.6*dust*disk*smoothstep(.1,.32,r);
 }else if(kind<2.5){
  // Edge-on: a thin bright disk, a rounder warm bulge and a dark dust lane
  // just off the midplane.
  float disk=exp(-abs(u.x)*2.5)*exp(-u.y*u.y*1.6)*smoothstep(1.3,.75,abs(u.x)),bulge=exp(-(u.x*u.x+u.y*u.y*k.x*k.x*4.)*14.);
  float lane=1.-.78*exp(-pow((u.y-.18)/.32,2.))*smoothstep(1.,.12,abs(u.x));
  col=(mix(cool,warm,.55)*disk*.95+warm*bulge*1.5)*lane;
 }else if(kind<3.5){
  // Elliptical: smooth, warm, centrally concentrated, fading into a faint halo.
  col=warm*(exp(-r*5.)*1.25+exp(-r*1.7)*.22)*smoothstep(1.85,.8,r);
 }else{
  // Irregular starburst (after Hubble images such as NGC 4449): a lumpy
  // blue-white haze crowded with resolved stars, a brighter centre, pink
  // star-forming knots and dark dust filaments threading through.
  vec2 w=u+.25*vec2(fbm(u*1.6+seed),fbm(u*1.6+seed+5.))-.12;float rw=length(w);
  float body=exp(-rw*rw*1.6)*smoothstep(1.6,.5,rw),clump=smoothstep(.4,.75,fbm(w*2.6+seed));
  float stars=speck(w*34.,seed*3.,.55)*(.4+.6*clump),knots=speck(w*9.,seed+4.,.78)*(.4+.6*clump),dust=smoothstep(.55,.7,fbm(w*5.+seed+9.));
  col=(vec3(.55,.7,1.)*body*(.25+.6*clump)+vec3(1.,.93,.88)*exp(-rw*rw*9.)*.9+vec3(.75,.88,1.)*stars*body*1.6+vec3(1.,.45,.55)*knots*body*2.2)*(1.-.4*dust*body*smoothstep(.12,.45,rw))*1.2;
 }
 return col*k.w;}
// Drifting placement: the galaxy slides left with the voyage, wrapped across
// the world (with a margin so it never pops in view).
vec3 G(vec2 p,vec4 g,vec4 k,float par){float m=g.z*2.+10.,w=${SPACE.width}.+2.*m;g.x=mod(g.x-uDrift*par+m,w)-m;return galaxy(p,g,k);}
vec3 galaxies(vec2 p){vec3 col=vec3(0.);${GALAXIES.map((_, i) => `col+=${glslGalaxies.split(';')[i]};`).join('')}return col;}
vec3 milkyWay(vec2 p){
 vec2 q=p+vec2(uDrift*${MILKY_WAY.parallax},0.),a=vec2(${num(MILKY_WAY.from[0])},${num(MILKY_WAY.from[1])}),b=vec2(${num(MILKY_WAY.to[0])},${num(MILKY_WAY.to[1])}),n=normalize(vec2(a.y-b.y,b.x-a.x));
 float dist=dot(q-a,n),wob=(fbm(q*.006+2.)-.5)*40.,band=exp(-pow((dist+wob)/${num(MILKY_WAY.width)},2.));if(band<.01)return vec3(0.);
 float glow=band*(.45+.8*fbm(q*.016+vec2(4.,9.))),lanes=smoothstep(.5,.72,fbm(q*.028+vec2(13.,1.)))*band;
 float haze=fieldStars(q,3.,.6)*band;
 return (vec3(.56,.45,.36)*glow*.17+vec3(.9,.88,.84)*haze*.55)*(1.-.65*lanes);}
// rgb: emitted light; a: how much of what lies behind is absorbed.
vec4 nebula(vec2 p,vec4 g,vec4 k){
 vec2 d=p-g.xy;float reach=g.z*1.7;if(abs(d.x)>reach||abs(d.y)>reach)return vec4(0.);
 float c=cos(g.w),s=sin(g.w);d=mat2(c,-s,s,c)*d;vec2 u=vec2(d.x,d.y/k.x)/g.z;float r=length(u),kind=k.y,seed=k.z;
 if(kind<.5){
  float body=fbm(u*2.2+seed),fine=fbm(u*5.5+seed*2.),dens=exp(-r*r*1.6)*smoothstep(.3,.75,body)*(.6+.6*fine);
  float lanes=smoothstep(.55,.72,fbm(u*4.+seed+7.));dens*=1.-.75*lanes;
  vec3 col=mix(vec3(.72,.28,.72),vec3(.95,.3,.38),smoothstep(.2,.9,dens*1.6))*dens*1.2;
  float young=speck(u*14.,seed,.93)*exp(-r*r*2.5);
  return vec4((col+vec3(.75,.85,1.)*young*.9)*k.w,.15*dens);
 }else if(kind<1.5){
  float dens=exp(-r*r*2.2)*(.5+.6*fbm(u*3.+seed));
  return vec4((vec3(.35,.52,1.)*dens*.7+vec3(.9,.95,1.)*exp(-r*r*120.)*1.4)*k.w,.1*dens);
 }else if(kind<2.5){
  float ring=exp(-pow((r-.62)/.16,2.)),inner=exp(-r*r*3.)*.5;
  return vec4((vec3(.3,.9,.82)*inner+mix(vec3(.3,.85,.85),vec3(.95,.4,.45),smoothstep(.55,.8,r))*ring)*k.w,0.);
 }
 float dens=exp(-r*r*1.4)*smoothstep(.35,.7,fbm(u*2.6+seed));
 return vec4(vec3(.03,.02,.02)*dens,clamp(dens*1.3,0.,.85)*k.w);}
vec4 N(vec2 p,vec4 g,vec4 k,float par){float m=g.z*1.7+10.,w=${SPACE.width}.+2.*m;g.x=mod(g.x-uDrift*par+m,w)-m;return nebula(p,g,k);}
// Nebulae over the sky so far: dark clouds absorb, the rest glow.
vec3 nebulae(vec2 p,vec3 col){${glslNebulae.map(x => `{vec4 n=${x};col=col*(1.-n.a)+n.rgb;}`).join('')}return col;}
vec3 sight(vec2 p,vec4 g,vec4 k){
 vec2 d=p-g.xy;float reach=g.z*1.6;if(abs(d.x)>reach||abs(d.y)>reach)return vec3(0.);
 float c=cos(g.w),s=sin(g.w);d=mat2(c,-s,s,c)*d;vec2 u=vec2(d.x,d.y/k.x)/g.z;float r=length(u),a=atan(u.y,u.x),kind=k.y,seed=k.z;
 if(kind<.5){
  // Supernova remnant: a shell broken into filaments, teal outside, red inside.
  float wob=.12*(fbm(vec2(a*2.,seed))-.5),shell=exp(-pow((r-.72-wob)/.07,2.)),fil=smoothstep(.35,.75,fbm(vec2(a*9.,r*14.)+seed))*(.5+.5*fbm(u*9.+seed));
  float inner=exp(-pow((r-.55-wob)/.12,2.))*smoothstep(.5,.8,fbm(u*7.+seed+3.));
  return (vec3(.3,.78,.92)*shell*fil*1.3+vec3(.95,.35,.32)*inner*.9+vec3(.5,.55,.8)*exp(-r*r*3.)*.08+vec3(.85,.9,1.)*exp(-r*r*900.))*k.w;
 }else if(kind<1.5){
  // Galaxy cluster: many small warm ellipticals, a bright central giant.
  float members=0.;for(int i=0;i<14;i++){float fi=float(i);vec2 o=(vec2(hash(vec2(fi,seed)),hash(vec2(seed,fi)))-.5)*1.9;float rr=length(u-o)*(6.+5.*hash(vec2(fi+3.,seed)));members+=exp(-rr*rr)*(.35+.65*hash(vec2(fi,seed+2.)))*exp(-dot(o,o)*.8);}
  return (vec3(1.,.86,.66)*(members*.9+exp(-r*r*40.)*1.3+exp(-r*r*2.)*.06))*k.w;
 }else if(kind<2.5){
  // Open cluster: hot blue-white stars with tiny spikes in a blue haze.
  float bright=0.;for(int i=0;i<9;i++){float fi=float(i);vec2 o=(vec2(hash(vec2(fi,seed+1.)),hash(vec2(seed+1.,fi)))-.5)*1.7;vec2 q=(u-o)*g.z;float rr=length(q),m=.5+.5*hash(vec2(fi,seed+5.));bright+=(exp(-rr*rr*.9)*1.4+(exp(-abs(q.y)*2.)*exp(-abs(q.x)*.35)+exp(-abs(q.x)*2.)*exp(-abs(q.y)*.35))*.18)*m;}
  return (vec3(.75,.85,1.)*bright+vec3(.3,.45,.95)*exp(-r*r*1.5)*(.4+.6*fbm(u*3.+seed))*.22)*k.w;
 }
 // Globular cluster: a dense ball of old stars, resolved toward the edge.
 float ball=exp(-r*r*3.2),stars=speck(u*22.,seed,.45)*exp(-r*r*1.2);
 return (vec3(1.,.9,.72)*(ball*.55+exp(-r*r*20.)*.6)+vec3(1.,.95,.85)*stars*.9)*k.w;}
vec3 S(vec2 p,vec4 g,vec4 k,float par){float m=g.z*1.6+10.,w=${SPACE.width}.+2.*m;g.x=mod(g.x-uDrift*par+m,w)-m;return sight(p,g,k);}
vec3 sights(vec2 p){vec3 col=vec3(0.);${glslSights.map(x => `col+=${x};`).join('')}return col;}
// Near passing stars: a small bright sphere, a soft halo, a faint corona and
// thin diffraction spikes.
vec3 passers(vec2 p){vec3 col=vec3(0.);for(int i=0;i<${PASSER_SLOTS};i++){vec4 s=uPassers[i];if(s.w<.002)continue;vec2 d=p-s.xy;float r=length(d),z=s.z;if(r>z*16.)continue;
 float core=exp(-r*r/(z*z)),halo=exp(-r/(z*3.4))*.32,corona=exp(-pow((r-z*1.7)/(z*.4),2.))*.1,spikes=(exp(-abs(d.y)/.55)*exp(-abs(d.x)/(z*6.))+exp(-abs(d.x)/.55)*exp(-abs(d.y)/(z*6.)))*.14;
 col+=(uPasserTint[i]*(halo+corona+spikes)+mix(uPasserTint[i],vec3(1.),.7)*core*1.5)*s.w;}return col;}
`;
