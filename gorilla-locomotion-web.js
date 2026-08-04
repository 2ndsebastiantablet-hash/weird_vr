/*
GorillaLocomotion WebXR adaptation.
This clean-room JavaScript port is based on the movement model in Another
Axiom's MIT-licensed GorillaLocomotion Unity repository:
https://github.com/Another-Axiom/GorillaLocomotion

It preserves the core ideas needed for the browser: arm-length clamping,
sticky hand contacts, two-hand averaging, velocity history, capped launches,
gravity, surface sliding, and hand unsticking.
*/
(function(){
"use strict";
if(!window.AFRAME||!window.THREE)throw new Error("A-Frame must load before GorillaLocomotion WebXR.");

const UP=new THREE.Vector3(0,1,0);
function finite(v){return Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z)}
function clampMagnitude(v,max){const n=v.length();if(n>max&&n>.00001)v.multiplyScalar(max/n);return v}

AFRAME.registerComponent("gorilla-locomotion-web",{
 schema:{
  head:{type:"selector"},leftController:{type:"selector"},rightController:{type:"selector"},
  leftFollower:{type:"selector"},rightFollower:{type:"selector"},
  maxArmLength:{default:1.5},handRadius:{default:.085},unstickDistance:{default:.82},
  velocityHistorySize:{default:10},velocityLimit:{default:.75},maxJumpSpeed:{default:6.5},
  jumpMultiplier:{default:1.15},gravity:{default:9.8},airDrag:{default:.16},
  bodyRadius:{default:.28},headRadius:{default:.18},defaultSlideFactor:{default:.025}
 },
 init:function(){
  this.scene=this.el.sceneEl;this.rig=this.el.object3D;
  this.head=this.data.head.object3D;this.leftController=this.data.leftController.object3D;
  this.rightController=this.data.rightController.object3D;
  this.leftFollower=this.data.leftFollower.object3D;this.rightFollower=this.data.rightFollower.object3D;
  this.velocity=new THREE.Vector3();this.averageVelocity=new THREE.Vector3();
  this.history=Array.from({length:Math.max(2,this.data.velocityHistorySize)},()=>new THREE.Vector3());
  this.historyIndex=0;this.historyCount=0;this.left=this.makeHand();this.right=this.makeHand();
  this.colliders=[];this.wasVr=false;
  this.t={head:new THREE.Vector3(),delta:new THREE.Vector3(),leftMove:new THREE.Vector3(),
   rightMove:new THREE.Vector3(),rigStart:new THREE.Vector3(),rigEnd:new THREE.Vector3(),
   sample:new THREE.Vector3(),min:new THREE.Vector3(),max:new THREE.Vector3()};
  this.onEnter=()=>this.resetPose(true);this.onExit=()=>this.resetPose(false);
  this.scene.addEventListener("enter-vr",this.onEnter);this.scene.addEventListener("exit-vr",this.onExit);
  this.el.addEventListener("locomotion-reset",e=>{if(e.detail&&e.detail.position)this.rig.position.copy(e.detail.position);this.resetPose(this.scene.is("vr-mode"))});
  setTimeout(()=>{this.rebuildColliders();this.resetPose(this.scene.is("vr-mode"))},300);
 },
 remove:function(){this.scene.removeEventListener("enter-vr",this.onEnter);this.scene.removeEventListener("exit-vr",this.onExit)},
 makeHand:function(){return{last:new THREE.Vector3(),raw:new THREE.Vector3(),touching:false,initialized:false,normal:new THREE.Vector3(0,1,0)}},
 rebuildColliders:function(){
  this.colliders=Array.from(this.scene.querySelectorAll(".locomotion-surface")).map(el=>({
   el,object:el.object3D,box:new THREE.Box3(),
   slip:Math.min(1,Math.max(0,Number(el.dataset.slip||this.data.defaultSlideFactor)))
  }));
  this.updateBounds();
 },
 updateBounds:function(){for(const c of this.colliders){c.object.updateMatrixWorld(true);c.box.setFromObject(c.object)}},
 tracked:function(el){
  if(!el||!this.scene.is("vr-mode"))return false;
  const c=el.components||{},tracked=c["tracked-controls-webxr"]||c["tracked-controls"];
  if(tracked&&tracked.controller)return true;
  if(c["hand-controls"]&&c["hand-controls"].controllerPresent)return true;
  if(c["oculus-touch-controls"]&&c["oculus-touch-controls"].controllerPresent)return true;
  return false;
 },
 headPosition:function(out){this.head.updateMatrixWorld(true);return this.head.getWorldPosition(out)},
 clampedHand:function(controller,head,out){
  controller.updateMatrixWorld(true);controller.getWorldPosition(out);
  const offset=out.clone().sub(head);clampMagnitude(offset,this.data.maxArmLength);
  return out.copy(head).add(offset);
 },
 resetPose:function(vr){
  this.rig.updateMatrixWorld(true);const head=this.headPosition(this.t.head);
  this.clampedHand(this.leftController,head,this.left.raw);this.clampedHand(this.rightController,head,this.right.raw);
  this.left.last.copy(this.left.raw);this.right.last.copy(this.right.raw);
  this.left.initialized=this.right.initialized=true;this.left.touching=this.right.touching=false;
  this.velocity.set(0,0,0);this.averageVelocity.set(0,0,0);
  this.history.forEach(v=>v.set(0,0,0));this.historyIndex=0;this.historyCount=0;this.wasVr=!!vr;
  this.leftFollower.position.copy(this.left.last);this.rightFollower.position.copy(this.right.last);
 },
 tick:function(_time,deltaMs){
  const dt=Math.min(.04,Math.max(.001,deltaMs/1000));this.updateBounds();
  const vr=this.scene.is("vr-mode");if(vr!==this.wasVr)this.resetPose(vr);
  this.t.rigStart.copy(this.rig.position);this.integrate(dt);this.resolveBody();
  if(vr)this.processHands();else this.desktopFollowers();
  this.resolveBody();this.t.rigEnd.copy(this.rig.position);
  this.storeVelocity(this.t.rigEnd.clone().sub(this.t.rigStart).divideScalar(dt));
  if(this.rig.position.y<-12)this.respawn();
 },
 integrate:function(dt){
  this.velocity.y-=this.data.gravity*dt;const damping=Math.max(0,1-this.data.airDrag*dt);
  this.velocity.x*=damping;this.velocity.z*=damping;this.t.delta.copy(this.velocity).multiplyScalar(dt);
  if(finite(this.t.delta))this.rig.position.add(this.t.delta);
 },
 processHands:function(){
  this.rig.updateMatrixWorld(true);const head=this.headPosition(this.t.head);
  const lt=this.tracked(this.data.leftController),rt=this.tracked(this.data.rightController);
  if(!lt&&!rt){this.left.touching=this.right.touching=false;return}
  const lr=lt?this.processHand(this.left,this.leftController,head,this.t.leftMove):null;
  const rr=rt?this.processHand(this.right,this.rightController,head,this.t.rightMove):null;
  const la=lr&&(lr.touching||this.left.touching),ra=rr&&(rr.touching||this.right.touching);
  const move=this.t.delta.set(0,0,0);
  if(la&&ra)move.copy(lr.movement).add(rr.movement).multiplyScalar(.5);
  else{if(la)move.add(lr.movement);if(ra)move.add(rr.movement)}
  if(finite(move)&&move.lengthSq()>.0000001){this.rig.position.add(move);this.velocity.set(0,0,0);this.rig.updateMatrixWorld(true)}
  this.finishHand(this.left,this.leftController,lt);this.finishHand(this.right,this.rightController,rt);
  if((this.left.touching||this.right.touching)&&this.averageVelocity.length()>this.data.velocityLimit){
   this.velocity.copy(this.averageVelocity).multiplyScalar(this.data.jumpMultiplier);clampMagnitude(this.velocity,this.data.maxJumpSpeed)
  }
  this.leftFollower.position.copy(this.left.last);this.rightFollower.position.copy(this.right.last);
 },
 processHand:function(state,controller,head,movement){
  this.clampedHand(controller,head,state.raw);if(!state.initialized){state.last.copy(state.raw);state.initialized=true}
  const sweep=this.sweep(state.last,state.raw,this.data.handRadius);movement.set(0,0,0);
  if(sweep.hit){movement.copy(state.touching?state.last:sweep.position).sub(state.raw);state.normal.copy(sweep.normal)}
  return{touching:sweep.hit,movement}
 },
 finishHand:function(state,controller,isTracked){
  if(!isTracked){state.touching=false;return}
  const head=this.headPosition(this.t.head);this.clampedHand(controller,head,state.raw);
  const sweep=this.sweep(state.last,state.raw,this.data.handRadius);
  if(sweep.hit){state.last.copy(sweep.position);state.touching=true}else{state.last.copy(state.raw);state.touching=false}
  if(state.touching&&state.raw.distanceTo(state.last)>this.data.unstickDistance&&!this.sweep(head,state.raw,this.data.handRadius*.6).hit){
   state.last.copy(state.raw);state.touching=false
  }
 },
 sweep:function(start,end,radius){
  const direction=end.clone().sub(start),distance=direction.length();
  const steps=Math.max(1,Math.min(14,Math.ceil(distance/Math.max(.035,radius*.5))));
  const result={hit:false,position:end.clone(),normal:new THREE.Vector3(0,1,0),slip:this.data.defaultSlideFactor};
  for(let i=1;i<=steps;i++){
   const sample=this.t.sample.copy(start).addScaledVector(direction,i/steps),hit=this.resolveSphere(sample,radius);
   if(hit.hit){
    result.hit=true;result.position.copy(hit.position);result.normal.copy(hit.normal);result.slip=hit.slip;
    const remaining=end.clone().sub(result.position),normalAmount=remaining.dot(result.normal);
    const tangent=remaining.addScaledVector(result.normal,-normalAmount).multiplyScalar(result.slip);
    const slid=result.position.clone().add(tangent),slideHit=this.resolveSphere(slid,radius);
    if(!slideHit.hit)result.position.copy(slid);return result
   }
  }
  return result
 },
 resolveSphere:function(point,radius){
  let best=null;
  for(const c of this.colliders){
   const min=this.t.min.copy(c.box.min).addScalar(-radius),max=this.t.max.copy(c.box.max).addScalar(radius);
   if(point.x<min.x||point.x>max.x||point.y<min.y||point.y>max.y||point.z<min.z||point.z>max.z)continue;
   const d=[
    {n:point.x-min.x,a:"x",v:min.x,no:new THREE.Vector3(-1,0,0)},{n:max.x-point.x,a:"x",v:max.x,no:new THREE.Vector3(1,0,0)},
    {n:point.y-min.y,a:"y",v:min.y,no:new THREE.Vector3(0,-1,0)},{n:max.y-point.y,a:"y",v:max.y,no:new THREE.Vector3(0,1,0)},
    {n:point.z-min.z,a:"z",v:min.z,no:new THREE.Vector3(0,0,-1)},{n:max.z-point.z,a:"z",v:max.z,no:new THREE.Vector3(0,0,1)}
   ].sort((a,b)=>a.n-b.n)[0];
   if(!best||d.n<best.depth){const corrected=point.clone();corrected[d.a]=d.v;best={hit:true,position:corrected,normal:d.no,depth:d.n,slip:c.slip}}
  }
  return best||{hit:false,position:point.clone(),normal:UP.clone(),slip:this.data.defaultSlideFactor}
 },
 resolveBody:function(){
  this.rig.updateMatrixWorld(true);const head=this.headPosition(this.t.head);let dx=0,dz=0;
  for(const c of this.colliders){
   const b=c.box;if(head.y+this.data.headRadius<b.min.y||head.y-1.35>b.max.y)continue;
   const minX=b.min.x-this.data.bodyRadius,maxX=b.max.x+this.data.bodyRadius,minZ=b.min.z-this.data.bodyRadius,maxZ=b.max.z+this.data.bodyRadius;
   if(head.x<=minX||head.x>=maxX||head.z<=minZ||head.z>=maxZ)continue;
   const p=[{n:head.x-minX,a:"x",d:minX-head.x},{n:maxX-head.x,a:"x",d:maxX-head.x},{n:head.z-minZ,a:"z",d:minZ-head.z},{n:maxZ-head.z,a:"z",d:maxZ-head.z}].sort((a,b)=>a.n-b.n)[0];
   if(p.a==="x")dx+=p.d;else dz+=p.d
  }
  if(Number.isFinite(dx))this.rig.position.x+=dx;if(Number.isFinite(dz))this.rig.position.z+=dz;
  const support=this.supportHeight(this.rig.position.x,this.rig.position.z,this.rig.position.y);
  if(support!==null&&this.rig.position.y<=support+.08&&this.velocity.y<=0){this.rig.position.y=support;this.velocity.y=0}
 },
 supportHeight:function(x,z,y){
  let support=null;
  for(const c of this.colliders){const b=c.box,top=b.max.y;
   if(x<b.min.x-this.data.bodyRadius||x>b.max.x+this.data.bodyRadius||z<b.min.z-this.data.bodyRadius||z>b.max.z+this.data.bodyRadius)continue;
   if(top>y+.5||top<y-1.25)continue;if(support===null||top>support)support=top
  }
  return support
 },
 storeVelocity:function(v){
  if(!finite(v))return;this.history[this.historyIndex].copy(v);this.historyIndex=(this.historyIndex+1)%this.history.length;
  this.historyCount=Math.min(this.history.length,this.historyCount+1);this.averageVelocity.set(0,0,0);
  for(let i=0;i<this.historyCount;i++)this.averageVelocity.add(this.history[i]);if(this.historyCount)this.averageVelocity.divideScalar(this.historyCount)
 },
 desktopFollowers:function(){
  this.rig.updateMatrixWorld(true);const h=this.headPosition(this.t.head);
  this.left.last.copy(h).add(new THREE.Vector3(-.28,-.35,-.4));this.right.last.copy(h).add(new THREE.Vector3(.28,-.35,-.4));
  this.leftFollower.position.copy(this.left.last);this.rightFollower.position.copy(this.right.last)
 },
 respawn:function(){this.rig.position.set(0,0,8);this.velocity.set(0,0,0);this.resetPose(this.scene.is("vr-mode"))}
});
}());
