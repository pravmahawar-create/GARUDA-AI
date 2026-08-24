import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { db, applyStockOp, getStockQty, getPhysicalStock, getStockLedger, recordStockOutForInvoice, findStockItem } from '../db.js'
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

test('STOCK LEDGER: create new inventory item through stock-in', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  const res = await applyStockOp({ name: 'JK Lakshmi Cement', qty: 4, unit: 'bag', operation: 'add', sourceType: 'unbilled_inward', gstStatus: 'unbilled' })
  assert.equal(res.nextQty, 4)
  const item = await db.items.get(res.item.id)
  assert.ok(item, 'item must exist')
  assert.equal(item.name, 'JK Lakshmi Cement')
  assert.equal(item.category, 'cement')
  const txs = await db.stockTransactions.where('itemId').equals(res.item.id).toArray()
  assert.equal(txs.length, 1)
  assert.equal(txs[0].sourceType, 'unbilled_inward')
  assert.equal(txs[0].gstStatus, 'unbilled')
  assert.equal(txs[0].quantity, 4)
})

test('STOCK LEDGER: add stock to existing item with supplier and invoice', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await db.items.put({ id: 'itm-acc', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 0 })
  await applyStockOp({ name: 'ACC Cement', qty: 500, unit: 'bag', operation: 'add', sourceType: 'purchase', supplierName: 'ABC Traders', invoiceNo: '123', gstStatus: 'gst', rate: 390, vehicleNo: 'MP20Z1234' })
  const phys = await getPhysicalStock('itm-acc')
  assert.equal(phys, 500)
  const ledger = await getStockLedger('itm-acc')
  assert.equal(ledger.length, 1)
  assert.equal(ledger[0].supplierName, 'ABC Traders')
  assert.equal(ledger[0].invoiceNo, '123')
  assert.equal(ledger[0].gstStatus, 'gst')
  assert.equal(ledger[0].vehicleNo, 'MP20Z1234')
  assert.equal(ledger[0].rate, 390)
})

test('STOCK LEDGER: unbilled inward does not mix with GST purchase', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await db.items.put({ id: 'itm-acc2', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 0 })
  await applyStockOp({ name: 'ACC Cement', qty: 500, unit: 'bag', operation: 'add', sourceType: 'purchase', supplierName: 'ABC Traders', invoiceNo: '123', gstStatus: 'gst' })
  await applyStockOp({ name: 'ACC Cement', qty: 100, unit: 'bag', operation: 'add', sourceType: 'unbilled_inward', gstStatus: 'unbilled' })
  const phys = await getPhysicalStock('itm-acc2')
  assert.equal(phys, 600)
  const ledger = await getStockLedger('itm-acc2')
  assert.equal(ledger.length, 2)
  assert.equal(ledger[0].gstStatus, 'gst')
  assert.equal(ledger[1].gstStatus, 'unbilled')
})

test('STOCK LEDGER: stock-out from bill creation', async () => {
  await db.items.clear(); await db.stockTransactions.clear(); await db.invoices.clear(); await db.customers.clear(); await db.companies.clear(); await db.settings.clear()
  await db.companies.put({ id: 'comp-1', name: 'Test Co', gstin: '', gstRate: 18, nextInvoiceNo: 1, nextKacchaNo: 1, templateId: 'classic', bankName: '', bankHolder: '', bankAccount: '', bankIfsc: '', upiId: '' })
  await db.settings.put({ key: 'activeCompanyId', value: 'comp-1' })
  await db.items.put({ id: 'itm-acc3', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 500 })
  await applyStockOp({ name: 'ACC Cement', qty: 500, unit: 'bag', operation: 'add', sourceType: 'purchase', supplierName: 'ABC Traders', invoiceNo: '123', gstStatus: 'gst' })
  const parsed = parseLocal('Ramesh ke naam 50 bag ACC cement 390 ke rate se bill bana do', [])
  const { invoice } = await executeCreateBill(parsed)
  assert.equal(invoice.items[0].qty, 50)
  const phys = await getPhysicalStock('itm-acc3')
  assert.equal(phys, 450)
  const ledger = await getStockLedger('itm-acc3')
  const outTx = ledger.find(t => t.movementType === 'stock_out')
  assert.ok(outTx, 'stock-out transaction must exist')
  assert.equal(outTx.quantity, 50)
  assert.equal(outTx.referenceId, invoice.id)
  assert.equal(outTx.invoiceNo, invoice.invoiceNo)
})

test('STOCK LEDGER: multiple stock-ins reconcile correctly', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await db.items.put({ id: 'itm-acc4', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 0 })
  await applyStockOp({ name: 'ACC Cement', qty: 100, unit: 'bag', operation: 'add', sourceType: 'purchase' })
  await applyStockOp({ name: 'ACC Cement', qty: 200, unit: 'bag', operation: 'add', sourceType: 'purchase' })
  await applyStockOp({ name: 'ACC Cement', qty: 50, unit: 'bag', operation: 'add', sourceType: 'unbilled_inward' })
  assert.equal(await getPhysicalStock('itm-acc4'), 350)
})

test('STOCK LEDGER: no duplicate transaction on one command', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await applyStockOp({ name: 'ACC Cement', qty: 50, unit: 'bag', operation: 'add' })
  const txs = await db.stockTransactions.where('itemName').equals('ACC Cement').toArray()
  assert.equal(txs.length, 1)
})

test('STOCK LEDGER: unknown item JK Lakshmi Cement creates proper inventory item', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  const res = await applyStockOp({ name: 'JK Lakshmi Cement', qty: 4, unit: 'bag', operation: 'add', sourceType: 'unbilled_inward', gstStatus: 'unbilled' })
  assert.ok(res.item)
  assert.equal(res.item.name, 'JK Lakshmi Cement')
  assert.equal(res.item.category, 'cement')
  assert.equal(res.item.unit, 'bag')
  assert.equal(res.nextQty, 4)
  const phys = await getPhysicalStock(res.item.id)
  assert.equal(phys, 4)
})

test('STOCK LEDGER: consecutive stock sessions do not leak state', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  const r1 = await applyStockOp({ name: 'ACC Cement', qty: 50, unit: 'bag', operation: 'add', sourceType: 'purchase' })
  assert.equal(await getPhysicalStock(r1.item.id), 50)
  const r2 = await applyStockOp({ name: 'ACC Cement', qty: 20, unit: 'bag', operation: 'subtract', sourceType: 'sale' })
  assert.equal(await getPhysicalStock(r2.item.id), 30)
  const r3 = await applyStockOp({ name: 'ACC Cement', qty: 10, unit: 'bag', operation: 'add', sourceType: 'purchase' })
  assert.equal(await getPhysicalStock(r3.item.id), 40)
})

test('STOCK IDENTITY: ACC Cement / Cement - ACC aliases resolve to same record', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await db.items.put({ id: 'itm-acc', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 550 })
  await db.items.put({ id: 'itm-ca', name: 'Cement - ACC', unit: 'bag', rate: 390, category: 'cement', qty: 0 })
  const byAcc = await findStockItem('ACC Cement')
  const byCementAcc = await findStockItem('Cement - ACC')
  assert.ok(byAcc, 'ACC Cement must resolve')
  assert.ok(byCementAcc, 'Cement - ACC must resolve')
  assert.equal(byAcc.id, byCementAcc.id, 'both aliases must map to same item id')
  assert.equal(byAcc.id, 'itm-acc')
})

test('STOCK IDENTITY: voice add and UI stock query resolve same record', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await db.items.put({ id: 'itm-ui', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 550 })
  const uiItem = await findStockItem('ACC Cement')
  assert.equal(uiItem.id, 'itm-ui')
  const parsed = parseLocal('20 bag ACC Cement stock mein add karo', [])
  assert.equal(parsed.intent, 'stock_entry')
  assert.equal(parsed.operation, 'add')
  const res = await applyStockOp({ name: parsed.items[0].name, qty: parsed.items[0].qty, unit: parsed.items[0].unit, operation: 'add' })
  assert.equal(res.item.id, 'itm-ui', 'voice add must update same record UI sees')
  assert.equal(await getStockQty('ACC Cement'), 570)
})

test('STOCK IDENTITY: subtract updates same record UI sees', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await db.items.put({ id: 'itm-sub', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 570 })
  const parsed = parseLocal('ACC Cement mein se 20 bori minus karo', [])
  assert.equal(parsed.intent, 'stock_entry')
  assert.equal(parsed.operation, 'subtract')
  const res = await applyStockOp({ name: parsed.items[0].name, qty: parsed.items[0].qty, unit: parsed.items[0].unit, operation: 'subtract' })
  assert.equal(res.item.id, 'itm-sub', 'voice subtract must update same record UI sees')
  assert.equal(res.nextQty, 550, 'subtract 20 from 570 must give 550')
  assert.equal(await getStockQty('ACC Cement'), 550)
})

test('STOCK IDENTITY: voice query returns same qty as UI', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await db.items.put({ id: 'itm-q2', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 550 })
  const uiQty = await getStockQty('ACC Cement')
  const parsed = parseLocal('एसीसी सीमेंट का स्टॉक कितना है', [])
  assert.equal(parsed.intent, 'stock_query')
  const voiceItem = await findStockItem(parsed.items[0]?.name || 'ACC Cement')
  const voiceQty = voiceItem ? await getStockQty(voiceItem.name) : 0
  assert.equal(voiceQty, uiQty, 'voice query qty must match UI qty')
})

test('STOCK IDENTITY: insufficient stock does not go negative', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await db.items.put({ id: 'itm-neg', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 10 })
  const res = await applyStockOp({ name: 'ACC Cement', qty: 20, unit: 'bag', operation: 'subtract' })
  assert.equal(res.nextQty, 0, 'subtract beyond stock must floor at 0')
})

test('STOCK IDENTITY: unrelated products remain unaffected', async () => {
  await db.items.clear(); await db.stockTransactions.clear()
  await db.items.put({ id: 'itm-ultra', name: 'Cement - UltraTech', unit: 'bag', rate: 395, category: 'cement', qty: 100 })
  await db.items.put({ id: 'itm-acc', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 550 })
  const res = await applyStockOp({ name: 'ACC Cement', qty: 20, unit: 'bag', operation: 'subtract' })
  assert.equal(res.item.id, 'itm-acc')
  assert.equal(await getStockQty('Cement - UltraTech'), 100, 'UltraTech must be unaffected')
  assert.equal(await getStockQty('ACC Cement'), 530)
})

test('STOCK DEDUCTION: bill creation deducts stock via canonical item id', async () => {
  await db.items.clear(); await db.stockTransactions.clear(); await db.invoices.clear(); await db.customers.clear(); await db.companies.clear(); await db.settings.clear()
  await db.companies.put({ id: 'comp-1', name: 'Test Co', gstin: '', gstRate: 18, nextInvoiceNo: 1, nextKacchaNo: 1, templateId: 'classic', bankName: '', bankHolder: '', bankAccount: '', bankIfsc: '', upiId: '' })
  await db.settings.put({ key: 'activeCompanyId', value: 'comp-1' })
  await db.items.put({ id: 'itm-bd', name: 'ACC Cement', unit: 'bag', rate: 390, category: 'cement', qty: 500 })
  const parsed = parseLocal('Ramesh ke naam 50 bag ACC cement 390 ke rate se bill bana do', [])
  const { invoice } = await executeCreateBill(parsed)
  assert.equal(invoice.items[0].qty, 50)
  const after = await db.items.get('itm-bd')
  assert.equal(after.qty, 450, 'bill must deduct from same canonical item')
})
