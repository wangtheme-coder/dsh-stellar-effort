import test from 'node:test';import assert from 'node:assert/strict';
import {revealMask,burstRadius} from '../src/render/reveal.mjs';
import {LIMITS} from '../src/render/evolution.mjs';import {SPACE,worldPoint} from '../src/render/space.mjs';
import {validateConfig,DEFAULTS} from '../src/shared/config.mjs';
const h=worldPoint(LIMITS.boom,0),y=SPACE.centerY,corners=[[0,0],[SPACE.width,0],[0,SPACE.height],[SPACE.width,SPACE.height]];
test('the BOOM bursts out of the hole as a disc that grows to fill the whole world',()=>{assert.ok(revealMask(h.x,y,h.x,0)<.01);let last=0;for(const u of [.05,.15,.3,.5]){const r=burstRadius(u);assert.ok(r>last);last=r;assert.ok(revealMask(h.x,y-r*.5,h.x,u)>.99&&revealMask(h.x,y-r-5,h.x,u)<.01,'same reach in every direction');assert.ok(revealMask(h.x-r*.5,y,h.x,u)>.99&&revealMask(h.x+r+5,y,h.x,u)<.01);}for(const [x,yy] of corners)assert.equal(revealMask(x,yy,h.x,1),1);});
test('the retired comparison setting is dropped from old saved configs',()=>{assert.ok(!('revealStyle' in DEFAULTS));assert.ok(!('revealStyle' in validateConfig({revealStyle:'cone',speed:2})));assert.equal(validateConfig({revealStyle:'tear',speed:2}).speed,2);});
