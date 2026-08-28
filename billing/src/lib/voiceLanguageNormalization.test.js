import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDevanagari } from './voice.js'

test('VOICE NORMALIZATION: Devanagari Hindi text normalizes conceptually to Latin Hinglish for NLU preparation', () => {
  // Example 1: Correction phrase in Devanagari
  const norm1 = normalizeDevanagari('नहीं इसको 395 के भाव से बनाओ')
  assert.equal(norm1.includes('395'), true)
  assert.equal(norm1.includes('ke bhav'), true)

  // Example 2: Bill command in Devanagari
  const norm2 = normalizeDevanagari('रवि का बिल बना दो')
  assert.equal(norm2.includes('bill bana do'), true)

  // Example 3: Quantity + Unit + Item in Devanagari
  const norm3 = normalizeDevanagari('पचास बोरी ACC cement')
  assert.equal(norm3.includes('50'), true)
  assert.equal(norm3.includes('bag'), true)
  assert.equal(norm3.includes('ACC cement'), true)
})
