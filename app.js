(function(){
"use strict";
function boot(){
 const scene=document.getElementById("game-scene");
 const status=document.getElementById("menu-status");
 if(!window.isSecureContext&&location.hostname!=="localhost"){
  status.textContent="WebXR requires HTTPS. Enable GitHub Pages before testing on Quest.";
  status.dataset.tone="error";
 }
 if(navigator.xr&&navigator.xr.isSessionSupported){
  navigator.xr.isSessionSupported("immersive-vr").then(supported=>{
   if(!supported){status.textContent="Immersive VR is not available in this browser. Open the GitHub Pages site in Meta Quest Browser.";status.dataset.tone="warning"}
  }).catch(()=>{});
 }
 scene.addEventListener("loaded",()=>{window.weirdVRMultiplayer=new window.WeirdVRMultiplayer();window.weirdVRMultiplayer.start()},{once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
}());
