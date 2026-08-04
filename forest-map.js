(function(){
"use strict";

const ROOT_ID="match-map-forest";
const MAP_WIDTH=124;
const MAP_DEPTH=124;
const HALF_WIDTH=MAP_WIDTH/2;
const HALF_DEPTH=MAP_DEPTH/2;
const WORLD_ORIGIN={x:100,y:0,z:0};
const PLAYER_SPAWN=[100,0,10];
const LOCAL_MONSTER_SPAWNS=[
  [-35,0,-28],[-18,0,-35],[0,0,-40],[25,0,-34],[38,0,-16],[40,0,10],
  [32,0,32],[8,0,38],[-18,0,36],[-38,0,26],[-42,0,2],[-28,0,-2],
  [18,0,18],[-12,0,16]
];
const colliderRecords=[];
let built=false;
let refreshTimer=0;

function byId(id){return document.getElementById(id)}

function make(tag,attributes,parent){
  const element=document.createElement(tag);
  for(const[name,value]of Object.entries(attributes||{})){
    if(value!==undefined&&value!==null&&value!=="")element.setAttribute(name,String(value));
  }
  if(parent)parent.appendChild(element);
  return element;
}

function vectorSize(size){return{x:Number(size[0]),y:Number(size[1]),z:Number(size[2])}}

function installCollider(record){
  const element=record.element;
  if(!element||!element.object3D)return false;
  try{
    if(!element.components)element.components={};
    const component=element.components["locomotion-collider"];
    if(!component||!component.data){
      element.components["locomotion-collider"]={data:{type:"box",size:vectorSize(record.size)}};
    }else{
      component.data.type="box";
      component.data.size=vectorSize(record.size);
    }
    return true;
  }catch(error){
    console.warn("[WEIRD VR] Forest collider registration failed",error);
    return false;
  }
}

function registerSolid(element,size){
  const normalized=size.map(value=>Number(value));
  element.dataset.weirdSolid="true";
  element.setAttribute("locomotion-collider",`type:box;size:${normalized.join(" ")}`);
  const record={element,size:normalized};
  colliderRecords.push(record);
  installCollider(record);
  return element;
}

function solidBox(parent,position,size,color,options){
  const config=options||{};
  const element=make("a-box",{
    position,
    width:size[0],height:size[1],depth:size[2],
    color,
    rotation:config.rotation,
    material:config.material,
    opacity:config.opacity,
    transparent:config.transparent,
    visible:config.visible
  },parent);
  return registerSolid(element,size);
}

function solidCylinder(parent,position,radius,height,color,options){
  const config=options||{};
  const element=make("a-cylinder",{
    position,radius,height,color,
    rotation:config.rotation,
    material:config.material,
    "segments-radial":config.segmentsRadial||8
  },parent);
  return registerSolid(element,[radius*2,height,radius*2]);
}

function decorativeBox(parent,position,size,color,options){
  const config=options||{};
  return make("a-box",{
    position,width:size[0],height:size[1],depth:size[2],color,
    rotation:config.rotation,material:config.material,
    opacity:config.opacity,transparent:config.transparent
  },parent);
}

function seededRandom(seed){
  let state=seed>>>0;
  return function(){
    state+=0x6d2b79f5;
    let value=state;
    value=Math.imul(value^(value>>>15),value|1);
    value^=value+Math.imul(value^(value>>>7),value|61);
    return((value^(value>>>14))>>>0)/4294967296;
  };
}

function addSky(root){
  make("a-sphere",{
    position:"0 25 0",
    radius:"96",
    "segments-width":"32",
    "segments-height":"18",
    material:"shader:flat;color:#72bce5;side:back;depthWrite:false"
  },root);

  make("a-sphere",{
    position:"-38 46 -70",
    radius:"6.5",
    "segments-width":"16",
    "segments-height":"10",
    material:"shader:flat;color:#fff0a8;emissive:#ffd86b;emissiveIntensity:1.4"
  },root);

  const cloudGroups=[[-34,29,-48],[4,34,-58],[38,27,-42],[-46,25,8],[43,33,15]];
  for(const[x,y,z]of cloudGroups){
    const cloud=make("a-entity",{position:`${x} ${y} ${z}`},root);
    for(const[dx,dy,dz,sx,sy,sz]of[
      [-3,0,0,6,2.4,2.6],[0,.6,0,7,3.2,3.2],[3.2,0,0,5.6,2.3,2.5],[1.1,-.4,0,8,1.9,2.8]
    ])decorativeBox(cloud,`${dx} ${dy} ${dz}`,[sx,sy,sz],"#f4fbff",{material:"shader:flat;opacity:.92;transparent:true"});
  }

  const mountainData=[
    [-52,7,-54,13,28,"#527aa0"],[-24,6,-61,12,24,"#6088ab"],[7,8,-66,16,32,"#4e7598"],
    [38,7,-58,14,27,"#5c84a6"],[58,6,-34,12,24,"#4c7395"],[62,7,2,15,29,"#587fa1"],
    [54,6,38,13,25,"#648bad"],[26,7,58,15,30,"#52799b"],[-8,6,63,13,25,"#638aac"],
    [-39,7,57,15,30,"#4f7698"],[-61,6,29,12,24,"#5c83a5"],[-64,7,-8,14,28,"#507799"]
  ];
  for(const[x,y,z,radius,height,color]of mountainData){
    make("a-cone",{
      position:`${x} ${y} ${z}`,
      "radius-bottom":radius,
      "radius-top":"0",
      height,
      color,
      "segments-radial":"7",
      material:`shader:flat;color:${color}`
    },root);
  }
}

function addLights(root){
  make("a-entity",{light:"type:ambient;color:#d8efff;intensity:.8"},root);
  make("a-entity",{light:"type:hemisphere;color:#f5fbff;groundColor:#33523d;intensity:1.0"},root);
  make("a-entity",{
    position:"-28 42 -34",
    light:"type:directional;color:#fff5c7;intensity:1.25;castShadow:false"
  },root);
  make("a-entity",{
    position:"18 5 17",
    light:"type:point;color:#ffb45f;intensity:.75;distance:15;decay:2;castShadow:false",
    animation__campglow:"property:light.intensity;from:.58;to:.9;dur:900;dir:alternate;loop:true;easing:easeInOutSine"
  },root);
  make("a-entity",{position:"-25 4 -18",light:"type:point;color:#ffd98a;intensity:.65;distance:13;decay:2;castShadow:false"},root);
  make("a-entity",{position:"30 7 24",light:"type:point;color:#cde9ff;intensity:.55;distance:13;decay:2;castShadow:false"},root);
}

function addGround(root){
  solidBox(root,"0 -0.3 0",[MAP_WIDTH,.6,MAP_DEPTH],"#4f7d4d",{material:"roughness:1;metalness:0"});

  decorativeBox(root,"0 .025 7",[92,.04,7],"#a88d66",{material:"shader:flat;color:#a88d66"});
  decorativeBox(root,"-22 .03 -12",[7,.05,42],"#9f8662",{rotation:"0 18 0",material:"shader:flat;color:#9f8662"});
  decorativeBox(root,"24 .03 12",[7,.05,39],"#9f8662",{rotation:"0 -20 0",material:"shader:flat;color:#9f8662"});

  decorativeBox(root,"14 .04 0",[8,.06,103],"#4b9ac4",{material:"shader:flat;color:#4b9ac4;opacity:.88;transparent:true"});
  decorativeBox(root,"10 .055 0",[.5,.04,103],"#c9e9f7",{material:"shader:flat;color:#c9e9f7;opacity:.7;transparent:true"});
  decorativeBox(root,"18 .055 0",[.5,.04,103],"#c9e9f7",{material:"shader:flat;color:#c9e9f7;opacity:.7;transparent:true"});
}

function addTree(root,x,z,scale,colors){
  const trunkHeight=4.4*scale;
  const trunkRadius=.52*scale;
  solidCylinder(root,`${x} ${trunkHeight/2} ${z}`,trunkRadius,trunkHeight,colors.trunk,{segmentsRadial:7,material:`shader:flat;color:${colors.trunk}`});

  make("a-cone",{
    position:`${x} ${trunkHeight+1.45*scale} ${z}`,
    "radius-bottom":2.45*scale,
    "radius-top":".18",
    height:4.4*scale,
    color:colors.low,
    "segments-radial":"7",
    material:`shader:flat;color:${colors.low}`
  },root);
  make("a-cone",{
    position:`${x} ${trunkHeight+3.6*scale} ${z}`,
    "radius-bottom":1.9*scale,
    "radius-top":".12",
    height:4.0*scale,
    color:colors.high,
    "segments-radial":"7",
    material:`shader:flat;color:${colors.high}`
  },root);
}

function blockedTreeZone(x,z){
  const zones=[
    [0,9,16],[-25,-18,12],[23,-22,10],[18,17,11],[-28,26,13],[30,25,13],[14,7,10],[-5,-35,9]
  ];
  return zones.some(([zx,zz,radius])=>Math.hypot(x-zx,z-zz)<radius);
}

function addForest(root){
  const random=seededRandom(0x57f0a5);
  const palettes=[
    {trunk:"#6f4a2f",low:"#2f6f45",high:"#3d8656"},
    {trunk:"#765038",low:"#315f42",high:"#427b51"},
    {trunk:"#65452f",low:"#28704f",high:"#399068"}
  ];
  let count=0;
  let attempts=0;
  while(count<50&&attempts<900){
    attempts+=1;
    const x=(random()-.5)*112;
    const z=(random()-.5)*112;
    if(Math.abs(x)>56||Math.abs(z)>56||blockedTreeZone(x,z))continue;
    if(Math.hypot(x,z)<18)continue;
    const scale=.78+random()*.52;
    addTree(root,x,z,scale,palettes[Math.floor(random()*palettes.length)]);
    count+=1;
  }

  const boundaryTrees=[];
  for(let value=-54;value<=54;value+=9){
    boundaryTrees.push([value,-56],[value,56],[-56,value],[56,value]);
  }
  boundaryTrees.forEach(([x,z],index)=>addTree(root,x,z,.92+(index%3)*.08,palettes[index%palettes.length]));
}

function addRock(root,x,y,z,sx,sy,sz,color){
  solidBox(root,`${x} ${y+sy/2} ${z}`,[sx,sy,sz],color,{rotation:`0 ${(x*13+z*7)%35} 0`,material:`shader:flat;color:${color}`});
}

function addRockRidge(root){
  const rocks=[
    [-35,0,24,7,2.2,8],[-30,0,27,8,3.6,7],[-24,0,29,7,5.2,8],[-18,0,31,6,3.2,7],
    [-29,3.6,26,5,2.4,5],[-23,5.2,29,4.5,2.2,4.5],[-39,0,30,5,1.8,6],[-14,0,25,5,2.1,5]
  ];
  rocks.forEach((rock,index)=>addRock(root,...rock,index%2?"#69747b":"#78838a"));
  solidBox(root,"-26 6.7 28",[7,.8,7],"#8a7350",{material:"shader:flat;color:#8a7350"});
}

function addCabin(root,x,z,scale,label){
  const group=make("a-entity",{position:`${x} 0 ${z}`},root);
  const width=12*scale,depth=9*scale,height=5.4*scale;
  solidBox(group,`0 ${.3*scale} 0`,[width,.6*scale,depth],"#8b643f",{material:"shader:flat;color:#8b643f"});
  solidBox(group,`${-width/2+.35*scale} ${height/2} 0`,[.7*scale,height,depth],"#a6794a",{material:"shader:flat;color:#a6794a"});
  solidBox(group,`${width/2-.35*scale} ${height/2} 0`,[.7*scale,height,depth],"#a6794a",{material:"shader:flat;color:#a6794a"});
  solidBox(group,`0 ${height/2} ${-depth/2+.35*scale}`,[width,height,.7*scale],"#9b7046",{material:"shader:flat;color:#9b7046"});
  const frontZ=depth/2-.35*scale;
  const doorWidth=2.5*scale;
  const side=(width-doorWidth)/2;
  solidBox(group,`${-width/2+side/2} ${height/2} ${frontZ}`,[side,height,.7*scale],"#9b7046",{material:"shader:flat;color:#9b7046"});
  solidBox(group,`${width/2-side/2} ${height/2} ${frontZ}`,[side,height,.7*scale],"#9b7046",{material:"shader:flat;color:#9b7046"});
  solidBox(group,`0 ${height-0.75*scale} ${frontZ}`,[doorWidth,1.5*scale,.7*scale],"#9b7046",{material:"shader:flat;color:#9b7046"});
  solidBox(group,`0 ${height+.35*scale} 0`,[width+1.2*scale,.7*scale,depth+1.2*scale],"#5d4638",{material:"shader:flat;color:#5d4638"});
  solidBox(group,`0 ${height+.9*scale} 0`,[width*.78,.55*scale,depth+1.5*scale],"#674b39",{material:"shader:flat;color:#674b39"});
  solidBox(group,`0 ${.35*scale} ${depth/2+1.5*scale}`,[width*.72,.7*scale,3*scale],"#72543a",{material:"shader:flat;color:#72543a"});
  decorativeBox(group,`${-width*.28} ${height*.58} ${-depth/2-.02}`,[2.1*scale,1.6*scale,.08],"#aee8ff",{material:"shader:flat;color:#aee8ff;emissive:#70b8d8;emissiveIntensity:.6"});
  decorativeBox(group,`${width*.28} ${height*.58} ${-depth/2-.02}`,[2.1*scale,1.6*scale,.08],"#aee8ff",{material:"shader:flat;color:#aee8ff;emissive:#70b8d8;emissiveIntensity:.6"});
  make("a-text",{value:label,align:"center",width:`${5*scale}`,color:"#fff3c9",position:`0 ${height-1.05*scale} ${frontZ+.38}`},group);
}

function addCamp(root){
  solidBox(root,"18 .22 17",[7,.44,7],"#7c6b50",{material:"shader:flat;color:#7c6b50"});
  for(const angle of[0,45,90,135]){
    const radians=angle*Math.PI/180;
    const x=18+Math.cos(radians)*2.2;
    const z=17+Math.sin(radians)*2.2;
    solidBox(root,`${x} .48 ${z}`,[3.8,.75,.65],"#755035",{rotation:`0 ${angle} 0`,material:"shader:flat;color:#755035"});
  }
  make("a-cone",{
    position:"18 1.35 17","radius-bottom":"1.1","radius-top":".18",height:"2.6",
    color:"#ff9d3e","segments-radial":"6",
    material:"shader:flat;color:#ff9d3e;emissive:#ff6d28;emissiveIntensity:1.2",
    animation__fire:"property:scale;from:1 .85 1;to:.82 1.12 .82;dur:480;dir:alternate;loop:true;easing:easeInOutSine"
  },root);
  for(const[x,z,rotation]of[[12,17,0],[24,17,0],[18,11,90],[18,23,90]]){
    solidBox(root,`${x} .65 ${z}`,[5.5,1,1.1],"#795338",{rotation:`0 ${rotation} 0`,material:"shader:flat;color:#795338"});
  }
}

function addBridge(root){
  for(let z=-1;z<=15;z+=2){
    solidBox(root,`14 .55 ${z}`,[8.8,.6,1.7],"#8b633d",{material:"shader:flat;color:#8b633d"});
  }
  solidBox(root,"9.8 1.45 7",[.45,2.3,18],"#6c4b32",{material:"shader:flat;color:#6c4b32"});
  solidBox(root,"18.2 1.45 7",[.45,2.3,18],"#6c4b32",{material:"shader:flat;color:#6c4b32"});
  for(let z=-1;z<=15;z+=4){
    solidBox(root,`9.8 1.6 ${z}`,[.65,2.6,.65],"#735038",{material:"shader:flat;color:#735038"});
    solidBox(root,`18.2 1.6 ${z}`,[.65,2.6,.65],"#735038",{material:"shader:flat;color:#735038"});
  }
}

function addLookout(root){
  const x=30,z=25;
  for(const[dx,dz]of[[-4,-4],[4,-4],[-4,4],[4,4]])solidBox(root,`${x+dx} 3 ${z+dz}`,[.9,6,.9],"#6f5037",{material:"shader:flat;color:#6f5037"});
  solidBox(root,`${x} 6.2 ${z}`,[10,.8,10],"#8b673f",{material:"shader:flat;color:#8b673f"});
  for(const[dx,dz,sx,sz]of[[0,-4.6,10,.4],[0,4.6,10,.4],[-4.6,0,.4,10],[4.6,0,.4,10]])solidBox(root,`${x+dx} 7.5 ${z+dz}`,[sx,2.2,sz],"#765538",{material:"shader:flat;color:#765538"});
  const steps=[
    [22,0.45,24,3,0.9,3],[23.8,1.0,24,3,2,3],[25.6,1.55,24,3,3.1,3],[27.4,2.1,24,3,4.2,3],[29.2,2.65,24,3,5.3,3]
  ];
  steps.forEach(([px,py,pz,sx,sy,sz])=>solidBox(root,`${px} ${py} ${pz}`,[sx,sy,sz],"#7e603f",{material:"shader:flat;color:#7e603f"}));
}

function addRuins(root){
  const x=-5,z=-35;
  solidBox(root,`${x} .35 ${z}`,[13,.7,13],"#7a8584",{material:"shader:flat;color:#7a8584"});
  solidBox(root,`${x-5.7} 2.7 ${z}`,[1.2,5.4,12],"#697575",{material:"shader:flat;color:#697575"});
  solidBox(root,`${x+5.7} 1.8 ${z}`,[1.2,3.6,12],"#697575",{material:"shader:flat;color:#697575"});
  solidBox(root,`${x} 2.4 ${z-5.7}`,[12,4.8,1.2],"#738080",{material:"shader:flat;color:#738080"});
  solidBox(root,`${x-2.5} 1.2 ${z+5.7}`,[5,2.4,1.2],"#738080",{material:"shader:flat;color:#738080"});
  solidBox(root,`${x+4.5} .75 ${z+5.7}`,[3,1.5,1.2],"#738080",{material:"shader:flat;color:#738080"});
  for(const[dx,dz,h]of[[-3,-3,3.8],[3,-3,5],[-3,3,4.6],[3,3,3.2]])solidBox(root,`${x+dx} ${h/2} ${z+dz}`,[1.3,h,1.3],"#667272",{material:"shader:flat;color:#667272"});
}

function addStumpCourse(root){
  const stumps=[[-15,-5,1.3],[-11,-2,2.1],[-7,1,2.8],[-4,4,1.8],[0,6,3.4],[4,5,2.4]];
  for(const[x,z,height]of stumps){
    solidCylinder(root,`${x} ${height/2} ${z}`,1.25,height,"#795235",{segmentsRadial:8,material:"shader:flat;color:#795235"});
    decorativeBox(root,`${x} ${height+.03} ${z}`,[1.9,.06,1.9],"#c49a64",{material:"shader:flat;color:#c49a64"});
  }
}

function addScatteredRocks(root){
  const rocks=[
    [-44,-18,3.6,1.8,3.2],[-39,-12,2.4,1.3,2.7],[-32,-42,4.2,2.2,3.6],[-20,45,3.8,1.8,3.4],
    [1,46,4.4,2.1,3.8],[20,43,3.2,1.5,2.8],[43,38,4.8,2.3,4],[47,2,3.5,1.7,3],
    [44,-30,4.1,2,3.2],[27,-45,3.2,1.4,2.6],[-48,14,3.8,1.8,3.2],[-8,-49,4.3,2,3.7]
  ];
  rocks.forEach(([x,z,sx,sy,sz],index)=>addRock(root,x,0,z,sx,sy,sz,index%2?"#718087":"#7c898f"));
}

function addBoundaries(root){
  const height=16;
  solidBox(root,`0 ${height/2} ${-HALF_DEPTH}`,[MAP_WIDTH,height,.8],"#000",{visible:false});
  solidBox(root,`0 ${height/2} ${HALF_DEPTH}`,[MAP_WIDTH,height,.8],"#000",{visible:false});
  solidBox(root,`${-HALF_WIDTH} ${height/2} 0`,[.8,height,MAP_DEPTH],"#000",{visible:false});
  solidBox(root,`${HALF_WIDTH} ${height/2} 0`,[.8,height,MAP_DEPTH],"#000",{visible:false});
}

function refreshCollisions(attempt){
  const scene=byId("game-scene");
  const rig=byId("player-rig");
  if(!scene||!rig)return;
  if(scene.object3D)scene.object3D.updateMatrixWorld(true);
  for(const record of colliderRecords)installCollider(record);
  const candidates=Array.from(scene.querySelectorAll("[locomotion-collider]"));
  for(const record of colliderRecords)if(!candidates.includes(record.element))candidates.push(record.element);
  const active=candidates.filter(element=>element&&element.object3D&&element.components&&element.components["locomotion-collider"]&&element.components["locomotion-collider"].data);
  const locomotion=rig.components&&rig.components["gorilla-locomotion"];
  if(locomotion)locomotion.colliders=active;
  const root=byId(ROOT_ID);
  if(root){
    root.dataset.colliderCount=String(colliderRecords.length);
    root.dataset.activeColliderCount=String(active.length);
    root.dataset.collisionReady=String(colliderRecords.every(record=>record.element.components&&record.element.components["locomotion-collider"]));
  }
  if(attempt<8){
    const delays=[0,20,50,100,180,320,550,900,1400];
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>refreshCollisions(attempt+1),delays[Math.min(attempt+1,delays.length-1)]);
  }
}

function build(){
  const root=byId(ROOT_ID);
  if(!root)return false;
  if(built)return true;
  colliderRecords.length=0;
  root.replaceChildren();
  addSky(root);
  addLights(root);
  addGround(root);
  addForest(root);
  addScatteredRocks(root);
  addRockRidge(root);
  addCabin(root,-25,-18,1,"RANGER CABIN");
  addCabin(root,24,-22,.72,"SUPPLY SHED");
  addCamp(root);
  addBridge(root);
  addLookout(root);
  addRuins(root);
  addStumpCourse(root);
  addBoundaries(root);
  root.dataset.mapStyle="compound-inspired-forest";
  root.dataset.built="true";
  root.dataset.landmarks="ranger-cabin,supply-shed,camp,bridge,lookout,rock-ridge,ruins,stump-course";
  built=true;
  refreshCollisions(0);
  const scene=byId("game-scene");
  if(scene&&!scene.dataset.forestCollisionHook){
    scene.dataset.forestCollisionHook="true";
    scene.addEventListener("enter-vr",()=>refreshCollisions(0));
  }
  return true;
}

function ensureBuilt(){
  if(!build())return null;
  return{
    id:"forest",
    name:"Evergreen Outpost",
    spawn:PLAYER_SPAWN.slice(),
    monsterSpawns:LOCAL_MONSTER_SPAWNS.map(([x,y,z])=>[x+WORLD_ORIGIN.x,y+WORLD_ORIGIN.y,z+WORLD_ORIGIN.z]),
    colliderCount:colliderRecords.length
  };
}

window.WEIRD_VR_FOREST=Object.freeze({
  rootId:ROOT_ID,
  name:"Evergreen Outpost",
  spawn:PLAYER_SPAWN.slice(),
  monsterSpawns:LOCAL_MONSTER_SPAWNS.map(([x,y,z])=>[x+WORLD_ORIGIN.x,y+WORLD_ORIGIN.y,z+WORLD_ORIGIN.z]),
  ensureBuilt,
  refreshCollisions:()=>refreshCollisions(0),
  isBuilt:()=>built
});
}());
