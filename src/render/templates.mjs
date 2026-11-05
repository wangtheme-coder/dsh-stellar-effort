import { SPACE } from './space.mjs';
// Procedural template atlas: the many small, far objects of the sky. Ten
// parametric templates (after the galaxy and nebula types in NASA/ESA images)
// each give dozens of different objects from random parameters. They are
// painted once into an atlas on the GPU (TEMPLATE_BAKE) and then only drawn as
// sprites, so the main shaders do not grow. They lie on a long strip of sky
// that drifts with the voyage, like the classic sights, but further away.
export const TEMPLATE_KINDS = Object.freeze(['spiral', 'barred', 'edge-on', 'elliptical', 'irregular', 'interacting', 'emission', 'planetary', 'remnant', 'cluster']);
// How often each kind appears (galaxies and clusters are the most common).
const WEIGHTS = [18, 10, 12, 16, 12, 6, 8, 6, 5, 15];
export const TEMPLATE_ATLAS = Object.freeze({ width: 1024, height: 512, tile: 64, pad: 2, count: 128 });
export const TEMPLATE_STRIP = 6400;
// Not over the rail: objects keep this far above or below its centre line.
export const TEMPLATE_CLEAR = 42;
export const templateParallax = size => .16 + .12 * Math.min(1, size / 24);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (random, weights) => { let r = random() * weights.reduce((s, w) => s + w, 0); for (let i = 0; i < weights.length; i++) if ((r -= weights[i]) < 0) return i; return weights.length - 1; };
// One fixed set of objects (the strip offset changes per opening instead).
// a = (kind, seed, angle, aspect), b = (hue 0-1, gain, variant 0-1, 0).
export const TEMPLATE_OBJECTS = Object.freeze(Array.from({ length: TEMPLATE_ATLAS.count }, (_, i) => {
  const random = rng(9173 + i * 7919), kind = pick(random, WEIGHTS), roll = random();
  const size = roll < .7 ? 4 + 5 * random() : roll < .95 ? 9 + 7 * random() : 16 + 10 * random();
  const aspect = kind === 2 ? .16 + .1 * random() : kind === 3 ? .55 + .45 * random() : kind === 9 || kind === 7 ? .85 + .15 * random() : .35 + .65 * random();
  const side = random() < .5 ? -1 : 1, y = SPACE.centerY + side * (TEMPLATE_CLEAR + random() * (SPACE.centerY - TEMPLATE_CLEAR - 8));
  const x = (i + .15 + .7 * random()) * TEMPLATE_STRIP / TEMPLATE_ATLAS.count;
  const cols = TEMPLATE_ATLAS.width / TEMPLATE_ATLAS.tile, tx = (i % cols) * TEMPLATE_ATLAS.tile, ty = Math.floor(i / cols) * TEMPLATE_ATLAS.tile, { pad, tile } = TEMPLATE_ATLAS;
  return Object.freeze({
    kind: TEMPLATE_KINDS[kind], x, y, size, parallax: templateParallax(size),
    a: Object.freeze([kind, 1 + random() * 40, random() * Math.PI, aspect]), b: Object.freeze([random(), .45 + .45 * random(), random(), 0]),
    rect: Object.freeze([tx + pad, ty + pad, tx + tile - pad, ty + tile - pad]),
    uv: Object.freeze([(tx + pad) / TEMPLATE_ATLAS.width, (ty + pad) / TEMPLATE_ATLAS.height, (tx + tile - pad) / TEMPLATE_ATLAS.width, (ty + tile - pad) / TEMPLATE_ATLAS.height]),
  });
}));
// The objects in view: the strip drifts like the classic sights (slower, as it
// is further), offset per opening.
export function templateSprites(drift, offset) {
  return TEMPLATE_OBJECTS.flatMap(o => {
    const m = o.size + 4, x = (((o.x - drift * o.parallax - offset * 2.27 + m) % TEMPLATE_STRIP) + TEMPLATE_STRIP) % TEMPLATE_STRIP - m;
    return x - o.size > SPACE.width ? [] : [{ x, y: o.y, hw: o.size, hh: o.size, uv: o.uv }];
  });
}
// Vertices for the bake: per corner atlas pixel, tile coordinate (-1..1) and
// the object's parameters.
export function templateBakeVertices() {
  const out = [];
  for (const o of TEMPLATE_OBJECTS) {
    const [l, t, r, b] = o.rect, corner = (x, y, u, v) => out.push(x, y, u, v, ...o.a, ...o.b);
    corner(l, t, -1, -1); corner(r, t, 1, -1); corner(l, b, -1, 1); corner(l, b, -1, 1); corner(r, t, 1, -1); corner(r, b, 1, 1);
  }
  return new Float32Array(out);
}
export const TEMPLATE_STRIDE = 12;
const W = TEMPLATE_ATLAS.width, H = TEMPLATE_ATLAS.height;
export const TEMPLATE_BAKE_VERTEX = `#version 300 es
in vec2 aXY;in vec2 aW;in vec4 aA;in vec4 aB;out vec2 vW;flat out vec4 vA;flat out vec4 vB;
void main(){gl_Position=vec4(aXY/vec2(${W}.,${H}.)*2.-1.,0.,1.);vW=aW;vA=aA;vB=aB;}`;
// Straight (not premultiplied) colour; transparent texels keep the object's
// colour so the mipmaps have no dark fringes.
export const TEMPLATE_BAKE = `#version 300 es
precision highp float;in vec2 vW;flat in vec4 vA;flat in vec4 vB;out vec4 outColor;
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n2(p);p=p*2.03+7.1;a*=.5;}return s;}
vec2 rot(vec2 p,float a){float c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
// Stars of a cluster: bright points in hashed cells, denser to the centre.
float stars(vec2 p,float sd,float dens,float r){vec2 g=p*14.,i=floor(g),f=fract(g)-.5;float h=h1(i+sd),on=step(1.-dens*exp(-r*r*3.),h);vec2 o=vec2(h1(i+sd+3.),h1(i+sd+5.))-.5;return on*exp(-dot(f-o*.6,f-o*.6)*90.)*(.5+.5*h1(i+sd+9.));}
// A disc galaxy: warm bulge, blue arms with knots and dust on their inside.
vec4 disc(vec2 q,float sd,float wind,float bar,float hue){float r=length(q),th=atan(q.y,q.x);
 float arm=pow(.5+.5*cos(2.*(th-log(r+.05)*wind-sd)),3.),knots=.6+.8*fb(q*9.+sd);
 float body=exp(-r/.32)*(.35+.9*arm*knots),bulge=exp(-r*r/(.018+.02*bar)),barL=bar*exp(-(q.x*q.x/.16+q.y*q.y/.004));
 float dust=pow(.5+.5*cos(2.*(th-log(r+.05)*wind-sd)-.6),6.)*exp(-r/.4)*.5;
 vec3 arms=mix(vec3(.55,.68,1.),vec3(.8,.72,1.),hue),c=arms*body*(1.-dust)+vec3(1.,.86,.62)*(bulge+barL)*1.4;
 return vec4(c,clamp(max(max(c.r,c.g),c.b),0.,1.));}
vec4 shape(vec2 w){int k=int(vA.x+.5);float sd=vA.y,hue=vB.x,va=vB.z;vec2 p=rot(w,vA.z),q=vec2(p.x,p.y/vA.w);float r=length(q);vec3 c=vec3(0.);float a=0.;
 if(k==0||k==1){vec4 d=disc(q,sd,1.6+1.6*va,float(k),hue);c=d.rgb;a=d.a;}
 else if(k==2){float lane=1.-.8*exp(-pow((p.y-.015)/.022,2.))*smoothstep(.85,.3,abs(p.x));float disk=exp(-abs(p.x)/.33)*exp(-abs(p.y)/(.05+.1*vA.w));c=(mix(vec3(.85,.85,.95),vec3(1.,.9,.75),hue)*disk+vec3(1.,.85,.6)*exp(-(p.x*p.x+4.*p.y*p.y)/.02))*lane*1.3;a=max(max(c.r,c.g),c.b);}
 else if(k==3){float l=min(1.,exp(-4.5*(pow(r,.5)-.12)))*smoothstep(1.,.5,r);c=mix(vec3(1.,.84,.64),vec3(1.,.93,.8),hue)*l;a=l;}
 else if(k==4){float g=smoothstep(.35,.85,fb(q*3.+sd))*exp(-r*r*2.2);float knots=pow(fb(q*7.+sd+9.),4.)*3.;c=mix(vec3(.55,.7,1.),vec3(1.,.5,.7),smoothstep(.3,.6,knots)*.7)*(g+knots*g);a=g;}
 else if(k==5){vec2 o=vec2(.36,0.);vec4 d1=disc((q+o)*1.7,sd,2.,0.,hue),d2=disc(rot(q-o,1.3)*2.2,sd+3.,2.4,0.,hue);float tail=exp(-pow((length(q-vec2(-.1,.25))-.45)/.07,2.))*smoothstep(-.4,.4,q.x)*fb(q*6.+sd)*.9;c=d1.rgb+d2.rgb+vec3(.6,.7,1.)*tail;a=max(max(d1.a,d2.a),tail);}
 else if(k==6){float g=smoothstep(.3,.8,fb(q*2.6+sd))*smoothstep(1.,.2,r+.3*(fb(q*2.+sd+4.)-.5)),fil=pow(1.-abs(2.*fb(q*6.+sd+2.)-1.),6.),dust=smoothstep(.55,.75,fb(q*4.+sd+11.));c=mix(vec3(1.,.36,.48),vec3(.4,.8,.85),hue*.6)*(g*.9+fil*g)*(1.-.8*dust);a=g*(1.-.5*dust);}
 else if(k==7){float R0=.24+.26*va,th=atan(q.y,q.x),ring=exp(-pow((r-R0*(1.+.12*(n2(vec2(th*2.,sd))-.5)))/(.06+.06*hue),2.)),inner=exp(-r*r/(R0*R0*.5))*.5,outer=exp(-pow((r-R0-.2)/.1,2.))*(.15+.4*hue);c=mix(vec3(.45,.95,.9),vec3(.5,.65,1.),hue)*(ring*.7+inner)+mix(vec3(1.,.4,.4),vec3(1.,.65,.35),va)*outer+vec3(1.)*exp(-r*r/.002);a=max(max(c.r,c.g),c.b);}
 else if(k==8){float th=atan(q.y,q.x),shell=exp(-pow((r-.62-.08*(fb(vec2(th*3.,sd))-.5))/.07,2.)),fil=pow(1.-abs(2.*fb(q*9.+sd)-1.),5.);c=mix(vec3(1.,.42,.38),vec3(.45,.85,1.),step(.5,fb(q*3.+sd+2.))*.8)*shell*(.4+fil);a=shell*(.3+fil*.7);}
 else{float glob=step(.5,va),s=stars(q,sd,mix(.35,.8,glob),r*mix(1.,1.7,glob))*2.2,haze=glob*exp(-r*r*7.)*.5;c=mix(vec3(.7,.82,1.),vec3(1.,.9,.7),glob)*(s+haze);a=s+haze;}
 float edge=1.-smoothstep(.82,1.,length(w));return vec4(c,clamp(a*1.15,0.,1.)*edge);}
void main(){vec4 s=shape(vW);float a=s.a*vB.y,m=max(max(s.r,s.g),s.b);outColor=vec4(m>.0001?s.rgb/m:vec3(.5),a);}`;
