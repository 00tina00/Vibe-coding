import * as THREE from "three";
import gsap from "gsap";

export class SceneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.set(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.objectAnchor = new THREE.Group();
    this.camera.add(this.objectAnchor);
    this.scene.add(this.camera);

    this.setupLights();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(2, 3, 4);
    this.scene.add(ambient, directional);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  getObjectAnchor() {
    return this.objectAnchor;
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
    gsap.fromTo(
      mesh.scale,
      { x: mesh.scale.x * 1.3, y: mesh.scale.y * 1.3, z: mesh.scale.z * 1.3 },
      {
        x: mesh.scale.x,
        y: mesh.scale.y,
        z: mesh.scale.z,
        duration: 0.4,
        ease: "elastic.out(1, 0.5)",
      }
    );
  }

  shakeObject(mesh) {
    gsap.to(mesh.position, {
      x: mesh.position.x + 0.05,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        gsap.set(mesh.position, { x: mesh.position.x });
      },
    });
  }
}
