// Max → High (evolution phase 'implode'): the hole swallows the universe. The
// sky is drawn in toward the knob and winds around it while the opened space
// shrinks into it, so everything ends up compressed back into the knob.
// s (0-1) is the swallow progress.
export const IMPLODE = Object.freeze({ seconds: 1.1, pull: 5, twist: 2.6, reach: 240 });
const scale = s => 1 + IMPLODE.pull * s * s;
// Where a world point is drawn while swallowing (stars, sprites): pulled in
// toward the knob k and turned around it, more so close to it.
export function swallowPoint(p, k, s) {
  if (!(s > 0)) return p;
  const m = scale(s), dx = (p.x - k.x) / m, dy = (p.y - k.y) / m, a = -IMPLODE.twist * s * Math.exp(-Math.hypot(dx, dy) / IMPLODE.reach), c = Math.cos(a), n = Math.sin(a);
  return { x: k.x + dx * c - dy * n, y: k.y + dx * n + dy * c };
}
export const swallowScale = s => 1 / scale(s);
// GLSL: the sky point a pixel shows while swallowing (the inverse of
// swallowPoint). Expects uSwallow, uSize, cx().
export const SWALLOW_GLSL = `
uniform float uSwallow;
vec2 swallow(vec2 p){if(uSwallow<.001)return p;vec2 k=vec2(cx(),uSize.y*.5),d=p-k;float a=${IMPLODE.twist}*uSwallow*exp(-length(d)/${IMPLODE.reach}.),c=cos(a),s=sin(a);return k+mat2(c,s,-s,c)*d*(1.+${IMPLODE.pull}.*uSwallow*uSwallow);}
// Light of matter falling in: a bright winding inflow close to the hole.
vec3 inflow(vec2 p){if(uSwallow<.001)return vec3(0.);vec2 d=p-vec2(cx(),uSize.y*.5);float r=length(d),spiral=pow(.5+.5*sin(atan(d.y,d.x)*3.-r*.11+uTime*7.),4.);return vec3(1.,.72,.45)*uSwallow*(1.-uSwallow)*3.2*exp(-r/55.)*(.35+.65*spiral)*smoothstep(14.,24.,r);}
`;
