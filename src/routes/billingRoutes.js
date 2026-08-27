const express = require("express");
const multer = require("multer");
const { generateAnswer, isLLMConfigured } = require("../rag/llmAdapter");
const { transcribeAudio, MODEL } = require("../services/speechService");
const BillingCustomer = require("../models/BillingCustomer");
const BillingInvoice = require("../models/BillingInvoice");
const BillingPayment = require("../models/BillingPayment");
const BillingCompany = require("../models/BillingCompany");
const connectDB = require("../database/db");

const router = express.Router();

const sttUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const VOICE_SYSTEM_PROMPT = `You are Garuda, the billing assistant for a cement + steel (loha-cement) business in India. The user speaks Hindi/Hinglish. Parse their spoken command into STRICT JSON only. No markdown, no extra text.

Indian number words: hazaar/hajar=1000, lakh/lac=100000, rupaye/rupiye=rupees.

Intents:
1. CREATE_BILL — user wants to create a bill. Detect customer name (often after "ke naam"), items (name, quantity, unit, rate), and transport (vehicleNo, driverName, driverMobile, site, freight, loading, unloading). Units: bag, kg, quintal, ton, piece, truck. Products: cement, sariya/sariya/sariya=steel rod, tmt, steel, sand, bricks.
2. QUERY_OUTSTANDING — user asks how much a customer owes (e.g. "Ramesh ka kitna baki hai", "kitna lena hai").
3. QUERY_DELIVERY — user asks about a delivery/vehicle/driver.
4. QUERY_REPORT — general sales/business question.
5. CLARIFY — if the command is ambiguous or incomplete.

Rules:
- Output numbers as digits.
- Normalize item names to lowercase English.
- NEVER invent an item rate. If rate not mentioned, rate=0.
- If customer name not clearly present, customer.name="" and customer.phone="".
- Transport fields only when mentioned.

Output shape:
{"intent":"create_bill","customer":{"name":"","mobile":""},"items":[{"name":"","qty":0,"unit":"bag","rate":0}],"transport":{"vehicleNo":"","driverName":"","driverMobile":"","site":"","freight":0,"loading":0,"unloading":0}}
{"intent":"query_outstanding","customerName":""}
{"intent":"query_delivery","query":""}
{"intent":"query_report","query":""}
{"intent":"clarify","message":""}`;

function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

router.post("/voice", async (req, res) => {
  try {
    const text = String(req.body && req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ success: false, message: "text required" });
    }
    if (!isLLMConfigured()) {
      return res.status(503).json({
        success: false,
        configured: false,
        message: "LLM not configured on server"
      });
    }
    const result = await generateAnswer({
      query: text,
      context: "",
      systemPrompt: VOICE_SYSTEM_PROMPT,
      metadata: { capability: "billing_voice_parse" }
    });
    const parsed = extractJson(result && result.answer);
    if (!parsed) {
      return res.json({
        success: false,
        parsed: null,
        raw: result && result.answer ? String(result.answer) : null
      });
    }
    return res.json({ success: true, parsed });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/stt", sttUpload.single("audio"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ success: false, message: "audio file required (multipart field 'audio')" });
    }
    const text = await transcribeAudio(req.file.buffer);
    return res.json({ success: Boolean(text), text, model: MODEL });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/gst-verify", async (req, res) => {
  try {
    const gstin = String(req.body && req.body.gstin || "").trim().toUpperCase();
    if (!gstin) {
      return res.status(400).json({ success: false, message: "gstin required" });
    }
    const key = process.env.GARUDA_GST_VERIFY_API_KEY;
    if (!key) {
      return res.json({
        success: false,
        live: false,
        reason: "no_key",
        message: "Live verification key nahi hai (GARUDA_GST_VERIFY_API_KEY set karo). Checksum validation client-side pehle se hai."
      });
    }
    const provider = (process.env.GARUDA_GST_VERIFY_PROVIDER || "gstverify").toLowerCase();
    let data;
    if (provider === "appyflow") {
      const r = await fetch(`https://appyflow.in/api/verifyGST?gstNo=${gstin}&key_secret=${encodeURIComponent(key)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      data = await r.json();
      const d = data && data.data;
      return res.json({
        success: Boolean(d),
        live: true,
        verified: Boolean(d),
        business: d ? {
          legalName: d.tradeNam || d.lgnm || "",
          tradeName: d.tradeNam || "",
          state: d.stjCd || d.stjCdCd || "",
          status: d.sts || "",
          address: d.pradr ? d.pradr.addr || "" : "",
          gstin
        } : null,
        raw: data
      });
    }
    const r = await fetch(`https://gstverify.co.in/api/v1/verify/${encodeURIComponent(gstin)}`, {
      headers: { "X-API-Key": key }
    });
    data = await r.json();
    const d = data && data.data;
    return res.json({
      success: Boolean(d),
      live: true,
      verified: Boolean(d),
      business: d ? {
        legalName: d.legal_name || d.lgnm || "",
        tradeName: d.trade_name || d.tradeNam || "",
        state: d.state || "",
        status: d.taxpayer_type || d.status || "",
        address: d.address || "",
        gstin
      } : null,
      raw: data
    });
  } catch (error) {
    return res.status(500).json({ success: false, live: true, message: error.message });
  }
});

router.post("/sync", async (req, res) => {
  try {
    if (!connectDB.isMongoConnected()) {
      return res.status(503).json({ success: false, message: "Mongo not connected" });
    }
    const { customers = [], invoices = [], payments = [], companies = [], deletes = [] } = req.body || {};
    const counts = { customers: 0, invoices: 0, payments: 0, companies: 0 };

    const models = {
      customer: BillingCustomer,
      invoice: BillingInvoice,
      payment: BillingPayment,
      company: BillingCompany
    };
    for (const d of deletes) {
      const model = models[d.entity];
      if (!model || !d.id) continue;
      const r = await model.deleteOne({ id: d.id });
      counts[d.entity + 's'] = (counts[d.entity + 's'] || 0) + (r.deletedCount || 0);
    }

    if (companies.length) {
      const ops = companies.map((c) => ({
        updateOne: { filter: { id: c.id }, update: { $set: c }, upsert: true }
      }));
      const r = await BillingCompany.bulkWrite(ops, { ordered: false });
      counts.companies = r.upsertedCount + r.modifiedCount;
    }

    if (customers.length) {
      const ops = customers.map((c) => ({
        updateOne: { filter: { id: c.id }, update: { $set: c }, upsert: true }
      }));
      const r = await BillingCustomer.bulkWrite(ops, { ordered: false });
      counts.customers = r.upsertedCount + r.modifiedCount;
    }
    if (invoices.length) {
      const ops = invoices.map((i) => ({
        updateOne: { filter: { id: i.id }, update: { $set: i }, upsert: true }
      }));
      const r = await BillingInvoice.bulkWrite(ops, { ordered: false });
      counts.invoices = r.upsertedCount + r.modifiedCount;
    }
    if (payments.length) {
      const ops = payments.map((p) => ({
        updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true }
      }));
      const r = await BillingPayment.bulkWrite(ops, { ordered: false });
      counts.payments = r.upsertedCount + r.modifiedCount;
    }
    return res.json({ success: true, counts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/ocr", async (req, res) => {
  try {
    const { data, mimeType, kind } = req.body || {};
    if (!data || !mimeType) {
      return res.status(400).json({ success: false, message: "data + mimeType required" });
    }
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) {
      return res.status(503).json({ success: false, message: "Gemini key not configured on server" });
    }
    const kindPrompt =
      kind === "delivery"
        ? "Focus on: vehicle number, driver name, driver mobile, delivery site, LR/challan number, freight, loading/unloading charges, material and quantity."
        : kind === "customer"
          ? "Focus on: business/customer name, GSTIN, address, mobile, state, PAN if shown."
          : "Focus on: invoice number, date, seller (GSTIN/name), buyer/customer (GSTIN/name), items (name, qty, unit, rate, amount), HSN, taxes, discount, transport/freight, vehicle number, driver, payment info, total, outstanding.";
    const prompt =
      "You are GARUDA's document reader for an Indian cement+steel business. Extract structured business data from this image/PDF page. " + kindPrompt + "\n" +
      "Return STRICT JSON only, no markdown:\n" +
      '{"confidence":0.0,"businesses":[{"name":"","gstin":"","address":"","mobile":""}],"invoice":{"invoiceNo":"","date":"","sellerGstin":"","customerName":"","customerGstin":""},"items":[{"name":"","qty":0,"unit":"","rate":0,"amount":0}],"tax":{"cgst":0,"sgst":0,"discount":0,"grandTotal":0},"transport":{"vehicleNo":"","driverName":"","driverMobile":"","site":"","lrNo":"","freight":0}}' + "\n" +
      "RULES: Never invent values not visible in the document. If a field is not visible or confidence is low, set it to 0/empty. confidence = 0.0..1.0 for overall extraction. All numbers as digits, INR amounts.";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: mimeType, data } }, { text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
        })
      }
    );
    const g = await response.json();
    const text = g?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    let parsed = null;
    if (start !== -1 && end !== -1) {
      try { parsed = JSON.parse(text.slice(start, end + 1)); } catch (e) { /* ignore */ }
    }
    return res.json({ success: Boolean(parsed), parsed, raw: text.slice(0, 2000) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;