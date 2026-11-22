import * as T from 'three';
import {guides} from './rig-data.js';

const COLS=192,ROWS=128,ALPHA_EDGE=.83;
const point=new T.Vector3();
const smooth=(a,b,v)=>T.MathUtils.smoothstep(v,a,b);
function closest(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=T.MathUtils.clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length,0,1);return {t,d:Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)};}

function weightsAt(x,y,guide,fingerInfo){
 const influences=[],p=[x,y],wx=guide.wrist[0],wy=guide.wrist[1],dx=guide.palm[0]-wx,dy=guide.palm[1]-wy;
 const projection=((x-wx)*dx+(y-wy)*dy)/Math.hypot(dx,dy);
 const wrist=smooth(-180,110,projection);
 let sum=0,max=0;
 for(const finger of fingerInfo){
  let best={d:Infinity};
  for(let segment=0;segment<3;segment++){const c=closest(p,finger.points[segment],finger.points[segment+1]);if(c.d<best.d)best={...c,segment};}
  const a=finger.points[0],b=finger.points[1],rootProjection=((x-a[0])*(b[0]-a[0])+(y-a[1])*(b[1]-a[1]))/Math.hypot(b[0]-a[0],b[1]-a[1]);
  const score=(1-smooth(finger.radii[best.segment]*.8,finger.radii[best.segment]*1.5,best.d))*smooth(-8,45,rootProjection);
  if(score<1e-5)continue;sum+=score;max=Math.max(max,score);
  const t=best.segment===2?0:best.t;
  influences.push({bone:finger.boneStart+best.segment,weight:score*(1-t)});
  if(t)influences.push({bone:finger.boneStart+best.segment+1,weight:score*t});
 }
 const merged=new Map();if(sum)for(const inf of influences)merged.set(inf.bone,(merged.get(inf.bone)||0)+inf.weight/sum*max);
 merged.set(0,(1-max)*(1-wrist));merged.set(1,(1-max)*wrist);
 const all=new Float32Array(17);let total=0;for(const [bone,weight] of merged){all[bone]=weight;total+=weight;}for(let i=0;i<17;i++)all[i]/=total;return all;
}

async function softenWeights(source){
 let a=source,b=new Float32Array(a.length);const width=COLS+1,height=ROWS+1;
 // Diffuse the complete influence field; no top-four switches at finger seams.
 for(let pass=0;pass<28;pass++){
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const v=y*width+x,left=(y*width+Math.max(0,x-1))*17,right=(y*width+Math.min(width-1,x+1))*17,up=(Math.max(0,y-1)*width+x)*17,down=(Math.min(height-1,y+1)*width+x)*17;
   for(let bone=0;bone<17;bone++)b[v*17+bone]=a[v*17+bone]*.5+(a[left+bone]+a[right+bone]+a[up+bone]+a[down+bone])*.125;
  }
  const t=a;a=b;b=t;
  if(pass%4===3)await new Promise(resolve=>setTimeout(resolve,0));
 }
 return a;
}

function contour(image,guide){
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,image.width,image.height).data;
 const result=[],threshold=255*ALPHA_EDGE,w=image.width,h=image.height;
 function add(x,y){const u=x/w,v=y/h,cx=Math.min(COLS-1,Math.max(0,Math.floor(u*COLS))),cy=Math.min(ROWS-1,Math.max(0,Math.floor(v*ROWS))),fx=u*COLS-cx,fy=v*ROWS-cy;
  const a=cy*(COLS+1)+cx,b=a+1,d=a+COLS+1,c=d+1;
  const triangle=fx+fy<=1?{ids:[a,b,d],weights:[1-fx-fy,fx,fy]}:{ids:[b,c,d],weights:[1-fy,fx+fy-1,1-fx]};
  result.push({source:[x,y],...triangle,indexTip:x>=guide.tipRegion.x[0]&&x<=guide.tipRegion.x[1]&&y>=guide.tipRegion.y[0]&&y<=guide.tipRegion.y[1]});
 }
 // Alpha-isocontour crossings: preserve the original visible painted edge,
 // including dark opaque brushwork. Use the same threshold as the shader.
 for(let y=0;y<h;y+=2)for(let x=0;x<w-1;x++){const a=rgba[(y*w+x)*4+3],b=rgba[(y*w+x+1)*4+3];if((a<threshold)!==(b<threshold))add(x+.5+(threshold-a)/(b-a),y+.5);}
 for(let x=0;x<w;x+=2)for(let y=0;y<h-1;y++){const a=rgba[(y*w+x)*4+3],b=rgba[((y+1)*w+x)*4+3];if((a<threshold)!==(b<threshold))add(x+.5,y+.5+(threshold-a)/(b-a));}
 return {edges:result,rgba};
}

async function createHand(guide,renderer){
 const texture=await new T.TextureLoader().loadAsync(guide.url);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 // Color may use mipmaps for quiet brushwork. The contact silhouette must use
 // native-resolution alpha, so its edge cannot retreat at mobile minification.
 const edgeTexture=texture.clone();edgeTexture.colorSpace=T.NoColorSpace;edgeTexture.generateMipmaps=false;edgeTexture.minFilter=T.LinearFilter;edgeTexture.magFilter=T.LinearFilter;edgeTexture.needsUpdate=true;
 const {width:w,height:h}=texture.image,aspect=h/w;
 const root=new T.Bone(),wrist=new T.Bone();root.name='forearm';wrist.name='wrist';wrist.position.set(guide.wrist[0]/w,guide.wrist[1]/w,0);root.add(wrist);
 const bones=[root,wrist],fingers=[];
 for(const [name,data] of Object.entries(guide.fingers)){
  const finger={name,...data,boneStart:bones.length,bones:[]};let parent=wrist,previous=guide.wrist;
  for(let j=0;j<3;j++){const bone=new T.Bone();bone.name=name+'.'+j;bone.position.set((data.points[j][0]-previous[0])/w,(data.points[j][1]-previous[1])/w,0);parent.add(bone);bones.push(bone);finger.bones.push(bone);parent=bone;previous=data.points[j];}
  fingers.push(finger);
 }
 const positions=[],uv=[],ids=[],weights=[],indices=[],rawWeights=new Float32Array((ROWS+1)*(COLS+1)*17);
 for(let row=0;row<=ROWS;row++)for(let col=0;col<=COLS;col++){
  const u=col/COLS,v=row/ROWS;positions.push(u,v*aspect,0);uv.push(u,1-v);
  rawWeights.set(weightsAt(u*w,v*h,guide,fingers),(row*(COLS+1)+col)*17);
 }
 const influenceWeights=await softenWeights(rawWeights),extras=Array.from({length:4},()=>[]);
 for(let vertex=0;vertex<(ROWS+1)*(COLS+1);vertex++){
  ids.push(0,1,2,3);for(let k=0;k<4;k++)weights.push(influenceWeights[vertex*17+k]);
  for(let block=0;block<4;block++)for(let k=0;k<4;k++){const bone=4+block*4+k;extras[block].push(bone<17?influenceWeights[vertex*17+bone]:0);}
 }
 for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){const a=row*(COLS+1)+col,b=a+1,d=a+COLS+1,c=d+1;indices.push(a,b,d,b,c,d);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(ids,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.setIndex(indices);geometry.computeVertexNormals();
 extras.forEach((values,i)=>geometry.setAttribute('paintWeight'+i,new T.Float32BufferAttribute(values,4)));
 const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 material.onBeforeCompile=shader=>{shader.uniforms.paintedEdgeMap={value:edgeTexture};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 paintWeight0;\nattribute vec4 paintWeight1;\nattribute vec4 paintWeight2;\nattribute vec4 paintWeight3;');
  let skinning='vec4 paintRest=bindMatrix*vec4(transformed,1.0);\nvec4 paintSkinned=vec4(0.0);\n';
  for(let bone=0;bone<17;bone++){const weight=bone<4?'skinWeight.'+'xyzw'[bone]:'paintWeight'+Math.floor((bone-4)/4)+'.'+'xyzw'[(bone-4)%4];skinning+=`paintSkinned+=getBoneMatrix(${bone.toFixed(1)})*paintRest*${weight};\n`;}
  skinning+='transformed=(bindMatrixInverse*paintSkinned).xyz;';
  shader.vertexShader=shader.vertexShader.replace('#include <skinning_vertex>',skinning);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D paintedEdgeMap;').replace('#include <map_fragment>',`#include <map_fragment>
  diffuseColor.a=smoothstep(.68,.98,texture2D(paintedEdgeMap,vMapUv).a);
  diffuseColor.rgb=vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)));`);};
 const mesh=new T.SkinnedMesh(geometry,material);mesh.add(root);mesh.bind(new T.Skeleton(bones));mesh.frustumCulled=false;
 const group=new T.Group();group.add(mesh);group.renderOrder=guide.side==='left'?0:1;
 const {edges:edge,rgba}=contour(texture.image,guide),tips=edge.filter(p=>p.indexTip);
 const jointCoverage=Object.fromEntries(fingers.flatMap(f=>f.bones.map((b,i)=>[f.name+'.'+i,0])));
 for(let row=0;row<=ROWS;row++)for(let col=0;col<=COLS;col++){
  const vertex=row*(COLS+1)+col,x=Math.min(w-1,Math.round(col/COLS*w)),y=Math.min(h-1,Math.round(row/ROWS*h));
  if(rgba[(y*w+x)*4+3]<255*ALPHA_EDGE)continue;
  for(let bone=2;bone<17;bone++)if(influenceWeights[vertex*17+bone]>.03)jointCoverage[bones[bone].name]++;
 }
 if(tips.length<10)throw Error('Missing painted fingertip edge: '+guide.side);
 const opaqueTriangles=[];
 for(let k=0;k<indices.length;k+=3){let x=0,y=0;for(let j=0;j<3;j++){const id=indices[k+j];x+=positions[id*3]*w/3;y+=positions[id*3+1]*w/3;}
  const px=Math.min(w-1,Math.max(0,Math.floor(x))),py=Math.min(h-1,Math.max(0,Math.floor(y)));if(rgba[(py*w+px)*4+3]>255*ALPHA_EDGE)opaqueTriangles.push(k);
 }
 return {guide,group,mesh,wrist,fingers,bones,edge,tips,edgeTexture,jointCoverage,opaqueTriangles,influenceWeights,resolution:[w,h],cols:COLS,rows:ROWS,cache:new Float32Array(positions.length),stamps:new Int32Array(positions.length/3),stamp:1};
}
export async function loadIllustratedHands(renderer){
 const results=await Promise.allSettled(guides.map(g=>createHand(g,renderer)));
 const failure=results.find(result=>result.status==='rejected');
 if(failure){for(const result of results)if(result.status==='fulfilled'){const hand=result.value;hand.mesh.geometry.dispose();hand.mesh.material.map.dispose();hand.edgeTexture.dispose();hand.mesh.material.dispose();hand.mesh.skeleton.dispose();}throw failure.reason;}
 return results.map(result=>result.value);
}

export function poseIllustratedHand(hand,p,mobile,w,h){
 const reach=smooth(0,1,p),side=hand.guide.side;
 hand.wrist.rotation.z=T.MathUtils.degToRad(side==='left'?.65:-.75)*reach;
 for(const finger of hand.fingers){const phase=smooth(finger.name==='index'?.07:.22,finger.name==='index'?.98:.93,p);
  for(let j=0;j<3;j++){const nuance=finger.name==='index'?0:Math.sin(p*Math.PI)*.1*(j===1?1:-.4);finger.bones[j].rotation.z=T.MathUtils.degToRad(finger.angles[j]*(phase+nuance)*.45);}
 }
 const size=w*(mobile?(side==='left'?1.18:1.15):(side==='left'?.70:.74));
 hand.group.scale.set(size,size,1);
 hand.group.rotation.z=mobile?(side==='left'?-.13:-.19):T.MathUtils.lerp(side==='left'?-.025:-.055,side==='left'?0:-.035,reach);
 hand.group.position.set(0,0,0);hand.stamp++;
}

export function samplePaintedEdge(hand,edge,target=new T.Vector3()){
 target.set(0,0,0);
 for(let k=0;k<3;k++){const id=edge.ids[k],offset=id*3;if(hand.stamps[id]!==hand.stamp){skinPaintedVertex(hand,id,point);hand.cache[offset]=point.x;hand.cache[offset+1]=point.y;hand.cache[offset+2]=point.z;hand.stamps[id]=hand.stamp;}
  target.x+=hand.cache[offset]*edge.weights[k];target.y+=hand.cache[offset+1]*edge.weights[k];
 }
 return target.applyMatrix4(hand.mesh.matrixWorld);
}

const bindPoint=new T.Vector3();
function skinPaintedVertex(hand,id,target){
 bindPoint.fromBufferAttribute(hand.mesh.geometry.attributes.position,id).applyMatrix4(hand.mesh.bindMatrix);
 const x=bindPoint.x,y=bindPoint.y,z=bindPoint.z,matrices=hand.mesh.skeleton.boneMatrices;target.set(0,0,0);
 for(let bone=0;bone<17;bone++){
  const weight=hand.influenceWeights[id*17+bone];if(weight<1e-8)continue;const m=bone*16;
  target.x+=(matrices[m]*x+matrices[m+4]*y+matrices[m+8]*z+matrices[m+12])*weight;
  target.y+=(matrices[m+1]*x+matrices[m+5]*y+matrices[m+9]*z+matrices[m+13])*weight;
  target.z+=(matrices[m+2]*x+matrices[m+6]*y+matrices[m+10]*z+matrices[m+14])*weight;
 }
 return target.applyMatrix4(hand.mesh.bindMatrixInverse);
}

export function validatePaintedMesh(hand){
 hand.mesh.skeleton.update();const geometry=hand.mesh.geometry,indices=geometry.index.array,rest=geometry.attributes.position;
 let flipped=0,minAreaRatio=Infinity,maxEdgeStretch=1;
 const points=[new T.Vector3(),new T.Vector3(),new T.Vector3()],scale=hand.group.scale.x;
 for(const offset of hand.opaqueTriangles){const ids=[indices[offset],indices[offset+1],indices[offset+2]];
  for(let k=0;k<3;k++)samplePaintedEdge(hand,{ids:[ids[k],ids[k],ids[k]],weights:[1,0,0]},points[k]);
  const [a,b,c]=points;
  const restArea=(rest.getX(ids[1])-rest.getX(ids[0]))*(rest.getY(ids[2])-rest.getY(ids[0]))-(rest.getY(ids[1])-rest.getY(ids[0]))*(rest.getX(ids[2])-rest.getX(ids[0]));
  const posedArea=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),ratio=posedArea/(restArea*scale*scale);
  minAreaRatio=Math.min(minAreaRatio,ratio);if(ratio<=0)flipped++;
  for(const [i,j] of [[0,1],[1,2],[2,0]]){const length=Math.hypot(rest.getX(ids[i])-rest.getX(ids[j]),rest.getY(ids[i])-rest.getY(ids[j]))*scale;maxEdgeStretch=Math.max(maxEdgeStretch,points[i].distanceTo(points[j])/length);}
 }
 return {visibleTriangles:hand.opaqueTriangles.length,flippedTriangles:flipped,minAreaRatio,maxEdgeStretch};
}
