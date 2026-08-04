(function(){
"use strict";
const D=window.WEIRD_VR_COMPLEX_DATA;
const R=window.WEIRD_VR_COMPLEX_RENDERER;
if(!D||!R){console.error("[WEIRD VR] Procedural complex modules failed to load.");return}
function inspect(seed){return R.summarizeLayout(D.buildLayout(seed||"preview"),{x:0,y:0,z:0})}
function generate(seed){return R.renderAndSummarize(D.buildLayout(seed||"preview"))}
window.WEIRD_VR_COMPLEX=Object.freeze({
rootId:R.ROOT_ID,
gridUnit:D.GRID_UNIT,
mapSize:D.MAP_SIZE,
ceilingHeight:D.LEVEL_HEIGHT,
collisionPolicy:"all-gameplay-geometry",
firstBatchIds:D.FIRST_BATCH_IDS,
secondBatchIds:D.SECOND_BATCH_IDS,
pieceDefinitions:D.PIECES,
inspect,
generate,
refreshCollisions:R.refreshCollisions
});
const initialize=()=>generate("preview");
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});
else initialize();
}());
