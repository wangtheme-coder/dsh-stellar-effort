import { smooth } from '../shared/mapping.mjs';
import { SPACE } from './space.mjs';
// How the BOOM opens space (Owner's choice: a burst). unfold 0–1 is its
// progress: space explodes out of the hole as a disc with a bright front ring
// and fills the whole world (1 = all open).
export const BURST = Object.freeze({ span: Math.ceil(Math.hypot(SPACE.width, SPACE.height / 2)) + 30 });
const easeOut = t => 1 - (1 - Math.max(0, Math.min(1, t))) ** 3;
export const burstRadius = unfold => BURST.span * easeOut(unfold / .85);
export function revealMask(x, y, holeX, unfold = 1) {
  if (unfold >= .999) return 1;
  const r = burstRadius(unfold), f = Math.min(50, 4 + r * .2); return 1 - smooth(r - f, r, Math.hypot(x - holeX, y - SPACE.centerY));
}
// GLSL counterparts (expects uUnfold, uSize, cx()).
export const REVEAL_GLSL = `
float burstRadius(){float t=clamp(uUnfold/.85,0.,1.);return ${BURST.span}.*(1.-pow(1.-t,3.));}
float unfoldMask(vec2 p){if(uUnfold>=.999)return 1.;float r=burstRadius(),f=min(50.,4.+r*.2);return 1.-smoothstep(r-f,r,length(p-vec2(cx(),uSize.y*.5)));}
// The burst's front ring glows briefly as it races outward.
float revealGlow(vec2 p){if(uUnfold<=.001||uUnfold>=.999)return 0.;return exp(-pow((length(p-vec2(cx(),uSize.y*.5))-burstRadius())/4.,2.))*(1.-smoothstep(.2,.85,uUnfold));}
`;
