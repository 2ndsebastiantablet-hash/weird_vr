(function(){
"use strict";

const MATCH_DURATION_MS = 4 * 60 * 1000;
const MATCH_START_DELAY_MS = 1400;
const MENU_TOGGLE_BUTTONS = new Set([3,4,5]);

const MAPS = Object.freeze({
  street: {
    id: "street",
    name: "Street City",
    rootId: "match-map-street",
    spawn: [100, 0, 8],
    monsterSpawns: [
      [92,0,-8],[100,0,-10],[108,0,-5],[91,0,7],[109,0,9],[100,0,15],
      [95,0,1],[105,0,2],[88,0,-1],[112,0,-1]
    ]
  },
  mansion: {
    id: "mansion",
    name: "Furnished Mansion",
    rootId: "match-map-mansion",
    spawn: [220, 0, 8],
    monsterSpawns: [
      [212,0,-8],[220,0,-11],[228,0,-7],[211,0,5],[229,0,6],[220,0,14],
      [215,0,0],[225,0,0],[208,0,-1],[232,0,-1]
    ]
  },
  forest: {
    id: "forest",
    name: "Pine Forest",
    rootId: "match-map-forest",
    spawn: [340, 0, 8],
    monsterSpawns: [
      [326,0,-12],[340,0,-15],[354,0,-10],[324,0,7],[356,0,8],[340,0,18],
      [331,0,0],[349,0,1],[322,0,-1],[358,0,-2]
    ]
  }
});

window.WEIRD_VR_MAPS = MAPS;
window.WEIRD_VR_MONSTER_POOL = window.WEIRD_VR_MONSTER_POOL || [];

function shuffled(values){
  const copy = values.slice();
  for(let i=copy.length-1;i>0;i--){
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const j = random[0] % (i+1);
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

function formatTime(ms){
  const seconds=Math.max(0,Math.ceil(ms/1000));
  const minutes=Math.floor(seconds/60);
  return String(minutes).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
}

AFRAME.registerComponent("vr-menu-hand",{
  schema:{hand:{default:"left"}},
  init:function(){
    this.lastToggle=0;
    this.onButton=this.onButton.bind(this);
    this.el.addEventListener("buttondown",this.onButton);
  },
  remove:function(){this.el.removeEventListener("buttondown",this.onButton)},
  onButton:function(event){
    const game=window.weirdVRMultiplayer&&window.weirdVRMultiplayer.game;
    if(!game)return;
    const id=Number(event.detail&&event.detail.id);
    if(id===0){
      if(!game.menuOpen)return;
      const ray=this.el.components.raycaster;
      const hit=ray&&ray.intersections&&ray.intersections[0];
      const target=hit&&hit.object&&hit.object.el;
      if(target&&target.classList.contains("vr-ui-button"))target.emit("click",{},false);
      return;
    }
    if(MENU_TOGGLE_BUTTONS.has(id)){
      const now=performance.now();
      if(now-this.lastToggle<300)return;
      this.lastToggle=now;
      game.toggleMenu();
    }
  }
});

class WeirdVRGameLoop{
  constructor(network){
    this.network=network;
    this.scene=network.scene;
    this.rig=document.getElementById("player-rig");
    this.lobby=document.getElementById("arena");
    this.menu=document.getElementById("vr-game-menu");
    this.startButton=document.getElementById("vr-start-match");
    this.startLabel=document.getElementById("vr-start-match-label");
    this.roleText=document.getElementById("vr-menu-role");
    this.stateText=document.getElementById("vr-menu-state");
    this.timerText=document.getElementById("match-timer-text");
    this.mapText=document.getElementById("match-map-text");
    this.waitingText=document.getElementById("waiting-message");
    this.menuOpen=false;
    this.state=this.emptyState();
    this.localParticipant=false;
    this.lastTimerSecond=-1;
    this.lastMenuToggle=0;
  }

  emptyState(){
    return {active:false,mapId:"",startAt:0,endAt:0,participantIds:[],monsterIds:[],monsterSpawns:[]};
  }

  start(){
    this.startButton.addEventListener("click",()=>this.hostStartMatch());
    document.getElementById("vr-close-menu").addEventListener("click",()=>this.setMenu(false));
    document.getElementById("vr-leave-room").addEventListener("click",()=>this.network.leaveRoom("You left the room."));
    this.scene.addEventListener("exit-vr",()=>this.setMenu(false));
    this.resetToLobby(false);
    this.updateMenu();
  }

  setRoomRole(){
    this.updateMenu();
  }

  toggleMenu(){
    if(!this.network.roomCode)return;
    const now=performance.now();
    if(now-this.lastMenuToggle<250)return;
    this.lastMenuToggle=now;
    this.setMenu(!this.menuOpen);
  }

  setMenu(open){
    this.menuOpen=!!open;
    this.menu.setAttribute("visible",this.menuOpen);
    const controllers=[document.getElementById("left-hand"),document.getElementById("right-hand")];
    for(const controller of controllers){
      const ray=controller&&controller.components.raycaster;
      if(controller)controller.setAttribute("raycaster","showLine",this.menuOpen);
      if(ray)ray.refreshObjects();
    }
    this.updateMenu();
  }

  updateMenu(){
    if(!this.roleText)return;
    const inRoom=!!this.network.roomCode;
    this.roleText.setAttribute("value",inRoom?(this.network.isHost?"YOU ARE THE HOST":"WAITING FOR HOST"):"NOT IN A ROOM");
    if(this.state.active){
      const map=MAPS[this.state.mapId];
      this.stateText.setAttribute("value","MATCH ACTIVE\n"+(map?map.name:"Unknown map")+"\n"+formatTime(this.state.endAt-Date.now()));
    }else{
      this.stateText.setAttribute("value","WAITING ROOM\nReady for the next match");
    }
    const canStart=inRoom&&this.network.isHost&&!this.state.active;
    this.startButton.setAttribute("visible",this.network.isHost);
    this.startButton.classList.toggle("vr-ui-button",canStart);
    this.startButton.setAttribute("material","color",canStart?"#7656ff":"#3a3d52");
    this.startLabel.setAttribute("value",this.state.active?"MATCH ACTIVE":"START MATCH");
  }

  hostStartMatch(){
    if(!this.network.isHost||!this.network.roomCode||this.state.active)return;
    const mapIds=Object.keys(MAPS);
    const random=new Uint32Array(1);crypto.getRandomValues(random);
    const mapId=mapIds[random[0]%mapIds.length];
    const participants=this.network.currentParticipantIds();
    const monsterPool=Array.isArray(window.WEIRD_VR_MONSTER_POOL)?window.WEIRD_VR_MONSTER_POOL:[];
    const monsters=shuffled(monsterPool).slice(0,6).map(item=>typeof item==="string"?item:item.id).filter(Boolean);
    const spawnPool=shuffled(MAPS[mapId].monsterSpawns).slice(0,6);
    const startAt=Date.now()+MATCH_START_DELAY_MS;
    const state={
      active:true,
      mapId,
      startAt,
      endAt:startAt+MATCH_DURATION_MS,
      participantIds:participants,
      monsterIds:monsters,
      monsterSpawns:spawnPool
    };
    this.network.broadcast({type:"match-start",state});
    this.applyMatchStart(state);
  }

  exportState(){
    return JSON.parse(JSON.stringify(this.state));
  }

  applyWelcome(state){
    if(state&&state.active)this.applyMatchStart(state);
    else this.resetToLobby(false);
  }

  handleNetworkMessage(data){
    if(!data||typeof data.type!=="string")return false;
    if(data.type==="match-start"){this.applyMatchStart(data.state);return true}
    if(data.type==="match-end"){this.applyMatchEnd(data.reason||"Match complete");return true}
    return false;
  }

  applyMatchStart(raw){
    const map=raw&&MAPS[raw.mapId];
    if(!map)return;
    const participants=Array.isArray(raw.participantIds)?raw.participantIds.filter(id=>typeof id==="string"):[];
    this.state={
      active:true,
      mapId:map.id,
      startAt:Number(raw.startAt)||Date.now(),
      endAt:Number(raw.endAt)||Date.now()+MATCH_DURATION_MS,
      participantIds:participants,
      monsterIds:Array.isArray(raw.monsterIds)?raw.monsterIds.slice(0,6):[],
      monsterSpawns:Array.isArray(raw.monsterSpawns)?raw.monsterSpawns.slice(0,6):[]
    };
    this.localParticipant=participants.includes(this.network.peerId);
    if(this.localParticipant){
      this.showMap(map.id);
      this.teleport(map.spawn);
      this.waitingText.setAttribute("visible",false);
      this.mapText.setAttribute("value",map.name.toUpperCase());
      this.timerText.setAttribute("visible",true);
      this.mapText.setAttribute("visible",true);
    }else{
      this.showLobby();
      this.teleport([0,0,8]);
      this.waitingText.setAttribute("value","MATCH IN PROGRESS\nWAIT FOR THE NEXT ROUND");
      this.waitingText.setAttribute("visible",true);
      this.timerText.setAttribute("visible",false);
      this.mapText.setAttribute("visible",false);
    }
    this.setMenu(false);
    this.lastTimerSecond=-1;
    this.updateMenu();
  }

  applyMatchEnd(){
    this.state=this.emptyState();
    this.localParticipant=false;
    this.showLobby();
    this.teleport([0,0,8]);
    this.timerText.setAttribute("visible",false);
    this.mapText.setAttribute("visible",false);
    this.waitingText.setAttribute("visible",false);
    this.setMenu(false);
    this.updateMenu();
  }

  resetToLobby(teleport=true){
    this.state=this.emptyState();
    this.localParticipant=false;
    this.showLobby();
    if(teleport)this.teleport([0,0,8]);
    if(this.timerText)this.timerText.setAttribute("visible",false);
    if(this.mapText)this.mapText.setAttribute("visible",false);
    if(this.waitingText)this.waitingText.setAttribute("visible",false);
    if(this.menu)this.setMenu(false);
  }

  showLobby(){
    if(this.lobby)this.lobby.setAttribute("visible",true);
    for(const map of Object.values(MAPS)){
      const root=document.getElementById(map.rootId);
      if(root)root.setAttribute("visible",false);
    }
  }

  showMap(mapId){
    if(this.lobby)this.lobby.setAttribute("visible",false);
    for(const map of Object.values(MAPS)){
      const root=document.getElementById(map.rootId);
      if(root)root.setAttribute("visible",map.id===mapId);
    }
  }

  teleport(position){
    if(!this.rig)return;
    this.rig.object3D.position.set(position[0],position[1]||0,position[2]);
    const locomotion=this.rig.components["gorilla-locomotion"];
    if(locomotion&&typeof locomotion.resetTracking==="function")locomotion.resetTracking();
  }

  tick(){
    if(!this.state.active)return;
    const now=Date.now();
    const remaining=this.state.endAt-now;
    if(this.localParticipant){
      const second=Math.max(0,Math.ceil(remaining/1000));
      if(second!==this.lastTimerSecond){
        this.lastTimerSecond=second;
        this.timerText.setAttribute("value",formatTime(remaining));
        if(this.menuOpen)this.updateMenu();
      }
    }
    if(this.network.isHost&&remaining<=0){
      this.network.broadcast({type:"match-end",reason:"Timer ended"});
      this.applyMatchEnd("Timer ended");
    }else if(!this.network.isHost&&remaining<-5000){
      this.applyMatchEnd("Timer ended");
    }
  }
}

window.WeirdVRGameLoop=WeirdVRGameLoop;
}());
