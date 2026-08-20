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

export async function nextInvoiceNo() {
  const current = (await getSetting('nextInvoiceNo', 1001)) || 1001
  await setSetting('nextInvoiceNo', current + 1)
  return current
}

export async function seedDefaults() {
  const itemCount = await db.items.count()
  if (itemCount > 0) return

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
  await db.items.bulkPut(defaults.map((it, i) => ({ ...it, id: 'itm-' + (i + 1), rate: it.rate })))
}

export const UNITS = ['bag', 'kg', 'quintal', 'ton', 'piece', 'truck', 'job', 'no']