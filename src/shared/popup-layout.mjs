import {clamp} from './mapping.mjs';
export function clampPopup(position,{width,height},{width:vw,height:vh}){const mx=Math.min(8,Math.max(0,(vw-width)/2)),my=Math.min(8,Math.max(0,(vh-height)/2));return {left:clamp(position.left,mx,Math.max(mx,vw-width-mx)),top:clamp(position.top,my,Math.max(my,vh-height-my))};}
