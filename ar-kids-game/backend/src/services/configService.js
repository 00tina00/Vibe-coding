import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import appConfig from "../config/default.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHARED_CONFIG_DIR = path.resolve(__dirname, "../../../shared/game-config");

const configCache = new Map();

async function loadJson(filename) {
  if (configCache.has(filename)) {
    return configCache.get(filename);
  }
  const filePath = path.join(SHARED_CONFIG_DIR, filename);
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);
  configCache.set(filename, data);
  return data;
}

export async function getGameConfig(language) {
  const [items, levels, rewards] = await Promise.all([
    loadJson("items.json"),
    loadJson("levels.json"),
    loadJson("rewards.json"),
  ]);

  return {
    difficulty: appConfig.defaultDifficulty,
    language: language || appConfig.defaultLanguage,
    items,
    levels,
    rewards,
  };
}

export function clearConfigCache() {
  configCache.clear();
}
