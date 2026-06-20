import * as THREE from "three";
import { gameConfig } from "../config/gameConfig.js";

export class SpawnManager {
  constructor(worldGroup, assetLoader) {
    this.worldGroup = worldGroup;
    this.assetLoader = assetLoader;
    this.objects = [];
    this.objectGroup = new THREE.Group();
    this.worldGroup.add(this.objectGroup);
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
    const positions = this.generateWorldPositions(count);

    for (let i = 0; i < selectedIds.length; i++) {
      const itemId = selectedIds[i];
      const config = itemsConfig[itemId];
      const mesh = await this.assetLoader.loadItem(itemId, config);

      this.tagItemId(mesh, itemId);
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

  tagItemId(object, itemId) {
    object.userData.itemId = itemId;
    object.traverse((child) => {
      child.userData.itemId = itemId;
    });
  }

  pickItemIds(allIds, count) {
    const shuffled = [...allIds].sort(() => Math.random() - 0.5);
    const result = shuffled.slice(0, count);

    while (result.length < count) {
      result.push(allIds[Math.floor(Math.random() * allIds.length)]);
    }

    return result;
  }

  generateWorldPositions(count) {
    const positions = [];
    const radius = gameConfig.spawn.worldRadius;
    const minAngle = gameConfig.spawn.minAngularDistance;
    const yaws = [];

    for (let i = 0; i < count; i++) {
      let yaw = 0;
      let placed = false;

      for (let attempt = 0; attempt < 80; attempt++) {
        yaw = (Math.random() - 0.5) * Math.PI * 1.6;
        if (yaws.every((y) => Math.abs(y - yaw) >= minAngle)) {
          placed = true;
          break;
        }
      }

      if (!placed) {
        yaw = -Math.PI * 0.8 + (i / count) * Math.PI * 1.6;
      }

      yaws.push(yaw);

      const pitch =
        gameConfig.spawn.pitchMin +
        Math.random() * (gameConfig.spawn.pitchMax - gameConfig.spawn.pitchMin);

      const x = radius * Math.cos(pitch) * Math.sin(yaw);
      const y = radius * Math.sin(pitch);
      const z = -radius * Math.cos(pitch) * Math.cos(yaw);

      positions.push(new THREE.Vector3(x, y, z));
    }

    return positions;
  }

  animate(delta) {
    const amplitude = gameConfig.animation.floatAmplitude;

    this.objects.forEach(({ mesh }) => {
      mesh.rotation.y += (mesh.userData.rotationSpeed || 0.5) * delta;
      mesh.position.y =
        mesh.userData.baseY +
        Math.sin(
          performance.now() * 0.001 * mesh.userData.floatSpeed +
            mesh.userData.floatOffset
        ) *
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
      if (current.userData?.itemId) {
        const id = current.userData.itemId;
        return this.objects.find((o) => o.itemId === id) || null;
      }
      current = current.parent;
    }
    return null;
  }
}
