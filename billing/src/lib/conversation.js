import { extractItems, collectRates, buildItemName, cleanProductWords, hasProductToken } from './voice.js'

const MESSAGES = {
  customer: 'Customer ka naam batao.',
  billType: 'GST ya kaccha? Pakka GST bill ya kaccha bill?',
  gstin: 'GSTIN batao.',
  item: 'Material ka naam batao.',
  quantity: 'Quantity batao.',
  rate: 'Rate batao.'
}

const UNIT_LOOKUP = { bag: 'bag', bori: 'bag', bags: 'bag', kg: 'kg', kilo: 'kg', kgg: 'kg', quintal: 'quintal', qtl: 'quintal', ton: 'ton', tonne: 'ton', piece: 'piece', pieces: 'piece', truck: 'truck' }

function productFirstItems(text) {
  const m = String(text || '').match(/^([a-z0-9][a-z0-9\s]{1,40}?)\s+(\d+(?:\.\d+)?)\s*(bag|bori|bags|kg|kilo|kgg|quintal|qtl|ton|tonne|piece|pieces|truck)s?/i)
  if (!m) return null
  const words = cleanProductWords(m[1].trim().toLowerCase().split(/\s+/))
  if (!hasProductToken(words)) return null
  const name = buildItemName(words)
  if (!name) return null
  return [{ name, qty: Number(m[2]), unit: UNIT_LOOKUP[m[3].toLowerCase()] || 'bag', rate: 0 }]
}

const NON_BILL_INTENTS = ['stock_entry', 'stock_query', 'stock_ledger_query', 'query_outstanding', 'query_report', 'query_delivery']

function cleanName(s) {
  return String(s || '').trim().split(/\s+/).map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')).join(' ')
}

function extractCustomerName(text, knownNames) {
  const m = String(text || '').match(/([a-z][a-z\s.]{1,30}?)\s+(?:ka|ke|ko|ki|का|के|को)\s+(?:bill|naam|name)/i)
  if (m) return cleanName(m[1])
  for (const n of knownNames || []) {
    if (String(text || '').toLowerCase().includes(String(n).toLowerCase())) return n
  }
  return ''
}

function detectBillIntent(text) {
  return /bill|bana|laga/i.test(String(text || ''))
}

function detectBillType(text) {
  const t = String(text || '').toLowerCase()
  if (/(^|\s)(gst|pakka|pakka bill)(\s|$)/.test(t) || /gst wala|pakka wala/.test(t)) return 'gst'
  if (/(^|\s)(kaccha|kaccha bill)(\s|$)/.test(t) || /kaccha wala/.test(t)) return 'kaccha'
  return null
}

function detectGstin(text) {
  const m = String(text || '').match(/\b\d{2}[A-Za-z]{5}\d{4}[A-Za-z][A-Za-z0-9]Z[A-Za-z0-9]\b/)
  return m ? m[0].toUpperCase() : ''
}

function isConfirm(text) {
  const t = String(text || '').trim().toLowerCase()
  return t === 'haan' || t === 'han' || t === 'ha' || t === 'yes' || t === 'yep' || t === 'confirm' || t === 'done' || t === 'ok' ||
    /^theek hai/.test(t) || /^bilkul/.test(t) || /^bana do/.test(t) || /^kar do/.test(t)
}

function computeMissing(c) {
  const missing = []
  if (!c.customer || !c.customer.name) missing.push('customer')
  if (!c.billType) missing.push('billType')
  if (c.billType === 'gst' && !c.gstin) missing.push('gstin')
  if (!c.items || c.items.length === 0) missing.push('item')
  else {
    if (c.items.some((it) => !Number(it.qty))) missing.push('quantity')
    if (c.items.some((it) => !Number(it.rate))) missing.push('rate')
  }
  return missing
}

function summaryText(c) {
  const lines = []
  const name = (c.customer && c.customer.name) || 'Customer'
  const type = c.billType === 'gst' ? 'GST bill' : c.billType === 'kaccha' ? 'Kaccha bill' : 'bill'
  lines.push(name + ' ka ' + type + ':')
  let total = 0
  for (const it of c.items || []) {
    const qty = Number(it.qty) || 0
    const rate = Number(it.rate) || 0
    total += qty * rate
    lines.push(it.name + ' — ' + qty + ' ' + (it.unit || '') + ' × ₹' + rate + ' = ₹' + (qty * rate))
  }
  if (c.gstin) lines.push('GSTIN ' + c.gstin)
  if (c.transport && c.transport.vehicleNo) lines.push('Vehicle ' + c.transport.vehicleNo)
  lines.push('Total: ₹' + total + '. Bill bana doon?')
  return lines.join('\n')
}

function partialSummary(c) {
  const parts = []
  if (c.customer && c.customer.name) parts.push('Customer: ' + c.customer.name)
  if (c.billType) parts.push(c.billType === 'gst' ? 'GST bill' : 'Kaccha bill')
  if (c.items && c.items.length) parts.push(c.items.map((it) => it.name + ' ' + it.qty + ' ' + (it.unit || '')).join(', '))
  return parts.join(' | ')
}

function renderDraft(c) {
  return {
    intent: 'create_bill',
    customer: c.customer || { name: '' },
    items: (c.items || []).map((it) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || 'bag', rate: Number(it.rate) || 0, hsn: it.hsn || '' })),
    transport: c.transport || {},
    billType: c.billType,
    customerGstin: c.gstin || '',
    missing: []
  }
}

export class ConversationManager {
  constructor() {
    this.convos = new Map()
  }

  fresh(id) {
    return {
      id, createdAt: Date.now(), lastActivity: Date.now(),
      intent: null, customer: null, items: [], billType: null, gstin: null,
      transport: null, asked: new Set(), confirmed: false, executed: false, result: null
    }
  }

  newConversation() {
    const id = 'convo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
    this.convos.set(id, this.fresh(id))
    return id
  }

  endConversation(id) { this.convos.delete(id) }

  get(id) { return this.convos.get(id) }

  discard(id) {
    const c = this.convos.get(id)
    if (c) this.convos.set(id, this.fresh(id))
  }

  hasActiveBill(id) {
    const c = this.convos.get(id)
    return !!c && c.intent === 'create_bill' && !c.executed && (!!c.customer || c.items.length > 0 || !!c.billType || !!c.gstin)
  }

  canExecute(id) {
    const c = this.convos.get(id)
    return !!c && c.intent === 'create_bill' && !c.executed && computeMissing(c).length === 0
  }

  draftForExecution(id) {
    const c = this.convos.get(id)
    if (!c) return null
    return {
      intent: 'create_bill',
      customer: { name: (c.customer && c.customer.name) || '', mobile: (c.customer && c.customer.mobile) || '', gstin: c.gstin || '' },
      items: (c.items || []).map((it) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || 'bag', rate: Number(it.rate) || 0, hsn: it.hsn || '' })),
      transport: c.transport || {},
      billType: c.billType,
      customerGstin: c.gstin || '',
      missing: []
    }
  }

  markExecuted(id, invoice) {
    const c = this.convos.get(id)
    if (c) { c.executed = true; c.result = invoice }
  }

  nextStep(c, reask) {
    const missing = computeMissing(c)
    if (missing.length === 0) {
      const msg = summaryText(c)
      return { status: 'needs_confirm', message: msg, summary: msg, renderDraft: renderDraft(c), missing: [] }
    }
    const field = missing[0]
    return { status: 'needs_info', message: (reask ? 'Phir bolo — ' : '') + MESSAGES[field], summary: partialSummary(c), missing }
  }

  processTurn(id, text, parsed, ctx) {
    let c = this.convos.get(id)
    if (!c) { this.convos.set(id, this.fresh(id)); c = this.convos.get(id) }
    c.lastActivity = Date.now()
    const t = String(text || '').toLowerCase().trim()

    // After execution only a fresh bill utterance starts a new draft; confirms are ignored.
    if (c.executed) {
      const startsNew = detectBillIntent(t) || (parsed && parsed.intent === 'create_bill')
      if (!startsNew) return { status: 'none', message: 'Bill ban gaya tha. Naya bill banane ke liye bolo.' }
      const fresh = this.fresh(id)
      fresh.id = id
      this.convos.set(id, fresh)
      c = fresh
    }

    // 1) Confirmation answer
    if (isConfirm(t)) {
      if (c.intent === 'create_bill' && computeMissing(c).length === 0) {
        return { status: 'execute', message: summaryText(c) }
      }
      return { status: 'needs_info', message: c.intent === 'create_bill' ? MESSAGES[computeMissing(c)[0]] : 'Kuch nahi bana — pehle batao kya karna hai.' }
    }

    // 2) Bill type answer
    const bt = detectBillType(t)
    if (bt) {
      c.intent = c.intent || 'create_bill'
      c.billType = bt
      return this.nextStep(c)
    }

    // 3) GSTIN answer
    const g = detectGstin(text)
    if (g) {
      c.intent = c.intent || 'create_bill'
      c.gstin = g
      c.customer = { ...(c.customer || {}), gstin: g }
      return this.nextStep(c)
    }

    // 4) Item/rate extraction for bill turns (parser often returns clarify for partial/product-first phrases)
    if (c.intent === 'create_bill' || detectBillIntent(t)) {
      let extra = []
      if (parsed && parsed.intent === 'create_bill' && parsed.items) extra = parsed.items
      if (!extra.length) extra = extractItems(text)
      if (!extra.length) {
        const pf = productFirstItems(text)
        if (pf) extra = pf
      }
      if (extra.length) {
        c.intent = 'create_bill'
        const rates = collectRates(text)
        c.items = extra.map((it, i) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || 'bag', rate: Number(it.rate || rates[i]) || 0, hsn: it.hsn || '' }))
        if (parsed && parsed.customer && parsed.customer.name) {
          const known = (ctx.customers || []).find((x) => String(x.name).toLowerCase() === String(parsed.customer.name).toLowerCase())
          const gstin = c.gstin || (known && known.gstin) || (parsed.customerGstin) || ''
          c.customer = { name: parsed.customer.name, mobile: parsed.customer.mobile || (known && known.mobile) || '', gstin }
          if (c.gstin) c.customer.gstin = c.gstin
          if (!c.billType && known && (known.billType || known.gstin)) c.billType = known.billType || (known.gstin ? 'gst' : 'kaccha')
        }
        return this.nextStep(c)
      }
    }

    // 5) Bill intent from text (parser often returns clarify for partial commands)
    if (!c.intent && detectBillIntent(t)) {
      c.intent = 'create_bill'
      const nm = extractCustomerName(text, ctx && ctx.customers)
      if (nm) {
        const known = (ctx.customers || []).find((x) => String(x.name).toLowerCase() === String(nm).toLowerCase())
        c.customer = { name: nm, mobile: (known && known.mobile) || '', gstin: (known && known.gstin) || '' }
        if (!c.billType && known && (known.billType || known.gstin)) c.billType = known.billType || (known.gstin ? 'gst' : 'kaccha')
      }
      return this.nextStep(c)
    }

    // 6) Bare customer name answer
    if (c.intent === 'create_bill' && !c.customer && /^[a-z][a-z\s.]{1,24}$/i.test(t) && !/\d/.test(t)) {
      c.customer = { name: cleanName(t), mobile: '', gstin: '' }
      return this.nextStep(c)
    }

    // 6b) Bare rate answer ("58 rupaye") when rate is the next missing field
    if (c.intent === 'create_bill' && c.items.length && computeMissing(c)[0] === 'rate' && c.items.some((it) => !Number(it.rate))) {
      const cleaned = String(text).replace(/rupaye|rupees|rs|rupe|per|prati|kilo|kg|rate|ke|ka|ki/ig, ' ').trim()
      if (/^\d+(\.\d+)?$/.test(cleaned)) {
        const rate = Number(cleaned)
        c.items = c.items.map((it) => (Number(it.rate) ? it : { ...it, rate }))
        return this.nextStep(c)
      }
    }

    // 6c) Bare quantity answer ("750 kilo") when quantity is the next missing field
    if (c.intent === 'create_bill' && c.items.length && computeMissing(c)[0] === 'quantity' && c.items.some((it) => !Number(it.qty))) {
      const cleaned = String(text).replace(/kilo|kg|ton|bag|bori|piece|pcs|ke|ka|ki|ho|hai/ig, ' ').trim()
      const m = cleaned.match(/(\d+(?:\.\d+)?)/)
      if (m && /^\d+(\.\d+)?$/.test(cleaned)) {
        const qty = Number(m[1])
        c.items = c.items.map((it) => (Number(it.qty) ? it : { ...it, qty }))
        return this.nextStep(c)
      }
    }

    // 7) Intent switch away from bill (queries keep the draft; mutations discard handled by caller)
    if (c.intent === 'create_bill' && !c.executed && parsed && NON_BILL_INTENTS.includes(parsed.intent)) {
      return { status: 'intent_switch', intent: parsed.intent, message: 'Aap ab koi aur command de rahe hain. Bill draft abhi rakha hua hai.' }
    }

    // 8) Unknown within bill draft → re-ask next missing
    if (c.intent === 'create_bill') return this.nextStep(c, true)

    return { status: 'none', message: (parsed && parsed.message) || 'Samajh nahi aaya.' }
  }
}
