const UNITS = { bag: 'bag', bori: 'bag', bags: 'bag', kg: 'kg', kilo: 'kg', kgg: 'kg', quintal: 'quintal', qtl: 'quintal', ton: 'ton', tonne: 'ton', piece: 'piece', pieces: 'piece', truck: 'truck', gadi: 'truck' }

const NUMS = {
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10,
  gyara: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15, solah: 16, satrah: 17, atharah: 18, unnis: 19, bis: 20,
  tees: 30, chalis: 40, pachaas: 50, saath_: 60,
  hazar: 1000, hazaar: 1000, hajar: 1000, lakh: 100000, lac: 100000, lakhs: 100000
}

const MULTS = { hazaar: 1000, hajar: 1000, lakh: 100000, lac: 100000 }

const UNIT_FAMILY = { bag: 'bag', bori: 'bag', bags: 'bag', kg: 'kg', kilo: 'kg', kgg: 'kg', quintal: 'quintal', qtl: 'quintal', ton: 'ton', tonne: 'ton', piece: 'piece', pieces: 'piece', truck: 'truck', gadi: 'truck' }

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

const STOP_WORDS = new Set(['ke', 'ka', 'ki', 'ko', 'aur', 'and', 'rate', 'se', 'bana', 'banao', 'banaw', 'kar', 'karo', 'daal', 'dal', 'do', 'dena', 'chahiye', 'bill', 'aaya', 'aaye', 'gaya', 'gaye', 'hai', 'hain', 'raha', 'rahe', 'stock', 'stok', 'mein', 'add', 'badh', 'jod', 'kitna', 'kya', 'hai', 'per', 'par', 'rupaye', 'rupay', 'rs', 'minus', 'mines', 'mine', 'kam', 'ghatao', 'nikalo', 'nikal', 'nikaal', 'hatao', 'becha', 'bechi', 'bech', 'wali', 'vali'])

function cleanProductWords(words) {
  return words.filter((w) => (!/^\d+$/.test(w) || /^\d+mm$/.test(w)) && !STOP_WORDS.has(String(w).toLowerCase()))
}

function buildItemName(words) {
  while (words.length > 0 && STOP_WORDS.has(words[words.length - 1])) words.pop()
  if (!words.length) return ''
  const sizeIdx = words.findIndex((w) => /^\d+mm$/.test(w))
  const sizeWord = sizeIdx >= 0 ? words[sizeIdx] : ''
  const productWords = sizeWord ? words.filter((w) => w !== sizeWord) : words
  const baseKey = [...productWords].reverse().find((w) => PRODUCT_ALIAS[w])
  const baseName = baseKey ? PRODUCT_ALIAS[baseKey] : null
  let name
  if (!baseName) name = productWords.map((w) => BRAND_CASE[w] || titleCase(w)).join(' ')
  else if (productWords.length === 1) name = baseName
  else {
    const firstAlias = PRODUCT_ALIAS[productWords[0]]
    if (firstAlias && firstAlias === baseName) name = baseName
    else if (firstAlias && firstAlias !== baseName) name = firstAlias
    else {
      const idx = productWords.indexOf(baseKey)
      const prefix = productWords.slice(0, idx)
      name = prefix.length ? prefix.map((w) => BRAND_CASE[w] || titleCase(w)).join(' ') + ' ' + baseName : baseName
    }
  }
  return sizeWord ? sizeWord + ' ' + name : name
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
  // Order 1: "50 bag ACC cement", "50 kg Fortune TMT 12mm", "50 piece 8mm TMT" (size preserved)
  const re1 = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(hazaar|hajar|lakh|lac)?\\s*' + unitWord + '\\s+([a-z0-9]+(?:\\s+[a-z0-9]+){0,2})(?:\\s+(\\d+)\\s*mm)?', 'gi')
  let m
  while ((m = re1.exec(text)) !== null) {
    const qty = Number(m[1]) * (MULTS[(m[2] || '').toLowerCase()] || 1)
    const unit = UNITS[m[3].toLowerCase()]
    const words = cleanProductWords(m[4].toLowerCase().split(/\s+/))
    if (!words.length || !hasProductToken(words)) continue
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
  const unique = []
  const seenKey = new Set()
  for (const it of items) {
    const key = it.name + '|' + it.unit + '|' + it.qty
    if (seenKey.has(key)) continue
    seenKey.add(key)
    unique.push(it)
  }
  const deduped = []
  for (const it of unique) {
    const hasLonger = unique.some((o) => o !== it && o.unit === it.unit && o.qty === it.qty && o.name.length > it.name.length && o.name.toLowerCase().includes(it.name.toLowerCase()))
    if (!hasLonger) deduped.push(it)
  }
  return deduped
}

// Rates appear as "390 ke", "420 ke rate se", "58 hazaar ke", "57 rupaye kilo ke", "₹230 ke bhav se", paired to items in order.
function collectRates(text) {
  const out = []
  const re = /(?:₹\s*)?(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?\s*(?:rupaye|rupay|rs)?\s*(?:kilo|kg|quintal|qtl|ton|tonne|piece|pieces|truck|bag|bori|bags)?\s*(?:ke|ka)\b/gi
  let m
  while ((m = re.exec(text)) !== null) out.push(Number(m[1]) * (MULTS[(m[2] || '').toLowerCase()] || 1))
  return out
}

function findCustomer(text, knownNames) {
  const patterns = [
    /(?:customer|client|user)\s+ka\s+naam\s+(?:hai|hain|he|ho)?\s*([a-z][a-z\s.]{1,24}?)(?:\s|$)/i,
    /(?:customer|client|user)\s+ke\s+naam\s+se\s+([a-z][a-z\s.]{1,24}?)(?:\s|$)/i,
    /(?:customer|client|user)\s+ke\s+naam\s+par\s+([a-z][a-z\s.]{1,24}?)(?:\s|$)/i,
    /(?:iske|uske|is|us)\s+naam\s+se\s+([a-z][a-z\s.]{1,24}?)(?:\s|$)/i,
    /(?:iske|uske|is|us)\s+naam\s+par\s+([a-z][a-z\s.]{1,24}?)(?:\s|$)/i,
    /([a-z][a-z\s.]{1,24}?)\s+ka\s+(?:\d|[a-z]*\s*(?:bag|kg|ton|piece|truck)|bill)/i,
    /([a-z][a-z\s.]{1,24}?)\s+ke\s+(?:naam|name)/i,
    /([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)\s+ke\s+(?:naam|name)/i,
    /([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)\s+के\s+(?:नाम|नाम से)/i,
    /([a-z][a-z\s.]{1,24}?)\s+ko\s+(?:\d|[a-z]*\s*(?:bag|kg|ton|piece|truck)|bill)/i,
    /([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)\s+ko\s+(?:\d|[a-z\u0900-\u097F]*\s*(?:bag|kg|ton|piece|truck)|bill)/i,
    /([a-z][a-z\s.]{1,24}?)\s+ke\s+liye/i,
    /([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)\s+के\s+लिए/i,
    /(?:customer|client|user)\s+का\s+नाम\s+(?:है|हैं|हे|हो)?\s*([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)(?:\s|$)/i,
    /(?:customer|client|user)\s+के\s+नाम\s+से\s+([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)(?:\s|$)/i,
    /([\u0900-\u097F][\u0900-\u097F\s.]{1,24}?)\s+का\s+(?:\d|[\u0900-\u097F]*\s*(?:bag|kg|ton|piece|truck)|bill)/i
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

const STOCK_HINT = /(stock|stok|aaya hai|aayi hai|aa gaya|aa gayi|aagaya|aagayi|pahunch|pahonch|add karo|add kar do|daal do|dalo|jod|jodo|jod do|badh|badha|minus|mines|mine|kam karo|ghata|nikal|nikaal|hatao|becha|bech diya|bech diye|gaadi|gadi|vehicle|inward|history|last\s*(?:incoming|entry)|kis\s*gaadi|kitna\s*aaya|kitna\s*aayi|kitni\s*aaya|kitni\s*aayi|(cement|sariya|steel|tmt|sand|bricks|eent).*(kitna|kitni|kitne)|(kitna|kitni|kitne|total).*(cement|sariya|steel|tmt|bori|stock)|kitni\s*bori|padi\s*hai|pada\s*hai)/i

const CATEGORY_TOKENS = { cement: 'cement', siment: 'cement', semento: 'cement', steel: 'steel', sariya: 'steel', sariyaa: 'steel', rod: 'steel', tmt: 'steel', sand: 'other', ret: 'other', bricks: 'other', eent: 'other', int: 'other' }

function categoryFromText(text) {
  const toks = String(text || '').toLowerCase().split(/[^a-z]+/)
  for (const tok of toks) {
    if (CATEGORY_TOKENS[tok]) return CATEGORY_TOKENS[tok]
  }
  return null
}

function hasBrandToken(text) {
  const low = String(text || '').toLowerCase()
  return Object.keys(BRAND_CASE).some((b) => new RegExp('(^|[^a-z])' + b + '([^a-z]|$)', 'i').test(low))
}

function isAggregateAsk(text) {
  return /(total|sab|all|kitna|kitni|kitne|kya|padi|pada|bori|bora|bag)/i.test(text)
}

function extractProductPhrase(text) {
  const m = String(text || '').match(/([a-z][a-z\s]{1,40}?)\s+(?:ka|ke|ki|का|की|के)\s+(?:last|aakhri|akhir|stock|inward|entry|aaya|aayi)/i)
  return m ? m[1].trim() : ''
}

function hasProductToken(words) {
  return words.some((w) => PRODUCT_ALIAS[String(w).toLowerCase()] || BRAND_CASE[String(w).toLowerCase()])
}

function tokenize(s) {
  return String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

function canonicalKey(s) {
  return tokenize(s).sort().join('')
}

function resolveQueryItem(text, stockItems) {
  if (!stockItems || !stockItems.length) return null
  const qWords = new Set(tokenize(text))
  const size = (String(text).match(/\d+mm/) || [])[0]
  let pool = stockItems
  if (size) {
    const sized = stockItems.filter((it) => (String(it.name).match(/\d+mm/) || [])[0] === size)
    if (sized.length) pool = sized
  }
  const groups = new Map()
  for (const it of pool) {
    const toks = tokenize(it.name)
    if (!toks.length) continue
    const hit = toks.filter((tk) => qWords.has(tk))
    if (hit.length === 0) continue
    const key = canonicalKey(it.name)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ it, score: hit.length / toks.length })
  }
  if (groups.size === 0) return null
  const ranked = [...groups.entries()].map(([key, arr]) => ({ key, arr, score: Math.max(...arr.map((a) => a.score)) }))
  ranked.sort((a, b) => b.score - a.score)
  const top = ranked[0]
  const tie = ranked.filter((g) => g.score === top.score)
  const pick = (arr) => arr.reduce((best, c) => (c.it.name.length < best.it.name.length ? c : best), arr[0]).it
  if (top.score === 1 && tie.length === 1) return { item: pick(top.arr) }
  if (tie.length > 1) return { ambiguous: tie.flatMap((g) => g.arr.map((a) => a.it.name)) }
  if (ranked.length === 1) return { item: pick(top.arr) }
  return { ambiguous: ranked.slice(0, 4).flatMap((g) => g.arr.map((a) => a.it.name)) }
}

function extractStockQtyUnit(text) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?\s*(bag|bori|bags|kg|kilo|kgg|quintal|qtl|ton|tonne|piece|pieces|truck)/i)
  if (!m) return null
  return { qty: Number(m[1]) * (MULTS[(m[2] || '').toLowerCase()] || 1), unit: UNITS[m[3].toLowerCase()] || 'bag' }
}

const STOCK_ACTION_SPLIT = /\s*(?:,|;|aur|and|tatha)\s+|\s*(?:add karo|add kar do|jod do|jodo|daal do|dalo|minus karo|nikaal do|nikal do|nikalo|kam karo|ghata do|hata do|bech diya|bech diye)\s*/i

function splitStockCommands(text) {
  return String(text || '').split(STOCK_ACTION_SPLIT).map((s) => s.trim()).filter(Boolean)
}

// Parse ONE stock clause (no action verb) into a single item, or null when ambiguous/incomplete.
function parseStockSegment(seg) {
  let items = extractItems(seg)
  if (!items.length) {
    const preQty = seg.match(/^([a-z0-9][a-z0-9\s]{1,40}?)\s+(\d+(?:\.\d+)?)\s*(bag|bori|kg|kilo|quintal|qtl|ton|tonne|piece|truck)s?/i)
    if (preQty) {
      const rawWords = cleanProductWords(preQty[1].trim().toLowerCase().split(/\s+/))
      if (hasProductToken(rawWords)) {
        const name = buildItemName(rawWords)
        const qty = Number(preQty[2])
        const unit = UNITS[preQty[3].toLowerCase()] || 'bag'
        if (name && qty > 0) items.push({ name, qty, unit })
      }
    }
  }
  if (!items.length) {
    const m = seg.match(/^(\d+\s*mm)(?:\s+(?:wali|vali))?\s+(\d+(?:\.\d+)?)\s*(bag|bori|kg|kilo|quintal|qtl|ton|tonne|piece|truck)s?\s+([a-z0-9][a-z0-9\s]{1,30}?)$/i)
    if (m) {
      const rawWords = cleanProductWords([m[1].replace(/\s+/g, ''), ...m[4].trim().toLowerCase().split(/\s+/)])
      if (hasProductToken(rawWords)) {
        const name = buildItemName(rawWords)
        const qty = Number(m[2])
        const unit = UNITS[m[3].toLowerCase()] || 'bag'
        if (name && qty > 0) items.push({ name, qty, unit })
      }
    }
  }
  if (items.length === 1) return items[0]
  return null
}

function parseStock(text, numberFromHindiFn, stockItems = []) {
  text = String(text || '').trim()
  const t = text.toLowerCase()
  const vehM = text.match(/([A-Za-z]{2}\s?\d{2}\s?[A-Za-z]{1,3}\s?\d{3,4})/) || String(text).replace(/\s+/g, '').match(/([A-Za-z]{2}\d{2}[A-Za-z]{1,3}\d{3,4})/)
  const vehicleNo = (vehM ? vehM[1] : '').replace(/\s+/g, '').toUpperCase()
  const driver = (text.match(/driver\s+([a-z]+)/i) || [])[1] || ''

  const wantsSet = /(set\s?karo|set\s?kar|update\s?kar|rakh\s?do|barabar\s?kar|ho\s?jaye\s?aisa)/i.test(t)
  const wantsAdd = /(add|badh|jod|jama|aaya|aayi|aaye|aa gaya|aa gayi|aagaya|aagayi|pahunch|pahonch|daal|dalo|dale)/i.test(t)
  const wantsSubtract = /(minus|mines|mine|kam karo|kam kar|ghatao|ghata|ghata do|nikal|nikalo|nikaal|hatao|hata do|becha|bech diya|bech diye|kam)/i.test(t)
  const wantsQuery = /(kitna|kitni|kya hai|kya bacha|check|batao)/i.test(t)

  // Multi-item mutation: "8mm TMT 50 piece add karo 10mm TMT 30 piece add karo" → two operations
  const segments = splitStockCommands(text)
  if (segments.length > 1 && !wantsQuery && (wantsAdd || wantsSubtract)) {
    if (wantsAdd && wantsSubtract) {
      return { intent: 'clarify', message: 'Ek command mein add aur minus dono nahi — alag alag bolo.' }
    }
    const op = wantsSubtract ? 'subtract' : 'add'
    const multi = []
    for (const seg of segments) {
      const item = parseStockSegment(seg)
      if (!item) {
        return { intent: 'clarify', message: 'Multiple items hain — ek ek karke saaf bolo, jaise "8mm TMT 50 piece add karo aur 10mm TMT 30 piece add karo".' }
      }
      multi.push(item)
    }
    return { intent: 'stock_entry', operation: op, items: multi, vehicleNo, driver, source: 'voice' }
  }

  // Size qty unit product: "12mm 50 kilo Sariya" (most specific — run before generic qty-unit)
  let items = []
  const sizeM = text.match(/^(\d+\s*mm)(?:\s+(?:wali|vali))?\s+(\d+(?:\.\d+)?)\s*(bag|bori|kg|kilo|quintal|qtl|ton|tonne|piece|truck)s?\s+([a-z0-9][a-z0-9\s]{1,30}?)$/i)
  if (sizeM) {
    const rawWords = cleanProductWords([sizeM[1].replace(/\s+/g, ''), ...sizeM[4].trim().toLowerCase().split(/\s+/)])
    if (hasProductToken(rawWords)) {
      const candidateName = buildItemName(rawWords)
      const qty = Number(sizeM[2])
      const unit = UNITS[sizeM[3].toLowerCase()] || 'bag'
      if (candidateName && qty > 0) items.push({ name: candidateName, qty, unit })
    }
  }
  if (!items.length) items = extractItems(text)
  // Fallback: product name BEFORE qty/unit — "ACC cement 50 bag", "ACC Cement mein 20 bori", "8mm sariya mein 100 piece"
  if (items.length === 0) {
    const preQty = text.match(/^([a-z0-9][a-z0-9\s]{1,40}?)\s+(\d+(?:\.\d+)?)\s*(bag|bori|kg|kilo|quintal|qtl|ton|tonne|piece|truck)s?/i)
    if (preQty) {
      const rawWords = cleanProductWords(preQty[1].trim().toLowerCase().split(/\s+/))
      if (hasProductToken(rawWords)) {
        const candidateName = buildItemName(rawWords)
        const qty = Number(preQty[2])
        const unit = UNITS[preQty[3].toLowerCase()] || 'bag'
        if (candidateName && qty > 0) items.push({ name: candidateName, qty, unit })
      }
    }
  }
  // Query (no qty present): route to ledger-history, category aggregate, or specific item
  if (items.length === 0) {
    // --- LEDGER / inward-history queries (checked before add/subtract misfires on "aaya"/"aayi") ---
    const isLedgerAsk = /(aaya|aayi|aaye)\s*(tha|thi|the|hai)?|aagaya|aagayi|inward|last\s*(?:incoming|entry)|kis\s*gaadi|kaunsi\s*gaadi|history|kitna\s*(?:aaya|aayi)|kitni\s*(?:aaya|aayi)/i.test(text)
    if (isLedgerAsk) {
      const cat = categoryFromText(text)
      const itemPhrase = extractProductPhrase(text)
      if (vehicleNo) {
        return { intent: 'stock_ledger_query', scope: 'vehicle', vehicleNo, category: cat, itemName: '', driver, source: 'voice' }
      }
      if (/aaj|aaj\s*ka|aaj\s*ki|today/i.test(text)) {
        return { intent: 'stock_ledger_query', scope: 'today', category: cat, itemName: '', vehicleNo: '', driver, source: 'voice' }
      }
      if (/kis\s*gaadi|kaunsi\s*gaadi/i.test(text)) {
        return { intent: 'stock_ledger_query', scope: 'last_vehicle', category: cat, itemName: '', vehicleNo: '', driver, source: 'voice' }
      }
      if (/last|aakhri|akhir/i.test(text)) {
        return { intent: 'stock_ledger_query', scope: 'last_incoming', category: cat, itemName: itemPhrase, vehicleNo: '', driver, source: 'voice' }
      }
      return { intent: 'stock_ledger_query', scope: 'inward', category: cat, itemName: itemPhrase, vehicleNo: '', driver, source: 'voice' }
    }
  }
  if (items.length === 0 && wantsQuery) {
    const cat = categoryFromText(text)
    // --- CATEGORY aggregate (skip when a specific size/variant is named) ---
    if (cat && !hasBrandToken(text) && !/\d+\s*mm/i.test(text) && isAggregateAsk(text)) {
      return { intent: 'stock_query', operation: 'query_category', category: cat, vehicleNo: '', driver, stated: null, source: 'voice' }
    }
    // --- specific item resolution ---
    const qName = text.match(/^([a-z0-9][a-z0-9\s]{1,40}?)\s+(?:ka|ke|ki|का|की|के)\s*(?:stock|stok)\s*(?:kitna|kitni|kya|check|batao|hai|hain|raha|कितना|कितनी)/i)
    if (qName) {
      const rawWords = cleanProductWords(qName[1].trim().toLowerCase().split(/\s+/))
      if (hasProductToken(rawWords)) {
        const candidateName = buildItemName(rawWords)
        if (candidateName) items.push({ name: candidateName, qty: 0, unit: 'bag' })
      }
    }
    if (items.length === 0) {
      const resolved = resolveQueryItem(text, stockItems)
      if (resolved) {
        if (resolved.item) items.push({ name: resolved.item.name, qty: 0, unit: resolved.item.unit || 'bag' })
        else if (resolved.ambiguous) {
          const names = [...new Set(resolved.ambiguous)].slice(0, 6).join(', ')
          return { intent: 'clarify', message: 'Kaunsa item? ' + names + ' — thoda aur saaf bolo.' }
        }
      }
    }
  }
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

  if (items.length === 0 && (wantsAdd || wantsSet || wantsSubtract)) {
    let op = 'add'
    if (wantsSet) op = 'set'
    else if (wantsSubtract) op = 'subtract'
    const qu = extractStockQtyUnit(text)
    if (!qu) {
      return { intent: 'clarify', message: 'Kitna add ya minus karna hai? Jaise "300 bori ACC cement minus karo".' }
    }
    if (stockItems && stockItems.length) {
      const family = UNIT_FAMILY[qu.unit] || qu.unit
      const candidates = stockItems.filter((it) => (UNIT_FAMILY[it.unit] || it.unit) === family)
      if (candidates.length === 1) {
        return { intent: 'stock_entry', operation: op, items: [{ name: candidates[0].name, qty: qu.qty, unit: qu.unit }], vehicleNo, driver, source: 'voice' }
      }
      if (candidates.length > 1) {
        const list = candidates.slice(0, 8).map((c) => c.name).join(', ')
        return { intent: 'clarify', message: 'Kaunsa item? ' + list + ' — bolo jaise "' + candidates[0].name + ' ' + qu.qty + ' bori ' + (wantsSubtract ? 'minus' : 'add') + ' karo".' }
      }
      return { intent: 'clarify', message: 'Stock mein koi ' + qu.unit + ' item nahi mila — item ka naam batao.' }
    }
    return { intent: 'clarify', message: 'Item ka naam batao — jaise "50 bag ACC cement add karo".' }
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
    .replace(/०/g, '0').replace(/१/g, '1').replace(/२/g, '2').replace(/३/g, '3').replace(/४/g, '4')
    .replace(/५/g, '5').replace(/६/g, '6').replace(/७/g, '7').replace(/८/g, '8').replace(/९/g, '9')
    .replace(/एमपी/g, ' MP ')
    .replace(/जेड/g, ' Z ')
    .replace(/नंबर/g, ' number ')
    .replace(/गाड़ी|गाडी/g, ' gaadi ')
    .replace(/ऐड करो/g, ' add karo ')
    .replace(/ऐड/g, ' add ')
    .replace(/(?:^|\s)आया(?=\s|$)/g, ' aaya ')
    .replace(/(?:^|\s)आई(?=\s|$)/g, ' aayi ')
    .replace(/(?:^|\s)आये(?=\s|$)/g, ' aaye ')
    .replace(/एमएम/g, ' mm ')
    .replace(/एम एम/g, ' mm ')
    .replace(/बोरियों|बोरियां|बोरी|बोरा|बैग/g, ' bag ')
    .replace(/किलोग्राम|किलो/g, ' kg ')
    .replace(/टन/g, ' ton ')
    .replace(/क्विंटल/g, ' quintal ')
    .replace(/पीस|नग/g, ' piece ')
    .replace(/सीमेंट|सिमेंट/g, ' cement ')
    .replace(/एसीसी/g, ' ACC ')
    .replace(/अल्ट्राटेक/g, ' ultratech ')
    .replace(/सरिया|सरीया/g, ' sariya ')
    .replace(/टीएमटी/g, ' tmt ')
    .replace(/स्टील/g, ' steel ')
    .replace(/के नाम से/g, ' ke naam ')
    .replace(/के नाम/g, ' ke naam ')
    .replace(/के भाव से/g, ' ke bhav se ')
    .replace(/के भाव/g, ' ke bhav ')
    .replace(/के हिसाब से/g, ' ke hisab se ')
    .replace(/के हिसाब/g, ' ke hisab ')
    .replace(/के रेट से/g, ' ke rate se ')
    .replace(/के रेट/g, ' ke rate ')
    .replace(/बिल बना दो|बिल बनाओ/g, ' bill bana do ')
    .replace(/स्टॉक में|स्टॉक/g, ' stock ')
    .replace(/रुपए|रुपये|रूपये/g, ' rupaye ')
    .replace(/का/g, ' ka ')
    .replace(/की/g, ' ki ')
    .replace(/में/g, ' mein ')
    .replace(/कितना|कितनी|कितने/g, ' kitna ')
    .replace(/माइनस|घटा|घटाओ/g, ' minus ')
    .replace(/जोड़ो|जोडो|जोड़ दो/g, ' jodo ')
    .replace(/एक/g, '1 ').replace(/दो(?=\s)/g, '2 ').replace(/तीन/g, '3 ').replace(/चार/g, '4 ').replace(/पांच/g, '5 ').replace(/छह/g, '6 ').replace(/सात/g, '7 ').replace(/आठ/g, '8 ').replace(/नौ/g, '9 ').replace(/दस/g, '10 ').replace(/बारह/g, '12 ').replace(/बीस/g, '20 ').replace(/तीस/g, '30 ').replace(/चालीस/g, '40 ').replace(/पचास/g, '50 ')
    .replace(/(\d)\s*mm/g, '$1mm')
    .replace(/करो/g, ' karo ')
    .replace(/है|हैं/g, ' hai ')
}

export function parseLocal(text, knownNames = [], stockItems = []) {
  const raw = String(text || '').trim()
  if (!raw) return { intent: 'clarify', message: 'Kuch suna nahi. Fir bolo.' }
  // Normalize Devanagari Hindi to Latin Hinglish for parsing, but keep original for customer name
  let normalizedRaw = normalizeDevanagari(raw)
  normalizedRaw = normalizedRaw.replace(/\bper\b/gi, 'ke')
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
    return parseStock(normalizedRaw, numberFromHindi, stockItems)
  }

  // 4) Dispatch/delivery query
  if (/bhej|bhejo|dispatch|delivery|driver/i.test(t)) {
    return { intent: 'query_delivery', query: normalizedRaw }
  }

  // 5) Create bill
  if (/bill|bana|laga/i.test(t) || /\b(bag|bori|kg|ton|quintal|piece)\b/i.test(t) || /cement|sariya|steel|tmt/i.test(t)) {
    const customer = { name: findCustomer(normalizedRaw, knownNames), mobile: '' }
    const items = extractItems(normalizedRaw)
    let missing = []
    if (!customer.name) missing.push('customer ka naam')
    if (items.length === 0) {
      const fallbackItems = extractItems(normalizedRaw)
      if (fallbackItems.length > 0) {
        items.push(...fallbackItems)
      }
    }
    if (items.length === 0) {
      const msg = customer.name
        ? customer.name + ' ka bill banane ke liye item batao — jaise "50 bag cement 390 ke".'
        : 'Item samajh nahi aaya. Jaise bolo: "50 bag cement 390 ke aur 2 ton sariya 58000 ke."'
      return { intent: 'clarify', message: msg }
    }
    const rates = collectRates(normalizedRaw)
    items.forEach((it, i) => { it.rate = rates[i] || 0 })
    const vehicleNo = (normalizedRaw.match(/([A-Za-z]{2}\d{2}[A-Za-z]{0,3}\d{3,4})/) || [])[1] || ''
    const driver = (normalizedRaw.match(/driver\s+([a-z]+)/i) || [])[1] || ''
    const frMatch = normalizedRaw.match(/transport\s+(\d+(?:\.\d+)?)\s*(hazaar|hajar|lakh|lac)?/i)
    const freight = frMatch ? Number(frMatch[1]) * (MULTS[(frMatch[2] || '').toLowerCase()] || 1) : 0
    const site = (normalizedRaw.match(/(?:site|location|jagah)\s+([a-z]+)/i) || [])[1] || ''
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

export async function parseVoice(text, knownNames = [], apiBase = '', stockItems = []) {
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
  return { source: 'local', ...parseLocal(text, knownNames, stockItems) }
}
