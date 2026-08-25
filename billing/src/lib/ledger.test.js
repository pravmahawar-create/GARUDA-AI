import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { db } from '../db.js'
import { getLedger, customerOutstanding, recordPayment, deletePayment, getLastPayment, getTotalPaid, getCustomerPayments } from './ledger.js'

before(async () => {
  try { await db.delete() } catch (e) {}
  await db.open()
})

after(async () => {
  try { await db.close() } catch (e) {}
})

async function seed() {
  await db.customers.clear(); await db.invoices.clear(); await db.payments.clear()
  const cust = { id: 'c1', name: 'Vijay Singh', mobile: '', gstin: '', billType: 'kaccha' }
  await db.customers.put(cust)
  const bill = (id, total) => ({ id, invoiceNo: id, customerId: 'c1', customerName: 'Vijay Singh', date: '2026-08-01', billType: 'kaccha', items: [{ name: 'Cement', qty: 1, unit: 'bag', rate: total }], totals: { grandTotal: total }, createdAt: new Date().toISOString() })
  await db.invoices.bulkPut([bill('0001', 100000), bill('0002', 50000)])
  return { cust }
}

test('outstanding: bill increases outstanding', async () => {
  await seed()
  assert.equal(await customerOutstanding('c1'), 150000)
})

test('outstanding: full payment clears outstanding', async () => {
  await seed()
  await recordPayment({ customerId: 'c1', amount: 150000, mode: 'Cash' })
  assert.equal(await customerOutstanding('c1'), 0)
})

test('outstanding: partial payment reduces outstanding', async () => {
  await seed()
  await recordPayment({ customerId: 'c1', amount: 30000, mode: 'Cash' })
  assert.equal(await customerOutstanding('c1'), 120000)
})

test('outstanding: multiple payments accumulate correctly', async () => {
  await seed()
  await recordPayment({ customerId: 'c1', amount: 20000, mode: 'Cash' })
  await recordPayment({ customerId: 'c1', amount: 30000, mode: 'UPI' })
  assert.equal(await customerOutstanding('c1'), 100000)
})

test('payments: history preserved as independent records', async () => {
  await seed()
  const p1 = await recordPayment({ customerId: 'c1', amount: 20000, mode: 'Cash' })
  const p2 = await recordPayment({ customerId: 'c1', amount: 30000, mode: 'UPI' })
  const all = await getCustomerPayments('c1')
  assert.equal(all.length, 2)
  assert.ok(all.some((p) => p.id === p1.id && p.amount === 20000))
  assert.ok(all.some((p) => p.id === p2.id && p.amount === 30000 && p.mode === 'UPI'))
  assert.equal(await getTotalPaid('c1'), 50000)
})

test('ledger: running balance is correct', async () => {
  await seed()
  await recordPayment({ customerId: 'c1', amount: 20000, mode: 'Cash' })
  await recordPayment({ customerId: 'c1', amount: 30000, mode: 'Cash' })
  const rows = await getLedger('c1')
  const bills = rows.filter((r) => r.type === 'bill')
  const pays = rows.filter((r) => r.type === 'payment')
  assert.equal(bills.length, 2)
  assert.equal(pays.length, 2)
  assert.equal(rows[rows.length - 1].balance, 100000)
})

test('payment: unknown customer rejected', async () => {
  await assert.rejects(() => recordPayment({ customerId: 'nope', amount: 100 }), /Customer not found/)
})

test('payment: amount must be positive', async () => {
  await seed()
  await assert.rejects(() => recordPayment({ customerId: 'c1', amount: 0 }), /positive/)
  await assert.rejects(() => recordPayment({ customerId: 'c1', amount: -5 }), /positive/)
})

test('payment: invoice/customer mismatch rejected', async () => {
  await seed()
  await db.customers.put({ id: 'c2', name: 'Other' })
  await assert.rejects(() => recordPayment({ customerId: 'c2', invoiceId: '0001', amount: 100 }), /does not belong/)
})

test('payment: duplicate payment rejected', async () => {
  await seed()
  await recordPayment({ customerId: 'c1', amount: 10000, mode: 'Cash' })
  await assert.rejects(() => recordPayment({ customerId: 'c1', amount: 10000, mode: 'Cash' }), /Duplicate/)
})

test('payment: cash/upi/bank methods recorded', async () => {
  await seed()
  await recordPayment({ customerId: 'c1', amount: 100, mode: 'Cash' })
  await recordPayment({ customerId: 'c1', amount: 200, mode: 'UPI' })
  await recordPayment({ customerId: 'c1', amount: 300, mode: 'Bank Transfer' })
  const all = await getCustomerPayments('c1')
  assert.ok(all.some((p) => p.mode === 'Cash'))
  assert.ok(all.some((p) => p.mode === 'UPI'))
  assert.ok(all.some((p) => p.mode === 'Bank Transfer'))
})

test('payment: invoice-specific payment resolves correct invoice', async () => {
  await seed()
  const p = await recordPayment({ customerId: 'c1', invoiceId: '0001', amount: 20000, mode: 'Cash' })
  assert.equal(p.invoiceId, '0001')
  const rows = await getLedger('c1')
  assert.ok(rows.some((r) => r.type === 'payment' && r.payment.invoiceId === '0001'))
})

test('payment: deletePayment removes without corrupting balance', async () => {
  await seed()
  const p = await recordPayment({ customerId: 'c1', amount: 20000, mode: 'Cash' })
  assert.equal(await customerOutstanding('c1'), 130000)
  await deletePayment(p.id)
  assert.equal(await customerOutstanding('c1'), 150000)
})

test('payment: last payment returned', async () => {
  await seed()
  await recordPayment({ customerId: 'c1', amount: 20000, mode: 'Cash' })
  const lp = await getLastPayment('c1')
  assert.equal(lp.amount, 20000)
})
