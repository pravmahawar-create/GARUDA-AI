import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildInvoicePdf } from './pdf.js'

const base = {
  invoiceNo: 1001,
  date: '2026-08-20',
  customerName: 'Ramesh',
  items: [{ name: 'Cement', hsn: '2523', qty: 50, unit: 'bag', rate: 390, amount: 19500 }],
  totals: { subtotal: 19500, discount: 0, gstRate: 18, cgst: 1755, sgst: 1755, freight: 0, loading: 0, unloading: 0, grandTotal: 23010 },
  transport: {}
}
const customer = { name: 'Ramesh', mobile: '9826000000' }
const settings = { shopName: 'Sharma Loha & Cement', shopGstin: '23ABCPM1234F1Z2', shopAddress: 'Bhopal', shopPhone: '' }

test('buildInvoicePdf produces a valid PDF', async () => {
  const bytes = await buildInvoicePdf(base, settings, customer)
  assert.ok(bytes.length > 500)
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-')
})

test('buildInvoicePdf handles multi-page invoices (no crash)', async () => {
  const items = []
  for (let i = 0; i < 40; i++) items.push({ name: 'Item ' + i, hsn: '7214', qty: 1, unit: 'kg', rate: 10, amount: 10 })
  const inv = { ...base, items, totals: { ...base.totals, subtotal: 400, grandTotal: 472, cgst: 36, sgst: 36 } }
  const bytes = await buildInvoicePdf(inv, settings, customer)
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-')
})