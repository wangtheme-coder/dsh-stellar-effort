import { clamp, smooth } from '../shared/mapping.mjs';
import { LIMITS } from './limits.mjs';

// One logical geometry for WebGL, Canvas and static recovery. These are
// artistic image-plane approximations, not a physical ray-tracing solver.
// The knob before the hole forms: a pearl wider than the track (TRACK.radius 15)
// so it covers the track; it grows a little while pressed or dragged.
export const KNOB = Object.freeze({ radius: 19, pressed: 1.1, shadow: 5 });
export const HOLE = Object.freeze({ radius:15.5, inner:18, outer:33, inclination:.28, tilt:.10, halfWidth:38, halfHeight:32 });
export function holeState(position) {
  return { visibility:smooth(LIMITS.collapse-.011,LIMITS.collapse+.005,position), maturity:smooth(LIMITS.collapse+.007,1,position), radius:HOLE.radius };
}
export function angularSpeed(radius) { return clamp(3.1*Math.pow(HOLE.inner/Math.max(HOLE.inner,radius),1.5),.85,3.1); }
export function materialPhase(angle,radius,time) { return angle-time*angularSpeed(radius); }
export function lensPoint(point,center,strength=1) {
  const dx=point.x-center.x,dy=point.y-center.y,r=Math.hypot(dx,dy);
  const weight=(1-smooth(32,42,r))*Math.exp(-Math.pow((r-20)/7,2));
  const shift=weight*clamp(strength)*2.2;
  return {x:point.x+dx/(r+1)*shift,y:point.y+dy/(r+1)*shift};
}
const mix=(a,b,t)=>a+(b-a)*t;
function grain(x,y) {
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const hash=(a,b)=>{const n=((a*37+b*157)%251+251)%251;return ((n*n*13+n*17)%251)/251;};
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return mix(mix(hash(ix,iy),hash(ix+1,iy),u),mix(hash(ix,iy+1),hash(ix+1,iy+1),u),v);
}
// Low-frequency structure only: at a ~30px knob, pixel-scale grain reads as
// noise. Concentric bands, a slow clump field and a two-armed streak.
function pattern(radius,phase) {
  const bands=.5+.5*Math.cos(radius*.8+.8*Math.sin(phase+radius*.12));
  const clump=grain(Math.cos(phase)*1.7+radius*.11,Math.sin(phase)*1.7+3);
  const streak=.5+.5*Math.sin(2*phase+radius*.35);
  return .2+.4*bands*(.5+.5*clump)+.25*streak*clump+.15*clump;
}
// Pure differential advection winds the disk into ever finer spirals (pixel
// noise after a minute of spin). Two copies each carry at most SHEAR_CYCLE of
// differential shear and cross-fade with staggered resets: inner matter still
// visibly outruns outer matter, but the winding never accumulates.
export const SHEAR_CYCLE=2;
export function material(radius,angle,time) {
  const base=angularSpeed(HOLE.outer),shear=angularSpeed(radius)-base,local=((time%SHEAR_CYCLE)+SHEAR_CYCLE)%SHEAR_CYCLE;
  const other=(local+SHEAR_CYCLE/2)%SHEAR_CYCLE,weight=1-Math.abs(2*local/SHEAR_CYCLE-1);
  const at=age=>pattern(radius,angle-time*base-shear*age);
  return weight*at(local)+(1-weight)*at(other);
}
function warm(radius) {
  const t=smooth(18,33,radius);
  return [mix(1,.72,t),mix(.91,.32,t),mix(.69,.09,t)];
}
// Collapse controls (defaults = formed hole): flare tightens the white core and
// adds glare, pit is the dark centre's radius fraction, form builds the disk.
export function sampleHole(x,y,{visibility=1,maturity=1,spin=0,glow=.6,brightness=.85,flare=0,pit=1,form=1,size=1}={}) {
  const r=Math.hypot(x,y),R=HOLE.radius,Re=Math.max(.5,R*pit),pr=KNOB.radius*(1-.3*flare);
  if(Math.abs(x)>HOLE.halfWidth||Math.abs(y)>HOLE.halfHeight)return [0,0,0,0];
  const shadow=(1-smooth(Re-.25,Re+.3,r))*smooth(0,.06,pit),planeY=y+x*HOLE.tilt;
  const rho=Math.hypot(x,planeY/HOLE.inclination),angle=Math.atan2(planeY/HOLE.inclination,x);
  // size (0–1) grows the disk outward from the shadow to its full extent.
  const outer=20.5+(HOLE.outer-20.5)*size,envelope=smooth(17.8,19,rho)*(1-smooth(outer-5*size-.8,outer,rho));
  const building=.34+.66*maturity,asym=clamp(.85-.5*x/Math.max(rho,1),.4,1.4);
  const disk=envelope*material(rho,angle,spin)*building*asym*1.65*form;
  const near=smooth(-.2,.9,planeY),discVisible=disk*((1-near)*(1-shadow)+near);
  const arcR=Math.hypot(x,(y+1.2)*1.07),arcAngle=Math.atan2(-(y+1.2),x);
  const arcEnvelope=Math.exp(-Math.pow((arcR-19.1)/(.7+.95*size),2))*(1-smooth(-2,1,y))*(1-smooth(12+11*size,16+13*size,Math.abs(x)));
  const arc=arcEnvelope*material(20+Math.abs(x)*.12,arcAngle,spin)*building*(.9-.25*x/27)*1.18*(1-shadow)*form;
  const rim=Math.exp(-Math.pow((r-Re-.28)/.32,2))*(.035+.10*Math.pow(Math.max(0,-x/Math.max(r,1)),3))*(.6+glow*.4)*(1-shadow)*pit;
  const plain=1-smooth(pr-.5,pr+.5,r),ember=plain*(1-shadow)*(1-pit),pearl=[1,1,1];
  const color=warm(rho),arcColor=warm(20+Math.abs(x)*.12);
  const radiance=color.map((v,i)=>v*discVisible+arcColor[i]*arc+[1,.82,.54][i]*rim+pearl[i]*ember);
  const a=Math.max(shadow,clamp(Math.max(...radiance)));
  const base=plain*(1-visibility)+a*visibility,gr=Math.max(pr,Re*smooth(0,.06,pit)+.8),glare=flare*.55*Math.exp(-Math.pow((r-gr)/3.2,2))*smooth(gr-1,gr+1,r)*(1-base);
  // A soft drop shadow lifts the knob off the track (it shows on light hosts).
  const drop=(1-visibility)*(1-smooth(pr,pr+KNOB.shadow,r))*smooth(pr-1,pr+.5,r)*.2*(1-base-glare),alpha=base+glare+drop;
  if(alpha<.0001)return [0,0,0,0];
  // The pearl is pure white whatever the brightness setting (that is for the space).
  return [...radiance.map((v,i)=>clamp((pearl[i]*plain*(1-visibility)+((v+.00015*shadow)*visibility+[.88,.84,1][i]*glare)*brightness)/alpha)),alpha];
}

// Same constants and expressions as sampleHole. GPU/CPU parity is checked at
// sampled pixels; the shader never rotates the image-plane geometry.
export const HOLE_GLSL = `
float holeSpeed(float radius){return clamp(3.1*pow(18./max(18.,radius),1.5),.85,3.1);}
float holeHash(vec2 p){float n=mod(p.x*37.+p.y*157.,251.);return mod(n*n*13.+n*17.,251.)/251.;}
float holeGrain(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(holeHash(i),holeHash(i+vec2(1,0)),f.x),mix(holeHash(i+vec2(0,1)),holeHash(i+vec2(1)),f.x),f.y);}
float holePattern(float radius,float phase){
 float bands=.5+.5*cos(radius*.8+.8*sin(phase+radius*.12));
 float clump=holeGrain(vec2(cos(phase)*1.7+radius*.11,sin(phase)*1.7+3.));
 float streak=.5+.5*sin(2.*phase+radius*.35);
 return .2+.4*bands*(.5+.5*clump)+.25*streak*clump+.15*clump;
}
float holeMaterial(float radius,float angle,float time){
 float C=${SHEAR_CYCLE}.,base=holeSpeed(${HOLE.outer}.),shear=holeSpeed(radius)-base,local=mod(time,C),other=mod(local+C*.5,C),weight=1.-abs(2.*local/C-1.);
 return weight*holePattern(radius,angle-time*base-shear*local)+(1.-weight)*holePattern(radius,angle-time*base-shear*other);
}
vec3 holeWarm(float radius){return mix(vec3(1.,.91,.69),vec3(.72,.32,.09),smoothstep(18.,33.,radius));}
vec2 holeLens(vec2 point,vec2 center,float strength){vec2 d=point-center;float r=length(d);float weight=(1.-smoothstep(32.,42.,r))*exp(-pow((r-20.)/7.,2.));return point+d/(r+1.)*weight*clamp(strength,0.,1.)*2.2;}
vec4 holeSample(vec2 d,float visibility,float maturity,float spin,float glow,float brightness,vec3 core,float size){
 float x=d.x,y=d.y,r=length(d),R=${HOLE.radius},flare=core.x,pit=core.y,form=core.z,Re=max(.5,R*pit),pr=${KNOB.radius}.*(1.-.3*flare);
 float shadow=(1.-smoothstep(Re-.25,Re+.3,r))*smoothstep(0.,.06,pit),planeY=y+x*${HOLE.tilt};
 float rho=length(vec2(x,planeY/${HOLE.inclination})),angle=atan(planeY/${HOLE.inclination},x);
 float outer=20.5+(${HOLE.outer}.-20.5)*size,envelope=smoothstep(17.8,19.,rho)*(1.-smoothstep(outer-5.*size-.8,outer,rho));
 float building=.34+.66*maturity,asym=clamp(.85-.5*x/max(rho,1.),.4,1.4);
 float disk=envelope*holeMaterial(rho,angle,spin)*building*asym*1.65*form;
 float nearSide=smoothstep(-.2,.9,planeY),discVisible=disk*((1.-nearSide)*(1.-shadow)+nearSide);
 float arcR=length(vec2(x,(y+1.2)*1.07)),arcAngle=atan(-(y+1.2),x);
 float arcEnvelope=exp(-pow((arcR-19.1)/(.7+.95*size),2.))*(1.-smoothstep(-2.,1.,y))*(1.-smoothstep(12.+11.*size,16.+13.*size,abs(x)));
 float arc=arcEnvelope*holeMaterial(20.+abs(x)*.12,arcAngle,spin)*building*(.9-.25*x/27.)*1.18*(1.-shadow)*form;
 float rim=exp(-pow((r-Re-.28)/.32,2.))*(.035+.10*pow(max(0.,-x/max(r,1.)),3.))*(.6+glow*.4)*(1.-shadow)*pit;
 float plain=1.-smoothstep(pr-.5,pr+.5,r),ember=plain*(1.-shadow)*(1.-pit);vec3 pearl=vec3(1.);
 vec3 radiance=holeWarm(rho)*discVisible+holeWarm(20.+abs(x)*.12)*arc+vec3(1.,.82,.54)*rim+pearl*ember;
 float a=max(shadow,clamp(max(max(radiance.r,radiance.g),radiance.b),0.,1.));
 float base=plain*(1.-visibility)+a*visibility,gr=max(pr,Re*smoothstep(0.,.06,pit)+.8),glare=flare*.55*exp(-pow((r-gr)/3.2,2.))*smoothstep(gr-1.,gr+1.,r)*(1.-base);
 float drop=(1.-visibility)*(1.-smoothstep(pr,pr+${KNOB.shadow}.,r))*smoothstep(pr-1.,pr+.5,r)*.2*(1.-base-glare),alpha=base+glare+drop;if(alpha<.0001)return vec4(0.);
 return vec4(clamp((pearl*plain*(1.-visibility)+((radiance+vec3(.00015)*shadow)*visibility+vec3(.88,.84,1.)*glare)*brightness)/alpha,0.,1.),alpha);
}`;

export function staticHoleSvg(position,brightness=.85) {
  const {visibility:v,maturity:m}=holeState(position),disk=(.34+.66*m).toFixed(3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="76" height="64" viewBox="-38 -32 76 64"><defs><linearGradient id="gold"><stop stop-color="#fff0cf"/><stop offset=".5" stop-color="#e1a354"/><stop offset="1" stop-color="#8f5124"/></linearGradient></defs><circle r="${KNOB.radius}" fill="#fff" opacity="${1-v}"/><g opacity="${brightness}"><g opacity="${v}"><g opacity="${disk}"><ellipse rx="31" ry="8.7" transform="rotate(-5.7)" fill="none" stroke="url(#gold)" stroke-width="2.4"/><path d="M-25,-7 C-21,-24 15,-27 25,-7" fill="none" stroke="url(#gold)" stroke-width="1.8"/></g><circle r="15.5" fill="#000001"/><path d="M-25,-7 C-21,-24 15,-27 25,-7" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="${disk}"/><path d="M-32,2 C-16,12 16,10 32,-2" fill="none" stroke="url(#gold)" stroke-width="2.2" opacity="${disk}"/></g></g></svg>`;
}


