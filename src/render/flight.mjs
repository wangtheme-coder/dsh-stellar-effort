import {clamp,smooth} from '../shared/mapping.mjs';import {LIMITS} from './limits.mjs';import {SPACE,worldPoint} from './space.mjs';import {parallax,SAIL} from './overdrive.mjs';
export const VANISH=Object.freeze({x:SPACE.railX+SPACE.railWidth*.28,y:SPACE.centerY});
export function depthLayer(star){const z=clamp(star.z),layer=z<.45?0:z<.75?1:2;const bounds=[[5,10],[2.8,5],[1,2.8]][layer];const f=layer===0?(z-.18)/.27:layer===1?(z-.45)/.3:(z-.75)/.25;return {layer,min:bounds[0],max:bounds[1],initial:bounds[0]+clamp(f)*(bounds[1]-bounds[0])};}
export class Flight {
 constructor(){this.distance=0;this.gain=0;this.warp=0;this.driveWarp=0;this.velocity=.012;this.drift=0;this.sail=0;}
 // Warp comes only from Max overdrive (drive 0–1 while held past Max); holding
 // plain Max stays quiet. Release decays slowly: fast → cruising → quiet Max.
 // boost is the short surge into space after the tear (follows the evolution).
 step(delta,{position,pressed=false,reveal=0,reduced=false,speed=1,drive=0,boost=0}={}){const dt=Number.isFinite(delta)?clamp(delta,0,.05):0;const s=Number.isFinite(speed)?clamp(speed,0,10):0,target=reduced?0:smooth(LIMITS.boom,1,position??0)*clamp(reveal);if(s===0)return;
  this.gain+=(target-this.gain)*(1-Math.exp(-dt*7));const warpTarget=!reduced&&pressed&&target>.15?clamp(drive):0;this.driveWarp+=(warpTarget-this.driveWarp)*(1-Math.exp(-dt*(warpTarget>this.driveWarp?2.5:1.1)));const surge=reduced?0:clamp(boost);this.warp=Math.max(this.driveWarp,surge);
  this.velocity=(.012+.10*this.gain*(pressed?1:.1)+.70*this.warp*this.gain)*(reduced?.12:1);this.distance+=dt*s*this.velocity;
  // Lateral sailing: the hole travels right, so space streams left past it.
  this.sail=reduced?0:(SAIL.quiet+(SAIL.full-SAIL.quiet)*this.driveWarp)*this.gain+SAIL.entry*surge;this.drift+=dt*Math.min(s,2.5)*this.sail;
 }
}
const mod=(x,n)=>((x%n)+n)%n;
export function perspective(star,flight,reduced=false){const info=depthLayer(star),world=worldPoint(star.x,star.y),span=info.max-info.min,distance=flight?.distance??0;
 // Depth-dependent lateral parallax, wrapped (and faded at the seam) across the
 // whole world: the rail is just a window onto it, so its stars stream through.
 const par=parallax(star.z),[x0,w]=[0,SPACE.width],bx=reduced?world.x:x0+mod(world.x-x0-(flight?.drift??0)*par,w),seam=reduced?1:smooth(0,40,bx-x0)*smooth(0,40,x0+w-bx),base={x:bx,y:world.y};
 const z=info.min+mod(info.initial-info.min-distance,span),gain=reduced?0:clamp(flight?.gain??0),scale=3.5/z;
 const factor=1+(scale-1)*gain,x=VANISH.x+(base.x-VANISH.x)*factor,y=VANISH.y+(base.y-VANISH.y)*factor;
 const t=(z-info.min)/span,fade=smooth(0,.10,t)*(1-smooth(.9,1,t));const alpha=fade*seam;
 const radial=(flight?.velocity??0)/z*gain,lateral=(flight?.sail??0)*par,mx=(x-VANISH.x)*radial-lateral,my=(y-VANISH.y)*radial,r=Math.hypot(mx,my)||1,eligible=info.layer>0&&star.id%4===0;
 const tail=eligible?Math.min(5,(flight?.warp??0)*(1+2/z)):0;
 return {x,y,layer:info.layer,viewDepth:z,scale:factor,alpha,sizeScale:Math.sqrt(Math.max(.3,factor)),trailX:mx/r,trailY:my/r,trailLength:tail};
}

