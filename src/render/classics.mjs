// Classic sights of the sky (Owner's request: "the more the better"), drawn
// procedurally after the well-known NASA/ESA/Hubble images. Where a real photo
// is bundled (photos.mjs), the photo is drawn instead while the GPU has the
// budget (uPhotos); the procedural version stays as the fallback. They sit on a sky strip about three views long that drifts past
// with the voyage, so only a few are in view at once; each opening starts at
// a different place along the strip (uSkyOffset).
//
// [name, x on the strip, y, size px, angle rad, aspect, kind, seed, gain]
export const CLASSICS = Object.freeze([
  ['蟹状星云 M1', 60, 300, 28, .5, .75, 0, 1.7, .9],
  ['猫头鹰星云 M97', 190, 62, 20, 0, 1, 1, 2.3, .9],
  ['环状星云 M57', 300, 186, 15, .4, .8, 2, 3.1, 1],
  ['猫眼星云 NGC 6543', 420, 72, 17, .3, 1, 3, 4.6, 1],
  ['螺旋星云 NGC 7293', 560, 302, 32, .2, .9, 4, 5.2, .9],
  ['哑铃星云 M27', 700, 62, 22, .3, .85, 5, 6.4, .9],
  ['蝴蝶星云 NGC 6302', 820, 322, 26, -.2, 1, 6, 7.1, .9],
  ['马头星云 B33', 960, 72, 38, 0, 1, 7, 8.3, .85],
  ['创生之柱 M16', 1100, 300, 40, 0, 1, 8, 9.2, .85],
  ['猎户座大星云 M42', 1250, 72, 44, .2, .9, 9, 1.4, .85],
  ['玫瑰星云 NGC 2237', 1400, 312, 38, 0, 1, 10, 2.8, .8],
  ['气泡星云 NGC 7635', 1530, 62, 24, 0, 1, 11, 3.6, .9],
  ['仙女座星系 M31', 1700, 312, 62, .55, .32, 12, 4.4, .85],
  ['草帽星系 M104', 1880, 62, 30, -.12, .3, 13, 5.9, .9],
  ['涡状星系 M51', 2000, 312, 30, .3, .85, 14, 6.7, .9],
  ['车轮星系', 2120, 72, 26, .4, .8, 15, 7.8, .9],
  ['触须星系 NGC 4038/9', 2250, 302, 32, .3, 1, 16, 8.6, .9],
  ['霍格天体', 2370, 188, 18, 0, 1, 17, 9.5, .95],
  ['面纱星云 NGC 6960', 2480, 322, 46, .2, 1, 18, 1.2, .8],
  ['爱斯基摩星云 NGC 2392', 2560, 194, 13, 0, 1, 19, 2.1, 1],
].map(Object.freeze));
import { PHOTOS } from './photos.mjs';
import { SPACE } from './space.mjs';
export const CLASSIC_STRIP = 2640;
export const classicParallax = size => .3 + .15 * Math.min(1, size / 40);
const num = v => (Number.isInteger(v) ? `${v}.` : String(v));
const twin = name => PHOTOS.some(p => p.classic === name);
const calls = CLASSICS.map(([name, x, y, s, a, t, k, seed, gain]) => `${twin(name) ? 'if(uPhotos<.5)' : ''}{vec4 n=C(p,vec4(${num(x)},${num(y)},${num(s)},${num(a)}),vec4(${num(t)},${num(k)},${num(seed)},${num(gain)}),${num(classicParallax(s))});col=col*(1.-n.a)+n.rgb;}`).join('');
// Expects hash, noise, fbm, speck, galaxy (deep-sky.mjs), uDrift, uSkyOffset.
export const CLASSICS_GLSL = `
uniform float uSkyOffset,uPhotos;
float ridge(float v){return 1.-abs(2.*v-1.);}
float pt(vec2 u,vec2 c,float s){vec2 e=u-c;return exp(-dot(e,e)/(s*s));}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
// rgb: emitted light; a: share of what lies behind that is absorbed.
vec4 classic(vec2 p,vec4 g,vec4 k){
 vec2 d=p-g.xy;float reach=g.z*1.7;if(abs(d.x)>reach||abs(d.y)>reach)return vec4(0.);
 d=rot(g.w)*d;vec2 u=vec2(d.x,d.y/k.x)/g.z,o=d/g.z;float r=length(u),a=atan(u.y,u.x),kind=k.y,seed=k.z;vec3 c=vec3(0.);float ab=0.;
 vec3 warm=vec3(1.,.85,.64),blue=vec3(.55,.72,1.),red=vec3(.95,.36,.34),teal=vec3(.3,.8,.78);
 if(kind<.5){ // Crab: blue-white synchrotron glow laced with an orange-red filament web
  float shape=exp(-r*r*2.2),web=pow(ridge(fbm(u*4.+seed)),4.)*.9+pow(ridge(fbm(u*8.5+seed+3.)),6.)*.6;
  c=vec3(.5,.66,1.)*shape*.5+vec3(1.,.52,.26)*web*shape*1.4+vec3(.9,.95,1.)*pt(u,vec2(0.),.04);
 }else if(kind<1.5){ // Owl: a round pale green-blue disk with two dark eyes
  vec2 e=vec2(abs(u.x)-.3,u.y+.08);float disk=smoothstep(1.05,.55,r)*(.6+.45*fbm(u*3.+seed)),eye=exp(-dot(e,e)/.035);
  c=teal*.7*disk*(1.-.75*eye)+red*exp(-pow((r-.95)/.14,2.))*.12;
 }else if(kind<2.5){ // Ring: a thick ellipse, teal inside turning red at its rim
  float ring=exp(-pow((r-.62)/.17,2.))*(.8+.4*fbm(u*6.+seed));
  c=mix(teal,red,smoothstep(.5,.8,r))*ring*1.2+vec3(.4,.6,.95)*exp(-r*r*6.)*.25+vec3(.9,.95,1.)*pt(u,vec2(0.),.04);
 }else if(kind<3.5){ // Cat's Eye: nested thin shells at angles, a halo and a hot central star
  float sh=0.;for(int i=0;i<3;i++){vec2 v=rot(float(i)*1.05+seed)*u;v.y/=.6;float rr=length(v);sh+=exp(-pow((rr-.45-.08*float(i))/.11,2.))*(.4+.8*fbm(v*5.+float(i)+seed));}
  c=mix(vec3(.4,.88,.65),vec3(.95,.5,.55),smoothstep(.35,.7,r))*sh*.45+vec3(.6,.8,1.)*exp(-r*r*9.)*.55+red*.12*smoothstep(1.5,.9,r)*smoothstep(.7,1.,r)*(.5+fbm(vec2(r*18.,a)))+vec3(1.)*pt(u,vec2(0.),.04);
 }else if(kind<4.5){ // Helix: a blue inner disk, a broad red ring sown with comet-like knots
  float ring=exp(-pow((r-.62)/.22,2.))*(.7+.5*fbm(u*5.+seed));
  c=vec3(.3,.62,.95)*smoothstep(.75,.25,r)*.45*(.6+.5*fbm(u*3.+seed))+red*ring+vec3(1.,.75,.6)*speck(u*18.,seed,.6)*ring*.9;
 }else if(kind<5.5){ // Dumbbell: an apple-core glow, green inside, red outside
  vec2 bl=vec2(abs(u.x)-.78,u.y);float dens=exp(-r*r*1.6)*(1.-.85*exp(-dot(bl,bl)/.09))*(.7+.4*fbm(u*4.+seed));
  c=mix(vec3(.45,.9,.55),red,smoothstep(.3,.85,r))*dens*1.2;
 }else if(kind<6.5){ // Butterfly: two wings flaring from a bright waist
  vec2 v=vec2(abs(u.x)-.55,u.y);float wing=exp(-v.x*v.x/.13-v.y*v.y/(.02+.12*abs(u.x)))*(.6+.6*fbm(u*5.+seed));
  c=mix(vec3(.85,.9,1.),red,smoothstep(.2,.9,abs(u.x)))*wing*1.2+vec3(1.,.95,.9)*exp(-r*r*40.)*.9;
 }else if(kind<7.5){ // Horsehead: a dark horse head rising against glowing red gas
  float glow=smoothstep(1.3,.2,length(u*vec2(.7,1.)))*(.55+.55*fbm(u*3.+seed));
  float cloud=smoothstep(.15,.45,u.y+.12*(fbm(u*4.+seed)-.5)),neck=smoothstep(.26,.12,abs(u.x+.02+u.y*.15)-max(0.,u.y)*.25)*smoothstep(-.2,-.02,u.y);
  float head=smoothstep(1.,.75,length((u-vec2(.06,-.33))/vec2(.24,.21))),snout=smoothstep(1.,.75,length((u-vec2(.3,-.2))/vec2(.2,.11))),ear=smoothstep(1.,.75,length((u-vec2(-.06,-.54))/vec2(.07,.12)));
  float dark=clamp(cloud+neck+head+snout+ear,0.,1.)*(.8+.2*fbm(u*9.+seed));
  c=red*.75*glow*(1.-dark)+vec3(1.,.6,.5)*glow*dark*(1.-dark)*1.5;ab=dark*.9*smoothstep(1.5,.6,r);
 }else if(kind<8.5){ // Pillars of Creation: dark columns with bright golden rims in teal-gold gas
  float glow=smoothstep(1.4,.3,r)*(.6+.5*fbm(u*2.5+seed)),pil=0.,rim=0.;
  for(int i=0;i<3;i++){float fi=float(i),x0=-.45+fi*.4,top=-.75+fi*.3,w=(.11-fi*.02)*(1.+.9*smoothstep(top,1.1,u.y));float bend=.1*sin(u.y*2.+fi*2.)+(u.y-1.)*.1;float edge=.3*(fbm(u*6.+fi*3.+seed)-.5);float dx=abs(u.x-x0-bend)/w+edge;float cap=length(vec2((u.x-x0-bend)/w,(u.y-top)/(w*1.2)));float inside=max(smoothstep(1.1,.8,dx)*step(top,u.y),smoothstep(1.1,.8,cap+edge))*step(u.y,1.15);pil=max(pil,inside);rim=max(rim,inside*(1.-inside)*4.*smoothstep(.4,-.2,u.y-top));}
  c=mix(vec3(.22,.5,.55),vec3(.85,.65,.4),.4+.3*fbm(u*2.+seed))*glow*(1.-pil)+vec3(.28,.17,.11)*pil*.45+vec3(1.,.8,.5)*rim*.8;ab=pil*.85;
 }else if(kind<9.5){ // Orion: a bright fan of gas, a dark bay and the Trapezium stars
  float body=exp(-r*r*1.4)*(.6+.6*fbm(u*3.+seed)),core=exp(-r*r*7.),bay=exp(-dot(u-vec2(-.4,-.25),u-vec2(-.4,-.25))/.05);
  c=(vec3(.95,.45,.55)*body*.9+vec3(.5,.85,.85)*core*.9)*(1.-.7*bay);for(int i=0;i<4;i++){float fi=float(i);c+=vec3(.95,.97,1.)*pt(u,vec2(-.05+.08*mod(fi,2.),-.04+.07*floor(fi/2.)),.03);}
 }else if(kind<10.5){ // Rosette: a thick ring of red gas around a hollow with a young cluster
  float ring=exp(-pow((r-.6)/.24,2.))*(.55+.7*fbm(u*3.5+seed));
  c=red*ring+vec3(.8,.88,1.)*speck(u*10.,seed,.75)*exp(-r*r*4.)*1.4;
 }else if(kind<11.5){ // Bubble: a thin glowing sphere blown by an off-centre star, red gas around
  float shell=exp(-pow((r-.55)/.04,2.))*(.6+.4*fbm(u*6.+seed));
  c=vec3(.55,.75,1.)*shell+red*fbm(u*2.5+seed)*smoothstep(1.4,.6,r)*smoothstep(.45,.7,r)*.45+vec3(1.)*pt(u,vec2(.18,.1),.04);
 }else if(kind<12.5){ // Andromeda: a great tilted spiral with its two companions
  vec3 m31=galaxy(p,g,vec4(k.x,0.,seed,1.));
  c=m31+warm*(pt(o,vec2(.18,.32),.05)*1.1+exp(-dot((o-vec2(-.35,-.55))/vec2(.12,.06),(o-vec2(-.35,-.55))/vec2(.12,.06)))*.5);
 }else if(kind<13.5){ // Sombrero: a broad warm bulge cut by a sharp dark lane
  vec2 v=o*vec2(1.,1.7);float bulge=exp(-dot(v,v)*3.),disk=exp(-abs(u.x)*1.8)*exp(-u.y*u.y*2.)*smoothstep(1.3,.8,abs(u.x));
  float lane=1.-.85*exp(-pow((u.y-.08)/.2,2.))*smoothstep(1.15,.0,abs(u.x));
  c=warm*(bulge*1.2+disk*.7)*lane+warm*exp(-pow((length(u)-.95)/.08,2.))*.2*smoothstep(.0,.3,abs(u.y));
 }else if(kind<14.5){ // Whirlpool: a face-on spiral with a companion at the end of an arm
  c=galaxy(p,g,vec4(k.x,0.,seed,1.))+warm*exp(-dot(o-vec2(.9,.6),o-vec2(.9,.6))/.04)*.9;
 }else if(kind<15.5){ // Cartwheel: a blue ring of new stars, an inner ring, faint spokes
  float outer=exp(-pow((r-.82)/.1,2.))*(.6+.6*fbm(u*6.+seed)),inner=exp(-pow((r-.25)/.07,2.)),spokes=pow(.5+.5*cos(a*12.),8.)*smoothstep(.25,.6,r)*smoothstep(.85,.6,r);
  c=blue*outer+vec3(1.,.55,.7)*speck(u*16.,seed,.7)*outer*1.5+warm*(inner*.8+exp(-r*r*60.))+blue*spokes*.15;
 }else if(kind<16.5){ // Antennae: two colliding cores and long curved tidal tails
  float b1=exp(-dot(u-vec2(-.18,0.),u-vec2(-.18,0.))*14.),b2=exp(-dot(u-vec2(.2,.12),u-vec2(.2,.12))*16.);
  float t1=exp(-pow((length(u-vec2(.55,-.65))-.85)/.07,2.))*smoothstep(.1,-.5,u.x)*smoothstep(1.6,.8,r),t2=exp(-pow((length(u-vec2(-.55,.75))-.85)/.07,2.))*smoothstep(-.1,.5,u.x)*smoothstep(1.6,.8,r);
  float knots=speck(u*14.,seed,.8)*(b1+b2);
  c=warm*(b1+b2)*1.1+vec3(.75,.8,.95)*(t1+t2)*.5+vec3(1.,.5,.65)*knots*1.6;
 }else if(kind<17.5){ // Hoag's Object: a yellow core, an empty gap and a perfect blue ring
  c=warm*exp(-r*r*45.)*1.4+blue*exp(-pow((r-.75)/.08,2.))*(.7+.4*fbm(u*8.+seed))+vec3(.85,.9,1.)*speck(u*20.,seed,.75)*exp(-pow((r-.75)/.1,2.));
 }else if(kind<18.5){ // Veil: a long arc of braided teal and red filaments
  float arc=length(u-vec2(0.,1.2))-1.25,span=smoothstep(1.1,.6,abs(u.x)),f1=pow(ridge(fbm(u*6.+seed)),5.),f2=pow(ridge(fbm(u*6.+seed+2.)),5.);
  c=(teal*exp(-pow(arc/.08,2.))*f1+red*exp(-pow((arc-.06)/.09,2.))*f2)*span*1.6;
 }else{ // Eskimo: a bright blue-white face inside an orange fur-like ring
  c=vec3(.7,.85,1.)*exp(-r*r*10.)*(.6+.5*fbm(u*5.+seed))+vec3(1.,.6,.35)*exp(-pow((r-.72)/.13,2.))*(.4+.8*fbm(vec2(a*8.,r*6.)+seed))+vec3(1.)*pt(u,vec2(0.),.05);
 }
 return vec4(c*k.w,ab);}
vec4 C(vec2 p,vec4 g,vec4 k,float par){float m=g.z*1.7+10.;g.x=mod(g.x-uDrift*par-uSkyOffset+m,${CLASSIC_STRIP}.)-m;return classic(p,g,k);}
vec3 classics(vec2 p,vec3 col){${calls}return col;}
`;
// Where each photo sits on the strip: in place of its procedural twin (same
// spot, same parallax), or at its own spot. hw/hh: on-screen half size; uv:
// its rectangle in the atlas (tiles of 256 px, 4 per row, image centred).
export const PHOTO_PLACES = Object.freeze(PHOTOS.map((p, tile) => {
  const c = CLASSICS.find(k => k[0] === p.classic), [x, y] = c ? [c[1], c[2]] : p.strip, [, , w, h] = p.crop;
  const scale = Math.min(256 / w, 256 / h), tw = Math.round(w * scale) / 1024, th = Math.round(h * scale) / 768, u = ((tile % 4) * 256 + 128) / 1024, v = (Math.floor(tile / 4) * 256 + 128) / 768;
  return Object.freeze({ id: p.id, tile, x, y, hw: p.radius * Math.min(1, w / h), hh: p.radius * Math.min(1, h / w), parallax: classicParallax(c ? c[3] : p.radius * .8), uv: Object.freeze([u - tw / 2, v - th / 2, u + tw / 2, v + th / 2]) });
}));
// The photos in view: same drift and wrap as C() in the shader.
export function photoSprites(drift, offset) {
  return PHOTO_PLACES.flatMap(s => {
    const m = Math.max(s.hw, s.hh) + 10, x = (((s.x - drift * s.parallax - offset + m) % CLASSIC_STRIP) + CLASSIC_STRIP) % CLASSIC_STRIP - m;
    return x - s.hw > SPACE.width ? [] : [{ ...s, x }];
  });
}
// Strip offset for a new world: each opening shows a different stretch.
export const classicOffset = random => random() * CLASSIC_STRIP;
