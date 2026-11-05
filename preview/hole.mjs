import {Universe} from '../src/render/universe.mjs';
import {SPACE,layoutAperture,worldPoint} from '../src/render/space.mjs';
import {HOLE,holeState,staticHoleSvg} from '../src/render/hole.mjs';
import {WebGLRenderer} from '../src/render/webgl.mjs';
import {CanvasRenderer} from '../src/render/canvas.mjs';
import {DEFAULTS} from '../src/shared/config.mjs';
import {CSS} from '../src/styles.mjs';
const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
const world=new Universe({seed:12029,config:{...DEFAULTS,activity:0,gravity:0,style:'realistic'}});world.awake=1;
let paused=false,last=0,frame=0,canvasMode=false,position=1,speed=1,draws=0;
const views=['birth','mature','detail','crop'].map((id,index)=>{
 const card=document.getElementById(id),container=document.createElement('div');container.className='se-universe';
 const viewport=document.createElement('div');viewport.className='se-world-viewport';container.appendChild(viewport);
 if(id==='detail'){}else card.querySelector('.stage').appendChild(container);
 return {id,card,container,viewport,config:{viewWidth:SPACE.width,viewHeight:SPACE.height,viewFeather:0},position:index===0?.795:1};
});
function create(){for(const v of views){v.renderer?.dispose();v.canvas?.remove();v.canvas=document.createElement('canvas');v.canvas.className='se-render-canvas';if(v.id==='detail')v.card.querySelector('.inspection-inner').appendChild(v.canvas);else v.viewport.appendChild(v.canvas);try{v.renderer=canvasMode?new CanvasRenderer(v.canvas):new WebGLRenderer(v.canvas);}catch{v.canvas.remove();v.canvas=document.createElement('canvas');v.canvas.className='se-render-canvas';if(v.id==='detail')v.card.querySelector('.inspection-inner').appendChild(v.canvas);else v.viewport.appendChild(v.canvas);v.renderer=new CanvasRenderer(v.canvas);}}}
function draw(){const dpr=Math.min(devicePixelRatio||1,2.5);for(const v of views){v.position=v.id==='birth'?.795:position;const state={...world,position:v.position},renderDpr=v.id==='detail'?2:dpr;
  if(v.canvas.width!==Math.round(SPACE.width*renderDpr)||v.canvas.height!==Math.round(SPACE.height*renderDpr)){v.canvas.width=Math.round(SPACE.width*renderDpr);v.canvas.height=Math.round(SPACE.height*renderDpr);}
  if(v.id==='detail'){const center=worldPoint(v.position,0);Object.assign(v.canvas.style,{width:`${SPACE.width}px`,height:`${SPACE.height}px`,left:`${-(center.x-HOLE.halfWidth)}px`,top:`${-(center.y-HOLE.halfHeight)}px`});}else layoutAperture(v.viewport,v.canvas,v.config);
  v.renderer.draw(state,{dpr:renderDpr,dark:true,reduced:false});const h=holeState(v.position);v.card.querySelector('.meta').textContent=`位置 ${v.position.toFixed(3)} · 阴影 ${h.radius*2}px · 完整度 ${h.maturity.toFixed(3)}\n倾角比例 ${HOLE.inclination} · 自旋 t=${world.spinTime.toFixed(2)} · ${v.renderer.mode}${v.id==='detail'?' · 仅视觉放大 4×':''}`;
 }
 const img=document.querySelector('#static-view img')??document.createElement('img');img.alt='静态黑洞降级样本';img.src=`data:image/svg+xml,${encodeURIComponent(staticHoleSvg(position))}`;if(!img.parentNode)document.getElementById('static-view').appendChild(img);
 document.getElementById('status').textContent=`${paused?'同帧暂停':'实时物质流动'} · 模型请求=0\n世界 ${SPACE.width}×${SPACE.height} · 轨道 ${SPACE.railWidth}×${SPACE.railHeight}`;draws++;
}
function setCrop(width,height){views[3].config.viewWidth=width;views[3].config.viewHeight=height;draw();}
function tick(now){if(!paused&&!document.hidden){if(last)world.step(Math.min((now-last)/1000,.05),{position:1});draw();}last=now;frame=requestAnimationFrame(tick);}
document.getElementById('pause').onclick=()=>{paused=!paused;document.getElementById('pause').textContent=paused?'继续物质流动':'暂停同帧检查';draw();};
document.getElementById('speed').oninput=e=>{speed=Number(e.target.value);world.setConfig({...world.target,spin:speed});};
document.getElementById('position').oninput=e=>{position=Number(e.target.value);draw();};
document.getElementById('reset').onclick=()=>{position=1;document.getElementById('position').value='1';setCrop(SPACE.width,SPACE.height);};
document.getElementById('shrink').onclick=()=>setCrop(314,48);document.getElementById('expand').onclick=()=>setCrop(SPACE.width,SPACE.height);
document.getElementById('feather').oninput=e=>{views[3].config.viewFeather=Number(e.target.value);draw();};
document.getElementById('canvas').onclick=()=>{canvasMode=!canvasMode;create();draw();};
document.addEventListener('visibilitychange',()=>{last=0;});
window.__holeQA={world,views,draw,setCrop,setPaused(value){paused=value;draw();},setPosition(value){position=value;draw();},setSpin(value){world.spinTime=value;draw();},get draws(){return draws;},snapshot(){return JSON.stringify(world.stars);}};
create();draw();frame=requestAnimationFrame(tick);window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);for(const v of views)v.renderer.dispose();},{once:true});
