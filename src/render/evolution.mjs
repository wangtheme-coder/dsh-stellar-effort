import {clamp,smooth} from '../shared/mapping.mjs';
import {holeState} from './hole.mjs';
import {worldPoint,SPACE} from './space.mjs';
import {revealMask} from './reveal.mjs';
import {OVERDRIVE} from './overdrive.mjs';
import {IMPLODE} from './implode.mjs';
const NEWBORN_DISK=.55,HELD=.55;
import {LIMITS} from './limits.mjs';export {LIMITS};
// Where the knob (and the hole) can be (world px): Off to Max plus overdrive.
// The viewport mask keeps this whole range open and never changes.
export const KNOB_RANGE=Object.freeze({from:worldPoint(0,0).x,to:worldPoint(1,0).x+OVERDRIVE.px,y:SPACE.centerY});
// Energy stored in the knob before the hole forms (0-1): it builds from Low to
// High and peaks at the critical point (lightning arcs on the knob, webgl.mjs).
export const chargeAt=p=>.8*smooth(.42,LIMITS.high,p)+.2*smooth(LIMITS.high,LIMITS.collapse,p);
const blend=(a,b,t)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+((b[k]??a[k])-a[k])*t]));
// Short plunge after clicking the Max hole (seconds per stage).
export const PLUNGE=Object.freeze({entry:.15,decel:.4});
export class Evolution {
 constructor(position=0){this.position=position;this.phase=position<LIMITS.collapse?'energy':position<LIMITS.boom?'newborn':'settled';this.elapsed=0;this.consumed=position>=LIMITS.boom;this.lowTime=0;this.intentId=0;this.active=false;this.crossedB=false;this.fast=false;this.count=0;this.origin=worldPoint(position,0);this.entry=null;}
 // coreFlare: the white core tightens and glares; corePit: radius of the dark
 // centre as a fraction of the hole; diskForm: how far the accretion disk has
 // built; contract: how far the bound energy has been pulled into the core and
 // used up (0 free, 1 swallowed); the collapse leaves a dim field (HELD) that
 // the tear then parts; expansion: stars drawn in at the BOOM origin (0) or at
 // their true depth (1); entryWarp: the short surge into space after the tear.
 stable(){const born=this.position>=LIMITS.collapse,expanded=this.position>=LIMITS.boom&&this.consumed;return {entryWarp:0,entryDust:0,charge:born?0:chargeAt(this.position),swallow:0,holeVisibility:born?1:0,holeMaturity:expanded?smooth(LIMITS.boom,1,this.position):.03,spaceReveal:born?(expanded?.35+.65*smooth(LIMITS.boom,1,this.position):.04):0,unfold:expanded?1:0,collapseAmount:0,boomEnvelope:0,boomProgress:0,coreFlare:born?0:.3*smooth(.6,LIMITS.collapse,this.position),corePit:born?1:0,diskForm:born?(expanded?1:NEWBORN_DISK):0,contract:born?(expanded?1:HELD):0,expansion:1};}
 visual(){const base=this.stable(),t=this.elapsed/this.duration();if(this.phase==='implode'){const e=this.entry,u=clamp(t),s=smooth(0,.8,u),end=smooth(.8,1,u);
  // The opened space shrinks into the knob while the sky is drawn in and winds
  // around it; the disk is swallowed too; at the end the hole flashes back into
  // the knob (or stays a bare newborn hole when it ends between the limits).
  return {...blend(e,base,end),swallow:s,followKnob:true,unfold:(e.unfold??1)*(1-s),spaceReveal:e.spaceReveal*(1-end)+base.spaceReveal*end,holeVisibility:1+(base.holeVisibility-1)*smooth(.82,.95,u),corePit:1+(base.corePit-1)*smooth(.8,.93,u),diskForm:(e.diskForm+(.2-e.diskForm)*smooth(.3,.8,u))*(1-end)+base.diskForm*end,holeMaturity:(e.holeMaturity+(.03-e.holeMaturity)*smooth(.3,.8,u))*(1-end)+base.holeMaturity*end,coreFlare:base.coreFlare+.9*Math.exp(-Math.pow((u-.88)/.05,2))*(1-base.holeVisibility),collapseAmount:0,boomEnvelope:0,entryWarp:0,entryDust:0,expansion:1,charge:base.charge*smooth(.9,1,u)};}if(this.phase==='returning')return {...blend(this.entry,base,smooth(0,1,t)),entryDust:0,boomProgress:Math.min(1,(this.entry.boomProgress??0)+clamp(t)*.3)};if(this.phase==='collapse'){const c=clamp(t);
  // Compress (0–.45): the bound energy field contracts toward the core, which
  // shrinks and glares. Then a dark pit opens and swallows the core.
  return {...base,charge:1-smooth(.35,.5,c),holeVisibility:smooth(.43,.47,c),holeMaturity:.03,spaceReveal:.04*smooth(.5,1,c),collapseAmount:smooth(0,.5,c)*(1-.6*smooth(.7,1,c)),coreFlare:(.3+.7*smooth(0,.45,c))*(1-smooth(.5,.95,c)),corePit:smooth(.45,.95,c),diskForm:.15*smooth(.75,1,c),contract:HELD*smooth(0,.8,c),boomEnvelope:0,unfold:0,expansion:0};}
  if(this.phase==='newborn')return {...base,holeVisibility:1,holeMaturity:.03,spaceReveal:.04,coreFlare:0,corePit:1,contract:HELD,diskForm:.15+(NEWBORN_DISK-.15)*smooth(0,1,t),unfold:0,expansion:0};if(this.phase==='boom'){const p=clamp(t),wave=p<.3?smooth(0,.3,p):1-smooth(.3,1,p);return {...base,holeVisibility:1,holeMaturity:.03+(base.holeMaturity-.03)*smooth(0,1,p),spaceReveal:.04+(base.spaceReveal-.04)*smooth(0,.45,p),unfold:p,boomEnvelope:wave,boomProgress:p,contract:HELD,coreFlare:.45*(1-smooth(0,.25,p)),diskForm:NEWBORN_DISK+(1-NEWBORN_DISK)*smooth(0,.6,p),expansion:smooth(0,.85,p),entryWarp:smooth(.55,1,p),entryDust:.3*smooth(.55,1,p)};}
  if(this.phase==='entry')return {...base,boomProgress:1,entryWarp:1,entryDust:.3+.45*clamp(t)};
  // Deceleration: the surge eases out (fast → cruise → quiet), never a cut.
  if(this.phase==='decel')return {...base,boomProgress:1,entryWarp:Math.pow(1-clamp(t),1.6),entryDust:.75+.25*smooth(0,1,t)};return base;}
 duration(){return ({collapse:this.fast?.12:.22,newborn:this.fast?.05:.12,boom:this.fast?.28:.45,entry:this.plunging?PLUNGE.entry:this.fast?.25:.4,decel:this.plunging?PLUNGE.decel:this.fast?.35:.6,settling:this.fast?.12:.18,returning:.5,implode:IMPLODE.seconds})[this.phase]??1;}
 begin(id){if(!Number.isSafeInteger(id)||id<=this.intentId)return false;this.intentId=id;this.active=true;return true;}
 input(position,id=this.intentId){if(!this.active||id!==this.intentId)return;const p=clamp(position),previous=this.position,before=this.visual();this.position=p;
  if(p<LIMITS.boom)this.crossedB=false;
  if(p<previous&&['boom','collapse'].includes(this.phase)){this.entry=before;this.phase='returning';this.elapsed=0;this.plunging=false;}
  if(previous>=LIMITS.boom&&p<LIMITS.boom&&['settled','settling','entry','decel'].includes(this.phase)){this.entry=before;this.phase=before.unfold>=.999?'implode':'returning';this.elapsed=0;this.plunging=false;}
  // Back up past the boom limit while swallowing: the space opens again.
  if(this.phase==='implode'&&p>=LIMITS.boom&&this.consumed){this.entry=before;this.phase='returning';this.elapsed=0;}
  if(p<LIMITS.collapse-.004&&!['energy','returning','implode'].includes(this.phase)){this.entry=before;this.phase='returning';this.elapsed=0;this.plunging=false;}
  if(previous<LIMITS.collapse&&p>=LIMITS.collapse&&['energy','returning','implode'].includes(this.phase)){this.fast=p-previous>.12;this.phase='collapse';this.elapsed=0;}
  if(previous<LIMITS.boom&&p>=LIMITS.boom&&!this.consumed)this.crossedB=true;
 }
 release(){this.active=false;}
 // Click on the quiet Max hole: a short plunge into space (entry → decel) that
 // joins the current Max state. Never the BOOM again, never while one runs, and
 // not with reduced motion. Returns whether it started.
 plunge(reduced=false){if(reduced||this.phase!=='settled'||this.position<.999)return false;this.plunging=true;this.phase='entry';this.elapsed=0;return true;}
 cancel(position){this.plunging=false;this.entry=this.visual();this.position=clamp(position);this.phase='returning';this.elapsed=0;this.active=false;this.crossedB=false;}
 suspend(position=this.position){this.position=clamp(position);this.crossedB=false;this.active=false;this.elapsed=0;if(this.position>=LIMITS.boom)this.consumed=true;this.phase=this.position<LIMITS.collapse?'energy':this.position<LIMITS.boom?'newborn':'settled';}
 sync(position){if(this.phase==='implode'&&position<LIMITS.boom){this.position=clamp(position);return;}const before=this.visual();if(position<LIMITS.boom&&before.unfold>=.999&&['settled','settling','entry','decel'].includes(this.phase)){this.entry=before;this.position=clamp(position);this.phase='implode';this.elapsed=0;this.active=false;this.plunging=false;this.crossedB=false;return;}this.cancel(position);if(position>=LIMITS.boom)this.consumed=true;}
 step(delta,{speed=1,reduced=false,staticMode=false}={}){
  if(!Number.isFinite(delta)||staticMode||!Number.isFinite(speed)||speed<=0){this.suspend();return;}
  if(delta>.25){if(['collapse','newborn'].includes(this.phase)){this.crossedB=false;this.active=false;if(this.position>=LIMITS.boom)this.consumed=true;}else this.suspend();return;}
  const dt=Math.max(0,Math.min(delta,.05));
  this.lowTime=this.active&&this.position<LIMITS.rearm?this.lowTime+dt:0;if(this.lowTime>=.18){this.consumed=false;this.crossedB=false;}
  // Staying below the threshold long enough to fold the space back to purple
  // makes the next crossing a new birth; quicker jitter keeps the old universe.
  this.belowTime=this.position<LIMITS.boom&&this.phase!=='boom'?(this.belowTime??0)+dt:0;if(this.belowTime>=.6&&this.consumed){this.consumed=false;this.crossedB=false;}
  const min={collapse:.06,newborn:.04,boom:.12,entry:.1,decel:.15,settling:.08,returning:.08,implode:.4}[this.phase]??.01;
  const duration=this.duration(),rate=Math.min(Math.max(0,speed),duration/min);this.elapsed+=dt*rate;
  if(this.phase==='collapse'&&this.elapsed>=duration){this.phase='newborn';this.elapsed=0;return;}
  if(this.phase==='newborn'&&this.elapsed>=duration&&this.crossedB&&this.position>=LIMITS.boom&&!this.consumed){this.consumed=true;this.crossedB=false;this.origin=worldPoint(this.position,0);this.count++;this.phase=reduced?'settling':'boom';this.elapsed=0;return;}
  if(this.phase==='newborn'&&this.elapsed>=duration&&this.consumed&&this.position>=LIMITS.boom){this.phase='settling';this.elapsed=0;return;}
  if(this.phase==='boom'&&this.elapsed>=duration){this.phase=reduced?'settling':'entry';this.elapsed=0;return;}
  if(this.phase==='entry'&&this.elapsed>=duration){this.phase='decel';this.elapsed=0;return;}
  if(['settling','returning','decel','implode'].includes(this.phase)&&this.elapsed>=duration){this.plunging=false;this.phase=this.position<LIMITS.collapse?'energy':this.position<LIMITS.boom?'newborn':'settled';this.elapsed=0;}
 }
}
export function visualState(world){return world.evolution?.visual()??{charge:world.position>=LIMITS.collapse?0:chargeAt(world.position),swallow:0,holeVisibility:holeState(world.position).visibility,holeMaturity:holeState(world.position).maturity,spaceReveal:smooth(2/3,.96,world.position),unfold:1,collapseAmount:0,boomEnvelope:0,boomProgress:0,coreFlare:0,corePit:1,diskForm:1,contract:world.position>=LIMITS.collapse?1:0,expansion:1,entryWarp:0,entryDust:0};}
// Cosmos visibility at an image point: the BOOM bursts out of the hole (reveal.mjs).
export const UNFOLD_SPAN=Math.ceil(Math.hypot(SPACE.railX+SPACE.thumbInset+SPACE.travel,SPACE.height/2))+20;
export function unfoldMask(x,y,holeX,unfold=1){return revealMask(x,y,holeX,unfold);}
