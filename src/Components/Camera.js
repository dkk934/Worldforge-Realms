import * as THREE from "three";

export class Camera{
  constructor(){
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      return camera;
  }
}
