import * as THREE from "three";
import { gameConfig } from "../config/gameConfig.js";

export class SpawnManager {
  constructor(scene, assetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.objects = [];
    this.objectGroup = new THREE.Group();
    this.scene.add(this.objectGroup);
  }

  clear() {
    this.objects.forEach(({ mesh }) => {
      this.objectGroup.remove(mesh);
    });
    this.objects = [];
  }

  async spawnRound(itemIds, itemsConfig, levelConfig) {
    this.clear();

    const count = Math.min(
      levelConfig.objectCount,
      gameConfig.spawn.maxCount
    );

    const selectedIds = this.pickItemIds(itemIds, count);
    const positions = this.generatePositions(count, levelConfig.spawnRadius);

    for (let i = 0; i < selectedIds.length; i++) {
      const itemId = selectedIds[i];
      const config = itemsConfig[itemId];
      const mesh = await this.assetLoader.loadItem(itemId, config);

      mesh.userData.itemId = itemId;
      mesh.position.copy(positions[i]);
      mesh.userData.baseY = positions[i].y;
      mesh.userData.floatOffset = Math.random() * Math.PI * 2;
      mesh.userData.floatSpeed = levelConfig.floatSpeed || 0.5;
      mesh.userData.rotationSpeed = levelConfig.rotationSpeed || 0.7;

      this.objectGroup.add(mesh);
      this.objects.push({ mesh, itemId });
    }

    return this.objects;
  }

  pickItemIds(allIds, count) {
    const shuffled = [...allIds].sort(() => Math.random() - 0.5);
    const result = shuffled.slice(0, count);

    while (result.length < count) {
      result.push(allIds[Math.floor(Math.random() * allIds.length)]);
    }

    return result;
  }

  generatePositions(count, radius) {
    const positions = [];
    const minDist = gameConfig.spawn.minDistance;
    const maxAttempts = 100;

    for (let i = 0; i < count; i++) {
      let placed = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const pos = this.randomPosition(radius);
        if (this.isFarEnough(pos, positions, minDist)) {
          positions.push(pos);
          placed = true;
          break;
        }
      }

      if (!placed) {
        positions.push(this.randomPosition(radius * 0.8));
      }
    }

    return positions;
  }

  randomPosition(radius) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    const x = Math.cos(angle) * r;
    const y = (Math.random() - 0.5) * gameConfig.spawn.verticalSpread;
    const z =
      gameConfig.spawn.depthMin +
      Math.random() * (gameConfig.spawn.depthMax - gameConfig.spawn.depthMin);

    return new THREE.Vector3(x, y, z);
  }

  isFarEnough(pos, existing, minDist) {
    return existing.every((p) => pos.distanceTo(p) >= minDist);
  }

  animate(delta) {
    const amplitude = gameConfig.animation.floatAmplitude;

    this.objects.forEach(({ mesh }) => {
      mesh.rotation.y += (mesh.userData.rotationSpeed || 0.5) * delta;
      mesh.rotation.x += delta * 0.2;
      mesh.position.y =
        mesh.userData.baseY +
        Math.sin(performance.now() * 0.001 * mesh.userData.floatSpeed + mesh.userData.floatOffset) *
          amplitude;

      if (mesh.userData.glow) {
        mesh.userData.glow.intensity =
          1 + Math.sin(performance.now() * 0.003) * 0.3;
      }
    });
  }

  getInteractableMeshes() {
    return this.objects.map((o) => o.mesh);
  }

  findObjectByMesh(mesh) {
    let current = mesh;
    while (current) {
      const found = this.objects.find((o) => o.mesh === current);
      if (found) return found;
      current = current.parent;
    }
    return null;
  }
}
