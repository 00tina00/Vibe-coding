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

  pickFromPool(pool, excludeIds = []) {
    const available = pool.filter((id) => !excludeIds.includes(id));
    const finalPool = available.length > 0 ? available : pool;
    const index = Math.floor(Math.random() * finalPool.length);
    return finalPool[index];
  }

  selectFromSpawned(spawnedIds, excludeIds = []) {
    const id = this.pickFromPool(spawnedIds, excludeIds);
    this.setTarget(id);
    return this.getCurrentTarget();
  }

  setTarget(itemId) {
    this.currentTargetId = itemId;
    this.notify();
  }

  getCurrentTarget() {
    if (!this.currentTargetId) return null;
    return { id: this.currentTargetId, ...this.items[this.currentTargetId] };
  }

  isCorrect(itemId) {
    return itemId === this.currentTargetId;
  }
}
