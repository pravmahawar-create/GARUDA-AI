class WisdomMemory {
  constructor(options = {}) {
    this.options = options;
    this.memories = [];
  }

  remember(entry = {}) {
    this.memories.push(entry);
    return this.memories.slice(-5);
  }

  getRecent() {
    return this.memories.slice(-5).reverse();
  }
}

export { WisdomMemory };
export default WisdomMemory;
