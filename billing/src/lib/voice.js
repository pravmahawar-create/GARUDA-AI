const UNITS = { bag: 'bag', bori: 'bag', bags: 'bag', kg: 'kg', kilo: 'kg', kgg: 'kg', quintal: 'quintal', qtl: 'quintal', ton: 'ton', tonne: 'ton', piece: 'piece', pieces: 'piece', truck: 'truck', gadi: 'truck' }

const NUMS = {
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10,
  gyara: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15, solah: 16, satrah: 17, atharah: 18, unnis: 19, bis: 20,
  tees: 30, chalis: 40, pachaas: 50, saath_: 60,
  hazar: 1000, hazaar: 1000, hajar: 1000, lakh: 100000, lac: 100000, lakhs: 100000
}

const MULTS = { hazaar: 1000, hajar: 1000, lakh: 100000, lac: 100000 }

export function numberFromHindi(text) {
  const t = String(text || '').toLowerCase().trim()
  if (/^\d+$/.test(t)) return parseInt(t, 10)
  let total = 0
  let cur = 0
  for (const w of t.split(/[\s-]+/).filter(Boolean)) {
    if (/^\d+(\.\d+)?$/.test(w)) cur += parseFloat(w)
    else if (MULTS[w]) {
      total += cur === 0 ? MULTS[w] : cur * MULTS[w]
      cur = 0
    } else if (NUMS[w]) cur += NUMS[w]
  }
  return total + cur
}

const PRODUCT_ALIAS = {
  cement: 'Cement', semento: 'Cement', siment: 'Cement',
  sariya: 'TMT Steel', sariyaa: 'TMT Steel', rod: 'TMT Steel', tmt: 'TMT Steel', steel: 'TMT Steel',
  sand: 'Sand', ret: 'Sand', bricks: 'Bricks', eent: 'Bricks', int: 'Bricks'
}

const BRAND_CASE = { acc: 'ACC', tmt: 'TMT', tata: 'Tata', ultratech: 'UltraTech', ambuja: 'Ambuja', shree: 'Shree', jk: 'JK', dalmia: 'Dalmia', bangur: 'Bangur', birla: 'Birla', fortune: 'Fortune', gk: 'GK', kamdhenu: 'Kamdhenu', isi: 'ISI', raipur: 'Raipur', laxmi: 'Laxmi', jklaxmi: 'JK Laxmi', wonder: 'Wonder', prism: 'Prism', ramco: 'Ramco', mycem: 'MyCem' }

function titleCase(w) {
  if (BRAND_CASE[w.toLowerCase()]) return BRAND_CASE[w.toLowerCase()]
  return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''
}

const STOP_WORDS = new Set(['ke', 'ka', 'ki', 'ko', 'aur', 'and', 'rate', 'se', 'bana', 'banao', 'banaw', 'kar', 'karo', 'daal', 'dal', 'do', 'dena', 'chahiye', 'bill', 'aaya', 'aaye', 'gaya', 'gaye', 'hai', 'hain', 'raha', 'rahe', 'stock', 'stok', 'mein', 'add', 'badh', 'jod', 'kitna', 'kya', 'hai', 'per', 'par', 'rupaye', 'rupay', 'rs', 'minus', 'kam', 'ghatao', 'nikalo', 'nikal', 'hatao', 'becha', 'bech'])

function buildItemName(words) {
  while (words.length > 1 && STOP_WORDS.has(words[words.length - 1])) words.pop()
  if (!words.length) return ''
  const baseKey = [...words].reverse().find((w) => PRODUCT_ALIAS[w])
  const baseName = baseKey ? PRODUCT_ALIAS[baseKey] : null
  if (!baseName) return words.map((w) => BRAND_CASE[w] || titleCase(w)).join(' ')
  if (words.length === 1) return baseName
  const firstAlias = PRODUCT_ALIAS[words[0]]
  if (firstAlias && firstAlias === baseName) return baseName
  if (firstAlias && firstAlias !== baseName) return firstAlias
  const idx = words.indexOf(baseKey)
  const prefix = words.slice(0, idx)
  if (!prefix.length) return baseName
  return prefix.map((w) => BRAND_CASE[w] || titleCase(w)).join(' ') + ' ' + baseName
}

function extractItems(text) {
  const items = []
  const seen = new Set()
  const unitWord = '(bag|bori|bags|kg|kilo|kgg|quintal|qtl|ton|tonne|piece|pieces|truck)'
  const push = (qty, unit, name, pos) => {
    if (!qty || !unit || !name) return
    const key = name + '|' + unit + '|' + qty
    if (seen.has(key)) return
    seen.add(key)
    items.push({ name, qty, unit, rate: 0, pos })
  }
  // Order 1: "50 bag ACC cement", "50 kg Fortune TMT 12mm" (size captured separately)
  const re1 = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(hazaar|hajar|lakh|lac)?\\s*' + unitWord + '\\s+([a-z]+(?:\\s+[a-z]+){0,2})(?:\\s+(\\d+)\\s*mm)?', 'gi')
  let m
  while ((m = re1.exec(text)) !== null) {
    const qty = Number(m[1]) * (MULTS[(m[2] || '').toLowerCase()] || 1)
    const unit = UNITS[m[3].toLowerCase()]
    const words = m[4].toLowerCase().split(/\s+/)
    let name = buildItemName(words)
    if (m[5]) name = (name + ' ' + m[5] + 'mm').trim()
    push(qty, unit, name, m.index)
  }
  // Order 2 (legacy): "50 cement ke bag" / "50 cement ke bori"
  const re2 = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(hazaar|hajar|lakh|lac)?\\s*([a-z]{2,20})\\s+ke\\s*' + unitWord, 'gi')
  while ((m = re2.exec(text)) !== null) {
    const qty = Number(m[1]) * (MULTS[(m[2] || '').toLowerCase()] || 1)
    const prodWord = m[3].toLowerCase()
    const unit = UNITS[m[4].toLowerCase()]
    const baseName = PRODUCT_ALIAS[prodWord] || titleCase(prodWord)
    push(qty, unit, baseName, m.index)
  }
  items.sort((a, b) => a.pos - b.pos)
  for (const it of items) delete it.pos
  return items
}

// Rates appear as "390 ke", "420 ke rate se", "58 hazaar ke", paired to items in order.
function collectRates(text) {
  const out = []
  const re = /(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?\s*(?:ke|ka)\b/gi
  let m
  while ((m = re.exec(text)) !== null) out.push(Number(m[1]) * (MULTS[(m[2] || '').toLowerCase()] || 1))
  return out
}

function findCustomer(text, knownNames) {
  const patterns = [
    /([a-z][a-z\s.]{1,24}?)\s+ke\s+(?:naam|name)/i,
    /([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)\s+ke\s+(?:naam|name)/i,
    /([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)\s+के\s+(?:नाम|नाम से)/i,
    /([a-z][a-z\s.]{1,24}?)\s+ko\s+(?:\d|[a-z]*\s*(?:bag|kg|ton|piece|truck)|bill)/i,
    /([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)\s+ko\s+(?:\d|[a-z\u0900-\u097F]*\s*(?:bag|kg|ton|piece|truck)|bill)/i,
    /([a-z][a-z\s.]{1,24}?)\s+ke\s+liye/i,
    /([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)\s+के\s+लिए/i
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const candidate = m[1].trim()
      if (candidate && candidate.length > 1 && !/\d/.test(candidate)) return candidate
    }
  }
  for (const n of knownNames) {
    if (text.toLowerCase().includes(String(n).toLowerCase())) return n
  }
  return ''
}

const STOCK_HINT = /(stock|stok|aaya hai|aa gaya|pahunch|pahonch|add karo|daal do|dalo|jodo|minus|kam karo|ghata|nikal|hatao|becha|bech diya)/i

function parseStock(text, numberFromHindiFn) {
  const t = text.toLowerCase()
  const vehicleNo = (text.match(/([A-Za-z]{2}\d{2}[A-Za-z]{0,3}\d{3,4})/) || [])[1] || ''
  const driver = (text.match(/driver\s+([a-z]+)/i) || [])[1] || ''

  const wantsSet = /(set\s?karo|set\s?kar|update\s?kar|rakh\s?do|barabar\s?kar|ho\s?jaye\s?aisa)/i.test(t)
  const wantsAdd = /(add|badh|jod|jama|aaya|aa gaya|pahunch|pahonch|daal|dalo|dale)/i.test(t)
  const wantsSubtract = /(minus|kam karo|kam kar|ghatao|ghata|nikal|nikalo|hatao|becha|bech diya)/i.test(t)
  const wantsQuery = /(kitna|kitni|kya hai|kya bacha|check|batao)/i.test(t)

  const items = extractItems(text)
  // "ACC cement ka stock 120 bag hai" — stated qty without mutation verb
  let stated = null
  const statedM = text.match(/(\d+(?:\.\d+)?)\s*(bag|kg|kilo|quintal|qtl|ton|tonne|piece|truck)s?\s*(?:ka\s*)?(?:stock|stok)?\s*(?:hai|hain|raha)?\.?$/i)

  if (wantsQuery && !wantsAdd && !wantsSet) {
    const parsedItems = items.length ? items : []
    const m2 = parsedItems[0] || null
    return { intent: 'stock_query', operation: 'query', items: parsedItems.map(({ name }) => ({ name })), vehicleNo, driver, stated: null, source: 'voice' }
  }

  if (items.length > 0 && (wantsAdd || wantsSet || wantsSubtract)) {
    let op = 'add'
    if (wantsSet) op = 'set'
    else if (wantsSubtract) op = 'subtract'
    return {
      intent: 'stock_entry',
      operation: op,
      items,
      vehicleNo,
      driver,
      source: 'voice'
    }
  }

  // Statement form: "<item> ka stock <n> <unit> hai" → report only; UI offers explicit Set.
  if (statedM) {
    return { intent: 'stock_query', operation: 'query', items: [], stated: { qty: Number(statedM[1]), unit: UNITS[statedM[2].toLowerCase()] || 'bag' }, vehicleNo, driver, source: 'voice' }
  }

  void numberFromHindiFn
  return { intent: 'stock_query', operation: 'query', items: [], vehicleNo, driver, stated: null, source: 'voice' }
}

export function normalizeDevanagari(text) {
  return String(text || '')
    .replace(/बोरियों|बोरियां|बोरी|बोरा|बैग/g, ' bag ')
    .replace(/किलोग्राम|किलो/g, ' kg ')
    .replace(/टन/g, ' ton ')
    .replace(/क्विंटल/g, ' quintal ')
    .replace(/पीस/g, ' piece ')
    .replace(/सीमेंट|सिमेंट/g, ' cement ')
    .replace(/एसीसी/g, ' ACC ')
    .replace(/अल्ट्राटेक/g, ' ultratech ')
    .replace(/सरिया|सरीया/g, ' sariya ')
    .replace(/टीएमटी/g, ' tmt ')
    .replace(/स्टील/g, ' steel ')
    .replace(/के नाम से/g, ' ke naam ')
    .replace(/के नाम/g, ' ke naam ')
    .replace(/के रेट से/g, ' ke rate se ')
    .replace(/के रेट/g, ' ke rate ')
    .replace(/बिल बना दो|बिल बनाओ/g, ' bill bana do ')
    .replace(/स्टॉक में|स्टॉक/g, ' stock ')
    .replace(/रुपए|रुपये|रूपये/g, ' rupaye ')
}

export function parseLocal(text, knownNames = []) {
  const raw = String(text || '').trim()
  if (!raw) return { intent: 'clarify', message: 'Kuch suna nahi. Fir bolo.' }
  // Normalize Devanagari Hindi to Latin Hinglish for parsing, but keep original for customer name
  const normalizedRaw = normalizeDevanagari(raw)
  const t = normalizedRaw.toLowerCase()

  // 1) Outstanding/balance query
  if (/kitna baki|kitna lena|kitna dena|balance|outstanding|baki hai/i.test(t)) {
    const name = findCustomer(normalizedRaw, knownNames)
    return { intent: 'query_outstanding', customerName: name }
  }

  // 2) Sales report
  if (/bikri|sales|kitna becha|report|kitna hua/i.test(t) && !STOCK_HINT.test(t)) {
    return { intent: 'query_report', query: normalizedRaw }
  }

  // 3) STOCK commands — checked BEFORE bill so "stock mein add karo" never becomes a bill
  if (STOCK_HINT.test(t)) {
    return parseStock(normalizedRaw, numberFromHindi)
  }

  // 4) Dispatch/delivery query
  if (/bhej|bhejo|dispatch|delivery|driver/i.test(t)) {
    return { intent: 'query_delivery', query: normalizedRaw }
  }

  // 5) Create bill
  if (/bill|bana|laga/i.test(t) || /\b(bag|bori|kg|ton|quintal|piece)\b/i.test(t) || /cement|sariya|steel|tmt/i.test(t)) {
    const customer = { name: findCustomer(normalizedRaw, knownNames), mobile: '' }
    const items = extractItems(normalizedRaw)
    if (items.length === 0) return { intent: 'clarify', message: 'Item samajh nahi aaya. Jaise bolo: "50 bag cement 390 ke aur 2 ton sariya 58000 ke."' }
    const rates = collectRates(normalizedRaw)
    items.forEach((it, i) => { it.rate = rates[i] || 0 })
    const vehicleNo = (normalizedRaw.match(/([A-Za-z]{2}\d{2}[A-Za-z]{0,3}\d{3,4})/) || [])[1] || ''
    const driver = (normalizedRaw.match(/driver\s+([a-z]+)/i) || [])[1] || ''
    const frMatch = normalizedRaw.match(/transport\s+(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?/i)
    const freight = frMatch ? Number(frMatch[1]) * (MULTS[(frMatch[2] || '').toLowerCase()] || 1) : 0
    const site = (normalizedRaw.match(/(?:site|location|jagah)\s+([a-z]+)/i) || [])[1] || ''
    const missing = []
    if (!customer.name) missing.push('customer ka naam')
    if (items.some((it) => !it.rate)) missing.push('har item ka rate')
    return {
      intent: 'create_bill',
      customer,
      items,
      missing,
      transport: { vehicleNo, driverName: driver, driverMobile: '', site, freight, loading: 0, unloading: 0 }
    }
  }

  return { intent: 'clarify', message: 'Samajh nahi aaya. Bol sakte ho: "Ramesh ke naam 50 bag cement 390 ke bill bana do" ya "50 bag ACC cement stock mein add karo".' }
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
  return { source: 'local', ...parseLocal(text, knownNames) }
}
