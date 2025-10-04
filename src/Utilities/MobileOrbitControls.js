import * as THREE from "three";

export default class MobileEyeControls {
  constructor(camera, domElement = window) {
    this.camera = camera;
    this.domElement = domElement;

    this.rotationSpeed = 0.016; // Sensitivity
    this.enabled = true;

    // Internal yaw/pitch tracking
    this.pitch = 0; 
    this.yaw = 0;   

    this.touchStartX = 0;
    this.touchStartY = 0;

    // Gyroscope state
    this.useGyro = false;
    this.hybridMode = false; // NEW
    this.deviceQuat = new THREE.Quaternion();
    this.touchQuat = new THREE.Quaternion();

    // Bind events
    this.domElement.addEventListener("touchstart", this.onTouchStart.bind(this), false);
    this.domElement.addEventListener("touchmove", this.onTouchMove.bind(this), false);
  }

  /* ------------------------
   * Touch Controls (Eye Look)
   * ------------------------ */
  onTouchStart(event) {
    try {
      if (!this.enabled) return;
      if (event.touches.length === 1) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
      }
    } catch (err) {
      console.error("TouchStart error:", err);
    }
  }

  onTouchMove(event) {
    try {
      if (!this.enabled) return;
      if (event.touches.length === 1) {
        const deltaX = event.touches[0].clientX - this.touchStartX;
        const deltaY = event.touches[0].clientY - this.touchStartY;

        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;

        // Update yaw/pitch
        this.yaw   -= deltaX * this.rotationSpeed;
        this.pitch -= deltaY * this.rotationSpeed;

        // Clamp pitch
        const maxPitch = Math.PI / 2 - 0.1;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

        // Update touchQuat for hybrid mode
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, "YXZ");
        this.touchQuat.setFromEuler(euler);

        this.updateCameraRotation();
      }
    } catch (err) {
      console.error("TouchMove error:", err);
    }
  }

  updateCameraRotation() {
    try {
      if (this.useGyro && !this.hybridMode) {
        this.camera.quaternion.copy(this.deviceQuat);
      } else if (this.hybridMode && this.useGyro) {
        // Combine gyro + touch
        this.camera.quaternion.copy(this.deviceQuat).multiply(this.touchQuat);
      } else {
        // Pure touch mode
        this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
      }
    } catch (err) {
      console.error("UpdateCameraRotation error:", err);
    }
  }

  /* ------------------------
   * Gyroscope Controls
   * ------------------------ */
  enableGyro(hybrid = false) {
    try {
      this.useGyro = true;
      this.hybridMode = hybrid;

      // Request permission on iOS
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        DeviceOrientationEvent.requestPermission()
          .then((response) => {
            if (response === "granted") {
              window.addEventListener("deviceorientation", this.onDeviceOrientation.bind(this));
            } else {
              console.warn("Gyro permission denied");
            }
          })
          .catch((err) => console.error("Gyro request error:", err));
      } else if (typeof DeviceOrientationEvent !== "undefined") {
        // Android & others
        window.addEventListener("deviceorientation", this.onDeviceOrientation.bind(this));
      } else {
        console.warn("DeviceOrientationEvent not supported on this device.");
      }
    } catch (err) {
      console.error("EnableGyro error:", err);
    }
  }

  disableGyro() {
    try {
      this.useGyro = false;
      this.hybridMode = false;
      window.removeEventListener("deviceorientation", this.onDeviceOrientation, false);
    } catch (err) {
      console.error("DisableGyro error:", err);
    }
  }

  onDeviceOrientation(event) {
    try {
      if (!this.useGyro) return;

      const alpha = THREE.MathUtils.degToRad(event.alpha || 0); // z
      const beta  = THREE.MathUtils.degToRad(event.beta || 0);  // x
      const gamma = THREE.MathUtils.degToRad(event.gamma || 0); // y

      const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ");
      this.deviceQuat.setFromEuler(euler);

      this.updateCameraRotation();
    } catch (err) {
      console.error("DeviceOrientation error:", err);
    }
  }

  /* ------------------------
   * Cleanup
   * ------------------------ */
  dispose() {
    try {
      this.domElement.removeEventListener("touchstart", this.onTouchStart, false);
      this.domElement.removeEventListener("touchmove", this.onTouchMove, false);
      this.disableGyro();
    } catch (err) {
      console.error("Dispose error:", err);
    }
  }
}

