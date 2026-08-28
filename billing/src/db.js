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

db.version(11).stores({
  customers: 'id, name, mobile, gstin, companyId, createdAt',
  items: 'id, category, name, unit, hsn, companyId',
  invoices: 'id, invoiceNo, customerId, companyId, date, createdAt',
  payments: 'id, customerId, invoiceId, companyId, date',
  settings: 'key',
  syncQueue: '++id, entity, op, synced',
  companies: 'id, name',
  stockTransactions: '++id, itemId, itemName, movementType, sourceType, gstStatus, companyId, date, createdAt',
  vehicles: 'id, number, type, capacity, unit, companyId, active, createdAt',
  suppliers: 'id, name, gstin, phone, address, companyId, createdAt',
  orders: 'id, invoiceNo, customerId, customerName, companyId, value, startDate, endDate, vehicles, tripsPerDay, product, rate, status, createdAt',
  trips: '++id, orderId, invoiceNo, companyId, date, vehicleNo, itemName, qty, unit, status, createdAt',
  auditEvents: 'id, companyId, action, idempotencyKey, timestamp',
  conversationSessions: 'id, companyId, status, activeTask, updatedAt, createdAt'
}).upgrade(async (tx) => {
  const activeId = await getActiveCompanyId()
  if (!activeId) return
  const upd = (table, filter) => {
    const rows = tx.table(table).filter(filter).toArray()
    return rows.then((list) => {
      for (const r of list) {
        tx.table(table).update(r.id, { companyId: activeId })
      }
    })
  }
  await upd('customers', (r) => !r.companyId)
  await upd('items', (r) => !r.companyId)
  await upd('payments', (r) => !r.companyId)
  await upd('stockTransactions', (r) => !r.companyId)
  await upd('vehicles', (r) => !r.companyId)
  await upd('suppliers', (r) => !r.companyId)
  await upd('orders', (r) => !r.companyId)
  await upd('trips', (r) => !r.companyId)
})

export async function saveConversationSession(session) {
  if (!session || !session.id) return null
  const cid = session.companyId || await getActiveCompanyId()
  const data = {
    ...session,
    companyId: cid,
    updatedAt: new Date().toISOString(),
    createdAt: session.createdAt || new Date().toISOString()
  }
  await db.conversationSessions.put(data)
  return data
}

export async function getConversationSession(id, companyId) {
  if (!id) return null
  const cid = companyId || await getActiveCompanyId()
  const sess = await db.conversationSessions.get(id)
  if (!sess) return null
  if (cid && sess.companyId && sess.companyId !== cid) return null
  return sess
}

export async function getActiveCompanySession(companyId) {
  const cid = companyId || await getActiveCompanyId()
  if (!cid) return null
  const sessions = await db.conversationSessions.where('companyId').equals(cid).toArray()
  const active = sessions.filter((s) => s.status === 'ACTIVE' || s.status === 'PAUSED')
  if (!active.length) return null
  active.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  return active[0]
}

export async function deleteConversationSession(id) {
  if (!id) return
  await db.conversationSessions.delete(id)
}


export async function recordAuditEvent({ companyId, action, idempotencyKey, payload, result }) {
  const cid = companyId || await getActiveCompanyId()
  const event = {
    id: 'aud' + Date.now() + Math.random().toString(36).slice(2, 6),
    companyId: cid,
    action,
    idempotencyKey: idempotencyKey || '',
    payload: payload || {},
    result: result || {},
    timestamp: new Date().toISOString()
  }
  await db.auditEvents.put(event)
  return event
}

export async function findAuditEventByIdempotencyKey(key, companyId) {
  if (!key) return null
  const cid = companyId || await getActiveCompanyId()
  const events = await db.auditEvents.where('companyId').equals(cid).toArray()
  return events.find((e) => e.idempotencyKey === key) || null
}

export async function createOrderWithTrips(order) {
  const cid = order.companyId || await getActiveCompanyId()
  const created = await db.orders.put({ ...order, companyId: cid })
  const trips = []
  const days = []
  const start = new Date(order.startDate + 'T00:00:00')
  const end = new Date(order.endDate + 'T00:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10))
  }
  const totalQty = order.value && order.rate ? Math.round((order.value / order.rate) * 100) / 100 : 0
  const totalSlots = Math.max(1, days.length * (order.vehicles || 1) * (order.tripsPerDay || 1))
  const perTrip = Math.round((totalQty / totalSlots) * 100) / 100
  let slot = 0
  for (const date of days) {
    for (let v = 0; v < (order.vehicles || 1); v++) {
      for (let t = 0; t < (order.tripsPerDay || 1); t++) {
        slot++
        trips.push({
          orderId: order.id,
          invoiceNo: order.invoiceNo,
          companyId: cid,
          date,
          vehicleNo: order.vehicleNos && order.vehicleNos[v] ? order.vehicleNos[v] : '',
          itemName: order.product || '',
          qty: perTrip,
          unit: order.unit || 'kg',
          status: 'planned'
        })
      }
    }
  }
  if (trips.length) await db.trips.bulkAdd(trips)
  return { order: created, trips }
}

export async function getCustomers(companyId) {
  const cid = companyId || await getActiveCompanyId()
  if (!cid) return db.customers.toArray()
  return db.customers.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid))
}

export async function saveCustomer(c) {
  const existing = c.id ? await db.customers.get(c.id) : null
  const data = {
    ...c,
    id: c.id || ('cust' + Date.now() + Math.random().toString(36).slice(2, 6)),
    companyId: c.companyId || (existing ? existing.companyId : null) || await getActiveCompanyId()
  }
  await db.customers.put(data)
  return data
}

export async function getItems(companyId) {
  const cid = companyId || await getActiveCompanyId()
  if (!cid) return db.items.toArray()
  return db.items.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid))
}

export async function saveItem(item) {
  const cid = item.companyId || await getActiveCompanyId()
  if (!item.id && item.name) {
    const match = await findStockItem(item.name, cid)
    if (match) item.id = match.id
  }
  const existing = item.id ? await db.items.get(item.id) : null
  const data = {
    ...item,
    id: item.id || ('itm' + Date.now() + Math.random().toString(36).slice(2, 6)),
    companyId: item.companyId || (existing ? existing.companyId : null) || cid
  }
  await db.items.put(data)
  return data
}

export async function consolidateDuplicateItems(companyId) {
  const cid = companyId || await getActiveCompanyId()
  if (!cid) return
  const items = await getItems(cid)
  const groups = new Map()
  for (const it of items) {
    const key = canonicalName(it.name)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(it)
  }
  for (const [key, group] of groups.entries()) {
    if (group.length <= 1) continue
    // Sort group: non-zero qty first, then shortest name
    group.sort((a, b) => {
      const qA = Number(a.qty || 0), qB = Number(b.qty || 0)
      if (qA !== qB) return qB - qA
      return a.name.length - b.name.length
    })
    const primary = group[0]
    let totalQty = Number(primary.qty || 0)
    for (let i = 1; i < group.length; i++) {
      const sec = group[i]
      totalQty += Number(sec.qty || 0)
      // Re-link stock transactions
      const txs = await db.stockTransactions.where('itemId').equals(sec.id).toArray()
      for (const t of txs) {
        await db.stockTransactions.update(t.id, { itemId: primary.id, itemName: primary.name })
      }
      // Delete redundant secondary record
      await db.items.delete(sec.id)
    }
    await db.items.update(primary.id, { qty: totalQty })
  }
}

export async function getInvoices(companyId) {
  const cid = companyId || await getActiveCompanyId()
  let list
  if (!cid) {
    list = await db.invoices.toArray()
  } else {
    const byCompany = await db.invoices.where('companyId').equals(cid).toArray()
    const legacy = await db.invoices.toArray().then((rows) => rows.filter((r) => !r.companyId))
    const map = new Map()
    for (const i of [...byCompany, ...legacy]) map.set(i.id, i)
    list = Array.from(map.values())
  }
  return list.sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || '')))
}

export async function getPayments(companyId) {
  const cid = companyId || await getActiveCompanyId()
  if (!cid) return db.payments.toArray()
  return db.payments.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid))
}

export async function recordPayment({ customerId, invoiceId, amount, date, mode, note, companyId }) {
  const cid = companyId || await getActiveCompanyId()
  const data = {
    id: 'pay' + Date.now() + Math.random().toString(36).slice(2, 4),
    customerId,
    invoiceId,
    amount: Number(amount) || 0,
    date: date || new Date().toISOString().slice(0, 10),
    mode: mode || 'Cash',
    note: note || '',
    companyId: cid,
    createdAt: new Date().toISOString()
  }
  await db.payments.put(data)
  await enqueue('payment', 'create', data)
  return data
}
export async function getOrder(id) { return db.orders.get(id) }
export async function getOrders(companyId) {
  const cid = companyId || await getActiveCompanyId()
  if (!cid) return db.orders.orderBy('createdAt').reverse().toArray()
  return db.orders.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid)).then((rows) => rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))))
}
export async function getOrderTrips(companyId, orderId) {
  const cid = companyId || await getActiveCompanyId()
  return db.trips.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === (cid || '')))
}

export async function getSupplierList(companyId) {
  const cid = companyId || await getActiveCompanyId()
  if (!cid) return db.suppliers.toArray()
  return db.suppliers.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid))
}

export async function saveSupplier(s) {
  const existing = s.id ? await db.suppliers.get(s.id) : await db.suppliers.where('name').equals(String(s.name || '').trim()).first()
  const data = {
    id: existing ? existing.id : ('sup' + Date.now() + Math.random().toString(36).slice(2, 4)),
    name: String(s.name || '').trim(),
    gstin: String(s.gstin || '').trim().toUpperCase(),
    phone: String(s.phone || '').trim(),
    address: String(s.address || '').trim(),
    companyId: s.companyId || (existing ? existing.companyId : null) || await getActiveCompanyId(),
    createdAt: existing ? existing.createdAt : new Date().toISOString()
  }
  if (!data.name) return null
  await db.suppliers.put(data)
  await enqueue('supplier', 'create', data)
  return data
}

export async function getVehicles(companyId) {
  const cid = companyId || await getActiveCompanyId()
  if (!cid) return db.vehicles.toArray()
  return db.vehicles.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid))
}

export async function getSuppliers(companyId) {
  const cid = companyId || await getActiveCompanyId()
  if (!cid) return db.suppliers.toArray()
  return db.suppliers.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid))
}

export async function getSupplierLedger(companyId, supplierName) {
  const cid = companyId || await getActiveCompanyId()
  const txs = cid ? await db.stockTransactions.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid)) : await db.stockTransactions.toArray()
  const name = String(supplierName || '').trim().toLowerCase()
  return txs
    .filter((t) => String(t.supplierName || '').toLowerCase() === name)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

export async function saveVehicle(v) {
  const existing = v.id ? await db.vehicles.get(v.id) : null
  const data = {
    id: v.id || ('veh' + Date.now() + Math.random().toString(36).slice(2, 4)),
    number: String(v.number || '').trim().toUpperCase(),
    type: String(v.type || '').trim(),
    capacity: Number(v.capacity) || 0,
    unit: String(v.unit || 'kg').trim(),
    companyId: v.companyId || (existing ? existing.companyId : null) || await getActiveCompanyId(),
    active: v.active !== false,
    createdAt: existing ? existing.createdAt : new Date().toISOString()
  }
  await db.vehicles.put(data)
  await enqueue('vehicle', 'create', data)
  return data
}

export async function deleteVehicle(id) {
  const v = await db.vehicles.get(id)
  if (v) { await db.vehicles.delete(id); await enqueue('vehicle', 'delete', { id }) }
}

export async function findVehicle(number, companyId) {
  const n = String(number || '').toUpperCase()
  const cid = companyId || await getActiveCompanyId()
  const list = cid ? await db.vehicles.where('companyId').equals(cid).toArray() : await db.vehicles.toArray()
  return list.find((v) => String(v.number).toUpperCase() === n) || null
}

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

export async function getActiveCompanyId() {
  const activeId = await getSetting('activeCompanyId', null)
  if (activeId) return activeId
  return null
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

export function bagWeightFor(item) {
  const bw = Number(item && item.bagWeight)
  if (bw) return bw
  return item && item.category === 'cement' ? 50 : 0
}

// Convert a spoken weight (ton/quintal/kg) to the item's own unit (e.g. bag), when supported.
// Capacity is a planning constraint — actual load is whatever the recorded weighment says.
export function convertToItemUnit(item, qty, fromUnit) {
  const unit = String((item && item.unit) || '')
  const s = String(fromUnit || '').toLowerCase()
  if (unit !== 'bag') return null
  let kg = 0
  if (s === 'ton' || s === 'tonne' || s === 'tan') kg = Number(qty) * 1000
  else if (s === 'quintal' || s === 'qtl') kg = Number(qty) * 100
  else if (s === 'kg' || s === 'kilo' || s === 'kgg') kg = Number(qty)
  else return null
  const bw = bagWeightFor(item)
  if (!bw) return null
  return { qty: Math.round((kg / bw) * 100) / 100, unit: 'bag' }
}

function aliasCanonical(s) {
  const toks = String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const mapped = toks.map((w) => PRODUCT_ALIAS_MATCH[w] || w)
  return mapped.sort().join('')
}

function normalizeName(s) {
  return canonicalName(s)
}

export async function findStockItem(voiceName, companyId) {
  const cid = companyId || await getActiveCompanyId()
  const all = cid ? await db.items.toArray().then((items) => items.filter((it) => !it.companyId || it.companyId === cid)) : await db.items.toArray()
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
      if (!best) {
        best = it
      } else {
        const bestQty = Number(best.qty || 0)
        const itQty = Number(it.qty || 0)
        if (itQty > 0 && bestQty === 0) {
          best = it
        } else if (itQty === 0 && bestQty > 0) {
          // keep current best
        } else if (it.name.length < best.name.length) {
          best = it
        }
      }
    }
  }
  return best
}

export async function getStockQty(voiceName, companyId) {
  const it = await findStockItem(voiceName, companyId)
  return it ? Number(it.qty || 0) : 0
}

export async function applyStockOp({ name, qty, unit, operation, sourceType = 'adjustment', supplierName = '', invoiceNo = '', gstStatus = 'unbilled', rate = 0, vehicleNo = '', referenceId = '', notes = '', companyId }) {
  const n = Number(qty) || 0
  if (!name || n <= 0) throw new Error('Invalid stock entry')
  const cid = companyId || await getActiveCompanyId()
  let item = await findStockItem(name, cid)
  if (!item) {
    item = {
      id: 'itm' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: String(name).trim(),
      unit: unit || 'bag',
      rate: Number(rate) || 0,
      category: inferCategory(name),
      hsn: '',
      bagWeight: inferCategory(name) === 'cement' ? 50 : 0,
      qty: 0,
      companyId: cid
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
    companyId: cid,
    createdAt: new Date().toISOString()
  })

  const updated = await db.items.get(item.id)
  return { item: updated, prevQty: Number(item.qty || 0) - (op === 'subtract' ? 0 : n), nextQty, operation: op }
}

export async function getPhysicalStock(itemId, companyId) {
  const item = await db.items.get(itemId)
  const cid = companyId || await getActiveCompanyId()
  const txs = cid ? await db.stockTransactions.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid)) : await db.stockTransactions.toArray()
  const itemTxs = txs.filter((t) => t.itemId === itemId)
  if (itemTxs.length === 0 && item) return Math.max(0, Number(item.qty || 0))
  let stock = 0
  for (const tx of itemTxs) {
    if (tx.movementType === 'stock_in' || tx.movementType === 'opening') stock += Number(tx.quantity || 0)
    else if (tx.movementType === 'stock_out') stock -= Number(tx.quantity || 0)
  }
  return Math.max(0, stock)
}

export async function getStockLedger(itemId, companyId) {
  const cid = companyId || await getActiveCompanyId()
  const txs = cid ? await db.stockTransactions.toArray().then((rows) => rows.filter((r) => !r.companyId || r.companyId === cid)) : await db.stockTransactions.toArray()
  return txs.filter((t) => t.itemId === itemId).sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
}

export async function recordStockOutForInvoice(companyId, invoice, items) {
  for (const line of items) {
    const item = await findStockItem(line.name, companyId)
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
      companyId: companyId || await getActiveCompanyId(),
      createdAt: new Date().toISOString()
    })
  }
}

export const UNITS = ['bag', 'kg', 'quintal', 'ton', 'piece', 'truck', 'job', 'no']