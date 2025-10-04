import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { Render } from "./Components/Render";
import { Light } from "./Components/Lights";
import { createUi } from "./Utilities/Ui";
import Physics from "./Physics";
import { World } from "./World";
import { block } from "./Utilities/Block";
import { ModelLoader } from "./Utilities/ModelLoader";
import { setupControls } from "./Utilities/controlsSetup";
import Controls from "./Components/Player/Controls";
import MobileOrbitControls from "./Utilities/MobileOrbitControls";

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

const controlarType = setupControls();
const player = new Controls(scene, controlarType);
modelLoader.loadModels((models) => {
  player.tool.setMesh(models.pickaxe);
});
let playerCamera = player.FPP;
let tppCamera = player.TPP;
let activeCamera = playerCamera;

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyV") {
    activeCamera = activeCamera === playerCamera ? tppCamera : playerCamera;
    player.activeCamera = activeCamera; // 👈 add this line
  }
});

// =====================
// Physics
// =====================
const physics = new Physics(scene);

// =====================
// Controls
// =====================
const controls = new MobileOrbitControls(player.FPP, renderer.domElement);
// Pure gyroscope mode
// controls.enableGyro(false);

// Hybrid mode (gyro + swipe offsets)
// controls.enableGyro(true);

// Disable gyro
controls.disableGyro();

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
  try {
    // Check if player can interact (either pointer locked or mobile)
    if (
      (player.controlarType === "laptop" && player.controls.isLocked) ||
      player.controlarType === "mobile"
    ) {
      if (!player.selectedCoords) return; // nothing selected

      const { x, y, z } = player.selectedCoords;

      if (player.activeBlockId === block.empty.id) {
        // Remove block
        if (world && typeof world.removeBlock === "function") {
          world.removeBlock(x, y, z);
        } else {
          console.error("World or removeBlock method not found!");
        }
        player.tool?.startAnimation?.(); // optional chaining to prevent errors
      } else {
        // Add block
        if (world && typeof world.addBlock === "function") {
          world.addBlock(x, y, z, player.activeBlockId);
        } else {
          console.error("World or addBlock method not found!");
        }
      }
    }
  } catch (err) {
    console.error("Error in onMouseDown:", err);
  }
}

// Event listeners
document.addEventListener("mousedown", onMouseDown); // Desktop
document.addEventListener("touchstart", onMouseDown); // Mobile

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
  requestAnimationFrame(animate);
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000;
  dt = Math.min(dt, 0.05);

  if (controlarType === "laptop") {
    if (player.controls.isLocked) {
      player.update(world);
      physics.update(dt, player, world);
      world.update(player);
    }
  } else if (controlarType === "mobile") {
    // Fixed step for smoother mobile control
    const mobileDt = dt; // ~60fps
    player.applyInputs(mobileDt);
    player.update(world);
    physics.update(mobileDt, player, world);
    world.update(player);
  }

  // Sync sun with player position (common for both)
  sun.position.copy(player.position).sub(new THREE.Vector3(-50, -50, -50));
  sun.target.position.copy(player.position);

  if (obj.shadow) {
    scene.add(dlshowdoh);
  }
  if (!obj.shadow) {
    scene.remove(dlshowdoh);
  }

  if (activeCamera === tppCamera) {
    player.updateTPPCamera();
  }

  renderer.render(scene, activeCamera);
  stats.update();

  previousTime = currentTime;
}

createUi(world, obj);
animate();
