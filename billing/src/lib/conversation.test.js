import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ConversationManager } from './conversation.js'
import { parseLocal } from './voice.js'

const knownCustomers = [
  { name: 'Ramesh', mobile: '', gstin: '', billType: 'kaccha' },
  { name: 'Vijay Singh', mobile: '', gstin: '23ABCDE1234F1Z5', billType: 'gst' }
]

const ctxOf = (customers) => ({ customers, stockItems: [], company: null })

const turn = (cm, id, text, customers) => {
  const ctx = ctxOf(customers)
  return cm.processTurn(id, text, parseLocal(text, customers), ctx)
}

test('conversation: start bill, draft persists across turns', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const t1 = turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  assert.equal(t1.status, 'needs_info')
  assert.match(t1.message, /GST ya kaccha/i)
  const c = cm.get(id)
  assert.equal(c.intent, 'create_bill')
  assert.equal(c.customer.name, 'Vijay Singh')
  assert.equal(c.items.length, 0)
})

test('conversation: add bill type then gstin then material', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  const t2 = turn(cm, id, 'GST', [])
  assert.equal(t2.status, 'needs_info')
  assert.match(t2.message, /GSTIN batao/i)
  const t3 = turn(cm, id, '23ABCDE1234F1Z5', [])
  assert.equal(t3.status, 'needs_info')
  assert.match(t3.message, /Material ka naam batao/i)
  assert.equal(cm.get(id).billType, 'gst')
  assert.equal(cm.get(id).gstin, '23ABCDE1234F1Z5')
})

test('conversation: add item/qty/rate then confirm summary', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  turn(cm, id, 'GST', [])
  turn(cm, id, '23ABCDE1234F1Z5', [])
  const t4 = turn(cm, id, 'Sariya 750 kilo 58 rupaye', [])
  assert.equal(t4.status, 'needs_info')
  assert.match(t4.message, /Rate batao/i)
  const t5 = turn(cm, id, '58 rupaye', [])
  assert.equal(t5.status, 'needs_confirm')
  assert.match(t5.message, /Vijay Singh ka GST bill/)
  assert.match(t5.message, /43,500|43500/)
  const draft = cm.draftForExecution(id)
  assert.equal(draft.items[0].qty, 750)
  assert.equal(draft.items[0].rate, 58)
  assert.equal(draft.billType, 'gst')
  assert.equal(draft.customer.gstin, '23ABCDE1234F1Z5')
})

test('conversation: missing customer asks customer', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const t = turn(cm, id, '50 bag cement 390 ke bill', [])
  assert.equal(t.status, 'needs_info')
  assert.match(t.message, /Customer ka naam batao/i)
})

test('conversation: missing item asks material (kaccha flow)', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  turn(cm, id, 'Ramesh ke naam ka bill banana hai', [])
  const t = turn(cm, id, 'kaccha', [])
  assert.equal(t.status, 'needs_info')
  assert.match(t.message, /Material ka naam batao/i)
})

test('conversation: missing rate asks rate', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  turn(cm, id, 'Ramesh ke naam ka bill banana hai', knownCustomers)
  const t = turn(cm, id, '50 bag ACC cement', knownCustomers)
  assert.equal(t.status, 'needs_info')
  assert.match(t.message, /Rate batao/i)
})

test('conversation: kaccha bill does not ask gstin', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  turn(cm, id, 'Ramesh ka bill banana hai', knownCustomers)
  const t = turn(cm, id, 'kaccha', knownCustomers)
  assert.equal(t.status, 'needs_info')
  assert.match(t.message, /Material ka naam batao/i)
  assert.equal(cm.get(id).billType, 'kaccha')
})

test('conversation: confirmation does not execute before fields complete', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  assert.equal(cm.canExecute(id), false)
  const t = turn(cm, id, 'Haan', [])
  assert.notEqual(t.status, 'execute')
})

test('conversation: confirm executes exactly once and double confirm blocked', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  turn(cm, id, 'Ramesh ke naam 50 bag cement 390 ke bill bana do', knownCustomers)
  assert.equal(cm.canExecute(id), true)
  cm.markExecuted(id, { id: 'inv-x', invoiceNo: '0001' })
  assert.equal(cm.canExecute(id), false, 'double execution must be blocked')
  const t2 = turn(cm, id, 'Haan', knownCustomers)
  assert.notEqual(t2.status, 'execute')
})

test('conversation: existing single-turn complete bill asks confirmation', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const t = turn(cm, id, 'Ramesh ke naam 50 bag cement 390 ke bill bana do', knownCustomers)
  assert.equal(t.status, 'needs_confirm')
  assert.match(t.message, /Bill bana doon/i)
  assert.equal(t.renderDraft.customer.name, 'Ramesh')
  assert.equal(t.renderDraft.billType, 'kaccha')
})

test('conversation: intent switch to stock is handled safely (draft kept for queries)', () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  turn(cm, id, 'Vijay Singh ka bill banana hai', [])
  turn(cm, id, 'GST', [])
  turn(cm, id, '23ABCDE1234F1Z5', [])
  const stockParsed = parseLocal('ACC cement ka stock kitna hai', [])
  const t = cm.processTurn(id, 'ACC cement ka stock kitna hai', stockParsed, ctxOf([]))
  assert.equal(t.status, 'intent_switch')
  assert.equal(cm.get(id).customer.name, 'Vijay Singh', 'draft must survive the query')
  assert.equal(cm.get(id).billType, 'gst')
})

test('conversation: fresh conversation has no stale state', () => {
  const cm = new ConversationManager()
  const id1 = cm.newConversation()
  turn(cm, id1, 'Vijay Singh ka bill banana hai', [])
  const id2 = cm.newConversation()
  assert.equal(cm.get(id2).intent, null)
  assert.equal(cm.get(id2).customer, null)
})
