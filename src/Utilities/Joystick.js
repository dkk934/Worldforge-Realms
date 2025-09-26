export class Joystick {
  constructor(options = {}) {
    this.container = options.container || document.body;

    // --- Joystick customization ---
    this.joystickSize = options.joystickSize || 100;
    this.joystickPosition = options.joystickPosition || { bottom: "50px", left: "50px" };
    this.joystickBg = options.joystickBg || "rgba(0,0,0,0.3)";
    this.stickBg = options.stickBg || "rgba(255,255,255,0.7)";
    this.deadzone = options.deadzone || 10;

    // --- Jump button customization ---
    this.jumpSize = options.jumpSize || 80;
    this.jumpPosition = options.jumpPosition || { bottom: "40px", right: "40px" };
    this.jumpBg = options.jumpBg || "rgba(255,255,255,0.7)";
    this.jumpColor = options.jumpColor || "#000";
    this.jumpLabel = options.jumpLabel || "⭡";

    this.events = {};

    // --- Joystick elements ---
    this.joystick = document.createElement("div");
    this.stick = document.createElement("div");

    // --- Jump button element ---
    this.jumpButton = document.createElement("div");

    // init UI
    this._initJoystickStyles();
    this._initJumpStyles();

    this.container.appendChild(this.joystick);
    this.joystick.appendChild(this.stick);
    this.container.appendChild(this.jumpButton);

    // state
    this.active = false;
    this.touchId = null;
    this.stickX = 0;
    this.stickY = 0;
    this.frameRequested = false;

    // attach events
    this._attachJoystickEvents();
    this._attachJumpEvents();
  }

  /* -------------------
     Event System
  -------------------- */
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((cb) => cb({ type: event }, data));
    }
  }

  /* -------------------
     Joystick Styles
  -------------------- */
  _initJoystickStyles() {
    Object.assign(this.joystick.style, {
      position: "absolute",
      bottom: this.joystickPosition.bottom || "auto",
      left: this.joystickPosition.left || "auto",
      right: this.joystickPosition.right || "auto",
      top: this.joystickPosition.top || "auto",
      width: this.joystickSize + "px",
      height: this.joystickSize + "px",
      background: this.joystickBg,
      borderRadius: "50%",
      touchAction: "none",
      userSelect: "none",
    });

    Object.assign(this.stick.style, {
      position: "absolute",
      width: this.joystickSize / 2 + "px",
      height: this.joystickSize / 2 + "px",
      background: this.stickBg,
      borderRadius: "50%",
      left: this.joystickSize / 4 + "px",
      top: this.joystickSize / 4 + "px",
      transform: "translate(0,0)",
      willChange: "transform",
    });
  }

  /* -------------------
     Jump Button Styles
  -------------------- */
  _initJumpStyles() {
    Object.assign(this.jumpButton.style, {
      position: "absolute",
      bottom: this.jumpPosition.bottom || "auto",
      right: this.jumpPosition.right || "auto",
      left: this.jumpPosition.left || "auto",
      top: this.jumpPosition.top || "auto",
      width: this.jumpSize + "px",
      height: this.jumpSize + "px",
      background: this.jumpBg,
      borderRadius: "50%",
      textAlign: "center",
      lineHeight: this.jumpSize + "px",
      fontSize: "20px",
      fontWeight: "bold",
      color: this.jumpColor,
      userSelect: "none",
      touchAction: "none",
    });

    this.jumpButton.innerHTML = this.jumpLabel;
  }

  /* -------------------
     Joystick Events
  -------------------- */
  _attachJoystickEvents() {
    const opts = { passive: false };
    this.joystick.addEventListener("touchstart", (e) => this._onJoyStart(e), opts);
    this.joystick.addEventListener("touchmove", (e) => this._onJoyMove(e), opts);
    this.joystick.addEventListener("touchend", (e) => this._onJoyEnd(e), opts);
  }

  _onJoyStart(e) {
    this.active = true;
    this.touchId = e.changedTouches[0].identifier;
    this.emit("start");
  }

  _onJoyMove(e) {
    if (!this.active) return;

    for (let touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        const rect = this.joystick.getBoundingClientRect();
        const x = touch.clientX - rect.left - rect.width / 2;
        const y = touch.clientY - rect.top - rect.height / 2;

        const dist = Math.sqrt(x * x + y * y);
        const angle = Math.atan2(y, x);

        const max = this.joystickSize / 2;
        const limitedDist = Math.min(max, dist);

        this.stickX = limitedDist * Math.cos(angle);
        this.stickY = limitedDist * Math.sin(angle);

        if (!this.frameRequested) {
          this.frameRequested = true;
          requestAnimationFrame(() => this._updateStick());
        }

        let dir = {};
        if (Math.abs(this.stickX) > this.deadzone || Math.abs(this.stickY) > this.deadzone) {
          if (this.stickY < -this.deadzone) dir.y = "up";
          else if (this.stickY > this.deadzone) dir.y = "down";
          if (this.stickX < -this.deadzone) dir.x = "left";
          else if (this.stickX > this.deadzone) dir.x = "right";

          this.emit("move", {
            x: this.stickX / max,
            y: this.stickY / max,
            direction: dir,
          });
        }
      }
    }
  }

  _updateStick() {
    this.stick.style.transform = `translate(${this.stickX}px, ${this.stickY}px)`;
    this.frameRequested = false;
  }

  _onJoyEnd(e) {
    for (let touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        this.active = false;
        this.touchId = null;
        this.stickX = 0;
        this.stickY = 0;
        this.stick.style.transform = `translate(0, 0)`;
        this.emit("end");
      }
    }
  }

  /* -------------------
     Jump Events
  -------------------- */
  _attachJumpEvents() {
    const handler = (e) => {
      e.preventDefault();
      this.emit("jump");
    };
    this.jumpButton.addEventListener("touchstart", handler, { passive: false });
    this.jumpButton.addEventListener("mousedown", handler, { passive: false });
  }

  /* -------------------
     Destroy
  -------------------- */
  destroy() {
    this.joystick.remove();
    this.jumpButton.remove();
  }
}
