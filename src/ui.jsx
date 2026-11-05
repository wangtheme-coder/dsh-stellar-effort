import {clampPopup} from './shared/popup-layout.mjs';
import {LabSession,LAB_EVENTS,inspectionPoint} from './render/lab.mjs';
import {Evolution,LIMITS} from './render/evolution.mjs';
import {visualValidity,acceptedVisualPending} from './render/visual-validity.mjs';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { EffortController } from './control.mjs';
import { RenderEngine } from './render/engine.mjs';
import { DEFAULTS, NUMBERS, BUILTINS, cleanName, exportPreset, importPreset, validateConfig,visualConfig,deviceConfig } from './shared/config.mjs';
import { nearestLevel, clamp } from './shared/mapping.mjs';
import { PHOTOS, PHOTO_CREDIT } from './render/photos.mjs';
import { SPACE, VOID, REST, sceneAmount, sceneSize } from './render/space.mjs';
import { overdriveFromPointer } from './render/overdrive.mjs';
import { CSS } from './styles.mjs';

const demoLevels=[{id:'off',name:'Off',position:0},{id:'low',name:'Low',position:1/3},{id:'high',name:'High',position:2/3},{id:'max',name:'Max',position:1}];
const useSource = source => useSyncExternalStore(source.subscribe,source.getSnapshot,source.getSnapshot);
export function installStyle(){let style=document.getElementById('stellar-effort-style');if(!style){style=document.createElement('style');style.id='stellar-effort-style';style.dataset.plugin='dsh-stellar-effort';style.textContent=CSS;document.head.appendChild(style);}return style;}
function isDark(){return document.body.hasAttribute('data-ds-dark-theme')||document.documentElement.dataset.seTheme==='dark'||!document.documentElement.dataset.seTheme&&matchMedia('(prefers-color-scheme: dark)').matches;}
function useDark(){const[dark,setDark]=useState(isDark);useEffect(()=>{const observer=new MutationObserver(()=>setDark(isDark()));observer.observe(document.body,{attributes:true,attributeFilter:['data-ds-dark-theme']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-se-theme']});const media=matchMedia('(prefers-color-scheme: dark)');const change=()=>setDark(isDark());media.addEventListener('change',change);return()=>{observer.disconnect();media.removeEventListener('change',change);};},[]);return dark;}

// A tap on the Max hole: released within TAP.time ms, moved less than TAP.slop
// px, pressed within TAP.reach px of the knob. Overdrive waits TAP.hold ms.
export const TAP=Object.freeze({time:400,slop:4,reach:22,hold:220});
const reducedMotion=c=>c.reducedMotion||c.followSystemMotion&&matchMedia('(prefers-reduced-motion: reduce)').matches;
// True when a press lands outside the slider's own box (the rail and its hint).
const offTrack=(e,track)=>{const r=track?.getBoundingClientRect();return !r||e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
export function UniverseView({position,pressed=false,config,diagnostics,className='',onStatus,scene,viewportKey,readInput,escape=false}){
  const container=useRef(null),engine=useRef(null),input=useRef({position,pressed}),dark=useDark(),[mode,setMode]=useState('初始化');
  input.current={position,pressed,dark};
  useEffect(()=>{const e=new RenderEngine(container.current,{config,scene,escape,getInput:()=>readInput?{...input.current,...readInput()}:input.current,diagnostics,onStatus:value=>{setMode(value);onStatus?.(value);}});engine.current=e;return()=>{e.dispose();engine.current=null;};},[]);
  useEffect(()=>engine.current?.setConfig(config),[config]);
  useLayoutEffect(()=>engine.current?.screenClip(),[viewportKey]);
  useLayoutEffect(()=>engine.current?.refreshInput(),[position,pressed,dark]);
  return <div className={`se-universe ${className}`} data-renderer={mode} ref={container} style={{'--se-position':position,'--se-static-fill':`${position*100}%`,'--se-hole-gap':position>LIMITS.collapse-.011?'25px':'22px','--se-rest':position>=LIMITS.collapse?VOID.css:dark?REST.darkCss:REST.lightCss}}><div className="se-static-thumb"/></div>;
}

function Track({position,pressed,config,levels,disabled,syncing=false,cancelZone,diagnostics,onBegin,onPreview,onRelease,onCancel,onMenu,onHoleTap,scene,readVisualValidity,layoutKey,inspectionScale=1,readInput,onStatus,label='推理强度',escape=false}){
  const localScene=useRef({});scene=scene??localScene.current;
  const visualGate=useRef({identity:null,blocked:false,reentry:false});
  const readGate=expected=>readVisualValidity?.(expected)??{valid:!disabled,cancelZone:false,identity:null,position};
  const visualBegin=()=>{const gate=readGate();visualGate.current={identity:gate.identity,blocked:!gate.valid,reentry:false};scene.evolution??=new Evolution(position);if(!gate.valid){scene.evolution.cancel(gate.position);return;}scene.visualId=Math.max(scene.visualId??0,scene.evolution.intentId)+1;scene.evolution.begin(scene.visualId);};
  const visualPreview=(p,c)=>{const v=visualGate.current,gate=readGate(v.identity);if(!gate.valid||v.blocked){scene.evolution?.cancel(gate.position);v.blocked=true;return;}if(c||gate.cancelZone){scene.evolution?.cancel(gate.position);v.reentry=true;return;}if(v.reentry){scene.visualId=Math.max(scene.visualId??0,scene.evolution.intentId)+1;scene.evolution.begin(scene.visualId);v.reentry=false;}scene.evolution?.input(p,scene.visualId);};
  const root=useRef(null),active=useRef(false),nearest=nearestLevel(levels,position),[hover,setHover]=useState(false);
  // Focus taken by a press shows no focus ring (the knob grows instead); the ring
  // returns as soon as the keyboard is used.
  const [pointerFocus,setPointerFocus]=useState(false);
  const calculate=e=>{const r=root.current.getBoundingClientRect();if(inspectionScale!==1)return inspectionPoint(e.clientX,e.clientY,r,inspectionScale);return {position:clamp((e.clientX-r.left-16)/(r.width-32)),excess:(e.clientX-r.left-16)-(r.width-32),cancel:false};};
  // Dragging past Max only drives the visual overdrive; the level stays Max and
  // nothing new is sent. No Max-class level, no overdrive.
  // A press only becomes overdrive once it moves or is held: a click is never
  // mistaken for sustained overdrive.
  const drive=p=>{const t=tap.current;scene.overdrive=!p||p.cancel||visualGate.current.blocked||!levels.some(l=>l.position>=.999)||t&&!t.moved&&performance.now()-t.at<TAP.hold?0:overdriveFromPointer(p.excess??0);};
  // Pressing the Max hole grabs it where it is (no jump toward the pointer) until
  // the pointer moves; releasing such a press quickly is a tap on the hole.
  const tap=useRef(null);
  const point=e=>{const p=calculate(e),t=tap.current;if(t&&!t.moved&&Math.hypot(e.clientX-t.x,e.clientY-t.y)>=TAP.slop)t.moved=true;return t?.onHole&&!t.moved?{...p,position,excess:0}:p;};
  const down=e=>{if(e.target.classList?.contains('se-scene-catcher')&&offTrack(e,root.current))return;if(e.button!==0||disabled)return;e.preventDefault();setPointerFocus(true);root.current.focus();if(onBegin({pointer:true})===false)return;visualBegin();active.current=true;root.current.setPointerCapture(e.pointerId);const r=root.current.getBoundingClientRect(),knob=r.left+16+(r.width-32)*position;tap.current={at:performance.now(),x:e.clientX,y:e.clientY,moved:false,onHole:inspectionScale===1&&position>=.999&&Math.abs(e.clientX-knob)<=TAP.reach&&Math.abs(e.clientY-(r.top+36))<=TAP.reach};const p=point(e);onPreview(p.position,p.cancel);visualPreview(p.position,p.cancel);drive(p);};
  const move=e=>{if(!active.current)return;const p=point(e);onPreview(p.position,p.cancel);visualPreview(p.position,p.cancel);drive(p);};
  const up=e=>{if(!active.current)return;active.current=false;drive(null);const p=point(e),t=tap.current;tap.current=null;onPreview(p.position,p.cancel);visualPreview(p.position,p.cancel);scene.releaseEpoch=readGate(visualGate.current.identity).epoch;scene.evolution?.release();onRelease();if(root.current.hasPointerCapture(e.pointerId))root.current.releasePointerCapture(e.pointerId);if(t?.onHole&&!t.moved&&performance.now()-t.at<TAP.time)onHoleTap?.();};
  const cancel=()=>{tap.current=null;drive(null);if(active.current){active.current=false;scene.evolution?.cancel(position);onCancel();}};
  // Esc or right-click: drop the drag too, so the release that follows sends nothing.
  const abort=()=>{const dragging=active.current;tap.current=null;drive(null);active.current=false;scene.evolution?.cancel(position);onCancel();return dragging;};
  const keyboard=e=>{
    setPointerFocus(false);
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();abort();return;}
    if(e.key==='Enter'){e.preventDefault();scene.releaseEpoch=readGate(visualGate.current.identity).epoch;scene.evolution?.release();onRelease();return;}
    if(disabled||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const at=Math.max(0,levels.indexOf(nearest));let next=at;
    if(e.key==='Home')next=0;else if(e.key==='End')next=levels.length-1;else next=clamp(at+(e.key==='ArrowRight'?1:-1),0,levels.length-1);
    if(onBegin({pointer:false})!==false){visualBegin();onPreview(levels[next].position,false);visualPreview(levels[next].position,false);}
  };
  useEffect(()=>{const blur=()=>{active.current=false;onCancel();};const hidden=()=>{if(document.hidden)blur();};window.addEventListener('blur',blur);document.addEventListener('visibilitychange',hidden);return()=>{window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden);};},[onCancel]);
  return <div className={`se-track-block ${disabled&&!syncing?'se-disabled':''} ${syncing?'se-syncing':''} ${cancelZone?'se-cancel':''}`}>
    <div className={`se-track${pointerFocus?' se-pointer-focus':''}`} role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={Math.max(0,levels.length-1)} aria-valuenow={Math.max(0,levels.indexOf(nearest))} aria-valuetext={`${nearest?.name??'不可用'}${pressed?' · 预览':''}`} aria-disabled={disabled} tabIndex={0} ref={root} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={cancel} onKeyDown={keyboard} onContextMenu={e=>{e.preventDefault();if(!abort())onMenu?.();}} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <UniverseView position={position} pressed={pressed} config={config} diagnostics={diagnostics} scene={scene} viewportKey={layoutKey} readInput={readInput} onStatus={onStatus} escape={escape}/>
      {hover&&<span className="se-track-hint">{nearest?.name}</span>}
    </div>
    <div className="se-ticks">{levels.map(level=><span key={level.id} style={{left:`calc(16px + (100% - 32px) * ${level.position})`}} title={level.description||level.name} className={nearest?.id===level.id?'se-tick-active':''}>{level.name}</span>)}</div>
  </div>;
}

// Past the collapse threshold the knob shows a black hole, but release still
// snaps to the nearest real level (High). Say so instead of leaving the label
// and the picture to disagree.
export function statusText(state){
  const nearest=state.phase==='preview'&&!state.cancelZone?nearestLevel(state.levels,state.position):null;
  if(nearest&&state.position>=LIMITS.collapse&&nearest.position<LIMITS.collapse)return `已越过临界 · 仅视觉预览，松手仍为 ${nearest.name}`;
  return state.message||'松手后应用 · 下一次请求生效';
}
// Header level: DSH authority, unless a preview or a write is in progress, which
// are labelled as such rather than shown as if they were already the setting.
function CurrentLevel({state}){
  const actual=state.actual?.name??'—';
  if(state.phase==='preview')return <span className="se-current se-current-preview" title={`DSH 当前 ${actual} · 松手后才会提交`}><small>预览</small>{nearestLevel(state.levels,state.position)?.name??'—'}</span>;
  if(['applying','unknown'].includes(state.phase)&&state.requested)return <span className="se-current se-current-pending" title={`DSH 当前 ${actual} · ${state.phase==='unknown'?'提交结果未确认':'正在提交'} ${state.requested.name}`}>{actual}<small>→</small>{state.requested.name}{state.phase==='unknown'?'?':''}</span>;
  return <span className="se-current" title="DSH 当前推理等级">{actual}</span>;
}
// Settings preview of the scene size: a stand-in host page with text, the
// popup panel and the real renderer at Max, scaled to fit the dialog.
function ScenePreview({config,diagnostics}){
  const scale=.62,lines=['今天想让 DeepSeek 帮你做什么？','把这份季度报表整理成三点结论，并标出异常数据。','工作区内修改 · 默认工作区 · 新会话将使用当前推理等级','请先阅读项目说明，再给出重构建议。'];
  return <div className="se-scene-preview" style={{width:SPACE.width*scale,height:SPACE.height*scale}} aria-label="场景范围预览"><div className="se-scene-stage" style={{width:SPACE.width,height:SPACE.height,transform:`scale(${scale})`}}><div className="se-scene-host" aria-hidden="true">{lines.map((l,i)=><p key={i}>{l}</p>)}</div><div className="se-scene-panel" aria-hidden="true"/><div className="se-scene-rail"><UniverseView position={1} config={config} diagnostics={diagnostics}/></div></div></div>;
}
function FocusDialog({children,onClose,label,className='',dark}){
  const node=useRef(null);
  useEffect(()=>{const previous=document.activeElement;const target=node.current;const focus=target.querySelector('[autofocus],button,[tabindex="0"],input,select');focus?.focus();
    const key=e=>{if(e.key==='Escape'){e.stopPropagation();e.preventDefault();onClose();}if(e.key==='Tab'){const list=[...target.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(x=>x.getClientRects().length);if(!list.length){e.preventDefault();return;}const first=list[0],last=list.at(-1);if(e.shiftKey&&(document.activeElement===first||!target.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
    target.addEventListener('keydown',key);return()=>{target.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus();};},[]);
  return createPortal(<div className={`se-root se-backdrop ${dark?'se-dark':'se-light'}`} onPointerDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className={`se-dialog ${className}`} role="dialog" aria-modal="true" aria-label={label} ref={node}>{children}</section></div>,document.body);
}

// One controller per slot instance, plus the scene it drives; the visual
// evolution follows the controller's authoritative state.
function useEffort(directory,available,runtime){
  const scene=useRef({});
  const[controller]=useState(()=>new EffortController(directory,{available,diagnostics:runtime.diagnostics}));
  const state=useSource(controller);
  scene.current.visualRoute??=state.fingerprint;scene.current.holdAccepted=()=>acceptedVisualPending(controller,scene.current.evolution,scene.current.releaseEpoch);
  const cancel=React.useCallback(()=>{scene.current.evolution?.cancel(controller.getSnapshot().actual?.position??0);controller.cancel();},[controller]);
  useEffect(()=>{const e=scene.current.evolution;if(!e)return;if(scene.current.visualRoute!==state.fingerprint){scene.current.visualRoute=state.fingerprint;e.suspend(state.position);return;}if(controller.gesture?.conflict||['error','conflict','unknown'].includes(state.phase))e.cancel(state.actual?.position??0);else if(!scene.current.holdAccepted()&&state.phase!=='preview'&&Math.abs(e.position-state.position)>.00001)e.sync(state.position);},[state]);
  return {scene,controller,state,cancel};
}

export function EffortChip({directory,available=true,runtime}){
  const {scene,controller,state,cancel}=useEffort(directory,available,runtime);
  const prefs=useSource(runtime.preferences),[popup,setPopup]=useState(false),[pinned,setPinned]=useState(false),[closing,setClosing]=useState(false),[menu,setMenu]=useState(false),[panel,setPanel]=useState(null),[position,setPosition]=useState({left:12,top:12}),button=useRef(null),popupRef=useRef(null),closeTimer=useRef(null),dark=useDark();
  const layoutDrag=useRef(null),plunged=useRef(false);
  const cancelLayout=React.useCallback(()=>{const d=layoutDrag.current;if(!d)return;layoutDrag.current=null;setPosition(clampPopup(d.origin,{width:popupRef.current?.offsetWidth??350,height:popupRef.current?.offsetHeight??142},{width:innerWidth,height:innerHeight}));if(d.target.hasPointerCapture?.(d.pointerId))d.target.releasePointerCapture(d.pointerId);},[]);
  const fit=point=>clampPopup(point,{width:popupRef.current?.offsetWidth??350,height:popupRef.current?.offsetHeight??142},{width:innerWidth,height:innerHeight});
  useEffect(()=>{if(!popup)return;const hidden=()=>{if(document.hidden)cancelLayout();};window.addEventListener('blur',cancelLayout);document.addEventListener('visibilitychange',hidden);return()=>{window.removeEventListener('blur',cancelLayout);document.removeEventListener('visibilitychange',hidden);cancelLayout();};},[popup,cancelLayout]);
  useEffect(()=>{void directory.load().catch(()=>{});return()=>{clearTimeout(closeTimer.current);controller.dispose();};},[controller]);
  const dismiss=useRef('fade');dismiss.current=prefs.config.dismiss;
  const close=React.useCallback(()=>{cancelLayout();scene.current.evolution?.suspend(controller.getSnapshot().actual?.position??0);controller.cancel();setMenu(false);clearTimeout(closeTimer.current);const done=()=>{setPopup(false);setClosing(false);button.current?.focus({preventScroll:true});};if(dismiss.current==='instant'){done();return;}setClosing(true);closeTimer.current=setTimeout(done,240);},[controller]);
  useLayoutEffect(()=>{
    if(!popup)return;
    const place=()=>{if(layoutDrag.current)return;const remembered=prefs.config.popupPosition,r=button.current?.getBoundingClientRect();if(!r)return;const w=popupRef.current?.offsetWidth??350,h=popupRef.current?.offsetHeight??142,top=r.top-h-9;setPosition(fit(remembered??{left:r.right-w,top:top>=8?top:r.bottom+9}));};place();
    window.addEventListener('resize',place);window.addEventListener('scroll',place,true);const observer=new ResizeObserver(place);if(popupRef.current)observer.observe(popupRef.current);
    const outside=e=>{if(!pinned&&!popupRef.current?.contains(e.target)&&!button.current?.contains(e.target))close();};const key=e=>{if(e.key==='Escape'&&!e.defaultPrevented){close();button.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);return()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);};
  },[popup,close,pinned,prefs.config.popupPosition,prefs.config.uiScale]);
  const layoutDown=e=>{if(e.button!==0||e.target.closest('.se-popup-tools,button,input,select,[role="slider"]'))return;e.preventDefault();e.currentTarget.focus({preventScroll:true});layoutDrag.current={pointerId:e.pointerId,target:e.currentTarget,x:e.clientX,y:e.clientY,origin:position,latest:position,moved:false};e.currentTarget.setPointerCapture(e.pointerId);};
  const layoutMove=e=>{const d=layoutDrag.current;if(!d||d.pointerId!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.hypot(dx,dy)<4)return;if(!d.moved&&controller.gesture)cancel();d.moved=true;d.latest=fit({left:d.origin.left+dx,top:d.origin.top+dy});setPosition(d.latest);};
  const layoutUp=e=>{const d=layoutDrag.current;if(!d||d.pointerId!==e.pointerId)return;layoutDrag.current=null;if(d.moved)runtime.preferences.change({popupPosition:d.latest});if(d.target.hasPointerCapture(e.pointerId))d.target.releasePointerCapture(e.pointerId);};
  const openPanel=tab=>{scene.current.evolution?.suspend(controller.getSnapshot().actual?.position??0);controller.cancel();clearTimeout(closeTimer.current);setPopup(false);setClosing(false);setMenu(false);setPanel(tab);};
  return <>
    <button className="se-chip" ref={button} type="button" aria-label={`星轨推理：${state.actual?.name??'不可用'}`} title={state.disabled?state.message:`星轨推理 · ${state.actual?.name} · 点击调整`} aria-haspopup="dialog" aria-expanded={popup} onClick={()=>{if(popup&&!closing){close();return;}clearTimeout(closeTimer.current);setClosing(false);setPinned(false);plunged.current=false;setPopup(true);void directory.load().catch(()=>{});}}><span className="se-chip-icon" aria-hidden="true"/> <span>星轨</span><span className="se-chip-level">{state.actual?.name??'—'}</span></button>
    {popup&&createPortal(<div className={`se-root se-popup ${closing?'se-exit se-fade':''} ${dark?'se-dark':'se-light'}`} role="dialog" aria-label="星轨推理" ref={popupRef} onPointerDown={e=>{if(!pinned&&e.button===0&&(e.target.classList?.contains('se-scene-catcher')&&offTrack(e,popupRef.current?.querySelector('.se-track'))||e.target.closest?.('.se-ticks,.se-status'))){e.preventDefault();close();}}} style={{...position,width:Math.max(350,350*clamp(prefs.config.uiScale,.8,1.25))}}>
      <div className="se-popup-heading" tabIndex={0} aria-label="拖动弹窗标题" onPointerDown={layoutDown} onPointerMove={layoutMove} onPointerUp={layoutUp} onPointerCancel={cancelLayout} onLostPointerCapture={cancelLayout}><span className="se-wordmark">STELLAR EFFORT <b>星轨推理</b></span><div className="se-popup-tools"><CurrentLevel state={state}/><button type="button" aria-label={pinned?'取消固定星轨弹窗':'固定星轨弹窗'} aria-pressed={pinned} title="固定显示（非系统置顶）" onClick={()=>setPinned(v=>!v)}>⌖</button><button type="button" title="视觉设置" aria-label="打开星轨设置" onClick={()=>openPanel('常用')}>⚙</button><button type="button" title="关闭" aria-label="关闭星轨推理" onClick={close}>×</button></div></div>
      <Track escape layoutKey={`${position.left}:${position.top}`} readVisualValidity={expected=>visualValidity(controller,expected)} scene={scene.current} position={state.position} pressed={state.pressed} config={prefs.config} levels={state.levels} disabled={state.disabled||closing} syncing={state.syncing&&!closing} cancelZone={state.cancelZone} diagnostics={runtime.diagnostics} onBegin={o=>controller.begin(o)} onPreview={(p,c)=>controller.preview(p,c)} onRelease={()=>void controller.release()} onCancel={cancel} onMenu={()=>setMenu(true)} onHoleTap={()=>{if(!plunged.current)plunged.current=scene.current.evolution?.plunge(reducedMotion(prefs.config))??false;}}/>
      <div className={`se-status ${['error','conflict','unknown'].includes(state.phase)?'se-status-warn':''}`} role="status" aria-live="polite"><span className={state.phase==='applying'?'se-working':''}/>{statusText(state)}</div>
      {menu&&<div className="se-context-menu" role="menu" aria-label="星轨快捷菜单"><button role="menuitem" onClick={()=>openPanel('预览实验室')}>Universe Lab · 独立预览</button><button role="menuitem" onClick={()=>openPanel('常用')}>视觉设置</button><button role="menuitem" onClick={()=>setMenu(false)}>返回滑块</button></div>}
    </div>,document.body)}
    {panel&&<SettingsPanel runtime={runtime} initialTab={panel} onClose={()=>setPanel(null)}/>}
  </>;
}

// Resident compact rail above the composer (conversation.input.dock). Collapsed,
// the scene is cut to the rail capsule (the hole stays uncropped); pressing the
// rail opens the full universe view around it, which stays open until a press
// lands anywhere outside the rail (the starry sky included) or Esc.
export function EffortDock({directory,available=true,runtime}){
  const {scene,controller,state,cancel}=useEffort(directory,available,runtime);
  const prefs=useSource(runtime.preferences),dark=useDark(),[open,setOpen]=useState(false),[closing,setClosing]=useState(false),[menu,setMenu]=useState(null),root=useRef(null),timer=useRef(null);
  const dismiss=useRef('fade');dismiss.current=prefs.config.dismiss;
  useEffect(()=>{void directory.load().catch(()=>{});return()=>{clearTimeout(timer.current);controller.dispose();};},[controller]);
  const plunged=useRef(false);
  const expand=()=>{clearTimeout(timer.current);if(!open||closing)plunged.current=false;setClosing(false);setOpen(true);};
  const holeTap=()=>{if(plunged.current)return;plunged.current=scene.current.evolution?.plunge(reducedMotion(prefs.config))??false;};
  const collapse=React.useCallback(()=>{clearTimeout(timer.current);if(dismiss.current==='instant'){setOpen(false);setClosing(false);return;}setClosing(true);timer.current=setTimeout(()=>{setOpen(false);setClosing(false);},240);},[]);
  useEffect(()=>{if(!open||closing)return;const track=()=>root.current?.querySelector('.se-track');
    const outside=e=>{if(offTrack(e,track()))collapse();};const key=e=>{if(e.key==='Escape')collapse();};
    document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',key,true);return()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',key,true);};},[open,closing,collapse]);
  scene.current.compact=!open;scene.current.closing=closing;scene.current.openConfig=prefs.config;
  const config=useMemo(()=>open?prefs.config:{...prefs.config,viewWidth:SPACE.railWidth,viewHeight:SPACE.railHeight,viewFeather:0},[open,prefs.config]);
  if(!prefs.config.dock)return null;
  return <div className={`se-root se-dock ${open?'se-dock-open':''} ${closing?'se-dock-closing':''} ${dark?'se-dark':'se-light'}`} ref={root}>
    <div className="se-dock-rail"><Track escape label="推理强度（常驻）" layoutKey={open?'open':'rail'} readVisualValidity={expected=>visualValidity(controller,expected)} scene={scene.current} position={state.position} pressed={state.pressed} config={config} levels={state.levels} disabled={state.disabled} syncing={state.syncing} cancelZone={state.cancelZone} diagnostics={runtime.diagnostics} onBegin={o=>{expand();return controller.begin(o);}} onPreview={(p,c)=>controller.preview(p,c)} onRelease={()=>void controller.release()} onCancel={cancel} onMenu={()=>setMenu('常用')} onHoleTap={holeTap}/></div>
    {open&&!closing&&<div className={`se-status se-dock-status ${['error','conflict','unknown'].includes(state.phase)?'se-status-warn':''}`} role="status" aria-live="polite"><span className={state.phase==='applying'?'se-working':''}/>{statusText(state)}</div>}
    {menu&&<SettingsPanel runtime={runtime} initialTab={menu} onClose={()=>setMenu(null)}/>}
  </div>;
}

const fields={
  viewWidth:['取景框宽度',314,SPACE.width,1,'px'],viewHeight:['取景框高度',38,SPACE.height,1,'px'],viewFeather:['取景框边缘柔化',0,32,1,'px'],
  speed:['播放速度',.1,10,.1,'×'], activity:['宇宙活跃度',0,2,.05,''], lensStrength:['透镜强度',0,1,.05,''],gravity:['局部引力',0,1,.05,''],density:['恒星密度',.25,2,.05,''],meteorRate:['流星相对频率',0,3,.1,''],nebulaRate:['星云相对频率',0,3,.1,''],clusterRate:['星团相对频率',0,3,.1,''],spin:['吸积盘自旋',.1,3,.1,'×'],brightness:['亮度',.25,1.2,.05,''],glow:['光晕',0,1,.05,''],trails:['星光拖尾',0,1,.05,''],motionBlur:['运动柔化',0,1,.05,''],uiScale:['弹窗宽度比例',.8,1.25,.05,'×']
};
const toggles={dock:'输入框上方常驻滑轨',stars:'恒星与星尘',meteors:'随机流星',nebulae:'薄雾星云',clusters:'疏密星团',lens:'引力透镜',reducedMotion:'减少动态效果',followSystemMotion:'遵从系统减少动态效果'};
const styleNames={realistic:'A · 经典写实',scifi:'B · 科幻增强',hybrid:'C · 写实 + 科幻',minimal:'D · 极简优雅'};
function RangeField({name,config,onChange,onStart,onEnd}){const[label,min,max,step,suffix]=fields[name];return <label className="se-field"><span>{label}<button className="se-reset-one" type="button" title="恢复此项默认值" onClick={e=>{e.preventDefault();onChange({[name]:DEFAULTS[name]});}}>↺</button></span><span className="se-range-row"><input type="range" min={min} max={max} step={step} value={config[name]} aria-label={label} onPointerDown={onStart} onPointerUp={onEnd} onPointerCancel={onEnd} onBlur={onEnd} onKeyDown={e=>{if(e.key.startsWith('Arrow'))onStart?.();}} onKeyUp={onEnd} onChange={e=>onChange({[name]:Number(e.target.value)})}/><output>{Number(config[name].toFixed(2))}{suffix}</output></span></label>;}
function Toggle({name,config,onChange}){return <label className="se-toggle"><span>{toggles[name]}</span><input type="checkbox" checked={config[name]} onChange={e=>onChange({[name]:e.target.checked})}/></label>;}
function download(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function Confirmation({request,onCancel,onConfirm}){const node=useRef(null);useEffect(()=>{const before=document.activeElement,root=node.current;root.querySelector('button')?.focus();const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onCancel();}else if(e.key==='Tab'){const buttons=[...root.querySelectorAll('button')];e.preventDefault();buttons[document.activeElement===buttons[0]?1:0]?.focus();}};root.addEventListener('keydown',key,true);return()=>{root.removeEventListener('keydown',key,true);if(before?.isConnected)before.focus();};},[]);return <div className="se-confirm-shade"><div ref={node} className="se-confirm" role="alertdialog" aria-label="确认视觉操作"><h3>确认视觉操作</h3><p>{request.message}</p><div className="se-actions"><button onClick={onCancel}>取消</button><button className="se-primary" onClick={onConfirm}>确认</button></div></div></div>;}

function LabView({config,diagnostics}){
  const [session]=useState(()=>new LabSession({config})),state=useSource(session);
  useLayoutEffect(()=>{session.setConfig(config);session.publish();},[config]);
  useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),protection=()=>session.setSystemReduced(media.matches),hidden=()=>{if(document.hidden)session.stop('预览隐藏，事件已清理');},blur=()=>session.stop('窗口离开，事件已清理');protection();media.addEventListener('change',protection);document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',blur);return()=>{media.removeEventListener('change',protection);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',blur);session.dispose();};},[]);
  const phase={energy:'能量',collapse:'坍缩',newborn:'初生',boom:'展开',settling:'回稳',returning:'收束',settled:'深空'}[state.phase];
  return <div className="se-lab-inspector" data-lab-scale={state.scale} data-lab-event={state.event??''}>
    <div className="se-lab-width" role="group" aria-label="预览观察倍率">{[1,2,4].map(scale=><button key={scale} aria-pressed={state.scale===scale} onClick={()=>session.setScale(scale)}>{scale}× {scale===1?'实际尺寸':'检查'}</button>)}</div>
    <p className="se-note">仅放大此处观察画面；可拖动滑轨，超出区域时滚动查看。</p>
    <div className="se-lab-scroll" tabIndex={0} aria-label="可滚动的宇宙检查画面" ref={el=>{/* centre the view on open and on each zoom change, then leave scrolling to the user */if(el&&el.dataset.centred!==String(state.scale)){el.dataset.centred=String(state.scale);requestAnimationFrame(()=>{el.scrollLeft=(el.scrollWidth-el.clientWidth)/2;el.scrollTop=(el.scrollHeight-el.clientHeight)/2;});}}}><div className="se-lab-extent" style={{width:SPACE.width*state.scale,height:(SPACE.height+12)*state.scale}}><div className="se-lab-stage" style={{width:SPACE.width,height:SPACE.height,transform:`scale(${state.scale})`}}><div className="se-lab-track" style={{left:SPACE.railX,top:SPACE.centerY-36}}><Track position={state.position} pressed={state.pressed} config={config} levels={demoLevels} diagnostics={diagnostics} scene={session.scene} inspectionScale={state.scale} layoutKey={state.scale} readInput={session.input} onStatus={mode=>{if(session.renderer&&session.renderer!==mode)session.stop('绘制方式变化，事件已清理');session.renderer=mode;}} onBegin={o=>{session.stop('手动拖动已中断事件');session.positionTo(session.position,o.pointer);return true;}} onPreview={p=>session.positionTo(p,session.pressed)} onRelease={()=>session.positionTo(session.position,false)} onCancel={()=>session.stop()} label="实验室视觉强度"/></div></div></div></div>
    <div className="se-actions se-lab-anchors">{demoLevels.map(l=><button key={l.id} onClick={()=>{session.stop();session.prepare(l.position);session.publish();}}>{l.name}</button>)}<button onPointerDown={()=>session.hold(true)} onPointerUp={()=>session.hold(false)} onPointerLeave={()=>session.hold(false)} onPointerCancel={()=>session.hold(false)} onBlur={()=>session.hold(false)} onKeyDown={e=>{if(e.key===' '&&!e.repeat){e.preventDefault();session.hold(true);}}} onKeyUp={e=>{if(e.key===' ')session.hold(false);}}>按住跃迁</button></div>
    <div className="se-actions" role="group" aria-label="手动天文事件">{Object.entries(LAB_EVENTS).map(([id,name])=><button key={id} disabled={Boolean(state.event)} onClick={()=>session.trigger(id)}>预览{name}</button>)}<button disabled={!state.event} onClick={()=>session.stop()}>停止事件</button></div>
    <p className="se-note se-lab-event-status" role="status">{state.notice} · 阶段：{phase} · Lab BOOM {state.boomCount}次</p>
  </div>;
}

export function SettingsContent({runtime,initialTab='常用',onClose,embedded=false}){
  const prefs=useSource(runtime.preferences),[tab,setTab]=useState(initialTab),[draft,setDraft]=useState(()=>structuredClone(prefs.config)),[labName,setLabName]=useState('实验室预设'),[selected,setSelected]=useState(prefs.presets[0]?.name??''),[name,setName]=useState('我的星海'),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState(null),[diagnostic,setDiagnostic]=useState(''),dark=useDark(),file=useRef(null);
  const lab=tab==='预览实验室',config=lab?draft:prefs.config;
  const labConfig=useMemo(()=>({...draft,...deviceConfig(prefs.config)}),[draft,prefs.config]);
  const closeContent=async()=>{const p=runtime.preferences;if(p.state.readOnly||p.version===p.savedVersion||await p.flush())onClose?.();};
  useEffect(()=>()=>{void runtime.preferences.flush();},[]);
  const change=patch=>lab?setDraft(v=>validateConfig({...v,...patch})):runtime.preferences.change(patch);
  const start=()=>{if(!lab)runtime.preferences.beginGesture();},end=()=>{if(!lab)runtime.preferences.endGesture();};
  const ask=(message,action)=>setConfirm({message,action});
  const applyDraft=()=>ask('将实验室视觉参数应用到正式滑块？此操作不会修改模型推理等级。',()=>{runtime.preferences.applyVisual(draft);setNotice('视觉参数已应用；模型设置未改变');});
  const openLab=preset=>{setDraft({...prefs.config,...visualConfig(preset?.config??prefs.config)});setLabName(preset?.name??'实验室预设');setTab('预览实验室');setNotice('沙盒预览 · 尚未应用到正式滑块');};
  const range=name=><RangeField key={name} name={name} config={config} onChange={change} onStart={start} onEnd={end}/>;
  const toggle=name=><Toggle key={name} name={name} config={config} onChange={change}/>;
  const style=<label className="se-field"><span>黑洞旋钮风格</span><select aria-label="黑洞旋钮风格" value={config.style} onChange={e=>change({style:e.target.value})}>{Object.entries(styleNames).map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label>;
  const selectedPreset=prefs.presets.find(p=>p.name===selected);
  const renamePreset=()=>{try{const clean=cleanName(name);if(prefs.presets.some(p=>p.name===clean))throw Error('名称已存在');runtime.preferences.setPresets(prefs.presets.map(p=>p.name===selected?{...p,name:clean}:p));setSelected(clean);}catch(e){setNotice(e.message);}};
  useEffect(()=>{if(!['saving'].includes(runtime.preferences.getSnapshot().status))void runtime.preferences.load();},[]);
  const diagnosticText=()=>JSON.stringify(runtime.diagnostics.report(),null,2);
  const content=<>
    <header className="se-settings-header"><div><div className="se-eyebrow">A SMALL SLIDER. A LARGER UNIVERSE.</div><h2>星轨推理 <span>Stellar Effort</span></h2></div><button className="se-icon-button" aria-label="关闭视觉设置" onClick={()=>void closeContent()}>×</button></header>
    <div className="se-settings-layout"><nav className="se-tabs" aria-label="星轨设置分类">{['常用','宇宙视觉','性能与舒适度','预设管理','预览实验室','兼容性与状态'].map(t=><button type="button" key={t} aria-current={tab===t?'page':undefined} onClick={()=>{if(t==='预览实验室'&&tab!=='预览实验室')setDraft(structuredClone(prefs.config));setTab(t);setNotice('');}}>{t}</button>)}</nav>
    <main className="se-settings-content">
      {(tab==='宇宙视觉'||lab)&&<section className="se-scene-settings"><div className="se-section-title"><h3>场景范围</h3><p>调整的是取景框：宇宙固定为 {SPACE.width}×{SPACE.height}，范围变小只是看见的少，不会缩放或重排。最小只显示滑轨，默认最大。</p></div><ScenePreview config={config} diagnostics={runtime.diagnostics}/><label className="se-field"><span>场景大小</span><span className="se-range-row"><input type="range" min={0} max={100} step={1} aria-label="场景大小" value={Math.round(sceneAmount(config)*100)} onPointerDown={start} onPointerUp={end} onPointerCancel={end} onBlur={end} onChange={e=>change(sceneSize(Number(e.target.value)/100))}/><output>{Math.round(sceneAmount(config)*100)}%</output></span></label>{range('viewFeather')}<details><summary>分别调整宽度与高度</summary>{['viewWidth','viewHeight'].map(range)}</details></section>}
      {tab==='常用'&&<><div className="se-section-title"><h3>小滑块里，一片会呼吸的宇宙</h3><p>视觉即时生效。模型等级由主滑块松手后单独确认。</p></div><div className="se-settings-preview"><UniverseView position={1} config={config} diagnostics={runtime.diagnostics}/></div>{style}{range('speed')}{range('activity')}<div className="se-actions"><button onClick={()=>openLab()}>在实验室预览</button><button onClick={()=>runtime.preferences.undo()} disabled={!runtime.preferences.undoStack.length}>撤销</button><button onClick={()=>runtime.preferences.redo()} disabled={!runtime.preferences.redoStack.length}>重做</button></div></>}
      {tab==='宇宙视觉'&&<><div className="se-section-title"><h3>星海与引力</h3><p>局部近似、轻微牵引。星海始终是画面的主体。</p></div>{style}<div className="se-toggle-grid">{['stars','meteors','nebulae','clusters','lens'].map(toggle)}</div><div className="se-actions"><button onClick={()=>change({stars:true,meteors:true,nebulae:true,clusters:true,lens:true})}>全选宇宙元素</button><button onClick={()=>ask('恢复宇宙视觉分类的默认参数？',()=>{const keys=['style','stars','meteors','nebulae','clusters','lens','lensStrength','gravity','density','meteorRate','nebulaRate','clusterRate','spin'];change(Object.fromEntries(keys.map(k=>[k,DEFAULTS[k]])));})}>恢复此分类</button></div><details><summary>高级视觉参数</summary>{['density','lensStrength','gravity','spin','meteorRate','nebulaRate','clusterRate'].map(range)}</details></>}
      {tab==='性能与舒适度'&&<><div className="se-section-title"><h3>漂亮，也要轻巧</h3><p>优先保证输入跟手；低负载时恢复细节，关闭控件停止绘制。</p></div><label className="se-field"><span>画质与资源预算</span><select aria-label="画质" value={config.quality} onChange={e=>change({quality:e.target.value})}><option value="auto">自动调节（推荐）</option><option value="high">高</option><option value="medium">中</option><option value="low">低</option><option value="static">静态渐变</option></select></label><label className="se-field"><span>弹窗关闭方式</span><select aria-label="弹窗关闭方式" value={config.dismiss} onChange={e=>change({dismiss:e.target.value})}><option value="fade">淡出（约 0.24 秒）</option><option value="instant">直接消失</option></select></label><p className="se-note">点 × 或滑块以外的任何地方（包括星空）都会关闭弹窗；固定 ⌖ 后只有 × 和 Esc 会关闭。常驻滑轨展开的宇宙视图也按这里的方式收起。</p>{toggle('dock')}{toggle('reducedMotion')}{toggle('followSystemMotion')}{['brightness','glow','trails','motionBlur','uiScale'].map(range)}<p className="se-note">播放速度控制演化时间；高倍速不会等比例放大闪光强度。减少动态效果限制跃迁与粒子运动。</p></>}
      {tab==='预设管理'&&<><div className="se-section-title"><h3>收藏你的星海</h3><p>只保存视觉规则。导入后先在实验室查看，再决定是否应用。</p></div><label className="se-field"><span>本地预设</span><select aria-label="本地预设" value={selected} onChange={e=>setSelected(e.target.value)}><option value="" disabled>选择预设</option>{prefs.presets.map(p=><option key={p.name}>{p.name}</option>)}</select></label><label className="se-field"><span>预设名称</span><input aria-label="预设名称" maxLength={48} value={name} onChange={e=>setName(e.target.value)}/></label><div className="se-actions"><button disabled={!selectedPreset} onClick={()=>openLab(selectedPreset)}>沙盒试用</button><button disabled={!selectedPreset} onClick={()=>ask(`应用「${selected}」的视觉参数？`,()=>runtime.preferences.change(selectedPreset.config))}>应用</button><button onClick={()=>{try{if(prefs.presets.some(p=>p.name===cleanName(name)))ask('覆盖同名预设？',()=>runtime.preferences.savePreset(name));else runtime.preferences.savePreset(name);}catch(e){setNotice(e.message);}}}>保存当前视觉</button><button disabled={!selectedPreset} onClick={()=>{try{const clean=cleanName(name);if(prefs.presets.some(p=>p.name===clean))throw Error('复制需要一个尚未使用的新名称');runtime.preferences.savePreset(clean,selectedPreset.config);}catch(e){setNotice(e.message);}}}>复制</button><button disabled={!selectedPreset} onClick={renamePreset}>重命名</button><button disabled={!selectedPreset} onClick={()=>ask(`删除预设「${selected}」？`,()=>{runtime.preferences.setPresets(prefs.presets.filter(p=>p.name!==selected));setSelected('');})}>删除</button><button disabled={!selectedPreset} onClick={()=>download('Stellar_Effort_视觉预设.json',exportPreset(selected,selectedPreset.config))}>导出 JSON</button><button onClick={()=>file.current.click()}>导入并预览</button></div><div className="se-preset-cards">{BUILTINS.map(p=><button key={p.name} onClick={()=>openLab(p)}><span className={`se-preset-dot se-style-${p.config.style}`}/><b>{p.name}</b><small>内置 · 点击预览</small></button>)}</div></>}
      {lab&&<><div className="se-section-title"><h3>Universe Lab <span>视觉沙盒</span></h3><p>此处没有模型写入接口；拖动与长按只影响独立预览。</p></div><LabView config={labConfig} diagnostics={runtime.diagnostics}/>{style}{range('speed')}{range('activity')}<details><summary>局部引力与高级视觉</summary>{['stars','meteors','nebulae','clusters','lens'].map(toggle)}{['density','lensStrength','gravity','spin','meteorRate','nebulaRate','clusterRate','brightness','glow','trails','motionBlur'].map(range)}</details><div className="se-actions"><button className="se-primary" onClick={applyDraft}>应用到正式滑块</button><button onClick={()=>{try{const save=()=>{runtime.preferences.savePreset(labName,draft);setNotice('已保存预设，未应用到正式滑块');};if(prefs.presets.some(p=>p.name===cleanName(labName)))ask('覆盖同名草稿预设？',save);else save();}catch(e){setNotice(e.message);}}}>保存草稿预设</button><button onClick={()=>download('Stellar_Effort_Lab预设.json',exportPreset(labName,draft))}>导出草稿</button><button onClick={()=>file.current.click()}>导入</button></div><label className="se-field"><span>草稿预设名</span><input value={labName} maxLength={48} onChange={e=>setLabName(e.target.value)}/></label></>}
      {tab==='兼容性与状态'&&<><div className="se-section-title"><h3>清楚知道发生了什么</h3><p>Stellar Effort 1.1.5 · 适配 DSH 0.2.x（已验证 0.2.1-rc.3、0.2.2-rc.1）</p></div><dl className="se-facts"><dt>真实设置</dt><dd>使用 DSH 官方模型目录与选择接口，面向后续请求；宿主还会异步保存新会话默认值。</dd><dt>并发边界</dt><dd>已观测外部变化会取消预览；自身写入串行并读回确认。宿主无原子旧值检查，无法保证消除全部外部竞争。</dd><dt>能力映射</dt><dd>显示与提交真实模型档位；High 保持紫色临界，Max / Xhigh 才对应完整深空。不支持时禁用，不补造档位。</dd><dt>配置状态</dt><dd>{prefs.status} · 修订 {prefs.revision}</dd><dt>数据与隐私</dt><dd>视觉配置与有限快照保存在宿主 stellar-effort 目录；诊断只在内存，不收集聊天或凭据，不主动上传。</dd><dt>随机宇宙</dt><dd>运行时生成、老化与捕获；没有视频或固定星图循环。预设仅保存规则。</dd><dt>图像署名</dt><dd>部分天体图像：{PHOTO_CREDIT}（CC BY 4.0），已裁剪、缩小并去除背景：{PHOTOS.map(p=>p.id).join('、')}。图集随插件打包，不联网加载。</dd></dl><div className="se-actions"><button onClick={()=>setDiagnostic(diagnosticText())}>预览诊断</button><button onClick={()=>{runtime.diagnostics.clear();setDiagnostic(diagnosticText());}}>清空诊断</button><button onClick={()=>download('Stellar_Effort_未确认视觉草稿.json',exportPreset('未确认视觉草稿',prefs.config))}>导出当前视觉草稿</button><button onClick={()=>ask('放弃未确认的设置与预设改动，并重新读取已保存配置？需要保留的视觉草稿或命名预设请先导出。',()=>void runtime.preferences.load({discard:true}))}>重新读取配置</button><button onClick={()=>ask('恢复全部默认视觉参数？模型推理等级不会改变。',()=>runtime.preferences.applyVisual(DEFAULTS))}>恢复全部视觉默认值</button></div>{diagnostic&&<><textarea aria-label="诊断报告预览" className="se-diagnostics" value={diagnostic} readOnly/><button onClick={()=>download('Stellar_Effort_诊断.json',diagnostic)}>导出已预览的诊断</button></>}</>}
      {(notice||prefs.notice)&&<p className="se-notice" role="status">{notice||prefs.notice}</p>}
    </main></div>
    <footer className="se-settings-footer"><span><i className={prefs.status==='saved'?'se-save-good':''}/> {lab?'独立宇宙 · 尚未应用的改动仅在此处生效':prefs.status==='saved'?'视觉设置已保存':prefs.status==='saving'?'正在保存视觉设置…':'视觉设置：'+prefs.status}</span><span>真实等级以 DSH 为准</span></footer>
    <input ref={file} type="file" accept="application/json,.json" hidden onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{if(f.size>131072)throw Error('文件过大（上限 128 KB）');const preset=importPreset(await f.text());openLab(preset);if(preset.notice)setNotice(preset.notice);}catch(error){setNotice(error.message);}}}/>
    {confirm&&<Confirmation request={confirm} onCancel={()=>setConfirm(null)} onConfirm={()=>{try{confirm.action();setConfirm(null);}catch(e){setNotice(e.message);setConfirm(null);}}}/>}
  </>;
  return embedded?<section className={`se-root se-settings se-embedded ${dark?'se-dark':'se-light'}`} aria-label="Stellar Effort 内嵌设置">{content}</section>:<FocusDialog onClose={()=>void closeContent()} label="Stellar Effort 视觉设置" dark={dark} className="se-settings">{content}</FocusDialog>;
}

export function SettingsPanel(props){return <SettingsContent {...props}/>;}
export function SettingsEntry({runtime,onClose}){return <SettingsContent runtime={runtime} embedded onClose={onClose}/>;}










