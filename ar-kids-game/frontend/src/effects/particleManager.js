import * as THREE from "three";
import { gameConfig } from "../config/gameConfig.js";

export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.active = [];
    this.maxParticles = gameConfig.performance.maxParticles;
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.08,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  burst(position, color = 0xffd700) {
    const count = Math.min(24, this.maxParticles);
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 1
        )
      );
    }

    const geo = this.geometry.clone();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = this.material.clone();
    mat.color.set(color);

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    const effect = {
      points,
      velocities,
      life: 0,
      duration: 0.8,
    };

    this.active.push(effect);
  }

  update(delta) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const effect = this.active[i];
      effect.life += delta;

      const positions = effect.points.geometry.attributes.position.array;

      for (let j = 0; j < effect.velocities.length; j++) {
        positions[j * 3] += effect.velocities[j].x * delta;
        positions[j * 3 + 1] += effect.velocities[j].y * delta;
        positions[j * 3 + 2] += effect.velocities[j].z * delta;
        effect.velocities[j].y -= delta * 0.5;
      }

      effect.points.geometry.attributes.position.needsUpdate = true;
      effect.points.material.opacity = 1 - effect.life / effect.duration;

      if (effect.life >= effect.duration) {
        this.scene.remove(effect.points);
        effect.points.geometry.dispose();
        effect.points.material.dispose();
        this.active.splice(i, 1);
      }
    }
  }
}
