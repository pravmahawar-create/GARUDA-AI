import { normalizeDevanagari, hasProductToken } from './voice.js'

const STOP_WORDS_TRAILING = new Set(['tha', 'thi', 'the', 'hai', 'hain', 'kar', 'karo', 'do', 'daal', 'bana', 'banao', 'rakho', 'se', 'ke', 'ka', 'ki', 'bhav'])

function cleanTrailingWords(str) {
  const words = String(str || '').trim().split(/\s+/).filter(Boolean)
  while (words.length > 1 && STOP_WORDS_TRAILING.has(words[words.length - 1].toLowerCase())) {
    words.pop()
  }
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export function processV3NluTurn(text, convo, parsedHint, ctx = {}) {
  const rawText = String(text || '').trim()
  const normText = normalizeDevanagari(rawText).replace(/\bper\b/gi, 'ke').trim()
  const lower = normText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

  const hasActiveDraft = convo && (convo.intent === 'create_bill' || convo.customer || (convo.items && convo.items.length > 0))

  // 1. BARE RATE ANSWER WHEN RATE IS MISSING ("390", "390 ke rate se", "390 ke bhav se")
  // ----------------------------------------------------------------------------------
  if (hasActiveDraft && convo.items && convo.items.length > 0 && convo.items.some((it) => !Number(it.rate))) {
    const isBareRate = /^\d+(\.\d+)?$/.test(lower) ||
                       /^(?:rate|bhav|bhav\s*se|rate\s*se)?\s*(\d+(\.\d+)?)\s*(?:rupaye|rs|bhav|rate|per|ke)?$/i.test(lower) ||
                       /^\d+(\.\d+)?\s*(?:rupaye|rs|bhav|rate|per|ke)$/i.test(lower)
    const digitMatch = lower.match(/(\d+(?:\.\d+)?)/)
    if (isBareRate && digitMatch && !lower.includes('nahi') && !lower.includes('nahin') && !lower.includes('nhi')) {
      const val = Number(digitMatch[1])
      if (val > 0) {
        convo.items = convo.items.map((it) => (Number(it.rate) ? it : { ...it, rate: val }))
        if (!convo.billType) convo.billType = 'kaccha'
        return {
          handled: true,
          type: 'UPDATE_DRAFT',
          delta: { rate: val },
          message: `Rate ₹${val} set kar diya.`,
          summary: `Rate set to ₹${val}.`
        }
      }
    }
  }

  // 2. TAX MODE & TRANSPORT MODIFICATION
  // ------------------------------------
  if (hasActiveDraft && (lower.includes('bina gst') || lower.includes('gst nahi') || lower.includes('gst hata do') || lower.includes('kaccha'))) {
    convo.billType = 'kaccha'
    return {
      handled: true,
      type: 'UPDATE_DRAFT',
      delta: { taxMode: 'kaccha' },
      message: 'Thik hai, is bill ko bina GST (Non-GST) rakha hai.',
      summary: 'Tax mode set to Non-GST.'
    }
  }
  if (hasActiveDraft && (lower.includes('gst wala') || lower.includes('gst bill') || lower.includes('pakka bill'))) {
    convo.billType = 'gst'
    return {
      handled: true,
      type: 'UPDATE_DRAFT',
      delta: { taxMode: 'gst' },
      message: 'Thik hai, is bill ko GST bill set kar diya hai.',
      summary: 'Tax mode set to GST.'
    }
  }

  if (hasActiveDraft && (lower.includes('transport bhi') || lower.includes('transport add') || lower.includes('transport including') || lower.includes('transport include'))) {
    convo.transport = { type: 'included', added: true }
    return {
      handled: true,
      type: 'UPDATE_DRAFT',
      delta: { transport: 'included' },
      message: 'Transport add kar diya. Bill bana du?',
      summary: 'Transport included in bill.'
    }
  }
  if (hasActiveDraft && (lower.includes('transport nahi') || lower.includes('bina transport') || lower.includes('transport hata do'))) {
    convo.transport = { type: 'none', added: false }
    return {
      handled: true,
      type: 'UPDATE_DRAFT',
      delta: { transport: 'none' },
      message: 'Thik hai, transport hata diya.',
      summary: 'Transport removed from bill.'
    }
  }

  // 3. CORRECTION PATTERNS (Requires 'nahi', 'nahin', 'nhi', 'badal', 'change', 'galat', 'bhav')
  // -------------------------------------------------------------------------------------------
  const isCorrection = /\b(?:nahi|nahin|nhi|badal|change|galat|se\s*badal|bhav)\b/i.test(lower)
  if (hasActiveDraft && isCorrection) {
    // Pattern A: Dual Number & Single Number Rate Correction ("390 nahi 395", "nahi 395", "rate 395 kar do")
    const numCorrMatch = lower.match(/(\d+)\s+(?:nahi|nahin|nhi|galat|se\s+badal\s+ke)\s+(\d+)\s*([a-z]+)?/i) ||
                          lower.match(/(?:nahi|nahin|nhi|galat)\s*(\d+)/i) ||
                          lower.match(/(?:rate|bhav|bhav\s+se)\s*(?:badal\s+do|change\s+karo|kar\s+do|se)?\s*(\d+)/i) ||
                          lower.match(/(\d+)\s+(?:ke\s+bhav|ke\s+rate)/i)
    if (numCorrMatch && convo.items && convo.items.length > 0) {
      const v1 = numCorrMatch[2] ? Number(numCorrMatch[1]) : Number(convo.items[0].rate || 0)
      const v2 = numCorrMatch[2] ? Number(numCorrMatch[2]) : Number(numCorrMatch[1])
      const unit = (numCorrMatch[3] || '').trim()
      const isQtyUnit = /^(bag|bori|boriya|kilo|kg|ton|tonne|piece|pcs|qtl|quintal)$/i.test(unit)

      if (isQtyUnit || (v1 === Number(convo.items[0].qty) && v1 !== Number(convo.items[0].rate))) {
        // Quantity Correction
        const u = isQtyUnit ? unit : (convo.items[0].unit || 'bag')
        convo.items = convo.items.map((it) => ({ ...it, qty: v2, unit: it.unit || u }))
        return {
          handled: true,
          type: 'UPDATE_DRAFT',
          delta: { quantityCorrection: { oldQty: v1, newQty: v2 }, qty: v2 },
          message: `Thik hai, quantity ${v2} ${u} kar di.`,
          summary: `Quantity updated to ${v2} ${u}.`
        }
      } else {
        // Rate Correction
        convo.items = convo.items.map((it) => ({ ...it, rate: v2 }))
        return {
          handled: true,
          type: 'UPDATE_DRAFT',
          delta: { rateCorrection: { oldRate: v1, newRate: v2 }, rate: v2 },
          message: `Thik hai, rate ₹${v2} kar diya.`,
          summary: `Rate updated to ₹${v2}.`
        }
      }
    }

    // Pattern B: Text Correction ("ACC nahi UltraTech", "sugar nahi salt", "Ravi nahi Ramesh")
    const textCorrMatch = lower.match(/\b([a-z0-9\s]+?)\s+(?:nahi|nahin|nhi|galat)\s+([a-z0-9\s]+)\b/i)
    if (textCorrMatch && !/\d/.test(lower)) {
      const p1 = cleanTrailingWords(textCorrMatch[1])
      const p2 = cleanTrailingWords(textCorrMatch[2])

      const p1Words = p1.toLowerCase().split(/\s+/).filter(Boolean)
      const p2Words = p2.toLowerCase().split(/\s+/).filter(Boolean)

      const isProduct = hasProductToken(p1Words) || hasProductToken(p2Words) ||
                        /cement|steel|sariya|tmt|sugar|salt|rice|atta|oil|dal|acc|ultratech|jk/i.test(p1 + ' ' + p2)

      if (isProduct && convo.items && convo.items.length > 0) {
        // Product Correction
        convo.items = convo.items.map((it) => ({ ...it, name: p2 }))
        return {
          handled: true,
          type: 'UPDATE_DRAFT',
          delta: { itemCorrection: { oldName: p1, newName: p2 } },
          message: `Thik hai, item ${p2} kar diya.`,
          summary: `Product changed to ${p2}.`
        }
      } else if (p2.length >= 2 && !/gst|transport|bill/i.test(p2.toLowerCase())) {
        // Customer Correction
        convo.customer = { name: p2, mobile: '', gstin: '' }
        convo.customerId = null
        return {
          handled: true,
          type: 'UPDATE_DRAFT',
          delta: { customerCorrection: { oldName: p1, newName: p2 }, customerName: p2 },
          message: `Thik hai, customer ${p2} set kar diya.`,
          summary: `Customer changed to ${p2}.`
        }
      }
    }
  }

  // 4. NO ACTIVE DRAFT SAFETY GUARD
  // --------------------------------
  if (!hasActiveDraft && (lower.includes('395 kar do') || lower.includes('bina gst'))) {
    return {
      handled: true,
      type: 'NO_DRAFT_NEEDS_INFO',
      message: 'Pehle bill draft ya item ka naam batao — jaise "Ravi ke naam 50 bag ACC cement".',
      summary: 'No active draft session.'
    }
  }

  return { handled: false }
}
