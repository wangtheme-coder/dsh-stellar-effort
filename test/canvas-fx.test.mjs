import test from 'node:test';import assert from 'node:assert/strict';
import {arcStrokes,knobJitter,arcShare} from '../src/render/arcs.mjs';
import {Universe} from '../src/render/universe.mjs';
import {Evolution} from '../src/render/evolution.mjs';
import {apertureFor,COMPACT_CONFIG,SPACE} from '../src/render/space.mjs';
// A recording stand-in for the 2D context and document (the fallback renderer has no browser here).
const calls=[];const context=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:k==='createImageData'?(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}):/Gradient$/.test(k)?()=>({addColorStop(){}}):(...a)=>{calls.push([k,t.globalCompositeOperation,...a]);},set:(t,k,v)=>{t[k]=v;return true;}});
globalThis.document={createElement:()=>({width:1,height:1,getContext:context})};
const {CanvasRenderer}=await import('../src/render/canvas.mjs');
test('canvas arcs: none without charge, more and steadier ones nearer the critical point, all close to the knob',()=>{assert.deepEqual(arcStrokes(0,1,0,19),[]);let low=0,high=0;for(let t=0;t<20;t+=.05){low+=arcStrokes(.3,t,0,19).length;high+=arcStrokes(1,t,0,19).length;}assert.ok(high>low*2,`${low} → ${high}`);assert.ok(Math.abs(high/400/7-arcShare(1))<.1);
  for(const a of arcStrokes(1,3,0,19))for(const p of a.points)assert.ok(Math.hypot(p.x,p.y)<19*1.12+4);
  {const j=knobJitter(1,2,1);assert.ok(j.x===0&&j.y===0&&j.scale===1,'held still with reduced motion');}assert.ok(knobJitter(0,2,0).x===0);assert.ok(Math.hypot(knobJitter(1,2.3,0).x,knobJitter(1,2.3,0).y)>0);});
const world=position=>{const w=new Universe({seed:3});w.position=position;w.evolution=new Evolution(position);return w;};
const draw=(w,o={})=>{calls.length=0;const r=new CanvasRenderer({getContext:context});r.draw(w,{dpr:1,dark:true,reduced:false,...o});return calls;};
test('canvas fallback draws the High lightning, the swallow and trims to the view like WebGL',()=>{const high=draw(world(2/3));assert.ok(high.filter(c=>c[0]==='stroke'&&c[1]==='lighter').length>3,'arcs drawn as light');
  const w=world(1);w.evolution.begin(1);w.evolution.input(2/3);for(let i=0;i<30;i++){w.evolution.step(1/60);w.time+=1/60;}assert.ok(w.evolution.visual().swallow>0);const swallow=draw(w);assert.ok(swallow.some(c=>c[0]==='rotate'),'sky turned around the knob');assert.ok(swallow.some(c=>c[0]==='arc'&&c[4]<Math.hypot(SPACE.width,SPACE.height)),'drawn inside a shrinking disc');
  const open=apertureFor({}),closed=draw(world(.3),{aperture:apertureFor(COMPACT_CONFIG),maskAperture:open,fold:1});assert.ok(closed.some(c=>c[0]==='drawImage'&&c[1]==='destination-in'),'trimmed back to the rail');
  assert.ok(!draw(world(.3)).some(c=>c[1]==='destination-in'),'no trim without an aperture');});
