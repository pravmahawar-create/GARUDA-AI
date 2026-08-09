const AI_SERVICE_CATEGORIES = [
  {
    id: "ai-customer-assistant",
    name: "AI Customer Assistant Chatbot",
    description: "Build a custom AI assistant for a client's support, front-desk, or lead capture using official APIs. Delivered with test session logs and human handoff.",
    deliverables: ["Chat UI or API", "Trained knowledge scope", "Test transcript evidence", "Go-live checklist"],
    exampleWork: ["Support ticketing assistant", "Front-desk booking assistant"],
    complexity: 3,
    realisticFeeBand: "$80 - $400"
  },
  {
    id: "ai-content-automation",
    name: "AI Content Automation System",
    description: "Automated drafting for blogs, social, product pages, and emails with a mandatory human review step before publishing.",
    deliverables: ["Template library", "SEO headers", "Reviewed drafts", "Usage guide"],
    exampleWork: ["Product description pack", "Social post calendar system"],
    complexity: 2,
    realisticFeeBand: "$100 - $500"
  },
  {
    id: "gpt-app-integration",
    name: "GPT App Feature / Integration",
    description: "Add an AI feature to an existing product (search, summarizer, autocomplete, API endpoint) with code, tests, and deployment steps.",
    deliverables: ["Working feature", "Code repo", "Test results", "Deploy notes"],
    exampleWork: ["Document summarizer endpoint", "AI search plugin"],
    complexity: 3,
    realisticFeeBand: "$200 - $900"
  },
  {
    id: "document-ai-pipeline",
    name: "Document / PDF AI Pipeline",
    description: "Extract text, tables, and fields from PDFs, invoices, and forms into clean structured data using local-first parsing.",
    deliverables: ["Extraction service", "Structured JSON output", "Accuracy report", "Python/GitHub example"],
    exampleWork: ["Invoice field extraction", "Legal document search"],
    complexity: 2,
    realisticFeeBand: "$150 - $600"
  },
  {
    id: "rag-knowledge-chatbot",
    name: "Knowledge Base Q&A Chatbot (RAG)",
    description: "Answer questions from a company's own documents with grounded citations, using retrieval + generation.",
    deliverables: ["Indexed docs", "Q&A API", "Source citations", "Evaluation set"],
    exampleWork: ["Internal HR docs Q&A", "Product manual bot"],
    complexity: 4,
    realisticFeeBand: "$300 - $1,200"
  },
  {
    id: "ai-seo-system",
    name: "AI SEO Content System",
    description: "Keyword-to-brief-to-draft system for meta, titles, and category pages. Always sends through human check; no black-hat or plagiarism.",
    deliverables: ["Keyword research", "Meta drafts", "Content briefs", "Editorial review"],
    exampleWork: ["SaaS category pages", "eCommerce product meta"],
    complexity: 2,
    realisticFeeBand: "$100 - $450"
  },
  {
    id: "ai-lead-research",
    name: "AI Lead Research & Outreach Drafts",
    description: "Research publicly listed companies and draft compliant outreach messages (no spam tools). Human sends after audit.",
    deliverables: ["Structured lead list", "Outreach drafts", "Source links", "Sending checklist"],
    exampleWork: ["Local business lead pack", "Freelance agency leads"],
    complexity: 3,
    realisticFeeBand: "$150 - $600"
  },
  {
    id: "ai-dashboards-reports",
    name: "AI Dashboard & Reporting",
    description: "Turn client data (CSV/API) into a readable dashboard or automated report with clear definitions and data export.",
    deliverables: ["Data mapping", "Dashboard views", "Automated report", "Refresh plan"],
    exampleWork: ["Marketing weekly report bot", "Operations KPI dashboard"],
    complexity: 2,
    realisticFeeBand: "$150 - $700"
  },
  {
    id: "ai-video-marketing-kit",
    name: "AI Video & Marketing Kit",
    description: "Scripts, voiceover/video notes, captions, thumbnails and channel copy — reviewed and brand-safe.",
    deliverables: ["Script pack", "Caption system", "Thumbnail concepts", "Upload checklist"],
    exampleWork: ["YouTube intro script", "Short-form video pack"],
    complexity: 2,
    realisticFeeBand: "$100 - $400"
  },
  {
    id: "ai-agent-workflow",
    name: "AI Agent / Automation Workflow",
    description: "Configure an operator workflow (approved automation platforms) that routes, drafts, checks, and notifies — human approval on publish.",
    deliverables: ["Workflow diagrams", "Configured steps", "Test runs", "Approval checklist"],
    exampleWork: ["Lead follow-up pipeline", "Content approval flow"],
    complexity: 3,
    realisticFeeBand: "$200 - $800"
  }
];

function getCategory(id) {
  return AI_SERVICE_CATEGORIES.find((c) => c.id === id) || null;
}

module.exports = { AI_SERVICE_CATEGORIES, getCategory };