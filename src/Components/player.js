import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/Addons.js";
import { block as blocks } from "../Utilities/Block";
import { Tool } from "../Utilities/Tool";
import nipplejs from "nipplejs";

const CENTER_SCREEN = new THREE.Vector2();

const joystick = nipplejs.create({
    zone: document.getElementById('joystick'),
    mode: 'static',
    position: { left: '75px', bottom: '75px' },
    color: 'blue'
  });

export class Player {
  // Player properties
  radius = 0.5;
  height = 1.75;
  jumpSpeed = 10;
  maxSpeed = 10;
  onGround = false;
  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(),
    0,
    3
  );
  selectedCoords = null;
  activeBlockId = blocks.empty.id;
  tool = new Tool();

  // Movement vectors
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();

  // Camera and controls
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  controls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new THREE.CameraHelper(this.camera);

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

  constructor(scene) {
    // Set initial position
    this.position.set(32, 16, 32);

    // Add camera and helpers to scene
    this.camera.layers.enable(1);
    scene.add(this.camera);
    // scene.add(this.cameraHelper);
    // scene.add(this.boundHelper);
    this.camera.add(this.tool);

    // Input event listeners
    joystick.on('move', (evt, data) => {
    if (data.direction) {
      if (data.direction.y === 'up') this.moveForward();
      if (data.direction.y === 'down') this.moveBackward();
      if (data.direction.x === 'left') this.moveLeft();
      if (data.direction.x === 'right') this.moveRight();
    }
  });
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
    scene.add(this.selectionHelper);
    this.raycaster.layers.set(0);
  }

  // Position getter (camera position)
  get position() {
    return this.camera.position;
  }

  // World velocity getter
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(
      new THREE.Euler(0, this.camera.rotation.y, 0)
    );
    return this.#worldVelocity;
  }

  update(world) {
    this.updateRaycaster(world);
    this.tool.update();
  }

  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
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
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  // Apply input to movement
  applyInputs(dt) {
    if (!this.controls.isLocked) return;

    this.velocity.x = this.input.x;
    this.velocity.z = this.input.z;

    this.controls.moveRight(this.velocity.x * dt);
    this.controls.moveForward(this.velocity.z * dt);
    this.position.y += this.velocity.y * dt;

    document.getElementById("player-position").innerHTML = this.toString();
  }

  // Update bounding helper position
  updateBoundsHelper() {
    this.boundHelper.position.copy(this.position);
    this.boundHelper.position.y -= this.height / 2;
  }

  // Handle key down events
  onKeyDown(e) {
    if (!this.controls.isLocked) {
      this.controls.lock();
      // console.log("controls locked");
      // console.log(e.code);
    }

    switch (e.code) {
      case "Digit0":
      case "Digit1":
      case "Digit2":
      case "Digit3":
      case "Digit4":
      case "Digit5":
      case "Digit6":
      case "Digit7":
      case "Digit8":
        document
          .getElementById(`toolbar-${this.activeBlockId}`)
          .classList.remove("selected");
        this.activeBlockId = Number(e.key);
        document
          .getElementById(`toolbar-${this.activeBlockId}`)
          .classList.add("selected");
        this.tool.visible = this.activeBlockId === 0;
        // console.log("activeBlock =", e.key);
        break;
      case "KeyU":
        this.input.y = this.maxSpeed;
        break;
      case "KeyB":
        this.input.y = -this.maxSpeed;
        break;
      case "KeyW":
      case "ArrowUp":
        this.moveForward();
        break;
      case "KeyA":
      case "ArrowLeft":
        this.moveLeft();
        break;
      case "KeyS":
      case "ArrowDown":
        this.moveBackward();
        break;
      case "KeyD":
      case "ArrowRight":
        this.moveRight();
        break;
      case "KeyR":
        this.position.set(32, 16, 32);
        this.velocity.set(0, 0, 0);
        break;
      case "Space":
        this.jump()
        break;
    }
  }

  // Handle key up events
  onKeyUp(e) {
    switch (e.code) {
      case "KeyU":
      case "KeyB":
        this.input.y = 0;
        break;
      case "KeyW":
      case "ArrowUp":
      case "KeyS":
      case "ArrowDown":
        this.input.z = 0;
        break;
      case "KeyA":
      case "ArrowLeft":
      case "KeyD":
      case "ArrowRight":
        this.input.x = 0;
        break;
    }
  }

  moveLeft() {
    this.input.x = -this.maxSpeed;
  }

  moveRight() {
    this.input.x = this.maxSpeed;
  }

  moveForward() {
    this.input.z = this.maxSpeed;
  }

  moveBackward() {
    this.input.z = -this.maxSpeed;
  }

  jump() {
    if (this.onGround) {
      this.velocity.y = this.jumpSpeed;
      this.onGround = false;
    }
  }

  // String representation of player position
  toString() {
    return `X:${this.position.x.toFixed(3)}Y:${this.position.y.toFixed(
      3
    )}Z:${this.position.z.toFixed(3)}`;
  }
}
