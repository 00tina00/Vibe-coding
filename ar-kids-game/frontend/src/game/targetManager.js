export class TargetManager {
  constructor(items) {
    this.items = items;
    this.itemIds = Object.keys(items);
    this.currentTargetId = null;
    this.listeners = [];
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notify() {
    const target = this.getCurrentTarget();
    this.listeners.forEach((cb) => cb(target));
  }

  pickRandom(excludeIds = []) {
    const available = this.itemIds.filter((id) => !excludeIds.includes(id));
    const pool = available.length > 0 ? available : this.itemIds;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  setTarget(itemId) {
    this.currentTargetId = itemId;
    this.notify();
  }

  selectNewTarget(excludeIds = []) {
    const id = this.pickRandom(excludeIds);
    this.setTarget(id);
    return this.getCurrentTarget();
  }

  getCurrentTarget() {
    if (!this.currentTargetId) return null;
    return { id: this.currentTargetId, ...this.items[this.currentTargetId] };
  }

  isCorrect(itemId) {
    return itemId === this.currentTargetId;
  }
}
