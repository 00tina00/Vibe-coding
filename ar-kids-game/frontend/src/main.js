import { CameraManager } from "./camera/cameraManager.js";
import { SceneRenderer } from "./utils/sceneRenderer.js";
import { AssetLoader } from "./assets/assetLoader.js";
import { SpawnManager } from "./game/spawnManager.js";
import { ScoreManager } from "./game/scoreManager.js";
import { LevelManager } from "./game/levelManager.js";
import { TargetManager } from "./game/targetManager.js";
import { GameManager } from "./game/gameManager.js";
import { AudioManager } from "./audio/audioManager.js";
import { VoiceManager } from "./voice/voiceManager.js";
import { ParticleManager } from "./effects/particleManager.js";
import { Hud } from "./ui/hud.js";
import { Menu } from "./ui/menu.js";
import { fetchGameConfig } from "./services/apiService.js";
import { gameConfig } from "./config/gameConfig.js";

async function loadStrings() {
  const response = await fetch(`/locales/${gameConfig.defaultLanguage}.json`);
  if (!response.ok) {
    throw new Error("Failed to load Persian strings");
  }
  return response.json();
}

async function bootstrap() {
  const video = document.getElementById("camera-feed");
  const canvas = document.getElementById("game-canvas");
  const uiRoot = document.getElementById("ui-root");

  const strings = await loadStrings();
  const language = gameConfig.defaultLanguage;

  const cameraManager = new CameraManager(video);
  const sceneRenderer = new SceneRenderer(canvas);
  const assetLoader = new AssetLoader();
  const audioManager = new AudioManager();
  const voiceManager = new VoiceManager();
  const hud = new Hud(uiRoot, strings);

  let gameManager = null;

  const menu = new Menu(uiRoot, strings, async () => {
    try {
      await cameraManager.start();
      await audioManager.init();

      const config = await fetchGameConfig(language);
      await voiceManager.loadLanguage(language);
      await assetLoader.preloadAll(config.items);

      const spawnManager = new SpawnManager(
        sceneRenderer.getObjectAnchor(),
        assetLoader
      );
      const scoreManager = new ScoreManager();
      const levelManager = new LevelManager(config.levels);
      const targetManager = new TargetManager(config.items);
      const particleManager = new ParticleManager(sceneRenderer.scene);

      gameManager = new GameManager({
        sceneRenderer,
        spawnManager,
        targetManager,
        scoreManager,
        levelManager,
        audioManager,
        voiceManager,
        particleManager,
        hud,
        items: config.items,
        rewards: config.rewards,
      });

      await gameManager.start();
    } catch (err) {
      console.error("Failed to start game:", err);
      alert(strings.errorStart);
      menu.show();
    }
  });
}

bootstrap();
