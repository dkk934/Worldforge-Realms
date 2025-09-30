import { Player } from "../Player/player.js";
import { Joystick } from "../../Utilities/Joystick.js";

class Controls extends Player {
  constructor(scene, controlarType) {
    super(scene, controlarType);

    // Add any Controls-specific initialization here
    this.controlarType = controlarType;
    if (controlarType === "mobile") {
      console.log("📱 Mobile controls active");

      const joystick = new Joystick({
        joystickSize: 80,
        joystickPosition: { bottom: "60px", left: "60px" },
        joystickBg: "rgba(50,50,50,0.5)",
        stickBg: "rgba(255, 0, 0, 0.8)",
        jumpSize: 50,
        jumpPosition: { bottom: "50px", right: "50px" },
        jumpBg: "rgba(200,255,200,0.7)",
        jumpColor: "#333",
        jumpLabel: "⬆️",
        deadzone: 15,
      });

      // 🔥 Joystick move
      joystick.on("move", (evt, data) => {
        this.velocity.x = 0;
        this.velocity.z = 0;

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
      joystick.on("jump", () => {
        console.log("🆙 Jump button pressed");
        this.jump();
      });

      
      window.addEventListener("DOMContentLoaded", () => this.setupListeners());
      
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
        this.selectBlock(Number(e.key));
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
      case "KeyW":
      case "ArrowUp":
      case "KeyS":
      case "ArrowDown":
        this.stopZ();
        break;
      case "KeyA":
      case "ArrowLeft":
      case "KeyD":
      case "ArrowRight":
        this.stopX();
        break;
    }
  }

  // onClick(e) {}

  selectBlock(blockId) {
    // Remove "selected" class from the currently active block
    document
      .getElementById(`toolbar-${this.activeBlockId}`)
      .classList.remove("selected");
    this.activeBlockId = blockId;
    document
      .getElementById(`toolbar-${this.activeBlockId}`)
      .classList.add("selected");
    this.tool.visible = this.activeBlockId === 0;
    // console.log("activeBlock =", e.key);
  }

   setupListeners() {
    const toolbarIcons = document.querySelectorAll(".toolbar-icon");
    toolbarIcons.forEach((icon) => {
      icon.addEventListener("click", (e) => {
        const blockId = Number(e.target.id.replace("toolbar-", ""));
        this.selectBlock(blockId); // works fine
      });
    });
  }
}

export default Controls;
