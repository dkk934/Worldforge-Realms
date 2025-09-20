import { Player } from "../Player/player.js";
import nipplejs from "nipplejs";

class Controls extends Player {
  constructor(scene, controlarType) {
    super(scene, controlarType);

    // Add any Controls-specific initialization here
    this.controlarType = controlarType;
    if (controlarType === "mobile") {
      console.log("📱 Mobile controls active");

      const joystick = nipplejs.create({
        zone: document.getElementById("joystick"),
        mode: "static",
        position: { left: "80px", bottom: "80px" },
        color: "blue",
      });

      // 🔥 Joystick move
      joystick.on("move", (evt, data) => {
        this.input.x = 0;
        this.input.z = 0;

        if (data && data.direction) {
          if (data.direction.y === "up") this.moveForward();
          if (data.direction.y === "down") this.moveBackward();
          if (data.direction.x === "left") this.moveLeft();
          if (data.direction.x === "right") this.moveRight();
        }
      });

      joystick.on("end", () => {
        console.log("🛑 Joystick end — stop moving");
        this.stopX();
        this.stopZ();
      });
    } else {
      console.log("💻 Laptop controls active");
      // Setup laptop controls (pointer lock, keyboard, etc)
      document.addEventListener("keydown", this.onKeyDown.bind(this));
      document.addEventListener("keyup", this.onKeyUp.bind(this));
    }
  }
  // Add Controls-specific methods here

  onKeyDown(e) {
    if (!this.controls.isLocked) {
      this.controls.lock();
      console.log("controls locked");
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
        this.jump();
        break;
    }
  }

  // Handle key up events
   onKeyUp(e) {
    switch (e.code) {
      case "KeyW": case "ArrowUp":
      case "KeyS": case "ArrowDown": this.stopZ(); break;
      case "KeyA": case "ArrowLeft":
      case "KeyD": case "ArrowRight": this.stopX(); break;
    }
  }
}

export default Controls;
