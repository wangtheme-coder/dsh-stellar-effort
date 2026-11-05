import test from 'node:test';import assert from 'node:assert/strict';
import {CLASSICS,CLASSIC_STRIP,classicParallax,classicOffset,CLASSICS_GLSL} from '../src/render/classics.mjs';
import {parallax} from '../src/render/overdrive.mjs';
import {SPACE} from '../src/render/space.mjs';
test('a large set of classic sights, each a distinct kind, on a sky strip about three views long',()=>{assert.ok(CLASSICS.length>=18);assert.equal(new Set(CLASSICS.map(c=>c[0])).size,CLASSICS.length);assert.equal(new Set(CLASSICS.map(c=>c[6])).size,CLASSICS.length);assert.ok(CLASSIC_STRIP>=SPACE.width*3);
 for(const [name,x,y,s] of CLASSICS){assert.ok(x>=0&&x<CLASSIC_STRIP,name);assert.ok(y>=0&&y<=SPACE.height,name);}assert.ok(CLASSICS.filter(c=>Math.abs(c[2]-SPACE.centerY)<20).length>=2,'the rail is just a window: some sights cross it');});
test('neighbours on the strip leave room between them, so only a few are in view at once',()=>{const xs=CLASSICS.map(c=>c[1]).sort((a,b)=>a-b);for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>=70);const perView=CLASSICS.filter(c=>c[1]<SPACE.width).length;assert.ok(perView<=8);});
test('they drift with the voyage, slower than the near stars, and each opening starts somewhere else',()=>{for(const [, , , s] of CLASSICS){const k=classicParallax(s);assert.ok(k>=.3&&k<parallax(1)*.5);}const seq=[.1,.9,.5];let i=0;const offs=[0,0,0].map(()=>classicOffset(()=>seq[i++]));assert.ok(offs.every(o=>o>=0&&o<CLASSIC_STRIP));assert.equal(new Set(offs).size,3);assert.match(CLASSICS_GLSL,/mod\(g\.x-uDrift\*par-uSkyOffset\+m,2640\.\)-m/);});
test('dark sights (Horsehead, Pillars) absorb what lies behind them',()=>{assert.match(CLASSICS_GLSL,/ab=dark\*\.9/);assert.match(CLASSICS_GLSL,/ab=pil\*\.85/);assert.match(CLASSICS_GLSL,/col=col\*\(1\.-n\.a\)\+n\.rgb/);});
