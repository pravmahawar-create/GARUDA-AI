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

test('founder: Ramesh ke naam 50 bag cement 390 ke bill', () => {
  const t = parseLocal('Ramesh ke naam 50 bag cement 390 ke bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Ramesh')
  assert.equal(t.items.length, 1)
  assert.equal(t.items[0].qty, 50)
  assert.equal(t.items[0].unit, 'bag')
  assert.equal(t.items[0].rate, 390)
})

test('founder: Ramesh ko 20 bag ACC cement 420', () => {
  const t = parseLocal('Ramesh ko 20 bag ACC cement 420 ke rate se bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name.toLowerCase(), 'ramesh')
  assert.equal(t.items[0].qty, 20)
  assert.equal(t.items[0].rate, 420)
})

test('stock entry: MP20AB1234 se 50 bag ACC cement aur 2 ton TMT steel aaya hai', () => {
  const t = parseLocal('MP20AB1234 se 50 bag ACC cement aur 2 ton TMT steel aaya hai', [])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.equal(t.vehicleNo, 'MP20AB1234')
  assert.ok(t.items.length >= 2)
})

test('stock add: 50 bag ACC cement stock mein add karo', () => {
  const t = parseLocal('50 bag ACC cement stock mein add karo', [])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
})

test('stock query: ACC cement ka stock kitna hai', () => {
  const t = parseLocal('ACC cement ka stock kitna hai', [])
  assert.equal(t.intent, 'stock_query')
})

test('stock query stated form does not overwrite', () => {
  const t = parseLocal('ACC cement ka stock 120 bag hai', [])
  assert.equal(t.intent, 'stock_query')
})

test('incomplete bill: missing customer', () => {
  const t = parseLocal('50 bag cement 390 ke bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.ok(t.missing.includes('customer ka naam'))
})

test('consecutive voice bills: parser stateless across calls', () => {
  const first = parseLocal('Ramesh ke naam 50 bag cement 390 ke bill bana do', [])
  assert.equal(first.intent, 'create_bill')
  assert.equal(first.customer.name, 'Ramesh')
  assert.equal(first.items[0].qty, 50)

  const second = parseLocal('Suresh ke naam 20 bag ACC cement 400 ke bill bana do', [])
  assert.equal(second.intent, 'create_bill')
  assert.equal(second.customer.name, 'Suresh')
  assert.equal(second.items[0].qty, 20)
  assert.equal(second.items[0].rate, 400)
})

test('consecutive voice bills: different customers same session', () => {
  const cmds = [
    'Ramesh ke naam 50 bag cement 390 ke bill bana do',
    'Suresh ke naam 20 bag ACC cement 420 ke bill bana do',
    'Mahesh ke naam 30 bag TMT steel 500 ke bill bana do'
  ]
  const expected = [
    { customer: 'Ramesh', qty: 50, item: 'Cement' },
    { customer: 'Suresh', qty: 20, item: 'ACC Cement' },
    { customer: 'Mahesh', qty: 30, item: 'TMT Steel' }
  ]
  for (let i = 0; i < cmds.length; i++) {
    const t = parseLocal(cmds[i], [])
    assert.equal(t.intent, 'create_bill', `cmd ${i} intent`)
    assert.equal(t.customer.name, expected[i].customer, `cmd ${i} customer`)
    assert.ok(t.items.find(it => it.name === expected[i].item && it.qty === expected[i].qty), `cmd ${i} item`)
  }
})

test('parser robustness: per preposition normalizes to ke', () => {
  const t = parseLocal('Mohit ke naam per 50 bag ACC cement 390 ke bhav se bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Mohit')
  assert.ok(t.items.find(it => it.name === 'ACC Cement' && it.qty === 50))
})

test('parser robustness: rate se and bhav se variants', () => {
  const t1 = parseLocal('Ramesh ke naam 50 bag cement 390 ke rate se bill bana do', [])
  assert.equal(t1.intent, 'create_bill')
  assert.equal(t1.items[0].rate, 390)

  const t2 = parseLocal('Suresh ka 20 bag cement 400 ke bhav se bill bana do', [])
  assert.equal(t2.intent, 'create_bill')
  assert.equal(t2.items[0].rate, 400)
})

test('regression: Hindi rupaye kilo ke hisab se rate extraction', () => {
  const t = parseLocal('ऋषि के नाम से बिल बना दो 50 kilo sariya 57 rupaye kilo ke hisab se', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'ऋषि')
  assert.ok(t.items.find(it => it.name === 'TMT Steel' && it.qty === 50))
  assert.equal(t.items[0].rate, 57)
})

test('regression: Hindi ₹230 ke bhav se rate extraction', () => {
  const t = parseLocal('ऋषि के नाम से बिल बना दो 400 bori ACC Cement ₹230 ke bhav se', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'ऋषि')
  assert.ok(t.items.find(it => it.name === 'ACC Cement' && it.qty === 400))
  assert.equal(t.items[0].rate, 230)
})

test('regression: missing rate still returns clarify', () => {
  const t = parseLocal('Ramesh ke naam 50 bag cement ke bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.ok(t.missing.includes('har item ka rate'))
})

test('consecutive stock sessions: add then query then subtract then query', () => {
  const add = parseLocal('50 bag ACC cement stock mein add karo', [])
  assert.equal(add.intent, 'stock_entry')
  assert.equal(add.operation, 'add')
  assert.ok(add.items.find(it => it.name === 'ACC Cement' && it.qty === 50))

  const query1 = parseLocal('ACC cement ka stock kitna hai', [])
  assert.equal(query1.intent, 'stock_query')

  const sub = parseLocal('20 bag ACC cement minus karo', [])
  assert.equal(sub.intent, 'stock_entry')
  assert.equal(sub.operation, 'subtract')
  assert.ok(sub.items.find(it => it.name === 'ACC Cement' && it.qty === 20))

  const query2 = parseLocal('ACC cement ka stock kitna hai', [])
  assert.equal(query2.intent, 'stock_query')
})

test('voice cleanup after clarify does not leak state', () => {
  const first = parseLocal('namaste kya haal hai', [])
  assert.equal(first.intent, 'clarify')

  const second = parseLocal('Ramesh ke naam 50 bag cement 390 ke bill bana do', [])
  assert.equal(second.intent, 'create_bill')
  assert.equal(second.customer.name, 'Ramesh')
})

test('customer name extraction: customer ka naam hai Mohit', () => {
  const t = parseLocal('customer ka naam hai Mohit isko 300 bori ACC ki bechi 290 ke rate se Bill bnao', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Mohit')
  assert.ok(t.items.find(it => it.name === 'ACC Ki Bechi' && it.qty === 300))
  assert.equal(t.items[0].rate, 290)
})

test('customer name extraction: customer ka naam Mohit hai', () => {
  const t = parseLocal('customer ka naam Mohit hai, usko 20 bag cement 400 ke bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Mohit')
})

test('customer name extraction: customer ke naam se Suresh', () => {
  const t = parseLocal('customer ke naam se Suresh 50 bag ACC cement 390 ke rate se bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Suresh')
})

test('customer name extraction: iske naam se Ramesh', () => {
  const t = parseLocal('iske naam se Ramesh 30 bag TMT steel 500 ke bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Ramesh')
})

test('customer name extraction: uske naam par Mahesh', () => {
  const t = parseLocal('uske naam par Mahesh 10 ton steel 58000 ke bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Mahesh')
})

test('regression: Chintu ka 37 bori ACC Cement 427 ke hisab se Bil bnao', () => {
  const t = parseLocal('Chintu ka 37 bori ACC Cement 427 ke hisab se Bil bnao', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Chintu')
  assert.ok(t.items.find(it => it.name === 'ACC Cement' && it.qty === 37))
  assert.equal(t.items[0].rate, 427)
})

test('customer name extraction: Chintu ke naam 37 bag cement 427 ke bill bana do', () => {
  const t = parseLocal('Chintu ke naam 37 bag cement 427 ke bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Chintu')
})

test('customer name extraction: Chintu ke naam se 37 bag cement 427 ke bill bana do', () => {
  const t = parseLocal('Chintu ke naam se 37 bag cement 427 ke bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Chintu')
})

test('customer name extraction: Chintu ke naam par 37 bag cement 427 ke bill bana do', () => {
  const t = parseLocal('Chintu ke naam par 37 bag cement 427 ke bill bana do', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Chintu')
})

test('customer name extraction: Chintu ko 37 bag cement 427 ke hisab se bill banao', () => {
  const t = parseLocal('Chintu ko 37 bag cement 427 ke hisab se bill banao', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Chintu')
})

test('customer name extraction: customer ka naam Chintu hai 37 bag ACC Cement 427 ke rate se bill banao', () => {
  const t = parseLocal('customer ka naam Chintu hai, 37 bag ACC Cement 427 ke rate se bill banao', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Chintu')
})