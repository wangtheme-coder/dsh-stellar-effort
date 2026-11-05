import test from 'node:test';import assert from 'node:assert/strict';
import {Evolution} from '../src/render/evolution.mjs';
import {flyUniform,dustX,ENTRY_DUST,flyLensPoint,FLY_LENS,FLY_GLSL} from '../src/render/flythrough.mjs';
import {SPACE} from '../src/render/space.mjs';
test('High → Max: thin dust sweeps once across the view while space opens, then quiet Max has none',()=>{const e=new Evolution(2/3);e.begin(1);e.input(1);const seen=[];for(let t=0;t<3;t+=1/60){e.step(1/60);seen.push([e.phase,e.visual().entryDust]);}
  const live=seen.filter(([,d])=>d>0);assert.ok(live.length>20,'it plays');for(let i=1;i<seen.length;i++)assert.ok(seen[i][1]>=seen[i-1][1]-1e-9||seen[i][1]===0,'only moves forward');
  assert.ok(live.some(([p])=>p==='entry')&&live.some(([p])=>p==='decel'));assert.equal(seen.at(-1)[0],'settled');assert.equal(seen.at(-1)[1],0);
  assert.equal(new Evolution(1).visual().entryDust,0);assert.equal(flyUniform({flight:{drift:0}},1,true,.5)[2],0,'none with reduced motion');assert.equal(flyUniform({flight:{drift:0},elements:{nebulae:0}},1,false,.5)[2],0,'none with nebulae off');assert.equal(flyUniform({flight:{drift:0}},1,false,.5)[2],.5);
  for(const i of [0,1]){assert.ok(dustX(0,i)-ENTRY_DUST.size[i][0]>SPACE.width,'starts off to the right');assert.ok(dustX(1,i)+ENTRY_DUST.size[i][0]<0,'ends off to the left');}
  assert.ok(dustX(.5,1)<dustX(.5,0)+ENTRY_DUST.extra[1],'the near layer is faster');});
test('nebula lensing near the hole: only the seen detail shifts toward the hole, and only close to it',()=>{const k={x:571,y:190},near={x:601,y:190},far={x:571+FLY_LENS.reach[1]+1,y:190};
  assert.deepEqual(flyLensPoint(near,k,0),near);assert.deepEqual(flyLensPoint(far,k,1),far);const n=flyLensPoint(near,k,1);assert.ok(n.x<near.x&&Math.abs(n.y-190)<1e-9,'sampled closer to the hole');
  const mid=flyLensPoint({x:571+90,y:190},k,1);assert.ok(30-(near.x-n.x)>0&&(661-mid.x)<(near.x-n.x),'weaker further out');assert.match(FLY_GLSL,/vec2 flyLens\(vec2 p\)/);});
