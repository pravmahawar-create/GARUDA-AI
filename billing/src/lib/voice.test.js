import { test } from 'node:test'
import assert from 'node:assert/strict'
import { numberFromHindi, parseLocal } from './voice.js'

test('numberFromHindi words and multipliers', () => {
  assert.equal(numberFromHindi('50'), 50)
  assert.equal(numberFromHindi('hazaar'), 1000)
  assert.equal(numberFromHindi('2 hazaar'), 2000)
  assert.equal(numberFromHindi('58 hazaar'), 58000)
  assert.equal(numberFromHindi('1 lakh'), 100000)
  assert.equal(numberFromHindi('2 lakh 50 hazaar'), 250000)
})

test('directive example: full create_bill', () => {
  const t = parseLocal('Garuda, Ramesh ke naam 50 cement ke bag 390 ke aur 2 ton sariya 58 hazaar ke laga ke bill bana', ['Ramesh'])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Ramesh')
  assert.equal(t.items.length, 2)
  const cement = t.items.find((i) => i.name === 'Cement')
  assert.ok(cement)
  assert.equal(cement.qty, 50)
  assert.equal(cement.unit, 'bag')
  assert.equal(cement.rate, 390)
  const steel = t.items.find((i) => i.name === 'TMT Steel')
  assert.ok(steel)
  assert.equal(steel.qty, 2)
  assert.equal(steel.unit, 'ton')
  assert.equal(steel.rate, 58000)
})

test('query outstanding', () => {
  const t = parseLocal('Ramesh ka kitna baki hai', ['Ramesh'])
  assert.equal(t.intent, 'query_outstanding')
  assert.equal(t.customerName, 'Ramesh')
})

test('delivery query routed', () => {
  const t = parseLocal('MP20AB1234 mein Sharma ka maal bhej, driver Rakesh hai, transport 2500 hai')
  assert.equal(t.intent, 'query_delivery')
})

test('unknown -> clarify', () => {
  const t = parseLocal('namaste kya haal hai')
  assert.equal(t.intent, 'clarify')
})