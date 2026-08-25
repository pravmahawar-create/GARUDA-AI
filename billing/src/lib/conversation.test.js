import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ConversationManager } from './conversation.js'
import { parseLocal } from './voice.js'

const knownCustomers = [
  { name: 'Ramesh', mobile: '', gstin: '', billType: 'kaccha' },
  { name: 'Vijay Singh', mobile: '', gstin: '23ABCDE1234F1Z5', billType: 'gst' }
]

const ctxOf = (customers) => ({ customers, stockItems: [], company: null })

const turn = async (cm, id, text, customers) => {
  const ctx = ctxOf(customers)
  return cm.processTurn(id, text, parseLocal(text, customers), ctx)
}

test('conversation: start bill, draft persists across turns', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const t1 = await turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  assert.equal(t1.status, 'needs_info')
  assert.match(t1.message, /GST ya kaccha/i)
  const c = cm.get(id)
  assert.equal(c.intent, 'create_bill')
  assert.equal(c.customer.name, 'Vijay Singh')
  assert.equal(c.items.length, 0)
})

test('conversation: add bill type then gstin then material', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  const t2 = await turn(cm, id, 'GST', [])
  assert.equal(t2.status, 'needs_info')
  assert.match(t2.message, /GSTIN batao/i)
  const t3 = await turn(cm, id, '23ABCDE1234F1Z5', [])
  assert.equal(t3.status, 'needs_info')
  assert.match(t3.message, /Material ka naam batao/i)
  assert.equal(cm.get(id).billType, 'gst')
  assert.equal(cm.get(id).gstin, '23ABCDE1234F1Z5')
})

test('conversation: add item/qty/rate then confirm summary', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  await turn(cm, id, 'GST', [])
  await turn(cm, id, '23ABCDE1234F1Z5', [])
  const t4 = await turn(cm, id, 'Sariya 750 kilo 58 rupaye', [])
  assert.equal(t4.status, 'needs_info')
  assert.match(t4.message, /Rate batao/i)
  const t5 = await turn(cm, id, '58 rupaye', [])
  assert.equal(t5.status, 'needs_confirm')
  assert.match(t5.message, /Vijay Singh ka GST bill/)
  assert.match(t5.message, /43,500|43500/)
  const draft = cm.draftForExecution(id)
  assert.equal(draft.items[0].qty, 750)
  assert.equal(draft.items[0].rate, 58)
  assert.equal(draft.billType, 'gst')
  assert.equal(draft.customer.gstin, '23ABCDE1234F1Z5')
})

test('conversation: missing customer asks customer', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const t = await turn(cm, id, '50 bag cement 390 ke bill', [])
  assert.equal(t.status, 'needs_info')
  assert.match(t.message, /Customer ka naam batao/i)
})

test('conversation: missing item asks material (kaccha flow)', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await turn(cm, id, 'Ramesh ke naam ka bill banana hai', [])
  const t = await turn(cm, id, 'kaccha', [])
  assert.equal(t.status, 'needs_info')
  assert.match(t.message, /Material ka naam batao/i)
})

test('conversation: missing rate asks rate', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await turn(cm, id, 'Ramesh ke naam ka bill banana hai', knownCustomers)
  const t = await turn(cm, id, '50 bag ACC cement', knownCustomers)
  assert.equal(t.status, 'needs_info')
  assert.match(t.message, /Rate batao/i)
})

test('conversation: kaccha bill does not ask gstin', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await turn(cm, id, 'Ramesh ka bill banana hai', knownCustomers)
  const t = await turn(cm, id, 'kaccha', knownCustomers)
  assert.equal(t.status, 'needs_info')
  assert.match(t.message, /Material ka naam batao/i)
  assert.equal(cm.get(id).billType, 'kaccha')
})

test('conversation: confirmation does not execute before fields complete', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  assert.equal(cm.canExecute(id), false)
  const t = await turn(cm, id, 'Haan', [])
  assert.notEqual(t.status, 'execute')
})

test('conversation: confirm executes exactly once and double confirm blocked', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await turn(cm, id, 'Ramesh ke naam 50 bag cement 390 ke bill bana do', knownCustomers)
  assert.equal(cm.canExecute(id), true)
  cm.markExecuted(id, { id: 'inv-x', invoiceNo: '0001' })
  assert.equal(cm.canExecute(id), false, 'double execution must be blocked')
  const t2 = await turn(cm, id, 'Haan', knownCustomers)
  assert.notEqual(t2.status, 'execute')
})

test('conversation: existing single-turn complete bill asks confirmation', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const t = await turn(cm, id, 'Ramesh ke naam 50 bag cement 390 ke bill bana do', knownCustomers)
  assert.equal(t.status, 'needs_confirm')
  assert.match(t.message, /Bill bana doon/i)
  assert.equal(t.renderDraft.customer.name, 'Ramesh')
  assert.equal(t.renderDraft.billType, 'kaccha')
})

test('conversation: intent switch to stock is handled safely (draft kept for queries)', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  await turn(cm, id, 'GST', [])
  await turn(cm, id, '23ABCDE1234F1Z5', [])
  const stockParsed = parseLocal('ACC cement ka stock kitna hai', [])
  const t = await cm.processTurn(id, 'ACC cement ka stock kitna hai', stockParsed, ctxOf([]))
  assert.equal(t.status, 'intent_switch')
  assert.equal(cm.get(id).customer.name, 'Vijay Singh', 'draft must survive the query')
  assert.equal(cm.get(id).billType, 'gst')
})

test('conversation: fresh conversation has no stale state', async () => {
  const cm = new ConversationManager()
  const id1 = cm.newConversation()
  await turn(cm, id1, 'Vijay Singh ka bill banana hai', [])
  const id2 = cm.newConversation()
  assert.equal(cm.get(id2).intent, null)
  assert.equal(cm.get(id2).customer, null)
})

test('conversation: seeded customer opens existing flow', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  cm.seedCustomer(id, { id: 'c1', name: 'Ramesh', mobile: '', gstin: '', billType: 'kaccha' })
  assert.equal(cm.get(id).customer.name, 'Ramesh')
  assert.equal(cm.get(id).billType, 'kaccha')
  const ctx = { customers: [], stockItems: [], company: null, resolveCustomer: async () => ({ customer: null, ambiguous: [] }) }
  const r = await cm.processTurn(id, '50 bag cement 390 ke', parseLocal('50 bag cement 390 ke', []), ctx)
  assert.equal(r.status, 'needs_confirm')
  const draft = cm.draftForExecution(id)
  assert.equal(draft.customer.name, 'Ramesh')
  assert.equal(draft.items[0].rate, 390)
})

test('conversation: ambiguous customer asks which', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const customers = [{ name: 'Vijay Singh', id: 'a' }, { name: 'Vijay Traders', id: 'b' }]
  const ctx = { customers, stockItems: [], company: null, resolveCustomer: async (n) => ({ customer: null, ambiguous: customers }) }
  const r = await cm.processTurn(id, 'Vijay ka bill banana hai', parseLocal('Vijay ka bill banana hai', customers), ctx)
  assert.equal(r.status, 'ambiguous_customer')
  assert.match(r.message, /do customer/)
})

test('conversation: historical rate suggested, applied on confirm (never silent)', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  cm.seedCustomer(id, { id: 'c1', name: 'Vijay Singh', gstin: '23ABCDE1234F1Z5', billType: 'gst' })
  const ctx = {
    customers: [{ id: 'c1', name: 'Vijay Singh', gstin: '23ABCDE1234F1Z5', billType: 'gst' }],
    stockItems: [], company: null,
    resolveCustomer: async () => ({ customer: null, ambiguous: [] }),
    getHistory: async (cid) => ({ customer: { id: cid }, recentBills: [{ billType: 'gst' }], recentItems: [{ name: 'TMT Steel', unit: 'kg', rate: 58 }], recentRates: [{ item: 'TMT Steel', unit: 'kg', rate: 58 }], recentBillTypes: ['gst'], savedGstin: '23ABCDE1234F1Z5' })
  }
  const t1 = await cm.processTurn(id, 'Sariya 750 kilo', parseLocal('Sariya 750 kilo', ctx.customers), ctx)
  assert.equal(t1.status, 'suggest', 'history value is suggested, not applied')
  assert.match(t1.message, /Wahi rakhun/i)
  const t2 = await cm.processTurn(id, 'Haan', parseLocal('Haan', ctx.customers), ctx)
  assert.equal(t2.status, 'needs_confirm')
  const draft = cm.draftForExecution(id)
  assert.equal(draft.items[0].rate, 58, 'rate applied only after confirm')
})

test('conversation: multiple historical rates produce clarification', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  cm.seedCustomer(id, { id: 'c1', name: 'Vijay Singh', billType: 'kaccha' })
  const ctx = {
    customers: [], stockItems: [], company: null,
    resolveCustomer: async () => ({ customer: null, ambiguous: [] }),
    getHistory: async () => ({ recentBills: [], recentItems: [], recentRates: [{ item: 'TMT Steel', rate: 58 }, { item: 'TMT Steel', rate: 61 }], recentBillTypes: ['kaccha'], savedGstin: '' })
  }
  const r = await cm.processTurn(id, 'Sariya 750 kilo', parseLocal('Sariya 750 kilo', []), ctx)
  assert.equal(r.status, 'needs_info')
  assert.match(r.message, /58|61/)
})
