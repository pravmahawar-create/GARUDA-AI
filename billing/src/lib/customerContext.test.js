import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { db } from '../db.js'
import { findCustomerByRef, getCustomerHistory, getCustomerSummary } from './customerContext.js'

before(async () => {
  try { await db.delete() } catch (e) {}
  await db.open()
})

after(async () => {
  try { await db.close() } catch (e) {}
})

async function seed() {
  await db.customers.clear(); await db.invoices.clear(); await db.payments.clear()
  const vijay = { id: 'c-vijay', name: 'Vijay Singh', mobile: '', gstin: '23ABCDE1234F1Z5', billType: 'gst', createdAt: new Date().toISOString() }
  const rakesh = { id: 'c-rakesh', name: 'Rakesh Traders', mobile: '', gstin: '', billType: 'kaccha', createdAt: new Date().toISOString() }
  await db.customers.bulkPut([vijay, rakesh])
  const t = (i) => ({ id: 'inv' + i, invoiceNo: '00' + i, customerId: vijay.id, customerName: vijay.name, date: '2026-08-0' + (i + 1), billType: 'gst', items: [{ name: 'TMT Steel', qty: 100, unit: 'kg', rate: 58 }], totals: { grandTotal: 5800 }, createdAt: new Date().toISOString() })
  await db.invoices.bulkPut([t(1), t(2)])
  await db.payments.put({ id: 'pay1', customerId: vijay.id, amount: 2000, date: '2026-08-05', createdAt: new Date().toISOString() })
  return { vijay, rakesh }
}

test('customerContext: exact name match', async () => {
  const { vijay } = await seed()
  const res = await findCustomerByRef(null, 'Vijay Singh')
  assert.equal(res.customer.id, vijay.id)
  assert.equal(res.ambiguous.length, 0)
})

test('customerContext: unique partial name match', async () => {
  const { rakesh } = await seed()
  const res = await findCustomerByRef(null, 'Rakesh Traders')
  assert.equal(res.customer.id, rakesh.id)
})

test('customerContext: ambiguous partial name', async () => {
  await seed()
  await db.customers.put({ id: 'c-vijay2', name: 'Vijay Traders', mobile: '', gstin: '', billType: 'kaccha' })
  const res = await findCustomerByRef(null, 'Vijay')
  assert.equal(res.customer, null)
  assert.ok(res.ambiguous.length >= 2)
})

test('customerContext: no match returns null without fabrication', async () => {
  await seed()
  const res = await findCustomerByRef(null, 'Sunil Kumar')
  assert.equal(res.customer, null)
  assert.equal(res.ambiguous.length, 0)
})

test('customerContext: history returns recent bills, items, rates, bill type, saved gstin', async () => {
  const { vijay } = await seed()
  const h = await getCustomerHistory(vijay.id)
  assert.equal(h.savedGstin, '23ABCDE1234F1Z5')
  assert.equal(h.recentBills.length, 2)
  assert.equal(h.recentItems.length, 1)
  assert.equal(h.recentItems[0].name, 'TMT Steel')
  assert.equal(h.recentRates[0].rate, 58)
  assert.ok(h.recentBillTypes.includes('gst'))
  assert.equal(h.totals.sales, 11600)
  assert.equal(h.totals.payments, 2000)
  assert.equal(h.totals.outstanding, 9600)
})

test('customerContext: empty customer has no fabricated history', async () => {
  const { rakesh } = await seed()
  const h = await getCustomerHistory(rakesh.id)
  assert.equal(h.recentBills.length, 0)
  assert.equal(h.recentItems.length, 0)
  assert.equal(h.recentRates.length, 0)
  assert.equal(h.totals.bills, 0)
})

test('customerContext: summary matches history totals', async () => {
  const { vijay } = await seed()
  const s = await getCustomerSummary(vijay.id)
  assert.equal(s.bills, 2)
  assert.equal(s.outstanding, 9600)
})
