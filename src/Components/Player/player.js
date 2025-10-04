import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/Addons.js";
import { block as blocks } from "../../Utilities/Block";
import { Tool } from "../../Utilities/Tool";
import { Camera } from "../Camera";

const CENTER_SCREEN = new THREE.Vector2();

export class Player {
  // Player properties
  controlarType;
  radius = 0.5;
  height = 1.75;
  jumpSpeed = 10;
  minspeed = 4;
  maxSpeed = 10;
  onGround = false;
  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(),
    0,
    4
  );
  selectedCoords = null;
  activeBlockId = blocks.empty.id;
  tool = new Tool();

  // Movement vectors
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();

  // Camera and controls
  FPP = new Camera();
  TPP = new Camera();
  controls;
  cameraHelper = new THREE.CameraHelper(this.FPP);

  // Bounding helper
  boundHelper = new THREE.Mesh(
    new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
    new THREE.MeshBasicMaterial({ wireframe: true })
  );
  selectionHelper = new THREE.Mesh(
    new THREE.BoxGeometry(1.01, 1.01, 1.01),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa,
    })
  );

  constructor(scene, controlarType) {
    this.controlarType = controlarType;
    // Set initial position
    this.position.set(30, 6, 32);

    // Add camera and helpers to scene
    this.FPP.layers.enable(1);
    scene.add(this.FPP);
    scene.add(this.cameraHelper);
    scene.add(this.boundHelper);
    this.FPP.add(this.tool);

    scene.add(this.selectionHelper);
    this.raycaster.layers.set(0);
    if (controlarType == "laptop") {
      this.controls = new PointerLockControls(this.FPP, document.body);
    }
  }

  // Position getter (camera position)
  get position() {
    return this.FPP.position;
  }

  // World velocity getter
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new THREE.Euler(0, this.FPP.rotation.y, 0));
    return this.#worldVelocity;
  }

  updateTPPCamera() {
    // Use full FPP quaternion (pitch, yaw, roll)
    const q = this.FPP.quaternion;

    // offset: up/down and back relative to FPP local axes
    const offset = new THREE.Vector3(0, -2, -5).clone();
    offset.applyQuaternion(q);

    // Put TPP behind the FPP position (sub offset so offset=(0, -2, -5) goes behind)
    this.TPP.position.copy(this.FPP.position).sub(offset);

    // Copy rotation so TPP sits with same orientation as the "head" (passive chase cam)
    this.TPP.quaternion.copy(q);
  }

  update(world) {
    this.updateRaycaster(world);
    this.tool.update();
  }

  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.FPP);
    const intersections = this.raycaster.intersectObject(world, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];

      const chunk = intersection.object.parent;

      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);
      if (this.activeBlockId !== blocks.empty.id) {
        this.selectedCoords.add(intersection.normal);
      }

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  // Apply a delta velocity in world space
  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.FPP.rotation.y, 0));
    this.velocity.add(dv);
  }

  applyInputs(dt) {
    // Desktop: require pointer lock. Mobile: allow input without pointer lock.
    if (this.controlarType !== "mobile" && !this.controls.isLocked) return;
    // Map input -> velocity
    this.velocity.x = this.input.x;
    this.velocity.z = this.input.z;

    // Horizontal movement
    if (this.controlarType === "laptop") {
      if (!this.controls.isLocked) return;
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
    } else if (this.controlarType === "mobile") {
      const yawOnly = new THREE.Euler(0, this.FPP.rotation.y, 0);
      const moveVec = new THREE.Vector3(
        this.velocity.x,
        0,
        -this.velocity.z
      ).multiplyScalar(dt);
      moveVec.applyEuler(yawOnly);
      this.FPP.position.add(moveVec);
    }

    // Optionally update helper/UI
    document.getElementById("player-position").innerHTML = this.toString();
  }

  // Update bounding helper position
  updateBoundsHelper() {
    this.boundHelper.position.copy(this.position);
    this.boundHelper.position.y -= this.height / 2;
  }

  moveLeft() {
    this.input.x =
      this.controlarType == "laptop" ? -this.maxSpeed : -this.minspeed;
  }

  moveRight() {
    this.input.x =
      this.controlarType == "laptop" ? this.maxSpeed : this.minspeed;
  }

  moveForward() {
    this.input.z =
      this.controlarType == "laptop" ? this.maxSpeed : this.minspeed;
  }

  moveBackward() {
    this.input.z =
      this.controlarType == "laptop" ? -this.maxSpeed : -this.minspeed;
  }

  jump() {
    if (this.onGround) {
      console.log("Jump triggered");
      this.velocity.y = this.jumpSpeed;
      this.onGround = false;
    }
  }
  stopX() {
    this.input.x = 0;
  }
  stopZ() {
    this.input.z = 0;
  }

  // String representation of player position
  toString() {
    return `X:${this.position.x.toFixed(3)}Y:${this.position.y.toFixed(
      3
    )}Z:${this.position.z.toFixed(3)}`;
  }
}
