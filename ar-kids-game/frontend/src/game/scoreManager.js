export class ScoreManager {
  constructor() {
    this.score = 0;
    this.findsAtCurrentLevel = 0;
    this.listeners = [];
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.score, this.findsAtCurrentLevel));
  }

  addStar(amount = 1) {
    this.score += amount;
    this.findsAtCurrentLevel += amount;
    this.notify();
    return this.score;
  }

  resetLevelProgress() {
    this.findsAtCurrentLevel = 0;
    this.notify();
  }

  getScore() {
    return this.score;
  }

  getFindsAtLevel() {
    return this.findsAtCurrentLevel;
  }
}
