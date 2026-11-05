import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIMITS, KNOB_RANGE } from '../src/render/evolution.mjs';
import { KNOB } from '../src/render/hole.mjs';
import { OVERDRIVE } from '../src/render/overdrive.mjs';
import { SPACE, worldPoint, apertureFor, aperturePoint, insideAperture, screenInsets, apertureMask, layoutAperture, worldFadeMask, WORLD_FADE, viewportMask, HOLE_ENVELOPE, KNOB_WINDOW } from '../src/render/space.mjs';
import { Universe, projectStar } from '../src/render/universe.mjs';
import { HOLE } from '../src/render/hole.mjs';
import { DEFAULTS, validateConfig, importPreset, exportPreset, visualConfig } from '../src/shared/config.mjs';

test('maximum and minimum windows share a fixed rail origin and travel',()=>{
  assert.deepEqual(worldPoint(0,0),{x:SPACE.railX+16,y:SPACE.centerY});assert.deepEqual(worldPoint(1,0),{x:SPACE.railX+16+282,y:SPACE.centerY});
  for(const view of [apertureFor(),apertureFor({viewWidth:314,viewHeight:48})]){
    for(const p of [0,.5,1]){const at=aperturePoint(worldPoint(p,0),view);assert.equal(at.x,16+p*282+(view.width-314)/2);assert.equal(at.y,view.height/2);assert.ok(insideAperture(worldPoint(p,0),view));}
  }
});
test('changing the aperture only translates local coordinates, never distances or sizes',()=>{
  const w=new Universe({seed:17});w.awake=1;const a=projectStar(w.stars[8],w),b=projectStar(w.stars[9],w);
  for(let i=0;i<100;i++){const view=apertureFor({viewWidth:314+i%69,viewHeight:48+i%73});const av=aperturePoint(a,view),bv=aperturePoint(b,view);assert.ok(Math.abs(Math.hypot(av.x-bv.x,av.y-bv.y)-Math.hypot(a.x-b.x,a.y-b.y))<1e-10);assert.deepEqual(projectStar(w.stars[8],w),a);}
});
test('repeated layout does not mutate world, consume randomness, or change canvas logical size',()=>{
  const w=new Universe({seed:25}),before=structuredClone(w.stars),viewport={style:{}},canvas={style:{}};
  for(let i=0;i<100;i++)layoutAperture(viewport,canvas,{viewWidth:i%2?314:382,viewHeight:i%2?48:120});
  assert.deepEqual(w.stars,before);assert.equal(canvas.style.width,SPACE.width+'px');assert.equal(canvas.style.height,SPACE.height+'px');assert.equal(viewport.style.width,SPACE.width+'px');assert.ok(viewport.style.maskSize.startsWith('314px'),'the window, not the layer, is the viewport');
  assert.equal(w.random(),new Universe({seed:25}).random());
});
test('occluded universe evolves exactly like the full view through dragging and reversal',()=>{
  const a=new Universe({seed:31}),b=new Universe({seed:31});
  for(let i=0;i<360;i++){const input={position:.76+.24*Math.sin(i*.03)**2,pressed:i%90<50};a.step(1/60,input);apertureFor({viewWidth:i%2?314:382,viewHeight:48+i%73});b.step(1/60,input);}
  assert.deepEqual(a.stars,b.stars);assert.deepEqual(a.clouds,b.clouds);assert.deepEqual(a.meteors,b.meteors);assert.equal(a.time,b.time);
});
test('dwelling below High does not clear and reseed the whole sky',()=>{
  const w=new Universe({seed:18}),ids=w.stars.map(s=>s.id);
  for(let i=0;i<120;i++)w.step(1/60,{position:.3});
  assert.ok(ids.every(id=>w.stars.some(s=>s.id===id)));assert.ok(w.stars.length>=160);
  w.step(1/60,{position:1});assert.ok(w.stars.filter(s=>ids.includes(s.id)).length>140);
});
test('a meteor can cross the aperture boundary without changing its world trajectory',()=>{
  const w=new Universe({seed:8,config:{...DEFAULTS,gravity:0,activity:0}});w.meteors=[{id:10000,x:.4,y:1.2,vx:.03,vy:1,age:0,life:3,points:[],tone:.5}];const view=apertureFor({viewWidth:314,viewHeight:48});
  const meteor=w.meteors[0];assert.ok(insideAperture(worldPoint(meteor.x,meteor.y),view));
  for(let i=0;i<12;i++)w.step(1/60,{position:1});
  assert.equal(w.meteors[0],meteor);assert.ok(!insideAperture(worldPoint(meteor.x,meteor.y),view));assert.ok(insideAperture(worldPoint(meteor.x,meteor.y),apertureFor()));assert.ok(Math.abs(meteor.y-1.4)<1e-10);
});
test('screen clipping uses intersection and never recenters a scene',()=>{
  assert.deepEqual(screenInsets({left:-12,top:-8,width:382,height:120},350,100),{left:12,top:8,right:20,bottom:12});
  assert.ok(Math.abs(worldPoint(.8,0).x-(SPACE.railX+16+225.6))<1e-9);assert.equal(worldPoint(.8,0).y,SPACE.centerY);
});
test('all thumb centers and their 30px bodies remain in the minimum aperture',()=>{
  const v=apertureFor({viewWidth:314,viewHeight:48});for(const p of [0,.25,.5,.75,1]){const c=worldPoint(p,0);for(const dx of [-15,15])for(const dy of [-15,15])assert.ok(insideAperture({x:c.x+dx,y:c.y+dy},v));}
});
test('mask is optional, soft at the periphery and opaque over the control envelope',()=>{
  assert.equal(apertureMask(apertureFor({viewFeather:0})),'none');const svg=decodeURIComponent(apertureMask(apertureFor()).slice(0));assert.ok(svg.includes('width="314" height="44"'));assert.ok(svg.includes('stop-opacity="0"'));
});
test('old configs acquire maximum aperture defaults; import validates bounds',()=>{
  assert.equal(validateConfig({speed:2}).viewWidth,SPACE.width);assert.equal(validateConfig({viewWidth:382,viewHeight:120}).viewHeight,SPACE.height,'old maximum keeps meaning maximum');const cfg={...DEFAULTS,viewWidth:320,viewHeight:60,viewFeather:4};assert.deepEqual(importPreset(exportPreset('裁剪',cfg)).config,visualConfig(cfg));
  assert.throws(()=>validateConfig({viewWidth:313}));assert.throws(()=>validateConfig({viewHeight:SPACE.height+1}));assert.throws(()=>validateConfig({viewHeight:37}));assert.throws(()=>validateConfig({viewFeather:NaN}));assert.equal(apertureFor({viewWidth:NaN}).width,SPACE.width);
});
test('world edge fade is its own mask on the world canvas, identical for every viewport, and clear of the rail',()=>{
  const masks=new Set();for(const [w,h] of [[382,120],[314,48],[350,90]]){const viewport={style:{}},canvas={style:{}};layoutAperture(viewport,canvas,{viewWidth:w,viewHeight:h,viewFeather:8});masks.add(canvas.style.maskImage);assert.notEqual(canvas.style.maskImage,viewport.style.maskImage);}
  assert.equal(masks.size,1);assert.equal([...masks][0],worldFadeMask());const svg=decodeURIComponent(worldFadeMask());assert.ok(svg.includes('stop-opacity="0.000"')&&svg.includes('stop-opacity="1.000"'),'fades to fully transparent');
  assert.ok(WORLD_FADE.x<=SPACE.railX&&WORLD_FADE.y<=SPACE.centerY-SPACE.railHeight/2,'rail stays fully opaque');
});
test('a meteor outside a small viewport keeps flying in the world until its own life ends',()=>{
  const w=new Universe({seed:5,config:{...DEFAULTS,gravity:0}});w.position=1;w.awake=1;const m=w.meteor();Object.assign(m,{x:.4,y:1.2,vx:.03,vy:1,age:0,life:1.5});w.meteors=[m];
  const view=apertureFor({viewWidth:314,viewHeight:48});let outside=0;
  for(let i=0;i<60;i++){w.step(1/60,{position:1});if(!w.meteors.includes(m))break;if(!insideAperture(worldPoint(m.x,m.y),view))outside++;}
  assert.ok(w.meteors.includes(m),'still alive after crossing the viewport edge');assert.ok(outside>20);assert.ok(worldPoint(m.x,m.y).y<SPACE.height);
});
test('the world is larger than the rail: about half the stars live outside it and persist',()=>{
  const w=new Universe({seed:41}),outer=()=>w.stars.filter(s=>Math.abs(s.y)>.94);const before=outer().map(s=>s.id);
  assert.ok(before.length/w.stars.length>.4&&before.length/w.stars.length<.65,`outer ${before.length}/${w.stars.length}`);assert.ok(w.stars.every(s=>Math.abs(worldPoint(s.x,s.y).y-SPACE.centerY)<=SPACE.height/2));
  for(let i=0;i<120;i++)w.step(1/60,{position:1});assert.ok(before.filter(id=>w.stars.some(s=>s.id===id)).length>before.length*.9,'outer stars are not culled');
});
test('the knob and the black hole are never cropped by the viewport, at any scene size',()=>{const v=apertureFor({viewWidth:314,viewHeight:38,viewFeather:0}),m=viewportMask(v,KNOB_RANGE);
  // Every place the knob can be lies inside the still envelope's solid part.
  const ends=m.maskPosition.split(', ').slice(1,3).map(s=>parseFloat(s)+HOLE_ENVELOPE.rx),band=m.maskSize.split(', ')[3];
  for(const p of [0,1/3,LIMITS.collapse,1]){const x=worldPoint(p,0).x;assert.ok(x>=ends[0]&&x<=ends[1]+.01,String(p));}
  assert.ok(worldPoint(1,0).x+OVERDRIVE.px<=ends[1]+.01,'overdrive included');assert.equal(parseFloat(band),+(ends[1]-ends[0]).toFixed(1));
  assert.ok(HOLE_ENVELOPE.rx*.8>=HOLE.outer*KNOB.pressed+1&&HOLE_ENVELOPE.ry*.8>=26*KNOB.pressed,'solid part covers the pressed disk and lensed arc');
  assert.ok(KNOB_WINDOW*.8>=KNOB.radius*KNOB.pressed+1,'solid part of the knob window holds the pressed knob');assert.ok(KNOB_WINDOW<=HOLE_ENVELOPE.ry,'knob window inside the envelope');
  assert.ok(!viewportMask(apertureFor()).maskImage.includes('radial'),'no envelope without a range');});
test('the CSS mask never changes while the knob or the hole moves, nor when the view collapses (each change stalls the page for 200-300 ms on a real GPU)',()=>{const src=readFileSync(new URL('../src/render/engine.mjs',import.meta.url),'utf8');assert.doesNotMatch(src,/updateMask|viewportMask/);const at=src.indexOf('applyAperture(){'),body=src.slice(at,src.indexOf('\n',at));
  assert.match(body,/const open=this\.scene\.openConfig\?\?this\.world\.target,key=JSON\.stringify\(apertureFor\(open\)\);if\(key!==this\.maskKey\)\{this\.maskKey=key;this\.maskAperture=layoutAperture\(this\.viewport,this\.canvas,open,KNOB_RANGE\);\}/,'laid out for the open view, only when it changes');assert.doesNotMatch(body,/position|holeVisibility|compact/);
  assert.match(readFileSync(new URL('../src/ui.jsx',import.meta.url),'utf8'),/scene\.current\.openConfig=prefs\.config;/);});
test('the still CSS envelope times the per-frame trim gives back window plus a shape that follows the knob',async()=>{const {holeTrim,windowAlpha,envelopeAlpha,ellipseAlpha,knobShape}=await import('../src/render/space.mjs');const unite=(a,b)=>a+b-a*b;
  const compact={viewWidth:314,viewHeight:38,viewFeather:0};
  // [shown window, window the CSS mask holds]: open views, and the collapsed rail inside an open view's mask.
  for(const [cfg,maskCfg] of [[compact,compact],[{viewWidth:420,viewHeight:120,viewFeather:16},null],[{},null],[compact,{}],[compact,{viewWidth:420,viewHeight:120,viewFeather:16}]])for(const p of [0,.2,2/3,LIMITS.collapse,.85,1,1+OVERDRIVE.px/SPACE.travel])for(const vis of [0,.5,1]){const view=apertureFor(cfg),maskView=apertureFor(maskCfg??cfg),c=worldPoint(Math.min(p,1),0),knob={x:c.x+(p>1?OVERDRIVE.px:0),y:c.y,...knobShape(vis)};
    for(let x=KNOB_RANGE.from-55;x<=KNOB_RANGE.to+55;x+=7)for(let y=KNOB_RANGE.y-40;y<=KNOB_RANGE.y+40;y+=5){const q={x,y},css=unite(windowAlpha(q,maskView),envelopeAlpha(q,KNOB_RANGE)),want=unite(windowAlpha(q,view),ellipseAlpha(q,knob.x,knob.y,knob.rx,knob.ry));assert.ok(Math.abs(css*holeTrim(q,view,KNOB_RANGE,knob,maskView)-want)<1e-6,`${x},${y}`);}}
  const gl=readFileSync(new URL('../src/render/webgl.mjs',import.meta.url),'utf8');assert.ok(gl.indexOf('this.trimPass(')>gl.indexOf('this.fullscreen(this.holeProgram)'),'trim is the last pass');});
test('collapsing folds the window down to the rail in the renderer (no CSS fade over the masked view, which stalled ~250 ms)',async()=>{const {holeTrim,windowAlpha,envelopeAlpha,ellipseAlpha,knobShape,COMPACT_CONFIG}=await import('../src/render/space.mjs');const unite=(a,b)=>a+b-a*b;
  const open=apertureFor({}),compact=apertureFor(COMPACT_CONFIG);
  for(const fold of [0,.3,.7,1])for(const p of [0,1/3,1]){const c=worldPoint(p,0),knob={x:c.x,y:c.y,...knobShape(p>=LIMITS.collapse?1:0)};
    for(let x=10;x<SPACE.width;x+=23)for(let y=10;y<SPACE.height;y+=17){const q={x,y},css=unite(windowAlpha(q,open),envelopeAlpha(q,KNOB_RANGE)),shown=windowAlpha(q,open)*(1-fold)+windowAlpha(q,compact)*fold,want=unite(shown,ellipseAlpha(q,knob.x,knob.y,knob.rx,knob.ry));assert.ok(Math.abs(css*holeTrim(q,open,KNOB_RANGE,knob,open,fold)-want)<1e-6,`${fold} ${x},${y}`);}}
  const css=readFileSync(new URL('../src/styles.mjs',import.meta.url),'utf8'),ui=readFileSync(new URL('../src/ui.jsx',import.meta.url),'utf8');assert.doesNotMatch(css,/se-world-viewport[^{]*\{[^}]*transition:opacity/);assert.match(ui,/scene\.current\.closing=closing;/);
  assert.match(ui,/viewWidth:SPACE\.railWidth,viewHeight:SPACE\.railHeight,viewFeather:0/,'the dock collapses to COMPACT_CONFIG');assert.deepEqual({...COMPACT_CONFIG},{viewWidth:SPACE.railWidth,viewHeight:SPACE.railHeight,viewFeather:0});});
