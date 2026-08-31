const nodes = new Map();
const edges = new Map();

function addNode(id, data = {}) {
  if (nodes.has(id)) {
    Object.assign(nodes.get(id), data);
    return nodes.get(id);
  }
  const node = { id, ...data, createdAt: new Date().toISOString() };
  nodes.set(id, node);
  edges.set(id, new Set());
  return node;
}

function addEdge(fromId, toId, relationship = "related") {
  if (!nodes.has(fromId)) addNode(fromId);
  if (!nodes.has(toId)) addNode(toId);
  edges.get(fromId).add(`${toId}:${relationship}`);
  if (!edges.has(toId)) edges.set(toId, new Set());
  edges.get(toId).add(`${fromId}:${relationship}`);
}

function getNode(id) {
  return nodes.get(id) || null;
}

function getNeighbors(id) {
  const nodeEdges = edges.get(id);
  if (!nodeEdges) return [];
  return [...nodeEdges].map((e) => {
    const [targetId, relationship] = e.split(":");
    const node = nodes.get(targetId);
    return node ? { ...node, relationship } : null;
  }).filter(Boolean);
}

function findPath(fromId, toId, maxDepth = 5) {
  if (fromId === toId) return [fromId];
  const visited = new Set([fromId]);
  const queue = [[fromId]];
  while (queue.length > 0) {
    const path = queue.shift();
    if (path.length > maxDepth) continue;
    const current = path[path.length - 1];
    const neighbors = edges.get(current);
    if (!neighbors) continue;
    for (const edge of neighbors) {
      const [neighborId] = edge.split(":");
      if (neighborId === toId) return [...path, neighborId];
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push([...path, neighborId]);
      }
    }
  }
  return null;
}

function findRelated(nodeId, depth = 2) {
  const related = new Map();
  const queue = [{ id: nodeId, depth: 0 }];
  while (queue.length > 0) {
    const { id, depth: d } = queue.shift();
    if (d > depth) continue;
    const neighbors = edges.get(id);
    if (!neighbors) continue;
    for (const edge of neighbors) {
      const [neighborId, relationship] = edge.split(":");
      if (!related.has(neighborId) || related.get(neighborId).depth > d) {
        related.set(neighborId, { relationship, depth: d + 1 });
        queue.push({ id: neighborId, depth: d + 1 });
      }
    }
  }
  return [...related.entries()].map(([id, data]) => ({ id, ...nodes.get(id), ...data }));
}

function searchNodes(query) {
  const q = query.toLowerCase();
  return [...nodes.values()].filter((node) => {
    const searchable = JSON.stringify(node).toLowerCase();
    return searchable.includes(q);
  });
}

function getStats() {
  return { nodes: nodes.size, edges: [...edges.values()].reduce((sum, e) => sum + e.size, 0) / 2 };
}

function clear() {
  nodes.clear();
  edges.clear();
}

function initializeDefaultGraph() {
  clear();
  addNode("login", { type: "feature", description: "User login system" });
  addNode("signup", { type: "feature", description: "User registration" });
  addNode("auth", { type: "module", description: "Authentication module" });
  addNode("password", { type: "concept", description: "Password handling" });
  addNode("bcrypt", { type: "package", description: "Password hashing" });
  addNode("jwt", { type: "package", description: "JSON Web Token" });
  addNode("session", { type: "concept", description: "User session" });
  addNode("database", { type: "module", description: "Database layer" });
  addNode("user", { type: "entity", description: "User entity" });
  addNode("error", { type: "issue", description: "Error handling" });
  addNode("undefined", { type: "error_type", description: "Undefined reference" });
  addNode("import", { type: "code", description: "Import statement" });
  addNode("module", { type: "code", description: "Module system" });
  addNode("express", { type: "framework", description: "Express.js" });
  addNode("router", { type: "component", description: "Express router" });

  addEdge("login", "auth");
  addEdge("signup", "auth");
  addEdge("auth", "password");
  addEdge("auth", "jwt");
  addEdge("auth", "session");
  addEdge("password", "bcrypt");
  addEdge("auth", "user");
  addEdge("user", "database");
  addEdge("error", "undefined");
  addEdge("undefined", "import");
  addEdge("module", "import");
  addEdge("express", "router");
  addEdge("login", "error");
  addEdge("signup", "error");
}

module.exports = { addNode, addEdge, getNode, getNeighbors, findPath, findRelated, searchNodes, getStats, clear, initializeDefaultGraph };
