import * as T from 'three';
import {samplePaintedEdge,validatePaintedMesh} from './illustrated-rig.js';
const v=new T.Vector3();
export function support(hand,full=false){
 hand.mesh.skeleton.update();let extreme=hand.guide.side==='left'?-Infinity:Infinity,anchor=new T.Vector3(),chosen;
 for(const edge of full?hand.edge:hand.tips){samplePaintedEdge(hand,edge,v);if(hand.guide.side==='left'?v.x>extreme:v.x<extreme){extreme=v.x;anchor.copy(v);chosen=edge;}}
 return {point:anchor,source:chosen.source};
}
export function alignPaintedHands(scene,hands,p,w,h,mobile,pixelRatio,focusY=null){
 scene.updateMatrixWorld(true);
 const anchors=hands.map(hand=>support(hand));
 const reach=T.MathUtils.smoothstep(p,0,1),gap=w*(mobile?.30:.29)*(1-reach);
 const centerX=(Math.floor(w*pixelRatio*.5)+.5)/pixelRatio;
 const centerY=(Math.floor((focusY??h*(mobile?.53:.56))*pixelRatio)+.5)/pixelRatio;
 hands.forEach((hand,i)=>{const desired=new T.Vector3(centerX+(i===0?-gap*.5:gap*.5),centerY+(i===0?1:-1)*h*.037*(1-reach),0);
  hand.group.position.add(desired.sub(anchors[i].point));
 });
 scene.updateMatrixWorld(true);const final=hands.map(h=>support(h));
 return {distance:final[0].point.distanceTo(final[1].point),left:final[0].point.toArray(),right:final[1].point.toArray(),sources:final.map(a=>a.source),center:[centerX,centerY]};
}
export function validatePaintedContact(scene,hands,p){
 scene.updateMatrixWorld(true);const tips=hands.map(h=>support(h)),edges=hands.map(h=>support(h,true));
 const separation=edges[1].point.x-edges[0].point.x;
 return {progress:p,units:'CSS pixels',visibleAlphaIsocontour:.83,
  surfaceDistance:tips[0].point.distanceTo(tips[1].point),signedSeparatingPlaneGap:separation,
  indexIsLeadingSurface:Math.abs(tips[0].point.x-edges[0].point.x)<1e-5&&Math.abs(tips[1].point.x-edges[1].point.x)<1e-5,
  noOverlap:separation>=-1e-5,contactAtFinal:p<.99999||tips[0].point.distanceTo(tips[1].point)<1e-4,
  leftContact:tips[0].point.toArray(),rightContact:tips[1].point.toArray(),
  artworkResolution:hands.map(h=>h.resolution),paintedMeshTriangles:hands.reduce((sum,h)=>sum+h.mesh.geometry.index.count/3,0),
  visibleJointCoverage:hands.map(h=>h.jointCoverage),
  deformation:hands.map(validatePaintedMesh),
  jointRotations:hands.map(h=>Object.fromEntries(h.fingers.flatMap(f=>f.bones.map((b,i)=>[f.name+'.'+i,b.rotation.z])))),
 };
}
