// Cloud intelligence for robust natural-language understanding.
// All requests are proxied via backend server endpoint /api/billing/voice so client bundles
// never expose API credentials. Fallback to local regex parser when offline.

const GEMINI_KEY = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_KEY) || '').toString().trim()
const MODEL = 'gemini-2.0-flash'

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine !== false
}

export function geminiAvailable(apiBase) {
  return Boolean((apiBase || GEMINI_KEY) && isOnline())
}

export async function aiUnderstand(text, domain, apiBase = '') {
  if (!isOnline()) return null

  // Security Hardening: Route via server proxy endpoint if apiBase is present
  if (apiBase) {
    try {
      const res = await fetch(apiBase + '/api/billing/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, domain: domain && domain.label ? domain.label : 'general trading' })
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.success && data.parsed) return data.parsed
      }
    } catch (e) {
      console.log('[VOICE_PROXY] Backend proxy failed, attempting fallback', e && e.message ? e.message : e)
    }
  }

  // Fallback client-side call if GEMINI_KEY is provided in local dev mode
  if (!GEMINI_KEY) return null

  const prompt =
    'You are the voice understanding engine for GARUDA, an Indian SMB billing app. ' +
    'Active business domain: ' + (domain && domain.label ? domain.label : 'general trading') + '.\n' +
    'Understand the Hindi/Hinglish utterance and return STRICT JSON (no markdown, no prose) with this exact shape:\n' +
    '{"intent":"create_bill"|"stock_entry"|"stock_query"|"query_outstanding"|"khata_query"|"payment"|"vehicle_add"|"vehicle_query"|"order","customer":{"name":"..."},"items":[{"name":"...","qty":5,"unit":"kg","rate":48}],"billType":"gst"|"kaccha","gstin":"...","operation":"add"|"subtract"|"query","vehicle":{"number":"MP20AB1234","type":"...","capacity":1500,"unit":"kg"},"amount":50000,"invoiceNo":"0048","orderValue":1000000,"orderDates":"2026-08-02 to 2026-08-06","orderVehicles":["MP20AB1234"],"orderVehicleCount":3,"orderTripsPerDay":4,"orderProduct":"TMT Steel","orderRate":58,"orderUnit":"kg","orderCapacity":1500}\n' +
    'Rules:\n' +
    '- Fill ONLY fields actually present in the utterance.\n' +
    '- Do NOT invent a customer, product, quantity, rate, or GSTIN that is not mentioned.\n' +
    '- Units: bag, kg, gram, ton, quintal, piece, litre, meter, box, packet.\n' +
    '- "kaccha"/"bina gst"/"non-gst" => billType kaccha; "gst"/"pakka" => billType gst.\n' +
    '- A vehicle number (MP20AB1234) goes in vehicle.number.\n' +
    '- If intent is unclear, use intent "create_bill" only when a bill is clearly requested; otherwise pick the best match or leave fields empty.\n' +
    'Utterance: ' + String(text)

  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + encodeURIComponent(GEMINI_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
      })
    })
    if (!res.ok) { console.log('[GEMINI] http ' + res.status); return null }
    const data = await res.json()
    const txt = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text
    if (!txt) return null
    const parsed = JSON.parse(txt)
    return parsed && parsed.intent ? parsed : null
  } catch (e) {
    console.log('[GEMINI] error', e && e.message ? e.message : e)
    return null
  }
}


// Convert Gemini's structured output into the same shape parseLocal returns,
// so the existing conversation/executor pipeline can consume it unchanged.
export function aiToParsed(data, domain) {
  if (!data || !data.intent) return null
  if (data.intent === 'create_bill') {
    const customer = (data.customer && data.customer.name) ? { name: data.customer.name, mobile: data.customer.mobile || '' } : { name: '' }
    const items = (data.items || []).map((it) => ({ name: it.name, qty: Number(it.qty) || 0, unit: it.unit || 'bag', rate: Number(it.rate) || 0, hsn: '' }))
    const missing = []
    if (!customer.name) missing.push('customer ka naam')
    if (!items.length) missing.push('item')
    else {
      if (items.some((i) => !i.qty)) missing.push('quantity')
      if (items.some((i) => !i.rate)) missing.push('har item ka rate')
    }
    return { intent: 'create_bill', customer, items, missing, billType: data.billType || null, customerGstin: data.gstin || '', transport: {} }
  }
  if (data.intent === 'stock_entry') {
    return {
      intent: 'stock_entry',
      operation: data.operation || 'add',
      items: (data.items || []).map((it) => ({ name: it.name, qty: Number(it.qty) || 0, unit: it.unit || 'bag' })),
      vehicleNo: (data.vehicle && data.vehicle.number) || ''
    }
  }
  if (data.intent === 'stock_query') {
    return {
      intent: 'stock_query',
      operation: data.operation === 'query_category' ? 'query_category' : 'query',
      category: data.category || null,
      combineTotal: Boolean(data.combineTotal),
      items: (data.items || []).map((it) => ({ name: it.name }))
    }
  }
  if (data.intent === 'query_outstanding') {
    return { intent: 'query_outstanding', customerName: (data.customer && data.customer.name) || '' }
  }
  if (data.intent === 'khata_query') {
    return { intent: 'stock_ledger_query', scope: 'inward', customerName: (data.customer && data.customer.name) || '' }
  }
  if (data.intent === 'order') {
    const om = []
    if (!data.customer || !data.customer.name) om.push('customer ka naam')
    if (!data.orderValue) om.push('kitne ka order')
    if (!data.orderProduct) om.push('kaunsa maal')
    if (!data.orderRate) om.push('rate')
    if (!data.orderDates) om.push('date')
    if (!data.orderVehicles || !data.orderVehicles.length) om.push('gaadiyon ke numbers')
    return {
      intent: 'order',
      customer: data.customer ? { name: data.customer.name, mobile: data.customer.mobile || '' } : { name: '' },
      missing: om,
      orderValue: data.orderValue || 0,
      orderDates: data.orderDates || '',
      orderVehicles: data.orderVehicles || [],
      orderVehicleCount: data.orderVehicleCount || (data.orderVehicles ? data.orderVehicles.length : 0),
      orderTripsPerDay: data.orderTripsPerDay || 1,
      orderProduct: data.orderProduct || '',
      orderRate: data.orderRate || 0,
      orderUnit: data.orderUnit || 'kg',
      orderCapacity: data.orderCapacity || 0
    }
  }
  if (data.intent === 'vehicle_add') {
    return { intent: 'vehicle_add', vehicle: data.vehicle || { number: '', type: '', capacity: 0, unit: 'kg' } }
  }
  return null
}
