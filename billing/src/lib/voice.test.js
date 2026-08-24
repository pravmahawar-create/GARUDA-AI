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
  assert.ok(t.items.find(it => it.name === 'ACC' && it.qty === 300))
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

test('regression: stock add then query returns ledger physical stock', () => {
  const add = parseLocal('500 bag ACC cement stock mein add karo', [])
  assert.equal(add.intent, 'stock_entry')
  assert.equal(add.operation, 'add')

  const query = parseLocal('ACC cement ka stock kitna hai', [])
  assert.equal(query.intent, 'stock_query')
})

test('regression: mines karo normalizes to stock subtract', () => {
  const t = parseLocal('20 bori ACC Cement mines karo', [])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'subtract')
  assert.ok(t.items.find(it => it.name === 'ACC Cement' && it.qty === 20))
})

test('regression: Hindi minus variants route to stock subtract', () => {
  const t = parseLocal('10 bag ACC Cement kam karo', [])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'subtract')

  const t2 = parseLocal('10 bag ACC Cement ghata do', [])
  assert.equal(t2.intent, 'stock_entry')
  assert.equal(t2.operation, 'subtract')
})

test('regression: ACC Cement alias intent is stock_query', () => {
  const t1 = parseLocal('ACC Cement ka stock kitna hai', [])
  assert.equal(t1.intent, 'stock_query')

  const t2 = parseLocal('Cement - ACC ka stock kitna hai', [])
  assert.equal(t2.intent, 'stock_query')

  const t3 = parseLocal('ACC cement ka stock kitna hai', [])
  assert.equal(t3.intent, 'stock_query')
})

test('regression: Devanagari ACC Cement intent is stock_query', () => {
  const t = parseLocal('एसीसी सीमेंट का स्टॉक कितना है', [])
  assert.equal(t.intent, 'stock_query')
})

test('regression: stock subtract with mines variant', () => {
  const t = parseLocal('20 bori ACC Cement mines karo', [])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'subtract')
  assert.ok(t.items.find(it => it.name === 'ACC Cement' && it.qty === 20))
})

test('regression: stock add without explicit verb uses stated form', () => {
  const t = parseLocal('ACC Cement ka stock 120 bag hai', [])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query')
  assert.ok(t.stated)
  assert.equal(t.stated.qty, 120)
})

const TWO_BAG_ITEMS = [
  { name: 'Cement - ACC', unit: 'bag' },
  { name: 'Cement - UltraTech', unit: 'bag' }
]

test('regression: ACC cement stock mein se 300 bori minus → ACC Cement', () => {
  const t = parseLocal('ACC cement stock mein se 300 bori minus kar do', [], TWO_BAG_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'subtract')
  assert.ok(t.items.find(it => it.name === 'ACC Cement' && it.qty === 300 && it.unit === 'bag'))
})

test('regression: stock mein se 300 bori ACC cement minus → ACC Cement', () => {
  const t = parseLocal('stock mein se 300 bori ACC cement minus kar do', [], TWO_BAG_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'subtract')
  assert.ok(t.items.find(it => it.name === 'ACC Cement' && it.qty === 300))
})

test('regression: ACC cement ke stock mein se 300 bori minus → ACC Cement', () => {
  const t = parseLocal('ACC cement ke stock mein se 300 bori minus kar do', [], TWO_BAG_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'subtract')
  assert.ok(t.items.find(it => it.name === 'ACC Cement' && it.qty === 300))
})

test('regression: 300 bori ACC cement stock mein jodo → add', () => {
  const t = parseLocal('300 bori ACC cement stock mein jodo', [], TWO_BAG_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.ok(t.items.find(it => it.name === 'ACC Cement' && it.qty === 300))
})

test('regression: stock query extracts item name', () => {
  const t = parseLocal('ACC cement ka stock kitna hai?', [], TWO_BAG_ITEMS)
  assert.equal(t.intent, 'stock_query')
  assert.ok(t.items.some(it => it.name === 'ACC Cement'))
})

test('regression: Devanagari stock query extracts item name', () => {
  const t = parseLocal('एसीसी सीमेंट का स्टॉक कितना है', [], TWO_BAG_ITEMS)
  assert.equal(t.intent, 'stock_query')
  assert.ok(t.items.some(it => it.name === 'ACC Cement'))
})

test('regression: missing item with single candidate resolves safely', () => {
  const t = parseLocal('stock mein se 300 bori minus kar do', [], [{ name: 'Cement - ACC', unit: 'bag' }])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'subtract')
  assert.ok(t.items.find(it => it.name === 'Cement - ACC' && it.qty === 300))
})

test('regression: missing item with multiple candidates clarifies with names', () => {
  const t = parseLocal('stock mein se 300 bori minus kar do', [], TWO_BAG_ITEMS)
  assert.equal(t.intent, 'clarify')
  assert.ok(t.message.includes('Cement - ACC'))
  assert.ok(t.message.includes('Cement - UltraTech'))
})

test('regression: missing item without stock context keeps generic clarify', () => {
  const t = parseLocal('stock mein se 300 bori minus kar do', [])
  assert.equal(t.intent, 'clarify')
  assert.ok(t.message.includes('Item ka naam batao'))
})

test('regression: missing quantity still clarifies', () => {
  const t = parseLocal('stock mein se minus kar do', [], TWO_BAG_ITEMS)
  assert.equal(t.intent, 'clarify')
  assert.ok(t.message.includes('Kitna'))
})

test('regression: unrelated unit family not a candidate for bag subtract', () => {
  const t = parseLocal('stock mein se 300 bori minus kar do', [], [
    { name: 'Cement - ACC', unit: 'bag' },
    { name: 'TMT Steel 8mm', unit: 'kg' }
  ])
  assert.equal(t.intent, 'stock_entry')
  assert.ok(t.items.find(it => it.name === 'Cement - ACC' && it.qty === 300))
})

test('regression: unanchored query resolves specific item', () => {
  const t = parseLocal('is samay stock mein kitni ACC Cement hai', [], [
    { name: 'ACC Cement', unit: 'bag' },
    { name: 'Cement - UltraTech', unit: 'bag' }
  ])
  assert.equal(t.intent, 'stock_query')
  assert.ok(t.items.some(it => it.name === 'ACC Cement'))
})

test('regression: generic cement query becomes category aggregate', () => {
  const t = parseLocal('stock mein kitna cement hai', [], [
    { name: 'ACC Cement', unit: 'bag' },
    { name: 'UltraTech Cement', unit: 'bag' }
  ])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query_category')
  assert.equal(t.category, 'cement')
})

test('regression: resolveQueryItem without stockItems falls back to anchored regex', () => {
  const t = parseLocal('ACC Cement ka stock kitna hai', [])
  assert.equal(t.intent, 'stock_query')
  assert.ok(t.items.some(it => it.name === 'ACC Cement'))
})

test('regression: Devanagari digits parse qty and rate', () => {
  const t = parseLocal('रमेश के नाम ५० बैग सीमेंट ३९० का बिल बना दो', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'रमेश')
  const it = t.items.find(i => i.name === 'Cement')
  assert.ok(it, 'item must be detected')
  assert.equal(it.qty, 50)
  assert.equal(it.unit, 'bag')
  assert.equal(it.rate, 390)
})

test('regression: ke bhav se rate extraction', () => {
  const t = parseLocal('मोहन के नाम 300 बोरी एसीसी सीमेंट 290 के भाव से बिल बनाओ', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'मोहन')
  const it = t.items.find(i => i.name === 'ACC Cement')
  assert.ok(it, 'item must be detected')
  assert.equal(it.qty, 300)
  assert.equal(it.unit, 'bag')
  assert.equal(it.rate, 290)
})

test('regression: Devanagari + Hinglish mixed sentence', () => {
  const t = parseLocal('रमेश के नाम 50 बैग सीमेंट 390 का बिल बना दो', [])
  assert.equal(t.intent, 'create_bill')
  const it = t.items.find(i => i.name === 'Cement')
  assert.equal(it.qty, 50)
  assert.equal(it.rate, 390)
})

test('stock category aggregate: Cement ka total stock kitna hai', () => {
  const t = parseLocal('Cement ka total stock kitna hai?', [], [])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query_category')
  assert.equal(t.category, 'cement')
})

test('stock category aggregate: company mein total cement kitni bori hai', () => {
  const t = parseLocal('company mein total cement kitni bori hai', [], [])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query_category')
  assert.equal(t.category, 'cement')
})

test('stock category aggregate: company ke stock mein abhi Kitna bori cement hai', () => {
  const t = parseLocal('company ke stock mein abhi Kitna bori cement hai', [], [])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query_category')
  assert.equal(t.category, 'cement')
})

test('stock category aggregate: abhi cement ka stock kitna hai', () => {
  const t = parseLocal('abhi cement ka stock kitna hai', [], [])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query_category')
  assert.equal(t.category, 'cement')
})

test('stock category aggregate: cement kitni bori padi hai', () => {
  const t = parseLocal('cement kitni bori padi hai', [], [])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query_category')
  assert.equal(t.category, 'cement')
})

test('stock category aggregate: total abhi cement ka stock kitna hai total', () => {
  const t = parseLocal('total abhi cement ka stock kitna hai total', [], [])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query_category')
  assert.equal(t.category, 'cement')
})

test('stock specific item query stays item query (not category)', () => {
  const t = parseLocal('ACC Cement ka stock kitna hai?', [], [])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query')
  assert.ok(t.items.some(i => i.name === 'ACC Cement'))
})

test('stock inward with vehicle: MP 20 ZZ 7787 gaadi se 400 bori ACC Cement', () => {
  const t = parseLocal('MP 20 ZZ 7787 number ki gaadi se 400 bori ACC Cement aayi hai', [], [])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.equal(t.vehicleNo, 'MP20ZZ7787')
  assert.ok(t.items.find(i => i.name === 'ACC Cement' && i.qty === 400))
})

test('stock inward without vehicle: 400 bori ACC Cement aayi hai', () => {
  const t = parseLocal('400 bori ACC Cement aayi hai', [], [])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.equal(t.vehicleNo, '')
  assert.ok(t.items.find(i => i.name === 'ACC Cement' && i.qty === 400))
})

test('vehicle ledger query: MP 20 ZZ 7787 se kitna cement aaya tha', () => {
  const t = parseLocal('MP 20 ZZ 7787 se kitna cement aaya tha?', [], [])
  assert.equal(t.intent, 'stock_ledger_query')
  assert.equal(t.scope, 'vehicle')
  assert.equal(t.vehicleNo, 'MP20ZZ7787')
})

test('today inward ledger query: Aaj kitna cement inward hua', () => {
  const t = parseLocal('Aaj kitna cement inward hua?', [], [])
  assert.equal(t.intent, 'stock_ledger_query')
  assert.equal(t.scope, 'today')
})

test('last incoming ledger query: ACC Cement ki last incoming entry kya hai', () => {
  const t = parseLocal('ACC Cement ki last incoming entry kya hai?', [], [])
  assert.equal(t.intent, 'stock_ledger_query')
  assert.equal(t.scope, 'last_incoming')
  assert.equal(t.itemName, 'ACC Cement')
})

test('last vehicle ledger query: Last cement kis gaadi se aaya tha', () => {
  const t = parseLocal('Last cement kis gaadi se aaya tha?', [], [])
  assert.equal(t.intent, 'stock_ledger_query')
  assert.equal(t.scope, 'last_vehicle')
  assert.equal(t.category, 'cement')
})

test('regression: Hindi STT vehicle inward → stock_entry add', () => {
  const t = parseLocal('एमपी 20 जेड 7787 नंबर की गाड़ी से 400 बोरी एसीसी सीमेंट आई है स्टॉक में ऐड करो', [], [])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.equal(t.vehicleNo, 'MP20Z7787')
  assert.ok(t.items.find(i => i.name === 'ACC Cement' && i.qty === 400))
})

test('regression: Hindi STT vehicle inward (different spacing) → stock_entry add', () => {
  const t = parseLocal('एमपी20जेड7787 नंबर की गाड़ी से 400 बोरी एसीसी सीमेंट आई है स्टॉक में ऐड करो', [], [])
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.vehicleNo, 'MP20Z7787')
  assert.ok(t.items.find(i => i.name === 'ACC Cement' && i.qty === 400))
})

test('regression: ACC Cement / Cement ACC variants resolve to same canonical item', () => {
  const t1 = parseLocal('ACC Cement ka stock kitna hai', [], [])
  assert.equal(t1.intent, 'stock_query')
  assert.ok(t1.items.length > 0)
  const t2 = parseLocal('Cement ACC ka stock kitna hai', [], [])
  assert.equal(t2.intent, 'stock_query')
  assert.ok(t2.items.length > 0, 'Cement ACC must be extracted')
  const t3 = parseLocal('एसीसी सीमेंट का स्टॉक कितना है', [], [])
  assert.equal(t3.intent, 'stock_query')
  assert.ok(t3.items.length > 0)
})

test('regression: category aggregate count merges canonical duplicates', () => {
  // Simulate 4 records but only 3 canonical products
  const t = parseLocal('cement kitna bori hai', [], [
    { name: 'ACC Cement', unit: 'bag' },
    { name: 'Cement - UltraTech', unit: 'bag' },
    { name: 'JK Lakshmi Cement', unit: 'bag' },
    { name: 'Cement - ACC', unit: 'bag' }
  ])
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query_category')
  assert.equal(t.category, 'cement')
})

const SARIYA_ITEMS = [
  { name: 'TMT Steel 8mm', unit: 'piece' },
  { name: 'TMT Steel 10mm', unit: 'piece' },
  { name: 'TMT Steel 12mm', unit: 'piece' },
  { name: 'Sariya (rod) - 40ft', unit: 'piece' },
  { name: 'Sariya (rod) - 20ft', unit: 'piece' }
]

test('sariya add: 8mm sariya mein 100 piece add karo → 8mm variant', () => {
  const t = parseLocal('8mm sariya mein 100 piece add karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  const it = t.items.find(i => i.name === '8mm TMT Steel')
  assert.ok(it, '8mm variant required')
  assert.equal(it.qty, 100)
  assert.equal(it.unit, 'piece')
})

test('sariya add: 12mm sariya mein 50 piece jod do → 12mm NOT 8mm/10mm', () => {
  const t = parseLocal('12mm sariya mein 50 piece jod do', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.ok(t.items.find(i => i.name === '12mm TMT Steel' && i.qty === 50))
  assert.ok(!t.items.find(i => i.name.includes('8mm')))
  assert.ok(!t.items.find(i => i.name.includes('10mm')))
})

test('sariya add: 50 piece 8mm TMT stock mein add karo', () => {
  const t = parseLocal('50 piece 8mm TMT stock mein add karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.ok(t.items.find(i => i.name === '8mm TMT Steel' && i.qty === 50))
})

test('sariya add: natural Hinglish 8 mm wali sariya daal do', () => {
  const t = parseLocal('8 mm wali sariya ke 100 piece stock mein daal do', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.ok(t.items.find(i => i.name === '8mm TMT Steel' && i.qty === 100))
})

test('sariya query: 8mm sariya ka stock kitna hai → 8mm variant', () => {
  const t = parseLocal('8mm sariya ka stock kitna hai', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_query')
  assert.ok(t.items.some(i => i.name === '8mm TMT Steel'))
})

test('sariya query: 10mm sariya kitna hai → 10mm variant', () => {
  const t = parseLocal('10mm sariya kitna hai', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_query')
  assert.ok(t.items.some(i => i.name === 'TMT Steel 10mm'))
})

test('sariya query: 12mm TMT ka stock batao → 12mm variant', () => {
  const t = parseLocal('12mm TMT ka stock batao', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_query')
  assert.ok(t.items.some(i => i.name === '12mm TMT Steel'))
})

test('sariya subtract: 8mm sariya ke 20 piece minus karo', () => {
  const t = parseLocal('8mm sariya ke 20 piece minus karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'subtract')
  assert.ok(t.items.find(i => i.name === '8mm TMT Steel' && i.qty === 20))
})

test('sariya subtract: 10mm sariya se 50 piece nikaal do', () => {
  const t = parseLocal('10mm sariya se 50 piece nikaal do', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'subtract')
  assert.ok(t.items.find(i => i.name === '10mm TMT Steel' && i.qty === 50))
})

test('sariya category total: company mein total sariya kitna hai', () => {
  const t = parseLocal('company mein total sariya kitna hai', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_query')
  assert.equal(t.operation, 'query_category')
  assert.equal(t.category, 'steel')
})

test('sariya Hindi add: आठ एमएम सरिया स्टॉक में 100 पीस ऐड करो', () => {
  const t = parseLocal('आठ एमएम सरिया स्टॉक में 100 पीस ऐड करो', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.ok(t.items.find(i => i.name === '8mm TMT Steel' && i.qty === 100))
})

test('sariya Hindi query: बारह एमएम टीएमटी का स्टॉक कितना है', () => {
  const t = parseLocal('बारह एमएम टीएमटी का स्टॉक कितना है', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_query')
  assert.ok(t.items.some(i => i.name === '12mm TMT Steel'))
})

test('sariya vehicle inward: MP 20 ZZ 7787 se 100 piece 8mm sariya aayi', () => {
  const t = parseLocal('MP 20 ZZ 7787 se 100 piece 8mm sariya aayi hai stock mein add karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.equal(t.vehicleNo, 'MP20ZZ7787')
  assert.ok(t.items.find(i => i.name === '8mm TMT Steel' && i.qty === 100))
})

test('multi-item safety: 8mm + 10mm separate operations, never collapsed', () => {
  const t = parseLocal('8 mm TMT 50 piece add karo 10 mm TMT 30 piece add karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  assert.equal(t.items.length, 2, 'two separate items required')
  assert.ok(t.items.find(i => i.name === '8mm TMT Steel' && i.qty === 50 && i.unit === 'piece'))
  assert.ok(t.items.find(i => i.name === '10mm TMT Steel' && i.qty === 30 && i.unit === 'piece'))
})

test('multi-item safety: comma separated variant', () => {
  const t = parseLocal('8mm TMT 50 piece add karo, 10mm TMT 30 piece add karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.items.length, 2)
  assert.ok(t.items.find(i => i.name === '8mm TMT Steel'))
  assert.ok(t.items.find(i => i.name === '10mm TMT Steel'))
})

test('multi-item safety: aur separated variant', () => {
  const t = parseLocal('8mm TMT 50 piece add karo aur 10mm TMT 30 piece add karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.items.length, 2)
})

test('safety: 12mm 50 kilo Sariya preserves 12mm size', () => {
  const t = parseLocal('12 mm 50 kilo Sariya add karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.equal(t.operation, 'add')
  const it = t.items.find(i => i.name === '12mm TMT Steel')
  assert.ok(it, '12mm variant required, must not become 8mm')
  assert.equal(it.qty, 50)
  assert.equal(it.unit, 'kg', 'spoken unit kg preserved for executor safety check')
})

test('safety: 12mm 50 piece Sariya uses piece unit', () => {
  const t = parseLocal('12mm 50 piece Sariya add karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  const it = t.items.find(i => i.name === '12mm TMT Steel' && i.qty === 50)
  assert.ok(it, '12mm variant required')
  assert.equal(it.unit, 'piece')
})

test('safety: size-less sariya mutation parses without a size (executor must clarify)', () => {
  const t = parseLocal('50 piece sariya add karo', [], SARIYA_ITEMS)
  assert.equal(t.intent, 'stock_entry')
  assert.ok(t.items.find(i => i.name === 'TMT Steel' && i.qty === 50))
})

test('customer extraction: Bil banao variant', () => {
  const t = parseLocal('customer ka naam hai Mohit isko 300 bori ACC ki bechi 290 ke rate se Bil banao', [])
  assert.equal(t.intent, 'create_bill')
  assert.equal(t.customer.name, 'Mohit')
  assert.ok(t.items.find(it => it.name === 'ACC' && it.qty === 300))
  assert.equal(t.items[0].rate, 290)
})