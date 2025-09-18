import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { Render } from "./Components/Render";
// import { Camera } from "./Components/Camera";
import { Light } from "./Components/Lights";
// import { Helper } from "./Utilities/Helpers";
import { createUi } from "./Utilities/Ui";
// import { Player } from "./Components/Player/player";
import Physics from "./Physics";
import { World } from "./World";
import { block } from "./Utilities/Block";
import { ModelLoader } from "./Utilities/ModelLoader";
import { setupControls } from "./Utilities/controlsSetup";
import Controls from "./Components/Player/Controls";
 

// =====================
// Scene & Camera Setup
// =====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 30, 40);
const modelLoader = new ModelLoader();



// =====================
// Renderer & Stats
// =====================
const renderer = Render();
const stats = new Stats();
document.body.append(stats.dom);

// =====================
// Lights
// =====================
scene.add(Light.ambientLight);
const sun = Light.directionallight;
scene.add(sun);
scene.add(sun.target);

// =====================
// World & Player
// =====================
const world = new World();
world.generate(true);
scene.add(world);

const controlarType = setupControls()
const player = new Controls(scene,controlarType);
modelLoader.loadModels((models)=>{
  player.tool.setMesh(models.pickaxe)
})
let playerCamera = player.FPP
let tppCamera = player.TPP
let activeCamera = playerCamera;


window.addEventListener("keydown", (event) => {
  if (event.code === "KeyV") {
    activeCamera = (activeCamera === playerCamera) ? tppCamera : playerCamera;
    player.activeCamera = activeCamera;  // 👈 add this line
  }
});


// =====================
// Physics
// =====================
const physics = new Physics(scene);

// =====================
// Helpers & Controls
// =====================
// scene.add(Helper.grid);
// scene.add(Helper.axishlper);
// const controls = Helper.createOrbitControls(orcitcamera, renderer);
// controls.target.set(16, 0, 16);
// const DLHelper = Helper.DLightHelper(Light.directionallight);
// scene.add(DLHelper);
const dlshowdoh = new THREE.CameraHelper(Light.directionallight.shadow.camera);

// =====================
// UI State
// =====================
let obj = {
  shadow: false,
};

// =====================
// Event Handlers
// =====================
function onMouseDown(event) {
  if (player.controls.isLocked && player.selectedCoords) {
    if (player.activeBlockId === block.empty.id) {
      // console.log("remove", JSON.stringify(player.selectedCoords));
      world.removeBlock(
        player.selectedCoords.x,
        player.selectedCoords.y,
        player.selectedCoords.z
      );
      
      player.tool.startAnimation()
      // console.log("player animation");
      
    } else {
      // console.log("add", JSON.stringify(player.selectedCoords));
      world.addBlock(
        player.selectedCoords.x,
        player.selectedCoords.y,
        player.selectedCoords.z,
        player.activeBlockId
      );
    }
  }
}
document.addEventListener("mousedown", onMouseDown);

window.addEventListener("resize", () => {

  player.FPP.aspect = window.innerWidth / window.innerHeight;
  player.FPP.updateProjectionMatrix();
  if (player.TPP) {
    player.TPP.aspect = window.innerWidth / window.innerHeight;
    player.TPP.updateProjectionMatrix();
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =====================
// Animation Loop
// =====================
let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000;
  requestAnimationFrame(animate);

  if (player.controls.isLocked) {
    player.update(world);
    physics.update(dt, player, world);
    world.update(player);
    sun.position.copy(player.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.position);
  }
  if (obj.shadow) {
    scene.add(dlshowdoh);
  }
  if (!obj.shadow) {
    scene.remove(dlshowdoh);
  }

    if (activeCamera === tppCamera) {
    player.updateTPPCamera();
  }

  renderer.render(
    scene,
    activeCamera
  );
  stats.update();

  previousTime = currentTime;
}

// =====================
// UI & Start
// =====================
createUi(world, obj);
animate();


