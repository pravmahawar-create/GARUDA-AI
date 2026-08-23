import { test } from 'node:test'
import assert from 'node:assert/strict'
import { upiUrl, bankLines } from './upi.js'

const company = { upiId: 'aktrading@upi', name: 'A.K TRADING', bankHolder: 'A.K Trading' }

test('upiUrl builds UPI deep link with amount + ref', () => {
  const url = upiUrl(company, 23010.5, 'INV-0001')
  assert.ok(url.startsWith('upi://pay?'))
  assert.ok(decodeURIComponent(url).includes('pa=aktrading@upi'))
  assert.ok(url.includes('am=23010.50'))
  assert.ok(url.includes('cu=INR'))
  assert.ok(url.includes('tn=' + encodeURIComponent('INV-0001')))
})

test('upiUrl returns null without upi id', () => {
  assert.equal(upiUrl({}, 100), null)
})

test('bankLines flattens bank details', () => {
  const lines = bankLines({ bankHolder: 'A.K', bankName: 'SBI', bankAccount: '123456', bankIfsc: 'SBIN000' })
  assert.equal(lines.length, 4)
  assert.equal(lines[3][0], 'SBIN000')
  assert.equal(bankLines({}).length, 0)
})