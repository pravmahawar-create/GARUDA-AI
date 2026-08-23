import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildInvoicePdf, buildKhataPdf } from './pdf.js'
import { TEMPLATES } from './templates.js'

const base = {
  invoiceNo: '0001',
  date: '2026-08-20',
  customerName: 'Ramesh',
  templateId: 'classic',
  billType: 'gst',
  status: 'saved',
  items: [{ name: 'Cement', hsn: '2523', qty: 50, unit: 'bag', rate: 390, amount: 19500 }],
  totals: { subtotal: 19500, discount: 0, gstRate: 18, cgst: 1755, sgst: 1755, igst: 0, freight: 0, loading: 0, unloading: 0, grandTotal: 23010, billType: 'gst', mode: 'intra' },
  transport: {}
}
const company = { name: 'A.K TRADING COMPANY', gstin: '23AABCA0000A1Z5', address: 'Bhopal', phone: '', upiId: 'aktrading@upi', bankHolder: 'A.K Trading', bankName: 'SBI', bankAccount: '123456', bankIfsc: 'SBIN000' }
const customer = { name: 'Ramesh', mobile: '9826000000' }

test('buildInvoicePdf produces a valid PDF (classic)', async () => {
  const bytes = await buildInvoicePdf(base, company, customer, 'classic')
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-')
})

test('all 5 templates produce valid PDFs (GST mode)', async () => {
  for (const t of TEMPLATES) {
    const bytes = await buildInvoicePdf(base, company, customer, t.id)
    assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-', t.id + ' failed')
  }
})

test('all 5 templates produce valid PDFs (kaccha mode, with UPI QR)', async () => {
  for (const t of TEMPLATES) {
    const inv = { ...base, billType: 'kaccha', invoiceNo: '0001', totals: { ...base.totals, gstRate: 0, cgst: 0, sgst: 0, igst: 0, gst: 0, grandTotal: 19500, billType: 'kaccha' } }
    const bytes = await buildInvoicePdf(inv, company, customer, t.id)
    assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-', t.id + ' kaccha failed')
  }
})

test('cancelled invoice renders a watermark page', async () => {
  const bytes = await buildInvoicePdf({ ...base, status: 'cancelled' }, company, customer, 'classic')
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-')
})

test('multi-page invoice works across templates', async () => {
  const items = []
  for (let i = 0; i < 40; i++) items.push({ name: 'Item ' + i, hsn: '7214', qty: 1, unit: 'kg', rate: 10, amount: 10 })
  const inv = { ...base, items, totals: { ...base.totals, subtotal: 400, grandTotal: 472, cgst: 36, sgst: 36, igst: 0 } }
  for (const t of TEMPLATES) {
    const bytes = await buildInvoicePdf(inv, company, customer, t.id)
    assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-', t.id + ' multi failed')
  }
})

test('buildKhataPdf ledger renders', async () => {
  const invoices = [
    { id: 'a', invoiceNo: '0001', date: '2026-08-01', billType: 'gst', totals: { grandTotal: 1000 } },
    { id: 'b', invoiceNo: '0001', date: '2026-08-05', billType: 'kaccha', totals: { grandTotal: 500 } }
  ]
  const payments = [{ id: 'p', date: '2026-08-06', mode: 'UPI', amount: 600 }]
  const bytes = await buildKhataPdf(customer, invoices, payments, company)
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-')
})