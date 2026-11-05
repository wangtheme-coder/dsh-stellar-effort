import {Universe} from './universe.mjs';
import {Evolution,LIMITS} from './evolution.mjs';
import {DEFAULTS} from '../shared/config.mjs';
export const LAB_EVENTS=Object.freeze({meteor:'流星',star:'恒星掠过',cloud:'星云穿越',boom:'BOOM',warp:'星际跃迁'});
export function inspectionPoint(clientX,clientY,rect,scale=1){const x=(clientX-rect.left)/scale,y=(clientY-rect.top)/scale;return {position:Math.max(0,Math.min(1,(x-16)/(rect.width/scale-32))),cancel:false};}
class LabUniverse extends Universe{
  step(delta,input){this.session?.beforeStep();super.step(delta,{...input,pressed:this.session?.pressed??input?.pressed});this.session?.afterStep(delta);}
}
export class LabSession{
  constructor({config=DEFAULTS,seed,clock=()=>performance.now()}={}){this.clock=clock;this.config={...config};this.position=1;this.pressed=false;this.scale=1;this.listeners=new Set();this.disposed=false;this.systemReduced=false;this.world=new LabUniverse({config,seed});this.world.session=this;this.scene={world:this.world,evolution:new Evolution(1),inspectionScale:1,onInvisible:()=>{if(this.event||this.pressed||this.scene.evolution.active||this.scene.evolution.crossedB||['collapse','boom','entry','decel','settling','returning'].includes(this.scene.evolution.phase))this.stop('预览容器隐藏，事件已清理');}};this.world.evolution=this.scene.evolution;this.notice='独立Lab · 手动事件仅在此处播放';this.publish();}
  subscribe=fn=>{this.listeners.add(fn);return()=>this.listeners.delete(fn);};
  getSnapshot=()=>this.state;
  input=()=>({position:this.position,pressed:this.pressed});
  publish(){this.state={position:this.position,pressed:this.pressed,scale:this.scale,event:this.event?.kind??null,notice:this.notice,phase:this.scene.evolution.phase,boomCount:this.scene.evolution.count};for(const fn of this.listeners)fn();}
  setScale(value){if(![1,2,4].includes(value)||this.disposed)return;this.scale=value;this.scene.inspectionScale=value;this.publish();}
  protected(){const c=this.config;return this.disposed||c.quality==='static'||c.reducedMotion||(c.followSystemMotion&&this.systemReduced)||!Number.isFinite(c.speed)||c.speed<=0;}
  setConfig(config){this.config={...config};this.world.setConfig(config);const element={meteor:'meteors',star:'stars',cloud:'nebulae'}[this.event?.kind];if((this.event||this.pressed)&&(this.protected()||element&&!config[element]))this.stop('设备保护或元素关闭，预览已停止');}
  setSystemReduced(value){this.systemReduced=value;if(this.protected())this.stop('减少动态保护，预览已停止');}
  positionTo(value,pressed=false){this.position=Math.max(0,Math.min(1,value));this.pressed=pressed;this.publish();}
  hold(value){if(value){if(this.protected()){this.notice='保护模式或速度0：暂不跃迁';this.publish();return;}this.stop();this.prepare(1);}this.positionTo(this.position,value);}
  prepare(value){this.position=value;this.pressed=false;this.scene.evolution.suspend(value);}
  trigger(kind){if(!LAB_EVENTS[kind]||this.disposed)return false;if(this.event){this.notice='当前事件正在播放，不排队；可先停止';this.publish();return false;}if(this.protected()){this.notice='保护模式或速度0：保留预览，不播放手动事件';this.publish();return false;}const element={meteor:'meteors',star:'stars',cloud:'nebulae'}[kind];if(element&&!this.config[element]){this.notice='对应天体已关闭，请先在Lab中开启';this.publish();return false;}if(kind==='meteor'&&this.world.meteors.length>=2||kind==='cloud'&&this.world.clouds.length>=4){this.notice='当前同类天体已达上限，请稍后重试';this.publish();return false;}
    const now=this.clock();this.event={kind,start:now,last:now,elapsed:0,simulated:0,ids:[],beforeCount:this.scene.evolution.count,prepared:false};this.prepare(kind==='boom'?LIMITS.rearm-.01:1);this.notice=`仅Lab：${LAB_EVENTS[kind]} · ${kind==='boom'?'先低位整备，再High后正向演化':'已准备Max观察阶段'} · 不排队`;
    if(kind==='boom'){const e=this.scene.evolution;e.begin(e.intentId+1);e.input(this.position);}
    if(kind==='warp')this.pressed=true;
    if(kind==='meteor'){const m=this.world.meteor();Object.assign(m,{x:.28,y:-.4,age:.08});this.world.meteors.push(m);this.event.ids.push(m.id);}
    if(kind==='star'){const s=this.world.star();Object.assign(s,{x:.26,y:-.3,z:.88,vx:.035,vy:.03,age:1.5,life:4.5});this.world.stars.push(s);this.event.ids.push(s.id);}
    if(kind==='cloud'){const n=this.world.cloud(true);Object.assign(n,{x:.72,y:-.35,radius:.2,opacity:.26,age:3,life:6});this.world.clouds.push(n);this.event.ids.push(n.id);}
    this.publish();return true;
  }
  beforeStep(){if(!this.event)return;const now=this.clock(),limit=this.event.kind==='boom'?Math.min(10000,2000/Math.max(.1,this.config.speed)+300):this.event.kind==='warp'?3500:Math.min(10000,3500/Math.max(.1,this.config.speed));if(this.protected()||now-this.event.last>250||now-this.event.start>limit){this.stop('预览中断或达到时限，不补播');return;}this.event.last=now;if(this.event.kind==='boom'&&!this.scene.evolution.active)this.stop('演化已中断，不补播BOOM');}
  afterStep(delta){const event=this.event;if(!event)return;event.elapsed+=Math.max(0,Math.min(delta,.05));event.simulated+=Math.min(Math.max(0,Math.min(delta,.05))*this.world.config.speed,.25);const e=this.scene.evolution;
    if(event.kind==='boom'&&!event.prepared&&event.elapsed>=.24){if(e.consumed){this.stop('未完成有效整备，已停止');return;}event.prepared=true;e.input(LIMITS.high);e.input(.69);e.input(.82);this.position=.82;this.world.position=.82;this.publish();}
    if(event.kind==='cloud'){const n=this.world.clouds.find(n=>event.ids.includes(n.id));if(n)n.x=.72-event.simulated*.16;}
    const duration={meteor:1.1,star:3,cloud:3,warp:2.2}[event.kind];if((duration&&(event.kind==='warp'?event.elapsed:event.simulated)>=duration)||(event.kind==='boom'&&event.prepared&&e.phase==='settled'&&e.count>event.beforeCount)){this.stop(`${LAB_EVENTS[event.kind]}预览完成`);return;}
    if(this.state.phase!==e.phase||this.state.boomCount!==e.count)this.publish();
  }
  stop(message='预览已停止'){const ids=this.event?.ids??[];this.world.stars=this.world.stars.filter(s=>!ids.includes(s.id));this.world.clouds=this.world.clouds.filter(n=>!ids.includes(n.id));this.world.meteors=this.world.meteors.filter(m=>!ids.includes(m.id));this.event=null;this.pressed=false;this.scene.evolution.suspend(this.position);this.notice=message;if(!this.disposed)this.publish();}
  dispose(){if(this.disposed)return;this.stop('Lab已关闭');this.disposed=true;this.listeners.clear();}
}



