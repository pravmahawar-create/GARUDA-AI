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

// Loose extractor for explicit continuous dictation ("5 kilo sugar", "10 kilo atta", "2 litre oil").
// Accepts unknown product words — the user is deliberately dictating items.
const LOOSE_UNITS = { ...UNIT_LOOKUP, litre: 'litre', liters: 'litre', liter: 'litre', ltr: 'litre' }
const LOOSE_FILLERS = new Set(['ke', 'ka', 'ki', 'ko', 'se', 'per', 'par', 'aur', 'and', 'rate', 'bhav', 'rupaye', 'rupay', 'rs', 'hazaar', 'hajar', 'lakh', 'lac', 'wala', 'wali', 'kar', 'karo', 'do', 'karke', 'ke rate', 'ke bhav'])
function looseClean(words) {
  return words.filter((w) => !/^\d+$/.test(w) && !LOOSE_FILLERS.has(w))
}
// Loose name builder: keeps dictation words even if they collide with STOP_WORDS (e.g. "dal").
function looseName(words) {
  const w = words.filter(Boolean)
  return w.length ? w.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ') : ''
}
function looseItems(text) {
  const out = []
  const re = /(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?\s*(bag|bori|bags|kg|kilo|kgg|quintal|qtl|ton|tonne|piece|pieces|truck|litre|liters|liter|ltr)\s+([a-z0-9]+(?:\s+[a-z0-9]+){0,3})/gi
  let m
  while ((m = re.exec(text)) !== null) {
    const name = looseName(looseClean(m[4].toLowerCase().split(/\s+/)))
    if (!name) continue
    const mult = (m[2] || '').toLowerCase()
    const qty = Number(m[1]) * (mult === 'lakh' || mult === 'lac' ? 100000 : mult ? 1000 : 1)
    out.push({ name, qty, unit: LOOSE_UNITS[m[3].toLowerCase()] || 'bag', rate: 0 })
  }
  return out
}

function productFirstItemsLoose(text) {
  const m = String(text || '').match(/^([a-z0-9][a-z0-9\s]{1,40}?)\s+(\d+(?:\.\d+)?)\s*(bag|bori|bags|kg|kilo|kgg|quintal|qtl|ton|tonne|piece|pieces|truck|litre|liters|liter|ltr)s?/i)
  if (!m) return null
  const name = looseName(looseClean(m[1].trim().toLowerCase().split(/\s+/)))
  if (!name) return null
  return [{ name, qty: Number(m[2]), unit: LOOSE_UNITS[m[3].toLowerCase()] || 'bag', rate: 0 }]
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
  const m = String(text || '').match(/([a-z][a-z\s.]{1,30}?)\s+(?:ka|ke|ko|ki|का|के|को)\s+(?:bill|naam|name|khata)/i)
  if (m) return cleanName(m[1])
  const ne = String(text || '').match(/([a-z][a-z\s.]{1,30}?)\s+ne\s+(?:\d|payment|rupaye|rupay|hazaar|hajar|lakh|lac|diye|diya|dii)/i)
  if (ne) return cleanName(ne[1])
  for (const n of knownNames || []) if (String(text || '').toLowerCase().includes(String(n).toLowerCase())) return n
  return ''
}

function customerNames(ctx) { return ((ctx && ctx.customers) || []).map((c) => String(c.name || '')) }

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

function financeFresh() {
  return { customer: null, customerId: null, amount: 0, method: 'Cash', invoiceId: '', invoiceRef: '', note: '', qrRequested: false, confirmed: false, executed: false }
}

function financeMissing(f) {
  const missing = []
  if (!f.customer || !f.customer.name) missing.push('customer')
  if (!f.amount || f.amount <= 0) missing.push('amount')
  return missing
}

function financeSummary(f) {
  const parts = []
  if (f.customer && f.customer.name) parts.push('Customer: ' + f.customer.name)
  if (f.amount) parts.push('Payment: ₹' + f.amount)
  if (f.method) parts.push(f.method)
  if (f.invoiceRef) parts.push('Bill ' + f.invoiceRef)
  return parts.join(' | ')
}

function askForFinance(field) {
  return field === 'customer' ? 'Customer ka naam batao.' : 'Kitna payment? Bolo jaise "50 hazaar".'
}

function detectPaymentMethod(text) {
  const t = String(text || '').toLowerCase()
  if (/\bcash\b|naqad/.test(t)) return 'Cash'
  if (/\bupi\b|phone pe|phonepe|gpay|google pay|paytm/.test(t)) return 'UPI'
  if (/bank transfer|bank|transfer|neft|imps/.test(t)) return 'Bank Transfer'
  if (/cheque|check/.test(t)) return 'Cheque'
  return null
}

function extractAmount(text) {
  const t = String(text || '')
  const tokens = []
  const re = /₹?\s*(\d+(?:[.,]\d+)?)\s*(hazaar|hajar|lakh|lac)?\s*(rupaye|rupay|rs|rupe)?/gi
  let m
  while ((m = re.exec(t)) !== null) {
    let n = parseFloat(m[1].replace(/,/g, ''))
    const mult = (m[2] || '').toLowerCase()
    if (mult === 'lakh' || mult === 'lac') n *= 100000
    else if (mult) n *= 1000
    if (n > 0) tokens.push(n)
  }
  return tokens.length ? Math.max(...tokens) : 0
}

function extractInvoiceRef(text) {
  const m = String(text || '').match(/(?:bill|invoice)\s*#?\s*(\d{3,4})/i)
  return m ? m[1] : ''
}

function detectFinanceIntent(text) {
  const t = String(text || '').toLowerCase()
  if (/khata|ledger/.test(t) && /dikhao|dikha|show|ka khata/.test(t)) return { kind: 'khata' }
  if (/last\s*(payment|rupaye)|aakhri\s*(payment|rupaye)|akhir\s*(payment|rupaye)/.test(t)) return { kind: 'last_payment' }
  if (/kitna\s*(payment|rupaye)\s*(diya|dii|aaye)|kitne\s*(payment|rupaye)|total\s*(payment|rupaye)|payment\s*total/.test(t)) return { kind: 'total_paid' }
  if (/\bqr\b|upi\s*(dikhao|bana|dikha)|payment ke liye (qr|upi)/.test(t)) return { kind: 'upi_qr' }
  if (/(payment|jama|bhar\s*(diye|diya|dii|kar)|de\s*diye|diye|diya|dii|rupaye\s*(diye|diya|dii))/.test(t) && !/kitna|kitni|baki|kaun|khata|last/.test(t)) return { kind: 'record' }
  return null
}

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

function inventorySummary(inv) {
  const items = (inv && inv.items) || []
  return items.length ? items.map((it) => it.name + ' ' + it.qty + ' ' + (it.unit || '')).join('\n') : ''
}

function renderDraft(c) {
  return { intent: 'create_bill', customer: c.customer || { name: '' }, items: (c.items || []).map((it) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || 'bag', rate: Number(it.rate) || 0, hsn: it.hsn || '' })), transport: c.transport || {}, billType: c.billType, customerGstin: c.gstin || '', missing: [] }
}

export class ConversationManager {
  constructor() { this.convos = new Map() }

  fresh(id) {
    return { id, createdAt: Date.now(), lastActivity: Date.now(), intent: null, customer: null, customerId: null, items: [], billType: null, gstin: null, transport: null, asked: new Set(), confirmed: false, executed: false, result: null, pendingSuggestion: null, noSuggest: new Set(), finance: null, continuousEntry: null, inventory: null }
  }

  newConversation() { const id = 'convo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6); this.convos.set(id, this.fresh(id)); return id }
  endConversation(id) { this.convos.delete(id) }
  get(id) { return this.convos.get(id) }
  discard(id) { const c = this.convos.get(id); if (c) this.convos.set(id, this.fresh(id)) }
  hasActiveBill(id) { const c = this.convos.get(id); return !!c && c.intent === 'create_bill' && !c.executed && (!!c.customer || c.items.length > 0 || !!c.billType || !!c.gstin) }
  canExecute(id) { const c = this.convos.get(id); return !!c && c.intent === 'create_bill' && !c.executed && computeMissing(c).length === 0 }
  markExecuted(id, invoice) { const c = this.convos.get(id); if (c) { c.executed = true; c.result = invoice } }

  enterContinuous(id, mode) { const c = this.convos.get(id); if (c) c.continuousEntry = mode }
  exitContinuous(id) { const c = this.convos.get(id); if (c) c.continuousEntry = null }
  isContinuous(id) { const c = this.convos.get(id); return c ? c.continuousEntry : null }
  inventoryItems(id) { const c = this.convos.get(id); return (c && c.inventory && c.inventory.items) || [] }

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

  async resolveFinanceCustomer(c, ctx) {
    if (!c.finance || !c.finance.customer || !c.finance.customer.name || c.finance.customer._resolved) return null
    if (!ctx || !ctx.resolveCustomer) { c.finance.customer._resolved = true; return null }
    const res = await ctx.resolveCustomer(c.finance.customer.name)
    if (res && res.ambiguous && res.ambiguous.length > 1) {
      return { status: 'ambiguous_customer', message: 'Is naam ke do customer mil rahe hain: ' + res.ambiguous.map((x) => x.name).join(', ') + '. Kaunsa?', summary: financeSummary(c.finance) }
    }
    if (res && res.customer) { c.finance.customer = { name: res.customer.name, mobile: res.customer.mobile || '', _id: res.customer.id, _resolved: true }; c.finance.customerId = res.customer.id }
    else if (c.finance.customer) c.finance.customer._resolved = true
    return null
  }

  markFinanceExecuted(id) { const c = this.convos.get(id); if (c && c.finance) { c.finance.executed = true; c.finance.confirmed = true } }

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
    if (missing.length === 0) {
      if (c.continuousEntry === 'bill') return { status: 'needs_info', message: 'Items bolte jao — "bas" bolna jab ho jaye.', summary: partialSummary(c), missing: [] }
      return confirm()
    }
    // Auto-enter continuous entry is triggered by an explicit opt-in or a second item (see step 4).
    if (!reask) {
      // Suggestions can auto-fill a field (e.g. saved GSTIN); keep re-checking until stable.
      for (let i = 0; i < 5; i++) {
        const sug = await this.maybeSuggest(c, ctx)
        if (sug) return sug
        const m2 = computeMissing(c)
        if (m2.length === 0) {
          if (c.continuousEntry === 'bill') return { status: 'needs_info', message: 'Items bolte jao — "bas" bolna jab ho jaye.', summary: partialSummary(c), missing: [] }
          return confirm()
        }
        if (m2.join() === missing.join()) break
        missing = m2
      }
    }
    const field = missing[0]
    if (c.continuousEntry === 'bill') {
      if (field === 'item') return { status: 'needs_info', message: 'Material ka naam batao — items bolte jao, main add karta jaunga. Jab ho jaye to "bas" bol dena.', summary: partialSummary(c), missing }
      if (field === 'rate') return { status: 'needs_info', message: 'Item add ho gaya. Rate batao — jaise "110".', summary: partialSummary(c), missing }
      if (field === 'quantity') return { status: 'needs_info', message: 'Item add ho gaya. Quantity batao.', summary: partialSummary(c), missing }
    }
    return { status: 'needs_info', message: (reask ? 'Phir bolo — ' : '') + MESSAGES[field], summary: partialSummary(c), missing }
  }

  async processTurn(id, text, parsed, ctx) {
    let c = this.convos.get(id)
    if (!c) { this.convos.set(id, this.fresh(id)); c = this.convos.get(id) }
    c.lastActivity = Date.now()
    const t = String(text || '').toLowerCase().trim()

    if (c.executed) {
      const startsNew = detectBillIntent(t) || (parsed && parsed.intent === 'create_bill') || !!detectFinanceIntent(t)
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

    // 0) FINANCE intents (payments, khata, UPI)
    const fin = detectFinanceIntent(t)
    if (fin) {
      if (fin.kind === 'khata') {
        const nm = extractCustomerName(text, customerNames(ctx)) || (c.finance && c.finance.customer && c.finance.customer.name) || ''
        return { status: 'khata_query', customerName: nm }
      }
      if (fin.kind === 'last_payment') {
        const nm = extractCustomerName(text, customerNames(ctx)) || ''
        return { status: 'last_payment_query', customerName: nm }
      }
      if (fin.kind === 'total_paid') {
        const nm = extractCustomerName(text, customerNames(ctx)) || ''
        return { status: 'total_paid_query', customerName: nm }
      }
      if (fin.kind === 'upi_qr') {
        if (!c.finance || c.finance.executed) c.finance = financeFresh()
        const nm = extractCustomerName(text, customerNames(ctx))
        if (nm) { c.finance.customer = { name: nm }; const amb = await this.resolveFinanceCustomer(c, ctx); if (amb) return amb }
        const amt = extractAmount(text)
        if (amt > 0) c.finance.amount = amt
        c.finance.qrRequested = true
        return { status: 'upi_qr', customerName: (c.finance.customer && c.finance.customer.name) || nm || '', amount: amt || 0, summary: financeSummary(c.finance) }
      }
      // record payment
      if (!c.finance || c.finance.executed) c.finance = financeFresh()
      c.finance.qrRequested = false
      const amt = extractAmount(text)
      if (amt > 0) c.finance.amount = amt
      const meth = detectPaymentMethod(text)
      if (meth) c.finance.method = meth
      const invRef = extractInvoiceRef(text)
      if (invRef) c.finance.invoiceRef = invRef
      const nm = extractCustomerName(text, customerNames(ctx))
      if (nm) { c.finance.customer = { name: nm }; const amb = await this.resolveFinanceCustomer(c, ctx); if (amb) return amb }
      const fmissing = financeMissing(c.finance)
      if (fmissing.length) return { status: 'payment_needs_info', message: askForFinance(fmissing[0]), summary: financeSummary(c.finance), missing: fmissing }
      return { status: 'payment_confirm', message: 'Payment record karun? ' + financeSummary(c.finance), summary: financeSummary(c.finance), renderFinance: { ...c.finance } }
    }

    // 0.5) CONTINUOUS ENTRY — bill opt-in ("items bolta jaunga", bulk)
    if (!c.continuousEntry && c.intent === 'create_bill' && /items\s*(bolta|bolti|bolungi|bolu)?\s*(jaunga|jaungi|jaaunga)|bulk|continuous|lagataar|bolte jao|bolta jaunga|items add karne hain/i.test(t)) {
      c.continuousEntry = 'bill'
      return { status: 'needs_info', message: 'Items bolte jao — main add karta jaunga. Jab ho jaye to "bas" bol dena.', summary: partialSummary(c) }
    }

    // 0.5) CONTINUOUS ENTRY — inventory start
    if (!c.continuousEntry && /(inventory|stock)\s*banana hai|items bolta jaunga.*(inventory|stock)|inventory entry|inventory me add/.test(t)) {
      c.continuousEntry = 'inventory'
      c.inventory = c.inventory || { items: [] }
      return { status: 'needs_info', message: 'Inventory items bolte jao — main add karta jaunga. Jab ho jaye to "bas" bol dena.' }
    }

    // 0.6) CONTINUOUS ENTRY — active session commands (finish / cancel / undo / corrections)
    if (c.continuousEntry) {
      if (/^(bas|ho gaya|ho gya|khataam|finish|complete|itna hi|bas itna hi|ho gaya bill|items complete|ab bas|bas kar)\b/.test(t) || ['bas', 'ho gaya', 'ho gya', 'khataam', 'finish', 'itna hi'].includes(t)) {
        c.continuousEntry = null
        if (c.inventory && c.inventory.items && c.inventory.items.length) {
          const sum = inventorySummary(c.inventory)
          return { status: 'inventory_confirm', message: 'Inventory review:\n' + sum + '\nCommit karun?', summary: sum }
        }
        return await this.nextStep(c, ctx)
      }
      if (/^(cancel|rehne do|mat banao|band karo|cancel kar do|bilkul nahi)\b/.test(t)) {
        const fresh = this.fresh(id); fresh.id = id; this.convos.set(id, fresh); c = fresh
        return { status: 'none', message: 'Draft cancel kar diya.' }
      }
      if (/(pichla|pichle|last|ek hat)\s*(item)?\s*(hatao|delete|hatana|nikal|remove|undo|hata do|girao)/i.test(t)) {
        if (c.items && c.items.length) { c.items.pop(); return { status: 'needs_info', message: 'Pichla item hata diya. Items bolte jao — "bas" bolna jab ho jaye.', summary: partialSummary(c) } }
        return { status: 'needs_info', message: 'Koi item nahi hai hatane ko.' }
      }
      const rateM = t.match(/pichle item ka (rate|bhav)\s*(\d+(?:\.\d+)?)/)
      if (rateM && c.items && c.items.length) {
        c.items[c.items.length - 1].rate = Number(rateM[2])
        return { status: 'needs_info', message: 'Pichle item ka rate ' + rateM[2] + ' kar diya. Items bolte jao.', summary: partialSummary(c) }
      }
      const qtyM = t.match(/pichle item ki (qty|quantity|matra)\s*(\d+(?:\.\d+)?)/)
      if (qtyM && c.items && c.items.length) {
        c.items[c.items.length - 1].qty = Number(qtyM[2])
        return { status: 'needs_info', message: 'Pichle item ki quantity ' + qtyM[2] + ' kar di. Items bolte jao.', summary: partialSummary(c) }
      }
      const nameM = t.match(/pichla item (.+?) nahi (.+?) tha/)
      if (nameM && c.items && c.items.length) {
        const words = cleanProductWords(nameM[2].trim().toLowerCase().split(/\s+/))
        const newName = buildItemName(words) || nameM[2].trim()
        c.items[c.items.length - 1].name = newName
        return { status: 'needs_info', message: 'Pichla item ' + newName + ' kar diya. Items bolte jao.', summary: partialSummary(c) }
      }
      // inventory continuous: append extracted items
      if (c.continuousEntry === 'inventory') {
        let extra = extractItems(text)
        if (!extra.length) { const pf = productFirstItems(text); if (pf) extra = pf }
        if (extra.length) {
          c.inventory = c.inventory || { items: [] }
          const rates = collectRates(text)
          const added = extra.map((it, i) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || 'bag', rate: Number(it.rate || rates[i]) || 0 }))
          c.inventory.items.push(...added)
          const last = c.inventory.items[c.inventory.items.length - 1]
          return { status: 'needs_info', message: 'Add ho gaya: ' + last.name + ' ' + last.qty + ' ' + last.unit + '. Items bolte jao — "bas" bolna jab ho jaye.', summary: inventorySummary(c.inventory) }
        }
        return { status: 'needs_info', message: 'Item samajh nahi aaya. Phir bolo — jaise "ACC cement 500 bag".' }
      }
    }

    // 1) Confirmation answer
    if (isConfirm(t)) {
      if (c.finance && !c.finance.executed) {
        const fmissing = financeMissing(c.finance)
        if (fmissing.length) return { status: 'payment_needs_info', message: askForFinance(fmissing[0]), summary: financeSummary(c.finance) }
        return { status: 'payment_execute', message: 'Payment record karta hoon.', summary: financeSummary(c.finance) }
      }
      // Mid-entry acknowledgment must NOT execute the bill in continuous mode.
      if (c.continuousEntry === 'bill') {
        return { status: 'needs_info', message: 'Items bolte jao — "bas" bolna jab ho jaye.', summary: partialSummary(c) }
      }
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
      if (!extra.length && c.continuousEntry === 'bill') {
        const loose = looseItems(text)
        if (loose.length) extra = loose
        else { const pfl = productFirstItemsLoose(text); if (pfl) extra = pfl }
      }
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
        const mapped = extra.map((it, i) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || 'bag', rate: Number(it.rate || rates[i]) || 0, hsn: it.hsn || '' }))
        if (c.continuousEntry === 'bill') c.items.push(...mapped)
        else c.items = mapped
        // A second item implies multi-item entry → switch to continuous mode automatically.
        if (!c.continuousEntry && c.items.length >= 2) c.continuousEntry = 'bill'
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
      c.intent = 'create_bill'; const nm = extractCustomerName(text, customerNames(ctx))
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