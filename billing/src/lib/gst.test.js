import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateGstin, gstStateCode, gstinCheckChar } from './gst.js'

test('valid GSTINs pass checksum', () => {
  assert.equal(validateGstin('27AAPFU0939F1ZV'), true)
  assert.equal(validateGstin('09AAACT2727Q1ZU'), true)
  assert.equal(validateGstin('27AAAAA0000A1Z5'), false)
})

test('invalid GSTINs fail', () => {
  assert.equal(validateGstin(''), false)
  assert.equal(validateGstin('12345'), false)
  assert.equal(validateGstin('09AAACT2727Q1ZA'), false)
  assert.equal(validateGstin('27AAPFU0939F1Z2'), false)
})

test('check char self-consistency', () => {
  assert.equal(gstinCheckChar('27AAPFU0939F1Z'), 'V')
  assert.equal(gstinCheckChar('09AAACT2727Q1Z'), 'U')
  const made = gstinCheckChar('23ABCPM1234F1Z')
  assert.ok(made)
  assert.equal(validateGstin('23ABCPM1234F1Z' + made), true)
})

test('state code lookup', () => {
  assert.equal(gstStateCode('23ABCPM1234F1Z2'), 'Madhya Pradesh')
  assert.equal(gstStateCode('27AAAAA0000A1Z5'), 'Maharashtra')
})