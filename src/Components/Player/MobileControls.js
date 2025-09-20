// Minimal Mobile Joystick → Player movement
export default class MobileControls {
  constructor(player, joystick) {
    this.player = player;   // THREE.Object3D (player model or camera parent)
    this.joystick = joystick;

    this.speed = 0.1; // movement speed per frame

    this.joystick.on("move", (evt) => this.handleMove(evt));
    this.joystick.on("end", () => this.handleEnd());
  }

  handleMove(evt) {
    const { vector } = evt; 
    // vector.x = left/right (-1 to 1)
    // vector.y = forward/backward (-1 to 1)

    console.log("🎮 Joystick vector:", vector);

    // Movement relative to world (no rotation applied yet)
    this.forward = vector.y; // up/down on joystick
    this.right = vector.x;   // left/right on joystick
  }

  handleEnd() {
    console.log("🛑 Joystick released");
    this.forward = 0;
    this.right = 0;
  }

  update() {
    if (!this.player) return;

    // Compute movement
    let moveX = this.right * this.speed;
    let moveZ = -this.forward * this.speed; // invert so joystick up = forward

    this.player.position.x += moveX;
    this.player.position.z += moveZ;
  }
}
