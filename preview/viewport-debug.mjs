import { Universe, projectStar } from '../src/render/universe.mjs';
import { projectMeteor } from '../src/render/meteor.mjs';
import { nebulaLayers } from '../src/render/nebula.mjs';
import { SPACE, worldPoint, layoutAperture, insideAperture } from '../src/render/space.mjs';
import { WebGLRenderer } from '../src/render/webgl.mjs';
import { CanvasRenderer } from '../src/render/canvas.mjs';
import { DEFAULTS } from '../src/shared/config.mjs';
import { CSS } from '../src/styles.mjs';

// Debug-only page: the red/white/blue frames are drawn here and nowhere in the
// shipped UI. The universe is the real simulator and renderer.
const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
const $=id=>document.getElementById(id);
const world=new Universe({seed:20261103,config:{...DEFAULTS,gravity:0}});world.position=1;world.awake=1;
// Fixtures are ordinary world objects advanced by Universe.step. The star sits
// above the minimum viewport; the meteor starts inside it and flies out below.
const star=world.stars[12];Object.assign(star,{x:.55,y:-1.7,vx:0,vy:0,age:10,life:3600,size:1.3,z:.95,tone:.6,magnitude:1.2});
const view={viewWidth:SPACE.width,viewHeight:SPACE.height,viewFeather:8};
let tracked='meteor',meteorId=null,position=1,pressed=false,paused=false,scale=1,debug=true,fade=true,last=0;

const container=document.createElement('div');container.className='se-universe';
const viewport=document.createElement('div');viewport.className='se-world-viewport';container.appendChild(viewport);
const canvas=document.createElement('canvas');canvas.className='se-render-canvas';viewport.appendChild(canvas);
const overlay=document.createElement('div');overlay.className='debug';container.appendChild(overlay);
const frame=(cls,tag)=>{const f=document.createElement('div');f.className=`frame ${cls}`;const t=document.createElement('span');t.className='tag';t.textContent=tag;f.appendChild(t);overlay.appendChild(f);return f;};
const worldFrame=frame('world',`World ${SPACE.width}×${SPACE.height}`),viewFrame=frame('view','Viewport'),objectFrame=frame('object','');
$('body').appendChild(container);
let renderer;try{renderer=new WebGLRenderer(canvas);}catch{renderer=new CanvasRenderer(canvas);}

function launch(){const m=world.meteor();Object.assign(m,{x:.45,y:.9,vx:.05,vy:1.05,age:0,life:2.2,points:[]});world.meteors=[...world.meteors.filter(x=>x.id!==meteorId),m].slice(-2);meteorId=m.id;}
function target(){
  if(tracked==='star'){const p=projectStar(star,world);return {x:p.x,y:p.y,r:4,alpha:p.alpha,label:`恒星 #${star.id}`};}
  if(tracked==='cloud'){const n=nebulaLayers(world)[0];return n?{x:n.x,y:n.y,r:Math.min(40,n.radius*.6),alpha:n.alpha,label:`星云 #${n.id}`}:null;}
  const m=world.meteors.find(x=>x.id===meteorId);if(!m)return null;const p=projectMeteor(m,world);return {x:p.head.x,y:p.head.y,r:5,alpha:p.alpha,label:`流星 #${m.id}`};
}
const place=(el,x,y,w,h)=>Object.assign(el.style,{left:`${x}px`,top:`${y}px`,width:`${w}px`,height:`${h}px`});
function draw(){
  const dpr=Math.min(4,(devicePixelRatio||1)*scale),a=layoutAperture(viewport,canvas,view);if(!fade)canvas.style.maskImage='none';
  if(canvas.width!==Math.round(SPACE.width*dpr)){canvas.width=Math.round(SPACE.width*dpr);canvas.height=Math.round(SPACE.height*dpr);}
  renderer.draw(world,{width:SPACE.width,height:SPACE.height,dpr,dark:$('host').classList.contains('dark'),reduced:false});
  overlay.style.display=debug?'block':'none';Object.assign(overlay.style,{width:`${SPACE.width}px`,height:`${SPACE.height}px`,transform:'translate(-50%,-50%)'});
  place(worldFrame,0,0,SPACE.width,SPACE.height);place(viewFrame,a.x,a.y,a.width,a.height);viewFrame.querySelector('.tag').textContent=`Viewport ${a.width}×${a.height}`;
  const t=target(),inside=t&&insideAperture(t,a);objectFrame.style.display=t?'block':'none';
  if(t){place(objectFrame,t.x-t.r,t.y-t.r,t.r*2,t.r*2);objectFrame.classList.toggle('outside',!inside);objectFrame.querySelector('.tag').textContent=`${t.label}${inside?'':' · 取景框外'}`;}
  for(const [k,id] of [['viewWidth','width'],['viewHeight','height'],['viewFeather','feather']])$(`${id}-value`).textContent=`${view[k]}px`;$('position-value').textContent=position.toFixed(3);
  const knob=worldPoint(position,0);
  $('metrics').textContent=[`世界 ${SPACE.width}×${SPACE.height}（固定） · 取景框 ${a.width}×${a.height} 偏移 (${a.x}, ${a.y}) · 画布逻辑尺寸 ${canvas.style.width}×${canvas.style.height} · ${renderer.mode}`,
    t?`${t.label}：世界坐标 (${t.x.toFixed(2)}, ${t.y.toFixed(2)}) · ${inside?'在取景框内':'在取景框外（存在但不显示）'} · 渲染 alpha ${t.alpha.toFixed(3)}`:'跟踪对象：当前没有（流星已结束或星云未生成）',
    `旋钮中心 (${knob.x.toFixed(1)}, ${knob.y.toFixed(1)}) · 天体 ${world.stars.length} · 流星 ${world.meteors.length} · 星云 ${world.clouds.length} · t=${world.time.toFixed(2)} · 世界外缘渐隐 ${fade?'开':'关'} · 模型请求 0`].join('\n');
}
function tick(now){if(last&&!paused&&!document.hidden)world.step(Math.min((now-last)/1000,.05),{position,pressed});last=now;draw();requestAnimationFrame(tick);}
const setView=patch=>{Object.assign(view,patch);$('width').value=view.viewWidth;$('height').value=view.viewHeight;$('feather').value=view.viewFeather;draw();};
for(const [id,key] of [['width','viewWidth'],['height','viewHeight'],['feather','viewFeather']])$(id).oninput=e=>setView({[key]:Number(e.target.value)});
$('small').onclick=()=>setView({viewWidth:314,viewHeight:38});$('large').onclick=()=>setView({viewWidth:SPACE.width,viewHeight:SPACE.height});
$('position').oninput=e=>{position=Number(e.target.value);world.position=position;draw();};$('pressed').onchange=e=>{pressed=e.target.checked;};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'继续':'暂停';};
for(const kind of ['meteor','star','cloud'])$(`track-${kind}`).onclick=()=>{tracked=kind;for(const k of ['meteor','star','cloud'])$(`track-${k}`).setAttribute('aria-pressed',String(k===kind));draw();};
$('launch').onclick=()=>{launch();draw();};
$('debug').onclick=()=>{debug=!debug;$('debug').setAttribute('aria-pressed',String(debug));draw();};
$('fade').onclick=()=>{fade=!fade;$('fade').setAttribute('aria-pressed',String(fade));draw();};
$('theme').onclick=()=>{const h=$('host'),dark=h.classList.toggle('dark');h.classList.toggle('light',!dark);$('theme').textContent=`宿主：${dark?'深色':'浅色'}`;draw();};
$('scale').onclick=()=>{scale=scale===1?3:1;$('zoom').style.transform=`scale(${scale})`;$('scale').textContent=`倍率 ${scale}×`;draw();};
window.__viewportDebug={world,view,setView,launch,draw,track(kind){$(`track-${kind}`).click();},setPaused(v){paused=v;},setPosition(v){position=v;world.position=v;draw();},toggle(name){$(name).click();},target};
launch();draw();requestAnimationFrame(tick);
