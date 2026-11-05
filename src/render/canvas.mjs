import {FULL_DETAIL} from './detail.mjs';
import {opticalProfile,pointSamples} from './optics.mjs';
import {recoveryAmount,recoveryRibbon} from './recovery.mjs';
import {projectMeteor} from './meteor.mjs';
import {nebulaLayers,nebulaBackdrop} from './nebula.mjs';
import {NebulaRaster} from './nebula-canvas.mjs';
import {visualState,KNOB_RANGE} from './evolution.mjs';
import { arcStrokes, knobJitter } from './arcs.mjs';
import { IMPLODE, swallowScale } from './implode.mjs';
import { KNOB } from './hole.mjs';
import { smooth } from '../shared/mapping.mjs';
import { projectStar } from './universe.mjs';
import { SPACE, VOID, REST, TRACK, worldPoint, holeTrim, knobShape } from './space.mjs';
import { HoleRaster } from './hole-canvas.mjs';
export class CanvasRenderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('canvas-unavailable');this.mode='Canvas 2D';this.hole=new HoleRaster();this.nebula=new NebulaRaster();this.trim=document.createElement('canvas');this.trimKey='';}
  draw(world,{dpr,dark,reduced,detail=FULL_DETAIL,clip,aperture,maskAperture,fold=0}){
    const {width:w,height:h,railX,railWidth}=SPACE;
    const c=this.ctx,p=world.position,cx=worldPoint(p,0).x,cy=SPACE.centerY,depth=visualState(world).spaceReveal,purple=smooth(1/3,2/3,p),cfg=world.config;
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.save();c.beginPath();c.roundRect(railX,cy-TRACK.radius,railWidth,TRACK.radius*2,TRACK.radius);const born=visualState(world).holeVisibility>.5;c.fillStyle=born?VOID.css:dark?REST.darkCss:REST.lightCss;c.fill();c.strokeStyle=born||dark?'rgba(13,14,19,.9)':'rgba(150,155,170,.55)';c.lineWidth=1.5;c.stroke();c.clip();c.beginPath();c.rect(0,0,cx,h);c.clip();
    const g=c.createLinearGradient(0,cy-TRACK.radius,0,cy+TRACK.radius);g.addColorStop(0,purple>.5?'#0a0514':'#81c9f1');g.addColorStop(.5,purple>.5?'#170a26':'#a1def6');g.addColorStop(1,purple>.5?'#06030c':'#5b9fc9');c.fillStyle=g;c.fillRect(0,cy-TRACK.radius,cx,TRACK.radius*2);
    // Bound energy: light concentrates at the knob and is pulled in on collapse.
    const contract=visualState(world).contract??0;if(purple>0){const r=55/(1+3*contract),glow=c.createRadialGradient(cx,cy,0,cx,cy,r*2.2);glow.addColorStop(0,`rgba(140,70,220,${.75*purple*(1-.9*contract)})`);glow.addColorStop(1,'rgba(140,70,220,0)');c.fillStyle=glow;c.fillRect(0,cy-19,cx,38);}
    if(purple>0){c.globalAlpha=purple*(1-.9*(visualState(world).contract??0));for(let i=0;i<4;i++){c.beginPath();for(let x=0;x<=cx;x+=4){const y=cy+Math.sin(x*.03-world.time*.7+i)*4+(i-1.5)*2;if(x===0)c.moveTo(x,y);else c.lineTo(x,y);}c.strokeStyle=i%2?'#cbb3ff88':'#aaa4ff66';c.lineWidth=i? .6:1.2;c.stroke();}c.globalAlpha=1;}
    c.save();c.beginPath();c.arc(cx,cy,Math.max(0,(visualState(world).unfold??1)*380),0,Math.PI*2);c.clip();c.fillStyle=`rgba(1,3,10,${nebulaBackdrop(world)})`;c.fillRect(0,cy-19,cx,38);c.restore();
    const returning=recoveryAmount(world,reduced);if(returning>.001){c.lineWidth=.65;for(let x=railX;x<cx;x+=2){const a=recoveryRibbon(x,world,returning),b=recoveryRibbon(Math.min(cx,x+2),world,returning);c.strokeStyle=`rgba(140,100,204,${a.alpha*cfg.brightness})`;c.beginPath();c.moveTo(x,a.y);c.lineTo(Math.min(cx,x+2),b.y);c.stroke();}}
    const clouds=nebulaLayers(world,reduced,detail),look=opticalProfile(world);
    const visual=visualState(world),pull=reduced?0:visual.swallow??0;
    c.restore();c.save();c.beginPath();if(pull>0)c.arc(cx,cy,Math.hypot(w,h)*(1-pull)**1.5,0,Math.PI*2);else c.rect(0,0,cx,h);c.clip();
    // Max → High: the sky is pulled in and turned around the knob (stars do it in projectStar).
    if(pull>0){const k=swallowScale(pull);c.save();c.translate(cx,cy);c.rotate(-IMPLODE.twist*pull*.5);c.scale(k,k);c.translate(-cx,-cy);}
    this.nebula.draw(c,clouds,cfg.brightness,detail,clip);if(pull>0)c.restore();
    c.globalCompositeOperation='lighter';for(const star of world.stars){const s=projectStar(star,world,reduced,clouds,look);if(s.alpha<.001)continue;for(const optical of pointSamples(s.x,s.y,s.softening)){c.globalAlpha=s.alpha*optical.weight;c.fillStyle=`rgb(${s.tone.map(v=>Math.round(v*255)).join(',')})`;c.beginPath();c.arc(optical.x,optical.y,Math.max(.3,s.size*.6),0,Math.PI*2);c.fill();if(s.size>.95){c.globalAlpha=s.alpha*.15*look.halo*optical.weight*detail.halo;c.beginPath();c.arc(optical.x,optical.y,s.size*2,0,Math.PI*2);c.fill();}}if(s.trailLength>.03&&!reduced){c.globalAlpha=s.alpha*.12;c.strokeStyle=c.fillStyle;c.lineWidth=.6;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x-s.trailX*s.trailLength,s.y-s.trailY*s.trailLength);c.stroke();}}

    for(const m of world.meteors){const v=projectMeteor(m,world,reduced);if(v.alpha<.001)continue;c.fillStyle=`rgb(${v.tone.map(x=>Math.round(x*255)).join(',')})`;for(const optical of pointSamples(v.head.x,v.head.y,v.softening)){c.globalAlpha=v.alpha*optical.weight;c.beginPath();c.arc(optical.x,optical.y,v.radius,0,Math.PI*2);c.fill();}c.lineWidth=.55;for(let j=1;j<v.points.length;j++){const a=v.points[j-1],b=v.points[j];c.globalAlpha=v.alpha*.22*(1-(j-.5)/(v.points.length-1));c.strokeStyle=c.fillStyle;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}}
    if(pull>0)this.inflow(c,cx,cy,pull,world.time);
    c.restore();const jolt=knobJitter(visual.charge??0,world.time,reduced?1:0),size=(world.knobScale??1)*jolt.scale;this.hole.draw(c,world,cx+jolt.x,cy+jolt.y,dpr,size);
    this.arcs(c,cx+jolt.x,cy+jolt.y,KNOB.radius*size,visual.charge??0,world.time,reduced?1:0,cfg.brightness);
    if(aperture)this.trimPass(c,world,visual,aperture,maskAperture??aperture,fold);
  }
  // Light of matter falling in while the hole swallows the sky: three winding arms.
  inflow(c,cx,cy,s,time){c.save();c.globalCompositeOperation='lighter';c.lineCap='round';for(let arm=0;arm<3;arm++)for(let r=24;r<170;r+=6){const a=t=>(Math.PI/2+.11*t-7*time+arm*Math.PI*2)/3,alpha=s*(1-s)*3.2*Math.exp(-r/55)*.5;if(alpha<.01)break;c.strokeStyle=`rgba(255,184,115,${Math.min(1,alpha)})`;c.lineWidth=5;c.beginPath();c.moveTo(cx+Math.cos(a(r))*r,cy+Math.sin(a(r))*r);c.lineTo(cx+Math.cos(a(r+6))*(r+6),cy+Math.sin(a(r+6))*(r+6));c.stroke();}c.restore();}
  // Lightning of the charged knob (arcs.mjs).
  arcs(c,x,y,R,charge,time,calm,brightness){if(charge<.02)return;const q=charge*charge;c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.lineJoin='round';
    const aura=c.createRadialGradient(0,0,Math.max(0,R-6),0,0,R+6);aura.addColorStop(0,'rgba(140,76,242,0)');aura.addColorStop(.5,`rgba(140,76,242,${.35*q*brightness})`);aura.addColorStop(1,'rgba(140,76,242,0)');c.fillStyle=aura;c.beginPath();c.arc(0,0,R+6,0,Math.PI*2);c.fill();
    for(const arc of arcStrokes(charge,time,calm,R)){c.beginPath();arc.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.shadowColor='rgba(140,158,255,.9)';c.shadowBlur=5;c.strokeStyle=`rgba(140,158,255,${arc.alpha*brightness})`;c.lineWidth=arc.width*2.4;c.stroke();c.shadowBlur=0;c.strokeStyle=`rgba(235,242,255,${arc.alpha*charge*brightness})`;c.lineWidth=arc.width;c.stroke();}c.restore();}
  // The CSS mask holds the open view and the knob's whole range; trim back to
  // the view (or the folded rail) plus the knob, as WebGL's trimPass does.
  // Computed at a quarter of the resolution and cached.
  trimPass(c,world,visual,view,maskView,fold){const step=4,cols=Math.ceil(SPACE.width/step),rows=Math.ceil(SPACE.height/step),at=worldPoint(world.position,0),shape=knobShape(visual.holeVisibility),knob={x:Math.round(at.x),y:at.y,rx:Math.round(shape.rx),ry:Math.round(shape.ry)},f=Math.round(fold*40)/40,key=JSON.stringify([view,maskView,knob,f]);
    if(key!==this.trimKey){this.trimKey=key;const t=this.trim,tc=t.getContext('2d');t.width=cols;t.height=rows;const image=tc.createImageData(cols,rows);for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=(j*cols+i)*4;image.data[k]=image.data[k+1]=image.data[k+2]=255;image.data[k+3]=Math.round(holeTrim({x:(i+.5)*step,y:(j+.5)*step},view,KNOB_RANGE,knob,maskView,f)*255);}tc.putImageData(image,0,0);}
    c.save();c.globalCompositeOperation='destination-in';c.imageSmoothingEnabled=true;c.drawImage(this.trim,0,0,cols*step,rows*step);c.restore();}
  dispose(){this.hole.dispose();this.nebula.dispose();this.trim.width=1;this.trim.height=1;this.trimKey='';}
}



