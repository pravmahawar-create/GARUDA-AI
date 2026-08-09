const { authenticatedDbClient, authenticatedUserId } = require("./_auth");

module.exports = async function conversations(req, res) {
  const db = authenticatedDbClient(req);
  const userId = authenticatedUserId(req);
  if (!db || !userId) return res.status(401).json({ success: false, message: "Sign in required" });

  if (req.method === "GET") {
    const { data, error } = await db
      .from("conversation_previews")
      .select("id, title, created_at, updated_at, message_count, last_message")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, conversations: data || [] });
  }

  if (req.method === "POST") {
    const title = String(req.body?.title || "New conversation").trim().slice(0, 200);
    const { data, error } = await db
      .from("conversations")
      .insert({ user_id: userId, title })
      .select("id, title, created_at, updated_at")
      .single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, conversation: data });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
};