(function(){
"use strict";
const B=window.WEIRD_VR_COMPLEX_DATA;
if(!B){console.error("[WEIRD VR] Base complex data missing before batch 3.");return}
function connector(dir,x,z,levelOffset){return{dir,x,z,levelOffset:levelOffset||0,type:"H"}}
const THIRD_PIECES=Object.freeze({
longChamber:{id:"longChamber",name:"Long Chamber",category:"room",width:12,depth:18,weight:5,rotations:[0,90,180,270],connectors:[connector("N",0,-9),connector("S",0,9)],render:"longChamber"},
storageBlockRoom:{id:"storageBlockRoom",name:"Storage Block Room",category:"room",width:18,depth:18,weight:4,rotations:[0,90,180,270],connectors:[connector("N",0,-9),connector("S",0,9),connector("E",9,0)],render:"storage"},
sunkenFloorRoom:{id:"sunkenFloorRoom",name:"Sunken Floor Room",category:"platforming",width:18,depth:18,weight:4,rotations:[0,90,180,270],connectors:[connector("N",0,-9),connector("S",0,9)],render:"sunken"},
raisedRingRoom:{id:"raisedRingRoom",name:"Raised Ring Room",category:"platforming",width:18,depth:18,weight:4,rotations:[0,90,180,270],connectors:[connector("N",0,-9),connector("E",9,0),connector("S",0,9),connector("W",-9,0)],render:"raisedRing"},
twinChamber:{id:"twinChamber",name:"Twin Chamber",category:"room",width:18,depth:12,weight:5,rotations:[0,90,180,270],connectors:[connector("W",-9,0),connector("E",9,0),connector("N",0,-6)],render:"twin"},
dividerRoom:{id:"dividerRoom",name:"Divider Room",category:"room",width:18,depth:18,weight:5,rotations:[0,90,180,270],connectors:[connector("N",0,-9),connector("S",0,9),connector("W",-9,0)],render:"divider"},
observationRoom:{id:"observationRoom",name:"Observation Room",category:"room",width:18,depth:12,weight:4,rotations:[0,90,180,270],connectors:[connector("N",0,-6),connector("S",0,6)],render:"observation"},
columnForestRoom:{id:"columnForestRoom",name:"Column Forest Room",category:"room",width:18,depth:18,weight:4,rotations:[0,90,180,270],connectors:[connector("N",0,-9),connector("E",9,0),connector("S",0,9),connector("W",-9,0)],render:"columnForest"},
darkRoom:{id:"darkRoom",name:"Edge-Light Room",category:"room",width:12,depth:12,weight:3,rotations:[0,90,180,270],connectors:[connector("N",0,-6),connector("S",0,6),connector("E",6,0)],render:"edgeLight"},
emergencyLightRoom:{id:"emergencyLightRoom",name:"Emergency Light Room",category:"room",width:18,depth:12,weight:4,rotations:[0,90,180,270],connectors:[connector("N",0,-6),connector("S",0,6)],render:"emergency"},
checkerArena:{id:"checkerArena",name:"Checker Arena",category:"room",width:18,depth:18,weight:3,rotations:[0,90,180,270],connectors:[connector("N",0,-9),connector("E",9,0),connector("S",0,9),connector("W",-9,0)],render:"arena"},
collapsedRoom:{id:"collapsedRoom",name:"Collapsed Room",category:"platforming",width:18,depth:18,weight:4,rotations:[0,90,180,270],connectors:[connector("N",0,-9),connector("S",0,9),connector("E",9,0)],render:"collapsed"}
});
const THIRD_BATCH_IDS=Object.freeze(Object.keys(THIRD_PIECES));
const PIECES=Object.freeze({...B.PIECES,...THIRD_PIECES});
function shuffled(values,random){const copy=values.slice();for(let i=copy.length-1;i>0;i-=1){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function rotatedDimensions(definition,rotation){const n=((rotation%360)+360)%360;return n===90||n===270?{width:definition.depth,depth:definition.width}:{width:definition.width,depth:definition.depth}}
function createPlacedPiece(definition,x,z,baseLevel,rotation,sequence){const dimensions=rotatedDimensions(definition,rotation),placed={id:`${definition.id}-${sequence}`,definition,x,z,baseLevel,rotation,width:dimensions.width,depth:dimensions.depth,connectors:[]};placed.connectors=definition.connectors.map((source,index)=>{const point=B.rotatePoint(source.x,source.z,rotation);return{id:`${placed.id}-connector-${index}`,piece:placed,source,x:x+point.x,z:z+point.z,dir:B.rotateDirection(source.dir,rotation),level:baseLevel+source.levelOffset,status:"open",connectedTo:null}});return placed}
function occupiedLevels(piece){return(piece.definition.occupiedLevelOffsets||[0]).map(offset=>piece.baseLevel+offset)}
function overlaps(a,b){const epsilon=.08;return Math.abs(a.x-b.x)*2<a.width+b.width-epsilon&&Math.abs(a.z-b.z)*2<a.depth+b.depth-epsilon}
function canPlace(piece,pieces){if(piece.baseLevel<0||piece.baseLevel>1)return false;if(piece.x-piece.width/2<-B.HALF_SIZE+3||piece.x+piece.width/2>B.HALF_SIZE-3)return false;if(piece.z-piece.depth/2<-B.HALF_SIZE+3||piece.z+piece.depth/2>B.HALF_SIZE-3)return false;const levels=occupiedLevels(piece);return !pieces.some(existing=>occupiedLevels(existing).some(level=>levels.includes(level))&&overlaps(piece,existing))}
function opposite(dir){return B.DIRECTIONS[dir].opposite}
function tryPlace(target,definition,layout,random){for(const rotation of shuffled(definition.rotations,random)){for(const connectorIndex of shuffled(definition.connectors.map((_,index)=>index),random)){const source=definition.connectors[connectorIndex];if(B.rotateDirection(source.dir,rotation)!==opposite(target.dir))continue;const baseLevel=target.level-source.levelOffset,point=B.rotatePoint(source.x,source.z,rotation),candidate=createPlacedPiece(definition,target.x-point.x,target.z-point.z,baseLevel,rotation,layout.sequence++);if(!canPlace(candidate,layout.pieces))continue;const matching=candidate.connectors[connectorIndex];target.status=matching.status="connected";target.connectedTo=matching;matching.connectedTo=target;layout.pieces.push(candidate);return candidate}}return null}
function restoreCap(layout,cap,target,capConnector){target.status="connected";target.connectedTo=capConnector;capConnector.status="connected";capConnector.connectedTo=target;layout.pieces.push(cap)}
function replaceCapWithPiece(layout,definition,random){const caps=shuffled(layout.pieces.filter(piece=>piece.definition.id==="wallCap"),random);for(const cap of caps){const capConnector=cap.connectors[0],target=capConnector&&capConnector.connectedTo;if(!target)continue;const index=layout.pieces.indexOf(cap);if(index<0)continue;layout.pieces.splice(index,1);target.status="open";target.connectedTo=null;capConnector.status="open";capConnector.connectedTo=null;const placed=tryPlace(target,definition,layout,random);if(placed)return placed;restoreCap(layout,cap,target,capConnector)}return null}
function appendSpawns(layout,piece){const y=piece.baseLevel*B.LEVEL_HEIGHT;layout.navigationPoints.push([piece.x,y,piece.z]);if(["room","junction","platforming"].includes(piece.definition.category))layout.monsterSpawns.push([piece.x,y,piece.z])}
function buildLayout(seed){const layout=B.buildLayout(seed),random=layout.random;layout.thirdBatchMissed=[];for(const definition of shuffled(Object.values(THIRD_PIECES),random)){const placed=replaceCapWithPiece(layout,definition,random);if(placed)appendSpawns(layout,placed);else layout.thirdBatchMissed.push(definition.id)}return layout}
window.WEIRD_VR_COMPLEX_DATA=Object.freeze({...B,PIECES,THIRD_BATCH_IDS,buildLayout});
}());
