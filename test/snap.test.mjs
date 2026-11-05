import test from 'node:test';import assert from 'node:assert/strict';
import {Snap,SNAP,knobScale} from '../src/render/snap.mjs';
import {KNOB} from '../src/render/hole.mjs';
test('while pressed the knob follows the pointer exactly; on release it eases onto the level without overshoot',()=>{const s=new Snap();let shown=null;for(const p of [.1,.25,.41])shown=s.step(shown,p,1/60,{follow:true});assert.equal(shown,.41);
  // released at .41: the controller picks Low (1/3); the knob eases back there.
  const path=[];for(let i=0;i<30;i++){shown=s.step(shown,1/3,1/60);path.push(shown);}
  for(let i=1;i<path.length;i++)assert.ok(path[i]<=path[i-1]+1e-12,'monotonic');assert.ok(path.every(v=>v>=1/3-1e-12),'no overshoot');
  const settled=path.findIndex(v=>Math.abs(v-1/3)<1e-9);assert.ok(settled>0&&settled*1000/60>=SNAP.ms-20&&settled*1000/60<=SNAP.ms+20,'settles in ~'+SNAP.ms+' ms');
  assert.ok(path[2]-1/3<(.41-1/3)*.8,'starts quickly (ease-out)');});
test('a new level mid-way restarts from where the knob is; reduced motion jumps',()=>{const s=new Snap();let v=s.step(0,0,1/60);for(let i=0;i<5;i++)v=s.step(v,1,1/60);const mid=v;v=s.step(v,2/3,1/60);assert.ok(Math.abs(v-mid)<.1,'no jump when the target changes');assert.equal(new Snap().step(.2,1,1/60,{reduced:true}),1);});
test('the knob grows a little while pressed and returns after',()=>{let k=1;for(let i=0;i<30;i++)k=knobScale(k,true,1/60);assert.ok(Math.abs(k-KNOB.pressed)<.003&&KNOB.pressed>1&&KNOB.pressed<=1.15);for(let i=0;i<30;i++)k=knobScale(k,false,1/60);assert.ok(Math.abs(k-1)<.003);assert.equal(knobScale(1,true,1/60,true),KNOB.pressed);});
