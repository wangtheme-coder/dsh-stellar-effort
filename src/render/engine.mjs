import {detailForBudget} from './detail.mjs';
import {Evolution} from './evolution.mjs';
import { Universe } from './universe.mjs';
import { WebGLRenderer } from './webgl.mjs';
import { CanvasRenderer } from './canvas.mjs';
import { SPACE, apertureFor, layoutAperture, screenInsets, worldPoint } from './space.mjs';
import { visualState, KNOB_RANGE } from './evolution.mjs';
import { LIMITS } from './limits.mjs';
import { staticHoleSvg } from './hole.mjs';
import { Snap, knobScale } from './snap.mjs';
const FOLD_SECONDS=.24;
// A collapsed resident rail behaves as if a panel covered the whole world: no
// night sky past the capsule, only the knob (and the hole) as in the popup.
const COMPACT_PANEL=[-1e5,-1e5,2e5,2e5];
let serial=0;const activeEngines=new Set(), drawingEngines=new Set();
// Inspection hook for the local preview page only (deterministic test scenes).
export const liveEngines=()=>[...activeEngines];
export class RenderEngine {
  constructor(container, { config, getInput, diagnostics, forceCanvas=false, onStatus=()=>{}, scene={}, escape=false }) {
    // escape: the scene is larger than the popup, so its viewport is fixed to
    // the screen at the rail's centre instead of being clipped by the popup.
    this.escape=escape;
    this.scene=scene;
    this.container=container;this.getInput=getInput;this.diagnostics=diagnostics;this.onStatus=onStatus;this.id=++serial;this.world=scene.world??new Universe({config});if(!scene.world)this.world.position=getInput().position;scene.world=this.world;this.world.setConfig(config);this.shownPosition=scene.shownPosition??getInput().position;this.active=true;this.last=0;this.frame=0;this.frames=0;this.total=0;this.fps=60;this.budget=1;this.slow=0;this.fast=0;this.ratio=1;this.lost=0;this.forceCanvas=forceCanvas;
    this.evolution=scene.evolution??new Evolution(getInput().position);scene.evolution=this.evolution;this.world.evolution=this.evolution;if(!this.evolution.active&&!scene.holdAccepted?.())this.evolution.suspend(getInput().position);activeEngines.add(this);
    this.viewport=document.createElement('div');this.viewport.className=escape?'se-world-viewport se-escape':'se-world-viewport';this.viewport.setAttribute('aria-hidden','true');container.appendChild(this.viewport);
    // In the popup the scene is opaque, so it takes the clicks over its window
    // (not the whole world): the popup dismisses on any of them off the slider.
    if(escape){this.catcher=document.createElement('div');this.catcher.className='se-scene-catcher';this.viewport.appendChild(this.catcher);}
    this.canvas=document.createElement('canvas');this.canvas.setAttribute('aria-hidden','true');this.canvas.className='se-render-canvas';this.viewport.appendChild(this.canvas);
    this.staticLayer=document.createElement('div');Object.assign(this.staticLayer.style,{position:'absolute',width:`${SPACE.width}px`,height:`${SPACE.height}px`,display:'none'});this.staticImage=document.createElement('img');this.staticImage.alt='';Object.assign(this.staticImage.style,{position:'absolute',width:'76px',height:'64px',top:'28px'});this.staticLayer.appendChild(this.staticImage);this.viewport.appendChild(this.staticLayer);this.originalThumb=container.querySelector('.se-static-thumb');if(this.originalThumb)this.originalThumb.style.visibility='hidden';
    this.lifecycle='running';this.generation=0;this.intersectionVisible=null;
    this.loss=e=>{e.preventDefault();if(!this.active||this.lifecycle!=='running'||!this.renderer)return;this.lost++;this.diagnostics?.record('renderer-fallback',{reason:'context-lost'});this.switchToCanvas();};
    this.renderer=null;
    this.resize=new ResizeObserver(()=>{if(!this.active)return;this.needsSize=true;this.checkVisibility();});this.resize.observe(container);this.needsSize=true;
    this.screenClip=()=>{this.updateScreenClip();this.checkVisibility();};window.addEventListener('resize',this.screenClip);window.addEventListener('scroll',this.screenClip,true);this.applyAperture();
    this.visibility=()=>this.checkVisibility();document.addEventListener('visibilitychange',this.visibility);
    if(typeof IntersectionObserver!=='undefined'){this.intersection=new IntersectionObserver(entries=>{if(!this.active)return;for(const entry of entries)if(entry.target===this.viewport){this.intersectionVisible=entry.isIntersecting&&entry.intersectionRect.width>0&&entry.intersectionRect.height>0;}this.checkVisibility();});this.intersection.observe(this.viewport);}
    // Only ancestor attributes, not the host subtree. RO cannot see visibility:hidden.
    if(typeof MutationObserver!=='undefined'){this.attributes=new MutationObserver(()=>this.checkVisibility());for(let n=container;n;n=n.parentElement)this.attributes.observe(n,{attributes:true,attributeFilter:['style','class','hidden']});}
    this.checkVisibility();if(this.lifecycle==='running')this.createRenderer();this.schedule();
  }
  replaceCanvas(){this.canvas.removeEventListener('webglcontextlost',this.loss);const fresh=this.canvas.cloneNode();this.canvas.replaceWith(fresh);this.canvas=fresh;this.canvas.addEventListener('webglcontextlost',this.loss);this.needsSize=true;}
  createRenderer(){try{if(this.forceCanvas)throw Error('canvas-requested');this.renderer=new WebGLRenderer(this.canvas);}catch{this.replaceCanvas();try{this.renderer=new CanvasRenderer(this.canvas);}catch{this.renderer=null;}}this.canvas.addEventListener('webglcontextlost',this.loss);this.rendererFailed=!this.renderer;this.updateDrawingMembership();this.onStatus(this.renderer?.mode??'静态渐变');this.diagnostics?.record('renderer-start',{renderer:this.renderer?.mode??'static'});}
  releaseRenderer(){this.canvas.removeEventListener('webglcontextlost',this.loss);const renderer=this.renderer;this.renderer=null;try{renderer?.dispose();}catch{}this.canvas.width=1;this.canvas.height=1;this.updateDrawingMembership();}
  switchToCanvas(){if(!this.active||this.lifecycle!=='running')return;this.evolution.suspend(this.getInput().position);this.forceCanvas=true;this.releaseRenderer();this.replaceCanvas();this.createRenderer();}
  updateDrawingMembership(){if(this.active&&this.lifecycle==='running'&&this.renderer&&this.world.target.quality!=='static')drawingEngines.add(this);else drawingEngines.delete(this);}
  isVisible(){if(document.hidden||this.intersectionVisible===false||!this.container.isConnected||!this.container.getClientRects().length)return false;const css=getComputedStyle(this.container);if(css.visibility==='hidden'||css.visibility==='collapse')return false;const r=this.viewport.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<document.documentElement.clientHeight&&r.left<document.documentElement.clientWidth;}
  checkVisibility(){if(!this.active)return;if(!this.isVisible()){this.sleep();return;}if(this.lifecycle==='sleeping'||this.lifecycle==='released'){clearTimeout(this.releaseTimer);this.releaseTimer=0;this.generation++;if(this.lifecycle==='released')this.rendererFailed=false;this.lifecycle='running';this.last=0;this.nextFrame=0;this.total=0;this.frames=0;this.slow=0;this.fast=0;this.needsSize=true;this.updateDrawingMembership();this.schedule();}}
  sleep(){if(!this.active||this.lifecycle!=='running')return;this.lifecycle='sleeping';const generation=++this.generation;cancelAnimationFrame(this.frame);clearTimeout(this.timer);this.frame=0;this.timer=0;this.last=0;this.nextFrame=0;this.scene.onInvisible?.();this.evolution.suspend(this.getInput().position);this.updateDrawingMembership();this.releaseTimer=setTimeout(()=>{if(!this.active||generation!==this.generation||this.lifecycle!=='sleeping')return;this.releaseTimer=0;this.lifecycle='releasing';this.releaseRenderer();this.lifecycle='released';this.diagnostics?.record('renderer-sleep-release',{});},2000);}
  schedule(){if(!this.active||this.lifecycle!=='running'||this.frame)return;this.frame=requestAnimationFrame(this.tick);}
  refreshInput(){if(!this.active)return;this.checkVisibility();if(this.lifecycle!=='running')return;if(!this.renderer||this.world.target.quality==='static'){this.world.position=this.getInput().position;this.evolution.suspend(this.world.position);this.drawStatic();this.canvas.style.visibility='hidden';this.staticLayer.style.display='block';}}
  setConfig(config){if(!this.active)return;this.world.setConfig(config);this.applyAperture();this.updateDrawingMembership();this.refreshInput();}
  // The host panel (the popup, or the settings preview's stand-in) in world
  // coordinates: outer space stays a thin halo over our own text.
  findPanel(){const host=this.container.closest('.se-popup')??this.container.closest('.se-scene-stage')?.querySelector('.se-scene-panel');if(!host){this.panel=null;return;}const r=this.container.getBoundingClientRect(),s=r.width/(this.container.offsetWidth||r.width||1),p=host.getBoundingClientRect(),ox=r.left+r.width/2-SPACE.width/2*s,oy=r.top+r.height/2-SPACE.height/2*s;this.panel=[(p.left-ox)/s,(p.top-oy)/s,p.width/s,p.height/s];}
  // The escaped layer is fixed to screen coordinates, but a host or another plugin
// may give an ancestor a transform/filter/contain, which then becomes the origin
// (and scale) of position:fixed. Measure where the layer really lands and correct.
place(){this.findPanel();if(!this.escape||!this.aperture)return;const r=this.container.getBoundingClientRect(),v=this.viewport,s=v.style,at=v.getBoundingClientRect(),k=at.width>0&&v.offsetWidth>0?at.width/v.offsetWidth:1,ox=at.left-(parseFloat(s.left)||0)*k,oy=at.top-(parseFloat(s.top)||0)*k,round=x=>`${Math.round(x*100)/100}px`,left=round((r.left+r.width/2-SPACE.width*k/2-ox)/k),top=round((r.top+r.height/2-SPACE.height*k/2-oy)/k);if(s.left!==left||s.top!==top)Object.assign(s,{left,top});}
  // The CSS mask is laid out for the open view (scene.openConfig) plus the knob's
  // whole range and is rewritten only when that changes, never on collapse or
  // while the knob moves: each rewrite stalls the page for 200-300 ms on a real
  // GPU. The actual window (collapsed or open) is cut by the renderer's trim.
  applyAperture(){const open=this.scene.openConfig??this.world.target,key=JSON.stringify(apertureFor(open));if(key!==this.maskKey){this.maskKey=key;this.maskAperture=layoutAperture(this.viewport,this.canvas,open,KNOB_RANGE);}this.aperture=apertureFor(this.world.target);if(this.catcher)Object.assign(this.catcher.style,{left:`${this.aperture.x}px`,top:`${this.aperture.y}px`,width:`${this.aperture.width}px`,height:`${this.aperture.height}px`});this.place();Object.assign(this.staticLayer.style,{left:this.canvas.style.left,top:this.canvas.style.top,maskImage:this.canvas.style.maskImage});this.updateScreenClip();}
  // Keeps the hole's part of the viewport mask on the knob; restyles only on change.
  // The popup panel is torn open with the space: its text fades as the tear
  // crosses it and returns when space folds back (CSS reads --se-torn).
  // The catcher stands in for the opened sky: its first click closes it. With no
  // sky unfolded (Off to High after a drag) it would be an invisible wall over DSH's
  // own buttons that eats a click with no feedback, so then clicks pass through.
  updateCatcher(){if(!this.catcher)return;const pe=(visualState(this.world).unfold??0)>.02?'auto':'none';if(this.catcher.style.pointerEvents!==pe)this.catcher.style.pointerEvents=pe;}
  updateTorn(){if(!this.viewport.classList.contains('se-escape'))return;const u=visualState(this.world).unfold??0,t=u<=.08?0:u>=.45?1:((u-.08)/.37)**2*(3-2*(u-.08)/.37),v=Math.round(t*50)/50;if(v===this.tornKey)return;this.tornKey=v;this.container.closest('.se-popup')?.style.setProperty('--se-torn',String(v));}
  updateScreenClip(){if(!this.active)return;const inset=screenInsets(this.viewport.getBoundingClientRect(),document.documentElement.clientWidth,document.documentElement.clientHeight),scale=[1,2,4].includes(this.scene.inspectionScale)?this.scene.inspectionScale:1,a=this.aperture;this.renderClip={left:Math.max(a.x,inset.left/scale),top:Math.max(a.y,inset.top/scale),right:Math.min(a.x+a.width,SPACE.width-inset.right/scale),bottom:Math.min(a.y+a.height,SPACE.height-inset.bottom/scale)};this.viewport.style.clipPath=`inset(${inset.top/scale}px ${inset.right/scale}px ${inset.bottom/scale}px ${inset.left/scale}px)`;}
  drawStatic(){const p=this.getInput().position;this.container.style.setProperty('--se-static-fill',`${(SPACE.thumbInset+p*SPACE.travel)/SPACE.railWidth*100}%`);const key=`${p}:${this.world.target.brightness}`;if(key!==this.staticKey){this.staticKey=key;this.staticImage.src=`data:image/svg+xml,${encodeURIComponent(staticHoleSvg(this.evolution.visual().holeVisibility<.5?2/3:Math.max(LIMITS.boom-.005,p),this.world.target.brightness))}`;this.staticImage.style.left=`${SPACE.railX+SPACE.thumbInset+p*SPACE.travel-38}px`;}}
  tick=(now)=>{
    this.frame=0;if(!this.active||this.lifecycle!=='running')return;
    this.checkVisibility();if(this.lifecycle!=='running')return;
    if(!this.renderer&&this.world.target.quality!=='static'&&!this.rendererFailed){this.replaceCanvas();this.createRenderer();if(!this.renderer)this.rendererFailed=true;}
    if(this.nextFrame&&now+1<this.nextFrame){this.frame=requestAnimationFrame(this.tick);return;}
    this.nextFrame=Math.max((this.nextFrame||now)+1000/60,now);
    const ratio=Math.min(window.devicePixelRatio||1,this.budget<.6?1.5:2.5);
    if(this.needsSize||ratio!==this.ratio){this.width=SPACE.width;this.height=SPACE.height;this.ratio=ratio;this.canvas.width=Math.round(this.width*ratio);this.canvas.height=Math.round(this.height*ratio);this.needsSize=false;this.applyAperture();}
    this.place();const dt=this.last?Math.min((now-this.last)/1000,.05):1/60;const gap=this.last?now-this.last:16;this.last=now;
    const sourceInput=this.getInput();const input=this.scene.holdAccepted?.()?{...sourceInput,position:this.evolution.position}:sourceInput;const config=this.world.target;const reduced=config.reducedMotion||config.followSystemMotion&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Collapsing the dock folds the window down to the rail (and back on open) in
    // the renderer: a CSS fade over the masked view stalled the page ~250 ms.
    const foldTo=this.scene.compact||this.scene.closing?1:0;this.fold=this.fold==null||reduced||config.dismiss==='instant'?foldTo:Math.max(0,Math.min(1,this.fold+Math.sign(foldTo-this.fold)*Math.min(Math.abs(foldTo-this.fold),dt/FOLD_SECONDS)));
    // Follows the pointer while pressed; otherwise eases onto its level (snap.mjs).
    this.snap??=new Snap();this.shownPosition=this.snap.step(this.shownPosition,input.position,dt,{follow:input.pressed||this.evolution.active,reduced});
    this.knob=knobScale(this.knob??1,!!input.pressed,dt,reduced);this.world.knobScale=this.knob;
    this.scene.shownPosition=this.shownPosition;
    if(!this.evolution.active&&Math.abs(this.evolution.position-input.position)>.00001)this.evolution.sync(input.position);
    const visible=this.container.getClientRects().length>0&&this.width>0;
    if(!visible)this.scene.onInvisible?.();
    this.evolution.step(gap/1000,{speed:config.speed,reduced,staticMode:!this.renderer||config.quality==='static'});this.updateCatcher();
    if(visible&&this.renderer&&config.quality!=='static'){
      this.world.step(dt,{...input,position:this.shownPosition,overdrive:this.scene.overdrive??0,reduced,budget:Math.min(this.budget,Math.max(.35,1/Math.sqrt(Math.max(1,drawingEngines.size))))});
      this.updateTorn();try{this.renderer.draw(this.world,{width:this.width,height:this.height,dpr:this.ratio,dark:input.dark,reduced,detail:detailForBudget(Math.min(this.budget,Math.max(.35,1/Math.sqrt(Math.max(1,drawingEngines.size))))),clip:this.renderClip,panel:this.scene.compact?COMPACT_PANEL:this.panel,compact:!!this.scene.compact,aperture:this.aperture,maskAperture:this.maskAperture,fold:this.fold});}catch{this.diagnostics?.record('renderer-fallback',{reason:'draw-failed'});if(this.renderer.mode==='WebGL2')this.switchToCanvas();else{this.releaseRenderer();this.rendererFailed=true;this.onStatus('静态渐变');}}
    }else{this.world.position=input.position;this.drawStatic();}
    this.canvas.style.visibility=this.renderer&&config.quality!=='static'?'visible':'hidden';
    this.staticLayer.style.display=this.renderer&&config.quality!=='static'?'none':'block';
    const effectiveMode=this.renderer&&config.quality!=='static'?this.renderer.mode:'静态渐变';if(this.currentMode!==effectiveMode){this.currentMode=effectiveMode;this.onStatus(effectiveMode);}
    this.total+=gap;this.frames++;
    if(this.total>=1000){this.fps=Math.round(this.frames*1000/this.total);this.slow=this.fps<43?this.slow+this.total/1000:0;this.fast=this.fps>55?this.fast+this.total/1000:0;
      const old=this.budget;if(config.quality==='auto'){if(this.slow>2){this.budget=Math.max(.35,this.budget-.2);this.slow=0;}else if(this.fast>10){this.budget=Math.min(1,this.budget+.15);this.fast=0;}}else this.budget={high:1,medium:.65,low:.35,static:0}[config.quality]??1;
      if(old!==this.budget)this.diagnostics?.record('quality-change',{quality:this.budget,fps:this.fps});
      this.diagnostics?.update(this.id,{renderer:this.renderer?.mode??'static',fps:this.fps,quality:this.budget,width:Math.round(this.width),height:Math.round(this.height),dpr:this.ratio,...this.world.snapshot(),phase:this.evolution.phase,boomCount:this.evolution.count});this.total=0;this.frames=0;}
    // Static/reduced controls remain responsive without a 60 Hz background loop.
    if(!this.renderer||config.quality==='static'||reduced){const generation=this.generation;this.timer=setTimeout(()=>{if(this.active&&this.lifecycle==='running'&&generation===this.generation){this.timer=0;this.schedule();}},reduced?45:100);}else this.frame=requestAnimationFrame(this.tick);
  };
  dispose(){if(!this.active)return;this.evolution.suspend(this.getInput().position);this.active=false;this.lifecycle='disposed';this.generation++;activeEngines.delete(this);drawingEngines.delete(this);cancelAnimationFrame(this.frame);clearTimeout(this.timer);clearTimeout(this.releaseTimer);this.frame=0;this.timer=0;this.releaseTimer=0;this.resize.disconnect();this.intersection?.disconnect();this.attributes?.disconnect();document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('resize',this.screenClip);window.removeEventListener('scroll',this.screenClip,true);this.releaseRenderer();this.viewport.remove();if(this.originalThumb)this.originalThumb.style.visibility='';this.diagnostics?.remove(this.id);this.onStatus=()=>{};}
}



