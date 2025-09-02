import * as THREE from "three";

export function Camera({
  fov = 75,
  aspect = window.innerWidth / window.innerHeight,
  near = 0.1,
  far = 1000,
  position = { x: 32, y: 16, z: 32 },
} = {}) {
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(position.x, position.y, position.z);

  return camera;
}
