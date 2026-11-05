/* Stellar Effort 1.1.6 · original procedural renderer · MIT */
window.__ModuleLoader__.load({id:"dsh-stellar-effort",factory:(require)=>{const module={exports:{}};const exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

// src/client.jsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react2 = __toESM(require("react"), 1);

// src/shared/mapping.mjs
var clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
var smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
var anchors = Object.freeze({ off: 0, none: 0, minimal: 0.16, low: 1 / 3, medium: 0.5, high: 2 / 3, xhigh: 1, "extra-high": 1, max: 1 });
function levelsFor(model) {
  const raw = model?.reasoning?.efforts;
  if (!Array.isArray(raw)) return [];
  const ids = /* @__PURE__ */ new Set();
  const levels2 = raw.filter((x) => x && typeof x.id === "string" && !ids.has(x.id) && ids.add(x.id)).map((x, i, a) => ({ id: x.id, name: String(x.name ?? x.id), description: String(x.description ?? ""), position: anchors[x.id.toLowerCase()] ?? (a.length < 2 ? 0 : i / (a.length - 1)) }));
  if (levels2.some((x, i) => i && x.position <= levels2[i - 1].position)) levels2.forEach((x, i) => {
    x.position = levels2.length > 1 ? i / (levels2.length - 1) : 0;
  });
  return levels2;
}
function nearestLevel(levels2, position) {
  return levels2.reduce((best, x) => !best || Math.abs(x.position - position) < Math.abs(best.position - position) ? x : best, void 0);
}
function selectionKey(s) {
  return s ? JSON.stringify([s.provider, s.model, s.reasoningEffort ?? null]) : "null";
}
function directoryView(snapshot) {
  const current = snapshot?.current;
  const model = snapshot?.groups?.find((g) => g.id === current?.provider)?.models?.find((m) => m.id === current?.model);
  const levels2 = levelsFor(model);
  const id = current?.reasoningEffort ?? model?.reasoning?.defaultEffort;
  const actual = levels2.find((x) => x.id === id);
  let reason = "";
  if (!model || snapshot?.routable === false) reason = "\u5F53\u524D\u6A21\u578B\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5148\u5728 DSH \u9009\u62E9\u6A21\u578B";
  else if (levels2.length < 2) reason = "\u6B64\u6A21\u578B\u6CA1\u6709\u53EF\u8C03\u8282\u7684\u63A8\u7406\u7B49\u7EA7";
  else if (!actual) reason = "DSH \u5C1A\u672A\u63D0\u4F9B\u53EF\u786E\u8BA4\u7684\u5F53\u524D\u7B49\u7EA7";
  const syncing = !reason && !["ready", "selecting"].includes(snapshot?.status);
  if (syncing) reason = "\u6B63\u5728\u540C\u6B65 DSH \u72B6\u6001";
  return { current, model, levels: levels2, actual, disabled: !!reason, syncing, status: snapshot?.status, reason, fingerprint: JSON.stringify([current?.provider, current?.model, levels2.map((x) => x.id)]) };
}

// src/shared/popup-layout.mjs
function clampPopup(position, { width, height }, { width: vw, height: vh }) {
  const mx = Math.min(8, Math.max(0, (vw - width) / 2)), my = Math.min(8, Math.max(0, (vh - height) / 2));
  return { left: clamp(position.left, mx, Math.max(mx, vw - width - mx)), top: clamp(position.top, my, Math.max(my, vh - height - my)) };
}

// src/render/optics.mjs
var profiles = { hybrid: { saturation: 1, gain: 1, tint: [1, 1, 1], stars: 1, halo: 1, fog: 1 }, realistic: { saturation: 0.85, gain: 0.9, tint: [1.05, 1, 0.92], stars: 0.92, halo: 0.65, fog: 0.82 }, scifi: { saturation: 0.55, gain: 1.16, tint: [0.92, 0.98, 1.1], stars: 1.08, halo: 1.12, fog: 0.9 }, minimal: { saturation: 0.08, gain: 0.72, tint: [1, 1, 1], stars: 0.72, halo: 0, fog: 0.42 } };
function opticalProfile(world, quantized = false) {
  const out = { saturation: 0, gain: 0, tint: [0, 0, 0], stars: 0, halo: 0, fog: 0 }, weights = Object.entries(profiles).map(([id, p]) => [p, quantized ? Math.round((world.styleMix?.[id] ?? (world.config.style === id ? 1 : 0)) * 16) / 16 : world.styleMix?.[id] ?? (world.config.style === id ? 1 : 0)]), sum = weights.reduce((s, [, w]) => s + w, 0) || 1;
  for (const [p, raw] of weights) {
    const w = raw / sum;
    for (const k of ["saturation", "gain", "stars", "halo", "fog"]) out[k] += p[k] * w;
    for (let i = 0; i < 3; i++) out.tint[i] += p.tint[i] * w;
  }
  return out;
}
function opticalColor(rgb, p) {
  if (p.saturation === 1 && p.gain === 1 && p.tint.every((v) => v === 1) || Math.max(...rgb) < 2e-3) return [...rgb];
  const lum = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return rgb.map((v, i) => clamp((lum + (v - lum) * p.saturation) * p.gain * p.tint[i]));
}
function softenMotion(dx, dy, world, reduced = false) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || reduced || world.config.reducedMotion || world.config.quality === "static") return { x: 0, y: 0 };
  const speed = Number.isFinite(world.config.speed) ? world.config.speed : 0, blur = clamp(world.config.motionBlur ?? 0), length = Math.hypot(dx, dy) * speed / 60;
  if (length < 0.02 || !blur) return { x: 0, y: 0 };
  const factor = Math.min(0.65, length * blur) / (Math.hypot(dx, dy) || 1);
  return { x: dx * factor, y: dy * factor };
}
function pointSamples(x, y, soft = { x: 0, y: 0 }) {
  return Math.hypot(soft.x, soft.y) > 1e-5 ? [{ x, y, weight: 0.65 }, { x: x - soft.x, y: y - soft.y, weight: 0.35 }] : [{ x, y, weight: 1 }];
}

// src/render/limits.mjs
var LIMITS = Object.freeze({ high: 2 / 3, collapse: 0.76, boom: 0.8, rearm: 2 / 3 - 0.012 });

// src/render/hole.mjs
var KNOB = Object.freeze({ radius: 19, pressed: 1.1, shadow: 5 });
var HOLE = Object.freeze({ radius: 15.5, inner: 18, outer: 33, inclination: 0.28, tilt: 0.1, halfWidth: 38, halfHeight: 32 });
function holeState(position) {
  return { visibility: smooth(LIMITS.collapse - 0.011, LIMITS.collapse + 5e-3, position), maturity: smooth(LIMITS.collapse + 7e-3, 1, position), radius: HOLE.radius };
}
function angularSpeed(radius) {
  return clamp(3.1 * Math.pow(HOLE.inner / Math.max(HOLE.inner, radius), 1.5), 0.85, 3.1);
}
function lensPoint(point, center, strength = 1) {
  const dx = point.x - center.x, dy = point.y - center.y, r = Math.hypot(dx, dy);
  const weight = (1 - smooth(32, 42, r)) * Math.exp(-Math.pow((r - 20) / 7, 2));
  const shift = weight * clamp(strength) * 2.2;
  return { x: point.x + dx / (r + 1) * shift, y: point.y + dy / (r + 1) * shift };
}
var mix = (a, b, t) => a + (b - a) * t;
function grain(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const hash3 = (a, b) => {
    const n = ((a * 37 + b * 157) % 251 + 251) % 251;
    return (n * n * 13 + n * 17) % 251 / 251;
  };
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return mix(mix(hash3(ix, iy), hash3(ix + 1, iy), u), mix(hash3(ix, iy + 1), hash3(ix + 1, iy + 1), u), v);
}
function pattern(radius, phase) {
  const bands = 0.5 + 0.5 * Math.cos(radius * 0.8 + 0.8 * Math.sin(phase + radius * 0.12));
  const clump = grain(Math.cos(phase) * 1.7 + radius * 0.11, Math.sin(phase) * 1.7 + 3);
  const streak = 0.5 + 0.5 * Math.sin(2 * phase + radius * 0.35);
  return 0.2 + 0.4 * bands * (0.5 + 0.5 * clump) + 0.25 * streak * clump + 0.15 * clump;
}
var SHEAR_CYCLE = 2;
function material(radius, angle, time) {
  const base = angularSpeed(HOLE.outer), shear = angularSpeed(radius) - base, local = (time % SHEAR_CYCLE + SHEAR_CYCLE) % SHEAR_CYCLE;
  const other = (local + SHEAR_CYCLE / 2) % SHEAR_CYCLE, weight = 1 - Math.abs(2 * local / SHEAR_CYCLE - 1);
  const at = (age) => pattern(radius, angle - time * base - shear * age);
  return weight * at(local) + (1 - weight) * at(other);
}
function warm(radius) {
  const t = smooth(18, 33, radius);
  return [mix(1, 0.72, t), mix(0.91, 0.32, t), mix(0.69, 0.09, t)];
}
function sampleHole(x, y, { visibility = 1, maturity = 1, spin = 0, glow = 0.6, brightness = 0.85, flare = 0, pit = 1, form = 1, size = 1 } = {}) {
  const r = Math.hypot(x, y), R = HOLE.radius, Re = Math.max(0.5, R * pit), pr = KNOB.radius * (1 - 0.3 * flare);
  if (Math.abs(x) > HOLE.halfWidth || Math.abs(y) > HOLE.halfHeight) return [0, 0, 0, 0];
  const shadow = (1 - smooth(Re - 0.25, Re + 0.3, r)) * smooth(0, 0.06, pit), planeY = y + x * HOLE.tilt;
  const rho = Math.hypot(x, planeY / HOLE.inclination), angle = Math.atan2(planeY / HOLE.inclination, x);
  const outer = 20.5 + (HOLE.outer - 20.5) * size, envelope = smooth(17.8, 19, rho) * (1 - smooth(outer - 5 * size - 0.8, outer, rho));
  const building = 0.34 + 0.66 * maturity, asym = clamp(0.85 - 0.5 * x / Math.max(rho, 1), 0.4, 1.4);
  const disk = envelope * material(rho, angle, spin) * building * asym * 1.65 * form;
  const near = smooth(-0.2, 0.9, planeY), discVisible = disk * ((1 - near) * (1 - shadow) + near);
  const arcR = Math.hypot(x, (y + 1.2) * 1.07), arcAngle = Math.atan2(-(y + 1.2), x);
  const arcEnvelope = Math.exp(-Math.pow((arcR - 19.1) / (0.7 + 0.95 * size), 2)) * (1 - smooth(-2, 1, y)) * (1 - smooth(12 + 11 * size, 16 + 13 * size, Math.abs(x)));
  const arc = arcEnvelope * material(20 + Math.abs(x) * 0.12, arcAngle, spin) * building * (0.9 - 0.25 * x / 27) * 1.18 * (1 - shadow) * form;
  const rim = Math.exp(-Math.pow((r - Re - 0.28) / 0.32, 2)) * (0.035 + 0.1 * Math.pow(Math.max(0, -x / Math.max(r, 1)), 3)) * (0.6 + glow * 0.4) * (1 - shadow) * pit;
  const plain2 = 1 - smooth(pr - 0.5, pr + 0.5, r), ember = plain2 * (1 - shadow) * (1 - pit), pearl = [1, 1, 1];
  const color = warm(rho), arcColor = warm(20 + Math.abs(x) * 0.12);
  const radiance = color.map((v, i) => v * discVisible + arcColor[i] * arc + [1, 0.82, 0.54][i] * rim + pearl[i] * ember);
  const a = Math.max(shadow, clamp(Math.max(...radiance)));
  const base = plain2 * (1 - visibility) + a * visibility, gr = Math.max(pr, Re * smooth(0, 0.06, pit) + 0.8), glare = flare * 0.55 * Math.exp(-Math.pow((r - gr) / 3.2, 2)) * smooth(gr - 1, gr + 1, r) * (1 - base);
  const drop = (1 - visibility) * (1 - smooth(pr, pr + KNOB.shadow, r)) * smooth(pr - 1, pr + 0.5, r) * 0.2 * (1 - base - glare), alpha = base + glare + drop;
  if (alpha < 1e-4) return [0, 0, 0, 0];
  return [...radiance.map((v, i) => clamp((pearl[i] * plain2 * (1 - visibility) + ((v + 15e-5 * shadow) * visibility + [0.88, 0.84, 1][i] * glare) * brightness) / alpha)), alpha];
}
var HOLE_GLSL = `
float holeSpeed(float radius){return clamp(3.1*pow(18./max(18.,radius),1.5),.85,3.1);}
float holeHash(vec2 p){float n=mod(p.x*37.+p.y*157.,251.);return mod(n*n*13.+n*17.,251.)/251.;}
float holeGrain(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(holeHash(i),holeHash(i+vec2(1,0)),f.x),mix(holeHash(i+vec2(0,1)),holeHash(i+vec2(1)),f.x),f.y);}
float holePattern(float radius,float phase){
 float bands=.5+.5*cos(radius*.8+.8*sin(phase+radius*.12));
 float clump=holeGrain(vec2(cos(phase)*1.7+radius*.11,sin(phase)*1.7+3.));
 float streak=.5+.5*sin(2.*phase+radius*.35);
 return .2+.4*bands*(.5+.5*clump)+.25*streak*clump+.15*clump;
}
float holeMaterial(float radius,float angle,float time){
 float C=${SHEAR_CYCLE}.,base=holeSpeed(${HOLE.outer}.),shear=holeSpeed(radius)-base,local=mod(time,C),other=mod(local+C*.5,C),weight=1.-abs(2.*local/C-1.);
 return weight*holePattern(radius,angle-time*base-shear*local)+(1.-weight)*holePattern(radius,angle-time*base-shear*other);
}
vec3 holeWarm(float radius){return mix(vec3(1.,.91,.69),vec3(.72,.32,.09),smoothstep(18.,33.,radius));}
vec2 holeLens(vec2 point,vec2 center,float strength){vec2 d=point-center;float r=length(d);float weight=(1.-smoothstep(32.,42.,r))*exp(-pow((r-20.)/7.,2.));return point+d/(r+1.)*weight*clamp(strength,0.,1.)*2.2;}
vec4 holeSample(vec2 d,float visibility,float maturity,float spin,float glow,float brightness,vec3 core,float size){
 float x=d.x,y=d.y,r=length(d),R=${HOLE.radius},flare=core.x,pit=core.y,form=core.z,Re=max(.5,R*pit),pr=${KNOB.radius}.*(1.-.3*flare);
 float shadow=(1.-smoothstep(Re-.25,Re+.3,r))*smoothstep(0.,.06,pit),planeY=y+x*${HOLE.tilt};
 float rho=length(vec2(x,planeY/${HOLE.inclination})),angle=atan(planeY/${HOLE.inclination},x);
 float outer=20.5+(${HOLE.outer}.-20.5)*size,envelope=smoothstep(17.8,19.,rho)*(1.-smoothstep(outer-5.*size-.8,outer,rho));
 float building=.34+.66*maturity,asym=clamp(.85-.5*x/max(rho,1.),.4,1.4);
 float disk=envelope*holeMaterial(rho,angle,spin)*building*asym*1.65*form;
 float nearSide=smoothstep(-.2,.9,planeY),discVisible=disk*((1.-nearSide)*(1.-shadow)+nearSide);
 float arcR=length(vec2(x,(y+1.2)*1.07)),arcAngle=atan(-(y+1.2),x);
 float arcEnvelope=exp(-pow((arcR-19.1)/(.7+.95*size),2.))*(1.-smoothstep(-2.,1.,y))*(1.-smoothstep(12.+11.*size,16.+13.*size,abs(x)));
 float arc=arcEnvelope*holeMaterial(20.+abs(x)*.12,arcAngle,spin)*building*(.9-.25*x/27.)*1.18*(1.-shadow)*form;
 float rim=exp(-pow((r-Re-.28)/.32,2.))*(.035+.10*pow(max(0.,-x/max(r,1.)),3.))*(.6+glow*.4)*(1.-shadow)*pit;
 float plain=1.-smoothstep(pr-.5,pr+.5,r),ember=plain*(1.-shadow)*(1.-pit);vec3 pearl=vec3(1.);
 vec3 radiance=holeWarm(rho)*discVisible+holeWarm(20.+abs(x)*.12)*arc+vec3(1.,.82,.54)*rim+pearl*ember;
 float a=max(shadow,clamp(max(max(radiance.r,radiance.g),radiance.b),0.,1.));
 float base=plain*(1.-visibility)+a*visibility,gr=max(pr,Re*smoothstep(0.,.06,pit)+.8),glare=flare*.55*exp(-pow((r-gr)/3.2,2.))*smoothstep(gr-1.,gr+1.,r)*(1.-base);
 float drop=(1.-visibility)*(1.-smoothstep(pr,pr+${KNOB.shadow}.,r))*smoothstep(pr-1.,pr+.5,r)*.2*(1.-base-glare),alpha=base+glare+drop;if(alpha<.0001)return vec4(0.);
 return vec4(clamp((pearl*plain*(1.-visibility)+((radiance+vec3(.00015)*shadow)*visibility+vec3(.88,.84,1.)*glare)*brightness)/alpha,0.,1.),alpha);
}`;
function staticHoleSvg(position, brightness = 0.85) {
  const { visibility: v, maturity: m } = holeState(position), disk = (0.34 + 0.66 * m).toFixed(3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="76" height="64" viewBox="-38 -32 76 64"><defs><linearGradient id="gold"><stop stop-color="#fff0cf"/><stop offset=".5" stop-color="#e1a354"/><stop offset="1" stop-color="#8f5124"/></linearGradient></defs><circle r="${KNOB.radius}" fill="#fff" opacity="${1 - v}"/><g opacity="${brightness}"><g opacity="${v}"><g opacity="${disk}"><ellipse rx="31" ry="8.7" transform="rotate(-5.7)" fill="none" stroke="url(#gold)" stroke-width="2.4"/><path d="M-25,-7 C-21,-24 15,-27 25,-7" fill="none" stroke="url(#gold)" stroke-width="1.8"/></g><circle r="15.5" fill="#000001"/><path d="M-25,-7 C-21,-24 15,-27 25,-7" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="${disk}"/><path d="M-32,2 C-16,12 16,10 32,-2" fill="none" stroke="url(#gold)" stroke-width="2.2" opacity="${disk}"/></g></g></svg>`;
}

// src/render/space.mjs
var VOID = Object.freeze({ rgb: [8e-3, 9e-3, 0.015], rim: [0.05, 0.055, 0.075], css: "#020306" });
var REST = Object.freeze({ light: [0.9, 0.91, 0.93], dark: [0.16, 0.165, 0.185], lightCss: "#e6e8ed", darkCss: "#292a2f" });
var SPACE = Object.freeze({ width: 860, height: 380, railWidth: 314, railHeight: 38, railX: 273, centerY: 190, thumbInset: 16, travel: 282 });
var TRACK = Object.freeze({ radius: 15 });
var bounded = (value, fallback, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
function worldPoint(x, y) {
  return { x: SPACE.railX + SPACE.thumbInset + x * SPACE.travel, y: SPACE.centerY + y * 18 };
}
function apertureFor(config = {}) {
  const width = bounded(config.viewWidth, SPACE.width, SPACE.railWidth, SPACE.width);
  const height = bounded(config.viewHeight, SPACE.height, SPACE.railHeight, SPACE.height);
  return { width, height, x: (SPACE.width - width) / 2, y: (SPACE.height - height) / 2, feather: bounded(config.viewFeather, 8, 0, 32) };
}
function sceneAmount(config = {}) {
  const a = apertureFor(config);
  return Math.max(0, Math.min(1, (a.width - SPACE.railWidth) / (SPACE.width - SPACE.railWidth)));
}
function sceneSize(amount) {
  const t = Math.max(0, Math.min(1, amount));
  return { viewWidth: Math.round(SPACE.railWidth + t * (SPACE.width - SPACE.railWidth)), viewHeight: Math.round(SPACE.railHeight + t * (SPACE.height - SPACE.railHeight)) };
}
function screenInsets(rect, width, height) {
  return { top: Math.min(rect.height, Math.max(0, -rect.top)), right: Math.min(rect.width, Math.max(0, rect.left + rect.width - width)), bottom: Math.min(rect.height, Math.max(0, rect.top + rect.height - height)), left: Math.min(rect.width, Math.max(0, -rect.left)) };
}
function apertureMask({ width, height, feather }) {
  if (!feather) return "none";
  const fx = feather / width, fy = feather / height;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="x"><stop stop-color="white" stop-opacity="0"/><stop offset="${fx}" stop-color="white"/><stop offset="${1 - fx}" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><linearGradient id="y" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset="${fy}" stop-color="white"/><stop offset="${1 - fy}" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="vertical"><rect width="100%" height="100%" fill="url(#y)"/></mask></defs><rect width="100%" height="100%" rx="${Math.max(0, 19 - (height - SPACE.railHeight))}" fill="url(#x)" mask="url(#vertical)"/><rect x="${(width - SPACE.railWidth) / 2}" y="${(height - 44) / 2}" width="${SPACE.railWidth}" height="44" rx="19" fill="white"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
var WORLD_FADE = Object.freeze({ x: 120, y: 96 });
function worldFadeMask({ x, y } = WORLD_FADE) {
  const fx = x / SPACE.width, fy = y / SPACE.height, ramp = (f) => [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((t) => `<stop offset="${(f * t).toFixed(4)}" stop-color="white" stop-opacity="${(t * t * (3 - 2 * t)).toFixed(3)}"/>`).join(""), tail = (f) => [1, 0.875, 0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0].map((t) => `<stop offset="${(1 - f * t).toFixed(4)}" stop-color="white" stop-opacity="${(t * t * (3 - 2 * t)).toFixed(3)}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SPACE.width}" height="${SPACE.height}" viewBox="0 0 ${SPACE.width} ${SPACE.height}"><defs><linearGradient id="x">${ramp(fx)}${tail(fx)}</linearGradient><linearGradient id="y" x2="0" y2="1">${ramp(fy)}${tail(fy)}</linearGradient><mask id="v"><rect width="100%" height="100%" fill="url(#y)"/></mask></defs><rect width="100%" height="100%" fill="url(#x)" mask="url(#v)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
var WORLD_MASK = worldFadeMask();
var HOLE_ENVELOPE = Object.freeze({ rx: 48, ry: 36 });
var COMPACT_CONFIG = Object.freeze({ viewWidth: SPACE.railWidth, viewHeight: SPACE.railHeight, viewFeather: 0 });
var KNOB_WINDOW = Math.ceil((KNOB.radius + KNOB.shadow) * KNOB.pressed / 0.8);
function viewportMask(view, range = null) {
  const window2 = apertureMask(view), win = window2 === "none" ? "linear-gradient(#000,#000)" : window2;
  const at = `${view.x}px ${view.y}px`, size = `${view.width}px ${view.height}px`;
  if (!range) return { maskImage: win, maskPosition: at, maskSize: size, maskRepeat: "no-repeat" };
  const { rx, ry } = HOLE_ENVELOPE, top = (range.y - ry).toFixed(1), end = "radial-gradient(closest-side, #000 80%, transparent 100%)";
  const band = "linear-gradient(transparent, #000 10%, #000 90%, transparent)";
  return {
    maskImage: `${win}, ${end}, ${end}, ${band}`,
    maskPosition: `${at}, ${(range.from - rx).toFixed(1)}px ${top}px, ${(range.to - rx).toFixed(1)}px ${top}px, ${range.from.toFixed(1)}px ${top}px`,
    maskSize: `${size}, ${2 * rx}px ${2 * ry}px, ${2 * rx}px ${2 * ry}px, ${Math.max(0, range.to - range.from).toFixed(1)}px ${2 * ry}px`,
    maskRepeat: "no-repeat"
  };
}
var unite = (a, b) => a + b - a * b;
var clamp01 = (v) => Math.max(0, Math.min(1, v));
function roundBox(p, c, half, r) {
  const qx = Math.abs(p.x - c.x) - half.x + r, qy = Math.abs(p.y - c.y) - half.y + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
function windowAlpha(p, view) {
  const c = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
  if (!view.feather) return roundBox(p, c, { x: view.width / 2, y: view.height / 2 }, 0) <= 0 ? 1 : 0;
  const gx = clamp01(Math.min(p.x - view.x, view.x + view.width - p.x) / view.feather), gy = clamp01(Math.min(p.y - view.y, view.y + view.height - p.y) / view.feather);
  const soft = gx * gy * (roundBox(p, c, { x: view.width / 2, y: view.height / 2 }, Math.max(0, 19 - (view.height - SPACE.railHeight))) <= 0 ? 1 : 0);
  return unite(soft, roundBox(p, c, { x: SPACE.railWidth / 2, y: 22 }, 19) <= 0 ? 1 : 0);
}
function ellipseAlpha(p, x, y, rx = HOLE_ENVELOPE.rx, ry = HOLE_ENVELOPE.ry) {
  return clamp01((1 - Math.hypot((p.x - x) / rx, (p.y - y) / ry)) / 0.2);
}
function envelopeAlpha(p, range) {
  const t = (p.y - range.y + HOLE_ENVELOPE.ry) / (2 * HOLE_ENVELOPE.ry), band = p.x >= range.from && p.x <= range.to ? clamp01(Math.min(t, 1 - t) / 0.1) : 0;
  return unite(unite(ellipseAlpha(p, range.from, range.y), ellipseAlpha(p, range.to, range.y)), band);
}
function knobShape(visible) {
  const v = clamp01(visible);
  return { rx: KNOB_WINDOW + (HOLE_ENVELOPE.rx - KNOB_WINDOW) * v, ry: KNOB_WINDOW + (HOLE_ENVELOPE.ry - KNOB_WINDOW) * v };
}
function holeTrim(p, view, range, knob, maskView = view, fold = 0) {
  const w = windowAlpha(p, view) * (1 - fold) + windowAlpha(p, apertureFor(COMPACT_CONFIG)) * fold, open = unite(windowAlpha(p, maskView), envelopeAlpha(p, range));
  return open < 1e-4 ? 1 : Math.min(1, unite(w, ellipseAlpha(p, knob.x, knob.y, knob.rx, knob.ry)) / open);
}
var TRIM_GLSL = `
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
function layoutAperture(viewport, canvas, config, range = null) {
  const view = apertureFor(config);
  Object.assign(viewport.style, { width: `${SPACE.width}px`, height: `${SPACE.height}px`, ...viewportMask(view, range) });
  Object.assign(canvas.style, { width: `${SPACE.width}px`, height: `${SPACE.height}px`, left: "0px", top: "0px", maskImage: WORLD_MASK });
  return view;
}

// src/render/reveal.mjs
var BURST = Object.freeze({ span: Math.ceil(Math.hypot(SPACE.width, SPACE.height / 2)) + 30 });
var easeOut = (t) => 1 - (1 - Math.max(0, Math.min(1, t))) ** 3;
var burstRadius = (unfold) => BURST.span * easeOut(unfold / 0.85);
function revealMask(x, y, holeX, unfold = 1) {
  if (unfold >= 0.999) return 1;
  const r = burstRadius(unfold), f = Math.min(50, 4 + r * 0.2);
  return 1 - smooth(r - f, r, Math.hypot(x - holeX, y - SPACE.centerY));
}
var REVEAL_GLSL = `
float burstRadius(){float t=clamp(uUnfold/.85,0.,1.);return ${BURST.span}.*(1.-pow(1.-t,3.));}
float unfoldMask(vec2 p){if(uUnfold>=.999)return 1.;float r=burstRadius(),f=min(50.,4.+r*.2);return 1.-smoothstep(r-f,r,length(p-vec2(cx(),uSize.y*.5)));}
// The burst's front ring glows briefly as it races outward.
float revealGlow(vec2 p){if(uUnfold<=.001||uUnfold>=.999)return 0.;return exp(-pow((length(p-vec2(cx(),uSize.y*.5))-burstRadius())/4.,2.))*(1.-smoothstep(.2,.85,uUnfold));}
`;

// src/render/overdrive.mjs
var OVERDRIVE = Object.freeze({ px: 7, soft: 26 });
var OVERDRIVE_T = OVERDRIVE.px / SPACE.travel;
function overdriveFromPointer(excessPx) {
  return excessPx > 0 ? 1 - Math.exp(-excessPx / OVERDRIVE.soft) : 0;
}
var parallax = (z) => 0.04 + 0.96 * Math.max(0, Math.min(1, z)) ** 3;
var SAIL = Object.freeze({ quiet: 5, full: 150, entry: 230 });

// src/render/implode.mjs
var IMPLODE = Object.freeze({ seconds: 1.1, pull: 5, twist: 2.6, reach: 240 });
var scale = (s) => 1 + IMPLODE.pull * s * s;
function swallowPoint(p, k, s) {
  if (!(s > 0)) return p;
  const m = scale(s), dx = (p.x - k.x) / m, dy = (p.y - k.y) / m, a = -IMPLODE.twist * s * Math.exp(-Math.hypot(dx, dy) / IMPLODE.reach), c = Math.cos(a), n = Math.sin(a);
  return { x: k.x + dx * c - dy * n, y: k.y + dx * n + dy * c };
}
var swallowScale = (s) => 1 / scale(s);
var SWALLOW_GLSL = `
uniform float uSwallow;
vec2 swallow(vec2 p){if(uSwallow<.001)return p;vec2 k=vec2(cx(),uSize.y*.5),d=p-k;float a=${IMPLODE.twist}*uSwallow*exp(-length(d)/${IMPLODE.reach}.),c=cos(a),s=sin(a);return k+mat2(c,s,-s,c)*d*(1.+${IMPLODE.pull}.*uSwallow*uSwallow);}
// Light of matter falling in: a bright winding inflow close to the hole.
vec3 inflow(vec2 p){if(uSwallow<.001)return vec3(0.);vec2 d=p-vec2(cx(),uSize.y*.5);float r=length(d),spiral=pow(.5+.5*sin(atan(d.y,d.x)*3.-r*.11+uTime*7.),4.);return vec3(1.,.72,.45)*uSwallow*(1.-uSwallow)*3.2*exp(-r/55.)*(.35+.65*spiral)*smoothstep(14.,24.,r);}
`;

// src/render/evolution.mjs
var NEWBORN_DISK = 0.55;
var HELD = 0.55;
var KNOB_RANGE = Object.freeze({ from: worldPoint(0, 0).x, to: worldPoint(1, 0).x + OVERDRIVE.px, y: SPACE.centerY });
var chargeAt = (p) => 0.8 * smooth(0.42, LIMITS.high, p) + 0.2 * smooth(LIMITS.high, LIMITS.collapse, p);
var blend = (a, b, t) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + ((b[k] ?? a[k]) - a[k]) * t]));
var PLUNGE = Object.freeze({ entry: 0.15, decel: 0.4 });
var Evolution = class {
  constructor(position = 0) {
    this.position = position;
    this.phase = position < LIMITS.collapse ? "energy" : position < LIMITS.boom ? "newborn" : "settled";
    this.elapsed = 0;
    this.consumed = position >= LIMITS.boom;
    this.lowTime = 0;
    this.intentId = 0;
    this.active = false;
    this.crossedB = false;
    this.fast = false;
    this.count = 0;
    this.origin = worldPoint(position, 0);
    this.entry = null;
  }
  // coreFlare: the white core tightens and glares; corePit: radius of the dark
  // centre as a fraction of the hole; diskForm: how far the accretion disk has
  // built; contract: how far the bound energy has been pulled into the core and
  // used up (0 free, 1 swallowed); the collapse leaves a dim field (HELD) that
  // the tear then parts; expansion: stars drawn in at the BOOM origin (0) or at
  // their true depth (1); entryWarp: the short surge into space after the tear.
  stable() {
    const born = this.position >= LIMITS.collapse, expanded = this.position >= LIMITS.boom && this.consumed;
    return { entryWarp: 0, entryDust: 0, charge: born ? 0 : chargeAt(this.position), swallow: 0, holeVisibility: born ? 1 : 0, holeMaturity: expanded ? smooth(LIMITS.boom, 1, this.position) : 0.03, spaceReveal: born ? expanded ? 0.35 + 0.65 * smooth(LIMITS.boom, 1, this.position) : 0.04 : 0, unfold: expanded ? 1 : 0, collapseAmount: 0, boomEnvelope: 0, boomProgress: 0, coreFlare: born ? 0 : 0.3 * smooth(0.6, LIMITS.collapse, this.position), corePit: born ? 1 : 0, diskForm: born ? expanded ? 1 : NEWBORN_DISK : 0, contract: born ? expanded ? 1 : HELD : 0, expansion: 1 };
  }
  visual() {
    const base = this.stable(), t = this.elapsed / this.duration();
    if (this.phase === "implode") {
      const e = this.entry, u = clamp(t), s = smooth(0, 0.8, u), end = smooth(0.8, 1, u);
      return { ...blend(e, base, end), swallow: s, followKnob: true, unfold: (e.unfold ?? 1) * (1 - s), spaceReveal: e.spaceReveal * (1 - end) + base.spaceReveal * end, holeVisibility: 1 + (base.holeVisibility - 1) * smooth(0.82, 0.95, u), corePit: 1 + (base.corePit - 1) * smooth(0.8, 0.93, u), diskForm: (e.diskForm + (0.2 - e.diskForm) * smooth(0.3, 0.8, u)) * (1 - end) + base.diskForm * end, holeMaturity: (e.holeMaturity + (0.03 - e.holeMaturity) * smooth(0.3, 0.8, u)) * (1 - end) + base.holeMaturity * end, coreFlare: base.coreFlare + 0.9 * Math.exp(-Math.pow((u - 0.88) / 0.05, 2)) * (1 - base.holeVisibility), collapseAmount: 0, boomEnvelope: 0, entryWarp: 0, entryDust: 0, expansion: 1, charge: base.charge * smooth(0.9, 1, u) };
    }
    if (this.phase === "returning") return { ...blend(this.entry, base, smooth(0, 1, t)), entryDust: 0, boomProgress: Math.min(1, (this.entry.boomProgress ?? 0) + clamp(t) * 0.3) };
    if (this.phase === "collapse") {
      const c = clamp(t);
      return { ...base, charge: 1 - smooth(0.35, 0.5, c), holeVisibility: smooth(0.43, 0.47, c), holeMaturity: 0.03, spaceReveal: 0.04 * smooth(0.5, 1, c), collapseAmount: smooth(0, 0.5, c) * (1 - 0.6 * smooth(0.7, 1, c)), coreFlare: (0.3 + 0.7 * smooth(0, 0.45, c)) * (1 - smooth(0.5, 0.95, c)), corePit: smooth(0.45, 0.95, c), diskForm: 0.15 * smooth(0.75, 1, c), contract: HELD * smooth(0, 0.8, c), boomEnvelope: 0, unfold: 0, expansion: 0 };
    }
    if (this.phase === "newborn") return { ...base, holeVisibility: 1, holeMaturity: 0.03, spaceReveal: 0.04, coreFlare: 0, corePit: 1, contract: HELD, diskForm: 0.15 + (NEWBORN_DISK - 0.15) * smooth(0, 1, t), unfold: 0, expansion: 0 };
    if (this.phase === "boom") {
      const p = clamp(t), wave = p < 0.3 ? smooth(0, 0.3, p) : 1 - smooth(0.3, 1, p);
      return { ...base, holeVisibility: 1, holeMaturity: 0.03 + (base.holeMaturity - 0.03) * smooth(0, 1, p), spaceReveal: 0.04 + (base.spaceReveal - 0.04) * smooth(0, 0.45, p), unfold: p, boomEnvelope: wave, boomProgress: p, contract: HELD, coreFlare: 0.45 * (1 - smooth(0, 0.25, p)), diskForm: NEWBORN_DISK + (1 - NEWBORN_DISK) * smooth(0, 0.6, p), expansion: smooth(0, 0.85, p), entryWarp: smooth(0.55, 1, p), entryDust: 0.3 * smooth(0.55, 1, p) };
    }
    if (this.phase === "entry") return { ...base, boomProgress: 1, entryWarp: 1, entryDust: 0.3 + 0.45 * clamp(t) };
    if (this.phase === "decel") return { ...base, boomProgress: 1, entryWarp: Math.pow(1 - clamp(t), 1.6), entryDust: 0.75 + 0.25 * smooth(0, 1, t) };
    return base;
  }
  duration() {
    return { collapse: this.fast ? 0.12 : 0.22, newborn: this.fast ? 0.05 : 0.12, boom: this.fast ? 0.28 : 0.45, entry: this.plunging ? PLUNGE.entry : this.fast ? 0.25 : 0.4, decel: this.plunging ? PLUNGE.decel : this.fast ? 0.35 : 0.6, settling: this.fast ? 0.12 : 0.18, returning: 0.5, implode: IMPLODE.seconds }[this.phase] ?? 1;
  }
  begin(id) {
    if (!Number.isSafeInteger(id) || id <= this.intentId) return false;
    this.intentId = id;
    this.active = true;
    return true;
  }
  input(position, id = this.intentId) {
    if (!this.active || id !== this.intentId) return;
    const p = clamp(position), previous = this.position, before = this.visual();
    this.position = p;
    if (p < LIMITS.boom) this.crossedB = false;
    if (p < previous && ["boom", "collapse"].includes(this.phase)) {
      this.entry = before;
      this.phase = "returning";
      this.elapsed = 0;
      this.plunging = false;
    }
    if (previous >= LIMITS.boom && p < LIMITS.boom && ["settled", "settling", "entry", "decel"].includes(this.phase)) {
      this.entry = before;
      this.phase = before.unfold >= 0.999 ? "implode" : "returning";
      this.elapsed = 0;
      this.plunging = false;
    }
    if (this.phase === "implode" && p >= LIMITS.boom && this.consumed) {
      this.entry = before;
      this.phase = "returning";
      this.elapsed = 0;
    }
    if (p < LIMITS.collapse - 4e-3 && !["energy", "returning", "implode"].includes(this.phase)) {
      this.entry = before;
      this.phase = "returning";
      this.elapsed = 0;
      this.plunging = false;
    }
    if (previous < LIMITS.collapse && p >= LIMITS.collapse && ["energy", "returning", "implode"].includes(this.phase)) {
      this.fast = p - previous > 0.12;
      this.phase = "collapse";
      this.elapsed = 0;
    }
    if (previous < LIMITS.boom && p >= LIMITS.boom && !this.consumed) this.crossedB = true;
  }
  release() {
    this.active = false;
  }
  // Click on the quiet Max hole: a short plunge into space (entry → decel) that
  // joins the current Max state. Never the BOOM again, never while one runs, and
  // not with reduced motion. Returns whether it started.
  plunge(reduced = false) {
    if (reduced || this.phase !== "settled" || this.position < 0.999) return false;
    this.plunging = true;
    this.phase = "entry";
    this.elapsed = 0;
    return true;
  }
  cancel(position) {
    this.plunging = false;
    this.entry = this.visual();
    this.position = clamp(position);
    this.phase = "returning";
    this.elapsed = 0;
    this.active = false;
    this.crossedB = false;
  }
  suspend(position = this.position) {
    this.position = clamp(position);
    this.crossedB = false;
    this.active = false;
    this.elapsed = 0;
    if (this.position >= LIMITS.boom) this.consumed = true;
    this.phase = this.position < LIMITS.collapse ? "energy" : this.position < LIMITS.boom ? "newborn" : "settled";
  }
  sync(position) {
    if (this.phase === "implode" && position < LIMITS.boom) {
      this.position = clamp(position);
      return;
    }
    const before = this.visual();
    if (position < LIMITS.boom && before.unfold >= 0.999 && ["settled", "settling", "entry", "decel"].includes(this.phase)) {
      this.entry = before;
      this.position = clamp(position);
      this.phase = "implode";
      this.elapsed = 0;
      this.active = false;
      this.plunging = false;
      this.crossedB = false;
      return;
    }
    this.cancel(position);
    if (position >= LIMITS.boom) this.consumed = true;
  }
  step(delta, { speed = 1, reduced = false, staticMode = false } = {}) {
    if (!Number.isFinite(delta) || staticMode || !Number.isFinite(speed) || speed <= 0) {
      this.suspend();
      return;
    }
    if (delta > 0.25) {
      if (["collapse", "newborn"].includes(this.phase)) {
        this.crossedB = false;
        this.active = false;
        if (this.position >= LIMITS.boom) this.consumed = true;
      } else this.suspend();
      return;
    }
    const dt = Math.max(0, Math.min(delta, 0.05));
    this.lowTime = this.active && this.position < LIMITS.rearm ? this.lowTime + dt : 0;
    if (this.lowTime >= 0.18) {
      this.consumed = false;
      this.crossedB = false;
    }
    this.belowTime = this.position < LIMITS.boom && this.phase !== "boom" ? (this.belowTime ?? 0) + dt : 0;
    if (this.belowTime >= 0.6 && this.consumed) {
      this.consumed = false;
      this.crossedB = false;
    }
    const min = { collapse: 0.06, newborn: 0.04, boom: 0.12, entry: 0.1, decel: 0.15, settling: 0.08, returning: 0.08, implode: 0.4 }[this.phase] ?? 0.01;
    const duration = this.duration(), rate = Math.min(Math.max(0, speed), duration / min);
    this.elapsed += dt * rate;
    if (this.phase === "collapse" && this.elapsed >= duration) {
      this.phase = "newborn";
      this.elapsed = 0;
      return;
    }
    if (this.phase === "newborn" && this.elapsed >= duration && this.crossedB && this.position >= LIMITS.boom && !this.consumed) {
      this.consumed = true;
      this.crossedB = false;
      this.origin = worldPoint(this.position, 0);
      this.count++;
      this.phase = reduced ? "settling" : "boom";
      this.elapsed = 0;
      return;
    }
    if (this.phase === "newborn" && this.elapsed >= duration && this.consumed && this.position >= LIMITS.boom) {
      this.phase = "settling";
      this.elapsed = 0;
      return;
    }
    if (this.phase === "boom" && this.elapsed >= duration) {
      this.phase = reduced ? "settling" : "entry";
      this.elapsed = 0;
      return;
    }
    if (this.phase === "entry" && this.elapsed >= duration) {
      this.phase = "decel";
      this.elapsed = 0;
      return;
    }
    if (["settling", "returning", "decel", "implode"].includes(this.phase) && this.elapsed >= duration) {
      this.plunging = false;
      this.phase = this.position < LIMITS.collapse ? "energy" : this.position < LIMITS.boom ? "newborn" : "settled";
      this.elapsed = 0;
    }
  }
};
function visualState(world) {
  return world.evolution?.visual() ?? { charge: world.position >= LIMITS.collapse ? 0 : chargeAt(world.position), swallow: 0, holeVisibility: holeState(world.position).visibility, holeMaturity: holeState(world.position).maturity, spaceReveal: smooth(2 / 3, 0.96, world.position), unfold: 1, collapseAmount: 0, boomEnvelope: 0, boomProgress: 0, coreFlare: 0, corePit: 1, diskForm: 1, contract: world.position >= LIMITS.collapse ? 1 : 0, expansion: 1, entryWarp: 0, entryDust: 0 };
}
var UNFOLD_SPAN = Math.ceil(Math.hypot(SPACE.railX + SPACE.thumbInset + SPACE.travel, SPACE.height / 2)) + 20;
function unfoldMask(x, y, holeX, unfold = 1) {
  return revealMask(x, y, holeX, unfold);
}

// src/render/meteor.mjs
var METEOR = Object.freeze({ limit: 4, cooldown: 1.5, rate: 0.35, tail: 60, pull: 4e5, soft: 10, speed: [190, 250], miss: [16, 130] });
function projectMeteor(m, world, reduced = false) {
  const head = worldPoint(m.x, m.y), life = smooth(0, 0.08, m.age) * (1 - smooth(Math.max(0.08, m.life - 0.22), m.life, m.age));
  const visual = visualState(world), alpha = unfoldMask(head.x, head.y, worldPoint(world.position, 0).x, visual.unfold) * life * visual.spaceReveal * world.config.brightness * world.elements.meteors * (m.near ? 0.95 : 0.8);
  const points2 = [head];
  let length = 0;
  if (!reduced) for (const pair of m.points) {
    const p = worldPoint(...pair), a = points2.at(-1), d = Math.hypot(p.x - a.x, p.y - a.y);
    if (d < 1e-3) continue;
    const remain = METEOR.tail - length;
    if (d > remain) {
      points2.push({ x: a.x + (p.x - a.x) * remain / d, y: a.y + (p.y - a.y) * remain / d });
      length = METEOR.tail;
      break;
    }
    points2.push(p);
    length += d;
    if (length >= METEOR.tail) break;
  }
  const look = opticalProfile(world);
  return { head, points: points2, length, alpha: alpha * look.stars, tone: opticalColor(m.tone > 0.8 ? [1, 0.94, 0.85] : [0.94, 0.96, 1], { ...look, gain: 1 }), softening: softenMotion(m.vx * 282, m.vy * 18, world, reduced), radius: m.near ? 1 : 0.85 };
}

// src/render/flight.mjs
var VANISH = Object.freeze({ x: SPACE.railX + SPACE.railWidth * 0.28, y: SPACE.centerY });
function depthLayer(star) {
  const z = clamp(star.z), layer = z < 0.45 ? 0 : z < 0.75 ? 1 : 2;
  const bounds = [[5, 10], [2.8, 5], [1, 2.8]][layer];
  const f = layer === 0 ? (z - 0.18) / 0.27 : layer === 1 ? (z - 0.45) / 0.3 : (z - 0.75) / 0.25;
  return { layer, min: bounds[0], max: bounds[1], initial: bounds[0] + clamp(f) * (bounds[1] - bounds[0]) };
}
var Flight = class {
  constructor() {
    this.distance = 0;
    this.gain = 0;
    this.warp = 0;
    this.driveWarp = 0;
    this.velocity = 0.012;
    this.drift = 0;
    this.sail = 0;
  }
  // Warp comes only from Max overdrive (drive 0–1 while held past Max); holding
  // plain Max stays quiet. Release decays slowly: fast → cruising → quiet Max.
  // boost is the short surge into space after the tear (follows the evolution).
  step(delta, { position, pressed = false, reveal = 0, reduced = false, speed = 1, drive = 0, boost = 0 } = {}) {
    const dt = Number.isFinite(delta) ? clamp(delta, 0, 0.05) : 0;
    const s = Number.isFinite(speed) ? clamp(speed, 0, 10) : 0, target = reduced ? 0 : smooth(LIMITS.boom, 1, position ?? 0) * clamp(reveal);
    if (s === 0) return;
    this.gain += (target - this.gain) * (1 - Math.exp(-dt * 7));
    const warpTarget = !reduced && pressed && target > 0.15 ? clamp(drive) : 0;
    this.driveWarp += (warpTarget - this.driveWarp) * (1 - Math.exp(-dt * (warpTarget > this.driveWarp ? 2.5 : 1.1)));
    const surge = reduced ? 0 : clamp(boost);
    this.warp = Math.max(this.driveWarp, surge);
    this.velocity = (0.012 + 0.1 * this.gain * (pressed ? 1 : 0.1) + 0.7 * this.warp * this.gain) * (reduced ? 0.12 : 1);
    this.distance += dt * s * this.velocity;
    this.sail = reduced ? 0 : (SAIL.quiet + (SAIL.full - SAIL.quiet) * this.driveWarp) * this.gain + SAIL.entry * surge;
    this.drift += dt * Math.min(s, 2.5) * this.sail;
  }
};
var mod = (x, n) => (x % n + n) % n;
function perspective(star, flight, reduced = false) {
  const info = depthLayer(star), world = worldPoint(star.x, star.y), span = info.max - info.min, distance = flight?.distance ?? 0;
  const par = parallax(star.z), [x0, w] = [0, SPACE.width], bx = reduced ? world.x : x0 + mod(world.x - x0 - (flight?.drift ?? 0) * par, w), seam = reduced ? 1 : smooth(0, 40, bx - x0) * smooth(0, 40, x0 + w - bx), base = { x: bx, y: world.y };
  const z = info.min + mod(info.initial - info.min - distance, span), gain = reduced ? 0 : clamp(flight?.gain ?? 0), scale2 = 3.5 / z;
  const factor = 1 + (scale2 - 1) * gain, x = VANISH.x + (base.x - VANISH.x) * factor, y = VANISH.y + (base.y - VANISH.y) * factor;
  const t = (z - info.min) / span, fade = smooth(0, 0.1, t) * (1 - smooth(0.9, 1, t));
  const alpha = fade * seam;
  const radial = (flight?.velocity ?? 0) / z * gain, lateral = (flight?.sail ?? 0) * par, mx = (x - VANISH.x) * radial - lateral, my = (y - VANISH.y) * radial, r = Math.hypot(mx, my) || 1, eligible = info.layer > 0 && star.id % 4 === 0;
  const tail = eligible ? Math.min(5, (flight?.warp ?? 0) * (1 + 2 / z)) : 0;
  return { x, y, layer: info.layer, viewDepth: z, scale: factor, alpha, sizeScale: Math.sqrt(Math.max(0.3, factor)), trailX: mx / r, trailY: my / r, trailLength: tail };
}

// src/render/deep-sky.mjs
var GALAXIES = Object.freeze([
  [150, 78, 30, 0.5, 0.55, 0, 1.3, 0.85],
  [700, 300, 19, -0.35, 0.7, 0, 4.1, 0.8],
  [430, 198, 11, 1.1, 0.92, 0, 7.7, 0.75],
  [330, 322, 17, 0.9, 0.6, 1, 2.6, 0.8],
  [770, 74, 27, -0.24, 0.13, 2, 5.2, 0.8],
  [64, 300, 12, 0.42, 0.18, 2, 8.4, 0.7],
  [566, 338, 13, 0.3, 0.75, 3, 3.3, 0.7],
  [246, 36, 7, 0, 0.85, 3, 6.6, 0.6],
  [826, 228, 28, 0.2, 0.7, 4, 9.1, 0.8],
  [36, 150, 10, 1.4, 0.7, 4, 2.2, 0.7],
  [404, 292, 5, 0.7, 0.7, 3, 1.1, 0.55],
  [628, 112, 6, -0.6, 0.4, 0, 5.9, 0.6]
].map(Object.freeze));
var galaxyParallax = (size) => 0.25 + 0.25 * Math.min(1, size / 30);
var MILKY_WAY = Object.freeze({ from: [0, 250], to: [SPACE.width, 22], width: 52, parallax: 0.06 });
var NEBULAE = Object.freeze([
  [590, 92, 58, 0.3, 0.7, 0, 2.7, 0.55],
  [110, 258, 34, -0.5, 0.8, 0, 6.1, 0.5],
  [738, 252, 26, 0, 0.9, 1, 4.4, 0.55],
  [420, 334, 7, 0.4, 1, 2, 1.9, 0.85],
  [196, 186, 34, -0.4, 0.5, 3, 8.8, 0.75]
].map(Object.freeze));
var nebulaParallax = (size) => 0.15 + 0.15 * Math.min(1, size / 60);
var SIGHTS = Object.freeze([
  [360, 100, 26, 0.5, 0.85, 0, 3.7, 0.8],
  [800, 330, 14, -0.3, 0.9, 0, 7.3, 0.7],
  [230, 266, 20, 0.2, 0.8, 1, 5.5, 0.8],
  [690, 150, 18, 0, 0.9, 2, 2.4, 0.8],
  [40, 62, 10, 0, 1, 3, 6.2, 0.85],
  [400, 182, 7, 0, 1, 3, 1.4, 0.7]
].map(Object.freeze));
var sightParallax = (size) => 0.2 + 0.2 * Math.min(1, size / 26);
var PASSER_SLOTS = 3;
var num = (v) => Number.isInteger(v) ? `${v}.` : String(v);
var glslNebulae = NEBULAE.map(([x, y, s, a, t, k, seed, gain]) => `N(p,vec4(${num(x)},${num(y)},${num(s)},${num(a)}),vec4(${num(t)},${num(k)},${num(seed)},${num(gain)}),${num(nebulaParallax(s))})`);
var glslSights = SIGHTS.map(([x, y, s, a, t, k, seed, gain]) => `S(p,vec4(${num(x)},${num(y)},${num(s)},${num(a)}),vec4(${num(t)},${num(k)},${num(seed)},${num(gain)}),${num(sightParallax(s))})`);
var glslGalaxies = GALAXIES.map(([x, y, s, a, t, k, seed, gain]) => `G(p,vec4(${num(x)},${num(y)},${num(s)},${num(a)}),vec4(${num(t)},${num(k)},${num(seed)},${num(gain)}),${num(galaxyParallax(s))})`).join(";");
var DEEP_SKY_GLSL = `
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
vec3 galaxies(vec2 p){vec3 col=vec3(0.);${GALAXIES.map((_, i) => `col+=${glslGalaxies.split(";")[i]};`).join("")}return col;}
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
vec3 nebulae(vec2 p,vec3 col){${glslNebulae.map((x) => `{vec4 n=${x};col=col*(1.-n.a)+n.rgb;}`).join("")}return col;}
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
vec3 sights(vec2 p){vec3 col=vec3(0.);${glslSights.map((x) => `col+=${x};`).join("")}return col;}
// Near passing stars: a small bright sphere, a soft halo, a faint corona and
// thin diffraction spikes.
vec3 passers(vec2 p){vec3 col=vec3(0.);for(int i=0;i<${PASSER_SLOTS};i++){vec4 s=uPassers[i];if(s.w<.002)continue;vec2 d=p-s.xy;float r=length(d),z=s.z;if(r>z*16.)continue;
 float core=exp(-r*r/(z*z)),halo=exp(-r/(z*3.4))*.32,corona=exp(-pow((r-z*1.7)/(z*.4),2.))*.1,spikes=(exp(-abs(d.y)/.55)*exp(-abs(d.x)/(z*6.))+exp(-abs(d.x)/.55)*exp(-abs(d.y)/(z*6.)))*.14;
 col+=(uPasserTint[i]*(halo+corona+spikes)+mix(uPasserTint[i],vec3(1.),.7)*core*1.5)*s.w;}return col;}
`;

// src/render/passers.mjs
var PASSER = Object.freeze({ interval: 9, z0: 4.2, zEnd: 0.42, quiet: 0.38, warp: 2.4, surge: 3.4, lens: 9, lensRange: 22 });
var TINTS = Object.freeze([[0.72, 0.8, 1], [1, 0.93, 0.82], [1, 0.82, 0.62], [0.86, 0.9, 1]]);
function spawnPasser(rand) {
  const angle = rand(0, Math.PI * 2), reach = rand(26, 70);
  return { ox: Math.cos(angle) * reach, oy: Math.sin(angle) * reach * 0.7, z: PASSER.z0, lateral: 0, age: 0, tint: TINTS[Math.floor(rand(0, TINTS.length)) % TINTS.length], size: rand(0.85, 1.25) };
}
function stream(world) {
  if (world.passerRandom) return world.passerRandom;
  let s = 625341585;
  world.passerRandom = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  return world.passerRandom;
}
function stepPassers(world, dt, { position, reveal, warp = 0, surge = 0, holeVisibility = 0, reduced = false, enabled = true, rate = 1 }) {
  world.passerState ??= [];
  const random = stream(world), rand = (a, b) => a + (b - a) * random();
  const list = world.passerState, active = enabled && !reduced && reveal > 0.6 && position > 0.9;
  if (active && list.length < PASSER_SLOTS) {
    const perSecond = rate * (1 + 3 * warp + 5 * surge) / PASSER.interval;
    if (random() < dt * perSecond) list.push(spawnPasser(rand));
  }
  const hole = worldPoint(world.position, 0), sail = world.flight?.sail ?? 0, speed = PASSER.quiet + PASSER.warp * warp + PASSER.surge * surge;
  world.passers = [];
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    s.age += dt;
    s.z -= dt * speed * (reduced ? 0.2 : 1);
    s.lateral += dt * sail;
    const factor = PASSER.z0 / Math.max(s.z, 0.05);
    let x = VANISH.x + s.ox * factor - s.lateral, y = VANISH.y + s.oy * factor;
    if (holeVisibility > 0.01) {
      const dx = x - hole.x, dy = y - hole.y, d = Math.hypot(dx, dy) || 1, push = PASSER.lens * holeVisibility * Math.exp(-d / PASSER.lensRange);
      x += dx / d * push;
      y += dy / d * push;
    }
    const near = 1 - (s.z - PASSER.zEnd) / (PASSER.z0 - PASSER.zEnd), radius = s.size * (0.45 + 2.3 * near * near);
    const fadeIn = smooth(0, 0.8, s.age), fadeOut = 1 - smooth(0.85, 1, near), edge = smooth(-30, 10, Math.min(x, SPACE.width - x, y, SPACE.height - y));
    if (s.z <= PASSER.zEnd || edge <= 0 && s.age > 1) {
      list.splice(i, 1);
      continue;
    }
    world.passers.push({ x, y, radius, alpha: clamp(fadeIn * fadeOut * (0.35 + 0.65 * near) * (active ? 1 : smooth(0, 0.6, reveal))), tint: s.tint });
  }
  if (!active && reveal < 0.3) list.length = 0;
}

// src/render/photos.mjs
var PHOTOS = Object.freeze([
  { id: "heic1501a", file: "heic1501a.jpg", title: "\u521B\u751F\u4E4B\u67F1\uFF08\u9E70\u72B6\u661F\u4E91 M16\uFF09", classic: "\u521B\u751F\u4E4B\u67F1 M16", crop: [0, 28, 1280, 1280], floor: 0.05, ramp: 0.25, edge: 1, radius: 46 },
  { id: "heic0506a", file: "heic0506a.jpg", title: "\u6DA1\u72B6\u661F\u7CFB M51 \u53CA\u4F34\u661F\u7CFB", classic: "\u6DA1\u72B6\u661F\u7CFB M51", crop: [0, 0, 1280, 888], floor: 0.06, ramp: 0.3, radius: 44 },
  { id: "opo0328a", file: "opo0328a.jpg", title: "\u8349\u5E3D\u661F\u7CFB M104", classic: "\u8349\u5E3D\u661F\u7CFB M104", crop: [140, 78, 1e3, 560], floor: 0.06, ramp: 0.3, radius: 40 },
  { id: "heic0515a", file: "heic0515a.jpg", title: "\u87F9\u72B6\u661F\u4E91 M1", classic: "\u87F9\u72B6\u661F\u4E91 M1", crop: [90, 90, 1100, 1100], floor: 0.05, ramp: 0.25, stars: 0.3, radius: 36 },
  { id: "heic0707a", file: "heic0707a.jpg", title: "\u8239\u5E95\u5EA7\u661F\u4E91", classic: null, strip: [1460, 196], crop: [0, 0, 1280, 620], floor: 0.04, ramp: 0.25, edge: 1, radius: 56 },
  { id: "heic0601a", file: "heic0601a.jpg", title: "\u730E\u6237\u5EA7\u5927\u661F\u4E91 M42", classic: "\u730E\u6237\u5EA7\u5927\u661F\u4E91 M42", crop: [0, 0, 1280, 1280], floor: 0.05, ramp: 0.25, edge: 1, radius: 50 },
  { id: "heic0414a", file: "heic0414a.jpg", title: "\u732B\u773C\u661F\u4E91 NGC 6543", classic: "\u732B\u773C\u661F\u4E91 NGC 6543", crop: [240, 240, 800, 800], floor: 0.12, ramp: 0.3, radius: 24 },
  { id: "heic0615a", file: "heic0615a.jpg", title: "\u89E6\u987B\u661F\u7CFB NGC 4038/4039", classic: "\u89E6\u987B\u661F\u7CFB NGC 4038/9", crop: [140, 135, 1e3, 1e3], floor: 0.06, ramp: 0.3, radius: 38 },
  { id: "heic0711a", file: "heic0711a.jpg", title: "\u661F\u66B4\u661F\u7CFB NGC 4449", classic: null, strip: [2190, 190], crop: [0, 0, 1280, 825], floor: 0.07, ramp: 0.3, edge: 0.8, radius: 42 },
  { id: "heic0910h", file: "heic0910h.jpg", title: "\u8774\u8776\u661F\u4E91 NGC 6302", classic: "\u8774\u8776\u661F\u4E91 NGC 6302", crop: [90, 96, 1100, 1300], floor: 0.05, ramp: 0.25, stars: 0.25, radius: 36 }
].map(Object.freeze));
var PHOTO_CREDIT = "ESA/Hubble & NASA";

// src/render/classics.mjs
var CLASSICS = Object.freeze([
  ["\u87F9\u72B6\u661F\u4E91 M1", 60, 300, 28, 0.5, 0.75, 0, 1.7, 0.9],
  ["\u732B\u5934\u9E70\u661F\u4E91 M97", 190, 62, 20, 0, 1, 1, 2.3, 0.9],
  ["\u73AF\u72B6\u661F\u4E91 M57", 300, 186, 15, 0.4, 0.8, 2, 3.1, 1],
  ["\u732B\u773C\u661F\u4E91 NGC 6543", 420, 72, 17, 0.3, 1, 3, 4.6, 1],
  ["\u87BA\u65CB\u661F\u4E91 NGC 7293", 560, 302, 32, 0.2, 0.9, 4, 5.2, 0.9],
  ["\u54D1\u94C3\u661F\u4E91 M27", 700, 62, 22, 0.3, 0.85, 5, 6.4, 0.9],
  ["\u8774\u8776\u661F\u4E91 NGC 6302", 820, 322, 26, -0.2, 1, 6, 7.1, 0.9],
  ["\u9A6C\u5934\u661F\u4E91 B33", 960, 72, 38, 0, 1, 7, 8.3, 0.85],
  ["\u521B\u751F\u4E4B\u67F1 M16", 1100, 300, 40, 0, 1, 8, 9.2, 0.85],
  ["\u730E\u6237\u5EA7\u5927\u661F\u4E91 M42", 1250, 72, 44, 0.2, 0.9, 9, 1.4, 0.85],
  ["\u73AB\u7470\u661F\u4E91 NGC 2237", 1400, 312, 38, 0, 1, 10, 2.8, 0.8],
  ["\u6C14\u6CE1\u661F\u4E91 NGC 7635", 1530, 62, 24, 0, 1, 11, 3.6, 0.9],
  ["\u4ED9\u5973\u5EA7\u661F\u7CFB M31", 1700, 312, 62, 0.55, 0.32, 12, 4.4, 0.85],
  ["\u8349\u5E3D\u661F\u7CFB M104", 1880, 62, 30, -0.12, 0.3, 13, 5.9, 0.9],
  ["\u6DA1\u72B6\u661F\u7CFB M51", 2e3, 312, 30, 0.3, 0.85, 14, 6.7, 0.9],
  ["\u8F66\u8F6E\u661F\u7CFB", 2120, 72, 26, 0.4, 0.8, 15, 7.8, 0.9],
  ["\u89E6\u987B\u661F\u7CFB NGC 4038/9", 2250, 302, 32, 0.3, 1, 16, 8.6, 0.9],
  ["\u970D\u683C\u5929\u4F53", 2370, 188, 18, 0, 1, 17, 9.5, 0.95],
  ["\u9762\u7EB1\u661F\u4E91 NGC 6960", 2480, 322, 46, 0.2, 1, 18, 1.2, 0.8],
  ["\u7231\u65AF\u57FA\u6469\u661F\u4E91 NGC 2392", 2560, 194, 13, 0, 1, 19, 2.1, 1]
].map(Object.freeze));
var CLASSIC_STRIP = 2640;
var classicParallax = (size) => 0.3 + 0.15 * Math.min(1, size / 40);
var num2 = (v) => Number.isInteger(v) ? `${v}.` : String(v);
var twin = (name) => PHOTOS.some((p) => p.classic === name);
var calls = CLASSICS.map(([name, x, y, s, a, t, k, seed, gain]) => `${twin(name) ? "if(uPhotos<.5)" : ""}{vec4 n=C(p,vec4(${num2(x)},${num2(y)},${num2(s)},${num2(a)}),vec4(${num2(t)},${num2(k)},${num2(seed)},${num2(gain)}),${num2(classicParallax(s))});col=col*(1.-n.a)+n.rgb;}`).join("");
var CLASSICS_GLSL = `
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
var PHOTO_PLACES = Object.freeze(PHOTOS.map((p, tile) => {
  const c = CLASSICS.find((k) => k[0] === p.classic), [x, y] = c ? [c[1], c[2]] : p.strip, [, , w, h] = p.crop;
  const scale2 = Math.min(256 / w, 256 / h), tw = Math.round(w * scale2) / 1024, th = Math.round(h * scale2) / 768, u = (tile % 4 * 256 + 128) / 1024, v = (Math.floor(tile / 4) * 256 + 128) / 768;
  return Object.freeze({ id: p.id, tile, x, y, hw: p.radius * Math.min(1, w / h), hh: p.radius * Math.min(1, h / w), parallax: classicParallax(c ? c[3] : p.radius * 0.8), uv: Object.freeze([u - tw / 2, v - th / 2, u + tw / 2, v + th / 2]) });
}));
function photoSprites(drift, offset) {
  return PHOTO_PLACES.flatMap((s) => {
    const m = Math.max(s.hw, s.hh) + 10, x = ((s.x - drift * s.parallax - offset + m) % CLASSIC_STRIP + CLASSIC_STRIP) % CLASSIC_STRIP - m;
    return x - s.hw > SPACE.width ? [] : [{ ...s, x }];
  });
}
var classicOffset = (random) => random() * CLASSIC_STRIP;

// src/render/recovery.mjs
function recoveryAmount(world, reduced = false) {
  if (reduced || world.config.reducedMotion || world.config.quality === "static") return 0;
  const v = visualState(world), p = world.position, target = smooth(LIMITS.boom, 1, p) * v.spaceReveal, lag = clamp(((world.flight?.gain ?? 0) - target) * 1.6);
  return clamp(lag + clamp(world.pull ?? 0) * 0.75) * smooth(0.02, 0.22, v.spaceReveal) * (1 - smooth(0.9, 1, p)) * (1 - clamp(v.boomEnvelope));
}
function recoveryRibbon(x, world, amount) {
  const cx = worldPoint(world.position, 0).x, near = Math.exp(-Math.pow((x - cx) / 72, 2));
  return { y: SPACE.centerY + (2.8 - amount * 1.8) * Math.sin((x - cx) * 0.045 - world.time * 0.55), alpha: amount * (0.035 + 0.12 * near), width: 0.65 };
}

// src/render/nebula.mjs
var fract = (x) => x - Math.floor(x);
function hash(x, y) {
  let a = fract(x * 123.34), b = fract(y * 456.21);
  const d = a * (a + 45.32) + b * (b + 45.32);
  a += d;
  b += d;
  return fract(a * b);
}
function noise(x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  let u = fract(x), v = fract(y);
  u = u * u * (3 - 2 * u);
  v = v * v * (3 - 2 * v);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) {
  let n = 0.57 * noise(x, y);
  x = x * 2.1 + 17;
  y = y * 2.1 + 17;
  n += 0.27 * noise(x, y);
  return n + 0.13 * noise(x * 2.03 + 9, y * 2.03 + 9);
}
function detailFbm(x, y, octaves) {
  if (octaves >= 3) return fbm(x, y);
  let n = 0.57 * noise(x, y);
  if (octaves < 2) return n + 0.2;
  x = x * 2.1 + 17;
  y = y * 2.1 + 17;
  return n + 0.27 * noise(x, y) + 0.065;
}
var nebulaBackdrop = (world) => smooth(0.04, 0.35, visualState(world).spaceReveal);
function nebulaLayers(world, reduced = false, detail) {
  const envelope = visualState(world).spaceReveal * nebulaBackdrop(world) * opticalProfile(world).fog * world.awake * world.elements.nebulae, returning = recoveryAmount(world, reduced);
  return world.clouds.slice(0, 4).map((n) => {
    const layer = Math.abs(n.id) % 3, seed = hash(n.id, 13) * 71, z = [0.19, 0.46, 0.76][layer] + hash(n.id, 7) * [0.25, 0.28, 0.23][layer];
    const p = perspective({ id: n.id, x: n.x, y: n.y, z }, world.flight, reduced), life = smooth(0, 3, n.age) * (1 - smooth(n.life - 4, n.life, n.age));
    return { ...detail && detail.cloudOctaves < 3 ? { detailOctaves: detail.cloudOctaves } : {}, id: n.id, layer, x: p.x, y: SPACE.centerY + (p.y - SPACE.centerY) * (1 - returning * 0.2), z: p.viewDepth, radius: Math.min(160, Math.max(12, n.radius * 314 * 0.85 * p.scale)), aspect: (0.28 + hash(n.id, 31) * 0.13) * (1 - returning * 0.3), seed, tone: n.tone, twist: clamp(n.twist, 0, 1), phase: world.time * 0.025, alpha: n.opacity * life * p.alpha * envelope * unfoldMask(p.x, p.y, worldPoint(world.position, 0).x, visualState(world).unfold) };
  });
}
function nebulaDensity(x, y, n) {
  const u = (x - n.x) / n.radius, v = (y - n.y) / (n.radius * n.aspect);
  if (Math.abs(u) > 2 || Math.abs(v) > 2) return 0;
  const a = u + 0.08 * Math.sin(v * 2.8 + n.phase) + v * n.twist * 0.12, b = v + 0.09 * Math.cos(u * 2.2 - n.phase * 0.8);
  const octaves = n.detailOctaves ?? 3, body = detailFbm(a * 3.2 + n.seed + n.phase * 0.12, b * 3.2 + n.seed, octaves), dust2 = detailFbm(a * 5.7 + n.seed, b * 5.7 + n.seed + n.phase * 0.1, octaves);
  return Math.exp(-(u * u + v * v) * 1.8) * smooth(0.25, 0.7, body) * (0.55 + 0.45 * smooth(0.25, 0.7, dust2));
}
function nebulaVisibility(point, position = 1) {
  return point.x >= 0 && point.x <= Math.min(SPACE.width, worldPoint(position, 0).x) && point.y >= 0 && point.y <= SPACE.height ? 1 : 0;
}
function nebulaTransmission(point, layers, position = 1) {
  if (!nebulaVisibility(point, position)) return 1;
  let t = 1;
  for (const n of layers) if (n.z < point.viewDepth && n.alpha > 1e-3) t *= 1 - Math.min(0.18, n.alpha * nebulaDensity(point.x, point.y, n) * 0.65);
  return Math.max(0.65, t);
}
function nebulaColor(tone) {
  return tone > 0.92 ? [0.3, 0.23, 0.22] : tone < 0.4 ? [0.29, 0.3, 0.31] : [0.22, 0.28, 0.34];
}
var NEBULA_GLSL = `
float cloudVisibility(vec2 p){return p.x>=0.&&p.x<=uSize.x&&p.y>=0.&&p.y<=uSize.y&&(p.x<=cx()||track(p)>1.||uDepth>.05)?1.:0.;}
uniform float uCloudOctaves;
float cloudFbm(vec2 p){if(uCloudOctaves>2.5)return fbm(p);float n=.57*noise(p);if(uCloudOctaves<1.5)return n+.2;p=p*2.1+17.;return n+.27*noise(p)+.065;}
float cloudDensity(vec2 d,vec4 shape){if(uCloudOctaves<2.5&&max(abs(d.x),abs(d.y))>2.)return 0.;float phase=uTime*.025;vec2 q=d+vec2(.08*sin(d.y*2.8+phase)+d.y*shape.w*.12,.09*cos(d.x*2.2-phase*.8));
float body=cloudFbm(q*3.2+vec2(shape.x+phase*.12,shape.x));float dust=cloudFbm(q*5.7+vec2(shape.x,shape.x+phase*.1));
return exp(-dot(d,d)*1.8)*smoothstep(.25,.7,body)*(.55+.45*smoothstep(.25,.7,dust));}
vec3 cloudColor(float tone){return tone>.92?vec3(.30,.23,.22):(tone<.4?vec3(.29,.30,.31):vec3(.22,.28,.34));}
`;

// src/shared/config.mjs
var FORMAT = 2;
var DEFAULTS = Object.freeze({
  speed: 1,
  activity: 1,
  style: "hybrid",
  stars: true,
  meteors: true,
  nebulae: true,
  clusters: true,
  lens: true,
  lensStrength: 0.6,
  gravity: 0.55,
  density: 1,
  meteorRate: 1,
  nebulaRate: 1,
  clusterRate: 1,
  spin: 1,
  brightness: 0.85,
  glow: 0.6,
  trails: 0.65,
  motionBlur: 0.3,
  reducedMotion: false,
  followSystemMotion: true,
  quality: "auto",
  uiScale: 1,
  popupPosition: null,
  dismiss: "fade",
  dock: true,
  viewWidth: 860,
  viewHeight: 380,
  viewFeather: 8
});
var NUMBERS = Object.freeze({ speed: [0.1, 10], activity: [0, 2], lensStrength: [0, 1], gravity: [0, 1], density: [0.25, 2], meteorRate: [0, 3], nebulaRate: [0, 3], clusterRate: [0, 3], spin: [0.1, 3], brightness: [0.25, 1.2], glow: [0, 1], trails: [0, 1], motionBlur: [0, 1], uiScale: [0.8, 1.25], viewWidth: [314, 860], viewHeight: [38, 380], viewFeather: [0, 32] });
var enumerations = { style: ["realistic", "scifi", "hybrid", "minimal"], quality: ["auto", "high", "medium", "low", "static"], dismiss: ["fade", "instant"] };
var plain = (v) => v && typeof v === "object" && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
var DEVICE_KEYS = Object.freeze(["quality", "reducedMotion", "followSystemMotion", "uiScale", "popupPosition", "dismiss", "dock"]);
var visualConfig = (value) => Object.fromEntries(Object.entries(validateConfig(value)).filter(([k]) => !DEVICE_KEYS.includes(k)));
var deviceConfig = (value) => Object.fromEntries(Object.entries(validateConfig(value)).filter(([k]) => DEVICE_KEYS.includes(k)));
function domain(value, device = false) {
  if (!plain(value) || Object.keys(value).some((k) => !Object.hasOwn(DEFAULTS, k) || DEVICE_KEYS.includes(k) !== device)) throw Error("\u914D\u7F6E\u5B57\u6BB5\u4E0D\u5C5E\u4E8E\u6B64\u6570\u636E\u57DF");
  return device ? deviceConfig(value) : visualConfig(value);
}
function validateConfig(input) {
  if (!plain(input)) throw Error("\u89C6\u89C9\u53C2\u6570\u5FC5\u987B\u4E3A JSON \u5BF9\u8C61");
  const output = { ...DEFAULTS };
  for (const [key, value] of Object.entries(input)) {
    if (key === "revealStyle") continue;
    if (!Object.hasOwn(DEFAULTS, key)) throw Error(`\u672A\u77E5\u89C6\u89C9\u53C2\u6570\uFF1A${key.slice(0, 32)}`);
    if (key === "popupPosition") {
      if (value !== null && (!plain(value) || Object.keys(value).length !== 2 || !["left", "top"].every((k) => Object.hasOwn(value, k) && Number.isFinite(value[k]) && Math.abs(value[k]) <= 1e5))) throw Error("\u5F39\u7A97\u4F4D\u7F6E\u65E0\u6548");
      output[key] = value === null ? null : { left: value.left, top: value.top };
      continue;
    }
    if (NUMBERS[key]) {
      const [a, b] = NUMBERS[key];
      if (typeof value !== "number" || !Number.isFinite(value) || value < a || value > b) throw Error(`\u53C2\u6570 ${key} \u8D85\u51FA\u8303\u56F4`);
    } else if (enumerations[key]) {
      if (!enumerations[key].includes(value)) throw Error(`\u53C2\u6570 ${key} \u65E0\u6548`);
    } else if (typeof value !== "boolean") throw Error(`\u53C2\u6570 ${key} \u5FC5\u987B\u662F\u5E03\u5C14\u503C`);
    output[key] = value;
  }
  if (output.viewWidth === 382 && output.viewHeight === 120 || output.viewWidth === 640 && output.viewHeight === 260) {
    output.viewWidth = DEFAULTS.viewWidth;
    output.viewHeight = DEFAULTS.viewHeight;
  }
  return output;
}
function cleanName(name) {
  if (typeof name !== "string" || !name.trim() || name.length > 48 || /[\u0000-\u001f\u007f]/u.test(name)) throw Error("\u9884\u8BBE\u540D\u79F0\u9700\u4E3A 1\u201348 \u4E2A\u53EF\u89C1\u5B57\u7B26");
  return name.trim();
}
var BUILTINS = Object.freeze([
  { name: "\u5199\u5B9E\u6DF1\u7A7A", config: { ...DEFAULTS, style: "realistic", glow: 0.4 } },
  { name: "\u79D1\u5E7B\u8DC3\u8FC1", config: { ...DEFAULTS, style: "scifi", activity: 1.35, glow: 0.8, trails: 0.85 } },
  { name: "\u5B81\u9759\u661F\u6D77", config: { ...DEFAULTS, activity: 0.55, density: 0.75, glow: 0.35, spin: 0.7 } }
].map((p) => ({ name: p.name, config: visualConfig(p.config) })));
function freshDocument() {
  return { formatVersion: FORMAT, revision: 0, config: visualConfig(DEFAULTS), device: deviceConfig(DEFAULTS), presets: BUILTINS.map((p) => ({ name: p.name, config: visualConfig(p.config) })) };
}
function validateDocument(input) {
  if (!plain(input)) throw Error("\u914D\u7F6E\u6587\u4EF6\u5FC5\u987B\u4E3A JSON \u5BF9\u8C61");
  if (input.formatVersion !== FORMAT) throw Object.assign(Error("\u6B64\u914D\u7F6E\u7248\u672C\u4E0D\u53D7\u652F\u6301\uFF1B\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559"), { code: "FORMAT_UNSUPPORTED" });
  if (Object.keys(input).some((k) => !["formatVersion", "revision", "config", "device", "presets"].includes(k))) throw Error("\u914D\u7F6E\u6587\u4EF6\u5305\u542B\u672A\u77E5\u5B57\u6BB5");
  if (!Array.isArray(input.presets) || input.presets.length > 32) throw Error("\u6700\u591A\u4FDD\u5B58 32 \u4E2A\u9884\u8BBE");
  const names = /* @__PURE__ */ new Set();
  const presets = input.presets.map((p) => {
    if (!plain(p) || Object.keys(p).some((k) => !["name", "config"].includes(k))) throw Error("\u9884\u8BBE\u683C\u5F0F\u65E0\u6548");
    const name = cleanName(p.name);
    if (names.has(name)) throw Error("\u9884\u8BBE\u540D\u79F0\u91CD\u590D");
    names.add(name);
    return { name, config: domain(p.config) };
  });
  const revision = input.revision ?? 0;
  if (!Number.isSafeInteger(revision) || revision < 0) throw Error("\u914D\u7F6E\u4FEE\u8BA2\u53F7\u65E0\u6548");
  return { formatVersion: FORMAT, revision, config: domain(input.config), device: domain(input.device, true), presets };
}
function importPreset(text) {
  if (typeof text !== "string" || new TextEncoder().encode(text).length > 131072) throw Error("\u6587\u4EF6\u8FC7\u5927\uFF08\u4E0A\u9650 128 KB\uFF09");
  const parsed = JSON.parse(text);
  if (!plain(parsed) || ![1, FORMAT].includes(parsed.formatVersion)) throw Error("\u4E0D\u652F\u6301\u6B64\u9884\u8BBE\u683C\u5F0F\u7248\u672C");
  if (Object.keys(parsed).some((k) => !["formatVersion", "name", "config"].includes(k))) throw Error("\u4EC5\u53EF\u5BFC\u5165\u89C6\u89C9\u53C2\u6570\u9884\u8BBE");
  const config = parsed.formatVersion === 1 ? visualConfig(parsed.config) : domain(parsed.config);
  return { name: cleanName(parsed.name ?? "\u5BFC\u5165\u7684\u9884\u8BBE"), config, ...parsed.formatVersion === 1 ? { notice: "\u5DF2\u8BFB\u53D6\u65E7\u89C6\u89C9\u9884\u8BBE\uFF0C\u672C\u673A\u4FDD\u62A4\u8BBE\u7F6E\u4FDD\u6301\u4E0D\u53D8" } : {} };
}
function exportPreset(name, config) {
  return JSON.stringify({ formatVersion: FORMAT, name: cleanName(name), config: visualConfig(config) }, null, 2);
}

// src/render/universe.mjs
function randomSource(seed) {
  let value = seed ?? globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Date.now();
  return () => {
    value |= 0;
    value = value + 1831565813 | 0;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var STYLE_COLORS = Object.freeze({ realistic: [1, 0.65, 0.34], scifi: [0.65, 0.38, 1], hybrid: [0.88, 0.66, 0.64], minimal: [0.65, 0.78, 1] });
var OUTER = 0.5;
var WORLD_X = [-(SPACE.railX + SPACE.thumbInset) / SPACE.travel, (SPACE.width - SPACE.railX - SPACE.thumbInset) / SPACE.travel];
var WORLD_Y = SPACE.centerY / 18;
var Universe = class {
  constructor({ seed, config = DEFAULTS } = {}) {
    this.random = randomSource(seed);
    this.config = { ...config };
    this.target = { ...config };
    this.palette = [...STYLE_COLORS[config.style]];
    this.styleMix = { realistic: 0, scifi: 0, hybrid: 0, minimal: 0 };
    this.styleMix[config.style] = 1;
    this.elements = Object.fromEntries(["stars", "meteors", "nebulae", "clusters", "lens"].map((k) => [k, config[k] ? 1 : 0]));
    this.accretion = 0;
    this.stars = [];
    this.meteors = [];
    this.clouds = [];
    this.nextId = 1;
    this.time = 0;
    this.spinTime = 0;
    this.warp = 0;
    this.pull = 0;
    this.position = 1;
    this.flight = new Flight();
    this.skyOffset = classicOffset(Math.random);
    this.overdrive = 0;
    this.base = 1;
    this.diskSize = 1;
    this.captured = 0;
    this.expired = 0;
    this.births = 0;
    this.ticks = 0;
    this.cluster = null;
    this.clusterCooldown = 0;
    this.meteorCooldown = 0;
    this.inactiveTime = 0;
    this.awake = 0;
    for (let i = 0; i < 640; i++) this.stars.push(this.star(true));
    this.clouds.push(this.cloud(true), this.cloud(true));
  }
  rand(a = 0, b = 1) {
    return a + (b - a) * this.random();
  }
  // Outer stars: anywhere in the world band above or below the rail (rail units
  // of 18px), so the scene is larger than the control.
  outerY() {
    return (this.random() < 0.5 ? -1 : 1) * this.rand(0.94, WORLD_Y - 0.2);
  }
  star(initial = false) {
    const clustered = this.cluster && this.random() < 0.22;
    const life = this.rand(12, 65);
    const roll = this.random(), z = roll < 0.6 ? this.rand(0.18, 0.45) : roll < 0.9 ? this.rand(0.45, 0.75) : this.rand(0.75, 1);
    const size = z < 0.45 ? this.rand(0.3, 0.65) : z < 0.75 ? this.rand(0.5, 1) : this.rand(0.85, 1.45), magnitude = 0.7 + 0.6 * this.random() ** 2;
    const s = { id: this.nextId++, ...clustered ? { x: clamp(this.cluster.x + this.rand(-0.08, 0.08)), y: clamp(this.cluster.y + this.rand(-0.3, 0.3), -0.9, 0.9), inner: true } : this.random() < OUTER ? { x: this.rand(WORLD_X[0], WORLD_X[1]), y: this.outerY() } : { x: this.rand(6e-3, 0.996), y: this.rand(-0.94, 0.94), inner: true }, z, size, magnitude, tone: this.random(), phase: this.rand(0, 6.283), frequency: this.rand(0.2, 0.65), vx: this.rand(-13e-4, 8e-4), vy: this.rand(-8e-3, 8e-3), age: initial ? this.rand(1, life * 0.8) : 0, life };
    this.births++;
    return s;
  }
  cloud(initial = false) {
    return { id: this.nextId++, x: this.rand(-0.3, 1.2), y: this.rand(-3.6, 3.6), radius: this.rand(0.1, 0.24), age: initial ? this.rand(2, 8) : 0, life: this.rand(18, 42), tone: this.random(), opacity: this.rand(0.14, 0.28), twist: 0 };
  }
  meteor(p = this.base) {
    const hole = worldPoint(p, 0), heading = this.rand(-0.38, 0.38), dir = { x: Math.cos(heading), y: Math.sin(heading) }, speed = this.rand(...METEOR.speed);
    const aimed = p >= LIMITS.collapse, side = this.random() < 0.5 ? -1 : 1, miss = side * (METEOR.miss[0] + (METEOR.miss[1] - METEOR.miss[0]) * this.random() ** 2);
    const through = aimed ? { x: hole.x - dir.y * miss, y: hole.y + dir.x * miss } : { x: this.rand(250, 650), y: this.rand(60, SPACE.height - 60) }, back = this.rand(320, 420);
    const start = { x: through.x - dir.x * back, y: through.y - dir.y * back };
    return { id: this.nextId++, x: (start.x - SPACE.railX - SPACE.thumbInset) / SPACE.travel, y: (start.y - SPACE.centerY) / 18, vx: speed * dir.x / SPACE.travel, vy: speed * dir.y / 18, age: 0, life: (back * 2 + 120) / speed, points: [], tone: this.random(), near: aimed && Math.abs(miss) < 60 };
  }
  setConfig(config) {
    this.target = { ...config };
  }
  step(delta, { position, pressed = false, reduced = false, budget = 1, overdrive = 0 } = {}) {
    const dt = clamp(delta, 0, 0.05);
    this.ticks++;
    const beforeCapture = this.captured;
    this.accretion *= Math.exp(-dt * 2.5);
    const p = clamp(position ?? this.base);
    const movement = this.base - p;
    const retreat = clamp(movement / Math.max(dt, 1e-3) * 1.3);
    this.base = p;
    const drive = reduced || !pressed ? 0 : clamp(overdrive) * smooth(0.985, 1, p);
    this.overdrive += (drive - this.overdrive) * (1 - Math.exp(-dt * (drive > this.overdrive ? 14 : 3.2)));
    if (this.overdrive < 1e-4 && !drive) this.overdrive = 0;
    this.position = p + this.overdrive * OVERDRIVE_T;
    const ease = 1 - Math.exp(-dt * 3);
    for (const key of Object.keys(DEFAULTS)) {
      const target = this.target[key];
      this.config[key] = typeof target === "number" ? this.config[key] + (target - this.config[key]) * ease : target;
    }
    const color = STYLE_COLORS[this.target.style];
    this.palette = this.palette.map((v, i) => v + (color[i] - v) * ease);
    for (const style of Object.keys(this.styleMix)) this.styleMix[style] += ((this.target.style === style ? 1 : 0) - this.styleMix[style]) * ease;
    for (const key of Object.keys(this.elements)) this.elements[key] += ((this.target[key] ? 1 : 0) - this.elements[key]) * ease;
    const c = this.config;
    const speed = c.speed;
    const evolved = visualState(this);
    this.flight.step(dt, { position: p, pressed, reveal: evolved.spaceReveal, reduced, speed, drive, boost: evolved.entryWarp ?? 0 });
    const simulated = Math.min(dt * speed * (reduced ? 0.12 : 1), 0.25);
    this.time += simulated;
    this.awake = Math.min(1, this.awake + dt / 0.4);
    const sizeTarget = evolved.holeVisibility > 0.01 ? 0.12 + 0.88 * smooth(LIMITS.collapse, 1, p) : 0.12;
    this.diskSize += (sizeTarget - this.diskSize) * (1 - Math.exp(-dt * (reduced ? 20 : 2.2)));
    this.spinTime += dt * Math.min(2.5, Math.sqrt(speed) * c.spin) * (0.35 + 0.65 * this.diskSize) * (1 + 1.6 * this.flight.driveWarp) * (reduced ? 0.15 : 1);
    stepPassers(this, dt, { position: p, reveal: evolved.spaceReveal, warp: this.flight.driveWarp, surge: evolved.entryWarp ?? 0, holeVisibility: evolved.holeVisibility, reduced, enabled: !!c.stars, rate: c.activity });
    const depth = smooth(2 / 3, 0.96, p);
    this.warp = this.flight.warp;
    this.pull += (retreat - this.pull) * (1 - Math.exp(-dt * 9));
    this.inactiveTime = depth < 1e-3 ? this.inactiveTime + dt : 0;
    const desired = Math.round((c.stars ? 660 : 0) * c.density * budget);
    this.clusterCooldown -= simulated;
    this.meteorCooldown -= simulated;
    if (c.clusters && this.clusterCooldown < 0 && this.random() < simulated * 0.045 * c.activity * c.clusterRate) {
      this.cluster = { x: this.rand(0.08, Math.max(0.12, p - 0.12)), y: this.rand(-0.45, 0.45), life: this.rand(8, 15) };
      this.clusterCooldown = this.rand(12, 30);
    }
    if (this.cluster && (this.cluster.life -= simulated) < 0) this.cluster = null;
    const localRadius = 28 + this.pull * 90;
    this.stars = this.stars.filter((s) => {
      s.age += simulated;
      if (s.age > s.life || s.x < WORLD_X[0] - 0.04 || Math.abs(s.y) > WORLD_Y + 0.1) {
        this.expired++;
        return false;
      }
      if (s.age < 1 && this.stars.length > desired + 4) return false;
      s.x += clamp(s.vx, -0.035, 0.035) * simulated;
      s.y += clamp(s.vy, -0.3, 0.3) * simulated;
      return true;
    });
    const deficit = desired - this.stars.length;
    if (deficit > 0 && this.pull < 0.15) {
      const count = Math.min(deficit, Math.max(1, Math.round(simulated * 30)));
      for (let i = 0; i < count; i++) {
        const s = this.star();
        s.x *= Math.max(p, LIMITS.collapse);
        this.stars.push(s);
      }
    } else if (deficit < -4) {
      for (const s of this.stars.slice(0, Math.min(2, -deficit))) s.life = Math.min(s.life, s.age + 0.8);
    }
    if (delta <= 0.25 && depth > 0.05 && c.meteors && this.meteorCooldown < 0 && this.meteors.length < METEOR.limit && this.random() < simulated * METEOR.rate * c.activity * c.meteorRate) {
      this.meteors.push(this.meteor(p));
      this.meteorCooldown = METEOR.cooldown + this.rand(0, 2);
    }
    const hole = worldPoint(this.position, 0), holeOn = visualState(this).holeVisibility, sailing = this.flight.sail * parallax(0.6) / SPACE.travel;
    this.meteors = this.meteors.filter((m) => {
      m.age += simulated;
      const head = worldPoint(m.x, m.y), dx = hole.x - head.x, dy = hole.y - head.y, d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1;
      if (depth > 0.05 && c.gravity > 0 && holeOn > 0.05 && !reduced) {
        const a = METEOR.pull * c.gravity * holeOn / (d2 + METEOR.soft * METEOR.soft) * simulated;
        m.vx += dx / d * a / SPACE.travel;
        m.vy += dy / d * a / 18;
        if (d < 12) {
          this.captured++;
          return false;
        }
      }
      m.x += m.vx * simulated - sailing * dt;
      m.y += m.vy * simulated;
      m.points.unshift([m.x, m.y]);
      m.points = m.points.slice(0, 28);
      return m.age < m.life && m.x < WORLD_X[1] && m.x > WORLD_X[0] && Math.abs(m.y) < SPACE.height / 2 / 18;
    });
    this.clouds = this.clouds.filter((n) => {
      n.age += simulated;
      n.x -= simulated * 8e-4 + this.flight.sail * 0.03 / SPACE.travel * dt;
      const dx = p - n.x;
      const local = depth * Math.pow(clamp(1 - Math.abs(dx) / 0.27), 2) * c.gravity;
      n.twist += (local * (1 + this.pull * 2) - n.twist) * ease;
      return n.age < n.life;
    });
    if (c.nebulae && this.clouds.length < 4 && this.random() < simulated * 0.08 * c.activity * c.nebulaRate && this.pull < 0.15) this.clouds.push(this.cloud());
    this.accretion = Math.min(0.35, this.accretion + Math.min(5, this.captured - beforeCapture) * 0.018);
  }
  snapshot() {
    return { stars: this.stars.length, meteors: this.meteors.length, clouds: this.clouds.length, births: this.births, captured: this.captured, expired: this.expired, ticks: this.ticks, warp: this.warp };
  }
};
function projectStar(star, world, reduced = false, clouds = nebulaLayers(world, reduced), look = opticalProfile(world)) {
  const c = world.config;
  const p = world.position;
  const visual = visualState(world), depth = visual.spaceReveal;
  const projection = perspective(star, world.flight, reduced);
  let { x, y } = projection;
  const { x: cx, y: cy } = worldPoint(p, 0);
  if (world.elements.lens > 1e-3 && !reduced) {
    const lensed = lensPoint({ x, y }, { x: cx, y: cy }, c.lensStrength * world.elements.lens * visual.holeVisibility);
    x = lensed.x;
    y = lensed.y;
  }
  if ((visual.expansion ?? 1) < 1 && !reduced && world.evolution) {
    const origin = world.evolution.origin, k = (1 - visual.expansion) * (0.25 + 0.55 * star.z);
    x = origin.x + (x - origin.x) * (1 - k);
    y = origin.y + (y - origin.y) * (1 - k);
  }
  if ((visual.swallow ?? 0) > 0 && !reduced) ({ x, y } = swallowPoint({ x, y }, { x: cx, y: cy }, visual.swallow));
  if (visual.boomEnvelope > 0 && !reduced) {
    const dx = x - cx, dy = y - SPACE.centerY, r = Math.hypot(dx, dy) || 1, push = 6 * visual.boomEnvelope * Math.exp(-Math.pow((r - burstRadius(visual.unfold)) / 12, 2));
    x += dx / r * push;
    y += dy / r * push;
  }
  const life = smooth(0, 1.5, star.age) * (1 - smooth(star.life - 1.5, star.life, star.age));
  const shimmer = reduced ? 0.84 : 0.76 + 0.2 * Math.sin(world.time * star.frequency + star.phase);
  const tone = star.tone < 0.12 ? [1, 0.81, 0.65] : star.tone < 0.43 ? [0.65, 0.78, 1] : [0.88, 0.92, 1];
  const motion = softenMotion((star.vx ?? 0) * 282 * projection.scale + (projection.x - VANISH.x) * (world.flight?.velocity ?? 0) / projection.viewDepth * (world.flight?.gain ?? 0), (star.vy ?? 0) * 18 * projection.scale + (projection.y - VANISH.y) * (world.flight?.velocity ?? 0) / projection.viewDepth * (world.flight?.gain ?? 0), world, reduced);
  return { x, y, size: Math.min(2.2, star.size * (0.4 + star.z * 0.85) * projection.sizeScale), alpha: unfoldMask(x, y, cx, visual.unfold) * look.stars * nebulaTransmission({ ...projection, x, y }, clouds, p) * projection.alpha * life * shimmer * (0.3 + 0.75 * star.z) * (star.magnitude ?? 1) * depth * c.brightness * world.awake * world.elements.stars, tone: opticalColor(tone, { ...look, gain: 1 }), softening: motion, layer: projection.layer, viewDepth: projection.viewDepth, trailX: projection.trailX, trailY: projection.trailY, trailLength: projection.trailLength * c.trails };
}

// src/render/lab.mjs
var LAB_EVENTS = Object.freeze({ meteor: "\u6D41\u661F", star: "\u6052\u661F\u63A0\u8FC7", cloud: "\u661F\u4E91\u7A7F\u8D8A", boom: "BOOM", warp: "\u661F\u9645\u8DC3\u8FC1" });
function inspectionPoint(clientX, clientY, rect, scale2 = 1) {
  const x = (clientX - rect.left) / scale2, y = (clientY - rect.top) / scale2;
  return { position: Math.max(0, Math.min(1, (x - 16) / (rect.width / scale2 - 32))), cancel: false };
}
var LabUniverse = class extends Universe {
  step(delta, input) {
    this.session?.beforeStep();
    super.step(delta, { ...input, pressed: this.session?.pressed ?? input?.pressed });
    this.session?.afterStep(delta);
  }
};
var LabSession = class {
  constructor({ config = DEFAULTS, seed, clock = () => performance.now() } = {}) {
    this.clock = clock;
    this.config = { ...config };
    this.position = 1;
    this.pressed = false;
    this.scale = 1;
    this.listeners = /* @__PURE__ */ new Set();
    this.disposed = false;
    this.systemReduced = false;
    this.world = new LabUniverse({ config, seed });
    this.world.session = this;
    this.scene = { world: this.world, evolution: new Evolution(1), inspectionScale: 1, onInvisible: () => {
      if (this.event || this.pressed || this.scene.evolution.active || this.scene.evolution.crossedB || ["collapse", "boom", "entry", "decel", "settling", "returning"].includes(this.scene.evolution.phase)) this.stop("\u9884\u89C8\u5BB9\u5668\u9690\u85CF\uFF0C\u4E8B\u4EF6\u5DF2\u6E05\u7406");
    } };
    this.world.evolution = this.scene.evolution;
    this.notice = "\u72EC\u7ACBLab \xB7 \u624B\u52A8\u4E8B\u4EF6\u4EC5\u5728\u6B64\u5904\u64AD\u653E";
    this.publish();
  }
  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.state;
  input = () => ({ position: this.position, pressed: this.pressed });
  publish() {
    this.state = { position: this.position, pressed: this.pressed, scale: this.scale, event: this.event?.kind ?? null, notice: this.notice, phase: this.scene.evolution.phase, boomCount: this.scene.evolution.count };
    for (const fn of this.listeners) fn();
  }
  setScale(value) {
    if (![1, 2, 4].includes(value) || this.disposed) return;
    this.scale = value;
    this.scene.inspectionScale = value;
    this.publish();
  }
  protected() {
    const c = this.config;
    return this.disposed || c.quality === "static" || c.reducedMotion || c.followSystemMotion && this.systemReduced || !Number.isFinite(c.speed) || c.speed <= 0;
  }
  setConfig(config) {
    this.config = { ...config };
    this.world.setConfig(config);
    const element = { meteor: "meteors", star: "stars", cloud: "nebulae" }[this.event?.kind];
    if ((this.event || this.pressed) && (this.protected() || element && !config[element])) this.stop("\u8BBE\u5907\u4FDD\u62A4\u6216\u5143\u7D20\u5173\u95ED\uFF0C\u9884\u89C8\u5DF2\u505C\u6B62");
  }
  setSystemReduced(value) {
    this.systemReduced = value;
    if (this.protected()) this.stop("\u51CF\u5C11\u52A8\u6001\u4FDD\u62A4\uFF0C\u9884\u89C8\u5DF2\u505C\u6B62");
  }
  positionTo(value, pressed = false) {
    this.position = Math.max(0, Math.min(1, value));
    this.pressed = pressed;
    this.publish();
  }
  hold(value) {
    if (value) {
      if (this.protected()) {
        this.notice = "\u4FDD\u62A4\u6A21\u5F0F\u6216\u901F\u5EA60\uFF1A\u6682\u4E0D\u8DC3\u8FC1";
        this.publish();
        return;
      }
      this.stop();
      this.prepare(1);
    }
    this.positionTo(this.position, value);
  }
  prepare(value) {
    this.position = value;
    this.pressed = false;
    this.scene.evolution.suspend(value);
  }
  trigger(kind) {
    if (!LAB_EVENTS[kind] || this.disposed) return false;
    if (this.event) {
      this.notice = "\u5F53\u524D\u4E8B\u4EF6\u6B63\u5728\u64AD\u653E\uFF0C\u4E0D\u6392\u961F\uFF1B\u53EF\u5148\u505C\u6B62";
      this.publish();
      return false;
    }
    if (this.protected()) {
      this.notice = "\u4FDD\u62A4\u6A21\u5F0F\u6216\u901F\u5EA60\uFF1A\u4FDD\u7559\u9884\u89C8\uFF0C\u4E0D\u64AD\u653E\u624B\u52A8\u4E8B\u4EF6";
      this.publish();
      return false;
    }
    const element = { meteor: "meteors", star: "stars", cloud: "nebulae" }[kind];
    if (element && !this.config[element]) {
      this.notice = "\u5BF9\u5E94\u5929\u4F53\u5DF2\u5173\u95ED\uFF0C\u8BF7\u5148\u5728Lab\u4E2D\u5F00\u542F";
      this.publish();
      return false;
    }
    if (kind === "meteor" && this.world.meteors.length >= 2 || kind === "cloud" && this.world.clouds.length >= 4) {
      this.notice = "\u5F53\u524D\u540C\u7C7B\u5929\u4F53\u5DF2\u8FBE\u4E0A\u9650\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5";
      this.publish();
      return false;
    }
    const now = this.clock();
    this.event = { kind, start: now, last: now, elapsed: 0, simulated: 0, ids: [], beforeCount: this.scene.evolution.count, prepared: false };
    this.prepare(kind === "boom" ? LIMITS.rearm - 0.01 : 1);
    this.notice = `\u4EC5Lab\uFF1A${LAB_EVENTS[kind]} \xB7 ${kind === "boom" ? "\u5148\u4F4E\u4F4D\u6574\u5907\uFF0C\u518DHigh\u540E\u6B63\u5411\u6F14\u5316" : "\u5DF2\u51C6\u5907Max\u89C2\u5BDF\u9636\u6BB5"} \xB7 \u4E0D\u6392\u961F`;
    if (kind === "boom") {
      const e = this.scene.evolution;
      e.begin(e.intentId + 1);
      e.input(this.position);
    }
    if (kind === "warp") this.pressed = true;
    if (kind === "meteor") {
      const m = this.world.meteor();
      Object.assign(m, { x: 0.28, y: -0.4, age: 0.08 });
      this.world.meteors.push(m);
      this.event.ids.push(m.id);
    }
    if (kind === "star") {
      const s = this.world.star();
      Object.assign(s, { x: 0.26, y: -0.3, z: 0.88, vx: 0.035, vy: 0.03, age: 1.5, life: 4.5 });
      this.world.stars.push(s);
      this.event.ids.push(s.id);
    }
    if (kind === "cloud") {
      const n = this.world.cloud(true);
      Object.assign(n, { x: 0.72, y: -0.35, radius: 0.2, opacity: 0.26, age: 3, life: 6 });
      this.world.clouds.push(n);
      this.event.ids.push(n.id);
    }
    this.publish();
    return true;
  }
  beforeStep() {
    if (!this.event) return;
    const now = this.clock(), limit = this.event.kind === "boom" ? Math.min(1e4, 2e3 / Math.max(0.1, this.config.speed) + 300) : this.event.kind === "warp" ? 3500 : Math.min(1e4, 3500 / Math.max(0.1, this.config.speed));
    if (this.protected() || now - this.event.last > 250 || now - this.event.start > limit) {
      this.stop("\u9884\u89C8\u4E2D\u65AD\u6216\u8FBE\u5230\u65F6\u9650\uFF0C\u4E0D\u8865\u64AD");
      return;
    }
    this.event.last = now;
    if (this.event.kind === "boom" && !this.scene.evolution.active) this.stop("\u6F14\u5316\u5DF2\u4E2D\u65AD\uFF0C\u4E0D\u8865\u64ADBOOM");
  }
  afterStep(delta) {
    const event = this.event;
    if (!event) return;
    event.elapsed += Math.max(0, Math.min(delta, 0.05));
    event.simulated += Math.min(Math.max(0, Math.min(delta, 0.05)) * this.world.config.speed, 0.25);
    const e = this.scene.evolution;
    if (event.kind === "boom" && !event.prepared && event.elapsed >= 0.24) {
      if (e.consumed) {
        this.stop("\u672A\u5B8C\u6210\u6709\u6548\u6574\u5907\uFF0C\u5DF2\u505C\u6B62");
        return;
      }
      event.prepared = true;
      e.input(LIMITS.high);
      e.input(0.69);
      e.input(0.82);
      this.position = 0.82;
      this.world.position = 0.82;
      this.publish();
    }
    if (event.kind === "cloud") {
      const n = this.world.clouds.find((n2) => event.ids.includes(n2.id));
      if (n) n.x = 0.72 - event.simulated * 0.16;
    }
    const duration = { meteor: 1.1, star: 3, cloud: 3, warp: 2.2 }[event.kind];
    if (duration && (event.kind === "warp" ? event.elapsed : event.simulated) >= duration || event.kind === "boom" && event.prepared && e.phase === "settled" && e.count > event.beforeCount) {
      this.stop(`${LAB_EVENTS[event.kind]}\u9884\u89C8\u5B8C\u6210`);
      return;
    }
    if (this.state.phase !== e.phase || this.state.boomCount !== e.count) this.publish();
  }
  stop(message = "\u9884\u89C8\u5DF2\u505C\u6B62") {
    const ids = this.event?.ids ?? [];
    this.world.stars = this.world.stars.filter((s) => !ids.includes(s.id));
    this.world.clouds = this.world.clouds.filter((n) => !ids.includes(n.id));
    this.world.meteors = this.world.meteors.filter((m) => !ids.includes(m.id));
    this.event = null;
    this.pressed = false;
    this.scene.evolution.suspend(this.position);
    this.notice = message;
    if (!this.disposed) this.publish();
  }
  dispose() {
    if (this.disposed) return;
    this.stop("Lab\u5DF2\u5173\u95ED");
    this.disposed = true;
    this.listeners.clear();
  }
};

// src/render/visual-validity.mjs
function visualValidity(controller, expected) {
  const state = controller.getSnapshot(), gesture = controller.gesture;
  const valid = !!gesture && !controller.disposed && !state.disabled && state.phase === "preview" && !gesture.conflict && gesture.epoch === controller.epoch && gesture.fingerprint === state.fingerprint && (!expected || gesture === expected);
  return { valid, cancelZone: valid && state.cancelZone, identity: gesture, position: state.actual?.position ?? 0, epoch: controller.epoch };
}
function acceptedVisualPending(controller, evolution, epoch) {
  const state = controller.getSnapshot(), pending = controller.pending;
  return !!pending && !!evolution && state.phase === "applying" && !state.disabled && pending.fingerprint === state.fingerprint && pending.target.reasoningEffort === nearestLevel(state.levels, evolution.position)?.id && (controller.epoch === epoch || state.actual?.id === pending.target.reasoningEffort);
}

// src/ui.jsx
var import_react = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");

// src/control.mjs
var NOTICE_MS = 2500;
var EffortController = class {
  constructor(directory, { timeout = 5e3, available = true, diagnostics } = {}) {
    this.directory = directory;
    this.timeout = timeout;
    this.available = available;
    this.diagnostics = diagnostics;
    this.listeners = /* @__PURE__ */ new Set();
    this.epoch = 0;
    this.ticket = 0;
    this.disposed = false;
    this.pending = null;
    this.queued = null;
    this.notice = null;
    this.view = directoryView(directory.store.getSnapshot());
    this.state = { ...this.view, position: this.view.actual?.position ?? 0, phase: "ready", message: this.view.reason, pressed: false, cancelZone: false };
    this.lastKey = this.authorityKey();
    this.unsubscribe = directory.store.subscribe(() => this.synchronize());
    this.emit();
  }
  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.state;
  emit(patch = {}) {
    if (this.disposed) return;
    this.state = { ...this.state, ...this.view, disabled: !this.available || this.view.disabled, syncing: this.available && this.view.syncing, requested: this.requested(), ...patch };
    if (!this.available) this.state.message = "\u6B64\u4F1A\u8BDD\u4E0D\u652F\u6301\u63A8\u7406\u7B49\u7EA7\u9009\u62E9";
    this.listeners.forEach((fn) => fn());
  }
  authorityKey() {
    return this.view.fingerprint + selectionKey(this.view.current);
  }
  // Where the knob rests without a gesture: the newest in-flight target while it
  // is still being applied, otherwise DSH authority. Prevents the release snap-back.
  resting() {
    const target = this.queued?.target ?? (this.pending && this.state.phase !== "unknown" ? this.pending.target : null);
    return this.view.levels.find((l) => l.id === target?.reasoningEffort)?.position ?? this.view.actual?.position ?? 0;
  }
  // The level being written (queued or in flight), kept apart from DSH authority
  // so the header can say "Off → Max" instead of showing the old value alone.
  requested() {
    const target = this.queued?.target ?? this.pending?.target;
    return this.view.levels.find((l) => l.id === target?.reasoningEffort) ?? null;
  }
  refresh() {
    const previous = this.view.status;
    this.view = directoryView(this.directory.store.getSnapshot());
    const key = this.authorityKey();
    if (key !== this.lastKey) {
      this.epoch++;
      this.lastKey = key;
    }
    if (this.view.status === "error" && previous !== "error") Promise.resolve().then(() => this.disposed || this.directory.load?.()).catch(() => {
    });
  }
  synchronize() {
    if (this.disposed) return;
    this.refresh();
    if (this.gesture) {
      if (this.pending && this.view.fingerprint === this.pending.fingerprint && this.view.actual?.id === this.pending.target.reasoningEffort && !this.gesture.conflict) this.gesture.epoch = this.epoch;
      if (this.gesture.epoch !== this.epoch) this.gesture.conflict = true;
      this.emit({ message: this.gesture.conflict ? "DSH \u8BBE\u7F6E\u5DF2\u53D8\u5316\uFF0C\u677E\u624B\u5C06\u53D6\u6D88\u672C\u6B21\u8C03\u6574" : this.state.message });
    } else if (this.pending) {
      this.emit({ position: this.resting() });
      this.maybeConfirm();
    } else this.emit({ position: this.resting(), phase: "ready", message: this.notice && (!this.view.disabled || this.view.syncing) ? this.notice : this.view.reason });
  }
  // A confirmed change is announced briefly; a new gesture or a cancel ends it early.
  announce(text) {
    clearTimeout(this.noticeTimer);
    this.notice = text;
    this.noticeTimer = setTimeout(() => {
      this.notice = null;
      if (!this.disposed && !this.gesture && !this.pending) this.emit({ message: this.view.reason });
    }, NOTICE_MS);
  }
  quiet() {
    clearTimeout(this.noticeTimer);
    this.notice = null;
  }
  begin({ pointer = true } = {}) {
    if (this.state.disabled) return false;
    this.quiet();
    this.gesture = { epoch: this.epoch, fingerprint: this.view.fingerprint, conflict: false, pointer };
    this.emit({ phase: "preview", pressed: pointer, message: "\u9884\u89C8\u4E2D \xB7 \u677E\u624B\u540E\u5E94\u7528", cancelZone: false });
    return true;
  }
  preview(position, cancelZone = false) {
    if (!this.gesture && !this.begin({ pointer: false })) return;
    this.emit({ position: clamp(position), cancelZone, message: cancelZone ? "\u677E\u624B\u53D6\u6D88 \xB7 \u56DE\u5230\u8F68\u9053\u53EF\u7EE7\u7EED" : this.gesture.conflict ? "DSH \u8BBE\u7F6E\u5DF2\u53D8\u5316\uFF0C\u677E\u624B\u5C06\u53D6\u6D88\u672C\u6B21\u8C03\u6574" : "\u9884\u89C8\u4E2D \xB7 \u786E\u8BA4\u540E\u5E94\u7528" });
  }
  cancel(message = "") {
    this.quiet();
    this.gesture = null;
    this.queued = null;
    this.emit({ position: this.resting(), phase: this.pending ? this.state.phase === "unknown" ? "unknown" : "applying" : "ready", pressed: false, cancelZone: false, message: message || (this.pending ? "\u6B63\u5728\u786E\u8BA4\u5148\u524D\u8C03\u6574" : this.view.reason) });
  }
  async release() {
    if (!this.gesture) return;
    this.synchronize();
    const gesture = this.gesture;
    const level = nearestLevel(this.view.levels, this.state.position);
    if (this.state.cancelZone || gesture.conflict || gesture.fingerprint !== this.view.fingerprint || this.state.disabled || !level) {
      this.cancel(gesture.conflict ? "\u5DF2\u53D6\u6D88\u8FC7\u65F6\u8C03\u6574\uFF0C\u5DF2\u540C\u6B65 DSH \u5F53\u524D\u8BBE\u7F6E" : "\u5DF2\u53D6\u6D88");
      return;
    }
    this.gesture = null;
    const target = { ...this.view.current, reasoningEffort: level.id };
    this.emit({ pressed: false, position: level.position, cancelZone: false });
    if (this.pending) {
      if (this.state.phase === "unknown") {
        this.cancel("\u5148\u524D\u8C03\u6574\u7ED3\u679C\u672A\u77E5\uFF0C\u8BF7\u7B49\u5F85\u8FDE\u63A5\u4E0E\u72B6\u6001\u6062\u590D");
        return;
      }
      this.queued = { target, fingerprint: this.view.fingerprint };
      this.emit({ phase: "applying", message: "\u7B49\u5F85\u5148\u524D\u8C03\u6574\u5B8C\u6210\uFF0C\u518D\u5E94\u7528\u6700\u65B0\u9009\u62E9" });
      return;
    }
    return this.commit(target);
  }
  async commit(target) {
    if (this.disposed || this.pending) return;
    this.refresh();
    if (this.view.disabled || target.provider !== this.view.current?.provider || target.model !== this.view.current?.model || !this.view.levels.some((l) => l.id === target.reasoningEffort)) {
      this.cancel("\u6A21\u578B\u5DF2\u53D8\u5316\uFF0C\u5DF2\u53D6\u6D88\u8C03\u6574");
      return;
    }
    if (target.reasoningEffort === this.view.actual?.id) {
      this.cancel("");
      return;
    }
    const op = { id: ++this.ticket, target, from: this.view.actual?.name, fingerprint: this.view.fingerprint, accepted: false, timer: null };
    this.pending = op;
    this.emit({ phase: "applying", message: "\u6B63\u5728\u5E94\u7528\u5230\u4E0B\u4E00\u6B21\u8BF7\u6C42\u2026" });
    op.timer = setTimeout(() => {
      if (this.pending !== op || this.disposed) return;
      this.queued = null;
      this.emit({ phase: "unknown", message: "\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4 \xB7 \u4E0D\u4F1A\u81EA\u52A8\u91CD\u590D\u63D0\u4EA4" });
      if (!this.gesture) this.emit({ position: this.resting() });
      this.diagnostics?.record("selection-unknown");
    }, this.timeout);
    try {
      const result = await this.directory.select(target);
      if (this.disposed || this.pending !== op) return;
      if (!result?.ok) {
        this.finish(op, "error", result?.error?.code === "session/writer-held" ? "\u4F1A\u8BDD\u88AB\u53E6\u4E00 DSH \u5B9E\u4F8B\u5360\u7528\uFF0C\u8BF7\u5173\u95ED\u91CD\u590D\u5B9E\u4F8B\u540E\u91CD\u8BD5" : "DSH \u672A\u63A5\u53D7\u8C03\u6574\uFF0C\u5DF2\u6062\u590D\u5F53\u524D\u771F\u5B9E\u7B49\u7EA7");
        return;
      }
      op.accepted = true;
      this.synchronize();
      this.maybeConfirm();
    } catch {
      if (!this.disposed && this.pending === op) {
        op.accepted = true;
        this.synchronize();
        if (this.pending === op) {
          this.queued = null;
          this.emit({ phase: "unknown", message: "\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u7ED3\u679C\u672A\u77E5 \xB7 \u8BF7\u7B49\u5F85 DSH \u72B6\u6001\u6062\u590D" });
          if (!this.gesture) this.emit({ position: this.resting() });
        }
      }
    }
  }
  maybeConfirm() {
    const op = this.pending;
    if (!op || !op.accepted) return;
    if (this.view.fingerprint !== op.fingerprint) {
      this.queued = null;
      this.finish(op, "conflict", "\u6A21\u578B\u5DF2\u5207\u6362\uFF0C\u663E\u793A\u5F53\u524D DSH \u8BBE\u7F6E");
    } else if (this.view.actual?.id === op.target.reasoningEffort && this.view.current?.provider === op.target.provider && this.view.current?.model === op.target.model) {
      const text = op.from && op.from !== this.view.actual?.name ? `\u5DF2\u4ECE ${op.from} \u53D8\u66F4\u4E3A ${this.view.actual.name} \xB7 \u4E0B\u4E00\u6B21\u8BF7\u6C42\u751F\u6548` : "\u5DF2\u5E94\u7528 \xB7 \u4E0B\u4E00\u6B21\u8BF7\u6C42\u751F\u6548";
      this.announce(text);
      this.finish(op, "ready", text);
    }
  }
  finish(op, phase, message) {
    if (this.pending !== op) return;
    clearTimeout(op.timer);
    this.pending = null;
    const queued = this.queued;
    this.queued = null;
    this.diagnostics?.record(`selection-${phase}`);
    const next = queued && phase === "ready" && queued.fingerprint === this.view.fingerprint && !this.gesture ? queued : null;
    const nextPosition = this.view.levels.find((l) => l.id === next?.target.reasoningEffort)?.position;
    if (!this.gesture) this.emit({ phase, message, position: nextPosition ?? this.view.actual?.position ?? 0 });
    else this.emit({ message });
    if (next) void this.commit(next.target);
  }
  dispose() {
    this.disposed = true;
    this.quiet();
    clearTimeout(this.pending?.timer);
    this.unsubscribe?.();
    this.listeners.clear();
    this.pending = null;
    this.queued = null;
    this.gesture = null;
  }
};

// src/render/detail.mjs
var levels = [
  Object.freeze({ level: 0, halo: 1, cloudOctaves: 3, photos: true, tileWidth: 64, tileHeight: 32 }),
  Object.freeze({ level: 1, halo: 0.6, cloudOctaves: 2, photos: true, tileWidth: 48, tileHeight: 24 }),
  Object.freeze({ level: 2, halo: 0.25, cloudOctaves: 1, photos: false, tileWidth: 32, tileHeight: 16 })
];
var FULL_DETAIL = levels[0];
var detailForBudget = (budget) => levels[!Number.isFinite(budget) || budget >= 0.8 ? 0 : budget >= 0.5 ? 1 : 2];
var WORLD_CLIP = Object.freeze({ left: 0, top: 0, right: SPACE.width, bottom: SPACE.height });
function cloudIntersectsClip(n, clip) {
  if (!clip || ![clip.left, clip.top, clip.right, clip.bottom].every(Number.isFinite) || clip.right < clip.left || clip.bottom < clip.top) return true;
  const rx = n.radius * 3 + 2, ry = n.radius * n.aspect * 3 + 2;
  return n.x + rx >= clip.left && n.x - rx <= clip.right && n.y + ry >= clip.top && n.y - ry <= clip.bottom;
}

// src/render/templates.mjs
var TEMPLATE_KINDS = Object.freeze(["spiral", "barred", "edge-on", "elliptical", "irregular", "interacting", "emission", "planetary", "remnant", "cluster"]);
var WEIGHTS = [18, 10, 12, 16, 12, 6, 8, 6, 5, 15];
var TEMPLATE_ATLAS = Object.freeze({ width: 1024, height: 512, tile: 64, pad: 2, count: 128 });
var TEMPLATE_STRIP = 6400;
var TEMPLATE_CLEAR = 42;
var templateParallax = (size) => 0.16 + 0.12 * Math.min(1, size / 24);
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var pick = (random, weights) => {
  let r = random() * weights.reduce((s, w) => s + w, 0);
  for (let i = 0; i < weights.length; i++) if ((r -= weights[i]) < 0) return i;
  return weights.length - 1;
};
var TEMPLATE_OBJECTS = Object.freeze(Array.from({ length: TEMPLATE_ATLAS.count }, (_, i) => {
  const random = rng(9173 + i * 7919), kind = pick(random, WEIGHTS), roll = random();
  const size = roll < 0.7 ? 4 + 5 * random() : roll < 0.95 ? 9 + 7 * random() : 16 + 10 * random();
  const aspect = kind === 2 ? 0.16 + 0.1 * random() : kind === 3 ? 0.55 + 0.45 * random() : kind === 9 || kind === 7 ? 0.85 + 0.15 * random() : 0.35 + 0.65 * random();
  const side = random() < 0.5 ? -1 : 1, y = SPACE.centerY + side * (TEMPLATE_CLEAR + random() * (SPACE.centerY - TEMPLATE_CLEAR - 8));
  const x = (i + 0.15 + 0.7 * random()) * TEMPLATE_STRIP / TEMPLATE_ATLAS.count;
  const cols = TEMPLATE_ATLAS.width / TEMPLATE_ATLAS.tile, tx = i % cols * TEMPLATE_ATLAS.tile, ty = Math.floor(i / cols) * TEMPLATE_ATLAS.tile, { pad, tile } = TEMPLATE_ATLAS;
  return Object.freeze({
    kind: TEMPLATE_KINDS[kind],
    x,
    y,
    size,
    parallax: templateParallax(size),
    a: Object.freeze([kind, 1 + random() * 40, random() * Math.PI, aspect]),
    b: Object.freeze([random(), 0.45 + 0.45 * random(), random(), 0]),
    rect: Object.freeze([tx + pad, ty + pad, tx + tile - pad, ty + tile - pad]),
    uv: Object.freeze([(tx + pad) / TEMPLATE_ATLAS.width, (ty + pad) / TEMPLATE_ATLAS.height, (tx + tile - pad) / TEMPLATE_ATLAS.width, (ty + tile - pad) / TEMPLATE_ATLAS.height])
  });
}));
function templateSprites(drift, offset) {
  return TEMPLATE_OBJECTS.flatMap((o) => {
    const m = o.size + 4, x = ((o.x - drift * o.parallax - offset * 2.27 + m) % TEMPLATE_STRIP + TEMPLATE_STRIP) % TEMPLATE_STRIP - m;
    return x - o.size > SPACE.width ? [] : [{ x, y: o.y, hw: o.size, hh: o.size, uv: o.uv }];
  });
}
function templateBakeVertices() {
  const out = [];
  for (const o of TEMPLATE_OBJECTS) {
    const [l, t, r, b] = o.rect, corner = (x, y, u, v) => out.push(x, y, u, v, ...o.a, ...o.b);
    corner(l, t, -1, -1);
    corner(r, t, 1, -1);
    corner(l, b, -1, 1);
    corner(l, b, -1, 1);
    corner(r, t, 1, -1);
    corner(r, b, 1, 1);
  }
  return new Float32Array(out);
}
var TEMPLATE_STRIDE = 12;
var W = TEMPLATE_ATLAS.width;
var H = TEMPLATE_ATLAS.height;
var TEMPLATE_BAKE_VERTEX = `#version 300 es
in vec2 aXY;in vec2 aW;in vec4 aA;in vec4 aB;out vec2 vW;flat out vec4 vA;flat out vec4 vB;
void main(){gl_Position=vec4(aXY/vec2(${W}.,${H}.)*2.-1.,0.,1.);vW=aW;vA=aA;vB=aB;}`;
var TEMPLATE_BAKE = `#version 300 es
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

// src/render/photo-atlas.mjs
var PHOTO_ATLAS = "data:image/webp;base64,UklGRlgYAwBXRUJQVlA4WAoAAAAQAAAA/wMA/wIAQUxQSBMjAgABGYcR0MbNYRkTy7D/wEn6bBDR/wlAHWD9FoHWqjK8tBYAPBjPhi3tXbakwwBKyjasCRcwfQ3fW2RhDD9iSecG9yAZk+05xghbAmxzHAAkraQ2L+UEYmvBdrXnqNqcUyuuKuHLlgDnJrCq6htoGbnNifvDBM5tAWXb64Ntwyupsu2k9k0qG/Ba59iWtHcVZrS3z5i+/CyfbV896Jp7muSI0OQTSdq8F6pI9pAAchl4kJKwewK1ydZUY5LEI5OEvGLbRUoOgQ8uRiSZGKkqCf4MVyXzER+TALAAYNj6wZEMSwAynHzHbttiJ/5Nd0skO/bB6R+F7PZ4/w53hn+aIVk/4EhoI0mQpI6I5E+6+/fmGUTEBByefrkSQQHUEhVA3TYBZFdtBT7ZNkHQJe4W5bJ5h9vial1tSzd1YSVou/B51LkF6uPfB1DdtpSnX9byV57KhfL8AVQBn2AeeSoHE0HlILYtBW9MUPRsqtvaRHmKf2hVAggHnyCKUOWvLw6CCv5FnooKispPWh4/RIXH8tNMsU3igxYmbW3fbEub+wSrPNbW/PT4bPO/Yn4KOZIkV1Wj9VUZwBUXsBoDsEnrvsxuvO1+AXwZERPAwG0jRXPMmS7v3gs8S5Ks2rZtW26l9jnn2uswM5+LWb75++l8k8zMTIvmGK0WF5nVI0pprbfW1xj9ZiLCF2TbdVvbttVEUQQIUqXW1gDJ7p6Pb2//PymSJMnW/y+iZu4ekVTQ3D2wdHYWD59zmZmZ73ugV4AP6RXcR8zMzPcw7e7c5YHuaSrKzIhwN1OR/+dTJmoelZmV0zN1ISJ8QbZbt7ZtW9DDJC3JBRUAJbv30edav95u21ZtSZKkBXvvA5cfCSsbupm5m5uHe2UwRxQzMzPXH8DP9JGZq5KZMwMdLdyNTUlUVfDhpQOb1mpN37lXnoiCt9CkiJBF21bVVlswgGj22YdzYtL0Pn75QfunyHJj75uZxVXNdBiHZ6QZSSOyJYPMay95mbwQe5nxx3CZmXF5r5fBzLKYh/kwNkMxJEToVPc5mjnSjZj7T0RAYtvIkaQJO2lnXe6qvtlw6Yvwr/eE+K/Ty7b74U/6Wah/jF/vs/1dEBBv0EHQPyYPcSeJkT/BTyEA6Ythkl5XRETNf2zNfXCnP6+HIipeF8Q9RAgVVBFRyPZQRlHQP8ZGuPtS9wyf1L+aJQDWfQFlFI0SgaAqlVsAGxUVAPWPsWPscnnvWjcJAD6DexFKikCoeyAoyGiDAggVLcCoAZTS+LifsOm9P8J2x52dXgN8+nYQGVZgAdk3QQGZxSRwKUDpcvYgeoPg9d2K43t0ZHnuQQde3mnd+7l7oI5IsRQANCp76FhCrleLrseq9yAInACAVPcEsMIdZKk/03uv+DZXm8dslth7Lk/xWfpXBAcsGQtobDYaq7wLNGxVRHnaQLnpFQnydeUECshZURklQjBARhEk36cjrLc7ogHACxBLNXHJzyfrEYBmMiggGRI2jE0ludQMCIBAAEzx1nM+WufyFAAx6yBFJUOBrEQghwoeE+WSCaNtwHyftdY9K4q7nnTXe8GDVostn6yb5LICEGdfuFBV64r7TANGbJgK9GG2iBqjfcxqyjUqAYEeFM+R/TW1wjpOioY0msFIge/HVt+/HfRfMIiWstWuQPlcvAt8qr5ltgqgUhoPskUuq9QqK0JRijL2xMmxKaPbboGKLg6iylUaowZTKpnJ1pzXiUi4syFLJb7XWn3/BkZnGf13C+s6yp6GxkT0z4aXT9Sg4atkOqHgkn0j+UWTtaxrbbNRtNGldDiKvcy2DUYXIJHYwuY+S3bOH0XkRTZPSZW68wAM4La8v1rlThuxuWw4KEy9X27tdRFNx+frq7Car+EWgQyNN+PHR6+fmvnBFUStmOKkr/OdQjYumKslalVmn0dYxK0i1j6PDf1B7Zj9YMGWnFqnDaXH91KLcqcmFjha+EW3wEjtkYlwBhn5bI/4DA1MGEok18h89GyjXbgzuewz9h5pPJJu0uFdmAziK12455elvY8JVCbdRqxW2zwX7yuanSeSSZnZ1NlM4+34PdQiCNCq1WDVcf1iQ/cdw6ujsLdtXRitgs/N/4yRAACkKUAahzlI+9887+/FdnlxskzY28ommMXVb53aBejje3rePvhgbQju1qC6RO+qlWCF9hmZh3zRH46rJKAhoFqD2/6jOFquNxsIhaH0L4AtJOfWXde0Fj31qXrw2fm2WC0rfQ/Ao5xtxF/+qSdPJrS+ddI52UBX3mvNkTgcHetlfwfyZpV9IX11X1VPHXUzUN3U3brl8cUZegDoDk0pN3ONv8h9CE8SIF2gjNsgkbhvwXAZ3/Q7AEAlaPg/RQ8AQMYqSq7b6tT5ttRLw3YykpVzC39JDP23XBzPAODhlCdLeXb6xq0LqiiOVEV1ezYbq4/T7cXak0v3paXPbJOZOUQBxvfFKNmPiNhjKC2xtWJMkFxvFiu2m607EguGT88eBFjzSKENpAA2+wh2Voa5vTf58RPzzm+PFWcXE7b3BiQvDpo6vju5snc2KLf0bMqqcpUWKnpo07O13yDWbGQzTCrnBUEn9REcCYl+XAuwZmr62wPjsM/z8BzNs4yj8leAgl6wPy0vlQkkDAAUhJZS9SuL9zKksCn/TLO0C4Y/unUOmd+sSAwqwNMDBx58vkxubs/m5Sa4UkVFlxMxN3t6nF1rO7sTF95qMieY7uNvdvDip1BZEFb7HqZtLdYK3PSpR+hOgdb7AiM+M1+V3IAKASg37u3h9uAKEoAGfFCf9ltdEgIV49fXU6sAirrF+JH95uk5vpmd/uHozXcPZtrbT26DqNnLW5tsmXVAHr+z9unQyKQvMGdCyIB48fPs7BE9UR233IymRoYsXKKO844CRMP+mdmpj+m9elmlZv74TXPWz+oV3G39D6vJ9/HMp+LolmNcJCKA3piHs+2q/c7P8/x1Vb2c6/nF2xo4oVzOzE5mZmpYj7zJh+nYnCS7ga2OXK3XHSY1i0IJtNi3C0ZpiS4sezBBxv1TLvuWG7HAaM99RoZUORlsgdTJGPs7m0c6h1y7Rp4dXDz40zR7Np6d/maXDDNAOLsbTk+s/rij76uq/LI/+vjeiSYUvXo2f2K+2YwnudCenPXMzGkdKaQzc/6Zl2/HQpDnNtegGNe1JDJshuwhWe05uY4L6gZ+AyAgPiVvZ0ju07y3nEDbECwDgGQ4O4pzY8xy+Wd+Hu3dPME60afQ7XgQYX/3tWnXtw/4n1NZvvYDOY9H7btm89G8bbT2+3m4HJ42b56TsQVBujdTAokXPSxrTI3FuGa/HfolkMVG1H0S741Dn5oPayYxJrfX+2BwQs+0SB0ArEbPZuF7X3v/E0oPIL33LWZGoUG4JYb/792Fyw/Ht372ergqD+6GD6tby9Uvp4+2lpk93IvzjaM/mbjQpw7aZLW6p+EVh/VrwOoPhOsbLC4VG9F9Y1pFe9BBr9/gM7GtxAfRUnnQnbla7l6zr33Uf7s/rwKAzX/u9s8e49/6T16lUXf1jWlGZn56G0EBLuUD9W+fTTe/Xx8Gol9tfnr34MlbF/nRL37Dy8bnenV7e5yOR7P1fr1hpNqssPNXd/hVT1ODobKtbtfsu9hdLtxFty+gaK/VGsDn3hokJwCgRvsdUhwnvltP5BNIJ98/Su8BmLd+OukP/8rfeufJ48Pp4/pbnpFoQHJZagFny7eXpfzi5/cOfv/Wn9bfscdN+d7J+Q8/Mi9d+/QJPrJGJ6ebG9qF3ri6hmXKlOWF5h7duBpi1LH3HNRWQ++rv2yb0eIW6p7jk/JPjiRIwJjMxmtFkzXUwXun0xYA0oOPfwnfr/69P3lW1Mv8ViXMzNd4+u70e9DUqnrWL358N35Q2Lfbj+ydn129s1g+sGE53X23e7O10ahoh+NMcL66ZoZfZdiCgfGbA2USBW4c45WIxzWuTVuWR2PZBb6wzxUVre607K9SPgmDaThkKhOJ88nC9SuNPS3ZBHtQkusw2f+pk9233P74pwGJXgngxslk+ujgsnAyCMDYUM2XfvDEd8P+GUr7xDnh/Pif/lcOFXj61t/84LVpXii8/nCB6DldysQuU+8l5t5y4u+hJIGdY4dN3DNisH1iVRlWd22PQNfa7Zeq8UHyKRhcMBkkJyyUGr91jnw9/TJET3MBAHOi/c0yQn+Yf2aolAB/k9o/jP77p2dD8TbIOVd/bYws1pP5bXxE3Ln1p+7nnSo8LPMZfH0LPPuCgGAJrseok47YXue2lJaobZxUaeyeCmy2c9xIuiNOYuKjrjQ4W8nQRt+/AGjQOrBPwgMAXGt0xheLXxzYqRlMF9f7M2onVLOfPY3Qr3xyDKXrBY6vM/R3Hyt1L/3ANAAccfulpULRza/DuAPTN3af/PCL0ZuXzwBAT17v/1ZH3ZMdvEQQQQkMFJBYlRiOxZ4Re/s9XAo4zGkHYDnqBiyiG9ci2BS2zvHPvlDLjssNIsG1mQytTu1euUEBALQy9oMjpt5g+G+i13rfA2iooupj79sJhD3x4iP/AX0ffOfDb2/IXFhYSpR2BYBKYz++WcZb8bPzhXvnav8fNkPQTHPz7GGxWILGJwVgOK/QiLu2zsOhqMeNxNqht/Koylg0AnPvusCsMuAz8FBxpsxgLlxR1EtKCQ8aG3xXAAA24vlpibpPKqvu566fRukSQddOw1gdSkfRry/qJ6be2kbju1cG6nkkcmFSagGSaOXF7T+9W4V7BKCqQaqgzjvx/MdW1SmG6aLAgMOstLeBVQ8ZMe7BPW1yHpop4DpqzmGSg8Vi0wAXcX1QEcRnXsSF3aN6YzNxWrISjtl1xQGAc3QXe7M5NfvosavL+acMBCkQ3DoOAOFkJ9AHer5iXRdTf/yzueibOSSQQAACmnO3v3jkrX/nAyibeKFZRwsAIWqHRtfdvv73EcGKu4PPqWEHcLOVoalnEd26lk+7KlEBICR95v294eJr4dluKwEkhbLaSQqK78Ck2cwUot6k9uPmrasLJfOBYQId0Ndbs+X2P36p4v/S8YlEeuQtgFy7NTEURrUTpRyvtygMNKwO9FqzDtQI1Z7Le6/rcnvt7yJhRx6OnGWNifXEzVZddUTDeMUoGA4OUI1QViA+70KOtSgj+eU+gDCn6IbSOLaUyMfCfIWSsDiXPfPmOn5yKkV9HNbm/vHUxx69rv3FZ3/yzlfYAyudm+9Pia/swH6dDbXDMRQoNFQ3Owc8+32rfgvCjUf6uoiX9q3X5G5rRxvukWKqmequxWoQ2rCskZDGubp1KnpRn2dx5uo++Jsnx+7AeRxGmLbEidrGG/mpruQsmr0zH3N6C1fOoe9+GAFCnTKyX/rU6/LSv/z//emt6wji6lP/5uw42b4br/rt3atFjfVcJ2Ag8Cp3tSX4aHGyz3k6vCSGNRqxtx+kIeockgTIYaXw1lMJOCOkGfLUglVRZXn7NIvWft95EPWqOa+S6z7wwLO3UL1qHLvx7U+qfPX8g781N82eQNtjN9RTCHXLgODSiz/TXoTkz2tPwatPBLkIFbvigavpQkQA4uAVjVKedQBqJxuFlNfoxveBUcuL82UWBkXwkv6U2NnvqUMYrWJ3t1c+aZ+/hG1Rx3NFy5WKqyI+ur9NU4AXrhL9+zQ0UtBRQpz+w2ZwpLf0/vlrKzvSTH3J+NgF9D6Mr75Z/T6MljZ6P4Z+P3dyGlDwlR8CgI+/emUWxp/1z6Fvfia0s6K5erQkEKTW9j3feN5OcQ7VWPZPO90eMy14zRZOMcMPnzUMr2fEs0EcovR2aeuRqN6aAlLVEvjWJBaj6WKzdWF02mkSIfFxjb0GyQvd+/dtpyKRggPohZ30hcguegSQuPn241ZA3oJCON6utczC0vLiKTQ8/PH37937BMDuzvEj/x3mv//Oivx9F0T2xWl9okkQCDRi1ECBYXwHR8Vp6lRG8BrTze30AfZYOFr0vk6HdseP70xfWkyUtN6Tz46DRgMlx+8RpL+N4VY50Pp/Y20afAPyzi5MQ1bV1Fz3Ad1vz0aYcUBFdxyH+gLo30cVLER608Aqp65BhDG5Dig6u/nsz9cbZBLvDey3+mfmjyOEMELg892T6cpo5lU4U1h+7VSzp/3uI6ekFpz8gzwtxTlAAgk0XM4i6jhA7BTnzgYqpwJDeoltKY+Vp7cC4IcE136Lz5z0fn9cwRc4/7IfP7iV2ijRGLgZCKY6WgmKwF6iNXWMeQMbaaToTgQhqOwlPpj7oQLu5YF7WSkORNVdtyrA3y9dTubMiAxXgNmDTQxgJln+4IUAQA1RS7dW5hHGGKPw23fo/0H1FM8u98hfRzTIDlVG+Uvfb1zIvfXEgysCQfih/ka/bO9Tzzt1iB0KlRzeNjVvdMViinJBPvOlll29GSqqRSWxCfmwnLKtDycufPo6D9STpd8/uZUVeWpvfABvn+0msTXzQOfEQTDSWQrgyn0+gu+jvNLAfQxewAR2MaCrCig7Mg64/9FnIDQrfQcikBMO4I2NTdy+DVkQCN73svvgskjNep0vyH/utQ+n+oiX/vvfPPlLweb3PaIP5dTPf/7L/2Hr8c4qQQJdeSAzyZbEiOQdut9QisBYnGNdau8jxNWirXQC+Xk/R21ZFP2oDmrXy9MdFx4e+pPDqzt+8AQkQZCjPlfqTqjBTldTzOowSeapYcQQq2NVNai2Xvibxv6nIKAOxIC95+FeP6Hqzm+PK4qCEmRQUNQh6eHZ8o8kRhiAiNwiQzEkKSVqFErZr+bOIwH5+LlHBWCMcQBvXlM+l8FvEy4flRT09TuPPzYqOZ/ebIj54m4PsiJz4WhuMLqAR4xgrcKCJI51OVidnFvlyVP9uCHREbgIB6oI1xw8PWBtrd+3m/Nd9z9NsjTGPbirienGGaUQF7RyXY055eE5GfKKSWrUoNp65SPuYeDeefuuRIpDKZWuWepAdBRQNUlArhnAQP3xtkLyjyYvrFeubYPhp1JsnHXjq6WSlSrLD74OKRCuF3/t4SfQ2/BnV/8keu3x9tbDANeSh9LKH+mAofaywgFPlYYyVyCBBBoxgrUONUAQAh7zqxxKOtxwiKdYbtxT2EngMKjooV3nWHguE0yxnjCra/neU1572ZWjWlXg0+7o78QXTofn5maNC4VQX4JmXKuLl/0dwz4CDuYhXgNxSESRAAfrA1EHPRZVAVJQVQUFURDATKJqPKbZHyWM4PS1Bu+pKgl5qkDatQe/nC9fPCMgVfopUHqeHrzmnQvqX4d+YVRqCkinIBLocbs1onpT85HFTGEPUMCetUPbCn3G6eReqW1RnADEq29dYl6hoy/nmND/8kiLYX9VmAKdTqcQUVXOOceZGBf6vDEZjCF5XiROHkuFoRCKlz53bRyRCFGRcKAroagbKCvIKHQNFFRJJXVFQM2gKqAiQ+JFxNID/ghxWTy9xdKvnAkpG/gAkgYhOu9ExsVsOEodwtjPjJgQoH/wtR/5eb1fGUrK1JkEABLLi6n+BI0Y95EBPJJHUAsSdmazeJqzK4LiYnpGaN+7NIDC8eGiiXbpzz7/zJ7/xaoOwWpDD48ZUAgRnVaboTlGwTjn+Ybegt4OLVb63s5/EuXVxhZ3NTrMsldEAETkgacIgTEnw5ATsMtgcOAqIsAMGZXZKwEUPqOIpjyg7TQTipH4o8NbcmoZC0NKgBsKU+MNWqn9Qe2DE116dah8AIZuh0ZACP7rzCdROjMBja64ipfqTwSgkWKQKp94ZaDwVKISoCqm01Mn9LOMlWw5+xlykaihN/hoCWYYDO0hbT1+8JP+4vLhj3YEGvcAr79nTEhovaqr9cmoNvBLDAtfjBseUdKRrrxYzxV/SQF0VQQkZCQkYBKBSkUAskHQbCwCWs7XDL0qCmaTgNGmCAoxamoEnTJLcozaGJFf7a0Yu7CHVKpHBgvP8ZJ/rUSjPp8N/HOv3ek9BWtzACD2+GP106NumTSUOmh03gpAuWDoa5YYkcwjBIhXWjsboDqbl1rcUFjiSXZWjpiWDYWIV0Q5T4oJqcWD06TLkxev8sYn/HCnQ+yptL+5F9L4VnMAB62fliVbMxAtF9RGDAGbFH76o9EGWUFLGzDMRYGULFwPqDKLHCTwOTk0uYDtSLnIE+qz6TMwGhMlo6gHEoSQJTtlMLDeuYqX3NmRv8KbQYTw9gSotsrnYEPfCRaOXF2XP3uhcVv53jsJys+teTadxnjo+BEzBKm1/ZNXQHoaUcajtbFQPTbrm7nM7oLBE5yznPwoZzqykyPs0J4mp5X9vl18cj7geNL85EHrc5teVNEHlcB927nUNKYBLaLLOMd+BsuURXS4TRYqEvUSR1bCYho0Gq5kQnPIZFWJrYDhhEDlIknqWpPr0sYUyxLnp3dXYUPqKnDcNTTu+gSVbWKEoOZBmNFAldDtZO7o5Lf5PzYCKLGSG8QgqSGHaOnJ7Niz6KGl/qRM2zc0Pfrh6p2BoJ1z3w4fab+5txUDeu0JBOn5AYvOZsWhTBYpSUgMaRAfuxKFrN8v1ho/yy8buk85Ofs93Wq/LgcO3teLGm/yMk2fz7fH2/ayPR23Kxpx53otgGlJFnwzsLqwmTE4DmvWat4Krp/9CMO0yIY0TxMcZmGgAXBDqmtdFQVpXy5WmalizLn3OnZ16ObeYsRwexvXqAJSjWkr47btsaZcriUk+KkDrnIMSFlxc4wgQ/k3+auPuVF1JbIRnIkmwpf52bDfV85m4dWd85s/9O1nH0ACJKOxoy9OX33qbVa6j6OvfA/6avnRPeAgmbKrLbAhNUhAuvQOMBbe3TrfsxbAW6uHed93iUcASH2ZbxhIDT/F5EJdjofl+GzBB8uF2yuvGLhHveHMwjxoVVqWuphTQwQMnYwdUc/7LEZt427glKSJzW0Vnp6JKYELU20rG5UKu6QZR0nTFCQe1z7343gxn9bQ5rip7bLje7zNK4gx+wSzupWYgekiGkBDawKs+AruHifx7R2zD34Bqid0qWVb409eGctcvJ4//rX6n7345Qn29WfWfuLL3Y8ACPL5ReVPllMFd+cY2vmt459B/+VPwkHTpBoKIdKKBNpPGwXu1jUHsEpTKo+teeZ+HM/xIXuFDZ5NJzXsdzEwzbeLjpErlru7Zz/z0w92t10DH3Gs6Tk6vAXbFdGahmYFENUAN9A88fVidZQugoQbSTR3pfnh8BCHj37xdEZGcJpLdWBCtFAw0aMj55fze9uKN0XT0l0l38OS3GaOQZsYTMgSOjXOOA6WhEjSnM3DUKYgK6bBCAu+seMTzxX6+pGH8pODZ918pPHixg+smnd+de6Z7H/4rGNqZ5Z2AVDhM0cuHUUYQbrkfqv1CyagAyPlRqf0qEpnwdAOK6+XJrEXVU2ddk/Vg2KaKwLNC6OG+DjQ1nlk5kM/vCIu8aNxu2aPF8T0Kygsr60xo/sgbbCQe7MaYj/vmxAw0GTgNjJbyswOFrKn2WM6ftAOfqbQoLApXB9JrUn6rJlhVU+vRuVGbuWr8fk6mBBH4yUWk49NtHRFNvWAqqXxWqSioSshMAoDVRy3nQ6S+PDiYdb4YwsZkB6FAMqD5Tdlc0rPPzb1+/npZx/A8tT4yaM7vz/+zz7301/csqYcG77xUYAxa9TX237+/3rfJyV0V1oFCUCjHkAsSBWgJpwoXrXsbyZnArxrEt3ykxwK/6Zs15f05Yp2qntsvTwuf/Dx5cm80yJqD3yMOTTknQqQL9alI03ECA+sMdOVAMncSCthfsKjHSGBxnS3eTobcGhELna0dtAH0vevWhpfHVeJK4huozEWulkvikWxur2hMxm1E1xVZ/2URubJ+b3w7PDy6ExSDR45ZtPZj9fkTMbNbaK5RUm8ZmmswezSiMRHt9rQzKo9uLmx+eOJUgeKRRx6Pcg/NfGdsnpz+uqHCjeiH342mF/cEmjs2Pk/KDJn9tdff/8TXWBEbMwKhEZUGvy7nyrczUYCBAINP8BINKJoDJ6y8lkQS/L6Oov3W4G69E8biRA9izvDVDFSALs886q7+XJzvP4HL1e0MmrGLX2jaSWLw4QSvpiN4Iw7yQSWi3AumKR8xnnEcj5gJm4Ak7WDrUibDKARh7kdv71+8ewgnE01z2SUk/QQJRb1hanW9awoPqhuVV03xQ2t+5Js+jjcs+82h4dPz8UmItspgHgeWgRff+8V1mmeU0G6CySt+A/phMJlPpr7tUHDwfrXVA6YEsHiPvyx3N2acYgKIYzl0VsnvSNbC9uvfMH49JLROIMEQHK2MLb2+IuZjXGA9/mwMw5oqNB8rN+L9hL7NhS4X9UbQPWqI6ozrcnZ02TOdi2IGf3e0kIVSXb2OFxwuTtPz5/ubddtS+Jy/WRNZ0VIjpjjFkpwp6RBQH7OyVRENJJuYaCI6cniMh07PoqLzc2PH8w//7Vf3OBo3k1956pzs6SYhcvI1WWg7+u7B2RGZd0CwNJV6xAemWT6Szfm51w/Y6QAkOH8m8fLzXrwm+DUAp5fmhXH4RLAQLSnxEf0XYM0pMewML+ES2mU8igIDYmb8EdhZwFP6XXkB+TBI9v11oe9Z35v9gde/e7D3Wuz3zkPAMWuQJJ9cm3RBmG//pEnvvBJBCnucbsBVAlcidY1soUsmpnpkq2SvcdnzgXZjZQIsIGLqIZYejuebzjjulHkz2D5m1/F7pZPD1bN6P7+8SKT8QgNFDWOO6U6PeeI0jK4AXSbej/Snt581ieeFr6YLjE9XX/gn3ibL0Vz8BrGDrZP+3xIccqNG8cV8Z9P75+kqugTpaluDIQr7xU7/0xqft64mtscCw/aPl7PT1/Hs6efPPmu4nDpUXUtUaVZtaFkiA9jLFb1gS6oMaxaMsgqccG0CO5ISvgDCEmvnUxaA1eamuZTYrL5+L9k/99HnnvtMyvfnMpfbj8DAgkw6EcdT6D++tJnP8mGamGYbvGetZ8IDcm2W+EAJZkb87NkKvP1XjlzzzBzk9BwgKQ5j6Eldjbip0b/ttv+tmODoEtoVZJqeSfOV8urMDZzIEZrFk2/GxefZU4R9Xw2P2WyqSnaTcZHwMtDj344Tmh2enpcHha++JJnPl3nDvX9MoxLjnlWMqavwUyGH5luqlABhA01LcSuj5dJZRWPA3u/5A7Nx/q1452jPZyW9cVlvTSulFsrzrsRDSHKqltaL/91I4wYZ9YUx0kxRqzKCMka4+uos8Pd/QpFe6kz/PLbA5kjZfd2whf1zTPUkh7qbdQWO5J/4XH07Ld+7DQSAOKzri+g2f8Bnx0gC16P339XW3G4rxkhihu6FjdiL2m9WU2uSsZ4ZPWkHCQKxEDyHIzBEfy5ijByggOKsSLTNoQf/DV+p9/M8MriUevdSJWiqFBngVDfjwYaI6edLVckocV1PMWsut4sIbMxPLKGuYhz1jy2+bAZ80gU84SElV0aUSRZFdp0kcd9x2RdlhTz+ZY7WcpjjEKdyAjQqO7Ux6JPA7Tb03jSExIAazkyRsiobOtiLHyQcrtoR90sojFIZJkZmdHCNQbCI+nA9QD4hTx2pShk4uB8NlUqQSS10YnUBjJ1Saaivcy6AImp8gFAokKWyBCihkB9PS3ncMCcdt43WFaOLn/y2lLy7Pij5x/ZMc/8REw+p3/hL5q/8DvhiK+v1R/8xMMHyIBGdXfinjRmRKjpvmFWTRaZDtp0FJ5IVGUtCrwdl0NkETuOMWCgq3+AFjGSYhCnDPgxf+3fS/K2cHEQNSNVihFhSGVcH824wRhFF6bhy8eoPj5FLyEAMrGxFZfIrqg3tVTWzFK0kqzizJhAhqYy63NR8IhYk9fO3ZIHOPJKk5ow7BK3CGEiqyJIEwMmECBQOoh5jhdRs+46hEOQiRyhG2uCIYjSF+O7tKaD9bqpXCYmtIYBEJGRUXH/ogTAL+oxEeU4SjDIxtQaaHZyjUxLgJen51ouguToYLtsDClA0lA5GnMRKCCFRF8/Gyi0ghy2dqFcyMfzmx+QIVhZ2PjFuUti+rSXl775H4783Y1f+809hnLg0DR/8PdyUKsKRyvyQCZjwcCR8o3KEJQEc9E8Qq5ncBxjxESHEoODO+NfmsbVyGKxzpjVfd+BKAFDcXROqOuXaMdFNTpYEc0EyDcQT3RMRGTYmMKRJVOZmozN3ZT7DuY2da4ExQKdra9uscxmayh7+UyX+9CWq1LVsAsxsyQtQ7URVkQyBlFXDdekoYOFPyhv+FZvTeCC6yTESGVzhd4cJfBt9q0ssQ0HxmQlRSKEQcodMBjKMvQU4BfuzUYJNQaPLUHZzd0GIRNseLqg5PrSrFMkoz2IEhgUhmkmASW086+v1HxU8UpjPlYOfZ0MC0HiimNWBXttrYxPHf38wjz7dPGrG7fP1qH08Bfh+pW/+1c++Lny7+4ADBfgIWp6Oim6AhoaCWe/pArQ54RDS3o72UQnOTly3AgSqNJ3OSurc1gsTWC1wjyCJNQgrTi0UQ2QlkpbCOx5cY7BCstKdvHeRzDIt6VFW1pbOOMKK4Xpmu6YNxNyPRfOcEC2NNGeqq6sohlXxHovP64Itjam0AmEZJ5oMKEiBCOcEKm1mEO/HCrXWdLvo6LTc5GEIh9PCjeuMIHzxBsllU5NiqZELesEjNcHBQjRDLI8sSIMffVFHKE4gGSTYOGEWAoDzA1IJQ+10XgCkighLa1QJDaOgLT1UkKZhgp9YQIwjHODB/T1EFYA8IqyRca8XqH5g4+8uBquLp7+1w+cug7g/ev/61mwv+f83Gd/54HN71v8zMsbLUAIUk1/uGJvxKCm/55P73KdS16qBnxzWlBIgbLIxNeMceic4yIxeSx6+eRwXKHF+JiU5cHSk/v82kMLEymlF+W+tITKuMUbWNI8j+NM+UnqNZ543yPAQZAjGwIaO0aALAXlebuaFXYUEKwzBgwlEypcAZUWeRG5dSRnClx0qrrFsclmIiWDIDUfEVUUWwLEoDMnnCUaByGNYix6fkbaPsJ9WPJ6nYSwL7A77qRjhosYgsmATAYZCACBlHDQIwQcGoVfmJEaeZboqEZJhPfLCWIaieTG0lK5EZlkCJNaEExIhBLjj8nBkKCwSKSVGUYAJRQHsFFivBL57psAKduFVgJs6UftdXzrxJnNJ+nr+uSbe6LK3/Pt38+ea3/41/6P6qUvrK38yGz1sPtAl+v7BLrMRWn8NioWVL5B/yCok+A6GkdyMKhLUoR2a3MgE0hUM3LAEX7wkDynFco0LYHYR6st9J2VxJKnkQuP8zpcoXnnEYPky8wMbK2AeOfYuiLpLbdKMqu6UCSj2zRhNEQj6QvHUD14vJLRhW+KJqropSKVVWTWIkVCaR/QKMsgRkF32n0FyWa8K5QwFnY9K+2exqL0LWQqKBq3XsUMVsEWIZOgpFQYYjBEYJBAoc5CuGdZfDFGLAmKskIiGEqqlZC3vmEwuEGUOtCNHgzMQhyUA6JSHB4yEt0kIXODkJRCEumJJEUVzuIVCgIIfg0EpnqSeoD44ufM3OXtJLr8vZFIKXGsv3Xx1+BU7pl47rEbT9L+zRHP8g9lK6ek0moXmMrlgsLVSopKRVq5H71RHyWifxYt6DiGTs3btYnV0eDdWoCMZbmyysWFpGjeYB8NB1CYDriaHf0Se/Xvi3aKwuZZoRaYvPO3PmLLzK4osOa4MGNTzcfkmpmsy3U6pNinAlPFBb5xEWZKhQlnIOlKJGPey9aElFUYqiDCpRJCkKIfVAmP1ZTXQizvDLBumOuMZgdZvtRxpxyasB6NYFQVBMDJEBs0ZK0DLoOPSYxlsGhY0SFBbxgJEHA3GPHZr5dBoKzMAEQaZcyaa3WmaegGySkx6IsdO3qzDhcBbYxhwRSCCGVah9ihjG1LAGUTuMEVp4bUFDYEVpnf8bUz9ADLr3zqZPH57FgYr84DwJunyK/+rRN1gEkF4GTmXJ69+u3D29iP1WNkITewJLFmFoI3U2WdAnM4cfPH7gF2fbeNfDcCS5AFdNiyCN/B40AHRvYEx77Yd5f7Uw61Ew3Je2bynulGQEIiYxxay85UgP2BFmDYr+tpLjeawMGqHENpDWAVrOvMdp3tgabESMGMW5Eo5nJKIkJ8EtCwlVfrlbOp9k1V0QrrlUONXM3KeNBD4a5f6XYqTDGzM6JglIsSiYiUjUGnPmEOaVT3rVqugdjGWCHsvDrB0Ljn/VmcFMFUAzaIcp5l/YWRMEumZkVTuGQs2Tv1Hs3UtBzRAUZu1IHsB60iMpOZyJRWCbnWbyImiaY0IU01y1ASOsEqL8h32ugQir12BhbdU4M35y/mYfepzd6HXsptJcPyzjw++/++ez7aoSxXUzIgL4DwBRjjyiRxOTtFvo30moyYFDXBY6S++o8rV0F58HUlid1DTG+KN8UfQJXuQt/xTwlAZRoVvdvAZ/ok7QlsbON98kzDazoybKw1XLuCq/HalKNJ0XCVy2xtSqNs6s2siIz1hSujXjaFHR/JKFFMKkUOR5VcfownACUEThYBALqd3+08AwACUkDdbEURJ2a1t9zzid+LKzsHre+9hQAIiQrMSkwKZMmgY+ts3npcoZ2Xyg7BBTvA5zwaq0cCh6CkWDs1/9myEpi6c/E54NkdrUw1JiIw24UuoZuDK6yfps+gTnUklNnBVamupMAo85akIURUdT9AFInHD3j3F0PdCao9Q8048Bo6Px7axcFvXHjlV0boOvK3/7UPhzp+dkR5jWJyH0TWMDU0n7ZXvSHf3FPMcQgipgbjIB5bYQWUE4DdhqQsx/0V4aB6BAHhn1kelVnovnlkQ3kD29N1Zrgxk3fMNTEgOOJxSdXUmKq0hZtktDM7zfYwxgiOk1pPhW3H4JxYTVBv9MGdlb2bGGrfQPGuN38K8TDDDQMjSDm5wXA+D286ysMagNhbE53L8xNXbYo0p24MfBpEGq1ZKUZUtCxFSIoMxOxMtCUrF25sN8uRNKODDpmR3Locuhw+t5E4+MKSI8Uz7ySYBpTpoRzg24Bo6QyWWSk9gTx2JEFhmVtmTgES+XR5UM9TLLl4dDGMD5AWRRiE7qJQy4YSGMV5yaAk96ZZ8p23wUThBTO/FeanobTwOgjQ52a+8jmojyiJv8TeHbPG4WZauXB0b+Dkaqov0OvMzTfjGU2gyZiyfGpEhj1XE37HCs/E85D1tWdM2GGhep0ammpXWgnsI8/s9StIqLTEVl25ARgXmBVleNyKJ0Vn4Q4B75BlRCAENkZGhUJJbpwrjVpL1wYDUV3DJdSp0WzRkCGsiW2wI7W3TZ3inOqAuhFC/ikToW4ZwdC81QyOZ8XajeP+8kMzkJ50h46/5vvl3b4sOq5iiDqmUTIEEiHGSJQdZSCymoxRY9gVaCnE2uAy1pRKJPIWEYax+Hm99m4iiLKImUJDAiaYaN3VJxnTCK6GnCQvs8lGYd0MaSYEUu5MIJML7eIZ6oyQ4y4ZKyPCKKQHlAZCAJGw2IyS3QTMUMqBKHq/W4aVcL8sZ5x5x05vXPSKM710ofzd+lJNgD9UAFn07lm31K0jxrTzt96pgrKc13tSbyAytBNuEHP5HMMyBIc0VjuNDYsVAE4/f91L1vP6G1Z1SbrrZaCBggDAyUzFTYGIlvb88mp9uCK1DXkFJfF+X/SQDDEKOSY3ruuxqYuJq4wGTK5cUZ1DHUYmK1RkDgXk/muP6i1up98/DH7a+1OlToRsT+JH5pShr5CpcJbG1LdOPFd7HDgWQx4KSGzH6VnTy5fm+9QRb8sehGxSYooaUmEIu+QAkEJSBnSaKPnJqAy2WvXGFLwq4kRgx+s7ej/jrxsGBooar/1kWdyVlDFaGMKE7YhsbWmploZ5VeCIs5klkumSPTn3W7wKS6E9+Yk2NK6rrxHMlWtkBMxjNbgFhRTFtGgB1STrO7PskJx8t4S2hLePjohnyCvF83P/anHdsW79PADUFoNLYMAeLwAwePcMXtSDca2L2KvcKTMBAnS15m/ywSakIV8IcxCaYuxoE0swDKtPQK769pPLQFR6jr3MjncVZl9R2RDiECsiQ9uKnPZMu9XkjRxAsW0vO0oRj38yESFaopLZWetKV1YLR8aZqmgJDVUi1AOIsVUdoEzBRRer229ePZtnlqoQEhUGajw5jgCN8JFeWCyi333/+Ch7BICgba8D9LYi2EQ4iBCVvFF0R5pVUrbGSEo95cLkbF0qCuEcxSZXFJvnZhRub8fj7BLuhOFQaJ7vCBwCLFi5aprJPjsds2ja1B0wl5IxJ+MWZzC9W/aTEHDroAXVLY4UVuthiGSsjfHwpYldt59H5IroVAKO4cukZ1IGrS5CsnhlVmQ2cMiTd0xrwwr4MJgDdCevafnNW5/9me9/SOr9+A0AENrZt1Jpkzz1x0DgXTa4mbK1HNzNc/dLA7fewQEjvmJUiozkddEzb8Jlba/UMWg9qr/68Ss+Ya9gha0xQg0l4ZYX+gUaIQheV+TSVByrIn9rTFz0Ep3Yhe2SvKAotmHXArRUwHmPiVbYjQFk5BhNImfBWbfdkmWoj0d9oTaCq3OvYkeYlUYagHMu3fRROh4XVBJts6j2szmkIUAwhNdW/ExHwOl9TOToYv8sbBHpMtdzO7aeV+r+TN0Wk1QAnFMQAKvGuCQ2BZeLSq4nsGOGoIGr7irMDQ7GhrJ/TlsEVZ/tcNTDB/bpMUyyDcbXPCRl0aebe4uJ9kV7sshpl+XpYuhsyTBZAAde1lnlklpxOC/tjG595bL69DpjYddCQ1p2CzQGJFiI9BBg2TnRjWYcc7L03inFzVERSBSk6PTO8gcLzr/82F8o/obWrgMIEA/BHjJ8n3MN3n3Ydf7ivA7JWNlSm4U8M6Wvnly1v9MWFB6HDfbi940AxZXBn4d+/OSnC6YhBUiQLnvJqcb3XgcIyBVtSgE1RDr4qDGuE9s6Ii/OTVE8C8XhB6pu+z2eJKEiokG2ToJzyagvK3oQuBxdfvhMwPo0BuuZFGYOoQhbiJN2XLEblbm6fWj4u0dIoqbaIO1Kevsr+axa2pgZHeeFh4RHsCzqt/2iZdxxKMe6vzWm7xnVJa+kJRpULtAEoNBabjNUdS6TAEi87c5XgP1k4PehA3bnPcVTxKiaTPalCbKO5ow0woJGUxrSmet3+6dHJDsxL7QIcFpEUCX9VMZbWAJStIQCikXW17RFvYf3vizsmb4cAowKbZm0jJZiRpOlkeD+f3Q19N4Zqx1ZHaT4s/8+1sHRNj7wxo7yMevLZwfP0M1VABAjajlzGt6Fg10cJtMpnAzdHBvALv0wnVdBXzENrX5qt3N4jgMtPvXL2oK99bnrN6cvXu1TkTm22BJSmoWmGLWPEo6F/5RImi0RaUKu7ArSBdiwaH9cUWEJ69qrXEf289BhJCAosmFmQhSBiUBl2mUQWdmeY0YphY0tNVFBYIoc01jsrWo7N/S6qRUjLqW8S81TAVHJtcDZyMPkQRu+txkBYb4rYhI5B3VDODHYiCpZbDBxjw4FKxuxM+XUWqrnLgR2T2WU8zsbQwMvCQ7t5El6948jkhRlsLPb8Wf9B+0Mg18wCWVKot8v+Oh+5joJC6zUx1gUj5NagBLIbaBLXXz58cOr3numLceLzUvTApMlkmKKlgwComjA2CKr1BvEu/KGeeJmil9RMt1YcTbf/30v/Vr04/Ja2j7PBQAhQIB4Nx4hW6pzNpMq42WChxm5LRGrwczIr1psFSCFgazokWDVExx13eyj2192v7mKZlRaFTohCkaDI1IKuczhzlEjzPR3k/4pWQgcDqys6iBScTuOFZtFMOMk4+GzjUak6+FPAeqKwvtZlcd2C5K73tSCY0Wb1ClxafsMYp2bcnprsvmVc3O3LjtCCKFQhy4u3pWwExlSQ0/4ib14deehN+wJ9LY8fNCkZBGkV04MwSViQwVQPLBgJ+iq8XhkTHe1qNOsxc0EAWmgnMLzHIkbQTmPrFFuc1/zhMtyIylO1qGcZIn+8QPvpgRiRBd280wcetCYPyrlq4RSlyXt0tkvyt4uLdfTEmbefUXTyq05qafLlmPD1veizmbDvaIwvBOW7YmKGwCAJ4sJflJZevPy4//v55d130j5ZW7+zvpw6r/bpiZdwq3B66cxQhlDB9tMeoO5psjqQGr4VRd3gkCA6njcHJ99uAJX+Bg2INNYYLoSXBM0fHLnmQvnas16Tt5ePxLULLRbQN7qF265wt/SqrCPnWoGFKeJiK0hJMimXlCrm2UbEooruqzq1BT1MzsDsqMkcFgZ3ZR3yn+bjrDudRgFKf13IdTtSQAqDbVDtyHyd9bySbRNC/P121cSs6XbuaXCiUUESADdyDYVVkQLm+ez9UzfwDjetilXpzBDGACf5SqxXImCQSbi6YPCmQ/PwrojZuSHr46fTbK2Eh7eM3z//x2fWg77HEMmjmlT98MSKXyRrd+zT4dXmC639trEh2N0fut17+3CMAO76DTAKJ9UI7xtQ+a8A6JLauQrx6CTAEDinteffyS64H+9/Iv/9UcMP+3kyelbmyMy+l25YElhAH2dqMsxMdrM40yD8qvEI3mI1mDoGOTP+20UCkr/MAI5boXjmO3j3LSjiqnJIaouWWoRDivp2rX87kS+Hw5O9GruFVve/nuik7LjvJs7yRWmfwNmMvXIPGq2GWRojIaNQQJ2qlV54X3MgcZIpihFBbEQx94ijgGKVFtD8eR2nS2VddgdQfciq9gm5NttsBvFfPIdsyk+IbY5Ri2IUAC3Xl3X1Ba3fDQlnXMyB1i34xG4qmRrz7bOiJqhk8VzXEVRVUUZ9OqJWVrns4uw+NRN+e3feR6wQ17AuaN7AOJeDlyn2GXYNRRLSdHXPl/uMw9xfPWtw8/CsoWrf/fThXlY1l/D70zyO5E8EPSWoJwgbDMOvfd/+F5bllNlrD/z7KuBUlat2zd+6Y2UjQIAjupCCHi3DlUx7bwi7GBhxVCxzcCeqTeQZtQ7+ULGaoLlEcJ4dxfml49wloz0lFbjVyUIllGCRKsSOXm54EdOdrOarI+XLpz5B+FAIWNdsK4tuYfp8KberSqKUMeALZFJ2dgCCHN/PVHNNnLUYmx57LNY2CwqdZGcLceBR5O33oBiYwc3LEiA7k3QidwtwhsuhZj18u+++8g8SyujKasBIaPgbZWIS2Ybi9FhsR1VunQWdzcbfZwRycBVSLzrkQiK1QPBkiBFsSW73/74w+SMFWifPnxnAnpOU65BDPlWgk9oN1+o3bLYt2FDtZRCy8V703r4W/ZDAG3tzf/p37w9PP2l8Wf89sOMPJBCmqOToG1G25ObTzG9E8hnq9vdT37po6L+svvhcDD9miZQ2lFRBIB3Mc0ECQ8Wc0ZaskAbn2huBn7VRvnpbcQbjJHBYvpTSASVHu79aVwLwHCAScFyyk0KE6Y4FcWwDrvw0a2rk3wXuirqZzXQwid/lKD3RKqmLltJVERUq+0WKGx43HwjyTAqK7BBpLIQzZigFK0LwBRc0QtQeeblmKREYyyU2ZrXXo8saBXhuuK9y6mQdSN324TNlfylX8Jf/p01R0VKEJREsnFIHspKyuqyuT1KhcXUWgeryadInF3V9uP9DpPf+VUEqGwbAyVLo4xMGeUDT2Mn0GMj1RVnx6QTxJIWAPWIEhKEYR0bqXiYA5iOrwwRk4tP1zUva8vjnW6zJ0/ixx8tBP3AdAMdY9qx9p7g/1oEgEvaOXPwypWzY3O3+sVbmUoFbpyAlHtDmS1G0n33bLFsag7ZhluvcND5VQLREkXACqW4S5tTakuaX8EKl641LGqhFW5Uy6+IGtYgQGG9iq/d0j1pUc9tGpsPWtvs++Sm1SHIC7S0BGjsKgQP6WWJEJsFg8hggreM1roKxFbW5DZHDaGHSGbymi+EnJ/MWfWue4CeEQlpKNk9HDWAb035T676C6z/sDUZF4t10RqXuLO10bpyZnwwm9fdOrx5UbHOdJuOPCIYpcKM4eODm/iKdz2Vx8PLUtRyd+RqQkOuB6lJFs0uc4CBHFzUGPyBQHs5pusiCEPqCMXGy2S6Jn/w8Gn98MVfN9h8R2ufftTjcIZAT49v/eTJxt0CXtgJkGBV670ntx7sUVQuC6jc7syduB0+cGF+7Lblrc7Xx1LuDlkFoyi+q87sOn25o6jcr6TQV74VIur3BWR1ERA0BEF4Qaqudtvj5XUr9BaOvazKjUwBGHEmgWC5kLmWf/+6oq9YTWt8N1eaqD3Pfo/kc/giKOM61f0bGLcuiMcdFzncGjljEFDGWlkmYuxd0cOsHjO+OZeMtwzeupqRjmhhdGLt4ZE3u3dsn4tb3jtnfdxk6ZJcufKuXo3DxiY2VQGIk2o0rarbd+XiSj/ByvKZHe8E3HWveM4VgtvUCvMOy81GXSU8vjwc2jnVcp3RmzOMZKeLEix9pURA1/MD1fa3QYwrRHjcASDshPMh4n6+Wdv9T38Ef/7L2zgH46DsjdP98RwGBA6Wo+jczbT3fVT6CUBXnjndu3XryCfX6W36g/MvvXQHlc///c8KEAjEe8EveTDCtajKuPUcRQ2nRlo+zoWOCZAJTiq8K1bkso4bH+3N1tf7tlN3WPG0KEzIqiA9By9VG7nLZ/x2qyR7G9Vz9V4uQY2IrYPF02plW2FxCGpQCBd41BE5gTYZsiHIxNmCcYyGJjYZun9YlVwupkptUedxwTQtKuU7I39iE9JgFOBzgHDrmpbbXldLTaHavP98PQlZwSVFgtJUdXFrxHTCx5PF2jo5phZhuCwAtKwgAuAuVe9T0yqeCIS9PJwe4jDdvjKu9Cnypi9mgHc4pgzFXh2KGqIObfhDBlDUwHVdCQ3Hqe6FOgiQueEeL3/ww2n9zeM/f1p++hs/n379F45LywNEZpwCRtvwzMBRfHKQnfcL+UgLAMBH8KFG0FtkAg+6Lzz58LI8tv5nGymjhHiX487U9JjMMzWpelR49ZVKroEG9iuWAKyUqgN8JUj7jOPFLRzjRFFBVKBclIm0jkFBKbn9llCUMVkPOtPCGSChakDjQtXma7+4U7TcuGvP6cJDvMHjerceY/KjZ1FYNBWYAtUWZLSoJXEWByPTG55mV07EYjlFY8uFmx9rpp35nws0m20AXqXUpN5ilMyXApJCNCmpLaM/cCNxcNIiTdAD7kYcAtx8qb3HqRp7iPCkXH0OktaNK47WTwsBZCazZr44ODoyaEitnax5fFR20IRxFbhhnmDejy+n/In9iZf+3T+Y+fMPM9IgexLOtpbHa5V3wDaoX9zgvf/uCPaQVPvO0aeXXjmy9NDD39A//sWZvp/2KGUOiP1Ybey+e7bY1VnkBHAkyo3hlU27L28gHG5qznufRRSpJbe95MeLWFTdu0JOq+a/KT3CnI4DUFpHUTTpxJjXEPjoIJZf8WY//a091fuWF4XNPlszOF3h2PNT3P9hC8JMzmhssj3mhIDMaKupK5JHB9XYKWx5xqUxn84jxsViVsDE5c9TCyBxiuvu9rcf/KF4c1R2DKb3CQKisrjCjqh8Y1ROckTAfd81xsF+r/qd748fOyiZM03ohgSB5URLnRZIlpoXNrBjzOh9h6lKoDfvdPVBpQeCxfnZcb49x9HjkxeB7o5mcTcfBE2ypu1oAwxMCiryvwtvEAZgoX7Iz2yh19+yPvGdH/nMxQ+trQ87C+IAhhrX8bvstk4uGgjTcUnCIE7mV3/KLLlSg05q8xZl2cuKV/reRRJKr9i1NfdKUQ1J0QhiWIciBa3isTU7rGmq1u9lAwBWPpeWi63LvXwad7GAfeSXbcgMbtz2ANaUSQmdHoyTQ0yJCnZSWLKjys3DqGQs8vxgvMBunok+oyregVberI+1v6RF6grojOaIPBAHTabjsqxuRdhjKuJ+P+m+8dZ2P7yqDQKh4ARYGuTd5pVrgxn6lMs8/BWDglcACvMVAL2dWFTmoqeKoAfFnC0XAOsUUxgbsxtePMCST0SUydcAsqCWnoR4x5mddwCQp9oDqMxMrBTeUl9AZ6eRGGoVAeIA36nw4dq77xhLYW/J/dVKX4rfGuRZIeUbyT2U3NTfAHcVO13BSkJHstvU4F+xfVU2rpPDIyoeAjHsGSxsLM8Fq2oxeSgcvwKAdgtScr+35BPZ00e4c94sxVm70HWePmIJoDXI6ZOOpuKwGqkQJ9RyngStw9m9jiTyfCTsRO1tdeN3MBDLYPRzttXTq3xm365/0y/dGgEhROOM0qTGPh+MRtNyXQ/OH1qMO8K+QGt34x659pb8mGSWIJFkwuCCrYeVDb1x7v0mLgmIAgRWbyuHqqPiW76vYpBT24p+iOUUYRPt86O/8kY3HldNzG+dha3pSGNBTXIU/v1C1mt3SOID2FH+vFa7gArWF155/zQMl/a1oarcd9O7aGZKZkw3uWnyZdV5o9hrd61LFpr8CummogRdvHPl6/ScFITE1LBwqQVeergaDFztWC00TVnsqegVhR9lAkAkr+8uyWrmwZ39U9BKdPf7cic8NW9HkE3Pc2rOcG3KjXksHN71XkYim3qDHR1mVe+UGMEqFA5CLzlGgBNXanBFLvN0keu5SoFU6OevBRAm5gAeaWdSe/jmwz5HQSUFMurK45nk7uI+FjhcKPjioFUARdV1HA9dB6CWl6XR8KVZIlsJW5ojxDxcAF3xdC8/BPGduKtWQVl6h1hb4vkFizsWV2IOnc2M/jlgMn4w308qsSFslIR3CxOWps5edsHG0H3y4vbHnvijD/bejP7w8ekhd+H0wdTOvxsfp3sDq05oS2TU5JvmSE6N0FdARwByAAxMCklZnqEj6DRAiCZaSFKH1uLWruGFuAqFg2iUhOLtvqTGx5rBUS+IdOhGMwDoQBZ582nJ9kTndST7nHL6tnryiAQKtr1yan4kmluurnnzODg7RSEDuSNfQ4aCStD6uPfHI1ZA/DxWMDAbP+s2yx8+LLqD0080gaYOjDVRivFhtZrenecECPhiRRVAd+a1C9BjP9MkBAG6LxKm/t0vFteUWIyzOkxTcNUOJUSNHteRd6WmhoGhN5lSR7+8fLGkkUKzOZwGM8DyN3/isY1AHIWzwoXxTqrJVvHx+o4IMuXltXkg3/tb/hmRC3bEUNkIeNffDSNhUbMcdjsT5qYCVXr33CgeQgnycQHu/77fSoYL2faUND1gRZqDnTc+3xLzcQmOqZlSsak4BDCsQNypsALRewvdXh/GjtUdcaBKcAvhOqe++CTwzzHtiX0a5PPCmw10zQUPqHNwNm/K5xazlbmdmQkzUrRSFdnZW8bFVPe9tVYrdzgRGC8y0ueg5VoHlCOPnhanVxfr7fNbXUSc1t5hlqI6mJfT37zrVztivcg9e9YaFcFygeJhr0FI5nx/Yoj2049nwlPAtMD6NC8ZGCocGI/TFefeqQHU3tSmez/Pxwf3QP7W939/bh5ztgYzP37n6c9JhIlkUd0WCuD5PsFwXZ6wutJJ7z8VZnYudo797dlCYytdRu8FQ5NfTM10awnWNraTdHF+1S93NsVjQlDwd6b6kD3naS6GaZaoqitL2z6/pALF010+b4h0uoMMqeOQgGuZnFW6ReCUtSni/Cy7/Llvj1bsep2vfQOQrS8TguXL4Tl8Xg/FWmnhmUY8sMYFd29qM3j5aAUdz5mItDgCqzbFDIVUAdxB4di8I3FyMRtvTIWA8KrQKd29pKLSHrRd/eKg326kff21R1EkRo1qhYvSy22uhvbumK27DtKh1oMrlbJz7B/gf9HhAQJAxm//AZxpaZ520eEUy7OHPvGM4gV3nJFYHHxHn6yJ2hM5x+zPfxFww+USh14fhEW3w89/ZjLJoI3FJItSsrxPKGpns3LcQBe0UmH8H6+cPfErP50OIVXd7wl3xcS4zlkKgC+E/WX94uES9/c6pwHgo3MOaJgYmpJlsHQw5mzUuo4DxflCPXw+/+ayPBxfPykq8FESXSOg9ihEqMxttAc76DQel2gR/IU3R/d/eyxRVNS9Vm9Lm70VtbhQod63V1b557x4bdWgXneH7QYe6JwP8xdPPcchKwzgRCSSBkSLOCecIAyJpJPI47OeNDGdBwB0tzqSVJP3810ooLuzNzXIVhFJxkQp89YlP4r6DuIK9VQAnBvr3Z6uuDzGBNgR2g2EGxo/pJDDCJhAXj79AUwWxkBMkM/390+mXAcXTF5nC7uKetZTY26kzb9IBO8vwXDAmQBNSlOrT8eEkAS5z/0WjOIiC8aPflUufyb3r1fnq69KYnTDvTdMo6r7MPW8azDnY6+WNGdFUUS8qVdJO3Meg4cnGM1jfB1bS0ntcW356cfPL2ce1tNdScUdQcRrla3CS13hR4+8fsk++8C3Fxs++p7Zne12ub2vdEVQ3LOHnXmDPobNIKkH6WZuRjPC07LydJ+h7SABg9jMOD1/Hl9oWmDKPkccYk1CTEiqamKSIUwJBZanZbO1JJWsu5wqvXCcM/lu6txSjkOdGLMVRvpMJZLEfEc1WIZIZm7s/GpXySEchHY41CTYNYe+t44HJ1gQ0uV2mcK7Bw+XBs/psvrtkr5ycAuHuP7oBQ6wrrnauuRsa5PQZJasqpoCg1E2cGpQ882bYssPlW9++bPvu3bFrkw+1nuou4RSUQgY1aZ/833QYFFWV3TdzTgEcI2sGGPgwpAg3swFlOQQKkhgYOrtxuljFmk4VPWt6dXn/4D9C8utIN4OIoCPTu29D2DaFRF2lr/8QatQONFekuZcNduVRgpV2HE1DrUdPIHuWDws0S89TTXPChdIqJx/9Xd1SxLcU9ZtUi+zlps+FcWMaocJpRmQcYYgUyNEBJSzqMfVxJJq3m373j5rvCtMWZWJBTDcponVAkpoRFQUIA1UKVgafP+8F0HWWFBXAuz+ThYOlPuKeDPLEiNZfMRfNsHXH0x/65BG9Ru8bk/ibDlEvyTVqgivcACitXvpPMXseXSyt9ZvLChSTiZUq0go4uwg841bRAwTycfJ1wY1qPzi65d7KW9Ruv0g3Up/6p999R7YBOrRquK6ZwHs1+Al5KR1zEAvQAcMgvIGYkCZxech4RkK17pLL3/xJx/+3/+a+3vwlUyEdoIOPn4FqPT2f+so8PDGKRbOr0nV4IXjIFGAfYQP1zjuPoHu2kui9hrMJpNCMFrBHRxzSqBzgP2aBguTocMYl7v0WOpDRGQuoRASXuIVpCBGYiB5W82Gfm5KtLy7ipMZxlYBQKHNTnIXxBbMoqqJThDKSl4yNJmpKuOMxW6o8VZFZBGW1/IoARbH406Rgsc8SckKKNV+kd9djeQX/dvhmLl0o11qWuyc5xATcl7mADj7urKlWxKWLWXTCgpIpAxlAIPQrLR8C15OZLauFt2pvL5sAgw1X6M2yvDN/vLT98F/fIQxxx5jXBQGkY09mpFEyCkqIb4Me1tEoho4ymfM1rUjAfD8n/o3/NefPn3x6u95+d/99+1QChyC9ZWW//Ld//b8xOLLR4Ng1ls64axO+gCutb9wxeE8QEXdYzSHxZoT3rTpazY5YIWnjjDFWsSdFU0oYBmA2/wCjOXyNFaQlFdju1jCFtFVRStJip5hRFJkSWN3FSoBQLNI42zsEKCKRBmP7oreTDkjS5JuySHOaEhOCHFDxjgaF+sR4Jg22tdUlUSRpwBJnETy9rOAVicMgAsyOSDe+2yMaC76GRrIqyLLLzfNgHbpfb2/SbVGD7f1MuWhJUG0xUy0REnXUWpue75ZK00xXvyuEiotXgMYSvxBDtLxvFf8hXf7GmwAj9UjO2uKMSpZSwPn3diZisxEguySJIe2ScexKNZt3Obz6b/574f9Dn73o//4f++DidCeKyK+kv36P8t+sVqg/dlxWFI7LRXyfQDLHaV2YIIOJVXA4bwde4lhhqSZA2zHeTIQoAMaNqex5v4EOsyMkJrbjTtu3WWxogKijpYxzVKeR0LKKUQqY6SryoSibHv34LnGnWxZohJ0HFVJgLHQTu7GxsfmDMMQNiNGlCAgAIwyjXM+1RdwJ8LcG9mFcAW5AFyyeJf5LPGRlVVewtU5kaACeehIiNp3qeh4vYO13//oOz8/xtRbAl0tZ0SoAZ5IRxAykEMU+DbUofrq+VNxNbpcOfY8QiBSjXKsm7J7VBjvjYuxiLFXYCpCDVdF9rlF731pkeqKiQlv4s3VJqg4Iea4HV7PXTSM3//a7/7sX/35Lx9O0T48ri/XQood/yFu+5HhipE/fjKfVbufZa9YrmHZQU8kAo3Ut2OC4lDV4bxdi8nBSs/cSMg3YG2AKTskyEN+QC0LpLuZGfzpZcJ6jIkqFUNdpTwKgwSZipSzElWTkK5QGnhKvy3ufpbYDiENBbSeatjQ90PBYh6EHn2nf+h2VtNi5EWxRlTGiGFkxSAKbCAoDqpRYxLuH7uEsFGk7I7yhW1cIMI2Fo9DxCGVaqt7W+KwaMDWOO6XnXB2f+LD8TtfTN2gOtukUoEY/gyiZFyRuWhFEOCbs7raHrQqX7KmSgBg+mmr046vzsOzH3pP+mOOKVZ1HpFSZ+fLnlzOpMZRFs6oN6aOIHMEZTJG/3yz9zSBAk7L4Uc//Zn1pzcvPX38mqLRqz05NHq5C/K+Cx8Jbk3WtzYmYUxqqcgGOIBsRd0RVgF1j73Ysx3FEkappButJLAc2rkv6JJo89PJc3lgx7pKYVwuqRxhTXSRjhVDUkqkoGGmmybmWKIr9+CmVXEavSCrOEnNJzjs+wi1fSHQO+IRowMoMQ0cEI8QhBgx+6FHZSVq0wZMiGP+lMAAY4Qt4Uic8J1LBDXgi+BGwQ2Aapdn/dxyijxGOrBKhU/FuXKnF51uUj7c4ebpZzLLnBQtJuGgLgRCpqRGhYrqrL2vaiTDK90abSCep9nvlJfGUy0iUupT+uci+NCevPeUDdSoCgaVhjQarKTSoISAXR+VjWRCuSF9oKhQMCSBNYd82JiNczsf8PG538/3H//mL39MUUOcR79xhXlHkMJ2/g8W1fBUfetosg0Amt5LaRQjRAMMzBjuB7butfeaiQhBEjYM40ZtyV2CGoJNzwmaaWre2wz47ZEoTsymPEYEj0ygETHNRAoSNdR1OT+Z9Zo3g3uTKA2FQuSzAFzX63U6sixb74zvLnUEV1mgUCCMKUBZBIqVzRrS4lXBvaiWmA3KCioQKjSO1N13ioURpOU2Eq3b/ck85OiYFqhgCTvRtF94rgGNH9z/0iYPzEiuSMNCuQUrXLoAXuP9ytvIK4CVt35dHy/vhtX+ayfCXQEoZTekc3+o8TgGvF+OoiiOOTbkz8764NqBNi2iAmlGzHrD3FUAyPGGoGa++fbmRhMbmrdxTvbh5226X1IUth5G5wbWqsYIP+Lzbz+jtvTpCMSNkjYsTewjGlCHov6nAf43+yx9IUp7lUEirMwgkKdxUN5feyw9i+j3uJ1px7VPoSp41/cpAJcgk0uyXBZtyhRCFCSsORWZd+DecOs4DGCg2DsKUXynTOpNZwhxMPSXEl4wczwCn7EowkSEAlfdVgy//yMAHCOxr6EGGEUqXRAmJlK447q4G4CpI5pA2dpawmNeHfD40va8EST55T9xnRlrILvKnKrusEya2D0T9MgahbajEL+aSU/2YGaPbhfuV4tl2MktPpcBgKGW26fBdsbfk1bLcVdqV1BDa0uv6IxFRXQI+hLcSYjYFSAf8/zxNDIxTqV/yf7spvfl50+AwXXteCMMzBD2iMVSgjMTm6Ujd2xtp3k2Hac4oOhrCv+JgRx7NNsF9sazOzO18ZsTOW3pimlb+J7kFRekVLr1mwNvJpdSk4gh/FxMNDNARf/0ZEOimqlkpEQkTjI28eA9zZe24TYIRmPj2oX1nZ16IlLxH4go0+8YWI4ZAKWE5VnEMsRvm86u/Ww5jLS7qUDhisYWmbmTZNpLATXiE/IwyOBJ85RzNUP4pThWXBCRVIF48Q9bf4i5kW2KqVMWvsw9M9OUBiYzCOZmU9S48Kv/p8Yyns7yISHKs3tdJPSID8UIsE9bwiTA++gElly4kkhIhthOvE5YGFisAN3cAAJUeQ7ki8M6zq6sWwCJV7Cf+PSzyw1FFae1o4UwoECjNKzQhe258NnuWFU7PrnbCfd0HVg06n/t3mMXNlMA1L1CkeCw0iQ30hyQMlSPFnYK4K5n8W+DC8HvebDDoUWuMpVTkaJo4AfVUtjjWSNfDJAsS7pCWKDe+4Q5omqc+ueOlSb8jeAdqNsp92I99CXCGItRn3IEKkq8nGp/kPuC8jHCFiRHsmZ+I/O+9yI3UIqXU29WGCzYUhOxcEVFFjWeZ8yrzzg/IIKuXv/ICLYCrKkrQU6Zxn92Y0fhxxoDkBgXLk7O2n/hje9vlvF53D5akv1ka14AEqMSXrx3/XcHozqsGacdlTDQtq56jF6tZpsio96EOFQBdLnhwmbOgVHTkrp623fYM2J6hBra6As3OHAMGAA3z6i74cUr0mSGS6Z9Ym6UwgO0cD1+4+er/8H/AuBGD6xiJaSouqinBn2m3EhAbKRthLLBleWSretw6BYrLTUklKtYILNQzuDJeWpxnjNMLhNitO89eg6pzgaUSG92Sj44as7LRD1J4gJTSsMIIPJ9oL5ESP/ph0fUTNsJ/k5OjDniQqSvDOTNqhVVgWWQkcdpPZuRaSapxaLCNjojFIiN9uVnm4Hh3t3jcuoKKGFUKNkRVCZqOpI7rI+Zu0Rp8ARg2I64OaqxuvzFWsqfxR/rcPQakbTj+zaXQO8pxz5CBWo3GQFUybaXoUzJKhOkF7Zo7kTD0d1CaA6NaVRb4fuO+58+nYDp9gtRVHVbOzJQeyDEgAaAyc6KugtHcvVQRCbc8sfnsiKtc9hTQB2wxgd+e1b4/zLcoeP/ys1K5pqiyaBMZJK6GDQt1wTonuoDWXAoa8Ltl6PP5kFLGhiSwJCR3AEvHYE7y6aCQVMqAtvmTOEQ5MzkeC1TjqyZhG7XA2/fdyghHnpGJ/nMw0AQowIgihMaR54tI9u/8Lsi8Hd/c1dOEarCDgxIQXIK3JbmRq2SBdJEu79Ro1paylPLfsGNMSwMfABzjlXm9SYvC0EglRGZUBggUSlg7oP4JQrX1NJsE4BaICPl4QTd2LmNOfa/d/drzk2iWzPjfHAbiX28R+I9Zuu1DKDGKw33CMAXW8rCbuFsMejji7RnBUDLYTFHVHCUpVFKkQvk6PJnH1xNY+3CDywVeBBKry1oPbnklQaRGUFGOCSOLi0XEflBBOIAAXz47/+nTxpbQfcULr+zY20Z53CeNZ8mNzZASWw4Ryw10Yp+7ly9y5XMEnNc/GbVTIXF1oSlKIIgrtGKWZ4tREYSzj/UMXh3E8n3ngiy4JSrAGW67kvmEAFAlLiQhSTZo16eWVwIu5SGecOnRCIIJVw1SBT3jx99vgX7N86gOEZWQzoUgm6G+JRybfVe3Rbl2QIGl9rdqcH6lKl1r94wQGvAEB/Ct206GPB+yROzi55yGQRPJpgWkBiA9mCvGKmCEoMBqaxqwed1CElufefhR1WnbERjDQAxIjEFSs0B3oNGsaqqKq3GBOuyPI9ijFrAkpgZCQER8aaOJLOpRsRkWCiEBUCRVbiru2IesH4VZf6H/y5RQ+w2gELxxIVubua6rGY9yVa0vuTs6EV/q7ZwMOX/zMGvX0IsKMF8iQN79x0blSKTViHsS6Omp13KxHfnbmOFRORFdp5tejpJihpZp/pKlgM29STxQWKWaG+uyNXq2NhhuFWhdTtY9Td2xHbeHPEsRqdM7TEAIPIeY2qGtjUXy1JMaQSEiWS+zHhIJenl4f4wgwDFPQE15swQ4IyviIIjvFVwMo8wA+AuF6FcC+Vufu0EUO+Vr9vuWtPR+AAoLi9uXlnixjMzRaTQcIbEPfm4b4KCoCjZulHNiuaI+PT55aqlh8mJxfUYYGJnpMwRDfketOFRNApKbIp8QHO3haRdYEWk6/IC7xUMumyWv9sHDc1SwTK1/gKxBbi/sbvLi8fmRXz6NP7C7xdtRo2GHqwXto2S9fDqnbzaY0SlXmjuTCNeGFKse+Hf/r0eoKkLeH736Y7J5G6DRIpQJiVCAqe7cgvjAnK7gEkaCfe59TY9HA7zwTUnyIBRYWRkJjJUBldBoZEjIMXJYhFGQ+8NkY00au+Oa53E8iEaliOR7Z0cAGhDbXsatqdm84QPKFFCziSWP+IyFoTh5zff/vTpXoyvEJRMcZPtL9Kx77nqeYY0fGnGbIIyx+zglQwQC4XeHytBWM+1Xzj3rrubJ59JoVgBaqVs/Xh+sBzFe5T4ysQuKleUKPZjyfXXI5f3f/m9Wv8NGGq7Eaa/l/1nVxoAdqXSwX7lHLul93FMYl9C/kpDRYqKs5pzTozg+U//yQtsj/D2Hj/87SeP1aXz3P/cj6l9TQaACjdv54RKGm6e75QioJmmqRZuLwIS+6v/i3/w4T3p58n38Gf+xh5hxgaYEZEQApKYkTIoR7ikpFrKdv2KZiDagdGWDz/KpxZTJrMy50yPNdVUdUXVCyhXmc+TCO23LN2rmaFYY/HAlVTZNZyOm4x4PeIcwLCIK5edydiVPc5IUBwPYwnUi69pAjzfmYJPd+QUv1JVfLWGGDX3ewfWNaeLFphjtR0ilviqwpbjKsP7pQnlKTlf0tf5/MkMKVapdyopv79YOBPQDu0VclJVLZjKwtpYGefQz1zh/n2us+qN6pzSYsV73v91p11NOYQ1FsBNFlVFaFnTMFbxBbDUkwQBAc7VinFBUYT9k/+JJK5E5OaDvzuJSV43v3l1+cEvAQqVfs89/ZGNlptrFCEOIxENynJx0y0ar7//QK7y3z0O47guzObrt//GjqnVxSJjh5RyLWSpFRueQ5AdQoOGu1JmNMoghbc8PXl2uH063vboDBImUxirEglDhgGp4UItjJL9Oln7XqWKlC0k1UxjCZXkiPj72TIAD9oby81a8PoSkfoOJ5LmrsnAGABjUYwYPd6/vNUtxFHYfSlVLah80xClQvCW7wI5OOCRbN2ugGlIGGrY9J4pOTebeTkjwyKnyDUlBAWZUnLEpJSGKPCa5AiQOFaFY0QcU1odQbVzS2u5o9oOQEC3lJbxHnUsNABoEFZ79qCKxubABhCvWdyAOFCzQOGALDR87YNA1oVdle4hFKBpIeyLp+JnH4h78Wr2i+/9re9V94TBleoTUt1sv6S/cOqVTvFYV9INHfRqC4LRrQ06MPxdV8i0TiLAsmvwThvIgDk1rU3QRiSSabKGq+LaklhEJSQ1TWnGBuETm496EDiRKiGFQAMlFKk41mmjt76p4MQcTfZeZkxWGy9WqZvrdlkkjcQnPRPKM9dfhRnWDLdCGclIJZgrmfRCkkRsfhndn4NDiKiKUCC0q6y/aAyPyLewgrFfVob52RJqaL72OQr9PluhVqXU+6bkqNBlNfTVCFywJnuLbQABhSsys4r3CG5FEURFQztWPJf2EIdL+gAii/205e+Zu/dAFTokW1qEYfbNsEuyh91Dcc5aHKWKXLjcI6oAiICevRr+SrZ2UCZ89tFntzXIV4QKNaQl+bdON21qhkBrccQnrIE/0UnrRfuZxg7UY7kx8M57CLDX9G0xdzMqZmNqmGlA27Jw9aY3dhnazEmYM+GXNS6nOcxn41I5I6gOgQuSplcrrNVQiKbmpFg6LOnSLilExyrT4r5Dh6hDAkmhAAB/hBLJaJdVFABKEgoUqM+YxhgNOET9cPtqThuUpMasEIeeHBUTX8bGHNQc4I0CBcGwRHcTb+7Pt1TZQxV0j1UbwXunYTpc0MOye6yUNK1QT0+k6D2SSAASVWO0y00A6EhhkGmuxkQNICTAJ+9+HGCo9dJ+p5vxPWwqwmBHq2oJVFV7QzTk13eeUQQAb+bCDTG1lQnzheYFokYIgUNseroPGlTS5Qv7O//gXo7veKclkH/4FnftcuA1vayUI27W2iyGIq03pXFHRHWQokoSgHe/vmsryT33zcTU5UvLjarSxtWWfH/WiEw7HOnz86frwQ/Kzz47mJHP8jQRRSsY5GhcVVhQHSfypETCOIsOCaHjuqaiCE/D3fpOxNPnoajNtykAfP9j5IY1WI4dNQCAGBiwKKJ2TGPGIhYXzuLhauaIKDky9MzP8tAYyHcVrODKxuzSigPaAKQhp8ANWsOVKL5fNkG++kL4wkWpxNqhVEYiqLWDvZsoDajXqcnGgNceH1+6+k65uoW8vH3vtHci7flwCw63EXrv2SZiSBJViEFbvSagoHTdiqixy1n6JFFBb24DElrdy3NyDEutojZxwICjKgFuPr/7ANiLz1OcP/xFydUhauKAJSZ6E4NvzxU/8FwSqqpp9cxWTl+yRnVRe85rTqjxIADw6z+EvZYPp3YlZI0TRSWd2MZNGmxZDznwONlDHm5tboe+rKfqpKTmiMtmsMwNq6lyjfAilxNDT/rWIVmCbWejHgkhdG4WkbDbAK01JbcZlguTUuoZzcM7X4jMYzo2YqQRRggjeRA8YCyK/AtxWGefAA4xpsr4GGErnhpwkeF7pu6G5BmmZZqWhzzh+EhEAcWf982irTlHNwomLUmgUyFI6iatH813JukxxAhKgCmHfoKYTg+269YsBN+vAf/UcwijEZGhVEum2/I9aGuRZUy1HUkVdN8G2DOGPgoCZHzRutuZhIUGjzk1HATyBeMFqvbIBdbxVfjO54WA1T5ot8dfomBUWUYGQHCrTHLzz9HjmcmeR2ioeXQMdtCIpNgRVPHjN9c8fuP459/6T/1f/6VdW7nzEuqrlmzdCNDMUibk9a4qq1V75wQyj8cVdr40eF8nXn6WUVtGxqSsm8uwLkGDgoxlwgFhZMzC4cAHpWx4W7tJ1gy4arBGYENljXt2OKzMLjwYlacePBMnMjAEqiRxxmJH4CSMo/AlntyvTw5DbHZ01DZeCbhNDY/EGE6erenHzGhmqyasePrwRTz9vH10pbSpyvze+tHN7CItx47sYPfoCmSk0jO4nnRmci/ruJt0qLEswa8PoYZmOzqXb8JVk377dSs38wIBDOUt2r/R3qvuCoiv/ubf/PeJUt3KIN3qgBYFLoI1Fplu7MHVVIxA1mBOqu1I3kCtQKrjxyfLy42XI6C++3MVD0ZKYmTw5tcbk6HwZ8ZptR1L9o4aFT+0M6R3yB0He2nGf+mffHj67/vm/3lo6wusN4c3jxBpxlYO1cY862eNfWfpFl/i4WwmMLjawY/+qrWbdD1UnDZnNM2RYm6a6tjsTF9QqYQPCUVQJVWhSWjUZk1PZ2o+C5Df9nRlmGqvTY24PqdKhAissyhJeoDkyA/CdnQbl7720zzVQF7TsoZL55ehMcY5JA05iRZ4VXiB6p1zxuf2wWf+0efTt06fDHEHq2MaiPVeKjopLNbp3tbFkbkysQ1kCl3pL++bIOF6fHDIOYpxFWBxsTQxb46ejE82V28Urx3voBEthQQaaob3on3XVKGWf/hP//f4V36THo7fu6xVry6Nqiq2y9hhVCFjEF86jwuK33AOxulQ1JB5zbphQShZWvbQ6MJ8wS6JMEi02e7xH3vuzaoEg6WbCz/tvTUVIXNdT3syrHCwf/Lg8Phf+Hetq7/rX2xyGdRi8uaTIUAaiUSzKUWgmbTcGWDKDjct3HMK3BzD6pFmfeCCJcmWo4KMJTVSSo4bM+vw5EsyP4MCSi/1CqRQMcoqgHu0sKzrmytDwl6/HHQ85TInqhRHPgBjKiGERKHLWJe1vhh1UyQVoevK+gtDcxynBkyPYBldCUGsZhIjI74TuvnsfHny3b/2in/j6fPLX0ZJpD3SkgbvoRvutrcv2BSreiYRVBJCqJxjlih0j0k5YsoE2p29/slb1UGx/rj6+fT3D/7UgcL7/psxi4YbR6B257hIRfnedHw9jlWhn/21fyX0ez+clAc/zfOLEh85AgAqOAfMxgUA2Fe49xPZWPNwakPeoNUOYcWsmUntQo4sqGwbxQB1BHmfuObV/ckKdryrM1MdMI3GSLmAQ8affL97l59PHn7naI/ZL5gSlJgkLEVIcneeTizH8y6fWTXKZDybpge+mLJHfFDGk6LF9J7fJZZmZ2QV4YhkC1aGaYeHyaBTKoGPW42clZtUKfjWsm32++ZCmh5k2r3NHaB6BMD52wAwhJCsYxJfmjz70/aLduMAqH1NxQ3yKwM4zx9xurthuQZIEy0zXvnpHk+Prx/815Znf/WTJ/MHf/UHz6l12nVIfP90BUg6nV5lpDLjIfrK6dkrRIroPbESSmdLAbvhUSUim/F68P1v4sLkox+dreb1HyASilP/9iMCAqeKBAASpcvBEUDivWvvzpW+1Os7/wfwr30++90PPnliP1xRW7+XUQEdCySwUUQA93uuXkeMW2oR89BcsSyhVQE0cFEUqNGFneljgBy4CpF/Cb+/w2j5WHXtmvzwusHNYmOEWsAdjtB+cmBo8jb8+f/rjqEvtD28uXGDhLlggLY9AtkuYe8XrpcpbNu5+fHUnhp1W1R1IgyE1GJsKoz5GpJCSctPx7p0iPJFdiNVZUwS8hSAQcHe1pdmx7wipGheT1yDPB1u6EjFWg0YYJrIAksESBLOF0Tcfvby2zG1QwnW/Yl780I3J/Pw8DEPSRNpRBaFlxVLCA02ra/POExxWF4e5p/++m88/X/8C8+npx/+lW/9QPjxDyBCfE+NbfuUziZ1XBRtDdMrZiTUKYRA4dS955BrV4LfMQDlR7fW84s3fhD+4OxPtSMIT81M5T99LKd1+hNpqR/uO/AetwPaEVW//ZsffPdvPmy33VO9eA9c97xQQFs7RVEg0FebzpjDEpMUd4diahsfWLWrw85Uo5FiYHLqVmapNANQYbTz9OCNyRy0QjEqmB0bfvZOCgb/zAfLfFO7zW1IJIlE0YdQtKYtzRBxR76MhUpLPnzecafFptS50wXQUUSAKFgvKywUskZJtNOK1UOEZMiusJx20sUAkE8YiWZ60Tik4NWKJsfsBrdMgFJmMREEZR8MEQcCqsUDgVUtEnDgCXC++7jqB9xPjql5Hm+SQUbD6T3eqa6KwryZ1/vXU6hNDy//LPnyL/yT/2/7/Y/+LT/7q38O3/8p+Ls/uf9Xvb9WacEhIK1I+R2xJlchE0IkwMAl1hF0L7clZcsQUdjl19fFk+PD4urJryEUd18if/6/f/lnULHR//aPgUBiuMneyxYpoir0N374H/1v1I/yn7t1v4pBx+WTswt7Tc4gEYAgvipDJLl8mZfGlO49oCpwnWV01QXqikME6F5WjszPbWlGR+7T/O3CU7cK62KU3P/hH/3g6NYf1fTnfut3Xr+7GW0+Dm/fzOZRw92GgUbbM1pBI91xjKlIasi7hXxy5GQ8CdiNSlFfwXyLGEUW5ywCmJAckmMJ7Yt9D9PFKBayki6cfEqFnEtKVUrUdBwMiA0KadwctIIklF/PIITiZUFFFEc0ouzsWtgPLn84pS/3hxf3+QTpX5rQxM8/ymO+xbKKI+Nms2DTkGA8n183nvH6Yqf4gxt8/pd+7e/+G373J7//2eQfXH78J/Wj7/X/xd/nN/P7yCSJkveMlq4OJbCiQ9EiskBJYFJXiYVZ0ZbbEeUOjlZJHvVfuwUgAOru8vsnVyFb8D58Y0QtvpdNOwh/5c/j//n3f+ev/+vsO7/6jcOz+XhRxdvzt4xEUoWOLQLAvuJH/FR3MU5WLH3c/e6zj45XZhVxhxDamYoKiCrFhvSXr5+e0U59VMp3xOpc66WT/pnFf1B7bJTcf+bP/u7l9gE8+O3Z02/2XYHFf/f/eRNdqoeq/q2ZUklDmoX6WTyzsO+w1jdWI5F5YdfcT1M/aWaiH8/7QihSQSlYQ29zapYe6LAf2XuaL0wVStHMkCH3fAEdFjTTvRAsZrqqmjEQwlrbN4woYk5dUIYRdaIIPKe1aNFet/nh5uHw8IPfxfRhpHnoQp+3X/nt5gOiR1kLWweybZzM9sn6HRyYN3fr+vuH9cn5n/7h7c1nf/+3Dr/7+f/z8Gf+T/+Ww+XFv/h3vyvgn/tL7x+DUpnySQoLNiAiFaFEppIppaCd6hiB0Wq0xrvFVqsaYLQ9PfjG14vBSjzpTEx9w0nlNoc9wUjAxv/52Zf/yfNyZfGff/CR91Lj/gbgn/sr+Ed/kd//q7eOShp9LP3tW4uxLYInk4GRYkYaLL1VBjZJzAnIssaazaPl0197+TdwU30fsNZGDRjUFW2oEfwf6w+6f8La+F0jOIPeWM4/U7v0c9KT+t/+1yPkHj2BNz5ZzG///25P1ttj84/+Z/EnNxwBgGqBgAn1vRnVKObkIjC75wilSCvIyjg+rK/zwO9NRqksRZbaU5GSUbCeEOpJAFIIihRxdEhyxQMDOKOCRh2ABBAYTvN6X+pJw8I0FOJiDjIQqSxyyjTBiEdR4gH12dJv+9nzYv1m6Tf3h3zxeXzn836bVHuyxnJyzDmOw/ololCqWYsUiBDKK+GSesPNs7M/efiDX3w8//6Hv/Mv/p/803/h7/3p9z77k8f/2u/9i//S67/xmx8Bw/af/+MPJCRlWWxqaOa+yrbXjGVNWXRsm3SVFwEwgnPb+YltP0V99FvhEHYcVGmtfPL2fkJZ/t+U/vjJ/3LyoT/xT3rvpdNv73b/ryZVFa2Pp3EB+uEnn7QtxyZl6PooWV9Z2GRvXAFy266xkmhYANxQsjJCXkz2ZOzNEQEEQ0rRsJghCcMqZv6/v7g61XhJWgwv1QYZvTBtTixkOne8P7Z/WPiqz/n/eNY/T3++Gf8//9rfKVfuG+vH/+F/7mVakqwpyTM+QomashmDIyV3okUfhQ10kAYua1NvT/XsIkxJoxt5y/ckDUU9S5MhwgA5JaCGQxSx3ab3ngZAVhiqJO343a2GK6DR0dQJ5smwAQEA/NHzTJW/VZiJcy1MJwWAyWgMZJO9/tRnPfLiYt5N7f6MJxPuX3yyTnro0sP69eefz1OyZVzcRqW/8Z0kbdIQF5pbIHF4+uT5i9v24jd+/fnxRz/6pw+f/0vm3/4Nb//6w+k7P1f//G9+m7gYOIDewLr40gk+Y5m590WHpV2aSZ0tgiaxrtRushrWOM6LppPj53HwQw3H7/zvAUC6nG6hjTtDvIiffvLSFXjuL/6rzKfeO6430mvpdBrWMSQEH49mU7yKNi4P5+v1ats2GQZLEV+RSUYyoQjwukGjejtiwNKly/01v9/cpQQBAnRAAI3kpc+e3r75VpbgaXQ11Bbn+Wtjz7iV8vF295eud/ic//f+6r//5/U7f++v/F/efucfmkr/en37X8YXS76AGENvb0jgqcGYGjCkEXdiL3ZZZASJCR0X2Hp5CI1CUoz9ohslIHOjVQAt5gCS0MHL9iTDnyxLQ/C7z3qIBQAQqkR1Y6ZYnbKQH+lUyuuyCzOgA1wsZnrktp8crnpX5+nRFXMC4NQrJAY+QDCbgH53yEsyD/bTy7PeL/mg++y/+8OX29ebb6ApZ6HARoBjiok0qlmjmU83T5999O3D4aM//Z3vfYjb7/3lv/z0W39p+YMPbx5+cPr959M/8b/4x2ZHAO8VxZdHVdx7L6HjasOL6zKDELtc3DYWE7XPm5cV5gCnZ+tPJ3wygTj+xt/+LYDaxyGlcOZoGrorzf3Sn/4IwHTvBz8Gf/XnH3ivwX/zNSKhYTn+wuJlBRAfPi+n+bJt3QGxG17sJuljj4RkT0ZmstijaVH8pd++EK42VnbC0ObyHu8gvYdVwHQwRo98deuk4iHZ7reDcnHW/JJFTmW/faeAQ8KDp6+++d2P/r+zaGD0O+Ml/NqzuLqZ6i0CBx5j6DSShcC9flANem9LxZE0HGZazs7b2U4H4agKq3oOKm3YqlkIbi4IeUisknpvwBwVM77LvIBy1QzCluxCCABGbtFCYLDjaUnNL385xoNvfff5crvFev3uMkBuU0o5974NfH1Mhwshs979geHTg50ReLjLvpznV0/rnGd6Pcop0QZtiAM5BmejlKlPN9PxcPP8Zj59/8/9xqdfnD44xHTW8YPlb/zW8/lH/8A/cnRRg9cz7P7GHQuKX3Qo4PA8RR0wqGrnqzD1nk0GSOkSbJBeo8ipaLbcrb5h+NNnnG4L0Uf/4rP+anX/S5qz3/+pFz4f/83pzeT1v/BvkkszH3hvgWyLG9dLw+B6ROMFIC/VrNddc3R/ZJyiAiEgvhpXEqwegNo3XeN79epzO37X6nVhZV3xm1ttLc0BDNpHw8Slj9/Qzfb20cEdQzM8x/fjG4UTu/aDJ/rilpub9azf+Oi9W7+y/r0fwA9P+uV0ufruI0V4uQHye/M4TuRwzYCDJ9wqgdQGBNZiM7w4eUiydpiwmkooUIKNWNW29FyUQZ1+DqWJk/7UPU4W3oOtxCYFw9paZXsq8pOsv7Gh7elJdW/PFI9P7qeqbaVcdf3KZ/UZIGef+m7SZIz89uv1ch/AJTKxpvHO7nXGVzM5Yy4Wiyl5aqNovjNvmsDpS5tulOmY53aaZ58xnb7T/OTL8w9ujO1bA3QNMB3Ny+pt63/npx/+DZj/csDol89nQF/QAUDYubcYaH16esBnD+35zwAzBkRaB6/kLEGmn265jkCXOhOvT44bc0MB/dyzvf+WDiz/gS+8cuWbX3r6P1YW/w38s0EF/qD4b6y/N/neACCr9viHj+5XhwBYPXjzjftsxgVDFDbI9oWfv9ibWcx6Fenuzj1vrlN25a4va40tv2PHGy27zsl6UxuyAvazYLSKZze2k+4D/d6ASoOqIbGLzJzLdydZblyPz8yhmYnizx/hrWeoqHiPHo6bLs1AAW8ofRdIE26nBhoaFKwgrtoXUc8fnsRaTDQF1Pyua9TNdI6u9qp+bXJjYzorb4ExfNmgkcOTNmTbgbhSGGtLdro/9l8NJwBAA3jvX3n+H6of/7j77dH1NTu/8UAGwGefrs9zT3ZAfi+7+HqKl6/J6YLXaq87sPw8p+1T/tFptiXWUZUHC4DRTCn4zbSouTU2tnQKZk9uzG+MBpKPEM88eOftX3OrvzVZAMDhcf4bk/qD9Wzv9uPvFhQV4bo3kFL3C/IiLnd+upy9acOauvaLh7R5mryf17Na9cBaJXKOkvfobzT9H1ze09H/+iuXOlfhH/3cZ6c9U3nZ+/T4WrzwL/7pewGAAEkaIEDDoB1GF2fMk/sP5gaTTVTVRunFxDcfE0oSCsFsB07X8d5qbIOiWZmwsWuDv9br7HT1digD2jeifYWMvbKsPq1+nZ3b0hPftfBj0ytCP2ErU19t/vnpSs5YExwQdEBUuVjHy9/6R38A8LINznOYi7ismYoDY10ouwGQteQIuACbuc6HO1+bjmG8BRqN45oZ36pCZosWhwRbxqGBKQwim2b03JqfEqK30S0GAKZzKfN34rPlkz+40qy2SIVjThmu9wDAvEHywSNeWgZv/b7dxMPD7bTm8qr1lcdk2rJvWTFQ07MIFgYHub0iIcSymKxNMFETmo5Po7kZaeTjTBBgc/HGr35aryoAPplD8+AtZ5rBsej1B7P20int8I8w7L148+d4fbxruuRECZfjNTQSmYZFzUjotQNjdAQCQMA23IA/6w5+LvOvAf7Lz/6L3zn7Ux+E87989qOfUL77we8DvvwHpd/t/9z2wo898y4HwXAu7SsgnX5yWWAg6ClQYvCdD0o3WjrpsvNbiD3trUkDKEnkY73eaIRGHumWqiIfpLDv927f8Qu+CnAAoWi0hsVvFE99Y/71R9thn+DNyKq87zj60k3l+EYJl0am0/Al5Y1TOePfrr6LQ31uYNPt680TCSscAvw2nD9N4HWKWNRdwTQza64MNmPTcvOtw4/iS8e2SxuzhVjrNcogNYvwwNXu3JBqg93jxaQ7aMbKwFOzcqlwYmzozww4OraHrkf7zqPfb+KfuuU1tpvNxucCsMyFSTkAoPjilziFMEHnPt3poT9blhdn6WGOFaHpeU61udoPszrDJ6x+gKBIl+gNsHwKWmtWRgx8bEoVBwMKFQCAA5hec2mXAThOa+OXy1PQzx9CFBX1BTx2zqs5i6lN52i5JpxiXhFNyC5Ls8y+GJ2r4c4L0t9dBQgAMSGuwOCDl61/Bd+CX2y++hu/fe6n/8MntL/5wyB/8MoDgBfl+pXzz68cK8C7nREaRvv6sML0+mtno/4Xz/v18/OrDnIbBRT2+2kBUZ8eMh0dVihQNz2C1Yx1RSPUFwoYEkjEbkHHt3GhpQAAOkBgaISIB8Ixev4/aZmW35dzIpaEPYM2J7tXrJJcHfWzEoaLCn/wsZ7/K98/OlXAm1gSj2Oe54SpicHIcmbDUzUxiABA3So63Edphw3UCYXmY3h7fV82wpkdLLcxyTjuKYq6As13Xz8Lw+UV3FNa3MG4iYM4ogAVOaWDspO6fiEGiDa6+PH5U4S/82QUak5nHoMytNk5A5wx680apC6HiBTIC+5dWD+d2gq/BHIaDZ0+bdWZuYorEdnGzXYikZOmSZM45cHCJq9mhe8t6h2vHt/rjAa5QzoqDljATq8wIAzHsKTYAcEeR25+frifcBcH+FxQjh8fhvO7+M1rZF50/+UDAOjxiW/+hZ/9w5/467+ws1c78J3V/7ZEjyz+FpQvvssZzp90Eg3rKedggOdnZ1qkbWNyK6nXl7ciyGEawptJQMr46HkqDiIBWl7zqVWy5IxOgl5Gbq066OqGeRCHRuq+M12Wd7TijmtDJB2vkla95ZfwsSgJT46SqTCoauZ9Ouve+nf9P685403EGhzgebudc0a5hXtReTZ1UgVNxDJr443zhnMT6PTeb04PRA+2Z+YGaDMT2Zq2p0hA0dotI47TQim/h8R+6IIWmEY5jtvJsCCJ1Hx7arcLbftHDz9cjM+1WW66FeJ225o25QSbFgAyQL7cqAWmxTu7eUe7Pb7UMlusXLOtnTklheWmS/zad1aO2vrSDAKTaRKsmaYPw8wAzGWsdt+dJVIBQu3ej/svh4qDQ7scsD5b4nChjAiC0r7uRnM3yKb5Kf2nr2aAoydCiL3t4jx2S9F3VoNYwOf/6b/+tx/H/wz+fX3ij+EPT05/zqlMby39FsBP59/dpHMHHagxkHBk4KBctU1RI5fwUnDPdM4zk4t3I5Qa7Sq3JOsSRti0NHC0DNPHsnqIm5u3brf6u67CkE/cJtnd2NH3t6Q4XrJC1jjy4hJMRJkPbe7KSdK3Wt1yVn6sg0bMrnuovnj4nSVcXcLVwa7l+1WOmXAcb2gwNOBtHEMGTSk+LJNNqAYN82CNAmnt1JpNk+Y48jOaCyoXyAeXsw4BL7ZSV1KiyOnKlApg+2N8rdX07hkTHCiIKt2BUAvVmjxS04+Up6Ll9u2Ff/eHV5vbt3Lwj6/8vG367HMGwwBpcDy7LA8wxSTk3UK17JfJtFAZXHhOsNX9lhm/ySvfUWIyzMsCIUpbI1Vn84b0yNk9PjQ5x8e0d7F86jUkECwvoHuzZU8BffH7u/OLB/fFmqmbESKYu2lnboS3nGfitN4dgVe+41I6ikstZHnr+Qvtzi9nTv2H2+jIL/5b8QewDT/wz27nwdhpwAcHf8nZeleD9u+EUoPLA2HXo5MQT6ZL3TK/7Otkw2/LspWaagIahtTVtWDHgxBklUi6psjExKaazWoqbIto0N+uNwbNxjpffvWtW+7Gzbo+FJlI85XWN9YGD7z/X8izuv3gwksh1isbkQRKIsxFNhTVbhxg4X99+0voAP7Bf/9AnRdIwOLfD443eaAxeDu4YApTGWfQKlCslGekHU7RzTyWi+cl9iZVxVzFVo+OxW0cZwAJJBRqXdPUUt0JN1eXtkMZuvcGBwAJ8myh+g1Pli1qN90Euq2UFw/CxKPqh1+Un5x98MPOOyXIH7cRUyLtI0CUlPN1wyzl04uHYAZX2Hp2nx/EHok14OkZRg8igZKH0CpAEiMLoTJN+wZrbYan47i2dmjdhfVg9Q3ya1FP62PqXVzZuw73Il87zhOzzzPdSghICNyHJNzNHu674/Dt5/hbvzt/adrIBFC4/KurS6Un5cm80Wvd+e+h/S/+47/+M2t/Wv2+P/OfCUDtT73+q5fR+MTCxDO92Xc3Q/WzjxwSD/TjRMViXBwvSlRbZSWAl1g0jd+SYRAZaACsOFaB9kOW+DwOsIw01UC4WJEDLqlZzTgqtexeCBLgqC/mWbzhTGR29XS0Q1H9/tdutciceH3JzOcaTunIZrbdk7qK1ZES8iAf4ajunvf0tz6CysE/+Bdx13C8ScYcx8EoH4sWdhZZnXqSgmknNlYr81YKa8xqDYcfvnBKgx4VnPfyuhIEetFJu4Cqigi3i3OXy43go0/PKVC8FzwDCyCD1LiFsGwY8q4nRGsN4M6zw9+PoNhz/1t/WmJ35KfG+LYNEXzIkFCYWSEDmzoPOJ89jLnSDeIlo08rMjvh203O88Vhn9JOaIgVWcdIJaAkqJtJU1qJnaE1t+EBju+U3TgJIA4cSKDvwcg72rJTEXauNHgCbC7wcnqyHo/LQzuIEzhZMgXwatEyYrV8Tds4Tj+cfvLJ3/niUOhfu/GFnrWzvtz2bkqkjbp868IPzxx9cCn7hA8I/Zc/UW+tTv8AUaTvtT//N98DPncwLEIMozTPHADbAZ18+87t2cRZdGxuBDuS1nFc+xpxl6NkprCDNsSWZ8t9LdYoAxwTggREOJvXIsMiPWyoTqPbDwehLoLy2LymjBAtAOIv7WTUfq7+X+FE5E9tuUbIpUSOeDXxo/BRAEBC8NSZrnuAirPx4uyS7/+P/qvXbPYLQP8GOSU8PT1sNwYZusSso1RdJfPWXXZq3houy+w1lJ3YLuQlWu9kJxqjcj8rtNKO9XD5cvbMvUqV85/CYJXTktSQF6fHY0apomxB3njUS1ELw8amMaNlSgcHbdunrAA5AwPkdE2MIYP8sGwM0XI5TpcJoZjWbsHsFpanNXCY7pIWdgLE+F2CpkLkiUSINGPOmJpaaznFE9LJCvpOF1Kzh3akp4Zf3u1G4xAEm040ucg06C49QsDvTaZY82iwsBS3IwCIFhTPT+dFH+LGTUaHlznf+XPqaFMjE4yil3i9blOHwxHFh9///rcvr6TgsoriydMDaytmm5zDiTMnHitL350S7WT6B/LbQMifAPkrO4X+2agUdX/gPeIbEEYKEAA4PytTQg0IwBtvWLskYElfyRs5xrh2AJOmNOMOEna4ibvbVyXdUiUCukiEWbN4yCwZ8lNls5wMgnYAaDl44Om1lqyNjmvwD6Uqv75LLyRgulj66UuvLaDq2aWEN4g8SDY/BEjAhaND42D7S//T33jyEfC8/j/8xxB0n8yLngowiNvP6XkhuiABrKPwgCUTJS7rJYVsNvHJIR2n/YDIDbK8IzFBjUE+pW9I83zodQczR+8V9Bc/HgjCEywrCGBaSkp6ZizE50wzrcwjhn3O3bIwH59vbQhp06bEqfUAJmfEwQm9kZN1+OpYPKJLCiC1Sh067TkRs7Pa6fHa94JClgg5U2lwGlyczGVt46QR/eQcOPm1KSa3EG1fOjIxm+lu3ylZzorSe6QuFesN0AtV0X6U3mrvXT3rWz1nc6hG22+cLGPsb03JruwI++iE4X+KJJj0Uf5rWWCkH1WAji++HDwR3ddJ4O0Mp0WPP/kh0x4b97If/PDTAhp/APBXnvpHvV/48kvcIE50aWY694Fj7/5bQAfoPQjUtv+kJAYFM3YQSgS1EQX3cvQS1kFiWwSDGd3Mdhi1iyvhUCJydjfORFtywdCsAuf9vg4g28ATjDWdxDKqi/F+v00wwPCFgLx9zBlsb3jXPVU1qzOv1yey2kNl0el508l22zxSBQFwpD4UIyoq/gt/Zv0cIJy23/RmIPY+CejuRKVgkD+BTOUkIb3ejIGEVCo/urmXLYEVaZ4pbxabRlUaIPDj6a6eKtl0dYos9CmfXkDdQXAP0BG8BgAbIiMTQ9m8dsvmSaB14wsjlDHkbw7OazNL7cVlXKlvNz7DYJ8AGAAMg3kcL0+6WzdK3sPQM5Vhyr69Oef06fMYJeG5YixiiAJtABCQgBknNUaboY6EG4iJztRsKBf5+piFsvgsJNgvFjFAZmry0tVdwlbjh/P12YcP3dG5/t53HhzfaYtPCicenUaDh7Otobu4RIP1B7kUMmaZWQVQuynAFIxTGzh+9wBMz57MzZpErfOaGbsqa2gffXTtrdWLSNqE52ABvv1Df23hrz0f69pubkams5XcaRhBIr87QfteN4CL9/oantRrowBh6+n5OhMbw0hIN1s09oIc2YwwEhVT4/gOnaR4MU7s3YCIyEEZLUDC5lyxtMgVECZBIBuu4vadYEILs0KkQhMCoPKBscfzgzAJPXb8uKWe+B+1gtFkmw9JgbURQ/WZm59XTwtlH1P+yk/PIgD40/dWJ/8AIOgezTsACoEN4tqs0fFUy+hjQLLCCmPOvhJ+0BJ8kLPmdXtCs4xyh3InqPgIREpwOqBSKTc+17sTmPgepEox/IIRghDaYhq5Dhg6j0TXHYYkPSfyMB5tzgPke9m3LuecAzOoUkoMzGbWIeIydfPe3VItF0Y09PS+vZ6n5l/0Wf+CzNdeW3GlJ5Ky7GxJc4DzbK01l+nQmVO2sgL8ehWXDEa6rcZIGR4ieEa8Fp6BSbn8/cd/5ts/qt5b0qW5Fcp76Wpj3TYTj9LFrDe3Ly6+NJN1GCVBxP5K0ozqYUgAOjzfaFT3g65q5SHG7Nq31kpH8ycXxmu+eFoIeGS9dg5Idbq6aZ/JwWJF7OMQwLX85LuKAwjwLug3DZTyD4sCWvIXSN2mBkotgWHUGzaq43IQXHAEVRwYoEamoTh0Kens2CDl8pKuNKMT1CkqiWCaOWfIke15dbfVbNhbrcR1eqoY0behmrRV3E121UHuI8FOcqSbi8pHbk1ZSal/pYac1wlWpi26nyEXdofAD0f///F/60aC05CAFB2lqgQFSLsBcFQ17l+u6+XcHnrcd02XwLRZEPBFJ/QGAmoIibTwEYo3qaXcVgF4cm9yxhZQ06AMN0lpsMaJwUco0sATzWXvDHjfPg5dvwXIKUGAggGMB4CUU5ebSZKlbyCSGkMMAp2a/PwnmkQ10bi9Nn0HiCVYyq3X/Tt3aOEs4aDo2aZNjmnG0CJ8obeZMQC499qDt8a+m69PxmejX7lY9s/MUdS2elJsnucrOjAv7PCebWVKoKpYulJppHnrjEq0Z6/vJBoJZI0pQCzQzx6ZdV/6EwDr69Bo/CV3t43KyDxfqXYq+7QAbXamx3rvynuKtAgBpNFb72XaDA31o0uA5VOub1cxtznHJACw96WytbuDsIVEGgju4OgaIjLc0A6ErJesnKE/WN3uC80B1qVJXfJ1GqEwYus7vd7KVqvZ2cJoRJDZ+f90O5JlsD80wBc/9PqWdKows/yEetnshYHlNceNj/iBEAL34uu/vPUcXp/9vF2+D93/6X8KgDsybS0hsVzOaYRGzqaejnUQ3PBg5illYr27qK9N0evZZpYw3Viaqgzy4rJsjBIscOp+uyRuhJm6F6xvhwDirqNPjudwTB7kF5ZapTsrE9nhoEQuu9U76AESY4arjU85gyp7yD4HhAKueQCe7Glxoy71VJj8dGbPbKXr8//96jlB1sL4jSArTVLQttzdXYSJpiSa1AwHpnlva/Ohj/DF3vapAT04Ol1SBhjkyVstBFs/b1rFFk72opOJoPgIcpqRNOiKtY8mBxEeaLKaKZ8qiOtCXCg8LoSYmXnxix/OPDTuPQkvTdnlYnk/L1z11sn8zLu5IQTopL9pL1GTgbakYMfP+8U55fU6VbbMCbIC7FffK2yn8Z4uhVuPG/l0Ldq2K2IqBzEV2tatpZWsbOukG/iI2Ilsxja3w3IJu257t9FYv5ETw/LlzaWQetXB4MxbM9ruA68Uz0+uC6FHNOwSg1YWHj/Qe/mLxdP+/Pbw5b2t9tw60lzHemZ52hZbK9MSpThByGekDO5N05q6cDqmJWoQgDztxzMrcVRvFqbSmYuASmnJqiWPybFFG0ZNA4gAwjC5C/R7blKV7UGAtAK/IzFmTY8Q5gf1rDT5RvYQsCTOofWJE0BKkBNDypA8uGC+yiTrEyFfTamHG2QoGzBumsLnTwqrfE8UkLkFoBoDOEFKpNGI7QxI5kubJPfuBR6/6FDU/UGAQwKRggiWhiAzHKInQD7LBwHUtXWgVkXu3DX8rHKyrqm+aT3+PtQS8rdfrz6/lJLoP/I9WwAnv/2Ea2cBG/vBS0esyXflkWIE6ni1D0aWXLuK8oc/nkJhNkVRpIsYE5JkQEAEfLlEbk35eqagfSBAuxQ9myCiJYTbgYcmC3hwwzB0DcWamdcFkR4/sRnWHUIlxP3NjYaHiRBC7GmvvtnJyWG4Cp1HrjyxUl2yHrqY7/CtnE5amhoXzyzsjEotGK4T/K3/693LxgMqzg/f050FQnudRGfeacWcoSSGOwOFT1Gm2sMkw5QyIKL6bEiYQLAyjdSYDOetMuxMEUxBy6oxZ2FIQAPQVPmdUw7QBdfd8lqe9526kut/NVb9eIjAjMtxZPDQF0lTF5LPAG3OyRhgs6NFxtaQXLF6V5oa08O4wIISvzRfIqzGfO/ZDpCKUNGEIk3yWZP0panNkhNmxdEJcXBWP/CLXgUVQHdZDAlE25ucCMnigia5BZ3AK3uxsqquffwRpQPkxTSYYD/lS706WEQOdtsKL88Xj5yf2JMEj82RKYBz4RsfIbAVSfv8/MWdIpx7N37qeISHggMgQ9Js+2JDefgvpFEhlH29OisOjyh026SAhl+8XLzBgBgDpDSGdae3A/djLsVIshLXkpGsAsov6tfWPcsSXS9BJNnIml2Fy7zZGTAZHHd5p6+mvYHFK+1+I1GyTrOtFt8qqWOd9crtb0xj7GuVgXTskR0+HOxgpSgqQhPSeNuDgls/n/6Df+nlXDE90zowGRKLVG08CSPQiLQ7b7ZA7i6KLZKQtAECFjpj5Nn6EXMoDjEkP3QQZSqXZTC9vjwU2F0aipwxWwDh44WCjI4/igI0hAFb62Fm8TqoL5zv+5B9DoCIGUAQMvjBSIda2Dr51O/zqLZaiKY0mmXmDAOsWctF3jaF4AgUJ2UiFf14efrkbmLG08PdBM92SDT42nV0scLil0FFHYwPqiZI4DJZ4d6XZiBksoTp9rw2YAN8TN2qpJ5wnlBN0Mvnz8SaKiu9ep5zLIQ1VRPJSSHCa81M+vrwiEEApqCBqnAEhpmwAd5t7Kvj2RwMyq9dvEbdLVOe/crCYKF3ysu2sN7VBgsiEsCbHLNdKBww1f/RM+30BorjF/EOInKGMsNUUOTx2JhVaUOt6nJGVZkprw7KAvFAjjxf6LjdWlrzlFR0wsGdrCHNPPZKv5jIal1lJ6e60VqoTyNW4QufvQnAhRBivzw/+L/+FV7f+t84TP7NJ/rjbw0k2y5I2yCQYly2CigR7OXOKqug5ck0T/PCCafj3NsTllIsAD9643LNBIEARmlXJUUCigcd6Gx272yDeId50u3lgNWdsWJXKIZZMAc5Hk/LQ/g98eaA+5/5IsAqhOwTDlJxhgSpAR4cyhK8M00mc5mYySM6iSRL0hR5bmzXnu0A9yKktUM4ZUbH+bIRtuVhOlAknD3WW6BfbKf5pVB3zksAGqWOmUxALWzwYLirnvr6qFYUfmReFHibBKH05DN5Y9bEkiZ1HVqxhEAaT4QQyqmygGcFvHlHHrT1rn+81tjvR9C/61jV9mGTdW9fqoA+u/Dw44t731BQoFBtuvXlGlNhgrFGRfWmwofplhPCgpHKDSSSqrYzfvqhq2RVoiicCzlJeOL2cGVcX5dM3chWaaJmjFxJUosSRVLftdvX+7R/YxOjMFZLEJVmFL6aC7c/Op3vyIk7tnU87E+PLdOk9lEv4iN8+Wf/IXrjf4SK+v//L/8r/dFPYUx9iOPwrZ/vEawiukNAA5nYxJKQOwISaHL0c8R6n8AJEMRHqFufRQItGN/sThmF0coZ0xDJGJEvQelMdW7yHdZi83Q/iaV+rpJLGp4fC/v1+Q+PEGSYZ/IJXz8zXQgpuNaHpClDhpwBOCVgn7O3YJ9m2Tofu7jOkmU0j45DRJLWYdVZaYne5x3nqfEtKvU0RE8SNM7EarhM7b7N+dHNXfiCbAPtF7YOuYkCwydQ0eTRohAhcmZBIE8ffv6yiQRhyTIbU49yAVAF0FBwW++z/NxRr0MJo1mdi51lDtnh53AhwIlepMa7tN+s1uBdPejpEqAo7aC5c/vlic2rHz4jS2vOBw/bX/ztXzz/mw9/thmZ0NraWoegonDDKqkhspuCLGFjEtiJz/ASWJhxJR+GlAoqOOGgq3IjMTHSJA4yqLIqJQKCvh/zgWdlGuue7ejSdli5jGyO5aQHU7W1N76/rxbXxzqyV4TtvDz4/roYngG89ePHf/aZIsCfPj/UD38HoN58x82/8X9uXmY9ojAKrgNLXC0WU2w7qHJB0CKzqwmIvTCnIQCB4IZWLtuaADinfVMvwGjxOGi3nViqjOcAiEXfYZ6M3toLOyx2lk2zSybzUTi2CUO4Tf76/7dtlW7x5rkPud1wToKqWQEgpevpAVGhQd269ePlkPKL0eM0P0xwXJpcOUsdTUodudq1F9zNOSkOZ4K8uAuuiNZgETeL5/3xXtMMTcKhD7+gNb1dQXHAQTL0DDaWUVmyFDazd8LHPz1qfOwyUV9FJJV9Pa78Xq/5w4gPZjVhnpk0edLZWb4oEjE0fALAlAQb8Hi6+t7wWWOEAbbg5azIPpx9aGo5buTDleD6VfgbfjWz+vVvfnsS7dy6uA0Qg97AiWv7bSnGEUStXRvCAg32N/7OZ5RxncacBZKIHAIaCmISyznVNCVEaaLqWYVKWsxZQpBQZE8gw23LujG96yGJjmcs5D7FLijVHX3d3jLG+4bcKET/8UYMfIQTb/8H/39/8p9AUPxaW8G23awy/4ee6k+++XfwBQuwhSj+UBKymyn2skcOCGozyUVZR1JxCCIl5ribb/ejlKxTXRfQ6KiQhb2pikDuShcA9LuZNUpPQtFG1CZUGVPqbIil6ncuVjR/+9Q+9r7PsNlkgAQImAGyIJgMMcbgvHclJsT9FGZcraHX6VNN2eZMY2wvrObOjQASixgUDs/vGxLQFLI+//oXCDy0jrzY6iQ4YIlf0JYYqSECiIUstiNm5qiM0WbOv+M3H2aSxFA+oh7vx65Z4uUnl5wQE1Njc9OcMzFYseWtOhEjhudfIOuPmitqAu8ZQ1hCUwggM1c88umnxzpRgCfP0jeOUvr+tHm2yp5Gvs2aIvDNhG8J0n+7AnEHSzv2eft8eRooihNnEJtShtqJYVlJhEKixFKckBw2DSNjAEKhnFU0zhU14YBkmpOJN7HkiGy2CKBNOPUPTvx+LWyGPofPtZzQ232KAxcjZvht+AmC4mD/4FSTynw9XEQArpGtVRndM8vYZQEhZURazg5SZBBaIpLSoRBCxZBGg0UAsDY9UjcuHQfgds+6u9+D2Lebmsnivsw2+igC2BniHHykkqVxNqW+6aT1KWeJCklVMwNDTgkMH8sDpmOAuji65bTCoJjVPcFMwzSN0a6pQdL+ITmGRXJ0Wq7P7xxwsyRk+pkh3GLehECS8o5rv4DT9jkTqEKQMisglBIAy6CKYNCnQw+CKr1y3GOdEPY8kATz26fTA+ccZQMQfcrzyO08UuGCi5ROoJplEkkjVH4PuE3liiADamEhRMoZqXSsF7UTNBHhl+Pzy+1y02xhs/GIiKQ3PeZ2rXFwFMeyeqayH46zn7760Q+ev0bIj0JFExJQCXActhnmRPixI8eaioikxEiKFFU1VaGbCXU6PSBrkaZtb4Uh1ypbjfHovPR7OxXcFU2uNi711Z+C9aMCUtOwKd/4pUJwOCARR15hyEjxhajeNBRpW9vvyrCdP4LbkoB1hAK2ZvhGFOh41FcslBJJQgnBQiLtrz6r6uhu0rhmULG9nqL4PbulsLg3BPNbx6cNNftkWULfJw+Q867EATSmrOpzjOThTOP08cu82ASjhTHDoQShZOKcSLWmjBD7JcxB11JbEUKaHg5TWMrIfmjJdMqA1KmHMuXdS3xB27vjkCGiSTbNcicGMismLhKIkEFGWZrqpq/mDBJDfPSy5Rf9JcF7gZ9kMPeOauUyT3i6sIWQ6mNBf6Oohm7iFN/tpFtBziggAH7vV1/cdOVNWe8doXb3F759uTjC6rsL7XymHiGriN5skVS/azIb/8EBs0NUNZy+/VT29CYrR6Ym4kTCcqlICDhygtWEMJ0CSEpI9kpKN61KpaQoRJFNEH0WuNrAUV3okvFYQpP21wZVoz+gwOPJnNHUPryjK3s3wxsQPrmP4IICKsLrPxu1dx7hcATB7iIAunHuM8N6oWYvsNkQg0xJIcdMtMomEill6fYSKYWYISTQQeSDWq4cnPxCXDz1bM1tEUPVtJoqK+OLM0MEz23YTlm6dO7uSW5zCID7SA8+Asjet496cxOZ38k7m1xQdmdGM0mTunSelj3lJkPiAR9hIDWUIA0TMozd0hKGCAtJmw5LuxhEINp13BeolUqr0Tnmc+HZak4umDKi2OyPaMkoDap6eEKukq2PdAVCL1bIJMlmrJfMnM9zxEWcO7vq049zgUetvE/1o7Ah00VZ3ZM+yL0HrK6o4oJmUiZWtPobi7JbPb/6g995552x5GUHmlNgS6CGERDwBsI3BHLWaenvD+dFSw8zDnydJdg2vyAQesnuQKM9atWwizmXMeYYd/VHBJNZImJKJFNhSDEoCI8HPsRec+B3kUOTfhtZg4fqbSi1QyIA5KClKHHlGKKpsLlIAXBwpYCKg3lm8TR986HuKTU677xg0f4Kc8cOMBBmNCkRRAyCLNVA7CMbACMu0F3PC96HDcDyk4/etXfNQSYCoFgtW0mGRDt+CuvpG7tt32v4xz/s2tYDeC978xeD9xmSLZceM+UvXz/LqcUqahswiQlLdZ2U36I3xmXN3fPCvdCprEyUXxhEX1NGkc0Xv8lzNEFBo7jrzC8E9smtoeNicj0ToloI6igSKW944qVMwZOsCkom6lGeVDceLgahBKnS2G3jQuHmsUXOuTHLuRBccM5FuiUL+fM/3RWiDGDukXs336bNFF/dqr/UKQQry9TbnZ8ydKfbf+u730CjazCbECmnnLJqFosvt0ZsZSJCTcKPh1jXVZlrNWJlqSI1F3HAmhIFQs7pecQwQapKgHtnnS7nigEgophhHIWR8GNmJ7xbjwM7dCnRNb8LdOq53El3za1xhdHYlJBijddCEJCe0h3Lf+Afxj0l376SpoZrQrgrklWMKvtoLVOzIGE7QBpAwkTVRzQZ+ZOVl1VtpDwxrBrBXSftwwTg9OHSEIkofaKhyI8cN+671Qmcwq0jDu2u28euS75pfJb9BrR+YESMTghzirIO601hhNTNeElL2tORmmUq7t64k38sKstClgCTTEfmIsyvE0kIEJX3uBW/EC0BAgkQI2JNGTnjOIVggSApl9wxxWjteA1TVUNGpenRupBBPzRAqnrXhcZHD2JvTYihCYTAUASg0nvGkaXHTx2//aHZx+Zb9XMLrG+Mzy298bMf3W4apNiIf+ASy0BkVdQbe9XOfLpkQCn0pdPMYGA10PJn88a1UJTJ1GaTnb6vCiWfAMERkwtHJvFaQA2cZGQhU89xSOzFnFLFY2rgDvwk1akTzwurlcWtTYXF0SzpgyjEsXLmjNYAASNqBUEBYE/5rX+BAQR3yoCZ9kJujhZFK3ZjoKnjLALTWBx2Sc6NtRFCUwYMCUd3i3/xQn//MXwI+1fo03QFvZViQv3sIMnXnO04i8cRaOnYYsMpqLth14W2T9l3L6iQcwaTM4C3nJRORSiVgK+SwLBUCJkxrVpq3OPWLpeGLESJAxWvm4GWGxJXyZi2zv3bawc5q1OSfcS/AC0QIEaoQAERgMiWsgGJ5CAFdMIwL54yEhSpPb31WH+KD/2yUlXvYW5RmsHoXcM3QxF0VRPe/fuHskT0Jx8UuPDkA73bpeaqie/wgTz9V55LXJZfs7GSNJCKUF+sflNneV3NQ1SrIpkyEmJUEzCfhNe2/hRlLFE0WoblMCIbWUQFjQJ5Zn46k81jAbKGJRMAcZaALGlJkPByJgpIqGPJNMxw7truTaueEaDKHQAATY+DssiOQMBuGKACKnbtigD+8j+ngDsl3EnMEqVVxtHlxk2muCeFBAdq0iAGMul0xjiAhkCkgxVp5QLdzecbDf7gHry5n8rz0398FdT1Dd/PxoRoJtj1jKIwllJ19dXbPePm5UGcQptDarNJ++Ec5OCBQ14nyiwhVyAtDsB2oEfAFMDp/KScWVQ8qpBr/CgNkYin99++N5kkJJ6evjgtztd//5NP1qRBtIsKiKC7zD/3rXS6odR27EgIkiPY2AIRWLJlSIpifBg3Y5F7UlDUV5E7AnkWNOS7JI1m7nP3VFPytD4ERXjX31OMaBGiCCHEilt9X5+73daSe2L2yYl8eB4Ka/vlRaJd9emGq431YvZLZEE0dYBMcofNEg+nv/PhJqHjx+3btworLh9NV6xxPhqXpp7WdRzZELIYFqqD5zqdO67CRQ2Yozago7/6274Zn97WK6gvAwB0Imb156p2ByBaZWAZJ08f/XMJ/BdJI8txJl08zTihaCVtYxPbHu8O2IhFMyetkXO7fLaqHW3HP1b/uO8EvhzmZ/ZX0mxugNFzBzpXY5CgYMcZFgfqQM+kvpYNIj264cYkoXbtYRPhBRWYw/W8QgGGhrS0VFIhwRIppCIVSp8ap6bkUp485uQhSilD5VS7PDlv6JIp1tACdfvil/cX6gCf4VNbzTiGgO98q4wAVAKxzOYXh6UJoqcFSQfWuFWSRoaaTN5WX9eJJLmbtctv/8V+fnqtzqkqsMj3xv/gMMCwV8nXVjIXNy68EJ9dAvrxv/SbbxTbbrv+cQeAxa7KL15/WxiOO4UaiZIJMuuDiSI+/ie/742h5kl39+4sxCgzyZPJ4cgvDiwQsHUHJWWwvOlQqrpO0RH374FJfvw0TZoQf3RnjH1DIwrDX9RN5MZpdAS7UMUvq1JlnPhP/PuA43+FeyuNaSWIoHV0N1l39RRsdzdnczvcTDb7ujybRs8Gw9Xj8CXgHmCKdIpzQfHtzTKdgkDyMRKc+rhTNQA2qtcNTe1vDTBHn/Zby6c3vJkBdkDMIpNbC4YJFsJGohSYaWtqzpipPK6UjZu5TkHi2vv2GkwlgjIG4yzRCfmNZIiDyQp4oea7NyLUHqUdFObimtc8ZLcpO0ingtlcSGfYhgpPAMVClDwiwuPQeA1Shz/7X/3hD/7mbwDiuX8Rv3bFCQLvg3Xkz9RDnVfd6hePf7LOq6SiEW8r6gS7ZXeSojUgfM0OVW8uvVy1kEl2AZLkQELpV1Lh5dHLkW3HdHCIm2Z7MC4NGi2Rj3lghkU2PdkYat+PsIBUlm1DmY2JoQ/U6LRrR1eNn86abmiLtf7o42+aHSjox4MqRQryX/rvO9z8J7izGNMvmr1Ixo3CWJh6/0pOONsEzKd8eqNj6NkP4+8+O2xA3I3SCLG7vyH8fs2CfblqlBMUZ9qGGmsi1gPkyF1BhEXkm8cvz1QvlIUrlruWRKNtSK3mcEOLHDiORiqNsmiMEGToTvQcvpPr9JTk6er7I6d6pB6gyCkFykTAu7wnk0B4ZD9YMMnp0Fezd7QoVWfCnd54XCxmYID91LJj6jD2KZ1IGQNGwVNfRzDFSYqJA6/+k4p/60/wH/id3//RX/0YRLb12R1AqAQDoMD3wmv6OIQAmWfOkzOPoEm9tbIKi1q09fBR68o7d+9N0CVVNC+XeleKmqRrY1KYA5b7MfzM46OF0eqAqL7oMM2nxiBDwHR3l3b0jWYnHmwyHbTeRg8VVJsLLrokE9N0yx5uPVitBixJZz2xG62OQUHhGlj2BCb4L/lPT58TxM4alrVRWg1Y56F7h3lIQnvq6fmjS5/n0/MPdJ70dHSt+LbrErxcoBn+1ux+XNjIFzaOvKD4Uj72XGTJSUd4LOfjjC+dgNpSDzEe7GLmMeT3LXiFmwK4cKEmosmQU2ZP2pLp1iVAkUKWG9v92A8zyZZBReIkPJXsBoVLyuhSXgibuZ4CkwtxkF9zj+/OiACN4lEVB6+/zU8mAPUw5qS06qscoCGt6eShSaI4UdOpNTLBQTAR+M7PxMPp77TpiD+YP/0Lfl8wVTYAfE+87q0hWAGETNmv4UxrOteL6q7s7zy+bCKvn6qBbFX0ZXSiMbHA2QkiFSIr4SiBFcUk0NvzJfWRqzrZTnXyBiSFYPv2eLKLh+FoaoOJPRAig15w54q4DkCdbXCSNAYBPkpNukY5wljxdxZLuwOF+fUVWT76d33AK8vCxxobifGGw/dOOELIJI4PdvmAB6Pfnw7x2udqr171v/sxeN2VG9tTLMIwYWM25HU/I+fYkqK2CxAJVSY907L9RJjqHXN7vXK0cAfPwMbszZDxMA4eOgNZ4cbNVWu5xa6Z9+wgkOlSmGAdw4/nLtg8+uPM4b8MwLMLIBLJTmUYAqsvUlB0zC2ypTsOl1aP0r4Hb9OEOjIgDCxCsewTX39od9gGwruZrV6nBBmKZgYgUu2DtMnh5J0MYz5/7t9/DYE/4P/x1z9dbl/g9qFyihAr79faYgA0bBsUr9xEqPzIHEJRvno009u4eMeWTEN43lw9uQweFVQAXwZtwXQQgkkkJVmiQBSmlB2yqYpgJ1JpiOFo4q2FlJpwu9i1bn1U5sOp79c0EpNdXSyNXeatFlFhVme5kMqX/hkSkAKkiVeb3yivCjtYMJ/iScH/CViD/KdWEFe2TDyicXTfWidUtu6swZpYhD2c4ZMH++X5+YtPvvjZ8uGruP+DF2c/ffERF39cud4IMILuuHcnakDNqFOSMwyIIcNELvFpElf7lfiOlwlXt/RiaN7gl3KMxpx7yF5ups4bn2RAm0ULUDA7HlfJTCASErIjNgIZv9fnGZaHgJ0LiL409jZ1QemRknw2gJlsxyZRyAMrqwZjifNbfG/jr+KN7hBCN1sYxx/fPl0m395LzQm44AmSGzMFlpbO7ZSbwe9jIissT/ESBBTHP/03cj3BHt4vZ6j7GDDXf+NrAAjB+GNmdf6Z2bmwjwiF7TSttFQHA4foS8hFQ+TEcAQhS5iI4V5cX2xJrfbTp1RU05Q1BD+ZKBXAxSWWfrYDnWBqYJJ7I4DPFxYXYnjrvRiuAlPuCn+dkdZboHytYyyIE7dv/kH5R4fHn2Jn2Xz/D6q4xB1R5porryznPWytpu5QuG++7bBaqWbMaIez+/RJO5xu189/+vkvf3nHz37y7Vs4WNzBvUYBvIRVvYJr+f1+Y+A8YMjCMUSnwFSGkeJzN4q1QZGF1WA8lgaSTi4HzItBCPADQACTbmwLA0xTxxSIb928QhaFRbGEzEKmc4NHb/S5EGoaCMrIVGZPJdZGdy0+gVNqNfaDdS8JU0HrvYFv2m9t45TGie8KAARm59rSw6dX7QBlk0VjymDZAoSJuZd+pJFZsELaDgcfYciBuoXl7/39l9uHzwGoBgJgZfvamj86ZgSw8OgnjyCEmgiqhV6QrR6bQGEm9+uSC7PxxwXWDPTSrzRyZQhFmCCTSFjRm8msoTzyJ7/80e3fSKrQtRm9FiWAIwA/pou5GWJVwJPCmflJXi4P/tK/CIxG1p24kbgopGHlJw1sswKNOrCcgJyM3KqqDf/e2wyg+ulm38vBPgSJnceNas3saO1q6mbf30d87A6yO0/9gjz/cgkwbZl4mHEJ2ZOsMVTQF6zsl7AqAvY8zYi4YBCfxwY4xiDOJ8ClsOcMjh25qUpUmxA5t1XO3wmhS/wEB756jZeSR6e2EltX96+iS8lEUlBCKm1XU/zgEK2B9dhkmUgQyShTgfpp2nzNm7a0BOIUbMl5Nez8r0aTw8Bm/Epx2Ymerh8nDkAjXvDSktaWAy4HCyIsW5BkUnAkRaOqcqQyAhyyei97tAPwd38Df98XD+fPQIhixRk8+5paYgyGtg1bpfmAboFpARizC2NzmJZzSaYYj5saQfxVwXlA8OZSbSCFuRIMFKANgTUNquD9NnQa2TYYrKAuAZVNMjBKW9wFs7ajDkZ2voyblThOQO2oceOj8VmTofMVBpsBwHUAlfYYJ2rTO+164v6Bj0UUtr8nADYqci4fQFw5bMdK1jCW3LDwiCBoEIyGWC0ezi9xxMO5P1yWnveX9uSy9DhBwJMjXY5U8SW8ByMUOdx1ZnZ7RwzHQHECRuyzNpMo6RtyZrCTqTmJC7PlG1ZQN5wwdGmMsG9tILz0S7QggVR2QUGvj4fBrZWSWx/ea1OF0OBmSgYxoUhmCk3tuKbpFFPrnpnW/YIAUpKRNq5l//jQCKj5PVBQBebKiCiF34XlB4um06uZl8MXP+q/bC2miNkUvqEZDGWCpEARWFPNYoq8njwDdPzJv1tloTYgDXwqwF9PkyGnAAI00lIjBvat1rBj1SeemXzmZEmTVjVHtBYdARC/pPQRZkFDWdCUzIGnruL6rVf6fnbtDByOHxihjqxNjE6K4RSFJZrxcpwJ3Nc+PH/69javO3PQU9Fb2cbQd6Uv0nWFrGjb2WzdFzS9jdtDyyQKqu7HknakPREYU/hRR0uii4BqrOrdfch0Y0VVpmf0nofVLWCr9bWvU3+F0+Wju4cZLx9s0KW9puku+Y9u74Ed60oEvAlacbx7okKVSAkpOIADWQlVxy1agTD1qCsVy5u7BbnPSbuDEkT9xOiDwMsimwdc4DAlSJIhIAiWWrr96K13UnVckIgEmAIVUJqAsKl7P/C2J1aPSOUappSVzUpjHNhxibtJMU4vFFUyGyowlQEauFaEHxKd/nB+ocsLu/zu8btrtj5bl1sAzhjvsG9B7B15dkwVqEWRYfCeEAa/WDC/htYZCjqBUYWlaWbtMXnINITwxFxUWDzSC3GBKDomyvpyIlG9d2c6VXX1Hc3FMi7qT/zui9vf9YttrE7G09ImXNuFOkBw4Ia0H2/a1Ru8RqegFkebOuSqgUiSuDGQq4sAbe0HHAmlFopldPnO7TAqgyooaFoA7AxUSaviQ8y9WT4BptW5xk2JB/7knf5kJQ/teLx0WXQhFr+/m+ZP+qcP8fk6bxzbfD7VgS/0Gjo08hbswu1ulMqDQicf6sGlWdSOFN9VxNvE0DlhB8JKNkpE9ep5uaYnmHDq9Do0kuOEklgJr0KfPN6cPQ2pbEwqaEgmoC4Zu5r/bgcVW5U9CSERSWSuSKNINhrp3zpnnpV9BlNK75F9pg2D+6eD+05xVEVjco8g1yRTqPvxfj67R7Qplml6zeMc0YS22FBuSco0r3suCWMZSe75WRC4I0ApxwqiUbKBFF8/Kw09gLpP0CjZkshQk7YQQsHuzTtUTIJQfSxt6pKoqr7sC64WifKFopTcExSurMibeXWjsiXHtiA3KowTAwhIfI38tAv9vT4fYQ8q05GZ9uBKvozbzqxMkSD1AMB5qGACcMRGopvPyul21IOCAo0y7duQvcQQdG9tldPJ5YW3PGy+JYAAHd1WaxmIPp3h3afw/hqf//wXn1Es0QQ/HnpCB07RF7E3ieNDqcd4M6NvkDACPQQHohi8TLnhqqI44Kjo8Pa83OM0hHAnwCwO/QRYjJUO4M+99/jlIM03Z0gxHy+WVrzOFFPbQDgh3vnvWjQ6SNUfIFpQyqD19HQnITcRD4J17ycq0BloWI90PvYA7runvW3XtOcztYC+wqf7ppyca3rLrsl7U5L54cPiogmCMbk2Dp6RWOS8+iShfXH2jiMgFgh+vf/awXDk6WYz5xtw52bKQNMEyDiy478D377vRndHM0yMooQvqTt7wkgykxg7g+jid+9e3phuXsayLG2O2enW2bWlZAf86KmODuNqNXIAkkdSmSq4CldBmmXgkruLa3YCAwQooK6qxuZvmeUbDSiA6vCV87pVhYbeZlUVmMZGr719TAhshqacsVB9xporLtmdl2V9mZ3nSxeibH1buHaMA1foINAHWumu4b5aRlKoo03P5XHBV/2oqzCHgQr9gkSZpuYr/XXIHfUik3GnGyq5dd8NQY5kBeIIAN/7o11wvplK6z1VZtoVZEJQUgHt3GX8FH/ZBhGjG0qJCSYSaFy1odkpJGRgbbr0NXn/ob/MyXQzNo1EPfxK/PezWQAFgdu49tKmI+fVet6eX37rYWpnGN1Ck788eJqDq9++/tKYMLitlL2dZyxdfY4Q+HB8HKMqZ4k3QX49j0Vd1F0bNijV9FWvdLycDAtrh11Y/vnZs2epNxJyQFSQl1dekjuKRfYpcDdFoOeLRdpu661ApS1yH40Wrl1PdpgWq4I+esBtgYrRTjdhyhuZbTY+4iajboEUTBxiaqLNi+lS7W0nI1UY9gi41sCQtSBLT5ZWXAsS5A0vxSOSKhXPyjTiAZOXe2lOdLtQfrrEGjJrYdupAY39HFVBcRDsmUAVh+YiMAtHtxvMb4HmCepELKK0wxSAlkrbSh7UBm8mhl7oTRxTrva7CZb87ZgoKLCwk8qTIsrLimQGZiJXExOD81Dx2454gk178VBZkkIsSFBRUqDNr6BMMYCwvnLFy345aGo3xqk2r/4C+YiGRg/3c14Kmy6Jw4NN59nWP/nqEydcC5udf6v/zScXWhx/qY8XTxiFjINYQs43a4+DFE5nPToagLjzlMKv4983LAXdG99sChBDDgHk8wCY//azKWoLuUqVGf646B+dhRwlm1dhDDvGA9QuBWtGDON91aY68cQCOUaCwiJoucPR+dWzuMzFXBicqsZo+lTpqnE5pmY7NIoGVr1TdKjjjiQWv9ZKMaCkoIMe1HVF8v23JLf9kr0ATB73zj5uru1s6rQmz/Mqn9EuK+3XXn6BdV0v8a2th7hJMXReALoqOtTObirFHRkQRyBToy3FicIyXYmots9couAw6WcVw4aZwLN8nFU52lQjsZ0UnaQZYT9O5IDL9C7loBI1BjIR8oBFmQV39eeda3zQUHthpBIhJGlKpkO+rkigU9mlC1Ire5iddLDWmni88pfF9tTQtTQfEn2XKPNymCL7YZmire0Lf1IUttYTv7y9jYOEGbGxUCBzcErUGxeYAzH3hVinAYG7hEV7iBzl+zqZM/QAxtFPn/zmc0Ls96UZ18rX2gDwpnGUZqFrvrnWMXYAAqQA9LLos4+0lzyBw3kCzydzetCYXJvOFrHRGSsx8i7H6VqKP8I45fNRqcqYDxrOmBrT+ST7l1b5Ld4Q6nJTI9/XCofXG84THJL2tOXuW7UUGn5vGNljUdx96GQTmaLEuJwJWu/rQyo/e+h3a/S+fGoKzZwb2K77Zt2Yx+HxBz9wm+dNIJ9kMnwP7N4G7sQc9yaP2azv+DGJspFMIwcyRi6OMhNtqVId+LV+3JGRBztNkBGFgFAB74SDvt2vEYEACAkJhdWw7YfiOUZBYDFCUEIp0hJfGoHbu8W60G1hx9IRWKkZ37efPLkNTuTc6FaMu74QupreIgqHwtFDc7a7ya1zPh+j4dMnDUrL5onjZ5fvnB3w80R8aQXYoFJk1FuZXrlffIV9Xl49Rfjf+OhDiHuHssSgiPg1swykia6j6c+EtwDS1Tnslrl47iwVMDEB0zW/GF889UkCG4vCGejVrS8tzb/KQkAgdDzAk+k0+YmzwtvtpCLK3tIegl4X882qH91+/mGhE1unEcgKqY15rx218Qf1qvCFnPuyLO/xYbMjpYJqt7NvHMZlV3u2+BLJK18fWiWDvMgImTFxSWTIL9Y71q4lEUCUtDOhjzGvjy7zwcXTTD6FcjTttRUM1txJdJMCRBGlZLDpRoYexj7zVZPp4zLXM1cmFIljdXq5R8MwCnY1CBMJ15p31x4BSKrmiHmgGPVc//GWGmFJVKYESEmQARnFfPLZD18isZpWTMv2culHNjM2O2qa597mtc1stVRZ/SlaDT1gRynxwklrmtvl0JGex87WYypMFsbsB8VNj6mTVRgijeDWSr4FzSs8r7CkliN+Msd3/OVf/vRT7UJRhAgOLX5NrL8FAI11uAlIPd2G68apTDodIEUPALDhMgQCvBXr5BOndaVcYCvBsTKqAXhFD3KFEMfkvT5Qj3s/MF0dTrQCTFRbgEeXtdtDnc2sOKof9YfT44dtoOSndXruZJl1Lyzzt39c1p/YuU+cvjk9s053y/XIfuN39hUa5vugsvcrya2NPL4Qt54KvzUBIUsAS/ZzJtXnrlksiv2Tp1fcH9HG3LVHj2zscaU4M7qhZjeDxnZilOloNOptRc1ACCvyiae4/rhaRuJofhf5qtRJzl+orLY5i9sJgCuBGuO7bJIcJpZEqY8EGoL/XAfQ1mNCGj8MjrBCpfXjlw+hLqF3XuKBPTvbPKsZZ54a+/HZJzftMh+dfSJku4kg1hwnkMhwxKRzS2/dAM3Kw5nZ4vs/lSuOCpZZxuvfB6m6k1m4QZHviuJLvnh4+fzJzc90ez9KsxsL1a2g8OtgeWd5t5WZhhMUAMre+z60NG6BAPGGSKFpICJh5AgBkGXPBevYCQM5V2XqWnZEZAmB8BVgK2ePHvhbG4JkTkzOapyrrnk/nZdDWoHVuqYaj47hiuA4vUftUv351tSXEfbi1mh2J77WXI4CbdPoYEOHw2wDqgr67H638es72pDluHHkPnvcusrD60MEhjuLUjAJFspIg1uYlJRQ1f7wO9tJ8a5OKjXLsLLi+9tvLaE7W7pJR0rmpU1fgV4DZh3mgNojUgyxXkLMV0t5dDVbCgsBWem0E9lqdVwjjCyBqH0POoasQmVTVKXevV+6eCUkqtkwRZIyKnlZ50tGKtHZY+Vqi9Ga28G8mTvZjPxgWTi590NMSmJSqgQPGXMEbL7QuqZMtmy2WHe0zHa8dyzt04+9a75wEpmuogaTBGSSYVzfkrLcOw+CADZ77c9e3Z/EvZkRhaGSaiDd9l8HO7kodxFuggwIkIWM99e/I0Tkjo/fGa4//62LAmPhgV4mChC1NpvWxThmkgQKqvTSAlWsML04ux9H7QAWiN9tFqb11BILJUgFAupr1ZBcNgN6igqMWXV8+OTkrTb+QuGRo6E1ZhAfxk3v/8rf+pPf++HWUzisQprwYO5g/+kR4wHS4PnV1d00sN0703A6MRDv9HErgBQoNMCSkMFOTKQoiwJhHb+3uQTq46qpJnlZpPZbcrZdO+Og7e7sdWTEQb8TKndIoPAMKjR7QATQ6fHMzp0bH3mseXS7WXdYHxhqx0YQYeAJg7uOBNsNkPZy5YkOKEJDKIt35TJRaGKDsFyy4CzMTi3r5cYTk2aHPef9h9PLI9YfLL88Todl8gQP9y7RZWc32HSZE+ec0ywUL04/m00MtNWpfPVhsnX52gzrLKQZKJhkZMIgcEgvvfXJVWOsBFr8+LfiDsssYjwV4E7ja/Z++bh6pTpChWWdveTiliwKBQGpdFPmrLHtmyDLgHQdQDKFNTASxQJyTCJZCfQVhJlaNoF7GVzE3iXjWUhkdTyypnDrNAHIe2bjgFyOxAqDzFGeeM+frNPGm9e2HgBG7YDgg7ckjN8IVf90M4PbrRyZfufXjkHhtSTsTi37VQDgUTwdAmGjV56+R5WYRKJBIpLTSsJvPKKDlkTqHOuDejV5bnBC/XL6DbiIcDBv2vfvfvOZixrk9Nt7BjdIrFm+YxpJlNzCkWooapkMasmO0b72sZVdSNZpaNM1mTgcI3qv8rKsoIaYCNSTlb2G8zQYs3gJYoOAZUKZSOWUfUFeIttEuLMZ/ZC/8enD1Cf5oU/Gxu5pN5HWy3TezTrM0xJI92ivlw/XrskpQ3JSd5Bd5v3F9MsGDwHGNAoyiigC8O1/tyK4K7Owfud8/OQOt0QpwOrg3lbaX6MVPzDSpQwqJ3L4yujKLHWVyZJYvpKkXTNU0+ZsQ3aoQAigr0J6OtOR9lP3EUGVzNw6qka1IUP0cTWGEMu9PhPUq5FRGAijiijbp2G5vWNno+fqbk/6UHhzyN/75Oywqj45kidwf9m9fm9DSYdkQe9G6kdJROBxRO7Z3Fso3u/TFszcuEmJmFxpNFqbxN0+8Ln8ZVE9neeRkTS/WpmyXXznvJHN5lShq5X4RrTVcXVFC7tlCOI+Ack6HesQR2IXT4Zn0Po1L9cX3EkiJAJBmMAMiLj3PcQI/py30dZTeRVZkkrMgHoqs3dc1sy+qrsbvzRnIw/H1wcjJ/OUHTrY+tzNlpPWbGkBtwdH62yKlp79hECWuk4mqSa6KLs7uoTyyiGliiZFg3dAVxRNx9DFsT3g1eH5g0DV/ejjTvZ/rZqbIylNG8goLj/XGKprIaBQkUAUao1vbAFAfyU0TVuF+aEpBlLRq9CI5dzlVyzrh+ezeVFVDJjRXxyJhuwdAugefiVH2JEFQChjvpy9cavRZ0V9cLKe3Hq2MMd9bE+CHXWrq3zfprmvVXVPWSQ9ukESXj2kO2wqZfI+c1gY8llEkI5p45/op3ZwaxOJDqZPnijMTUBQaep0cNg1V+t6Qj4UlalrO/qmowiGlSNku9WvKnlDJZCAU6OBIinL7k5Z7oaRkwhfUIEZ4YSDnrxTFusHp+1NXCGy6qNHyfxs/whBFQdBJHJWSJkBSykQQigiIWcDnTm7NSPMNZmBaY1gtkSfb9aepNIBWzfGNEtmU3mIPZ2lnJ58MasbLAlYvH4mAwjWp0JwR3O9fUWJwQ2o7D0APWsPD8SwFawCMaC+wxH+Jx5h089ujoxSA7Q7Wb50a7jghEgpYn6t0myAqnnCo7YqxEhPtJM1XoX09ITaHRAB7Qu8tu9xe18oR+kjOzNir1U0u4QVoJkm2M0aqqjPJg/Kqb9tsp708XYw599dyet4cnlZWFMur+zdNpNOBiR1h/BaCfC4aYXXo2333tL4Rzr6fh/hoFjACaOMCZhluz00u2mY46NQSVLfORPNYtM+eO0itYHN6588iibxEs1fkzRb7xerV84CW8xgMIL1ap9N+bFv9idcx7OSnQDFNMKUEgBEgEEEB6Pq3n5/CL4fzyLcqIDQnmTPGTW2JRVqZBPyLlEwoG9r2PSQ0dFWGCY75K/9nrGJTebGsCZwQjhafuv+x6djb0D5HkLvztTcAVnChMtsZnr9pN5kHAYW33cnmyGz+G7ozMEt7RwHYJhvxisNDmvgLJ7zXQz1X8Aj7LEXb7IhUvEeK6kfOrX69ulHfqmWJvTZkmQKbQI6gUTvmy6KzYqvQpQ9/3aUrgHYZ/o7312C1C4g5VbstABIue6KHWoKmhMrKKgqDJWp55rjzNbdG7jmi2JxPH6sx7dGtx5vK3O8fHLXbYEKB7qH6xdt91XS9RrYOHbvIGs/eZcy3EcQ8KWFxJnWPmoPXk0jadR5xEhSop2GeLy40tVa7eGHZydVestyOvFYL8O02DzbWGgLhiwnJhbnS5mEqXRsvUW3PRKHDFERa4JJgr2DzW6eLl/RutkNwVN3mgSUAmTNDvayJbIvkcp1Io430yVtmUSnmtHS1TDZxZNmx8/0pNNXiNNKtWR3s5WaIiYmACMznSunqBUuNbGUAz2hITWod0XPoiJQFIVqrmFQF5fDjn9UEYFjpKV3LtRHPMKM7CvPbQOI4dChnzOtE++fFaNGIURWVgr9FkBTCQPTbqnNYrICEr7aSGvsvRpUgSPWZz9cqh6NAiMV1TWZlGwZeccDCmgD6NCFQ4yoXsHopJ+23Xxy9WA2bp6x3EWXwzjGnupEXSCLdkgVFM6Svlpjce8eCvV+0fj5rhskI0QdYVYu9XBOESBjLCtQZzhSlfxsfN6kyzp6f3GcBFa9dqQzuZQkvZcnDDXfQAGz3OSqqiQusFB4jhsmkcDMp1xgygkVh6FPEAf4Z+9g7mTYEP8QkMlMoEsRTp7m24ezzNvSSBwOr83lNt9+Rhl06bcupueHl8/d5OyWlpTJT3f1Z/3W05PMjSGJciwrgAgTxXdW25rrrMJu+/bF7fWkvLL87J/5HNC7qwJ8Kv/alX36oS99YfVZLvgezYtDBQoSEVna6OY9ghJiR6ApDRYHvSKsxYLagSDEAQbAqasEY1DIOQsAOcZszJ66u1fQvdvoiLYFwdZNVnJy1RxU7z4wik1toluaWjdhshGqVPcThjQkAaTr1rxBkds7uGTg/T5ioZplRUYymcjMi1KQSExRb8Sq1qABan3edf5wVbUXdXHYj0Ug9J6ivFxWkNy17ugIaJS4FPxysUu6Hl8SckjDKI4IA4QZAhCH4tpZ+HosKlFhUUoDSSqhUOY2Lm4dt4CRBqOcJX4umDFc3W01oUU0E5RqoLKJUrYNL3lpU8JUzqCppIKKthQJvFsqs8adRUOpKlodFaCJKwalf/zDggKC64797b/+7PkOxHL5Wz8/bO38/X/zk2KkR+ZnKtMPzgxd0S9sCOEPfxGW8/KOnzDgTDmJsQCIr2wn2qmmK1Hdm4Qr1byegQxZozxkKFnLa9I67A33Cro3O6ipcqbiIGnfVQn19tHrzzI4u67jdtGYkEwZI4x0b7k+uK9RiGmBvLmE0rn5jgdAyXSIEkMSWsLQKBSYtkW2YJAoTXAbJGv3LE1fT5h9n2m0ZyfYMEsa5HmSlLvStpJwZA3COPaoH3FPhMCYoFiAAGACDsz9R19G/839Mj4EvGbGTq5kZqbJDEawjIOEi1OKxiSTmJLIPi/z54cjw5OCpYsyLA0wQfUPF4fskakmAreBd1ZLljQ+G1SLTkVcipqXEe8HPx4J/srvv9p7+Zf9CaCw5j/54/nwJw9XJ7+/EAkerxl8W3SF2OIi7AsiXU4XKDFVU8kpliqkbyJlwgFtfEV+olPp/imqIIlQodN3f7KCBUuIlOiaJacRXdMd9gb73XwxWIqomnhI59CHyXk7Gp1MpQUgzdqV23VqnRFDcTQgCpH2dhUegLSj0O5IYBXHejC1xcn7bxjcrgFINL8eSJktAFrBYrSIFwHc9nFTHfLh7NmlH0eoa6u5zGmn0I7CcoOu9SVwCGMbqEptSDqYhhEglgBBHDDlILEDc3AJ8CXVwE68h7wYv4OkQBfB4S1he6VnxfUvLRlmvlq0YNrGqPp9IllSmMaUqdAQYI15wRPfcR1pBmhHVFA7NagRjyR/8tc++N6HgIrgyz+q/7fUf1v4yR/8Az94vHPtu4kfDcc9ogC/8Z2h8K/sImE5qiM0h2fHv7IrqpUhaZLT7PYkXVPUgzFRFXDgrlcrvaWtU7VXcMg51Vpmwtz74pqbHWi001MYijAc3ymhGSl+CuS2ztEfzLsBVWubbvTk/K0+pDGDkh1w5ayvuBaLcZ3c3r2mPJ7hi3x1jICVKJhtJE2Kopk6IMWMUzFyzrbdXuGoFka/bCPkuEQp5yxebbhUbPcjF5Kk0E40yrd4nPg0CiWAOJEoFliKsEAaF3fHCv1SOrQffSlROjJwW0SjDDCRBiJZeJOW2QSxeCC5gCycYgm5WCO+cYjVS4rvvvSCxgwvoujxk8inT79vA5Yw6X/4baD9Wfz8+z/A4618FzG+nOzfqB+t/9etlIQHJgC4aWsakkwh6baaXL46VKayaYY9t5fIhksKrKiAoK/6xkuSd2q8xr66cfLMRUGombR1g/N3xVG4WVWFxrIqoAY7ljZ7ncIALOZiycsnxk2e5bFl3mGcVzoo49CeKG46kqG3r30DwsynmF6ESUMoEkmNpWLmhOwsanZL9qG/Kgvrg7noQ0djYlFt3O+uVNoErUeEytSlzSggNGfL7TAiIeIcktQVLQkBoNLIRIeiK/javlXSQlA5btsZRYL1F8QyBYlU/R5hKrOHwDS2xdIEMgkde4BicUSOAkAORUDxXRdQULVBSYGqLhf7/MUVy4//wg+BlxtfGf/03/G8IHzr3VDhB5+/CSDSEQ2d6cefekWIYV32piE4IUIsV5q3aqfLIqUOy5Kk6TJChohCAtbPbg1BYAF4VEPnZrFIUBBAK9YA6I6fdubtkWofsEcbGBRMTgWuAccD9IjLx8/j60hVh8s4Wp3oDuG64soq7ajQAkle2kexkCf6CRtQqpwXUkSCAVhEyTGZJEXfN31rapxusWBzBTpAGUlBYRSIWwgBiRVCAw8SWYRh2+dJIEJAlFNFopgDlThgwkK4K7jwpfceRNj2ltxwaBrTgAUE1DiFMGFpdpnSk2Xd2Cqn9rwhxILLd189anBWuwmucRNffD7WH4TLS5g2qqeQAhvpByhXEjTYxkGI7hrPLME1EMOBpFrz+GffhHRUf/ufXBorcvdqa+tmq5AXWPB6ugwRTMyN5TGzASM7TYqvHohiPjQs6/Lipx9pMpP1cKcN8dF4nLRDyUIE4OHT7/VWkOwnP1+OTcXaz85n+rfS+Qme2OuJeaoKghrSczjucbPB0g8asVSMYHmGzyNSkAmJTKSATnux6rZzstuwQwSX0A11Uj75Qf7149qPH0z3rsM5jOEtYllyTSb6w4qb15fLio4LTh/9XSSwvkkZpo3xvTWQC24YToArjMr+gnHDZ0GemcaKapuWFAhdS4XllR4Cdv7BZPLV8eX59Df+4Jz9+NlpnEAlNeX0KNcDKW3NLVVFAOgwxH6aDxmOhi1/eBkACfjGh6SnHsrDcPXxr4/PZuvio2N9eCwSYf1oXHYVahf8s1u4ZwXmW72TkEHsVRiknw59Spo0HSbbzRBo2wsaKHfCeP67P/3Yq+nn9zl9574i5Wvw9iTexfO+rJePD8TVtSiPa29Rak0IT8ho2Hi6QhSkbcCkVDptIuQ8tu7MGRM+eh1HwYjzw2nqNz+4+eLTi3vEzXrMBy9/Hz89L7lezM6Rmd3ygIdMuyT+MFhylkFgURmOEPKiJtzMLF9IcpCUqONexjZWi1hJwsoG8nzRB//Ekn/tJw+Xv/YnSWLbjzAPpX25PDn8NfnKF87fuPgxuHz27vJ64ch+ef4Zni65UbYLNCTh4Q/KX5X4kC7ljV+azcq/7uHuH/o55OIjSn5Js1HrCaORtLeXP1BTsTC5YWttcqO77SaQ6n7r8Qqk8Ht/8PD05lTt09eZ85QFKO9Oz7Eg8tnU9cnttxkbv1Ra4Ov+nOXYNzBDsmPXk30OCTAThASdDrf5rNtsWJ3Tbcbhg3w5xaQp0NplnX79i7uFdloXP/XXWBV2CSBzCfDckYtlQ1uW7C3fz1YeEViOMzFuI6MLAkt7173a9chV2P+nEk+rDp8cn736mC8/vn8BFJj95dY4TpukTD8K5W/yPwuJchd51bTm9gte/MtftIadRykhaEQbFEUXPf7o9Sdvnh7ee/TkpH99k3ktnTiJnRl3V3Fc58s5QEF600a4WmolfC/Ru92yXEkfDXtoINu1f+HV8VuHg+tVgx4+z/v+RMXWL45PsLYj7FM8WezWUd8Ai9JP+mXngNFjgXtqVj82zQqYp5pPmYBgIERMxpaubuLxlkzRu81ogD/94nJs+fwz6WY5t/l8TkRKuSYiO5C9Ax2eG4Svo4x/KJ0qseYwzjtpYbfXAC+ZjDLNZKSWMyZwfMS44wv7btzc6h/A8uTZAIP2NwmJ1JkE7+rw+S88/Zdvf+2Zk/Ldws6+9RAa2QICBPrxJN7TgMT/83eFQJBuraH6+60zrbfaX4yKN1pZbk+++dF5F0XWH05mt7qnUIZWOMXlS4PAdyGH7mC/PrK/u8r6+m/G+YMW6Eno1csXD3pg2+yzhZqfKvvh+JBPzv3k0tgQmMcLVfZF8renz7OYvxP8BMjmhCaDhdFdoju8mS3ha57m9XZRYumWweweUlfGmuqeqQTVN37x41/gD7OFjsC7hdGks4mXdyozGTk5d9YFB35ur37xW3/nT/p3L7ACc6DiEwIA6t955SGU2XqfNH7rycR74C4Ww4vvT8sfQtSidItcfrxtoFFNsz4rbqmPv9D+3lu/O96evfX8tSWzXF2eBjKz5wsqJEaIJfkWPQWSbzFfoIkCskH2mFwZt8q7x/TTz46vn34P3k6vyYu3n6OfgKXlZXltHX75aD2un03dP4oNVbUl3A8PX1da1KM06AMknnEOlf0gKs0MME+4IcwpmJ9Or9ol0YIT2xxLKqdLl2UqlNt+mdacYt3IM0VA+ENzuasSPhj3JUI2TQTG7vqUv/PqbLff/Rg3aJ/c1vxDQ4aJ/awbvLXyOw2ubJw7NpCC/Fs/t6fwbtApjYgiXbjDobRuP0P84aC+aL11YuXPf/MDOwunfoS/Nbrt186H2+tw0Zh16ICfLyJijqhW0xky4C1Y+ERfKXTs3FFGGvZ7Pe5nVe/W8aM8HD2OTvf26vKQp3bph3tb28Vm/3zKzyNujja0gyTXF3eor9eOoLylH3oQwsKnLU4QNMIhs5ZAO55B88Pl0lpKsyGBABTRTeqWypCgeQEyISRE4Y8eCwGS7iTIur48HPDbMnxxnm9I4PZKdqeLjaGUAAHNLx4Jbm7fGXzsQfS7ta90fmjwkynuSgGIIdJTSgESAJUfNrYAUhIAeqsfGfyZL0eF738VLvkPc7qrbO4+y78oiiU79YfpvOTMUTMbHj0lvv3bBFBn8+ZRN0BXDi29qx5r43x5/+HTxkp1QRwnX+Ht/kSpaepTf7XajXAcOqTuf/b9GaL4RpJFC5d48l9MqXhGkIQZTTBSJDy7OSE3ABnyiC5GCUh5nLWNObFRCX9EWUjSygchHJTsSLz6Jf/s4Wf+pxZf/VGJKAQeykexEtz+XumSNPnDCOHVv6EHT/z8GPJMBPDOykGMyOfhLYIPdTUC0gLSl6g/U+7Lf81deHBw9Bvvdr/1cNyPsuQsl3dGZ6Zy4lLdIRFkCYbMUv7v8FMjyz6MaVX8Qfmt9zhlP3t98eeTgpKQP352g/V+JuJGTsuMZ68+j8Oh9QPqGg0P313usW37LwVBj1DhlT6ZisI5THE2HEcBNOAQCWCDUVpIKQWYUDBFpJVraoP/I4uBKEnBjPalwQAePrj7SPd/CffLz377owm8kubpUhOwx4biIEK2/91kAX39/bnnv/yrnzD+xKN7Ou8OAsQQgSoECCRSHozQhsTemm8eeWP5zs88OK3TQz6+rtlQDcn5nvqjNjkoRDRlTyP59p69yp0ewLh0y7RRm6F3bcJTtd/HkofZLk1F23x9nm678GS1pYOvgp9+Oung1uof1+TrG37Iz4iyVQf2ZfA7+PZ0K/BmagK47QlLkXp67jQKAiwYqSfnCxglEtpoJbCK9kebNbuHT2lYsSyLW/vox3cfH3E8/FM//fO+l3xoqKj2lsJrVYAvHT196dtX/8xX3g/oHz5WeqFz5aHVM/8nIDQUDqCDTwIEDG15m/jOiXSdCRhVcQJSmfuZl/ErdnzmL/72z4hdmuSfb9q7V+sjf4ZVwIyBm8yIUon5VqvrTnATLCYwwot8Oz09TtfeiAZfYirq4rP+hAlgikj18+nlw6F9cf/RtDwJSerPHsA0iSi9q6JIvtevF6lPegKsEMRmMlKExPpOEokUh228efwRZxFgSPRsQHNdlrsnxLNnRxB89g/JdhmHGdiXn3WOYnG8Ubhy5nPW1P84i//Ph/5h0bTGkf9LCEFqPpSiBytKEOl5tDMDXAghOBJLzx0pntmcQkOPMiJdH7uQ3zmy/K/Yor734BFvxtXD8zouqzCS7Sj4mE0gHIQA9K5936CzyqoykoFI86rfTkuqYNoHjXXx3i/zqdqLw0OZHDVPXaGcb9X7txdizoJ6WopyRXacP5349DC+Rw1Oeceb1/oFFUb1BRtptJkAJoSi6wbwR61FIM3cSa7euN7NMwDe/+JZrsfPTtwDFDBEpXipdFSAOyaufzL457+1c+rWJ/7o5e3N5PHlyV9De+Merz92oMIQw+yt/eM/d8M8sjcJYb9SsHOnKt96QiAx4l8bCDUAaVzp3Vx8Yr7xtv/hm+eNSmw3Y7GWqj5nQSAdvuzpnajBffTfT6tQlgm6rCg4juuarqOw5zvNa7+9hTSi5Tbupyna5ehxd7jtmh0pgYV1kO9V2mW6e40/U+V45J37hTsA7no8zIliEVtg0fCPXgaVyQLwFZ+8+ugJN5uewo64GcpplMzVrta5Pbv4O8WKUFacJ/hfdG/cPPspvPVXqyX1b9P/9mcRQgiG5zDIH6Aqh+ape31p/rjgb0O/9eN/M/5Pv/5D2nNHRV+9kDudQgtTf47Cjz7wt5q3jqXZtkenzpCv+qmJnZoeFIjSwAbyHZpv0IZVfwKw9HwxgdwTsQBIj1q3I+7P9qH2DFmY8uCxnC2W2elWuKYVuDtMKDPo0zkPv3i2xo8/AlV7ReV9br1Gx1UXd6b7a7o09D96DUoII+j2+eFjcswu1t4VROWFJiFVNx7MYpHLin/y8Onr6nf+/I9eK/zhM2cR/u5TytAMDUkeoVuMyFAxtJY6fo8kbH9l/hMfv7M6Ky81jve8lz8GYkRS7zrHHivwb/+IjtfPTXF7EdD0yQd1KQHr0DCJ70RNrdndXceBjJIiVC6g3fceIS30uuES/vG+qbwl2JRtDU2OZ+sOM9uKKvb04q9/8PDRR3efAEBdOxf2/HrVv6ep4hOWuiLInH/kMpYsshWGOB4ngI/I5lGVI2cerNagffRMHEtCwJMnFjYSoL/5RuGRjXn8j/M/OI5GbEIjq+K1E1mRQsCIpV5QSy1znrGe3LgiTl8XAIM14xOd65OpjBYIutFg8KDz9j/kH+Tl4lyKSha03eqYNskIoaiVz5H8/bi16YOEDGUIe28C2n9r1BbCS0+z46natRe4JZYzXQf2tUGIe3z7XMAJrF/8cP6DZw/DuUPrAR696FBxSMs/+i1G5USYInivRlzNaSGGCkhkBAj4o0cFkfaERK9MPd8897kaRhjh/2PmsScQQqN3Dstn6UodnqeHC2dtk4urtbz4ie3N1QsPAeyOZ9dvfuijz/exQHsjFKHw0JeabVFoMCOfkPG9/mCdDSVVpqyCRj/nd2TLed4BY0pafaS6OoJg+XHm/tCXG4NGlbOs9UV+dzJMd1omZxLoTemAim8tXj45agGAusLFhI+yguMr/TMif1TZCaaYCHLleppbNz7mHgMje44HwJMEF4LjKfHkZx7fWMAY4Tf+wc/90NB08ySq56IiAvDNUZqHZA/RbMQPbrfO8KvBQvaP/t/fnyl+XT2nJN+sjcsLsefrAgkqA6gyC+RHB7qZjd87dmrTLfsB5IhoLGQCZc6f/89l+o6eqYQIlM+VtM+mkUGvf3m2/vQgaTFpPLK2kMgn9qxj+XJrRAotL2w7MX72+u7Fg10bkfWp9SCGR4XmaIB/lduwSN9PpJZ58sY4f25a4NWjGKPmz3xDCloLb/Pcf/r0zzyvndUQLB2Ftx7en97Fo+Pi1/yxD+mp9fBi8n++snhza7HaKP/GYvTwzuXTRT8DHEsJgk7GK8x8OFrpWnN5MF6lzXlVRzFJS1AhAsHPZ0R65TaH6CCGBwcFfaRShdSutssnl6cftBsJd200aOgXssTy+vvRbeMJ97ae55HuEz5/uT4jhhECLugf6ApEvRm2P1JsX1oyDYh59Q2EVxN8KPkFiNQEqUmg8avl6een8d6A8G98DuHUbbBxCvW/86H1C7945QEEAFerWQ32VKfnt68MPifE+suz528c44JzHvzaw+zVj8jmbvMk029XspGj1rP45nGgpBfvFORYrsuDs1lSJ+p6SWQCAQIrkH5uHnkQWULbGAF62CPmAg29yxcP8wcNVifoajt9ZN0f/+DJhxaxgEy0m08bxOX8xR1x/AHuXk5CbbwBxT6HdhSgIKRcaXu1pL0WQEgECEhPW1ZqFGUhpkR6wginwKkDEWzVH7veeAYAjQgiPWeo/qWf5+KN8tffvh/fW3u9INc6jQ84kL163AwbW+yUGTTNc7c2LTou5L7PoxyK5DpMhcpGEylZEgEC0S+Yf9KqfDIm7NoItNN71W5Pc52dHzVcN63PfE2hl4mJHr+Y7D6nWze35fydTzkcS/wx2VLninDHbFdup9oprV6sgYCOniqlvWn3hZceuFXggu+BR3HTvfQn0ydgEqB9YhAgtovfUM+9cXrMMblILbf/6MyndrKPlV/ZQmreyhpv1E1CrKbParrbLz442LBP7i5Cn92DDfca0igmcJBBQcynwM/55w3dvxtwMydIwCBmZvfCtcOZ56bVAM0m1HN3wXJ/Faab+w1higK13CzttN4+fXk6rvHz56/ObX/CdkMvf2adskzIAWgn5zUkPgADmhUJFqkptZ1fd+tG8w/EBCf73HSvbi0+lQbBQYil3/jyX9nMPbW35TeOPBzKK1+vtzc+kCv0kYAZ5/JxdW772WKZbXjkiKgYNzLVwXxrjkM6ePdARMltUBWIjWQFxM/9bK8wCIowIuWSUbuzlL5YLpdQ/+zVWbCd1l5HWcaz6J8PyxEpDI9OxpzjWTw8yXs/M3F6GG8IexJ8fnUizGQ7uc6holTMkyMZWnytKJ6bSRfU4KXv6y1OXK+NC4xHjamNgwL68qf3Flb/1tmz08dGIkBc/CPp+ye/+2hRcHHt4o/yOvtyu/Th/6LndNHvw3h+OTcXNxt5umkKYuYHMLk1jdsR2Onj2yFCVsfCWcgmHCjy+W6vZUkGpKiCkEmxWOcGtT6cl2WKh24rzzeUoP3O2MhhP39xFJDrZQKICfH6BhCHcE/rV9Hi8+opM9r1ZB/2IItEFuarjXBLrqVrCTmlxgnp4XEu8KhxaDcwOXXz6vMfZnd+ZqhYBKQEP//PZydmFy5/vC2O8n679vL69kly+VO33jwJZMBUKVaSkJhbqtWTKfUDXTa1894pYTSxCQ4Ei6AE8gV4IXYT2osNYGSqdAQrpnQE7/LVF4SFce148qIzysBOpw4Mq5CffHvdKPzunutz4vhk/eKRP8Zf8d6fXC+ESg8AdHUVewtoM5anZwSIFNNkRnDBhxle2eH+6b0tCMHyN8KV0gfXPielA0kJhpf/VXL0L0bL77+Cjgse/+pDkysXP18sTBCOg4fVFys8QY0M79TOLtuGJyatGzni5eIyVNKLgSaiMAspiQJ+AeLQzXMXIANMgAgBZQ7iuvbLemdTtBK5m+3sQGd5ufKqLMddur+6xbbaZbVGApaPyYTBFvI/uTp2r7S37q01DZeGm9WzY/runTExdC0tDsTQI7z52ofOLL/0S4s15xwufn8qgNceTYXw3T989CO++lbpDOJvxuc5333r0cU3ty9P9oq1XO3UN4TrTkkDJx+Xwxbh3DCSbc7JwLYwSbwHTMlYUFH9/FdL3pr1a2cJDDWJGRTXV3FZdO4Hy5Nhhj9vyA7EuhLDTqot4NKY8NWOv/shIIR1jk5R1xJAA4FdbPgE2wRevcvW7TbeRAVl3TIvxsvT5shpiOXjo3Z8/ZPoa5/6nd/6e6e6l39Hmemchp8eqlyRYrt3Uohbz4Z/RvDXhHiIv3HLOn3j1mLvkjxvZNVumOkX5BzzdrM2BSzVzarcQxFFwXUROSuoKIkgyudcfy/81w5CdklWKFpbArT7zwOBuEwHw8HDzodbCWBGR6OEnZ0SyjkTybjRi9dCYqbx8+n67K/hAwCVtfXj8+uQuN7oq6KkjGl9LedcvKM/iqXRt4JzgnF7LIWbe5u//38jFH59/S8vHYXfvlF8+V9XAUYjxCuFI688f/Lj235TLOaC5M2tb5W8ymTc7kiVF7RskjiFHgCEAJD4R0QI6DmpJU5KjAACkglUP//vN+TagnZgegCsoTHS6bp/rRk9Fpxmb8ZAfzoXgYO9eQq9O6CdF5U3lJ5bP+Et+2IGDP+qCfceN8Cy9g5I/hRrXrnkp2HIFLJS1MXazV4unJXFvmCCMfYvn8utHO2/GX0/eu1BC/2b5K8jQF/7Wv/h5t8ZCmGP1HgjM3bj5eNHv/XAAne/60f+w7PbIM3IF9eXj52rP3CBO8kIH8JOIVKZImnKVMQEg+BF/UIFn9s3ECIxrmYUec7GFl1qNw0GU1+f1auGgtnTFsi2EVF1E5SX9QjVYKCxM6KReZ59AyHG8zj6/kn2uP6cqwLwmtjAkxwW9esUpJNL2+NC8BE0dY4xxs2Vm0c+hhH7gx9Q5DfOqei//kQWWl/5ueCPdv6MAQCJlI5CpIao3msedVYfMV9pt1dKuWrYD6Z32w+yrTc/eK7e5fFIG5wkkRIaEtAEqPKFyDM7FBrH1QUJJsBAhXgfmSVUbAy6Mi/9KSWoKzoyV6kjo4QwgaEhrhOEHByjaAFzXLQeuTMyjG658al1KPBaik+REvdRhOs5GmQKvFfXQRZcJLA3DXL82Q9jTLU/kk+eeO7D+Ld/PH0IWp8LdQRoq/cgQKSGz31MwN48RcfeoNkH6Css3mm2+BPmhQRK31mojgUX6+9/wTCS0XEzAQCKCJDlC3ezEU4tOrIwEOC2jx7nnnBvCLkJbU7wwhMhZfdMKVZRCOUGTbBuySlrq5olCIEuzGddGWF12hXRn2PDuVt56ZqqhUaczUguGgir/0jlypjgMeEUBPcVvvtk6ix1o3HGz6SW8O89U4q1Szd+Eob6sFhJ1Y6AvSWvDq2imBUvXReoLmqOFB3PKq/pjp1/sr8lK+2DdS+8J96+mNcmF0Bkh5ND8fzqOX+wD4bnIY9jjMM+fhzXiDlU/n329Nsxp46L2QMsWfOcv/uzsjIVypbmlK0Ckv3Vgc+1c/tprlf0bLA7HPerx8XzxW/MX69+Ws7oaqSA8Dfb1dHvJUgG8O7/67/201GzHSGsNr/x//n2vY/+7D94b757FyNSQKqm3sK4Oz0l+Oofs8RRF/q7Hx/jdy/NKr9xUc82FzcUI/AeWAbSzLTE2nr7yqG3Y+gNIcPbEEy/Ke2VTl8vN78N2ThywGHJ/jrG/J/9Z//U4uC8zdspBUTpCa5Ptwd3t+B6bsmPt+Xk6SeMeP7r0/ePEU4OCcprZv9Uee91/X3fz+CT+zYpalcrzMZvLJ9e3l79O//XcBdBh83YHC4xsRza1RkG/JcZa87RXXx0Jj+dzSf5sQZfquYvmx/EevVNBIGE/DM/DJDRnPW/bWn6hAv1opjnBer5S/hkSBPGHEg+PbB+/3bI7QG6acjNFlH3n26bynHhOLO53roClngrUc6nzRv9tgLYiY+3+ZbCs2l9/mvv/Qf/cVTMdE24+bX3M+CD8epn0z3WBH4BxNACAyF2yea39CiZJ05zS755WXAO8eDJxZdHvsl+Zx4QHU4y3PTDYNhTYmp4gqybf6irxvTQOYSHj0jSAZooAmH1PUF68MUKaiVVb0Tx4tPsfQAgQobJ1hL76ZVtgsej0ZNqYSZVvUvug7lOnsxbnh1dNPUaZrqeXVMenfvFj06+vvr5yek3BwjDHIihiSEhhLBv2TO+tu428u58RBN4N5YnZb8Gk7+EfNAjwPXMOw3fzinrIjl/ku15ghwEgYmxsIc1fwkN3QbSnOjaFnt//c3v5K9IMzDU7z/lRgmCizJ367LZYnfg7chCeWt1n3EnHlXny1J/cf+1HwMcXE5hhV/75YBT5Zbf/ZHJ3+jLnz+/BW/WzwU2eVCAEAJEoAoxsJJlp0pIrvHWoFKMrt49nlw0po8HkdKXzjFLtEtQbZvprx6xfgxNoelpI66YMS5yN+eQFUQXIEZT58iQ697muH3lYtQCqPZ+0nVguTQApi7XpWvsvCvAhcVuIKrPP8lHP3971gzfqAzO0x3Wv/itq0fL7yqQwm9MlD1cWByqr50xIWKJd23J8WuBuSSK0UKkGV/52GUu45fQdZGINFhAgmiiqaAwmOEpeQagbeOp87Q9p5EGLpT1a8khOfe1a2pIFJKMXr0+5W5rUusOmxyMbW1YOCgBgHUIz8/C6p3xw8OfmDEAaFsjKJ7rwmQg+frHH9wzz47x+LS71LN2Zh4bLrJ+VogEC9Fdh5LWnu2BW9npZVWs1wpQhi+nfvhMz+LpISwQQ3M4HlNjqK4biqNzKlYr3ELjORJN1nQADMaAwCnciVVa+pwbRRotMUBm05eshgaMrgbDoa227a2J6kff+mR7TWTUXD8e4Xuza9Ik1SjiUgGSzQ7PZKbS5bQ3dFFWhHJyhc9FQpH6SCKT82fX1E1I/CUzUu/H4hSKa32BYSSiR2hIcj1gnmfJX2F27e9aLndigFBET1Qd+JzbpAIQRK1J84LLAXqt8qaAbBzYyY0i4vCCwdv+56/Hby0jwqrr4KresKq+DkIwQL5LiDmwRLzOZa4RL3Sb2Bb32g5AFPRLKwV3R5KnzXU8HU/52pA5JGe67NjNoB25a46cCK7jyp4SFW0SpJ95D5YKEANEIsXO225fdptR6S/HsBNe+26qFXeewGT3oKVTf7awxYbSGNfr5ZzQBQhq532RRIghzcUqVT1PetzkjglM/BL7EUx5lgNiUYDokIOnrDUjxkd/XDdlkAy41RFrlKLVjbNED1I5Pvs6BCFmky3AaBB2ibJdwUjD5mgQQaAIijqMK9R9l8umXW5mdhQ7Se+0Z+Q7vOAQIvWzcp9SkWSFK2TqSaLt59JQakyRvsSSr4T6g3odNKtFOD/KAuJchkRDKgdfHHT9lusbBFpP8on4QEEGRmJAQAAOdjsqiUy9EzM7FfX5qOIh1fOjRz/7ZpXrUX11MUV440hBuDHWeTvOSomx46sgm0abqcCZv1llVQ8GAgB8uTXa/nA7IABZBWXUI6kcyucgMC7ejSPJAdDjLEHkT8BABACJiREwJ8wWLHoeBMcwbmA43V4UboCH3+rKP/HksvX14ZNTmrWcvi7KbmzxnYGuyGanb2Ku6H6CdJqItgaPToUAb2b0l05DiC1HHC2sZldwnE2Ppkeub5D9Zxe4wriB/Bx8GUwXICSAiDyIoU8x3O+JDNVZ6kABlu64KeVqU6Xx+XGZDbmsX88UPIP7duBl9JzfFlYk8glXmR8Q4SNiZtUbpLsvuwmsj6RmvFRPA2VZ7hgzXICnaxSAT8Kjx0wCBIYQIWcg3AkSve4J7nlKvxmEY/O1Jxdy7o7tt97b8tQqrlbsKTxr2H07johheEmiqgIjJXIRECZAogovBLKY/KXU6CG6w/V60Zi49NMVhpYzY4pC0NDrk/GhBIIAaPkFUIVMqHvoyemDZcs12/7Ow2YqkiBDeDYMs8J3PAYAMgiOZctnjAqAgxcYCuQvqacTtX87PZKawSui/g0WsWLyTjI+DW+TGXQYb5poGC/Rl0ABaU9NszpfsRyWq08CJG+iMtP3LCnS/JAlo8LQwtFBTWP+0hT/no51r+02vAKwVtHCNJifkJsCqQ7HsnJODAKhYwIxshstFEae+uroaZj0AL7IAEaQ0UCwKObvoHNRUIAv48a930CkKTWnNqPdrE/Oo91wQwAEkawAYsBDgK0BHeSiYWoad60qxKN1CwAUi+M2lYy8m7Akfgfx7DzFl+wA63Hb3zHWz+1LV0yfmqH4KfSaQVJWQ0ZDMgCBDEQrBCBtzRrLwBkQwS4ZJYSEwCI4KCZ/Gb8H212AxMYqw05sbevr9Ll5AJ8CAAQymV0uqhAVBctEWkhrLZ4iu1C1uegSDDKXEx8OTP6S/hRmewXaud1DNsn6VH0gKKAKARGoZkUyCYqcgBNQNGA1S8uoVWhLtyYKqhRJIf+f0Quxzamdo0ceyPqMPYW4+10aEVUShcSkrELSIaMVzkTNNUHlCBSUCPE/r/diNnt2KLzfsX30SfpOiCqKoqAKiBkhD9+UUCYRxcHHEZJgwnm6rP6nuOve4WH/p++5F0TXztdrFAAEFfSaB2KwgCLI3IMwx8D5/+w+krGEeEzz07XnFQUTCsgg8iQjsWZVJPnjM7K4n8T3vMvncccwkkQBr8dBBP/4/XLmI1fpT+6HAqD88f9F7fvv9+ndQQL/Gv/2r/lXgH8Lfjzk727///P1xmwe8en+LhRAqABQfyieawqEWx63Wejp/Fn+dXu32ARQ1B9Ocptmoe2/Ycg1GwsQV1J/jp+j/jD7Dk7jbdyP3un20obGZVly+zXkO/kb+B/R+3Hv/qortcfHVNj7/iGkW2kIV4lLi+FI1ecGgnptwXTzhex7cnVB8va09B/BHj4yGNdjIVB/GASD4ipl7RCOJ/fiFjhXWtcc+HvyW7fvmogW/uNkNscqVCEQd3hUGnpEULQP896WHGPKndyfwy1eMrg9VfYFQTiy8D3208Qdq8sydsD+iPRw9wOoilGriNdk1xXB9+ruPRwHwtcwtXhtTF+ONQFtXbrg9EMbEuMC8J33qzZkmtJxguUE3JtbJlBK6eGP13DWegG1oy3BIigLkKyGgaPkCdMQGg06azceem+KXr0mKQqI0mxJ9bq+yFZEDsyC7IpS3P8uO8IrDquvPBY8+MP/IsIrYnJHX4IUKcCg4VDQBAjcxlWLTSgIgLhznt6b4pNVVu5UTceVQqapNldOV4qOy5VVplAYOcDk760eqam0psza2mlqtEGxPvQD7glNXfkAEwy0FLiRJAnZRiWKCRKF4EtTRRCTgPbjpPee5q62Y4k+Gc5+nHvhoKlUwg1TYexddipJLMnfTz0sCbiimURttBzJhcf8iE+xjhMadBa1w0I5xQRoWSNgFAwKJzQWlYbakwaZBVUg6r0mfjWbZcXRk7lkIrPihqlyFOvxVqmtTPf3TewOJaZO3MkLTIORs5qQuzq2uFofZgeH46iBQAQGDFJwVjZHFjkLmWkDU+EroqYJEBOCVD6m8DB3Ndf7qpWGs/khhOQYV0C8wFvxWGx77CALFH/fRF9/3dxzWz5uMcFUlLbqkLMMP8jh3NF8l0IYi9FY3jKamPBQEZswhtn4rAGRSUjlJG0kFSJBjXrrvSQ+SncXSWAnM4HXpMTagjDaLrVKViH9HXNvGgZwV3IbxeNERBpzVUqmrT+LVZUZf1SeswJYGnYqkQRBwmCAkwGYSrcMeBSuKBOUUHpUNyQgAcmQWHoa5Nd7xwiP6fzHCbPIiSqRhHEiFCcDozC1jlYEI1ciNxySvy961nciYsxC4lqHXpQVwiBmA2SxQtMWj/xR9QgER9VlkBFWWnXQVD8sE/IkSAaZRpVa2tpJCX2jQApCEgEEIUFVb71ntMfV8TS+MqhyeLG1rbAOqWdx//ESRIu6M1dYlAx8jzxZAlzxdpPswLETaHGnt1v5LWOprI5h4+zHs+0KvRnrY5QISkaZgeYbioswio6cFKoxmGQMCLBMC2oIjyQlMzeO5HCUoBKLKrneG+qThQKaIHkYo5oEs8iPC6fZEFBwnHxLHBeE4jjSlIKC74ojYlx9g3KnKEY8ZtmucKF1tMQ45UPR6aZA++rz3il/LJ6DOx+gQWs6TA5zL9cz0VAMU6ZEwQiiSdbVMgRI3QAiJClT1IaQgCxR9tXEqrsAr256WkAF0JiYUlWVQE0trUyqWF7iJGWLZ9wRFDLL3xv/0NAAFIasRQqIXT5RNaGUF1E6AOPrcV4kLtjBWIqtvY4KUKj8YXheFS7nmQAzkaSchNMdJjDI5kiYYxsUJNBdMnZndyQTtpYJRoICUiJQLyeUeTulAjHILmzG6xuPNc5ccOVRcCxMyyC0XmVw8wZrpiR1oVkxNFySJcR3wZPmThqTJrImStlEa1pD5gIxZQoJjRt28ARqIGgilyq8OKKsk6K77vU937kSRRuEM5aeyQ3Al0YhN5ymDaj1ZpnyNE8Y03KjNmQZJnq4kr0nIAkRQLdgAEgoNpohnGX9AHzHaB5yAAwnTlqTVA4MP9ShSmrckjQACxAhvgPuk60Gg+gYWMg5Q8Axb+bA1sVlDbtgjpumo4QwERIz68tSwVMi5Dh/JKZTBMGCYYDbl2ZGg4GyjchSBnNzedrGm2iBjYNZlOZ0hkmWjREJZO9Ii1SqA+xSMIWyz6o6ASkBeF3Xwam5fJwoW04oZ6uwFUKshkl1XEfTERpXchUpFcBtRX4nHInSogsGsdxMgWKuXOGhmajDyI5iJecUQRjoLuUmZ39ZqSqKm+D1v29hR+tCYDA2N7MNJIdPMvhiDWozu1s3oyBL4xQkwtFt60JMK6FI9RAUWDtTUqILia2nchylMTyhnJetumZZCdetr8dRiQJk8Q2keQOcd1JQdRxeERbsQlFh5FBojAsM4hv/3xpEoUAj7sQQh7OWJlIuLPacHNcTOeZefnIyZJelpdacAy4wXCBq8dmF4QNwvS16oswxZnR6M1qCBiIb1VJT2hQ4kFDrjdlWTiIOEWyR8EhfJwoKg5kiM2RaMiKznNCZ5bohgCrFnGXDoduvaz1ujLfGZEW2i2uuvbzi2PXOWxwOvReuvuUfmXNKyxIIoggD4JChrBF+07Snp5V8F+mwZDdVFLOUhE0VnjqkQl6keg0i8erfuIrKSRiNpLGhmQFJcBJohIETPeQzElBzS5rI8JYek3KdmEBu/IMv0WGpiIguLlxz4xJy28tICNo4KP77Va0vTs3DI9Y//3SbwdRVZ0XAlcbC+F6ONbXkMo6K0GD5235YBJYymhfsH2Nh0dUR69HJectiYWj6GMEk4fI7huGQ4Hkx4GkdGNt1WuUyFmpeveBo+0H5Zm4GMwMmgi6zpFt3g7smii5NLjgmOBBAaqJ5mONipe7SQxMzwVCISsu+KBFrsAegEIIA3VKJVCahffpVa44oI2vMY86BB3WNaeAqCBau1ObayxebW45KnZzqzzXUrgiVI8JIfIsPk6L2hkyzBnExiB++8iNRJNOBM+c4vxxRaGB5XCGicOwLhSHVEfL0ERxTJZCSK8PR4pWfNM6bJUk3cw8DzTSDltmmMBrmcGty5TwJ1qRm22YsAk8QLwTVqtYpcQFTCjI6tGJdMst1s5dqFzcoZEZOvSm/4LdOR9LtEWnwkMSZGw4UdeM7GjVAphaOg6PFckPbAHnB4QLboHzjvwVDxF7I0e+DH7+M402W4LQ1zsmc8xBTiiItdWQ5FXg0FOR1w9J1pIyAcWWz/NJmS8VmktjGm+g0t8LjhE/1I5yWTvnk4S2mWTLb+hCacsq1ubhosoAl5N6DadkFpdCBYMTaMxEZSNIN2TOTnpEZ6ZgzfeC1vB8U7xNjHpyHzqgoU1aFTE2QOGgKszu2xDNWi5WcCd1IcLMFwuLI8rf4ufK5qZEQQYFtrAFz/uQDS2NMn54+7JvKN9OkGfaYctahCSQbyRqlMKftoLJqh2NcYegWg9f70i0RCJZ0NTQDTVM61Ah3mNW5iDNFWpsSzWyS65D0TDBoc0dDKHPyNdW0Tt0ALjJ0qQczg7ZEppChEE1QZCjdMupunnXnFzqWc+4P+dBEcOo4f9CJcakZYSmvS5paHIFlqk2VolIVyo47SQtNAVgYHZFSv6mvJ5cag9DhgQLkJApD134Ma3DqvAXh7RjEyjIuihOkqQmlhPIFTWkQlfRLRJ1OO4iw5abO5OLBa5puKYwwyM1JJ0iYM1twprs72KBZZtTkaXNO0yQ2wD0CnnQzwEORji5Yrg5KvnSyU7mkxOlyUSQd6BLUN8vAlMX8S8wLL2fhS23EETqH9MM8B7LfbMxGliyCxw0IPZ/3qNSAaMFXALRz8A09NjLcVI2VrMoKRKhB5dNSkIwbjqJTmLEWWBPbBphJiLAkJRoQIjlMLQSyuGdGaAAo81rxmDtuUz2A1xlbP0AEmS2MUQhoAY50OTNXZ4ed55Ygcsp0kS65oIlIk1dpIwzpxGpIRvoyITD1dZKnYTFb3YwGwKI8uqXQVghpIEpY9PXRngCLezRzc1EgFBIkhEyDdICD/PACspVH4N5Es8cRmLKoKSNVuIaNZwCqDFUEih9pzLfyU8pKEQcWk0CU8WF2yKRoBc36igYpCZDkhEIlsEAmkUiZF7DEBiuxIAoq2WVuY4KpHgcVr9GrlZyKg6QEmIcBnoDYc4Ki9YkWOC5pXMwaE93yIFqER4MxmvKQZcgzNkhzLbOWOKRFANHWiat173OH7OKyRjrE7EZGkpjWEMqUDZE1El8L7VkUN6NxKHcGEStwDWXIw3W3b4EWhAojlpBpTNnKAQkoJUCQYQzMO6gABhhVhAod8lFWZJLyzfvzhpXftk2zEO2OQ8M4zFfBrac7GldBIaNgAF0ImMQ0yaWEBWGW4raJCdURFPfMzMrOaAK4mWpGL6bF09cci0lDKRRVLGnWoXRKnM9z9DaFggaFo7VUuqcwOT3R3TssFM26ulmQigOxYG5L1wGZyEjaxZnSlEHxpDrBIbOhd5j1HApaAZW5fWdOfOd1Z+kZQXJrESAh56hKSIA3e41iEYgCB4E0pClH8QAaEiDIMUZmXZ31r0FQ92QH37qRJSIzI9tmA9kbL5mwUwQ0BT3KM3NadGaaQKdAyw0zC3tI2GBkCVfKKFlJolTWlNpGQMCscBjH/CP2XbHx9NeD4ABAAlWeCIOBad6zQS0zYuqYfQK6J2aPOTF3IJtfsk9cYWtvDEvb6LVYsCEP0yoCixNLupjoDfN0MOvnuCRoKE8pmRp0VzcVGcQx6nynR0mr5xnJumYE0OhYFAkjmuGq28kduv8p+xi7WAGggUoYMUJpT9JR9/AhQlICmG/iMXhnNcJ4HoccmcIhZ5O65MzohJtqrlgmKmf2qWWaLGXINARNIFUnNxBmpCpE1hSTsLvSfPCIZ//UFavIzNgofDOlRdKjRR5W6ABl0o4LLScL+Bxwn3VGp63psCWhKAHqsHAiyClNSqDJJ1pIviZWP/B0m/3+ktXP63f0GOqRIwnBd75Z63y8FwCiqhhJREY5W02AL16OEMrMsouxuwEEhALGHbzH6Q6oXYKUzLfvOWM7Sq4pAEIYE6XQqJw3xXQxmy+pUDNkJLxkhxkndSQ8U3AmRKOo3o3l9moENGaVD88bDpYay4zcGtqrBEgA8dTHY5EnjClQdH1pUluYE6F1KsrblIRxwiVPoDWPyIC0hnqmoZNukjBn794oo1zw8gRmcTTrrYMyv7G71/EVJAjK0pSAVZp3u/IIlNhaia75TsmLCilBpiJHCzfqEhpmmqqN9pASglLGx+sODYauKKZ/8w7CGMnyfCtVsxNuXQ97I88I8UKfLVUzi9yaZfJSbJyeKnkcS5c5ZaGWDiFVUspbM3OwPm9n9MgsThYsqenVUxced5KezFp+hOSpIDH3zvSm5JQkJk8yZa1N5EVLLILFssLRp7ADEgakg8aLNSnmk0AXEpl9RfMD0G/9i4tAVUvbqTYBVAkMjNIuDsB3VPqSAPUroJNenx9BLOwalZQDofNs036qCqivehN7M2D7bOK+7gBYHGSBfLsOWqVbzK/HGAOtayEXd9J11Xrgywb3mhxpG7xBGTQHU1PG5OroCbKlHMagRAPMYM3diIisSR0RGJ4yBAXAFRZFODy7+aJS0maGSDWiT0l5aBLDcbKz5JObyZc887IYyItrzphBQxpS3pgF/d6O7ZD3655rE8RsNi2X3Cu+TketOqhIjgCtCA/WQwfjuyg9y7g1kv6lWfGZCDSYxELCAkhbh7p37qtJL9RQkCFVunVf9wGanQO+XZ815YVj+DytDXn5aFKSC5QRExuUBtNGYynLkFnrmBXNsnunCa3LaEwqkTBzc3dDSgmxfFyKVjNMxWESYQQKz1x5HHQv7uWXJiLTDLR1DityZEuHZTMYgXbOl0lbOYUYm8jm8AQ8vLG7tlXtybpgCUBfVa51Cq9wYlF8w5YZBQFKvOsfSRIBHnCYjSgznjky9iOMwuByl0nGFJlewRs4Dld6BIgk07+iu8omoHXn2zUwMrYyy9ZkaOm3X+1uQpD3Qcv0OB4WdA+4OxVAJtlCExcacYpL2JQrPaGQQDMxnQIkiTQSFJilzpAAifK5W0ov+pGes/TKCCgahUZgQgrplpSvnBnwZGsdzAMRmSuW4IZqjCY2a3ygH1ZZbjBTJwn5upR4csc1FAZe9/vQY0Qqe8BTIuUATRLGmisA796GMq5MA5vRzUSatFwpipGtKYFCLhmCuelCFHeEhVgpakALdK/gwL7uA0bsEbXyvmmfjsQ6GKRYOVz3j1gJao8htCallG7WiWlqM6lFlMwsJ6xm1u3zJ5cDwGxJW2AbamMGkJAECMqSpBsGi/dW0m1kvdXyK4XHc37yljwXnEnTKms0Ig29zWufSHhjGtJWJS7k3W02ZYsWQW+WsJXmU2oWEBtfEEmoBLX4VZ2rvWsFZwb23bKjkA2Wqt+5LGPn4Qt415QnOCwq6UIW/5pBqgSMSqiUGLWNtTUJXiTajpKDsHs6q3gVOVKihLIK+nieOOwBxIHKnur2t+wT41IniFgGZLm0frqeIgSgYtS6pIdoXGdP54u4TPM5hbSmjayluuz201tBmLpap5ICmeaO4l5EqTAgt1cWXHeq+lZaUBGesgAFDWKquEZkkM5Iz1nbMJMzYQqos10WNmZM0dr8gLaG07GcWltX9/tSNCZdi+xOmYti9RMaKDCM7+AIxM637ZSDCe7ITYLv1JRb1CYdmqA0KzI50BBEiXJiSEeuh3W2IAYU4Wba6brCeNu6C/2HWmzUr57frm+J8ZhtJV4YIJXuS9sPOLUDJ5LsPQS4aGFHHCVkWJoQzRxamVLo9hBaHWz5YKDkrVxgDSF7upNOS04NhMzNlFGMErl/1soTdxy0egO2wdXw9CDN2I7RzZCXnmBO3sOT3Wj0lpTcwr1f5MqvWOMCWAuvgOwVHFAJBijKkDQg+mQAM4sSNhQgwHdqQxFb6Am4wYhyaRFgJmG1mqjv7AwVKO3oA/u1E4tuFeSd0R04wrUhFC34hn0V7opCZhzcLohUtHPwZHhUzGtWMJITLgqcJmHGQ7rU1El3jzSIOUdKDSSWxKxQS0A8n8NCZDOfDDSnkTZNlpk1LwcWhMbsrwhP+XO3iZlGmskMIro5tI1w6lPjauui1o0JKRppl5nw0OzTua0+5XkFoLGuuJnAgeQx7hbIoYcdCrGwAgYYAykZAkkrkhNj793rHlpPSUZSAM2hABYDl41ytRF0dQ/wYrV0ZRZ/t3Snmje6ogNPTeYb8ijzLRF7a8geh08IKfhixxjDTF1bycKtLjX4tIbQSuI2l63ytq4QW9JgDCVbBjh3QbjcYaJNrc1tQgrG8vySfVlR/QdKiS4BxLO1AcDYfCNwo4Dg5MzFm9SmPOpCv0fahEsIc7bOZvOqaGmUpvtCT0DcLZ0qXyXhSIbdALJQDUEVB2ooZaZGkVA5NwFJJmr0B3xn5tyyB5UEkGlOkSLYKCXOLL2SvbpVJoi136fPHuVq9N413Qdg6O/Pyi2Lb8Ze4cg4kiErxjoGMgPmsihZ8YjbxpAYKYXPvkbmqoNnO7SOCSkTgI5pvlRsj8s0Z+ccwhK9RaMd5uY+/AUEApnr2nvCSukJJIYiTDmXNM9zTpBqQWRxLGEeRpGdcPRDM5pHLBehORSakHME88Seqdse1rPKsFNkoHbiusMysvFa1HcoWZA2wsSkrH5AaVTAUk5xxCsAz/MEfQMwJSTYJINAa964lKsYqO43VSFHbaf7tdrvvXdNdxbFRyv1hna+u3xrjpI0poZmYBzGRpDTtOS1AF/LC8ix2tyn89QD1mTNAcbqTcC00nsaSkI1i/DJI2IVyYm8mWzIKkrKVEopENvQQYSIkqMoptzpSb5vkDv1Un0xBGZZZhlv3tK8H/r6+tAyAFsP0wqjIK7iydCpFdCbLfZShhwotBNzDRCEWdcGEiYDS/SzAEkYFec71SZtOMaQcsnJBhJILtI4qvWVL6jnuFeeodKDhu+c7gIw2sKlENr28E243tRiiERbsoY0hyHSN5DWLlcor+TFkBtqMsBwPiDlDVhX3awiaO1es2q2yOAe3ZArOd2cpnli9ToZmUFJpp4qn4KJsyRDmVC0guKZao6lDhKgCeRkVCMihci5GY8Jex3hQchWO7RYQcwLG8zPRZoau+t1yIIBcGDZjfU1EGonnte8kJLY+ozEIDcxEgA8zRUIEeVEyAycZA5mshHubVdyP6LOHD0Dq0OZ9krzruq+Z+1QpGr4N+gQa1wEU8NGBr3dBO9SJo64ljUl9Hs25gfqPo1gXzBN4QIaFkPAS6axZKKQp5n5YLv3FSqTlkn1yMjBmUOFLZSHrGwFxfMMKlJLZmK6HPLJ4WyOybHMfUXAugHWlkOPeU3TxD43dF12C0XgTuUQQ3iEHZodpa5iAI/kEVPFGWNPSKYsARaHMIgneBpR4iqJ7imJZlMTfWpyiJ4yugijOGoeFvfiDXxGvau695yhEhdQXrfU/I34Xg1AptHgc2SqaSF5b77u5EUZf8z3wnQSLFap1t5mWgLwu+n0erXJbDdfWsae7xw/IFNU5NZpTuMYGiJ4Uyy4kSaJ9x87XKkAKGrSJydFYvVocQx39LV7b4l11mWauNCZiiafurD7i4xAoaCjwux/AMXKtQtTCVkRr9yEB4RgJi1yQ0kqLRE20oHviPLmoE2lrjmZJAPgJrdp6hwmoxFMnbRXLNIeugi6o9y7qrvOdgBVoutBYlUzfBu+luRbIEtownmoMQN+4ifzPuSQMNyz+wOT5ycTOOyDCQ2wTbcvPz8+CaQ4uMfRB/JK2qQRqY3HTNWlkVJdC695A55nBOxLS8GVMGskmhkp5qlh6shlQZ+iiUY3XOjdOp6Z7FXuzl9DNEQRAkeYSsDCs1NqIHY1FB8T1dGhtI5ZXUyoVKQRVKnFCs27rrnBThMCBOlErnHpXVKDms3mSo60zw6yKeKG2exjjQPq13Xv7Z3RnU/W84ZBtJKPlWeVgG+8axeFRAMx5qEvWFdjnpZpjZivJkYJOY0El7TmdAOrYWnsGLPUDg8vP7h9WECGHOJO3uzk4L7zASMNKonKmCATcICbOiso7z2Wg7OCUgIlIQVzelLCLXzpyxIkbQbY7CzSW7ZjZj/X7VroIAqErkQXAsUdtqtys1A9SppABpENK5HwzM0EWdFo5H/3r53JegQF8/k4c1kiweQJ3agYiTZPqJtsyDRuR99dsx+h+//d/5F3R/fXegoUEfvd0kHfiq/OQiL7x/XK4QwPZj/e84kvhXDkxDaO4fVBzabGIUtAPNzkxQ+jX8v60XR3cQNguZN6AjjsuJvAoa2VZbqBCpZd6FhXO8/wc5eSUPbMFGUkINC8qSEPd1p6Tsn0hmaZEc2Cx9vldUCEqJ1waK8Wxyp6BMdYYBW3gO8E/roeAEOWROf2Slh6uETlEHrq/V0vcR1WJ9vcbk4IsKspsyNRh4UtUlPT46OF/NFrQ30Hut1I99/+M39ifXd0v30N0O+LBAWBpW/HQTgQ5KZERhAZxcPRNevuQz3s5E3tVWardsGR/UCQqHsZABbrSx6PF+ST7IKleCULy3H7CZopozLlngFLhwRuuBK3p37nexTJq8jGlMnkZi43Z1fDkutCtD71OaaUpwPW3F+tRT6NFQeUYGCH4lqAd8WmBopHFB5YoK8AL3MGIj1kCSkdaYCNlHpH591TSzW2ShqnGyfVmvvR+3GHiKYLxfT9B9P1NG5Ad0S6ie6vnuLP+tr5zug+HV/tWAfgLfvMt94xOuaMtNrIkgeOfX9yP0k2nSsgsJcj+7vXeXtIj4lMY82T0R78eNTFcrrsZ8uu17zCkwQNCg10oIHkGasDrsRJy3NcQ5XjMhhpoJg0AW32Nr0+bwxcmk2dmM5tXt0PPJ83aupR6S+Aemx4AWKn4vZ5uC/AAFZoDBkZgBQFxBmWJSE23gH0Pe13QBtoxPBbT3BqB6by7vwAO8nT+yCaZxm282bTwVuP66GqN9P9/ga/9/fn7/3gXdIdaqqYdb24H8e3WW+XSMyQmJKCwNMxA8/gLZnRdzKDKvlOaHd352f7qM8gEZhGq8cdxFVNVtkL8HXfeT1v1BcGjMoBjDF0QsEO0EDlWczPhJX5tkMBCQhvpmzNwuyyunfOh4fjKmuET7SHc011UUX+vei9sWl+x2exxnBHeF4NjRvjS4tkgLIN03LDFARVWt61B/UhpjlZUsgmg8/TanPHcrceW+di4Kqf9IS8qa9CVV6Tvqnu380/+A29+t7dzbuku4i9aO11D9Axf7sdxDoyoRSEOx58nF5anOa7R2SOCi5Q0/U+1Y4HkBQNxYMdM8aGkHABlwOwn1W6Nn1o3EfHZskx0JBsE63GlRQdDLz7KxJAoNFNgsSI5kbHsU29d5rDwpdT0zonD+vDTnw2gBKBwkG9kSgDJWJ7H6BROrGggBD3QtM8LcKV9RzaRpsDJVC539F3cvh3X6x8Lq057eY0HR7OH2olLDZaxIOEdy7fm1Oa9AcXAC+j+/eA9bOb/nyz8/Ht6n7Vsr8WZ+Obv/F+3lgUgrE038aUZZgCTyzmJ+v9/rF1j6FHbg0ktlEStQdisJ3lkw8JLE8vJVV3MojkFSkybLOMDNEhG4yL7GTYKk/IoArj/c756heUQnYIhp4m2roy4TnNh/VissO0pGg0Tm0971ETGj/gbTzsERr00456A0oNbHUpMZnY16Chqh7UBqRB9kTkfWxX1ghpI3hKcnc/HqZ2nzjfTNfx/hKXb6dTvXsKG3NyiS+r+/LdW/yf/rS9/A6O74juVygBe9/W1/nbrY0cCMYwj/HzW4B4WOaYFzt0005rl6Dki4w7y47hSq6IJX/uTxSn9UrecKdXWVTyDMKyKsxJcCSWR/0XS+csoXHvfa2fIlkeNFIhQ5u3o+mN2ZVKa2pSM/MvbTU06x26nv3U2/rCR/GqdNyPagEgrVkqlNkkwiTLqMTS2//ZxQYJgw1zmhmag05vh/v1fn2AqfvNMXTnJ2lF83j/qcLL6v6P/eXD4a//6Md/8fju6C5ET5R+yQvl34A3JIoHfvj5sLn2ig86Ftex72RDSYmdPUSQdmV7hI3Ld38RQ6pcvX8QuEYi4JKUkYAFe8oxBMVIyRYNMHqvQxvFB1NICcJdkYvCEc1daM2SAbPDSrlNy6X4K0BUxX/bv/mwnieiuEPxKhlBQ8TeLEOGE1ZdZxHOQ61f2FWPl9ltawXe52mappsn3/7wxfHk7rXahtfcRavhVlvy7OlL637/B08+++Qf+RyvfvNd0n0JKfnaVwDJ33rnpFJL1vj57VDMQ88DG93OnxignchXzLrfKGzrvAHrDYfL45KfBK6PCJmkG1yGogBbQ0pd6/J9vz5+Cda3KGWmAbOZJwUoZOS0tIO09JucclpPl4UCCy01KKe3+9xHDfEprhSnOEZ4gGOJBMDMmYTQGxICbNRP5tEpcO23RTMD0ddMUI6kTRl6effi6epqdnNV3f5ocrt7Mtfw+nI5Ger+/ls30/2Tj/AP/p//+ot/3Xf/9v/ih98D7m92bGfrYmXJp/uOq459ONf4+I0WbvIJlj0cS8mpQxOjr93nl0+vBL0mh2qmoI7Y/rZvQx61vuPnnq8qaCPikD8q8wCyO0hJRYIdnFfHiDDv/hOXZYGSiIzMoBCOyzRNN3Oi56HJxZuDAWGZfsPVzxdW/6FROb1dAcZaGyAKwQ4HwOojLwlA3foECdk22iSr9o6WeK/FFxBWrijRm2Bu7YB1OvQ4LnnXIc2K04P3tv13p6uvvdff27S1AsKiv5nuH+F3/vbf9y/7wf+u/fRmm2R2kSbW9jamThYAzvocuqvj/3+PUTyzi+mNh+Yb7AweGLhRWEmEZu7W3EgzTqvCJaP75w7JoqIi6O7irznyZgK/ovSViYoYejBSVqRQUXMG17CDzBTugsXDXd9xdltN5prMZN5javNhno/zYZ7Yvc0Hnw/H6Mv84ZHEzq8rAzt4guwXEb2olaZLyLlK0QKW5pKlEWVW3g8276CXZVyRCMgYAOtY2WJln27KQsrpfFy244zJ7GJDV4r+xpRh0+yVRRBQiAVAemm9P9+88Clrj9+3zeTBkgsvefPjAGCODrT04e6eFm3f5n953VUyvAq1NmjqO7mrkn0DK8Bf1S6iGq8SboeVuG8N2gZgKlLGvS4dluG8YauC69GB9wZNT+kss20/HjeMk11WWRLpnBpHVCMVXR2nePicG3HLxOZSyJulT9l9OhyeTjA/zIJnm6b5mLq8JjHY7r+F9a7M/ys5qFVFdICCpeAlXpZQbgySNATAD/aeG+Hu18XhI6PkiKiYza0eTX14XBcFwtt3lNS8yljL65O5OydXztycbvadRwAECJTIt1j7N3vBs0+UAeCpa7trc1//vvxJhSuwVVWczB5/mI7WWEily933XaVXgKeup6920laVeqAspPxVrE8DCIMMJJxmRqW6T5ZBtzKwJrOzAgD1ZmU/3oXnq7gprxizcECMx+2NW/pOMaFpbIYrlw1SAX6/T92Ssr71UopoZocTeLw5HGZmajrBPL3x2QT1QjpkN/f8fZID1CqKSdfoyjRjxMG7FOmZAEo/NZSgpIcbv6e67ZxKpIpECMoMWvlcllxAlSdSx/Hyiy7L3842f6r9/Ok70/7ZCye25YyR0i+zr1n9xH2G/9bYbO1VduLa2G89+Qc/IHEEW10FUhN83z69zF32fc9yr4DnEz/54HwU9/Qmf0U7t8lUGscIi5Ib3QiYenOwZ8VGNtUO2/0FdE/ZnUz0kwNPbYauJ8I2iVndLlcq7jMHADh3FPIv4QSwL1qLoBCuHvLoaV5cBmh0+tQm5sqk3GHTk0ObM9COJ2/0OU4fHBuBWqs7V3q3kmCpSVRVCWvI8JBnSmFUubqSVBa6dhI+UOQeASIgMQISABOkVFB5t9iSCa3mdiooFCY2p3Pbd/DCusUAwOmfv/nRcTEUa/d9Nycu/nkWnamvtj9w8iufAHXqB9u2t+lIjwLsju9xaefe+H4zesczLM8vv8WiNTUozrKHBL4vSnpnwo2S6L1yfClsEiXQRjjzQMEFc/feprwk0/O8Gcqp+wvgDYqIX7y492e28rGe9noLL4esGXo7DDsggVBAIOutwLznpzzJ4Tgjh/nNxQgzn9rkbgatSz/cQmZst9zT4p1P2aVAmWPNhNKxWMqYbimqC0zVFCi5f6Tv2LlbX+8I0BACAzJyNiX1Vdsm9aa2WzyTW5seNPLtc1/99B89fDa8efmBkFZ0sWXlUlQK3+Os8RKDQlxxnv/062VNJbyzs6qbveulP370YQDXeete+f4CxO/9RvmA5z9NO+PQMEMl+4YUKpj8Gs80+yQuCENiXK/D98gUNPwp9raux/XgYdbM5lCSsya08NJlY0HP+dXk9jTW/IpeklpJBJZ96XUZr0aRDezBZCDsrQwT496pIxOgueqDjk/tcHR5Eyajt5ub6YQ+sA49EuA7ei406pqSIMJXEkrnqhYgsoqvtDoi4WLngzWSZtdDQISOkQe8mUd3D1TMbJR5NB2r9NHjd8hgu/RWsPKRJeeYbmpjAtpSRR+KYRFgoV4j7TaafuBm38uW4PLtXp8609fVzqlMHcBuDGcKvze+Dwj61u9VT9ur6andNS47uAAGYIBf3/mGXSBfA9LjEPRemCp9A3HFnHFMO6xKmGlZDRKabGF/GYipCLqvLHMyst0fTU3U7vyiBYOpPgdA4Jd97TmvKNJtRyFUqtE2VhnqLrU80m8Ox8EMkpnR5IAhsKpNU2uQt3k7ZtXh2FLXQ/Y1unspFxZmosfsWeLDWJiuIOSYkv34r11DlRphgMxsnSFEIiYygnb0+p2DarEYA0wWxsTF+riA8HrpofDKdZWcyWI9uP1hYDfG80OR7E5fVJ+fsr/2aZgXTxN449jkC1cn8r0oPHWsLEG9+xFliMR5x76/FKfzZ4cPgYfT+enTdY32IK5mIyzHmYpfu6o1G5ZZiEpi2w4ORtQRQVdr8mvZ4mpJEhxGM2ma2cCjrb0fLHuyzSip3hMFu+ehAu4pF+stlxufbD5Z/2U43sCyelYhbF8SINdou0KdDPt0nzHZCxcfPPsImBthDooTOc3NnY1irN3phkhoOj2+Mr4OpzqK0oypCOvmkLKn5FiNItE1RZA63XyULqLO8+V4y0jMqmSNMYoplSRuNJ8cTsoxP/waoFsCdP8EufEjN/qGGaON9T8DfnNhfXqIcTj3krOqwUtHfoQADM4DlYH3C48UTmxJAGNniifiNGrmHvleUvvJdPPjzCfndf1B+8WGArVUkZrcReXXJS8s2nnY4dQgv80XF0Ttabl7Je2xawD/2phRUasaN2tUsvlE+kZyXPuD1O+cM03y4ha7ouvOeQiKO6tiMU1rfypN909P66f3z9+Av1JDToILHGBB2s2hQGRLAMnnHD7nzYO0K1LreINHJ4zFNxJkCs7hyduJeTa3eZIRX67Tkbku+Qhq8F1KaZlTwQs8O2Yhz61r6gRpUgpNxpRcPX2ENJCD+LBGTKUDNvb1SkSBCmbhokvs3HxS5vexigQgcfzGauX8hWPJyrRq7ynWZG0MhmdKf1OsjD822N2aFahZ4N4d052bWj8LQ1cms8q99F0jyse/hL06un7nR8aS8dMCCuMISUjg1+JY6mpBdQXJGpJlh3foiqMxr5CNSl45bge/QAzAX5e5EylcojkNnCS05jSaGXJelmTvYjFpTJWUuEtZd85DRbjufTE1vPYP2rr8ZPmOPm0/bPn4kRVDyRGR8CR4pQXkNAWHpOHBnAzOqSk8o8CoZZb0Dy5tFn+3DpUph+TeNZs5BJi8Z7gFtUIDML9Gu+J/W4JLh8GnPKx9ujhwgbuFQibLE/zAcuWO/LVkNUdkU/j5WJkItCoKpORFyI1Pbj/d/qmBD7DePlmYuZ472Yg6rJM8AYDxyMux0u4DV83FS5HZAPTKE/+s2mjrmQVqyG4mTd8DEPfWdw4Ze/v59Ozub/0GIFaizcCRVninU4N+4iBnfxdh1XRaMa4ejxqJKzpqdxwYXRDKuKqEX5sB0+rvTYqNwZts+EFKSKqnqg1JlTWZkvcwHmg07PHc6f34UV/wkH9y+ez7/ulnEMXdacYkiTpbKTQbAL2zLffHrbVvhsZ54UbroprzFGd5xnGCv4fl3Jhbq5OsGxDN4W1bHK2Zd3ljxgJJe4nAr0k+FJ22k8MWJuFMmVYPrIcNAsmNbWjilvsRy+5ufIlITATYXCIxO0jFIS8KIkM0G9/+tXtfibPXUXb2wo+ddqWW/7jgxEgJHtvYeESCO0cBbIDg8tN/+B03PvdYbwXAuLFcHVQXdGlarfuTsHslzJsA6J76PiZt/t6f+rx978XfFgvJTiqwnldA+O6/h6yod9P5RJF/4utwMOxBgRKUviMmtDeu/cIcHCpoBVjvuFkIY2ZGmlHL3MzYaHXJA9ekexFURPZ40CsmC325K/5QLXnn+ds39w+p40eXX5wuKX4FX6udVK9dquB8sNfzTRiumG2IcCYuN+nka5kzg8iRgwkh8ciq3oBFo+i0BituUe7mU/NYQuppGWyneQy+voZ/FtQ+MuZppQdWmbpkc0IQqIBZMc3jP9tp2wZkjCtHRUVgbLpKGDpdhWJaV9M3v22+SSePv6CcutQ52c+38gKXhrNibc52tx8FIJ1d9gPPdZViwlh29eQfmfSI0MejGQ2EMdcLx01+CHynSkHef7wc+tNPRBUSalAP3E1r8F1+LwWrg5ghW5aGQJon2PphSHNUQGmHQaPt9Igq46jcRiFyZ8Z9/u+3pERzd7Rt21umizIJ1VBhrryaaJJSx2gpmWvWOnTDz3/47b/15GY5A96iX51mrn3AGso40pYepiPssbk3kHzO88KY9jCaAeVqYDfucQfcetZU0iUhKa0VR7ocCTOBgWmeJUBf3z8Pbqw/dE65AKGiGNbpginToGlPCz/KGxbFCVKU6jdOBSQ0CuoKw1asa8G0Gw/FaNocvoO7FdYYR37p1tqEMjUqg/jW+MtH28+8KQznCDr6xpWM1ZmqXfbj17xG9uhyZhDdGDxhaC2pHYfGPfV9x1AKRD9+6ydU2UPUoCQ55hEpvYu1Wa1OtSogGAuPhJgeuvY6dXjKP17A51HcU9ehqDgcpx0ryg4ucEAqmgqslASe+LutjEgaKbBtDIadv4mOdfJcgoWJ3Shd5a5Szto/2AinAXkFBMXxkj94OJ+LUtMKYIiP9vUqJB2M019COTjZBOCqyto7j2HQ4XMOwCHacrWxtsSDDC8aVExzukBvnj5ZU0S3RrgZj7fGiZC+ztaItubMnsFIo9yyG5TGREbguRTDg6w3llARyTpGJjQFFYgWWjO7dzs/bbQqjanerJmtOBwHT0wwvq2Nigk/uggw5/9WRX4aoHt61h/XlkLtwseaXyicuWPk6M6xDxJQapB5S0AK+975Pggl4NVT1vwVSm+QkdwD5bZ/90ZSJQ1E2Rc4JsJ+C8XzKMTiHAV8Xed6TyvHaa8nQINioy85CqpKjygPnvh1GEDS3anuh+VUDrs/zPz85vbHrwPZ2qJ/Tdq+gUazQ7eyAFAPdVFAPP+8ze0lAVWh9GbOE9XqjcBs571dkbVznBxYQ75dL6HYwy4GFg/F4+yWJChVXTSn+TwZrM0tTGGEZRraNBnr+/jaNlrRHT0BxymVPeQWliLmnNiYB76wApScU+G4Jo7KAArZkkIXTubtVW9mgR2muOzTSE2QgPFQHfWNwwQAvO/8GJ/sILj2tFt567OKdv2Hrg50Ue8sKPL4Q8y2MPz+bzQaABACZO8a4YW6DzIJTE9QhWFfZe5JKvGdPF/0cjBuQSj7k0OUeUTjh7/OoVU3O/VTAFQA6n5XY6pKJxRjwiCyUuAZn/wSIE2iIdyVPJbq/wlnRmuvX/wkodUo3b06be/1vvNxcrTqI1Vio9tQDbgjVlIgoMGhGhUVErwmkVSIEojE43TVo47TV82LVHPimf6RSso4HuZ4JDI36IA2CneSydnN1gCymbsdnQZAgqCv4xFy67i4AoZshuzNQqJllc9SQvp+7zm4oeH7ypDW5CpnyXJcxSwcM/jZnTv9WWortIor5EgT6dBVANCASsNxmJ9egzl4HuA7TRVWzsnYvro6blzLE158Gss6hlvPWTS3A6DdVcfdi3WvOlLL9z+BKAoUyjiAvf/uGLkxSHynRkIjiwUoMFqOsrcYF3CJHPe740dGdD8AKrbTG/dVyL0BUBrcVbmSIMcJnq2NZE8jpZA4M5Y7TDOn++WQ7utPj88/+AOyocNH2NmCz6UyQlZj6OfQ9McrmUnPJ0K1tyPLleB0b7BmKxzEdUl55S2rG+c5zzfwNJhBwbZoaLn7U3ck0Fh9a6yKJdwPJ4MjeibnmUyYlzweXf+6bTFu4byoroYweO/obUMRzxnXzrT/sZ85BljJbkdijGNjy4tcj3xT5CdtdeetuwuLiJALY0yRQHxEVNKoCC7NWNAGeHL5h5dnvx0+ZFcYd6pGLl+exgBys3/joS6KLzTvse87KfzkdYEQWGiAq1qLBRPguzPSS8CEsp7kgonwULxBkV15/5e//mWOJW92pFTt7RqqkHviGYCs3ml0pGgSz3QfyfX7e+bWDSgfsrXbT7tHJ3B5eTn5Rcp6FUvrtqPN6tungYqkMUGovTvsW7J20RiRuxsCSx7HyOyGaI1ioYC1Hj+h6lHjwudxcOE6iHXxF6SrxYNMJ1l9TZUrJEiz1ma3abIkpUxMchYTRre/lo16nUgXnVCaKWSMjAyYpjVntdS6z36CJIsbg2NOhaykRjEzHdWaJiPZbnwfkZENIgIIJCdiZBKNltAk9gdurJR/k3YHUHusdqeZn3BDRNnMWL8Aa96dPgceKtY99X2nvnflE/Yqldg1Vc63XZRuwMP0KlwUwytDYRI045Tjav/vfpy307IeGwDtjKsep3ocq2Klt6OmqaTaTrY08gRP9VMVkSq4m0RGB3iT9whDzvNysl94Bz/r7k0bSKf3l2+fzzeigGRP7a3+verTxyPoVrNCn/7oXsCn3z8Xn7b9jnKmksitbPM/jr8OFDjyMb+wCklJXmQN5riIMgM0U6FB4O5XlgDmBqsglUYlm5n5ZNM8zR7WjtNxPloxfI3fbhWLgBlZ1FYYco2Eyn6eKnwP8qegcyNNlniRoogiqi1MCmaCT2PJYHHPUhAHSNphXv+F1eCrg/FHXz8SvrZVnvhyfzabyXr+VOkRc9DP87rv24Tkwbvnvu9lMEBRAK9oMWTsnkh8+8dL/bwRbpBCtVykuXyGlXEKgiKcOXQeD3Hyr7RBg3fFlVFRebKIruJOoyhr5pkul0AyMqG04/I6DtEUBP34wtbVXid1mj+gjbv91ic4e1RVG8uemKEbT1ZhfWJ8PUO4+7VPCOC7PwX24iUwxnWzpwEK2r/h/5nEnpTcfQ+oQYhW7edA8jlhKDXZDTIPLukQjIKDX1rS3Lbx+Xh7JCfagdvrRvY1v5AAagiaWU+DlfgtXCEkM74jYhM4lu7xn3tEJFKCyQAEEEQwR0IkCPbrze897wIiDnSHd+J7GMlKzBrFo2/qfzjTPY2+SiU/O9VtF1QV/f7H4tbqrhAkGVgfq9x737mXtJ9+uBcKaF/iLglmIN/68Tj2Mh3OYr52RtBsqO5FCWmO3kLV3riv21BcxOCOCmZSqCmBq5QYR0p6gooOQVNjkkS/2GFSWBj6Az2JaVlpF7QVxixDNHTZmnesucIEtqAM641W5urkzVPApTWBuL0rug3yDZFD0VUqHCsyWcG2mygD1hCqq72qAt2mclL0mAoJj1hpAYyHK0k3MyIjaMgU2+HmBLWpTWDZ1eTQ13GkW1UFSYQU7IaU5WpdKXhgeuYnlGetqLvsL3JDSILMpCAKGWxFWUBsSa4af2f29JfnJQAMdkOOiwOhqS+2Mt75Z5Z6D5zemS++UpzMdFdMTmlC9FO5wZubmRBJxnRx5576PgzuMWvW3zv/Sz+9MjPtWSgFpQi9vRYdhGlomjRShVLYMpFd50ZI27GzitDgw75XCUdARNGdqqPRJ967Ryk3lKVBcW6vjx3MMIDW8GH7xM9rh8kVjCue5L7h9khCAKoCVlsh74+/+SOEix07VZTjjm4q42McK4NRJbOS9aJ9tITa6TUIBfvwlGZuduhcFNCdBxyutO3AXKNEk5GC1C+Lebs9wmwiyl6l+r+2fXV7QNS0MuDMwArmRXSz8pI50ZT8CDEiWbRGmbAENAKjJWZUZ0y8f7B4/zniru5IAIj9G/NN+YE9JVXn7KN1ZbI8/syXMvMfiMNdn6m2wbzBW5M3b+2evO6U8mXy+valbvte+k4NqSLid771D/7Vx1NmIiOjxohvqeXApRLgnTJmxWBRn02gaG24WHvV9nqq/PuAO5j2pY2okiqlF/beNX1hDzn5jYTZZnAX5LagPfR+SDdSGeWtR5FluJ+kCFp6OHLtaxP/+wJwmF5TZQ8NWgiEOAA0d+rBvvwkJ+22fRqlh/s3iH5SxqyJqOJ8f2lVQApS1HIFbYXRImF9ScVy6aKfjk8cQ3XqffEvREklTAYFUgz1FYiwPJlTV+CaIrHvez1OkJSpFCnUkGMvzBUSKMSuHVVL78Hv6A7iYNY/cGNjGgA+xiLkre66uvEjwLrLFzRWK23QnJUoSmN7scnn+O7OrYLO2+W7v3WfWkV3CqD47buf37BE4hGMSjkhYwjg22thGlEb+Gzmkq6/24sVp+q49vZ1pAI9TviAXAaMgWQGBukioWm93z1Lvx3jjE64+yUdbC5G9NvXT/zcdNRUu9wFjuSr0q97x+ss07zA8fHzNujACoHa9iA0RhEjyOM4xI8/F9Y//EkFIfnYhhbjkud2ysHqeFCgkEhP77KcYyklqExriA1Ecl56j1UZSTe3ncfuIgDwNT+mWIkcI7gmWR+zKdi6eRpblEzdYz1VgFT5FAEqax7wRpuF0MjkwJ+erddmoPvNXagcAfB6SffJ53i5/pgOG5CTK5PjjJ3Kv7kdyxI0lx8s3splnYlPfLBCK9V7VBs7EnGH5bNnv/HbtxBRx3cCIyDWNdVlzIrCN+yjoyUcrT39LDygr2T6AWXfsK38Gfe1V+xRSSbABJkIlgPMQEZlXNt6v6csMbDqykYtBNnmdoy7yDz/knEKTS8UqYQWrELyQR2kIHGCkzbsiDpEqxw36KAiUI1lBSkcDVjD+r/9ep2H7Oau+sIYpStXytbUbRynNELovAgtP870khsglAGLBBMI9UjlKub5Is5TA1kMKMnxNR5xE8C2SuuGwGRihfe0YQ87Ce1HSNkNr3tuxIQyeKq6tFyaonrL1E/Otgi7VaCDhzNv/NrTP0Bf/APtszMAvXZbngfWetTbjH2jPll1J8RYpOETC+em8vfM9zxQckhL4fc+mH70eweKgPYStbCtaxDZlHobZWiFlH7qdNmhYetJg62L3W29pGjc194V055DhcCDCDI3euvgClAVRCPbtSAMjHFAJNiCaUY/unk05Xr4gf+sLXZ7MFXrVRFGm8QMRAAEdnS6xwrVcZTYafRM1B6HqBwNmAvr3/kPL08fX3IV0s2+tpg/APNt2Kqpc5V0TzK4N24CwVykEAkzUj2VWtZ1Pa9qIIqBFPR1f+UgrCiBpMKUgLqrm+Ii8qnTcf6uDhbVVb0osFHiz0g5KocsCsAmF7H6uomyT3cQ6OCx3P7U6uXC/FYJYBu0/OTvtY3yuAqQ7DrmWT+UMhJEE3v6QgjDe+Q7ATj6zX/qz73+9btl3heiZh6Eh7XnuixLRBGeb7IMnZA4EDYq1aG8Ud+gSEGZ55rrFOOEWIlX1QiQsN9SNQ2OgBpBJ3TUTNOcQ9KpsTSL9+2KVWEMbW9RCZgDzch1FmbxlX94WZ/4NFrhUPExQbntTKJiWn34Ar+BqntUIXZIRl2sFddv9GcK6fyLfrhSZ0NPA8b+voaHNHVwIehsQhbSHanYQxqSZDurcIMu9TRvlFNQBwdIgsJ74Q2JUA2dB1c5ZH2hEi22efqsRS3v2X+9UCVDh1LXrEljpgyClib+vWfm7nh7ebqj+zuyY+rZR69ZmfzP9PlL75sEAOPRcaMAAHUvjq16uWIzgHRWaaBpd43VzVJD0fGTZw77G//AK7FKqx15tX5+6b3gpIZa5psbpVPHqkZ7oBBbEBpaE5Ed7YEunh7+4VhkUt0L40i1PS8Gt1Q9MgUFtzMU6ehCaqU1OBYLkOx5wKe2ZnVAubZ2smNiRsDbBzf29Gq43rEdFXzRmGlhD9qLF62KR5wHobBCe9E1VgFh/Pj7wvj7v3B4VG2U4/b3bjiSyl89JMG0NStQlwPu62A5T8aJX9qyXNZESBk2E+jZrWCTLLGQvubn7hBQKqGyDnPkhhS99dub0DntmdnR5A7jCU4bkmBmKTGB4fLQT6EaBT+dcfkIy21zuqM7pCLvFQ7EzcdapzdJ/jtkPGAEAJLze2q4K+W2SDgJSZYCgHn3rX73A817fv+oV376YVHx1e//S/V77af/2r9RlRq0FSRdLi/np/ON5U6OvLFUSV8jT5boeZxEOGU2TARQQ9tF89yLTz7cs6EnDTbwI2EiBGrHxcXk6Ov4YQyhAUvb3q9twQiPeHOzTGwMyel4bKfXdn97vut8/vxocoqgXu/rtrkw84NYj7ZbBFB84aGaDjvOFdZBljCzx/r1l1uS6rf/7e00mOq4CsP+voeI1m2e9UvYnMh25UZ3pIK7BQzICJeXe272WNeuvgZmzpMGevIK7tf/8ir6UtrWTEMioy0Y5nbOeTs9cU4I38OftvEbM1PqT6bMJHBNQhIg+s7n2+/0/VV2xeIFuh9scumtj8l38OpEVvlIPw8AJCUndNTtY7EKIIN0j0z+jfa3P+w++QU4AO3a6ftrcf/J699+8vnxX/t//ZEwJrQAbvag29PduV9qipLluDdah+v6wh1GzpiGIO8kt1xjeSiWscz4/PlowtC+sp6/eNbck9hxTVi4+DzHEOPQhcOuacFJ+a3FpXEMzCIJGUI0tOPl2brc+WIzJlqfLA6E12bdF+NR1U+quH6xEboeRY3R014g3WM1j7/2c799RJF9lc0RY5zSjO02NO1WCw+osA2STGSYTa1Z9HXNtRyYITD8qohf93NrwFSCX2QH89K6vGlRJM5T583hmVVejMSm69EBZcKbpMurtXeEhADeIyTC1HYXh3C27cPZLlUk4I57QgdgZF9qSXe5/RMr9eSBCZF6YdFKleN65M3KRN/fwCYAvXtmf+f77heHXxtYXSr+xs//Uf7Bz6d/9z/+2b/06V/50d8lbCeLVTCnk2tCj4yhlN/g6HrmEGrqwoK7fUHsIEzgAnuHrayHfhMTdk3Q7kKcZ56Wz4/WhMHJwnvG6cl5oRAge0DVsrDJUIShYtEYkoIJJIKME/sn8lOkt8luP3SsUxwUUFGfwdhI7QrWjSDoDYwd9BokqwR1XCoEC6zG379xe267mkC7EEKN0v/3g/oINceIrA3mjElp9czingNlcQaNGYaONjVObuhLYl1Xjsw58L83XkSx2tqmpBsuSPXUaeyvN5ilrO/5sAFAicjeUwzEzU0XpJhglCUFTf02RnP2i5//4vkZ4FB3gVaerK/OMoUcIJDM/Jvm2Kc6jxDoFyDhKk41lXdtbCoYTO1PMQydu+nzL177Xk1Dxfknpgt++rdvTpd/47f++f/9j/4eIKiddEeZZi7KyzlAkMIgPd/Y6JIRCy846BBiv5xv10vXuRGv757eANo3Yc8SC87H+NH5JTnoXPbA8q18BSj40Tx/qO7Ye+5JK1pkBYaik6kQJkA05Uzg0Npst882AjcO/PD0MMfRrO7AXCEMld+rPwchrgdPICShpNjlQ9k+++XDE2AMDjQC1BjdRBM3fU33SxIm02jWFNxfYRj8oeAeEKV0upmlKbEuSxafaMMl9fU3agizhGJOMBHMdQ3I59SUZz1jOX1mX0YmEBkpXF6FQrpmcoLiEnUfrOIqcxGWP/6dR7Cj+3ZVPb0Fu9WlI/ujX30wf7tAm4uwZh4TKsV4j9MLKtuegf2RNE29e8TT8+/5NQz17u3D3/v0t9Z/9L/wL3v9L/zrn3zrb5ZI1NQHuOr8sOrOcJ4OJilFFSy+gWjitrIKQuFxMAVZ6e3iEhWKGkCL+4/1q0zDH0YfMa4uhfjh2dnuP3y4/eRJQINbwMMJH/8SGP0WEvK0wpQsjkM7FUWMe9iRCG2QAsUu1izgABALUleQMeQsmUKJmJAQxKeffHnGS1v6zQsn9ubXR/zFFLwiwCuKHT4V+psX332698UN3FOT7Dw0G5HYLZYu7bg9pHFBdMayGwRKwGgpGmgwb7MrGyNJnc5pmAMZ2Asq3gvbqOOetJRn9mOEwUnCm7ciqxmMLIzXrXARMBqw8ZmZQJcIgAgHiHGCFL8TcW6BMuh3AivV1gFicHNJgjE4wNTPP/m5x61gEJyF+jGQ4FUsFxEEWs+SmsVEKAew0L5CsZtLmZNSWoK3EyVSL1k+rc69STevzBA+nGYpF7EfXtthuT/dMjk1EpWKb6L61OfTDSk9kgNxl2HAEAugKg1U6PUobzMfnuf1+WaPdZlO5+eX4+fMOKwyDI7dCbeVkCi+fWnJ4YuJhUYnR4+JcTzka1ZVSgVZTFoSYibLqbbROTJMrmJneOduivDz16/w5HsfH3p7cQuW/f4a5qy1ZVKW08dJ1eN0y0ebHST29uNxDzNbmf0GcycyZYPP1EWCZDX1dkcIViepzbAJjgZibUHzND9zNWNyiDdQxHsVO4S4F+IQmTPDV3OzBprZqD2L/tdspFBhGHp+zDINYyQkoZqSndM31qNBm2zZi7WMxl2npw+cdisYH4ONXdifDmTElZPB7jNw7ZTnXrZNyBEnoy5vYjiGML7HXm9eVz5AUlj5QiYvGzd2+frtyRmy4ql42FOEAMI2//TV8el8H302pNFJVjB+pUjGPMDB1iImjkyhE6psexwFa9+DgV6PcPTzFwDte7+M9arne5Sa1436fABO9zs+C+btYQRkgfSQZRo2NgrKodaG6iuT7mFfYwWBKueZEBOVLlqNZCwbNKVjHswd9I4dH37/T/w9T1/92W8fwOIn97Kb3JTWJ0ruSXYgdxwgd/waIEC8/tTrFIid45LuPY0F2t7GGFQDKP0SezGwm230aG3DFrgmYWiWFs2xhsZ8AsTXsWgIYzWLwJEBZYNik9BbeUwkUMbxSOMQTtI4WZYsYBKUq4HMJYCOnpW7doxyUtHU1lrxZpeVnMKZp/Pui11lNCEHAOWViwPj5hGBX/+MCryeswYbW8dMbxdUPLY2BvcWJzN4rfhIijt2qJhjg/iGnUNzxZoxr7oyoGEzCdjPl7tXLx/yZA4XfFCej7eaQ0y5rikvnCBuZNVM73LsYYUPHkCP85HMkiq6nEoiP+rQ4oSQX9jz9eNPmgeKE7j/6PCqs7eBbsMzJsQsoCbIpOouQt0bPKqQRao4LQgJyWZPFqgoDeqnbRxughiqld3i2cTj7VyCyTvUD+AwYTxSdNwRrCh2rC/wuxvIXS2x+q3tQ4HWrJnQKi45YrLVA1Uf9mIko2AU0kw+MyUylg6fj1RfNroqkN4//xfiARoQRM9m0ekEaFOz5qKh5kINxFXdh/NYZieDmtBAjAh3fCyAikzM8IljJ+bopGHwfhhK2/Wl2oRigrDHpNJoNATQ05In1E4n/z5W4wheLMxwZadzerNVqnSeAF++lzACEBJ5p3caAAAqhgSFEyV/a+FhI3tSjGnKKEKbP13sfIf75fXzE7xZC7Oaxl9x69LnSEfhCCCzzDf2sHYZ4KmBfJd1l+DZy+LUd74479bbNUIV7tPz3zlMq7iDdXMHoPfDjtsATTmwUrvcULGYbN07fuCt8EyARM0ikB1aa5nRlINgXhdFuZ31RIvnHzwB5m//6PLXPyM4z8VNYq9PcfPBj4618o/eVJRdEXVsJLlrMHPCfICUhjXC+KY29oJlXMNcxYrn05TpU6TCI40wpnbCKr4/RsRHFIZ7x7SKRjdzd2Lo2qjxdSOG8BmxWRE4MU5dZkqSULu2KZva4lyxKizd3W0wXF9/8Up7BZAnZ8M7IzMGEAAtD15+nms3d+2bT20MUA31gsx5d2xlSQ8XoQL7IfhKcHXO2kdHl1UAZAUjBLnJo3M2PD03ZmoIARoiaQnl5ZSYJPiFAGVGs43gq1Ufpp0pHQNuIPAi9VcZxB0nBh/0VTz9g4/mR1VdcTFdGzle3n/37v7GWwMGfz9/eji+5O4f9pp1AIOLQoBW8Ds/svW4CW+EiZmIhoUM0YC6s8MgnzPRIqwYC/jPCtHTHx7B6hlZj8O2Nkreayur1+BL9WlXQjarNKPLhcasvA7QMOKj1Ja4Y+6ynFflJQJiaw3uMaHDeLzEdHGRKQ7RFN8ju2EjoKE2Zi4C02CTwQCj4KmqbkmH64bCWyFIumAGn4RAMZLEnqZow+Vbro+dDkps/BTztYlsnhEVOmqY6x0d+e0GAK0WINXE5XxmZ2aqV3f1mq2SXKUfnmjd/qC7PH+AvnMHvXkpeX1jv7y8MqvLOyoCQHK++PLW+PxQ+qF0HBg1RQj7YEFzHBLscJURFi5+5c01GS1RQ8u+c4CwQ7rnCAqyHuPs7/3F++UR1yt+6NXTAf3h//X9735w/sV3wVd+fPnUgRevV1iCl7napRmKpVV1UpuJnU6ydf/rHh1NZjo4hpqziBAj4O7mmzC5y3xy+IPf+fmrOBbcetxO+FGsJPHaV4b9hWaHsbb23QEx9Kp3mylJYofLaBvFIPrRfdP0fgy4qHOUOaz4IMy2LkfXOvvaUt6Deg/9X4hzJXk4RrCJ20tagqCBMJMNfxr0GCuRGWAEgQZQyQnIBHOBaSjlzQ+F/dutqFA0k8EYkioVK3vyxJgoSTOlXATd4fQZA4BKZZMk+kA70l4ua/JAU/sWDutzZIc4T0cEHcC8TAOYrXsZJPK+Wj27ga2UkfKC3/t4Jm0eQmlTCY+geX95iG6xPoQIzpDKDuRX2joGmZgGfYotdcz86nmwjVMFRgP3FdYf/fLhSuEBO5Cf+dNCfv7o8rf+Eb20S9fTOD97FTuPaw9PU8UMWfWw+gF9Qla96D1j0yhgx90NVXVyThGEVQBFHNy7VhZx17ORyN2xj19/qaffMv/gODrFwcfKN3jcOMoya2aRBq8ZE5svX3LXox1wVioi06uBO3uQA9V1XGWJOwIY3HBDJgSRYstIOnOW2cT7laKCLgB6rwzspnjBEB3moR6uTLl7I2z4QlWj8rhaqZOSUW6JJEgsBCZIx5IWxcLNTRUtVJmyJHCWVcPsOAMsaQhMDZAKxTQh8q9DRUCyrlbnWm21eGZ5Z74obbIi9NAFPD2xOV6CnpCkoQ+GAkAbvRgEyIlfqgJsV/ddeO3qKTntYrlePo4gbWtKCQhiGEF9Xu9gmOY5WzrzQA7i4ittFi1GB9XkqMIQU+Ux8StkLz+/+7XbL55/9kHB30HSLtvjSVBIf/3l58XV4/f/vs//t5yzA1fSPde2HlhApi4VPQoVu7LZ6EijimzdO0akCWB9FwoIwsCWTcGAe27loTWbk/Lkk5N92ThWb1icq/uBhI2fjgxuWC5tmK9gLCAlRY7PD+Cwx56Pqlyku2EzYoTfdXumBtvJyua03ahHgDqJecInW61P62Wajc3zoiKJ6f10ugjW4BaZQS5yQZPJ3NzdeOVHHPCajUEpZDI2GAiCsIAESbI0ccRzNyOzXCIa6flqESRm5Ay2pzcHoI8MYvwUrIeAxyld+xi6MdXfUHTa+OE7RdvpPXzOtAMuMSLHdgY6RMpnK2d0O7dnI1iZLn+KNivfFDeKtX1o1K7fKKU9EwvT1pCnCKWlIOJ17V/wuweTMTFhchBWqfjY2CkrvsWoudxiJRMl7oLsBvLZi/ZPP3/x+YefDh7sEYni//q3vtcqsQaS8gH7ClSAgUP44LMrzvWmU1vvbQckdqIVaInqjJBYzC9xXw8KqYgMmDMVBYkMsysQ9ixa3DRtPElLnP7+J4djIwDueUawEuwGpFhc8IxKOgtGgKhFM10OeNWf4uXg1phrry7dRjqMhCPXMaZSRuZyI+qewxvYBt2MDBUHGOv6VIcFKOnzvuuW4wjkymOIoDXn5DQWA0RcN2InRuNjmsCQBwBwRmXBZDkPuWLWMDRSL5gQxTgrRZKm8ZFBU2AJaL8KcL2AEuVkLWizAU30oILrgfZ4vf3BKgCfHmxBXsSKxlgUxlGavKE0gt5ylj6XXahysd4WdDOFLz8IACOKjEqv3dg6kbJLkRU07CukbQWQs2r5e373HeLJiW2FudMqVcV7k5tXSVqw4RrYLuHho5/sebADVNz55E/9zSeHsQwq+VW0x6T4X/8z2EF59WR6dZsGDF2IHiOWlQOJohmtFWRr/4mqsQSlmUswQItojLPGMCIgDJz7AerhPcJ10qb7C/bd2kEoOczGR5UEqkuSUf8GLZZJAokDPh/j2n6tIOfZBqQBkhX6BNb/YZPNIEHbCEzwqSVN3lzdbZ3OymWKW8Muvt5bA0MKJ/rBREzzxAToDRQEko+wgaGAbUjNYZLPCXHOMEFUCEy9WHeTRCgUJUohbK4bJWN6e/VyCM00gbN78ev0BnwOonKTblxYtc48tkxOeK3540Yt6dvFcehm4Np8Mo0AJzTqCEXweMnZ9/lxJ26bg6coCCHkDspEr+JTaX6zZQJOZ9hwBqIRWYptvffxbwhPJzmmCWbpJbUqHR9Xe1hUBuHYp8gvxyHp//jLqmS4aXG/fK+lwC7jDo2I04t8db+n4dgDrmIWrwf7M399D/7J35E/seXSnu4yYoRsSV6suHLtxWKK3XmJiv+e3LbtCEV2bNzQXzvb632R3/3mhVQ58zyKvOfa6G1B+cPv/qKQhSnGxHWE043rrkQdoasO7vky+nh1tTZ5ybc9NlY6bOt4exMDuWVaB1CpjWYEzODe3BUp6zwgusF34v4+O50q4zQcQshZFkMAIJIUWHS+agWl1GIKEjiZK+iahCWiCI5kjbdACtyYa/1B4pJsbqc3pfcyMxgKaepbtvYBbgKAypet+bMfmlZPPpDr9x/VYCDNgQxo0MqrCzfGZYCYB77uUJmFUBqSvuTz+rBK04tAPearSReBCG+C5UUAaC0/SmCdx0WnvfyWGW2nX6scIuVo2lQ56Ys/eHm73KNnazQjQbfhCexRVRf7DRiV+TGm0F/630XOlMI1lok4cmDXp+tuDNWlv/LBB7/5M+1waidjxpR+HPkeIsRvfd5//ty4HnbwRCTBgpeuoAFi8zN289yOZiLCjh2+pjMwF5ZpyHe3Z6tHh1+XMneUdjC8epXnu7VC87qbX37+M7KQMXJyWRQMqSAl0Qbhftwe6xi/uDhKzg29q5hznhoa4yCQXMzdCBK2jRtpTdZs2ogaIIRfWtr1fHi/HKvrSgpmRu/WWslD0JptZiCHmDwqJWkwSrQSh+YBmAgkURkLSeCxnKzHYb7F1EiXSK3js3ImqwQ9msI8eVrtKHs0mxV4I5MOpji+JynGAHaJzMByb9aKiZ/juxgUMUBxrp1JTq7y+QNYuy1DXXYcIue5NzdB+J2zEwDwKl/YdnPqq/ZkSFfZLazAjjp0JTHSVClcs379yYdLP5+XSxoNXirTjHiM4QLsypSzoXL8+NU4clzSbBq6Wit7JPuJX6B2iIbx5x/G72qggip7cocL2HNE15TZceTF8ZPPnosd2JFBdmkb/MKZ0TrA4npqbg0V2nZ9cIITX7l1NrCxxMN0A7jbe7YUWV8A5Lo+tlhfvnz1cLeO+lxQGFF6/O1vbv/Kf1P8xEJFnwuGqu0dURA2LrN4MPjyuOVe5/UR6w6AjTSnkcYI+K1pR4wpu6HRQZsnytwOfW10ZG9TD8bwjbeq9t45WrtKDqI0kQE1CWCZS0rujUHaA+VwHOu+1KXcYJmA4BRkiRCuZ6zI0AZ+YhYDP3TdqZrpUj+BQJVSVAFmC3II0Ko++DA8oo+2RQYAdUfXQPACIA95gWL1cNL+aJZ3LuJa0MvkeS6vMlbl8rygVIyduZnAazT1DU6Rc8ExwzUbR1Z5cltsF1UNRjHkqGx5Xpw+Wxun+WCYzNncQDrJRxVeKX5kWhqtIFwIzWbiB5wdWhU3HiHfL77j6z7HLz8GHpHJIrTDv8NSjhMFfkv3B322zJXkfMw+t5VAd0zITMO+anL1gztqF5QIEmt5cJkMlnbW6LAH0D8vDhqHpT8rFhOJry9frGlHuXqxz+4c2HNw+rWP3wSEm8xJysxVmPSxAIkKo17AY5YBmp+utqQD3OEj9giMznMehyVTudaGD26w+EEYDDRr5pNL4TB5R0umAJxxrDrhPbSKVewxummtJ5xm5bHLCpGBGxZx3aruhZs2fRSuKOmkC0CAWeT7XDGkGCkkFn7Tc2TcbjrN/jrP7W4N6ccZmITWLgUAouzbtC6WVd/LMkaISway3LccoV7i+EGZuzaoTaMeUlp0yXNczWwYvZzMnd6tHTWOMk1eiibzp6rmiKxDMOJ0CJnes6cffPfHfHLKyWkquUfu3KQeEbpag3mn5PAKENckN7y7e5TevuAb+8ipQgn89O/93Tlt157/Yq7+FicrZ0Xeze/Rq909gHmpnPZwbCsZwGSrBETJsMY090XGxiTeoaNrlUlNNPkeJw4rYn6NLutF09rFkSStnzw/rMulze31Q7EXx6sO/Zk/9993+Qkju9yloMoQQIXi/j9J3DmPxye0ee+PPogrqnJoyOZ06Nmes1tvEFi5rYJM7mwzvCPo3dnbWihP61p1eS9d9CqJsU9sEBJuNApmgBWZ8QhjjTrKbnlQGiAsMYmjCGsejWJT8pERFHJKJAmp6ckSDqmrqoEyNTraSlU6mC06Iek/U99I1ChKsNIzRKRHTDmiRnJNb32KWMULLGk0Lh5fLl4GduR8Ozfnbjrl95+etnQ0yj80bGcM3oC0Xk2vf3xZ8hbLyWQOmgsirhsu3KZFwQVmgYRjL2emxas00LV5amTCDuXDqx8ulrs2cSlAr48N0MBZ1Hj0NpKgev/Fcx3OFtkqTlvLk8jNIBs9uzqOtTtQGpFJpLXcWHKX+OoAAKHZhntP7uGkaw9vsy9qZp8/8LtPwnsSgdYeV9RSYyHuc4rXDD0fj/jLZIGcjjfz2OE1WgJjTIbO/Mi96DaDI64qgTyLV2hcD4YIB4xLpbR4j11U3C8j5hxoBpJBM4IEjSzqX7WdqJmRbjDAnCaGeSJARQLz2FQR8oxQmtDCBLiKE8U0Z6tK2Czt58LYwd3hJIdUAII4kvgg46n5MMdgXdOoKlRhzHnjojRt5dc8MvVLav0sw97S+x6ckdGQl8MrQ/fDiqkjv93+wp9BfIIVziwXwEjJa5VHmR90CSzlGildIDqmCh2g9vmLC7s58M/+5f1iEj7/uBc3d5wrFK+f4vay7viwCyBUXyhcQxppnn8BnB6cfYBJgM3OtuO8XPqVKOwdCAZkuBE5a7XcMFrjsdIMiBCj3C9f/2TU1PcnGEyJCNLt8eY7x9dfrOd+gb7CLbH1CpdxuFI1MAvKNvT5DkLBudcOxE4dsch5XdRDME5+OALHlrwZLB9gzirDlCrLhK5JzuTxPqtDeu/9H4uuUfdMnLgC1iltuyKvispXbCTZwEQwCSOJhBNu5EAgggPXD7hpGdaRwI3jIgqr5zqJDh4uFmbvmisSAgJYAgEMBYQwfb6pRbxS9l67WBfGZJ52KmbcVffPuChe1oxGxz6RL8n7OIj2JLC0BkqDO/njZy8PzWylPTVrQJJGq4C8Vhg4XJfMMpUXlEwLFISrVoURNfILLP8gs/jJv/qfBTX6B/5z//HlbxW8akKFffIK2OPbE6AAitrxqyA9onc3fFMLZzqSTZnXbtO9mfQf4vtOyjYwXzUJWCNrb6GlBYKE6oDpvBqBWTjEkoYG3HznCdrrn3/a5qbqnB79Vu2nd6A3ww3bBvrpWPy5DPK1popWxWIYBwher8SRN2dolwzgcJzRIGOZflOFFrKMbM2F4qhGbL2vBgVwJ4lMIkikkTT30pBxB/VReUgU2RmwrQXBwphHREgqcZEXaACsWOi6/Yhdv0HNZtBTQbqb5jCSii0JwRcglR2jEQ8m8VlmP4rAZv4L4i3buk3UKfNm9EpFH7qUEHsKLlrbik0HW16n8+ndhGmiI81FmpXs2nrX0R2tiZA3oGQRNFu00EC6w0uNsB/8te+WP6y84stf+w/8nTfwRF1BNXq95w12fCy9HRrgeK5mKUoNHbzmS9XR8zxWSgJBS3RTHreeo106bs2EZ5MylsWcAfa84Euy28y81MIcXBR2VFrLqknGaq9rgJZeXfOjG4DhWEkanK/jj1SUYwz5h8PH0ECkimWwHGcbPWQbgaH6tJghoJl7GlRt3otvh3uau4OGzdxAqohb47RvqCwkDO4ANso2GwKYJMdJEMkqY9qYZJTLmVDJYlPpuBWN5JS76osAvIeXJzuaLUS7h3yzfn5OubV5EZA+VCUeycZNwdPUY/PqChptH1hWSaF9d6CwyMPx6EdJJwNXn2RGdxj4WHxLBnmVQaxkWfHg0g8RKq6MWDt19N2fApUaGLl+6/ceH5sd8j1PoNGNHa4dT0a/VcwD2FFnGwrfs3nBuUvUrmRK1IxOFfeimdWw7p3tsiWUM5oe6MyM9t7sSwCmDz7+7pOKjn3vNAplel93MremWvDucQXchZ3GwFRVeLyajDFisZraZyNIGOti9UIbhmDUhrRkn92qFiWs77GtCDNGjYDP1ow0J30DgFkBekQEuBdqqvuGZ0JehCwkHsUAIslJrB9tzhSz1f4E4olkHLfy6vhdNoaSPXQR4X4CSYIiVRu/8ZibpJ3gvfSrZ75pO2ub2T03s0b5rrG/ELJkIrNkN9nUb37NGtZ5TljWhDI+MmK+APCYphR+QxWtc76VvJp+6gxkEPbDvgc1II1wA8ku40iBR0DusV9hHOD2oAay0QUVcGOMRFfEndzlic0PBso6JhW3AtmlVx5BnRoEKCtj0mHFuEN5z6F2ORaEsSmMAIPXhHGtRWvRG1wtLwYv9Lp6qVflPEm7vo9CckdBjThIfP2qOQvpThAcvN02A+EE2azNEJi2Sj6GXCwE758xEWPCVQjALNuNNdIJliO0J/UVIwoHZbAaSGMmwxyAYIZlLICJwOgl5iCjTG4kY5aUi+SCRe62PRLsEfViIqkeh8CIurZtQ59JtsRNNtNHWX12vR8limeyrkAGAN945yAECI1yUpg+2OjOpu1/MS937s9mJKTEqdFIwMjHxU5CG6WFy3U/3DKvCae++KgyvpOa/7t/+aRHkqGQqIAUR1FhqYFoh3DUcOQfXYIeSYYBiKp7QC6NZsd1RZgk7qpgIEuapqJDycaQ094aWzgxdTFgvSfcS/nfnFgIgOrgKO2+8EameJh36j1dAJmedzzvi89shoT8IpoGplHYUQbuso5EGgWxUHrH6S9twAlYnaLNRDN66yaIt3a3GKoiKtF9H42CGoQBd4J9apQTSiVSO6qrNnatlq2wQdskwZozxXmS4Qg0lgihkAzOjL14s/b+J5NwMv9gDrB0byzClGp2IkiI+yJsKYt3qFvv3ab7eeRMB92Kwmr7pC9q22HTd6vfRft8+VQzpQJIMxnryUMKa3uqPmFuINwKpq7FrPRHQjYqH3Xf6wmwQphUu/g7CfD3/QvrBo/BmTK+y4Z/7Lf/3r/06PTZ8XWfW2A9DnjEsdjTQftMVKWaUwSTJVemq3/jg18ceA1SbgMzgWWjyjOCajR46wqDlL13qgSMNa2xIagS0BpUvewZRAfVMLS8wEUQXj+onShAny/LGRrnEX6Fl/E4xNWyFC1rJwp+BSzO9KREBSw5nVuCHfOqeS/077O3Qe1ET1SEeg9hDRAsYRlkxhUbcEChaO+WG5whTFUliWIkHCIr/qATnF9wzPUnF06Mkbpyr8xhhmzHiRKFMSt0iVu1oYu5Ka3kcYyTaf14U7pRR8WFcI+fGPWDevdn6HWJA9ZQ12w2uEiOM0k7x+QmawkDQQn6ypEzd0BJyCnVRfF1zJ/87X8pVQhHtuKKNmAC5+M//O3/19rbI6xgvdomSe0RAxT3ddr19IoA2hEGDzNtR6zpYHKM23Z78I47TqbIRhl0bIGtYM0IQyNhT6gPrrdDsNMS6n7XUVR8p7FtmyH4WoPkLmji8TAB0s9+/MW9+npXLirtKccr4QP20VVOWd7+zCJgRVDRAUs4yDALNRisC8gN3Kow746xw7YHoypUJcm49BVBF9VIQqPWxa6Cs86/oiFrCAwkKZ7wsKKj3TWiIibyK10l385pCLb7xr1CCgJfcBn5aHYzS05Ruy1A8BHaaYjmqHq3PI4rCJvwsK3hKg1mIPUGXqy8oxkAGpF7QgRd7RIIGARr3B5yynhAd2bJGkgwux4zISvGYaw+Q2aJqIoVQBoAhB2+7//wHxsYdxzb9+d4+Rv/yHfupnWUidseoz+Ljsx94sdNToD2/cbD1PYZHcqil21DtxhITtzeyx1pWR1VUrB00NgxMRE5xhfw3TdFsfNMPzRGHzeIRp9V3SVxfLWK5hWPaXGF6oM7KOHhx5+t7QbNokkajORjYiNgTyIUrXbmeR0kDUVjJ+dyHgKQOYyNKV7ELDEE9c5YcLiOr8dRxBjRTKXoUKfBjOZDAHDF6BupCSohoFRmXZmZYFJM48BHUGy2ZZNEjW4EfILdDjMTJbhXeFEiRRxFhNlq23UUV4lzDl1WgM4Uz3OsiiuSiBe8NqdrXr86czdWAA0nQ4Kh49Q9LAZM1SR+nLFBpTCZhyWkpImPg7dyergkpckga07c4+58ACH+9IPDd39aSEU8lvZPPwzeAaOnO2SnvPzk+7sVxOL16Ieu+Lnjz/2T2PdvWge9KnxdCu4p2j2dSAXTScEMIQIg4K7Eg0W7/xAvgMaBehwGHweIgly8k9Oy0JlEax7T4AJVsUHE5Xw5fPChTTM57fi+lzgj6rUPGKBYpBZUy2AhDDNShqZ04+xNHnEwpLoEavzuiXfA4sO5d7jSiMB0NJFGY/ncqnK50q5VBGFsH1NMGRw+yyhMYpawsTZZMLaUqGW3IYp2CpUkInDPIILHjDGmcT/xgrkPhHEd0LPJCS7jEnGbrAJqIL1a9vhc/i4wMku3Nb4d9d24IPEEfuujeNl8nmRbF5kBARn5iJi1AG3hIweGpAuGuFNSrGRrD/q7n124Uz4Fb5/2Ky/izT1+9JMBsICLw37wa/R0n/bZXRa3duQBCmi7JMjuYLnnFEQySDis437f3oiz5MPPm7uNQiCU4xrjVbwTDYXQisEqdA2tBnwN/vDFx0/n26PBfXcq2RdiOE/Y8xokL9lYRFnMrHgsGNjobW6N2Ww14jIyCu/GIqI+HYV3qHZBIwCEth6MrFOpmdMBiASvmTROvIIxAggaKPUuyQBElzVQ3RDc8qI6KOktmQpFhPK9I2GSiFQe7UmYmLbpjNdt71hckaxo17754AP2qW68dJOntkHU5u8elF+/tnRlaV2K+pvbGtcDXXho0+GFTvMaa18ji8rQ1uOjHLBwqyTqkNzLJOwWszhgD+g75aO9fBjQB25xYMCAOPI/jregDV6Nfl5ZpmXUo6Kf82giykzQv8htsjbdlihDUttW8V5MFfEabXKz3bS2SqgM1cMdBuROWnG0oVDR6qobVbrO9tGHulmbT4cJWkKbPVJFDfbIiYZq4zJE1mgGTLQEcoOUmcJ9pQqWAOqdMN6KwdiDAnS6y+JQLe4rRE62bY3m2ACq8rweKmJHe4GyVqJBZksE4lGE5xQja2C8vlWTsWt3ane4Jd3DG45i4Ekiy0Bp3iJrCCGxQwmuDCs9+V5+9DZe4KbvuIqLklEaz90lOLSW3SCcymR8aVKMn4RERHcfvfh+v797dTn3tSPlyoYssmLfzCp/PQLOfTBI1oL4Csj6238RIsTH5sR1byrE4NMjGa8oI44CfRXvqzrdeO+GieeUygz1KthMn1C4wz0Tgu33LO5jiwiQinGM1UipNnanierp0svO66qmAHiPThV+zxuITolWSL6CitU0iIUY7B4BAxAB0kAYkOZEQFppEGXklaR4FxZc7QIA1IUnl2QZHZ7pOscMEGsas+gZJAgMxqvSl15KVAmDpzkJZwnl9m5Eic50fKlHDcsjHDUTRu8dKmMcijTkHlcixC7c5rMqBZktJrLMzeg7P3km7WVIscijiKuGWjj4ap/Ko9i9vh13peouwwtcKs5fWC8bE+jYX/3+ab7v0SN4DEsqsmbknv7GFBIvV4Fg6BCykgv2uub1+X/j3/Dv/Ofr/KDBGe4VAt/gY+ku7hUfCo8GRx/j/cAkUN4uwRkXR/apXA5kuYP1WurglJWtZGC6dky6iWaYLHljdWXB1Q+QOkMU7iWIk0IEjpKHNZ1kfSWf9ozErpiZC69ryxgWfYpaiv0rEWZJGQ0d5cKSc4WmokkdfxcshPZFJd9ybnmapFa1Q3XMFXUoF6jJEwYnjKynE4+S3ijS/EtTQgifGjCSpSQZBF6AwtxEu3XhJQpyWy42IKvey6uupB9Gah84EYogXbFs0302fyK9v6aT7fMfNX7lJcZYNkEBYWj+1Lxpkf2JQrkx31eGeHWrMp8/Wmktr21c8xpcBMR3dpPo4ye5TAEwLWEWyoiE3mgcm7mwSKi0A89/7D/z//wFNkBoB3WHsVAQwj/xDxWYse4w8gyQj8Mteww81zy+KgMHVE6XYNMyZMuLeMCiV7i1tb8aHZQeS9BjFuwjpBPCfS4rBiW3S5yOhpWMR3k5PErs2znVrYi8Yxy4CN3bcYCuMdXwPT1h5GJMZVsnX2a8U4sGvTPj15srLZABBBziYW7dTOnVNxISC8A120Eg5YBgQCJgWCRZhTFMEjsZ31E+nFUiL6L9Xo4IfA+R4gHzIh4YCQ997Nvngcwb39Gf/FggN7o1OZtNh5y3nDMiNkgwPw4nUs6IkZmzo8u9ybVc0FE87hYmrs+pjVtba4S7OjNttLrWtaMNv50f5MkTE89wiYhIr/wiuKd6YaBSVKSvNicBuJYzP7D7T7BfPVTBwA0P//wX5Ia84wkz9nFbnrvFS3NIepu/lY4fOgOrox0uC3w6DstoljoFhz24y0pz2Mzi1pfR4Cdag8odSzmAN8bERzq+5+l1Sptj8h23A5cRTpXE1Yw1UeFF1hszlbRyA3ZQaVSHWcAGP4jae+vL8mLQhjKAXF/dcA7B9UbtDcrsCMPEBEpS9I1EKW1AepRxNJENlLkmWy1LX9sserF+uDiMPizujues0ZaA+NlBfLoCJcKrPnUpJGZAf/r+pRovuXG2M9tmvIlYtZLcOJp8NP+WnqveOkrzfdji2dn3ftq6o6ZoLqbTny3Wmp6mvliczldw9/S93IDFT149CJf5jOkc65ohaPf1K5j0iNAjyP78X1mn3bmxIpgGoOBi0WAtefZxW567xUtjxp2OL7f5RsVnHawDteFpOWAi+SjbkIY75uj/G6IfEeJXe+R5QFzx5SpHL3Q2EddMGgOaHLEOYJRdRUKBNCVJurPNRnMzvmsGAaZqp9FAC2UFDiEjTkhCZIhFWOMw9143YO/f7jDBle45JQRN6Ld5DTD6NTz3pbPYaMhzv6yKzxCYthEwuSvfSeEFAkpYZg8AcR3F9zFoj13MbYvCSmNwo7u2aMwxl/v/fROr80/csisWtx4/TWmzkMY89pxn09PVlTWCrcn16uJrf/niYUFcVq7ILLPwtWpFWsW6KMVtv1/2G/gjZBcwdWyA4A5qwxgULgSJFkha8uzhxl6FZ1NxhTGaBOqfnb8fM2hAW6FVoBKOkBE2NDNcs1j6vQM0VdDxtrEG0KKKRY5dkVgwRpoOoqXrcfdsZ/yxA+GKjZS4ajF+VP83Y6SlzMyiC0DSU43qNJuceLcsUqE+BtB4e81Qo/7hpdGWLgPqmcYBSNcMZbqBmkhDCRNWMSYnLCs5uedmBwdvMHxNJnX2sFodUnSJP0P4S9Sw8ixEcRMVwKLPPqbodePV9qkNPUXns63Xk7U1E/jar/5LlOtR+b07ILviNdt34/gxBd/1Suy6uJ2f9nKavrVtn80avB+PfqTLcpkuv8TtJVoASolDYV0puuXMWU6SPYSNS1fxRh8GJqr2qELQKfIDE9PirjTgVLdnkqvy4XTqp5/+rz+5DXYdZTcc/UYQh+aAt1nm2qH+cp3N8BVUpBfCniAo6lUQVgqoACh5vKZTkI829AA+1tswg9liFfCauJyFoYjYDkCSMkQjmAscUgMnIrkD/m6YawEApIH25i03OizsylsWd3qasVmitQJDcrwwr4ALypJNMT87mxFpGSj5qKqPwy3b/pnj+6+vtUMypoWk6KvPcmK7Sj7b7HzbYptLld6SNHU7GH3nCWRAnyRLOjqvVMcuz9981hO5W7fm9mS867wn/VqfTj48vNwucvCZz6Z33n0ui7cefdyMNn482vr8Oh7uc73/vFsmLZBlcq35dqUGu2BnE8cyUeHar7orIFQZ56Oq0vQQHqaSFE37jGokYRVJ96gnlcT+z/1/mrRgSGxHwS7aZMcChsFqiZDn5XJ///mDeXuMrp0NC3G8quWe1iMqWvFs+85dqfjIZO5Y4Y2jv9zlG3ZVGFxsBSBsY+YbliNlLNNQWlBLhBHD/h2wQXZPds+XagBgLnYubh2S2Z4uoxnlonrKjFCJqFigHiNd5bF4rouDNCCk2fhcKsP2Kj19O7Xj5s2ph8mc1R7Ez/ChjdEEYuJGypydmB7VB0mhh7yKHxF30pWpy6GbAUJl3SLyYfn+ZALF4lD/5ACnLk1+7xnMV/cedh4kN1av+pzN+fxSuiVkkoRib84vF2BZ13VVKlOWHbpqexCuGAJV9yhlqAHnEbPCWDAiBtACXWs6aCof48SFQQWx8u/xBlpRlTpXuls/Ar2g/ur3R2NnUbIdOQ6KKnxOfpi+VQ1iDdByeb1kTsfZH9naWid6AwkNio4UA5OVnrYuy5V29GEUZ+Dho6ZlhllB6lZQdwEHkYwGfBWVZfxXR+g0BYwy0SAIUDtOVuGAt28iSaJiSkEgybUYb4w/En2XHQauqlksYasgrjIMKzAEfF877kjadDqmYNwA3RQYTHUwHrtCjihsm54hYjWajFzJ5jPUqVp530PTkIvonG08uW3WDWM7njScQqcFaZuiWOdyVR0F096Rza3Klp/yuvsr8NNv/3D6i9cWn/zSVc8P+kDn4+7S5a7v6vXFrL36dn70MXKQotDx+x98nqlcFy09kSFBuha0HYoE62YCUMNVolbx9tk14nIoqWEPpoIl7Rz7FbSWFeBVBUVXVbpLiwvFBXqKbX9ZBwsOps+vnoqejCXciez3OdvhGLLHv9e43EjbRRm0g3YoIKwYUKFrBYwAy73xGso115dMFDvHvQN3fgXMHFzcACUDy8CgAsOSxtVojdZ1cG+EcfCU74ABdFPT5jTAtXoTYmfugzEcGkZ1dqLRM0swHQIEkSD3bBdVFb73O0kGco0wsYU53NLitem8PvzFayLadW6GOZGG3ma8V3B/FdvNismkThlS5zR0ZiVJwvHBBw2YpIW0ihmQDFfzGBdcmvz2xTewP9bXQ3pH/gj7q1P2FnVd0tL5pn6cG3f3fVlN0/mfe/KzqrvKVZyef789+5x9za4uKpHD0Y/KPEus59JQw3fxXLoi8h6FsIstcOvVfYXeoR2//RNjKnrPIC9TudbBSuc2LU7Jv75dsfaTQrIVFLjBKdlnj1i73BmxLn6INaEeURp65OVcgVb6RvUKiQZlWIlWPA3RQptxaYMXvO7vKjLXi8CNPXrP+3MvxtQ/ZItRqRuiRU6IjZpSkHJDvwR6X5fs6xrQ7i8aLPbWF371iAGw63VXt4EDJFuHABD7yoowCS4AXkgsOTCRV23gSSpXNGUq0CASFVESHujt83j3o+9dtH3mIzko0yiLrovPDLhdhjMxjUIH4AQ9mKtU5lK78NEFcZQsvg3cjzJlqAKM2M15SnxLwXE9rerNa+vl2ZXZ4iSffHwJMHnSoqwiqXkGvXvt2TLi6JTEWqy/+/NZPOZKLZHbsEoy87p5UYXup6lww88S9/bUhxIXuEPHAYCPKkS2BMYU4F/9vkwvSYupZiXfgninyNzKrQ6wwYil4/w6tvzk2u8ENHBM23Mqey/ZGpl2Mvnkl/NDuh7d8YZFOwSjuqo43HqDPCsenLgrp2y62I5+3LfLq8/uzo1hE8BLTjb1zlj8iqySPawYsApw9wNURFAmqJ7mSoV3ELIBjRs23wW7YdQ0gEeOVLrbJggxdeNe8xg5AUQgM7mNB6wInzWWjzIvwSen7BuC+gSYVUI7OpaLLYQ3jxbPK2qhkzFpEeqDraN75tPy4upSpzl6Qy5r9guMSXKw6//Q2bNZD5rVpRQibXGUFSxJ4UYnC1gZmNzqHX//k6eOzkddC9UW3MqbZhs8rzL2Eq0fH7d+M7kqA8S8TgvSLwt7zwwqEpvxUVHrq09e+WRpNp3yZUIcwqbCOABS179OiIWwsmHVaXdv/VS+jjg1bBCG4N6AJNQSkWO7TpdRQVKHPed5Th+W5Ibes6fHJdkur9f0yB3q3kivMBZiRj0HHOHRDMHX82qwBl7Ra0Twy8NyuacBlq9eL8vrc/jWnffEKAUxBFrGSMDRKzNiKleaXDRvRp+m5vsl9k5Ysq5PAkBl4dEqAFLg5Pq9ho9JKok0rVBkkw3xsxLWx5jAoXRSBi8ZnDRDtb4BTTl9V5Dyz8vYtJaLw09blHlcfnbQJ+cFkkXratyCp6eaAYSr5vX5B4XXrBlRWqNZxBlhAkOOqhlZwAKmRYZq3XOibXX0CTflRbSbkHV81ftMSacaJ2tU8nW38Ifzer8s65rZU6EyJoGPL45qDK5QhcDTe+WBwHw9H1gDucMX/9s//8ORjGIlZ4pxw2fuTgiN1pa707Jgr2qQc1yS9VTWV3eipCTM/lXQsFjT1/FNTIFmUCL6+nCfSZyTz4wO6KpinbROjKhdgQYtB7Arcensc8/Zq6MNgl2VrU1m2T9f2T9/eQ4LANbmKR28Fh73vGgHgTAaQISkniGZZ5q7cw+R4LthqwkcwQCAZRAgAGbhEMBrcgo+Gc2ZRIQEUSqQ5GMEB0X4s9VdLhm6YsnokJJf3j+aTdajTxoTRxQntVE5WWnZxl4/M4QobuItVCOzJcrS/Fq/SUl1a//eHxwkjJohU4qkHWY3th1SkZyQWYRpDyOWKNVBH6xfH3/7n6OtUCJtKE1XjRrCKB5tBopKbF4jMs6bTylIKUp8bNjcJoOTWvE7xS6Ota+8WbLWxh7b7/zpdi8UsgJEXSeTqzpSRmoMWFOIOkJJavkbSWySqQCZ3BetN68Wh85n1lHAHC2QGcewrR29r8uyrFI79ZieM/2KMwsAB3xDsSsOVTXckXIPYAEUAL0q7TjAneP2APxyPEL98sUX99koJdzdYIY9XAq7g5W9YIGiEIkUVYuV0cG0fXe5EfAd6MSdcYABADiADtHnDkcFd2Jmljk10kVyI0oCuo5thrYBd7UJsyjSiRZqWLgCsKiv1r9xsnl4TtswLio+dyoUenV8r+DYVm2eVViVmwLjRqtNm4QwCU48iIpoaoSjT5AKl2qLkNBkBGcjOy7WWEy1FXKrOPPbb37Q2Ow1gjYVh4XfKgnbLJCAeiIWxJIKZioFQ14XfiPxvqLLHiF6p8aSoGvxHaiB7E98+Hd/uVMx1B6ULJI9CAqJO8ZKoQ3Ijn3BWOA6qEJWJeDKrnlUOZbcer0bxJ1gjOOH4+3gcGvKzL5EduB4uixa2KxA6jGHuhJ4oUk7wgG4wrDLgjve64Lxumot+gGX88MKiqfj3CZHKLDYLiu4KmErip/MhGBAqistifDWWvNmxfPrtO/Csp0FyB7S30AIQkCSkpRrCmRtUCCupiyk3EhDQDCK+tQxzBWA8ubs483ZoftaXIVuGymhzguBIrX1ZwawW0tFnlTkW+k15tOkIEXuYgwsISe4Vspyn21PoGUB3jEKmGDMKHlTRApFfvM8SNlz8933T4W0U8RE13SjosWsiaSQ88Ml16ZUlwQlcj4GyUeE6yJxjfPr6DHEEsGyrzDnZ5d0ESjjNZZPXgHUDql2PEGuQL/50w8oHNc7UairjMrVKam66bAbdwppI15yJUBis14JpMJ19R4ygVQoux1OT6fz3Zr9asouAHz15741krqu6054ehEbgBh7fuyrtA/wxf3rO5/teDTROR+dUAbXu2lXGyOLQspG0ZHYuEhCpDUYm1ljm53oG3TuY4LvgB223uZxegYJOHpXQikDcv8fauMVcGKas0E9IYa2JVKxFEcdCLPIRlSfbyeTzbjr1yLerZ7z2Jl7Z1QL40im37DdJp+ZQ8Tc5j6BTHovdRRG6TF5I6iCJTCJ1ajksIClIXWh7A9C4yirbriALpNy4IAj6ad9i6wRkUxel4vp0hWiMiXEZX1UxrCRxj4gmLRfMTf359sAhnQWKtNIJlZYDtANmX+4PSYvDShqBZjK1JEhs0dNgZ3KcIxruK7+zRCqZUlyq5WneB2fnObp8uoBfNLCgR03WgRLvb7qz9VquHsKEaKIvfOKgWbD/6t+AOD+lfKLu2y9H73cXX3OiaD6TST31EEUahJCvb5dh+kG0JQSsit66OHSHx7OkX0ZWd9XdkUIVZjEwSJNLqQVeSVWqOuyKRKkUOo8Q+ZGnwzKUhCUISCuTOEWtp4tChXjZdnoyNw7p1xCTcCQ+tC1fUzbpDFIiFp24MgFZaAQITvMrH2Zk4tEACGR5FmEYrENEo0iYQ4uoIlaJTVZCSRxyqDsrQFV1qeNCIuQlBQgPH5193OYS6hC1SrXDubn370HdaVX62eoIQGsbhRa/+9/5V/7S//sT38IKUFWuRqKdgKYhrgIwDS6AmnZop+rhAZLw22oyhDbxtPABcAxaLMyI/jkqWVe7lb3gy/c4dYKoFXpFgqjlOLfsD91vAeBn31npOnQSbZCs1TyOJ2A7pqMWFbR0NwONCdizbUvbXSdX8IW+7F3nlLKDEo9GaFgnDO7Orw5dnH5vrFrADsUzc3cyQZQNiYixzBfhc8sKCxRVohTt5hIqjpjEWGtv/J2GSxKBu87hePxdEwJp/cIBet7Y123SXVf5TZlSMlKwliT0SQkoqwYiihZGSOkUSALMYsACRogxUgmGpOSSYoZyGQDnhQU6pCuybEgBoE1kbF2pTIT01eInMMQAqCEd4CoXdHE051D1IBzpVLGuheuIP3l//2f+91/lBJyitXENxQFSmZBXEkDTyukSmOufWtjkSC7hLxSslu6JKzg6j806S+XJTR7j8t6WcJvEIQB2smg/g28G+J43rOfry9iY/ju6x0RTCEzC8qMa55clc14WYJIL7+TzLmuRkOwX3o8GHcp3WygdXA8TySKrJbbCFNLT1ObZm5kGjDfR0YU2YAdeUqkUilKgpiCcT+c10zaAAsiSGZyzbwQDXq8nVWPzCPfQdHUNo8rLRgS5yo75tjsXo3Ppa7qVb+4avuUfTbhTrhg0rKRbd3PbW97IKsZU0BU4Sykup+4GSa8SZvBhZvaRgLS2i2LqFmwKzwfF7rFHHKMS4gBiRqoeDmYEhSFHZy//mdUQGoPV2ruIpJ+9ftKifd+1GjGBWfyLsCilUw9akvT4ND4ZdkRC4fveEEC2XN62rfXrxHph2k9n7V2awa1NgHYdcT70eDsSKjv/vzn9tFGMfS0YlDDUnXt2zVnEJfzRefevzQz89PRsrPBTOha1zjsIUaPw1Rl/yo4EKq8HVI4MlPZjhPaNLXB72uBek8tQtUou5SrYqXQQ2EGjfoS160AuQn1KxfW77+4D9pKyuK7jq1xdPvbvxBp1gBBY1GLNFMIKhSFfU+gx28CrJ+tYbNO6JEh+mUKCpSTEsBkdlqOiqiHZykJUEIRJflMEnJmRmrbN+mNPLoVtgzXJOlKXBfc9HlNjiBUOH/vL38yzACg9inRRRJMIijvEp/zLTkLck+VrXZfeCuFl6VklSM3liYZW1H7EQXWt6/0cktfw9QXtMlsnhqh/SBVir3YDVhV5s/+9Ce3EAeK6nDnmYUaP7djWM4/u1tXxuSC1mVVpOjsEWCW6rk/jJQgcVZkYr9WthPB3F7dqDZBbebhYEwOtg/O99CR2jcYFKv16JECUpkFqESWjzBiwxELWOLy2YN3WRhlINdLFZOcnm7Q+zi1RUmKWlE7q0KdC+rdE6+206bHiPEUdO495pj6wQeL6sAXfHk2V1FKbUsAgpE8coIbYLYCgJeYAbDzslsEzzcRPGXi2jAB7RVOHZ+RHWBxZFGegC/yxbfjU5XYX0tlZOF3KyeLhr9jkVhNzYbENN40qq0asrjbdxrLDMzbeZ7E1g6Uo+fN0WdzMyIGPUZVvBWWk2rXZRHt2eEXIERxhKmupXDTezT6csUE5N3rl4udaQiYIZeLLt0yM/qypJANmAWUsNHhxqNlcKCDIEKyTJkgI+3AS/TLZekZ0C4p3ze2GyZpOA4pcY2emVCZe5WqAuO6CYQiS42GhFxCypjAkBoWn/vopvLGtqeJNOWc6/tUjmBU6IrrWdE9GadRsoRiGyXkrhFpA2wRcpU1jzxajip9pj7bFsiz8xxRPyOnnJ52vrHooSitGpZLQkaWAsb7uQlA0WH+5Qch3tqreRGoEW+HPvBwQ1T660wLVApHxxWqSCFVREtUoWhIKo468NCj6l7v7j0hkQAccM4Ta2qHOdfsZztN08HaabaKpirsVrjbzF29RQhE6xhF0yBP+hjwBUOqyNrzZteMYo+zUraZQeHePUVm0i0jbmyj7FNVHd4NEQTNaYQjqd7Xvi59WXP15WFd8wot3yt2HUQVx81AKXNrgzth0KPhSZA14BtxV1zciJWz9d4/fhLjr4QmOixNigcH61DZmBnNGkouTu7Nj17GTZO6jO4qQVgHixhccdANFjzFhBkxZQoYGDsDuejhs0Gelzf9ta17A8sq2codmBI8mQaU3vTtzxfq2PvAJl6JK72hqplSZjFOpnJJ2iPvEIWRc1yDR7rSgBfHMh5YvmRvyIU3OxwYF+bFZ5rRDxQGN3TdaqvVag0eCVQRRgPHMhcMqSAh7xEK2DdBFeKhz5O/vF8S8+1EOghz0QwNN7hJz/UWuhY/pEzKbgB1OiOILO6tQi6IVF4Am+1R5f6yHqjhYpuMSSSNVnHIqpeuq6aRWClEJkI0gVREnTMHRzVdeox9no6xTKHyp8ZyIRRAAc/v3gtcQT5xUo/lul21JiZjY3HlJIz67DUXJYcE6o0A5EhZ9QuTvl1SF61SA6B2w7PcZgBnHYk0aDkUtB2w3XjuEZsOyKK0GsENirTEDNW7qgi6nlE9ZPHr2ssLZ9mPjmlaIH44QPbu/SEby41sWZsAqNp4Xovibm+rsxqiBmHKea9xOyjP/PlPTCXqCKnQ+94UtPXV3ZINBy0xffDk6CafbDKaDDGdjzw+n7u1URHA5kjP7y24BICQjBnIJWC5XlrmNLXqxg4p3yN2TQKV8fFPEJrKfJyqBimpQWlehdcoqHlHppAHE2RMYjRMaXp0enFZkyYIVnIf0IHUnFIvkWL/nlwRRCw7Db1Cv2FBy9WW0UcU8iTOEqlwROlNlJyLnOBGOJ6+v+8ziM9J8d0bwOkC6siHWJ4txHy5BqZH3QaIVpPhIqWkvjIs0WR2nGlQCnlHV8tpBYZlyQ+tX6oXZhxYmZlx7m6KHkvnDAjD+DUrrYzS8o6ORYRCUDQR/86d/1alGj/GV8oWKx1tf4q+4k9fclmNpGUqzNMN0+RsCUYi7m1t6/qU2i9Gq/7drSQ2QtxRXiI6LAJLdCJomE7Nioz7sO8Xw47V641qx5LyDY0mgFGDD+ExNlAPUSgBXtFVExWBTHe+iQewqg3UZS5nAe4oOtImCdwgMlTXEffi4sgl3wm/uWwbT8SoJktXZoOtVSALqiV78FY2qAoJboaDy3feH1pcPfglfC4Ly37I3mrT8CVrefktIQx7+a29WI4splxnOqIiphDTkzS4DXG1ZEtckPYgPeO7PSWKmDE0JxSxrjTPJZI8zMWRfev7gyj3i2mqUWJoVOTD9n/+/T/zo12BsFo0OjclXPEnLjnNXQRSC2E+YXIgzlK6pTEvr9abJzaoEvwgQNqOPR/zS6vvCmmSYWpmVnQsjlyJ1HvpOvU4KXPp65qXSyxriLJBqzr5Pt4o5NZNbgyRMKAgkhxvtK47i+qrOtsCMoghhRAKmfNIAboT3oMiz/G0LexmhZuEpuzyZkylHzdeAboWSCkE43O16UyOgvmG5F977cfLz10KtyS3205IuRPaAqPWzvB7v3u+F/YdyH3cXES8QYT3SXSRJvEO7comi0rWMK1wq7qHWE4AIGJccH9p3YgMtOlwbLpqlnoOd3urO6DAIYI7IN++PP/f/D2UOjRJG+uQdN2j7C1525q76NkbOVubUoTiwugBEtPBkJfkTuyRrhbai5Fu8JPq4GbMThfMkjUJVX0Hyx58v/Q5xEVFoVhSryOW89J7bkgCoSGlHpmILKpvYJmibbQRQsPX45xXyhL7bcmF97bbtsuoKQO6cddNkkBTwBZ33zAqnlWp63O/Vme8gkl5C9n0CbOtnI1Rif0WQEKilFAZBodef5xufg/3OWx6v2IGHA4fcHjyCXDxX+q7V9N3n+GCxAQMhdt3iA5dDSRJ3buyZVRP4Jak+GVXN+6PFj6GuEAkp1WTt9kn2zhU7fp4i+RsNZJ3FNWeOsAPTs9+rEUaWDMm9uAG4qKof48mwts0s1keZqQdkmwzkZmmHgIvG9r9pRhYOSIx7vAcwlCYshSNodSkyM61uI4iKgYEvk8MRYsSnYHBlNIqrRmdihSUCYhF3a8yfTky24tOZCM0CSJiBiqp0USmRCtjacr2TL+9Tmq1TQKMKFU4uUe/PPUyqypeCdXYE6mIy4EQCiQSRdac22w1dKpJFBDli+JFR6tkkCMCIe4BDZjz9MH8tzeOffId0gG3mW/Ij9DtZBSmohdBC3WbUyeQ6Ujth9cvLtrr/whN2KQF7sdDay5AV0zqEVzGBVt3wCqiqJGh2J/7/b/1rWuOe4dRQz3hfLY14+HSl5659uV+tTRrt4K6H2QEptaTVELINS7EKol0lJGVcEeoYAmwbS+wur90Vy65LhlRd1dC9Z7pX7m+N3f0vvQgUyEAzCqbvgI0lCLWLsEisl9khBk0kMvqRvU49an7jt9mpnDFXXRb34+SxONYrWboPUDWEmMbUltf1Vk5uLFJKsBAESRKjj4pCQff94NVaJN+4UowUAMBdyC0m3HTqmvB2wFFLaCrJT9effKaRiIhab/qA69IpII+eGKwgBhXDywr1u6NZpwcUDEIK6vd85RdAtQjHf3BP/7P/xsy5u3HdUmOoK3wYt5n//ysZZ2zM9bp2MMO0wT09eEV58htFKIbzEkF1lJprY8IXQHbplPCzp/PbwxdfU30dc117Yyi8I6Y4HvCuBPYOi2OIYe7mFJGZCIiFakBsCj9OOVFArlZogFtlQyU8lFWF7UTbSIRLjucpt6MbLCCvZ5H0aCbgL+6tnP3LXPbxLOAoTYJCW0KKQJ57cDN+lYRs8mKSr5rI4IC6l6YrJ/rUsIFYqdwRO0X0UCwhzUy7DALk9wtYge2egNJK0KSW2aBxRIR9aym5Vb179HBGOHH/LJmD0c3mydCO8agVN1x0yrjgs3NilHVfpzZv+K3/6m/kQS/5VdLpnn7+ac3CSN/P5se1sC69rU3yQ9BhpZLR+93E+HH2dwhK8VjsQ00QrhhEcZm+D7TBYNa0oyZS6TiEvVxpPBfY+ZLWkGqsdpGjKFMJZElC1jEeqQRNUgz6xO+HDiagkDi2JfLC89VXOegiIRjaqBIa0GasHgrkWjUlGDba991m1yU7Iurwmtc+J4Qj3zklhY5NmQ7zr3B0Bc5+zYUUVBRv1Bv5KT+izMglv1AkSYQ+2k4cOxqIyJAO7pVj+kItuSHCHomqraGbsERpsQ+KIpz73DIYOTc/zIzQWluswv7RiAB7fdK0TdvkBCEHiX5sPzm//1vXGT6+e0Lv1qa/8OPv89f9xUX7P7+ElrP6aKRrgv6RZ6XTIfyDD08PFkmHCJmBHtOslSz0KmLH6GFtF07BJDKhKi167IAXdE1KbVqEHQnTHwpb9aoSrV1iVjWdBPIZHKD2YYeP2XVcWVmJViDy0MwEcWn1Be8TSx5FCOShk1hErx5fxukXLbwkIx03TTIbIU27zKZJqNyGW1a3T55UhAEzMnkIpc2pVCFDpIpGgDfi/QggvIF86VVc6S91FSpbSBbcMjo3bQVBqwdlmilFO/lGm/UbkeZ1B0XldM0gIWjwaLhLILeIUAj7nR+NUZJ7mjFncFUAfZ7LkR2QtQZ+hXqGxDx5Af/6ZefJP8gn0G0ABxThV1qdu6EP5xXteYItWVNISgW8Ts9FxKhtSsyI9u8wqHEkhwIIYxNx0lUQMsqXqxYlauUi9Qj7hM5SKmK+L7o7AqxM5LRe67rZVn6mpRMSAj8aooRRXlt9KDUM1rGFAFNAfZgygbGWxN1XoH5TnEVoq/PSUt8icsSlmmgkGylfJchADtKMVGXz9RsKHtDUZJZqSiuCYWCkgSEHvuAFL9gd3ARpVIFSLWFOMe4kNplxsgVI8bFCuBR/tesFv//mAkJK5XYLdh//B+oyVOKl/9Nf8UpseqkzNCeITkaBkp5ZVwCks0ILJDP4idjzfJ61QRoR0hiZz/wV2euCywBO/zig4HC6+PMhwbkQLV6oUIOVQTJ7zYwO89cVknmixnkGRJXZFEphZ5KbQTL2h3bag1cnPAdUe40BjqyPs6TMQfAxt5aQGaN3KMmiuYfxJ05EIyLuc2e3RvnvM1pyZHz3uk9CbbAxzElfrphHVbJKspbdxPPDvxS1C9vZ6S0pprksgViMusAUmDmhaHPwg1nq8uYMUTAsrCoFnspc8qo4FO0emG6rakm7sr29bm8m2wukowYCNWFoJtVgXGBOMBR9mxEtJbPPdNf/bMaKw79Zf3vUsyAIkv/1U9//tedaEwwxF7ZkkQVJFa7s6N+FTDT4eZeGDzQuK9XeswGXsPfVXdX54H88go3yLw0s9Z3qR7crnyDLiz31nn84BeLLVrj4WTy1p22LOqZzlXZMwNCZoqR4OrYciubzQizindmOCkHmol0hkTYwW0Ps96I3h+dsTL28tuCzZy63fRLWK3d5g4JEAUx5ROmbnNmFqK89Vd9Ob070XYpG9PEoNbOtPE89pYRGY0ITNxno5tpKp/zokgIPiXcBC1aNW0IlrVwyaaWdu9kJ+zrF88IoGchW3VvrCafsV/MNFYPPSYg6bMvfqTxJ/fgq3pC29//3f/+f/z5glPoK8SCIzXJ43CxxbKCgJZryKzos2NLsEBUGblzJVwR9VGO7+NL5/MXtxPuDqcMQDvG6TVc49oXwHCYL0ocPz1P0UP0CIOjZ+jiUFwwLczQaVmT6EICpt4YgMUDIrXbIhxlCJke2aI520hcADkA8BG87qhQbZiFmh+oJtlzOlbQ9nbcUXZSVPubpyZWslJaj5p7fm18VIYk5Em21nFl7Hw8nqfsSSXFXksl/EzgoFNiH1MSDEskROIOJWI0sy5LfkA3ty4d8uv4Oy5ZXLBxeVkHFqtNB4FjCTCj70VN9MkXdm3n96NgIQj6jFD180/S29v5//2o0agmleKFHlNVkcxagKzS9EhBEtq1mDqVgkhc34O4YgA0aronROHor/q38RJP27qh5C5WJlFtccvz5W794HDzWseHVSGcLdMuRdd1IRPqGWaZzMWRKQUIBfLEGgrJqZt7ouZNaBgGDu9nF5NH+FU5WWhf/3VXgd3Utk5fOHl9hMJnGD9NdYq9CJgodd8uyNOHFuwPFKw/ig1VW18S5HpbcV+V3tWQjptjIewFqeZUfDbKiR/xcsmQ4zl7ZooefMaRi6LeswPK9HbwNkU2fQ1jegXckWtj0owy/S8MOnu2ju8LaOh9aat/aa3iEIR+/GLMnz5/N8WgAwsTNlwjo9AWWM4E6GAkRhPwKVxISQZe2T/GtOdVdnaWWlZ2k/Dpy+fqOnUmkCiOVKx4yDPnEgF2qPvD2hxPMmQHzFSsqXWBixGMrgVAWiQQnBCJEGCZtM8pihzdFd11DGngEaaZwpvJYLQI7TGT5TjEh/Ba3C9Wx+0wQzaZNG+ekUl5RjWhO8LRQg4Ca+p2atL+tdzZKHF2tqlMT4EOjdyDogiJ8+oRQ3T24DyP3ZLrz0i8sJEei64NHWJO0UIkUtiUVcsOQ53mFmc2l6SvZWgzp2yUKdLGOmNkVRIjLY/R/QHtNO+Pkgp/iunXljfs6QukALVChDpAks+NNXCkHALrys2qLGi8uBRCGLG3vy7pNV2l1/cI1gcKJCD56e4zvXiYsrR2MIXol7ven1Q38+xkvAL8qIVufV7POZ05Teu5M3PlQngiAo02uy2ZFARL3aY9IaWHHbshil9hStaIwWkCm4xAJH1fylHjD+TGLMcRJK09Oxho8Dxn2jhtlwli7hBgmcwQkX8D2JbaAIQ2+Ca7XioPhaR7s3rr6wh2EhZM3CGakUX+TBCv3KUrYp/zqE6djwQZwfcqrQQTL+wOgNE9Dx3fWb+eMzuCQNg51S81iZAYAeYS9bpGQTJvTEzUqpagelKxTkWRRcq8/bAooB6hAcK1IbWCARKRGftvyKYNwhagr43Eti/HXbcw7QgL3HM6ctlQdM4NyfD65WoHR5Sm0CMf+gmwrrU/CehCk1JOmShFW6bj+QE3rvl4WMCzsFqmm5i0hND8bJkEIBp9Tnf2I+6ICjU0YAxfvMcwzzBX9o65OQuyrtDCK98PrmQMhw68uTU3Zbk55F6WZ4N5X91ZUta9TkA1krUonVYxrBK11ElrN0X8wdWGmz9Xtukk6ck2ADnFz2ayb8AU4smxFktXSRFS7gMY3fYud/nsZDqQTRHdnq7L13NSRyham1gWV78LiQNFAROh/mzdh4jlNu73G1InQc06E9sP//evDskbGpCphHiy2dSOilHqoGDYMWjtDQKWXBXgzlED967ZvqA4YoK8kPR+LL+vYl6pB29rRgPSuPab/jDhqAlzvDr6SqV1qLUuZK7tvB4ucwvDKbutr2iC3GSMdISA3ERJVeeH7TklFQ5F3LFdrVHAhvDVnylbFvk84AnaKXqKD+EMdxRlQWH4zLm5k/NmnzHcXiww9x3KRrY1rSmnREX2uLo/XUFzuyqwrg6X0r2dRdZ0KpBiqtZPDDIV9jOBm+NMEyul3NVVpEnIBtEayBYzT/Pr3tFMKYctqzbzr9uXu0XL55DcMAWBRUGpFAq2Enc9AfQV1txzkEZQA2L9+uepbr0TqyNiATQYKrYMQpyk2HF3kITr6zDJcOmxmqwW4eNMGH0vwF7ZBX2iowQ9rE/afSeny93zro2wxdlE4RCHT+2ynix7n/zVax0Tok3lOTq1cH3ww3rONCborXd2IBGUQAcJGDJEnm5cvdfy1jWPX2IQqViyNWutQdiTU3u4L33EnhbY0Y0i1CZparjGMpn2rOE7nGqL1WJiiUHFSPAK3f3RtnRxDWCanCb+1HdPz9fG6+1S15sKraPRZ5UQDKiPtIqQNbQ5YxKN8XvV0iGWLh1OxDq5N0FpVR18rRt9tIUoCk/FqlH7f/7h9itx7bsSWU1P7e1LUR52HexAqTJxS6P1kfD7OXwMMdIIfmkGH7O2wMiOd3cNgj/oAm/WKF6Vk5UxWfFVKO6bpEJ+eQoXpMPrpcl4yXjahTJNzJ/GzcY2a85TP5toD+10uXTJTHKa4YxZlIzqxOpssra4AhFMKAmDVAecU86NKdxj+YU0BjKMY2pKIcphkxvafp7t0ALidY/gMUKA6JnJBnRiyhq2kd3VIneJcUBhD2veBCVoEjaxTWpJYJugv1zza9v28tmVfnuTThgUJhXxqK7gMwJ5iVkEOGUEzbBVJNduohr2fjqwHSd3o88T3PW1/oF3meWlBVuOuB3x//HT5V4nYYNaGOyLp5Bqb7dI2MbA4l2PhCIS2VwPK8phWIsS0poXA9AWBPzoFHbtiiN7YkKadtANXufWj34Hh9vDMaN1FNfi9TO7LLMqrTGUCOq2fYHodMiktRkxqTeRmZZqB/QnK3xJSGQPmFX3JM8phxv3hkjzLHsc1uHyrxdBwVqEOJIL2LXXbnONgoTIWBfQjWYU0zJRhMyL6r5ofLWFbM2JYi1l8pJMDr6jkrTuy/F4Er0J3odkXHTjorfhuIDiM5PPSArbkfZ3pDWtyZuxJtx6hGR0IlquNEOQy2L59f8LnvQrRV+DGxROzLr9fAzeGnyJNa+GnqDPXmhtgiQkrxjZGWvac48/2pIhV7EmsfWgoexQyvmnHaDU5DlpasbC9igLDm4UXmncne+zGzaIX/vpbLj0PGTd2fzyxnzdo13v7bRcMN/4eommlEJMUq6Q2twsHGSHyVsIRsaGbIByUFF9aD+KbbnOnvkrFdsgks3RM3klTQaZP4D/0AEBjXpIynU5pyIBJWlr4DmnLVxA755cRcdECIUIbBGNSMw5Za5M3kpJMLmA5zhej2fVGBAu7GSFB/jZqUcxQNDO56aB2MaDHBS1AgVydre2yDozm4Xza/4bD7nviq/NutVnTY5527wq7vSw+Pz55zcN0tajaOhV0TjhhsEsqvFdQ6TWsEHD5LfjioTj6wc5IFsSbDPCiUeaWIVEdWHgFvTpdCqbAPO7k69TCIslgTx80vNQOQVt/XtTIjm3B/Gyeka/6Reunu7dqeSc8otR8EACTQJpyJTCEfem3jfpcFbIDDofbzCfDElHiD44MGgojMnEq45A7OsA5NLXWJFJeqZkNj2npkxZg++1XhEuNWNdxKRvzSBmVCdJJRnQGCjEdsl94+ZFZcvQ0NXZEcAM9iHTq9Vw43NQ0tRlgewn0XuQEiNwapOHTb0fQHLiPNP4Vqy9U43lemEh9ySFA3fPHDcPRancE1D15POj5stEaahdHKBe0CIXDCxc9sn4zoFEU8sEywyQuxPH6SHhkFqdWMLbHu2uNMKOkirQO68PZ5shFZynD/ji6Wwr0hIp4T6nB/OKWvbHdZ0U2WOez+fu/cGAjhU9wAvTYpaEtuYlveeXRtO2M6TMAdL0g0ynAKApe4jRGpH9EoZsaXsGVDVrN6/5NRiAoB0lOPmkCFpGbmBl3h2ykItX+F6LqLVl6wqsoJlnD5AEkMiWo6hxzSUR1ZUx92E0SZOpmdbFFR3sxSuuUBICcQddIZG64GIyBwGFUNXM5yamGi2WdHru2EFvMk7v3OF9/cmRV5wImeeSxfYpCnLtv2v7ZHqijWFnHgkppK5AIRDaZ6V7DmNboTSAmyUTUtFmuZSHcBmjKQATbFdL7oVEu73d//Ph281cAIobE1cThPoXLXvmwXgOXGZUMgvLdLcVZ86u5aJLhFNSXO4bDQeEANEQq8hIeosm0IGj/OgQ5oQ3987lWga+mMchowHruqYjz2sWqCxgRUmEJl76e3D1XwOKfWlcyZ6dQdFu5e8Op+VqEPerMSFoTk9nk+erQqzmaNnkQP2qU5+aLJPJ5GA2KUamOnSTo9pax5+hhoZ8gLyRmA/S0oEWQATRk3RSJHPKJ8cLZ5L8ng0N6U0a1nct3IrUSC5P5LJmF4aCAWr3QbyeoUW8wYOhp+X+OG9WoIoIVBeXycXQr0FFhp/E2fCr90YSUgZUBP+lRzRK1i6Wi3tLtWJXPNjXUXtJkksWorONLMvzCy4tzxkTsOgAzHd3z1sBW12Q6UKqwc60aVrv7f4CIQGSgd4ESFgNBCIDEmsITNVHP+7DPCQA4xgDWUr1tCT7ml2eymQxCENe8bIBAoMGo67z5I6VQgoh8DyzaLoyujuEmmpGRpeDyiZQbo33yXY4/cGvhuLq6nkO09HhCMelM+gIqO4mn6mGvee2iwZ8uMIpAjnPioIYOmqVce7CwdzD+w+Wle+Ff+pNWmTQZXFwSyKjPrqWxM5ch3Z6cYfpsJkwcgOZ0jx6Esk8m62dcVNS8QwanZP8lWdMgjDdQ/BG1Js7HyvlWBhD28SE0qHB0hKeml/SqMmABzucXpltuHYhhp/9pTMvE3Q8vLLeMyQnIzvg6slLrtYts3N4YhZK5SkcwWkLjwgpYkjjHJCamcWyUtCitRv3RaUc8YqlH6J3JYBSckQglUuGIktgsfIN5OLsI8KSY+/FxJxTGX10Ibkx2uXHT9cHRTqnPBnnWLijMGG8Zjv6bHUsooYVKq0jk8lmTpJNIAHMMgnmOQsrgnz9xUMAwHtjwBg3E9UyDYZMu8W4EutKXRv2DILSHqxR1auGMCTi+muxZHJheMqNdELVyR2aJ6+in0VJU4QRrVDZHnCyilihh03SzmlYbYBgAjjPQKKfllcNAWKKZTnl4iizVOLchv8AedWFU9qTPHc1pcIgyJgytLyAiUQyqZSMJQlclwY/yPBgjCNrniNyQ89cAtkhGW1IkSLgZsVuXvBIuqJEdLN1XZZLkE7SsYZbwsYMqCkaY3iAKEuhZPgEyVlFshJpirbZbuPdWfTjIwsJIxmpTEYDCIivVPlwEyoxxdBS642pGZtp10sKQQ6ni9OtZUyH6Bdr6DiVGnvfDLQ0Ni0IIsfVVls1f7j96QZX43EqveQKWsFJZRKOfcOhDuP5EkHnmYCa17tanl5cEGcX1tbZ6ZwgmlfrZ/b0HR1V9xUeu05oIIDSW08Im9KXdTmbGexiHQUOG+/rGa/TOE+vbMlJmufonQqk15mJSbR4mCxRpjJxgxFYviWM8k0NHhBlw562TD2UYobW6LmaQQAG2aAiBvFyNY+gGlCOMzNovReMJPxgUcPM6RkWikd5Q1sxb3i9qV7TNwURVZSO8D7cnU4UM49weuuMiBjhVWvvboBV3AJu7tatIdNpKxJ6BnV+PsaKGTZpeTgcJGOC753/wWcjY1wgyr6SkePElx9JlPPonHt8I0r1WBWY39edvOCQWpAkPW3IYlGBTCVQb//27E7WRfTWUy5j2IShwkVf4evaqobjXhqg984LYKMZ6JBulhMcYffw41rmDWF1yaLb+aWZFiy25iz5lLmIRgMzQSoDc94ZghCghFumkelw0OJhjpPjRvqRvZMSMpXMg8yuycfr/+eOpFEHS2RfIxWMtYPMyLSn5IncWPugRU1v9ixfE4FRwAmDGEmm7STC4aaslGrrtu2o5KAGB2w/Qxc84jWtcx8q37iwsWXwqhmlVZ5z1rpqiq5VuoCNYQLeIwOup5wMOCnIcepacwhp+q0pAHt4it19S1svkdCGBsbGGhOKsJBY0P3Ey6lTXCmrzEoyeHlcLukCrD39Qij56Siing3ZO/JyMFUJ616J3QopHqiAjGonznOqJa0xJpwB42KCPIQ1zucJ52gp5IqYJJuJzJQhhB7VvflypqmXSJkrt9bS0UetuOkyzAklOolQEumZO1SQhswQL/uhdz0xxrJHWHQtPS5IMSPADKZ12q7xKJOQp0h7gUQUhVATYML4g+N1GuVl9qKZLeW51t14aNBn6YH2sW4Ll+fFqWtjcryacJM7i3jph2eQOAXD1lPS5gh/r5glUXzItUYLCJStrl8sJ3g9TkkZN0sJFARSTjzwmI5zcvMuT/x1agNBVQ1VVw+nh4ecIWm6S5PUPNMbcD7aBbJ2nmFFUNW9gM5qa/mASzdpZyJLQNn6g7mGZco7nI+9kPdQWq5TLosFgVVLwuWTZUgLkdbLZJN+Y2xGdlljdirTyJG4R87lC3GWvLpMqyZqc14Kktp/EeiFQ7AzmVOrZJNth0RmmgS4gG6B55FlF5xhK5IaEJHkIAHGkLapqi2S1/fPT7pUks01AQAO9hf1Z4M8PR7fpjw2fJ5zi30ntu8rzDGv8TD3pbmyEeGHZMqrvbfeEjJyBWHZL7ExvXNACLmIzTSQVZewGjUFyM9f0cUXkYAAZQrIDUJyruXmpj5fVg94a/DJgGXCwrRDx6SelqtLGymk3r0wr+KXZiZJowmlbtJQSCqp3dt0n74R5ZqBbtlD3SwXRKSZmIh0rUkFLDM7zHs0T6v3TRWHJDeZftSSS2Y2ayCUEgyWoJGrDVqNViW95g+8qqFLr7no0Np7QGkm2fYa0fDyQFVBjKQqZAbeC4KmjV0IOWNRqsB4VuJ24rTAoUUYNwv8bEAQLErbrC+y92Iwr59vrQlBlOY9keFHzIAx0kCXvaf+B59xA0H218hx21WqJAsjEAVAArSbKMaBYF6srIlxFMo+wcwiCbw9YF1AsOEe2Zy0W61KO58PSj0gLdTw0KeHtJr4scH3lLMcmpA6xnrIred+psZZN3Bpdzm5HgwrWr+Qq3CPJpKRUBfYfEo0DzGRKeaai02xGKOmgMZI8fgJbeEpQyUyjZneM4gM2/3X/VNCQBd+/vJuIvSizFwuy3pZs6fMSGa6BAks4tvTehf37QQQ0CxJBjJnNIQsIrSgXHbL827uTRgBISCCIFUA+BnpyU0IvlutuzJQULtsIas40TWfpnfSD/1simBrimEefU+9pVLxRO126WadepbFtFOBoq6gWDSoL+U3EXsaZI4EstuFsSQlTp+6mkdO7FKKSGUijaQti7mCKUqwXCZdlGGClofxMWRHeCGx8Q0lfY6TLfPdQ5/8sviaLa1ND4XNkWBkVwSI7GgRUJfJKJvFzCgKSbYvocSjphxYPoXSBStTDGwF5Fp3TRJVkxxSX6S27cZPqUdelt4lLD3TjQEoeyoxhjZaPNQTKMUQECQyn/YMmZQxAlqMfhy17YqP3r0317E1NBS/zwYB8DNa5afPVuKuJP5Kv4Ig/LTEgNGrWp7DDp7AQTQ3Zc45vL7XDpWDAZMY2ih8dmh3UkpXQuKX/aW2gKGatI3uKdMeGIEvTfgizcjbctuXr1BQcrqLZ5nOas7V0PvFu3nikqaIpV+OkgK7hsskpJQd0MW++OD088O6kpdQo/UQJkFaOiGlYg328+pKepkT1QCaLuGDPhpEkx4WHZy5WmgiYSZFZPTINU07lsovbavs/MwV7Q0Wrst6f3/pmesSPeEzQyKLJIRsUYkR73AKERRTCFEBSJHEJDPJG7mNqauVXy+mxpqBRULW7oTUq0dYL5+HQs+duk8AJYdxIRcoGcQna7Otq+V0xNQSnisE4X23eL1ksC7sveRcEfTrr22UrauVXpbDtSHNrxRZKhCvV4dNt6EJvXWEAJIu1b/83pszzlrue1N6mC72yuyhn/O0LAbtmqiEtDwEl2zE5731Gec7a8R9n4Itmi2JCHiJUPSefTWmpgALu2WPqPpQUl6L9QP9RnKimoxSFJy1zLWEhJ23LiBeq1bcO4QiM9cevYtmmeopo21ImZkqpDNgeXjRydhCFYNZaZCCGRUBJElKfXI22eODaT0Jagca4C5hBHzl4OfrujbqLZV6rw+QulGbLFmrFjknTtk+uFzuTdbSpCM52Pvxcps55x5IvTf+TsWSIxNEqAhzeMCaaQJ4CeZ0TEGr2Qp4A5EOzBskm3F9BURS4Ks09PMX2ZYFzMkljU4VS2Sp5Uss9DzfI9KyL55rLpiIBRMCgAzRGYgkI3oXXBVeFikx6dYBEpZ4F8ORAhmaEwFYM0oZgZbKUNaX3F0bnvXaPY+ILnxp69ozTEgUUYxwJDDMvcZhJo8MK4rC6A4LVlQHWUQB2XCzSRGqgupKTIlDbrjHtFdpoAwZnpdjToKoAO2WV9nEVKFN0Pcy+2XP27PDMjK8yTqE9/eCZHFXvb5fNqOkkwqCQKlAHNeIXBISbMU0CVxBUxLOloKDTFiLbnmGW4SRjowHax2gEwdbuHfyuJfO8HOwhzc/q1vieLnzyRet54m9NaVCq9BlDQFmxJpmqYyQZ0ACk6sZJLXr6EMDgh5kjkwRAjeOjr5e4rzXjWuqdaUVyXnGHrsKa1QxRSTQL8vDwxqZGb2v8N6lpMpsPh1OvkPZIaVEVEVQFYLBPQ2TRmBjteDcPJ2FbBzgrr/0lbn5hfSe3LMcYgKVELZJxhCcl5GlYCy9abp96Gc0MR6IcIGJX30X8joO+bRzC8sNobcE+tklTBdzpq9EkMp5UkYH09KAIHAWbemBZLejXSZGpJlP6AwI0mDFpVUrsseS0+pm7gBserCLhQUoMIOQpQCKpEXCskCUW2ImRCUsyL0/GOSdLLeQqVASRLIBlqlco7cda5eF/g2e+nT7BvPLrRzGXPsSERnrskDhjYAMws7ErveJYEYdiiyiqKLIophBEEB8etTWZWERYJncrntxwPvVOvscJ37bHHcBOu2iU/JiugU3KcBlNesXYUKIbo0uefqvwiaRRxQElV6qCwktrxoEnnsQsHux9TORYkxkKFaCahaScl0c50USBes9sodmCzRiZQ51NLSERO8drfWzh9aJfTmc05s9NAHdghJgK10g1CURMBnnB6vnbmBCOY4Vy3q/5kBIEkVswJ3q6+XeJl43ya79zZ2eablpFTX90jhOL5fVtHZlNKy9ZyrEiESWnBlQyQXh8aFQp0hIgKRCYAbpWEG2UcVHXU4rWzrAT8LDqhrQ1SFrfVV2bh0APFy/nqOR85RDXtrMwWfxoRHMur277ZwBuUUQ3ZnMjBB+RV6loXpKmSEzUwHczBeKrNmZr9JidUs3M0MEls5mYgCIdYX6WdCEKNhpVJQJYbFYGWmDCZnIBeE9D4BW5eqenjHfqXmWzI+Uon90OcNN6CxauGXotBb20pBElcof8tO8h+GN36WKYjtTmZdFfvRhU2ZdFxKyTHOVO/l5jtTqsV1ofvxhfu2mNdkXxhKAcg2sSyrN4EbjNEksHh4V0wCA0pCKgKBADJsQjN8AQjfCumz85aOfFN8CvYHf8KWxAoD+aXdfZFT1HQPExF2fwaRNp5ykK9zRtTpydTlS06ylzQH8irx2AAJQ77SZuruYK7dxQF3W+wFJu1FkiOFQmq3eU4nkoQepQj31hRE5H0J59jVNmfLBes+McFvLBBWgph49XTn1DIm5OFKgrWZQV1KUZ6xXNtiGWafqsFy8a7BpbptG0kwgm1IEjjOMxRuC44yGW3kkDMLiGY5YBYSokaU41+GyyyXSjy2gXDF5U5q1qRFMI81ngr5bzVmQSEKgUe7pyFguizfdTX2+/NxOOSHC/XSy2KvVPu74cvhJ/YDarpqGWKCXUQRK1Yay0ZbBSkJdqB7cEoJbj0TIIOOv1htLHhGCCCEltbkzomNKCD2sb1h09uEnYpeTzKR1MvOYK2Q1V5To0aZcL/2Ei60ipqwWGTzX55K+kD0RahmRUNIS6JwXrUzP1WUqc1PmcuNS6rwddnjl+UuoRoMnwSPAQBAJN4oyotHnxIZE7K4pFnVaA/06eP8jsQAAGgUpCMlVreUS5zNMoInmFlK6idowCEMO+HepupA76ElShM/GSEoHi+nJ85tjv3OHkLeLA3d3gQD64rwNL6372S28eK2KW869MQo+Va2AgOk7K+uK+x88uXdOPEZyanPn1KZuc2+uX613hIacEiXKWk90ZUMQmepucofV+xNkEw09OEmTQkt3kEpLXdKXyec4mya0s6Y+zWtxSCvSuq+xki2WyAliZyNSPV1qVDeCnURPEiGLwBhDZuDpMcS0p1LI2da8wYiWLQ4zDKmVZjxMuIk4585ftZfVynPgVMGUg3c/0ggBASOHZJFyXlYFnCkoQ0bGKqWVJCHf8m+c8TDKBkU9zGRtPpxun9wcjifD+YAU1/b1FMw+srhLGeCldX/jd/QC7oJNRQLezmFL4MVJuyp1tQAfJj98ncfoa8oTwNFhhm5AB361HtxNRDHXtIxZgBIiV9HIQxNyO6Z1c8+GtTz0tpYRBpNkrgWYP/ic6bFS/nDTc/JQsR4pURkZ8qMWNNcyeTcgLAMmYLrMlkFQmV2kUpjIUepzeg5NSyaqvzWOjKqbZiRFJixhbbJDf1hnaSZB0KnPVaaJuVaBSCLeb+KLY7jHOYiDiKGluXiwHhI8aWaWKUpAAhLMIKlkgfeqOgIDttEgEkYa3KLlGpa5i9Ude7We7Yq1pzdsvKTuP6+flj8A0Aq0WoPXSvuaE6SUexTLtK6eEMKc6cl0l7JLjo5frU2AdtKQul8W+iVppfLTnOyYJWLVBDr70y+8dQFhUyxsEjuMHtktoh/6SgpKb/NqkLoJioYzNAVN6NNka3DqQqRBPRVQbERo3DgoGNEBzSk853meMbb8lPxEnlMqDYBEyZrsFF9E80leq5EmJe0mAmBBxMM/9a98gCgUd8QBqCeQOPbmyIhs4jSZGwKJMklTAsf1PY9YB2mUqbw3gbBtL7PLQpgLpt4vcJ9QqkPlXoHuF7f/5B0BQESrGJKmzNpvjIQYSwULgElH635SQIx44mGWZNJ25dGvxi8qplTv60OfOyXUrxONQCNTSuaM5Lw8v19lkCB1yGSW2bSoCXiY28WYTpp1GQBmsM8AQ5kwhS+sXycoRQA9WyYyui/RWqBLZNEhMeeFN23bcyIz1tXurnwbQEpJqRnInmbpTidA0CL5cDvDeoKOiEf37Ewyug60Islzay2az6CyC5AZjWpMaDNu4LD8jtaXMIFFfjlhhoOZs5HA/cNny7BtZ4v5Ee0Ra59GCi+pu/74N/+b1+twQKJBSpzP0dnYNlTcTmsb1ERcL2uKvo3asjwEaO7Wcse+/fL8K7ABxGB9hWUyED0VggKCu6unDpM8LyAe5nr/T5bpgERvWN0g0WJlp3c7ZaxsEjqpJdAalrxdKe+5ovUuy0BmvCLWwxKAz2SEdyiHmQZpC00bwfTUGHIJ3t3xsocBIrdRcF5Wm5myZoNfuKQEUzk6JPo30GPM0B4Atf8B0OBVBrqrn4Bo5kd3GEKRgE0MO6QRIgGCg5t+z3WXqPQiCDrMUqLkWLruzmZlqumtmkBBd6mq7tiqCi+lez54E9qiGHLwyRvtKty2jg7zSgVatLJ2jQuAWdASmVMmTZykX62HWHO/nmcQhlpXj1BkM0HBzmnDzJKjMmPIkAGgdZvWjUjw6DenVyctzISm4yooS5aGZZbnZsjEkPe1dagTh2/nZ5Yy95RarFSqW0YCqdvtPOe86NMOYYuFceYcV2RVG2Ykes+c3cHG65jO6eXQHtwJQKB0byCJe8eK0PgBgxManBC1hjedddQsRshbA6XJjYAxl+K+WNYdL3lP7zkg0AAZCaO4UXSzBRMqXquQLYDCIBu0Zt/XHRVeRves5d3ndT0kEruqf7382MHqzeIxIcY1A9jUcTocGnK1cw+k2RGZogJo+hXauFcXKXJb2SwRXxqQ5lAX5Q5yoUOLyQpsMgWqY9rwJSGg++XWM0zILNkamQ25IhMd0c5ARkLpTHZ5D/48nq6TQkoXmoLsrMDIOc/T9gxZ1tBUbk9Tl5bFA6JRjkiY0Eg2uxKSC83CKiipHBM4DRkP+qznqFnxRNzXcU0YMifrc28J68lpOjRFqBiFBJQgJIDP8KEzyEtwGxGYjjCDmfpyXyaeFrAgAFAFVTUwwA4PeAndGVVnCjtIGcd4WW3/8s/Oi5AsFo2tY5vQREwR/fXFD6lYcENGdqbyV+jdMC6gTvowpGBhWrsMcinpaRZJT0GXBpQMTYRoCOMKa0RGljmBZztoWsC2ErjkIdCynymGErkiqIy5L8YLbA1vXURqgw5rSkhZ648HnhoQQu15Oj2CZwhX58ltlLEa6YTZNGtwDAeZpWaKmcrbzjNaSO2+izaikQ7a59FIcJFZF63BOtkARyhDbtkBuZtNtJ1RvRt3HQJkcaOJFAmRhDM8k2rjryyOBkbqrmI65KDwkrpjKUN4E7ewWd4+H63WuRCUBGpSlCRxPS8W0SwUzO+cL8Yk5fhVurMHoNyvCqZSSLduIjOaQWF9gZEO1C8HiYAJHYgIIgXJKxfTI5dYp+lyf4PgpQPZ4WumAoIK8wqG0rnCzSRkWEMqiYQozrAEbMe6aFe/nspzoxGmngDVInic87GgzgRdrcTAzYxLmIZiY42jBgTuUaigDzDUpbuKCqQaDOiZKTrMmaKSjDq1czO+/QAkPItURrcERAemNM+H1x/qi973zixGrHQNUFWFPCyD8Vek+6WvDdnQGPhwbrcUu3H22kqMAOurHtYOhmzRnak2OT3tV24jMGxGAcZMiUoxw9IhcoJkviamgCMVuYEgzVSmiWwok0I40R2XBiq6iKUbOoIRG0kAgiItyQ6xU4kupjMas033l2fTQxO5EaYt3ExY0iM6vxpqIj1JlHo2gikvt3zuThosb1fmGA4GyRSexQol6TEcqggDripRceQck/c5yYTMxLRgyy4e4E6GKNUnJBW1VEIo8b7bfgSjgLAoglhx/8kDI/K0mlNf7KBjRdDd8gp0V1UV14FNGwuwycnXbqkcfcu9ckyrOGX0ya0x72nJtDDpV/IXJZVpvhFkTTJxI6DBcYhGt7OAhKWAlElQA5A02RSQNiBZEAkZerhSEiI62dUDFiDZbLkw00QqWyZD4DxZ84xDf9DNmk5BWZN7XvAWyEIqwVN47lpmZJEcFFq4sWMavDL7vGYndbihWthSMDRS7cDsYRF6iEY1dhrMK7Z8YS5IM2+toU72FEhJBQBIzzKm+uMiTSKgVNN9hKooxmqMhlaMgjZNpap7ir687qoaTZmghdILcoBN39CnjSoAc0puBucQkZ0NU9MGHRDwK/U69FTTxJAQRIJKZloC1CHUDrzP9JRDlLRhwYT0+UJDW7dtHXIwCNafLRPGgJ8TmZkbcISybVCR4vamsVaZbxxxuJcvJpnAMiF4UdTXnmbG10N0gkiDYIJBnERo4lWvTPYv5tjCgMKFsZArVSVQ5dlhv3IqlXcTmG7WraXBJWNGNDBWisUfEzOLj5UDeGdmXisEZJWIMBAKHjPPoG7a+94cxedpog9tPwLY/xczvLzuqkpZqs0SQHLS6lKeu3LDyBoMCSROXEnRe48uWkiZRdFfwZtSMVAGowgps1FmDLeYg+poSqYJTCR4XC2VitOa/TwNuZiYFZ7wc1oYBESPzGQKIUS3jOAUAUBpYBJKkKrJmlZmN6KmdalhXRwLt57I9OKYYGWKlCnM4L4z3TRvYBYTVnRcOEUknqlo/RuIqly7MJUwIwNyzIs4ty6jDIi0ngoLgsaUjX6J4DuWdYZBxPEDRMKevF7W7gggb+GoaY4O9IdQthVvohlWUNVXozv4YA/XjcOLgGo2vjbcOqM+OxR39BQkn92Adsz05vrV3AASkhkhWkoZkcTWO8zLlBmW1lYYgTIHSOuUkjlXwDwzPWmEhWX31qEUjZHJDKSy/kKZojzTlFSqFqJEa5abQY2rFABBOerX6QmNUTxTVI9U77cyM7lTMI5r5TPGrdpNHmQqiEWCE3s0Y0ntYjwEs00ZbUoN7sqhQFhnWoSCE+WUkBqOGBz1czi/F9ZBDEtQ/RwrEkCKgfnJ6a1o7S3+uR1bo/u2V6O7CrMfPxSXL9ryqsDEwZHkHEyqEEv6uqyx5OEgWz5qXSn7FfyFFEsyC1snVScWpSCRtEwRrkU0QNxwQCbMoB60BNMAoxmpgEdHYRYS+aW1VH3AQJIIJBOSonCyJVrZiuce6ZFJDSVKhEQ74Z7I9B0Ck9NMBCGXjUSLhcIiGOSGqplnK5BIYhGmgeUxXpzXKTwJnqxrPcIyGjqbcnUkpvpVqKcyzQkgyySMwfg8Zbd7JWOS+HJLTPfIFtRpLIpuIwco5REOVqOKDjovr7t6BjDZG+u2yUkuStSQKPRgRBIlm+lTyx+lrac/8SnX+2wbOX/Vtt0CkQiyTCooOILVojT2LB9qLJhOIYEJKSA3eMoMyM60g1Ym3SWmhEBbAaGigpmkCAmIMpHBPVAtIitSgppZ2soap3FHeq5gPY5wUSmAMrMrLcXUMkofEmI5zx74UGGVekALnX6IZMumlsmwieulSQmaU2oOsujCqpCKXu/YxMux1k0CZZBkHcusBGCfKzcd1b6LcUo7fybrzviu7kGLGwqhGVV9dhHBtG5sSEg7RSca1fkcwkjPh4dU/OL3THKRJa1+5V65WxNGGsBSeSSMbRJD1lcT6bTY8FpmydMETL0mjEPIkrKmWprQRoU1b88bZjcCCBOYALVBQGCI0GCSKAQIif0ntWw9Z0kW50pNm1GqpQf4biiEjMMp0oRs9fThSCFkQaU9ll3G8yp396VFs2XilOyG9MDcdTHZpZk1oyVoxcCxJgXo3dSdRaTimTl5+PjcTQjiOY8X04KDzweoMKi7vR3qiZbtPdyne7Q7uitd87NJPG3HnqS3LVcpBpMFpEyiFQgt4QEzuLKXlOSv3N19iAThNALDuDlsyXm9eIqmGauhs+QXDExE9zLPEFlKjEyaIiQqVMDyMhtDllSkqZkiXQDSunyoJlW/E0JSaYgqiQuM/LS2D8rTxpnOAR93FjHO1144CINDSWlaAVYh5AKu3KrUIxl6tEsaLUBvrt6Sk/VgN07M5dKmjSUPUiIjJXUBJhBZpXgnhR8mt6oq0pr9sk8pI+KcbO0KrQ5UIQ1LhkGBzKDoDYTi6Ww8UFVJe6lwqLtqZ7PJYHIvAMFoLDqg7CAoRFKBHayxWZcZ5akpwvWruank21D+MmMFIs3BNPR1Qv0FIoiSpCl4ocyPzquUMEmwloDcck13lUsAIkhPbeRRvAmaNmgmlCAyW7WwBNM3CGNBRqK44LDiOYMQVQgEkmg0YZxVrMDCJTVB11CwoaMwytWtYatL9sXapUEuHpNpNItcXch2SNkDzZblOHfk8B9oIyxTCYC+my3vWN4RykYNAlMuMMgOoi5qw0aTpKiccVh8GkiRnIDEfruY+Lp/XNSTgeqF2+pQd1XrKackQhjBZEVbdoTalRKgR9Nz6WzG1lIi2QjKRPuVvFvHrYKYWMyQ3HqxTlY2hEBSAs0URkQy0gMJZIJyceqJNPS+AcpIkNYae/qXtkEElaUUN7Asc5AhRRAKIVNIAo64EHVgnvt7F1HdMoAyM0CATPRbGCuMCqC0LFALVOG5/57oSVevv2u4eb/MFpI83HJSvywTTXlQNE/BZxNcQGlBBV7vovBDuWdxjiYD1BLEXDmLiJTb3GKOCYOHCKodgYpkEUOryWGTOJYtQG/JAiDlXZ1VsTOCKSqCgOGorNdjGcSUnXCxeWE6u5mlqZNKk34Ff5sA63kDBksd0cikAlFRxCEpSslZSY9AsmRVKT4mjCF0NCxmKZizc3LP4JRZaqd1BhilXapXVCKZAoTMkrDKza6eqYsi5D71v7zUSYVWJHczDV46bAk89/1YFadQSAV0cyyRpkh8aTBpUhrWPE4LbG1+4QTvF9K7jEJy8kCsIiUJKYqsOaF3U3gIWed2E1sJuAE0C3bAQKRZSCF7324NtNvUY8Qtltx54zHdgfjkAWDWIoJiZMRdqAmKCFlBRcRASDmBBCKApLkuFDwXN9ARyEwIv7ovBMb5RdwoHCXllbW+CCSoNnWKqmkl8tIQcuSGFw0uZao+hEigYnYye6YcgkCEVLCJROUHMkVfUNwUNx5Rct4x6F7kby8II8qhGj01ZS/VBWj5g0Zp6YJVSZtFIO9wKEQYRHg3mmeGT1phnd7RLCLSCBOzwS3QQrnzQCYVVcZJ4t0U3lQcEplg0mmImhKCGrEuAjHElqVdh3VfZV13oYqS/XgaeXnfnTIF1gjZQHAAMBBcVQREUkLrQclnBE0CKklS52Q9WGRPKcpsSxrM7Fd7AylgTBgIGVBCNqa7sRBaKEUDkmX+oOQMJZwELYmIxkxtaHIlAwqmQQI3ZmYyBUEJ5IaSSK8lpqGyXO8kt3PkKaP2BGjn/5GMIgmpm9hfZJvYBQllv3ChACqMIh0JJc0cYLjntGKODlm6L0SEbW1La50N8pARKYqmFFG15zt9y4GGeU2zpYyycRQBNA4g+OBjp5o0NOtO5ymm5FMVO5jXxdrSZnV/2/vSJkM5UixwILiIDFYtmJxVsbM5eFDBHAQgpXTmZG6ZhEsIwTzFX+mNQ2IrpTIOlbyhkahTBoypo124c3s21PupkFCfAMYGjo3afMPPVJgyZWMpKot/KXGcZsQIsuKqeq++Bi3x5Ctu9Y6kAVbECY6c87m2PEaC2ztV2vBaUyHJjehzsCWjJ2cLawutY7EmhIuQER4uMaMnYGACGowA39m1qC741NQNaZIsqmwzgRjMOQvmGPqOuGGIUbUHhDmdj1K9oWQpRcakSGXZC2aCawx2mjhRVIyQIGtOkCQJQlAvNzZ3J9NkuQrQr+rv7X6Ahqf9kgSkWK7EmvsOJS/9AJkSTM5dKpUZG7CzzjMmBJAuKUKZnTWpE1GKkVHrUuMkJCQlMcjiNFGY1rPMT+47UTajFflxrh9xJxrNRu7dMPtiFhkaLET3FWSaCTJpZbiBMrg6YiWoI5AxJ9ygIJBWJv8Eq8uC3vkvnUVegpc0kbyFnlGISAEyAmGfU/BdUDA2ho78xi7kcjpGt06GQTUE7tFlKw6BBEAHRUVBIFSdqoeEIhIVJCVHYIRkK+SRoKmEupr/6n6odnqbsX6AlaykwAQl38BY6k/dIThVmTfOjlRpCEh1IgUlpdRGFklmcYfMlCDuTHNClhkIhdVpgyS/zC9dirwm7oRAxXsa6XtDt0NmaQEmLdNAA5FJZRAm8XA8Y13WA9Xg6hRbOgxpKYDbFoBAkqS+BsIXHY2ckqRHTwyqmAFVswxWQQCRDAYlxC7E1krtWrbJJkRW1yXFlCeY+xoAMovuQFSNRM/C4BN64KiJBTI94cjoRHYlsBfeQ/7qboJISKVXacQhJUghZQnKNp6CRljSAoUG6CgpmpbGknUiEtCGpjTRJZMoIcv8gsIgQpK4cSoxOFUMeRHTa4NXnPTqDTZOKXw35gIoLM2dTFQSKynR1V2Z1h1Gp0M9hU5PL+5yozPQlEEDWwYZVfwxNl8L4SUDytQnASEQBJScEoGKCJBPkLNG39p17YK6hgpJBCVIBsqkGpCsKkJwIhkkXyODBBMDdYByPSmKpJRSWnJJInqSIiJp1bL/an9p7WGQpa4KQtnGMnAJ2CmFFGQJS4ShUw4kDFQyAUoCxUxKGzBDSUEbmJSkjBI3g6DCQEnI7Rrw9J7XyqvGXUdNq33R4yQ0ZokRsOV6vmj2FUBPY8cxkZOpu7OvIRxMLoBBuDHMIsCmjdFjZwbecV5fgyYtE6lBV1UV0JyismYc3FeQSqTUaqF9rOKVP3TBoSCoMCQtNIsoWMC6AQFJCllzmzEDqIldlgwpYgeQcygi18zIkDLUPz7sTje/2q9UARg2FAojOYJtNBoRZeCXVmYKgYKSRKZRkmgSjOBmwjZijASEja7OWiQ2ZtXjNoDHiPFCJ6sJqhC2G545D+mELjWFr8XITTF/LWfE2jJMThIGl2zjiTAamtLCrczCRstwAXAm5JKYEAh+jZ68AAgBQpVioKAmRFJRAZGsMWvwYJTL01jpuPOspfQEI7PNYxCEQJlQs4kAOfZGs3Y5cMIEUaMCSS8gAlnoWhnMoiy1nNiJPxIswu4EMyKgmioIJTA13KeTUtYphhAThtzYxgkFMoBBSSajFECdXnKDh0ppJyhKFan4/5J/eCERIjXoJSlm2uDtGDZzzHHaPnx4jkNKp2N6Cl/0ZuITzXCW+dVSmtACTnQzJBw9nd27Ed4bgmy2kpZJxiTADH1/Fv6arFcpdJeJoiEaLIgMGaNjIesg2HHMNgfKmgr0DgLVWZE6cSmjoZxQYixy1kAUgpjsBSSCJEWVnHj54BhGKw8qPYH8bMEfFRaaaBliHpZ6tAQ4SLJ/OvhilHRMgi4mj8vPE5oqE/S083dSntNJb4e0AEBBB5LrnHgRu1FIZVguoZ5rJJa+Xlaik4wematHnwQbwkAVYmZmk0m54SwZZUrJZe2O6JRcWZ61FZsnX8d503nO823OOSWdv8TUjByFIESzAvsVwmE8XaK9eGtGlNSRgkzR6ez9ALXjYXLD1nNXtzbxkvNTeaOCtuqUC5s7/fX0cIyJ2aKryUyH6Tf/71dup6Y9remhg++GZ4uQFJQ3mDEP7Jxt5rh2tuaY8pDkCUPyNAbx41fkGZDWvIAu+HNqWteRFDqsMtFF3Ak1E41X/NJFyi77yJR6Eh1dGXR1AZnqKsGIMDOKZaIgwtIWGmnsZ3kKMq0Ki4wUfWWcFQFFdscP3rfxlSndzul5m9cZK1Ph6XwDv47/RL9VlzuOk78UUpSMomyjWpnumE5uMzjRuPqc0zrbGa2dJs1YlXPrsgDaGjeX1h7olKUrkR6BJb7cXGrXp78bnkim3azYl/WhTIwp0TDWuXHKAXpKx4U7x2kFkj3nBTdjQmlO2XbBvRiIcJn79Of8agtutVxSRkQmmKmQKYxThkJpDHRGmluR0ZlMhoESg2Gir+lldtrwYXkJWiYvWgMZLZaTLz4nuR6f5vyqyawjVBPWGf9CB1S1UsEQIijlSmWK7OkRYWm3J2iejDHP2b2xO+WYD8TMsMWDZaJa2SA0R0xhiiRNa8zzy5/5s1+leU7bp7KgvxtOWHSVKKuQuCC4LE3ldwyUYj3GiPVlTOGJ5i1RC6vjyZyexlZUpaPgbEhxoUkhMo9eb0zxWlBUmUSUGbI+I1MpZXoozYKSLB3LvG39GLSw7hKsR4cJ7usCQiuIyB7KzE7lcrNmrDT27bR8G9zwtdnq8/Va5tP0mxRYCCARAZP6gkjIoQj43I5i8Oi8/Cb/YDawgcbJD4vJreuYAQaOiPB8/UKLzWtzISmDx+23X3y7/eBfoqb7e6ILOSuhvc5yS+Jgkw/lKjJ8vJ2ndfzqD/awT5ygQWfFFJ3C53RydMsc5Q0aTS//I5elMgVQQlZhQgTXEC1KpVgiJW6AU1RmWxwytqLgEkpPTXZZy2MKEuhCT/XIVTxPT2kwdaLpaZsTYRGLttwk5gWd5+qnCkTxXpmE+oe9SJo9Emyc3ObsPLkdb355NN9AbTbrByyTI+CAd4tlMje/s8MCyKacVlmcc543xIQp46nvlAeiqcYrnI9pD188UYinjoEHc05dcId8THnc5IvAUlloZkUP3BBU0JHLFOuJXnIzyM4fCAglyqmSbUwdnfCEIuEoBWPdwiyDpqRbNyaRQhchOHJlhOtskqhcY1UuQMqaJ1M657yAzkirjOVUqgi/7GdOcZjM4nqKQMLDUwlGKjg3M04WaJMrDzaZjMlm0dg66AHAonVN0WQXBw4Rra+HcAPO0z5n9dWC7477LSBs2XJTJo4F5gqfx3GOYfGmeVr46/En/DwU81Z4GgftVILPOLLU/bjR6KmK/brLbLX4LOKUiSWFdAhCMjMikcbyPWKSKWkKSumgh4goNWQdzDSDohNiT0Yge/ZgXxvSU8Pzq/G0T+mQZx75iqnXdZ++5rSNkzJuOJeuKr91oBkODU1oTng6G6bkEdEP2RJwZBLKls6A3BDp1jHlzZJ98pxRvdOS3Xj8PXFBW342DQ5AoQBLxj6GpcOn5wjgrxyTqbcfvoyLtllmQk4UWoPjXinq648Xdr39dkSISUNCJqEzlWTCFEpaeGGDbMMllgZjZgsxir6s1rJ366uph60rXNI8p6xZ5p1PTXUdYPm1f+xsygxVUIIJmkAIayqM0eZpkqlZycQD0DpnpnmLoKWndToZBnFt6oc1JqckY+u/xERTJvQNfXe8rq+j1GOdjRJInjhgQOfVN/C0JjrPt/EzZXHKqeVCUErasWwp+3G76H0IjntHK9bKILhxIE2JtVBYpMkFz420syUsBTOEQ5kos3CXtrdXAZnZhVSQYc6TSJVOcZISQ+6190sngOjnNRKKhIoqCaWMNmF2NW4Icm8I2UQ0AyRr5439uObaLs01dbWgEu66nw2cnp6annMuLD6+Hxpbd3KM87RRtOxAsoMtuExhY95cUKQylSo9bnUQVPKH4rhVbZCQmxEUFAUok6FtmMmUo4OwDTjhQQZZizNAwNaQEliRoHoigUCKU75ZujaK6xGWyeR9DEWn3Q9QlSf1paWh0VszyhxwN0BxoJFNW/t8AxnvfSrYDHpbxNZJmBA2z3hD2SuH/T1ymmVNNKuNo4NSnExPBYUthBwTKfZuXoKjtCSnijEleaHtI7Bcg0IaNcgqh5CptMxJFBImmfVsCLQwBkCVEWV5OFFmUiuphJQhIJhTF8Cc+etIiaLRFKW8uvOPSjewpIcypbBtcW+EwUVuZrMIbwmRAVGtT92IKmN3WJ+Ulk6qLF+W7J2z3y3DrWy5zMpSkBcXtoWwh5x7k3DBUAGDPCkaCNMsNx+P5QLEKliaZFIiQSnBDjOJoEWadRFJ0gO09HUD3njUA0AkmQlmKOoEpFPWmHJos1xW5gSRPwrf9xWommh48iwryzgpIxnWnARNKTMAngBTANNoK1uBT4fop9P9dJrvngOJvgRtTYwcE2Ucp5CjeiAR7UpcZ1Yp3C4CxMFoLVR9KI5zlKKITKQEZZlRmRIpCrDkBmghAB4StRF6GY+CygoMKZWlHkkWyRa5mOGaio/CeA66aydNJKmq5UYSbF4mGs8D0shpo6WChLxzWktAZEkZJBNdkiHjOWZK8nfM06KtQ4m+Lp2VSdBZtiXnJw+BVVC8WLGMdwrNH9qaW/VNqDSgIjEChGUyN4gGGZlWJmQTiFqcZW4OUbnxZkpJZMh1BtWUsQkcq+RI/oh8h3bWoqCMThJoZB4jbE6QUJvK5AIlLK3DKBmQVrgpU0wQKE/bbhR+/zyQxOJ+DQ82cadSnpY0BKofKsuFpaFroT6sS3lNG6JoWyaLpMhMEjncUQXKCoBvcEnAJCqAqN8vIpmAlCLwtKYcuMhqxn0wvl8fGISCYGYU3WAbBOcIGuG+wRkgquSiYGCZZ2gWkFEwlST9XoplafQTwxAkCLCRC4Y9xFwtNWwsMFayfHgDBnU4PBto+BgmJcoqCtOTFOo9NtUiAaPIwLYrL8yNHRkEHLY7BCHlRPygfCeqShhUR0ICt8UAK+fBIW1mXxpFgwWVJFTQswyRpLY9aLM5GvpOetAjuCtJfgmDZrd0JNZyU4u0N8f8sfmtsodYeoVAliKVJiJBJhPMEgzREkEgjUykBKUIKAt1isWLizufxmm8PybbOWYGJaAMqxoBQ/k41hmkGZJWGEFTihz0BZgNMnEjgEubC/G7aTMNAxK+gqYovWDEDJeSyjvRkVlLAn+QS67qnqozZ5lYIAapdEGWljDV+CQ3QNh4n+4iUwUYpebw1eOALNd9YK6zZE3pDfoTW4skMRwKUmamDcEiwXpiEZhMHwJWEhK0XHy+ML6nHnS1GEPLKmTsduzFY4ZkHDC1yrZO+eM0W3VPQAJY62iYMiyK4JAlq5KiiPzSmCqIQakEomCXg0hQtj422/dzR8BgO38LnSCsnGoQSQElCOkM2yDFPQ+4ocl2TZ/0fRU75ahSkCViL2JWeveHixbTH6ndo8CSCdqTjRr0Dm5EkG1sw/N1QdQOcp2VspI4IMzHWm2jiiRQR8dBijBtHMOtqBDaxpimjXTHg6q3av/33iaJPhqiBsZYwg2d93s+zNsAErAjZp1jxfJ+kgVoNGJ4wBDrQRDqcQ4l/jATwDouYJB9x8aZphKoAJRIQDZoy8qJ4QMqwffbg0dxkLNr9cp2z0c7fBRRZZwQC00ZZVIEhZ23lBtVoQSqcSAIevlDtZ2D8GJhqGNEpTCAYmUQSlgGYFXokWNPbH+/DTXrmnTpj5oqM68/98dk0VWtPBWNxWGKUS0nam8Pauc9DrhjCPwhZ4O7OUTsnEtgBwAwiFfSjSO0WI6rXNb34IM7UO6/n/9YmC0QAmpFJcfpNkFdk1g7APu6+8N2nTvjxNgrrZFiT3fWsLAcJ4DDB+h7tkM0RcVmcfmPitkCqKovhULA+oxxpe5G273Sx+869yaZocddLF4jFUGhjg9Y1nfjgwcSmj8mxbYj4f6N1FQ4oEfOs/pDZ+JlOW73A75CGsrKCDEMXBn5Pn6XP0aFpsfdPMWKxK+iuv7QSTNWhMe0qB2A0qtBuTLy/TrUpd74Y1dhuqYzQO0V2qMqTH943Wo4PE5c4RGFHf330IQ/Zl60X4Ai8Lgu9Ifj8yYfBaR9GO6/9zl9u717rH7V+NZJCH9cvgiAfnX4/Un4/+u34L/mD9J/zX8UB6f/a/9d/DfiH9YbjCAA4r/m/zHkv67gx5CISPKbdmPd09rzH/z4Zr2PeR8FRHTwG+sfI+imENzHgeh6EGX/ze70Ym54FfOyfQNKRGlDl9/UHiAAkG5Y9aYzBRAHPQJCJIrGkemb5X6+8W0Kqg4yDKsaRqDRBbG8fEPccC9HymBCQgJkJCIWgCiWmcjAb3QHq12El/rKAasBRSJkAAbmPI1IAEmC9s3uZ3Qvzcvk4YcRllWBUMmABQFhBFrnl+ZW2iS+GW3wrf0KYTEDEtixpjIpRPYwgmnWxv9Zmm8uP+PdmA3YgIyS2iIjI6gYNLXJOmgk0nPYiG+Wl9rvgSVFcYVHx8akDNgkXOg084Q4tvnNciPtuXOxzsQ4rkO2TpkCCDt7kCb6tAokgW+gX3QP3Diq5SILKxWCUYyra5rS4FpBN+ib6O6eatw0QlkqZ4iTemmCcW1e3VomjgtghGCAU99Mr4SLuiM7VgJVXUIBBcWTduhN0doFaEh3mgT7BrM5tTdj5c0eLU0mLVljFzGW/rIqpMSHmw/w4JKfLukeduDEs0Qavqk8IHu+CetPXox3zpIxPC+b4qhMPkBZHDybdQb92Xynnj5dRAc+iHhYD/UiwjezC1/jFF6Mx+zA0Gx6Wo4CzqDjQPFg3uWnk3SZzlMs3mZ30hS0BPWN7F9CpuK/+Ffwxpy+7Z6z/Va/nGt249xAs5qe3Os3t1Oe7sAjJLfjceUCOoPfzLZF/z//tMKNcZlmMPv2CuY4Xhfr/rh2wlbi0jSfXsECoD3t5J1DTgAC8U3i7slH175dXLGdjyLDxn3vmy/xdsQofhsfvjEWn7RzD9AXT9pDv5zj8GTtyRZsB5LZpTQwAQPwI/gPAiHLAy5l+ggA8/Lov1iI4Y9+bm4IrFOExftecGpMOBkbK11c5Iqb9ZImc3iwOquwLcJlOdVgFBAyoXJgGDT5jehfKdrzBcO0iznt5yXrSTTWFkhOuErayviAeErO2S4kdpyf/tppmk/yY3VZRIBICBSUFMC+QbwAvT/K/soQh/YGjJayD6rEMWGZbm8c+4JEZrFc5xTRCtvpwHB47cnkoh437cg+6e4GUCaNimJwCH6jed1/bojzCAAMN9+0qGj5YvzW7tlBTGKSmbilU4V3JGCF6CYurOuFLyej6CkUwMYLAKMAotk3p2f/5r833xySl52OGSstyWMtzmj7SB+Amni9XR3fpEkKWveHrYLYLTjVb/w8GQJBBARxIwXxm1D73X8Mhrj9YigcLHXHOn0Zqk0kUObo9d18zyrYYU6rvGeMaUj9vNfjZe4QFYwK4eICgEHUpWHkm8KB08PjTWUHz14ILFN2YtWfKt2GjANAcAKRBloAmXiJfP+iXn/t2cYRtmHadqTO/fS2CXE5BsKkpExQ3wgeQxX7R/5fePMLjrWc2Z9VrgAIBCCjdnC2HhZCUzS4cVA0+cnU2gQKptm4ue1L9DkhoesSw/YqEMQ3uYuCs9QwthMAiQIAtoLED0sC5F65zYdpY8p40jTg8JmbzkC2NrUGQFNmVYGC8ZvdzfBRfgJte5CeCQTFbjK/te1a5YTPpa85XlMCPFgeE/R21ZseLMi2YswQzMzCJHxTe7j6gW/mJ+M1sT0JgPaWBCCRAxv1oyOhHLY0exYPcNB4Y5XXANrrJIHJEVFQbD6TVOob239sKPjOpFxeB+gVQQAgkTq0n4dMQ6l5lPo2jLcHu59dkoJm6UeYBVxgUJq5Awrgm8jdvAr4+y/zUeVgHjbiBXIbbJQBJGBoId8Dk03aUch0NobF5TUXUFgsO6McnLiYiVVJldMNVF8FfvN4+BPIP9xH4sU/ibyGFsuWQhrgzrdGvYXhGwhaM+WwsNXn0hbP2ynoIE+NU0xeD7HThGpipjicIsp8I6kMfpO5bF/wl5AaA8AAScGryXUB/tm1Ub2G4QNIHF8hD215sRy3nd1JVKhohfrax+isasZ2xJoTU4bkN5wt3EeBr2kkMJAdk5CEjtcBWQ6CUXcGYIOJfs88ur4si0Tldoe6ouKDZx6xczmXybrDhjUjSIG2MX9zafriG5DafHMaVOC8qrcBqk0AGHEIwHp2IkAMu+NermZ92LdT+MYvAlXQWLx1ic9swUyEkdsG/LHm29T4AdRjaMA/VEuGQJH7/99fARnr6P19gZjMh91Pb8eJ3Kio9btVv7GKut8z+ObP/W20oS1NNH32xKCw8q7+WHJjqQXu3oBZ76CFRQB3nrX1h92htIcAAxRVN/6T/9KtjkrKZQeJfh4JQCM2INCo7xem4KwHzjt+G4wNPJZNV57k7tnhEp8eG4HOGrA/bjS+kW/BY7UR2p+Z9IeR/Qf+o7sQETDWFAWjCnzWB4CSO9znolQfPMjITXlObeX9t2m7FXg63q6rIjy2D4eJjlVWQyXwjw8fN67PQNTuTCNCVxBNm+kRs1JQ+Y9E/IP/4GiPnAyNT5RcxVG2FIFA+zZZyHxVlE8vpQXtddqg9tMasOsA0qRN3qiV3A2P/jjwXGq4Se6xiMzKA0+hguwUFPerRY9/QPGH/zXMDjE/zEBQlAYLiZmVZLiZ0FDHwpsaton85Abs3gG45qO4w3zgJ5qs4JrK9iDrBiRy/wr6Y773xvoYKEZjQiizDJOgANWHjYFOELk3vagQ6jGHvn648i1asvXk5BpWGKAsDHMpG7LLQKBR7SYQbJ6xb5XRXG571TpBUHyxAa49udwRwfsiz94AqPb+OO8/QNqfa0gIBhUGK9dFkmmlXJSgSTkeXgykTBoYducaFuuNP/K8FKN8ahDg7IqhSOOaxrUgZc7T3c2QOABP0zbKmlRrr8tjeU8i32/BuLvmo6Uv4zNOkUujyrkCoD/WO5+lJ3K3WkhBBm17FwxhJqWHdxASDUgwd+ClAlygE8D13Ad76snrazYiO4bymoELxhipZuYwZGNiqI0ADemzx1v4Z15n0nOlRY9hx5M7Xhii8EMKo+6nfNpiptX3NJr+WO49gPU9bQBMY01/Y5aZSAIhgnRJykPvViYbDwEU01QmmaG+Kky3zLg/Zz6UyfUnfrc/Mhy6Zmuo6jIqgA1EUVd9GTGbm95XK4LuNJffOvPh9VaFjq0Bd+gowMBve2/Asm0/9xcwGIb3oPIB+mO5FjcTYTJRZDZBEFm4wkxIRzQqpxUM0JSHB0PWOQmWINTUUXk1+MTk4nBz5Gbm4Q8iLN8QnrApWRGY3LhknVcHZSHN7d98YpDL0Lj1cLi9qDfQQFzcJbZbd9jYNkd/SgqSNJyXUP6xW6tURt0I0sANghYJyJ2dglEJGbOwCgFnSOkbY6ZboBzkXchdj+TuHyWJ65wT70POUXZcAFMxmplRpVDemt4Oz+3biAI1F7lb1Y1YNbyctgJU1IEjdeixvc+im9tznDh83ahX6nL9cdoItVqo8hZLfZhZuujA2qigeagxxCRMQbll90zn6kgI4MkuSkJKWkoSkaSpFJjlUWcWzCRQHcoHFB6PtzCrfbAFFvVY2tJxfXL72EH6cakk+sqjDMaS1lEvwcCjigNKoICgAwqKittbjZ5R0NAToqerAP4xWgsgSxnY1tjaMDLJORGuBM22tnetc3bQIULpK4mDlgQxT/co0431L83UIZmxzDMap3LCTU1i4lnYw8ZGghcyWo+wDz99o9xRK+/GAm1qj45ydovx/eJB1I0DiLIQoGfNSCgMVN2VdicDwaDqOIqPIwjp8hCJL01Q8o/Bvm9Q5gPLZGBJh4wiGtR85eR9BtJW00StafPZ0OVM07ygtzBY4z29O6VQc9myuCWjQ82oPmkOG3EyOcfNMc/kWAQsVekvHB5vwqbFLsny6F7SWcohrprxwdHJLZo6CKEWwrxIt2v3D/+ibvf8gUS4z36EQfYeekG63F3WdblLyTZESX9sdhYFKwUhkiRoHq60QyZ4aEzLSLMmxTEXf8DcFrit66T1kNLSPKcUjkuQx/v2oFRD9tU4zyH7OrgNLGz8BQS3nFlgOyffdfBhZecdAFj7HUQ2BxKTSs/bLZ1MjCthfXZ/GDfmAKXN3LhV4Hi7X1dUHIi9eyok6f6zNRHLyoSorMY/DmuV93bfawAyMmImFasoaCyrywjzYPrh9jVSc6x9Zp7WZ3dYjJebqKxoTchGBalskm6MSQR9tuwQwIS2GARDmiZ1pQvYejJAxkEEku8lO/LICyNVcMNyGMc6BEccP1cdj5mCBdft48lRhST/4M/8O/+q4tm+FIa4VK+3fJ5oMlpFEshCqED6FdkMlPkGifS6RcAIgoQKtUUgFOJkMw4283WLdVpPMfWMOU+fnhbM80u/+XwqVbCY7FqBwljsknwEQYjemkoYnNGbqJSBT18niaAE1dsu648dVYn3U2P0BMzMBhGWGCWBopT0PBfeF7/5lcILnv7w2z+FkMzWJkXIpbKO1impggCJIKAAfIV1iGNVEOUIAkQxDJ+CmNgAMRiicRHAHvNwP0efGbm0xvvp5nw+3Tv14pM2UYd0AtuEJjjIychMzzOGTpU8VTKLShc6mDBZAkEgjSkCQgIUQFxpvOcWXJKpJylcSHlhWLYc6k/bV5zff+s//ensc+0kwIFWYqWeDuQ5q4ggZgVivWb0FVbdm25IBAYIlYGUDQMzKFk2no0Rx66D0xqTBTHjDs8v/fnltU85vTpxztdH9kA83wYdoYWGt9y5dc6Qclk6zGq5pqcaxAS79UlJA5FMy9KEkXi/NTLBCAy9yDsaxaokabqaQwq8+qrMP/i7/9b//efzXHddbljEttZ15smV81lVhy4gVPmq6mSSw3kGKxDEBGRAgQ0BOVFWylKKrbmMZJ3w46WdZ6hZxrNzTH2hcnL2/p2f22mHvsrkQCEEtFsvMZilzis11ms+AuntXC4Rrbc0yrpk6GwdFAxlIiK+lo2quzv4IxrNLJihiNUAR0zSzDifc37/K0P/nePf/TsKU13vGwzNDj8xuU2jtCZBZVBE4wSS6FdVLZS8pwH80sDhACJej7MAJapM1AKBjGVw5OU2Hma1FcAEdfTD7bL62qc0W5+DA01GAIUyXS7Ut1v0/rWrsU9oAaWnq3W4OtBSbZkjCQUwL+GmBtJ8rEdUXb5GdnhxV+iPkiDrNIrQQhhJtI+gXGT09NWp/+lpYQyuprpdhDSF2OmINuwZnGYtppowZQX86qpFeJ1qSCMZQiASAusI0CryCCxjIdYkzZNAUg8nRJkbPNA8Xz1t6S3jPD24lBAtKFz3UiDXp63k7aK/s9WyoQRH3Hs/sUt05fzytOah67Rc0g6pNJgZacOfetYe+P6qOUX3whJeskyRVGOlaOzI8QZYfyXlJhU76V6l0nXtQR2DBxRMWB33kCUM/Ij4VVPd75iJFOsgWQaySERgrY2pNBUAO0iGnt0/uWykrQMiKHA9xEHK9QawUFQAgEFDIQj1MWLX27lYCjniemMW9zPllgv7Ud0jfLmxKS69KUVi21wsnzRUJ99XJsuEGUR2MZcSUjWxwj9/MwE3SB6WRLM5r8s2Hbi42UKZVag4/sWxpJSvCSJ8xYR65yO4LS6yHMAIhqwFIBabSJAEWSSDdYBQTT6fb9b+9PW2g0mgMPm9wWQxddSRnZ2CatYmlM32iKMLFLOSCGur6JG2TMwZkadlvTnDm/ryBDC4ZTmGVRlsvfeUqQYaSCjRsZZECBegmJveXMiJZbsBCWeNlMcz2raCZZYI7igV0UfQoQdIv1oCQavpTMoNZDMQOLRcqjIVkk0NWRyrlYLropxiwSefHGyZ4AGhFo94evButpAUDlrDOiitT5/SmqjqNuYCccGEvsGGDJqjO+fF7fW82AEd6Wkum8II4/hYtO35XjJWyXJH0aGoD1QqnQqxdn6jc35hqONMZkxbnhchoCiVk5+95VMYyI+M8pXSCIeSdsDAZo3ghAmIDas4EKdK6NAYUCF3QJkMWLSjv/Lj2WutCIQollM9VTbYW0HTetKTU9UsQpGjH84xbVyu9bTSMq2fT5Zx6GvMM5iQI0lt/LZXne+nRpTNPvmZLyARRTM+Uz8Vuvo93tha1mgWLNeRSmWho2RSWfhiW+cQgelTkMpXSK2dUua2c85Gwn1q6JyQFAltzBPHwHxii3oCrjPjZKtiIZdjeIyzgcCdFcAjtuteIt3ZAgNo6AXOUvOFhPzwAMtLkzEmki3oQJOXS0LcUerrZ5i/UwTVNq+fsnjk4DGWncExevZmv/WpdRNl9lRAIKVQHMxh03OoVsEpWKuQE37V9Gwuqh7eTCJNToBgC6dQcFnSSLSykpwp69aUOCHIP/ji8+d79S/IVCiurDrsLWW+bY8UYhQ2qiqqEnOAqqSWYFK9MUKc24XlGtKRWysVHhSNxVGWy71QzK3dnX7Js+ZMhqAFOtjZyubYh/803uRahopKUhICgqOpC4jrtPze1QUyFTZnyaj4VdIoSQONMLhmyhw2m1SNQwKTASuKNSs6p6qEpRpruT6jsWtvBrMgxOEtcGhdY31V+EmIt1W1K1R1WCw4UstThNAincrsRwWmJqaJBomkWjgJiEN58uyx6A0ztXV32pCOZ7O8i/OSCJXpBi2Ez9/k7N/0u5hZdwAConCmyacVGOVDbYBEQPUro1GwprwBhtYgF5tgIhoeTyjDvIQRoiISq0kYDiIc5Lvx4NPp9vNpt/pFDCOsDYWdQytXaMMOdHeTQe/axCGAiIutx9bu52ntnhQa2FrALCGnDNz9mvQUzn+OwpdIiiRlqZ/NxSLTy9V6nbeSAcLq7RTQ67pcsulz8LY8iC3b2F+T+8oI5QhSdJkjjfKmlTqsrqp5YtEduD6IlBptBA4FEo0rM/Uz3h+GRwfWWaM2yuWuTCd6vded8TUaMywm7dKxnGdcjhn99n59vrqROpi1BdFgNjNcoESySvb+sw/1BTRmq5fD4qD9zmAqJbgoqKphIstVV5598ymQ+aKzZLctehEOYhekWOhy7NaBVPUrIxAcL+JmBtJkrsl04Nm8NDKf+EyF8MKGsoqmXFCuxh6Upja9/PC+TBiqPgznXll12NPrXqul9us4rkWDEd1orzWi82Z6mJaGbCvUjKCHkU2LM4McvRQ43KM/kAclGbSTzyNVJZm+q40vvp0kULdsc90Z1ifzJo2zM2Q37UIa1K+OrkDCADM0F42y8gFym+jPyqLHjDnPgzmqlatYG3J2VFv1ZsG3yXW4gFAt/vEDNJy3s4EO96oKHfaP9HY04+sdVaprd4by9hrTdD7F4me/5eE4J2Skua2YObnLXDLIRZP4WDauYTVjEivLeOSjmf7UG38Eyp7CsGh0jmStI4X6onN+rB2ofkVUDaARgJsJnm4G9zaJOdNGM2smQgsG51vGiWo/LztgdBUfF7VJmaitMfohUGUPqHLsraCqH/iNcYDdO1ZUdkbGagP6sQMT0s4Gdzr71GbXwf1wMTgl+VCYLr3Wkem9Az7+Rto9rhhjFlRNN6GkUTrN38ZdwFubqEoCLvqEzBfZtttSlIH0K6GmCPcwM5Oc4XTaE6Uf9KIFjK9NUYy5m40uRxNtUMpJbdK4hDGPZlLIlknYGntuiANAGRnW3RZoXn1ytbo7avk1p00pamjsEDbnvabU3Oa75dAudmhsLufqPXno4WCaBNdGPeYH8FtbAEhPADFkckVTZ55crAerH9bejh8YITfJVFBVVwbXec+z55xCcqZjkq+A2iJJluuBMs1waw43gFyetNcOxwHrrjKVYaeUeFaywRJGpnK3u2lhgNaxP3ewNkQI3JlL9j7q8rL+RYlXv3IgKvvPHQsviYc8oeOQOCx5NC6dbsq5Z2s9WszcMKlW/EHiNeIn/gfA4vIB5BzdHq2CqlqSr8SJaUM+uVU8+pa+CXY77wFQRT1WB+8F1IydJwDQr4LK1ofBTObmITcadGiET4hLkpQmip9Y5pE3blqMizj3kxkZk+4YNhSvTzJEYQGh3TlFYeeKq6f3yifb8ztwV2UwzGvlI1Mep1d5VGhepkZCOa8GxyKXHb2RkTIoTTLomTfO9t65tLen8e4oGaFRzFdjDHgiyYbtE2+lJVw2CRlgS6yqytnnJWakoYPwq6Grk84sLSNoBjU+dXXMfeI9jelM3ZiFbstQpvshHprDblzN5rMpV59idwobnRGGqYiP2ED1PB1rIr0w7K7xiG9BBXzGOl8Q6IzGNJ81XWjITrPGxBoOyZSIk7G99KMLo4jRRKkI2xLxKqSyfA+QKNcWL0UVoJSU37+rq+bsycEON/3K6GywwYzuJqq1Rve23DzMzdbDetl4uHe593CwrRZusiBXp9tdnphubq7B4SFDxY1ynjCi7K27NX90OBbtr49dV9WjWmSyJeEpmENlQpwabWlIJRfMEidbYZulsheMx7XvHlBPKBaswBaawGY5G72NVDAbq6iCPn9IT0KTSuMVSDPYrAj41c+IIU25AciAmS7SwZt5PqE/fXVgOJoaMzIeqvYEJoYNe3NwfbiqjdndjXdK1Qa1gzJOCbqn89PjA1VRVRngWn2xjKuAewAWLc17SsvEtdPQdWyTi7KFCajOPfg4JiE77owTlUsszpoF8VbSobudkAxxdZ7Wfg1lyhoFSVSu+elXP5MA0Bq+NG5dR3Ma5hs79NMdnz85GzGrtYlclW7nXBumriYXZYpugOtugMLwLLKDorD3SN/Mr0d28ZjRrTeC50SkNTSPjumBdFcyFU6hEwUbPeG5Uv1nByn/p54bAzmv0DhXNO+VIdSno/GxdLFfoyzufAwYwPlMKF8FHU0qSWDrmYtC0loLggdvP1/z2efnlg+tB84upirTYmvKXEyhGMHYWrRszOOms0cQ6A4GAwIvhFhbO6N7ymwimD2Y0eZ8uJVCBuu0RexWJ6ncv2+48FKk1IUbKWQq3pFyRBCID8QbAFrvl/7ErBIQImzrLAK81Zeas7MeVtxTmL/5LoRs6oZFiRQAv+rZkTDAmRNAJyz80C83Pj9c4m79br/zZo4KcEThQA8vTGfKMKv7sTG1MXxdDTQk/w6AiD2Sx+xUdW9HOHCVFrj1qLWfilleLGjLiTCEeAjr6aGD997Nla7hnIC86yxE3UfhJskla+9hKIk3Coz4kMBMAEqxYFR54vDLAJB31YwxVeWQhPmA1gBv88XZIdqeoSREev7Tb0SveVkOfLrrr8+ctoiAs+kUbmwGph8MPS2j3bTZDue0KLfKbVGWrrlbBXd7ZeraZGd2NxG1Qvavd40CdNAbjMCLqsouLAiVFbOfFb6xH9g1zeClN5vbRZ0J4kAPMLpn1vn3ZFOQZID/+b/0z+8ysZQI+0wmWk5PJObaphOmIhXGscWnJuVsr+r0IwAwDA9pqlQuhVyrFM17tlQLIwAUlvrMJSZA4yOBcE47n7fiVzpXkEhtfcdEwXT7cMCUjQJ8zhd3Lx4y12PBdWSQo6biLkzzUUaq2MSSr0eZmcMEs1f/hHZ6u41ha3c7XwwaohtSRd4wua3YORIie1wccWgwniM97eBHPXRNGyZNRihP+3ni9rP93zxAOaGPDbo0zPm4bFBJp6HreF6qm8lZcz+pB6dumlPSbR8Aqh0TsKpWykZ13Li3edE8AR7n0FiyfcrRYJIMiBkAdxl+0oSAljVvjT0J+mJPc2k0g6ZDHJ8tzdupfYoRnNiijsbUG4gTx+BkYlgd73bEMs0MPj2OBEBfVOSFHaK0rkhTkbRwtnUCsU6cYRMzfZrENZQ5sD7pm917fA11bKxQLlmtOw1qdIwTfGsgTGBgVr0A2qKMv+fYN3/80sJHJzrBmgMLgz7WY5IxjYp8r78qgGMP8KzH7cTmJnRCtgYP16REQfCrn184AEGYZE2ceHqyxNRcreH4mus8xdE5UUHmMPBhpZir+eiwrma1LQ0bx4MNFCjuThqPIgGF3fqiIipcxaWurbQ4n5blADizHzOXbo3wWCAZrLhcilnIM/z3DL2YSTlXO9OrGqu+H5H24oLvb4ZxrGaOnW5sW3ZHrbkzVK8dA4iObba9UJExQnLRnrEOwXUhiifgcy/x8pIYAQHnObMBFdjnID5rjgRuA8jIAAwgmrIhZROuG5ZC1k5RQRGyWOSHwqSY4UGg6dLeAHJqkACG6x91JwB0h8neusO2Q/LohyNSMA0Gb6Ib/iCCLJUGFTCSkhA0Dh5A78arTS+Elhe90HQTHmWE+bHMlXp+Qi+dOv+wdXup37emfC9Z/xOAewU66ywEu91gHA+kqKFkJXIIJkglxlYIgoVMU8yMSumsIksSTxIB4j7QRw6H/+bIISJVDCUpD4KFmVDrVAAyhwQRqeTKuk6QZYEh6/muKUWqLA/dRQFulmgAQPGGHJJz57pr3AKHD7A8SplErEciDRZICADBtKQg6g4bvj4BxNsf2L4gCWUAjhWSMXxNCnnVbzh+Dps/8rM1FZlYNnYipTa5+fxO5SgCaT5uxseRsb4rIRTYQbJwz9Ni6Ey9yEOyG1WlWMVB/iHcb/EwxAgoFvd7JkGADAkFRQDQCpck6EpDCKG6IlcYN1FNFaMIJN3Ak6ai5W3NVwxFHXGSFycaxRdmmQVYA7ePBYgD21h83mRho15ZVZwCDCpgkVRVsmJYOcr47hyDo8rnDOCQAijGuqvOcL24LX/yqblPwiunACDJVwsunl78YlaNoIcAZnKawZYF5OjtM1urNYBDMCKBNsIkQZEuYgdJ0fR4FCf9IEShUCebCNB9n08dUAAIYo1AymoVbW0JgLDMWhvD0mSFM0nwDGGRBI4EOlJlRpCiyHIKspsrYDdV7GQOxT33DrIqCQlXMNm5bp+iMCIapLWriu3Cp8iceE+42SII0jYyNaQVoLdp9AIWnu+kFguVJEUZFINAFLKZzLn3HQMN4FS/83r3TPVmvHD+DDyxp7IIANqYEhgqmduJDHXhWnyvQWnv+yZ/zF9BRCSWEmszdkx7JKAJYZEr3Q/aaWaGSMAlWAtIFshwgWhFOHFltDIuCMAxKSCsY0+mPGDCyGsgyakzE0namzhelGQGT7AniMRiKeppVdEg7oIjd6eBpDNsCgTscCvFXuGCpHAlqLRG8G3/EAMvKnEyK7OVKDbR9CBRNlH1iRM6ADS+dtWndNA785AbteRR1xet981pxqbiJuSDABP8MFwYIkAiJ1xVS6JMRiNRVE/ifiQoGNOrcozR/Z/NQCIVBZEFlQwSqYqtlS0WY81xbagyawYxZV2VOI4QqViaAiU9SjRpbxh1IkDdEy8vFU0LPEy3XA38rC3CcpwLekOGVmWBGrkaA++TDZKKqQkwMNxBvO1DT+xqh0CbwJcLOagiAer3Lt3ISEkHB7sbYedCK1uFvhRT/tDxwbUbR2eHmYcMgF51DAkAEDoUiSFQLOMd0JESoJyiIC/0giCR8MSGzhEHJO73LAEE2QAqizGgTg2CY0lCWlTZmly4zDSpwDWN4FjWIGeVM0jLSDHpRKnN6RPtVgQFeLlwaPFaXmIDGbba0i7nulT2MupbVzsaBrQOdevQw6zCR6NRJN6y/ftu/St7/ykRLX/j41uPVwp/69nnXAimjn6zbbvVIo28bqJKauAYUzOn2439GvM4JNXW5vThSYwqqML1AbwwTMDIej6VhBCrugGK4SNxv2dikiRTIrOyYYKiFrXWgknifLLqFIxuIr2PYp7NS5xQuV/vb8pM48hnOiGpu6HCYBxQdZAUEIbn6Y59lig0BaxgRv/AVyCo6sS+QN5YgNxSamYDY/aqZ9iLJnhLd3gX3/rt3v3jT/b/CUKw3TiX0fJfv8nnJAs1pr28ntntlt4+NowkI9oYPKAuHkB8GbLaIXptGAGSYnngaEmv6YvQwzJwL8kIJEtSIoQA+Atfbp80YWRzuUQFSE3JohFNIKNUWLQOiE1Jtw4AfBEIYli+QIaRA1GYmAvKhWo1r+3t2OduMMwqoKiAAxY6NFLJYcomtubYYwgKonk++RShI6kaB0J7WQXu1ZI0cdsb3niDCNZdJIAD3HtRXdlLz2o/C7NKIsoDMEpyb5VGEiAc+xEKd26rE0bm0F8bykwREkQOw62WSGJKVcwlYYhIoRwAfvdp80oK6XBiIhJrQtKMlLxqkzLVdZ6jtbGcK5JKdC1f9pRaiSm0vGDECqcakQgZie5Gu+6kDdSbJha6c37YCtG5vIHZcj0rfAve7likqkqbYGaH0oyCBNpbKewXKPT4RczyuAR+BiMEemcCF/Kf++NXy0EnkomGIw6MoTsFUZsaguPDlhtDTRQneezYwLpMpjSmHGEiCEJSyIED+DPmD47qBtEyhYCJOOTANSsoGTTGSoumJKMb2/ixqqh4IEkEBqWixHypqGKk9/U05Jq/IugLsguA4jCx7GexIlMl5lcxbXCj3nXn8xqNgC0cgO4mC+l7C32ejGYiCSPAtx2Ut095vtmH+a8EPreRKamm4ZsPF67eUTqcO0gN5go9pyDreaJvreRMbQ98OGe2Yezamy6PKWFAApFwKoGEQA8Txu/XHGTjqWEgAztGKgqCTGic0niUmaYjKOoZYQ+JSXUNTAl024tsMVYo9KycpWtDDJKHAiC86DVQcS8P1C8vDSTNts8lXmW3pwX2Oc9j9BUo7PQA0IRsDl3NGLRSp2/VcGhq6ffV2mRWYo5wDpMp38l/vPP5rJGIDO4HrH/ueM+QlKNgN6ReZ65waL9G2LTHw1UfQxLKEIGSMDHeFdwwoj6C+zaI9fd5QSY2CJwTqVp16AlQYx5DiTnQ5IBchiPhJbVESbCZycrT45tcjnhXJySW8NvsVt1JEzgkgqAvDmsrmUhCum0o+x2qnXkJKgA+Y+/0KopRb0BhB6q9qLdcYU25UZJ4i6eQArA5Q8OFB4BiPrJip0tWwK1cEWUng6Xzp7+CJCYiN0ujuLU8cUQ9UlHBbqu1M4f1+jBK7BLYtqD6mispviFjKQDeV+R55rewEAAS02dNtyRZa0jCzGAIUDzGwpImnhcuGQeVbDYyIrGpUj1aLPfypir0QkMFvRMiw5XbHEV99wgAblBvbO9662woU8nAXBooVyoNzaOqGhlT2olTYFAY9FQBNDLQXCBdBCnirW3oUCyBTQl1EgXqyikW+YAW3OPv+0LxwZUPyY/Dd4RGIkqj7MnpMRQxpE8CTOVnDm128IGkbYe87XghZ1yTKRI+QtmWoc/Wu9gIhhsOfdYMldw5QiS0gmSIR1SCVs7aVJTalrEIY2YySsoqRsiXQ6clkc6AqdjhNPD8TrO34y8UYDdRKOwZ0b3R0IMkGQmaHKB2AKgRSQVlAM4IbWCM28BCutMAVcx9okmWwPAwRXtLL+ao07HpBVBQiYRi58sxONKnnPP0uw9930z5PACtJziSj85PKdnCg0/lGsXUSxWH+Pkhj3ql8O1HJX6GABIEJQnmlsmjN6oSHWG/9HkzIHu5XyMiKliLkIQsEkDJXkPiAg5SJtaRJhu+YJwompzLTFi6leeGB1okStZuc2Kk2Mks+47dyMwWiJZMheDaDFQJhcKhnenWV09vu80Tx8na3Xi73kFHgtLE9CkarRVkvo2B6sCjE8yIZGMwZCmb3nDxzWcKk4M3f+QsKKAA3Eq4/vRiknRA+b61qDR36FNDjZHLhBxzoFwKJK6AhNFAc5mVUFRx6f2b8wFmMOJkwSzO9CBagXKyYEtTqaOit1Wd8ryYltUKAYbZIJSUXCbrJ34s83wi6bpZyVhVbd0p+p28sTPychZbdIzqGK8eusumnYq/dc7JzUznyoyDqtc97ULuTsiMqk4N09ibNzc5PyzySKIESQCZ62o8fXDwp//csbsxVv3e+aFPI/7cN9rfm2lt7eSq8hH0LkgQt+VldDdIAMcUMW4IG0luIqiE9ThkbYLgfs4gwJxQOmAmK4RospaU2bIdeTAwZldiz1wzpVDycaYSqmpQNVUzKKiEy1xhIColPTUZYTsGfcFdxMsN9EuDRfFxsMs8EkgTu/XibFE+nIHz0BYKOiygHWdrDpgOHszi01uoRlKyVJ9IVxrVTgGAkdvDxejtr/m/d+7ESJqBNBacOvvWDRTLfli7fDJ/+H+Z2R1S0jQUk8RVNPAZk2MnEQoQTAMGgDjct5nVPZsijRLAKGphclDIVmy2d0PFB8eT1d0ysWetpMAZzReUTD6TdFq6wcv5ckSmvUQuKBLf+smVKZwBUNRXFPTEYlM9EEdeVQgUpr/xp+sHLKRVdCfvTTCwoWCtBVUdFtUQEMqGVAAwQq7qz5u0sujITCb++PCp2D6gA8hGvt/l+kR+7jPV9GwmRdOuwin75pg+bgQs/5FOR1iHHDuuxqrDs8IhtFrHQFWZUsIJjxIGIGHgCO7rbAgLMYGMKlzknqxTgoja395sQt93becWmC0qVWcWwYAgjxz89r4pKas6LqlmslVdlnGePJOD8dkEARRfndVuKMtO+3OFQPz63zaeD+CsoF3w8IH1m7Yfw9YC6M7AxnqV82xUIEnLivzGlxAra1273uaJ6xvmZJIBmLqT17C/yuXb5p4F+E23GlanAKAzpehSBeRKg9uDYOow08/LGkEtM2LgMzcwVFQkg8BFgvtcQDLhRgiJ+zibSWQzUaaMApSArVFGpiKDGvimi+MKWtI60S3lhlzVuLB8rUByvuDIMgFyqioTR5XLMBp12xN5xSGPxQ6FMD6D6Hc/fnqZDp9c+lPfb9Xld01ya18wF7tVfc4rSIEd3NAznXobn4ZhS5g7tTmPXChnPisUWD2a/Ik7df75g+8gJIrw+bEfBw0A6sb8mNVQO1UtaUZIMQk5xGCoeC1U9RUlAK0aKlgLV1z/bLQKskQA91SJw/2ds1BwwoVElEigNHLNprZSAre3QXiq06Ulu0Yk5VyflKqCV5DN6cZmN871Kyp2QqQhorDNR1ZQ8VXb7UpK1XGAZYXAn5/+5M+X5Rft9OT4dGRWB24UZXy5mVdAw2MEGkJnQeJhSmuE3Gkg9cbXwzCBZl6QzIt8NMVNUovWFcXrt6r3833NAc9d6X/s241Hku+snivX+zzcRa4UOs78sSA5zEj9vKppfY5RYo0Ha15otzWQ6p4RP9XuEoK5krHv74xCRhPMAI2Ik6SkTnWUcpl71rxFO+oSYKmEMo+p14vjmFPV10S1nA+EkyGKjhNJwthNxhk+g3hvvmJgh3jnchD+9D/95PaXPN38rKfpahVi0OCofv1ictpUz0bKAdXnmmOfLuySTAYDpY2bb9aAGZlttjWBu2zyxJT3Oq31rTs/NqsFXciFR8Rv/snGRfdhae1UvMH7MtlhSqIrWlnRDnViGDabybKuAJbXtlq9gMYc4SCWNfWmOYUSgMi/D3PuPZObATCsGSWzM3XNMioTEedIJaNq0lZHbx94Jg8jMETIa6BXwJT8vojn8wBRO3Fjftu6e5WAflY6eOUGqDrw4eu/+b3pW9Mn/eMfr83mcLo8W8RQzaSxgfuFJyFVtqvYqcmcO+YJ2aMRhPHN7xCRQdhqvFSejhZvTte2sqPtm10/Fao+svOrM8ltXXqRnA9bIYBws7XsQB03DvvRUIaqHo0R6CX4pkk1CQIQmCgqISolEuKxIEjcZ8G4Zwk3ZsDQKkJGwOsTgijVVlsY+6I4no9anuhCnFRilsmyfCYi9AiJVdWvSv2sxcYKu1yfnz57+C0A/EzufCqtHvHU0vovX91++3yXL56VB2e32ufj5q15Q88vraIWrdWLlPlCZ9sgppsZazZ3KY0Q+GYn4cMaILIMmpO249cD32rS4cF0jIv5s6Oj2cft3/499bG2qfUTJwj8iKtesapFWFGstWD88CeKJZnlxe6unyhSogqq66Xpj9yUTIuIKAIh7rdMuJKmKZdbmxXAUZV87lRN7FxwWWOucU3Pm8U8ZMB+tpNU3DwIBiQao44ox15/uQccoB1LH9e2+iV9nQDOpsVnNLQzso/wj3z2+f/pz8SzeGjctnsOoa5/Wtb1Ua+gkGULAWxhV13Kq9+zp/UUJelNT4BwWGsG92AIEuuv3f7hg9FpNzMq6U+6s6cf/u2/95Z3ROsRWdZCV/atyMtajsstI2qZ5ty749khwGTfCotURDKXJuXkxsmCxWM3ijC6j3MgSZhAhmZQgzFqrmuQMdpx0i6ZokafbaUQriiiSHBgVbeimrlORjb0AYnCILK7K7Hp9enu7dOlW87kfKwnKdQAvnj108sEVLahBxwu97/+T3zwOy9/sDpo9AxKVeeMf3+kOO1MT6OtJC/YQlrXaE04wg0Okm+6a3IWDVkU6+q5/+m4eOY3wT9e8sOrfyJeuamGPTEQZnLcHjCmyJWwZ+hjlTGjoMrvliS5uXP+MaAUSf4Dx77BAzkju8wOEE44uq+zAAGJtqyiMCuUmBRNNsUR2WAJC9JijqOJP05QNtY7FBFQ+KIa5/WZBjV91tL6vrYSmLxM779zvJLnZ38RfjI15As/fbUPFQCqarCun823mid+ePnl5Nmt98bpUupC3l/GN6HWluOWt1uZhEap7JnISe4KADCHAL5J/cm6MTgkayx0TY9Pwsg2beue/+THC2JVhAgTFEvbhFJGJrWwqWIsV+XDv+SrJMVgMFdyIuL1OZs9d7EgM4lBtxuKms2RIOI+Dm5ufphBpGOb0Ahamy16nU5dPUnss8c25wmLaVzNKaEsJFExu7zTI/H2gPNMHlUT0W0eL7t50cxX835+Aheu7F3Rl6Edm1cnACAMu7KJuD/153f96ayPequOijWXApYuxs3mnEabrZ/ReS4oJRtimkia1o5E6eUbL0VDWFomJpTOWKyC+pw2LnCP1HbqMBcEIarKOJvLxUmnvmGZJ8cA4PADxh7UnbN6F1eSvhPCd5/7HixBokB/UMhuleIYj/SYT5LVBjt/LqcEGGiKqVFwzOQFu1wAM/Myd+AjFBuZ00xFBa8mZu3spge+hbs6JBmP0iBRAtbOfwLf+Xubw4e/fvZ49s55vXjuxs38SXEgZ7df9UmqBNSrWzudX3yOZw8P3/rF8z84fHzpDg6XR4/V5tiMzEUHBtw52tGZBxEJkacUm4iy5xs1y6akSAYAszBvTr770z5lNs6nyMA+sZAoUQhxcCxD3t+h+FRusvZu+o8nvWns3Z6mQdxFoTACICEfDBJd02wrpiAg++f+z0+Y8cOpTK0ptcQmSTSiXEBTUhvMNph5jOjrttnQhAFRJOOkwxMJQpUIyCoWzxWlAerITF0fdPZOm5s7JodOD+5+fC4zuzpKEWsaYA7pd782m/frlpuRJH/87ctzTSuol9Lrf2h91V3anz5oMIQHsOEaJ+A3W8yJW3W+5DUvWJHCrPTqwJtdYVNWCsgJjRVITXXBqVFrtYRkUjIIJFNnQvUyihQopYqyMPbumAD1/UpkQrPV3/qEVquGa1uB0lItxVSMdiZx7KqtICGx8PefN393RD+tU4CcKmUBLVwqS07dysfonIMakPz0JMqZcUR4jDO1adPyuW+U2TnmOWMPi5IFQMbrbU3f+ujR9+I53JGfmtfEbvPBOn93aF/6f86f/px+Pf/Xv3L+uDPptwyJv/S35y+qNH/xb/2VZ+uTpW1XeufjkSnbc1usRm0lKAGSgHap6xyOHpbl4wTiTZuR6qKmWLRkCazqIgQtIOTSAmY7AiYZGOkZK2PKiMf53NgpBQ4H5y8NjbnLNXAnYnrS4aY8xbud4FObTUKTeLKs2kVDdWMBXPizJgzqx2hChgQJrCoy9lgVRaornxHMoocJpriDRYB0paSqRS9rjE02YoVv3VZI8/JuRXZtBYCIhDKyzbXXNJmRGXNsW634/bjPPQMSEcgF8GXEQWOYC19xuAwJCxIlkEf0EQiGJSAswZCIaNCXve1V49eVu/pkPa5SU3im1CUj6m1MXSptVghBS4bgLoB84y/GlhxinDDmqozL4l4kBWPcKElBqlICCjDT16OoZEixrHM4JGjN3anSO6Gz6WVknPgD9WiWAoD6kctfvaWJ7okHLs/mlLDTbDZsyhnAJ80ltC8to4c1gpyzAQLgrDaZUJRZra6YtwhjiMzyjGpTaNxRHXk3DMs1bkR+0BZJtKvE1lQt0TK6J8aEQVTHMICJGOFxDzITeCvO0qCkx1sD4aFQHcht32Q9K8EJbfV1A2JyEAANgaXC+LHaI1ujQ93e/9qDpyTPjZ7WW0vsKkc+h8pplX1OM8s1DFG4/Q0HgGgrbLQy5HprNtn3sXLmW58QWCWKZLBIhK7vCprR2UJUXzbzhwWrrrzQp17+4TMH7hC7InCDuNfrzaZ0qGdLs2+QTLSpcSrA4jsdIQCz+zfbhMnVSDBMQR1DFEroO0yT7JOrYrisyl7R5Tkb07hEAPLIMQhW+jLqKUQryxnVrbc8sEFgkV0usfxch3Voi7ka7muAqIlQN4kzQPJcJAODsDqnDVCjQUSTiDOsYO6OOACN8iS9ndOrSWaHy33dbJ5cRii37dONT882uJn6OMpIhDH1RucVEh0CBEJ6s2ZmWclbxdSPyo33FS5B4LKORSpxC8xgRaFEg0jVy+5aULJ2pg9N2zMs+5tdNDY1NjHXNqtLW0dn91W24sFOv1ZMq2Q3hZ0RwmuUmcPtfiSRhJL7NksGg7lyIpyzFUbL5Oz12FjWVbac5XD01m3WBArREVVtxKE3iHXqOQnUVC97RJdMHGRzgzqlYVTXj/hr+W6IIpcbge9q3SiCIECRLzmKBC7GmTYNKgFKuOzpZZ8xLgvRyygIEgwAaNQY4LSCuOOsx8XFoOjuHEjRrvKyizWsJ+ifXUCfScm3FkKJzonbGGXTWxkmkTySKN+79cuyoQwqIj5WRkWwZxDEMioLJXm3z3Pbjz1aW79x8tD8bWPLNA6SeBBPnMFU0nWlXOd6cPTJlPk7l6tjkpiQuasxukd985ZNHBxrSDHp9parB4whxu/TnEMAZJZofvQsYnLGZKCyJZZUFIwWA7i6qptf/8YlU5P8WE80UMJUhYujUjGOolZAlyxBBdHx0U5OM32xg2Pqs6QYEyfHqRVTXkiy3aSCw4IrEwcFiHJZCApBOd5JenGOab1cJwO3LEjwqCUghKX6olsuj4oTtn3q9W/cX5xAutpWB7PjW2mcHyw2rWtMyiaEwJVNqWycUnorVSghSxAx/m6TqhxjSoAUQ0okJo1REjCWqDqXAEFn9jMAswYcFogWuZHudDyqYK00sTxfw2F0IczHH/nUSyhaKyCppJ9a4Ckz6a3dDcjIapcrvbYuBIn6jDIk4H7OkMQ83xxOjtBk5kgxFN2Kug5CVi0Nlk8269V2iZSYu35BzciT4ybmVTfQ5NiaRSqlvuNgRJ9y1xHQwVicyJ6+o0/aPpR4aOQdIiRs56qSimgH/DEpcMxWaECODPS+6HC+oFwuKqyFkJckCBDEqQ4RY8AJwjmonbiuzayufDg7bbdxMgsCrqPU3j1dSL7VWqYQfdWqd1+zH1YjHOBbWKlac05Y/gK+vnS2ETVZwIrZiGTOUooYqb5hxpoWWdlD1vImbbZMOvAGYeLPz7y6kK+I3p3ceJ2fGkhahHzlWFIolcbkfk5cbNImZUxVmrKxosqWDJTL4X2bifU84uB3d8hxEK9SQXRAGDrDFhsDaQ5V0H4MRzOCV8tqIlUhU3AD6itF4miLkuPUSnHmoSnew+d3+JFwy88QZvgDKTHlUA+MscSNda9lGPCWKDZUmbSZRUgEvlOLk4Tn7TFuC+aVnI67jVwJEAFIV1LS70qlytsdgeg8MtjMHq3MeYcpVZvQ50vot1O+YPScHXejuHSbO3pKEGFvIQppWyIS6WjSuJgQMEVQqeXOr108Au9IICJwohIZWxl+yNCyVvi6LPcZiRMXCoqfc0C3NBepCYD7UKtRyh+dml+8cw2bO7tut4klTt638JtanLECO45AwH2dwXiYsGRGFYUwoYBTjkZtislwmHX5srv0yExysZaoSk0bNwY0MqvlTM4yts8Vvp3J+/14eeGP8glNPDDWdZ2YUlKVXKWorBqVXdZVoM8L7jqjRU+blrZKvBUQly5bYK4kVAq3y1ZVyylL5U5gGF0JAFKjwDIuyX3z6m3tarsws1VzfnJ3iy32PXLp8Q6G7KZMIs5Jb27VEyBz5Oab3iFqMmirESn0fQGJkhgM3zz6D/7OR7YwRk6kiMkyaFxpbNKZQ4WSyU9LDZ0mUhgnWOBIMDIXU0PifsyDaZdnwvHx05c3PcdpDXoDLjA3uhfHemGfJlHqHPd3ZqFDfxp4ngKLhRg6zb413pqQCuLUFlzTA+yy72q1jmZWdGXZibIqkdXlXk16Y3lJI92c0WHHW8s4DNGaZXjupAdxMO3b/rREk4CzQXG3SpFIijtVJSx2k9hiXYo5wEkxo+AFwzUuDKrTRWj0SUcdAerIPU2/UVIHeiveGR+vl88el5McQjI4EjrNIbYwiwzbqArWj91Xvd2bcEZ0C5uZbEyUSFUZwnH6g2MKZCgJLdnLFzrhyliRHLIEMFTzxIVWLAyO3BgQCIkCqAkfD1yqMKQJkh0v/edZt8ntQeQGgpFcJmE8jhjc5zm+VnhojTanoBGVVDrsbDadPTRcuxSgB1ZAUtOPE4oLdjDISRUVATKr4yH3xiY5DZtMVHbcCW6KjiRsjUAY7eg9r+gri1vUV1E5JvFOxe3ZqrveI70oP2gokunbgdnDzcXcxXF5rL2raXimZuWGJgFCQXY7yiArpwRRfHx2gXUfK9ZqVkWahNw67m28clkNErZTFwKgA7C3Y4qks5JtiajZadFaxSKti3/pV4s+uFpEXGbj2WbpQ9A/bO3fF7rXM9oDFwDM7C4SQBgAnCw/LxV7CeYAWklTq8HUlgN+6BY9V7iJlCicAeypkhOA+z0/eXBd84JICoZNMBQNBo2IRb1CLkLiZT/atIMgK5GqKGfzironF1BXaAYbkHVfJrYaEcnGlSS3ESTg9FxDb4GvLtUix+Q+kjxvLGLzRtMKXDg6fyXWIh6QXLmlrbL81m7GeuNMAVQ5IS15eBkEphPmdm023sT52BX1pTFN2PJ20rU9c1bxZGR+jIuQqt7wa0aaqby8rcPnfXmgxglkGSUFylYF7dPWpcppUjUN3EfnlkoA+cPX9DoCvhvb+4kpFpYNFqU1ZBUlvJRsC+HPOVsSpzQ2DVsAwN62BO77kInsCkEYFABRsaQaCu29HXWVw1Huy4WqyG5PL0gkvQ/AHxTLF7dYJ+AwRz3KgEL79kzMIUABt8iGGlaVcGLXDYNIawrJaNhTdSJHH8h0rukOUSq3PlbpihBNZm9+bFO1eu4gyiiSwF1paBISJtl1k6gWKjlhpU6TaV1s1rrETQwxYu0zBOqrlEGgkzkYSb2tUd+srWx3/yBWY1VSSY4SxVGRqC0IRoZZJlIKh/CXi3IMSSvKSmI7CA8gquTEqcQgRNGuMdCDUHlVFkJigcjDOrk/9O9GcWgkgF5zUMxZQBI40wJIENX1Zjy9JKLUwkTd8WWEepjGmGg7AIO2TV20jRK11SAnEFC6Y48lrK1yD5WkwYbqBCpy4olO1Iwl39S7U04puG46iPbtUmR1sF0+Jq1tymMdWrFU4VOusAEBSJAAAUhYJXft2rXdnoE3Hn03ts8652InttnW2EnnDmWz7j1oBoJEV+ItjgKADVm0tbVzk6Rw/q//4B8uQAVAc53rrEgypwCkw0Zbw0RxXD3neEESv4NniERKmBIBQAgJQASU0DA6YCJ91tzOzFQBIKOzgFYzeADMUBvSjJVCiRYrkkpSKmGv3Ux85kmaVdjp+j1DC7zYVjQdikkzdgzcGSQV0BIrIZxltHVrQEhjSk1oXtiuZOd32tOdyiNwp2rbhGc6Vrt+Lj/2ljonKGChJrKuCQFICCEECE/LlxfysVkJ9cPV6hsS+iNcbTIa2krECu7wnROASD6qSL4LAUimLJhnxH5afRfbpZbOi5vExZiUcvr2oWvvYM0pqkkQAVdy9ZC7B/9kItQBYHQ/Q33HA8OiIWAk+P2gh5EaIQAhAtpsMiarvc0QrSbL0MZpFWhj4w5v5iS+sxFgf8u25X4YiXoyEFjdibrqkQm3UUbFVuRVIz8ed11b8yiHWB/QntlAeh1Q7Hey/cHM5Jh73bflI7meq3RReNtrqUfrEgZEMEl1NyK1Am2FIYLxeI5KfX2ezRsH9xYb3zHlVPQ5+azaXWxdlxMIp7q99ZUMs5sKs5nVpVbcdTZBxdXYjicHSm5CwGEjXG3q3TAQGMJYwtv9UByMk6sVe7CvlrguOemnSxwJuD/0OMpqDAJwhLYnThZDitZEaJaqOa22vaiU3Z2JS4TnuJXZyRptuU1FoLMeoRrRhRd05CDWvI5fSXgc9kFCChvvhcK3+uYNLG2NobdUAq3oDO2M3dkBw6xGblN2un7m1A11wrZlAWKfQdrRvXXD2q6IGB015ZYx6fVv4fQt1MxApqIlbDOMm96SlWCi/G2PohpKi9WUmcdzWo8eXrw+D1UtZGblnYLCDh0hT7iI18NCL+R5s7kZAT9gZATYQa5YUvdjo59m8eZPmwsAuDFQQaLM7HgUreCkUEHpi5ALWXOLO2yzVzZ00HUQaLoKO53BVr2V7WWJR3GkOn3qq2t+22W+p+tAZ9YDz3SKO6qrhEgeNIntRIrnBYrdJdWdOjJp505k4akt4/QKn84EIfbwSLgQqs1aJjYG0njBk7ChYnTApdA2TE7Kauzi9NZhZtUIKWES3Drybb9JKho/KugWE0fVvxvfopEp3xzDaPHar4Xx26DDRacC/UzSjbZYP0ziZjuk97jjMNZnzUaAxjn5GSN3mRMQ5A4CENnMtki9cYVQodfoN7uqFEl9Ly+tXd0Nu966Hof+WMan2HSzMYZ6pCV526OqLA1AM2zsWKSHKQkkKzazHcXI1nuu7flzyboGs4U2JF1iyye3t1Yyl6JlTxo6lgsbCyXfI3JvcxZW9GZDHX4SMXr9zQMXy7dsOVqM8pbo0HYZxVtecORbr7yMjNkAwIy55HJUgpcyTP8duapdESCBDlt7q5cnTl/blnFzEdG6i1qNA/4PdBK9G8hScF/nJABMQFShqjFkZVI65SIzkk3RtGWTpn1OuM0TKloxNYHVMys7SdhzIOEFPUB0ne56KJaEq0lh1+gNyrgfZkUnXh8sbGHVz1Ka+BOo389tBtrp9ky2v9K3J6pX2jTYiaa2zEuD9gS3Tefmi4WhCeoKX1IVHwn5qj2V7E4LURk06pm/n8AcTVUwQcRgKRQqCakFfMvGgplMYbV0TDXfgh69G7VvfPOsvLc5hBOU1z4j33AzcXBJl1Wl1/eSuypaHi2SRgA6Pm22ptIENBRTEAeoOUcClLTuEa2fB78lpQQZlhrSYNvrRcYsC1FIELFCJrrJIEvIQAfP5g7HBRuZijsI8bqeJ14Yj2NYBnlHnlkzQGux0lXOtpu2PEeveRXUlAsB9ptLObo9uflifKnGUxOPchB08PakNvBPFbv2fCJUddAgfs0AVFuTlPO8bLdCHAXJIq58Ft+GkWoWp7ayjpi16DyWEuB0Ac9+9GcFOnTrAD/8/28STnRJRkIGb9uDURz9wvffeofs00fdxzkJCZVqpTMAcDa2F5QEWWLMtRpBFsPkQNwoAho25rd6XEY3V65Q5EoJIBFHcs4YqPm+GntmoVFOluZzAQmwMtAVx65i4XARVboSvgiV3eYJN2javkuoFw/iZNCNjZy41O5/8PRgN+Z0oA0EcC44VgDnq5Hs6jUZ35qELk7JGTTchsaGLLLWpsnahp7GOJZ5fQeKTwHQ+JLhMud5v2ryaFRh8B/8wj89+Q7A4ZsB/IU/y5E/k0G6ak/f2XJG8vO/9My39+GnX1iD+0oD9wAMMCgzgKKAU4AsmK0WrFZQaLMEZU6eCDZivUfVLveV8qlbYW8wQFHXt+RTpYDEoHR5hkdST85lg6VxlasN1eyNWVaHVR3fNHuaqfTCcIALrmVJ2MEKs3XaInSsNKuwa4HbDBIvL02+uGJwzrmLfNqja1xGjrqyoSqEqwx6CkRWVAWYYRlVyHKwnYdlR0h/qw1z6KXbNJNpu/XbyfjqYqO9S+2trysgAYdvV+mnPs8lMOI4pI1G0E1GSsr3YR9MD5Ag7J3xyTPaFBExA9aMyYBToi5bJS3JYQ9FKydEUC1u9nvu2u7Ft9pq4JpAVJYkt72iK6xcxKimZWgktQbYjCif1LuGTHfHC7dzcb0ddhNrR9Fbj1hX8jdbmj0I8lHoUZEwp3v96RdjuSdmXr4czjaJ+jbrghAlu52Jb0iDKtraLqSXhkO48wSql+OEBRDAtBbQqolv0yhdFhKovFSfDbfnF1fzw4VzZjs7RuIwzuD7Mv0p3KGk7Xb90H7Hm8d3Dj4Z/n2fXTKhUQHF3HuMJhWZjBHto9sKJF/ErDJJpSEI3kVCIEhERLgdYCnhPD7SHAgysHgfWlRN+p6lNyAOj3jq5iDjbueF8uB1ig1lMzgzt90rrfCJI47XVwdt25M7Frt94otzZ25s3mq35e03kBAQaAUkOBer8Y0O29peKLo654MyOH2n+rxFc64VG5svW7S9h4e3ulNQi/Taw+fbkDra8q1a5Nlzf/jaZgIA4BBuOPaVLrES36ahl7zzE+28o99Ndv9nEAEUlBmMYbDRKEbFbNbGBmOF8iaHqE+CoGdL2oBKATQjzQU9CmJUbse4j3g/jJCGurW87J905y1VvVnuKcKQ+u5WZc0vDqqtnljwtv1gGuXfjHuydi6ArqLt1rnsdnJm3DhZ792ulxP78lfLQvCgMVhNOn26sWHzccHF/jJok1YR2Pc+bQQZ4HqL0+4+hDGqH401pa711WjyLODD+FfeODD2nj6R1siAHBoKu4uG8ClKhAchvQt3/P4/Otj7F+37P69AlBFARZHCCYVsQ0wBBeoQ2VbZedQoSUTco1LiJ72OExAZB7ocNQAD9TjnUZ9LmPaMrKXsyBPeVsExour8jooTSTEyDVkY/jEL+W3JWVyXlmQ7MJvbyi6tttvZxhUPXZeRtVjAebbePnbUChEXGu9ptDguXTHqWZlzdt3s2rOEcr0T0S1Xdjmp2y4BIILlOzMDR0iaUsJqYqnY9ndP7/y1NzfhmtKFh1JLy72ZApIOC5memwkgbjlW5qrkin3Ns5IIfvR3f+6/j+CrsMcHXhgtTx418RnTMyy2bcqA5CI7zNkqGGmDoUzrvkqAOKsqBcFR7PuU0ggjnuB47ojZVGweyoGtUbUrR6bQ4s74ijATZ03u9XsBcyVnayCUfKHdPZuR7Y4y0dqsdh4MgiCDb5XHtndsZMqa4Bv9Dpo4kntoGhkFibNuMtXiIOTizolSYJO9aSObZvHEqgx2eNXJZbfqxIBmxc9PBc05JzBVkSNy39zpF//T/LP1LQH4/b9FU8rezGbN/OE5ONN6KuFemPQiSmIWH0RZpTVSRJTiuQO/Azk+bQ53PkWVgo8JchZCIy46cAkIfFSH4qSnUCPmYHCZ4ch29d1eb1w4WTVpJ4goiR+jvGgNenFfEkZDGjBV9V2Zak7B7M1A2I1OX/WRsnixHdBFB9VdQrr9OUO3nyqtzM6shNqYb8ezxhWDcc5wFOXDTv/1rdh9Y3uQEZwLWgvPpuP3rtKp2bQY0jb1vq9SCxZJpZFv2Vj3OcJwiSlmvZrMofqex7lLunT7xz2UaqXCutCVw0JjSu1KkW3Hhh0lIDvxPY7ih0+eMWQYAFEVVViyAnKyqIHKlpNRGXiYsIWuHGVDHssYizjh/q7biZDPOCcRFbLiBhL4SiB53SbgPPUMg3pRRnbJ8avFvrhFH32rviVFNs2VV7OSyE7O9Xu6fLWRNOcnHU8pSXRiydU54wzZ5q1OjyvNumPs1i/XtduPHj2W9/rle/qRGFswVu10RKnFAIUTcDgF3rJNu73xa3InGjb1eFLNvr5FnD2qpcKZkKY66LF6pwaHBFpsdsV3c7KmhZSBiDyJ3lVmNvbD9qfNyzgqqsiEVgiIY9Y+ZlCACBxAzAxk8CYDcBLBI+JGui2pZuwnWFAp6IRFW43CwFSDPM1wE4HwZPD6zNC8yO9idbZm55XjdzpaO8yK2HdiDTLebrw5EJX+WHz+wjaF5W5rQKWBxhnnRH5xuUVts+RiP4qa1+v1ozK9V050Nvef+Gfb81/mi7O+z6GhHJUTxI63bNHuS8BShKg5mcnBWN03plvGbnNVqVIKqYfqjftjhwUJVhzD7WSzciAAWmedlbs7bsF9pWFCQAVAQKEshhNmVjWYKec+cQqRz7FQ/AaJgQRRYgZMaAgRNQpiEck+t2MIZAQxCUPNizJBYrIQQiZvBWpDC1m8gfp0ecXqGX1XmqF1J6iyqJv30ViEylJtl4N5prFMkdrV+N54oedEg1azi6NOS3aI1DXrp5GyLJtNuQ1N40fJalQEdJyZVPXufO82aSA8u6pORg5+8zki16ufzZy0YwAkAGW8bKgdmub2pJD7mPs9GbEgx1twbsm9e/D7TB8/UkVAUlVChSQskeokjCmB4ZQx0kTiU4YULtOKQpCkg079vGFmEw1hPtuQq47agRwPM35EbEPEMjnWAsVlEjM1x673cmEjtA3JJJ1kN8z65mYj6Z/yonzSm5Ym51cTJTo3OT7WURlj/KoRZhK16gX2QGN+YJi9j5+NVk9a/4yBFTfb9WmTW6+SyXUlIAoAvf25NwMCZICMyRROcMJHf/oRISKtTxRvsLeVE//ohlSvHRoSvedp/ZwvRxILGWLDnzdMP0zGgftmwzAAAwW5YJTaBFtmrEotZyY6Axp7QWgchEjB+aRB2+L1yblfEvTjtthSn5IHG8eXpzX3yT4MHMabLsNFOtiG0BtfQZug3ooLCc7ztCjO7ZuvLWX28U9/Y/3+/Gx87+wb5z6avzMOsL791GM7Sdu6mVys+cfnnz28vnt1+SJet4fIZ7f99ZI9wbSVouqgveoOeVsaNQViFV//3psWAdD4t67OB5z48t4/9pdnM/gsEB0ILzPLvHanCwxSHltAWMIAw0u/qFr3vXbRQZJtViMiUoq10ZyTJRf00KvBGDaaPUfoQLvOptItLwmacEoOn0IlddcXS5Vb48fhiID8k6jddHRVQGwUlqZ+Vrem7jvxLnjXJrw6r46ffG0FlLbzuXSLn12t79l/VszFbejNEoqqqbvEXZceLuuZcW9rv3y63K0PsEBaaD3n5RwyqNGkak1mzQbDd99wiACUFiOvIAyAp/+ff8e9PwmfBbq9A6GaizBWxFSSpBTrlHUvp7deLOXIJyT4vlFP092JredungrIzAhNSuX9rFTmHJIj6JQiJQHqc5uKvpeuedZeycQ1pJxH26psUym6zqaPUtCVOLCWbp2tjfV+rSfd2aowq4ymGVXNqI2H8TldrMInX3vc2G+bBvyPOJtPFk/r5hvr9bYdk31S1FvqjXdrf62HzzKzL3npdn51jknTRDdAkvwBYBUQgAgAnCaQTErw5hwREIwxcH6EJID6dfvB659NW7EOhIRm9VDiFGWlG/xXJz+QV3iNGr7/s0GiQU4iHUT6wUOWNklEzLm2TD5GVPVJgU07tZlb13Tr1ks87Ww/dryFahNboYo9bvJxeDblcw631qu1+k2qpS/XxYROFSDG7RO3/fVnB6+lmBcCH7dvL358Lh99PIF1XvNoc3R6xX0Z6TXXeGqQNWu6IE62Xs49T0eDSZMSIXsn7sJ0ISBBUWQAEWXHVDvTPJgOAAin5A5RURF/ZWY/CwjVOhiBVp7Y7dBBR4QWi4z8WcnWum/0EqQAJ2VubvmUnSZmswUWJkyihgIXIfXUBx/VmA44ccU9SC57tOEMsetsahniPJ+ZuNRNs8mZrJ5NPc3O+oV97q0Hga4ow880n2Nv31nrP3A2Lv7xMo/CymU6+qO3JFyaoKO47WOoxbQJeXmBS3+W91rQH3AMAstKnISchLf+lqbJlM4cFF7gvoKwuKqaH5uyJpDrxtPnr43PARUBTt6GzwBJckA5vcGRUgHCPkW2wCIeuAwA5iV/9/DAlyH3haDRmlvOaO2kXAlMqwhOJCWHmbmlSiyWPeXeyTZLN+GVh77SLqP6GMgFY7dtz80qqAoUKuN4O3Stsbk5OMuHlynlEl2dNuoprcKm4avtn3/wR8cHH50cb9riLJTlJ7/1d+gk4pYhLNZQdemup07aXbP4fAksl+gPa/YwuXWmkHrrV6RlK0o7NW0GLx5M9XYUqsev3ZpTJgTIv715sALU+OwBXvN89ZCVAxK1/dIMMO5TgkzAxg+udkPw0KsXMD12X+redfb1FoG1Na0bjeTQaYVFz1a6LZJE8alHDzZbAVB1LUUHQUemy80GrIgEDND6g0AE8TKPfS9bc7BpOmfKaGMRy4TzJ8FBNnLMZsRmvHp/8/57Mj69u04EC/jko1+9eH6rlZDs1tmtmTwzLGAQQXWZfL4saIyM3jPfiZuuCBV9spFIVAQ5HK/c0Z03D2qHSIDs/uDyXo+K/de7D5ejb3x+/N0e+IWPngckokAyLl/XX/0B7MOD8R7kTw29ebFVP1C/ef/n+HIdGxTAukDOoNhSfonORJfck419xnGujfQZUwyVVI1F37VXk6OucdCh7X1tqJkG7l18CjZQnftME7pydhlSHp2f+LXePe1BkBS9Gr7fP+vKbU4Grkbfe+7bj29h/2CxWUEucoypjgEgFola1hcPCQkrIHUd24Q2JfRuCO85ZxM1CQAY7bZ6a1Hls1ziNSlD51Vz+eT816cbvLhVyisLdG6/Y8JMoNTfAAGMlep2QOUPf38vPtn+n/4Luxzy8OhfBYCDuazW7h999ighCQI6I5uQmS53ICNnDOhtTn4LUX0gVI4ttKFMMu9Oo48RSt5GrGODKYe0SJSL4Nt1gPgQM2G+ZLGX9UZGH4jpqWiaoqHF7ebRZXlLC50tQceRnpTG1HoaAVInI0ilN7nMEbprva/P3xIAV7RGku+K4s4qZYYMAKRSV6Ni/ezU3HIwmLiZTP+h+Ot/8hSgeb328ops2dreit8xvlJvG6mwJdJZcDe5xt/+87v4H3D51w8sP6rfL0KCCDQYA0JLR9JWSwgE0mCSakDxEaOTbZKMjU2mh5RQCJJSq5TialxsOZRbigDdSCtfh/Gmkdikma6Pl6CKVG1tq6UmyfZqUyxiNO3bk0faBKSqiwmmvcUEIlXfuwARYPhSb9KgUVP2SHblO/PVSxTqTkmhptIWUbcNHjyYDK1Nvfbu1r1HAEt5bW0FXs1DJxgko+kdqLsLB9GCDKpgQR8VQroB/jf/mb3ppTn8n4jc3/oAYr0sXDKmDAqjTF0cKCYxaaqYYy4YEiYLIQvlhLEdh2D6rB1ayoE417GJIinUbTS0lTlqKqkwXbdlLKgHaNEsxeujOKJRv2zj6s37Oa9DqmzrfebJYb6EHAAo72RFvuga6n38pwaUhndkZ5E1gA0CyqlmjbnLh7dGdkBKL89O59+U9yFsxye2++QIUF9B8SWRo6Pptg/AmJIbM02IQGAXDLkBmenoheyKG3xc8fD9qs8d1uO8yQRqGyOF2ZRGsmYAQzH2WSJASLbKfe/7RpNPFMVeTrdqtsk3MQYD9QYKvyW4neKG22Q4cKdqqpUxfbWKRZuSVZJjil7NkyVPJj/7sE/5Hkk/BaSLcv2YEUABEmAZAIF+xv5SSp/vzKsAKgmMILtEOYhk745GBABNu35ujt452/p8Wo/bR/D9/Gp2MUjF0mgMa5hkRAciWargqbA5lqQDrJuX/8Iyfuv+1bIDSGT9FBohCGTMpKaUlARqZA+9A0khSC5IoexNgP58bDrsMuWSJtnDdoS+qC/fgqeePRjqYPv2/UfQijKbg8s2Z0hRy5OrNPMhcqeHk41P+W4XbAxaxyWYBEAALhG4BAzYk7giUoKpd+trl0RERdUYRdDE6QODCHzZTe6/eVAo8nJ6xm3xlvEIr6Kx62Jlv48MaMOMsA/zwcQdJ9W38BAhvjKBONy/gtotKDskQOYTdIUhcJFBNaM1ZDClvgOnZRbIvgxIcLgpt2XZj0LZNylj16ct+UO+7CRi0YY4XbcdsPY+yFIVgBUgXqSD8VUGsWnrWXG03o7KK87LojJRgTIctlnBo0lAX65PFFuLfLcaCCKSQVXRvDO95uImk4nDx82h+mnX092T542+kt1a4sSuMQrPHxleM0hT1Uvln1hM90Uhw1eIm5UpiBYkrPcupAETCEmKKeeOwRO7AiVFhZBTTIEpAmBUl53nIF0OUTJvntRZLLYsEENnRy1OsyRQcJChSACEZ0aMSA42QZkuEbpFL+wLr5YSQEbEG7zUctYA8c6toLsJLQvfdgMeiAibxz/xk4t3bm83cvfOVhHgpQd2pBh4H0ahaiPfTux6aeKdo5CvAOgATIs0xOTlcHSPoRDk+12HKjUlSREGzUA50zDiMuUoRlJ0OXBfdBIZK8HKj/sWW9lwW0BmAah6C+RBMqjLRQbWkMXma/ZZATMAaAAB2bkbDwKQpUNQoARKCuBveOP9Dt+jcUdzLMKdzVh1QAIMHtx+/Gx8un1zsbi6BFRUvElJRlIkPENrI5HwCJprg0xaqLN2E37tZQkCANj25RCblwGGO3vkjHSc96PWySsNCeagTK4soqCKCoJAptQ4zW2fqDPW6AEmqC9vNcJBKhb1tohsXet0OtocnyyBEyQrkiYas7zY2n3n6R67A4AOCbLeMEHsErybi/2WrowZaBG3lx759hF8rPeOHj/vAIZV8UXg0AcQ9VR3oNUnZ06bBw3p+qab7jeWAqcDk8fTvv6FAl/dkzT8+1k7HpfsO/9hr0FgIquiksghCWU0krxcn6h0aWMAqbQTSBFzppwJozjmXsFlATCQVV+B7S8yX7+I2iPB1cdrvw1Kqz/66JPL8fnpo8K4N+83H+jOyIt91Pd6XcgD7KxIe7zI4vERr0B6++CGnnOzuQqw49lYgcVFSOHEvDT0+26nJADTzjRARkjQ5KwCikmzF8CCSFPtuiIjqe9RBLC3JKRqrjmoaG7WSQDyNXsKCqwD0OBKs8UWAFy+0Z8B9kXWm0FENbd+9eSHP33cj+bjdQPKB2kVd/yB+uLGY7vRBgBYtsQeD2oZgM4eYn2tOZKg31KRPXBjG2bbnQyD2STNP7OKUN17OagKAEzef1sA4Db+dV8VUSAl5GsCAGoo5gRFVi8uMUcFSipIAiDACmq8wizo0AACBRhw2L2S35IC5B0z9+ILXRUJSFKKYX2xDuQWR8WlK7cHrd8RZ98k3ANZ28l1r7/xXUYxAIB3Rhp6YfCqI+joqOwkIUEEhgTguiJ4C06nLCYAGbrHLwIdfH3P31AK0D8LANtwP26QtL0CAA3jDgRIMAFSDIi8SKLZUgqZcZBPUPZ8JygDwLTbyTU3m3YjKvgFn46qiKAg7cXKx5BjnVY9O7fd+aBhX3uvRKdvG9hfunNt2e66cReg5A4AdAqwEzE6Go3ieiR4sqfYAolfhUdTetjNPkeUy1/u4h8FgNfvsx1xFYOYSIERcRCaKqAgmUGNp0YEbAIZJJY97yOs7Ly7aHWPGWW6uZ0jfxMuL6j8+hgiDYzMIhLXl8v2fNVJmVT3lcE8RdhlcrHtomyjMwiSQWk7KQLIfhkglqJwgDzDGB0WsbdInodmswdx4nqkPm/cjRdBb8FXgJtxRhVAkRCIB1QURFEhZVVFTYzygnwheygLEMAEM8BLVMjTdoBJd8PIU36tZlxVBDWOM1DWsO6b05jDASoq4N4CsFsefuc3mLez7VFfWXFNAICqCWDGze2AotxonEk3KWqRwxzJ97Uo1MVkdZj7b9wY8flXgBB4VN0loQjXA6yq12SsgghgArwZZRp5UICxxJuaRDpAv/MB/k2zEvjXakVgEik05V4QhHTbhUOBPbu9rQGXZ3fjWdFpMEUyot14SFgEsK0mAlehM5JGZB4f41ZG+KveOLMhhAllxHcqP7wRjm7ApDaC7P20R2KhRoagXSp4zYoIdJCQKN88ZfnBYBdvzuuVJb6vkRECCaaUJWqO6pvtqmttX6WaAQD3e2NwKD650yThe4EMZjh8GRGrsOHZAuUkxkfS/7ZUC6g6bu6sVLJezx1oUv8u/F+S9QvQGIF3P22WKih7k9GeTfVlEgPuo/0CPlUZvsxSLA4SKhAhCBZJvaUm+fisPWys60Zzxj00UQfzrmahyGbo2B2i145nU/R2HKg1lrfKxxiyRmGvXWsIWskrO72jEDjhFgoH+z0Xu/1K/10h7P7X8buLquINiH1mBqXw5aY2ErBBJAbUoOSZxneuug7gYJkncpQVdzVX0mue7HR5dbGuAhb8hOin6Ky83rR7t1ZjN8RiFIOGdyuaXyDx7Ykx1tplcqWbGPvwDL563fiPoW9fF4dTzNdNAmJpT8+ulrOj97d12Zmx3/ccCNccFDu8LKFj1mqVjNyU+I4LAEc6zN/2bN5eY6E56gJizQVPHB2PBoGVbK/4rlSA60oKepnfJCq+6oSVP2ZaRGa0MifMiohaQbIlQOBcLJtbd7B4pIAKgLBnilYR1wURiTGRHWzLkt0CYNc0spU9U3Cbcc3IjLr3tVAimEplDy0V7c2SzK32m/k9jH8nAESiF/yS4beG8F8Fgl/FVOFzAtKXN5hfk1EGnvRw1CdEQjEkXPTa9VLiKJnZBaAOpyHAkAPWMQoEdn9rQwT+i8t+QoM3buM+nTp2/DHFGSjqyF8+GDNRSFw16SvKFaVQzPfJjNhj8l964Yc3FqBd73D4c/8JsAjuew/65ZFiRVzNy1XGLKKiGUySlMUV0j97u9tzdN95knvrpCBquy3CWku3JqS1C9udbkG52mblTCiNfBOh65VPlbOiv9H74Op6vmzE0mKlh/ceYvvCHB4X8Hi7g5//EOKBmwXD/3IaFEBy1yYcPq8q5JizKmv0Z2/K7nUBdE9D6uy2CUZ5nCO1M9lZC3rtqK/glYvdrSVZ1kbhBmobl5RksHNy7K0AB9wo9m0uAUBwgyzyNYDV7k8af/YSMnH4X1GDsicJTJBkUoQ4U2772+9scbBdYzBvMF5mv2nIj70/VlFnciGK+nlti3FNX12PFYV6lVEMYmEmO1B2w3y9Gdic5mEnL+IDvpH4j+Ebu0VKvwkpuyBQPWiWuae7s2YMu9gtgMC3L9/LwcIjPa1fguVrW72lrZ7vqO4NGbIZkPVRtKhleTFAwC9d9+VABdObL+7C/2ocRCqSoJO+Ebixryf93LqxIuzMeAHVGn75wm+8LmWZtnTHLbrObdeLzb4rS2WjWoMRNKhVlCfOwXXkoEsEG0lA2XyH3kV+9C/9RswIArJynjJThBTME7IHtjWI8KIHBYCP6ve6cdi4E9Y7bCHXOd7xfZRssiA0PaKM7NGmqjQo750WfDeQwl4yNQ/fHh3zV7TbD378jdjmAiQnCJo/TVKJw9Gn2zXpnt+52J8jmn9m/lwITXqtWGFyqd87cSQhUuTGdmKSMRgiBLCiTjMHsPTUB8FZv7Ha7VsVsvzyXXzv5fLP/Z0/fjZHvIfeL71UYVi6YSLY6BeoNo/kur2/her/du1Pa+w7HkQQEbQR9CMkUN/1A006PiKg+G2yWM+Pw51Xbge7jmw7TI+Dnn0X/6Sofvhj2af4Vy1VA2AmCE+RyIblYLQtWYuhkLsNhWuOF6stFywATeWs9uT2yblbXSyQ4zoRkbKjidZLmUoJwpfrjh0ZVhkFjggUAHD356PHvtygev3N11FbExKBjEscmsX9PGJ1bDt8cUJN707+0u9vLcgaErGfy3WWb/jqQ5GUBIgO+kpm9A8QUBGilLccVfOTeBMBpZ2uQuGjfwP25zcfO3PfF5PwDdkiEAo0BwTI4xoVdrHn4afLTXOn1GiasvRgbXtnd2clOfVZ6idx5E/FPANthtOdhRCbq4glbKvp9BUn5BoPuTOI+/DsvzoA/8S+99/ELaz1LghwKruO3tV2QGhb7eMGoLlZ//SuicqUfP9HPrgqCUeIYnYzoJGCk5hJbIdJKbgnXo2z41WctH0Gsz/sKxxLLpMDoKUzQ/xL/tIbkOT0jdupNDMC3VV2HABB+IXkivqQQmkjnk8uX4siN6Z866Ib8yTGthhs3qC2tkcAyM+LrlEWdgbV5uJvmcAh6JtsB2CwMcQ//rfwzeJCkGwGQqrdQQOAQav8Apg25DcOp39S8kqWIngUyXHLUWIvYUwIC6pzMCZEAojzb90yZWW9zK+4xuw0cMMkWt9xr4agjvgGw+XuDfwvjz58s7ZJOLQLLTCZKgOgXB3IgJOQDjHuyu9dzSZ/SzrJcZPqfiKTOOEdzmPERFEKtLIQdFNGSv2tbC0v4zqLYuE0mo7Mw22GrjQBpveN99VX+77xTVufaAgB7jgJiNCMccBJP8UOA5gG2xNt+Hq0HTLKcdQQhgeRwFoWZScswUW3CoK/pEDxeC37yivG8e6Wu9bVdj/zy0heRjIs3R0X1m/ouhbnhbK52SghAOjYD5MN58FDw8a4pCTHwlUCZ0woCgoGO04o4igSWnNzy+Rctjjng/dV2nxmnG967o1oyZIQyNudUhMidoBo228+yvo3czuj3MSwGXaQZiYyrKDegqr+cl6Pk6gqZtoc79xEpOvZbhRGcaSyHh14/QzjfNUl6LvZ9+tXA34d1qb/xGBnIIMrvvTn1U2HywDmfvzo8X+92L9pWw2EOVKyRBaDK1PqsMIGCwUA89EdRUVVbWyHtsOXWiLx/cDr2YgZ0H/0I1OMM7YFOLf75vLg+tmN3c7F3aTUFpIZ9tTFzgBhCuDtMe/YV/ivC+Ibt91mkMHYMxMnnvhBFQDG/vqhvdugZkJVSd1tul7k2wpLEhr6TM3IrX6WMy5iOcP87peaK83uzagTfPUfKLfW8pYgCqNCHbGy4JvGhSLLBYQQ05ogDLibkYKGCiDNrP/4yWymAMXCRhTQKHADRF1FRFytZIJ2gTGOTZXLKzwnNrWup4MtTwy8XQbcQzjC2sUy/K/KwSgWgFQmwCLBEAygcAkO7fYX+Va08ULcSHXtMuPMowxHoEjInOwihUemwRjjQrB8wyqG9ORYkvdCpemWscf788L1ja315J3y7Js7k6HsRANESexM3nkAn2HxaGngSie3mw3IM/VsHvgQc+CEoIgbttQM5xbiLqKMcdbu67o2Nv2yNSlUJV7MqIKjZbvuNVp0kILMj7a7v/AN3oq6EkdYaEwj2SW0QczV6nQG3XQim1Tgx27KCXcgxghJKmGcJSqCX5iE9pUQMcqU5RBtbCevbHootIVy/hOWpPO224lUI4YU7PHvxL/wTd7bZZIhMpkZpJLdNnCAxTMPyYwMQ2+rjX0edkoPtYiEOWIMgVXMyb3Qk/2dQGKU1pnvK7Bzo/qpD9en7OjCEtUMxUywo9AB/C/OISHk1nMZBy0cPJDoZV70UptL1q6qn0izYR3p6pFCaFgskRLW2M5WaA+6/V2JbXEptHJbW5XCr5NCuZFtXMzq3YiHgrOOlLlLTN/w/UPEmSngFHY3gtxpNoXC8qqJkFYsKLp+zUJIRohQOW8E2ahfNoMwsjGRmvmAFtd2u/HFY//wWEsFuVYTIaJAcdIbOHer//sGb9W29YdsCQBAd9l4cVxgKvpTwaYHzWT9JIgwp0jNjGfayZEPT2YVPs2jMlWTwXZ1cFuM+7uvd/SBZiSToFqSGv+5bF2Id/S8Z9ciAcC/sRuILjaCO1UBfOepBoVRcdk4DbFXo9rjLKJCYOVYuXj809PFitbwkT/HqGSuiCM7DEtd0NGtmEXdN5sPHzWA/KYtjLv3T4ZFOf2buGMBZESISPcwUUh9BAFlt5XEmlubQsFAiEQAHRhibIpSSiUNs+0BpiLfBMv33V27v+32fNR06qtf6/BG2I4Ky++InzziKUTf0HWUghB26qBkxWzEc6JMIgd3z3obaYIRxLi/fRvlmrc6vhBqxlt5/ZrOojrNBlQm0O/lHsrFns9QztsJgXeuwP/yHLTtBQgH18MdMuV4mRSsQKvG473pz3UQCpmCrJMkCjeX19u6YJQSv+/W20YMmsI5jwe9xLgTx30aykebKmFBI8R3693P8Yhv6HZXan6YhxSwz1glE5OI6Z5XJEcMo1hRpCQONutx0FtWkkQmBcXb1qSsTB2ZGJFAd9bsGFOgt5o7ShIokL0bcTeY3YDf6A0CSMC9L/4Kp2CB4lv0EYPJtM5vfkYKgTMiIQFhFA060prCqGTH1ezmaiBrXosXkS+SQOlGOujJLuhUYAr9/bB9a/VKOTuzfdP33yA21+1ci5MQl88PaOeDffGMsQ+SGTyqNDnjtHh4aqIZ1XdG8N7K6tkv734rX/tlMr9rvPnWJZY7rfGIOW6fIYcP4HGOb/4+oyeIVa+PhznP+nk+9Yinl8Dnj3NOaIK7t+XCm9vu6vTDNUGF55/E9eXkyfny2QVP4vzrerXi+ROs/S708MZmvYelffO3invvLxFyKiKOGfPdcX7IHgLAhLo6k86ZxdurqzJvPk7in61v5+rwPbXsf6J/QX+5cLXzF/3VvSvf1JxnkgvfCK6q56WCmQJk8ETL+2zI2ZjQas5Kkvtuu/nN8uJDDI+Tm39j/GTj1uzPz2u+fmC8+smn/eW5TWfQ3tiMJ+IbxKVDyoRI72gPPj0EkiAczEGPaNyoe/68vXq3z+eH1RV8/LB02wM7E6enL5C68XVZXl8SDEhvwowp6RvFv4cQIgBDGuSKlhfACagepz27kbRiXJ5ht/147Ox727O/sZqvxc9H++Xl2HW0ABs7kW/4N49vEhtEEonJUlNvOhONCRp1e2FsbajQnKvbI7345P3pnW9YmbpteHr38iev4vPuemLnJZBdMf6g8Q3qIm7jBgH1ocFttQjCKB0SqcrDQxe87drNtt98+IxH5o07xcqRO3E5uweW+8xlpQ+vs3at6ZvPt7jzVcCAo1YEBDNQZiUATKurTa7xrF1nzdv3f/JeKuTqvE3nJ3/u8zs/cflWHIUFOlRTYDSHEtfNv3l8D2QlaG7TGUhCSUpKSJq77H20oyY2XjJAv95+chUen6Osr6cHHDLvX+YDVyGhN/QDg/gN5AoDkYfA1JemMBOSSVE03H4Q0ZBLmw05zIYwt8tlu8518eLbDxdLrGs7ru0QQOIb2kUA4JRE+MoyfVDIAaV2/m61TkW7hMpiZkpZpQtd18Ucp6NfFPer83JZAPCN2jeTgyFHSsIsQRTI1jb+pOvDdtVa1w7ehKggdTl12xb+5PzqwnVZcw2M9g3uATLQuiAdpkgJQJrUL8963fY5dwKKkq8ZpqCQUv88vlhkU3chHd8ELwIhmEywoAACiKICqqIpZchRIfIUA4Bo6l5lw8GWPKyRuWcHflPbEomEuUAkAcCggmZRtRRzpJwShKxBBShvf/nFAaZLROfORij1De8BcOlLU5lDVNmAKOZaQz2LIJJDyCIJVOJ20EOmOqHdd65u/o3rZwrjEQqqAEkRIPeq0V6fM3w3UmUAzXg4R7k+v9KjxjeuTyG8No1olsFlFdSvh28pFFGKTAqKnmV6QuKb5IXYeQHUXRaISKQDDoSqgSwAEhNSOyO3uWuGb3ovCRD35yFEVB2MqiqCol5zMdkOYPbHfd34pvjPIxFYAAAHJAapSBWZijThG+0Fd94+7J6w/x2FSigfI9M32mavMZy2SwYHFLAcmgXpm2tTVQRgxOGzDa4NhhVhwMBsW8dXflM9AKD0gpSCoDtPYMQ32qMAL/qEYZcFqqICXjczBBDfsC8quntHogQ2++Z+Eb7ZX4T/H58LAABWUDggHvUAANBUBJ0BKgAEAAM+bTKUSCQiv6ml1Fr78A2JZTo9YffH2yyptSG5a9DnBH83zPXlXz3zOrNr7/L98P/YPtm2yAZ/8D+3daTGn96/t/7ff3XzP/cf7r4g3lP9c/y35SfQJ/Fv5h/fP7D+zf9k/art+UbP+Fs03KL/n//D6cf8x/gf77+6P919zH2ZgYNS/2v8P328Z/S86vsB2El+/+Hjh7r/6vPV9s74n/p9df9V9SD+tdJ7zm+br6lv736kP9V6qn0d+mr/veP5do/SfY++bfbP9b/H+zD/J5d7Vvjn60f9bwf+k+ov5y9S6Je4v8eedPOz+jtQbzC8JWgJ5Rf/j5YP33/x+wb/Yv9r//P+V2wv3s///vJ/uOYxo8bRsxXVg1yU5UlqmRmv5n6llyo0Dsyy5UaB2ZZcqNA7MsuVGgdmWXKjJGsg4Tet8b2RtlWpPqQdefQH5XGFyKOkLTb18+SLNuG++fzwq1FcSCfPnzZXsZgH4uyoHSb6dctIFlONBZskNpw8WenVq1q1exZs2bNmzZs2bNmzZs2bNmzZs2bNmzZs2bNkxxvfDle8wgvk7WudtIgDSOSIppHhkswKhCFY8xUnl6BOQs+um6vUatI47sQEyjFd4tAiJ7IrQlS2TH82z5nnz8l9JpHFZt1JoimENF1W9v3KMJ9h/owC3bVxpfaOcgjRZfW6BG7Xr2LNmyg9zehdNxkZYTuECGrTjMR6LqARfupRMxHouoBF+6lEzEei6gEWpzsmBmhcm2MUEjNCN3lyLgTDBB/vdMOR4bx1r9lSdoifHe4EpSCVKougui8ItNiPNkBHa/8URdYqH04xbkiDetCzYJFrjsEbT6LalGAv8JDpVTTuSDZ+cnS5KJXN/V0tCfVAk/o8L7PGv63JF1sIBUBho1onjoUJ9es6sX+uLlMLsMTXmy7/285PChBE6P+WrsePHfy+s914QvtfJSrofKXBokd2aRQtomheIND8A6q2Iov4ypcubN85QKcLSa3ANNJ+TBwS1fliOyWd/bkOHgzYEdzr+cjqXEBdSrc5U1OftxV/SrkfqGsxPLQf/6n4F+QGaJvmn+y5Du/GNadTEuEjIrB2K0AvJ3NUyYqXGFQJJyNinMbU64/r1dbqKYCb+DN9f/jgy+Ghe01waXPpWb6KBMyvk2Xd7HYA0aRG4/l4yI1XraXnWbKGWcDyZmAmeZZvf7P/AEgM6tTvMmV0XidzEANq2jy7p84n3sdS77KpJ02J6hZzYbfGfXznx4mK6QOdZCn970213gdDa6yK1O0vAZAzjphjq5g4GyQfj+EOLC/2vYOrxS/C74qXiqE7Nqt0nPN77P3+f1NxJ0irOtXDXBNt0a47Xxhm8pAQJZYUeRF8SiGz08+N0tzTwssdnPchpVqIOXGDZ7h9Yy0AAsxC1Eox+lropiP7DSPgLlA+kQfgcxnEouMBjVXXwvaJ2kCTMJxbcVApPO/tKAlvB/sj5JsaxPNVkRESyTlYGXll3rGCEix9+fqLssKF2oSGcIWFNHMYk0YI1kfh66KMlh78FAHDpM2C/+eNqoPq48I7IoQ1ifvwqmsHRlRnEJDISoCJcscTVtmrMLtajEF/C85VlCjKR5SLP0b0aephB+9g3oXp30oO79kx4MUw5Pa4i6CQH9Wm6AEcOqut1QMKgD8kubPbOZ1IWHCsGOau6592qez2az4/qODlcOI8YBnk73Ty+qhF+2L4YdRNjQw6l+SXTpOfdMbIdBsY19IuiDpeQ43SGsCULmao7imDXg9ODDL+fpRUENf2AA5TC5EINAQdPplwgNtnOdt/KNvZdqm0UIMJBdMcF/IRQwT+tMbIGWLaZX6JUPtbcXdsScbMIjvn1jr7c0MacZ69A69zqv5RaIml1OZH/y4/QjTrBRl9WONYM3mD5A4lYtpHHvqs1MWDA6sEfPCPzfiahBWJwcxXfn9Scb3WTkmcRR92eDftF9dfKmX3pIoNeaYSKqO9CJivl6c4eIfpn6TRqgrPRgboKfivd+MfuiSvXsKNLXD2PMy03zQVCH15xYXu6SGWabJHY3bEzwub4vn8z/rBvyz4gImNB3l64bb3qhzSz9Rhi+Hc6tumZv+5cyP6ixm3ekhkbq9mn3w08Lx8Wvtt/f8lYhwdduvdy3vQpO7MvbPsCBEKQU1G44nDV4WSGF9bpl31b483jnKgzVKJOcl8i5Ms6fQ/Z1f+HMAZ9yI5gaed9Z04Qfyq/yDEHD0iEi9lNkyxDkeQ/hfpf/K3lG1iXNqq2SVK9NyZ2VLWvbYsETEzlLdE8z/2fCNF8nDaYbfOkOCM8dhKtQk0jjJql2LqNDBTY56S1hLZhyPF/oOnIiGJmd/lCuoGzMZbRRpUDQ6HzIuljC6ru7AiIvmaafGVUbfVPkRPogDh2seIwO1mVo5eAPVj/3fUnJhe8pMAxdxAs/hNBJEcEPgRwLq+B1fi3dwfWHH3F8e8oY3Lor3AE7VtWue4yccgtJjWYTGdv+XCac0TuxJ2JGbagDJdCLhbPIlX9BD0pRFl6FA9+xdKGW/E1HEb70xiBuN+IK+xoCA+68WnhogidsNAmQnukMye4m+Ac6N6M/7iU8QeEmcGzTr/4xY7MZ/lUTDyWzawTo0gejz7mtKL49MuaOC1F/zSsHCNsBaZUJaGHNxA+gfkJHAdFfI2eONeI8PbirpsxWC0ykASgUCJsDcK6CbWcLCchYAnlwv8Dc1W0MbfUsdyQpB9Yuq1L41BXMQ0HVYGhoDvDsQzk3/LaZxlzTG7uyB961FJ49YovryoMKcLxYeLs+o04K8umHIjQVJTxBDfm7bKgAjmrYZLDdUqam9FbB/ye53N7eH6GHwCsFP5xDamxi9WZitEN2HDcPZo/iBzixbVhEJibx12Nl8mDrTQ9HhDXMUNfMEChPfFnW/lNeAFJoCNLb+NfyP3WEzpjl/b2hWR6VGpi2RFRXcKuVaYxrYn+zQOdxnijgWnPJ1z7ZgrOHOEnBtQt1R/FTpmLh4qXRSDqzofdqu0cWsiZpB99Kgie75QyEvmv+qz6BdLUTmXns94vxFNZR3bG4rnVcgrxMCW4AejtYtugMatAGaDPXk3lnzSEPN3RDAEJA2f7ItRlsfq34+rRJr5qKtsV//yQrJ1XVl7m/LFwnM2dCGMuYpXVkzQugX4OLOg/nZkpydkmqvslxLkAziWrSaDYnKmdHnbzDrL4r9/f+ep4iKJZJ+LlkPGxHyTEMs5euftW+46ttJL4CB0jgllNKzP1C3Jfgb6FYfp2kQZFZMKhbZEyHVuOMg4u6QjLzLY3dqeNgu+GBmjMO5aQwTnQvNCk8xHltqtCFqzGJDf0IPwJjuyXvFzX3IiFsBTQzF7sD03r4djkMw+TFZUy/2hlG68AT8xvlHvVrnkqG5YQzgnddSJCMvlTQUzh4CtCXd24uT3I4QCPKX3z+27OddPdY+XtG3bIa/nNpW8sI/sj8wYPmbd8XMqnhVdWZi1AUfhhVeMRIRz2pCgs39ZWzDzATCDEEp+CsY91oK1LOD5vcFYP00B6VDarFg6kd76SeTT7n5XkrdyFmUKgA9/EsIq/BBKIk40pxuIodYapqhruGCMbT98fLBtlD80EPdJBB87Eh9E3Sz0zNyc0m/9d37X4PRzphM5CKskMf+YP/Mbs+0hpfxjFsO9b2VHNWs45g1B5T1XypDkemT3RS9APa4FZFuo/7Ejaqf+y10i76PK5KZEUQdIkWtil2fLPweK2VjT+oUXYAUDdfuemgwtEhG0x9oqa3dQYTWqs1vM1MzaFrQr0ooGjFfiML/811wQ3AuIge0r3X8TV5W+cMOQuwvTTSWoPexyPB9t9L7fF2BEmk//zHk893Ijrk4k4sIJMgYQzKwXzHuWsqpCAMpgf89dYHW6N8l+1G1Yl91YzAwrptynH/5dQu03EW+ZuX3BMikQCS+Xf/F6GzT5sBqRO2sCp7x3VBifHXSDW2K3kBI77VsAQtRsr0crl3wBPFSfj4YF6PNO2lxiM0vsFnCKFG6VidzK+M8Xw9nKsLDx7GIL2nptRGcOQZqWS3BKxciyrBNM+6XQ4Jkq+rWKWcjJyv/Orzk+nryKsgoQ0B1asDASe7b2p3Cdz4sLuJOZbPjzwzKOFu2Ij4UJf8EKfMD/xX+aqxc4tFREC1j7Aw/USJQ3oaHbNc5CHyNR0Ky+xrjq8IItFGEs36v119meqd8J1kKXrjsoYqWXKyi9KsBkCDviqWJike7qV3HTRRHAL1hXVPQA3F6dERdVKQ9YmOsPUoymaP//DeQ7p8hPP/XFNe3i2+mOotj2zqlZJPaK3lMHvMdB/ecKRSvjewUVb8vLHiShIpmPAkFb5ANATpe/2vnLdAcZVJEg2U7V5CeSh3XHt+CgZqNgQ1B9XCeRZELU8Gx46uHi8uDdTD1CaiqZCD5+TqXMfAiosbjQF025CyqVdzx5Qrz1zBt7q15wY0iSHJX3H7sW1N79EA+0rO++OFBSHFup+c19EG+j+TevnYNHseveQOxUKU9V80EPBIkPq5s7u1aH3UR4TndhRSgH3Kx2Pe2hLKBHcrHY97aEsuCJmJDtIcOnF4R7RPxHkhCJ4h4SjZ8lUwo3CFkTKDDp0NtzkFDhH76Am9I7BidABAhbZ57b3+teN94FDpc3nuX0msP/cmaKTgS6GJ0l2jCpV7dlYQdHZ322UWEf8RC11BOSNpdxmhyVUqejVF0oId43HdapJni62ox1nGLUuXNnT59H/t3Dl29fPn8GFDiRIkSJEiRIkSJEiRIewL/IUt1c7UG0A2aE1G41Le67eTXmPVRWUJpdOqAq8EWlTik5ISPEo1AINSZRphGMKeLLbmnxyczz5jTdrImnI7Z9S24OunUouMEd2a7WR2Tx/DvCMa0DPjkSy4I3Kx2Pe2hLLgjcrHY97aEsuCNysdj3toSy4I3Kx2Pd4uSYl/ebGe3gv0C3j8CeuGxwxEpADcHi5hNZrHgLe9tCWUCOpBdZiW0JZcEblY7Hvaz2BtR/xp7pzf2TQllwRuVjsevYFWD+2xjehf3PogDY3ZS6tWtWr2LKBO7Yjf+hPhkBTZfKLWjrKn0vHbMbK5LpsLEMIcdw9LOUW4OSof5AZ8jljQFegRwYHbXk2PBBI/+EFbKe8SkMAdZGl95eHob3AQC/iAK1+ps6R+SdFtp1afp07Oxeo4OG3VRCoRAtogmzT5/Vs4VD9yqIjzpW8XsTlrxoCkvqHJ9qh8eUR73e0MnIZuO4z14M1y21CIH/pZL2aJ63ICv3mBUi1Efq2ZZ3sCSFAAmaGU0GgK9AjgwO2vJ4BB/4C0XFhhu0Q5uIAYWk3ryc9+y0ut1HQHFpL8C/3oXhb7tgfCH5sTWGsYRwiAKkNTGyILS1oteNZz65558IAjL6/dpe9UWPumk/fVLYlIpp6OWf5xWNovBvaTcjIW2FccSkXXI4ikICJrmDB9UZyxKXJOOVIN5NTYm1R4nhJpya7c5ky42lvfzz5XiMpps12hHX6wABOSpRcm+ftq5QMYE9z+x7tdxn03dvpWNAV6BHBgdrZ7p71Fw+/QFAFYi21HWMQzj19ifG7iypaNGjQGcz8Su6gsvOZwSNTnvzAtZRZW1XgbWvv7jTwGAz2VHiSt9czsdqW73lxPcrR/YBfY5LVUntYMmZzuFavVORSm3z18GdRww0U0/W8yKjILicXam/KE8H0i5kKwQQLU1CKegQQ8J2OfP8Re+MqFPxeZzJWG2TBLTjxqhOFR5QgEqYkpGjTAhKYQ9AJFrz7CybEbR0WkiWeMTiBtYwV4t4RNdHVyvc4EE7fuMtRwVGQGadwOWiW2nwRDHoihM0Z4H388wBBK0CdQlcH12f4r1vR1m4NcG38M/gaUlAa9uaouoWyPcrE0zZvB662VhoQ+k/pbFhRz/iUddoccFbhEYFERdgYZo5ie0KlDb4DM2OPeZir19Mlh7SD+thPOAWQ5aiiNxv0oJxRbB+43R6ADT8IsldUtQPhetBsUSPd9kXGdQH3JGUpNNKq1CxJ84vTttppyJBS5ysvJwT21GW5mEnyxd0QLakJMUft+XpgBrqbr6tRowGOddadsO+dLXkvBq9kI7vfXh2mmjBxrfJjmzkYUe2d/jYgg13OuyicBSjOP/LQUr8H6HViUl4H6Fa40fXktPU4EmLPZ7BHD4lirscdFXsQxte/j/V4D7vMUbuULbjyPndHQvZE6QZJgUCGjm0XHJpWzKkZRrBvUGEynpYNTlK80KSN6Gl/y3rm0GpmMUF9HX6KjY25c3UkYRkY5PYavYB+/7XTUw7EoDjhsGNgwJYUcs3hJGIEGGifHPdzRqG499pNqzMggMeCcFPK1J+/R1NDDIqo11PuSwq441ALKJE+vN8hwZ6nkrkExullFZZKLA6yUA4pnnSF1BhYrWA/d/l5lxgMOi893puNLA+IZkir4BBlkiKTuT8/eWnY9DK9RyOd7afd2UPiY3ms2Q+flRFQDxowxyVDOoEqMGovlgI/uM5+smF3XOmmGaibvWZy2VFvHsePmgE8ziLuYgqgnccmj52x2zuCXxtNEVGW3LWn4Q/cDyfQ2qGCAWt66YhIzt2JJMr5II99r2aQTCxKYPY6u/zoAicrMYvCFByX52jI6J+JjRNC2HANhEMs71DDeVzZfulS5eMU3STtscvMee52bpEGBz7v/2gT5uQv9GoZrxHq9duN+h32owG/EUDX7Ipha5TkN9H2/JmlQf7eCDlOU3a35FcdJ4r0S4y/pFp1Fla6JQTu8W/bRt2e7l4IP8ARL3vGOEGVhPFxXl46pskE8kkQ8hJJPhNBlND1VUycwyIG6VW1fjDUs3GUc19sFY7e4t0b9Moy9Tf4vef3qhfvxkh08zzgr/ZyxEcDEs/Vw3vNEQXHAYxSgq5XXQ2keocLcc7itAAUoj6ITtQk/CWlDc7+hInv3knUzhE1sWND00J1uT9+b3elXpSovQAOhjgcIsDUqZP8s89IDouYmQhX81ebbA1t4QM+JWbYsvLPCICwEza5ylpgVLcyvx3iubrNlmOm85seFDY80qqzwExKVWJRnkeuIrCL9YTdlsjf+Fup5nUl7RloK6O/zr5QwT3sVEhl0NG7FydpnKBYEe1OA/QcIXwI+U9xyEt2AEbp//NiEEgRNyAvG+/3atHLc5rLdN4hqJbuOHbu3iJ1ZLctM6KdoWSNfYV4VOW1SM4pqX/shfuqzvaJqGq7Z8r7Pw8bcv8cvebSahWFbCBiIFp6qZJkIGBrsW3g7LxsHLZHcwWPLlOZJ9BkRn4vLL/OndNoD6RZdFRiXlE0QcUkrK+nmLcZ/1mBdT1V2n/QTnqRF/5RwybLW0arG45zRu9lY/NpH9gRvAMqTojgQ/+9FC2crBLokwMb+0yR8G28N4TLi84OGdDvbkyq71j0lG7uSldXm4WEwvWSaUT9Y/oskmzNN/aKAk4wyjikkTiAHlceipZGPi0DL9+01DOaZ7IJT5kPvmPdXvPS4XO9+ypgNemVWnIbASTjsXfS0kEJ+Q5deOJmKkE5KkxHBUvOoH1ZIu+VQ98P6UoYzrsTpqGlchk8VnD2UHRUw6ivMlZuDEQeI4n5Hmzw+iD8fQ+UZeviWqfApleJLdz4RsM7B1FLWftysXfd1P8YUMisNNWbgKU7Q2Sy8My18QflQA3V7LL0SuAmLVq3OP7iITlcdajgG6/FGDOd4T2daxSe27X0/Hfc7lv7WlMouMAaV9IzJp66I0osMdzNHwqsBqszIDreJgH6hQmxCk3sPF+40Hut/vkCTyq02mP4ov1s+Ff2uplxZ0RvLFiOEEhTNHVNKBYL9q9PV/y9Xs5PwqiZttQDFMn1FeayVeU6ZEfyY7BcdWTfy6waA5sNKJ6HgHKtDBeiUZtjpNqyPbAe5uHPYbYpAqJrnmQBRZXBlUBWKUOR5YOvkxLeuxwbEP09mrbVvNz+2FPz07FOeHqu1bacGEFF3wbeIWK68pvVPLr/9WpVHt09GvJWWcIJMBsKKqfCUrQGRSD2Zb5nsQdEHPCmuJHVdBksmNhWjUIYB+QfpiDPYqXAaq3MSjfDk4HFcx7ZUzBOpGoBM0ojriCBFKjIiE3qXEGvUsYzudoNkoEvzgh+P1oCNAdzd9bsz36Z6eKJ8GqZD3WJ+rY6pEabm4PvU7jc+tIPpIi31zcZpZmHc3w/f+UWfmL4/DMCdGHhJFCayq4tbZfYGjXDJbi8i4SI5hrAgBltMIqGa1huIOFsB748GldKFSOZB0I3BWDj3Hu/oIQrIz3sOw9peBi0TJrr8TzOVz9IlsQu6bbNKQ1O1HkmJOQECXlkT/wrYWUgRqNH2x2L0ExZGXlnrYjiuB5N8tjmiaIC9D6kbHVSnYRWCURSbnF4Wm4BqjUwamh8vVXBuA/z/yvJq/nA6kk1MAXOXizD9aNZ2IkA2Ca6gHDCG9C8zrU2zqCNeKRB+PhpZ7l16qQpBXpCd8Jlrup5HPb6EOMuAQ9yaLTGohGminjsPmNENYvX0lZbMR2piAt+c6H54IuqyWE1tVyBje55oLAcQksKysdWlthuVm4QMOEy6EOHKKmjBlaLQzNapeaF8HzljOUT5SYRebbwo8E0V8XCtxpFlLsd7rrVjvruEQwPKoA0XuEccX0WdynoLHyhCpBdWY5shVGavsNEEFBWHcukFUtiHIDO9iUtd1n2JqD7j7YLnRLtUY/SAvJSC/o9Uum9bDpdhfeDdtisZuolk+1tQ9yEx7s/aIApwhyD8FdHAm7aoi2457Ozxy3XatJv6ZjIGlOqo91sg62Kya5FH/AF6xL0cw6t/XyPkN8+UP/fSFHXt0z9iI6wol75q2l/DOMAy08+OkMLi6jrF6OIsHAhU2OZ8soXXEcef9R1rvC6mMv7tMYFytpksknmI0UV0F1nvbQdA3A6ptcyL2gH1GC2OkqTe+rkIKWPhMmlG4mGUelgK84/hvJI31ET330MtdGnbwrkiB1xssuqS6CO3YFM7oxSqeUzy71fu+7rarMiEV+2G7lrYTGFvWS3zlvyOy5Kb+v/UI/GrW8+utQowZDQjxwUVkgI0YK5YtGrzx40BNlodGdsDbdLQyh1+3KKKZg9lsAyA9mTvR9cccV+kCODA7a9uDtrvnixJbxBtZuoD+VPPiSlM/ZPtXIX/HETqp/SG+1qOWfcSceoVWeUg+qz58uDh6cpjsDgggzjz6go/iIiksZN3fbR4bacZVUQEf1i/U6HZD346BBN01RtxA6QYFEVPGAStxnEfqbn3Zo7s7usyYUSKhiaHe92lsN6G2YoMF0ov+QDCNih0C7XchwF5SKtYU6ySNbE5KMriiAoBIEBia6fPeX1AjgwO2vKVjFdTbYlNGPyS1aYVGlqHnxTdpQqJ6OUYwkYoeKHD6cmdNpxrwfQ1C1A1SrlQ/1zJrVdelsyNMzDGw/3vna132nqdzHpxPCNqKr5VPOft3DlmGhQxWz4PPGJkO9pZlaDtOwCtbs9EiWAAAyWePGB215SsaAfrfdfesqJ/Tdd8n6iPiTFiRNfEWt3Di/oB2ktZqUBWMhwHAsfyeaHnGOYf1uveepYdr58/gu7ucuaQhcRRuqJ39DOsXPuiwjZsbzMFWcjAl/qBHBgdteTx7wIK/6FYg9jQllwRuVjse72fMMCOpBex720JZcEblY1mI9nzDAjuVjsfVzkYEv9QI4MDtrwMrIyZKb2LY8/zW67/IXZzMix1/ooE+jRpUqdWrWrV7FmzZs2bNmzZs2bNmzZs2bNmzZsyHlKxoCvQI4MDtrAcxG9r9OA4518/Dt+lnfOzBjmpxyMKYHtjQp7jfQHBbNmzZs2bNmzZs2bNmzZs2bNmzZs2bNmzZs2bNmSmJxyhv4Q9/CTEh4GMjnxJ1C4Prc+FfjlWHg8vujtY6SInGr2LMiTow/A6ObZpPCJAIYgniAK+1AHNZhhV/htQKxB5/+fRDfNvjhfVGhEeXBygjaQdMCUWA7HvbQllwRuVjse9tCWXBG5WOx720JZcEblY7HvbQlvNuNNgIuJUvRcdiq73C8TYDkqVI7Z7ssJ8aJuTDkEFwXICU+dPWUKMSgazxIdamX11L8gAB0y/DAGu6ZvZXZUtpSbtaLZ8hkwwcCbekcXE2P0ZHdATMBhIv8SOwCdlszUncTVCh/v7oowIlf4W2fhyUWsh/BhQRUM29JLqwsIVDNvSS6sLCFQzb0kuq1Fa41RFCkDeejhG1jAf7cgXY9gcZO8d+RVxA2eF/yKdbg0C01pdKVnmbzJjpujHcVTqyO4n8nfI6+tF6NX9/jHitdEXUtqqPeJEHYbhAJ7wWY2BwPY/4qKI3w8lWws6nvaIFtGRZbHzTpz5NoFmpRlZFyQkksoWyE0qVOrVrVq9izZs2bNmzZs2bNmzZs2bNmzZs2bMiTfRZVcyjVn6kY5skIr6a7yXVgAwc0wl+tpAhE5V8ZzGBX/tEq4+PCLbsE6YoCt/l0CMZMAxruqCp5XAXxEjQNsvktQ9WWnOfgKpDk4zxhPSKkrr4TGFtGYytHYVtITlb62zI/73ShZN7J3jszZKme8CWrJ45v07V9QI4MDtrylY0BXoEcGB215Sn5L1re7Kzgl1/ovz7jutHBPXkkXDXSAUxqGHaMzOLbYFdwA8lQNsMQOGdUYffe/EyIYM+2aCsTbxN+2Om8+KUbPgAkmNeAbSnlr3i9uqNULXS8e+bCsvR8u4kFYSDX4Yff68iAbyt1mE+lxtSr+Mp5ODmjdvZjf/yYAUNKcAAglokgnRCIQW0GAzUBoHZllyo0Dsyy5UaB2ZZcqNA7MsuPejCXCoDkN3omX7quSv5Dd3akqhfKpLtDUcBoZBVbkBzJ7yk3LwNj027PFEPdDKW6gMNRv8go59kZlCE/MhScjM7btluNz5TFUpROn4aMVAuZooYJQJccAQAXAYR/dqd4drfdXnISVxe/+rgLWtbb6Pen8i3MW/cnZseJCQnsWbNmzZs2bNmzZs2bNmzZs2bNmzZs2bNmzZsyJHVcd7HTMrKqakcHiTRaB4C84l4YASYM0QqLfBzy7iQrh23CuywauLtievrC4gHeldbAE9FtYSXijlNcEgYgP6TlIBAH7EcpWeVOFsZdl20FCxAlywutXCex9fQokduasgpNJVH0EeMRIx2lpqc8s24DE+6Bj/fDP0tRcFuxxynRW3N79Qr2o5Torbm9+oVW2/tpj2vO5/TyN+N/MSeUwTfjJm1soP++kyAu9GkT6EyXr9y1K4UbR81+qYbVM6rRAUKcF5KkcW+IYMSYxRO/Cud/5/0i1GM0JNZEniCs1+mrmPt+YP7hxxcEnAkDtrylY0BXoEcGB215SsaAr0CODBuKa8pWr4D25K5nQ81vNRdtWnfsI4UxxjhLuppNEnlgfXLq6PDpDHvyshM5D+BFSFQs8dk5Yv1wprbhgS/1AjgwO2vKVjQFegRwYHbXlKxoEcn0qNSiVQaNKlQLs0AtRXCzqsFgX8BXQm8+X85LV61B+OM+ca0SwKdAMD9Vm5PIgLUNDfX+oEcGB215SsaAr0CODA7a8pWT4cSJCBi1emrVrVq9izU7rqIaqrJCo1iVlqoqmERJmYA843AUieDCfKspn7BgZS+mkbhjM42VMNG9GcaxoCvQI4MDtrylY0BXoEcGB215SsaAr0CODA7a8FoFIS1otk00ZMCzrUPrxXr2XxkKSJt5xi+Mj6SyCBaFfVrsEDxAkeZ+2mT0BTqz3LXjXDPBNXkNXekz6Et6Ap1Z7lrg7a8pWNAV6BHBgSawv4z6WhW8pDp95IaYt7FwFOrPcteNcM8E1eQ1d6TPoS3oCnVnuWvGuGJwAP6bI+8pn6tTvVygvxTk3aBTWy8/ipZVZssLnqTIpVZjaGjnIodj/Rg/Gr6aPyO34lFsbXS/aKA0iUTA4kkr8ZVHKTPFX2xZK8sAB3Ww4HOicxfFeD39i7Jn01EgcKBzhELEdEPUAYud7jAjTXkie6Qs94GtICnmaO9AkQ//vgNzNIAAAAAAAAAAAAAAAACdp6hzI9whvRq1ICYn+/wqoiwHT2YhZIX9riD1cNseZCYYwXtm6qBImXVJZBdZKrODPqM3NeZqEyBkr9Sexq8chtfm7k/X1sWGfuLY4kTLQyi2njPs0ghsDf2rxuUd2aEdPgMdBnFtzJYoxPVTX2PwwK7jdOIgFDMDHgZbOgfgC6hAh1PWS9Oj8cpYhfX2scREqz37kztxmQn5EbpHSVtXkeLYQU6PTHpuzom8n88sQPXJwyhtwbMP6sYJuC2URRZaF0Nm/GAIt5c04ShIkPSFGJQ+2ZHsbuJncOqcb5URuRcc/7qLddKiUxxhYC5SpZzsKpHZh0uJ4wax3ypp3CrNWLB+Y4Bj3KEjvFztF6f31AysFv4OpCS8l1boBRbeSSqxTFvgUMk1siDxQtNQxIoUZ001uqAy2RKVOomBcdb1l8987F91LNBsEkhwUO8k6WJ3Yem/E/tcortHbziNjnCBbrOR7B1aLJHp1rPEMYgK8z5WaNZRp8AgcBOlLyixjAmWTBIaMaGFgbOhcECb8k41NpYhIdmTdMZjEdouvEjuOvThatYtYUth74xTKJS07AOEwgrmwUnqjS8GlV9RY9BIngPR7+jibr2qgdlc+aqlDiUXxe82jyxHDTM3+CyyCJUfBd9vF372w+7QVM1lPLUb8rERo3eFduY2gqZrKeWo35WIjRu8K7cxtBUzWU8tRvysRGjd4V25jOAU5e8xuqbiud4eH/s8S+9zwx50oDvEFTcby2Ys5Ke4wB6rzKyQM7SXS4DpNuA+eDiEN8PTUEXZpz0H2RZnarUaoJGs+zLu9zRucETSYdp2+7J554Pgf2stijuQ4KNWSB5UuLswVNq0bKUrB3rl/LDvpY99XA8IF6CgoT0s//4bgvCcH9TCIckozZuyXd13t539GmNwDRhgD590YigFhXGuS48PBUTdEb5YkCP9mYCpG1V73T3cpJ6qnGxV/3DU1nBlmPkxHkHT0pud/ay+NjMl6diotb0I2I4AkHFuVew9jt8GsEsq2Q7RiQTTfE8vT3wCdPy+otBDdMxvtX1qN8VE+G3f3YKRhzgTatqg7dVrCEMHBeMieVAQU2BOzMp3VvA0mzi0hE9r52PrFjGZiiAYTS+SoO7A09sIr+bH+lzz24dhAD5J/nwaz4fB8/wPB1tpbnBM3zM29vdrGhUWED3PLUh1w+f6OdAtGgGO5A9RXrEC37JdPCjykQ/SthlEWFxN37Thqm0UjYvPwAR8gCW8o2bFdciY/v+GmSA01YnRAWir7N1dlF1bIx6Lfybyc6pAe2XIvorI5hJNWKAa81SJhmNPlRBX8883dOhrvFX6WHeuokZKzQsZPZLsmcfn8obmKjvbze7ibCJf1dRH33NdSlV7W0RSFYuucBZ6rJR3AKkxA0EqQY2xi5iL154aR9rKr3ionszAo72pibBseTjHa8VaJ5gz3abEtirI9plECJYishGsf67yg+Ip22Mual3dMHAOh8xQk+TKTQc6HGmiJA2WuepD6IoJxpaIXFtBaqOaCicG4Spik07VM0GtHpiRYWKqMrz6aLO6nigVd4fR+pLEtK1KJaeiLH2SoEu4vIfvclEy4Q+KcTRyc1x+fG4kKHgCo60iRQXYmH61W7iVQxX6g6E03H0x/zlWU5TeLMuDQE729rF8Phl/RGVtmwEZLJBkQ8xd2IXf9++YbznCCtBWYgwTyorW2g1+NzJN/a5e+W0DWHZZWeVhyTrMxbzK4KBdT8bBKkrxwbeCYmfEgp+1yLNQx+zJ5iB/APgCejEWOCSSOmivBw+FZT5aPU423/JrVbr6oGn4NQIuvD/yPLuMWFuJ/8dlT2du1XQxM7EL4L+wDMYsUVdrw4ZOnmKPIA0PnVeIyT5g4aD5oHrv9Jiu3z4ghiUpiLAY0s6AAAAAAAAAAABJWV+oqT2/mamKLP7ObHggOht+TEDcdKpQXqk5Nr0fvnFh0IB2pI16dc+yCWRZe/eQbLoP+ou8+7vBAPhMjK9zEbBluYGPKXupc+yH+B6lt2hiNroeHGC12dbGglUND5E+LS6Pyh5PjoSSI/sUST8s/nQ2UbDUe50m3WXZYcYgTb3LJCzwg6u64JUUcn114FNibrlPgDpv9P+mAodH0q6vZh740lf0+iZg+RKog6FkjdKY1MzBqaMQgvWyFWUeChksFqxkGkH1cfNBHN+SjoZsEoeNzv/QeoKXMBhgLk1CTe/KWCELLR3GDAae5MX5YIax412hOAnmskAR31cCMWl+f+D2Jgvad0mv3WI/mlAm5A3VWD6Rneqx5znNzOmSYbEeGdTvDhw58dppuFFO2DWHjlLQ0S/pMudgsUbVMKWlZkOaZa6CuETEhyauUVPYNhOOKEXYpvYujcscQ3HDpyoqoRmyuxG1j5fvP1s1XQKxX7iddxwfOw7qkAseGi6W+HEoHGh6GOGuElEFHc5RzHI6MyZST+qa4S63MUWc21UaMaxwKGTddRzlGgmkrZuwak1r9CGiXDBC61ADRCUWdhnOOKF4YbnTmgi4ceZVP6fddzOm8bGKhiEnnSOHdq743SwxjxLH23PySlJrOaoCph+efcKVnj+gMHNg26nzgi1lk+Hn/d7mjZGMgS1lUfbcwPGsH3gJEDq26qvDhZ1p46Pb67oR5YAyhislC8yATB4dcYHd8adVM4Ip1mbo2pToN9CUAzj/Jdwa0GMPsJucVjEbKekubtbdRMu5WHBRoiOeiiQCIf8s0CsANxNUUT0CDSg6VyjlvFN+cv0KAoRpRUJSvIihvop19LP1aJrSuTSYv2Dm3IEv+WyH41rKdn9jDgefdmbDJ768lD+YjQ3UNIlwaJMAmBplfzbdN5ShodEjy2iBZLlioVmF+3uf3X7QxMtUf13Pt8ixDvRDXPknByQesdXx05TGLXdY0edB9GiHsrNyoWTgbaP6o/tP/E6Vd2eLaiFQoS19c5WHaIKgAV/3TTLDKuQj6VvIje9q/8AyaZnlOC5QYs38qCfF8ufUV0ngKG6Jj/gr4Mc6YGSw3JywGbPwdc3A93sJB8eSDfmuukNV3DiM1uXK6evCbITT5Y0nq4Vf1lPmm1XAA1iD6iBTk9XDrJQAdF7k3arTFNkVI+ONdXIms8LZr7LxODtRV87ihQZZfZx7baK+tSzG3lYakOe2oGLmoDywVDAvXzts9U6F0CkkAQWll4kWWa4jIdrdtqisgjB9vj3moW8LMKsZF9io2jVPRuXwjmn2Z/tuATM4lSH1W5mxIUhrsKAHhtAw/o58KEEZq44OdaTGI3OulG1nIuKcAhTYuqK1gb/KeZDpXaalqzTHcxY/lT3ielCrU350PF3PxpPOMBaXSijMCMlIo3aqHoik8UTMCadWeceaTykk+BI2L/Suy2ukChZrDjWp1fUgjZSTFagepLVzZonO35sQlUtDpoB5nyj28m4KkmYDcJ8BT8gK9Sy3Ev+knssRm4nY6Pr6cHjmSRTyI7wEjibL5EzQuS5xaSKdRAzE++XIayiQogqZ6mMsGWAc+dhucZfCyIkMfBgQkhty/vNOeryfBh3PU+MHGLr3GlfmGhqeJWpUWDysqecmnqTzEPu0cmwGbsAuXDfmnoIP7msioxqAoEvzj72jmzmJoC95yjCoAQBE3SxXFmzhFEK5frjbrp2/1i6ebDL8pKAdcO1HhhBFnNWee4bfDVAlXZohmPmaU5JcRIoZFY5EVpWRJTcvtvFfzcfe3LB2ej2GvCv6rzv68w8yO37d9baoctKCCFjkSVjUNFL8UMki3jlMbM27TSadF504OTkMUm6TXFirhT7DTwER9WdZ1ZwPBa6dhkuCoy7JaPQFB09hCnhu+nHrTwjVyQS6aRpYDOI1hUQqX3JwEM9gme9mCvv8bH7gPoS9mDhKgmAVOuhZs9geFNHADDBX6wpnNzThjy3eXMahS2ASej7w2EDl3zByqnvHfL92uoT/5JHaX2lAHBKv+XAt6lYDkTweOEx7Q8FYBVUhuOElMaq+BuQypzkIvevwYd/2U379f9kcZfxbK5muhHCn/1E5yxLVxhyIOba3nbWZL/bU8fHJExmNQ7eE6Ic/mNQspENmePgQLZKz4jrSyAKUwNoflAgpAFPUSKbaSI/pfNK//VBMAjoOzs0498t/DwuJT7QGcXxZWEEcSd1cXj3vwAYObNH4NR/kuJ8/99hiRcIfr6Bxf3FiQNE+GbKo4o83aCpTSS51YneJTN3SFdmCHs4WjvruztKuy1SgW6Yv5t/c78F7LwRA76H1br9sdrPFjCT5MiFGQvxe3nIztgxz7wWCVAKTc8F1vL1FsbqJHOzptjnDCYyglyK/gH4VonruK/Ze7Xa6an4m6FjbS5uajW1yI4+UiZuVpMWx1rDpRdo8rmDjunbVusMrpS2UX6P/dGSgzVXDJcMBw92A95ot0ZuwlE99+Y3HW8KfHFkUcEEwqywppOXr/jACceo0pCJ6e411LsV4jY9GhjAtG+hjRcqL7nYeQ1MYVRJXAyb4HYmId2rTFEizQOVtM5yn7EU2O8L6C/yrIGst9OR7YkiCOGvrt3ACtpzgooIzwXV9YOXaZpmyo1mk04bjJIZhT+IAi/Hu2KHoODJoxBYMIUVU/uAVH8IlItC+epVeIBvs0unIB6NHJ28xZ64WU3N8jTBeziBVpqfrSOKIaaood+yW1I8GH5YkRsszHaf/DpyUH9tl7q3L7+z5AVkXZicY4b2ZczNK3b4V//G53ixGNNx7aG5YNVCRUW5j8NYYXqmkOMfRGNiuu0M1/7u2qLXS3BuWggHBAQqj9hjjxToSaXnO6Q2kob/LQBAjjE7bXdmZtD+bSIQ5jELs7jJh5IhLbiP8hmdm8l16kiRYDD1i6QoluQ9fCHVeYdgLubjtnyhk2AeTvuFVSQ7ETazx3AEDY6QzcB6c5XIRJGhOI5EHWPu1mw2CmPAN86VoGjiMNfNI6xiIglp8ErfziLlRL3D+j7RAWcBNv9xomjsU2tLt+LzV6rZwe9/5XqiwaOODT47hFWDQVhNrZiYdM/u2XESX8BIKvDpt+FiokK8ejZZlUotAlyFU/k6Rl9d1UdX/X+roIQThCU6CURBVrWTQOl5ZoJWBTTcHRsnPETK4tcdzJD6xSAuQAvKEKvvCWHJ+q2NISheq4lTVXUuvb9LbwyvAEj4hz5qHkjnC5g/0qjpm3r0WYt3g0LtFzh6V4OipupBoKxvIKE9CMLRoAzDwuyTy4ro8fwwrSl3Ft9yJLhUAPbj+4DFvU2uvR2zhHmj5lmOWH6r/PvxF0efEAMoopXH8/ZsyTLJ0TtO8tZXBoDhOYtZKHUjOJ1NEowoc/8VYmcR81P/MgzJPJBHeDM9j/PtnRcXUeU1sNny3dWC7VyZrGRChOTb7RgXjJZvhwd6o+L3EV/KsWTgjMW2biaiajxjbKx/yJgNrgVVauRtaXOACfeus9v81nJqlrKHdePknBEmjiHvjYszQiF9cwrT76mYu0Sd4lEXSKPL6IwV/WBrhh+q9okNtu3N8IZv/JzLiPtcH4xIHW0e9m9nQ2GJ3/DIlW4+/gUziSjxfENU1CAV2MCxMb1lcgmL2o/xD3Q4UWX8sn41sRKiqesVu/FaXHKmW0Ddzr7YQiuFJRWEFRROqEQoPXZhVrW6xL58fAmT5e2YqU1f7ooAONn7HfE5RD8+uUXhsHlrUJTlY/a5FYukm4wqbeEM6n3g4fV4pfLEMR4F40smDF1nFKQpixohlf64TcXmYNTRiHey6RNBqhiJUhFnkVZqfQxEYwlsJuq4oRhvprX89GF8ycfl8Zg36bqO1uyrdZX0VPhaBupNmawUjfrsx+L5b8D7ocboYCdABNNKBf3koOFTy2NJnXwgwK7wqdqIIIg6BLc/HQVxHHmX0MXCwE0YS6GqlL6RUtscrzabRdXTqLRhmudep2DUHUY4xSWzQOLsbbN9AveA2lCpyAviEQSBzgixnsbv837rtwMMbWfe1CpwWZe+lpwl3TDCbQ/yaqKCEHNoZv9SDw/QJnGu1gZuNx+f2szn/cYar3QboHFFkLu3AJyXw3fiZR0F4ERdjGlUQepRxND6wHfKlJYf8/F/FiKckdHJY0SXwE8bWkSLqdaMxS6iZr3bKZk2s51FcCrSbnsY3wkFBG1XMuurZvj5LwuYH3bGU75iVV78nGuqOaps9O+mr9J4KK8OxC6KB2arL0A+y6gVlTpTtBVBgBd1HkJMNQr0Dm1n2BAde+2CCf8kGc/vuAqQ+dpAHIfSehNYIALAaZxcBezlsrmejHwGQVbpLwCCWlZwU7ZTlSqDBjDzq13MR6zCCvtkqCJcuFWgMpaaCYnhVYICnCeAt6U7PscN+8xmjvnnSS8agY1gTaf/yz5/hKiv94hK/5xccUnKaooV4gdtXDKxuOcNk6/1XQ2QYpbQ3tC62lCNZ/G+UjIulSrwz9/KrrfduC46Q6sHWLU1Mb8wJl68hQU63I/uB1PelQKHb25rZoAgcQ1N7Sxra9mvVYMFyB/MzHBA5Hj8SxhoXjcXUJhM1wzM+IgXP18IEVXhGFmQD6YP2Sa8o8s9ffhX/fuIw8TRxaDetBYVuZXABhYCEgGR+us9ggHcaVckuDEsLtCKghH0wDO2qstmBQPFoNJH7wumfBOb2Avji+xqAz7fMou+Z3X0NUAuj0Nl31y3rJO/E6OUzfAfwHvwJzu9T2vjS6jw/CApKXB4WQOFBP/XIShAJlBqDXTctQMLLb6Lf78IHoLGw+VSZ3WtXMS/7CarKIhWRD1T5DwPAkx4QPvUQTGP4bdm5egcJObK6YaRzh35SP2vtqDXqpHhGT7w0AGSxUxYkQCI16T4/InyKoaFJFkr846wOqCVjipsfySrvfRkvJYIKN3oFJ/Wwe7tIX5vezjOCRv6zXhupWHRuLkUkJ9facVS5Qz3zKL3pQRgXzktmqaLySSyws3junDm74ICHPYjO0kNmpEWpbE6fuwZ67VF833lqQGP07wZUBLOnVJ3ZhL4H4f/kJ/QdnxyO/0/kXw3jVLotBLL0hpqmrCWMKlolpoUaaciHoDvw0njR3P2u7TWw/+hWGrSFvGaNR4onHYS1Mk4DfT/p7VxpAIMd5l2nxHGmgKMDg7bydgJzJqMxK5tXjS3+7RlJiHE5BCenjP/Im2utCttMZDucGpoN9eTHfFV2lPT5XfkO1P1ahlk9PgDHtLx952fNLrxjHMTc4o2fmw+jkjDZyk+MWpPIx91Z1UvgILeh8N+IvyDWC7lSk3C5zJIwVsMCvKNXKsovvURbmPtqqnLFGQbOp+UBV9PeVdedLeXuq62RQVWqa6UYeUQZLgn+5ecHcET+dSiY88Xcsq/0+llvE87DCj+r8g5XMqj75pq0EfDYUzkyedYgHtBOcRU/261DkgtFnG8FHTVE9lkks+x78ej9QaWWpe/14PSpAEg2C7B/WSdrEej6g7HDUi59qH0TLpL19Ns6sG86iBeZVb6m7A2Wrn+UYcq0e9dGqHZaAo0ttEA3YRWOgVR+i+xmC394xSUpUolubT+zU1uqsDKMPurs5LzjE7tu7wUNd+1Z/1N6qrCi88SyA22j61VO3KtaPy1q2Qv+V7gxUqPSQvRes8sISaLR+8i2rBJmuAE+WdbpY378azyLVTEYXiwnVh8TNZF5V3ITmzKB5VlNXhB6UC+bnZgNoyzGdYkBD3LWwBheIbow6v6GzGglB3JOdsXDpM7q9peI4j0KVLmit2zP6OysK/h/6pZu5pfIWvdhxEMmVH5VoqCtYpAdfU6iALjG+MuGQgJFY1RsNVZ3JPaMEdH9wTtUb8Od6fu3ZV7NyBU3ZxnSE+aQV60VgLc2I/UERAhZZXH39rzkuag2KHEzQgizua14NnMh2gjVQdYzpOC+lG0Z1QdXZmxtoaRDzR/E/Ac6xlhma7snOlyGIaksN1+VlEcQzZo7mRjjvvWbaIBKBvDpGjdVa/7l7tc3sPKGbaMlPn18jJ1TQNXV1Raw4/ytuJwc2QVuFEVnOnISNiTdSMtA2GAMe0Dze5X9wbhBrJKL390Ozx/SSICTt4cvoTcrTCf4HXfZiNEPtbxM9255Dr2+5Ns7bELEcNIpPh8PvzrfUV9FpeWoKqb1cEEFcUXd5og8vptX4Ya18ABwCTPa0sCoyTuzfvRRRMa3BmrVTSKyr6HmUVgqfCiZAoqnFsXR2/6PTi8CLh4g0a1HqBAi7qkBidHId8cib3q6pn2PQ1GH8J2KObfcEZ+IWPAHkfbPeM2ig/JHUyrTWx1ohd7gZ2PJzaHJacpCro0MVtUK4+UtGOrDlAEKKnOdHiqbR+3nIUi4J/GAMOA+N/0bL/lJFY8BcF60Mykb+Gt2AaSu437fiPWKM+MirllT0hO3FuHtji6zCc/i7CZ6qAC6JkY/eyxvs8q6wVM6aPeSYsoTCNvUKFX/l1N/OV7LGrTlubayarxl57Md1FwDxs26Sld3Telzx4j2yNjDkjm6RBpEYhHtPuEp/HWB7cCRT0CJRoUEOtLg80U6goYCKwGdI+bnW92w+gVlIMIUrklYkzlhl39lKtYp82Fot2OiqPVXafqFRnxKJ8YW4df0hG0CNgJu4YJoabTIDQL/t5+UTAn2XOyRGwqZFea5mYyOPDClhOCZzFzPwQuS0ihlt5xB/ZcdfTwf9Y4xrdTuTz3Jw589oPCNPLUMlXuXRYWM9nEV3Oj5w85tZ0fLy7b8xOUSuK87/B4bSKTKYB8wzPnWeaLo+EG3CULSpuwO8ZahQ0P4AZfN68eBjZjmsk2KJJ1EsexgG1uJZc/cKb3Q8kpVZU9s5Dmplt8brcJZK5hEAxEFzTvdcTrhS9JJWOnL89YugAg8mI1yFqDJmLpGTn40wQGCQzBC7NBkEaC82YWNEipOIXUqOVHQT5w0ASO7nqDOsSd6TkCTTTXKWkRcElnqvtuTw9euy4Wr61zlAkM9G00ZzHdWbbCXxhy7+4IQeLKmHidi2R3rbz5deDJy/a4YAauni2x8j8CpU4/TjZ8eoFVtAN8p3twHGlMBxyk/cL9R9MWyGVQrUiIhveZyom+W/l/KUFmirE8x31FTcnCYte76ssCkQHnrYLQxC9G9X4fRBzfS35BOLnTI6fz9a/MSyyb31p2cMokFuogcZ5Kr82vVUvj/NMnkQS36cmXjfdbtyUCAZtQ1YXnZaNWD1k487oppM5VQuKKUfFQMqdYItJ+0vtu6Ykx/vFdveXVP11PCQH26yCyHTfRW1chnyjE0xjgas6JlzjnacvLEDTo68ldahwUlIWs355pVrhB/NBCn1ORkv/u6B97tKMFXNlToaaWRrYtvK+ZkBt+dWNocUw7PLl11wRIkrS/lWXF3alVpSEh9C5FUnDfYw69pz3rXxOE7joqFgEHD3GgtAvibqAnKTxh4a37I8rqt4x4KP+305uQPcbe7YPjg6A/Os/nuWDlLSSOOM8ac8eU274/e8vJ4UeY4g2zJw5W6aGMgXMQlrfGzMjKmvb77N+tcrlDAL0XybIURo0Y2OA9DBRAREoNP0F71Ai6LGeKmR2GP60arsLqqxyBt+tQX41OBeY/8IdvRn6tY1iLKiCTuwQl+xDvBGmeTKihprbiyHqscRTu68bXhdZTeRkSXaAfO6zbZRjl/5u0aFMSQlDSeltIPeAuuOu/iuIw6yJOB1oGpboUzogSKRgZ4a5O31PkyW3FuJ8XTafmZJ9RvqSh5FfK0730qdzgAmeEpNZmu9X1pne20CGFD6OsF/89eLPPzuaaa4V36ZnB6BXF9bzZ9Rxymd3LTE27LcFNwL0F3yXFFImT+zTBcUevMgTdz8xAIhBgpFiIRbFaHbWbk9ac7DgQ7jB4clD/j8fVCx0EXABBecaz8HpcYYAX7Zb6smfKII+5bfZIXbv6hTsOcxTXaBtl7X/wx8M8mkLtPjcqJlSQ7tJ2DA4kn8g85PzFPwZKgUFYT2z2OhAbxiRoBMILt7vCgWdyscDdgJ4FOm1Grck0m/9eds7nSR+Z0VO/JD00A6LqEqrrVJF0yYP2PTqJzV3QtuDan4tF/lajMl0o40kdxS91VXjhNVXCUMPtueoWN8IhK2SrcBiM/I17X/21HPRXa3fmCtd9hvwt7+FGle/ftXAu2KblQFm4jGYXmJZKaGtb/npY/QGomvjIijCHDUapk8nfmWmPPzZ2fPAjEN9/KN8vEI2bMHFYEDnPOpD2aa2V1joWkh7KntmxhDqMu5DfrZONg0jG+ekP+wfj4b6SginHyNeIhXDmSixSZAODBN6rBZ1lZj6V8E/zYfWktmFTDK/y+Kv9/qvY4V7oZaEnOfqSnKP+yidUXgXlh2P4mHDDs2dVOTvmeC+J40RiuH4+MybSRbxjuwHsjhmsEl7zu/nSpDW8n9GkMWh79pvuVlZDDfUfyGFxwO5dyoAnEK0aGk2G8RUNpq0PDT2XXUXWG8iRfVqcLOnxaMbykYWcEHczenUJsEuTEryPl4xo340mFS3qt18ruBT97LgkHsSq65naoBjSCsOJ/2d6NKAUKiCFBS5Pv4tPM5fU7sJ7MxZ9q/3PFTHSKK+SEni2r8AnGPx8hWCb7gmJxMXLQqbPGZ0gjGmPxpGlMOA407hEMjs1k+0UkJ5VmHCX/JHkfs53cAjOH0gDot2UJDFjB4ZDjqhLOmwHNIEVx9dpWdF0fsdZaAE9DWw/wCFL2wkdFR/NXdpAgBqDpqeMagyO4kNLGCg7P7/pcZLduyZlMArLYSixciUxTyXU0csUtWCTu/GWN2vKbbHYM7K8L3rNNqf/NbJ0goDfon161OteAG5FVodpN+SZ+wF5g+0qpXYnykzP3R0m1fx9kVOoKY3LhfK7aod1C8X6tmlVLNuOSP01iuYQXAIQDnyalFA3+9nOfPRWGcIYwXYGG97OsFPC7YDW7jPGgZ4tnLzvCfz2CH8SD8Upmpwdrb+TL/5RxfzNGMlLJjk3VI94U2pg1YH6/67byGoMW9TOfJFnwwzmOjwFf5pcW+f8VhIL9T0a4+GCW0VNuMIcOyyJaenm0J2F66bH5otcWkEfnbop+9070ZT01t5uLkzA1AVMCuTKS7NRvAhLZwDDxUoX8D2dddlBJeu63OiNuK7nB8nbypynC+p05lk3U9c/Ho2fRK8PD914hzRar1S3ZywBwp9aaZKKoWx+B3LbBviPpaCpCxgFPrL/t15kLcR8L3Ievs2UyAHxSfQoZdDOU7HtfgDBNsjX8XKfWRT5j6t/eHQWWZ8aJYi6OvhU5KbtzJYY7YtLkM6QAyQmWO9av4xwSnlnmcBJyXJbKNPNNYv4pz7OrXZrYNjYAkvYuxvaIM8fPRO/oclb7c6A2zadk3ZSurKLUhkGMxu+aV7YhbcF3QFQBhrrdVxTQxrcZrKFVquoPkeM9SnGIk/iZs0E2+lwFNX+A/RdFROlilZku4UuofxA4lbNeThxB+Lox9bD9cQZ1IF5Jfel1yz5FUg0fqE/XenkYPWQyeCrF5D68B+LcAuMMvVNHQuXkWbVTtEUxhfy3YUh+PGKCEj7kg9/QSmUyqxaM13Rl9J+hCb06CQk7vFFhz7MmLNEgIPbPRva4wdIrtNLy41Di1NW12/ekUaeQjyWVoTuJuBhtVzy7h7zUvsMx4M1gW04ON/X9uJDQ7wLvqJuTH/7wpElXIOdxNIUS0ty3nuvZCZ9PUlPYEIx8sa+rXlf8wDu7s2mlTZsHNqXL9FyBfk3UN100uqyPZroXqTThw9GVIcWA8GiP5Q+HILBCRCgqWeaEsu28nJodrss0pUZT10mwzmv232ggl5kZhZG6B9kes3BJaUa+9v/7VcQlxcpW385WdCfofB1hi2EAslvmrPXaO415v9Atu6l7uraleOkmwGLBscRgZYMRIemPZ/1mI5FajYcaQjh0+6CMJqwlaKyKZwDWaV5824WRmVOKsDtDwEtDTVGQL6QAUxO+EjNZT/lYCBIu28I1yHfDGt4DkCEwF45wivlzzVUaAwgoFBXTYs+WyeiCg+FT+Nhe3q7DHvq4hFlWT04S7QbmuAN3WeK8/A1Ptc3e8HoeKkMz9L/wgOFa+2gFQgf6Abqur/vhfPTAheaHTA8GfNJ7MY8PBlLJEEtrUoGxzap+gz5xNtRZ16GYNAWCq4SRjs30X50eEl466Uqf3b6n9NGvTaoSxvlCR/79cc/BwKxUlDPj+e/jtHD0VgavJYJ64D2ZCZCInI0SxiZqdCmZ1dMmmF76uZYhk2q5rYjTVoybdYAl1FslNZrUZ3V1hVjrK4D1LaiL7gYQ4NLmdA27Qfco/+L+tSLZHocThdKhKosZKegu+uzsOLkYFuFE4Kos+wyDtpkE0oHfMsauf/vr5fkDRh0RAZsvlM70bbu0pANN+4NpXkZKVvPOIY5F4/Xj8VTL1sTu6CMvkvhxoRClrYNLW6j6kc0js+7FrsnFgIKdOI68JT+DuOdVR9qsDLnQBn3Xsy6beLXwCTCeLffk+Wktf/FGXchzI6R1lHesOX8qWjRxe7G7d4twlJWQ/M5q/6lXYcZNAOY0cUiZCNlYD6NuI5oibNG3wLuyIjObuP0wpOdtl22cla7JGo2YnFTICRA2xQFMsfg/UaiD+/KcbH0eZJb/Hr2pVbcdjbIDU/dsW2hedleUZCofotWlUn8iS7j80idUjWs7BjM7Luy22TWBDL3yDVJgjXeOcYR5cu73yl8A5gDn6Cxa9D2rLN+KTi7YpgD1lrUBVmoa7r0gtgqM5NOSg/uEBg1elKSllaM9732q+1BsXwgvXYSCwa93htNKY8qMh4CGVBMkElKSX9OSDgpQ+HvpVwOBXCjIPafw3bR2DiAc8vcLfPYiL8xJouc6bu6XcbC4EyjW5zIGT2oqPyZx5KdxFivwk/6pZtfb4XtOHbVwJlDCLMYJUcuV+vUgjwn76eDu8eghrRabA623WHrflDMdiFoHTjJwbJgMIXrxrstFf7bXQSkYr7KaxHVCQc9LIvDFKprYSf9IgBKmgFl5GnssItyTPpT6SYwlOwS9IKm+yOQUCFeIh3goYq5/mZokLyfRcnYKb2vnh8D/vWAYDWSZ6T285pc9feIwJQdNXDeabpXSQOvjXclIi7adxyJsrJdncJKCMk+awxHRYRiYvmgVUDfPoYAd36p/g0DgiBJmXUz3nTC4jYvKkFveNWZB+4BLB1SjpjsNujptA/qfj2MrAdQimp3XdDHs5s3Nl4Smi62Nf42+7/KLq4KW3YBse5y3WPaH2Nt3SLVRwYsqRyDErtNUsvTKndrXmxuR7GLzTjMPTjvctLAxFzKalD1netMOVMz+29wLkAR9O2LNYBC9Fqe7otkG02oxQMl1CVVtqPHoAzLeOW8zhawNYk6H1boOi6xHmocQNvf+ge079nmv+RiGXVm7qzKjmNS1DPqYcwvuHipadrbljgLCufGsbULbSfad6oBRV2Z233wmdJT6gbmWOWz7e9rd/FKr8pV2494ww9OJZm0U0v6fGKgb9Zva/7CBFSCK3b0JHSDQWsOpZ4y4SXttlFs6C2dC3ZMeEn4jFdVvJ5IOjIVyN2U8ZhZnHqxdtKyniqKrXBld9Scwp5SybWNPXjo9iSp/uNtck6qRPD9Zq9EMxgpKHYOyudobgzkdL8NUueCleosqBHMRiUR7kekpsAehCQbtUKgHnrbRPUb8a6gpIgEZzH1BqrAWe8MJyAw2TkHDLo9fFCfmm1K9nyS86xqRSzZEiplDWCu+Q3tYSKo/JgcE9/Ju12MwjUoqan/k/z5aoDHyqE2WAG6a7IHWpiufaJpLArA8y5HAKHJV4s9m+ULkl4xOz/SwVnz/MIZPyuBXRy4thxF2KCl9alMS02vxzHz4+R9MVwNKCo8nrGzxiUFA+ypm2pJyG7Hg26+VoY6DQBYHLMXHirSnejGDyn3omGJ2nD45TN2t7HHMPoPmxuiRtVDLJHRmPuTPMY+MVk9t4RIgxyl2xK3gsZCRpdKXpaHHHklK746yvcy0BFfis8lYEPUJQVeY+mznOfEWuSDweqAHvTtB0oZ9eM8Kd94qrtFKg+OAAYu24QHvp5JrvNv7uig5x87WL8DaJgzTSETS8lKtIFpVuA1mkXpgJ34wVW7Rs5wSf4wcUGSi2X0firHcWbyba92+1RLtn9/Ms/BwK0cq04tExhX+4wbmiQFAvmgJe3yDGpL4XbWuheymNrsXak59eOwmu72FSnMYqVJCJYepVX5k6FJHAWSCU4NOuyPFAruwywSvvXU1ODgVOLJp6MlYgs/rb5+CplPGdy61191kCN1+DAoq0TRUEgwPDOtXXD7H0VhMNkLu51LwxNA9IHoM4WZERwuUnowNzsDIap4uw6oTK8K49aCjsxDQDOPigjLGxoODQO4xtIrvhJRX4LUzjd3ojCfO0NFx2wvjimTTOaRsQuemU2aFcp9c22Xnq0tR5EYtuqXNzSIBZxKSFU0ISeB8zPpkLvG4YTOIYaVJhyLYmusP/ChZMSWps2FK4joRVZACb+gdFAWrNiUs2mGxkN0nB04c0uOUXvYV1E9QZRixBGPUIKUq6ID/DVPXN2dDxlBgKjbP6x1fcVkSBdib2mAafHjCX7ZkyThShSYq+Dl9jqBOlUBEafsI77yLwFvPW1t/BEoMfvFJbIFeRy3xj5Mf3JA0pfIwP96iFMdaeInIWLIMX6C2pVAkEWHAvOLB5bBQUuUEk8r5iBDOxcGRQQBYEpxjJiJOtEHKAKbxrLZrjBUgaWXjzb0Xm19qT4ThpMBknGCgN+2eIYljsJiUWIeAQ9WeupWHCWW6zoQaD2dd8YJHSYyLPiXLen+EO4A0QqKXEF8oKZMPuiyiNJvrdkUxQhkFGEPXwA2rDdUVS7fS5GLJdRo7OPq6RPUiv5siOdJfYL0wJjIV8/MNKG3vPOObApWQ3PgopwVnRICMoQPXHwm9C/YpcERlcS0fSgFpYpgJeqE9XEi+6rIT+oPUkGWg5Q6cZszxAictYVfYYpc3hRlVQfsHw8Hs9LUpXtJ/5iXCjImPo6sjrGCkh2V4D3N0D14B+ijetsB4x+ztfFATX1C1faFaHoHmiMeWp4R1CCDFIFPVH0PDk8czENeL8aLumRnglQvDFHrvNd5n5zktSEd0JdOcNS7ck94zhJ2NCjsASlPIoe/LCiVzbmn682p6yNoeK8uKrZPpPq5ZWWa48oZyZsgoK8kysXze2HokpXd6GVCjDwGHZNf0YtpC1bmXTiVLGeeG9/N7FW9raYkyeFiguLdiIoTaEqj7+i3GM4H9933guogXo8R++PHfzfmYWf671FYfF4iad8ObYxoH0WJxTSGD6DF+2puHZjKdOcbW4UBVM1CETzsFMzOvoS02Ifn83kZER1Lnzlq/6oU8mbGOQPznNMQ764k1/ePmjQ3CQFqRZQL0tHTK5bz7ErPpjFkyPQCze2kzuhEOJTymvqt/5hLuEESfVfDxNCjUHeZpmpwdW7OPbt8gCZusqHd9tMaBr8n7eY0CnKeLHZpudOhkKDUGN5J9pHzKXAzNB/oOLahwKqrasIS+ZLtznM5jtTQ/hSslHzVqrS3CTdu4zbL22Ol7MoG0Yxz3PM11dEyk0OwAPXD3ALUFaNmTi3itkPx/qyiu0TvLKdRRWxHg5an0cfwoZNd9thdE03J7sDBVIB2EN/5RF/07dpchQTPWJTPF5TfrouefnKKMpg2E1SucW9QJkmAN/IDNriX0mINBXcI+H8uTKOLDwEnqFzYdyV9rdPzdqSQPUsC7nuSGimSPpxJkg/ORLbSkNrnsg+owG5a4WOdZoMNiswCWFzJON68Kvqo0Z588aJElh/LTHxdp0BHM6jJgMW21vScApN/xkwExMuTZAG+l9agl8pDnliuuJBB46LGcChn1DSzCyEt87aHHxIyWS03a9w7UalTpLrmE4RidTdGEJRye4hkLB/UKoccxVESQBRcdKrbGB2LVxYXCPSZndJAKc1Z0ZhvXZtcW1+NdBJReYQ2ahtBDDbZQneEmkhfheptKVrP4vzwsRed8deSurtCQmXwXUfDmx62mzIWJjQqe5odGCKi5I5OfvFXJRNxXfkUW+8zotVGBT0KbUvxU+57HDCWFrfKKcC3hAKF30qcIktLK4UlmFUNxQwuxOnDmYa+kWeCk7PjJ4x/W2fGaOGF9ebEgnnMNfp4X+JWj38F1OVG6jaAYiY1psoACvPFnZPCdhV7SXkAMFZ47Ze4sO/PETBATJC34cmOiAq22RPpDDXnUrMY5hbdIvfZmYgmnmAXDAephwBoDdry4yG6T67A4+s0HixDzHe+nbjvvtpeQ7rfKttlo4DOTxkISulhULbZP1Zl8cjvMN2dSkUQiEgC7aCEm08p4fvA+/tBrEYeIs4wujGGWkbvuKcYUvO0oKivQEMDbZqOnIHbV2LgbYGOjGbHaE9w6fsut36wh4Ob4H1zMA708h8cGubQZGwa34bZHzPNt2Yjg8iZJOkRcaEjeI/nWI6E7Xu0VHg4HbwxZxY5aLRsja/pI2LBDSG6K+dkeVvQHhGb4KlZfhtaKIqsWeP04gcT9ESJtNt4QifLOuLYw3xAgwKj/hdQYOQhmGz0nmQ4XUeqRxRwaLllQ6rBXrE701v/EgMfETIt1Y6o4iXtRsPX/6ff+5CLWbe0eikdl2NEUxhPDqzRbAV0MeDvmjrT11LiT5NEDLUiHcry5p/eqa7Pejac85sbHhVdBb5ZpNs9uMQSqHgAhTYu8XrRZtQhBsS75MeuPGrejIhdvsY25sUvrwvV4/WJa6ESHj/mKp96n36Wapf0sw/AUKB7ly0UWeEcoMcQeml/zhBwvYLqUDVVcLxjIu9nVIqSSFNs9DEbeAzRe3Ct1j0S0OY17fLjyNA0mtdQkHoaMn8rghqfLBJqZH/S/lgV2cS7wV1ZvpoV14Znaeiiz2u71UWlwVCuWEU1hjdIu2hpaeSkx7yBLWNQnbaImgb27n/zk3nO525XgA/Dj/ydEy+Nw71E/vvV40dqgZdSvC8pbxlrPl+SuAkIjVTMDbekyqqpwHGm+Tm3VeCQfSsctZs4E6mO/OyKhSMvBt/JjB7BPZmGiS2qzOTRb8LLJsBTCkrsfHm1S7iufWlFViOHbica7MCQPCcAZICgm8hLqZqUfr4OUC2l5FjUMQcn6cjvDNTC0VvbYwYRjqs/1o3SFrz4GN4YGg945TbtGKoJiLW5h6kIRhpvDP3IqPaZtCILay6/mQuW4dcDXCUfNufvb75H+Dhz925sZFbrw5/i3keQzZoS3epbsuwzcl+Ikr9wFl4WFV2yOFp4T4dJBqKJ6kNOAp3SrvgGSG90AXHQ8U/z8FzFc1Qlq9pT3f80KYlT365K4+X3jd4YgBeoDqQkz3tK8lzPoNumoz5LuMOQ13oaIQCAAp9KQlJByNS5C3WACp6cHXryFdOkLB1y1PF8aOOHRHm9nQiS0SJzEGrT6H6L2SpKJp6jXyCo99VNUfQY+tF78wCytw4ie9CY01O19gu0FrHB4QGJHz2LRJg+ku8lTdEiVWdQjY1KKwKqAo6WdJ0ailJH0hHp5xP/EhQSr55yeXItcQaV55uZ5FfBqRfBHof3IVq62iV85tIa4AeuXabBxo3wccDoA1VRNhn97nHgcvYOlL0gmMUkIafsFVVfSHmYNxMkxWjettewM/pJfb0T3dlEic98mgB+bTDXDAy5NFaK5T0czHsyocRH+qXa4RqDKyfOONdYyHqk5BoVY/skWv24IWxCf6cKUxKw/kxjpq8A4mH7lsIl6Gz3n5HNoDW++Kd7gilDIsriSc7zyFsdcn2AhEzjluT9qAhv1yVHWAsRJKHW0oHrbJHvXwvQqX+epcQYm18KowkvoOUNFmFG1iGeNan0KNAf+D3sunPVn2RDJivXniJMCn4S1bagI1jUlQXZlr3JOaFYEyuMX2ndYWs8RM+xeY+0mnbl8uelSWr/sBknz3PhoEMCRLhTyWU8HV7xng1tnw3mSyJfIRs4j5/AfXZyrBerCLnar41z9KHmspr04FSvukIkPZbo73JQ0R4G8el/nwFvpwUXh1lhdep2kqcsmAcNIMzdXd+fmJzPBxdUJ6Q47Wq8tZ9p96sM6mRYPKh1Pcvtrt7Zejqn44HHkw0S7mdUFTRlCoK5qSQfrPzEsJGVC+Q4Juhq+S3nSMQsc7i486kywZTQ1IXetTKjgaOidaMBk6HW9h2AKudnMWF2KMf50KBq0oy3uCR5jHKRtWcVCpPA+MqnVHKh+KvtEEKa/zC7jG5ooOA00g1+jP8cVgckFi4UNLN3vA2R2hVriYuHe0rox6u6ykm6XsTmSzHvU5BhWJyMIOoCeyY97Hc2w/fuj1vlUUH8tYj4I3nobIhvCoLV0hmvfTtXEHDYnGK/RwpFmmRJLVO1YgHglIW9KmCBvcHqjr7vyI6GCa6OIAy2eXDKuOwZQx/xRuAaDZ1eZ4numyLPGP3mqy+viOdt4Ro/BwctT+52HxZ6/qPdmH8yW2LW3TwT+hGCU38blWpirnbIAdfgbpDu5SE45Fy7LSqdt+k7pDlQujTOlyFnSgkr7kXftLMGpMGfybBFYt3GYFE61dnKX0wXdVuEsBq9t1xkg9sKEqZvntnGtj7gSSObYx7bQfPjc4tBkZzOszivu1sPu8hbWlB0p21fXXVhR8ldiynQqk+S9PFmR0q7R8EpIw08aDFxYYhj4cMkQyMn7LzZalJUjQrBGy0DCJPGcW7pgN/3t9BquzoOdKhFOnCgDYkVOOKFuirZCm3CW4PTdUB2CifgRcfqbBrA3UwYda96sB54tn9mCljoS+EdEcp4wHXMCBifsSNUaZLRGupj3QCvsvHGjmJMWJb4ootTcd7PO6z26AFpfdz6xgVDyRfhRyk3AEfIEIQAxHXfXq5AukCeTsn9q3xLjesAc94Ldp1zzW+eCnJFPd8RnCVAIZXKC3//2b7u/l2dFupLFgoKXs+VRUBmDE2HhwPJeogqS1e0zgsJtZu5yh2S2iGfo05yq9C4UYQi2DcX08THDQ0Gv4Kb31w1jPOMsfjKtpo4k+02VRKBhxq5BLIUd42P+DGWIgR5IVyopr69QSp7/X1p8w+v+AsILA63xd5/YgDAIM7HmFu5ziYboQsdqy50pFgwHroCOvh+zvsaKlirYy4DVCRISm8HTE+8KfJXduJRCBqasMGIpstNIT026NE9qWw2VP1aPYQQ2nTTVqYuWL8IG3DXnxcbW1lc85MTtQLONtTZGQLlDYViMeQG3N0L2F2pEUjuAK/ibwkAOkInsQhgVLXNtUbw8MglTFvdjpLugaEe3Aiaf7s6ViJNsTusMMGWS0pLpqL0SZhmv3qZp/7t2GYYe6U9dDSik9P1kFGEk6ganMhu02XmdF9diQiEbydIjDOIAvv82VRJ7+27tXIqvcGW8wSg+Y1hvkOBgP8TrxKx44GsgXANTVxX8trns0dxnRmEVP/vAvKQLDGzcEIZdecSiMCAhqctg+bfUnn8B9LM3ASPYCCAEDPUjgqA70qMHItfT76YcqO0s0mEBIsYtAoZxbn9TtOH+RFjdNp7dezcx2VwjdWSLFIagx3JkGdOrUuTmeis1xGlNm9Z+kqtAw2Fgfb3OLDYqlys5fi/23EyhZ6ihKv+pkczlG6PYI9Z8r+hkZrSRStXc16yfPKZ8K15tMzzGoC83RXHy0XvpIGfvyzuKGImo/gJlpscCb9x110I89ZKEK+olgVsWoEnZW5miJotE2VPavkqd/q4kYI6+L9+xa2nnok1ClZlKE4Eow9nSLgq6zUt3kHO3+Qi78+6ksExkCreTI0Oq+I4OMovr92aeIo01EyoMh8cMVr+E5wIJaZoWCDXDP2rLzo28tPB8QZtCrsnQvc4FUtO8Lwz6GJ9YIkVMJeFZ9fd3zvy84dcpooXUfsQwDeUtcQQWI40LclKd4jOIiXh0UDZrkuo3gHAncNmVzM3ynoz9uadRaDcZTBsouottzGaHeds2RVCFjd8//J4WcpLS3B6AZOxniMRhp04zFf4Ik3kYzIRhZjD+Rs4ahNoJSwpKYwziG+H3XciqNmbfm2qhhfrRqXlijWHxdZclfQVW/lsW8ujES669e9tLLGDETC1GtuYJ97yA1Ns6768nyU+ua91I3N/EuHNNyua4xiS3zeCyhFWZxm3Fr5sb0hOmWcS18pGkz+zcrff6/lUEcNETqpITzfBZUwRr4OAPn05sMGV0obIW9YBONGQdK75drhwdpqAoXoLt39apU2IVjYz6APUPKxJnYuvAcEelvp+Jse6oly0qkq0m1ds4ef94BWQBaAoS9YDETk53Af8+68z3W98W6bCFU3NxaMKfk1fGDRctjxBlSspr9tp2uPnwima5ai4iolC41+AtUf44tJNcHC4b6jw+KdQV1Vwk5eWcU3/kDionGaqtrsRLyW0XxiPvuoO5VGIak7qBky7k9RrafWnp8PWpGE2ByVqn+bc5z+3lri1kDO1OvgdNgdlBTfjJ+RzNDIauyRaC/gvHHjCnOjRD7M8Rm4PSRCSeiOgMCMK++/HocOdg8/dpUefbMLfeEbCt3TS+3FXnD/S0KWNoKerKuHY24UrBxNCRFmMV+8lwXxYM7s7Xcc1wBGleTH8YRzRQufbNr5J4CRFyEc8JHqT9rfKYG1oQa9KT8Va7SYmHpBdcG4Wqv6Rilm3QLRmFwJWuSTWOyYnPSflQhWjkPw07nhoqti7Q3sp8MU0W/hhtpGE5OGVZQsXh1G2CozRh9B2VIr7MX0NheIMNvyl0lVd+S0HSPRCvdNudG5jlVDxo5wLecZqvJ7ytZJ6Bj0jahCjOVoc3PCJ2LdOUrinVoekZOOaq/IvMK0QLfcUTm6EF+P6tEhmzZoHUTKEC+UsGAPOB9emy3EkUp9ZtQPL8d6J9DExFC9Qr+FugevL2sriHSJ6uLICSh8xhjR/F4bHlcFgDHrRoIkrRLNRCHl9KGZj1EUYiPBFVqxhDYCg8BXcR4Xy5UdE+ZSV9fReeHVFnhv+ffbeMfQ7R3G/T2IEQhXgLGih1kzF46hEMB7A2LmiGXmJtDXtJq1JV5k5JUNh6w00UW4A3HNsK9+WSAiIfi0eOufsoN/ygIFp4PV1i+V6PdTkwUr/EkCS1B6H6v0E4ipfbk5oUCPpI/FBWEotYZt4SpG0tZgWjeQiOUkcbYpBsL2fUS4iUHDxKQ5Z/BJcWabiWwAvtPsyrLWkiOoZnDtsVaURbcmumvqlNKpgnRXdbYnNX7qFOQuSOABTdzF21nzXD5WJKV8tDxbDELyW7ZkMkp/mpZVGEotz6KaX0VxkgHJMx/6Q7BhhF/2lIOpNTT9nRKlZ2UZ/DaNvGujktvk2B4XyTRmS0W/taL0/iZNYuBOGOiQBH8D7pmjZw6RMk6BoxZmWJDeg4lcacYIQqO7DVPkp8ZQw9qdMHVR5mMM7cxs/Nf/HMVLj+idayzHMQO9dw78zOctC8JWO+gg1MT7w663FRQ1fWbhFj/bXDgT3HMNCWQY0lGKdutLZLDj//A9HijCdrzeYh3jtIhJb1mfhrZBqPSv6+O30IDVvkIkxMSaghot9lSW+4E1VaNm8VUxB2rwAwkfUU65hfTqsoKJWH4vxsAb2ubF2/QOZg7XchMN2dxz+q7Jsb3HDCLN3fCps8vO5Y83m7MEZtoeN2FTqP0WW33APCf7NJMDM0g9fJYxr6esdiz7Hqq3CB1R6BSKhtyz7ak8w5kiuAlQvbT9QZZrIIDDOltrzxmfEO+w7HMDnH5C3jGK29eYXjw/fcD11TfeEc3HnWu/So0HslUZ3ykvwyzTEc89Qv4okkWrp5Ia/dT7gnV98VeIkduN1BzuHfdNHztImmN7S1xFVyd/xvVsDig87siINuvspVsh2RBbl8oqC9Fkh7xfWw6xfLOeLNiiMqNkbJRCP+90iiRCtjb4yf1MPjD3aKw0TeHcQTwnXOGj22qxW+flU2tyg25fRi94ohLmKQSRTX39piDO7DdBRv0G3FEsNwPasSMYUE9uPc7WGW7HfiIHdV57hEFDfMcH8PF0/G617Z+udy6DC1cPqQ2Nno3gfMFMvRz6w8spdNXZqafPym40/5HcXAl7LVoA4XbJ/R+4RqBZyuAPYZ1uUl1uf9OdGem0lEz5FGfPir9nDD7A4Kv5JLQjE2HzoLc8v567chLLq/IAkLyaFuCmkCdxew3oYvNFGmIzo5TDW37VSHlgCV5RPIQXGljZ4K3sNjk3K3Lz1YzCYOKsWHmGee8SPnySwcIMFPkV+39ecmcWaUwiYiethn20+8kVJPV6pulIYtiGucWLoQWYjCo08+qxqpro3XkUc74kjVcqlyzbiGn+NOmvyoK7lD0ovnSYVLgBdLbyOD1WrD5dK+6RAw6m0Hxf4raZ9Ndy4cIiqBurLBLdo+quoBU395FTGF583KWtIcwwnCMzFuZOK8dHd9WKZNv35z0IySD9U7O9ypW6lP0wXf4T01z+Gc1wzBjktfhoGId/JBBTit1cDR+dr9Si/+U9iO0W+Qz+KwOVJGvUTzM6g4Thg9TyQMP7jiimEuhd9zD65YPv6N44trQELQs4ytQcfxRn7ogt1hstZmV1DyCdGyEeAk7X6PQ1mgGvrS7CWalAnrAcvP2eauZ5OHm85ilttxcycAuOUZn2sQafCgpEoj9EIeugl7CqWIwJY4b/21VpNb5MQ+amfnRrmAML4ycYKts/1uSSf/CpFaCIKxilunB//0mMSIQnn7w9mgG6jgzm9bdTKSyhK0lknhFBjgVEfmIU69tGqNUGWRje5q0kLCW6Tm7CM2DC6bCNTbZkwR+tkxEOISv8EhIJFaPFFOLsN+0vWfzteGKQZ+CjUd9i8A0gXNEla/8Wz+bnEQgjQGSrQeozQ4XlQJ+3Rihx2pTByaBFG/1+5it4NHJMNRjs1RoHCBNAw5MfSeCAY8wrS5nP+6n8D1IR1kOeCIxCl5MhNrNHby3JKBTsAIkldCdFsBa+SBDY7eAIL84f/FEx35Pt2XMZCK09mIghC3ZWfj7NjuBY//64gIAswvr0YNFPvr8EJJhyHGJ1hCwwRKr1EiH1Cwbr3iWYMqLIfex+aTeoTrexEF5iIuaGrkavZTy0QJL2EVCfRtfzmP/t5l6TE5+OAX0R0XhCVuSuU+llm7lvDz8sLF8bdBvpTOzAO6JdM6ROCFRgiQUjFf5JR8B04oSWtlbWd0Qg5r/fxPXkYrKo4Ualb+5VnG//GmX9JGiXtQ8m07I5ytMftNxBsSDfg9SDNeHsnZs5MwWeQHm27JPuLj8dzFM/aaWlgzMbNAwvRgbFrqFSBLagMxOVPKFQbBdyfR4vAZtKKbdkD9uuwH8qK+Kr8CRxjmuf10uZVWpRgGhlcuuPG2992/+649qDvqXvCc7QU0d8hjDRKm6f622ril78NsK1Oj6iWUNWDJfe/8q1JyS7rM2eU4FNoTiuj6WGNXH2hYyDVmJ/MkeLm/359q8+7Ts3RKoEc9frz6it/AEpP0bmNcJrcuWPFcMUJUQR/8GNM1imESV4NwsIuuLstdK6zs95UfxReffNyYScMtW3lRpSY+DH7mooGs5m+97DDyUkb2nweuAZOOfEGLqu/uquj5AT7qP1rCSwFxrULZ9xD5wLYbJFD9urQwIWiPwno8wpnEUGenUABHJdFdgRwXaMcIbT2W8pJeY3Baqf/tv/GdeK1wI648Tq2hXq8UDcmVuzIzksk1f0DH1Psh1m9LUXWnwKZQdAV9oexT2dSY70Kpu2Kb20EciMWLWr2MamZwAQ8887f6+A+YvS/RP/kpPY9bhijl5WHZKbpe8jR2H6ZSmnBXPXbd5mBXA992tXaiiNWyA8Kdyy55W0XXhOBgFq4gZ3A9X6gV2HQXBV6q9mvBvJObulfz71s/Rk6unWwMygPy7y590mGrilIyq29KE2HopwABiwXepPiq/f7Ah+/6uPHTTG4me1heiEwMuETXhGKedI4NdD8FM/byUNFiVGzBn9Z3kQxpe/vTvl+qKsGIm7TyyI1VP4PoL58UskVLMcn7CGxloVr3BQ8NF8e6tZ6DMiqWXbfp+K+Pvb6FKJKGKx4hPFLJWrWSAF8iXKe2OhwcPkcJGX4I4rflhpb57kyPtJMqAd06v3/wcShdvUf50T/wPnOYqHV9N0jfxnySbonypJfkA32WRIRvrqdQ3ah60QYmCl6ldHnZpbdwJS1yEBROaf+cPwfkbuMrG+Z2YsbAmlKUEjAAk+73NURVQ05lwY6Fi6OhqXfP6e56Ycukp0G5H9Mf77ICRbO3d6LeDIEz61V2t5DQCKQ3SJhHNZ7fSZsXkwWzahEW/iuT0Z895LMCtKySe2gdelY9QyRCMHH5rPmF4SKtBooduQpHkW1ymRFeo6ZiX0wnde7BzbN2QX5YfLhBFswccLQQy2pFhko7vaFNVsw+OPWdQpwipIUovKy4O64twVBZwBbwpuRSgNC5z0e/726qI2nET0qMIRMPdZZn6thPGTOvKTCcRy2GH1iWqt7ihDBJEAbPsdeiJ0r+7BBjfwRFi5+oQgQ65vUJQ2FtZ49vjy9Ebvfnqf56mvMCOfoKi9uwYilqrTTPKKneG90CgGA9GUQxWVRQf+N4Ok1SfqDcq4yE0YTainrAvBapLF9RWFYhNZiewn3K06LhHBm8uyHxwwnX1qtdLnDsnOu79t+3OnG7D3n4QCChpOkzEHwKYEQP6xUIW+TSz+zpIgR8GcQtYdA07qXyN2//TMCS05hpxFGqTCrq/deGVmb0Wva4LBIADc/jZ4fx5yKmjp9jpt8v6xFlWYHQuNnaGxGG+GrTcxfZ8jAlY3yyzrFufjMD7dixEA4iNxFsrfgWqiG6oxkDb5iyXZsa3vWimr5U47k9rsE30o9HIzSSgu+MuhmnwwZvByvjxgffC1VMhgkJRuCX8JV+Ipku4T3U5Tzt5ky4W1dMaZSJBdNsDPSaPlyPsOp8y+2EcXBt1LoxbW5EmTFlbT0ai8bgS4drv1BHqR8BO0QFjtLKUiKUr9OuKV8FwMMNhvgR4WLKKcxEnNNWXrS8qYbNqYDiXqpMctAVFcK2adVQIM0wW+B1mgc1AWwtccw4ZJ0T3jooBgwtE3QOs4H5YaPmXKQjhB4kTj7vbCzTsz5xVkmVArL047Tlhxl/cknvg89u5y2d4E/e4kH2XcpEVv3ZoMbjhD2zeVidrKr/Fqna+45fyrjUGmA84QQBQOFACx4vZgd2wEUHsVR7VA014AodCkOBkSZbvZHo+031Idg319i6pQ39fSY6cxJr+i3ISmHq8wuz65b8/p43qV08YWAClhxH7HsH4EqiOy9273G2hTCnowRDzGMrTcDXIeKuFuZM5ugQtjEFjYyyZDNKLF4FEwTidEbcPA6QKKD+Jww7pSIdf7ol8fMQtROdJ5cEn4NbV6d6m13XEDoEn7Ud6960YB0oJwUFY538ZJ7+g07EjLCmgB0Wj5QhjLfIaB8H0cKWii5qDW3VxEK4IIWBAfhD8wn64cKvLyDMrwSWuhrx2twZcwn2ZRS0SgQITpxmOfHgkMRE0ln2TA/i99WvhAp+gcyOwIeITjyNi9UFmNukCkNNokRr3/GNZG7ArnvYJRSmMqo7tNAtdmT5GB59Zc1/piol+M+rQfjO4BsYzzbfKKV89SvEEFvBItZVgoOTpDixi8lvg/1R3U/RoGaZIzxLg561zKk+g0P2GLiqFE87q+dCq2r2GreQuNNN7M2NWfmPxPz1OoY+PhnRCO4YPzqOshMr+ORhrNT5HFPvYY1Qj4q5jpWG3qdlpCSTZFQfQJVQeeInscvJAsmIMPQgAllpkzRLT3cBGPfZjm/s1mPnzE3ZKJSyTAS0l+ejsjDb4mGgODaguULqOoMDWnxCa81+e8YMRPl2RvXwAXy6VqXlaYvc0ZywJllpkLt3p4IoZuRTugAgu2/o+fzQGhO4Objnb8sT6RuHvJOKR/M1l2S65pqc1Y/2XcFAdeppYiyvrctTzWdILHEg9jGO+734v0/2fblv04xZLLwXv8+uuekeKOEc2D+Eza3460D70AI7qBfGbM7M88r9I/2OTIdWonKVNIucY7kDm/9sfYXCPLhW+LPLV4F/GllNI0rrLiYBjJc7ZuRHlLqAZbTIY6u5HJPXf9093nyDoLxs4pIGg7jfj6AUZ0D6b5XFXzWkejFOz6gj3k96hxflwp4kmRauzJLIYfcLSinPp+0KhBe6HN0nWOlvdGGu5aTEOVPw6o0tUz4zT6ShOUZuyIxJj3/hGqbVb3wx1Bu02/DnOu1JXY7CCpH1TIKy1pejhDBDJ9bqKozn3eeftHSjcdAkuyYwahRh4LfEsSQ5zU3Dkr530XFq4biMTrjHtQZQRZm1XPW6Nyq/12S8S6KjSmj7dUx5cbRXuleXfJ85CnajoFTzUtwKitg5BDzK//0Q+nU/Fs6iHsZ4VPKs48539ZVoht/dgAEyITw3aAFCnbJeambn2ditRO8ZqxP9ZHrSVyoKmHT21uPm/ms5uw26dBzfqSWHThFh8qZqvzdCrHH15gQcxI5vHxZ4KABwbvNVOTiYOvhobiJVE9cxkjlL3t7cSJ6nsHpRmO0yUUnDts7RyzoNLV5jDPXAuKN39//8qEbDAHPXZcJ08/FqB2UyTofApQ9WdGSJi/8rY/BSf6kv4LTW1JeVAcQ60fb4XgPlPYsZ4etHmO0e/qv6Lsrjyg5ZhovqA7Iw1MggvMAdQyIVoTvUZ7Cc2UaHHXGHYrq9bgbjshH6rCxcK+yIakM92aUdQqcUthtwSpN/fjeix0od4YQZpyytrEoHRm1+SfmcRH8Hk1dyWUuUTf5NhvpyaGiKz8zkSk+WLLCPvAq1Gn4GquSDh5GVrN+BEOew9CdgQ45m2nNXaMhEliUKJ8w413DAdxpZ5ds540thL3rsMUFhvkrl6mQbwHyN5N1frYnmfYXnNE9mAvrI4H5JqlIAZclrjxQvw0x+Up4GXEVIthBt81crNDSNi2I4xvvQ0F4VnSSrPacyTjsyeMbSasKHCBkO8uZ1pU7ebvNhg+tOYUWD5q2w/494jHuAAswp1ff/ES+2AVQXlk1cx27y2UBNp6MXTcN/2TSl66vCeit2o7CWhMPVZpqXL18w7TvWAcXm28dIPVp8nDQTjKTSf4sVyuIePaAxdOn33RPQTpMyH+/CdA54VsFjzbOHNeotj4p5XSwl0RGVO99iHtvEbgNzDNWdUaePt/UHo7jxYVXW24vYr5Y/ePUkAKLbjwkuVVsr2ezKyy4hCoSxLpj+AqoZ00/AEC0NXbCRxvNp+SMN4dpTzxGI0M84Ns+U7+UVm/EOI5LVBlOUGMozX91V+DY56Hw0fa9NVGD4cLi8p6zGTqVuuOIAIvlgCKobru9dnJlCS/reX8tZ4wD22pkIGKOu98tBYiUU7PJnhaw/jR4tFae4Br3eM1lBn/mwqb2zEdeXBdm7oTZAMMFdR4FokbSSJaoeIgYB0T4MJVX1ezQ8lL/GU3ePItZaioSBcDcG4jsxwVYEdIPkAc/Hxc7V4IMZuVSQzun+AmeQuyTgCHd7zkAJxcllpfE7anEx//6DJ3eSXPFGuGqH9eTi/mpXLU3clYxumCV9BOWthc8EvijbCsVVgBV6aG2iEZDQUGPF0XCzYqH1JN+Lcs5DgUJ6526TxBO5+D0ggaZPTjY7+/nQyf0KvGW9D02WhXT7gqmR1Wh3HIA3eXtxALgf3MkxSDk6HRrgsbyl2saBJiWW8ZcqmKTaP1f47PeoWUhmVZJmia6kmNTWflvmvrq2Lc2SoL9IEqyUvCoFD/A6NXho0dtBp3z0f00g8xp9GWAIFkiMunDX0R+AxtHoo9sBDKjFNPlU1KHj5LCQ4i2NdR6szk3RP7uJKRqEAVbi/f5NmGSv2ujtriLN54r2DEyruJxs8yhNiviz5xyKm9E+OCR7cIz7yi/t6exvpUIWDkg4Pe04HhKX8ueX/oLkG/RTgPPn6wLnD90LJncoLiB1a4ZALMl9FrtcE2ghVJJ2NgMkdyLQl0MC1qZNE4igQIfCJGW7DGzPZarf2MRczuQau2dOZO4AVzm2A7LuJmRH6AqBZntSUpxBZWr308zoawzyJNXgTcxnf5y/WzLYXZPX0DsTwRHmGlMbuRB7hshPX9YbYQAMmi8sYTVP1ZnDViwEJtl+dSk6jbUtl2xR8+O1agOsKEthpfDg7QRsS9Oabh1L92RSpy9Oq28o7m5Ek+QKSXIgB0vMb+9r/i4pNyzuBLJ0YY4ZL8JIISwQgGrIGgG0fQAuCXJ7CQ8QuM0syJz3QV9wtBv05lTg/hf/h+jCg6nl8OZ0qFLvmXsZdsCFvm/3LMq+c3IM+xTyNnBApYqd3nU2ME7i4vHZtaIPNO+9cnZNbLyJ7HKQ7DQ8qVqvGNsHtdYVgWIuB+i/pZ+vzcByLjUt6irgKHDu4a6FmkJ3i4iDnNgdb4Rz6ZRZLJSXexGIbC+lKfAIN6A3L/yy58QkeBFGR/P21Rv6+tUvjzWpCPzk/ekddczjtIkFRjfALd3qUzR0JTa0ldz4HuJXP6EZg+Z5HqEQYgBHvEP4PL+/VkL0RfpRU7RxCY15cQjCCu/uQc5hQbnIP8SZ1B+vPDcDyTdTaucd27rhvMj+k4XOZG1PLj/ixYUPIEvDPGz8hxsP5ORBO/2ObnQ4EtUk5rZYtb4qQ3JNdZMxZNomrikpURAHm3FTurKA5yYzH5F1qtGl3GtDwEA8XI1v3d5tg8YYD3NPGsH7c0LP7b11OvxyXeDMObuxTgu/Z3UWgVz1q+OHdQPVdxFgnNFN/dxo2mZk2QECvwE2ip9qyLbiqJyWP7eW8ULyZuYxZjelepeiaJ7C9keEdGciXaa5uFQ8HCJWpBLdoqh5bTocJoH8J8P97A2gn9bRbQzkJW0Lh50NwBE4gRK6AWbzgL/Mq6eq9owCStJCzvf2TQUt0QR5YCce3BPMFwAhn27kAf7fTZgsfACX5ohEPRm+h7JyMe4+9JMOGWuNItb81ZE0QBo3DavZ59ILoWfwuZfSJH7V8irKt0gC7Etp9J+x3VXuBpZNP/q7igKopYcQp4v0OCV0jWeFiCb3/amdIH4dK6Vg0SiB8+dKKWZiuRZJfCip5WdQi9wywv08wfdgtVejwX6JDTfe/ZrW1+d9y46ClIA/bG2uu/yCPfIp700ZNAPGnZkc3S/qJunj8YDVasST+fidaVbmfW9TSN9SYd4Vx+ucPIVfsZzCC987R/Ohz0EgpF5UFPg5NdIY1AGR+SM/hVwS8Ud55DiYMA/gmGI2b6fgHTW+h9IKi87OrzBHMKafPyol8zqFPg2D7Oxq9GRHvv77n0hVmmOCCR0dazczTG0qNabKaND3vE72GK8X8xPXJZeIa+daUFKmb87SNZr3fcuSQRrZDqucPOUneOYOvq5vm/1ZRpJsbWRdQJuoupZuT77sIa0OYMczdLtJHHmxuKv4Z3CyISfckOlRyrYCl6KOOUB5AoQIPgc9LAFUVG7a7t63zFOolKIG2tHlS4GhQ6acr5lYnvKYMHlJlarWAxRFH5T315PbDdqSFrWHi0fLRt3ZI0sVuyNNrTVVlPOWA/DDysvpy7kZ6Q8ZHbEi5VVhO4Bo4DXB470Eqr87uuaqeNVEGAW9WKt0BBrfNzVscIz4L0YZ5CPVD9+Og/KD4TlixTHIWs3XiFqb4UflN/1ZIA6bRIsZKT4l/GVUYnnfnAuOtjJeGBPPsWXA3Qb435P7wshTT4cHzPBXNBZhicoznrMqNZcAZDdvIPbNRfAw6osvg6fN2Qs4hnddGPa6Za0jaro25fc8z2wSgfl7gYPcxl22+cSBlAYm7ppunE9TibaAFq2UP+CxzwvyygsHEZJbpvtO/oZOeXUTSt8LH953eZl+nL1LMNcs67k2UejodwoiuoLYh+ECep/6K5yZxfQmmZGbw6paeKAWbglHGwzoTDzgND6K2M3T2pAX3SBmvHr2iTYei5iSINHQ13LSFFmBycGa6iKjOGAp4jTWyFjqx5M/StLCJS4yOCbESQvd7NbdsPdcH7aA8U3+VgfYinOMCEuL7hBjpVrT66w6TjCWoQFOOySUVEB4adk+1qSeN4DRZc148mDZvqXbfHYfYJTWBaAEpLkfMS1MnnpTtVIrLfX+hW7YBcZPt1oPmd6/mD1ahwHFUg/2rd6bY+6bN6nj2N5KP+N73IMWz16IHVsTr4XXJi6ghwGtkNj/NUAxSlUWgW2Yh8P+BlSSE2v9w4tBaKXkO3/3H2K/CZQtAottB1+JzAJHX4eeMEOPUIwxFARUKOSS4Afcamj6YpqYz+YGxiqMpYTvIzbcUlRRtpfGYX2l4BD3BLy4w4yajE8mZQAAAAAAAAAAAABJWBHzzMWLkbZcJzLeU/SvN7jNbwGGIdZWaT2wo0w4gBuN2BcJWrZfl9QolAHt5bwg9b4sqfffmQh+tp9qeztozviZngRxP3CBafz2LephW/EfSmHoitD6AHqn/R3BWwkZ/YBnd006RhRePQsOOIy6O7ZfIgAtcc4onBIuqhfgRcJCwlSjdyIgc6+EPomL7js+yaZuANJseOJGR4TV4bMmpo+3PW8ygsyfJ7lltl7DsFv3IMeWhTbQuklwyhcZC75NwMx0R1Z2v5HWcYuJ3X24Kc6RNOevhb6CazElvs9qfzfxLIqHx2jn5jMqPNXGKketKWb3aIKsLETpheKsdnt3z+4BdhvPpTyBk36fO7bVNGJrly/agQZAWjdBllm4fDeh+RBzHuCrVQfYo1kUIe8WY8OfexHHTnvvk7XN/TbRzKRpmYqeKo59pSNSN6GuOYAxgKs9Rmh8+Hgnm8W0eD68a9CTmwsj7qWNlHan4dIs6mZzE1tvJBgEKZQr6bcOAXTGqbwV0wuQSzltKYeKLbQsxo71D7mRsmStT8I7ENmQ4/tex06PcE7wz/st+eHHPbhqu1cVz4twyq2pThpjpr/vHwx5uFShWRFt+0v0Gp0DfWJi8/Txgctp0S7jcj+WF83Rtos8vc2Qy9cUPSQz2l9BuD62hXDJ2QfmoiCC7wm6/rlr0cW/UAmSn6TVvlr1y3tn40Y/GR97qkLAd15AwHWWvGlgWf7sS9TknlC4LKwmru4Q+kyVOYMwE5ojNgk+2e++Tcjx89g0i3jZz/FalOmaFO/nJ3wenxznu57KDoGu5fM1z0uukLPkuvkLPrjf4FNFXPWv6upbRhcBWMZ/WFjfGEBvIKpsFB/ZZbTRIx6uyo8vRm345LifSOuhCY7rEw8Mb/TG2iafTMU16Yg3dVQJk4Gsw0MNwn3yt1eYQtxXNE6fMvCoaCo2RvndBpzC3XPfiWaYeIrgjY/In2VMVNePFCFQhuvL1YYKOv95KugyquIhPgfbpSLfcmMJ1Xeb8aRzZQO566IZLYQ4hbFBNOnnwcAvNs6kYenIAVJHn39geuYPVF1MRkxZj397KL45p7J+3bvoZP1banRsm/fbqtp8PqnFDt+ql20bxSQxsGg6bHEHyhBJQlcEYdLN/ZGCnNKH5xcApdO5Xzmpkt0p/yDO9mQsYxItVZpuNqx3WqyYGRh/U86Ak5Ne01j3PjzBKroLQNfMqcCH1MGkxFKhilJ9Tsojb6r/zVv7d1I7877tUyQ40ovvwY2jMA9HyR6jRuNpJYOFFzHJYR2PKC4ruPE4yY2T0Ngqd4iTkaJ7ZLogG3DTnvn598P65bWf4wEISsg9bCh+fDDu523FVWEFZWxk8CUnDKELt0afVS1as9k93T1ze96wz9Plm1Ctc1/W+OBDV26Mf9ztVxf7Nx3ZKJS0GilIWzmokKFUugTTa41bwlgRt4TcnEYZAjm3+rTqWD2L8T1mFN1MQLrsjLIAogxk2PB3hUxBgOZoru32PtHdpWQ/Y42N7IWocSdIa3CEzeQ4Jr9iGsT7FEBEPhwk1Wr6LMBE3Hy/tgiPOJdPU1ockFwh8oIwpeTArrJeWxcErQyStIGKDscVxVB1NcgWRwmLW6zho4qLQ2ZuAAAAAAAAAAAAPtn3b7m/tdFLDCndsCm/HG+/ZfTpvlTjO9UUjV9P+GPGA00ExTPn77C2l1t4RVZurnkmz24XRmNqqlBjzL56OzvFiTey9XmYru6s6dysYb8XQ0OdhxV+i9+ejymYjQX6lVVFhxFbOGRMB3GYRZGbUY/++/wP2cM9MqvtAoOd2Rvxb106e9yz7b9zyGoPByvOeN8KVX1IVQhy+29NIP3uPhcb9mAkVzRG2NhL9CccFNYamv+FWtzlxx3EqWHVEENskRWpUq/Gh+fS2L6uLa3SAeKHN73lGbFbR4nvFjyI2rXD99RGrfejy17tjeSgoWrJUA6PwjUYR5wva+HPEeXtFAWuMpiipZpIm1OVMRaeYE0LG6JDRYuTHtAxjN9GAD5v8Lnbf+IJPhvHX+d6xrVKcxkjY3l5+dXmE5GLk5wx54HuetcjUhiCZC3kXLEK03GNI9Su4e4vaR+GrKakFblW8KO8/t3T3hD4PICuXByuOezw0VVtpST9szo/1xxjvTwCp4q4o1q4v45OR2lJGric+ONbx3NZoWTLqO98d0YVnXeUiWC/NGM4LjcVPml+IKyxl78LdNnYuRwaRHDMD1PkKFDqVKFG0tj6yuJRNSOs81gQ6p2Od/XsA5PQqGSVwzQVQZMJKHDqOZmDPMka9Yq7RYmRPjP/JyQTVdroKLcXyfJ0HIk0ry3lfdgMsy2Jbri2mhScW5FoOsY0XKRNuXOuD5vF8FQ3cpqZWGqL+ocWDFnt2VjyNNVK7VA25N5ddZSaH6cLvk896zYC0+zqfpGH9l38DaMQC3d6i1lhVRggZ0RMrCCTH/WvXz7bwAvO6IsZAIwyi40wxKY14jDclHldW0baawRXirAH4erIjlcHqJcmUOuaIWBKMYspxsc0qxWNhHDJHNL60cuV1xVnERrmW1jLX08aojvDJWBUkRD/MfIebBmih/FnDc0oT+oKYgdMGbYU9WDl76HOkHOeJ9zWWZgVMggjEvbiBzZ5F1s2HR/kssmctVYwg5tj49INDhZVt0IjAVDPfPKt+MBQXkk3kZMNg+wWUl34v9yDpHhXk26DbZkEOcAAAAAAAAAAAAAAAAACbJzSKKSfxoS0YNLKMLATaMHO/RXbUDlJJjBJRqObbvMwdYJfIrA1tmaTpMq6Mrh8Wbr6l5YH3LALuryBijXDL784OOtcA/AFRzaTVDVrTH19SdS2rpz9s9cL60Jds5BJ0xMvlIi+wee7+ZGYGAhdOgFoknugMy/tvFCRQ1dYoBiK+YJg+fdnWIvOY0C+Sl42gVcLY9GAhtVGqgUDYJlu7OQ1NShHtGdghML0kUnHweCBDhzqwdrX+lCwndxmDEFtZVkQVzGDzV0z26XUUdIPIS5RFz8NRAXv39tfz1NXtmYBfS2lxFD863FN6KZX9AEPOvrLV9AAAAAAACqhQ/ueXITBcOd2A2L7R2ndZND7evCHQKyZQbZjY49haifJdG2N8lrlvjyVHU1sSnzalowC9I5VZdE7wAAAf3cN6zoaM7ManN1BvmPY/ak6Fm8qIxX/QpiyusEB2cf+6iYu3D3I+ayeXtJ2k5GnK4D2LLWsfGQSNut7QVM1lPLUcJdvcqFt8J7oK5Fk11vaSh/67vcDG71XkpyzAvAUKQ0wSq8qHGwOpaLYTosNATuKfsws+uRF4GMh5Ob3W4+YsLg7N0SkLV/iF7ULLq0lwrLgtqGGXy66r/N5ZVEKa41Jo81tIYCOJD7gVN6K/ZfjwLYzM2StahbH2aApV3M1oC8idg029rp8nDEG/XYeFneQ9sFYLQsfFXSAA/HpzRrzaWnznhmQsRoX22W77v7N4LGZFxuJW0tj9pj6zVZ4Z/n9cdeMFU47Qr7DCAAAAAAAAAra7yvM92E59X+JjNCPrb7dcYnS2QmTw5eEK28HoaXeFtljxEFiQfv14qthIQRgrSpYUvcW0cXuk6rExZgo0Qo5vm9oBpqJHwoTewT50iZtLijk/iCkuEMtf0BKhq8VfFBsNtNw9SYSwvtFFDwZuJQD46dnKu+GMx6FF0gvhRSl6dQspdo5B4kpd9cs72s+uVywXDibFTdp3rpJPiOiuZsAy4CeOX7qqt0RyKTCZ7es1TirHCe/mCdKCuKVUEdlm3VA5tr5KgjamwDrTDj2Y5J5aX4B5X2JPR7bQkupGqGOmuNOa5O2xVXeuTBkzhN2rQ+BT5rmBELtQ4mEPHydpvfUyYyyH1VF9zJ758nslhibKPiPnGaf860UgGelWG5y2Mm9l/UxLvNQY6KW2EjnOkREhgL15t2oC7aXWYolVCsklZiq4p9Y1S/TeL1jhDwBN8orhHyb6UDqmpV8N8XCNWjTVqoiMKoGvlevbnNxv2dBU3mmIpy554EDlq6GxbINwCU+T4R5WtUrWgyd7mG2Q33V3G2MCAxi6tgLz9c3y4sbwz4F7uWiZrggdtQRuGSVozBhPVLjvCWwrxJWkWOrg7m3ZhIo0CdDZ6LDOTuTDG7C2rYr9rUejDKXDf2T+JJtVn6aA/2PNRqqJpHdhoXgfJciyyiLgcci/XLuYUOOfDOSb+HVdbbSPwjWU9uwXNHar8L098h08j86yFn1Q0ROg+5pDeuL5i86cqycBfBXZa8BPBbVPXh2+mKmcDk6lQ3uAkesg38LHDobYJNHzHeAPHnnCTlR9CAnebgS0ZyWme6nMnODseZOtSvVIv4q+d5FaQUac5Bqm+PXowa6RBWtzReSQMJXSlS0Q5l3+uAo6Fta2qZv/AuLV+D1+HckO3iLsmORyBCw7vX+0ai+LEW9gn0qvZhdBQvDgCGq2qoAAAAAAGSCuS1R5lliUM9a7lw5qhg6IBTq8WCIUdWy3bpWDvCD7OWAkmKMddJ6M5Cc64j7nMNQWdxsMXTaZpqV2V0gpDhVDpCQy4khmaxiwz5QUYwN8wMMXnPaLHwlk2hFaJgxjCXZa4tWTkwT3BmHFNloB0y6cPNJ9jCnvdHOdeQR47d51y22zvmfwmg33ccIS0pWOeFch9LLhUntM9jbjR79bn0n2JC4UIN7PUVHTHE/Ed8kehqMbXZaY2ceTGlGowsm+h2RWMKyK2nLYrF+5PrgqUb4l9ekU14Uh+H9ihAz18HCyUL6II/UMQfxIxv34vud5gDXVOPrYgXFkZPZ+XX10h8V5gPzJkJU8YUXb+0P7A2HeVjSAPSSY1ainkgZNwcejxeJYv9NPQPcMt5Xqz2dnewoN7jUrVnSXUQOTJxR4a7coblbjne71SIjNKyJaxVxM2YqsCICUiY557Wq2j5l0o0WsibnPvohfTjnHqyedA7wVbtWHwarCmC4L9AdwFgK9Fz4QPRqs32q48ri9mCkCbyJr1oxVuhRv7OCrUE+fx9Gf6dMA/VVzCpkScpQfh+rJBizMu6QSTk0lURXonHPCpbJQFNDp0ch+EIN8eJOAQ8cc7TTPA0O/TIIgOEaFjTWkXMWDR2pqafxLEEQ5W0bcRb/DZLjZd9gaP+DLO5r+p5PUoGvgTEYMJaxlOXVvvKjcP+pR4z9Y03LpK9VtfEWoJtzLKQEWY74tYVI+EnqQbYF3Xd1gmAeL20w8mFnScU4dj3OPvzq+wcZj+5hWTriVbtwVx35KLlO/7du7ymX8X9y3Tf5WNSMwsi2iOSrzJk6x6pT6HL3byMWe9rjOACNDAow2IrT2/zk822bdK0j2f1xOcsCGtmc1u9etU6EPG1YWtX0rmZPs0N7A4JJzlhHdLbRnsHjyemDva3gU/I34hocP1Aj6CIG2TOjMvVhdxxNEJ716JnT5cBJ/VjjCwe9frTqwKRIzg19re8lB6Y/IfqT3udj8aqFrDI2e/Ce2MvN8fIj7/7f+k02yOjFFD81AF53OHtrmQ5NM9vPc6NVinKtPuzI4e3ufPyrr5MA1g8OB8GjXqxM6ic4glwto5GsFATiwT00F/mTus5hDSVV+3ZfFVCn3102ul1I95iYxoy0+qQZNNPB+1ObhU7OFMNjU3YjlR/bFGJHS5hDgUVSN7emjSMCCDfEtEarD1npEzBorUH+vX2YLXnSLdQpJqHTY90FcmIWip36xhXC/yH5++eHFKJNcty0v0+92Q89+iXP5PLQGwpwzbxTByqIV2tOfhAJgskhxVeOv91VUytRzXAwH9HUnuRRocpXXgX4O0RcSX1oCq1w/A4nyynN0RzKnQAAAAAAiOm/L2RF1QXRbfizEz1xaAEBqN/Tq179jPcJX5whNWKisK6NupahY631CdvcdT/CXLqTeIzL3drkC8pAYqPLie1CRV2KyDrVLjFd6EvJGDj7KNbhtvo6ngrITVH6qvJ1GERzL6zhUUrdYqfVJOFvydsrtstKUHNNXpmNt6OtvNSffglVShzB9r0BrCdzvIEN9OtbksGEfUDMqovLZ2mYd0KrOHK+AKME2fVVmtBhLgUs5JTufhzube4pGDTwcJUo5QSuIW4t0G1BniWH0cmWHneGHiFeHcTxsEkoOt8byToOwCxZLBRHP9FCB/GLVvNQznV+Pu7S1/BAmbu+R95VBXowv/j6bQGsUU7vOPz7KAnYBSdFIF8AhKR2JGlBNFjZZEToCDDzvdUlbgXqa8mhDzwcGOB6XWfjdTFulFbM2WB4Kl1yyDoodjiYrqMmR+p2DsCvzu83kAZPBVx2TjKwosVTGpYbNstxfxAwnkQN3zQSanFRExqmMnuiM2nFVMQQtO/X4Wi5NjycD1pssn7DoEoQtf5I+Y6/liqVpcdSRfcoVHpeBWizdRXPygmHyWW6XsV9labdYk/SjFFNt95rd97DI7XQLYQ5kJhGC4D53W836tiBQW9IhrR1nio72xnG+vHwecrol3fKN95iHJOKxFq5yeJSLWUza+Zxw+DKvJswpQ2yxIm2ijCSJrellkt0x/cebxmW7qoFLPHwr/iXx4OG0Gdy59bRt1n0wN+4uhYDmkp4LrbwpYIfIk/O9KH/srKg18ZX3F3TgDZceEMvjy5r/kb7qaZWS7pqR6OaZzoQH/69I/oN47jeJNe8cVLOysb927VrpkqKWzy8wguJITadg5DG22yK19PZJQv7G9mJwipNHxqQ0Nr5oIV83M2wqk4VK010wDUf10e+DDRSKYsUaRjJ0ZVqasZut+Gd6rDf6LfQ7NPl+1z8ke4jhquk86aKgj5Tiw15G8irpKl+ClrxxQzcGLwPxU68foAh8Lewn20eAlRDDLYJ0/bjdQ97f0LXHkLiom/Fwrhry2KJEX0UoHbwbt7hD0D1AgFfIb6jhfStHyKpwC3/vL/DDLHOrhaLJ8h2U/JlBGahFgT397VvqTe9WhbnD3CtMa/RJpe57JNMmN9mgwzi9zQHv4XAwRnu3dnfWMC+iRldiHBb5ua2Cl+yPoz0Q5uyPUhGbm4jZFewXhbJsRQXuPIiOcFTdMszNNbIKgJL6gvFZnWt8kofSX3qCDKg6NGSNNBR+TtRk+SVhpBqyuVBSfCtXt90lY7pDmQi+zKlxN7eyPtIzh+kK/M8kBNCXb1EwtjY6aBxw5Ihnu2e1I7ohoWinjXGhKElowxQs8f+EdyzUbk9lDxbkKR2tLiiqeSzLGHaQqDFrBN4GR7iFtFixiKknDCPW+8XRrHpqW9siNqvNpoMAUtLXYyV5LCOSVTPC/3KcLHZvjVPRDD+Jh9VvCqSbESZwnEZVoaOiYgRVWSTfTTkv9+93DnCJ4OkRJiv0GtWv4KcasyTOis/hXj2Mf3MiiQdB3Q8PNMB1vKj8293DgCxQ9cHrwFs3vTio1Wk4Kpq9Sxuy1rTT3htqeXG35jglP+fuS24/7fff7g8oy/TBtvdfVS9XY6/8AVqSpmieAja1IyC6lfWIG55MKTL/3DzEfN2HRMV+fLTRr+HHmsQXwwIerkiQpKrH792wOZTdg92RIs1T+vur3krro3P+dmCpmHBChTZbhf6NoKCXnGrHcq8eDNXfU65I46Sm9+Wt4trjz3DMDhG0N+ABjsJcPPYoJgtxts1V6eD2yyYornM9fRK5XAXoq1RSwEgOxqLQfgkj6nHyNyP1sJD4t2GsGuIr1iwuj7A92MpdCG9joMi2DpRTzQ8MzpVDoQYS4bVRNuTt/U0GKlOVzrbsgEC6NM9Im7AmzPyoI7kRMttBkTkCAwsT0CCjXQ4cyXhy1vhU14MxQowHeg8/vHmAE9qiX1vy0QnSI1gWyJgflXojRvU2hotBQz1Y1F96KrHVQ8tua53wFQ526uBxjhqjxpMuW5RFeTfgJnRRY54PAMfiws5+WXsZBSiYNWVzuZEbyy7kRtahYAbkFGr5L4kdzZ6z3mvsxWeqFpKjONPTxpJCaI6T9g4q4VbASb3aQXX7ffggWwmDQeuUWeX6no5ye6+hFss7E8u+1fzAmIUi/6pQAHikU+EIjcDcIsajvtoVDrcZMuW8cXxaHrdHfMf9jI6BpcSTV9WvsRikG/KGkcls0niez8vMTj+OJXUBoZTnipv7rREPcwfbR7qOIcGEtmseqlWJkX54tHzyN8jxhCulFGFMrUgBkFbTU33bYi447KcF9Nvn8YXQfzhyEG6tZtoeBpgfwYSLH/0D+qcu2deUQIVrk4HZK1PnnH/fUBNhyZ3HccIwyxbWWEB2+SzDPYizLGY2Xm8oEe0KBcU8JZ0DnsH0y3w2Tt/SUt/jXbSrMqCP0MQysZJUSYvgGY1VI5/eHTyv8HgmuDuCeYc5k0j1C4VO8jqCAB4MpYaPXsVIcr98v0BpNNSSF/XJ2DyTjMxR8mJmuUqAPHybRWEtqbRqoZ1Ve+eabB7Uyk38h4fyRUnrh+hYM3lCRYwc4Nzsal8jYra+k0DeImQQRHOB6Qv5NwZuzZ/7CEWFOhLQGfD4vUvD2btyUBtxl0C4UEF9BA5hdjnfBP9rIegvyQrcxiDNSoCoPnXpSdmEtTNjGyR8lcsPf+Wv2axqu10kx3oQOfs+KcoACrQqa/xayCk//JoU7ddctGAXm0fuUFtPhxBHJKYg1qAnG5rIb5JY0HTzGoB9WvAuG8NB9iTO69px0PlUTXo00HBhHfUaj+jUhcXKudjGWNjtKJ4gO5I+yn2r/lFNNnIYarqFRZAAAjleEbhVUQx/OrYq+CipVPD4pSEE2uxE0w76TBmp2xS4zzDW/CvX7vkjwY4OoKi8gnWQtkfki7GKkLlPE2tH+CFE8574FpIpyFzxTpyD1z9WERS3aZgC745Dxm7xbm8U5eChNzVHSYaiWUIsLFenL0vNLwHViZsoUiao4MNyLdRjayj0b9n0IszmlHj1d7OA3qakGahqwcTgZ9t7EL4BGy8Ia6sBzEwbXEmsWgy2jd3vHkGRmTI+Nt13fZ4NyP8Bcr/lPndNRRL7oMXGsXw2QUX+/IM9fzUxus78EzIDgpaZQ07BCBpocOo1SOtts5xvFsQSsJ7HGl/Yeiwr18bcWoRLr5LfRna38DiSqdk7/nyQEIUfiN1DrFF3JUQpSnJ3+XbHz9xjVIOfrolcnLu3yOnmzBej4r5pcYTZUe7nnSNsLYzrGwu5kOl5P8Uc091xYGFW9oLfK33TW4SsTEmf1fx0/KqLdFkL1hk99hNVQMnx9TDfsN4jWm1PLi8ou9TThSlAvi1755Pzf4o4FJqC5Yjpaw1CVLdMJbBKyxtE+bn1B5TOyoTnPJSi2Tmclhy/GIHY57tvgM8ZYJwVw/SuSb2ZpG5/xmt0qv3ECfQPXNSJefHQ/+Okpw7xfF+WKypsV/eRxQj9RCO6Trrh31ljaRT/KEnJcyRvkWD5l3C0JR5AHKARvsPAV/fEZ1HMZfe6q6QCtsCZV4N7zwxCUXGHKvLyphPeVs5rgmpnT0ymTnQk6aZvZ39nTnE6Wu8Ej04tReDr2zOvwjCV64pUkdvcDso0SEwgD2iqFuPq/VVzZHP07fjgrp4362yTBAzvDYBvHB0lNem8jGfviV4gDRkyTXjJTwDHmyk11tiNuLwC7oNcTHUtuqEzZD9cRB6gU52JNDm3Bn1B0lYVBDu8Cu40oSdPyNcVVLLmxBdcOfsAAFJeHfN2dD4dRr9FjrOeWvHA/+6tf6HJWmk75Y0EzuUqJflHEiUSNONE052AEFzwh4bgyrdqcBADHm2zfs2wnHl+eMWWYehnwPLKV5TlFSOC+zp1+97BAtB5BihS2c79cDxa+r25HyPDYoCwD47VBJta1+PIBwpdq5fM+fTz8IFy7ILbf8qrWVZZr5LaHqm+GlDpdZsut1ODSjs0oz1dsYFlHJZEkOxhvn0k+k3F6zYHioq07lBODt5dzb8QWSU3iPAkGqrF8kZGqxTNM/TUER303eJprUNaa5rdl65WaftNRHbID/znZX8Vuc/9eDn98ncYY+AD8585TghYSU+vau0hEHJ8WxBMMqlUKUzlQlEbRSycS92fSeR8hopwWrgh3ofHzF2YjuxeEDo3jBijciCumsRml9Q1hswcSBRKTGE0H12nJdjDTQnnMUFm+juTvp0TueNCgpK7cUFR9+zdrKrAzRM7d+S+lJcRtyWNXWAyMjQbhtkNaGjs60P/4Z609+ULqK20PQYrOmvANAG0GoKoYFfd4emzLYpZqQpixy6ZhTSc5uDVTab18nubnBYEIIZ3brXoC8eclVuHs/abJSveHI/SjuQSq2OyYhMIfoYOBJPYUvvA0cNSANIYDYPvAGCaxFgwrlha12enLnnaf9i7SQ12beMt8YM5xmLRYm2o5fzwRF7Lldo7v5j/oqA7mkQMLMl0JArrDkqWZ8+ZukF0eIUV9nw4ltf2U1nYqg6iZuXriAfgKu4dXo2yNJICc6Iq7Fm1YAuhdHGZA6PeqN2UYrExAN8gOHv0oAkA+3lWPRRd25luGpnjh9bD4pKuxw5MFKchZ9Mg4zKHqqbvUXriCmbcEno/LkuEg51a9uF8dbLas8EcOko7wB4EBlCij+w2tRkepvygCGWn3xTW1JIhw5P3qRKtDWKSaoSeXUOamVE6mCCeI84gPlhZTp745kKQI0RR9STgCA+c8E5JAYdt3Zvd7d//ZhbyadOzDjsW3kaiFheGU/R+HUF3NV/30UPcBlyImRcUDJT2VuZrJF+rQgiLiIHdZz7bIFZ4mVMepduNFBHRa5qctkYVTjZpcNLgKZDwI9QfiXrXm9VBqixlVr2Cgl9bJvqX3E5H4hfEKbRQ+hfVL/BghSF11MxQeKSAMigs6F96moGUSqufPd3SdJJzTJPKJGZkqTATfFQVYh6ut7NhGMh2v4mqokJbwEmSkt+p6u0iEQ4Y40ZquUp0uz2jfheBO3z3UnWVIyZBoIljJebVXEU1u/FpZoihTRgudmInA/BD8I6cqF1waQ7JcxZaS9O0TKarlLJOMHhS+Ihg3E8Fm2hOaCUyqkH9lUixjf8CVPUT6Lw9+m36A8lHV9UHvqpHR2bbMfa370Gh046nh7Xc+mMyH4lgRbWtLNEZFH2ga6r7nPJWYmnEkqnbpD6rrfgp4RCPtG2unIfF0+RaRh03vcVa1CYrhl1xpN/9zy6XkuO8rgmJPNyDeJAzSM4hFN+safp487wSaPIwq13V//KWKSsyaLQt8Gc38APjq/gss33/J3z965Qwq7rJhZaB0jSqqXF5f5oxx38m5q2CYsVAVxFfrt2h+ypVSIN24Zw5Y5PZFJbc1O7k4qVNqYPlW617UIyvfRGj/lC5hTuYblxOzoZOFeaGMRUaRKy0MqeXjHiXUTsl0BeDu74kmeIBXGPEwrxclqjADNWN6OZCulEHmRhMwx2gdyAJRBvtmTpo//1eGgP9u6ooSyioCdht67Do4sKhYfwUOPEudTaRoIKN5GHRN7YdU2Ry5Lziu0lvGsSlrZdyetwRuVBaw70rOBrJsYJiWu86EhcmR0tI06MQuK83la3uMSKWxQSJPBbCjmrwVgc2/XwYE+L4/II+IwrGgWcQzGzx8lR53telpoTn2nVNd9BKroI88fpXndXKQswvkjwh0YcaKFOUH2/4ApoZbG65hwGlfDiw8BUYwePxYwinvhuAkDQ/W2PyEjmgq5sNIOyVOH/xf8VX51BaUCnEpuDuyx1nO/ZQc09y1moOMADO0eO+WMzJt7D0y4XUG0e1sJGVKFCI4/Nq3ltONtnZJT1hfeczU/abgFxvmxSNDUS+P3Qk18TaPJAHIH+RIRLbS6h4fazJbvlDHWg9bRtp2XeFHDkTb+P4itnbMFRLKIIpYjv2BOIgdMiITKYdQhA0MIP9+G1qdtrDclPWUwJD9dEbDrVBMgIHyka2d3BH+I2L2UW/0/TvTa+YhRjGviQl/qmy2Ka0RdpRHpSRwjdB+aoW1EcC6fnQzCdKa6O3aXDvwDOn77X8EPHwj8GaneNBbYDq3UNdq4khoYlzcdLTscmMaEoVzObFgZC/mLEePOSzag0/j3NIJqo5FewN6O9JEdz/PICwlLT1mIdMj4NrY2CbUpgmBj9AsCvAPjQTOW1rnNk62I0k/tLvr2HY2AJjJVwPUhY4mFMlMUh6GHyF8tqMVjmMyXRXB+WQTD5Wltn9KHdzlKO9zJDWSqNHXCNsgKdK1SWbfgnOWniR6nJTSZuTMlFUJOtLPB+wKJHV5htG5j4jGd7eZSfAn8CLiizNeR7amTXvACMZNDLoICPqfdipk/4WeRYCYpilO9Y5aF1cnVbYAsnDHl4/wD2Nf48TfyIBI9jN2dXQw+2MUjDDIlMlMYUE25/3O8Zum5gO9qWIA4fMXMh6/liuaJVDV3hBY7eZphlpiOzgfU4rslWt9mkkQ2wy5rUgrm4FE+K7pRTB6W7eku5DtaarEjcvAozgBLz7+iTvJLG3bKN8C+8GJM4eDkQODiN0QSv1kidvTBFWA92ArfQXofOKMKI67aVHVoDSIWNHdS43WCFIY2jpfNFz4l4MTiwq5uQsOlGDnzP94XkP9zkStoJEh5+60OhAgyRDkPnEihb+YA0ckp2bfCSR1B8Ia6YvBWPKjcLCYxA0kzENcVxRnxL//AGLogIPqaeWJfDZUsJl83UgkiD5JP3xCwdpoRqI9/rweKDNnmnKspSAjwlYxt7vBFzMTW2mghZLl9RxRJVOTUb/MrCwO3A4Q+9Au/T/V/Sh7/jv4nXkt2gr+ltkAfe/Uq8kDbjLSN1cBkzNDr3Ag5hXrw7DLutv+puzWrIueyJ2elaW5L7R/04PMax0SNodc3uMVpklbQrL0A1gA3Fl+BMXhGe9aKvdT69ZB3//nlwscz56sLiSaeh5N3FdaSjkAggBRO2AkxxYrCx/xm9Y7gQwB7Sge7tHFDZeq0wjHpTEcipWXMQmyiaR8BFN1ncVw+c0h4a1gOyzm0rVV7bOVD6FpyH+wRFpQakTaDcwFkXorWPSV2dXkfwBK+JMUZ8C2IJ7aZpjd/s5vtNV4eB+vZsZXJ4/J3wnTuXz/nsI5qwnWfsh3TugdbYQYlrH6ZBACxTqIyALDqwlbFZ71enMv1erbqUARl+NF8/v1IkTsEs4f8J0+7JyRq1wWfm8P1CSxjCYEXhunIpojhRFcOvwcMwMWuy2ucTWntQ5nKsvvl+jPH+qpRZSQ1hOulnfvO9RDNyX6B4jrjRqLidom/XnlOjqXle8KR0hqM119wS02Zf5T1ei7bE2KoEz52D8hbM9cAhuqm8LkrnzhgoAQaHH5Rj68p5y5ffH2pvV0qDBIQ/byBoQR9LZJ4y0gEviDlSLJoXCSMUQ7VQvD1KVLHQlGy/MjFMZk0mbtyK4uSL2K9NXWnUI5KUod+ePilrRDhxLAelRRNyAydnB2iJpLhoIzbNc7x6SY2yIGt9ntX0y8G4XnlRE+S7Gvv0d/9bX39HAjND/nSkvaXYlBw4rOF/HovlemXFgN7nmNFx14/O3DKsVZI9KHGJNIhOSPXrfbCTWlx3bywII8yfkO8/BC6NGAI1mAf0FwzNTE7g4ze4IGlZH4h4h2sfKG54fxkTDFqBd81ZB5zkeR11+acoUaap33bOoODy+UQeNBoYkKDr89eXjwCVQO/qWnSvRctpst+Tu7i69AFChPlI0naPj2+YZ7Qy5+b2htYpRapsF35HII/xg8DSAv5NRmc0rnxQja7wJRRE2gzv0dOx6azMM+05iBveOJDZUdI2HbiFZz7Tu4MbEVTfxi6LrXZUuY8ghafgmSkFyHPmh8HwmonYEqQd7wYHnv6jVPWGl2QUURLnaLgihnNmXS22byoRr0Htz7GLZ+wproMckI2SLHCoUdr6KHfZdAIhUKyLzVC0ZivRQMONJnzp90kjUbsZQH+K+k5gvxg9WQjpxbwbyi14Ub8YsiZjZAlbnKoJ+pleWpeZF3KpvXoGK9HLZy+hZRnyps5nTbq3qWjiyFItfh+SiEsS1EBEVtoCpdIW0vhlDEYt1LiYCMwKsWZRZxT61c3CMPNGU2RCtq03C4Nq+9jWwJSF3h8h2q4P3BFDGAje061GnKb685WMy8xwVosDUFN5ERAZnOBiJOFRVlVLQKz1OtNEGT9GQnJz36dqLN8Azl5WNwrT6lkWygcT/xADqvGcndHy1LnrhO84gVXrcnut0YgNCs8EAOrnImDkk99XDF7saATVZrtov/bcmldva9xbdLw4TXxlXY9uUujiKvVZkGUQr04d40kFTxWoMzZVYCUkZvhpVFhGn+woKGhGrIRL0PyeNuK84awqpZVujwkReUjIXP3bAnHDJ/CUVXR4Z6FhFhCG8jX76SP7gyFd97mSEREfYKV6HRZJCEwMufs1NeADA8HT9UKB2NlnK7P2BgOoUimTdfIO7Z5csgnVKizeCsN7aTEBg+GWg75KIORDfY+VxRsiKd5rv/2A4HWHVD5sKqZAhBYRcGjS/elf4eJH3n0u0bLvmTubgjfLm6AihyCX1wI/wEgICLA8DVpV+8Ixvj9F6Tv0EXQVSC6shBT0Evz3Jz/cbTHQLqvVylsreRDP0tc/NOjZq1OCXrBkx4gumWUk+56BFV/P1Kc8sJgcuJQLvKX3b2OJ/YDRV6wcRLcKvCOx6i6Kbi6NKacoKk1FxkGjV1o4l4oVF8GNYqlUrJOt5mh7wBVEZdMiXtrnVg5b4og5bzTHpU4sP8/u91vG3K0bevPWTDw7b1mHDxDB30z0ZdtYKrUxNv5zUSCpwfBa+lm+Qykx9IH8VTUi3rHXemWmIijWhxm9ypzhU/SWMcvVbMh+UFTjI1RK6iTFnCGdT9fp9pVNzrKcRQ7bwMzIb4m7RI523zU/jDGKCIxyuRzJnrvPMv1QZWe4paWTiP6M0ohqHJ/CHWKhrrwYUPUbja951z0CFnKCyNOh9RxblsMWxr9iSgX4EPISDgLh/wOCrYB8/U1x+2+WgYH0869Qi7rOq6dANFaqvaZDtWCbAlgjVKql0IeWtd71aCayJKV+smHoSxoycB30TLVxyzW/4+oqdzOVbUWZl0vQcIQ+t/AiKr7q8KLn2K0uSAPzPxnYms2cOkMkeECup+si0LqFWS7W32d7pEzll7vKxdlm+oaReS9dhoPF9lE7lQ3AxX3Kmemrcdgusf0KCKlFIyaTpNJEFDemELAWmQf8ZB4HrbAXwhGnR9Qx4v7x2/QGRryqO93fDZn8C2M5Ifh0uz9x/dmmpBNe7VJbt5FBXFnDp+YZjhOpNJ1Md6q+5C91X21KIhz53nsdQ188bYYYW2Dcidhb99dIBdWPKbdDwaTWA1aB13VXP0mNj5zmM4SgFmWaw4feMUlgFLeKzedroETcACht0N20KqeWZHTNIbs1gN36BbAMx84whe+wEIwrlDyfbBbc324b3EastxvktrR+N/ySIctVrYgtrcEkTdBUDvZ4kT4ksZOD9Bh8twq61wVkqrd0PBcGyyetAPp8cj62yX1ILbXC0Lg+R91944LtZxK2/J5w3soDv3QfTD+GpsilEx2B1IYNoJkqhfjB1i04sZPWWIjC1QaeC81WgD670zhcnbYZYMd47W++Esl0vXPID+TnYKZYMWaVZHTgExSRW/dvbjMG7QEjaavAQfilsqptrG07JFOjLId86lCnbsU22Cuszy6vnLo+HAP9hTIlroLfbaWiRc4++p42UWrauHZbIAGCOCbQOeQ4JH/m0iiaBaPqkMQKpZtGOkHE+PRD5Lv0HZ8kcjnF+bHoDig36p3TU0+Mau2BiH9MHOLUmbo/738vYRdO2N+puif3trLo/e0FpzpIXt/mBoYblA+U7MSeVslE8p3VC+z/DzZDEpRZ0oTbALEFDqdPhjOUa3tQl8AOQ9sp19NmZUYZMtFlqxgSwkCVJxBwhkJitJQeRqkskyFDUdj+ZGLS9iLc61UmQgmiF4Mqyn+5LuDMVCNePNLFXvC6NLXXONzon56g5F5h+r6+Bq6hNXlgvJFUnxufXPl+PPvkuGXbqzVbBpIP4ISKAwGTgdi+ZjSf6QCMOh2K7C6xmQHPVGBzkoDhBqHhU9Ofo5DXMJ3d33m3YlXUDvroZKnrVBmnP1HmY2WunDMjVppFuXB6G0jvaj7db85YlDfRfUrOyfzoXo3LY9zl2rGmBzTgrUNUEvMoSPDEQi0UwhvWGohyLsdfTn16Wk+Sscb+iy/3oMkM+XHDMxdkYV02wr2OnoDYkn8egoi8cU6fTqoxWpuGWAmmXZUHpHAdFBCG58inrL4d22F+v+hGRzsO/XJmiJnErlnnV4VqUafCdo4ppRSlY3Q8FVFGVZpFz0wOkHF0dwrRFTv7gmrXY/Idiapdo0VZQjKVDr9DnbAo7e1F3R0c55Kg/LnpsJ/JNbPAeYTNK+9WXrB41iXBvwNjqQtVQdkiivgoOABkLhVonoehJoWiChsHPNZwh1fPSOwndRPbzZOAhDy/i+FH5MPG2lCTZFtH/C2ZAgRAl5uxFiPB8l7bB2Nv6pyZDV3fy9MXU2LE4tZIwNo/hwSG0UnbTxIta1huU5d8W8sx0XbMC1GnEEHFbxxWIPAql17uslJbvl3iccXPdV1aWWRSeTLdfpLA6fhuuyG5LYr/0m1Fq+mkCZxpDiHs4xjZzBfYOcpK3V3/JeR2+3dwKeBW+4jg5LNlDb6jw/N49w9NeW4k1+RGMqXOYUVMW9JVcUg2KlR7csdskqFRLoPp8YTVB0tDk5fZL/KpkR+xDdHGn4y9MihHKHxUNx/ZIaA73Tjdf86poKTYD6k+X24ByE7RdCwP0bMbVz50qyURB60Q/ZChj8gDchnVkXAweFsNgbGztd4XuGpW7kZfABlCdknV5+pDwTxgBWO0edKs2r29O4r4slRVPSBAN9/QHVrbdilWGetSClBJ6YqjUIC10zvRSxByua1P0Kjw5D4w4CnJkHGtPfxxXiKGErKEt4gwbfm2MDjJ4n/XuH6VzBLvD3cPsnGvLp7zm44o/Znhk6Sir4QIs2frWEQqScvgEF85DJ6U2lEXcXZeLqAuQxmMw8YgihRJKUvHGYbDTcZemQTgwizqI6uSJwars8yzPdW/V42Bp6KE+QHC7YZXgW/BDiJsNEO82uFGYNbff+K3+cSSiv5riKmzQc8OeHOPJMNx0bYiSQzZjKGuh//2Osw4nkj7wm6p5RCSAeyMwtjbkcE2y1WLEYuamIrRo9MBvgUuAMWPNnXeP7+SenSbD3uCfsXVnd3wWzpTgob8ubxb/rgOQI87wtgqYs59stV3VRFGKRYlbah0wEES3V2nvzz3hvmCyHKJTOSSxxX/WeRUFqLrSdZc9EVV/tzZIH8t8VAYk5UHcP8MKA4GIy4rilkQwGiHSMGOrg6vOFxMKzsD+iMUK2VsCLFKEYbxl6rrMd2Ll5+G52LYovE9ieCoc9kGJHh9CMz013hkzu/uKPFXOBaJYiw58DbAV/h00VFR4qOo8C/QNXlg/LMbTp5P6a1XaVs2YYg6RzjI5nfgrM90a0YCHY+kkvkpWPzuncUi9GhUiwQsoFZzM6TMWXHJ9q1sil3isMD/DuDXTVj4xSIBJK0/7l14hXTKcR8jE9NzmQ50hbllME4Ork5+Xu8YjQHsl7XZZZ5SWPEa/FqVz6ttAl07xLxOrR1lnwZwICmxod2JKSlNrEeAky+8vi7K29va+JS2OpHQSixif/lEnkxQtPZeZme+xeiN0MB3Rr7s24HF33m2RRGwuvfp8QgfrfKaAiAmFcAj1te+N8mDUzrZpkXole3VMLG+ptwrv8iccQA9PEw2CIS2KUGqBi7h6mrkhu9yZ1DzmIx2DwfF/ajXzH/podk25vHpS4qqj0pcMo2/nKcPf+5xrNJBKQvHw+aVm5OG5+KvIStDSeqEyHUASWdWVe8dsCanrX2B2RyAnEdD2Mi7l+KIl//DeG21/ZN/cFsls14eIy31Tz9XBfFa4+dFelGWwdF9G+a7E4QYUWDR1H2Tmi0ZyBDJaQGKXhbh3K7jIp87jjosM3JIa2iIzs1zvTPnwm5olkvP9y0H/tkLwmG4gZF4UgMv9NY/YtVwHfbXeqIkhj1JDJyxkuTVIbj+vg1b5Lwj4p86VrsmyVoB4vGhnY7ue7CNqspqWnY9xBMtZufJczj0+sAqD6iJEys+FKS2VhoCki4gwTacXo2HAGTrNg1ApCNISJZXeBxUfLrE0sGzO9Yt76Li1G+SXN34O3Z2Nqj2uo2IS7MNziy3zVuu0qSlrWdB9NQqmTk0UEdpaiQEcVEfzycjFk/wnqCUUv3GEawuJ/ZqettO2Fnz1VfX4sQo4QuqOZVW0KyWiQtkC8uzbu74hgO/qXhaeTaISzTOhkk8KQAyb3YWYcNKyqpeuUp42Mj2NMT7ciXkfBx94LeO7AyTwoxYTh+bRvcev/xSTdGmvBLia8cHpnLm9vX4azw0KTgq9Q5aucNGWTx4tGjRTOA1yWciLtMTC/eIfz8fKgWADljITcH52YMCg80KmhHk0zPXLOa+dxttpLGzCQAqH98nLaUzOCUsELm02BaCdYzZMvN0TmazUO4bW8eMpL1x8xIUER8kmQWXOU+RK1/7DphXD+J80E1ih9hWDgQQuOVXi56mJFAkbM5oZlLetkLrXS1ebRMCjPcPEn+qnudPVCuv2jABAHXOjWhpaga0f/Rqo1jGI5VR7PxKmvCvvBcEyMv1YXZay8jnCm/WJnmgQpc6i2HUtoya0dMlAmHz7jbrk5mOUqFiATAmmevFrjjLavr7v3c8oIuBctS0QYna4Ge5Kj4pqj8RZqEvp2+2UNay0MiM0QvZEuy450c8m/dUDH/QFXOpqfk9KIOPSUWrfv8cb7cKTG5wowHSG83LBjQn6RI5Pm4uVD88zeYHch3A25lo51ogbd2HWKxCv+ZL4JXWUue9AxxGw0Kstm91lKl5hC3wjiU1HPywgk5yEtMPB+rKL9njBX/3hGKZzjvjuO9MzGP/6e3DUBBpkZafDgfaUNnvDRt4O+z9fVkWMJBIksj0Yrb+eqSTsPiO/z0ehvNUSosAhU3k4gg4w0FYM9YTbMMKMuCDX2aJ+qcXaxGSfDhdic3ckdtI4MM51T0vpL7dRBAqBwx6gNTEIUnx2TXSa1ejZumPKRM7I/pLtlIMPxW575I4T4qLYVjVq2H7nolZoyLp0QaORZZz/wd3npSYIoqETmrrWpjlkV0Gv+Wu1UiaJOMpZMjukB1SOfQmR9lzY6lGYbCK/9ZT6WmviKAnftw3iQkBN1LRFcIoqWfklznXmnAGTeJf8IcnZhFfSARMh+Vo+Om5D6dnEdoSzXyOEaDZVcahVzU51RFtBLhKrupXnAWe2O+p9CHMoyD1r7inoPkT5ek/r4Qk+037nmCeq3/sO4d6Lnb1poMD/BgUdmC3uLblF2uo2yJegicoOBXGLhqUjgw3ChoRx9ZHmCCme1LrgU5F2KPX2j/ITjzzRe3dmCUjUcTeGHTQGjWTH6EXjFCYVNqiQT7ygGCLSqcdS9a4YbXL2rP+E7GTopHK3KbFpHEP2RhI03VWEumnP4fsn+iSRkuFdywYWj2Kp6wSd0o6s2cDAfEoX/OWM03Bqly/rGAecsx7RsYvsnM7YrZreFg4sxeM4s0NT8kY3d/SWWwE7Tm77ntvhClzp5VPS0MwGN7cUWeWBQGdwpPBtVyzN5Pc5CentBQv4mMp02/9czAFWJIxu4nAWGYDDmUj1ffvN7qOzq/Kd+SRkLxXfyYoTXbcPbPjJjL2P/VebWmv7Uymgm5CUSLOqoAc8Y2VVk+6zhzQt+L6tRCw4sG8ex5DWnOVSXNNwMraD6vBrwHSwF6PGWAaKg4rAyoxHdnE2puQrNqSNWvBZ5N9Oq5e9sGL7NBjapUKV77IMqnxNrVcz3a3HMAiVRmhKlj4GabnG3G2ZTY2y1/Bzp0/dRivwuxovy/KqlOjvqg5E/LWyBlaBVz22csAg5WzhdDceomxNppAxXYfTdh8iyT2PgeYmpwBZHMwp84ID0VGALZRtbOCCvM/tVn7AyZ7ry30h0pRcBLG2CGjBzAbQPLHLFbHXNgTXlmlLYYrK0r4yH4c32etMm+OSKxmSkKt6ubPDK9pV5HtEipok2zpD1ceCuJWPlhYdvbJ8WlfoyNVAfAZQbt1d8/1n7EVUMBhVWf2P82JCtWmS47RYmS4pVdkZnhfJPV26Yi5XvfiAUz/VbLtie8Ok1eT19Bxepo8aRFHp12MQ+pqO9RpoTKbSvTSuBsdyDFZtuI8eFjsZdWzsUtfytYOz0VL4WmzXaXu/IjmtiZXIkWqJx72ba0RpFiRu9GJmx4PvH3bx/qa8DCqOGQ0ZJNzi7zCQo3YlScC4L4YZAkXliGHErdPTLoU6q6T82uAzanW66fD4fnjrXgIG1diqjQGsR7eWUlJQthajvqGNTMp5MpY8pXfjTB/da0SApZObgIsOrPbJPeFrq9qo2Hm6+sk43vWpiL68pupLeIa+w/MXiDa8XwwmitR2L+f/zHob1OQDS5qJaVlAy8UC4MLYxRQeMtb1Lb0TEnInp870eSGiTYpay8Zqpq9RHOGZekw3oNjHiYBXwc7arFqeqE1hhFT6LMd76AsUJnq1BnKNiwvTxaXuAKUES1Jv06C3dH4iIFr3rbQDR22IJ8H+cUjRI1vpHkDvCqH0t0klm/zO3e7pdt1mPgnshT9fGZ02jF6N4JYO9PhMOJb6GRZuL2OBDYjSgXWlwqFT5e4fPvdK72KOFqqFVCpPLLAsC8Q0l3qmUDJ4iHw2SIHFWOl0mbJC6z82DTYSp8z9W8bAp/pfCmL//mfDNY5LA9jpNS4qvRSaczaSxUeENP0JQU+WwaqbTYgnSXF9Q1Qx3rITtW2Q/Wux0FC05bk7PJmgzmCpxcRbN83XQQbRvQaNc4VkO01Xk7xbwBFKgD14VQign3pyA3oeImk0XS6g1pbHnOo0X2rG10kIzEFue1HH9vNAHOSxak4xDiHNLG4AcdrpMJygWEHYnV7B5yifrb4g/VsB/V1X+D8Rp+TcgDL1TjQbiKE8GhvAmiGj23IyGaZHDpvkk27emoAMns559DFsj89avc18b4jGeG9ExZCUheZdoZJSWNan83fZF+Vg41yCX5e2GwFLNIf6IB/tkW7ALc0b0hRI6AjZh76Sa93GX6Jawqs6z2r7IjTxEE6/t+R/kEC0uGHcTCPXVLs4USdOKO89t284aUXW0B6LLs7BSHAvQzHI/iufk2mSIPZMFduyknEJvFwySQSpCi6trXZtJowHrncV4Iyyv5sOR72aB6Zp/vZFq55Wyydz890uwnZeg2MJNhggvVSdetJK6HwHiOt41NsjDry3Hsb0GMSjrUe1YTcOL9Gab+2LJrdeouTC6tqivTJTGtKzJM9ZNGVx+BkX4YmwafoK0ZhM6wi/m3/uH3l3YiChoVsxaXSPurwKwnuGAkJbLI0Nzw2nly3RqqUlh8iPS7dFGsBqPJ5ZxHIighWDrPGN/eM6FP0t7x1rZOzEaLc3LfQ6YOyPBC3i+77K4EQPpdg+0vGJOYEIwLfYul9beI8aUkeLU65OHCYiz4QP1ISS9Q30MAv+PueqD5pmGWwChDv+LYTHdNzVFNO5Ifw+FCuhPcnCE2S75xEIVfn1hYQip7N7hZuDEP8DtMbeta6fQ1H0/FhuX+xkHPfvrAvXjHQOfGOCYSJNQbotZykb4DaeVgV6NOPnfyGedAjeO6/dP/T6HzQhrrBDCAI5RxcWE30CTxHDQFjKr/bDS5n1ukAgGQu/E6xJw08HOL9U8RNbj60oNsuLJE7wtaroXYQmUnPLJtg55DJYQlmb8elT+oPqCam7DZ8Tc5TXvMV/8KP6EmlYmDtv1jmnaE/knntaAGx1ZjPc4dk2JeR4G1Tnfbpm8aP1m0sMZbuepyoZ0SbGzb0mUpDk7ZbUcNM1DdzezEQv1t8dT0x6L95h7HrHT2CVGOL+seHh9vjS++uN2GHENx0qbfytnI7sTiK/SbsmIOySY6+nPKVFw54E/nggAs2exnPxdFVO3wp025yDCetSHVfLwOkUjFEEi06aiCqEXmHy+gO4fHd9ZbsA0ynmczQVIIU1eQUqV/8cjKB3VZFRo4i2AU2uXkJ8nV9bKtHQfkCEKbn0oCFV9aTHXR/DFaKzaVM7LsJAxFOxLE0ewP/JGLdTD/CiAOuy2Zo9q171ItQKBalR1LGyhfc16ItNTmraSU4A68U8qbauvmDdlXh6FzxhuQ7gwEEVvsNB+/xNsy+PeXwEGRWRG5g21w1eqzG8XfpUYjc18erV0jbzzdiJNtT3xuz+JkrD9c37SZfAfYLDZRrVtRlrc0Yg+S/DB74wpM/uBvz+tvZBp3LeeGOpy+Yl1vL4zX4iubIhSu+gW+VQ7gh1dpYwHoEFqBR7cMhdVZ/c9MCmrM7ThfYCV/I/WXB5Ys5RC1B6HmGlW1xfcVec4FBRSDYNovd+rmWlM/oJf+oMhCyryEac6+Cd713brZqCBbYrMyCQt/4g7zoCvsEO83xi7CzBUkYaeLvAmM35578pLbLDx/PsO8l5pFYgLhXLMD25+nWnPju/9wKB3Gmpf5fLe11YaouD8EEqUk68IKwXcjZ6ku74w6vtgu6pEmNEoNbkOlFv2r9obmO+UFIOvXDDLV6BlhZqpUW2TNvgS4CM0rV9lROX0bOhZCrVcriMBUk2bMDC0h55zLcxjMVIFCEZoYwZiWNGMVR6sDK1UMZsydO9oiHJjuduDsTZCDsoiWryHpi5gk/Ukbn4pNE9G5kmZrIKOA1J/cfRk0ZENeJ+NJvZi5T3Kt/qkifS7mr8mZAhtZo2IBN7lWF3iCxZuYuVJGGAcCsCV7lGxAo6wZw9U4eS2rSwbrG6yEWHE4SdfFNH5yPTz6arWpGE6b3nN4tGrv8UsM+OleJ+hLl5PMURREkkua815IZUwmQ6TbS45lPe7U3X2XXTirP42kfO2M2OJJE6ZDGuE2Tnhs3FqaLqBD/EQhJzhFN51mO3kVHA9BiceqNV8WlkWcnVd/F68oIAnDh2JZG9wbWE0ENyiZzwVw9ThoUfyBnXN6rIYV1ZMwwnMCz+u7dETdb3x828KOEjUU+2f6I6Cs+vlQZbB20spMpmXIalDwHApSdejwoto2UPDPFqkBPYd4Wta5vXfdT1gj5e1YYj5vNVW5w/Zt6KkTVuB19wKwwf9itYiXSEZw2Cs4DypJJsl3g4A6gNF6JN6s35w0ACEMxjsdhHgYs2N8QEJaiLKV+W0oG0Ev6u2lykYU9tDqPRSfxcpLkQ4RJybeOE244bedkVMFFg/FFfqFxvqRct4Ng2XS3EDSY6EdrjLUojwkbztogBWbDvXrsCg6BqFTKs6tXw4wqMwgw+FqxYMA8objI8L6jd1M5HRBpGOu7kjCcFkJeienOgXL4KLIzliJkmdAV2LyBxH+s/ed0VZvytF7rgzISAnVMzjN6OnrbxQVFnCZ/FifVMgvaUdZHwbxczQ5Wm0/zmBjK99y6nwZb6C8FhWGNA5sAXhDSdp5hCeGq+w849pgrLPfGQ77g8evIhPS3rODH8AO1CR2L05PDgstxVHLJePNyj7rH5N+Um6HX8kKGSGUGnG0GZFyBSnGEpA/6WyBtNo1F0edaweZzTFqOZ7qot4S3tXdtpXx/SXcJhYU7h2iC7B7LX7uQm36giiqSyv0xt1qqXkDcih7w0ZJ8nesj6lcUj7xZSYvV5f/uvxvKalfB0M0o+Eq2AINN1HNsiPEAAzXJ/ohcOsLExzdNmzWjcl1fU2kiuiZU0vtPIv3hE30hPkt9hK6j0t2xoLrgyXBL+DY+4zGVisbucP+dtkB8ujsVx0gzE0JakHDIDmHOJOK8V+hIyjGs/2ZUjQLFngftn3wpOHWRhX03YswDUsbzQZDn6TzAUWD5/ly9xDL5SzvPMqMmS0MgSxi3XEoNS3pbCYG48O6dpmxmsnG/CHYA/Z7kmdkJsTQPKlQPL0SwR+nyRDxwRa5dDIvYVsoG6C0/BYXR+OEuPHdTkrBOqHuyvvmEyBrrHcF+QL0CzNzOlz63fq4y5otZ4N/m54zlpuewjGj4lKcdgznpuyowZjUqRBJc3IOHD4rQFffGz0gqq2TWXT9uhXvmg5XvRtj9YeFNKVbplbAQFvuqdwS7rMUP98DIep2Sk3jR2PCqIhSY+jH7RHm4p5y5dWXG0azISbnHARLaxGVK70462m/Y2Dq5UDYRD+quNl6frOQF/isbtFJwN4PhN2sak8sklWXz2gSOeLds+ZSW1O1pS5WWBL/sd+z/J5y4zqqqNaSR8Sl3IiIEhRF6HzEQE8oeJRMnZMJpLcmGvO7yKRSqAOA1RjtjCKhV+w4T1nI9FY4TYCl5+u27gOxgtzWS7mEjpQR9czfmbuvLA9eA3ZPLbPKPM134KIhFHaw6c0FBXR2wQ2JOvsONl+7jglU3LreS+fEI9NPoJADdNFfOVbjNPqLy/lLzSzGfZGN+BJNR/uReUkT+3kdfSRdF4mB4KpgM0fqf+uELiXh6QtUR1Gget/L7IOajNufNBjiYIs0M20CWHaJ4CYX6YcO5oZpGJGKeIDsr1E+u7zlOPwAJiycdnMTAydaH52g2JKqpeP6HJFfGriKWKOHf5lZ1nwD5zvkZybOGiKAP7+hFTgoeI11Xjqvcnw/NIk1pzH73ii7YGI3a0hjjKV2B2Ly2cmNshOMo8gNGEPLWxb26FQqmuf/k3pfzoZzMFJweRAsxpP/2WKB+ezap2NqVWxkftULXOcpwHLBOmFmAcWSeojuJocGRyU6GnXnnu6lMljsgWf1ZwUoUCfMpWSFGLc1SlwF8z4CNa6ZAf6rGxqF4pPRUYQKFyl3vlur/f0QWohw2mbpnRnIQtWRS8juIhAh9a5tsqyN19Cn750XLRNgL5VMniKo7/LhZX3me1Gs73f6mp1EO+TqQkCch0VvkJiKUPPRGvT3F7zgGkTD3OSA6evSy4+cAhQeGhBt60AOUVsYbSNmt7oYzXCBEYDqXtAg9ILSdC8ja0B7wh4cnGqgm+XG1EN5TkKe6uiGMX446OzcRJgZaFVFXyzs+2APueEf9YrL6lAFckyCsSzw80NH6kJ566DaR5HMzfWd17AnkVIxFVVBynHFnA5+biKXeWrU0iviApYCN0TaQa//Bbnb4Cz4JslmwLI33Fo/K7RbT5ptR7c5GEwsDGQrcE3FZKfGguZ632MYTumJ5tdHbmN0xI0BjxkaYccNJAZFpP8PfuGqNtx6rPjsb2IQGliVVkmZrTngR3eOiXzfCvmWcxhlGNQPCxzC3KGKuokCgKER58Zb8fD5AUljueGHAzwTadE8K3JcnPDd+kEETyFL2Am+Xaajqsv8jp5VDQuXZ/SYVNdhlXrR0BKFy5YKMrvo4vu4uBFEpGOcq1jYin0MfDcvJV8K30VBJ93jdu4E36pusFPWG2h/qyDusZ5mRm8kJYeCVa8NF7v30ge9pD3/6CEzXGAQcYVuoWp66aoss7zznfjzthR+gHg7WNaYK1x6I+JX04kgGjWcEUuw506+IF60COiy0TTyDo5PMRS9fwfdIUOW+53X0CF6A57S8CT5hKhTJiWB5Eq6OYdGLRb5OB0+k5RrDOb14Vf6QoM1jEC+gtE1fPbnPpztVwH25Hn7zKDARFXm3r/gbr/K+aknEYRIaE/6XZmDYHZH6DJD1eysHL2tC3mrPtFOfidulweqyy7F7JAZNWxyd7UGJc09TVgir/daF0tOfDymiqrdTBsNglZzJ8A2wuGz+u8Q7HCQ8DRj5dsCz25/t5FMZ7ONSAX6x2K5ryaehAZMRlnEZJqAgNBoA8q4JZnF9zi1GKA7WyvL1HoKQiSaytXHCgoJH0Dhf7frI8cFRWLXTSMcf57CUx/mXzt46/3KDlVi2x/Z4jueNTvatll2aO4KTpZUkyPDkzvr3GjHKQS9QDa2puuSO0tHuPQx2g/zNFg5bTs1NAwI0iWkcSnK1lTTUR4TOf2u+YnP+NssQGzrVx0o0IbbSZW9oeKpuKhMlnQ0EbwRInDX8/1xQjE6JZv23A9O6MQrEzcyCeYWBdgcK+3ydKAhmlsbVgPwPVIrN5imnuRPae9uVzC5yCqi5CZnD04ufH6Ii+/lp4Ab9FelKJJuI0Pe04nyRywV0OFiMJZX2itSO2uu6NlUAii1NAKEJCoHdnxqVbgZk2Ecc7bRUAi07zRzOGO2WbqegxYcTV5CgCCHkVe5+40N0/K3LsazjRLV0JwZP1oY4o/k5T8Q9W24izEJ1F0WdTylbnb7UFAhmBTelOJTMM6wL60NOEMVk5MrLHMEmqfnozAVc7MHvZg4wLuqoI17LH+gnULqAYG+cF1dC4kPc0G18R9bXqKJR3S84krMgwSPmGdUP8KFIlLPf3E7mSTuxOppANaqGeAfrF6bR1grwlHzuzwbsPLD1d/6/L10nTBUk6vmpsIy7xBmrfgmZyg0bcAWL4+jNQGXAHQYXk+dFvnVnVRD/+qhKNAwthOm0tzT5IyYqmFnAmQDrxSNMc46IO2JrWGoomRNS4HDWyC4jiEK3yV3u4/wAAAAAAAAAABRprCohoCWRw4XBCLuNu+8EeUiR8ihDfB+IyUK4AFgbGQpMlCdrw9dt6Mmzpb+nkdzlw0NvfAmlGX/qcYzA6+Mb1FCeeAPQBjKvFRNaywR7+civ+t09SKlE8crawidZsLHDCUYUV/Rcxx6Mx4HqROcYwM37YLEnVfvvPWxoqrxDuUKMePlIaMrDh2fvOha4sMmWtidG9g2gHNgg1jIheBjoURzecuztV9hmLCvJCldyFCywfmGq9wwRwKCet7T4jqHcn4/cRGp+lnfTNxCWDGQVhm1ABg6mMffC0HCjvmugAWFlDQIwBjalF7UZYHjnxpfOnp0yGvNmUHjug2UjUffiYtV7p1kiZ2dP64Ec/4yEFms9Yg6Z+l5ZW6PIiHYjmchir5IbJCiEaGaUCBG3sII1bripjbX96JsUH0uzZgvIr656vHExwDVl3HTTVEGhDkjc91JVrV/amCLXkoO7UWlkk0XMHjMU/YrJJvfYVf6VGm6j9lewNNrv2io+s9GS3GAskCfm0hGBkO15oyhPV1pdUSjG12PNlcfmQAS80p6p+Pz+sgJAlcV70niBdln4c9UNvfHC0+pR43YGwgJz2Uy8IbtNBLCwnaN5KVTWvFSbTDbIyctZxpoVh/mMY3xvaH6yo9rM4zFB5hdq53Akw5rQw3kv5pyZDiDWW+Sov3gVrCyU5vLMHHQSVJ4vxPa/10aAnlB7D7uGDazN1nZmwMPOgSzWNlDYEalGm4wn4wIAAAAAAAAABGsxM7S96wNStwAkl8TeQDvoXEuXnv0N7Hf8Q5Rsc+VQu3dIPk2gSA5fQ1NEgh55P/iTtNvgMUd2UWmQ20EWh85q/P5vJMMugkPD4Yz1a+U0hrtpCml7v3F5dYbiq0O+pDQLbKaIbc96PJvID87yVa5o7438bimT+33oTP5qG+G6pweK/SBUzX91eE+0dvrnhez/Ga1b9vkN5s4uEXSydKFx4GUes+cM/1g4pqsYzvAABdJvCMltgnAbmqLLv3vEGbb/2kVR40qUYAdX8l0D3wIpCebA9DcPANcOYssilq6dEumTx6DH2OxYkxYk2OniVPmcw7WwGUswqkhzQ/v4AKbg+rFghY/sefbOuO6daUEQC8xc6tLWS1o7KnBlKTNSC9rIntZESYrZ8A76SZ9L09UIEEuiHOIYSOjcmBXt5ixiguKAAAAN+oSjMleUGzro76YK4LZCGqDBdmkJocKRrKmdc7djVL9NlHhAKW3Ynlo+IERi+895fxOEMETu1yTrKcJNupBFgYXT3jwbZYIj6O4gDeo+unMXpIZPDQAAAAAAAACwUufp8PfwznCrR1Ej0xA8gVDKECxknVjWB6DianpdLQ0DUYV/6OQrSjTgZm8Ziykc8spccg6HuovS6WvHxogw/0XrpULr6i6Ks7gAB4QAMMF7lJrr/KWKNLJWHJJdzbBebec2GJPeOc/+0o6+tuAFFvWFhkCUyuSlZ0yVP6AmXI3KgFUvVqHUnmXxJUH+RoOmDfxxm7msWLFhl1Okr6mxvjKalm9Gafq91865wMmL76Z4vS6wJ/hzUcGmMfPqOgMo4eFNeFGDy6KnA3NB+upB0HQNAAAAAAAAARJClQf8PyR1MFQyFs/gju6cPX6UrTIjrEqrRvBY2PyNg13IWp/TB8cUsk1/Y2XLWpH6cIkZc30x1ch80y9sRqN7uXNG9VGtm8RK1orok/gpwCA9TXiUp60cZ8lgAAAAAAAAAAAAAAAAAAAAAAAAAAI051+Gea1V2BgLx8l1PQcjoPn3jR0WkMMpaOl0tDlPbeUedAS6U6XckKDL3wAS5IMheLxljEm5kNNnV3eT5fzLvaLdWJyGk3qaAMDGtvo6eH5V60KYo97ZsOdAHIKVlMrA2F8SM71U0DcV+g58q7jeMbjfQYIZUurK9dHU430lNeVqbNQ3LgE5DE4Wfy6RRgepJEkxqOsYycGZ2IJs5jcRFEh2IhmtQ6eIvUNgzoKTUg9ouVp+6/+BU0MI3Z5iIu5LQTyJE+PxB2E8k9CJmzu2qtTtpJgX8W4RnjoxGevSc3L7TcQNwjPHRiM9ek5uX2m4gYQAAAAAAAXXvp+tjlACw6a+ecDbQKhFap3oFH2//ACj0Dy3wip6NtiO3u67hI0fE7LvZE5AFcTXYaDURQ7tvPoDBghLdTyEt8GcaEovdppABVpqP4AS5eeHtY9E0b+WTiX6WZEguCGTuPv2kWM5U9OOjwpnBH0XbfbSSQtVJyo/m9r1GGxLxzVTzrrNHIt+jIvUZVDK8KPdVbUz4FFJHk1ivIrLdCZ0Pz+lNa7JH4mvAaALvCsbeuJcfXHTVPSTOJzNgpKa33XDMoTHh4BSYmLutOy/fKD73NFz6L2x3gGQd+iNZ6s3e4UXfp6VdJxQ0pJZ4dBok4sdwFtJgJ93dhPk6PTqjdhsNYmnnMRGwecS329rc5ydXgwIoSu1X9cLUI0/6xkBO+gYShRd2TOpaHQVZu/iEKKz3WF3woWQoFFZ7rC74ULIUCis91hd8KFkKBRWe6wu+FCyFAorPdYXfChZCgUWLqErOLClzPXAZps0eOrPq8EUacNjWc+JJ2J5lDkoUg7TuLbgGw8zGp3CZGItWA22BJVAAD94t7U4ZdsQL0Fmk+QEMidVMjIAxwDy5HjhbSpaP8sOc9lOZ4bZYI8sg/Ki7S2lHBFzWrCabPV5CK1JuheO+NkEJMfrWNxwbisVuzm+IPAX+T2MnMYbAswiDH7f5LLz6LXNr6XvV4BqFjhIaJH9lXSVH7YHb83h2W3cwliUpQsVr2A1eO8givCRsnwTUXI9052weM0L+Kkbhmy8bmWxld2N3goh8Yfb1QV5SSvNK4CB/ADU2Ubes5de3vFofDrS41ocbYlIDDwAC5onfFH1pMKH9gLlnnrUzYpsxuLt3N0bgAh9CbUQQOWm2O+hq2QLP8GIc6NOjt7RZBcFA6Om13Sh8R+wRe+nHLYzsek7eoeso1gEJvtOlB5BjPEZnlpW14rsBPUE/c8YRhxmMMWeryqql9iRk+XDrMMNVSDWuiFLoaIPc7mSKMt1RBAE/9XqLlqWyYqJFp7KdtTffUCPulbLrfoYTcloJyteW95H8fqBdZCB2mRH4+HQQ6lEEa2OvatiQezbC7LnMPXQcdMS6s6ZF8iBUlW3WJNN9wtZ+MyTqXM8T08/XKVTE3nuHfbKhUQ+YLtETewLOncrPJVTHFSdK/5Dm33dO2eMSD1mVsQkotEFR3VajU3AjuxDIVv+P1UtpOg5ikBHQvJJV5CtaWSYNuZwx0mlIqAwYyysQdrcQbRi6br+cfVtyFwfTaLbUw+DtlfEaJrfobW4/DAvxeS8VoZyHjgWUghsfwELVfE7XWNRQzQqaovfnQAh/96enp6enp6enp6enp6enp6enp6enp6enp6entQeH0eqW4i5q0DqmETPskEfFMsZQvldyY/I770p/lOlMIlrjZcGZOFldfRnDBrTE7CaMAWdu0pMqdE3Y7aw8Kst8k+3C08o0ouM54JU8RahhvjMNZmGOus+3e9SWGo+VQK95t2CrA6mzPztFUBiEhlibQWH/N3wRodMPEY/Fr7+GpYVPn6C0yW1H2lRoNSABtiZQcu7l00THg1F58/6Q4gyDmS9z7HjNAxIbf3ghecrlOqzKxe3KfQOJJkWFBYTBzfBW4vfQ/1WupS34uRTVVzpT+yEuYvsmI/gc6U20Awe0LIVKcGnzHZi6KyLIsqIIo6eYsjkPDsK0WwKFGDTpspsIVk2zmsZ5kXm8ugnO9R5xi3hgpkjD43U+kITSdGpSnoaxUVBN9ngYbppzVV2swZTxGqGLS6q+Ijy5kN6+ZWKJj/OuOXEy9umXCKVkSSEmEtDDcOV1MZRZK1KeCPdae2rXe5kPBmFz8mB437sX779S+2yONjGMlxYQ5SJyJ3Hv3qsBLgGzdIEEf8x4n2rKazw/A/Ny7EDGRmI4V/5csWIs57zbDNmH7pU/2MlUDSpE1TEmj7QV6n91eCarpIX+4JTed46OhIKk3HKrAlDJ09n44qbWc1cJezBdP9csbuz0d5HbD8XYVJX/4v6NWOU5+c3I9PZF7ezLse7IsLpqPM6aZq8SHPfy2ZKisHEMCIcYtTzPB2zb6dlq9Lj8QSVAgcoiloGHowe+u8dXS7EoxTs9b+IWaAlGJk/YnvWxpsJWX4wLNZ++1pNiDoABsSu6cGoyvf0nizfKvJNIdikmJuRkdZo5rYRm4ab2cxkk1lg/3YWhUFCApgmHMUUduZOkwh6eIu5RNbUI9yD837VIB2/ic1AJutKY/bvw/29tq7h9WJnhywcfOO+aUMkojIhknI+1/6iAsE4A5m/A42qpI8yrvoj02loKRQuWlZWioO43sVi6Q8GaPCNPCz4RXyWptCesBVKxDsJLrarTpwHeWDYMnfUMIbH418Wn6K0H7VTrn+tnK+mK36GlP9pbVCqjzfNaY5X3FzK0WPCmaAKCSdPKANIbr9TBRgI051omEbwCqjzfNaY5X3FzK0WPCmaAKCSdPKBPz5g8I7ih0SkyQX6bDqdAe16f+D0M5jp3opP7RFa8TKhQDxQgNszVgUWD58Q4+E1gumPxMyAvPSWhwdJ0mI3tIm13YFdO+FDL6MhQpOSOu2stu6as1cXbmkv+PjRcGzxXNr1bCjjE+iyWrhplzThxzkIwvqsicwmw1Z3st1NVr39vHJN9A1jwNOqB0J6oqOZuxP0OgmRr4KD7SvbX8L23tfnL5LTIZcp/6QwYpYTu5MIREUNiwJXgC7QtKgCifvwGcISiSTXexhQ/RqN5WEAiear1j6NDJLelmMVldVL0X4aS2z2ZhyUfbtkfcT/2knRE3HxfQQuJE5C29C90dpGIvZ0fw9yOs8ex+qT9VwFvwzk9SfVKSllVdqdREQ45g69/yu0F3GrFp+FaJ4PBzMDOaymImAOWG7c75jzVL8CYz07Hllj4uKRLbq4rl9JgY3K7azaa77PVCdNYXejSCcMYTHHPQLT7y/RVPwn+75miRCfobJ2aEbfeUO6ZunjMuzcGhPA+OC0/ZEwlW5Uv8hVxqIfYVrGeTbP3SCElLN9nlo+6YLL4Q5Njq2c0aBYnY5MCPZB4ye8fxE3wSk/NsF6AFjeBMYrv31MOrYDVldvYVSvErwDBoR6upk8+CzKh3xYqRVqnbJiXbdI420rZDR/G7hlu31TXEJSmZsTWIobkHs5aQCn1ZHlmlg7eLj8PFG24QzDLvjExyoKWfbve4PAOVtIn3aDWYSMijt6+cx8ZVtxK1cFvMhFRL3u2Axxh7g++IUaoo5U8JJ7QsntG/uuRz1HcCIxNVuN3fqa6VOgmCUfGSFYDG2i2tasfEsw8Hk+vUkhn36ytafFsr1P5ixEIG9tbJ5TmOGGrbK5G3GXwc9iCJbQJwJeWUKjfPdtknSFvM6HsAjMzWRVhekyU3vBvMmjFpVX5/+9wv/PfavtyFAmVzVd7Gq/QBWUgyEQOlh+rU8pJOT9pRtguDmpO8aiw03f+gVS2cocomUh6hnIpCB3CdcXbexVXoDxthjRIHUX/mXcqj4ROMs3xrlPP/Iczf/0fy3+f8IEidtXlLuhsEM1kskjoD+YnEGII/mDYN0qcqGIDPyxXDHuGtZQKST6uToMpU8fQ8InGEf26t6Eq68nFCuHDnrjN/k+lN3wnfFCxGkjiEHAMEDpM03h1QqmOAYs96X4C6AeSHbZKIQrS3p+H90y1dtVt/bUi1On32lDjppxWhSIwrs6rnUY3uFCcAZKfkxoqjzK1Nx/s0lWr/5/2aSrV/8/7NJVq/+f9mkq1f/P+zSVav/n/ZpM4/rouLLs4KnMBbKcXBZklR0ToZG44y194NuSaOvCaNdu6yFnzX1tElTlYVQnlx3D7XjNoMzLex8WRKGlDoWa+S+8Y6Vkj7uc+o0orO7pGA8eMDFCSeJcX/FF4Z8sCsyj0lZqibqM0lf/A5oz1klMTjn7fogKU9lFjJ45ROwD+Q7G6du5QMFBmVgBScvrbf1HbcVO82lABRZ2m6kswyjpSo/EWPBNc6reCiGTPzDWxM8Oei/e7ELQTA7VWj+cdi4Na9W2hqI0tSRTgGZaXcaVxloZpzhkCsJ6GukJv5ySLNSO11QjJhKiqTWn1oXepnxtrpza5wqIfHmcsYKfkP77WmwBWxo2d9mzabty7tTDayU+muKP1qLW4qFBWRV18E81eBu/RwtgwigJawje2ImW4EMG2eVcwDzuiP9Qdmm8heh/vUzGxHKezR/XeXvvk6fScPilEG9mXPyVfHfncxIk3moHJahL+RO5hM7rjMno2B2HFQIo1C3N7JA3/ZSdFbaq5VNArPEdyvqnZV5QAXcwD4GK6vL8Nnb1HHYoZ7d5hnvwaetsNV+CD0mPnENFeyiDBUSlKogbralOtPknZBY4tW38IxxD7cbY05fzQoFC8EYU/jIu7RVK5+uaBTaxJh7a/FkGpnmvlBxKRIa+kjkK9AH5qEsfRa/WLjR3SbyNhrSkDGDUawPIqvDDQpgu0POAU+iUFKuMAcudcZpw0Cb3+bWq+UDzrqV39ikyKEyE9N/BbpICvti0wPhZog3vb2GGzcACaFd86RbFjSXDBWValrAftpKFK/SWkzKC3PLuxltDKVICMHEQV/l7KVn48i1k+oNuIrfr9DHsfMNKVZRPB26daEbHeik1m1TcgvM6zVDlk5Rqheb6c7rChGLyiqwl9wbClOLs9HBHuVd5IehURpn3VcAXKEsjufJre/sQxiDS4Va6hSrP5Z6JXjYtRKT1vttO1hyH86NE2JpaAhQQPomhEe6xKQ37uirxuGdqwk+B/DBc4fPIJx1iohgXEvMz1htp9zsPrAhNdtchP5O09fM9waqEQoHaWyrCv0Hii+kur6kNFpHurcrdBe6M8DaiJxdwo0LLxvWU70OHaU09H+V7dwpS2O3KR6+LFazsb+J4UqX6oIKxzrUfYvu/cgiQoIkKbzEjmOxRxCBFsoII5jYZkQ0x6Ok8CuikN0LWpbiiDBTW7vf8KmRJUsOmngKCYs0ZK/IDRTH3+6cCXrxFpfgBYCk/1HyYYjB3NvOXMeH7PIdAYiLA0/0PKqWBEWMidwMbRkbSE6r73JOb+MRafRhEkS33NKbGRQpWNvGaQlCkOnlNJT2Iks1l+xNOwXhLDNPGgaM7Db+WP20rqXeA0Y7EEEb//82zPUfve2ldS7wGjHYggjf//m2Z6j9720rqXeA0Y7EEEb//82zPUX61zK+NdOOyJW71/PNJ3qo4t0l/Wqu80WqBnWckZ60zsJxAu87e0jATOYjhW4mFbaNVdzspih5oxcIonOWbkQ1euRZZ040YDAU7TrmEoW2JRVP6qasFer3qJ9/I8AiI1qGg5p3Qmrumq3QnEcnWgv+hd0n9IpJfqIuj+zcX/3W0jYNsRDunmh/NNYkDNf4AbhNjZNnD+E+Ni/f/vBwMqEzCtTRewHdneQ56b8b2zhKJiOPQoWgTLhS3axS0fvPPZWMaSzj3Xmw092k6IlPBrcU6tFDYTmNxV1xr1GCMjhV8UHB7BL3teOy2mk79zF6vjx+ud0eZb7wE/ud0Lto6oy3G90vf5mSOsW+xGaJu3/M7E9usc5YwLplM7Q8uMX3dZh9S7x6xDbmcTgUoNglerts4AtnkDwcwoexI969kkd2UQi0BrlmhZmpQlEuLKLHcUAa4/CSVTIlLMQyBO5nXOdvonS7NL+G/VTiS6khuJOyfthuyV6CaY4okE3NMJr8hCXVTyo7sTNj41XXyd8ZAy08OEyE4VghAj3EICBH32zywUFoA3sb/O8niaYhBsqciSDSTd+HVoZmF8GzCqqj5BNQ9B+v9DsGWu1AsJOlUeqxreDMokc0Pu44SmUWn4APf6t6YrQsZVBVVfipzN4qdhlX5TyNbdVZEBqjVLPP3D7JhM/k5yPiUhMF+7vXTdAHV5OfSHCJMI65NsHp1donGLMlQoYb5NltrZaUnzXo7Ia3ejEBkrNGFT3mnq1obZzQDYClL4HQKmKVz1+rk5v+AhHihh5J9GDIswaieIKRSt60DP39rWlZMN5Nl1uSFYTj/TSkevpGri4pU3erd6FsIseJiMiH78MBy3daxSHESJ++QaJpUe6Tntv55vvT3AjYwwuEa9mFd/vrAWrL33bhc3D8R6hX8qGPFO4TfPTNfjr4yuk2bEZKzzK5IMDlSzY8Hj5G7xMJdbJRS1TcXD+lhRRpSE0cku8m48O6907g4AR2sLYcmvfkLv8GVyNyL6NSZAJ60e6CTrrF7tsbiGhTQoUSGNxUpTkR15j+2m4eLe1MWRKCOHYXDC/YofJtibZmSwXc9uNuu0/PtGxknJDlJQ4jkPnrPa8SQ7IhK0DJ9bNmUxY9cELPV8JlvT1l0+LfI781p2jP2aGVQ5yg8sZeZqVdZXczQ2GahM0xCYpG3JTsNN1l8mZpXdnYfEs9vjocpVoPX4AaCnrczDte2ZLdT7S/8MPv6Wg9WRW+lRJBkBxT0q1gvmh+FMQlX1EvWIp6MY/npp4l4IWmUAeN+QnmuqW29g5lJBCi04oM9d0pUf3KZQUepjAugbKAzoTMxsIlyPmovJKkDqj4sVTpBdkbymgAAAAAAAAAAAAAAAAAAAAAD+e18yuuEJRezjKHy5Gtut/DiJ8qycS/u76nJx6xahtBqpFhlxOuEanHgaZLyIAHIQEgveLztnC33MHbWlpzN9VIWdhXJodIyxYr2+vURCGVYqnEdXVZOtSEmEfXTmAPGmh+gqubH5rGqCN1o/K4hazruELENR3LxtGK6boOw1hm1xohAXVDSMTeG40YIJJeFsIhDkVTny/d9uczQu07DCCP/wUnjcDTk5FFHD67a4yM5VF8PRjW9rS2uaa8ViGss5xWpRdKW3qI7fmUDyVDbADSi/koRvOntbBQJxcHh+sODqkpFwJ3LTJWEMK5sFxJx8TXzg+ekPQrkOWswIFpOemeqfV4FOz/jM5fgNIl3DlBCqoZVFD7y7gGdKfQpteVtPd6SAfYrZAe5NtFT/vUfNtddFKQ0ED9cakgTb1j4Dn9KcsjBgivTCsMbQBHBKVOZkWANys393ex+Akv3M74KM0F18mbKkLtH2XWH2RQyHszrN91McXBwWwq7gxYFnmGvmULr449wL7JHVoEqrehjtMeiNogsm46/j290wGZL6+p/v+1oGyIRcOiYggVP1lXRoqxHi9wuwClCQeCKVeliGJ4y8yKzgmk0Q8P1Zh2BgzWOHve/3QXdk48K8B0T3mtX5nbvCUtGjFnc6z5kORJVSY0AfdH7cEOM8noKegG38uFQc43XbgekePXadk3Bx3G2B0xxJrewOKGdc7jdbdfOdmmhPJzVO5kYH+vWtiUa8yVVsWMEJl6a/U2Y6uEIEarqT9K4tlXchrt8qh1frlE/MZplCWv/6cmPVcfoL0d43hNQU/bBnC30HV+2jsjE5O7nPqBE4jTJRiqI96XIg2v0zDaLVWeT3VBERC/jygkz9nzhMBpisD1dq9QgJLdXBBoSaAoIP9EzuduCb3UPgPzdIHcZKHqwniB6o0hGX7hXuW60HsUtSwqpIIa92RLFUu9bkVUl38UbRyRShMoskJb7vLIkOSyJJS4VZtT90vU3InsDA0E2invjSAcrQyukVPQm/5uTsfKkCSvIvjecxVZ1C8Y1cU0rc42bOjXJOpq65y8iTEEhPplNWeaCt2LIVqlqFFIE/RIRKLrwJq7m+gm3jkO210Uzf0K9yEksiG5/g6iS46a6izrM+xRCecBIjJWU5XQQwGMXgLmcSLDg0WyNEx0gKCoAcrNhATpAOnTRYd2RO7Io6uJjWeQDrELPbgo9B0/dpvWv7fi6+t0+Pj9wT5Mt4lwtNwtNwtNwtNwtNwtNwtNwtNwtNwtNwtNwtNwtNwtNwtNwvH9KRj9AnZWs/tctZra51u2p+ZlX0utuZDwFBccwNeCekcG0kGvCI4wPqZm5HFVVUvnmiE6ZKEYXducUu/heF9umh15rKRsUa0GCowCO0RjdHAeQC3U5Q2+H0gEcRHuVuIeWAdorIi/YB69CpOIc2J3TscGBQ0GCE4OkhTSYFYP7JLsM6yBwuO4LeBGhlKuQDJSb4jA6sIRod5kEBIl4Mbmsd+3IBRDsm2RJOJb5td3cCqszZs8v9uenVvJXl0yu3JIkhg/qonRQdV96jzZFAE2Ne27ctE6AT4DLn08j1Kjgv2Ia7EAb4xWCHoo9BL8bSahgBjmrq4ycrcbBgftIfIyWPcjRkVE34K+Vh/K0kE/d2OfRyyn6B3JOdEHdk6EtPZZuVgHW4qJrUOkxZ5n2taga5vcbpTYId+s0F/uHsLE91JsiykWzG5lDfyUrexUVM50+UGqXe3B2P9+PUdl/t7MCt/IMsHi2nRguoynxpWAlP3OLoQzkKcfRHAlmSbQ1pZUlWw6BCK5vWqgAa/2mMSCIlLpNmZDK9YIU6A4DVyIF1MyFVqUUuqHI/igLywxYSobOMJ+RPqr0Q3tzkiB/IoleUnFXMSCAr39yWyPiqgN6/JLRNnPBs4YXFIQ6X9hEMXbaF7U3z7u/XMr3lapu9huTQrayUoizelQzAApBF9Vnb6Tivf/1sq43T1jgt3znBPJullfj94Zd/ZDYv0H9Gk+42qRL600u4y0WWy/EC0MENL7z9FoFyRIMiyzLdnGL7ImObYdqsm+t9dS0vkvjr9+j+2ulJp2rhlw7kGmm9bw/otpCuNoPh38z5RfjN45803CLHVWxcTryRySzNXvM0zzZNEAUyaDAlh/J4JjOOMifOHgtRv8EOe2hozucZBA1fWZlGnuFJZGwisNRaARR5bUkWUT6gHz0EHalbPhX59NuG4db1GG1oDFc22vFPCpQE37pcJdUnX+T0tPOSWbpbZUQRQt0155NnphZG3+dUloL0Kke7MRev4Tap5gh25Ne0Aj6g9iGd6xsIrLv9CxY15+JE09PLKe0Tv7Kcv21f1za9359UHRWVaXMtU8grfl1l8pDPm2K3YvcvzvJUaFZpDyUY+pAEjkLmwj2tUaahjXXOnS4WHxHBrm1JJGYonPaGHi7XcsoBv57X79WjVWAJ3pt+2KFNZYGri8jmAVho90IrJvdCKyb3Qism90IrJvdCKyb3Qism90IrJvdCKyb3Qism90IrJvdCKyb3Qism90IrJvdCKyb3Qism90MpLm1IJvwKqBUJH0q/GCBj64EFd9NlOWsGHYwYAtZQ9BXAfqdK/PVhnXMCX8EZXI0u7kIJVsPQfBiz3gHmY+nB7OHXa4LK6DlQ4FY+3t/BuyYgREfzfMhI6CX1DTB2/lpPqUKb7ng33jBcZeoh+MfB0y6zrGR075HNji76dw6jsqTaAVA/fs+Tf9yhQTszRUYpHEHlv8eHWmdjuRJsoZanHDPtCsxjy4IlxZKm6/NEp62lpSPH1omtcF51aJKKr4KnZ78MgwYW0JrH4YaR06zMilbIfBCC6otK1YrQFfmpkKczBJyDVuT8iIGGuppkqGb9rXSwGljDr9EzzYSRS6hQF5ZX/VTjjLOUeU6tLeaTmo87jwPrWVO9inpgsnDAU9xUNL6XOOlxnbvzUF1+yJCRep2hwyW9sEg1lqZvgiJ4lTSUcStBCUZMdP/w7XY4AW8/88U4ixA9zN6sSeZg/dXTkivPjDAVd7wR1enQMKEZu8Uz2IiVqREQVCihfjkkjM2mX13TiL+OEVkwycbYGmnlCt6JX/8cW8FvafuwGVizmRJu3Z6mULu2+0LGpEQhUzh18M9GolfJ3sKmksdX2qM4VsHxM4+3SW0tu3tqWqwJCD6S96KOJOylveFdv5cNvEs4FyzfuXF9sx94qsY34q8ElFR3ckxx36l+uU2jjgSUD1SCaStmVvrhYM/fHcfrRKp3Nw8poqG1d7GC7YgqN9O5aRSM4FFLTr7tolhXyY96+h9WhSpMRgpjU6CtccHu760TxIOt7XpWSN/ADt7qtUl6lQd/2u0IJHNfMadxu0/9UbySTmKdWM/sZNiDXOMA8AkU31W1C1G+zlEgUnu6aCQ4ijT2Ir2LCv2bmWoqlT8gMWa52SmVSpbwKAZqkI8BciumjqGZ8L5wp7LT5OiMKJywsbx8fgLX7FgWy0I6nlDgz/WDc9sCLZiIoDncOjv+2DJ0Po+tCZdNLKlmhT2U7hgaM4yNhAOtE+l8aolwPhizQp7KdwwNGcZGwgHWifS+NUS4HwxZoU9lO4YGjOMjYQDrRPpfGqJcD4Ys0KezNap8yxvdkZLOOvvdf4Qhe6iMY0P5VTs6g3i6MhjA9F2sR1z0p1ydF8um//ObEkuoHfxi/y2Qw9ZChx1ywLlhY+ea9e1UJHHVMohy8nQw5k+Z/N6ekZf6WTqBDjBNzSgK0EQrGUMIan4jQxzZF0dK6wmlgeESCKeBuB6DOzrYxdOJFAIBY3ktsrCabLRJY9whyb5FmEurvY3DzlR8J61uKiy7Wa9eeac8WTXLG5kpClcgrBa/O2nw774Qnbube8dtBZ0GSMiDa6ouG8RDyPjKe9H3VT8dNdQLE7yBmBDaIe9bH5hXwqizAuNmpBQrMtnlu4yxIWR6q6A04R2dMLWICtMM1BwppwqiU8egYL5rEGoTDTQR1jsUZ0lMRMiB8mUg02mPM/l2yeSrq2g8IdpLOqQfoA5EU+28GBFZxW5XNy7aGIDRjAdQzBk5NANDcLfrnQ/Sop+U1hH6onMtQMXamHPokWv9Kc0TEZ/VvxRqKu/l3ndeweVziBjtQVf/fU+WH1y0tUNKY3GH5S7npzXyF5c+5qXe/P3xIXq+PAT3H3LaozszctCFkurSvpm/YYihVsVz74gm15DQsHwk578oOU/KDlPyg5T8oOU/KDlPyg5T8oOU/KDlPyg5T8oOU/QyRFMrRpdES8SWpDaUvM4owPfNY9wNL2y1pAkfwDS1AAAAAAVDHlvINbj5LSggbWKxdPkJN2q2T5ERqFzSqV1FTe7C4xU56izU3GbZcAnT15SL02c/JemfEU4XJU2Vc2bwWpO4nomjdu0RCT9MKDU+O+1cQPplp5SilCEOrZH9twPFW6UyGzBydDhei7SjPwnpw4cUZs68mWXCe42ylLq1Nri1S0hGAcVf0kry7O6Icb+JLHtOePpD6b8QKaCwUE4X9bW2yKQfkxCSgpG8ZHsvs4ysxmFZ4E3qAkNrNtp701QZoUosi+RjUTdu/fmZZ/y3xne2Kl+vZADghJvjSJCKbMP/2ka5+Ki6z3AO8egMJNEUO0ABMXj39ZOfsON6C3d4f3yGDjSZp4YcyHbvKvp6gZKvg6ELFz0KWqDHbuB+ZENsP2Qm0BZ/ujo9JbztYxeftaxue/qdy81FsGjFo6ZH+tnx50ob/AUcgeQVp4SsX3HoskPiY8Gw7BlNO0O+EN2R2ugltZuLrl6AzCdQoqQAZhOoUVIAMwnUKKkAGYTqFFSADMJ1CipABmE6hRUgAzCefr7O2o7ET++h3TEJPTesPCJrpswNfOHDXhMHqEFDMib6EmbmBWg+tKvWy4BSTRN39MSqx+rNopXGYh9mgbyTtnCgtTXdcLCoxuKLZg4+6Ok3bjQ0Qc7/0y/IbF8cbKIXIMGr9PLzAjh+T+dpl9f0YacNPV5XQUi4qKTpG9/9sRf/iEfEp3Ad6Qoxpal03JvfbJhlcHb5633My8prnWe4+1KabUvNiSRO6Nq9goeYjjsypq9BzoJO0hsg0QV3s7rglopIDOuBPdlgX/ezLMpHkfhzKDHZ39iZCI7XGkrHc4VjUr/pLgFaI1abxBMYBllnOZl38gjVEZZuMSaiPpKo1JxwuVpOUuwluzRwcGNEk9KuPMaTS0HwoOG5suH1d7T+CpuUerdiXzy1pcjc/VwPlRtikm8/SeXjVr67HT7q4r7OfNLBO6doOOHcppBEM5E21ZCKxOafJl9RGECqT+CIwx+NOkPg8KKwGxytoJ72S+gxvrMqETgdUJTOFVXlTAbVeVMBtV5UwG1XlTAbVeVMBtV5UwG1XlS4AAAAAAAAAAmQfumY3af/Hu6Ck+mANTr3IejNEoLnECLG3nywgUvtOvOQnOGBrnlqrVWx8zEQsSTfTHUZoQvAvBiA2lihKFnv/gbHwgwHtnfItyEp5W1qYvq6lNKkRMPbAjM2l5k9c8ZWVxzqQuwDSC9/QSYbqaahBoIhXr0Is5/i0H7uoFmnbKlYMRABKsMclFEGUYCHGOJEgAGk+5YiOGT/pKCq/M5YWWG4acoVJacuGkTTOcN0c+czx/CAxOV6OCRKQNz7ci/h2vjg0jGxf4sjZQpytgNEDQykiLoMFiV9EF1NqWdM4NOx9ev5SL57JFUp0/QSELjO3+Jr9XDstrbB5eGKC91CK3Cz51RHR2SNuOuvKbYLs6gtenzFNEJAwMHnzJ+5RP8zkgtqihRlNiq1Z1Ba9PmKaISBgYPPmT9yif5nJBbVFCjKbFVqzqC16fMU0QkDAwefMn7lE/zOSC2qCgAAAAAAAASnQclWflo7VlfMMLH/EX6/Yg9dYYIFl9HJzbE/EntpV3mfQrBNduZfYlDZwaoXT/1MSoqHZBrC6P3/STfedcvTAb7xO6FOLAAJWSdy6DgPVz8PSfusAu+iwjHBR0zfgzjQmTG0GspX943JkY5tWy80Qr3CVbcYQsa+cR8uLn1CFjXziPlxc+oQsa+cR8uLn1CFjXziPlxc+oQsa+cR8uLn1CFjXziPlxc+oQsa+cR8uLn0AAA";
var PHOTO_ATLAS_SIZE = Object.freeze([1024, 768]);

// src/render/flythrough.mjs
var ANCHOR = SPACE.railX + SPACE.thumbInset + SPACE.travel;
var FLY = Object.freeze({
  start: 40,
  // odometer of the first passage
  speeds: Object.freeze([0.3, 0.42, 0.58, 0.78, 1.02, 1.3]),
  // share of the near-star sail, far → near
  size: Object.freeze([150, 480]),
  // sheet radius px, far → near
  anchor: ANCHOR,
  centreY: SPACE.centerY,
  meet: 1900,
  // odometer (into a passage) where all sheets are over the hole
  length: 4700,
  // a passage, until the far body has left on the left
  period: 8e3,
  // odometer between clouds
  split: 0.7,
  // sheets faster than this pass in front of the stars
  opacity: 0.3
});
function flyState(drift) {
  const d = drift - FLY.start;
  if (!(d >= 0)) return null;
  const index = Math.floor(d / FLY.period), u = d - index * FLY.period;
  return { index, u, q: u / FLY.length };
}
function flyUniform(world, reveal = 1, reduced = false, dust2 = 0) {
  const s = flyState(world.flight?.drift ?? 0), z = reduced || (world.elements?.nebulae ?? 1) <= 0 ? 0 : clamp(dust2);
  if (!s || s.u > FLY.length) return [0, 0, z, 0];
  const strength = clamp(reveal) * (world.elements?.nebulae ?? 1) * (reduced ? 0.6 : 1);
  return [s.u, s.index + 1, z, strength];
}
var ENTRY_DUST = Object.freeze({ from: SPACE.width + 440, travel: 1760, extra: Object.freeze([0, 260]), speed: Object.freeze([1, 1.45]), size: Object.freeze([[430, 95], [520, 120]]), opacity: 0.2 });
var FLY_LENS = Object.freeze({ einstein: 24, reach: Object.freeze([60, 130]), floor: 10 });
var num3 = (v) => Number.isInteger(v) ? `${v}.` : String(v);
var FLY_GLSL = `
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
vec2 flyLens(vec2 p){vec2 d=p-vec2(cx(),uSize.y*.5);float r=length(d);if(uLens<.001||r<.001||r>=${num3(FLY_LENS.reach[1])})return p;return p-d*uLens*(1.-smoothstep(${num3(FLY_LENS.reach[0])},${num3(FLY_LENS.reach[1])},r))*${num3(FLY_LENS.einstein ** 2)}/max(r,${num3(FLY_LENS.floor)})/r;}
// High \u2192 Max entry (SPEC 4.1): very thin interstellar dust streaks past.
vec4 entryDust(vec2 p){float z=uFly.z;if(z<.001||z>.999)return vec4(0.);vec3 c=vec3(0.);float a=0.,fade=sin(z*3.14159);
 for(int i=0;i<2;i++){float fi=float(i),sd=31.7+fi*9.1;vec2 size=mix(vec2(${ENTRY_DUST.size[0].map(num3).join(",")}),vec2(${ENTRY_DUST.size[1].map(num3).join(",")}),fi);
  vec2 w=(p-vec2(${num3(ENTRY_DUST.from)}+${num3(ENTRY_DUST.extra[1])}*fi-z*${num3(ENTRY_DUST.travel)}*mix(${num3(ENTRY_DUST.speed[0])},${num3(ENTRY_DUST.speed[1])},fi),${num3(FLY.centreY)}+(fi-.5)*70.))/size;if(max(abs(w.x),abs(w.y))>1.3)continue;
  float env=smoothstep(1.,.15,length(w*vec2(1.,1.15))+.35*(fbm(w*2.+sd)-.5)),streak=smoothstep(.42,.82,fbm(vec2(w.x*1.4,w.y*9.)+sd)),grain=smoothstep(.62,.8,fbm(w*vec2(3.,12.)+sd+5.));
  vec3 col=mix(vec3(.62,.57,.52),vec3(.55,.64,.8),fi)*(1.-.6*grain);float ga=env*(streak*.85+grain*.3)*${num3(ENTRY_DUST.opacity)}*fade;
  c=c*(1.-ga)+col*ga;a=a+ga*(1.-a);}
 return vec4(a>.0001?c/a:vec3(0.),a*unfoldMask(p));}
const float FLY_SPEED[${FLY.speeds.length}]=float[${FLY.speeds.length}](${FLY.speeds.map(num3).join(",")});
vec4 flythrough(vec2 p){
 if(uFly.w<.001&&uFly.z<.001)return vec4(0.);vec3 c=vec3(0.);float a=0.;
 // Far (slow) sheets first, near (fast) ones over them.
 for(int i=0;i<${FLY.speeds.length};i++){float j=float(i),s=FLY_SPEED[i];if(uFly.w<.001||s<uFlyRange.x||s>=uFlyRange.y)continue;
  float size=${num3(FLY.size[0])}+${num3(FLY.size[1] - FLY.size[0])}*(s-${num3(FLY.speeds[0])})/${num3(FLY.speeds.at(-1) - FLY.speeds[0])},sd=uFly.y*7.31+j*1.93;
  vec2 centre=vec2(${num3(FLY.anchor)}+(${num3(FLY.meet)}-uFly.x)*s,${num3(FLY.centreY)}+(flyHash(sd,2.)-.5)*size*.4);
  vec2 w=(p-centre)/size;if(max(abs(w.x),abs(w.y))>1.7)continue;
  vec4 g=flySheet(w,sd);float ga=g.a*${num3(FLY.opacity)}*(.8+.35*j/${num3(FLY.speeds.length - 1)})*uFly.w;
  c=c*(1.-ga)+g.rgb*ga;a=a+ga*(1.-a);
  if(mod(j,2.)>.5){vec4 pl=flyPillars(w,sd);float pa=pl.a*uFly.w;c=c*(1.-pa)+pl.rgb*pa;a=a+pa*(1.-a);}}
 if(uFlyRange.y>${num3(FLY.speeds.at(-1))}){vec4 e=entryDust(p);c=c*(1.-e.a)+e.rgb*e.a;a=a+e.a*(1.-a);}
 return vec4(a>.0001?c/a:vec3(0.),a);}
`;

// src/render/arcs.mjs
var ARCS = Object.freeze({ count: 7, rate: [6, 24], calm: 0.12, shake: 0.6 });
var arcShare = (charge) => Math.min(1, 0.18 + 0.8 * charge * charge);
var num4 = (v) => Number.isInteger(v) ? `${v}.` : String(v);
var ARCS_GLSL = `
uniform float uCharge,uCalm;
float arcHash(float n){return fract(sin(n*91.3458)*47453.5453);}
vec3 knobArcs(vec2 d,float R){
 if(uCharge<.02)return vec3(0.);
 float q=uCharge*uCharge,r=length(d),th=atan(d.y,d.x),rate=mix(${num4(ARCS.rate[0])},${num4(ARCS.rate[1])},uCharge)*mix(1.,${ARCS.calm},uCalm),tick=floor(uTime*rate),light=0.;
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
var hash2 = (n) => {
  const v = Math.sin(n * 91.3458) * 47453.5453;
  return v - Math.floor(v);
};
var wiggle = (u, seed) => {
  const i = Math.floor(u), f = u - i, a = hash2(i * 17.1 + seed), b = hash2((i + 1) * 17.1 + seed);
  return a + (b - a) * f * f * (3 - 2 * f);
};
function arcStrokes(charge, time, calm, R) {
  if (!(charge >= 0.02)) return [];
  const q = charge * charge, rate = (ARCS.rate[0] + (ARCS.rate[1] - ARCS.rate[0]) * charge) * (1 + (ARCS.calm - 1) * calm), tick = Math.floor(time * rate), out = [];
  for (let i = 0; i < ARCS.count; i++) {
    const seed = tick * 13.17 + i * 7.31;
    if (hash2(seed) > arcShare(charge)) continue;
    const a0 = hash2(seed + 1) * Math.PI * 2, span = 0.6 + 1.8 * hash2(seed + 2), rim = i < 4, h3 = hash2(seed + 3), rr = R * (rim ? 0.97 + 0.15 * h3 : 0.3 + 0.55 * h3), amp = 1.6 + 2.2 * q, points2 = [];
    for (let k = 0; k <= 24; k++) {
      const u = k / 24, jag = (wiggle(u * 11, seed) - 0.5) * 2 + (wiggle(u * 29, seed + 5) - 0.5) * 0.9 + (Math.abs((u * 7 + hash2(seed + 4)) % 1 - 0.5) - 0.25) * 1.6, r = rr + jag * amp * Math.sin(u * Math.PI), a = a0 + u * span;
      points2.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    out.push({ points: points2, width: 0.5 + 0.3 * q, alpha: (0.55 + 0.45 * hash2(seed + 9)) * (0.4 + 0.6 * charge) });
  }
  return out;
}
function knobJitter(charge, time, calm) {
  const j = charge ** 3 * (1 - calm);
  return { x: Math.sin(time * 53.1) * ARCS.shake * j, y: Math.cos(time * 61.7) * ARCS.shake * j, scale: 1 + 0.025 * j * Math.sin(time * 37) };
}

// src/render/webgl.mjs
var vertex = `#version 300 es
in vec2 aPosition;
void main(){gl_Position=vec4(aPosition,0.,1.);}`;
var helpers = `
precision highp float;
uniform vec2 uSize;
uniform float uDpr,uPosition,uTime,uSpin,uBrightness,uGlow,uDepth,uWarp,uLens,uMinimal,uScifi,uAccretion,uHoleVisibility,uHoleMaturity,uCollapse,uBoom,uBoomProgress,uBackdrop,uRecovery,uUnfold,uContract,uHostDark;
uniform vec4 uPanel;uniform float uDrift,uTorn,uDisk;
// 1 outside the host popup panel (or when there is none), 0 inside it.
float outsidePanel(vec2 p){vec2 d=abs(p-uPanel.xy-uPanel.zw*.5)-uPanel.zw*.5;return smoothstep(-8.,2.,max(d.x,d.y));}
// Once the tear starts, our own popup panel is torn open with the space: inside
// it the sky follows the same rule as outside (the tear mask still applies).
float panelOut(vec2 p){return max(outsidePanel(p),uTorn);}
uniform vec3 uCore;
uniform vec2 uBoomOrigin;
uniform vec3 uTint,uTrack,uRim,uStyleTint;uniform vec2 uStyleTone;
out vec4 outColor;
vec2 pixel(){return vec2(gl_FragCoord.x/uDpr,uSize.y-gl_FragCoord.y/uDpr);}
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.;v+=.57*noise(p);p=p*2.1+17.;v+=.27*noise(p);p=p*2.03+9.;v+=.13*noise(p);return v;}
float track(vec2 p){vec2 q=abs(p-vec2(${SPACE.width / 2}.,${SPACE.centerY}.))-vec2(${SPACE.railWidth / 2 - TRACK.radius}.,0.);return length(max(q,0.))+min(max(q.x,q.y),0.)-${TRACK.radius}.;}
float cx(){return ${SPACE.railX + SPACE.thumbInset}.+uPosition*${SPACE.travel}.;}
${REVEAL_GLSL}
${HOLE_GLSL}
${SWALLOW_GLSL}
`;
var background = `#version 300 es
${helpers}
// Deep sky beyond the popup: a procedural backdrop (dense faint stars, two star
// clusters, a dusty Milky Way band, a dozen galaxies of real kinds, faint
// emission gas and near passing stars, see deep-sky.mjs). It slides slowly with
// the voyage; the moving stars, dust and meteors are drawn on top of it.
float fieldStars(vec2 p,float cell,float density){vec2 g=floor(p/cell),f=fract(p/cell);float h=hash(g*.37+cell);if(h>density)return 0.;vec2 c=vec2(hash(g+3.1),hash(g+7.7))*.8+.1;vec2 d=(f-c)*cell;float tw=.8+.2*sin(uTime*(.5+h*1.7)+h*40.);return exp(-dot(d,d)*2.4)*(.2+.8*pow(hash(g+11.3),3.))*tw;}
${DEEP_SKY_GLSL}
${CLASSICS_GLSL}
vec4 deepSky(vec2 p){
 // The backdrop is the farthest layer: its stars slide only a little while sailing.
 float stars=fieldStars(p+vec2(uDrift*.008,0.),6.,.42)*.55+fieldStars(p+vec2(37.+uDrift*.016,11.),11.,.5)*.9+fieldStars(p+vec2(5.+uDrift*.03,71.),23.,.56)*1.4;
 vec3 col=vec3(.82,.86,1.)*stars;
 vec2 c1=vec2(${Math.round(SPACE.width * 0.12)}.,${Math.round(SPACE.height * 0.72)}.),c2=vec2(${Math.round(SPACE.width * 0.61)}.,${Math.round(SPACE.height * 0.18)}.);
 for(int i=0;i<2;i++){vec2 c=(i==0?c1:c2)-vec2(uDrift*.18,0.);c.x=mod(c.x+40.,${SPACE.width + 80}.)-40.;float R=i==0?15.:11.;float w=exp(-dot(p-c,p-c)/(R*R));col+=vec3(1.,.93,.8)*(fieldStars(p,2.6,.75)*1.3*w+.07*w);}
 col+=galaxies(p)+milkyWay(p);
 col=nebulae(p,col);
 col+=sights(p);
 col=classics(p,col);
 float gas=smoothstep(.5,.85,fbm(p*.011+vec2(3.,7.)))*.5+smoothstep(.55,.9,fbm(p*.019+vec2(11.,2.)))*.3;
 col+=mix(vec3(.34,.16,.56),uTint*.5,.45)*gas*.22;
 col+=passers(p);
 return vec4(col,1.);}

void main(){vec2 p=pixel();vec2 k=vec2(cx(),uSize.y*.5);vec2 optical=2.*p-holeLens(p,k,uLens);float t=track(p),edge=1.-smoothstep(-.8,.4,t);
float deep=uBackdrop*unfoldMask(p);vec3 cosmos=vec3(.003,.007,.018)+vec3(.005,.007,.018)*fbm(optical*.038);
// One deep sky for the whole world, rail included (computed once per pixel).
vec3 universe=edge<.001||deep>.001?deepSky(swallow(p)).rgb+inflow(p):vec3(0.);
if(edge<.001){
 // Outside the capsule: once space has unfolded it continues past the rail and
 // thins out into the host (the world canvas fades to transparent at its edge).
 // Before that, only a little bound energy leaks around the knob.
 // No hard cut at the knob: unfolded space eases out over ~16px past it.
 float purple=smoothstep(.333333,.666667,uPosition),bound=smoothstep(.5,.666667,uPosition)*(1.-uBackdrop)*(1.-uContract)*purple;
 // Beyond the popup panel, unfolded space is an opaque night sky; only the
 // world mask fades its rim into the host. Over our own popup panel only a thin
 // halo hugs the rail, keeping labels clear (thinner on light hosts, where a
 // dark halo reads as a drop shadow).
 float out_=panelOut(p),a=deep*mix(mix(.35,.75,uHostDark)*(1.-smoothstep(0.,mix(5.,10.,uHostDark),t)),1.,out_),leak=bound*exp(-length(p-k)/18.)*.28*(1.-smoothstep(0.,14.,t))*(1.-a),total=a+leak;
 // With the panel torn away, only a faint outline of the rail remains, in the
 // host's own background tone (light hosts: near white; dark hosts: near black).
 float outline=uTorn*exp(-pow((t-.7)/.6,2.))*.5,glow=revealGlow(p)*.85*step(uSwallow,.001);
 if(total+outline+glow<.002)discard;
 vec3 sky=cosmos+universe*out_,base=total>.002?(sky*uBrightness*a+vec3(.34,.16,.56)*leak)/total:vec3(0.);
 // On light hosts the world's faded rim turns pale rather than grey: the colour
 // eases toward the host tone across the same band the world mask fades.
 float rim=1.-smoothstep(0.,1.,min(min(p.x,uSize.x-p.x)/${120}.,min(p.y,uSize.y-p.y)/${96}.));base=mix(base,vec3(.97,.97,.98),rim*(1.-uHostDark)*out_);
 float alpha=max(total,outline);vec3 shade=mix(base,mix(vec3(.97,.97,.98),vec3(.11,.12,.15),uHostDark),outline/max(alpha,.001));
 outColor=vec4(mix(shade,vec3(.86,.78,1.),glow/max(alpha+glow,.001)),min(1.,alpha+glow));return;}
// Once space has opened, the rail's own rim recedes: the container gives way.
vec3 col=mix(mix(vec3(${REST.light.join(",")}),vec3(${REST.dark.join(",")}),uHostDark),uTrack,smoothstep(0.,.6,uHoleVisibility))+uRim*exp(-pow((t+1.1)/.9,2.))*(1.-.65*deep);
if(p.x<=cx()){
 float purple=smoothstep(.333333,.666667,uPosition);
 // Collapse pulls the bound energy field into the core: a feature at distance
 // d is drawn at d/(1+3c), and the energy is used up as the pit forms.
 vec2 q=k+(p-k)*(1.+3.*uContract);float near=cx()-q.x,drain=1.-.9*uContract;
 // Approaching High, energy converges on the knob: brighter, faster, narrower.
 float gatherLevel=smoothstep(.5,.666667,uPosition)*(1.-uBackdrop),pull=gatherLevel*exp(-near/70.),squeeze=1.-.75*pull;
 float center=clamp(1.-abs(q.y-k.y)/${TRACK.radius}.,0.,1.),rail=clamp(1.-abs(p.y-k.y)/${TRACK.radius}.,0.,1.);
 vec3 blue=mix(vec3(.17,.45,.68),vec3(.54,.81,.96),rail);
 // Purple is bound energy around the core, not a lit tube: the fill itself
 // goes to a dim violet-black and light concentrates near the knob.
 float bind=exp(-near/55.),reach=.18+.82*bind;
 col=mix(blue,mix(vec3(.022,.012,.042),vec3(.06,.026,.10),rail),purple);
 col+=vec3(.30,.12,.50)*bind*(.3+.7*center)*purple*drain;
 float gather=exp(-pow((q.x-cx())/max(3.,45.-uCollapse*35.),2.));col+=vec3(.12,.05,.18)*gather*uCollapse*drain;col+=vec3(.16,.07,.26)*pull*(.6+.4*center)*purple*drain;
 float x=(q.x-${SPACE.railX}.)/${SPACE.railWidth}.;
 // Irregular arcs: amplitude and phase wander, brightness breaks up along x.
 float wander=.6+.4*sin(x*5.3+uTime*.9)*sin(x*2.1-uTime*.4);
 float ribbon=exp(-pow((q.y-k.y-(3.-uCollapse*2.5)*squeeze*wander*sin(x*13.-uTime*(.75+1.6*gatherLevel)))/1.5,2.));
 float silk=pow(.5+.5*sin(x*35.-uTime*(1.4+2.*gatherLevel)+q.y*.15),9.),broken=smoothstep(.35,.75,noise(vec2(x*18.-uTime*.8,q.y*.2)));
 col+=vec3(.24,.14,.4)*ribbon*purple*(.25+.35*silk+.45*pull)*reach*broken*drain;
 col+=vec3(.1,.16,.23)*exp(-pow((q.y-k.y-(5.-uCollapse*4.)*squeeze*sin(x*8.+uTime*.4))/1.1,2.))*purple*.25*reach*drain;
 vec2 dk=q-k;float rk=length(dk);
 float swirl=pow(.5+.5*sin(atan(dk.y,dk.x)*2.-rk*.32+uTime*(2.+3.*gatherLevel)),6.);
 col+=vec3(.20,.10,.34)*swirl*gatherLevel*exp(-pow((rk-17.)/7.,2.))*purple*drain;
 // The rail is only a window onto the same universe: once space has opened
 // it shows the very sky that lies around it, with nothing marking a seam.
 col=mix(col,cosmos+universe,deep);
 col+=vec3(.86,.78,1.)*revealGlow(p)*.9*step(uSwallow,.001);
 float ry=(2.8-uRecovery*1.8)*sin((p.x-cx())*.045-uTime*.55);
 float rl=exp(-pow((p.y-uSize.y*.5-ry)/.65,2.));
 col+=vec3(.55,.39,.8)*rl*uRecovery*(.035+.12*exp(-pow((p.x-cx())/72.,2.)));
 col*=uBrightness;
}else col=mix(col,(cosmos+universe)*uBrightness,deep);
outColor=vec4(col,edge);}`;
var dust = `#version 300 es
${helpers}
uniform vec4 uClouds[4];uniform vec4 uCloudKinds[4];
${NEBULA_GLSL}
void main(){vec2 p=pixel();if(cloudVisibility(p)<.5)discard;vec3 light=vec3(0.);float alpha=0.;vec2 sp=swallow(p);for(int i=0;i<4;i++){vec4 n=uClouds[i];if(n.w>.001){vec2 d=(sp-n.xy)/vec2(n.z,n.z*uCloudKinds[i].y);float a=cloudDensity(d,uCloudKinds[i])*n.w;light+=cloudColor(uCloudKinds[i].z)*a;alpha+=a;}}// On a light host nebulae stay inside the capsule; outside it they read as smudges.
alpha*=mix(1.-smoothstep(-1.,1.,track(p)),1.,panelOut(p));if(alpha<.00001)discard;outColor=vec4(light/alpha*uBrightness,min(1.,alpha));}`;
var fly = `#version 300 es
${helpers}
${FLY_GLSL}
void main(){vec2 p=pixel();vec4 f=flythrough(swallow(flyLens(p)));f.a*=mix(1.-smoothstep(-1.,1.,track(p)),1.,panelOut(p));if(f.a<.002)discard;outColor=vec4(f.rgb*uBrightness,f.a);}`;
var photoVertex = `#version 300 es
precision highp float;in vec2 aXY;in vec2 aUV;uniform vec2 uSize;out vec2 vUV;
void main(){gl_Position=vec4(aXY/uSize*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);vUV=aUV;}`;
var photo = `#version 300 es
${helpers}
uniform sampler2D uAtlas;in vec2 vUV;
void main(){vec2 p=pixel();float edge=1.-smoothstep(-.8,.4,track(p)),out_=panelOut(p),vis=uBackdrop*unfoldMask(p)*mix(out_,1.,edge);
float rim=1.-smoothstep(0.,1.,min(min(p.x,uSize.x-p.x)/${120}.,min(p.y,uSize.y-p.y)/${96}.));vis*=1.-rim*(1.-uHostDark)*out_;
vec4 t=texture(uAtlas,vUV);float a=t.a*vis*.92;if(a<.002)discard;outColor=vec4(t.rgb*uBrightness,a);}`;
var atlasImage = null;
function loadAtlas() {
  if (!atlasImage && typeof Image !== "undefined") {
    atlasImage = new Image();
    atlasImage.src = PHOTO_ATLAS;
  }
  return atlasImage;
}
var pointVertex = `#version 300 es
precision highp float;
in vec2 aXY;in float aRadius;in float aAlpha;in vec3 aColor;
uniform vec2 uSize;uniform float uDpr;
out float vAlpha;out vec3 vColor;
void main(){gl_Position=vec4(aXY/uSize*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);gl_PointSize=max(2.,aRadius*4.*uDpr);vAlpha=aAlpha;vColor=aColor;}`;
var points = `#version 300 es
${helpers}
in float vAlpha;in vec3 vColor;uniform float uSecondaryHalo;
${FLY_GLSL}
// Stars behind the flythrough cloud body are dimmed a little by its gas.
void main(){vec2 p=pixel();if(p.x>cx()-1.&&track(p)<1.&&uDepth<.05)discard;vec2 d=(gl_PointCoord-.5)*2.;float r=length(d);float a=exp(-r*r*9.);a+=exp(-r*r*2.)*.09*uGlow*uSecondaryHalo;a*=1.-.55*flythrough(p).a;outColor=vec4(vColor,min(1.,a*vAlpha));}`;
var lineVertex = `#version 300 es
precision highp float;in vec2 aXY;in vec4 aRGBA;uniform vec2 uSize;out vec4 vRGBA;
void main(){gl_Position=vec4(aXY/uSize*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);vRGBA=aRGBA;}`;
var lines = `#version 300 es
${helpers}
in vec4 vRGBA;void main(){outColor=vRGBA;}`;
var blackHole = `#version 300 es
${helpers}
// uKnob: the knob (and hole) grows a little while pressed (snap.mjs).
uniform float uKnob;
${ARCS_GLSL}
void main(){vec2 d=(pixel()-vec2(cx(),uSize.y*.5)-knobShake())/(uKnob*knobWobble());if(abs(d.x)>${HOLE.halfWidth}.||abs(d.y)>${HOLE.halfHeight}.)discard;vec4 shaded=holeSample(d,uHoleVisibility,uHoleMaturity,uSpin,uGlow,uBrightness,uCore,uDisk);if(max(max(shaded.r,shaded.g),shaded.b)>.002){float lum=dot(shaded.rgb,vec3(.2126,.7152,.0722));shaded.rgb=clamp(mix(vec3(lum),shaded.rgb,uStyleTone.x)*uStyleTone.y*uStyleTint,0.,1.);}
// Lightning of the charged knob, added as light over it and the track.
vec3 arc=knobArcs(d,${KNOB.radius}.)*uBrightness;float aa=clamp(max(max(arc.r,arc.g),arc.b),0.,1.),a=max(shaded.a,aa);if(a<.002)discard;outColor=vec4(min((shaded.rgb*shaded.a+arc)/a,vec3(1.)),a);}`;
var trim = `#version 300 es
${helpers}
${TRIM_GLSL}
void main(){float f=holeTrim(pixel());if(f>.999)discard;outColor=vec4(0.,0.,0.,f);}`;
function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw Error(error);
  }
  return shader;
}
function program(gl, vs, fs) {
  const p = gl.createProgram(), v = compile(gl, gl.VERTEX_SHADER, vs), f = compile(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const e = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw Error(e);
  }
  return p;
}
var WebGLRenderer = class {
  constructor(canvas) {
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power", preserveDrawingBuffer: false });
    if (!gl) throw Error("webgl2-unavailable");
    this.gl = gl;
    this.canvas = canvas;
    this.mode = "WebGL2";
    this.background = program(gl, vertex, background);
    this.dustProgram = program(gl, vertex, dust);
    this.starProgram = program(gl, pointVertex, points);
    this.lineProgram = program(gl, lineVertex, lines);
    this.holeProgram = program(gl, vertex, blackHole);
    this.flyProgram = program(gl, vertex, fly);
    this.flyValue = [0, 0, 0, 0];
    this.photoProgram = program(gl, photoVertex, photo);
    this.templateTexture = null;
    this.trimProgram = program(gl, vertex, trim);
    this.photoBuffer = gl.createBuffer();
    this.photoTexture = null;
    this.atlas = loadAtlas();
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.starBuffer = gl.createBuffer();
    this.lineBuffer = gl.createBuffer();
    gl.enable(gl.BLEND);
  }
  uniforms(p, world, w, h, dpr, dark) {
    const gl = this.gl;
    gl.useProgram(p);
    const one = (name, value) => {
      const u = gl.getUniformLocation(p, name);
      if (u !== null) gl.uniform1f(u, value);
    };
    gl.uniform2f(gl.getUniformLocation(p, "uSize"), w, h);
    one("uCloudOctaves", this.detail?.cloudOctaves ?? 3);
    one("uSecondaryHalo", this.detail?.halo ?? 1);
    one("uDpr", dpr);
    one("uPosition", world.position);
    one("uDrift", world.flight?.drift ?? 0);
    one("uSkyOffset", world.skyOffset ?? 0);
    one("uKnob", world.knobScale ?? 1);
    {
      const v = visualState(world);
      one("uSwallow", this.reduced ? 0 : v.swallow ?? 0);
      one("uCharge", v.charge ?? 0);
    }
    one("uCalm", this.reduced ? 1 : 0);
    one("uPhotos", this.photosOn ? 1 : 0);
    one("uTime", world.time);
    one("uSpin", world.spinTime);
    const look = opticalProfile(world);
    one("uBrightness", world.config.brightness);
    one("uGlow", world.config.glow * look.halo);
    const styleTone = gl.getUniformLocation(p, "uStyleTone");
    if (styleTone !== null) gl.uniform2f(styleTone, look.saturation, look.gain);
    const styleTint = gl.getUniformLocation(p, "uStyleTint");
    if (styleTint !== null) gl.uniform3fv(styleTint, look.tint);
    const t = Math.max(0, Math.min(1, (world.position - 2 / 3) / (0.96 - 2 / 3)));
    this.depth = t * t * (3 - 2 * t);
    const visual = visualState(world);
    this.depth = visual.spaceReveal;
    one("uCollapse", visual.collapseAmount);
    one("uBoom", visual.boomEnvelope);
    one("uBoomProgress", visual.boomProgress);
    one("uUnfold", visual.unfold ?? 1);
    const origin = world.evolution?.origin ?? worldPoint(world.position, 0);
    gl.uniform2f(gl.getUniformLocation(p, "uBoomOrigin"), origin.x, origin.y);
    const hole = { visibility: visual.holeVisibility, maturity: visual.holeMaturity };
    one("uHoleVisibility", hole.visibility);
    one("uHoleMaturity", hole.maturity);
    one("uContract", visual.contract ?? 0);
    one("uTorn", this.compact ? 0 : Math.min(1, (visual.unfold ?? 1) / 0.04));
    one("uDisk", world.diskSize ?? 1);
    one("uHostDark", dark ? 1 : 0);
    const panel = gl.getUniformLocation(p, "uPanel");
    if (panel !== null) {
      const q = this.panel ?? [-1e5, -1e5, 1, 1];
      gl.uniform4f(panel, q[0], q[1], q[2], q[3]);
    }
    const core = gl.getUniformLocation(p, "uCore");
    if (core !== null) gl.uniform3f(core, visual.coreFlare ?? 0, visual.corePit ?? 1, visual.diskForm ?? 1);
    one("uRecovery", recoveryAmount(world, this.reduced));
    one("uBackdrop", nebulaBackdrop(world));
    one("uDepth", this.depth);
    one("uWarp", world.warp);
    one("uLens", world.elements.lens * world.config.lensStrength * hole.visibility);
    one("uAccretion", world.accretion);
    one("uMinimal", world.styleMix.minimal);
    one("uScifi", world.styleMix.scifi);
    const tint = gl.getUniformLocation(p, "uTint");
    if (tint !== null) gl.uniform3fv(tint, world.palette);
    const ps = gl.getUniformLocation(p, "uPassers");
    if (ps !== null) {
      const list = world.passers ?? [], v = new Float32Array(PASSER_SLOTS * 4), tint2 = new Float32Array(PASSER_SLOTS * 3);
      list.slice(0, PASSER_SLOTS).forEach((s, i) => {
        v.set([s.x, s.y, s.radius, s.alpha], i * 4);
        tint2.set(s.tint, i * 3);
      });
      gl.uniform4fv(ps, v);
      gl.uniform3fv(gl.getUniformLocation(p, "uPasserTint"), tint2);
    }
    const flyAt = gl.getUniformLocation(p, "uFly");
    if (flyAt !== null) gl.uniform4fv(flyAt, this.flyValue);
    const track = gl.getUniformLocation(p, "uTrack");
    if (track !== null) gl.uniform3fv(track, VOID.rgb);
    const rim = gl.getUniformLocation(p, "uRim");
    if (rim !== null) gl.uniform3fv(rim, VOID.rim);
  }
  fullscreen(p) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    const at = gl.getAttribLocation(p, "aPosition");
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  draw(world, { dpr, dark, reduced, detail = FULL_DETAIL, clip, panel = null, compact = false, aperture = null, maskAperture = null, fold = 0 }) {
    this.panel = panel;
    this.compact = compact;
    const { width, height } = SPACE;
    this.reduced = reduced;
    this.detail = detail;
    {
      const v = visualState(world);
      this.flyValue = flyUniform(world, v.spaceReveal, reduced, v.entryDust ?? 0);
    }
    this.photosOn = detail.photos !== false && !!this.photoAtlas();
    const gl = this.gl;
    if (gl.isContextLost()) throw Error("context-lost");
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.uniforms(this.background, world, width, height, dpr, dark);
    this.fullscreen(this.background);
    if (detail.photos !== false && this.templateAtlas()) this.spritePass(world, width, height, dpr, dark, templateSprites(world.flight?.drift ?? 0, world.skyOffset ?? 0), this.templateTexture);
    if (this.photosOn) this.spritePass(world, width, height, dpr, dark, photoSprites(world.flight?.drift ?? 0, world.skyOffset ?? 0), this.photoTexture);
    this.uniforms(this.dustProgram, world, width, height, dpr, dark);
    const clouds = nebulaLayers(world, reduced, detail);
    for (let i = 0; i < 4; i++) {
      const n = clouds[i];
      const alpha = n && cloudIntersectsClip(n, clip) ? n.alpha : 0;
      gl.uniform4f(gl.getUniformLocation(this.dustProgram, `uClouds[${i}]`), n?.x ?? 0, n?.y ?? 0, n?.radius ?? 12, alpha);
      gl.uniform4f(gl.getUniformLocation(this.dustProgram, `uCloudKinds[${i}]`), n?.seed ?? 0, n?.aspect ?? 0.3, n?.tone ?? 0, n?.twist ?? 0);
    }
    this.fullscreen(this.dustProgram);
    this.flyPass(world, width, height, dpr, dark, 0, FLY.split);
    const stars = [], lineData = [], look = opticalProfile(world);
    for (const star of world.stars) {
      const s = projectStar(star, world, reduced, clouds, look);
      if (s.alpha < 2e-3) continue;
      for (const p of pointSamples(s.x, s.y, s.softening)) stars.push(p.x, p.y, s.size, s.alpha * p.weight, ...s.tone);
      if (s.trailLength > 0.03 && !reduced) {
        const len = s.trailLength;
        lineData.push(s.x - s.trailX * len, s.y - s.trailY * len, ...s.tone, 0, s.x, s.y, ...s.tone, s.alpha * 0.12);
      }
    }
    for (const m of world.meteors) {
      const v = projectMeteor(m, world, reduced);
      if (v.alpha < 1e-3) continue;
      for (const p of pointSamples(v.head.x, v.head.y, v.softening)) stars.push(p.x, p.y, v.radius, v.alpha * p.weight, ...v.tone);
      stars.push(v.head.x, v.head.y, v.radius * 2.6, v.alpha * 0.22, ...v.tone);
      for (let j = 1; j < v.points.length; j++) {
        const a = v.points[j - 1], b = v.points[j], aa = v.alpha * 0.55 * (1 - (j - 1) / (v.points.length - 1)), bb = v.alpha * 0.55 * (1 - j / (v.points.length - 1));
        lineData.push(a.x, a.y, ...v.tone, aa, b.x, b.y, ...v.tone, bb);
      }
    }
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
    if (stars.length) {
      this.uniforms(this.starProgram, world, width, height, dpr, dark);
      gl.uniform2f(gl.getUniformLocation(this.starProgram, "uFlyRange"), 0, FLY.split);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.starBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stars), gl.DYNAMIC_DRAW);
      for (const [name, size, offset] of [["aXY", 2, 0], ["aRadius", 1, 2], ["aAlpha", 1, 3], ["aColor", 3, 4]]) {
        const a = gl.getAttribLocation(this.starProgram, name);
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, size, gl.FLOAT, false, 28, offset * 4);
      }
      gl.drawArrays(gl.POINTS, 0, stars.length / 7);
    }
    if (lineData.length) {
      this.uniforms(this.lineProgram, world, width, height, dpr, dark);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineData), gl.DYNAMIC_DRAW);
      for (const [name, size, offset] of [["aXY", 2, 0], ["aRGBA", 4, 2]]) {
        const a = gl.getAttribLocation(this.lineProgram, name);
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, size, gl.FLOAT, false, 24, offset * 4);
      }
      gl.drawArrays(gl.LINES, 0, lineData.length / 6);
    }
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.flyPass(world, width, height, dpr, dark, FLY.split, 99);
    const center = worldPoint(world.position, 0);
    gl.enable(gl.SCISSOR_TEST);
    const hw = HOLE.halfWidth * KNOB.pressed, hh = HOLE.halfHeight * KNOB.pressed;
    gl.scissor(Math.floor((center.x - hw) * dpr), Math.floor((height - center.y - hh) * dpr), Math.ceil(hw * 2 * dpr) + 1, Math.ceil(hh * 2 * dpr) + 1);
    this.uniforms(this.holeProgram, world, width, height, dpr, dark);
    this.fullscreen(this.holeProgram);
    gl.disable(gl.SCISSOR_TEST);
    if (aperture) this.trimPass(world, width, height, dpr, dark, aperture, maskAperture ?? aperture, fold);
    gl.finish();
  }
  // The atlas texture, once its image has decoded (null until then).
  photoAtlas() {
    if (this.photoTexture) return this.photoTexture;
    const img = this.atlas;
    if (!img?.complete || !img.naturalWidth) return null;
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return this.photoTexture = t;
  }
  // Paint the template atlas once (it lives as long as this context).
  templateAtlas() {
    if (this.templateTexture) return this.templateTexture;
    const gl = this.gl, { width: w, height: h } = TEMPLATE_ATLAS, t = gl.createTexture(), fb = gl.createFramebuffer(), p = program(gl, TEMPLATE_BAKE_VERTEX, TEMPLATE_BAKE), buffer = gl.createBuffer();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.5, 0.5, 0.5, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const data = templateBakeVertices();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const used = [];
    for (const [name, size, offset] of [["aXY", 2, 0], ["aW", 2, 2], ["aA", 4, 4], ["aB", 4, 8]]) {
      const a = gl.getAttribLocation(p, name);
      if (a < 0) continue;
      used.push(a);
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, size, gl.FLOAT, false, TEMPLATE_STRIDE * 4, offset * 4);
    }
    gl.drawArrays(gl.TRIANGLES, 0, data.length / TEMPLATE_STRIDE);
    for (const a of used) gl.disableVertexAttribArray(a);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(p);
    gl.enable(gl.BLEND);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return this.templateTexture = t;
  }
  spritePass(world, width, height, dpr, dark, sprites, texture) {
    if (!sprites.length) return;
    const gl = this.gl, data = [];
    const pull = this.reduced ? 0 : visualState(world).swallow ?? 0, knob = worldPoint(world.position, 0), shrink = swallowScale(pull);
    for (const s0 of sprites) {
      const at = swallowPoint({ x: s0.x, y: s0.y }, knob, pull), s = { ...s0, x: at.x, y: at.y, hw: s0.hw * shrink, hh: s0.hh * shrink };
      const [l, t, r, b] = [s.x - s.hw, s.y - s.hh, s.x + s.hw, s.y + s.hh], [u0, v0, u1, v1] = s.uv;
      data.push(l, t, u0, v0, r, t, u1, v0, l, b, u0, v1, l, b, u0, v1, r, t, u1, v0, r, b, u1, v1);
    }
    this.uniforms(this.photoProgram, world, width, height, dpr, dark);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(this.photoProgram, "uAtlas"), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.photoBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    for (const [name, offset] of [["aXY", 0], ["aUV", 2]]) {
      const a = gl.getAttribLocation(this.photoProgram, name);
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 16, offset * 4);
    }
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 4);
  }
  trimPass(world, width, height, dpr, dark, aperture, maskAperture, fold = 0) {
    const gl = this.gl, same = fold <= 0 && ["x", "y", "width", "height", "feather"].every((k) => aperture[k] === maskAperture[k]), { rx, ry } = HOLE_ENVELOPE, r = KNOB_RANGE, knob = worldPoint(world.position, 0), shape = knobShape(visualState(world).holeVisibility);
    if (same) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(Math.floor((r.from - rx) * dpr), Math.floor((height - r.y - ry) * dpr), Math.ceil((r.to - r.from + 2 * rx) * dpr) + 1, Math.ceil(2 * ry * dpr) + 1);
    }
    this.uniforms(this.trimProgram, world, width, height, dpr, dark);
    const p = this.trimProgram;
    gl.uniform4f(gl.getUniformLocation(p, "uView"), aperture.x, aperture.y, aperture.width, aperture.height);
    gl.uniform1f(gl.getUniformLocation(p, "uFeather"), aperture.feather ?? 0);
    gl.uniform4f(gl.getUniformLocation(p, "uMaskView"), maskAperture.x, maskAperture.y, maskAperture.width, maskAperture.height);
    gl.uniform1f(gl.getUniformLocation(p, "uMaskFeather"), maskAperture.feather ?? 0);
    gl.uniform1f(gl.getUniformLocation(p, "uFold"), fold);
    gl.uniform3f(gl.getUniformLocation(p, "uRange"), r.from, r.to, r.y);
    gl.uniform4f(gl.getUniformLocation(p, "uKnobAt"), knob.x, knob.y, shape.rx, shape.ry);
    gl.blendFuncSeparate(gl.ZERO, gl.SRC_ALPHA, gl.ZERO, gl.SRC_ALPHA);
    this.fullscreen(p);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.SCISSOR_TEST);
  }
  flyPass(world, width, height, dpr, dark, zMin, zMax) {
    if (!(this.flyValue[3] > 0 || this.flyValue[2] > 0 && zMax > FLY.speeds.at(-1))) return;
    const gl = this.gl;
    this.uniforms(this.flyProgram, world, width, height, dpr, dark);
    gl.uniform2f(gl.getUniformLocation(this.flyProgram, "uFlyRange"), zMin, zMax);
    this.fullscreen(this.flyProgram);
  }
  dispose() {
    const gl = this.gl;
    for (const p of [this.background, this.dustProgram, this.starProgram, this.lineProgram, this.holeProgram, this.flyProgram, this.photoProgram, this.trimProgram]) gl.deleteProgram(p);
    for (const b of [this.quad, this.starBuffer, this.lineBuffer, this.photoBuffer]) gl.deleteBuffer(b);
    if (this.photoTexture) gl.deleteTexture(this.photoTexture);
    if (this.templateTexture) gl.deleteTexture(this.templateTexture);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
};

// src/render/nebula-canvas.mjs
var NebulaRaster = class {
  constructor() {
    this.tiles = /* @__PURE__ */ new Map();
  }
  draw(ctx, layers, brightness, detail = FULL_DETAIL, clip) {
    const ids = new Set(layers.map((n) => n.id));
    for (const id of this.tiles.keys()) if (!ids.has(id)) {
      const tile = this.tiles.get(id).tile;
      tile.width = 1;
      tile.height = 1;
      this.tiles.delete(id);
    }
    for (const n of layers) {
      if (n.alpha < 1e-3 || !cloudIntersectsClip(n, clip)) continue;
      const key = `${detail.level}:${Math.floor(n.phase * 160)}:${Math.round(n.twist * 16)}`;
      let cached = this.tiles.get(n.id);
      if (!cached || cached.key !== key) {
        const tile = cached?.tile ?? document.createElement("canvas");
        const w = detail.tileWidth, h = detail.tileHeight;
        tile.width = w;
        tile.height = h;
        const c = tile.getContext("2d"), image = c.createImageData(w, h), color = nebulaColor(n.tone);
        const material2 = n.detailOctaves === detail.cloudOctaves ? n : { ...n, detailOctaves: detail.cloudOctaves };
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const u = (x + 0.5) / w * 4 - 2, v = (y + 0.5) / h * 4 - 2, i = (y * w + x) * 4;
          image.data[i] = color[0] * 255;
          image.data[i + 1] = color[1] * 255;
          image.data[i + 2] = color[2] * 255;
          image.data[i + 3] = nebulaDensity(n.x + u * n.radius, n.y + v * n.radius * n.aspect, material2) * 255;
        }
        c.putImageData(image, 0, 0);
        cached = { key, tile };
        this.tiles.set(n.id, cached);
      }
      ctx.save();
      ctx.globalAlpha = n.alpha * brightness;
      ctx.drawImage(cached.tile, n.x - n.radius * 2, n.y - n.radius * n.aspect * 2, n.radius * 4, n.radius * n.aspect * 4);
      ctx.restore();
    }
  }
  dispose() {
    for (const { tile } of this.tiles.values()) {
      tile.width = 1;
      tile.height = 1;
    }
    this.tiles.clear();
  }
};

// src/render/hole-canvas.mjs
var HoleRaster = class {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.key = "";
  }
  draw(ctx, world, x, y, dpr = 1, size = 1) {
    const visual = visualState(world), look = opticalProfile(world, true);
    const state = { visibility: visual.holeVisibility, maturity: visual.holeMaturity, flare: Math.round((visual.coreFlare ?? 0) * 20) / 20, pit: Math.round((visual.corePit ?? 1) * 20) / 20, form: Math.round((visual.diskForm ?? 1) * 20) / 20, spin: Math.floor(world.spinTime * 12) / 12, size: Math.round((world.diskSize ?? 1) * 40) / 40, glow: world.config.glow * look.halo, brightness: world.config.brightness };
    const scale2 = Math.min(1.5, dpr), width = Math.round(HOLE.halfWidth * 2 * scale2), height = Math.round(HOLE.halfHeight * 2 * scale2);
    const key = JSON.stringify([state, width, height, look]), tinted = look.saturation !== 1 || look.gain !== 1 || look.tint.some((v) => v !== 1);
    if (key !== this.key) {
      this.key = key;
      this.canvas.width = width;
      this.canvas.height = height;
      const image = this.ctx.createImageData(width, height);
      for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
        const rgba = sampleHole((i + 0.5) / scale2 - HOLE.halfWidth, (j + 0.5) / scale2 - HOLE.halfHeight, state), at = (j * width + i) * 4, rgb = tinted ? opticalColor(rgba.slice(0, 3), look) : rgba;
        for (let k = 0; k < 4; k++) image.data[at + k] = Math.round((k === 3 ? rgba[3] : rgb[k]) * 255);
      }
      this.ctx.putImageData(image, 0, 0);
    }
    ctx.drawImage(this.canvas, x - HOLE.halfWidth * size, y - HOLE.halfHeight * size, HOLE.halfWidth * 2 * size, HOLE.halfHeight * 2 * size);
  }
  dispose() {
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.key = "";
  }
};

// src/render/canvas.mjs
var CanvasRenderer = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw Error("canvas-unavailable");
    this.mode = "Canvas 2D";
    this.hole = new HoleRaster();
    this.nebula = new NebulaRaster();
    this.trim = document.createElement("canvas");
    this.trimKey = "";
  }
  draw(world, { dpr, dark, reduced, detail = FULL_DETAIL, clip, aperture, maskAperture, fold = 0 }) {
    const { width: w, height: h, railX, railWidth } = SPACE;
    const c = this.ctx, p = world.position, cx = worldPoint(p, 0).x, cy = SPACE.centerY, depth = visualState(world).spaceReveal, purple = smooth(1 / 3, 2 / 3, p), cfg = world.config;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    c.save();
    c.beginPath();
    c.roundRect(railX, cy - TRACK.radius, railWidth, TRACK.radius * 2, TRACK.radius);
    const born = visualState(world).holeVisibility > 0.5;
    c.fillStyle = born ? VOID.css : dark ? REST.darkCss : REST.lightCss;
    c.fill();
    c.strokeStyle = born || dark ? "rgba(13,14,19,.9)" : "rgba(150,155,170,.55)";
    c.lineWidth = 1.5;
    c.stroke();
    c.clip();
    c.beginPath();
    c.rect(0, 0, cx, h);
    c.clip();
    const g = c.createLinearGradient(0, cy - TRACK.radius, 0, cy + TRACK.radius);
    g.addColorStop(0, purple > 0.5 ? "#0a0514" : "#81c9f1");
    g.addColorStop(0.5, purple > 0.5 ? "#170a26" : "#a1def6");
    g.addColorStop(1, purple > 0.5 ? "#06030c" : "#5b9fc9");
    c.fillStyle = g;
    c.fillRect(0, cy - TRACK.radius, cx, TRACK.radius * 2);
    const contract = visualState(world).contract ?? 0;
    if (purple > 0) {
      const r = 55 / (1 + 3 * contract), glow = c.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
      glow.addColorStop(0, `rgba(140,70,220,${0.75 * purple * (1 - 0.9 * contract)})`);
      glow.addColorStop(1, "rgba(140,70,220,0)");
      c.fillStyle = glow;
      c.fillRect(0, cy - 19, cx, 38);
    }
    if (purple > 0) {
      c.globalAlpha = purple * (1 - 0.9 * (visualState(world).contract ?? 0));
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        for (let x = 0; x <= cx; x += 4) {
          const y = cy + Math.sin(x * 0.03 - world.time * 0.7 + i) * 4 + (i - 1.5) * 2;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.strokeStyle = i % 2 ? "#cbb3ff88" : "#aaa4ff66";
        c.lineWidth = i ? 0.6 : 1.2;
        c.stroke();
      }
      c.globalAlpha = 1;
    }
    c.save();
    c.beginPath();
    c.arc(cx, cy, Math.max(0, (visualState(world).unfold ?? 1) * 380), 0, Math.PI * 2);
    c.clip();
    c.fillStyle = `rgba(1,3,10,${nebulaBackdrop(world)})`;
    c.fillRect(0, cy - 19, cx, 38);
    c.restore();
    const returning = recoveryAmount(world, reduced);
    if (returning > 1e-3) {
      c.lineWidth = 0.65;
      for (let x = railX; x < cx; x += 2) {
        const a = recoveryRibbon(x, world, returning), b = recoveryRibbon(Math.min(cx, x + 2), world, returning);
        c.strokeStyle = `rgba(140,100,204,${a.alpha * cfg.brightness})`;
        c.beginPath();
        c.moveTo(x, a.y);
        c.lineTo(Math.min(cx, x + 2), b.y);
        c.stroke();
      }
    }
    const clouds = nebulaLayers(world, reduced, detail), look = opticalProfile(world);
    const visual = visualState(world), pull = reduced ? 0 : visual.swallow ?? 0;
    c.restore();
    c.save();
    c.beginPath();
    if (pull > 0) c.arc(cx, cy, Math.hypot(w, h) * (1 - pull) ** 1.5, 0, Math.PI * 2);
    else c.rect(0, 0, cx, h);
    c.clip();
    if (pull > 0) {
      const k = swallowScale(pull);
      c.save();
      c.translate(cx, cy);
      c.rotate(-IMPLODE.twist * pull * 0.5);
      c.scale(k, k);
      c.translate(-cx, -cy);
    }
    this.nebula.draw(c, clouds, cfg.brightness, detail, clip);
    if (pull > 0) c.restore();
    c.globalCompositeOperation = "lighter";
    for (const star of world.stars) {
      const s = projectStar(star, world, reduced, clouds, look);
      if (s.alpha < 1e-3) continue;
      for (const optical of pointSamples(s.x, s.y, s.softening)) {
        c.globalAlpha = s.alpha * optical.weight;
        c.fillStyle = `rgb(${s.tone.map((v) => Math.round(v * 255)).join(",")})`;
        c.beginPath();
        c.arc(optical.x, optical.y, Math.max(0.3, s.size * 0.6), 0, Math.PI * 2);
        c.fill();
        if (s.size > 0.95) {
          c.globalAlpha = s.alpha * 0.15 * look.halo * optical.weight * detail.halo;
          c.beginPath();
          c.arc(optical.x, optical.y, s.size * 2, 0, Math.PI * 2);
          c.fill();
        }
      }
      if (s.trailLength > 0.03 && !reduced) {
        c.globalAlpha = s.alpha * 0.12;
        c.strokeStyle = c.fillStyle;
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(s.x, s.y);
        c.lineTo(s.x - s.trailX * s.trailLength, s.y - s.trailY * s.trailLength);
        c.stroke();
      }
    }
    for (const m of world.meteors) {
      const v = projectMeteor(m, world, reduced);
      if (v.alpha < 1e-3) continue;
      c.fillStyle = `rgb(${v.tone.map((x) => Math.round(x * 255)).join(",")})`;
      for (const optical of pointSamples(v.head.x, v.head.y, v.softening)) {
        c.globalAlpha = v.alpha * optical.weight;
        c.beginPath();
        c.arc(optical.x, optical.y, v.radius, 0, Math.PI * 2);
        c.fill();
      }
      c.lineWidth = 0.55;
      for (let j = 1; j < v.points.length; j++) {
        const a = v.points[j - 1], b = v.points[j];
        c.globalAlpha = v.alpha * 0.22 * (1 - (j - 0.5) / (v.points.length - 1));
        c.strokeStyle = c.fillStyle;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
    }
    if (pull > 0) this.inflow(c, cx, cy, pull, world.time);
    c.restore();
    const jolt = knobJitter(visual.charge ?? 0, world.time, reduced ? 1 : 0), size = (world.knobScale ?? 1) * jolt.scale;
    this.hole.draw(c, world, cx + jolt.x, cy + jolt.y, dpr, size);
    this.arcs(c, cx + jolt.x, cy + jolt.y, KNOB.radius * size, visual.charge ?? 0, world.time, reduced ? 1 : 0, cfg.brightness);
    if (aperture) this.trimPass(c, world, visual, aperture, maskAperture ?? aperture, fold);
  }
  // Light of matter falling in while the hole swallows the sky: three winding arms.
  inflow(c, cx, cy, s, time) {
    c.save();
    c.globalCompositeOperation = "lighter";
    c.lineCap = "round";
    for (let arm = 0; arm < 3; arm++) for (let r = 24; r < 170; r += 6) {
      const a = (t) => (Math.PI / 2 + 0.11 * t - 7 * time + arm * Math.PI * 2) / 3, alpha = s * (1 - s) * 3.2 * Math.exp(-r / 55) * 0.5;
      if (alpha < 0.01) break;
      c.strokeStyle = `rgba(255,184,115,${Math.min(1, alpha)})`;
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(cx + Math.cos(a(r)) * r, cy + Math.sin(a(r)) * r);
      c.lineTo(cx + Math.cos(a(r + 6)) * (r + 6), cy + Math.sin(a(r + 6)) * (r + 6));
      c.stroke();
    }
    c.restore();
  }
  // Lightning of the charged knob (arcs.mjs).
  arcs(c, x, y, R, charge, time, calm, brightness) {
    if (charge < 0.02) return;
    const q = charge * charge;
    c.save();
    c.translate(x, y);
    c.globalCompositeOperation = "lighter";
    c.lineJoin = "round";
    const aura = c.createRadialGradient(0, 0, Math.max(0, R - 6), 0, 0, R + 6);
    aura.addColorStop(0, "rgba(140,76,242,0)");
    aura.addColorStop(0.5, `rgba(140,76,242,${0.35 * q * brightness})`);
    aura.addColorStop(1, "rgba(140,76,242,0)");
    c.fillStyle = aura;
    c.beginPath();
    c.arc(0, 0, R + 6, 0, Math.PI * 2);
    c.fill();
    for (const arc of arcStrokes(charge, time, calm, R)) {
      c.beginPath();
      arc.points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
      c.shadowColor = "rgba(140,158,255,.9)";
      c.shadowBlur = 5;
      c.strokeStyle = `rgba(140,158,255,${arc.alpha * brightness})`;
      c.lineWidth = arc.width * 2.4;
      c.stroke();
      c.shadowBlur = 0;
      c.strokeStyle = `rgba(235,242,255,${arc.alpha * charge * brightness})`;
      c.lineWidth = arc.width;
      c.stroke();
    }
    c.restore();
  }
  // The CSS mask holds the open view and the knob's whole range; trim back to
  // the view (or the folded rail) plus the knob, as WebGL's trimPass does.
  // Computed at a quarter of the resolution and cached.
  trimPass(c, world, visual, view, maskView, fold) {
    const step = 4, cols = Math.ceil(SPACE.width / step), rows = Math.ceil(SPACE.height / step), at = worldPoint(world.position, 0), shape = knobShape(visual.holeVisibility), knob = { x: Math.round(at.x), y: at.y, rx: Math.round(shape.rx), ry: Math.round(shape.ry) }, f = Math.round(fold * 40) / 40, key = JSON.stringify([view, maskView, knob, f]);
    if (key !== this.trimKey) {
      this.trimKey = key;
      const t = this.trim, tc = t.getContext("2d");
      t.width = cols;
      t.height = rows;
      const image = tc.createImageData(cols, rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = (j * cols + i) * 4;
        image.data[k] = image.data[k + 1] = image.data[k + 2] = 255;
        image.data[k + 3] = Math.round(holeTrim({ x: (i + 0.5) * step, y: (j + 0.5) * step }, view, KNOB_RANGE, knob, maskView, f) * 255);
      }
      tc.putImageData(image, 0, 0);
    }
    c.save();
    c.globalCompositeOperation = "destination-in";
    c.imageSmoothingEnabled = true;
    c.drawImage(this.trim, 0, 0, cols * step, rows * step);
    c.restore();
  }
  dispose() {
    this.hole.dispose();
    this.nebula.dispose();
    this.trim.width = 1;
    this.trim.height = 1;
    this.trimKey = "";
  }
};

// src/render/snap.mjs
var SNAP = Object.freeze({ ms: 260 });
var Snap = class {
  constructor() {
    this.from = 0;
    this.to = null;
    this.t = 1;
  }
  step(shown, target, dt, { follow = false, reduced = false } = {}) {
    if (follow || reduced || shown == null) {
      this.to = target;
      this.t = 1;
      return target;
    }
    if (target !== this.to) {
      this.from = shown;
      this.to = target;
      this.t = 0;
    }
    this.t = Math.min(1, this.t + Math.max(0, dt) * 1e3 / SNAP.ms);
    return this.from + (this.to - this.from) * (1 - (1 - this.t) ** 3);
  }
};
function knobScale(previous, pressed, dt, reduced = false) {
  const goal = pressed ? KNOB.pressed : 1;
  return reduced ? goal : previous + (goal - previous) * (1 - Math.exp(-Math.max(0, dt) * 18));
}

// src/render/engine.mjs
var FOLD_SECONDS = 0.24;
var COMPACT_PANEL = [-1e5, -1e5, 2e5, 2e5];
var serial = 0;
var activeEngines = /* @__PURE__ */ new Set();
var drawingEngines = /* @__PURE__ */ new Set();
var RenderEngine = class {
  constructor(container, { config, getInput, diagnostics, forceCanvas = false, onStatus = () => {
  }, scene = {}, escape = false }) {
    this.escape = escape;
    this.scene = scene;
    this.container = container;
    this.getInput = getInput;
    this.diagnostics = diagnostics;
    this.onStatus = onStatus;
    this.id = ++serial;
    this.world = scene.world ?? new Universe({ config });
    if (!scene.world) this.world.position = getInput().position;
    scene.world = this.world;
    this.world.setConfig(config);
    this.shownPosition = scene.shownPosition ?? getInput().position;
    this.active = true;
    this.last = 0;
    this.frame = 0;
    this.frames = 0;
    this.total = 0;
    this.fps = 60;
    this.budget = 1;
    this.slow = 0;
    this.fast = 0;
    this.ratio = 1;
    this.lost = 0;
    this.forceCanvas = forceCanvas;
    this.evolution = scene.evolution ?? new Evolution(getInput().position);
    scene.evolution = this.evolution;
    this.world.evolution = this.evolution;
    if (!this.evolution.active && !scene.holdAccepted?.()) this.evolution.suspend(getInput().position);
    activeEngines.add(this);
    this.viewport = document.createElement("div");
    this.viewport.className = escape ? "se-world-viewport se-escape" : "se-world-viewport";
    this.viewport.setAttribute("aria-hidden", "true");
    container.appendChild(this.viewport);
    if (escape) {
      this.catcher = document.createElement("div");
      this.catcher.className = "se-scene-catcher";
      this.viewport.appendChild(this.catcher);
    }
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.className = "se-render-canvas";
    this.viewport.appendChild(this.canvas);
    this.staticLayer = document.createElement("div");
    Object.assign(this.staticLayer.style, { position: "absolute", width: `${SPACE.width}px`, height: `${SPACE.height}px`, display: "none" });
    this.staticImage = document.createElement("img");
    this.staticImage.alt = "";
    Object.assign(this.staticImage.style, { position: "absolute", width: "76px", height: "64px", top: "28px" });
    this.staticLayer.appendChild(this.staticImage);
    this.viewport.appendChild(this.staticLayer);
    this.originalThumb = container.querySelector(".se-static-thumb");
    if (this.originalThumb) this.originalThumb.style.visibility = "hidden";
    this.lifecycle = "running";
    this.generation = 0;
    this.intersectionVisible = null;
    this.loss = (e) => {
      e.preventDefault();
      if (!this.active || this.lifecycle !== "running" || !this.renderer) return;
      this.lost++;
      this.diagnostics?.record("renderer-fallback", { reason: "context-lost" });
      this.switchToCanvas();
    };
    this.renderer = null;
    this.resize = new ResizeObserver(() => {
      if (!this.active) return;
      this.needsSize = true;
      this.checkVisibility();
    });
    this.resize.observe(container);
    this.needsSize = true;
    this.screenClip = () => {
      this.updateScreenClip();
      this.checkVisibility();
    };
    window.addEventListener("resize", this.screenClip);
    window.addEventListener("scroll", this.screenClip, true);
    this.applyAperture();
    this.visibility = () => this.checkVisibility();
    document.addEventListener("visibilitychange", this.visibility);
    if (typeof IntersectionObserver !== "undefined") {
      this.intersection = new IntersectionObserver((entries) => {
        if (!this.active) return;
        for (const entry of entries) if (entry.target === this.viewport) {
          this.intersectionVisible = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
        }
        this.checkVisibility();
      });
      this.intersection.observe(this.viewport);
    }
    if (typeof MutationObserver !== "undefined") {
      this.attributes = new MutationObserver(() => this.checkVisibility());
      for (let n = container; n; n = n.parentElement) this.attributes.observe(n, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
    }
    this.checkVisibility();
    if (this.lifecycle === "running") this.createRenderer();
    this.schedule();
  }
  replaceCanvas() {
    this.canvas.removeEventListener("webglcontextlost", this.loss);
    const fresh = this.canvas.cloneNode();
    this.canvas.replaceWith(fresh);
    this.canvas = fresh;
    this.canvas.addEventListener("webglcontextlost", this.loss);
    this.needsSize = true;
  }
  createRenderer() {
    try {
      if (this.forceCanvas) throw Error("canvas-requested");
      this.renderer = new WebGLRenderer(this.canvas);
    } catch {
      this.replaceCanvas();
      try {
        this.renderer = new CanvasRenderer(this.canvas);
      } catch {
        this.renderer = null;
      }
    }
    this.canvas.addEventListener("webglcontextlost", this.loss);
    this.rendererFailed = !this.renderer;
    this.updateDrawingMembership();
    this.onStatus(this.renderer?.mode ?? "\u9759\u6001\u6E10\u53D8");
    this.diagnostics?.record("renderer-start", { renderer: this.renderer?.mode ?? "static" });
  }
  releaseRenderer() {
    this.canvas.removeEventListener("webglcontextlost", this.loss);
    const renderer = this.renderer;
    this.renderer = null;
    try {
      renderer?.dispose();
    } catch {
    }
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.updateDrawingMembership();
  }
  switchToCanvas() {
    if (!this.active || this.lifecycle !== "running") return;
    this.evolution.suspend(this.getInput().position);
    this.forceCanvas = true;
    this.releaseRenderer();
    this.replaceCanvas();
    this.createRenderer();
  }
  updateDrawingMembership() {
    if (this.active && this.lifecycle === "running" && this.renderer && this.world.target.quality !== "static") drawingEngines.add(this);
    else drawingEngines.delete(this);
  }
  isVisible() {
    if (document.hidden || this.intersectionVisible === false || !this.container.isConnected || !this.container.getClientRects().length) return false;
    const css = getComputedStyle(this.container);
    if (css.visibility === "hidden" || css.visibility === "collapse") return false;
    const r = this.viewport.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < document.documentElement.clientHeight && r.left < document.documentElement.clientWidth;
  }
  checkVisibility() {
    if (!this.active) return;
    if (!this.isVisible()) {
      this.sleep();
      return;
    }
    if (this.lifecycle === "sleeping" || this.lifecycle === "released") {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = 0;
      this.generation++;
      if (this.lifecycle === "released") this.rendererFailed = false;
      this.lifecycle = "running";
      this.last = 0;
      this.nextFrame = 0;
      this.total = 0;
      this.frames = 0;
      this.slow = 0;
      this.fast = 0;
      this.needsSize = true;
      this.updateDrawingMembership();
      this.schedule();
    }
  }
  sleep() {
    if (!this.active || this.lifecycle !== "running") return;
    this.lifecycle = "sleeping";
    const generation = ++this.generation;
    cancelAnimationFrame(this.frame);
    clearTimeout(this.timer);
    this.frame = 0;
    this.timer = 0;
    this.last = 0;
    this.nextFrame = 0;
    this.scene.onInvisible?.();
    this.evolution.suspend(this.getInput().position);
    this.updateDrawingMembership();
    this.releaseTimer = setTimeout(() => {
      if (!this.active || generation !== this.generation || this.lifecycle !== "sleeping") return;
      this.releaseTimer = 0;
      this.lifecycle = "releasing";
      this.releaseRenderer();
      this.lifecycle = "released";
      this.diagnostics?.record("renderer-sleep-release", {});
    }, 2e3);
  }
  schedule() {
    if (!this.active || this.lifecycle !== "running" || this.frame) return;
    this.frame = requestAnimationFrame(this.tick);
  }
  refreshInput() {
    if (!this.active) return;
    this.checkVisibility();
    if (this.lifecycle !== "running") return;
    if (!this.renderer || this.world.target.quality === "static") {
      this.world.position = this.getInput().position;
      this.evolution.suspend(this.world.position);
      this.drawStatic();
      this.canvas.style.visibility = "hidden";
      this.staticLayer.style.display = "block";
    }
  }
  setConfig(config) {
    if (!this.active) return;
    this.world.setConfig(config);
    this.applyAperture();
    this.updateDrawingMembership();
    this.refreshInput();
  }
  // The host panel (the popup, or the settings preview's stand-in) in world
  // coordinates: outer space stays a thin halo over our own text.
  findPanel() {
    const host = this.container.closest(".se-popup") ?? this.container.closest(".se-scene-stage")?.querySelector(".se-scene-panel");
    if (!host) {
      this.panel = null;
      return;
    }
    const r = this.container.getBoundingClientRect(), s = r.width / (this.container.offsetWidth || r.width || 1), p = host.getBoundingClientRect(), ox = r.left + r.width / 2 - SPACE.width / 2 * s, oy = r.top + r.height / 2 - SPACE.height / 2 * s;
    this.panel = [(p.left - ox) / s, (p.top - oy) / s, p.width / s, p.height / s];
  }
  // The escaped layer is fixed to screen coordinates, but a host or another plugin
  // may give an ancestor a transform/filter/contain, which then becomes the origin
  // (and scale) of position:fixed. Measure where the layer really lands and correct.
  place() {
    this.findPanel();
    if (!this.escape || !this.aperture) return;
    const r = this.container.getBoundingClientRect(), v = this.viewport, s = v.style, at = v.getBoundingClientRect(), k = at.width > 0 && v.offsetWidth > 0 ? at.width / v.offsetWidth : 1, ox = at.left - (parseFloat(s.left) || 0) * k, oy = at.top - (parseFloat(s.top) || 0) * k, round = (x) => `${Math.round(x * 100) / 100}px`, left = round((r.left + r.width / 2 - SPACE.width * k / 2 - ox) / k), top = round((r.top + r.height / 2 - SPACE.height * k / 2 - oy) / k);
    if (s.left !== left || s.top !== top) Object.assign(s, { left, top });
  }
  // The CSS mask is laid out for the open view (scene.openConfig) plus the knob's
  // whole range and is rewritten only when that changes, never on collapse or
  // while the knob moves: each rewrite stalls the page for 200-300 ms on a real
  // GPU. The actual window (collapsed or open) is cut by the renderer's trim.
  applyAperture() {
    const open = this.scene.openConfig ?? this.world.target, key = JSON.stringify(apertureFor(open));
    if (key !== this.maskKey) {
      this.maskKey = key;
      this.maskAperture = layoutAperture(this.viewport, this.canvas, open, KNOB_RANGE);
    }
    this.aperture = apertureFor(this.world.target);
    if (this.catcher) Object.assign(this.catcher.style, { left: `${this.aperture.x}px`, top: `${this.aperture.y}px`, width: `${this.aperture.width}px`, height: `${this.aperture.height}px` });
    this.place();
    Object.assign(this.staticLayer.style, { left: this.canvas.style.left, top: this.canvas.style.top, maskImage: this.canvas.style.maskImage });
    this.updateScreenClip();
  }
  // Keeps the hole's part of the viewport mask on the knob; restyles only on change.
  // The popup panel is torn open with the space: its text fades as the tear
  // crosses it and returns when space folds back (CSS reads --se-torn).
  // The catcher stands in for the opened sky: its first click closes it. With no
  // sky unfolded (Off to High after a drag) it would be an invisible wall over DSH's
  // own buttons that eats a click with no feedback, so then clicks pass through.
  updateCatcher() {
    if (!this.catcher) return;
    const pe = (visualState(this.world).unfold ?? 0) > 0.02 ? "auto" : "none";
    if (this.catcher.style.pointerEvents !== pe) this.catcher.style.pointerEvents = pe;
  }
  updateTorn() {
    if (!this.viewport.classList.contains("se-escape")) return;
    const u = visualState(this.world).unfold ?? 0, t = u <= 0.08 ? 0 : u >= 0.45 ? 1 : ((u - 0.08) / 0.37) ** 2 * (3 - 2 * (u - 0.08) / 0.37), v = Math.round(t * 50) / 50;
    if (v === this.tornKey) return;
    this.tornKey = v;
    this.container.closest(".se-popup")?.style.setProperty("--se-torn", String(v));
  }
  updateScreenClip() {
    if (!this.active) return;
    const inset = screenInsets(this.viewport.getBoundingClientRect(), document.documentElement.clientWidth, document.documentElement.clientHeight), scale2 = [1, 2, 4].includes(this.scene.inspectionScale) ? this.scene.inspectionScale : 1, a = this.aperture;
    this.renderClip = { left: Math.max(a.x, inset.left / scale2), top: Math.max(a.y, inset.top / scale2), right: Math.min(a.x + a.width, SPACE.width - inset.right / scale2), bottom: Math.min(a.y + a.height, SPACE.height - inset.bottom / scale2) };
    this.viewport.style.clipPath = `inset(${inset.top / scale2}px ${inset.right / scale2}px ${inset.bottom / scale2}px ${inset.left / scale2}px)`;
  }
  drawStatic() {
    const p = this.getInput().position;
    this.container.style.setProperty("--se-static-fill", `${(SPACE.thumbInset + p * SPACE.travel) / SPACE.railWidth * 100}%`);
    const key = `${p}:${this.world.target.brightness}`;
    if (key !== this.staticKey) {
      this.staticKey = key;
      this.staticImage.src = `data:image/svg+xml,${encodeURIComponent(staticHoleSvg(this.evolution.visual().holeVisibility < 0.5 ? 2 / 3 : Math.max(LIMITS.boom - 5e-3, p), this.world.target.brightness))}`;
      this.staticImage.style.left = `${SPACE.railX + SPACE.thumbInset + p * SPACE.travel - 38}px`;
    }
  }
  tick = (now) => {
    this.frame = 0;
    if (!this.active || this.lifecycle !== "running") return;
    this.checkVisibility();
    if (this.lifecycle !== "running") return;
    if (!this.renderer && this.world.target.quality !== "static" && !this.rendererFailed) {
      this.replaceCanvas();
      this.createRenderer();
      if (!this.renderer) this.rendererFailed = true;
    }
    if (this.nextFrame && now + 1 < this.nextFrame) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    this.nextFrame = Math.max((this.nextFrame || now) + 1e3 / 60, now);
    const ratio = Math.min(window.devicePixelRatio || 1, this.budget < 0.6 ? 1.5 : 2.5);
    if (this.needsSize || ratio !== this.ratio) {
      this.width = SPACE.width;
      this.height = SPACE.height;
      this.ratio = ratio;
      this.canvas.width = Math.round(this.width * ratio);
      this.canvas.height = Math.round(this.height * ratio);
      this.needsSize = false;
      this.applyAperture();
    }
    this.place();
    const dt = this.last ? Math.min((now - this.last) / 1e3, 0.05) : 1 / 60;
    const gap = this.last ? now - this.last : 16;
    this.last = now;
    const sourceInput = this.getInput();
    const input = this.scene.holdAccepted?.() ? { ...sourceInput, position: this.evolution.position } : sourceInput;
    const config = this.world.target;
    const reduced = config.reducedMotion || config.followSystemMotion && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const foldTo = this.scene.compact || this.scene.closing ? 1 : 0;
    this.fold = this.fold == null || reduced || config.dismiss === "instant" ? foldTo : Math.max(0, Math.min(1, this.fold + Math.sign(foldTo - this.fold) * Math.min(Math.abs(foldTo - this.fold), dt / FOLD_SECONDS)));
    this.snap ??= new Snap();
    this.shownPosition = this.snap.step(this.shownPosition, input.position, dt, { follow: input.pressed || this.evolution.active, reduced });
    this.knob = knobScale(this.knob ?? 1, !!input.pressed, dt, reduced);
    this.world.knobScale = this.knob;
    this.scene.shownPosition = this.shownPosition;
    if (!this.evolution.active && Math.abs(this.evolution.position - input.position) > 1e-5) this.evolution.sync(input.position);
    const visible = this.container.getClientRects().length > 0 && this.width > 0;
    if (!visible) this.scene.onInvisible?.();
    this.evolution.step(gap / 1e3, { speed: config.speed, reduced, staticMode: !this.renderer || config.quality === "static" });
    this.updateCatcher();
    if (visible && this.renderer && config.quality !== "static") {
      this.world.step(dt, { ...input, position: this.shownPosition, overdrive: this.scene.overdrive ?? 0, reduced, budget: Math.min(this.budget, Math.max(0.35, 1 / Math.sqrt(Math.max(1, drawingEngines.size)))) });
      this.updateTorn();
      try {
        this.renderer.draw(this.world, { width: this.width, height: this.height, dpr: this.ratio, dark: input.dark, reduced, detail: detailForBudget(Math.min(this.budget, Math.max(0.35, 1 / Math.sqrt(Math.max(1, drawingEngines.size))))), clip: this.renderClip, panel: this.scene.compact ? COMPACT_PANEL : this.panel, compact: !!this.scene.compact, aperture: this.aperture, maskAperture: this.maskAperture, fold: this.fold });
      } catch {
        this.diagnostics?.record("renderer-fallback", { reason: "draw-failed" });
        if (this.renderer.mode === "WebGL2") this.switchToCanvas();
        else {
          this.releaseRenderer();
          this.rendererFailed = true;
          this.onStatus("\u9759\u6001\u6E10\u53D8");
        }
      }
    } else {
      this.world.position = input.position;
      this.drawStatic();
    }
    this.canvas.style.visibility = this.renderer && config.quality !== "static" ? "visible" : "hidden";
    this.staticLayer.style.display = this.renderer && config.quality !== "static" ? "none" : "block";
    const effectiveMode = this.renderer && config.quality !== "static" ? this.renderer.mode : "\u9759\u6001\u6E10\u53D8";
    if (this.currentMode !== effectiveMode) {
      this.currentMode = effectiveMode;
      this.onStatus(effectiveMode);
    }
    this.total += gap;
    this.frames++;
    if (this.total >= 1e3) {
      this.fps = Math.round(this.frames * 1e3 / this.total);
      this.slow = this.fps < 43 ? this.slow + this.total / 1e3 : 0;
      this.fast = this.fps > 55 ? this.fast + this.total / 1e3 : 0;
      const old = this.budget;
      if (config.quality === "auto") {
        if (this.slow > 2) {
          this.budget = Math.max(0.35, this.budget - 0.2);
          this.slow = 0;
        } else if (this.fast > 10) {
          this.budget = Math.min(1, this.budget + 0.15);
          this.fast = 0;
        }
      } else this.budget = { high: 1, medium: 0.65, low: 0.35, static: 0 }[config.quality] ?? 1;
      if (old !== this.budget) this.diagnostics?.record("quality-change", { quality: this.budget, fps: this.fps });
      this.diagnostics?.update(this.id, { renderer: this.renderer?.mode ?? "static", fps: this.fps, quality: this.budget, width: Math.round(this.width), height: Math.round(this.height), dpr: this.ratio, ...this.world.snapshot(), phase: this.evolution.phase, boomCount: this.evolution.count });
      this.total = 0;
      this.frames = 0;
    }
    if (!this.renderer || config.quality === "static" || reduced) {
      const generation = this.generation;
      this.timer = setTimeout(() => {
        if (this.active && this.lifecycle === "running" && generation === this.generation) {
          this.timer = 0;
          this.schedule();
        }
      }, reduced ? 45 : 100);
    } else this.frame = requestAnimationFrame(this.tick);
  };
  dispose() {
    if (!this.active) return;
    this.evolution.suspend(this.getInput().position);
    this.active = false;
    this.lifecycle = "disposed";
    this.generation++;
    activeEngines.delete(this);
    drawingEngines.delete(this);
    cancelAnimationFrame(this.frame);
    clearTimeout(this.timer);
    clearTimeout(this.releaseTimer);
    this.frame = 0;
    this.timer = 0;
    this.releaseTimer = 0;
    this.resize.disconnect();
    this.intersection?.disconnect();
    this.attributes?.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    window.removeEventListener("resize", this.screenClip);
    window.removeEventListener("scroll", this.screenClip, true);
    this.releaseRenderer();
    this.viewport.remove();
    if (this.originalThumb) this.originalThumb.style.visibility = "";
    this.diagnostics?.remove(this.id);
    this.onStatus = () => {
    };
  }
};

// src/styles.mjs
var CSS = `
.se-popup.se-exit{opacity:0;transition:opacity .12s ease;animation:none;pointer-events:none}.se-context-menu{position:absolute;right:16px;top:37px;z-index:2;width:174px;display:flex;flex-direction:column;padding:5px;border:1px solid var(--se-line);border-radius:10px;background:var(--se-panel);box-shadow:0 8px 25px #0004}.se-context-menu button{border:0!important;background:transparent!important;text-align:left;font-size:10px!important;padding:8px!important}.se-context-menu button:hover{background:var(--se-hover)!important}
.se-root{--se-bg:#f7f8fb;--se-panel:#fff;--se-text:#242735;--se-muted:#737c90;--se-line:#dde1eb;--se-hover:#eceef7;--se-accent:#7656c8;color:var(--se-text);font:12px/1.5 "Segoe UI","Microsoft YaHei",sans-serif;color-scheme:light;box-sizing:border-box}
.se-root.se-dark{--se-bg:#141620;--se-panel:#1b1e2b;--se-text:#e7e9f4;--se-muted:#98a2ba;--se-line:#30364a;--se-hover:#252a3d;--se-accent:#b6a0f3;color-scheme:dark}
.se-root *{box-sizing:border-box}.se-root button,.se-root input,.se-root select,.se-root textarea{font:inherit}.se-root button{color:inherit;cursor:pointer}.se-root button:disabled{opacity:.4;cursor:default}.se-root button:focus-visible,.se-root input:focus-visible,.se-root select:focus-visible,.se-root textarea:focus-visible,.se-track:focus-visible{outline:2px solid #ac8cec;outline-offset:3px}.se-root button{border:1px solid var(--se-line);background:var(--se-panel);border-radius:8px;padding:7px 11px}.se-root button:hover:not(:disabled){background:var(--se-hover)}
.se-chip{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary,#8a90a4);font:inherit;font-size:12px;height:28px;padding:0 7px;cursor:pointer}.se-chip:hover{background:var(--dsw-alias-interactive-bg-hover,#807b9918)}.se-chip:focus-visible{outline:2px solid #ac8cec;outline-offset:2px}.se-chip-level{font-size:11px;opacity:.7;margin-left:2px}.se-chip-icon{width:14px;height:14px;border-radius:50%;background:radial-gradient(circle,#060710 40%,#bac6f9 45%,#7562b0 54%,transparent 65%);position:relative}.se-chip-icon:after{content:'';position:absolute;left:-2px;top:5px;width:18px;height:4px;border:1px solid #b699df;border-radius:50%;transform:rotate(-16deg)}
.se-popup{position:fixed;z-index:10008;border:1px solid var(--se-line);border-radius:15px;background:var(--se-bg);padding:12px 17px 10px;box-shadow:0 12px 45px #0003;max-width:calc(100vw - 24px);animation:se-enter .16s ease;min-height:142px}.se-popup-heading{height:24px;display:flex;align-items:center;justify-content:space-between;gap:8px}.se-wordmark{font-size:8px;letter-spacing:.11em;color:var(--se-muted);white-space:nowrap}.se-wordmark b{font-size:10px;letter-spacing:0;margin-left:6px;color:var(--se-text);font-weight:500}.se-popup-tools{display:flex;align-items:center;gap:5px}.se-current{font-size:11px;font-weight:600;color:var(--se-accent)}.se-current small{font-size:9px;font-weight:400;color:var(--se-muted);margin:0 3px}.se-current-preview small{margin:0 4px 0 0}.se-current-pending{color:var(--se-muted)}.se-popup-tools button{width:22px;height:24px;padding:0;border:0;background:transparent;font-size:16px;color:var(--se-muted)}
.se-track-block{width:100%;position:relative}.se-track{position:relative;width:100%;height:72px;touch-action:none;user-select:none;cursor:ew-resize;border-radius:22px;outline-offset:-3px}.se-track:focus-visible{outline-offset:-1px}.se-track.se-pointer-focus:focus-visible{outline:none}.se-universe{position:relative;width:100%;height:72px;pointer-events:none}.se-render-canvas{display:block;width:100%;height:100%;position:absolute;inset:0}.se-universe:before{content:'';position:absolute;left:0;right:0;top:21px;height:30px;border-radius:15px;background:linear-gradient(90deg,#88cbe8,#77439b 65%,#080b1d) 0 0/var(--se-static-fill) 100% no-repeat,var(--se-rest,#020306)}.se-universe:after{content:'';position:absolute;left:0;right:0;top:21px;height:30px;border:1px solid #a1a7c122;border-radius:15px;pointer-events:none;--se-hole-at:calc(16px + (100% - 32px) * var(--se-position)) 15px;-webkit-mask-image:radial-gradient(circle at var(--se-hole-at),transparent calc(var(--se-hole-gap,0px) - 5px),#000 var(--se-hole-gap,0px));mask-image:radial-gradient(circle at var(--se-hole-at),transparent calc(var(--se-hole-gap,0px) - 5px),#000 var(--se-hole-gap,0px))}.se-universe:has(canvas[style*="visibility: visible"]) .se-static-thumb{display:none}.se-universe:has(canvas[style*="visibility: visible"]):before{visibility:hidden}
.se-universe:has(canvas[style*="visibility: visible"]):before{background:#020306}.se-static-thumb{position:absolute;left:calc(16px + (100% - 32px) * var(--se-position));top:17px;width:38px;height:38px;transform:translateX(-50%);border-radius:50%;background:#fff;border:1px solid #fff;box-shadow:0 0 3px #0004}
.se-track-hint{position:absolute;top:0;left:50%;transform:translateX(-50%);font-size:9px;color:var(--se-muted);pointer-events:none}.se-ticks{height:17px;position:relative;margin-top:-5px;color:var(--se-muted);font-size:9px}.se-ticks span{position:absolute;transform:translateX(-50%);white-space:nowrap}.se-tick-active{color:var(--se-text);font-weight:600}.se-cancel .se-track{outline:1px dashed #db9c82;outline-offset:-2px}.se-disabled{opacity:.55}.se-disabled .se-track{cursor:default}
.se-syncing .se-track{cursor:progress}.se-status{font-size:10px;color:var(--se-muted);display:flex;align-items:center;gap:5px;min-height:18px;max-width:100%;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.se-status-warn{color:#b77f58}.se-working{display:inline-block;width:7px;height:7px;border:1px solid #a998d6;border-top-color:transparent;border-radius:50%;animation:se-spin .8s linear infinite}
.se-backdrop{position:fixed;inset:0;z-index:10020;background:#04061188;display:flex;align-items:center;justify-content:center;padding:22px;backdrop-filter:blur(4px)}.se-dialog{position:relative;background:var(--se-bg);border:1px solid var(--se-line);border-radius:18px;box-shadow:0 30px 110px #0005;max-width:100%;max-height:calc(100dvh - 44px);overflow:hidden;animation:se-enter .18s ease}.se-settings{width:800px;display:flex;flex-direction:column;height:min(720px,calc(100dvh - 44px))}.se-settings-header{display:flex;align-items:center;justify-content:space-between;padding:22px 27px 20px;border-bottom:1px solid var(--se-line);flex-shrink:0}.se-eyebrow{font-size:9px;letter-spacing:.17em;color:var(--se-muted)}.se-settings h2{font-size:22px;font-weight:550;margin:5px 0 0;letter-spacing:.02em}.se-settings h2 span{font-size:12px;font-weight:400;color:var(--se-muted);margin-left:12px;letter-spacing:0}.se-icon-button{font-size:23px!important;width:34px;height:34px;padding:0!important;border:0!important;background:transparent!important;color:var(--se-muted)!important}.se-settings-layout{display:flex;flex:1;min-height:0}.se-tabs{width:152px;flex-shrink:0;padding:19px 11px;border-right:1px solid var(--se-line);display:flex;flex-direction:column;gap:5px}.se-tabs button{border:0;text-align:left;background:transparent;padding:10px 13px;border-radius:9px;color:var(--se-muted)}.se-tabs button[aria-current]{background:var(--se-hover);color:var(--se-accent)}.se-settings-content{padding:23px 28px 32px;overflow:auto;flex:1;min-width:0;scrollbar-width:thin}.se-section-title{margin-bottom:22px}.se-section-title h3{font-size:17px;font-weight:500;margin:0 0 6px}.se-section-title h3 span{font-size:10px;color:var(--se-muted);font-weight:400;margin-left:8px}.se-section-title p,.se-note{color:var(--se-muted);font-size:11px;line-height:1.8;margin:0}.se-settings-preview{position:relative;width:100%;height:190px;margin:0 0 21px;padding:0;overflow:hidden;border-radius:12px;background:#020306;isolation:isolate}.se-settings-preview>.se-universe{position:absolute;left:50%;top:50%;margin:0;transform:translate(-50%,-50%)}
.se-field{display:flex;flex-direction:column;gap:7px;margin:18px 0}.se-field>span:first-child{font-size:11px;display:flex;align-items:center;justify-content:space-between}.se-field select,.se-field>input,.se-root textarea{border:1px solid var(--se-line);border-radius:8px;background:var(--se-panel);color:var(--se-text);padding:9px 11px;min-height:36px}.se-range-row{display:flex;align-items:center;gap:14px}.se-range-row input{flex:1;min-width:0;accent-color:#a287df;height:20px}.se-range-row output{width:41px;color:var(--se-muted);font-size:11px;text-align:right;font-variant-numeric:tabular-nums}.se-reset-one{background:transparent!important;border:0!important;color:var(--se-muted)!important;padding:0 5px!important;font-size:13px!important;opacity:.6}.se-toggle{display:flex;align-items:center;justify-content:space-between;min-height:37px;font-size:11px;gap:12px}.se-toggle input{accent-color:#9f81db;width:16px;height:16px}.se-toggle-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 24px}.se-actions{display:flex;flex-wrap:wrap;gap:7px;margin:19px 0}.se-actions button{font-size:11px}.se-primary{background:#8060bc!important;color:#fff!important;border-color:#9d81d1!important}.se-primary:hover{background:#9171cd!important}.se-root details{border-top:1px solid var(--se-line);margin-top:24px;padding-top:14px}.se-root summary{cursor:pointer;color:var(--se-muted);font-size:11px;padding:4px 0}.se-settings-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--se-line);padding:11px 23px;font-size:9px;color:var(--se-muted);min-height:40px;flex-shrink:0}.se-settings-footer i{display:inline-block;width:5px;height:5px;background:#9a8cbe;border-radius:50%;margin-right:4px}.se-settings-footer i.se-save-good{background:#78aa9d}.se-notice{padding:12px;background:var(--se-hover);border-radius:9px;color:var(--se-accent);font-size:11px;line-height:1.8;margin-top:22px}
.se-preset-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:25px}.se-preset-cards button{display:flex;align-items:center;flex-direction:column;padding:19px 8px;gap:8px}.se-preset-cards b{font-size:11px;font-weight:500}.se-preset-cards small{font-size:8px;color:var(--se-muted)}.se-preset-dot{width:29px;height:29px;border-radius:50%;background:radial-gradient(circle,#000 36%,#d8b1cf 40%,#8883c9 46%,#373151 50%,transparent 68%);position:relative}.se-preset-dot:after{content:'';position:absolute;inset:11px -7px;border:1px solid #d8a5c7;border-radius:50%;transform:rotate(-14deg)}.se-style-realistic:after{border-color:#e1b086}.se-style-scifi:after{border-color:#b073ee;box-shadow:0 0 5px #8d53f155}
.se-lab-scroll{width:100%;max-height:550px;overflow:auto;border:1px solid var(--se-line);border-radius:8px;margin:10px 0 16px;overscroll-behavior:contain}.se-lab-extent{margin-inline:auto;position:relative;min-width:382px;flex-shrink:0}.se-lab-stage{position:absolute;left:0;top:0;width:382px;height:132px;transform-origin:0 0}.se-lab-track{position:absolute;left:34px;top:24px;width:314px}.se-lab-inspector:not([data-lab-scale="1"]) .se-render-canvas{image-rendering:pixelated}.se-lab-event-status{min-height:40px;margin-bottom:18px}.se-lab-preview{width:314px;max-width:100%;margin:6px auto 17px;padding:6px 0 10px}.se-lab-wide{width:100%}.se-lab-width{display:flex;justify-content:center;gap:8px}.se-lab-width button{font-size:10px;background:transparent}.se-lab-width button[aria-pressed="true"]{color:var(--se-accent);background:var(--se-hover)}.se-lab-anchors{justify-content:center;margin:0 0 25px}.se-facts{display:grid;grid-template-columns:70px 1fr;gap:15px 16px;font-size:11px;line-height:1.8}.se-facts dt{color:var(--se-muted)}.se-facts dd{margin:0}.se-diagnostics{width:100%;height:200px;margin:15px 0;font:10px/1.6 monospace!important;resize:vertical}.se-confirm-shade{position:absolute;inset:0;background:#04050ba6;display:flex;align-items:center;justify-content:center;z-index:3;padding:25px}.se-confirm{background:var(--se-panel);border:1px solid var(--se-line);padding:23px;border-radius:14px;max-width:370px;box-shadow:0 15px 60px #0004}.se-confirm h3{margin:0 0 12px;font-size:15px;font-weight:500}.se-confirm p{font-size:12px;line-height:1.9;color:var(--se-muted)}.se-confirm .se-actions{justify-content:flex-end;margin-bottom:0}.se-entry{padding:24px;color:var(--dsw-alias-label-primary,inherit);font-family:inherit}.se-entry h2{font-size:20px;font-weight:500}.se-entry p{font-size:13px;opacity:.7;line-height:1.8}.se-entry-open{padding:10px 16px;border:1px solid #a6a0bc66;background:transparent;border-radius:8px;color:inherit;cursor:pointer}
@keyframes se-enter{from{opacity:0}to{opacity:1}}@keyframes se-spin{to{transform:rotate(360deg)}}
@media(max-width:640px){.se-backdrop{padding:10px}.se-settings{height:calc(100dvh - 20px);max-height:calc(100dvh - 20px)}.se-settings-header{padding:17px}.se-settings h2{font-size:19px}.se-settings-layout{flex-direction:column}.se-tabs{width:100%;flex-direction:row;overflow:auto;border-right:0;border-bottom:1px solid var(--se-line);padding:8px;gap:4px;min-height:48px}.se-tabs button{white-space:nowrap;padding:7px 10px;font-size:10px}.se-settings-content{padding:19px 17px}.se-eyebrow{font-size:7px}.se-settings-preview{max-width:100%}.se-preset-cards{grid-template-columns:1fr}.se-settings-footer>span:last-child{display:none}}
@media(forced-colors:active){.se-track{border:1px solid CanvasText}.se-chip-icon{border:1px solid ButtonText}.se-current,.se-status{color:CanvasText}.se-universe:after{border-color:CanvasText}.se-static-thumb{border-color:CanvasText}}
@media(prefers-reduced-motion:reduce){.se-popup,.se-dialog{animation:none}}
/* The neutral remainder is present even if all canvas paths fail. */
.se-universe:before{background:linear-gradient(90deg,#91cde8 0%,#704494 var(--se-static-fill),var(--se-unfilled,#dfe3e8) var(--se-static-fill),var(--se-unfilled,#dfe3e8) 100%);clip-path:none}.se-dark .se-universe,.preview-dark .se-universe{--se-unfilled:#20232c}
/* P1.1: the input rail never stretches with its parent. Only the aperture
   clips the fixed-size, pointer-transparent scene around that rail. */
.se-track-block,.se-universe{width:314px;flex-shrink:0;margin-left:auto;margin-right:auto}
.se-world-viewport{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);overflow:hidden;pointer-events:none}
.se-world-viewport .se-render-canvas{max-width:none;max-height:none;pointer-events:none}
.se-embedded{width:100%;height:auto;min-height:0;max-height:none;overflow:visible;position:relative;background:var(--se-bg)}.se-embedded .se-settings-layout{min-height:0;flex:initial}.se-embedded .se-settings-content{overflow:visible;min-width:0}.se-embedded .se-settings-preview{max-width:100%}
.se-popup{max-width:calc(100vw - 16px);max-height:calc(100dvh - 16px);min-height:0;overflow:auto}.se-popup-heading{position:sticky;top:0;left:0;background:transparent;z-index:3;cursor:grab;touch-action:none}.se-popup-heading:active{cursor:grabbing}.se-wordmark{min-width:0;overflow:hidden;text-overflow:ellipsis;flex:1}.se-popup-tools{flex-shrink:0}.se-popup-tools button{cursor:pointer}@media(max-width:370px){.se-popup-tools .se-current{display:none}.se-wordmark b{display:none}}
.se-world-viewport.se-escape{position:fixed;left:0;top:0;transform:none;z-index:0}.se-scene-catcher{position:absolute;pointer-events:auto;cursor:default}.se-popup.se-exit.se-fade{transition:opacity .24s ease}.se-popup .se-ticks,.se-popup .se-status,.se-popup .se-current{position:relative;z-index:2}.se-popup .se-track-hint{z-index:2}.se-popup .se-popup-heading,.se-popup .se-ticks,.se-popup .se-track-hint,.se-popup .se-status:not(.se-status-warn){opacity:calc(1 - var(--se-torn,0))}.se-popup-heading{z-index:3}.se-scene-settings{margin-bottom:18px}.se-scene-preview{position:relative;overflow:hidden;border-radius:8px;border:1px solid var(--se-line);margin:4px auto 12px;max-width:100%}.se-scene-stage{position:absolute;left:0;top:0;transform-origin:0 0}.se-scene-host{position:absolute;inset:0;padding:18px 26px;font-size:15px;line-height:2.05;color:var(--se-text);opacity:.85}.se-scene-host p{margin:0}.se-scene-panel{position:absolute;left:50%;top:50%;width:350px;height:150px;transform:translate(-50%,-50%);border-radius:15px;background:var(--se-bg);border:1px solid var(--se-line);box-shadow:0 12px 45px #0003}.se-scene-rail{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:314px;height:72px}
.se-dock{position:relative;display:flex;flex-direction:column;align-items:center;margin:-8px auto -4px;width:314px;max-width:100%}.se-dock-open{z-index:30}.se-dock-rail{width:314px;position:relative}.se-dock .se-ticks{position:relative;z-index:2}.se-dock .se-track-hint{z-index:2}.se-dock-open .se-ticks{color:#a9afc6}.se-dock-open .se-tick-active{color:#f3f1ff}.se-dock-status{position:absolute;top:100%;left:50%;transform:translateX(-50%);z-index:2;color:#c3c6da;margin-top:-2px}.se-dock-status.se-status-warn{color:#e0a37c}`;

// src/ui.jsx
var demoLevels = [{ id: "off", name: "Off", position: 0 }, { id: "low", name: "Low", position: 1 / 3 }, { id: "high", name: "High", position: 2 / 3 }, { id: "max", name: "Max", position: 1 }];
var useSource = (source) => (0, import_react.useSyncExternalStore)(source.subscribe, source.getSnapshot, source.getSnapshot);
function installStyle() {
  let style = document.getElementById("stellar-effort-style");
  if (!style) {
    style = document.createElement("style");
    style.id = "stellar-effort-style";
    style.dataset.plugin = "dsh-stellar-effort";
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  return style;
}
function isDark() {
  return document.body.hasAttribute("data-ds-dark-theme") || document.documentElement.dataset.seTheme === "dark" || !document.documentElement.dataset.seTheme && matchMedia("(prefers-color-scheme: dark)").matches;
}
function useDark() {
  const [dark, setDark] = (0, import_react.useState)(isDark);
  (0, import_react.useEffect)(() => {
    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-se-theme"] });
    const media = matchMedia("(prefers-color-scheme: dark)");
    const change = () => setDark(isDark());
    media.addEventListener("change", change);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", change);
    };
  }, []);
  return dark;
}
var TAP = Object.freeze({ time: 400, slop: 4, reach: 22, hold: 220 });
var reducedMotion = (c) => c.reducedMotion || c.followSystemMotion && matchMedia("(prefers-reduced-motion: reduce)").matches;
var offTrack = (e, track) => {
  const r = track?.getBoundingClientRect();
  return !r || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
};
function UniverseView({ position, pressed = false, config, diagnostics, className = "", onStatus, scene, viewportKey, readInput, escape = false }) {
  const container = (0, import_react.useRef)(null), engine = (0, import_react.useRef)(null), input = (0, import_react.useRef)({ position, pressed }), dark = useDark(), [mode, setMode] = (0, import_react.useState)("\u521D\u59CB\u5316");
  input.current = { position, pressed, dark };
  (0, import_react.useEffect)(() => {
    const e = new RenderEngine(container.current, { config, scene, escape, getInput: () => readInput ? { ...input.current, ...readInput() } : input.current, diagnostics, onStatus: (value) => {
      setMode(value);
      onStatus?.(value);
    } });
    engine.current = e;
    return () => {
      e.dispose();
      engine.current = null;
    };
  }, []);
  (0, import_react.useEffect)(() => engine.current?.setConfig(config), [config]);
  (0, import_react.useLayoutEffect)(() => engine.current?.screenClip(), [viewportKey]);
  (0, import_react.useLayoutEffect)(() => engine.current?.refreshInput(), [position, pressed, dark]);
  return /* @__PURE__ */ import_react.default.createElement("div", { className: `se-universe ${className}`, "data-renderer": mode, ref: container, style: { "--se-position": position, "--se-static-fill": `${position * 100}%`, "--se-hole-gap": position > LIMITS.collapse - 0.011 ? "25px" : "22px", "--se-rest": position >= LIMITS.collapse ? VOID.css : dark ? REST.darkCss : REST.lightCss } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-static-thumb" }));
}
function Track({ position, pressed, config, levels: levels2, disabled, syncing = false, cancelZone, diagnostics, onBegin, onPreview, onRelease, onCancel, onMenu, onHoleTap, scene, readVisualValidity, layoutKey, inspectionScale = 1, readInput, onStatus, label = "\u63A8\u7406\u5F3A\u5EA6", escape = false }) {
  const localScene = (0, import_react.useRef)({});
  scene = scene ?? localScene.current;
  const visualGate = (0, import_react.useRef)({ identity: null, blocked: false, reentry: false });
  const readGate = (expected) => readVisualValidity?.(expected) ?? { valid: !disabled, cancelZone: false, identity: null, position };
  const visualBegin = () => {
    const gate = readGate();
    visualGate.current = { identity: gate.identity, blocked: !gate.valid, reentry: false };
    scene.evolution ??= new Evolution(position);
    if (!gate.valid) {
      scene.evolution.cancel(gate.position);
      return;
    }
    scene.visualId = Math.max(scene.visualId ?? 0, scene.evolution.intentId) + 1;
    scene.evolution.begin(scene.visualId);
  };
  const visualPreview = (p, c) => {
    const v = visualGate.current, gate = readGate(v.identity);
    if (!gate.valid || v.blocked) {
      scene.evolution?.cancel(gate.position);
      v.blocked = true;
      return;
    }
    if (c || gate.cancelZone) {
      scene.evolution?.cancel(gate.position);
      v.reentry = true;
      return;
    }
    if (v.reentry) {
      scene.visualId = Math.max(scene.visualId ?? 0, scene.evolution.intentId) + 1;
      scene.evolution.begin(scene.visualId);
      v.reentry = false;
    }
    scene.evolution?.input(p, scene.visualId);
  };
  const root = (0, import_react.useRef)(null), active = (0, import_react.useRef)(false), nearest = nearestLevel(levels2, position), [hover, setHover] = (0, import_react.useState)(false);
  const [pointerFocus, setPointerFocus] = (0, import_react.useState)(false);
  const calculate = (e) => {
    const r = root.current.getBoundingClientRect();
    if (inspectionScale !== 1) return inspectionPoint(e.clientX, e.clientY, r, inspectionScale);
    return { position: clamp((e.clientX - r.left - 16) / (r.width - 32)), excess: e.clientX - r.left - 16 - (r.width - 32), cancel: false };
  };
  const drive = (p) => {
    const t = tap.current;
    scene.overdrive = !p || p.cancel || visualGate.current.blocked || !levels2.some((l) => l.position >= 0.999) || t && !t.moved && performance.now() - t.at < TAP.hold ? 0 : overdriveFromPointer(p.excess ?? 0);
  };
  const tap = (0, import_react.useRef)(null);
  const point = (e) => {
    const p = calculate(e), t = tap.current;
    if (t && !t.moved && Math.hypot(e.clientX - t.x, e.clientY - t.y) >= TAP.slop) t.moved = true;
    return t?.onHole && !t.moved ? { ...p, position, excess: 0 } : p;
  };
  const down = (e) => {
    if (e.target.classList?.contains("se-scene-catcher") && offTrack(e, root.current)) return;
    if (e.button !== 0 || disabled) return;
    e.preventDefault();
    setPointerFocus(true);
    root.current.focus();
    if (onBegin({ pointer: true }) === false) return;
    visualBegin();
    active.current = true;
    root.current.setPointerCapture(e.pointerId);
    const r = root.current.getBoundingClientRect(), knob = r.left + 16 + (r.width - 32) * position;
    tap.current = { at: performance.now(), x: e.clientX, y: e.clientY, moved: false, onHole: inspectionScale === 1 && position >= 0.999 && Math.abs(e.clientX - knob) <= TAP.reach && Math.abs(e.clientY - (r.top + 36)) <= TAP.reach };
    const p = point(e);
    onPreview(p.position, p.cancel);
    visualPreview(p.position, p.cancel);
    drive(p);
  };
  const move = (e) => {
    if (!active.current) return;
    const p = point(e);
    onPreview(p.position, p.cancel);
    visualPreview(p.position, p.cancel);
    drive(p);
  };
  const up = (e) => {
    if (!active.current) return;
    active.current = false;
    drive(null);
    const p = point(e), t = tap.current;
    tap.current = null;
    onPreview(p.position, p.cancel);
    visualPreview(p.position, p.cancel);
    scene.releaseEpoch = readGate(visualGate.current.identity).epoch;
    scene.evolution?.release();
    onRelease();
    if (root.current.hasPointerCapture(e.pointerId)) root.current.releasePointerCapture(e.pointerId);
    if (t?.onHole && !t.moved && performance.now() - t.at < TAP.time) onHoleTap?.();
  };
  const cancel = () => {
    tap.current = null;
    drive(null);
    if (active.current) {
      active.current = false;
      scene.evolution?.cancel(position);
      onCancel();
    }
  };
  const abort = () => {
    const dragging = active.current;
    tap.current = null;
    drive(null);
    active.current = false;
    scene.evolution?.cancel(position);
    onCancel();
    return dragging;
  };
  const keyboard = (e) => {
    setPointerFocus(false);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      abort();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      scene.releaseEpoch = readGate(visualGate.current.identity).epoch;
      scene.evolution?.release();
      onRelease();
      return;
    }
    if (disabled || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const at = Math.max(0, levels2.indexOf(nearest));
    let next = at;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = levels2.length - 1;
    else next = clamp(at + (e.key === "ArrowRight" ? 1 : -1), 0, levels2.length - 1);
    if (onBegin({ pointer: false }) !== false) {
      visualBegin();
      onPreview(levels2[next].position, false);
      visualPreview(levels2[next].position, false);
    }
  };
  (0, import_react.useEffect)(() => {
    const blur = () => {
      active.current = false;
      onCancel();
    };
    const hidden = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [onCancel]);
  return /* @__PURE__ */ import_react.default.createElement("div", { className: `se-track-block ${disabled && !syncing ? "se-disabled" : ""} ${syncing ? "se-syncing" : ""} ${cancelZone ? "se-cancel" : ""}` }, /* @__PURE__ */ import_react.default.createElement("div", { className: `se-track${pointerFocus ? " se-pointer-focus" : ""}`, role: "slider", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": Math.max(0, levels2.length - 1), "aria-valuenow": Math.max(0, levels2.indexOf(nearest)), "aria-valuetext": `${nearest?.name ?? "\u4E0D\u53EF\u7528"}${pressed ? " \xB7 \u9884\u89C8" : ""}`, "aria-disabled": disabled, tabIndex: 0, ref: root, onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: cancel, onLostPointerCapture: cancel, onKeyDown: keyboard, onContextMenu: (e) => {
    e.preventDefault();
    if (!abort()) onMenu?.();
  }, onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) }, /* @__PURE__ */ import_react.default.createElement(UniverseView, { position, pressed, config, diagnostics, scene, viewportKey: layoutKey, readInput, onStatus, escape }), hover && /* @__PURE__ */ import_react.default.createElement("span", { className: "se-track-hint" }, nearest?.name)), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-ticks" }, levels2.map((level) => /* @__PURE__ */ import_react.default.createElement("span", { key: level.id, style: { left: `calc(16px + (100% - 32px) * ${level.position})` }, title: level.description || level.name, className: nearest?.id === level.id ? "se-tick-active" : "" }, level.name))));
}
function statusText(state) {
  const nearest = state.phase === "preview" && !state.cancelZone ? nearestLevel(state.levels, state.position) : null;
  if (nearest && state.position >= LIMITS.collapse && nearest.position < LIMITS.collapse) return `\u5DF2\u8D8A\u8FC7\u4E34\u754C \xB7 \u4EC5\u89C6\u89C9\u9884\u89C8\uFF0C\u677E\u624B\u4ECD\u4E3A ${nearest.name}`;
  return state.message || "\u677E\u624B\u540E\u5E94\u7528 \xB7 \u4E0B\u4E00\u6B21\u8BF7\u6C42\u751F\u6548";
}
function CurrentLevel({ state }) {
  const actual = state.actual?.name ?? "\u2014";
  if (state.phase === "preview") return /* @__PURE__ */ import_react.default.createElement("span", { className: "se-current se-current-preview", title: `DSH \u5F53\u524D ${actual} \xB7 \u677E\u624B\u540E\u624D\u4F1A\u63D0\u4EA4` }, /* @__PURE__ */ import_react.default.createElement("small", null, "\u9884\u89C8"), nearestLevel(state.levels, state.position)?.name ?? "\u2014");
  if (["applying", "unknown"].includes(state.phase) && state.requested) return /* @__PURE__ */ import_react.default.createElement("span", { className: "se-current se-current-pending", title: `DSH \u5F53\u524D ${actual} \xB7 ${state.phase === "unknown" ? "\u63D0\u4EA4\u7ED3\u679C\u672A\u786E\u8BA4" : "\u6B63\u5728\u63D0\u4EA4"} ${state.requested.name}` }, actual, /* @__PURE__ */ import_react.default.createElement("small", null, "\u2192"), state.requested.name, state.phase === "unknown" ? "?" : "");
  return /* @__PURE__ */ import_react.default.createElement("span", { className: "se-current", title: "DSH \u5F53\u524D\u63A8\u7406\u7B49\u7EA7" }, actual);
}
function ScenePreview({ config, diagnostics }) {
  const scale2 = 0.62, lines2 = ["\u4ECA\u5929\u60F3\u8BA9 DeepSeek \u5E2E\u4F60\u505A\u4EC0\u4E48\uFF1F", "\u628A\u8FD9\u4EFD\u5B63\u5EA6\u62A5\u8868\u6574\u7406\u6210\u4E09\u70B9\u7ED3\u8BBA\uFF0C\u5E76\u6807\u51FA\u5F02\u5E38\u6570\u636E\u3002", "\u5DE5\u4F5C\u533A\u5185\u4FEE\u6539 \xB7 \u9ED8\u8BA4\u5DE5\u4F5C\u533A \xB7 \u65B0\u4F1A\u8BDD\u5C06\u4F7F\u7528\u5F53\u524D\u63A8\u7406\u7B49\u7EA7", "\u8BF7\u5148\u9605\u8BFB\u9879\u76EE\u8BF4\u660E\uFF0C\u518D\u7ED9\u51FA\u91CD\u6784\u5EFA\u8BAE\u3002"];
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "se-scene-preview", style: { width: SPACE.width * scale2, height: SPACE.height * scale2 }, "aria-label": "\u573A\u666F\u8303\u56F4\u9884\u89C8" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-scene-stage", style: { width: SPACE.width, height: SPACE.height, transform: `scale(${scale2})` } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-scene-host", "aria-hidden": "true" }, lines2.map((l, i) => /* @__PURE__ */ import_react.default.createElement("p", { key: i }, l))), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-scene-panel", "aria-hidden": "true" }), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-scene-rail" }, /* @__PURE__ */ import_react.default.createElement(UniverseView, { position: 1, config, diagnostics }))));
}
function FocusDialog({ children, onClose, label, className = "", dark }) {
  const node = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const previous = document.activeElement;
    const target = node.current;
    const focus = target.querySelector('[autofocus],button,[tabindex="0"],input,select');
    focus?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const list = [...target.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter((x) => x.getClientRects().length);
        if (!list.length) {
          e.preventDefault();
          return;
        }
        const first = list[0], last = list.at(-1);
        if (e.shiftKey && (document.activeElement === first || !target.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    target.addEventListener("keydown", key);
    return () => {
      target.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (0, import_react_dom.createPortal)(/* @__PURE__ */ import_react.default.createElement("div", { className: `se-root se-backdrop ${dark ? "se-dark" : "se-light"}`, onPointerDown: (e) => {
    if (e.target === e.currentTarget) onClose();
  } }, /* @__PURE__ */ import_react.default.createElement("section", { className: `se-dialog ${className}`, role: "dialog", "aria-modal": "true", "aria-label": label, ref: node }, children)), document.body);
}
function useEffort(directory, available, runtime) {
  const scene = (0, import_react.useRef)({});
  const [controller] = (0, import_react.useState)(() => new EffortController(directory, { available, diagnostics: runtime.diagnostics }));
  const state = useSource(controller);
  scene.current.visualRoute ??= state.fingerprint;
  scene.current.holdAccepted = () => acceptedVisualPending(controller, scene.current.evolution, scene.current.releaseEpoch);
  const cancel = import_react.default.useCallback(() => {
    scene.current.evolution?.cancel(controller.getSnapshot().actual?.position ?? 0);
    controller.cancel();
  }, [controller]);
  (0, import_react.useEffect)(() => {
    const e = scene.current.evolution;
    if (!e) return;
    if (scene.current.visualRoute !== state.fingerprint) {
      scene.current.visualRoute = state.fingerprint;
      e.suspend(state.position);
      return;
    }
    if (controller.gesture?.conflict || ["error", "conflict", "unknown"].includes(state.phase)) e.cancel(state.actual?.position ?? 0);
    else if (!scene.current.holdAccepted() && state.phase !== "preview" && Math.abs(e.position - state.position) > 1e-5) e.sync(state.position);
  }, [state]);
  return { scene, controller, state, cancel };
}
function EffortChip({ directory, available = true, runtime }) {
  const { scene, controller, state, cancel } = useEffort(directory, available, runtime);
  const prefs = useSource(runtime.preferences), [popup, setPopup] = (0, import_react.useState)(false), [pinned, setPinned] = (0, import_react.useState)(false), [closing, setClosing] = (0, import_react.useState)(false), [menu, setMenu] = (0, import_react.useState)(false), [panel, setPanel] = (0, import_react.useState)(null), [position, setPosition] = (0, import_react.useState)({ left: 12, top: 12 }), button = (0, import_react.useRef)(null), popupRef = (0, import_react.useRef)(null), closeTimer = (0, import_react.useRef)(null), dark = useDark();
  const layoutDrag = (0, import_react.useRef)(null), plunged = (0, import_react.useRef)(false);
  const cancelLayout = import_react.default.useCallback(() => {
    const d = layoutDrag.current;
    if (!d) return;
    layoutDrag.current = null;
    setPosition(clampPopup(d.origin, { width: popupRef.current?.offsetWidth ?? 350, height: popupRef.current?.offsetHeight ?? 142 }, { width: innerWidth, height: innerHeight }));
    if (d.target.hasPointerCapture?.(d.pointerId)) d.target.releasePointerCapture(d.pointerId);
  }, []);
  const fit = (point) => clampPopup(point, { width: popupRef.current?.offsetWidth ?? 350, height: popupRef.current?.offsetHeight ?? 142 }, { width: innerWidth, height: innerHeight });
  (0, import_react.useEffect)(() => {
    if (!popup) return;
    const hidden = () => {
      if (document.hidden) cancelLayout();
    };
    window.addEventListener("blur", cancelLayout);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", cancelLayout);
      document.removeEventListener("visibilitychange", hidden);
      cancelLayout();
    };
  }, [popup, cancelLayout]);
  (0, import_react.useEffect)(() => {
    void directory.load().catch(() => {
    });
    return () => {
      clearTimeout(closeTimer.current);
      controller.dispose();
    };
  }, [controller]);
  const dismiss = (0, import_react.useRef)("fade");
  dismiss.current = prefs.config.dismiss;
  const close = import_react.default.useCallback(() => {
    cancelLayout();
    scene.current.evolution?.suspend(controller.getSnapshot().actual?.position ?? 0);
    controller.cancel();
    setMenu(false);
    clearTimeout(closeTimer.current);
    const done = () => {
      setPopup(false);
      setClosing(false);
      button.current?.focus({ preventScroll: true });
    };
    if (dismiss.current === "instant") {
      done();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(done, 240);
  }, [controller]);
  (0, import_react.useLayoutEffect)(() => {
    if (!popup) return;
    const place = () => {
      if (layoutDrag.current) return;
      const remembered = prefs.config.popupPosition, r = button.current?.getBoundingClientRect();
      if (!r) return;
      const w = popupRef.current?.offsetWidth ?? 350, h = popupRef.current?.offsetHeight ?? 142, top = r.top - h - 9;
      setPosition(fit(remembered ?? { left: r.right - w, top: top >= 8 ? top : r.bottom + 9 }));
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    const observer = new ResizeObserver(place);
    if (popupRef.current) observer.observe(popupRef.current);
    const outside = (e) => {
      if (!pinned && !popupRef.current?.contains(e.target) && !button.current?.contains(e.target)) close();
    };
    const key = (e) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        close();
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [popup, close, pinned, prefs.config.popupPosition, prefs.config.uiScale]);
  const layoutDown = (e) => {
    if (e.button !== 0 || e.target.closest('.se-popup-tools,button,input,select,[role="slider"]')) return;
    e.preventDefault();
    e.currentTarget.focus({ preventScroll: true });
    layoutDrag.current = { pointerId: e.pointerId, target: e.currentTarget, x: e.clientX, y: e.clientY, origin: position, latest: position, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const layoutMove = (e) => {
    const d = layoutDrag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved && controller.gesture) cancel();
    d.moved = true;
    d.latest = fit({ left: d.origin.left + dx, top: d.origin.top + dy });
    setPosition(d.latest);
  };
  const layoutUp = (e) => {
    const d = layoutDrag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    layoutDrag.current = null;
    if (d.moved) runtime.preferences.change({ popupPosition: d.latest });
    if (d.target.hasPointerCapture(e.pointerId)) d.target.releasePointerCapture(e.pointerId);
  };
  const openPanel = (tab) => {
    scene.current.evolution?.suspend(controller.getSnapshot().actual?.position ?? 0);
    controller.cancel();
    clearTimeout(closeTimer.current);
    setPopup(false);
    setClosing(false);
    setMenu(false);
    setPanel(tab);
  };
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("button", { className: "se-chip", ref: button, type: "button", "aria-label": `\u661F\u8F68\u63A8\u7406\uFF1A${state.actual?.name ?? "\u4E0D\u53EF\u7528"}`, title: state.disabled ? state.message : `\u661F\u8F68\u63A8\u7406 \xB7 ${state.actual?.name} \xB7 ${prefs.config.dock ? "\u70B9\u51FB\u6536\u8D77\u8F93\u5165\u6846\u4E0A\u65B9\u7684\u6ED1\u8F68" : "\u70B9\u51FB\u8C03\u6574"}`, "aria-haspopup": prefs.config.dock ? void 0 : "dialog", "aria-expanded": popup, onClick: () => {
    if (popup && !closing) {
      close();
      return;
    }
    if (prefs.config.dock) {
      runtime.preferences.change({ dock: false }, { history: false });
      return;
    }
    clearTimeout(closeTimer.current);
    setClosing(false);
    setPinned(false);
    plunged.current = false;
    setPopup(true);
    void directory.load().catch(() => {
    });
  } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "se-chip-icon", "aria-hidden": "true" }), " ", /* @__PURE__ */ import_react.default.createElement("span", null, "\u661F\u8F68"), /* @__PURE__ */ import_react.default.createElement("span", { className: "se-chip-level" }, state.actual?.name ?? "\u2014")), popup && (0, import_react_dom.createPortal)(/* @__PURE__ */ import_react.default.createElement("div", { className: `se-root se-popup ${closing ? "se-exit se-fade" : ""} ${dark ? "se-dark" : "se-light"}`, role: "dialog", "aria-label": "\u661F\u8F68\u63A8\u7406", ref: popupRef, onPointerDown: (e) => {
    if (!pinned && e.button === 0 && (e.target.classList?.contains("se-scene-catcher") && offTrack(e, popupRef.current?.querySelector(".se-track")) || e.target.closest?.(".se-ticks,.se-status"))) {
      e.preventDefault();
      close();
    }
  }, style: { ...position, width: Math.max(350, 350 * clamp(prefs.config.uiScale, 0.8, 1.25)) } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-popup-heading", tabIndex: 0, "aria-label": "\u62D6\u52A8\u5F39\u7A97\u6807\u9898", onPointerDown: layoutDown, onPointerMove: layoutMove, onPointerUp: layoutUp, onPointerCancel: cancelLayout, onLostPointerCapture: cancelLayout }, /* @__PURE__ */ import_react.default.createElement("span", { className: "se-wordmark" }, "STELLAR EFFORT ", /* @__PURE__ */ import_react.default.createElement("b", null, "\u661F\u8F68\u63A8\u7406")), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-popup-tools" }, /* @__PURE__ */ import_react.default.createElement(CurrentLevel, { state }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", "aria-label": "\u653E\u56DE\u8F93\u5165\u6846\u4E0A\u65B9", title: "\u653E\u56DE\u8F93\u5165\u6846\u4E0A\u65B9\uFF08\u5E38\u9A7B\u6ED1\u8F68\uFF09", onClick: () => {
    runtime.preferences.change({ dock: true }, { history: false });
    close();
  } }, "\u2912"), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", title: "\u89C6\u89C9\u8BBE\u7F6E", "aria-label": "\u6253\u5F00\u661F\u8F68\u8BBE\u7F6E", onClick: () => openPanel("\u5E38\u7528") }, "\u2699"), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", title: "\u5173\u95ED", "aria-label": "\u5173\u95ED\u661F\u8F68\u63A8\u7406", onClick: close }, "\xD7"))), /* @__PURE__ */ import_react.default.createElement(Track, { escape: true, layoutKey: `${position.left}:${position.top}`, readVisualValidity: (expected) => visualValidity(controller, expected), scene: scene.current, position: state.position, pressed: state.pressed, config: prefs.config, levels: state.levels, disabled: state.disabled || closing, syncing: state.syncing && !closing, cancelZone: state.cancelZone, diagnostics: runtime.diagnostics, onBegin: (o) => controller.begin(o), onPreview: (p, c) => controller.preview(p, c), onRelease: () => void controller.release(), onCancel: cancel, onMenu: () => setMenu(true), onHoleTap: () => {
    if (!plunged.current) plunged.current = scene.current.evolution?.plunge(reducedMotion(prefs.config)) ?? false;
  } }), /* @__PURE__ */ import_react.default.createElement("div", { className: `se-status ${["error", "conflict", "unknown"].includes(state.phase) ? "se-status-warn" : ""}`, role: "status", "aria-live": "polite" }, /* @__PURE__ */ import_react.default.createElement("span", { className: state.phase === "applying" ? "se-working" : "" }), statusText(state)), menu && /* @__PURE__ */ import_react.default.createElement("div", { className: "se-context-menu", role: "menu", "aria-label": "\u661F\u8F68\u5FEB\u6377\u83DC\u5355" }, /* @__PURE__ */ import_react.default.createElement("button", { role: "menuitem", onClick: () => openPanel("\u9884\u89C8\u5B9E\u9A8C\u5BA4") }, "Universe Lab \xB7 \u72EC\u7ACB\u9884\u89C8"), /* @__PURE__ */ import_react.default.createElement("button", { role: "menuitem", onClick: () => openPanel("\u5E38\u7528") }, "\u89C6\u89C9\u8BBE\u7F6E"), /* @__PURE__ */ import_react.default.createElement("button", { role: "menuitem", onClick: () => setMenu(false) }, "\u8FD4\u56DE\u6ED1\u5757"))), document.body), panel && /* @__PURE__ */ import_react.default.createElement(SettingsPanel, { runtime, initialTab: panel, onClose: () => setPanel(null) }));
}
function EffortDock({ directory, available = true, runtime }) {
  const { scene, controller, state, cancel } = useEffort(directory, available, runtime);
  const prefs = useSource(runtime.preferences), dark = useDark(), [open, setOpen] = (0, import_react.useState)(false), [closing, setClosing] = (0, import_react.useState)(false), [menu, setMenu] = (0, import_react.useState)(null), root = (0, import_react.useRef)(null), timer = (0, import_react.useRef)(null);
  const dismiss = (0, import_react.useRef)("fade");
  dismiss.current = prefs.config.dismiss;
  (0, import_react.useEffect)(() => {
    void directory.load().catch(() => {
    });
    return () => {
      clearTimeout(timer.current);
      controller.dispose();
    };
  }, [controller]);
  const plunged = (0, import_react.useRef)(false);
  const expand = () => {
    clearTimeout(timer.current);
    if (!open || closing) plunged.current = false;
    setClosing(false);
    setOpen(true);
  };
  const holeTap = () => {
    if (plunged.current) return;
    plunged.current = scene.current.evolution?.plunge(reducedMotion(prefs.config)) ?? false;
  };
  const collapse = import_react.default.useCallback(() => {
    clearTimeout(timer.current);
    if (dismiss.current === "instant") {
      setOpen(false);
      setClosing(false);
      return;
    }
    setClosing(true);
    timer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 240);
  }, []);
  (0, import_react.useEffect)(() => {
    if (!open || closing) return;
    const track = () => root.current?.querySelector(".se-track");
    const outside = (e) => {
      if (offTrack(e, track())) collapse();
    };
    const key = (e) => {
      if (e.key === "Escape") collapse();
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", key, true);
    };
  }, [open, closing, collapse]);
  scene.current.compact = !open;
  scene.current.closing = closing;
  scene.current.openConfig = prefs.config;
  const config = (0, import_react.useMemo)(() => open ? prefs.config : { ...prefs.config, viewWidth: SPACE.railWidth, viewHeight: SPACE.railHeight, viewFeather: 0 }, [open, prefs.config]);
  if (!prefs.config.dock) return null;
  return /* @__PURE__ */ import_react.default.createElement("div", { className: `se-root se-dock ${open ? "se-dock-open" : ""} ${closing ? "se-dock-closing" : ""} ${dark ? "se-dark" : "se-light"}`, ref: root }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-dock-rail" }, /* @__PURE__ */ import_react.default.createElement(Track, { escape: true, label: "\u63A8\u7406\u5F3A\u5EA6\uFF08\u5E38\u9A7B\uFF09", layoutKey: open ? "open" : "rail", readVisualValidity: (expected) => visualValidity(controller, expected), scene: scene.current, position: state.position, pressed: state.pressed, config, levels: state.levels, disabled: state.disabled, syncing: state.syncing, cancelZone: state.cancelZone, diagnostics: runtime.diagnostics, onBegin: (o) => {
    expand();
    return controller.begin(o);
  }, onPreview: (p, c) => controller.preview(p, c), onRelease: () => void controller.release(), onCancel: cancel, onMenu: () => setMenu("\u5E38\u7528"), onHoleTap: holeTap })), open && !closing && /* @__PURE__ */ import_react.default.createElement("div", { className: `se-status se-dock-status ${["error", "conflict", "unknown"].includes(state.phase) ? "se-status-warn" : ""}`, role: "status", "aria-live": "polite" }, /* @__PURE__ */ import_react.default.createElement("span", { className: state.phase === "applying" ? "se-working" : "" }), statusText(state)), menu && /* @__PURE__ */ import_react.default.createElement(SettingsPanel, { runtime, initialTab: menu, onClose: () => setMenu(null) }));
}
var fields = {
  viewWidth: ["\u53D6\u666F\u6846\u5BBD\u5EA6", 314, SPACE.width, 1, "px"],
  viewHeight: ["\u53D6\u666F\u6846\u9AD8\u5EA6", 38, SPACE.height, 1, "px"],
  viewFeather: ["\u53D6\u666F\u6846\u8FB9\u7F18\u67D4\u5316", 0, 32, 1, "px"],
  speed: ["\u64AD\u653E\u901F\u5EA6", 0.1, 10, 0.1, "\xD7"],
  activity: ["\u5B87\u5B99\u6D3B\u8DC3\u5EA6", 0, 2, 0.05, ""],
  lensStrength: ["\u900F\u955C\u5F3A\u5EA6", 0, 1, 0.05, ""],
  gravity: ["\u5C40\u90E8\u5F15\u529B", 0, 1, 0.05, ""],
  density: ["\u6052\u661F\u5BC6\u5EA6", 0.25, 2, 0.05, ""],
  meteorRate: ["\u6D41\u661F\u76F8\u5BF9\u9891\u7387", 0, 3, 0.1, ""],
  nebulaRate: ["\u661F\u4E91\u76F8\u5BF9\u9891\u7387", 0, 3, 0.1, ""],
  clusterRate: ["\u661F\u56E2\u76F8\u5BF9\u9891\u7387", 0, 3, 0.1, ""],
  spin: ["\u5438\u79EF\u76D8\u81EA\u65CB", 0.1, 3, 0.1, "\xD7"],
  brightness: ["\u4EAE\u5EA6", 0.25, 1.2, 0.05, ""],
  glow: ["\u5149\u6655", 0, 1, 0.05, ""],
  trails: ["\u661F\u5149\u62D6\u5C3E", 0, 1, 0.05, ""],
  motionBlur: ["\u8FD0\u52A8\u67D4\u5316", 0, 1, 0.05, ""],
  uiScale: ["\u5F39\u7A97\u5BBD\u5EA6\u6BD4\u4F8B", 0.8, 1.25, 0.05, "\xD7"]
};
var toggles = { dock: "\u8F93\u5165\u6846\u4E0A\u65B9\u5E38\u9A7B\u6ED1\u8F68", stars: "\u6052\u661F\u4E0E\u661F\u5C18", meteors: "\u968F\u673A\u6D41\u661F", nebulae: "\u8584\u96FE\u661F\u4E91", clusters: "\u758F\u5BC6\u661F\u56E2", lens: "\u5F15\u529B\u900F\u955C", reducedMotion: "\u51CF\u5C11\u52A8\u6001\u6548\u679C", followSystemMotion: "\u9075\u4ECE\u7CFB\u7EDF\u51CF\u5C11\u52A8\u6001\u6548\u679C" };
var styleNames = { realistic: "A \xB7 \u7ECF\u5178\u5199\u5B9E", scifi: "B \xB7 \u79D1\u5E7B\u589E\u5F3A", hybrid: "C \xB7 \u5199\u5B9E + \u79D1\u5E7B", minimal: "D \xB7 \u6781\u7B80\u4F18\u96C5" };
function RangeField({ name, config, onChange, onStart, onEnd }) {
  const [label, min, max, step, suffix] = fields[name];
  return /* @__PURE__ */ import_react.default.createElement("label", { className: "se-field" }, /* @__PURE__ */ import_react.default.createElement("span", null, label, /* @__PURE__ */ import_react.default.createElement("button", { className: "se-reset-one", type: "button", title: "\u6062\u590D\u6B64\u9879\u9ED8\u8BA4\u503C", onClick: (e) => {
    e.preventDefault();
    onChange({ [name]: DEFAULTS[name] });
  } }, "\u21BA")), /* @__PURE__ */ import_react.default.createElement("span", { className: "se-range-row" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "range", min, max, step, value: config[name], "aria-label": label, onPointerDown: onStart, onPointerUp: onEnd, onPointerCancel: onEnd, onBlur: onEnd, onKeyDown: (e) => {
    if (e.key.startsWith("Arrow")) onStart?.();
  }, onKeyUp: onEnd, onChange: (e) => onChange({ [name]: Number(e.target.value) }) }), /* @__PURE__ */ import_react.default.createElement("output", null, Number(config[name].toFixed(2)), suffix)));
}
function Toggle({ name, config, onChange }) {
  return /* @__PURE__ */ import_react.default.createElement("label", { className: "se-toggle" }, /* @__PURE__ */ import_react.default.createElement("span", null, toggles[name]), /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: config[name], onChange: (e) => onChange({ [name]: e.target.checked }) }));
}
function download(name, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function Confirmation({ request, onCancel, onConfirm }) {
  const node = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const before = document.activeElement, root = node.current;
    root.querySelector("button")?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      } else if (e.key === "Tab") {
        const buttons = [...root.querySelectorAll("button")];
        e.preventDefault();
        buttons[document.activeElement === buttons[0] ? 1 : 0]?.focus();
      }
    };
    root.addEventListener("keydown", key, true);
    return () => {
      root.removeEventListener("keydown", key, true);
      if (before?.isConnected) before.focus();
    };
  }, []);
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "se-confirm-shade" }, /* @__PURE__ */ import_react.default.createElement("div", { ref: node, className: "se-confirm", role: "alertdialog", "aria-label": "\u786E\u8BA4\u89C6\u89C9\u64CD\u4F5C" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u786E\u8BA4\u89C6\u89C9\u64CD\u4F5C"), /* @__PURE__ */ import_react.default.createElement("p", null, request.message), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { onClick: onCancel }, "\u53D6\u6D88"), /* @__PURE__ */ import_react.default.createElement("button", { className: "se-primary", onClick: onConfirm }, "\u786E\u8BA4"))));
}
function LabView({ config, diagnostics }) {
  const [session] = (0, import_react.useState)(() => new LabSession({ config })), state = useSource(session);
  (0, import_react.useLayoutEffect)(() => {
    session.setConfig(config);
    session.publish();
  }, [config]);
  (0, import_react.useEffect)(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"), protection = () => session.setSystemReduced(media.matches), hidden = () => {
      if (document.hidden) session.stop("\u9884\u89C8\u9690\u85CF\uFF0C\u4E8B\u4EF6\u5DF2\u6E05\u7406");
    }, blur = () => session.stop("\u7A97\u53E3\u79BB\u5F00\uFF0C\u4E8B\u4EF6\u5DF2\u6E05\u7406");
    protection();
    media.addEventListener("change", protection);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("blur", blur);
    return () => {
      media.removeEventListener("change", protection);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("blur", blur);
      session.dispose();
    };
  }, []);
  const phase = { energy: "\u80FD\u91CF", collapse: "\u574D\u7F29", newborn: "\u521D\u751F", boom: "\u5C55\u5F00", settling: "\u56DE\u7A33", returning: "\u6536\u675F", settled: "\u6DF1\u7A7A" }[state.phase];
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "se-lab-inspector", "data-lab-scale": state.scale, "data-lab-event": state.event ?? "" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-lab-width", role: "group", "aria-label": "\u9884\u89C8\u89C2\u5BDF\u500D\u7387" }, [1, 2, 4].map((scale2) => /* @__PURE__ */ import_react.default.createElement("button", { key: scale2, "aria-pressed": state.scale === scale2, onClick: () => session.setScale(scale2) }, scale2, "\xD7 ", scale2 === 1 ? "\u5B9E\u9645\u5C3A\u5BF8" : "\u68C0\u67E5"))), /* @__PURE__ */ import_react.default.createElement("p", { className: "se-note" }, "\u4EC5\u653E\u5927\u6B64\u5904\u89C2\u5BDF\u753B\u9762\uFF1B\u53EF\u62D6\u52A8\u6ED1\u8F68\uFF0C\u8D85\u51FA\u533A\u57DF\u65F6\u6EDA\u52A8\u67E5\u770B\u3002"), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-lab-scroll", tabIndex: 0, "aria-label": "\u53EF\u6EDA\u52A8\u7684\u5B87\u5B99\u68C0\u67E5\u753B\u9762", ref: (el) => {
    if (el && el.dataset.centred !== String(state.scale)) {
      el.dataset.centred = String(state.scale);
      requestAnimationFrame(() => {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
      });
    }
  } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-lab-extent", style: { width: SPACE.width * state.scale, height: (SPACE.height + 12) * state.scale } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-lab-stage", style: { width: SPACE.width, height: SPACE.height, transform: `scale(${state.scale})` } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-lab-track", style: { left: SPACE.railX, top: SPACE.centerY - 36 } }, /* @__PURE__ */ import_react.default.createElement(Track, { position: state.position, pressed: state.pressed, config, levels: demoLevels, diagnostics, scene: session.scene, inspectionScale: state.scale, layoutKey: state.scale, readInput: session.input, onStatus: (mode) => {
    if (session.renderer && session.renderer !== mode) session.stop("\u7ED8\u5236\u65B9\u5F0F\u53D8\u5316\uFF0C\u4E8B\u4EF6\u5DF2\u6E05\u7406");
    session.renderer = mode;
  }, onBegin: (o) => {
    session.stop("\u624B\u52A8\u62D6\u52A8\u5DF2\u4E2D\u65AD\u4E8B\u4EF6");
    session.positionTo(session.position, o.pointer);
    return true;
  }, onPreview: (p) => session.positionTo(p, session.pressed), onRelease: () => session.positionTo(session.position, false), onCancel: () => session.stop(), label: "\u5B9E\u9A8C\u5BA4\u89C6\u89C9\u5F3A\u5EA6" }))))), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-actions se-lab-anchors" }, demoLevels.map((l) => /* @__PURE__ */ import_react.default.createElement("button", { key: l.id, onClick: () => {
    session.stop();
    session.prepare(l.position);
    session.publish();
  } }, l.name)), /* @__PURE__ */ import_react.default.createElement("button", { onPointerDown: () => session.hold(true), onPointerUp: () => session.hold(false), onPointerLeave: () => session.hold(false), onPointerCancel: () => session.hold(false), onBlur: () => session.hold(false), onKeyDown: (e) => {
    if (e.key === " " && !e.repeat) {
      e.preventDefault();
      session.hold(true);
    }
  }, onKeyUp: (e) => {
    if (e.key === " ") session.hold(false);
  } }, "\u6309\u4F4F\u8DC3\u8FC1")), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-actions", role: "group", "aria-label": "\u624B\u52A8\u5929\u6587\u4E8B\u4EF6" }, Object.entries(LAB_EVENTS).map(([id, name]) => /* @__PURE__ */ import_react.default.createElement("button", { key: id, disabled: Boolean(state.event), onClick: () => session.trigger(id) }, "\u9884\u89C8", name)), /* @__PURE__ */ import_react.default.createElement("button", { disabled: !state.event, onClick: () => session.stop() }, "\u505C\u6B62\u4E8B\u4EF6")), /* @__PURE__ */ import_react.default.createElement("p", { className: "se-note se-lab-event-status", role: "status" }, state.notice, " \xB7 \u9636\u6BB5\uFF1A", phase, " \xB7 Lab BOOM ", state.boomCount, "\u6B21"));
}
function SettingsContent({ runtime, initialTab = "\u5E38\u7528", onClose, embedded = false }) {
  const prefs = useSource(runtime.preferences), [tab, setTab] = (0, import_react.useState)(initialTab), [draft, setDraft] = (0, import_react.useState)(() => structuredClone(prefs.config)), [labName, setLabName] = (0, import_react.useState)("\u5B9E\u9A8C\u5BA4\u9884\u8BBE"), [selected, setSelected] = (0, import_react.useState)(prefs.presets[0]?.name ?? ""), [name, setName] = (0, import_react.useState)("\u6211\u7684\u661F\u6D77"), [notice, setNotice] = (0, import_react.useState)(""), [confirm, setConfirm] = (0, import_react.useState)(null), [diagnostic, setDiagnostic] = (0, import_react.useState)(""), dark = useDark(), file = (0, import_react.useRef)(null);
  const lab = tab === "\u9884\u89C8\u5B9E\u9A8C\u5BA4", config = lab ? draft : prefs.config;
  const labConfig = (0, import_react.useMemo)(() => ({ ...draft, ...deviceConfig(prefs.config) }), [draft, prefs.config]);
  const closeContent = async () => {
    const p = runtime.preferences;
    if (p.state.readOnly || p.version === p.savedVersion || await p.flush()) onClose?.();
  };
  (0, import_react.useEffect)(() => () => {
    void runtime.preferences.flush();
  }, []);
  const change = (patch) => lab ? setDraft((v) => validateConfig({ ...v, ...patch })) : runtime.preferences.change(patch);
  const start = () => {
    if (!lab) runtime.preferences.beginGesture();
  }, end = () => {
    if (!lab) runtime.preferences.endGesture();
  };
  const ask = (message, action) => setConfirm({ message, action });
  const applyDraft = () => ask("\u5C06\u5B9E\u9A8C\u5BA4\u89C6\u89C9\u53C2\u6570\u5E94\u7528\u5230\u6B63\u5F0F\u6ED1\u5757\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u4F1A\u4FEE\u6539\u6A21\u578B\u63A8\u7406\u7B49\u7EA7\u3002", () => {
    runtime.preferences.applyVisual(draft);
    setNotice("\u89C6\u89C9\u53C2\u6570\u5DF2\u5E94\u7528\uFF1B\u6A21\u578B\u8BBE\u7F6E\u672A\u6539\u53D8");
  });
  const openLab = (preset) => {
    setDraft({ ...prefs.config, ...visualConfig(preset?.config ?? prefs.config) });
    setLabName(preset?.name ?? "\u5B9E\u9A8C\u5BA4\u9884\u8BBE");
    setTab("\u9884\u89C8\u5B9E\u9A8C\u5BA4");
    setNotice("\u6C99\u76D2\u9884\u89C8 \xB7 \u5C1A\u672A\u5E94\u7528\u5230\u6B63\u5F0F\u6ED1\u5757");
  };
  const range = (name2) => /* @__PURE__ */ import_react.default.createElement(RangeField, { key: name2, name: name2, config, onChange: change, onStart: start, onEnd: end });
  const toggle = (name2) => /* @__PURE__ */ import_react.default.createElement(Toggle, { key: name2, name: name2, config, onChange: change });
  const style = /* @__PURE__ */ import_react.default.createElement("label", { className: "se-field" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u9ED1\u6D1E\u65CB\u94AE\u98CE\u683C"), /* @__PURE__ */ import_react.default.createElement("select", { "aria-label": "\u9ED1\u6D1E\u65CB\u94AE\u98CE\u683C", value: config.style, onChange: (e) => change({ style: e.target.value }) }, Object.entries(styleNames).map(([id, title]) => /* @__PURE__ */ import_react.default.createElement("option", { key: id, value: id }, title))));
  const selectedPreset = prefs.presets.find((p) => p.name === selected);
  const renamePreset = () => {
    try {
      const clean = cleanName(name);
      if (prefs.presets.some((p) => p.name === clean)) throw Error("\u540D\u79F0\u5DF2\u5B58\u5728");
      runtime.preferences.setPresets(prefs.presets.map((p) => p.name === selected ? { ...p, name: clean } : p));
      setSelected(clean);
    } catch (e) {
      setNotice(e.message);
    }
  };
  (0, import_react.useEffect)(() => {
    if (!["saving"].includes(runtime.preferences.getSnapshot().status)) void runtime.preferences.load();
  }, []);
  const diagnosticText = () => JSON.stringify(runtime.diagnostics.report(), null, 2);
  const content = /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("header", { className: "se-settings-header" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-eyebrow" }, "A SMALL SLIDER. A LARGER UNIVERSE."), /* @__PURE__ */ import_react.default.createElement("h2", null, "\u661F\u8F68\u63A8\u7406 ", /* @__PURE__ */ import_react.default.createElement("span", null, "Stellar Effort"))), /* @__PURE__ */ import_react.default.createElement("button", { className: "se-icon-button", "aria-label": "\u5173\u95ED\u89C6\u89C9\u8BBE\u7F6E", onClick: () => void closeContent() }, "\xD7")), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-settings-layout" }, /* @__PURE__ */ import_react.default.createElement("nav", { className: "se-tabs", "aria-label": "\u661F\u8F68\u8BBE\u7F6E\u5206\u7C7B" }, ["\u5E38\u7528", "\u5B87\u5B99\u89C6\u89C9", "\u6027\u80FD\u4E0E\u8212\u9002\u5EA6", "\u9884\u8BBE\u7BA1\u7406", "\u9884\u89C8\u5B9E\u9A8C\u5BA4", "\u517C\u5BB9\u6027\u4E0E\u72B6\u6001"].map((t) => /* @__PURE__ */ import_react.default.createElement("button", { type: "button", key: t, "aria-current": tab === t ? "page" : void 0, onClick: () => {
    if (t === "\u9884\u89C8\u5B9E\u9A8C\u5BA4" && tab !== "\u9884\u89C8\u5B9E\u9A8C\u5BA4") setDraft(structuredClone(prefs.config));
    setTab(t);
    setNotice("");
  } }, t))), /* @__PURE__ */ import_react.default.createElement("main", { className: "se-settings-content" }, (tab === "\u5B87\u5B99\u89C6\u89C9" || lab) && /* @__PURE__ */ import_react.default.createElement("section", { className: "se-scene-settings" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-section-title" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u573A\u666F\u8303\u56F4"), /* @__PURE__ */ import_react.default.createElement("p", null, "\u8C03\u6574\u7684\u662F\u53D6\u666F\u6846\uFF1A\u5B87\u5B99\u56FA\u5B9A\u4E3A ", SPACE.width, "\xD7", SPACE.height, "\uFF0C\u8303\u56F4\u53D8\u5C0F\u53EA\u662F\u770B\u89C1\u7684\u5C11\uFF0C\u4E0D\u4F1A\u7F29\u653E\u6216\u91CD\u6392\u3002\u6700\u5C0F\u53EA\u663E\u793A\u6ED1\u8F68\uFF0C\u9ED8\u8BA4\u6700\u5927\u3002")), /* @__PURE__ */ import_react.default.createElement(ScenePreview, { config, diagnostics: runtime.diagnostics }), /* @__PURE__ */ import_react.default.createElement("label", { className: "se-field" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u573A\u666F\u5927\u5C0F"), /* @__PURE__ */ import_react.default.createElement("span", { className: "se-range-row" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "range", min: 0, max: 100, step: 1, "aria-label": "\u573A\u666F\u5927\u5C0F", value: Math.round(sceneAmount(config) * 100), onPointerDown: start, onPointerUp: end, onPointerCancel: end, onBlur: end, onChange: (e) => change(sceneSize(Number(e.target.value) / 100)) }), /* @__PURE__ */ import_react.default.createElement("output", null, Math.round(sceneAmount(config) * 100), "%"))), range("viewFeather"), /* @__PURE__ */ import_react.default.createElement("details", null, /* @__PURE__ */ import_react.default.createElement("summary", null, "\u5206\u522B\u8C03\u6574\u5BBD\u5EA6\u4E0E\u9AD8\u5EA6"), ["viewWidth", "viewHeight"].map(range))), tab === "\u5E38\u7528" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-section-title" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u5C0F\u6ED1\u5757\u91CC\uFF0C\u4E00\u7247\u4F1A\u547C\u5438\u7684\u5B87\u5B99"), /* @__PURE__ */ import_react.default.createElement("p", null, "\u89C6\u89C9\u5373\u65F6\u751F\u6548\u3002\u6A21\u578B\u7B49\u7EA7\u7531\u4E3B\u6ED1\u5757\u677E\u624B\u540E\u5355\u72EC\u786E\u8BA4\u3002")), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-settings-preview" }, /* @__PURE__ */ import_react.default.createElement(UniverseView, { position: 1, config, diagnostics: runtime.diagnostics })), style, range("speed"), range("activity"), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => openLab() }, "\u5728\u5B9E\u9A8C\u5BA4\u9884\u89C8"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => runtime.preferences.undo(), disabled: !runtime.preferences.undoStack.length }, "\u64A4\u9500"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => runtime.preferences.redo(), disabled: !runtime.preferences.redoStack.length }, "\u91CD\u505A"))), tab === "\u5B87\u5B99\u89C6\u89C9" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-section-title" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u661F\u6D77\u4E0E\u5F15\u529B"), /* @__PURE__ */ import_react.default.createElement("p", null, "\u5C40\u90E8\u8FD1\u4F3C\u3001\u8F7B\u5FAE\u7275\u5F15\u3002\u661F\u6D77\u59CB\u7EC8\u662F\u753B\u9762\u7684\u4E3B\u4F53\u3002")), style, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-toggle-grid" }, ["stars", "meteors", "nebulae", "clusters", "lens"].map(toggle)), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => change({ stars: true, meteors: true, nebulae: true, clusters: true, lens: true }) }, "\u5168\u9009\u5B87\u5B99\u5143\u7D20"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => ask("\u6062\u590D\u5B87\u5B99\u89C6\u89C9\u5206\u7C7B\u7684\u9ED8\u8BA4\u53C2\u6570\uFF1F", () => {
    const keys = ["style", "stars", "meteors", "nebulae", "clusters", "lens", "lensStrength", "gravity", "density", "meteorRate", "nebulaRate", "clusterRate", "spin"];
    change(Object.fromEntries(keys.map((k) => [k, DEFAULTS[k]])));
  }) }, "\u6062\u590D\u6B64\u5206\u7C7B")), /* @__PURE__ */ import_react.default.createElement("details", null, /* @__PURE__ */ import_react.default.createElement("summary", null, "\u9AD8\u7EA7\u89C6\u89C9\u53C2\u6570"), ["density", "lensStrength", "gravity", "spin", "meteorRate", "nebulaRate", "clusterRate"].map(range))), tab === "\u6027\u80FD\u4E0E\u8212\u9002\u5EA6" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-section-title" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u6F02\u4EAE\uFF0C\u4E5F\u8981\u8F7B\u5DE7"), /* @__PURE__ */ import_react.default.createElement("p", null, "\u4F18\u5148\u4FDD\u8BC1\u8F93\u5165\u8DDF\u624B\uFF1B\u4F4E\u8D1F\u8F7D\u65F6\u6062\u590D\u7EC6\u8282\uFF0C\u5173\u95ED\u63A7\u4EF6\u505C\u6B62\u7ED8\u5236\u3002")), /* @__PURE__ */ import_react.default.createElement("label", { className: "se-field" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u753B\u8D28\u4E0E\u8D44\u6E90\u9884\u7B97"), /* @__PURE__ */ import_react.default.createElement("select", { "aria-label": "\u753B\u8D28", value: config.quality, onChange: (e) => change({ quality: e.target.value }) }, /* @__PURE__ */ import_react.default.createElement("option", { value: "auto" }, "\u81EA\u52A8\u8C03\u8282\uFF08\u63A8\u8350\uFF09"), /* @__PURE__ */ import_react.default.createElement("option", { value: "high" }, "\u9AD8"), /* @__PURE__ */ import_react.default.createElement("option", { value: "medium" }, "\u4E2D"), /* @__PURE__ */ import_react.default.createElement("option", { value: "low" }, "\u4F4E"), /* @__PURE__ */ import_react.default.createElement("option", { value: "static" }, "\u9759\u6001\u6E10\u53D8"))), /* @__PURE__ */ import_react.default.createElement("label", { className: "se-field" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u5F39\u7A97\u5173\u95ED\u65B9\u5F0F"), /* @__PURE__ */ import_react.default.createElement("select", { "aria-label": "\u5F39\u7A97\u5173\u95ED\u65B9\u5F0F", value: config.dismiss, onChange: (e) => change({ dismiss: e.target.value }) }, /* @__PURE__ */ import_react.default.createElement("option", { value: "fade" }, "\u6DE1\u51FA\uFF08\u7EA6 0.24 \u79D2\uFF09"), /* @__PURE__ */ import_react.default.createElement("option", { value: "instant" }, "\u76F4\u63A5\u6D88\u5931"))), /* @__PURE__ */ import_react.default.createElement("p", { className: "se-note" }, "\u70B9 \xD7 \u6216\u6ED1\u5757\u4EE5\u5916\u7684\u4EFB\u4F55\u5730\u65B9\uFF08\u5305\u62EC\u661F\u7A7A\uFF09\u90FD\u4F1A\u5173\u95ED\u5F39\u7A97\uFF1B\u56FA\u5B9A \u2316 \u540E\u53EA\u6709 \xD7 \u548C Esc \u4F1A\u5173\u95ED\u3002\u5E38\u9A7B\u6ED1\u8F68\u5C55\u5F00\u7684\u5B87\u5B99\u89C6\u56FE\u4E5F\u6309\u8FD9\u91CC\u7684\u65B9\u5F0F\u6536\u8D77\u3002"), toggle("dock"), toggle("reducedMotion"), toggle("followSystemMotion"), ["brightness", "glow", "trails", "motionBlur", "uiScale"].map(range), /* @__PURE__ */ import_react.default.createElement("p", { className: "se-note" }, "\u64AD\u653E\u901F\u5EA6\u63A7\u5236\u6F14\u5316\u65F6\u95F4\uFF1B\u9AD8\u500D\u901F\u4E0D\u4F1A\u7B49\u6BD4\u4F8B\u653E\u5927\u95EA\u5149\u5F3A\u5EA6\u3002\u51CF\u5C11\u52A8\u6001\u6548\u679C\u9650\u5236\u8DC3\u8FC1\u4E0E\u7C92\u5B50\u8FD0\u52A8\u3002")), tab === "\u9884\u8BBE\u7BA1\u7406" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-section-title" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u6536\u85CF\u4F60\u7684\u661F\u6D77"), /* @__PURE__ */ import_react.default.createElement("p", null, "\u53EA\u4FDD\u5B58\u89C6\u89C9\u89C4\u5219\u3002\u5BFC\u5165\u540E\u5148\u5728\u5B9E\u9A8C\u5BA4\u67E5\u770B\uFF0C\u518D\u51B3\u5B9A\u662F\u5426\u5E94\u7528\u3002")), /* @__PURE__ */ import_react.default.createElement("label", { className: "se-field" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u672C\u5730\u9884\u8BBE"), /* @__PURE__ */ import_react.default.createElement("select", { "aria-label": "\u672C\u5730\u9884\u8BBE", value: selected, onChange: (e) => setSelected(e.target.value) }, /* @__PURE__ */ import_react.default.createElement("option", { value: "", disabled: true }, "\u9009\u62E9\u9884\u8BBE"), prefs.presets.map((p) => /* @__PURE__ */ import_react.default.createElement("option", { key: p.name }, p.name)))), /* @__PURE__ */ import_react.default.createElement("label", { className: "se-field" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u9884\u8BBE\u540D\u79F0"), /* @__PURE__ */ import_react.default.createElement("input", { "aria-label": "\u9884\u8BBE\u540D\u79F0", maxLength: 48, value: name, onChange: (e) => setName(e.target.value) })), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { disabled: !selectedPreset, onClick: () => openLab(selectedPreset) }, "\u6C99\u76D2\u8BD5\u7528"), /* @__PURE__ */ import_react.default.createElement("button", { disabled: !selectedPreset, onClick: () => ask(`\u5E94\u7528\u300C${selected}\u300D\u7684\u89C6\u89C9\u53C2\u6570\uFF1F`, () => runtime.preferences.change(selectedPreset.config)) }, "\u5E94\u7528"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => {
    try {
      if (prefs.presets.some((p) => p.name === cleanName(name))) ask("\u8986\u76D6\u540C\u540D\u9884\u8BBE\uFF1F", () => runtime.preferences.savePreset(name));
      else runtime.preferences.savePreset(name);
    } catch (e) {
      setNotice(e.message);
    }
  } }, "\u4FDD\u5B58\u5F53\u524D\u89C6\u89C9"), /* @__PURE__ */ import_react.default.createElement("button", { disabled: !selectedPreset, onClick: () => {
    try {
      const clean = cleanName(name);
      if (prefs.presets.some((p) => p.name === clean)) throw Error("\u590D\u5236\u9700\u8981\u4E00\u4E2A\u5C1A\u672A\u4F7F\u7528\u7684\u65B0\u540D\u79F0");
      runtime.preferences.savePreset(clean, selectedPreset.config);
    } catch (e) {
      setNotice(e.message);
    }
  } }, "\u590D\u5236"), /* @__PURE__ */ import_react.default.createElement("button", { disabled: !selectedPreset, onClick: renamePreset }, "\u91CD\u547D\u540D"), /* @__PURE__ */ import_react.default.createElement("button", { disabled: !selectedPreset, onClick: () => ask(`\u5220\u9664\u9884\u8BBE\u300C${selected}\u300D\uFF1F`, () => {
    runtime.preferences.setPresets(prefs.presets.filter((p) => p.name !== selected));
    setSelected("");
  }) }, "\u5220\u9664"), /* @__PURE__ */ import_react.default.createElement("button", { disabled: !selectedPreset, onClick: () => download("Stellar_Effort_\u89C6\u89C9\u9884\u8BBE.json", exportPreset(selected, selectedPreset.config)) }, "\u5BFC\u51FA JSON"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => file.current.click() }, "\u5BFC\u5165\u5E76\u9884\u89C8")), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-preset-cards" }, BUILTINS.map((p) => /* @__PURE__ */ import_react.default.createElement("button", { key: p.name, onClick: () => openLab(p) }, /* @__PURE__ */ import_react.default.createElement("span", { className: `se-preset-dot se-style-${p.config.style}` }), /* @__PURE__ */ import_react.default.createElement("b", null, p.name), /* @__PURE__ */ import_react.default.createElement("small", null, "\u5185\u7F6E \xB7 \u70B9\u51FB\u9884\u89C8"))))), lab && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-section-title" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "Universe Lab ", /* @__PURE__ */ import_react.default.createElement("span", null, "\u89C6\u89C9\u6C99\u76D2")), /* @__PURE__ */ import_react.default.createElement("p", null, "\u6B64\u5904\u6CA1\u6709\u6A21\u578B\u5199\u5165\u63A5\u53E3\uFF1B\u62D6\u52A8\u4E0E\u957F\u6309\u53EA\u5F71\u54CD\u72EC\u7ACB\u9884\u89C8\u3002")), /* @__PURE__ */ import_react.default.createElement(LabView, { config: labConfig, diagnostics: runtime.diagnostics }), style, range("speed"), range("activity"), /* @__PURE__ */ import_react.default.createElement("details", null, /* @__PURE__ */ import_react.default.createElement("summary", null, "\u5C40\u90E8\u5F15\u529B\u4E0E\u9AD8\u7EA7\u89C6\u89C9"), ["stars", "meteors", "nebulae", "clusters", "lens"].map(toggle), ["density", "lensStrength", "gravity", "spin", "meteorRate", "nebulaRate", "clusterRate", "brightness", "glow", "trails", "motionBlur"].map(range)), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { className: "se-primary", onClick: applyDraft }, "\u5E94\u7528\u5230\u6B63\u5F0F\u6ED1\u5757"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => {
    try {
      const save = () => {
        runtime.preferences.savePreset(labName, draft);
        setNotice("\u5DF2\u4FDD\u5B58\u9884\u8BBE\uFF0C\u672A\u5E94\u7528\u5230\u6B63\u5F0F\u6ED1\u5757");
      };
      if (prefs.presets.some((p) => p.name === cleanName(labName))) ask("\u8986\u76D6\u540C\u540D\u8349\u7A3F\u9884\u8BBE\uFF1F", save);
      else save();
    } catch (e) {
      setNotice(e.message);
    }
  } }, "\u4FDD\u5B58\u8349\u7A3F\u9884\u8BBE"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => download("Stellar_Effort_Lab\u9884\u8BBE.json", exportPreset(labName, draft)) }, "\u5BFC\u51FA\u8349\u7A3F"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => file.current.click() }, "\u5BFC\u5165")), /* @__PURE__ */ import_react.default.createElement("label", { className: "se-field" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u8349\u7A3F\u9884\u8BBE\u540D"), /* @__PURE__ */ import_react.default.createElement("input", { value: labName, maxLength: 48, onChange: (e) => setLabName(e.target.value) }))), tab === "\u517C\u5BB9\u6027\u4E0E\u72B6\u6001" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "se-section-title" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u6E05\u695A\u77E5\u9053\u53D1\u751F\u4E86\u4EC0\u4E48"), /* @__PURE__ */ import_react.default.createElement("p", null, "Stellar Effort 1.1.6 \xB7 \u9002\u914D DSH 0.2.x\uFF08\u5DF2\u9A8C\u8BC1 0.2.1-rc.3\u30010.2.2-rc.1\uFF09")), /* @__PURE__ */ import_react.default.createElement("dl", { className: "se-facts" }, /* @__PURE__ */ import_react.default.createElement("dt", null, "\u771F\u5B9E\u8BBE\u7F6E"), /* @__PURE__ */ import_react.default.createElement("dd", null, "\u4F7F\u7528 DSH \u5B98\u65B9\u6A21\u578B\u76EE\u5F55\u4E0E\u9009\u62E9\u63A5\u53E3\uFF0C\u9762\u5411\u540E\u7EED\u8BF7\u6C42\uFF1B\u5BBF\u4E3B\u8FD8\u4F1A\u5F02\u6B65\u4FDD\u5B58\u65B0\u4F1A\u8BDD\u9ED8\u8BA4\u503C\u3002"), /* @__PURE__ */ import_react.default.createElement("dt", null, "\u5E76\u53D1\u8FB9\u754C"), /* @__PURE__ */ import_react.default.createElement("dd", null, "\u5DF2\u89C2\u6D4B\u5916\u90E8\u53D8\u5316\u4F1A\u53D6\u6D88\u9884\u89C8\uFF1B\u81EA\u8EAB\u5199\u5165\u4E32\u884C\u5E76\u8BFB\u56DE\u786E\u8BA4\u3002\u5BBF\u4E3B\u65E0\u539F\u5B50\u65E7\u503C\u68C0\u67E5\uFF0C\u65E0\u6CD5\u4FDD\u8BC1\u6D88\u9664\u5168\u90E8\u5916\u90E8\u7ADE\u4E89\u3002"), /* @__PURE__ */ import_react.default.createElement("dt", null, "\u80FD\u529B\u6620\u5C04"), /* @__PURE__ */ import_react.default.createElement("dd", null, "\u663E\u793A\u4E0E\u63D0\u4EA4\u771F\u5B9E\u6A21\u578B\u6863\u4F4D\uFF1BHigh \u4FDD\u6301\u7D2B\u8272\u4E34\u754C\uFF0CMax / Xhigh \u624D\u5BF9\u5E94\u5B8C\u6574\u6DF1\u7A7A\u3002\u4E0D\u652F\u6301\u65F6\u7981\u7528\uFF0C\u4E0D\u8865\u9020\u6863\u4F4D\u3002"), /* @__PURE__ */ import_react.default.createElement("dt", null, "\u914D\u7F6E\u72B6\u6001"), /* @__PURE__ */ import_react.default.createElement("dd", null, prefs.status, " \xB7 \u4FEE\u8BA2 ", prefs.revision), /* @__PURE__ */ import_react.default.createElement("dt", null, "\u6570\u636E\u4E0E\u9690\u79C1"), /* @__PURE__ */ import_react.default.createElement("dd", null, "\u89C6\u89C9\u914D\u7F6E\u4E0E\u6709\u9650\u5FEB\u7167\u4FDD\u5B58\u5728\u5BBF\u4E3B stellar-effort \u76EE\u5F55\uFF1B\u8BCA\u65AD\u53EA\u5728\u5185\u5B58\uFF0C\u4E0D\u6536\u96C6\u804A\u5929\u6216\u51ED\u636E\uFF0C\u4E0D\u4E3B\u52A8\u4E0A\u4F20\u3002"), /* @__PURE__ */ import_react.default.createElement("dt", null, "\u968F\u673A\u5B87\u5B99"), /* @__PURE__ */ import_react.default.createElement("dd", null, "\u8FD0\u884C\u65F6\u751F\u6210\u3001\u8001\u5316\u4E0E\u6355\u83B7\uFF1B\u6CA1\u6709\u89C6\u9891\u6216\u56FA\u5B9A\u661F\u56FE\u5FAA\u73AF\u3002\u9884\u8BBE\u4EC5\u4FDD\u5B58\u89C4\u5219\u3002"), /* @__PURE__ */ import_react.default.createElement("dt", null, "\u56FE\u50CF\u7F72\u540D"), /* @__PURE__ */ import_react.default.createElement("dd", null, "\u90E8\u5206\u5929\u4F53\u56FE\u50CF\uFF1A", PHOTO_CREDIT, "\uFF08CC BY 4.0\uFF09\uFF0C\u5DF2\u88C1\u526A\u3001\u7F29\u5C0F\u5E76\u53BB\u9664\u80CC\u666F\uFF1A", PHOTOS.map((p) => p.id).join("\u3001"), "\u3002\u56FE\u96C6\u968F\u63D2\u4EF6\u6253\u5305\uFF0C\u4E0D\u8054\u7F51\u52A0\u8F7D\u3002")), /* @__PURE__ */ import_react.default.createElement("div", { className: "se-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => setDiagnostic(diagnosticText()) }, "\u9884\u89C8\u8BCA\u65AD"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => {
    runtime.diagnostics.clear();
    setDiagnostic(diagnosticText());
  } }, "\u6E05\u7A7A\u8BCA\u65AD"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => download("Stellar_Effort_\u672A\u786E\u8BA4\u89C6\u89C9\u8349\u7A3F.json", exportPreset("\u672A\u786E\u8BA4\u89C6\u89C9\u8349\u7A3F", prefs.config)) }, "\u5BFC\u51FA\u5F53\u524D\u89C6\u89C9\u8349\u7A3F"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => ask("\u653E\u5F03\u672A\u786E\u8BA4\u7684\u8BBE\u7F6E\u4E0E\u9884\u8BBE\u6539\u52A8\uFF0C\u5E76\u91CD\u65B0\u8BFB\u53D6\u5DF2\u4FDD\u5B58\u914D\u7F6E\uFF1F\u9700\u8981\u4FDD\u7559\u7684\u89C6\u89C9\u8349\u7A3F\u6216\u547D\u540D\u9884\u8BBE\u8BF7\u5148\u5BFC\u51FA\u3002", () => void runtime.preferences.load({ discard: true })) }, "\u91CD\u65B0\u8BFB\u53D6\u914D\u7F6E"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => ask("\u6062\u590D\u5168\u90E8\u9ED8\u8BA4\u89C6\u89C9\u53C2\u6570\uFF1F\u6A21\u578B\u63A8\u7406\u7B49\u7EA7\u4E0D\u4F1A\u6539\u53D8\u3002", () => runtime.preferences.applyVisual(DEFAULTS)) }, "\u6062\u590D\u5168\u90E8\u89C6\u89C9\u9ED8\u8BA4\u503C")), diagnostic && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("textarea", { "aria-label": "\u8BCA\u65AD\u62A5\u544A\u9884\u89C8", className: "se-diagnostics", value: diagnostic, readOnly: true }), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => download("Stellar_Effort_\u8BCA\u65AD.json", diagnostic) }, "\u5BFC\u51FA\u5DF2\u9884\u89C8\u7684\u8BCA\u65AD"))), (notice || prefs.notice) && /* @__PURE__ */ import_react.default.createElement("p", { className: "se-notice", role: "status" }, notice || prefs.notice))), /* @__PURE__ */ import_react.default.createElement("footer", { className: "se-settings-footer" }, /* @__PURE__ */ import_react.default.createElement("span", null, /* @__PURE__ */ import_react.default.createElement("i", { className: prefs.status === "saved" ? "se-save-good" : "" }), " ", lab ? "\u72EC\u7ACB\u5B87\u5B99 \xB7 \u5C1A\u672A\u5E94\u7528\u7684\u6539\u52A8\u4EC5\u5728\u6B64\u5904\u751F\u6548" : prefs.status === "saved" ? "\u89C6\u89C9\u8BBE\u7F6E\u5DF2\u4FDD\u5B58" : prefs.status === "saving" ? "\u6B63\u5728\u4FDD\u5B58\u89C6\u89C9\u8BBE\u7F6E\u2026" : "\u89C6\u89C9\u8BBE\u7F6E\uFF1A" + prefs.status), /* @__PURE__ */ import_react.default.createElement("span", null, "\u771F\u5B9E\u7B49\u7EA7\u4EE5 DSH \u4E3A\u51C6")), /* @__PURE__ */ import_react.default.createElement("input", { ref: file, type: "file", accept: "application/json,.json", hidden: true, onChange: async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      if (f.size > 131072) throw Error("\u6587\u4EF6\u8FC7\u5927\uFF08\u4E0A\u9650 128 KB\uFF09");
      const preset = importPreset(await f.text());
      openLab(preset);
      if (preset.notice) setNotice(preset.notice);
    } catch (error) {
      setNotice(error.message);
    }
  } }), confirm && /* @__PURE__ */ import_react.default.createElement(Confirmation, { request: confirm, onCancel: () => setConfirm(null), onConfirm: () => {
    try {
      confirm.action();
      setConfirm(null);
    } catch (e) {
      setNotice(e.message);
      setConfirm(null);
    }
  } }));
  return embedded ? /* @__PURE__ */ import_react.default.createElement("section", { className: `se-root se-settings se-embedded ${dark ? "se-dark" : "se-light"}`, "aria-label": "Stellar Effort \u5185\u5D4C\u8BBE\u7F6E" }, content) : /* @__PURE__ */ import_react.default.createElement(FocusDialog, { onClose: () => void closeContent(), label: "Stellar Effort \u89C6\u89C9\u8BBE\u7F6E", dark, className: "se-settings" }, content);
}
function SettingsPanel(props) {
  return /* @__PURE__ */ import_react.default.createElement(SettingsContent, { ...props });
}
function SettingsEntry({ runtime, onClose }) {
  return /* @__PURE__ */ import_react.default.createElement(SettingsContent, { runtime, embedded: true, onClose });
}

// src/preferences.mjs
var VisualPreferences = class {
  constructor(adapter) {
    this.adapter = adapter;
    this.listeners = /* @__PURE__ */ new Set();
    this.undoStack = [];
    this.redoStack = [];
    this.gestureBase = null;
    const initial = freshDocument();
    this.state = { ...initial, config: { ...initial.config, ...initial.device }, status: "loading", notice: "", readOnly: false };
    this.version = 0;
    this.savedVersion = 0;
    this.saving = false;
    this.pending = false;
    this.disposed = false;
    this.baselineReady = false;
    this.readGeneration = 0;
    this.writeEpoch = 0;
  }
  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.state;
  emit(patch = {}) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  async load({ discard = false } = {}) {
    const version = this.version, epoch = this.writeEpoch;
    if (this.disposed) return false;
    if (this.saving) {
      this.emit({ notice: "\u6B63\u5728\u786E\u8BA4\u4FDD\u5B58\uFF0C\u8BF7\u7A0D\u540E\u91CD\u65B0\u8BFB\u53D6" });
      return false;
    }
    if (this.version !== this.savedVersion && !discard) {
      this.emit({ notice: "\u5C1A\u672A\u786E\u8BA4\u7684\u4FEE\u6539\u5DF2\u4FDD\u7559\uFF1B\u53EF\u5148\u5BFC\u51FA\u8349\u7A3F\uFF0C\u518D\u786E\u8BA4\u91CD\u65B0\u8BFB\u53D6" });
      return false;
    }
    const generation = ++this.readGeneration;
    if (discard) {
      clearTimeout(this.timer);
      this.emit({ status: "loading", notice: "\u6B63\u5728\u91CD\u65B0\u8BFB\u53D6\uFF0C\u6210\u529F\u524D\u4ECD\u4FDD\u7559\u5F53\u524D\u8349\u7A3F" });
    }
    const current = () => !this.disposed && generation === this.readGeneration && version === this.version && epoch === this.writeEpoch;
    const preserveNewDraft = () => {
      if (discard && !this.disposed && generation === this.readGeneration && epoch === this.writeEpoch) this.emit({ status: "offline", notice: "\u8BFB\u53D6\u671F\u95F4\u51FA\u73B0\u65B0\u4FEE\u6539\uFF0C\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u4FDD\u5B58\u6216\u91CD\u65B0\u8BFB\u53D6" });
    };
    try {
      const raw = await this.adapter.read();
      if (!current()) {
        preserveNewDraft();
        return false;
      }
      const { notice, readOnly, ...document2 } = raw;
      const value = validateDocument(document2);
      this.baselineReady = !readOnly;
      this.savedVersion = version;
      if (discard) {
        this.undoStack = [];
        this.redoStack = [];
        this.gestureBase = null;
      }
      this.emit({ ...value, config: { ...value.config, ...value.device }, status: readOnly ? "protected" : "saved", notice: notice || "", readOnly: !!readOnly });
      return true;
    } catch {
      if (current()) this.emit({ status: "offline", notice: "\u89C6\u89C9\u8BBE\u7F6E\u672A\u80FD\u4ECE\u5BBF\u4E3B\u8BFB\u53D6\uFF1B\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u672A\u786E\u8BA4\u4FDD\u5B58" });
      else preserveNewDraft();
      return false;
    }
  }
  beginGesture() {
    this.gestureBase ??= visualConfig(this.state.config);
  }
  endGesture() {
    if (this.gestureBase && JSON.stringify(this.gestureBase) !== JSON.stringify(visualConfig(this.state.config))) this.pushUndo(this.gestureBase);
    this.gestureBase = null;
    if (this.version !== this.savedVersion) this.schedule();
  }
  pushUndo(config) {
    this.undoStack.push(visualConfig(config));
    this.undoStack = this.undoStack.slice(-40);
    this.redoStack = [];
  }
  change(patch, { history = true } = {}) {
    if (this.state.readOnly) return;
    const next = validateConfig({ ...this.state.config, ...patch });
    if (JSON.stringify(next) === JSON.stringify(this.state.config)) return;
    if (history && !this.gestureBase && JSON.stringify(visualConfig(next)) !== JSON.stringify(visualConfig(this.state.config))) this.pushUndo(this.state.config);
    this.version++;
    this.emit({ config: next, device: deviceConfig(next) });
    if (!this.gestureBase) this.schedule();
  }
  applyVisual(config) {
    this.change(visualConfig(config));
  }
  undo() {
    if (!this.undoStack.length || this.state.readOnly) return;
    this.redoStack.push(visualConfig(this.state.config));
    const next = { ...this.undoStack.pop(), ...deviceConfig(this.state.config) };
    this.version++;
    this.emit({ config: next });
    this.schedule();
  }
  redo() {
    if (!this.redoStack.length || this.state.readOnly) return;
    this.undoStack.push(visualConfig(this.state.config));
    const next = { ...this.redoStack.pop(), ...deviceConfig(this.state.config) };
    this.version++;
    this.emit({ config: next });
    this.schedule();
  }
  setPresets(presets) {
    if (this.state.readOnly) return;
    const next = validateDocument({ formatVersion: FORMAT, revision: this.state.revision, config: visualConfig(this.state.config), device: deviceConfig(this.state.config), presets });
    this.version++;
    this.emit({ presets: next.presets });
    this.schedule();
  }
  savePreset(name, config = this.state.config) {
    name = cleanName(name);
    const existing = this.state.presets.findIndex((p) => p.name === name);
    const list = structuredClone(this.state.presets);
    const next = { name, config: visualConfig(config) };
    if (existing < 0) list.push(next);
    else list[existing] = next;
    this.setPresets(list);
  }
  schedule() {
    if (this.state.readOnly || ["offline", "loading", "conflict"].includes(this.state.status)) return;
    clearTimeout(this.timer);
    this.emit({ status: "saving" });
    this.timer = setTimeout(() => void this.flush(), 250);
  }
  flush() {
    clearTimeout(this.timer);
    if (this.saving) {
      this.pending = true;
      return this.inFlight;
    }
    if (!this.baselineReady) {
      this.emit({ notice: "\u5C1A\u672A\u53D6\u5F97\u53EF\u4FDD\u5B58\u7684\u914D\u7F6E\uFF1B\u4E34\u65F6\u4FEE\u6539\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u786E\u8BA4\u91CD\u65B0\u8BFB\u53D6\u540E\u518D\u5904\u7406" });
      return Promise.resolve(false);
    }
    if (this.disposed || this.state.readOnly || ["loading", "conflict"].includes(this.state.status)) return Promise.resolve(false);
    if (this.savedVersion === this.version) return Promise.resolve(this.state.status === "saved");
    this.saving = true;
    this.writeEpoch++;
    const version = this.version;
    const document2 = validateDocument({ formatVersion: FORMAT, revision: this.state.revision, config: visualConfig(this.state.config), device: deviceConfig(this.state.config), presets: this.state.presets });
    this.inFlight = (async () => {
      try {
        const result = await this.adapter.write(document2, document2.revision);
        if (this.disposed) return;
        this.savedVersion = version;
        this.emit({ revision: result.revision, status: version === this.version ? "saved" : "saving", notice: "" });
      } catch (error) {
        if (error?.code === "CONFLICT") {
          this.emit({ status: "conflict", notice: "\u5176\u4ED6\u7A97\u53E3\u66F4\u65B0\u4E86\u89C6\u89C9\u914D\u7F6E\uFF1B\u8BF7\u91CD\u65B0\u8BFB\u53D6\u540E\u518D\u8C03\u6574\uFF0C\u5F53\u524D\u8349\u7A3F\u672A\u8986\u76D6\u5BF9\u65B9\u8BBE\u7F6E" });
        } else this.emit({ status: "offline", notice: "\u89C6\u89C9\u914D\u7F6E\u4FDD\u5B58\u672A\u786E\u8BA4\uFF1B\u5F53\u524D\u4EC5\u4E34\u65F6\u751F\u6548\uFF0C\u53EF\u5BFC\u51FA\u5907\u4EFD\u6216\u91CD\u65B0\u8BFB\u53D6" });
      } finally {
        this.saving = false;
        if ((this.pending || version !== this.version) && this.state.status === "saving") {
          this.pending = false;
          return this.flush();
        }
      }
      return this.state.status === "saved";
    })();
    return this.inFlight;
  }
  dispose() {
    if (this.disposal) return this.disposal;
    this.readGeneration++;
    clearTimeout(this.timer);
    this.listeners.clear();
    this.disposal = this.flush().then((saved) => {
      this.disposed = true;
      return saved;
    });
    return this.disposal;
  }
};
function hostPreferences() {
  return {
    async read() {
      const response = await fetch("/.stellar-effort/config", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw Error("read failed");
      return response.json();
    },
    async write(document2, expectedRevision) {
      const response = await fetch("/.stellar-effort/config", { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json", "x-stellar-intent": "visual-config" }, body: JSON.stringify({ document: document2, expectedRevision }) });
      if (!response.ok) throw Object.assign(Error("save failed"), { code: response.status === 409 ? "CONFLICT" : "SAVE_FAILED" });
      return response.json();
    }
  };
}

// src/diagnostics.mjs
var Diagnostics = class {
  constructor() {
    this.events = [];
    this.renderers = /* @__PURE__ */ new Map();
  }
  record(type, data = {}) {
    const allowed = ["renderer", "quality", "fps", "reason", "width", "height", "dpr"];
    const value = Object.fromEntries(Object.entries(data).filter(([k, v]) => allowed.includes(k) && ["string", "number", "boolean"].includes(typeof v)));
    this.events.push({ time: (/* @__PURE__ */ new Date()).toISOString(), type, ...value });
    const cutoff = Date.now() - 7 * 864e5;
    this.events = this.events.filter((e) => Date.parse(e.time) >= cutoff).slice(-120);
  }
  update(id, value) {
    this.renderers.set(id, value);
  }
  remove(id) {
    this.renderers.delete(id);
  }
  clear() {
    this.events = [];
  }
  report() {
    return { plugin: "dsh-stellar-effort", version: "1.1.6", time: (/* @__PURE__ */ new Date()).toISOString(), renderers: [...this.renderers.values()], events: [...this.events], privacy: "\u4EC5\u672C\u5730\u5185\u5B58\u6458\u8981\uFF0C\u65E0\u804A\u5929\u3001\u51ED\u636E\u3001\u4F1A\u8BDD\u6807\u8BC6\u6216\u9065\u6D4B\u4E0A\u4F20" };
  }
};

// src/client.jsx
var inject = ["slots", "modelDirectories", "sessions", "remote", "remote.session"];
function apply(ctx) {
  const style = installStyle();
  const runtime = { preferences: new VisualPreferences(hostPreferences()), diagnostics: new Diagnostics() };
  void runtime.preferences.load();
  ctx.effect(() => () => {
    style.remove();
    return runtime.preferences.dispose();
  }, "stellar-effort: visual lifecycle");
  ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
    name: "conversation.input.right",
    id: "dsh-stellar-effort",
    order: 45,
    inject: (sessionId) => ({ directory: ctx.modelDirectories.directoryFor(sessionId), available: ctx.sessions.subagentAddress(sessionId) === void 0 })
  }, (props) => /* @__PURE__ */ import_react2.default.createElement(EffortChip, { key: props.directory.sessionId, directory: props.directory, available: props.available, runtime })));
  ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
    name: "conversation.input.dock",
    id: "dsh-stellar-effort",
    order: 30,
    inject: (sessionId) => ({ directory: ctx.modelDirectories.directoryFor(sessionId), available: ctx.sessions.subagentAddress(sessionId) === void 0 })
  }, (props) => /* @__PURE__ */ import_react2.default.createElement(EffortDock, { key: props.directory.sessionId, directory: props.directory, available: props.available, runtime })));
  ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "stellar-effort", order: 65, label: "\u661F\u8F68\u63A8\u7406" }, (props) => /* @__PURE__ */ import_react2.default.createElement(SettingsEntry, { runtime, onClose: props.close })));
}

return module.exports;}});
