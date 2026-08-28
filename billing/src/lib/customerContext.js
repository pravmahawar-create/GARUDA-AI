import { db, getActiveCompanyId } from '../db.js'

function key(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function findCustomerByRef(customers, text, companyId) {
  const t = String(text || '').trim()
  if (!t) return { customer: null, ambiguous: [] }
  const cid = companyId || await getActiveCompanyId()
  const list = Array.isArray(customers) ? customers : (cid ? await db.customers.where('companyId').equals(cid).toArray() : await db.customers.toArray())
  const tl = t.toLowerCase()
  const exact = list.filter((c) => String(c.name || '').toLowerCase() === tl)
  if (exact.length === 1) return { customer: exact[0], ambiguous: [] }
  if (exact.length > 1) return { customer: null, ambiguous: exact }
  const tokens = tl.split(/\s+/).filter(Boolean)
  const allTokens = list.filter((c) => {
    const name = String(c.name || '').toLowerCase()
    return tokens.every((tok) => name.includes(tok))
  })
  if (allTokens.length === 1) return { customer: allTokens[0], ambiguous: [] }
  if (allTokens.length > 1) return { customer: null, ambiguous: allTokens }
  if (tokens.length === 1) {
    const subs = list.filter((c) => String(c.name || '').toLowerCase().includes(tokens[0]))
    if (subs.length === 1) return { customer: subs[0], ambiguous: [] }
    if (subs.length > 1) return { customer: null, ambiguous: subs }
  }
  return { customer: null, ambiguous: [] }
}

export async function getCustomerSummary(customerId, companyId) {
  const cid = companyId || await getActiveCompanyId()
  const invoices = cid ? await db.invoices.where('companyId').equals(cid).and((i) => i.customerId === customerId).toArray() : await db.invoices.where('customerId').equals(customerId).toArray()
  const payments = cid ? await db.payments.where('companyId').equals(cid).and((p) => p.customerId === customerId).toArray() : await db.payments.where('customerId').equals(customerId).toArray()
  const sales = invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0)
  const paid = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const byDate = (a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || ''))
  const last = [...invoices].sort(byDate)[0]
  return {
    bills: invoices.length,
    sales,
    payments: paid,
    outstanding: Math.max(0, sales - paid),
    lastDate: last ? last.date || last.createdAt : null
  }
}

export async function getCustomerHistory(customerId, opts = {}, companyId) {
  const cid = companyId || await getActiveCompanyId()
  const limit = opts.limit || 10
  const invoices = cid ? await db.invoices.where('companyId').equals(cid).and((i) => i.customerId === customerId).toArray() : await db.invoices.where('customerId').equals(customerId).toArray()
  const payments = cid ? await db.payments.where('companyId').equals(cid).and((p) => p.customerId === customerId).toArray() : await db.payments.where('customerId').equals(customerId).toArray()
  const byDate = (a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || ''))
  const sorted = [...invoices].sort(byDate)
  const recentBills = sorted.slice(0, limit)
  const recentBillTypes = sorted.map((i) => i.billType || (i.customerGstin ? 'gst' : 'kaccha')).filter(Boolean)
  const customer = await db.customers.get(customerId)

  const recentItems = []
  const seenItems = new Set()
  const recentRates = []
  for (const inv of sorted) {
    for (const it of (inv.items || [])) {
      const k = key(it.name)
      recentRates.push({ rate: Number(it.rate || 0), unit: it.unit || 'bag', item: it.name, date: inv.date || inv.createdAt || '' })
      if (!seenItems.has(k)) {
        seenItems.add(k)
        recentItems.push({ name: it.name, unit: it.unit || 'bag', rate: Number(it.rate || 0), qty: Number(it.qty || 0), date: inv.date || inv.createdAt || '', billType: inv.billType || 'kaccha' })
      }
    }
  }

  const sales = sorted.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0)
  const paid = payments.reduce((s, p) => s + (p.amount || 0), 0)
  return {
    customer,
    recentBills,
    recentItems,
    recentRates,
    recentBillTypes,
    savedGstin: (customer && customer.gstin) || '',
    savedBillType: (customer && customer.billType) || (customer && customer.gstin ? 'gst' : null),
    lastTransactionDate: sorted.length ? sorted[0].date || sorted[0].createdAt : null,
    totals: { bills: sorted.length, sales, payments: paid, outstanding: Math.max(0, sales - paid) }
  }
}
