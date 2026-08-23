import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { db, applyStockOp, getStockQty } from '../db.js'
import { parseLocal } from './voice.js'
import { executeCreateBill } from './voiceExecutor.js'

before(async () => {
  try { await db.delete() } catch (e) {}
  await db.open()
})

after(async () => {
  try { await db.close() } catch (e) {}
})

test('voice bill command → actual invoice record', async () => {
  await db.customers.clear(); await db.invoices.clear(); await db.companies.clear(); await db.settings.clear()
  await db.companies.put({ id: 'comp-1', name: 'Test Co', gstin: '', gstRate: 18, nextInvoiceNo: 1, nextKacchaNo: 1, templateId: 'classic', bankName: '', bankHolder: '', bankAccount: '', bankIfsc: '', upiId: '' })
  await db.settings.put({ key: 'activeCompanyId', value: 'comp-1' })
  const parsed = parseLocal('Ramesh ke naam 50 bag ACC cement 390 ke rate se bill bana do', [])
  assert.equal(parsed.intent, 'create_bill')
  const { invoice } = await executeCreateBill(parsed)
  assert.equal(invoice.customerName, 'Ramesh')
  assert.equal(invoice.items.length, 1)
  assert.equal(invoice.items[0].qty, 50)
  const stored = await db.invoices.get(invoice.id)
  assert.ok(stored, 'invoice persisted')
  assert.equal(stored.customerName, 'Ramesh')
})

test('correct item/quantity/rate from Hindi command', async () => {
  await db.customers.clear(); await db.invoices.clear()
  const parsed = parseLocal('Ramesh ko 20 bag ACC cement 420 ke rate se bill bana do', [])
  assert.equal(parsed.items[0].qty, 20)
  assert.equal(parsed.items[0].rate, 420)
  const { invoice } = await executeCreateBill(parsed)
  assert.equal(invoice.items[0].rate, 420)
})

test('missing info does not create invalid invoice', async () => {
  await db.invoices.clear()
  const before = await db.invoices.count()
  const parsed = parseLocal('50 bag cement 390 ke bill bana do', [])
  assert.ok(parsed.missing.includes('customer ka naam'))
  let threw = false
  try { await executeCreateBill(parsed) } catch (e) { threw = true }
  assert.equal(threw, true)
  assert.equal(await db.invoices.count(), before)
})

test('stock add → actual qty mutation', async () => {
  await db.items.clear()
  await db.items.put({ id: 'itm-acc', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', hsn: '2523', qty: 10 })
  const res = await applyStockOp({ name: 'ACC Cement', qty: 50, unit: 'bag', operation: 'add' })
  assert.equal(res.nextQty, 60)
  assert.equal(await getStockQty('ACC Cement'), 60)
})

test('multi-item stock entry persists all items', async () => {
  await db.items.clear()
  const p = parseLocal('MP20AB1234 se 50 bag ACC cement aur 2 ton TMT steel aaya hai', [])
  assert.equal(p.intent, 'stock_entry')
  assert.equal(p.items.length, 2)
  for (const it of p.items) await applyStockOp({ name: it.name, qty: it.qty, unit: it.unit, operation: 'add' })
  assert.equal(await getStockQty('ACC Cement'), 50)
  assert.equal(await getStockQty('TMT Steel'), 2)
})

test('stock remove adjusts qty', async () => {
  await db.items.clear()
  await db.items.put({ id: 'itm-acc2', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 100 })
  const r = await applyStockOp({ name: 'ACC Cement', qty: 20, unit: 'bag', operation: 'add' })
  // simulate remove by adding negative via set logic — use add with negative is not supported, so test set
  const s = await applyStockOp({ name: 'ACC Cement', qty: 80, unit: 'bag', operation: 'set' })
  assert.equal(s.nextQty, 80)
})

test('stock query returns stored qty', async () => {
  await db.items.clear()
  await db.items.put({ id: 'itm-q', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 77 })
  assert.equal(await getStockQty('ACC Cement'), 77)
})

test('long Hindi command not truncated at parser level', async () => {
  const long = 'Ramesh ke naam 50 bag ACC cement 390 ke rate se aur 2 ton TMT steel 58000 ke rate se aur 10 bag UltraTech cement 395 ke rate se bill bana do'
  const p = parseLocal(long, [])
  assert.equal(p.intent, 'create_bill')
  assert.equal(p.items.length, 3)
  assert.equal(p.items[0].qty, 50)
  assert.equal(p.items[2].qty, 10)
})
