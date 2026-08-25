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
const NON_BILL_INTENTS = ['stock_entry', 'stock_query', 'stock_ledger_query', 'query_outstanding', 'query_report', 'query_delivery']

function key(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '') }

function productFirstItems(text) {
  const m = String(text || '').match(/^([a-z0-9][a-z0-9\s]{1,40}?)\s+(\d+(?:\.\d+)?)\s*(bag|bori|bags|kg|kilo|kgg|quintal|qtl|ton|tonne|piece|pieces|truck)s?/i)
  if (!m) return null
  const words = cleanProductWords(m[1].trim().toLowerCase().split(/\s+/))
  if (!hasProductToken(words)) return null
  const name = buildItemName(words)
  if (!name) return null
  return [{ name, qty: Number(m[2]), unit: UNIT_LOOKUP[m[3].toLowerCase()] || 'bag', rate: 0 }]
}

function bareProductToken(text) {
  const m = String(text || '').match(/\b(sariya|sariyaa|tmt|steel|rod|cement|siment|sand|bricks|eent|acc(?:\s+cement)?)\b/i)
  return m ? m[0] : ''
}

function bareProductItems(text) {
  const tok = bareProductToken(text)
  if (!tok) return null
  const words = cleanProductWords(tok.toLowerCase().split(/\s+/))
  if (!hasProductToken(words)) return null
  const name = buildItemName(words)
  if (!name) return null
  return [{ name, qty: 0, rate: 0, unit: '' }]
}

function cleanName(s) { return String(s || '').trim().split(/\s+/).map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')).join(' ') }

function extractCustomerName(text, knownNames) {
  const m = String(text || '').match(/([a-z][a-z\s.]{1,30}?)\s+(?:ka|ke|ko|ki|का|के|को)\s+(?:bill|naam|name)/i)
  if (m) return cleanName(m[1])
  for (const n of knownNames || []) if (String(text || '').toLowerCase().includes(String(n).toLowerCase())) return n
  return ''
}

function detectBillIntent(text) { return /bill|bana|laga/i.test(String(text || '')) }

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
  return t === 'haan' || t === 'han' || t === 'ha' || t === 'yes' || t === 'confirm' || t === 'done' || t === 'ok' ||
    /^theek hai/.test(t) || /^bilkul/.test(t) || /^bana do/.test(t) || /^kar do/.test(t)
}

function isReject(text) { return /^nahi|^no|^na\b|^mat karo|^cancel/.test(String(text || '').toLowerCase().trim()) }

function computeMissing(c) {
  const missing = []
  if (!c.customer || !c.customer.name) missing.push('customer')
  if (!c.billType) missing.push('billType')
  if (c.billType === 'gst' && !c.gstin) missing.push('gstin')
  if (!c.items || c.items.length === 0) missing.push('item')
  else { if (c.items.some((it) => !Number(it.qty))) missing.push('quantity'); if (c.items.some((it) => !Number(it.rate))) missing.push('rate') }
  return missing
}

function summaryText(c) {
  const lines = []; const name = (c.customer && c.customer.name) || 'Customer'; const type = c.billType === 'gst' ? 'GST bill' : c.billType === 'kaccha' ? 'Kaccha bill' : 'bill'
  lines.push(name + ' ka ' + type + ':'); let total = 0
  for (const it of c.items || []) { const q = Number(it.qty) || 0; const r = Number(it.rate) || 0; total += q * r; lines.push(it.name + ' — ' + q + ' ' + (it.unit || '') + ' × ₹' + r + ' = ₹' + (q * r)) }
  if (c.gstin) lines.push('GSTIN ' + c.gstin); if (c.transport && c.transport.vehicleNo) lines.push('Vehicle ' + c.transport.vehicleNo)
  lines.push('Total: ₹' + total + '. Bill bana doon?'); return lines.join('\n')
}

function partialSummary(c) {
  const parts = []
  if (c.customer && c.customer.name) parts.push('Customer: ' + c.customer.name)
  if (c.billType) parts.push(c.billType === 'gst' ? 'GST bill' : 'Kaccha bill')
  if (c.items && c.items.length) parts.push(c.items.map((it) => it.name + ' ' + it.qty + ' ' + (it.unit || '')).join(', '))
  return parts.join(' | ')
}

function renderDraft(c) {
  return { intent: 'create_bill', customer: c.customer || { name: '' }, items: (c.items || []).map((it) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || 'bag', rate: Number(it.rate) || 0, hsn: it.hsn || '' })), transport: c.transport || {}, billType: c.billType, customerGstin: c.gstin || '', missing: [] }
}

export class ConversationManager {
  constructor() { this.convos = new Map() }

  fresh(id) {
    return { id, createdAt: Date.now(), lastActivity: Date.now(), intent: null, customer: null, customerId: null, items: [], billType: null, gstin: null, transport: null, asked: new Set(), confirmed: false, executed: false, result: null, pendingSuggestion: null, noSuggest: new Set() }
  }

  newConversation() { const id = 'convo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6); this.convos.set(id, this.fresh(id)); return id }
  endConversation(id) { this.convos.delete(id) }
  get(id) { return this.convos.get(id) }
  discard(id) { const c = this.convos.get(id); if (c) this.convos.set(id, this.fresh(id)) }
  hasActiveBill(id) { const c = this.convos.get(id); return !!c && c.intent === 'create_bill' && !c.executed && (!!c.customer || c.items.length > 0 || !!c.billType || !!c.gstin) }
  canExecute(id) { const c = this.convos.get(id); return !!c && c.intent === 'create_bill' && !c.executed && computeMissing(c).length === 0 }
  markExecuted(id, invoice) { const c = this.convos.get(id); if (c) { c.executed = true; c.result = invoice } }

  draftForExecution(id) {
    const c = this.convos.get(id); if (!c) return null
    return { intent: 'create_bill', customer: { name: (c.customer && c.customer.name) || '', mobile: (c.customer && c.customer.mobile) || '', gstin: c.gstin || '' }, items: (c.items || []).map((it) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || 'bag', rate: Number(it.rate) || 0, hsn: it.hsn || '' })), transport: c.transport || {}, billType: c.billType, customerGstin: c.gstin || '', missing: [] }
  }

  seedCustomer(id, customer) {
    const c = this.convos.get(id); if (!c) return
    c.intent = 'create_bill'; c.customer = { name: customer.name, mobile: customer.mobile || '', gstin: customer.gstin || '', _id: customer.id, _resolved: true }; c.customerId = customer.id
    if (!c.billType && (customer.billType || customer.gstin)) c.billType = customer.billType || (customer.gstin ? 'gst' : 'kaccha')
  }

  applySuggestion(c, s) {
    if (s.field === 'billType') c.billType = s.value
    else if (s.field === 'rate' && c.items.length) c.items = c.items.map((it) => (Number(it.rate) ? it : { ...it, rate: s.value }))
    else if (s.field === 'item') c.items = [{ name: s.value, qty: 0, rate: 0, unit: s.unit || 'bag' }]
  }

  async resolveCustomerAmbiguity(c, ctx) {
    if (!c.customer || !c.customer.name || c.customer._resolved) return null
    if (!ctx || !ctx.resolveCustomer) { c.customer._resolved = true; return null }
    const res = await ctx.resolveCustomer(c.customer.name)
    if (res && res.ambiguous && res.ambiguous.length > 1) {
      return { status: 'ambiguous_customer', message: 'Is naam ke do customer mil rahe hain: ' + res.ambiguous.map((x) => x.name).join(', ') + '. Kaunsa?', summary: partialSummary(c) }
    }
    if (res && res.customer) {
      c.customer = { name: res.customer.name, mobile: res.customer.mobile || '', gstin: res.customer.gstin || '', _id: res.customer.id, _resolved: true }; c.customerId = res.customer.id
      if (!c.billType && (res.customer.billType || res.customer.gstin)) c.billType = res.customer.billType || (res.customer.gstin ? 'gst' : 'kaccha')
      if (c.billType === 'gst' && !c.gstin && res.customer.gstin) c.gstin = res.customer.gstin; if (c.customer) c.customer.gstin = c.gstin || res.customer.gstin || ''
    } else { c.customer._resolved = true }
    return null
  }

  async maybeSuggest(c, ctx) {
    if (!ctx || !ctx.getHistory || !c.customerId) return null
    if (c.pendingSuggestion) return null
    const h = c._history || await ctx.getHistory(c.customerId)
    if (!h) return null
    c._history = h
    const missing = computeMissing(c)
    if (!missing.length) return null
    const field = missing[0]
    if (field === 'gstin' && c.billType === 'gst' && h.savedGstin && !c.gstin) { c.gstin = h.savedGstin; if (c.customer) c.customer.gstin = h.savedGstin; return null }
    if (field === 'billType' && !c.noSuggest.has('billType')) {
      const types = (h.recentBillTypes || []).filter(Boolean); const distinct = [...new Set(types)]
      if (types.length && distinct.length === 1) {
        const val = distinct[0]; c.pendingSuggestion = { field: 'billType', value: val, message: 'Pichla bill ' + (val === 'gst' ? 'GST' : 'kaccha') + ' tha. Is baar bhi ' + (val === 'gst' ? 'GST' : 'kaccha') + ' rakhu?' }
        return { status: 'suggest', message: c.pendingSuggestion.message, summary: partialSummary(c), field: 'billType', value: val }
      }
    }
    if (field === 'rate' && c.items.length && !c.noSuggest.has('rate')) {
      const cur = c.items.find((it) => !Number(it.rate)); if (!cur) return null
      const rates = (h.recentRates || []).filter((r) => key(r.item) === key(cur.name)); const distinct = [...new Set(rates.map((r) => Number(r.rate)))]
      if (distinct.length === 1) {
        const val = distinct[0]; c.pendingSuggestion = { field: 'rate', value: val, message: 'Pichla ' + cur.name + ' rate ₹' + val + ' per ' + (cur.unit || '') + ' tha. Wahi rakhun?' }
        return { status: 'suggest', message: c.pendingSuggestion.message, summary: partialSummary(c), field: 'rate', value: val }
      }
      if (distinct.length > 1) { return { status: 'needs_info', message: 'Is customer ke liye recent rates: ' + distinct.join(' ₹/') + ' per ' + (cur.unit || '') + '. Kaunsa rakhun?', summary: partialSummary(c), missing: ['rate'] } }
    }
    if (field === 'item' && !c.noSuggest.has('item')) {
      const items = (h.recentItems || []); const distinct = [...new Set(items.map((i) => i.name))]
      if (distinct.length === 1) {
        const val = distinct[0]; const unit = items.find((i) => i.name === val)?.unit || ''; c.pendingSuggestion = { field: 'item', value: val, unit, message: 'Pichli baar ' + val + ' liya tha. Wahi material rakhun?' }
        return { status: 'suggest', message: c.pendingSuggestion.message, summary: partialSummary(c), field: 'item', value: val }
      }
    }
    return null
  }

  async nextStep(c, ctx, reask) {
    let missing = computeMissing(c)
    const confirm = () => { const msg = summaryText(c); return { status: 'needs_confirm', message: msg, summary: msg, renderDraft: renderDraft(c), missing: [] } }
    if (missing.length === 0) return confirm()
    if (!reask) {
      // Suggestions can auto-fill a field (e.g. saved GSTIN); keep re-checking until stable.
      for (let i = 0; i < 5; i++) {
        const sug = await this.maybeSuggest(c, ctx)
        if (sug) return sug
        const m2 = computeMissing(c)
        if (m2.length === 0) return confirm()
        if (m2.join() === missing.join()) break
        missing = m2
      }
    }
    const field = missing[0]; return { status: 'needs_info', message: (reask ? 'Phir bolo — ' : '') + MESSAGES[field], summary: partialSummary(c), missing }
  }

  async processTurn(id, text, parsed, ctx) {
    let c = this.convos.get(id)
    if (!c) { this.convos.set(id, this.fresh(id)); c = this.convos.get(id) }
    c.lastActivity = Date.now()
    const t = String(text || '').toLowerCase().trim()

    if (c.executed) {
      const startsNew = detectBillIntent(t) || (parsed && parsed.intent === 'create_bill')
      if (!startsNew) return { status: 'none', message: 'Bill ban gaya tha. Naya bill banane ke liye bolo.' }
      const fresh = this.fresh(id); fresh.id = id; this.convos.set(id, fresh); c = fresh
    }

    // Pending suggestion handling (must run before other steps)
    if (c.pendingSuggestion) {
      const s = c.pendingSuggestion
      if (isConfirm(t)) { c.pendingSuggestion = null; this.applySuggestion(c, s); return await this.nextStep(c, ctx) }
      if (isReject(t)) { c.pendingSuggestion = null; c.noSuggest.add(s.field); return await this.nextStep(c, ctx) }
      c.pendingSuggestion = null // user answered something else — clear suggestion and continue
    }

    // 1) Confirmation answer
    if (isConfirm(t)) {
      if (c.intent === 'create_bill' && computeMissing(c).length === 0) { return { status: 'execute', message: summaryText(c) } }
      return { status: 'needs_info', message: c.intent === 'create_bill' ? MESSAGES[computeMissing(c)[0]] : 'Kuch nahi bana — pehle batao kya karna hai.' }
    }

    // 2) Bill type answer
    const bt = detectBillType(t)
    if (bt) { c.intent = c.intent || 'create_bill'; c.billType = bt; return await this.nextStep(c, ctx) }

    // 3) GSTIN answer
    const g = detectGstin(text)
    if (g) { c.intent = c.intent || 'create_bill'; c.gstin = g; c.customer = { ...(c.customer || {}), gstin: g }; return await this.nextStep(c, ctx) }

    // 4) Item/rate extraction for bill turns (skip explicit non-bill commands)
    if ((c.intent === 'create_bill' || detectBillIntent(t)) && !(parsed && NON_BILL_INTENTS.includes(parsed.intent))) {
      let extra = []
      if (parsed && parsed.intent === 'create_bill' && parsed.items) extra = parsed.items
      if (!extra.length) extra = extractItems(text)
      if (!extra.length) { const pf = productFirstItems(text); if (pf) extra = pf }
      if (!extra.length && c.customer && c.customer.name) {
        const bpTok = bareProductToken(text)
        if (bpTok && !String(c.customer.name).toLowerCase().includes(bpTok.toLowerCase())) {
          const bp = bareProductItems(text)
          if (bp) extra = bp
        }
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
        const amb = await this.resolveCustomerAmbiguity(c, ctx); if (amb) return amb
        return await this.nextStep(c, ctx)
      }
    }

    // 5) Bill intent from text
    if (!c.intent && detectBillIntent(t)) {
      c.intent = 'create_bill'; const nm = extractCustomerName(text, ctx && ctx.customers)
      if (nm) {
        const known = (ctx.customers || []).find((x) => String(x.name).toLowerCase() === String(nm).toLowerCase())
        c.customer = { name: nm, mobile: (known && known.mobile) || '', gstin: (known && known.gstin) || '' }
        if (!c.billType && known && (known.billType || known.gstin)) c.billType = known.billType || (known.gstin ? 'gst' : 'kaccha')
      }
      const amb = await this.resolveCustomerAmbiguity(c, ctx); if (amb) return amb
      return await this.nextStep(c, ctx)
    }

    // 6) Bare customer name answer
    if (c.intent === 'create_bill' && !c.customer && /^[a-z][a-z\s.]{1,24}$/i.test(t) && !/\d/.test(t)) {
      c.customer = { name: cleanName(t), mobile: '', gstin: '' }
      const amb = await this.resolveCustomerAmbiguity(c, ctx); if (amb) return amb
      return await this.nextStep(c, ctx)
    }

    // 6b) Bare rate answer
    if (c.intent === 'create_bill' && c.items.length && computeMissing(c)[0] === 'rate' && c.items.some((it) => !Number(it.rate))) {
      const cleaned = String(text).replace(/rupaye|rupees|rs|rupe|per|prati|kilo|kg|rate|ke|ka|ki/ig, ' ').trim()
      if (/^\d+(\.\d+)?$/.test(cleaned)) { c.items = c.items.map((it) => (Number(it.rate) ? it : { ...it, rate: Number(cleaned) })); return await this.nextStep(c, ctx) }
    }

    // 6c) Bare quantity answer ("750 kilo") when quantity is the next missing field
    if (c.intent === 'create_bill' && c.items.length && computeMissing(c)[0] === 'quantity' && c.items.some((it) => !Number(it.qty))) {
      const cleaned = String(text).replace(/kilo|kg|ton|bag|bori|piece|pcs|ke|ka|ki|ho|hai/ig, ' ').trim()
      const m = cleaned.match(/(\d+(?:\.\d+)?)/)
      if (m && /^\d+(\.\d+)?$/.test(cleaned)) {
        const unitM = String(text).match(/\b(kilo|kg|kgg|ton|tonne|bag|bori|bags|piece|pieces|pcs|quintal|qtl|truck)\b/i)
        const unit = unitM ? UNIT_LOOKUP[unitM[1].toLowerCase()] || '' : ''
        c.items = c.items.map((it) => (Number(it.qty) ? it : { ...it, qty: Number(m[1]), unit: unit || it.unit || 'bag' }))
        return await this.nextStep(c, ctx)
      }
    }

    // 7) Intent switch
    if (c.intent === 'create_bill' && !c.executed && parsed && NON_BILL_INTENTS.includes(parsed.intent)) {
      return { status: 'intent_switch', intent: parsed.intent, message: 'Aap ab koi aur command de rahe hain. Bill draft abhi rakha hua hai.' }
    }

    // 8) Unknown within bill draft → re-ask
    if (c.intent === 'create_bill') return await this.nextStep(c, ctx, true)

    return { status: 'none', message: (parsed && parsed.message) || 'Samajh nahi aaya.' }
  }
}