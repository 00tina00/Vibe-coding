import * as THREE from "three";
import { postScore } from "../services/apiService.js";

export class GameManager {
  constructor(deps) {
    this.sceneRenderer = deps.sceneRenderer;
    this.spawnManager = deps.spawnManager;
    this.targetManager = deps.targetManager;
    this.scoreManager = deps.scoreManager;
    this.levelManager = deps.levelManager;
    this.audioManager = deps.audioManager;
    this.voiceManager = deps.voiceManager;
    this.particleManager = deps.particleManager;
    this.hud = deps.hud;
    this.rewards = deps.rewards;

    this.items = deps.items;
    this.running = false;
    this.lastTime = 0;
    this.processingTap = false;

    this.bindEvents();
    this.bindScoreUpdates();
  }

  bindEvents() {
    const canvas = this.sceneRenderer.canvas;
    canvas.addEventListener("pointerdown", (e) => this.onTap(e));
  }

  bindScoreUpdates() {
    this.scoreManager.onChange((score) => {
      this.hud.updateScore(score);
      postScore(score).catch(() => {});
    });

    this.targetManager.onChange((target) => {
      this.hud.updateTarget(target);
    });
  }

  async start() {
    this.running = true;
    this.voiceManager.speak("welcome");
    await this.startRound();
    this.lastTime = performance.now();
    this.loop();
  }

  async startRound() {
    const levelConfig = this.levelManager.getCurrentLevelConfig();
    this.hud.updateLevel(this.levelManager.getLevel());

    await this.spawnManager.spawnRound(
      Object.keys(this.items),
      this.items,
      levelConfig
    );

    const spawnedIds = this.spawnManager.objects.map((o) => o.itemId);
    this.targetManager.selectNewTarget(spawnedIds);
    const target = this.targetManager.getCurrentTarget();
    this.voiceManager.announceTarget(target.voiceKey);
  }

  async onTap(event) {
    if (!this.running || this.processingTap) return;
    event.preventDefault();

    this.sceneRenderer.setPointerFromEvent(event);
    const meshes = this.spawnManager.getInteractableMeshes();
    const hit = this.sceneRenderer.raycast(meshes);

    if (!hit) return;

    this.processingTap = true;
    const obj = this.spawnManager.findObjectByMesh(hit.object);

    if (!obj) {
      this.processingTap = false;
      return;
    }

    if (this.targetManager.isCorrect(obj.itemId)) {
      await this.handleCorrect(obj);
    } else {
      this.handleIncorrect(obj);
    }

    this.processingTap = false;
  }

  async handleCorrect(obj) {
    const target = this.targetManager.getCurrentTarget();
    this.audioManager.playSuccess();
    this.sceneRenderer.pulseObject(obj.mesh);

    const worldPos = new THREE.Vector3();
    obj.mesh.getWorldPosition(worldPos);
    const colorHex = parseInt((target.color || "#FFD700").replace("#", ""), 16);
    this.particleManager.burst(worldPos, colorHex);

    this.scoreManager.addStar(this.rewards.correctFind?.stars || 1);

    await this.delay(this.rewards.correctFind?.celebrationDelay || 600);

    if (this.levelManager.shouldLevelUp(this.scoreManager.getFindsAtLevel())) {
      const leveled = this.levelManager.levelUp();
      if (leveled) {
        this.audioManager.playLevelUp();
        this.voiceManager.speak("levelUp");
        this.scoreManager.resetLevelProgress();
        await this.delay(800);
        await this.startRound();
        return;
      }
      this.scoreManager.resetLevelProgress();
    }

    const spawnedIds = this.spawnManager.objects.map((o) => o.itemId);
    const next = this.targetManager.selectNewTarget(spawnedIds);
    this.voiceManager.announceSuccess(next.voiceKey);
  }

  handleIncorrect(obj) {
    this.audioManager.playIncorrect();
    this.sceneRenderer.shakeObject(obj.mesh);
    this.voiceManager.announceTryAgain();
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  loop() {
    if (!this.running) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.spawnManager.animate(delta);
    this.particleManager.update(delta);
    this.sceneRenderer.render();

    requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.running = false;
  }
}
