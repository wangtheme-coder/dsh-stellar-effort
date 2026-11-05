import { KNOB } from './hole.mjs';
// Logical CSS pixels. Neither aperture, canvas backing resolution nor DOM width
// is an input to this coordinate system. The rail is the permanent origin.
// Unfilled rail: space the universe has not unfolded into yet. Near-absolute
// dark in every host theme; only a faint rim keeps the control discoverable.
export const VOID = Object.freeze({ rgb: [.008, .009, .015], rim: [.05, .055, .075], css: '#020306' });
// The empty rail right of the knob takes the host's tone until the black hole is
// born (light hosts: whitish grey; dark hosts: blackish grey); then it is void.
export const REST = Object.freeze({ light: [.90, .91, .93], dark: [.16, .165, .185], lightCss: '#e6e8ed', darkCss: '#292a2f' });
// The world is about 1/7 of a 2048×1152 logical screen (Owner: 2560×1440 at
// 125%). The viewport can shrink to the rail alone; it never rescales the world.
export const SPACE = Object.freeze({ width: 860, height: 380, railWidth: 314, railHeight: 38, railX: 273, centerY: 190, thumbInset: 16, travel: 282 });
// The visible track is thinner than the 38 px rail box (which stays the hit and
// layout area), so the knob (hole.mjs KNOB) is wider than the track and covers it.
export const TRACK = Object.freeze({ radius: 15 });
const bounded = (value, fallback, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
export function worldPoint(x, y) {
  return { x: SPACE.railX + SPACE.thumbInset + x * SPACE.travel, y: SPACE.centerY + y * 18 };
}
export function apertureFor(config = {}) {
  const width = bounded(config.viewWidth, SPACE.width, SPACE.railWidth, SPACE.width);
  const height = bounded(config.viewHeight, SPACE.height, SPACE.railHeight, SPACE.height);
  return { width, height, x: (SPACE.width - width) / 2, y: (SPACE.height - height) / 2, feather: bounded(config.viewFeather, 8, 0, 32) };
}
export function sceneAmount(config = {}) { const a = apertureFor(config); return Math.max(0, Math.min(1, (a.width - SPACE.railWidth) / (SPACE.width - SPACE.railWidth))); }
export function sceneSize(amount) { const t = Math.max(0, Math.min(1, amount)); return { viewWidth: Math.round(SPACE.railWidth + t * (SPACE.width - SPACE.railWidth)), viewHeight: Math.round(SPACE.railHeight + t * (SPACE.height - SPACE.railHeight)) }; }
export function aperturePoint(point, aperture) { return { x: point.x - aperture.x, y: point.y - aperture.y }; }
export function insideAperture(point, aperture) {
  return point.x >= aperture.x && point.x <= aperture.x + aperture.width && point.y >= aperture.y && point.y <= aperture.y + aperture.height;
}
// Intersection in viewport CSS pixels; clipping never translates the scene.
export function screenInsets(rect, width, height) {
  return { top: Math.min(rect.height, Math.max(0, -rect.top)), right: Math.min(rect.width, Math.max(0, rect.left + rect.width - width)), bottom: Math.min(rect.height, Math.max(0, rect.top + rect.height - height)), left: Math.min(rect.width, Math.max(0, -rect.left)) };
}
export function apertureMask({ width, height, feather }) {
  if (!feather) return 'none';
  const fx = feather / width, fy = feather / height;
  // A soft peripheral window unioned with an opaque control envelope. The
  // complete rail and thumb remain visible even at the minimum aperture.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="x"><stop stop-color="white" stop-opacity="0"/><stop offset="${fx}" stop-color="white"/><stop offset="${1-fx}" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><linearGradient id="y" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset="${fy}" stop-color="white"/><stop offset="${1-fy}" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="vertical"><rect width="100%" height="100%" fill="url(#y)"/></mask></defs><rect width="100%" height="100%" rx="${Math.max(0, 19 - (height - SPACE.railHeight))}" fill="url(#x)" mask="url(#vertical)"/><rect x="${(width-SPACE.railWidth)/2}" y="${(height-44)/2}" width="${SPACE.railWidth}" height="44" rx="19" fill="white"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
// The world's own outer edge fades to transparent so the scene dissolves into
// the host UI instead of ending in a rectangle. It belongs to the world canvas,
// so it is independent of (and composes with) the viewport mask above. The
// rail, x 273–587 and y 171–209, lies wholly inside the opaque core.
export const WORLD_FADE = Object.freeze({ x: 120, y: 96 });
export function worldFadeMask({ x, y } = WORLD_FADE) {
  const fx = x / SPACE.width, fy = y / SPACE.height, ramp = f => [0, .125, .25, .375, .5, .625, .75, .875, 1].map(t => `<stop offset="${(f * t).toFixed(4)}" stop-color="white" stop-opacity="${(t * t * (3 - 2 * t)).toFixed(3)}"/>`).join(''), tail = f => [1, .875, .75, .625, .5, .375, .25, .125, 0].map(t => `<stop offset="${(1 - f * t).toFixed(4)}" stop-color="white" stop-opacity="${(t * t * (3 - 2 * t)).toFixed(3)}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SPACE.width}" height="${SPACE.height}" viewBox="0 0 ${SPACE.width} ${SPACE.height}"><defs><linearGradient id="x">${ramp(fx)}${tail(fx)}</linearGradient><linearGradient id="y" x2="0" y2="1">${ramp(fy)}${tail(fy)}</linearGradient><mask id="v"><rect width="100%" height="100%" fill="url(#y)"/></mask></defs><rect width="100%" height="100%" fill="url(#x)" mask="url(#v)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const WORLD_MASK = worldFadeMask();
// The knob and the black hole are the control itself, so the viewport never
// crops them: the viewport layer covers the whole world and its CSS mask is the
// window unioned with an envelope over every place the knob can be (range.from
// to range.to: Off to Max plus overdrive). That mask never changes: on a real
// GPU, rewriting it while the knob or hole moved stalled the page for 200-300
// ms each time. Shape: an ellipse at each end and a band between them with the
// same vertical profile. The renderer trims it back every frame (holeTrim).
export const HOLE_ENVELOPE = Object.freeze({ rx: 48, ry: 36 });
// Around the knob before the hole forms: a disc whose solid part (80%) holds
// the pressed knob and its shadow; it widens into the hole's ellipse as the hole forms.
// The collapsed dock shows just the rail (EffortDock's collapsed config).
export const COMPACT_CONFIG = Object.freeze({ viewWidth: SPACE.railWidth, viewHeight: SPACE.railHeight, viewFeather: 0 });
export const KNOB_WINDOW = Math.ceil(((KNOB.radius + KNOB.shadow) * KNOB.pressed) / .8);
export function viewportMask(view, range = null) {
  const window = apertureMask(view), win = window === 'none' ? 'linear-gradient(#000,#000)' : window;
  const at = `${view.x}px ${view.y}px`, size = `${view.width}px ${view.height}px`;
  if (!range) return { maskImage: win, maskPosition: at, maskSize: size, maskRepeat: 'no-repeat' };
  const { rx, ry } = HOLE_ENVELOPE, top = (range.y - ry).toFixed(1), end = 'radial-gradient(closest-side, #000 80%, transparent 100%)';
  const band = 'linear-gradient(transparent, #000 10%, #000 90%, transparent)';
  return {
    maskImage: `${win}, ${end}, ${end}, ${band}`,
    maskPosition: `${at}, ${(range.from - rx).toFixed(1)}px ${top}px, ${(range.to - rx).toFixed(1)}px ${top}px, ${range.from.toFixed(1)}px ${top}px`,
    maskSize: `${size}, ${2 * rx}px ${2 * ry}px, ${2 * rx}px ${2 * ry}px, ${Math.max(0, range.to - range.from).toFixed(1)}px ${2 * ry}px`,
    maskRepeat: 'no-repeat',
  };
}
// The renderer trims the still envelope back, every frame, to the window plus a
// shape that follows the knob (knobShape: a disc, widening to the hole's
// ellipse as the hole forms), by scaling the canvas by
// trim = union(window, shape) / union(window, envelope). Shader and canvas code
// are free to change every frame; only the CSS mask must stay still.
// JS twins of the GLSL below, for tests.
const unite = (a, b) => a + b - a * b, clamp01 = v => Math.max(0, Math.min(1, v));
function roundBox(p, c, half, r) { const qx = Math.abs(p.x - c.x) - half.x + r, qy = Math.abs(p.y - c.y) - half.y + r; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; }
export function windowAlpha(p, view) {
  const c = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
  if (!view.feather) return roundBox(p, c, { x: view.width / 2, y: view.height / 2 }, 0) <= 0 ? 1 : 0;
  const gx = clamp01(Math.min(p.x - view.x, view.x + view.width - p.x) / view.feather), gy = clamp01(Math.min(p.y - view.y, view.y + view.height - p.y) / view.feather);
  const soft = gx * gy * (roundBox(p, c, { x: view.width / 2, y: view.height / 2 }, Math.max(0, 19 - (view.height - SPACE.railHeight))) <= 0 ? 1 : 0);
  return unite(soft, roundBox(p, c, { x: SPACE.railWidth / 2, y: 22 }, 19) <= 0 ? 1 : 0);
}
export function ellipseAlpha(p, x, y, rx = HOLE_ENVELOPE.rx, ry = HOLE_ENVELOPE.ry) { return clamp01((1 - Math.hypot((p.x - x) / rx, (p.y - y) / ry)) / .2); }
export function envelopeAlpha(p, range) { const t = (p.y - range.y + HOLE_ENVELOPE.ry) / (2 * HOLE_ENVELOPE.ry), band = p.x >= range.from && p.x <= range.to ? clamp01(Math.min(t, 1 - t) / .1) : 0; return unite(unite(ellipseAlpha(p, range.from, range.y), ellipseAlpha(p, range.to, range.y)), band); }
export function knobShape(visible) { const v = clamp01(visible); return { rx: KNOB_WINDOW + (HOLE_ENVELOPE.rx - KNOB_WINDOW) * v, ry: KNOB_WINDOW + (HOLE_ENVELOPE.ry - KNOB_WINDOW) * v }; }
// knob: { x, y, rx, ry } (centre and knobShape radii). view: the window to show;
// maskView: the (open) window the CSS mask holds, which contains it; fold (0-1):
// how far the view has folded down to the collapsed rail (collapse animation).
export function holeTrim(p, view, range, knob, maskView = view, fold = 0) { const w = windowAlpha(p, view) * (1 - fold) + windowAlpha(p, apertureFor(COMPACT_CONFIG)) * fold, open = unite(windowAlpha(p, maskView), envelopeAlpha(p, range)); return open < 1e-4 ? 1 : Math.min(1, unite(w, ellipseAlpha(p, knob.x, knob.y, knob.rx, knob.ry)) / open); }
export const TRIM_GLSL = `
uniform vec4 uView,uMaskView,uKnobAt;uniform float uFeather,uMaskFeather,uFold;uniform vec3 uRange;
float tUnite(float a,float b){return a+b-a*b;}
float tBox(vec2 p,vec2 c,vec2 h,float r){vec2 q=abs(p-c)-h+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float tWindow(vec2 p,vec4 v,float f){vec2 c=v.xy+v.zw*.5;if(f<.01)return 1.-smoothstep(-.5,.5,tBox(p,c,v.zw*.5,0.));
 float gx=clamp(min(p.x-v.x,v.x+v.z-p.x)/f,0.,1.),gy=clamp(min(p.y-v.y,v.y+v.w-p.y)/f,0.,1.);
 return tUnite(gx*gy*(1.-smoothstep(-.5,.5,tBox(p,c,v.zw*.5,max(0.,19.-(v.w-${SPACE.railHeight}.))))),1.-smoothstep(-.5,.5,tBox(p,c,vec2(${SPACE.railWidth / 2}.,22.),19.)));}
float tEllipse(vec2 p,vec2 c,vec2 r){return clamp((1.-length((p-c)/r))/.2,0.,1.);}
float tEnvelope(vec2 p){vec2 e=vec2(${HOLE_ENVELOPE.rx}.,${HOLE_ENVELOPE.ry}.);float t=(p.y-uRange.z+e.y)/(2.*e.y),band=step(uRange.x,p.x)*step(p.x,uRange.y)*clamp(min(t,1.-t)/.1,0.,1.);return tUnite(tUnite(tEllipse(p,vec2(uRange.x,uRange.z),e),tEllipse(p,vec2(uRange.y,uRange.z),e)),band);}
float holeTrim(vec2 p){float w=mix(tWindow(p,uView,uFeather),tWindow(p,vec4(${(SPACE.width - SPACE.railWidth) / 2},${(SPACE.height - SPACE.railHeight) / 2},${SPACE.railWidth}.,${SPACE.railHeight}.),0.),uFold),open=tUnite(tWindow(p,uMaskView,uMaskFeather),tEnvelope(p));return open<1e-4?1.:min(1.,tUnite(w,tEllipse(p,uKnobAt.xy,uKnobAt.zw))/open);}
`;
export function layoutAperture(viewport, canvas, config, range = null) {
  const view=apertureFor(config);
  Object.assign(viewport.style,{width:`${SPACE.width}px`,height:`${SPACE.height}px`,...viewportMask(view,range)});
  Object.assign(canvas.style,{width:`${SPACE.width}px`,height:`${SPACE.height}px`,left:'0px',top:'0px',maskImage:WORLD_MASK});
  return view;
}
