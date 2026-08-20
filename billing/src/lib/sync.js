import { db } from '../db'

const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export async function syncNow() {
  if (!apiBase) return { skipped: true, reason: 'no_api_base' }
  const queued = await db.syncQueue.where('synced').equals(0).toArray()
  if (queued.length === 0) return { skipped: true, reason: 'empty' }

  const group = { customers: [], invoices: [], payments: [] }
  const ids = []
  for (const q of queued) {
    const p = q.payload || {}
    if (q.entity === 'invoice') group.invoices.push(p)
    else if (q.entity === 'customer') group.customers.push(p)
    else if (q.entity === 'payment') group.payments.push(p)
    ids.push(q.id)
  }

  try {
    const res = await fetch(apiBase + '/api/billing/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group)
    })
    if (!res.ok) return { skipped: true, reason: 'server_' + res.status }
    const data = await res.json()
    if (data.success) {
      await db.syncQueue.bulkUpdate(ids, (obj) => {
        obj.synced = 1
        obj.syncedAt = new Date().toISOString()
      })
      return { ok: true, counts: data.counts }
    }
    return { skipped: true, reason: 'server_false' }
  } catch (e) {
    return { skipped: true, reason: 'offline' }
  }
}

export function watchSync() {
  const run = () => syncNow()
  window.addEventListener('online', run)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run()
  })
  return run
}