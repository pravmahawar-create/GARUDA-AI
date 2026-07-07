class IdeaGenerator {
  constructor(options = {}) {
    this.options = options;
  }

  generateIdea(context = {}) {
    return {
      category: context.category || "small-improvement",
      title: context.title || "Refine intelligence visibility",
      benefit: context.benefit || "Improves founder awareness without changing workflows.",
      risk: context.risk || "Low",
      difficulty: context.difficulty || "Medium",
      estimatedTime: context.estimatedTime || "1-3 days",
      dependencies: context.dependencies || ["approval workflow", "dashboard integration"],
      status: "idea-ready"
    };
  }
}

export { IdeaGenerator };
export default IdeaGenerator;
