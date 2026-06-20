import * as THREE from "three";

export class DeviceOrientationManager {
  constructor(camera) {
    this.camera = camera;
    this.enabled = false;
    this.euler = new THREE.Euler(0, 0, 0, "YXZ");
    this.onOrientation = this.onOrientation.bind(this);
  }

  async requestPermission() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      const result = await DeviceOrientationEvent.requestPermission();
      return result === "granted";
    }
    return true;
  }

  async start() {
    const allowed = await this.requestPermission();
    if (!allowed) return false;

    window.addEventListener("deviceorientation", this.onOrientation, true);
    this.enabled = true;
    return true;
  }

  stop() {
    window.removeEventListener("deviceorientation", this.onOrientation, true);
    this.enabled = false;
  }

  onOrientation(event) {
    if (!this.enabled) return;

    const alpha = THREE.MathUtils.degToRad(event.alpha ?? 0);
    const beta = THREE.MathUtils.degToRad(event.beta ?? 0);
    const gamma = THREE.MathUtils.degToRad(event.gamma ?? 0);

    this.euler.set(beta, alpha, -gamma);
    this.camera.quaternion.setFromEuler(this.euler);
  }
}
