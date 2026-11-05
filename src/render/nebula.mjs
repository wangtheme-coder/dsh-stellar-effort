import {opticalProfile} from './optics.mjs';
import {clamp,smooth} from '../shared/mapping.mjs';
import {perspective} from './flight.mjs';
import {visualState,unfoldMask} from './evolution.mjs';
import {SPACE,worldPoint} from './space.mjs';
import {recoveryAmount} from './recovery.mjs';
const fract=x=>x-Math.floor(x);
function hash(x,y){let a=fract(x*123.34),b=fract(y*456.21);const d=a*(a+45.32)+b*(b+45.32);a+=d;b+=d;return fract(a*b);}
function noise(x,y){const i=Math.floor(x),j=Math.floor(y);let u=fract(x),v=fract(y);u=u*u*(3-2*u);v=v*v*(3-2*v);const a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y){let n=.57*noise(x,y);x=x*2.1+17;y=y*2.1+17;n+=.27*noise(x,y);return n+.13*noise(x*2.03+9,y*2.03+9);}
// Missing high-frequency bands use their expected mean; full detail is unchanged.
function detailFbm(x,y,octaves){if(octaves>=3)return fbm(x,y);let n=.57*noise(x,y);if(octaves<2)return n+.2;x=x*2.1+17;y=y*2.1+17;return n+.27*noise(x,y)+.065;}
export const nebulaBackdrop=world=>smooth(.04,.35,visualState(world).spaceReveal);
export function nebulaLayers(world,reduced=false,detail){
 const envelope=visualState(world).spaceReveal*nebulaBackdrop(world)*opticalProfile(world).fog*world.awake*world.elements.nebulae,returning=recoveryAmount(world,reduced);
 return world.clouds.slice(0,4).map(n=>{const layer=Math.abs(n.id)%3,seed=hash(n.id,13)*71,z=[.19,.46,.76][layer]+hash(n.id,7)*[.25,.28,.23][layer];
  const p=perspective({id:n.id,x:n.x,y:n.y,z},world.flight,reduced),life=smooth(0,3,n.age)*(1-smooth(n.life-4,n.life,n.age));
  return {...(detail&&detail.cloudOctaves<3?{detailOctaves:detail.cloudOctaves}:{}),id:n.id,layer,x:p.x,y:SPACE.centerY+(p.y-SPACE.centerY)*(1-returning*.2),z:p.viewDepth,radius:Math.min(160,Math.max(12,n.radius*314*.85*p.scale)),aspect:(.28+hash(n.id,31)*.13)*(1-returning*.3),seed,tone:n.tone,twist:clamp(n.twist,0,1),phase:world.time*.025,alpha:n.opacity*life*p.alpha*envelope*unfoldMask(p.x,p.y,worldPoint(world.position,0).x,visualState(world).unfold)};
 });
}
export function nebulaDensity(x,y,n){const u=(x-n.x)/n.radius,v=(y-n.y)/(n.radius*n.aspect);if(Math.abs(u)>2||Math.abs(v)>2)return 0;
 const a=u+.08*Math.sin(v*2.8+n.phase)+v*n.twist*.12,b=v+.09*Math.cos(u*2.2-n.phase*.8);
 const octaves=n.detailOctaves??3,body=detailFbm(a*3.2+n.seed+n.phase*.12,b*3.2+n.seed,octaves),dust=detailFbm(a*5.7+n.seed,b*5.7+n.seed+n.phase*.1,octaves);
 return Math.exp(-(u*u+v*v)*1.8)*smooth(.25,.7,body)*(.55+.45*smooth(.25,.7,dust));
}
// Dust occupies the existing world, only left of the current fill endpoint.
export function nebulaVisibility(point,position=1){return point.x>=0&&point.x<=Math.min(SPACE.width,worldPoint(position,0).x)&&point.y>=0&&point.y<=SPACE.height?1:0;}
export function nebulaTransmission(point,layers,position=1){if(!nebulaVisibility(point,position))return 1;let t=1;for(const n of layers)if(n.z<point.viewDepth&&n.alpha>.001)t*=1-Math.min(.18,n.alpha*nebulaDensity(point.x,point.y,n)*.65);return Math.max(.65,t);}
export function nebulaColor(tone){return tone>.92?[.30,.23,.22]:tone<.4?[.29,.30,.31]:[.22,.28,.34];}
export const NEBULA_GLSL=`
float cloudVisibility(vec2 p){return p.x>=0.&&p.x<=uSize.x&&p.y>=0.&&p.y<=uSize.y&&(p.x<=cx()||track(p)>1.||uDepth>.05)?1.:0.;}
uniform float uCloudOctaves;
float cloudFbm(vec2 p){if(uCloudOctaves>2.5)return fbm(p);float n=.57*noise(p);if(uCloudOctaves<1.5)return n+.2;p=p*2.1+17.;return n+.27*noise(p)+.065;}
float cloudDensity(vec2 d,vec4 shape){if(uCloudOctaves<2.5&&max(abs(d.x),abs(d.y))>2.)return 0.;float phase=uTime*.025;vec2 q=d+vec2(.08*sin(d.y*2.8+phase)+d.y*shape.w*.12,.09*cos(d.x*2.2-phase*.8));
float body=cloudFbm(q*3.2+vec2(shape.x+phase*.12,shape.x));float dust=cloudFbm(q*5.7+vec2(shape.x,shape.x+phase*.1));
return exp(-dot(d,d)*1.8)*smoothstep(.25,.7,body)*(.55+.45*smoothstep(.25,.7,dust));}
vec3 cloudColor(float tone){return tone>.92?vec3(.30,.23,.22):(tone<.4?vec3(.29,.30,.31):vec3(.22,.28,.34));}
`;

