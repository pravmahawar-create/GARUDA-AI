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
    name: get('shopName', 'A.K TRADING COMPANY') || 'A.K TRADING COMPANY',
    category: get('category', 'Trading · Steel · Cement'),
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
    if (!comp.category) comp.category = 'Trading · Steel · Cement'
    if (!comp.logo) comp.logo = ''
    if (!comp.ownerName) comp.ownerName = ''
    if (!comp.website) comp.website = ''
    if (!comp.whatsapp) comp.whatsapp = ''
    if (!comp.email) comp.email = ''
    await tx.table('companies').put(comp)
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

function defaultCompany() {
  return {
    id: 'comp-' + Date.now(),
    name: 'A.K TRADING COMPANY',
    category: 'Trading · Steel · Cement',
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
  const itemCount = await db.items.count()
  if (itemCount === 0) {
    const defaults = [
      { category: 'cement', name: 'Cement - ACC', unit: 'bag', rate: 390, hsn: '2523' },
      { category: 'cement', name: 'Cement - UltraTech', unit: 'bag', rate: 395, hsn: '2523' },
      { category: 'steel', name: 'TMT Steel 8mm', unit: 'kg', rate: 62, hsn: '7214' },
      { category: 'steel', name: 'TMT Steel 10mm', unit: 'kg', rate: 60, hsn: '7214' },
      { category: 'steel', name: 'TMT Steel 12mm', unit: 'kg', rate: 61, hsn: '7214' },
      { category: 'steel', name: 'Sariya (rod) - 40ft', unit: 'piece', rate: 680, hsn: '7214' },
      { category: 'steel', name: 'Sariya (rod) - 20ft', unit: 'piece', rate: 340, hsn: '7214' },
      { category: 'other', name: 'Sand', unit: 'truck', rate: 8000, hsn: '2505' },
      { category: 'other', name: 'Bricks', unit: 'piece', rate: 8, hsn: '6904' },
      { category: 'other', name: 'Transport/Booking', unit: 'job', rate: 0, hsn: '9965' }
    ]
    await db.items.bulkPut(defaults.map((it, i) => ({ ...it, id: 'itm-' + (i + 1) })))
  }
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

function normalizeName(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function findStockItem(voiceName) {
  const all = await db.items.toArray()
  const vn = normalizeName(voiceName)
  let best = null
  for (const it of all) {
    const inn = normalizeName(it.name)
    if (inn === vn || inn.includes(vn) || vn.includes(inn)) {
      if (!best || it.name.length < best.name.length) best = it
    }
  }
  return best
}

export async function getStockQty(voiceName) {
  const it = await findStockItem(voiceName)
  return it ? Number(it.qty || 0) : 0
}

export async function applyStockOp({ name, qty, unit, operation }) {
  const n = Number(qty) || 0
  if (!name || n <= 0) throw new Error('Invalid stock entry')
  let item = await findStockItem(name)
  if (!item) {
    item = {
      id: 'itm' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: String(name).trim(),
      unit: unit || 'bag',
      rate: 0,
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
  const updated = await db.items.get(item.id)
  return { item: updated, prevQty: Number(item.qty || 0), nextQty, operation: op }
}

export const UNITS = ['bag', 'kg', 'quintal', 'ton', 'piece', 'truck', 'job', 'no']