const knowledgeService = require('../services/knowledgeService');

/**
 * GARUDA Governed Execution Knowledge Adapter
 * Connects Mother Brain planning & execution decision-making to the existing Knowledge/RAG engine
 * while preserving source traceability and enforcing safety boundaries.
 */
class ExecutionKnowledgeAdapter {
  constructor(options = {}) {
    this.knowledgeService = options.knowledgeService || knowledgeService;
  }

  /**
   * Retrieves relevant knowledge for a Mother Brain goal or task query.
   */
  async retrieveContext(query, options = {}) {
    const cleanQuery = String(query || '').trim();
    const limit = Math.min(options.limit || 5, 10);
    const category = options.category || null;

    if (!cleanQuery) {
      return {
        query: '',
        hasKnowledge: false,
        chunks: [],
        sources: [],
        insufficientKnowledge: true,
        summary: 'Empty query provided'
      };
    }

    let chunks = [];
    try {
      if (category) {
        chunks = await this.knowledgeService.searchKnowledgeByCategory(cleanQuery, category, limit);
      } else {
        chunks = await this.knowledgeService.searchKnowledge(cleanQuery, limit);
      }
    } catch {
      chunks = [];
    }

    const hasKnowledge = Array.isArray(chunks) && chunks.length > 0;

    // Source Traceability
    const sources = hasKnowledge
      ? chunks.map((item, idx) => ({
          sourceId: `src_${idx + 1}`,
          sourceFile: item.sourceFile || 'knowledge_base',
          category: item.category || 'general',
          page: item.page || null,
          score: item.score || 1.0,
          textSnippet: String(item.text || '').slice(0, 300)
        }))
      : [];

    return {
      query: cleanQuery,
      hasKnowledge,
      chunks: hasKnowledge ? chunks : [],
      sources,
      insufficientKnowledge: !hasKnowledge,
      summary: hasKnowledge
        ? `Retrieved ${chunks.length} knowledge chunks for query`
        : 'No relevant knowledge found in repository RAG database'
    };
  }

  /**
   * Enriches a Mother Brain goal or task input with retrieved knowledge context.
   * Safety law: Retrieved knowledge is provided strictly as structured text context, NEVER as executable code/commands.
   */
  async enrichTaskWithKnowledge(task = {}, options = {}) {
    const query = task.taskType || task.goal || task.task || task.command || '';
    const retrieval = await this.retrieveContext(query, options);

    return {
      task: { ...task },
      knowledgeContext: {
        query: retrieval.query,
        hasKnowledge: retrieval.hasKnowledge,
        sources: retrieval.sources,
        insufficientKnowledge: retrieval.insufficientKnowledge,
        summary: retrieval.summary
      },
      // Safety guarantee: taskType and executable fields are NEVER modified by retrieved RAG text!
      isExecutableCommandModified: false
    };
  }
}

module.exports = ExecutionKnowledgeAdapter;
