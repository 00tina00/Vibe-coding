export class LevelManager {
  constructor(levelsConfig) {
    this.levels = levelsConfig.levels || [];
    this.maxLevel = levelsConfig.maxLevel || this.levels.length;
    this.currentLevel = levelsConfig.defaultLevel || 1;
  }

  getCurrentLevelConfig() {
    return (
      this.levels.find((l) => l.level === this.currentLevel) ||
      this.levels[0]
    );
  }

  getObjectCount() {
    const config = this.getCurrentLevelConfig();
    return config?.objectCount || 5;
  }

  getSpawnRadius() {
    return this.getCurrentLevelConfig()?.spawnRadius || 3;
  }

  getFloatSpeed() {
    return this.getCurrentLevelConfig()?.floatSpeed || 0.5;
  }

  getRotationSpeed() {
    return this.getCurrentLevelConfig()?.rotationSpeed || 0.7;
  }

  getFindsToAdvance() {
    return this.getCurrentLevelConfig()?.findsToAdvance || 10;
  }

  shouldLevelUp(findsAtLevel) {
    return findsAtLevel >= this.getFindsToAdvance();
  }

  levelUp() {
    if (this.currentLevel < this.maxLevel) {
      this.currentLevel += 1;
      return true;
    }
    return false;
  }

  getLevel() {
    return this.currentLevel;
  }
}
