import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGstr1Csv, buildGstSummaryCsv, toCsv } from './csv.js'

const company = { gstin: '23AABCA0000A1Z5', name: 'A.K TRADING' }
const gstInvoice = {
  invoiceNo: '0001', date: '2026-08-20', billType: 'gst',
  totals: { taxable: 1000, cgst: 90, sgst: 90, igst: 0, grandTotal: 1180, mode: 'intra' }
}
const interInvoice = {
  invoiceNo: '0002', date: '2026-08-21', billType: 'gst',
  totals: { taxable: 2000, cgst: 0, sgst: 0, igst: 360, grandTotal: 2360, mode: 'inter' }
}
const kacchaInvoice = {
  invoiceNo: '0001', date: '2026-08-22', billType: 'kaccha',
  totals: { taxable: 5000, cgst: 0, sgst: 0, igst: 0, grandTotal: 5000, mode: 'intra' }
}

test('GSTR-1 CSV excludes kaccha bills', () => {
  const csv = buildGstr1Csv([gstInvoice, interInvoice, kacchaInvoice], company)
  assert.ok(csv.startsWith('GSTIN'))
  assert.ok(csv.includes('23AABCA0000A1Z5'))
  assert.ok(csv.includes('0001') && csv.includes('0002'))
  const lines = csv.split('\n')
  assert.equal(lines.length, 3, 'header + 2 GST bills only (kaccha excluded)')
})

test('GST summary CSV rows', () => {
  const months = [
    { month: '2026-08', count: 2, taxable: 3000, cgst: 90, sgst: 90, igst: 360, total: 540, change: null },
    { month: '2026-07', count: 1, taxable: 1000, cgst: 90, sgst: 90, igst: 0, total: 180, change: 200 }
  ]
  const csv = buildGstSummaryCsv(months)
  assert.ok(csv.includes('2026-08'))
  assert.ok(csv.includes('200.0'))
})

test('csv escaping', () => {
  assert.equal(toCsv(['a', 'b'], [['x,y', 'z"w']]), 'a,b\n"x,y","z""w"')
})