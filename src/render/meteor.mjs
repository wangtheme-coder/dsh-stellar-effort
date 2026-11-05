import {softenMotion,opticalProfile,opticalColor} from './optics.mjs';
import {smooth} from '../shared/mapping.mjs';import {worldPoint} from './space.mjs';import {visualState,unfoldMask} from './evolution.mjs';
// pull: px³/s² of a softened inverse-square field (soft px). A path passing 20 px
// from the hole bends ~34°, 45 px ~20°, 90 px ~10°, 130 px ~7° (at ~220 px/s).
export const METEOR=Object.freeze({limit:4,cooldown:1.5,rate:.35,tail:60,pull:4e5,soft:10,speed:[190,250],miss:[16,130]});
export function projectMeteor(m,world,reduced=false){const head=worldPoint(m.x,m.y),life=smooth(0,.08,m.age)*(1-smooth(Math.max(.08,m.life-.22),m.life,m.age));const visual=visualState(world),alpha=unfoldMask(head.x,head.y,worldPoint(world.position,0).x,visual.unfold)*life*visual.spaceReveal*world.config.brightness*world.elements.meteors*(m.near?.95:.8);const points=[head];let length=0;
 if(!reduced)for(const pair of m.points){const p=worldPoint(...pair),a=points.at(-1),d=Math.hypot(p.x-a.x,p.y-a.y);if(d<.001)continue;const remain=METEOR.tail-length;if(d>remain){points.push({x:a.x+(p.x-a.x)*remain/d,y:a.y+(p.y-a.y)*remain/d});length=METEOR.tail;break;}points.push(p);length+=d;if(length>=METEOR.tail)break;}
 const look=opticalProfile(world);return {head,points,length,alpha:alpha*look.stars,tone:opticalColor(m.tone>.8?[1,.94,.85]:[.94,.96,1],{...look,gain:1}),softening:softenMotion(m.vx*282,m.vy*18,world,reduced),radius:m.near?1:.85};
}

