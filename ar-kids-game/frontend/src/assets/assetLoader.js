import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createProceduralMesh } from "./meshFactory.js";

export class AssetLoader {
  constructor() {
    this.cache = new Map();
    this.gltfLoader = new GLTFLoader();
  }

  async loadItem(itemId, itemConfig) {
    const cacheKey = itemId;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey).clone(true);
    }

    let model = null;

    try {
      model = await this.loadGltf(itemConfig.model);
    } catch {
      model = createProceduralMesh(itemId, itemConfig);
    }

    this.enhanceModel(model, itemConfig);
    this.cache.set(cacheKey, model);
    return model.clone(true);
  }

  loadGltf(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        () => reject(new Error(`Failed to load ${url}`))
      );
    });
  }

  enhanceModel(model, itemConfig) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: itemConfig.color,
          emissive: itemConfig.color,
          emissiveIntensity: 0.25,
          roughness: 0.35,
        });
      }
    });
    model.scale.setScalar(itemConfig.scale || 1);
    model.userData.itemId = itemConfig.id;
  }

  preloadAll(items) {
    return Promise.all(
      Object.entries(items).map(([id, config]) => this.loadItem(id, config))
    );
  }

  clearCache() {
    this.cache.clear();
  }
}
