(function(){
"use strict";
let started=false;

function startMultiplayer(){
 if(started)return;
 started=true;
 const status=document.getElementById("menu-status");
 try{
  if(!window.WeirdVRMultiplayer)throw new Error("Multiplayer script did not load");
  window.weirdVRMultiplayer=new window.WeirdVRMultiplayer();
  window.weirdVRMultiplayer.start();
 }catch(error){
  console.error("[WEIRD VR] Startup failed",error);
  if(status){
   status.textContent="Startup failed: "+(error&&error.message?error.message:"unknown error");
   status.dataset.tone="error";
  }
 }
}

function boot(){
 const scene=document.getElementById("game-scene");
 const status=document.getElementById("menu-status");
 if(!scene){
  if(status){status.textContent="Game scene failed to load.";status.dataset.tone="error"}
  return;
 }
 if(!window.isSecureContext&&location.hostname!=="localhost"){
  status.textContent="WebXR requires HTTPS. Enable GitHub Pages before testing on Quest.";
  status.dataset.tone="error";
 }
 if(navigator.xr&&navigator.xr.isSessionSupported){
  navigator.xr.isSessionSupported("immersive-vr").then(supported=>{
   if(!supported&&!started){status.textContent="Immersive VR is not available in this browser. Open the GitHub Pages site in Meta Quest Browser.";status.dataset.tone="warning"}
  }).catch(()=>{});
 }

 // A-Frame can finish loading before DOMContentLoaded on Quest. Handle both states.
 if(scene.hasLoaded||scene.isPlaying){
  startMultiplayer();
 }else{
  scene.addEventListener("loaded",startMultiplayer,{once:true});
  // Do not leave the menu stuck forever if Quest misses the loaded event.
  setTimeout(startMultiplayer,3500);
 }
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
}());
