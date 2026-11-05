import React, { useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { EffortChip, EffortDock, SettingsPanel, UniverseView, installStyle } from './ui.jsx';
import { VisualPreferences } from './preferences.mjs';
import { Diagnostics } from './diagnostics.mjs';
import { freshDocument } from './shared/config.mjs';
import { liveEngines } from './render/engine.mjs';

export class PreviewDirectory {
  constructor(){this.sessionId='preview-local';this.listeners=new Set();this.writes=[];this.behavior='normal';this.latency=90;this.state={current:{provider:'preview',model:'deepseek',reasoningEffort:'max'},routable:true,status:'ready',pending:null,groups:[{id:'preview',name:'演示目录',models:[{id:'deepseek',name:'四档模型',reasoning:{defaultEffort:'high',efforts:['off','low','high','max'].map(id=>({id,name:id[0].toUpperCase()+id.slice(1)}))}},{id:'multi',name:'含 Medium / Xhigh',reasoning:{defaultEffort:'medium',efforts:['off','minimal','low','medium','high','xhigh'].map(id=>({id,name:id[0].toUpperCase()+id.slice(1)}))}},{id:'limited',name:'仅 Low / High',reasoning:{defaultEffort:'low',efforts:['low','high'].map(id=>({id,name:id[0].toUpperCase()+id.slice(1)}))}},{id:'plain',name:'无推理调节'}]}]};this.store={getSnapshot:()=>this.state,subscribe:fn=>{this.listeners.add(fn);return()=>this.listeners.delete(fn);}};}
  emit(patch){this.state={...this.state,...patch};this.listeners.forEach(fn=>fn());}
  async load(){if(this.state.status==='error')this.emit({status:'ready'});return this.state;}
  async select(target){this.writes.push({...target});this.emit({status:'selecting',pending:target});await new Promise(resolve=>setTimeout(resolve,this.latency));if(this.behavior==='reject'){this.emit({status:'error',pending:null});return {ok:false,error:{code:'session/model-unavailable'}};}if(this.behavior==='timeout')await new Promise(resolve=>{this.resume=resolve;});this.emit({current:{...target},status:'ready',pending:null});return {ok:true,value:undefined};}
  switchModel(id){const m=this.state.groups[0].models.find(m=>m.id===id);this.emit({current:{provider:'preview',model:id,...m.reasoning?.defaultEffort?{reasoningEffort:m.reasoning.defaultEffort}:{}},status:'ready'});}
  external(id){this.emit({current:{...this.state.current,reasoningEffort:id},status:'ready'});}
}
const directory=new PreviewDirectory();let doc=freshDocument();
try{const cached=localStorage.getItem('stellar-preview-visual');if(cached)doc=JSON.parse(cached);}catch{}
const runtime={preferences:new VisualPreferences({read:async()=>structuredClone(doc),write:async(next,revision)=>{if(doc.revision!==revision)throw Object.assign(Error('conflict'),{code:'CONFLICT'});doc={...structuredClone(next),revision:revision+1};localStorage.setItem('stellar-preview-visual',JSON.stringify(doc));return structuredClone(doc);}}),diagnostics:new Diagnostics()};
installStyle();void runtime.preferences.load();
window.__stellarTest={directory,runtime,engines:liveEngines};
function Preview(){const state=useSyncExternalStore(directory.store.subscribe,directory.store.getSnapshot),prefs=useSyncExternalStore(runtime.preferences.subscribe,runtime.preferences.getSnapshot),[settings,setSettings]=useState(null),[dark,setDark]=useState(true),[events,setEvents]=useState(0);
  document.documentElement.dataset.seTheme=dark?'dark':'light';
  return <div className={`preview-app ${dark?'preview-dark':'preview-light'}`}>
    <header className="preview-top"><div><i className="preview-logo"/> <b>Stellar Effort</b><span>星轨推理</span></div><button onClick={()=>setDark(v=>!v)}>{dark?'浅色模式':'深色模式'}</button></header>
    <main className="preview-main"><div className="preview-eyebrow">REAL CONTROL. A LIVING UNIVERSE.</div><h1>思考，<br/><em>向更深处。</em></h1><p className="preview-lead">从一缕冰蓝，到流动的紫色能量。<br/>在一个小小的滑块里，抵达仍在呼吸的宇宙。</p>
    <div className="preview-specimens">{[[0.2,'01','轻思考','冰蓝微光'],[.57,'02','深思考','紫色流光'],[1,'03','极致推理','黑洞与星海']].map(([position,no,title,subtitle])=><div className="preview-card" key={no}><span className="preview-no">{no}</span><UniverseView position={position} config={{...prefs.config,viewWidth:314,viewHeight:72}} diagnostics={runtime.diagnostics}/><div><b>{title}</b><span>{subtitle}</span></div></div>)}</div>
    <EffortDock directory={directory} runtime={runtime}/><div className="preview-composer"><div className="preview-draft">把思考，交给更深的宇宙。</div><div className="preview-composer-bottom"><span>＋</span><div><EffortChip directory={directory} runtime={runtime}/><button className="preview-model" onClick={()=>setSettings('兼容性与状态')}>{state.current.model==='deepseek'?'四档模型':state.current.model==='multi'?'六档模型':state.current.model==='plain'?'无推理调节':'Low / High'} <small>{state.current.reasoningEffort??'默认'}</small></button><span className="preview-send">↑</span></div></div></div>
    <div className="preview-links"><button onClick={()=>setSettings('预览实验室')}>进入 Universe Lab <span>↗</span></button><button onClick={()=>setSettings('常用')}>视觉设置</button></div>
    <details className="preview-testing"><summary>隔离验证控制台 · 不连接真实模型</summary><div><label>模型能力 <select aria-label="测试模型" value={state.current.model} onChange={e=>directory.switchModel(e.target.value)}>{state.groups[0].models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label>接口结果 <select aria-label="测试接口行为" onChange={e=>{directory.behavior=e.target.value;}}><option value="normal">接受并推送状态</option><option value="reject">拒绝</option><option value="timeout">挂起至手动恢复</option></select></label><button onClick={()=>{directory.external(state.current.reasoningEffort==='low'?'high':'low');setEvents(v=>v+1);}}>模拟外部改档</button><button onClick={()=>directory.resume?.()}>恢复挂起请求</button><button onClick={()=>{setEvents(v=>v+1);}}>刷新计数</button><output data-testid="write-count">模型模拟写入：{directory.writes.length} · 外部事件 {events}</output></div></details>
    </main><footer className="preview-footer"><span>原创程序化视觉 · 无视频与固定星图循环</span><span>独立预览 · 真实 DSH 尚未连接</span></footer>{settings&&<SettingsPanel runtime={runtime} initialTab={settings} onClose={()=>setSettings(null)}/>}</div>;
}
createRoot(document.getElementById('app')).render(<Preview/>);
