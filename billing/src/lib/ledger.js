import { db, enqueue } from '../db.js'

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other']

// Outstanding = sum of non-cancelled invoice grand totals − recorded payments.
export async function customerOutstanding(customerId, companyId = '') {
  const invoices = (await db.invoices.where('customerId').equals(customerId).toArray()).filter((i) => i.status !== 'cancelled')
  const payments = await db.payments.where('customerId').equals(customerId).toArray()
  const billed = invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0)
  const paid = payments.reduce((s, p) => s + (p.amount || 0), 0)
  return Math.round((billed - paid) * 100) / 100
}

export async function getCustomerPayments(customerId) {
  return db.payments.where('customerId').equals(customerId).sortBy('date')
}

export async function getLastPayment(customerId) {
  const list = await db.payments.where('customerId').equals(customerId).toArray()
  if (!list.length) return null
  return list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0]
}

export async function getTotalPaid(customerId) {
  const list = await db.payments.where('customerId').equals(customerId).toArray()
  return list.reduce((s, p) => s + (p.amount || 0), 0)
}

// Ledger rows: chronological, balance = previous + debit − credit.
// DEBIT = bill amount (customer owes more); CREDIT = payment received.
export async function getLedger(customerId) {
  const invoices = (await db.invoices.where('customerId').equals(customerId).toArray()).filter((i) => i.status !== 'cancelled')
  const payments = await db.payments.where('customerId').equals(customerId).toArray()
  const rows = []
  for (const i of invoices) rows.push({ date: i.date || i.createdAt || '', type: 'bill', ref: '#' + i.invoiceNo, id: i.id, debit: Number(i.totals?.grandTotal || 0), credit: 0, invoice: i })
  for (const p of payments) rows.push({ date: p.date || p.createdAt || '', type: 'payment', ref: p.mode || 'Payment', id: p.id, debit: 0, credit: Number(p.amount || 0), payment: p })
  rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.type === 'bill' && b.type === 'payment' ? -1 : a.type === 'payment' && b.type === 'bill' ? 1 : 0))
  let balance = 0
  for (const r of rows) { balance += r.debit - r.credit; r.balance = Math.round(balance * 100) / 100 }
  return rows
}

export async function recordPayment({ customerId, invoiceId = '', amount, date = '', mode = 'Cash', note = '', companyId = '' }) {
  const amt = Math.round(Number(amount) * 100) / 100
  if (!amt || amt <= 0) throw new Error('Amount must be positive')
  const cust = await db.customers.get(customerId)
  if (!cust) throw new Error('Customer not found')
  if (invoiceId) {
    const inv = await db.invoices.get(invoiceId)
    if (!inv) throw new Error('Invoice not found')
    if (inv.customerId !== customerId) throw new Error('Invoice does not belong to this customer')
  }
  const d = date || new Date().toISOString().slice(0, 10)
  const existing = await db.payments.where('customerId').equals(customerId).toArray()
  const dup = existing.find((p) =>
    p.invoiceId === invoiceId &&
    Math.round(Number(p.amount || 0) * 100) / 100 === amt &&
    String(p.date || '') === String(d) &&
    (p.mode || 'Cash') === mode)
  if (dup) throw new Error('Duplicate payment — same amount already recorded')
  const pay = { id: 'pay' + Date.now() + Math.random().toString(36).slice(2, 5), customerId, invoiceId, amount: amt, date: d, mode: PAYMENT_METHODS.includes(mode) ? mode : 'Other', note: note || '', companyId: companyId || '', createdAt: new Date().toISOString() }
  await db.payments.put(pay)
  await enqueue('payment', 'create', pay)
  return pay
}

export async function deletePayment(id) {
  const p = await db.payments.get(id)
  if (p) { await db.payments.delete(id); await enqueue('payment', 'delete', { id }) }
  return !!p
}
