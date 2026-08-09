const { authenticatedDbClient, authenticatedUserId } = require("./_auth");

module.exports = async function messages(req, res) {
  const db = authenticatedDbClient(req);
  const userId = authenticatedUserId(req);
  if (!db || !userId) return res.status(401).json({ success: false, message: "Sign in required" });

  const conversationId = String(
    (req.method === "GET" ? req.query?.conversation_id : null) ||
    req.body?.conversation_id ||
    ""
  ).trim();

  if (req.method === "GET") {
    if (!conversationId) return res.status(400).json({ success: false, message: "conversation_id is required" });
    const { data, error } = await db
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, messages: data || [] });
  }

  if (req.method === "POST") {
    if (!conversationId) return res.status(400).json({ success: false, message: "conversation_id is required" });
    const role = String(req.body?.role || "").trim();
    const content = String(req.body?.content || "").trim();
    if (!["user", "assistant"].includes(role)) return res.status(400).json({ success: false, message: "role must be user or assistant" });
    if (!content) return res.status(400).json({ success: false, message: "content is required" });
    const { data, error } = await db
      .from("messages")
      .insert({ conversation_id: conversationId, user_id: userId, role, content })
      .select("id, conversation_id, role, content, created_at")
      .single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, message: data });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
};