import { db } from '../db'

const COLLECTIONS = ['customers', 'items', 'invoices', 'payments', 'companies', 'settings', 'syncQueue']

export async function exportAll() {
  const data = {}
  for (const name of COLLECTIONS) {
    data[name] = await db[name].toArray()
  }
  data._meta = { app: 'garuda-billing', version: 2, exportedAt: new Date().toISOString() }
  return data
}

export function downloadBackup(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'garuda-billing-backup-' + new Date().toISOString().slice(0, 10) + '.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function importAll(data) {
  if (!data || typeof data !== 'object' || data._meta?.app !== 'garuda-billing') {
    throw new Error('Ye sahi backup file nahi hai')
  }
  await db.transaction('rw', db.tables, async () => {
    for (const name of COLLECTIONS) {
      const rows = Array.isArray(data[name]) ? data[name] : []
      await db[name].clear()
      if (rows.length) await db[name].bulkPut(rows)
    }
  })
  return { restored: true }
}