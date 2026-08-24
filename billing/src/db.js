import Dexie from 'dexie'

export const db = new Dexie('garuda-billing')

db.version(1).stores({
  customers: 'id, name, mobile, gstin, createdAt',
  items: 'id, category, name, unit, hsn',
  invoices: 'id, invoiceNo, customerId, date, createdAt',
  payments: 'id, customerId, invoiceId, date',
  settings: 'key',
  syncQueue: '++id, entity, op, synced'
})

db.version(2).stores({
  customers: 'id, name, mobile, gstin, createdAt',
  items: 'id, category, name, unit, hsn',
  invoices: 'id, invoiceNo, customerId, companyId, date, createdAt',
  payments: 'id, customerId, invoiceId, date',
  settings: 'key',
  syncQueue: '++id, entity, op, synced',
  companies: 'id, name'
}).upgrade(async (tx) => {
  const settings = await tx.table('settings').toArray()
  const get = (k, fb) => {
    const s = settings.find((x) => x.key === k)
    return s ? s.value : fb
  }
  const company = {
    id: 'comp-1',
    name: get('shopName', '') || '',
    category: get('category', '') || '',
    logo: get('logo', ''),
    ownerName: get('ownerName', ''),
    website: get('website', ''),
    whatsapp: get('whatsapp', ''),
    email: get('email', ''),
    gstin: get('shopGstin', ''),
    address: get('shopAddress', ''),
    phone: get('shopPhone', ''),
    gstRate: Number(get('gstRate', 18)) || 18,
    nextInvoiceNo: Number(get('nextInvoiceNo', 1)) || 1,
    nextKacchaNo: Number(get('nextKacchaNo', 1)) || 1,
    templateId: 'classic',
    bankName: '', bankHolder: '', bankAccount: '', bankIfsc: '', upiId: '',
    createdAt: new Date().toISOString()
  }
  await tx.table('companies').put(company)
  await tx.table('settings').put({ key: 'activeCompanyId', value: company.id })
  const invoices = await tx.table('invoices').toArray()
  for (const inv of invoices) {
    inv.companyId = company.id
    inv.companyName = company.name
    inv.templateId = 'classic'
    inv.billType = inv.billType || 'gst'
    await tx.table('invoices').put(inv)
  }
})

db.version(3).stores({
  customers: 'id, name, mobile, gstin, createdAt',
  items: 'id, category, name, unit, hsn',
  invoices: 'id, invoiceNo, customerId, companyId, date, createdAt',
  payments: 'id, customerId, invoiceId, date',
  settings: 'key',
  syncQueue: '++id, entity, op, synced',
  companies: 'id, name'
}).upgrade(async (tx) => {
  const invoices = await tx.table('invoices').toArray()
  const companies = await tx.table('companies').toArray()
  const byDate = (a, b) => String(a.date || a.createdAt || '').localeCompare(String(b.date || b.createdAt || ''))
  for (const comp of companies) {
    const own = invoices.filter((i) => i.companyId === comp.id)
    const gst = own.filter((i) => i.billType !== 'kaccha').sort(byDate)
    const kaccha = own.filter((i) => i.billType === 'kaccha').sort(byDate)
    gst.forEach((inv, idx) => {
      inv.invoiceNo = formatInvoiceNo(idx + 1)
      tx.table('invoices').put(inv)
      tx.table('syncQueue').add({ entity: 'invoice', op: 'update', payload: inv, synced: 0, createdAt: new Date().toISOString() })
    })
    kaccha.forEach((inv, idx) => {
      inv.invoiceNo = formatInvoiceNo(idx + 1)
      tx.table('invoices').put(inv)
      tx.table('syncQueue').add({ entity: 'invoice', op: 'update', payload: inv, synced: 0, createdAt: new Date().toISOString() })
    })
    comp.nextInvoiceNo = gst.length + 1
    comp.nextKacchaNo = kaccha.length + 1
    await tx.table('companies').put(comp)
  }
  const customers = await tx.table('customers').toArray()
  for (const c of customers) {
    c.billType = c.billType || (c.gstin ? 'gst' : 'kaccha')
    await tx.table('customers').put(c)
  }
})

db.version(4).stores({
  customers: 'id, name, mobile, gstin, createdAt',
  items: 'id, category, name, unit, hsn',
  invoices: 'id, invoiceNo, customerId, companyId, date, createdAt',
  payments: 'id, customerId, invoiceId, date',
  settings: 'key',
  syncQueue: '++id, entity, op, synced',
  companies: 'id, name'
}).upgrade(async (tx) => {
  const companies = await tx.table('companies').toArray()
  for (const comp of companies) {
    if (!comp.logo) comp.logo = ''
    if (!comp.ownerName) comp.ownerName = ''
    if (!comp.website) comp.website = ''
    if (!comp.whatsapp) comp.whatsapp = ''
    if (!comp.email) comp.email = ''
    await tx.table('companies').put(comp)
  }
})

db.version(5).stores({
  customers: 'id, name, mobile, gstin, createdAt',
  items: 'id, category, name, unit, hsn',
  invoices: 'id, invoiceNo, customerId, companyId, date, createdAt',
  payments: 'id, customerId, invoiceId, date',
  settings: 'key',
  syncQueue: '++id, entity, op, synced',
  companies: 'id, name',
  stockTransactions: '++id, itemId, itemName, movementType, sourceType, gstStatus, date, createdAt'
}).upgrade(async (tx) => {
  const items = await tx.table('items').toArray()
  for (const it of items) {
    const qty = Number(it.qty || 0)
    if (qty === 0) continue
    await tx.table('stockTransactions').add({
      itemId: it.id,
      itemName: it.name,
      quantity: qty,
      unit: it.unit || 'bag',
      movementType: 'opening',
      sourceType: 'opening',
      supplierName: '',
      invoiceNo: '',
      gstStatus: 'opening',
      rate: Number(it.rate || 0),
      vehicleNo: '',
      date: new Date().toISOString().slice(0, 10),
      referenceId: '',
      notes: 'Migrated from items.qty',
      createdAt: new Date().toISOString()
    })
  }
})

export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key)
  return row ? row.value : fallback
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

export async function enqueue(entity, op, payload) {
  await db.syncQueue.add({ entity, op, payload, synced: 0, createdAt: new Date().toISOString() })
}

export async function getCompanies() {
  const list = await db.companies.toArray()
  if (list.length === 0) {
    const c = defaultCompany()
    await db.companies.put(c)
    list.push(c)
  }
  return list
}

export async function getActiveCompany() {
  const companies = await getCompanies()
  const activeId = await getSetting('activeCompanyId', null)
  const match = companies.find((c) => c.id === activeId)
  return match || companies[0]
}

export async function setActiveCompany(id) {
  await setSetting('activeCompanyId', id)
}

export async function saveCompany(company) {
  const existing = company.id ? await db.companies.get(company.id) : null
  if (!existing && !company.id) company.id = 'comp-' + Date.now()
  if (!existing) {
    company.nextInvoiceNo = Number(company.nextInvoiceNo) || 1
    company.nextKacchaNo = Number(company.nextKacchaNo) || 1
  }
  await db.companies.put(company)
  return company
}

export async function deleteCompany(id) {
  const companies = await getCompanies()
  if (companies.length <= 1) return false
  await db.companies.delete(id)
  const activeId = await getSetting('activeCompanyId', null)
  if (activeId === id) {
    const remaining = await getCompanies()
    await setActiveCompany(remaining[0].id)
  }
  return true
}

export async function setCompanyTemplate(companyId, templateId) {
  await db.companies.update(companyId, { templateId })
}

export function defaultCompany() {
  return {
    id: 'comp-' + Date.now(),
    name: '',
    category: '',
    logo: '',
    ownerName: '',
    website: '',
    whatsapp: '',
    email: '',
    gstin: '',
    address: '',
    phone: '',
    gstRate: 18,
    nextInvoiceNo: 1,
    nextKacchaNo: 1,
    templateId: 'classic',
    bankName: '', bankHolder: '', bankAccount: '', bankIfsc: '', upiId: '',
    createdAt: new Date().toISOString()
  }
}

export function formatInvoiceNo(n) {
  return String(Math.max(1, Number(n) || 0)).padStart(4, '0')
}

export async function nextBillNo(companyId, billType) {
  const companies = await getCompanies()
  const comp = companies.find((c) => c.id === companyId) || companies[0]
  const key = billType === 'kaccha' ? 'nextKacchaNo' : 'nextInvoiceNo'
  const next = Number(comp[key]) || 1
  await db.companies.update(comp.id, { [key]: next + 1 })
  return formatInvoiceNo(next)
}

export async function invoiceNoExists(companyId, invoiceNo, excludeId) {
  const invoices = await db.invoices.where('companyId').equals(companyId).toArray()
  return invoices.some((i) => String(i.invoiceNo) === String(invoiceNo) && i.id !== excludeId)
}

export async function nextInvoiceNo(companyId) {
  const companies = await getCompanies()
  const comp = companies.find((c) => c.id === companyId) || companies[0]
  const next = Number(comp.nextInvoiceNo) || 1
  await db.companies.update(comp.id, { nextInvoiceNo: next + 1 })
  return next
}

export async function seedDefaults() {
  const companies = await getCompanies()
  const activeId = await getSetting('activeCompanyId', null)
  if (!activeId) await setActiveCompany(companies[0].id)
}

function inferCategory(name) {
  const n = String(name || '').toLowerCase()
  if (n.includes('cement')) return 'cement'
  if (n.includes('steel') || n.includes('sariya') || n.includes('tmt') || n.includes('rod')) return 'steel'
  return 'other'
}

const PRODUCT_ALIAS_MATCH = { sariya: 'tmt', sariyaa: 'tmt', rod: 'tmt', tmt: 'tmt', steel: 'tmt', semento: 'cement', siment: 'cement' }

export function canonicalName(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).sort().join('')
}

function aliasCanonical(s) {
  const toks = String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const mapped = toks.map((w) => PRODUCT_ALIAS_MATCH[w] || w)
  return mapped.sort().join('')
}

function normalizeName(s) {
  return canonicalName(s)
}

export async function findStockItem(voiceName) {
  const all = await db.items.toArray()
  const vn = canonicalName(voiceName)
  const vnAlias = aliasCanonical(voiceName)
  const sizeMatch = (String(voiceName || '').match(/\d+mm/) || [])[0]
  let best = null
  for (const it of all) {
    const inn = canonicalName(it.name)
    const innAlias = aliasCanonical(it.name)
    const itSize = (String(it.name).match(/\d+mm/) || [])[0]
    if (sizeMatch && itSize && itSize !== sizeMatch) continue
    if (inn === vn || inn.includes(vn) || vn.includes(inn) || innAlias === vnAlias || innAlias.includes(vnAlias) || vnAlias.includes(innAlias)) {
      if (!best || it.name.length < best.name.length) best = it
    }
  }
  return best
}

export async function getStockQty(voiceName) {
  const it = await findStockItem(voiceName)
  return it ? Number(it.qty || 0) : 0
}

export async function applyStockOp({ name, qty, unit, operation, sourceType = 'adjustment', supplierName = '', invoiceNo = '', gstStatus = 'unbilled', rate = 0, vehicleNo = '', referenceId = '', notes = '' }) {
  const n = Number(qty) || 0
  if (!name || n <= 0) throw new Error('Invalid stock entry')
  let item = await findStockItem(name)
  if (!item) {
    item = {
      id: 'itm' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: String(name).trim(),
      unit: unit || 'bag',
      rate: Number(rate) || 0,
      category: inferCategory(name),
      hsn: '',
      qty: 0
    }
    await db.items.put(item)
    await enqueue('item', 'create', item)
  }
  let op = 'add'
  if (operation === 'set') op = 'set'
  else if (operation === 'subtract') op = 'subtract'
  let nextQty
  if (op === 'set') nextQty = n
  else if (op === 'subtract') nextQty = Math.max(0, Number(item.qty || 0) - n)
  else nextQty = Number(item.qty || 0) + n
  await db.items.update(item.id, { qty: nextQty })
  await enqueue('item', 'update', { id: item.id, qty: nextQty })

  const movementType = op === 'subtract' ? 'stock_out' : 'stock_in'
  await db.stockTransactions.add({
    itemId: item.id,
    itemName: item.name,
    quantity: n,
    unit: item.unit || unit || 'bag',
    movementType,
    sourceType: op === 'subtract' ? 'sale' : sourceType,
    supplierName: supplierName || '',
    invoiceNo: invoiceNo || '',
    gstStatus: op === 'subtract' ? 'gst' : gstStatus,
    rate: Number(rate) || Number(item.rate || 0),
    vehicleNo: vehicleNo || '',
    date: new Date().toISOString().slice(0, 10),
    referenceId: referenceId || '',
    notes: notes || '',
    createdAt: new Date().toISOString()
  })

  const updated = await db.items.get(item.id)
  return { item: updated, prevQty: Number(item.qty || 0) - (op === 'subtract' ? 0 : n), nextQty, operation: op }
}

export async function getPhysicalStock(itemId) {
  const item = await db.items.get(itemId)
  const txs = await db.stockTransactions.where('itemId').equals(itemId).toArray()
  if (txs.length === 0 && item) return Math.max(0, Number(item.qty || 0))
  let stock = 0
  for (const tx of txs) {
    if (tx.movementType === 'stock_in' || tx.movementType === 'opening') stock += Number(tx.quantity || 0)
    else if (tx.movementType === 'stock_out') stock -= Number(tx.quantity || 0)
  }
  return Math.max(0, stock)
}

export async function getStockLedger(itemId) {
  return db.stockTransactions.where('itemId').equals(itemId).sortBy('createdAt')
}

export async function recordStockOutForInvoice(invoice, items) {
  for (const line of items) {
    const item = await findStockItem(line.name)
    if (!item) continue
    const qty = Number(line.qty || 0)
    if (qty <= 0) continue
    await db.items.update(item.id, { qty: Math.max(0, Number(item.qty || 0) - qty) })
    await db.stockTransactions.add({
      itemId: item.id,
      itemName: item.name,
      quantity: qty,
      unit: item.unit || line.unit || 'bag',
      movementType: 'stock_out',
      sourceType: 'sale',
      supplierName: '',
      invoiceNo: String(invoice.invoiceNo || ''),
      gstStatus: invoice.billType === 'kaccha' ? 'kaccha' : 'gst',
      rate: Number(line.rate || 0),
      vehicleNo: '',
      date: invoice.date || new Date().toISOString().slice(0, 10),
      referenceId: invoice.id,
      notes: 'Auto-deducted for invoice ' + invoice.invoiceNo,
      createdAt: new Date().toISOString()
    })
  }
}

export const UNITS = ['bag', 'kg', 'quintal', 'ton', 'piece', 'truck', 'job', 'no']