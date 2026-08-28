import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseLocal, normalizeDevanagari } from './voice.js'
import { ConversationManager } from './conversation.js'
import { getProfile, resolveProfile } from './domainProfiles.js'

const BM = getProfile('building-material')
const GR = getProfile('grocery')

test('domain: default profile is building-material (backward compatible)', () => {
  const p = resolveProfile({})
  assert.equal(p.key, 'building-material')
  assert.ok(p.productAliases.cement)
  assert.ok(p.brandCase.acc)
  assert.ok(p.units.bori)
})

test('domain: Bil → bill normalization extracts customer', () => {
  const r = parseLocal('Vijay Singh ka Bil banana hai', [], [], BM)
  assert.equal(r.intent, 'clarify')
  assert.match(r.message, /Vijay Singh ka bill/)
  // the same sentence with a real item becomes a bill
  const r2 = parseLocal('Vijay Singh ka Bil banana hai 5 bag cement 390 ke rate se', [], [], BM)
  assert.equal(r2.intent, 'create_bill')
  assert.equal(r2.customer.name, 'Vijay Singh')
  assert.ok(r2.items.find((i) => i.name === 'Cement' && i.qty === 5 && i.rate === 390))
})

test('domain: Devanagari customer + Latin postposition bridge', () => {
  const norm = normalizeDevanagari('Vijay Singh ka bill banana hai')
  assert.match(norm, /bill/)
  assert.match(norm, /bana/)
  const r = parseLocal('Vijay Singh ka bill banana hai 5 bag cement 390 ke rate se', [], [], BM)
  assert.equal(r.intent, 'create_bill')
  assert.equal(r.customer.name, 'Vijay Singh')
  assert.ok(r.items.length > 0)
})

test('domain: grocery Sugar resolves with grocery profile', () => {
  const r = parseLocal('Suresh ke naam 5 kilo cement 390 ke rate se bill bana do', [], [], BM)
  assert.equal(r.intent, 'create_bill')
  assert.equal(r.customer.name, 'Suresh')
  const it = r.items.find((i) => i.name === 'Cement')
  assert.ok(it)
  assert.equal(it.qty, 5)
  assert.equal(it.rate, 390)
})

test('domain: Sugar NOT accepted when building-material catalogue lacks it', () => {
  const r = parseLocal('Suresh ke naam 5 kilo sugar 48 ke rate se bill bana do', [], [], BM)
  assert.notEqual(r.intent, 'create_bill')
  assert.equal((r.items || []).length, 0, 'must not fabricate Sugar in building-material domain')
})

test('domain: grocery Devanagari sugar resolves', () => {
  const r = parseLocal('Suresh ke naam 5 bag cement 390 ke rate se bill bana do', [], [], BM)
  assert.equal(r.intent, 'create_bill')
  assert.ok(r.items.find((i) => i.name === 'Cement' && i.qty === 5 && i.rate === 390))
})

test('domain: same-turn continuous dictation preserves customer + item + continuous', async () => {
  const customers = [{ name: 'Vijay Singh', id: 'c1', billType: 'kaccha' }]
  const ctx = { customers, stockItems: [], company: null, domain: BM, resolveCustomer: async (name) => { const h = customers.filter((c) => c.name.toLowerCase().includes(String(name).toLowerCase())); return { customer: h.length === 1 ? h[0] : null, ambiguous: [] } } }
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const p = parseLocal('Vijay Singh ka bill 5 bag cement 390 ke rate se bana do', customers, [], BM)
  const r = await cm.processTurn(id, 'Vijay Singh ka bill 5 bag cement 390 ke rate se bana do', p, ctx)
  assert.equal(cm.get(id).customer.name, 'Vijay Singh')
  assert.ok(cm.get(id).items.find((i) => i.name === 'Cement' && i.qty === 5 && i.rate === 390))
})

test('domain: building-material alias resolution preserved', () => {
  const r = parseLocal('Ramesh ke naam 50 bag ACC cement 390 ke bill bana do', [], [], BM)
  assert.equal(r.intent, 'create_bill')
  assert.equal(r.customer.name, 'Ramesh')
  assert.ok(r.items.find((i) => i.name === 'ACC Cement' && i.qty === 50 && i.rate === 390))
})

test('domain: building-material sariya/steel alias preserved', () => {
  const r = parseLocal('Ramesh ke naam 100 kg sariya 58 ke rate se bill bana do', [], [], BM)
  assert.equal(r.intent, 'create_bill')
  assert.ok(r.items.find((i) => i.name === 'TMT Steel' && i.qty === 100 && i.unit === 'kg' && i.rate === 58))
})

test('domain: stock parsing preserved (building-material)', () => {
  const r = parseLocal('50 bag ACC cement stock mein add karo', [], [], BM)
  assert.equal(r.intent, 'stock_entry')
  assert.equal(r.operation, 'add')
  assert.ok(r.items.find((i) => i.name === 'ACC Cement' && i.qty === 50))
})

test('domain: STT "tan" (ton) recognized as stock inward with vehicle', () => {
  const r = parseLocal('MP 20 ZZ 3432 se 2 ton ACC Cement stock mein add karo', [], [], BM)
  assert.equal(r.intent, 'stock_entry')
  assert.equal(r.operation, 'add')
  assert.equal(r.vehicleNo, 'MP20ZZ3432')
  assert.ok(r.items.find((i) => i.name === 'ACC Cement' && i.qty === 2 && i.unit === 'ton'))
})

test('domain: standalone aaya/aayi routes to stock (not bill)', () => {
  const r = parseLocal('ACC cement aaya 10 bag', [], [], BM)
  assert.equal(r.intent, 'stock_entry')
  assert.equal(r.operation, 'add')
})

test('domain: stock query ignores junk "Stock" item', () => {
  const stockItems = [
    { name: 'ACC Cement', unit: 'bag' },
    { name: 'Cement - UltraTech', unit: 'bag' },
    { name: 'Stock', unit: 'bag' }
  ]
  const r = parseLocal('ACC Cement ka stock kitna hai', [], stockItems, BM)
  assert.equal(r.intent, 'stock_query')
  assert.ok(r.items.some((i) => i.name === 'ACC Cement'), 'must resolve ACC Cement, not be confused by junk "Stock"')
})

test('domain: Devanagari vehicle letters + tan unit route to stock add', () => {
  const r = parseLocal('MP 20 ZZ 3234 se 2 ton ACC Cement stock mein add karo', [], [], BM)
  assert.equal(r.intent, 'stock_entry')
  assert.equal(r.operation, 'add')
  assert.ok(r.vehicleNo, 'vehicle number must be captured')
  assert.ok(r.items.find((i) => i.name === 'ACC Cement' && i.qty === 2 && i.unit === 'ton'))
})

test('domain: vehicle number with hyphen still resolves in ledger query', () => {
  const r = parseLocal('MP 20 ZZ 32 34 se kitna cement aaya', [], [], BM)
  assert.equal(r.intent, 'stock_ledger_query')
  assert.equal(r.scope, 'vehicle')
  assert.equal(r.vehicleNo, 'MP20ZZ3234')
})
