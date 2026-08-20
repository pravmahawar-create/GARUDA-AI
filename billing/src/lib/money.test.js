import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcBill, inr, amountInWords } from './money.js'

test('calcBill: cement + steel with 18% GST', () => {
  const items = [
    { name: 'Cement', qty: 50, rate: 390, unit: 'bag' },
    { name: 'TMT', qty: 2, rate: 58000, unit: 'ton' }
  ]
  const t = calcBill(items, { gstRate: 18 })
  assert.equal(t.subtotal, 135500)
  assert.equal(t.gst, 24390)
  assert.equal(t.cgst, 12195)
  assert.equal(t.sgst, 12195)
  assert.equal(t.grandTotal, 159890)
})

test('calcBill: zero qty lines ignored', () => {
  const items = [
    { name: 'A', qty: 0, rate: 100 },
    { name: 'B', qty: 3, rate: 10 }
  ]
  const t = calcBill(items, { gstRate: 18 })
  assert.equal(t.subtotal, 30)
  assert.equal(t.grandTotal, 35.4)
})

test('calcBill: transport charges added on top', () => {
  const t = calcBill([{ name: 'A', qty: 1, rate: 100 }], {
    gstRate: 18,
    transport: { freight: 2500, loading: 200, unloading: 100 }
  })
  assert.equal(t.subtotal, 100)
  assert.equal(t.grandTotal, 100 + 18 + 2500 + 200 + 100)
})

test('calcBill: discount reduces taxable', () => {
  const t = calcBill([{ name: 'A', qty: 10, rate: 100 }], { gstRate: 18, discount: 50 })
  assert.equal(t.subtotal, 1000)
  assert.equal(t.taxable, 950)
  assert.equal(t.grandTotal, 1121)
})

test('inr: Indian grouping', () => {
  assert.equal(inr(159890), '1,59,890')
  assert.equal(inr(1000000), '10,00,000')
})

test('amountInWords', () => {
  assert.equal(amountInWords(0), 'Zero Rupees Only')
  assert.equal(amountInWords(135500), 'one lakh thirty five thousand five hundred Rupees Only')
  assert.equal(amountInWords(35.4), 'thirty five Rupees and forty Paise Only')
})