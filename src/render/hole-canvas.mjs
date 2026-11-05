import {opticalProfile,opticalColor} from './optics.mjs';
import {visualState} from './evolution.mjs';
import { HOLE, holeState, sampleHole } from './hole.mjs';
export class HoleRaster {
  constructor(){this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');this.key='';}
  draw(ctx,world,x,y,dpr=1,size=1){
    const visual=visualState(world),look=opticalProfile(world,true);const state={visibility:visual.holeVisibility,maturity:visual.holeMaturity,flare:Math.round((visual.coreFlare??0)*20)/20,pit:Math.round((visual.corePit??1)*20)/20,form:Math.round((visual.diskForm??1)*20)/20,spin:Math.floor(world.spinTime*12)/12,size:Math.round((world.diskSize??1)*40)/40,glow:world.config.glow*look.halo,brightness:world.config.brightness};
    const scale=Math.min(1.5,dpr),width=Math.round(HOLE.halfWidth*2*scale),height=Math.round(HOLE.halfHeight*2*scale);
    const key=JSON.stringify([state,width,height,look]),tinted=look.saturation!==1||look.gain!==1||look.tint.some(v=>v!==1);
    if(key!==this.key){this.key=key;this.canvas.width=width;this.canvas.height=height;const image=this.ctx.createImageData(width,height);
      for(let j=0;j<height;j++)for(let i=0;i<width;i++){const rgba=sampleHole((i+.5)/scale-HOLE.halfWidth,(j+.5)/scale-HOLE.halfHeight,state),at=(j*width+i)*4,rgb=tinted?opticalColor(rgba.slice(0,3),look):rgba;for(let k=0;k<4;k++)image.data[at+k]=Math.round((k===3?rgba[3]:rgb[k])*255);}
      this.ctx.putImageData(image,0,0);
    }
    ctx.drawImage(this.canvas,x-HOLE.halfWidth*size,y-HOLE.halfHeight*size,HOLE.halfWidth*2*size,HOLE.halfHeight*2*size);
  }
  dispose(){this.canvas.width=1;this.canvas.height=1;this.key='';}
}



