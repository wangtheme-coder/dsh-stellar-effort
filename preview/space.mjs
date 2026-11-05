import {triggerPreviewMeteor} from './manual-meteor.mjs';
import { Universe, projectStar } from '../src/render/universe.mjs';
import { SPACE, worldPoint, layoutAperture, aperturePoint } from '../src/render/space.mjs';
import { WebGLRenderer } from '../src/render/webgl.mjs';
import { CanvasRenderer } from '../src/render/canvas.mjs';
import { DEFAULTS } from '../src/shared/config.mjs';
import { CSS } from '../src/styles.mjs';

const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
const world=new Universe({seed:11029,config:{...DEFAULTS,gravity:0,activity:0,lensStrength:0}});
world.position=1;world.awake=1;
// Explicit boundary fixture; still advanced by Universe.step, not a video or
// independent animation. Zero gravity makes its trajectory easy to measure.
const tracked=world.stars[20];Object.assign(tracked,{x:.4,y:1.28,vx:0,vy:0,age:10,life:3600,size:1.2,z:1,tone:.6});
let paused=false,hidden=false,pressed=false,position=1,last=0,frame=0,canvasMode=false;
const FULL={viewWidth:SPACE.width,viewHeight:SPACE.height,viewFeather:0},configs=[{...FULL},{viewWidth:SPACE.railWidth,viewHeight:48,viewFeather:0},{...FULL}];
const views=['full','crop','restore'].map(id=>{
  const card=document.getElementById(id),container=document.createElement('div');container.className='se-universe';
  const viewport=document.createElement('div');viewport.className='se-world-viewport edge';container.appendChild(viewport);
  card.querySelector('.stage').appendChild(container);return {card,container,viewport};
});
function createRenderers(){for(const v of views){v.renderer?.dispose();v.canvas?.remove();const canvas=document.createElement('canvas');canvas.className='se-render-canvas';v.viewport.appendChild(canvas);v.canvas=canvas;try{v.renderer=canvasMode?new CanvasRenderer(canvas):new WebGLRenderer(canvas);}catch{canvas.remove();v.canvas=document.createElement('canvas');v.canvas.className='se-render-canvas';v.viewport.appendChild(v.canvas);v.renderer=new CanvasRenderer(v.canvas);}}}
function dimensions(){return {width:SPACE.width,height:SPACE.height,dpr:Math.min(devicePixelRatio||1,2.5),dark:true,reduced:false};}
function draw(){
  const d=dimensions();for(let i=0;i<views.length;i++){
    const v=views[i],a=layoutAperture(v.viewport,v.canvas,configs[i]);
    if(v.canvas.width!==Math.round(SPACE.width*d.dpr)||v.canvas.height!==Math.round(SPACE.height*d.dpr)){v.canvas.width=Math.round(SPACE.width*d.dpr);v.canvas.height=Math.round(SPACE.height*d.dpr);}
    v.renderer.draw(world,d);const star=projectStar(tracked,world),knob=worldPoint(position,0),local=aperturePoint(star,a);
    v.card.querySelector('.metrics').textContent=`世界 ${SPACE.width}×${SPACE.height} · 窗口 ${a.width}×${a.height}\n恒星 #${tracked.id} 世界 (${star.x.toFixed(2)}, ${star.y.toFixed(2)})\n窗口内 (${local.x.toFixed(2)}, ${local.y.toFixed(2)}) · 星体尺寸 ${star.size.toFixed(2)}\n旋钮中心 (${knob.x.toFixed(2)}, ${knob.y.toFixed(2)}) · ${v.renderer.mode}`;
  }
  document.getElementById('width-value').textContent=`${configs[1].viewWidth}px`;document.getElementById('height-value').textContent=`${configs[1].viewHeight}px`;
  document.getElementById('status').textContent=`${paused?'同帧暂停':'实时演化'} · ${hidden?'隐藏休眠':'可见'} · tick=${world.ticks} · t=${world.time.toFixed(3)} · 天体=${world.stars.length} · 模型请求=0`;
}
function setView(patch){Object.assign(configs[1],patch);for(const [key,id]of[['viewWidth','width'],['viewHeight','height'],['viewFeather','feather']])document.getElementById(id).value=configs[1][key];draw();}
function meteor(){const id=triggerPreviewMeteor(world,{boundaryFixture:true});draw();return id;}
function hide(value){hidden=value;for(const v of views)v.container.style.visibility=hidden?'hidden':'visible';draw();}
function tick(now){if(last&&!paused&&!hidden&&!document.hidden)world.step(Math.min((now-last)/1000,.05),{position,pressed});last=now;if(!hidden&&!document.hidden)draw();frame=requestAnimationFrame(tick);}
for(const [id,key]of[['width','viewWidth'],['height','viewHeight'],['feather','viewFeather']])document.getElementById(id).oninput=e=>setView({[key]:Number(e.target.value)});
document.getElementById('position').oninput=e=>{position=Number(e.target.value);if(paused)world.step(0,{position,pressed});draw();};
document.getElementById('pressed').onchange=e=>{pressed=e.target.checked;};
document.getElementById('freeze').onclick=()=>{paused=!paused;document.getElementById('freeze').textContent=paused?'继续演化':'暂停同帧比较';draw();};
document.getElementById('shrink').onclick=()=>setView({viewWidth:SPACE.railWidth,viewHeight:48});document.getElementById('expand').onclick=()=>setView({viewWidth:SPACE.width,viewHeight:SPACE.height});
document.getElementById('meteor').onclick=meteor;document.getElementById('hide').onclick=()=>hide(!hidden);
document.getElementById('backend').onclick=()=>{canvasMode=!canvasMode;createRenderers();draw();};
document.addEventListener('visibilitychange',()=>{last=0;});
window.__spaceQA={railIn(id){const v=views.find(v=>v.card.id===id),s=v.card.querySelector('.stage').getBoundingClientRect(),c=v.canvas.getBoundingClientRect(),r=SPACE.railHeight/2;return {x:Math.round(c.left-s.left+SPACE.railX+r),y:Math.round(c.top-s.top+SPACE.centerY-r),width:SPACE.railWidth-2*r,height:SPACE.railHeight};},windowIn(id,inset=2){const v=views.find(v=>v.card.id===id),s=v.card.querySelector('.stage').getBoundingClientRect(),c=v.canvas.getBoundingClientRect(),a=layoutAperture(v.viewport,v.canvas,configs[1]);return {x:Math.round(c.left-s.left+a.x+inset),y:Math.round(c.top-s.top+a.y+inset),width:a.width-2*inset,height:a.height-2*inset};},world,views,configs,setView,draw,hide,meteor,setPaused(value){paused=value;draw();},setPosition(value){position=value;world.step(0,{position,pressed});draw();},step(n=1){for(let i=0;i<n;i++)world.step(1/60,{position,pressed});draw();},snapshot(){return JSON.stringify({stars:world.stars,clouds:world.clouds,meteors:world.meteors,time:world.time,spin:world.spinTime,randomBirths:world.births});},project(){return projectStar(tracked,world);}};
createRenderers();meteor();draw();frame=requestAnimationFrame(tick);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);for(const v of views)v.renderer.dispose();},{once:true});

