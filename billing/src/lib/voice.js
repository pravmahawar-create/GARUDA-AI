const UNITS = { bag: 'bag', bori: 'bag', bags: 'bag', kgg: 'kg', kilo: 'kg', kg: 'kg', quintal: 'quintal', qtl: 'quintal', ton: 'ton', tonne: 'ton', piece: 'piece', pieces: 'piece', truck: 'truck', gadi: 'truck' }

const NUMS = {
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10,
  gyara: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15, solah: 16, satrah: 17, atharah: 18, unnis: 19, bis: 20,
  hazar: 1000, hazaar: 1000, hajar: 1000, lakh: 100000, lac: 100000, lakhs: 100000
}

const MULTS = { hazaar: 1000, hajar: 1000, lakh: 100000, lac: 100000 }

export function numberFromHindi(text) {
  const t = String(text || '').toLowerCase().trim()
  if (/^\d+$/.test(t)) return parseInt(t, 10)
  let total = 0
  let cur = 0
  for (const w of t.split(/[\s-]+/).filter(Boolean)) {
    if (/^\d+$/.test(w)) cur += parseInt(w, 10)
    else if (MULTS[w]) {
      total += cur === 0 ? MULTS[w] : cur * MULTS[w]
      cur = 0
    } else if (NUMS[w]) cur += NUMS[w]
  }
  return total + cur
}

const PRODUCT_ALIAS = {
  cement: 'Cement', semento: 'Cement', siment: 'Cement',
  sariya: 'TMT Steel', sariyaa: 'TMT Steel', rod: 'TMT Steel', tmt: 'TMT Steel', steel: 'TMT Steel', tata: 'Tata TMT',
  sand: 'Sand', ret: 'Sand', bricks: 'Bricks', eent: 'Bricks', int: 'Bricks'
}

function findCustomer(text, knownNames) {
  const m = text.match(/([a-z][a-z\s]{1,24}?)\s+ke\s+naam/i)
  if (m) {
    const candidate = m[1].trim()
    if (candidate && candidate.length > 1 && !/\d/.test(candidate)) return candidate
  }
  for (const n of knownNames) {
    if (text.toLowerCase().includes(n.toLowerCase())) return n
  }
  return ''
}

function collectRates(text) {
  const out = []
  const re = /\b(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?\s+ke\b/gi
  let m
  while ((m = re.exec(text)) !== null) {
    out.push(Number(m[1]) * (MULTS[(m[2] || '').toLowerCase()] || 1))
  }
  return out
}

function parseItems(text, rates) {
  const items = []
  const t = text.toLowerCase()
  const seen = new Set()

  const push = (qty, prodKey, unit, pos) => {
    const name = PRODUCT_ALIAS[prodKey] || prodKey
    if (!name || !unit || qty <= 0) return
    const key = name + '|' + unit + '|' + qty
    if (seen.has(key)) return
    seen.add(key)
    items.push({ name, qty, unit, rate: 0, pos })
  }

  const unitWord = '(bag|bori|kg|kilo|quintal|qal|ton|tonne|truck|piece)'
  const prodWord = '([a-z][a-z]{1,20})'

  // "2 ton sariya", "50 bag cement"
  let re1 = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(hazaar|hajar|lakh|lac)?\\s*' + unitWord + '\\s+' + prodWord, 'g')
  let m
  while ((m = re1.exec(t)) !== null) {
    const qty = Number(m[1]) * (MULTS[(m[2] || '').toLowerCase()] || 1)
    push(qty, m[4], UNITS[m[3]], m.index)
  }

  // "50 cement ke bag 390 ke"
  let re2 = new RegExp('(\\d+(?:\\.\\d+)?)\\s*' + prodWord + '\\s+ke\\s+' + unitWord, 'g')
  while ((m = re2.exec(t)) !== null) {
    const qty = Number(m[1]) * (MULTS[(m[2] || '').toLowerCase()] || 1)
    push(qty, m[2], UNITS[m[3]], m.index)
  }

  items.sort((a, b) => a.pos - b.pos)
  items.forEach((it, i) => {
    it.rate = rates[i] || 0
    delete it.pos
  })
  return items
}

export function parseLocal(text, knownNames = []) {
  const t = String(text || '').trim()
  if (!t) return { intent: 'clarify', message: 'Kuch suna nahi. Fir bolo.' }

  if (/kitna baki|kitna lena|kitna dena|balance|outstanding|baki hai/i.test(t)) {
    const name = findCustomer(t, knownNames)
    return { intent: 'query_outstanding', customerName: name }
  }
  if (/delivery|vehicle|gadi|driver|bhej|bhejo|dispatch|transport/i.test(t)) {
    return { intent: 'query_delivery', query: t }
  }
  if (/bikri|sales|kitna becha|report|kitna hua/i.test(t)) {
    return { intent: 'query_report', query: t }
  }
  if (/bill|bana|laga|add|add karo/i.test(t) || /bag|sariya|cement|steel|tmt/i.test(t)) {
    const customer = { name: findCustomer(t, knownNames), mobile: '' }
    const items = parseItems(t, collectRates(t))
    if (items.length === 0) return { intent: 'clarify', message: 'Item samajh nahi aaya. Jaise bolo: "50 bag cement 390 ke aur 2 ton sariya 58000 ke."' }
    const vehicleNo = (t.match(/([A-Za-z]{2}\d{2}[A-Za-z]{1,2}\d{4})/) || [])[1] || ''
    const driver = (t.match(/driver\s+([a-z]+)/i) || [])[1] || ''
    const freight = (t.match(/transport\s+(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?/i)) ? Number((t.match(/transport\s+(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?/i))[1]) * (MULTS[(t.match(/transport\s+(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?/i))[2]] || 1) : 0
    const site = (t.match(/(?:site|location|jagah)\s+([a-z]+)/i) || [])[1] || ''
    return {
      intent: 'create_bill',
      customer,
      items,
      transport: { vehicleNo, driverName: driver, driverMobile: '', site, freight, loading: 0, unloading: 0 }
    }
  }
  return { intent: 'clarify', message: 'Samajh nahi aaya. Bol sakte ho: "Ramesh ke naam 50 bag cement 390 ke bill banao" ya "Ramesh ka kitna baki hai?"' }
}

export async function parseVoice(text, knownNames = [], apiBase = '') {
  try {
    if (apiBase) {
      const res = await fetch(apiBase + '/api/billing/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.parsed) return { source: 'ai', ...data.parsed }
      }
    }
  } catch (e) { /* fall through to local */ }
  const local = parseLocal(text, knownNames)
  if (local.intent === 'create_bill') {
    const items = local.items.map((it) => ({ ...it, rate: it.rate || 0 }))
    return { source: 'local', intent: 'create_bill', customer: local.customer, items, transport: local.transport }
  }
  return { source: 'local', ...local }
}