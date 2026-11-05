import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.STELLAR_PLAYWRIGHT_MODULE?pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href:'playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'docs/p1.1');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1400,height:940},deviceScaleFactor:1});
const page=await context.newPage(),results=[],errors=[],blocked=[];
page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='127.0.0.1'&&url.protocol!=='data:'){blocked.push(url.origin);return route.abort();}return route.continue();});
async function check(name,fn){const detail=await fn();results.push({name,passed:true,...detail});console.log('PASS',name);}
const qa=fn=>page.evaluate(fn);
async function samePixels(a,b,region,regionB=region){return page.evaluate(async({a,b,region,regionB})=>{
  const decode=async s=>{const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0)),bmp=await createImageBitmap(new Blob([bytes],{type:'image/png'})),c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;const ctx=c.getContext('2d');ctx.drawImage(bmp,0,0);return {w:bmp.width,h:bmp.height,data:ctx.getImageData(0,0,bmp.width,bmp.height).data};};
  const x=await decode(a),y=await decode(b);if(x.w!==y.w||x.h!==y.h)throw Error('Screenshot geometry mismatch');let changed=0;const firstChanges=[];
  const r=region??{x:0,y:0,width:x.w,height:x.h},q=regionB??r;for(let j=0;j<r.height;j++)for(let i=0;i<r.width;i++){const at=((r.y+j)*x.w+r.x+i)*4,bt=((q.y+j)*y.w+q.x+i)*4;for(let k=0;k<4;k++)if(x.data[at+k]!==y.data[bt+k]){changed++;if(firstChanges.length<8)firstChanges.push({x:r.x+i,y:r.y+j,a:Array.from(x.data.slice(at,at+4)),b:Array.from(y.data.slice(bt,bt+4))});break;}}
  return {changedPixels:changed,checkedPixels:r.width*r.height,firstChanges};
},{a:a.toString('base64'),b:b.toString('base64'),region,regionB});}
try{
  await page.goto(new URL('/preview/space.html',process.env.STELLAR_PREVIEW_URL??'http://127.0.0.1:47833/').href);
  await page.waitForFunction(()=>window.__spaceQA);await qa(()=>window.__spaceQA.setPaused(true));
  const S=await qa(async()=>{const {SPACE}=await import('/src/render/space.mjs');return SPACE;});
  await check('WebGL uses the fixed world-size canvas at every aperture',async()=>{
    const modes=await qa(()=>window.__spaceQA.views.map(v=>({mode:v.renderer.mode,width:v.canvas.width,height:v.canvas.height,cssWidth:v.canvas.getBoundingClientRect().width})));
    assert.ok(modes.every(v=>v.mode==='WebGL2'&&v.width===S.width&&v.height===S.height&&v.cssWidth===S.width),JSON.stringify(modes));return {modes};
  });
  await check('same-frame full and restored views match pixel for pixel',async()=>{
    const a=await page.locator('#full .stage').screenshot(),b=await page.locator('#restore .stage').screenshot(),result=await samePixels(a,b);assert.equal(result.changedPixels,0);return result;
  });
  await check('cropped interior is identical to full universe, rather than scaled',async()=>{
    const a=await page.locator('#full .stage').screenshot(),b=await page.locator('#crop .stage').screenshot();
    const result=await samePixels(a,b,await qa(()=>window.__spaceQA.windowIn('full')),await qa(()=>window.__spaceQA.windowIn('crop')));assert.equal(result.changedPixels,0);return result;
  });
  await check('100 aperture changes preserve exact state, IDs, projection and canvas size',async()=>{
    const data=await qa(()=>{const q=window.__spaceQA,before=q.snapshot(),star=q.project();for(let i=0;i<100;i++)q.setView({viewWidth:i%2?314:860,viewHeight:i%2?48:380});return {same:q.snapshot()===before,starSame:JSON.stringify(q.project())===JSON.stringify(star),width:q.views[1].canvas.width};});assert.deepEqual(data,{same:true,starSame:true,width:S.width});return data;
  });
  await qa(()=>window.__spaceQA.setView({viewWidth:314,viewHeight:48,viewFeather:0}));
  await page.locator('.cards').screenshot({path:resolve(out,'same-universe-comparison.png')});
  await page.locator('#full').screenshot({path:resolve(out,'maximum.png')});await page.locator('#crop').screenshot({path:resolve(out,'cropped.png')});
  await qa(()=>window.__spaceQA.setView({viewWidth:860,viewHeight:380}));await page.locator('#crop').screenshot({path:resolve(out,'expanded.png')});
  await check('feather leaves the full rail visible and changes only the periphery',async()=>{
    const before=await qa(()=>window.__spaceQA.snapshot());await qa(()=>window.__spaceQA.setView({viewWidth:314,viewHeight:48,viewFeather:12}));
    // Exclude the one-pixel SVG antialias boundary of the opaque envelope.
    // P1.2 now has faint lensed-arc pixels there; their feathering is expected.
    // The hard-crop check above still compares the entire 44px region exactly.
    const a=await page.locator('#full .stage').screenshot(),b=await page.locator('#crop .stage').screenshot(),r=await samePixels(a,b,await qa(()=>window.__spaceQA.railIn('full')),await qa(()=>window.__spaceQA.railIn('crop')));assert.equal(r.changedPixels,0,JSON.stringify(r));assert.equal(await qa(()=>window.__spaceQA.snapshot()),before);
    await page.locator('.cards').screenshot({path:resolve(out,'soft-edge.png')});return r;
  });
  await check('a real simulated meteor crosses the cropped boundary, remains in the full view',async()=>{
    const data=await qa(async()=>{const q=window.__spaceQA,{worldPoint,insideAperture,apertureFor}=await import('/src/render/space.mjs');const id=q.meteor(),m=q.world.meteors.find(m=>m.id===id),start={...m},initial=insideAperture(worldPoint(m.x,m.y),apertureFor({viewWidth:314,viewHeight:48}));q.step(16);const at=worldPoint(m.x,m.y);return {sameId:q.world.meteors.includes(m),initial,inCrop:insideAperture(at,apertureFor({viewWidth:314,viewHeight:48})),inFull:insideAperture(at,apertureFor()),y:m.y,expected:start.y+16/60};});
    assert.equal(data.sameId,true);assert.equal(data.initial,true);assert.equal(data.inCrop,false);assert.equal(data.inFull,true);assert.ok(Math.abs(data.y-data.expected)<1e-9);await page.locator('.cards').screenshot({path:resolve(out,'meteor-boundary.png')});return data;
  });
  await check('soft mask measurably fades peripheral pixels, without a diagnostic outline',async()=>{
    await qa(()=>{const q=window.__spaceQA;for(const v of q.views)v.viewport.classList.remove('edge');q.setView({viewWidth:314,viewHeight:48,viewFeather:0});});
    const hard=await page.locator('#crop .stage').screenshot();await qa(()=>window.__spaceQA.setView({viewFeather:16}));const soft=await page.locator('#crop .stage').screenshot(),result=await samePixels(hard,soft);assert.ok(result.changedPixels>0);await qa(()=>{for(const v of window.__spaceQA.views)v.viewport.classList.add('edge');});return result;
  });
  await check('drag reversal and edge thumb retain fixed backing dimensions',async()=>{
    await page.getByLabel('连续视觉位置').fill('0.78');await qa(()=>window.__spaceQA.step(4));await page.getByLabel('连续视觉位置').fill('0.93');await qa(()=>window.__spaceQA.step(4));await page.getByLabel('连续视觉位置').fill('1');
    const data=await qa(()=>({p:window.__spaceQA.world.position,widths:window.__spaceQA.views.map(v=>v.canvas.width)}));assert.equal(data.p,1);assert.deepEqual(data.widths,[S.width,S.width,S.width]);await page.locator('.cards').screenshot({path:resolve(out,'thumb-boundary.png')});return data;
  });
  await check('hidden preview pauses with world identity and state preserved',async()=>{
    await qa(()=>{window.__spaceQA.setPaused(false);window.__spaceQA.hide(true);});const before=await qa(()=>window.__spaceQA.snapshot());await page.waitForTimeout(120);assert.equal(await qa(()=>window.__spaceQA.snapshot()),before);await qa(()=>{window.__spaceQA.setPaused(true);window.__spaceQA.hide(false);});assert.equal(await qa(()=>window.__spaceQA.snapshot()),before);
  });
  await check('actual RenderEngine closes and reopens the same scene without reseeding',async()=>{
    const data=await qa(async()=>{const {RenderEngine}=await import('/src/render/engine.mjs'),{DEFAULTS}=await import('/src/shared/config.mjs');const scene={},host=document.createElement('div');host.className='se-universe';host.style.cssText='position:fixed;left:50px;top:50px';document.body.appendChild(host);const options={scene,config:DEFAULTS,getInput:()=>({position:1,pressed:false,dark:true})};let engine=new RenderEngine(host,options);await new Promise(r=>setTimeout(r,80));const identity=scene.world,ticks=identity.ticks,ids=identity.stars.map(s=>s.id);engine.dispose();await new Promise(r=>setTimeout(r,80));const stopped=identity.ticks===ticks;engine=new RenderEngine(host,options);const same=scene.world===identity,idsSame=JSON.stringify(ids)===JSON.stringify(scene.world.stars.map(s=>s.id));engine.dispose();host.remove();return {stopped,same,idsSame};});assert.deepEqual(data,{stopped:true,same:true,idsSame:true});return data;
  });
  await check('Canvas fallback uses the same fixed geometry and crop invariants',async()=>{
    await qa(()=>window.__spaceQA.setView({viewFeather:0}));await page.getByText('切换 Canvas 对照',{exact:true}).click();const modes=await qa(()=>window.__spaceQA.views.map(v=>v.renderer.mode));assert.deepEqual(modes,['Canvas 2D','Canvas 2D','Canvas 2D']);
    const a=await page.locator('#full .stage').screenshot(),b=await page.locator('#crop .stage').screenshot(),r=await samePixels(a,b,await qa(()=>window.__spaceQA.windowIn('full')),await qa(()=>window.__spaceQA.windowIn('crop')));assert.equal(r.changedPixels,0);await page.locator('.cards').screenshot({path:resolve(out,'canvas-comparison.png')});return r;
  });
  await check('screen edge clips the aperture without moving world coordinates or intercepting input',async()=>{
    const data=await qa(async()=>{const {RenderEngine}=await import('/src/render/engine.mjs'),{DEFAULTS}=await import('/src/shared/config.mjs');const scene={},host=document.createElement('div');host.className='se-universe';host.style.cssText='position:fixed;left:0;top:0';document.body.appendChild(host);const engine=new RenderEngine(host,{scene,config:DEFAULTS,getInput:()=>({position:1})});await new Promise(r=>setTimeout(r,60));const style=engine.viewport.style,canvasWidth=engine.canvas.getBoundingClientRect().width,pointer=getComputedStyle(engine.viewport).pointerEvents;const result={clip:style.clipPath,width:canvasWidth,pointer};engine.dispose();host.remove();return result;});assert.ok(data.clip.endsWith(` ${S.railX}px)`),data.clip);assert.equal(data.width,S.width);assert.equal(data.pointer,'none');return data;
  });
  assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
  await writeFile(resolve(out,'space-qa.json'),JSON.stringify({time:new Date().toISOString(),browser:'system Edge headless',results,pageErrors:errors,blockedExternalRequests:blocked,modelRequests:0},null,2));console.log(JSON.stringify({passed:results.length,output:out}));
}finally{await browser.close();}
