import * as THREE from "three";

export const Light = ambientLight();

function ambientLight(color = 0xffffff, intensity = 1) {
  const ambientLight = new THREE.AmbientLight(color, intensity);

  const directionallight = new THREE.DirectionalLight(color,intensity = 2);
  directionallight.position.set(50, 50, 50);
  directionallight.castShadow = true;
  directionallight.shadow.camera.left = -50;
  directionallight.shadow.camera.right = 50;
  directionallight.shadow.camera.bottom = -50;
  directionallight.shadow.camera.top = 50;
  directionallight.shadow.camera.near = 0.1;
  directionallight.shadow.camera.far = 1000;
  directionallight.shadow.bias = -0.0005
  directionallight.shadow.mapSize = new THREE.Vector2(512, 512)


  return { ambientLight, directionallight };
}
