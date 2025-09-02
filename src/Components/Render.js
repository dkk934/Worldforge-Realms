import * as THREE from "three";

export function Render() {
  const doc = document.getElementById("world");
  if (!doc) throw new Error("Canvas element not found");

  const renderer = new THREE.WebGLRenderer({
    canvas: doc,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type =THREE.PCFSoftShadowMap
  return renderer;
}
