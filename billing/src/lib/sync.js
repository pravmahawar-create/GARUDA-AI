import { db } from '../db'

const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export async function syncNow() {
  if (!apiBase) return { skipped: true, reason: 'no_api_base' }
  const queued = await db.syncQueue.where('synced').equals(0).toArray()
  if (queued.length === 0) return { skipped: true, reason: 'empty' }

  const group = { customers: [], invoices: [], payments: [], companies: [], deletes: [] }
  const ids = []
  for (const q of queued) {
    const p = q.payload || {}
    if (q.op === 'delete') {
      group.deletes.push({ entity: q.entity, id: p.id })
    } else if (q.entity === 'invoice') group.invoices.push(p)
    else if (q.entity === 'customer') group.customers.push(p)
    else if (q.entity === 'payment') group.payments.push(p)
    else if (q.entity === 'company') group.companies.push(p)
    ids.push(q.id)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(apiBase + '/api/billing/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
      signal: controller.signal
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
  } finally {
    clearTimeout(timer)
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