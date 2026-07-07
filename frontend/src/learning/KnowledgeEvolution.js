class KnowledgeEvolution {
  constructor(options = {}) {
    this.options = options;
    this.knowledge = [];
  }

  evolve(lesson = {}) {
    this.knowledge.push(lesson);
    return this.knowledge.slice(-5);
  }
}

export { KnowledgeEvolution };
export default KnowledgeEvolution;
