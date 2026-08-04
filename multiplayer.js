(function(){
"use strict";
const C=window.WEIRD_VR_CONFIG;
const ALPHABET="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const COLORS=["#38bdf8","#f472b6","#facc15","#34d399","#a78bfa","#fb7185","#f97316","#22d3ee"];
const clampText=(v,n)=>String(v||"").replace(/[^a-zA-Z0-9 _-]/g,"").trim().slice(0,n);
const cleanName=v=>clampText(v,18)||"Player";
const cleanCode=v=>String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,C.roomCodeLength);
const randomCode=()=>{const values=new Uint32Array(C.roomCodeLength);crypto.getRandomValues(values);return Array.from(values,v=>ALPHABET[v%ALPHABET.length]).join("")};
const hashColor=id=>{let h=0;for(const ch of id)h=((h<<5)-h+ch.charCodeAt(0))|0;return COLORS[Math.abs(h)%COLORS.length]};
const round=n=>Math.round(n*1000)/1000;
const finiteArray=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<1000);

class RemoteAvatar{
 constructor(container,id,profile){
  this.id=id;this.profile=profile;this.hasPose=false;
  this.root=document.createElement("a-entity");this.root.dataset.peerId=id;
  this.root.innerHTML='<a-sphere class="head" radius=".17"></a-sphere><a-cylinder class="body" radius=".13" height=".55"></a-cylinder><a-sphere class="left" radius=".10"></a-sphere><a-sphere class="right" radius=".10"></a-sphere><a-text class="name" align="center" width="2.6" color="#fff"></a-text>';
  container.appendChild(this.root);
  this.head=this.root.querySelector(".head");this.body=this.root.querySelector(".body");
  this.left=this.root.querySelector(".left");this.right=this.root.querySelector(".right");this.label=this.root.querySelector(".name");
  const color=profile.color||hashColor(id);this.head.setAttribute("color",color);this.body.setAttribute("color",color);
  this.left.setAttribute("color","#f06b9d");this.right.setAttribute("color","#62b5ff");this.label.setAttribute("value",profile.name||"Player");
  this.target={hp:new THREE.Vector3(),hq:new THREE.Quaternion(),lp:new THREE.Vector3(),lq:new THREE.Quaternion(),rp:new THREE.Vector3(),rq:new THREE.Quaternion()};
 }
 updateProfile(profile){this.profile=profile;this.label.setAttribute("value",profile.name||"Player")}
 setPose(p){
  if(!p||!finiteArray(p.h.p,3)||!finiteArray(p.h.q,4)||!finiteArray(p.l.p,3)||!finiteArray(p.l.q,4)||!finiteArray(p.r.p,3)||!finiteArray(p.r.q,4))return;
  this.target.hp.fromArray(p.h.p);this.target.hq.fromArray(p.h.q).normalize();
  this.target.lp.fromArray(p.l.p);this.target.lq.fromArray(p.l.q).normalize();
  this.target.rp.fromArray(p.r.p);this.target.rq.fromArray(p.r.q).normalize();
  if(!this.hasPose){this.snap();this.hasPose=true}
 }
 snap(){
  this.head.object3D.position.copy(this.target.hp);this.head.object3D.quaternion.copy(this.target.hq);
  this.left.object3D.position.copy(this.target.lp);this.left.object3D.quaternion.copy(this.target.lq);
  this.right.object3D.position.copy(this.target.rp);this.right.object3D.quaternion.copy(this.target.rq);this.updateBody()
 }
 tick(){
  if(!this.hasPose)return;const a=.38;
  this.head.object3D.position.lerp(this.target.hp,a);this.head.object3D.quaternion.slerp(this.target.hq,a);
  this.left.object3D.position.lerp(this.target.lp,a);this.left.object3D.quaternion.slerp(this.target.lq,a);
  this.right.object3D.position.lerp(this.target.rp,a);this.right.object3D.quaternion.slerp(this.target.rq,a);this.updateBody()
 }
 updateBody(){const p=this.head.object3D.position;this.body.object3D.position.set(p.x,p.y-.43,p.z);this.label.object3D.position.set(p.x,p.y+.3,p.z)}
 remove(){this.root.remove()}
}

class WeirdVRMultiplayer{
 constructor(){
  this.scene=document.getElementById("game-scene");this.head=document.getElementById("player-camera");
  this.left=document.getElementById("left-hand-follower");this.right=document.getElementById("right-hand-follower");
  this.remoteRoot=document.getElementById("remote-players");this.worldStatus=document.getElementById("world-room-status");
  this.mainPanel=document.getElementById("main-panel");this.roomPanel=document.getElementById("room-panel");
  this.nameInput=document.getElementById("player-name");this.codeInput=document.getElementById("room-code");
  this.menuStatus=document.getElementById("menu-status");this.roomStatus=document.getElementById("room-status");
  this.list=document.getElementById("public-room-list");this.dialog=document.getElementById("create-room-dialog");
  this.peer=null;this.peerId="";this.roomCode="";this.visibility="";this.isHost=false;this.hostConnection=null;
  this.connections=new Map();this.profiles=new Map();this.avatars=new Map();this.pendingAttempt=null;this.missingCode="";
  this.lastPose=0;this.directoryTimer=0;this.frame=0;this.closing=false;this.rosterSize=1;
  this.tmp={p:new THREE.Vector3(),q:new THREE.Quaternion()};
  this.game=null;
 }
 start(){
  if(!window.Peer){this.setMenuStatus("PeerJS failed to load. Check your internet connection.","error");return}
  if(!window.WeirdVRGameLoop){this.setMenuStatus("Gameplay system failed to load.","error");return}
  this.bindUI();
  this.game=new window.WeirdVRGameLoop(this);this.game.start();
  const saved=localStorage.getItem("weird-vr-player-name");if(saved)this.nameInput.value=cleanName(saved);
  const match=location.hash.match(/room=([a-z0-9]{1,6})/i);if(match)this.codeInput.value=cleanCode(match[1]);
  this.scene.addEventListener("enter-vr",()=>document.body.classList.add("vr-active"));
  this.scene.addEventListener("exit-vr",()=>document.body.classList.remove("vr-active"));
  addEventListener("beforeunload",()=>this.leaveRoom("Page closed",true));
  this.openDiscoveryPeer();
  this.frame=requestAnimationFrame(t=>this.onFrame(t));
 }
 bindUI(){
  document.getElementById("create-public").onclick=()=>this.hostRoom(randomCode(),"public");
  document.getElementById("create-private").onclick=()=>this.hostRoom(randomCode(),"private");
  document.getElementById("join-code").onclick=()=>this.joinCode(this.codeInput.value,true);
  document.getElementById("refresh-public").onclick=()=>this.refreshPublicRooms();
  document.getElementById("copy-room-code").onclick=()=>this.copyCode();
  document.getElementById("leave-room").onclick=()=>this.leaveRoom("You left the room.");
  document.getElementById("dialog-create-public").onclick=()=>this.confirmMissing("public");
  document.getElementById("dialog-create-private").onclick=()=>this.confirmMissing("private");
  document.getElementById("dialog-cancel").onclick=()=>this.hideDialog();
  this.codeInput.oninput=()=>{this.codeInput.value=cleanCode(this.codeInput.value)};
  this.nameInput.onchange=()=>{this.nameInput.value=cleanName(this.nameInput.value);localStorage.setItem("weird-vr-player-name",this.nameInput.value)};
 }
 profile(){const name=cleanName(this.nameInput.value);this.nameInput.value=name;localStorage.setItem("weird-vr-player-name",name);return{name,color:hashColor(this.peerId||name)}}
 peerOptions(){return JSON.parse(JSON.stringify(C.peerOptions))}
 openDiscoveryPeer(){
  this.destroyPeer();this.closing=false;this.setMenuStatus("Connecting to the multiplayer directory…","idle");
  this.peer=new Peer(undefined,this.peerOptions());this.bindPeerEvents();
  this.peer.on("open",id=>{this.peerId=id;this.profiles.set(id,this.profile());this.setMenuStatus("Ready. Create a room or enter a code.","ready");this.refreshPublicRooms();clearInterval(this.directoryTimer);this.directoryTimer=setInterval(()=>this.refreshPublicRooms(),C.directoryRefreshMs)})
 }
 bindPeerEvents(){
  this.peer.on("error",error=>{
   if(this.pendingAttempt&&error.type==="peer-unavailable"){const done=this.pendingAttempt;this.pendingAttempt=null;done(false);return}
   if(error.type==="unavailable-id"&&this.isHost){this.failToMenu("That room code was claimed at the same moment. Try again.");return}
   if(!this.closing)this.activeStatus("Multiplayer error: "+(error.message||error.type),"error")
  });
  this.peer.on("connection",conn=>this.acceptIncoming(conn));
  this.peer.on("disconnected",()=>{if(!this.closing)this.activeStatus("Signaling disconnected. Existing players may remain connected.","warning")});
 }
 destroyPeer(){this.closing=true;if(this.peer){try{this.peer.destroy()}catch(_){}}this.peer=null;this.peerId="";this.pendingAttempt=null}
 hostId(code,visibility){return(visibility==="public"?C.publicPrefix:C.privatePrefix)+code}
 async hostRoom(code,visibility){
  code=cleanCode(code);if(code.length!==C.roomCodeLength)return;
  this.setMenuStatus("Creating "+visibility+" room "+code+"…","idle");this.setControls(true);
  this.roomCode=code;this.visibility=visibility;this.isHost=true;this.connections.clear();this.profiles.clear();this.destroyPeer();this.closing=false;
  this.peer=new Peer(this.hostId(code,visibility),this.peerOptions());this.bindPeerEvents();
  this.peer.on("open",id=>{
   this.peerId=id;this.profiles.set(id,this.profile());this.showRoom();this.activeStatus("Room ready. Open the controller menu to start a match.","ready");
   history.replaceState(null,"","#room="+code);this.setControls(false);this.game.setRoomRole()
  })
 }
 async joinCode(raw,askToCreate){
  const code=cleanCode(raw);this.codeInput.value=code;
  if(code.length!==C.roomCodeLength){this.setMenuStatus("Enter a full six-character room code.","error");return}
  if(!this.peer||this.peer.destroyed){this.openDiscoveryPeer();await new Promise(r=>setTimeout(r,700))}
  if(!this.peer||!this.peer.open){this.setMenuStatus("Multiplayer is still connecting. Try again in a moment.","warning");return}
  this.setControls(true);this.setMenuStatus("Looking for room "+code+"…","idle");
  let result=await this.tryConnection(this.hostId(code,"public"));let visibility="public";
  if(!result){result=await this.tryConnection(this.hostId(code,"private"));visibility="private"}
  if(!result){this.setControls(false);if(askToCreate)this.showMissingDialog(code);else this.setMenuStatus("Room not found.","error");return}
  this.roomCode=code;this.visibility=visibility;this.isHost=false;this.hostConnection=result;
  this.prepareClientConnection(result);this.setControls(false)
 }
 tryConnection(target){
  return new Promise(resolve=>{
   let settled=false;const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);this.pendingAttempt=null;resolve(value)};
   const conn=this.peer.connect(target,{serialization:"json",reliable:true,metadata:{game:"weird-vr",version:2}});
   this.pendingAttempt=value=>finish(value?conn:false);
   const timer=setTimeout(()=>{try{conn.close()}catch(_){}finish(false)},C.joinAttemptTimeoutMs);
   conn.on("open",()=>finish(conn));conn.on("error",()=>finish(false));conn.on("close",()=>{if(!conn.open)finish(false)})
  })
 }
 prepareClientConnection(conn){
  this.setMenuStatus("Joining room "+this.roomCode+"…","idle");
  conn.on("data",data=>this.handleClientMessage(data));
  conn.on("close",()=>this.leaveRoom("The host closed the room."));
  conn.on("error",()=>this.leaveRoom("Connection to the host was lost."));
  conn.send({type:"hello",profile:this.profile(),version:2})
 }
 acceptIncoming(conn){
  if(!this.isHost){conn.on("open",()=>{conn.send({type:"reject",reason:"Not a room host"});setTimeout(()=>conn.close(),100)});return}
  if(this.connections.size>=C.maxPlayers-1){conn.on("open",()=>{conn.send({type:"reject",reason:"Room is full"});setTimeout(()=>conn.close(),100)});return}
  conn.on("open",()=>{this.connections.set(conn.peer,conn);conn.on("data",data=>this.handleHostMessage(conn.peer,data));conn.on("close",()=>this.removeGuest(conn.peer));conn.on("error",()=>this.removeGuest(conn.peer))})
 }
 handleHostMessage(peerId,data){
  if(!data||typeof data.type!=="string")return;
  if(data.type==="hello"){
   const profile={name:cleanName(data.profile&&data.profile.name),color:/^#[0-9a-f]{6}$/i.test(data.profile&&data.profile.color||"")?data.profile.color:hashColor(peerId)};
   this.profiles.set(peerId,profile);this.ensureAvatar(peerId,profile);
   const conn=this.connections.get(peerId);
   if(conn&&conn.open)conn.send({
    type:"welcome",roomCode:this.roomCode,visibility:this.visibility,maxPlayers:C.maxPlayers,
    roster:this.roster(),matchState:this.game.exportState()
   });
   this.broadcast({type:"player-joined",peerId,profile},peerId);this.updateCount();return
  }
  if(data.type==="pose"&&this.validPose(data.pose)){
   this.ensureAvatar(peerId,this.profiles.get(peerId)||{name:"Player",color:hashColor(peerId)}).setPose(data.pose);
   this.broadcast({type:"pose",peerId,pose:data.pose},peerId)
  }
 }
 handleClientMessage(data){
  if(!data||typeof data.type!=="string")return;
  if(this.game&&this.game.handleNetworkMessage(data))return;
  if(data.type==="reject"){this.leaveRoom(data.reason||"Room rejected the connection.");return}
  if(data.type==="welcome"){
   if(cleanCode(data.roomCode)!==this.roomCode)return;this.visibility=data.visibility==="public"?"public":"private";
   this.profiles.clear();
   for(const item of Array.isArray(data.roster)?data.roster:[]){if(item.id!==this.peerId){this.profiles.set(item.id,item.profile);this.ensureAvatar(item.id,item.profile)}}
   this.rosterSize=Math.max(1,(data.roster||[]).length);this.showRoom();
   this.game.applyWelcome(data.matchState);
   const waiting=data.matchState&&data.matchState.active&&!data.matchState.participantIds.includes(this.peerId);
   this.activeStatus(waiting?"Match in progress. You will join the next round.":"Connected. Open the controller menu in VR.","ready");
   history.replaceState(null,"","#room="+this.roomCode);this.updateCount();return
  }
  if(data.type==="player-joined"){this.profiles.set(data.peerId,data.profile);this.ensureAvatar(data.peerId,data.profile);this.rosterSize++;this.updateCount();return}
  if(data.type==="player-left"){this.removeAvatar(data.peerId);this.profiles.delete(data.peerId);this.rosterSize=Math.max(1,this.rosterSize-1);this.updateCount();return}
  if(data.type==="pose"&&data.peerId!==this.peerId&&this.validPose(data.pose))this.ensureAvatar(data.peerId,this.profiles.get(data.peerId)||{name:"Player",color:hashColor(data.peerId)}).setPose(data.pose);
  if(data.type==="room-closed")this.leaveRoom("The host closed the room.")
 }
 removeGuest(peerId){
  if(!this.connections.has(peerId))return;this.connections.delete(peerId);this.profiles.delete(peerId);this.removeAvatar(peerId);
  this.broadcast({type:"player-left",peerId});this.updateCount()
 }
 roster(){return Array.from(this.profiles.entries()).map(([id,profile])=>({id,profile}))}
 currentParticipantIds(){return Array.from(this.profiles.keys())}
 broadcast(message,except){for(const [id,conn] of this.connections)if(id!==except&&conn.open)try{conn.send(message)}catch(_){}}
 validPose(p){return p&&p.h&&p.l&&p.r&&finiteArray(p.h.p,3)&&finiteArray(p.h.q,4)&&finiteArray(p.l.p,3)&&finiteArray(p.l.q,4)&&finiteArray(p.r.p,3)&&finiteArray(p.r.q,4)}
 readTransform(el){
  el.object3D.updateMatrixWorld(true);el.object3D.getWorldPosition(this.tmp.p);el.object3D.getWorldQuaternion(this.tmp.q);
  return{p:[round(this.tmp.p.x),round(this.tmp.p.y),round(this.tmp.p.z)],q:[round(this.tmp.q.x),round(this.tmp.q.y),round(this.tmp.q.z),round(this.tmp.q.w)]}
 }
 pose(){return{h:this.readTransform(this.head),l:this.readTransform(this.left),r:this.readTransform(this.right)}}
 sendPose(now){
  if(!this.roomCode||now-this.lastPose<C.poseSendIntervalMs)return;this.lastPose=now;const pose=this.pose();
  if(this.isHost)this.broadcast({type:"pose",peerId:this.peerId,pose});
  else if(this.hostConnection&&this.hostConnection.open)this.hostConnection.send({type:"pose",pose})
 }
 ensureAvatar(id,profile){
  if(id===this.peerId)return null;let avatar=this.avatars.get(id);
  if(!avatar){avatar=new RemoteAvatar(this.remoteRoot,id,profile||{name:"Player",color:hashColor(id)});this.avatars.set(id,avatar)}
  else if(profile)avatar.updateProfile(profile);return avatar
 }
 removeAvatar(id){const a=this.avatars.get(id);if(a)a.remove();this.avatars.delete(id)}
 clearAvatars(){for(const a of this.avatars.values())a.remove();this.avatars.clear()}
 onFrame(now){for(const a of this.avatars.values())a.tick();this.sendPose(now);if(this.game)this.game.tick(now);this.frame=requestAnimationFrame(t=>this.onFrame(t))}
 refreshPublicRooms(){
  if(!this.peer||!this.peer.open||this.roomCode)return;
  this.list.innerHTML='<div class="empty-state">Refreshing…</div>';
  if(typeof this.peer.listAllPeers!=="function"){this.list.innerHTML='<div class="empty-state">Public discovery is unavailable on this signaling server.</div>';return}
  let finished=false;const timeout=setTimeout(()=>{if(!finished){finished=true;this.list.innerHTML='<div class="empty-state">Directory did not respond. Code joining still works.</div>'}},4500);
  this.peer.listAllPeers(peers=>{
   if(finished)return;finished=true;clearTimeout(timeout);
   const codes=[...new Set((peers||[]).filter(id=>id.startsWith(C.publicPrefix)).map(id=>cleanCode(id.slice(C.publicPrefix.length))).filter(code=>code.length===C.roomCodeLength))].sort();
   this.renderPublicRooms(codes)
  })
 }
 renderPublicRooms(codes){
  this.list.innerHTML="";if(!codes.length){this.list.innerHTML='<div class="empty-state">No public rooms are open. Create the first one.</div>';return}
  for(const code of codes){
   const card=document.createElement("div");card.className="room-card";card.innerHTML="<div><strong>"+code+"</strong><br><span>Public P2P room</span></div>";
   const button=document.createElement("button");button.className="button small";button.textContent="Join";button.onclick=()=>this.joinCode(code,false);card.appendChild(button);this.list.appendChild(card)
  }
 }
 showMissingDialog(code){this.missingCode=code;document.getElementById("missing-room-code").textContent=code;this.dialog.classList.remove("hidden")}
 hideDialog(){this.dialog.classList.add("hidden");this.missingCode=""}
 confirmMissing(visibility){const code=this.missingCode;this.hideDialog();if(code)this.hostRoom(code,visibility)}
 showRoom(){
  this.mainPanel.classList.add("hidden");this.roomPanel.classList.remove("hidden");
  document.getElementById("active-room-code").textContent=this.roomCode;document.getElementById("active-room-visibility").textContent=this.visibility==="public"?"Public":"Private";
  this.worldStatus.setAttribute("value","ROOM "+this.roomCode);this.updateCount();if(this.game)this.game.setRoomRole()
 }
 showMenu(){
  this.roomPanel.classList.add("hidden");this.mainPanel.classList.remove("hidden");this.worldStatus.setAttribute("value","SOLO");
  history.replaceState(null,"",location.pathname+location.search)
 }
 updateCount(){
  const count=this.isHost?1+Array.from(this.connections.values()).filter(c=>c.open).length:this.rosterSize;
  document.getElementById("active-player-count").textContent=count+" / "+C.maxPlayers
 }
 leaveRoom(reason,silent){
  const hadRoom=!!this.roomCode;this.closing=true;
  if(this.isHost&&hadRoom)this.broadcast({type:"room-closed"});
  for(const c of this.connections.values())try{c.close()}catch(_){}this.connections.clear();
  if(this.hostConnection)try{this.hostConnection.close()}catch(_){}this.hostConnection=null;
  this.destroyPeer();this.clearAvatars();this.profiles.clear();this.roomCode="";this.visibility="";this.isHost=false;this.rosterSize=1;clearInterval(this.directoryTimer);
  if(this.game)this.game.resetToLobby(true);
  if(!silent){this.showMenu();this.setMenuStatus(reason||"Left room.","idle");setTimeout(()=>this.openDiscoveryPeer(),150)}
 }
 failToMenu(message){this.leaveRoom(message);this.setMenuStatus(message,"error")}
 copyCode(){navigator.clipboard.writeText(this.roomCode).then(()=>this.toast("Room code copied.")).catch(()=>this.toast("Room code: "+this.roomCode))}
 toast(text){const el=document.getElementById("toast");el.textContent=text;el.classList.remove("hidden");clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.add("hidden"),2200)}
 setMenuStatus(text,tone){this.menuStatus.textContent=text;this.menuStatus.dataset.tone=tone||"idle"}
 activeStatus(text,tone){const el=this.roomCode?this.roomStatus:this.menuStatus;el.textContent=text;el.dataset.tone=tone||"idle"}
 setControls(disabled){for(const id of["create-public","create-private","join-code","refresh-public"])document.getElementById(id).disabled=disabled}
}

window.WeirdVRMultiplayer=WeirdVRMultiplayer;
}());
