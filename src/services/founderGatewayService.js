/**
 * 🦅 GARUDA Founder Sovereign Cloud Gateway Service
 * 
 * Provides 24x7 mobile connectivity between Founder Praveen and GARUDA
 * even when the primary development laptop is shut down.
 * 
 * Capabilities:
 * 1. Synchronized Supabase Brain Reader (Leads, Lessons, Approvals)
 * 2. 24/7 Mobile Antigravity AI Partner (Gemini 2.5 powered with full context)
 * 3. 1-Tap Mobile Outreach Dispatch & Verification
 * 4. Sovereign Health & Telemetry Reporting
 */

try { require("dotenv").config(); } catch {}
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://gcifzzuyswrcwvkcfqbr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

class FounderGatewayService {
  /**
   * Fetch current cloud-synced state from Supabase
   */
  async getGatewayState() {
    try {
      // 1. Fetch Sync Anchor Record
      const { data: syncRows } = await supabase
        .from("leads")
        .select("*")
        .eq("email", "founder-cloud-sync@garudaos.in")
        .limit(1);

      let syncMetadata = null;
      if (syncRows && syncRows[0] && syncRows[0].message) {
        try {
          syncMetadata = JSON.parse(syncRows[0].message);
        } catch {
          syncMetadata = { raw: syncRows[0].message };
        }
      }

      // 2. Fetch Active Leads
      const { data: allLeads, error: leadsErr } = await supabase
        .from("leads")
        .select("*")
        .order("id", { ascending: false })
        .limit(30);

      if (leadsErr) {
        console.warn("[GATEWAY] Error fetching leads:", leadsErr.message);
      }

      const filteredLeads = (allLeads || []).filter(l => l.email !== "founder-cloud-sync@garudaos.in");

      const stats = {
        totalLeads: filteredLeads.length,
        pendingApprovals: filteredLeads.filter(l => l.status === "pending_approval" || l.status === "new" || l.status === "scouted_ready").length,
        contactedCount: filteredLeads.filter(l => l.status === "contacted" || l.status === "dispatched_delivered").length,
        lastSyncedAt: syncMetadata?.syncTimestamp || syncRows?.[0]?.captured_at || "Never"
      };

      return {
        success: true,
        stats,
        syncMetadata,
        leads: filteredLeads.slice(0, 15),
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 24/7 Mobile Antigravity AI Partner
   * Allows Founder Praveen to chat with Antigravity directly from his smartphone
   */
  async chatWithFounder({ message, history = [] }) {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Get latest cloud state to feed into Antigravity context
    const state = await this.getGatewayState();
    const leadsSummary = (state.leads || [])
      .slice(0, 5)
      .map(l => `- [${l.status.toUpperCase()}] ${l.first_name} (${l.email || "No Email"}): ${l.source}`)
      .join("\n");

    const historyFormatted = (history || [])
      .slice(-6)
      .map(h => `${h.role === "user" ? "Founder Praveen" : "Antigravity"}: ${h.text}`)
      .join("\n");

    const systemPrompt = `You are Antigravity, the sovereign AI pair-programming assistant and chief workforce operator for Founder Praveen Mahawar (GARUDA-AI).
Founder Praveen is on his mobile phone communicating with you 24/7 via the Founder Sovereign Gateway. His laptop is currently powered down or away.

Current Cloud Brain State (Synced from Laptop to Supabase):
- Last Laptop Sync: ${state.stats?.lastSyncedAt || "Recently"}
- Total Cloud Leads: ${state.stats?.totalLeads || 0}
- Pending Approvals: ${state.stats?.pendingApprovals || 0}
- Contacted / Dispatched: ${state.stats?.contactedCount || 0}
Top Active Leads:
${leadsSummary || "No active leads in queue"}

Recent Synced Lessons:
${(state.syncMetadata?.recentLessons || []).slice(-3).map(l => `* ${l.lesson}`).join("\n") || "Anti-fabrication, Show > Tell"}

Your Demeanor & Conversational Law:
1. Always address him with warmth, deep respect, and sharpness ("Praveen ji", "Bhai", "Sir").
2. Communicate in crisp, natural, razor-sharp Roman Hindi (Hinglish).
3. Be proactive: if he asks for leads status, give exact counts and next steps.
4. If he wants to approve or dispatch an email, explain what will be sent and provide actionable next step.
5. NEVER dump boring generic bot boilerplate. Speak like an elite tier-1 senior engineer right beside him in VS Code.

Previous Mobile Conversation:
${historyFormatted}

User Message: "${message}"

Respond directly to Founder Praveen in natural Roman Hindi:`;

    // Unified Sovereign Cascade Engine (Groq -> NVIDIA -> Gemini -> Deterministic)
    const cascade = require("./sovereignAiCascadeService");
    const cascadeResult = await cascade.generateCompletion({
      prompt: systemPrompt,
      temperature: 0.3,
      maxTokens: 800
    });

    const actions = [];
    if (state.stats?.pendingApprovals > 0) {
      actions.push({ label: "Review Pending Leads", action: "view_leads" });
    }
    actions.push({ label: "Check System Health", action: "health" });
    actions.push({ label: "API Keys Health", action: "keys" });

    return {
      success: true,
      reply: cascadeResult.text || "Praveen ji, Antigravity Cloud sync active hai.",
      actions,
      provider: cascadeResult.provider,
      latencyMs: cascadeResult.latencyMs,
      cascadeAttempts: cascadeResult.cascadeAttempts,
      syncedAt: state.stats?.lastSyncedAt
    };
  }

  /**
   * Health report of all lined up API keys
   */
  getKeyHealth() {
    const cascade = require("./sovereignAiCascadeService");
    return cascade.getHealthReport();
  }

  /**
   * Runtime injection of a new API key
   */
  registerKey(payload) {
    const cascade = require("./sovereignAiCascadeService");
    return cascade.registerKey(payload);
  }

  /**
   * 1-Tap Mobile Outreach Dispatch
   */
  async dispatchLeadOutreach({ leadId, customNote }) {
    try {
      const { data: rows, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .limit(1);

      if (error || !rows || rows.length === 0) {
        throw new Error(`Lead ID ${leadId} not found in Supabase`);
      }

      const lead = rows[0];
      const host = process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in";
      const port = parseInt(process.env.GARUDA_EMAIL_PORT || "465", 10);
      const user = process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in";
      const pass = process.env.GARUDA_EMAIL_PASS;

      let dispatchResult = null;

      if (pass && lead.email && lead.email.includes("@") && !lead.email.includes("reddit-")) {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass }
        });

        const subject = `Executive Brief: Autonomous Software & Engineering Operations — GARUDA-AI`;
        const textContent = `Respected ${lead.first_name || "Leader"},\n\nThis is Founder Praveen Mahawar from GARUDA-AI (https://garudaos.in).\n\n${customNote || "We observed your technical requirements and have prepared a deterministic, compiler-verified engineering solution inside isolated Git worktrees."}\n\nWarm regards,\nPraveen Mahawar\nFounder, GARUDA-AI\npraveen@garudaos.in`;

        const info = await transporter.sendMail({
          from: `"Praveen Mahawar | GARUDA-AI" <${user}>`,
          to: lead.email,
          subject,
          text: textContent
        });

        dispatchResult = {
          method: "zoho_smtp",
          messageId: info.messageId,
          response: info.response
        };
      } else {
        dispatchResult = {
          method: "platform_dispatch_marked",
          note: "Lead marked as dispatched on target channel per Founder mobile authorization."
        };
      }

      const sha256 = crypto.createHash("sha256").update(JSON.stringify(dispatchResult)).digest("hex");

      // Update Supabase lead status
      await supabase
        .from("leads")
        .update({
          status: "dispatched_delivered",
          reply_snippet: `sha256:${sha256.slice(0, 16)}`
        })
        .eq("id", leadId);

      return {
        success: true,
        leadId,
        sha256,
        dispatchResult,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error("[GATEWAY DISPATCH ERROR]:", err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

module.exports = new FounderGatewayService();
