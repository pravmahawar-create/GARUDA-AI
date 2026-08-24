import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateBillText, generateBillShareMessage, generateBillEmailSubject } from './share.js'

const invoice = {
  invoiceNo: '0004',
  customerName: 'Ramesh',
  date: '2026-08-25',
  billType: 'gst',
  items: [
    { name: 'ACC Cement', qty: 50, unit: 'bag', rate: 390, amount: 19500 }
  ],
  totals: { grandTotal: 19500, subtotal: 19500, gstRate: 18, cgst: 1755, sgst: 1755 }
}

const company = { name: 'My Business', gstin: '' }

test('share: generateBillText includes customer, bill no, items, total', () => {
  const t = generateBillText(invoice)
  assert.ok(t.includes('Ramesh'))
  assert.ok(t.includes('0004'))
  assert.ok(t.includes('ACC Cement'))
  assert.ok(t.includes('50 bag'))
  assert.ok(t.includes('₹19,500'))
})

test('share: generateBillText works without invoice (graceful)', () => {
  const t = generateBillText(null)
  assert.equal(typeof t, 'string')
})

test('share: generateBillShareMessage pre-fills polite Hindi message with total', () => {
  const m = generateBillShareMessage(invoice, company)
  assert.ok(m.includes('Namaste Ramesh ji'))
  assert.ok(m.includes('₹19,500'))
  assert.ok(m.includes('My Business'))
})

test('share: generateBillEmailSubject contains customer and total', () => {
  const s = generateBillEmailSubject(invoice)
  assert.ok(s.includes('Ramesh'))
  assert.ok(s.includes('₹19,500'))
})
