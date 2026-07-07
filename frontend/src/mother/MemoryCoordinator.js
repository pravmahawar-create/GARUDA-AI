class MemoryCoordinator {
  constructor() {
    this.memory = new Map();
  }

  shareMemory(key, value) {
    this.memory.set(key, value);
    return value;
  }

  getMemory(key) {
    return this.memory.get(key) || null;
  }

  getAllMemory() {
    return Object.fromEntries(this.memory.entries());
  }
}

const memoryCoordinator = new MemoryCoordinator();

export { MemoryCoordinator, memoryCoordinator };
export default memoryCoordinator;
