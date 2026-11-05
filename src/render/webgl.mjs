import {FULL_DETAIL,cloudIntersectsClip} from './detail.mjs';
import {opticalProfile,pointSamples} from './optics.mjs';
import {recoveryAmount} from './recovery.mjs';
import {projectMeteor} from './meteor.mjs';
import {nebulaLayers,nebulaBackdrop,NEBULA_GLSL} from './nebula.mjs';
import {visualState,KNOB_RANGE} from './evolution.mjs';
import {REVEAL_GLSL} from './reveal.mjs';
import { projectStar } from './universe.mjs';
import { DEEP_SKY_GLSL, PASSER_SLOTS } from './deep-sky.mjs';
import { CLASSICS_GLSL, photoSprites } from './classics.mjs';
import { TEMPLATE_ATLAS, TEMPLATE_BAKE, TEMPLATE_BAKE_VERTEX, TEMPLATE_STRIDE, templateBakeVertices, templateSprites } from './templates.mjs';
import { PHOTO_ATLAS } from './photo-atlas.mjs';
import { FLY, FLY_GLSL, flyUniform } from './flythrough.mjs';
import { SWALLOW_GLSL, swallowPoint, swallowScale } from './implode.mjs';
import { ARCS_GLSL } from './arcs.mjs';
import { SPACE, VOID, REST, TRACK, worldPoint, TRIM_GLSL, HOLE_ENVELOPE, knobShape } from './space.mjs';
import { HOLE, HOLE_GLSL, holeState, KNOB } from './hole.mjs';

const vertex = `#version 300 es
in vec2 aPosition;
void main(){gl_Position=vec4(aPosition,0.,1.);}`;
const helpers = `
precision highp float;
uniform vec2 uSize;
uniform float uDpr,uPosition,uTime,uSpin,uBrightness,uGlow,uDepth,uWarp,uLens,uMinimal,uScifi,uAccretion,uHoleVisibility,uHoleMaturity,uCollapse,uBoom,uBoomProgress,uBackdrop,uRecovery,uUnfold,uContract,uHostDark;
uniform vec4 uPanel;uniform float uDrift,uTorn,uDisk;
// 1 outside the host popup panel (or when there is none), 0 inside it.
float outsidePanel(vec2 p){vec2 d=abs(p-uPanel.xy-uPanel.zw*.5)-uPanel.zw*.5;return smoothstep(-8.,2.,max(d.x,d.y));}
// Once the tear starts, our own popup panel is torn open with the space: inside
// it the sky follows the same rule as outside (the tear mask still applies).
float panelOut(vec2 p){return max(outsidePanel(p),uTorn);}
uniform vec3 uCore;
uniform vec2 uBoomOrigin;
uniform vec3 uTint,uTrack,uRim,uStyleTint;uniform vec2 uStyleTone;
out vec4 outColor;
vec2 pixel(){return vec2(gl_FragCoord.x/uDpr,uSize.y-gl_FragCoord.y/uDpr);}
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.;v+=.57*noise(p);p=p*2.1+17.;v+=.27*noise(p);p=p*2.03+9.;v+=.13*noise(p);return v;}
float track(vec2 p){vec2 q=abs(p-vec2(${SPACE.width/2}.,${SPACE.centerY}.))-vec2(${SPACE.railWidth/2-TRACK.radius}.,0.);return length(max(q,0.))+min(max(q.x,q.y),0.)-${TRACK.radius}.;}
float cx(){return ${SPACE.railX+SPACE.thumbInset}.+uPosition*${SPACE.travel}.;}
${REVEAL_GLSL}
${HOLE_GLSL}
${SWALLOW_GLSL}
`;
const background = `#version 300 es
${helpers}
// Deep sky beyond the popup: a procedural backdrop (dense faint stars, two star
// clusters, a dusty Milky Way band, a dozen galaxies of real kinds, faint
// emission gas and near passing stars, see deep-sky.mjs). It slides slowly with
// the voyage; the moving stars, dust and meteors are drawn on top of it.
float fieldStars(vec2 p,float cell,float density){vec2 g=floor(p/cell),f=fract(p/cell);float h=hash(g*.37+cell);if(h>density)return 0.;vec2 c=vec2(hash(g+3.1),hash(g+7.7))*.8+.1;vec2 d=(f-c)*cell;float tw=.8+.2*sin(uTime*(.5+h*1.7)+h*40.);return exp(-dot(d,d)*2.4)*(.2+.8*pow(hash(g+11.3),3.))*tw;}
${DEEP_SKY_GLSL}
${CLASSICS_GLSL}
vec4 deepSky(vec2 p){
 // The backdrop is the farthest layer: its stars slide only a little while sailing.
 float stars=fieldStars(p+vec2(uDrift*.008,0.),6.,.42)*.55+fieldStars(p+vec2(37.+uDrift*.016,11.),11.,.5)*.9+fieldStars(p+vec2(5.+uDrift*.03,71.),23.,.56)*1.4;
 vec3 col=vec3(.82,.86,1.)*stars;
 vec2 c1=vec2(${Math.round(SPACE.width*.12)}.,${Math.round(SPACE.height*.72)}.),c2=vec2(${Math.round(SPACE.width*.61)}.,${Math.round(SPACE.height*.18)}.);
 for(int i=0;i<2;i++){vec2 c=(i==0?c1:c2)-vec2(uDrift*.18,0.);c.x=mod(c.x+40.,${SPACE.width+80}.)-40.;float R=i==0?15.:11.;float w=exp(-dot(p-c,p-c)/(R*R));col+=vec3(1.,.93,.8)*(fieldStars(p,2.6,.75)*1.3*w+.07*w);}
 col+=galaxies(p)+milkyWay(p);
 col=nebulae(p,col);
 col+=sights(p);
 col=classics(p,col);
 float gas=smoothstep(.5,.85,fbm(p*.011+vec2(3.,7.)))*.5+smoothstep(.55,.9,fbm(p*.019+vec2(11.,2.)))*.3;
 col+=mix(vec3(.34,.16,.56),uTint*.5,.45)*gas*.22;
 col+=passers(p);
 return vec4(col,1.);}

void main(){vec2 p=pixel();vec2 k=vec2(cx(),uSize.y*.5);vec2 optical=2.*p-holeLens(p,k,uLens);float t=track(p),edge=1.-smoothstep(-.8,.4,t);
float deep=uBackdrop*unfoldMask(p);vec3 cosmos=vec3(.003,.007,.018)+vec3(.005,.007,.018)*fbm(optical*.038);
// One deep sky for the whole world, rail included (computed once per pixel).
vec3 universe=edge<.001||deep>.001?deepSky(swallow(p)).rgb+inflow(p):vec3(0.);
if(edge<.001){
 // Outside the capsule: once space has unfolded it continues past the rail and
 // thins out into the host (the world canvas fades to transparent at its edge).
 // Before that, only a little bound energy leaks around the knob.
 // No hard cut at the knob: unfolded space eases out over ~16px past it.
 float purple=smoothstep(.333333,.666667,uPosition),bound=smoothstep(.5,.666667,uPosition)*(1.-uBackdrop)*(1.-uContract)*purple;
 // Beyond the popup panel, unfolded space is an opaque night sky; only the
 // world mask fades its rim into the host. Over our own popup panel only a thin
 // halo hugs the rail, keeping labels clear (thinner on light hosts, where a
 // dark halo reads as a drop shadow).
 float out_=panelOut(p),a=deep*mix(mix(.35,.75,uHostDark)*(1.-smoothstep(0.,mix(5.,10.,uHostDark),t)),1.,out_),leak=bound*exp(-length(p-k)/18.)*.28*(1.-smoothstep(0.,14.,t))*(1.-a),total=a+leak;
 // With the panel torn away, only a faint outline of the rail remains, in the
 // host's own background tone (light hosts: near white; dark hosts: near black).
 float outline=uTorn*exp(-pow((t-.7)/.6,2.))*.5,glow=revealGlow(p)*.85*step(uSwallow,.001);
 if(total+outline+glow<.002)discard;
 vec3 sky=cosmos+universe*out_,base=total>.002?(sky*uBrightness*a+vec3(.34,.16,.56)*leak)/total:vec3(0.);
 // On light hosts the world's faded rim turns pale rather than grey: the colour
 // eases toward the host tone across the same band the world mask fades.
 float rim=1.-smoothstep(0.,1.,min(min(p.x,uSize.x-p.x)/${120}.,min(p.y,uSize.y-p.y)/${96}.));base=mix(base,vec3(.97,.97,.98),rim*(1.-uHostDark)*out_);
 float alpha=max(total,outline);vec3 shade=mix(base,mix(vec3(.97,.97,.98),vec3(.11,.12,.15),uHostDark),outline/max(alpha,.001));
 outColor=vec4(mix(shade,vec3(.86,.78,1.),glow/max(alpha+glow,.001)),min(1.,alpha+glow));return;}
// Once space has opened, the rail's own rim recedes: the container gives way.
vec3 col=mix(mix(vec3(${REST.light.join(",")}),vec3(${REST.dark.join(",")}),uHostDark),uTrack,smoothstep(0.,.6,uHoleVisibility))+uRim*exp(-pow((t+1.1)/.9,2.))*(1.-.65*deep);
if(p.x<=cx()){
 float purple=smoothstep(.333333,.666667,uPosition);
 // Collapse pulls the bound energy field into the core: a feature at distance
 // d is drawn at d/(1+3c), and the energy is used up as the pit forms.
 vec2 q=k+(p-k)*(1.+3.*uContract);float near=cx()-q.x,drain=1.-.9*uContract;
 // Approaching High, energy converges on the knob: brighter, faster, narrower.
 float gatherLevel=smoothstep(.5,.666667,uPosition)*(1.-uBackdrop),pull=gatherLevel*exp(-near/70.),squeeze=1.-.75*pull;
 float center=clamp(1.-abs(q.y-k.y)/${TRACK.radius}.,0.,1.),rail=clamp(1.-abs(p.y-k.y)/${TRACK.radius}.,0.,1.);
 vec3 blue=mix(vec3(.17,.45,.68),vec3(.54,.81,.96),rail);
 // Purple is bound energy around the core, not a lit tube: the fill itself
 // goes to a dim violet-black and light concentrates near the knob.
 float bind=exp(-near/55.),reach=.18+.82*bind;
 col=mix(blue,mix(vec3(.022,.012,.042),vec3(.06,.026,.10),rail),purple);
 col+=vec3(.30,.12,.50)*bind*(.3+.7*center)*purple*drain;
 float gather=exp(-pow((q.x-cx())/max(3.,45.-uCollapse*35.),2.));col+=vec3(.12,.05,.18)*gather*uCollapse*drain;col+=vec3(.16,.07,.26)*pull*(.6+.4*center)*purple*drain;
 float x=(q.x-${SPACE.railX}.)/${SPACE.railWidth}.;
 // Irregular arcs: amplitude and phase wander, brightness breaks up along x.
 float wander=.6+.4*sin(x*5.3+uTime*.9)*sin(x*2.1-uTime*.4);
 float ribbon=exp(-pow((q.y-k.y-(3.-uCollapse*2.5)*squeeze*wander*sin(x*13.-uTime*(.75+1.6*gatherLevel)))/1.5,2.));
 float silk=pow(.5+.5*sin(x*35.-uTime*(1.4+2.*gatherLevel)+q.y*.15),9.),broken=smoothstep(.35,.75,noise(vec2(x*18.-uTime*.8,q.y*.2)));
 col+=vec3(.24,.14,.4)*ribbon*purple*(.25+.35*silk+.45*pull)*reach*broken*drain;
 col+=vec3(.1,.16,.23)*exp(-pow((q.y-k.y-(5.-uCollapse*4.)*squeeze*sin(x*8.+uTime*.4))/1.1,2.))*purple*.25*reach*drain;
 vec2 dk=q-k;float rk=length(dk);
 float swirl=pow(.5+.5*sin(atan(dk.y,dk.x)*2.-rk*.32+uTime*(2.+3.*gatherLevel)),6.);
 col+=vec3(.20,.10,.34)*swirl*gatherLevel*exp(-pow((rk-17.)/7.,2.))*purple*drain;
 // The rail is only a window onto the same universe: once space has opened
 // it shows the very sky that lies around it, with nothing marking a seam.
 col=mix(col,cosmos+universe,deep);
 col+=vec3(.86,.78,1.)*revealGlow(p)*.9*step(uSwallow,.001);
 float ry=(2.8-uRecovery*1.8)*sin((p.x-cx())*.045-uTime*.55);
 float rl=exp(-pow((p.y-uSize.y*.5-ry)/.65,2.));
 col+=vec3(.55,.39,.8)*rl*uRecovery*(.035+.12*exp(-pow((p.x-cx())/72.,2.)));
 col*=uBrightness;
}else col=mix(col,(cosmos+universe)*uBrightness,deep);
outColor=vec4(col,edge);}`;
const dust = `#version 300 es
${helpers}
uniform vec4 uClouds[4];uniform vec4 uCloudKinds[4];
${NEBULA_GLSL}
void main(){vec2 p=pixel();if(cloudVisibility(p)<.5)discard;vec3 light=vec3(0.);float alpha=0.;vec2 sp=swallow(p);for(int i=0;i<4;i++){vec4 n=uClouds[i];if(n.w>.001){vec2 d=(sp-n.xy)/vec2(n.z,n.z*uCloudKinds[i].y);float a=cloudDensity(d,uCloudKinds[i])*n.w;light+=cloudColor(uCloudKinds[i].z)*a;alpha+=a;}}// On a light host nebulae stay inside the capsule; outside it they read as smudges.
alpha*=mix(1.-smoothstep(-1.,1.,track(p)),1.,panelOut(p));if(alpha<.00001)discard;outColor=vec4(light/alpha*uBrightness,min(1.,alpha));}`;
// Nebula flythrough sheets (flythrough.mjs): drawn twice per frame, the far
// body behind the stars and the near wisps in front of them (never over the
// hole, which is drawn last). Same panel rule as the dust.
const fly = `#version 300 es
${helpers}
${FLY_GLSL}
void main(){vec2 p=pixel();vec4 f=flythrough(swallow(flyLens(p)));f.a*=mix(1.-smoothstep(-1.,1.,track(p)),1.,panelOut(p));if(f.a<.002)discard;outColor=vec4(f.rgb*uBrightness,f.a);}`;
// Real photos of famous sights (classics.mjs, photos.mjs): flat sprites on the
// deep sky, drawn right after it, under the same rule as the deep sky (only
// where space has opened; beyond the panel, or inside the rail).
const photoVertex = `#version 300 es
precision highp float;in vec2 aXY;in vec2 aUV;uniform vec2 uSize;out vec2 vUV;
void main(){gl_Position=vec4(aXY/uSize*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);vUV=aUV;}`;
const photo = `#version 300 es
${helpers}
uniform sampler2D uAtlas;in vec2 vUV;
void main(){vec2 p=pixel();float edge=1.-smoothstep(-.8,.4,track(p)),out_=panelOut(p),vis=uBackdrop*unfoldMask(p)*mix(out_,1.,edge);
float rim=1.-smoothstep(0.,1.,min(min(p.x,uSize.x-p.x)/${120}.,min(p.y,uSize.y-p.y)/${96}.));vis*=1.-rim*(1.-uHostDark)*out_;
vec4 t=texture(uAtlas,vUV);float a=t.a*vis*.92;if(a<.002)discard;outColor=vec4(t.rgb*uBrightness,a);}`;
// One atlas image for every renderer on the page, decoded once.
let atlasImage=null;
function loadAtlas(){if(!atlasImage&&typeof Image!=='undefined'){atlasImage=new Image();atlasImage.src=PHOTO_ATLAS;}return atlasImage;}
const pointVertex = `#version 300 es
precision highp float;
in vec2 aXY;in float aRadius;in float aAlpha;in vec3 aColor;
uniform vec2 uSize;uniform float uDpr;
out float vAlpha;out vec3 vColor;
void main(){gl_Position=vec4(aXY/uSize*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);gl_PointSize=max(2.,aRadius*4.*uDpr);vAlpha=aAlpha;vColor=aColor;}`;
const points = `#version 300 es
${helpers}
in float vAlpha;in vec3 vColor;uniform float uSecondaryHalo;
${FLY_GLSL}
// Stars behind the flythrough cloud body are dimmed a little by its gas.
void main(){vec2 p=pixel();if(p.x>cx()-1.&&track(p)<1.&&uDepth<.05)discard;vec2 d=(gl_PointCoord-.5)*2.;float r=length(d);float a=exp(-r*r*9.);a+=exp(-r*r*2.)*.09*uGlow*uSecondaryHalo;a*=1.-.55*flythrough(p).a;outColor=vec4(vColor,min(1.,a*vAlpha));}`;
const lineVertex = `#version 300 es
precision highp float;in vec2 aXY;in vec4 aRGBA;uniform vec2 uSize;out vec4 vRGBA;
void main(){gl_Position=vec4(aXY/uSize*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);vRGBA=aRGBA;}`;
const lines = `#version 300 es
${helpers}
in vec4 vRGBA;void main(){outColor=vRGBA;}`;
const blackHole = `#version 300 es
${helpers}
// uKnob: the knob (and hole) grows a little while pressed (snap.mjs).
uniform float uKnob;
${ARCS_GLSL}
void main(){vec2 d=(pixel()-vec2(cx(),uSize.y*.5)-knobShake())/(uKnob*knobWobble());if(abs(d.x)>${HOLE.halfWidth}.||abs(d.y)>${HOLE.halfHeight}.)discard;vec4 shaded=holeSample(d,uHoleVisibility,uHoleMaturity,uSpin,uGlow,uBrightness,uCore,uDisk);if(max(max(shaded.r,shaded.g),shaded.b)>.002){float lum=dot(shaded.rgb,vec3(.2126,.7152,.0722));shaded.rgb=clamp(mix(vec3(lum),shaded.rgb,uStyleTone.x)*uStyleTone.y*uStyleTint,0.,1.);}
// Lightning of the charged knob, added as light over it and the track.
vec3 arc=knobArcs(d,${KNOB.radius}.)*uBrightness;float aa=clamp(max(max(arc.r,arc.g),arc.b),0.,1.),a=max(shaded.a,aa);if(a<.002)discard;outColor=vec4(min((shaded.rgb*shaded.a+arc)/a,vec3(1.)),a);}`;

// Last pass: trims the still CSS knob envelope back to the window plus a shape
// that follows the knob and hole (space.mjs, holeTrim), by scaling what is
// already drawn (premultiplied) by the trim factor.
const trim = `#version 300 es
${helpers}
${TRIM_GLSL}
void main(){float f=holeTrim(pixel());if(f>.999)discard;outColor=vec4(0.,0.,0.,f);}`;
function compile(gl, type, source) {
  const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw Error(error); }
  return shader;
}
function program(gl, vs, fs) {
  const p = gl.createProgram(), v = compile(gl, gl.VERTEX_SHADER, vs), f = compile(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); gl.deleteShader(v); gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { const e = gl.getProgramInfoLog(p); gl.deleteProgram(p); throw Error(e); }
  return p;
}
export class WebGLRenderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!gl) throw Error('webgl2-unavailable'); this.gl = gl; this.canvas = canvas; this.mode = 'WebGL2';
    this.background = program(gl, vertex, background);this.dustProgram=program(gl,vertex,dust); this.starProgram = program(gl, pointVertex, points); this.lineProgram = program(gl, lineVertex, lines); this.holeProgram = program(gl, vertex, blackHole);this.flyProgram=program(gl,vertex,fly);this.flyValue=[0,0,0,0];this.photoProgram=program(gl,photoVertex,photo);this.templateTexture=null;this.trimProgram=program(gl,vertex,trim);this.photoBuffer=gl.createBuffer();this.photoTexture=null;this.atlas=loadAtlas();
    this.quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    this.starBuffer = gl.createBuffer(); this.lineBuffer = gl.createBuffer(); gl.enable(gl.BLEND);
  }
  uniforms(p, world, w, h, dpr, dark) {
    const gl = this.gl; gl.useProgram(p);
    const one = (name, value) => { const u = gl.getUniformLocation(p, name); if (u !== null) gl.uniform1f(u, value); };
    gl.uniform2f(gl.getUniformLocation(p, 'uSize'), w, h);
    one('uCloudOctaves',this.detail?.cloudOctaves??3);one('uSecondaryHalo',this.detail?.halo??1);one('uDpr', dpr); one('uPosition', world.position);one('uDrift',world.flight?.drift??0);one('uSkyOffset',world.skyOffset??0);one('uKnob',world.knobScale??1);{const v=visualState(world);one('uSwallow',this.reduced?0:v.swallow??0);one('uCharge',v.charge??0);}one('uCalm',this.reduced?1:0);one('uPhotos',this.photosOn?1:0); one('uTime', world.time); one('uSpin', world.spinTime);
    const look=opticalProfile(world);one('uBrightness',world.config.brightness);one('uGlow',world.config.glow*look.halo);const styleTone=gl.getUniformLocation(p,'uStyleTone');if(styleTone!==null)gl.uniform2f(styleTone,look.saturation,look.gain);const styleTint=gl.getUniformLocation(p,'uStyleTint');if(styleTint!==null)gl.uniform3fv(styleTint,look.tint);
    const t = Math.max(0, Math.min(1, (world.position - 2/3) / (.96-2/3))); this.depth = t*t*(3-2*t);
    const visual=visualState(world);this.depth=visual.spaceReveal;one('uCollapse',visual.collapseAmount);one('uBoom',visual.boomEnvelope);one('uBoomProgress',visual.boomProgress);one('uUnfold',visual.unfold??1);const origin=world.evolution?.origin??worldPoint(world.position,0);gl.uniform2f(gl.getUniformLocation(p,'uBoomOrigin'),origin.x,origin.y);const hole={visibility:visual.holeVisibility,maturity:visual.holeMaturity};one('uHoleVisibility',hole.visibility);one('uHoleMaturity',hole.maturity);one('uContract',visual.contract??0);one('uTorn',this.compact?0:Math.min(1,(visual.unfold??1)/.04));one('uDisk',world.diskSize??1);one('uHostDark',dark?1:0);const panel=gl.getUniformLocation(p,'uPanel');if(panel!==null){const q=this.panel??[-1e5,-1e5,1,1];gl.uniform4f(panel,q[0],q[1],q[2],q[3]);}const core=gl.getUniformLocation(p,'uCore');if(core!==null)gl.uniform3f(core,visual.coreFlare??0,visual.corePit??1,visual.diskForm??1);
    one('uRecovery',recoveryAmount(world,this.reduced));one('uBackdrop',nebulaBackdrop(world));one('uDepth', this.depth); one('uWarp', world.warp); one('uLens', world.elements.lens * world.config.lensStrength * hole.visibility);one('uAccretion',world.accretion);
    one('uMinimal',world.styleMix.minimal);one('uScifi',world.styleMix.scifi);
    const tint = gl.getUniformLocation(p, 'uTint'); if (tint !== null) gl.uniform3fv(tint, world.palette);
    const ps=gl.getUniformLocation(p,'uPassers');if(ps!==null){const list=world.passers??[],v=new Float32Array(PASSER_SLOTS*4),tint=new Float32Array(PASSER_SLOTS*3);list.slice(0,PASSER_SLOTS).forEach((s,i)=>{v.set([s.x,s.y,s.radius,s.alpha],i*4);tint.set(s.tint,i*3);});gl.uniform4fv(ps,v);gl.uniform3fv(gl.getUniformLocation(p,'uPasserTint'),tint);}
    const flyAt=gl.getUniformLocation(p,'uFly');if(flyAt!==null)gl.uniform4fv(flyAt,this.flyValue);
    const track = gl.getUniformLocation(p, 'uTrack'); if (track !== null) gl.uniform3fv(track, VOID.rgb);const rim=gl.getUniformLocation(p,'uRim');if(rim!==null)gl.uniform3fv(rim,VOID.rim);
  }
  fullscreen(p) {
    const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.quad); const at = gl.getAttribLocation(p, 'aPosition'); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  draw(world, { dpr, dark, reduced,detail=FULL_DETAIL,clip,panel=null,compact=false,aperture=null,maskAperture=null,fold=0 }) {this.panel=panel;this.compact=compact;
    const { width, height } = SPACE;this.reduced=reduced;this.detail=detail;{const v=visualState(world);this.flyValue=flyUniform(world,v.spaceReveal,reduced,v.entryDust??0);}this.photosOn=detail.photos!==false&&!!this.photoAtlas();
    const gl = this.gl; if (gl.isContextLost()) throw Error('context-lost');
    gl.viewport(0,0,this.canvas.width,this.canvas.height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    this.uniforms(this.background, world, width, height, dpr, dark);
    this.fullscreen(this.background);
    // The many far objects (templates.mjs), then the photos of the famous ones.
    if(detail.photos!==false&&this.templateAtlas())this.spritePass(world,width,height,dpr,dark,templateSprites(world.flight?.drift??0,world.skyOffset??0),this.templateTexture);
    if(this.photosOn)this.spritePass(world,width,height,dpr,dark,photoSprites(world.flight?.drift??0,world.skyOffset??0),this.photoTexture);
    this.uniforms(this.dustProgram,world,width,height,dpr,dark);
    const clouds=nebulaLayers(world,reduced,detail);
    for(let i=0;i<4;i++) {
      const n=clouds[i];const alpha=n&&cloudIntersectsClip(n,clip)?n.alpha:0;
      gl.uniform4f(gl.getUniformLocation(this.dustProgram,`uClouds[${i}]`),n?.x??0,n?.y??0,n?.radius??12,alpha);
      gl.uniform4f(gl.getUniformLocation(this.dustProgram,`uCloudKinds[${i}]`),n?.seed??0,n?.aspect??.3,n?.tone??0,n?.twist??0);
    }
    this.fullscreen(this.dustProgram);
    this.flyPass(world,width,height,dpr,dark,0,FLY.split);
    const stars=[],lineData=[],look=opticalProfile(world);
    for(const star of world.stars) {
      const s=projectStar(star,world,reduced,clouds,look);
      if(s.alpha<.002)continue;
      for(const p of pointSamples(s.x,s.y,s.softening))stars.push(p.x,p.y,s.size,s.alpha*p.weight,...s.tone);
      if(s.trailLength>.03&&!reduced){const len=s.trailLength;lineData.push(s.x-s.trailX*len,s.y-s.trailY*len,...s.tone,0,s.x,s.y,...s.tone,s.alpha*.12);}
    }
    for(const m of world.meteors){const v=projectMeteor(m,world,reduced);if(v.alpha<.001)continue;for(const p of pointSamples(v.head.x,v.head.y,v.softening))stars.push(p.x,p.y,v.radius,v.alpha*p.weight,...v.tone);stars.push(v.head.x,v.head.y,v.radius*2.6,v.alpha*.22,...v.tone);for(let j=1;j<v.points.length;j++){const a=v.points[j-1],b=v.points[j],aa=v.alpha*.55*(1-(j-1)/(v.points.length-1)),bb=v.alpha*.55*(1-j/(v.points.length-1));lineData.push(a.x,a.y,...v.tone,aa,b.x,b.y,...v.tone,bb);}}
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE);
    if(stars.length){this.uniforms(this.starProgram,world,width,height,dpr,dark);gl.uniform2f(gl.getUniformLocation(this.starProgram,'uFlyRange'),0,FLY.split);gl.bindBuffer(gl.ARRAY_BUFFER,this.starBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(stars),gl.DYNAMIC_DRAW);
      for(const [name,size,offset]of[['aXY',2,0],['aRadius',1,2],['aAlpha',1,3],['aColor',3,4]]){const a=gl.getAttribLocation(this.starProgram,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,28,offset*4);}gl.drawArrays(gl.POINTS,0,stars.length/7);}
    if(lineData.length){this.uniforms(this.lineProgram,world,width,height,dpr,dark);gl.bindBuffer(gl.ARRAY_BUFFER,this.lineBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lineData),gl.DYNAMIC_DRAW);
      for(const[name,size,offset]of[['aXY',2,0],['aRGBA',4,2]]){const a=gl.getAttribLocation(this.lineProgram,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,24,offset*4);}gl.drawArrays(gl.LINES,0,lineData.length/6);}
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    this.flyPass(world,width,height,dpr,dark,FLY.split,99);
    const center=worldPoint(world.position,0);gl.enable(gl.SCISSOR_TEST);
    const hw=HOLE.halfWidth*KNOB.pressed,hh=HOLE.halfHeight*KNOB.pressed;gl.scissor(Math.floor((center.x-hw)*dpr),Math.floor((height-center.y-hh)*dpr),Math.ceil(hw*2*dpr)+1,Math.ceil(hh*2*dpr)+1);
    this.uniforms(this.holeProgram,world,width,height,dpr,dark);this.fullscreen(this.holeProgram);gl.disable(gl.SCISSOR_TEST);
    if(aperture)this.trimPass(world,width,height,dpr,dark,aperture,maskAperture??aperture,fold);
    // Wait for the whole frame on the GPU. Without it, Chromium on ANGLE/D3D11 at
    // times composited the canvas before the later passes (near nebula sheets,
    // trim) had run: a one-frame flash of a different-looking nebula. flush()
    // made it rarer but not gone; the frame is light, so the wait is short.
    gl.finish();
  }
  // The atlas texture, once its image has decoded (null until then).
  photoAtlas(){if(this.photoTexture)return this.photoTexture;const img=this.atlas;if(!img?.complete||!img.naturalWidth)return null;const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return this.photoTexture=t;}
  // Paint the template atlas once (it lives as long as this context).
  templateAtlas(){if(this.templateTexture)return this.templateTexture;const gl=this.gl,{width:w,height:h}=TEMPLATE_ATLAS,t=gl.createTexture(),fb=gl.createFramebuffer(),p=program(gl,TEMPLATE_BAKE_VERTEX,TEMPLATE_BAKE),buffer=gl.createBuffer();
    gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.viewport(0,0,w,h);gl.clearColor(.5,.5,.5,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.disable(gl.BLEND);
    gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const data=templateBakeVertices();gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const used=[];for(const[name,size,offset]of[['aXY',2,0],['aW',2,2],['aA',4,4],['aB',4,8]]){const a=gl.getAttribLocation(p,name);if(a<0)continue;used.push(a);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,TEMPLATE_STRIDE*4,offset*4);}gl.drawArrays(gl.TRIANGLES,0,data.length/TEMPLATE_STRIDE);
    for(const a of used)gl.disableVertexAttribArray(a);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.deleteFramebuffer(fb);gl.deleteBuffer(buffer);gl.deleteProgram(p);gl.enable(gl.BLEND);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);
    gl.bindTexture(gl.TEXTURE_2D,t);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return this.templateTexture=t;}
  spritePass(world,width,height,dpr,dark,sprites,texture){if(!sprites.length)return;const gl=this.gl,data=[];
    const pull=this.reduced?0:visualState(world).swallow??0,knob=worldPoint(world.position,0),shrink=swallowScale(pull);
    for(const s0 of sprites){const at=swallowPoint({x:s0.x,y:s0.y},knob,pull),s={...s0,x:at.x,y:at.y,hw:s0.hw*shrink,hh:s0.hh*shrink};const[l,t,r,b]=[s.x-s.hw,s.y-s.hh,s.x+s.hw,s.y+s.hh],[u0,v0,u1,v1]=s.uv;data.push(l,t,u0,v0,r,t,u1,v0,l,b,u0,v1,l,b,u0,v1,r,t,u1,v0,r,b,u1,v1);}
    this.uniforms(this.photoProgram,world,width,height,dpr,dark);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(gl.getUniformLocation(this.photoProgram,'uAtlas'),0);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.photoBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);
    for(const[name,offset]of[['aXY',0],['aUV',2]]){const a=gl.getAttribLocation(this.photoProgram,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,16,offset*4);}gl.drawArrays(gl.TRIANGLES,0,data.length/4);}
  trimPass(world,width,height,dpr,dark,aperture,maskAperture,fold=0){const gl=this.gl,same=fold<=0&&['x','y','width','height','feather'].every(k=>aperture[k]===maskAperture[k]),{rx,ry}=HOLE_ENVELOPE,r=KNOB_RANGE,knob=worldPoint(world.position,0),shape=knobShape(visualState(world).holeVisibility);
    // Same window as the CSS mask: only the envelope can need trimming. Collapsed or folding: the whole canvas.
    if(same){gl.enable(gl.SCISSOR_TEST);gl.scissor(Math.floor((r.from-rx)*dpr),Math.floor((height-r.y-ry)*dpr),Math.ceil((r.to-r.from+2*rx)*dpr)+1,Math.ceil(2*ry*dpr)+1);}
    this.uniforms(this.trimProgram,world,width,height,dpr,dark);const p=this.trimProgram;gl.uniform4f(gl.getUniformLocation(p,'uView'),aperture.x,aperture.y,aperture.width,aperture.height);gl.uniform1f(gl.getUniformLocation(p,'uFeather'),aperture.feather??0);gl.uniform4f(gl.getUniformLocation(p,'uMaskView'),maskAperture.x,maskAperture.y,maskAperture.width,maskAperture.height);gl.uniform1f(gl.getUniformLocation(p,'uMaskFeather'),maskAperture.feather??0);gl.uniform1f(gl.getUniformLocation(p,'uFold'),fold);gl.uniform3f(gl.getUniformLocation(p,'uRange'),r.from,r.to,r.y);gl.uniform4f(gl.getUniformLocation(p,'uKnobAt'),knob.x,knob.y,shape.rx,shape.ry);
    gl.blendFuncSeparate(gl.ZERO,gl.SRC_ALPHA,gl.ZERO,gl.SRC_ALPHA);this.fullscreen(p);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.SCISSOR_TEST);}
  flyPass(world,width,height,dpr,dark,zMin,zMax){if(!(this.flyValue[3]>0||(this.flyValue[2]>0&&zMax>FLY.speeds.at(-1))))return;const gl=this.gl;this.uniforms(this.flyProgram,world,width,height,dpr,dark);gl.uniform2f(gl.getUniformLocation(this.flyProgram,'uFlyRange'),zMin,zMax);this.fullscreen(this.flyProgram);}
  dispose(){const gl=this.gl;for(const p of[this.background,this.dustProgram,this.starProgram,this.lineProgram,this.holeProgram,this.flyProgram,this.photoProgram,this.trimProgram])gl.deleteProgram(p);for(const b of[this.quad,this.starBuffer,this.lineBuffer,this.photoBuffer])gl.deleteBuffer(b);if(this.photoTexture)gl.deleteTexture(this.photoTexture);if(this.templateTexture)gl.deleteTexture(this.templateTexture);gl.getExtension('WEBGL_lose_context')?.loseContext();}
}





