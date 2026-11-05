import {FULL_DETAIL,cloudIntersectsClip} from './detail.mjs';
import {nebulaDensity,nebulaColor} from './nebula.mjs';
export class NebulaRaster {
 constructor(){this.tiles=new Map();}
 draw(ctx,layers,brightness,detail=FULL_DETAIL,clip){const ids=new Set(layers.map(n=>n.id));for(const id of this.tiles.keys())if(!ids.has(id)){const tile=this.tiles.get(id).tile;tile.width=1;tile.height=1;this.tiles.delete(id);}
  for(const n of layers){if(n.alpha<.001||!cloudIntersectsClip(n,clip))continue;const key=`${detail.level}:${Math.floor(n.phase*160)}:${Math.round(n.twist*16)}`;let cached=this.tiles.get(n.id);
   if(!cached||cached.key!==key){const tile=cached?.tile??document.createElement('canvas');const w=detail.tileWidth,h=detail.tileHeight;tile.width=w;tile.height=h;const c=tile.getContext('2d'),image=c.createImageData(w,h),color=nebulaColor(n.tone);
    const material=n.detailOctaves===detail.cloudOctaves?n:{...n,detailOctaves:detail.cloudOctaves};for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=(x+.5)/w*4-2,v=(y+.5)/h*4-2,i=(y*w+x)*4;image.data[i]=color[0]*255;image.data[i+1]=color[1]*255;image.data[i+2]=color[2]*255;image.data[i+3]=nebulaDensity(n.x+u*n.radius,n.y+v*n.radius*n.aspect,material)*255;}
    c.putImageData(image,0,0);cached={key,tile};this.tiles.set(n.id,cached);
   }
   ctx.save();ctx.globalAlpha=n.alpha*brightness;ctx.drawImage(cached.tile,n.x-n.radius*2,n.y-n.radius*n.aspect*2,n.radius*4,n.radius*n.aspect*4);ctx.restore();
  }
 }
 dispose(){for(const {tile} of this.tiles.values()){tile.width=1;tile.height=1;}this.tiles.clear();}
}


