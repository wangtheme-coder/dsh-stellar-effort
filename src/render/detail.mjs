// Ephemeral rendering policy. Never a persisted config/preset or simulation input.
import {SPACE} from './space.mjs';
const levels=[
 Object.freeze({level:0,halo:1,cloudOctaves:3,photos:true,tileWidth:64,tileHeight:32}),
 Object.freeze({level:1,halo:.6,cloudOctaves:2,photos:true,tileWidth:48,tileHeight:24}),
 Object.freeze({level:2,halo:.25,cloudOctaves:1,photos:false,tileWidth:32,tileHeight:16})
];
export const FULL_DETAIL=levels[0];
export const detailForBudget=budget=>levels[!Number.isFinite(budget)||budget>=.8?0:budget>=.5?1:2];
export const WORLD_CLIP=Object.freeze({left:0,top:0,right:SPACE.width,bottom:SPACE.height});
// Three radii cover the GL Gaussian tail well below its alpha discard threshold;
// Canvas support is two radii. Additional margin protects peripheral soft edges.
export function cloudIntersectsClip(n,clip){if(!clip||![clip.left,clip.top,clip.right,clip.bottom].every(Number.isFinite)||clip.right<clip.left||clip.bottom<clip.top)return true;const rx=n.radius*3+2,ry=n.radius*n.aspect*3+2;return n.x+rx>=clip.left&&n.x-rx<=clip.right&&n.y+ry>=clip.top&&n.y-ry<=clip.bottom;}

