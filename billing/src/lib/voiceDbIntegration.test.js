import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { db } from '../db.js'
import { parseLocal } from './voice.js'
import { executeCreateBill } from './voiceExecutor.js'
import { applyStockOp, getStockQty } from '../db.js'

before(async () => {
  try { await db.delete() } catch (e) {}
  await db.open()
  // seed a realistic company as on phone
  await db.companies.clear()
  await db.customers.clear()
  await db.invoices.clear()
  await db.items.clear()
  await db.settings.clear()
  await db.companies.put({ id: 'comp-1', name: 'A.K TRADING COMPANY', gstin: '', gstRate: 18, nextInvoiceNo: 5, nextKacchaNo: 3, templateId: 'classic', bankName: '', bankHolder: '', bankAccount: '', bankIfsc: '', upiId: '' })
  await db.settings.put({ key: 'activeCompanyId', value: 'comp-1' })
  await db.settings.put({ key: 'kacchaMode', value: true })
})

after(async () => { try { await db.close() } catch (e) {} })

test('BILL: Ramesh ke naam 50 bag ACC cement 390 ke rate se bill → invoice visible in InvoicesScreen filter', async () => {
  const before = await db.invoices.count()
  const parsed = parseLocal('Ramesh ke naam 50 bag ACC cement 390 ke rate se bill bana do', [])
  assert.equal(parsed.intent, 'create_bill')
  assert.equal(parsed.missing.length, 0)
  const { invoice } = await executeCreateBill(parsed)
  assert.equal(invoice.customerName, 'Ramesh')
  assert.equal(invoice.items[0].qty, 50)
  assert.equal(invoice.items[0].rate, 390)
  assert.ok(invoice.invoiceNo)
  const after = await db.invoices.count()
  assert.equal(after, before + 1)
  // simulate InvoicesScreen filter: matches + kacchaMode true
  const list = await db.invoices.orderBy('createdAt').reverse().toArray()
  const shown = list.filter((i) => i.companyId === 'comp-1' || !i.companyId).filter((i) => true || i.billType !== 'kaccha')
  assert.ok(shown.some((i) => i.id === invoice.id), 'invoice must be visible in InvoicesScreen')
})

test('STOCK: 50 bag ACC cement stock mein add karo → qty mutated', async () => {
  await db.items.clear()
  await db.items.put({ id: 'itm-acc', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', hsn: '2523', qty: 10 })
  const parsed = parseLocal('50 bag ACC cement stock mein add karo', [])
  assert.equal(parsed.intent, 'stock_entry')
  assert.equal(parsed.operation, 'add')
  let total = 0
  for (const it of parsed.items) {
    const res = await applyStockOp({ name: it.name, qty: it.qty, unit: it.unit, operation: parsed.operation })
    total = res.nextQty
  }
  assert.equal(await getStockQty('ACC Cement'), 60)
  assert.equal(total, 60)
})

test('STOCK query returns updated quantity', async () => {
  await db.items.clear()
  await db.items.put({ id: 'itm-q', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 77 })
  const q = parseLocal('ACC cement ka stock kitna hai?', [])
  assert.equal(q.intent, 'stock_query')
  assert.equal(await getStockQty('ACC Cement'), 77)
})

test('STOCK multi-item: MP20AB1234 se 50 bag ACC cement aur 2 ton TMT steel aaya hai', async () => {
  await db.items.clear()
  const p = parseLocal('MP20AB1234 se 50 bag ACC cement aur 2 ton TMT steel aaya hai', [])
  assert.equal(p.intent, 'stock_entry')
  assert.equal(p.items.length, 2)
  for (const it of p.items) await applyStockOp({ name: it.name, qty: it.qty, unit: it.unit, operation: 'add' })
  assert.equal(await getStockQty('ACC Cement'), 50)
  assert.equal(await getStockQty('TMT Steel'), 2)
  assert.equal(p.vehicleNo, 'MP20AB1234')
})

test('CONSECUTIVE BILL SESSIONS: two voice bills in a row both persist', async () => {
  await db.invoices.clear()
  await db.customers.clear()
  await db.companies.put({ id: 'comp-1', name: 'A.K TRADING COMPANY', gstin: '', gstRate: 18, nextInvoiceNo: 1, nextKacchaNo: 1, templateId: 'classic', bankName: '', bankHolder: '', bankAccount: '', bankIfsc: '', upiId: '' })
  // session 1
  const p1 = parseLocal('Ramesh ke naam 50 bag ACC cement 390 ke rate se bill bana do', [])
  const r1 = await executeCreateBill(p1)
  const check1 = await db.invoices.get(r1.invoice.id)
  assert.ok(check1, 'session 1 invoice must be readable')
  // simulate modal cleanup between sessions
  // session 2 — must not be poisoned by session 1
  const p2 = parseLocal('Suresh ke naam 20 bag ACC cement 420 ke rate se bill bana do', [])
  const r2 = await executeCreateBill(p2)
  const check2 = await db.invoices.get(r2.invoice.id)
  assert.ok(check2, 'session 2 invoice must be readable')
  assert.notEqual(r1.invoice.id, r2.invoice.id)
  assert.equal(await db.invoices.count(), 2)
})

test('CONSECUTIVE STOCK SESSIONS: add then query returns persisted qty', async () => {
  await db.items.clear()
  await db.items.put({ id: 'itm-acc', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 10 })
  // session 1: add
  const p1 = parseLocal('50 bag ACC cement stock mein add karo', [])
  for (const it of p1.items) await applyStockOp({ name: it.name, qty: it.qty, unit: it.unit, operation: p1.operation })
  assert.equal(await getStockQty('ACC Cement'), 60)
  // session 2: query must return 60
  const q = parseLocal('ACC cement ka stock kitna hai?', [])
  assert.equal(q.intent, 'stock_query')
  assert.equal(await getStockQty('ACC Cement'), 60)
  // session 3: minus
  const p3 = parseLocal('20 bag ACC cement minus karo', [])
  assert.equal(p3.operation, 'subtract')
  for (const it of p3.items) await applyStockOp({ name: it.name, qty: it.qty, unit: it.unit, operation: p3.operation })
  assert.equal(await getStockQty('ACC Cement'), 40)
})
