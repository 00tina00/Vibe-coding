import * as THREE from "three";
import gsap from "gsap";
import { DeviceOrientationManager } from "../camera/deviceOrientationManager.js";

export class SceneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    this.camera.position.set(0, 0, 0);

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.deviceOrientation = new DeviceOrientationManager(this.camera);
    this.orientationReady = false;

    this.setupLights();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(2, 4, 3);
    this.scene.add(ambient, directional);
  }

  async connectOrientation() {
    this.orientationReady = await this.deviceOrientation.start();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  getWorldGroup() {
    return this.worldGroup;
  }

  update() {
    // orientation updates via deviceorientation event listener
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  setPointerFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  raycast(meshes) {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(meshes, true);
    return hits.length > 0 ? hits[0] : null;
  }

  pulseObject(mesh) {
    const base = mesh.userData.baseScale || mesh.scale.clone();
    mesh.userData.baseScale = base;
    gsap.fromTo(
      mesh.scale,
      { x: base.x * 1.4, y: base.y * 1.4, z: base.z * 1.4 },
      {
        x: base.x,
        y: base.y,
        z: base.z,
        duration: 0.4,
        ease: "elastic.out(1, 0.5)",
      }
    );
  }

  shakeObject(mesh) {
    const originX = mesh.position.x;
    gsap.to(mesh.position, {
      x: originX + 0.08,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        mesh.position.x = originX;
      },
    });
  }
}
