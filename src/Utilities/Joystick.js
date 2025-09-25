export class Joystick {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.size = options.size || 100;
    this.deadzone = options.deadzone || 10;

    this.events = {};

    // Joystick elements
    this.joystick = document.createElement("div");
    this.stick = document.createElement("div");

    this._initStyles();
    this._attachEvents();

    this.container.appendChild(this.joystick);
    this.joystick.appendChild(this.stick);

    this.active = false;
    this.touchId = null;

    // Position caching
    this.stickX = 0;
    this.stickY = 0;
    this.frameRequested = false;
  }

  // Event system
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((cb) => cb({ type: event }, data));
    }
  }

  // Styles (removed transitions for instant updates)
  _initStyles() {
    Object.assign(this.joystick.style, {
      position: "absolute",
      bottom: "50px",
      left: "50px",
      width: this.size + "px",
      height: this.size + "px",
      background: "rgba(0,0,0,0.3)",
      borderRadius: "50%",
      touchAction: "none",
      userSelect: "none",
    });

    Object.assign(this.stick.style, {
      position: "absolute",
      width: this.size / 2 + "px",
      height: this.size / 2 + "px",
      background: "rgba(255,255,255,0.7)",
      borderRadius: "50%",
      left: this.size / 4 + "px",
      top: this.size / 4 + "px",
      transform: "translate(0,0)",
      willChange: "transform",
    });
  }

  // Event listeners (passive: false for responsiveness)
  _attachEvents() {
    const opts = { passive: false };
    this.joystick.addEventListener("touchstart", (e) => this._onStart(e), opts);
    this.joystick.addEventListener("touchmove", (e) => this._onMove(e), opts);
    this.joystick.addEventListener("touchend", (e) => this._onEnd(e), opts);
  }

  _onStart(e) {
    this.active = true;
    this.touchId = e.changedTouches[0].identifier;
    this.emit("start");
  }

  _onMove(e) {
    if (!this.active) return;

    for (let touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        const rect = this.joystick.getBoundingClientRect();
        const x = touch.clientX - rect.left - rect.width / 2;
        const y = touch.clientY - rect.top - rect.height / 2;

        const dist = Math.sqrt(x * x + y * y);
        const angle = Math.atan2(y, x);

        const max = this.size / 2;
        const limitedDist = Math.min(max, dist);

        this.stickX = limitedDist * Math.cos(angle);
        this.stickY = limitedDist * Math.sin(angle);

        // Only request one frame update per RAF
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

  _onEnd(e) {
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
}

export class JumpButton {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.size = options.size || 80;
    this.player = options.player || null; // optional Player instance

    this.button = document.createElement("div");
    this.events = {};

    this._initStyles();
    this._attachEvents();

    this.container.appendChild(this.button);
  }

  // Event system
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((cb) => cb({ type: event }, data));
    }
  }

  _initStyles() {
    Object.assign(this.button.style, {
      position: "absolute",
      bottom: "40px",
      right: "40px",
      width: this.size + "px",
      height: this.size + "px",
      background: "rgba(255,255,255,0.7)",
      borderRadius: "50%",
      textAlign: "center",
      lineHeight: this.size + "px",
      fontSize: "20px",
      fontWeight: "bold",
      color: "#000",
      userSelect: "none",
      touchAction: "none",
    });

    this.button.innerHTML = "⭡"; // Jump arrow
  }

  _attachEvents() {
    const handler = (e) => {
      e.preventDefault();
      // if (this.player) {
      //   console.log("Jump triggered");
      //   this.player.jump(); // just call existing Player jump()
      // }
      this.emit("jump");
    };

    // non-passive because we need preventDefault
    this.button.addEventListener("touchstart", handler, { passive: false });
    this.button.addEventListener("mousedown", handler, { passive: false });
  }

  destroy() {
    this.button.remove();
  }
}

