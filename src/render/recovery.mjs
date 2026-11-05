import {clamp,smooth} from '../shared/mapping.mjs';import {visualState} from './evolution.mjs';import {LIMITS} from './limits.mjs';
import {SPACE,worldPoint} from './space.mjs';
// Read-only material composition, not a gesture/event state machine.
export function recoveryAmount(world,reduced=false){if(reduced||world.config.reducedMotion||world.config.quality==='static')return 0;const v=visualState(world),p=world.position,target=smooth(LIMITS.boom,1,p)*v.spaceReveal,lag=clamp(((world.flight?.gain??0)-target)*1.6);return clamp(lag+clamp(world.pull??0)*.75)*smooth(.02,.22,v.spaceReveal)*(1-smooth(.9,1,p))*(1-clamp(v.boomEnvelope));}
export function recoveryRibbon(x,world,amount){const cx=worldPoint(world.position,0).x,near=Math.exp(-Math.pow((x-cx)/72,2));return {y:SPACE.centerY+(2.8-amount*1.8)*Math.sin((x-cx)*.045-world.time*.55),alpha:amount*(.035+.12*near),width:.65};}

