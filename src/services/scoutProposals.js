const { getCategory } = require("./scoutCategories");

function buildProposal(categoryId, input = {}) {
  const category = getCategory(categoryId);
  if (!category) return null;

  const clientName = String(input.clientName || "there").trim();
  const project = String(input.project || category.name).trim();
  const budget = String(input.budgetText || category.realisticFeeBand).trim();
  const timeline = String(input.timeline || "we confirm the exact deadline together before we start").trim();
  const deliverableLine = category.deliverables.join("; ");

  const proposal = [
    `Hi ${clientName}, regarding "${project}" -`,
    `I can build this as a ${category.name.toLowerCase()}: ${category.description}`,
    `What you receive: ${deliverableLine}.`,
    `Budget range I work in for this scope: ${budget}. Turnaround: ${timeline}.`,
    "I work milestone-based (start, mid-check, delivery) so you review everything before payment completes.",
    "Truth note: I only confirm what I can verify. Before we begin, I will confirm scope, the data I have access to, and the exact delivery deadline with you.",
    "If this fits, share the project link and the 2-3 details below and I will send the specific plan plus a fixed price."
  ].join("\n\n");

  return { categoryId, proposal, budget, timeline, categoryName: category.name };
}

function buildProposalForOpportunity(opportunity = {}) {
  return buildProposal(opportunity.categoryId, {
    clientName: opportunity.client,
    project: opportunity.title,
    budgetText: opportunity.budgetText,
    timeline: opportunity.timeline
  });
}

module.exports = { buildProposal, buildProposalForOpportunity };