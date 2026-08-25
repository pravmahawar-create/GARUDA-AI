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

test('payment: record amount + customer via voice, then confirm executes', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const customers = [{ name: 'Vijay Singh', id: 'c1' }]
  const ctx = { customers, stockItems: [], company: null, resolveCustomer: async (name) => { const h = customers.filter(c => c.name.toLowerCase().includes(name.toLowerCase())); return { customer: h.length === 1 ? h[0] : null, ambiguous: h.length > 1 ? h : [] } } }
  const t = await cm.processTurn(id, 'Vijay Singh ne 50 hazaar diye hain', parseLocal('Vijay Singh ne 50 hazaar diye hain', customers), ctx)
  assert.equal(t.status, 'payment_confirm')
  assert.equal(t.renderFinance.amount, 50000)
  assert.equal(t.renderFinance.customer.name, 'Vijay Singh')
  const t2 = await cm.processTurn(id, 'Haan', parseLocal('Haan', customers), ctx)
  assert.equal(t2.status, 'payment_execute')
})

test('payment: missing amount asks amount', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const customers = [{ name: 'Vijay Singh', id: 'c1' }]
  const ctx = { customers, stockItems: [], company: null, resolveCustomer: async (name) => { const h = customers.filter(c => c.name.toLowerCase().includes(name.toLowerCase())); return { customer: h.length === 1 ? h[0] : null, ambiguous: [] } } }
  const t = await cm.processTurn(id, 'Vijay Singh ka payment jama kar do', parseLocal('Vijay Singh ka payment jama kar do', customers), ctx)
  assert.equal(t.status, 'payment_needs_info')
  assert.match(t.message, /Kitna|payment/)
})

test('payment: ambiguous customer asks which', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const customers = [{ name: 'Vijay Singh', id: 'a' }, { name: 'Vijay Traders', id: 'b' }]
  const ctx = { customers, stockItems: [], company: null, resolveCustomer: async (name) => { const h = customers.filter(c => c.name.toLowerCase().includes(name.toLowerCase())); return { customer: null, ambiguous: h.length > 1 ? h : [] } } }
  const t = await cm.processTurn(id, 'Vijay ne 20 hazaar diye', parseLocal('Vijay ne 20 hazaar diye', customers), ctx)
  assert.equal(t.status, 'ambiguous_customer')
  assert.match(t.message, /do customer/)
})

test('payment: khata query returns status', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const customers = [{ name: 'Vijay Singh', id: 'c1' }]
  const ctx = { customers, stockItems: [], company: null }
  const t = await cm.processTurn(id, 'Vijay Singh ka khata dikhao', parseLocal('Vijay Singh ka khata dikhao', customers), ctx)
  assert.equal(t.status, 'khata_query')
  assert.equal(t.customerName, 'Vijay Singh')
})

test('payment: upi qr request returns status', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const customers = [{ name: 'Vijay Singh', id: 'c1' }]
  const ctx = { customers, stockItems: [], company: null, resolveCustomer: async () => ({ customer: null, ambiguous: [] }) }
  const t = await cm.processTurn(id, 'Vijay Singh ko payment ke liye QR dikhao', parseLocal('Vijay Singh ko payment ke liye QR dikhao', customers), ctx)
  assert.equal(t.status, 'upi_qr')
  assert.equal(t.customerName, 'Vijay Singh')
})

test('payment: last payment query returns status', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const customers = [{ name: 'Vijay Singh', id: 'c1' }]
  const ctx = { customers, stockItems: [], company: null }
  const t = await cm.processTurn(id, 'Vijay Singh ki last payment kab aayi', parseLocal('Vijay Singh ki last payment kab aayi', customers), ctx)
  assert.equal(t.status, 'last_payment_query')
  assert.equal(t.customerName, 'Vijay Singh')
})

test('payment: existing bill flow unchanged', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const customers = [{ name: 'Ramesh', id: 'c1', billType: 'kaccha' }]
  const ctx = { customers, stockItems: [], company: null, resolveCustomer: async () => ({ customer: null, ambiguous: [] }) }
  await cm.processTurn(id, 'Ramesh ke naam 50 bag cement 390 ke bill bana do', parseLocal('Ramesh ke naam 50 bag cement 390 ke bill bana do', customers), ctx)
  assert.equal(cm.canExecute(id), true)
  const draft = cm.draftForExecution(id)
  assert.equal(draft.items[0].rate, 390)
})

const emptyCtx = { customers: [], stockItems: [], company: null, resolveCustomer: async () => ({ customer: null, ambiguous: [] }) }

async function startContinuousBill(cm, id) {
  await cm.processTurn(id, 'Ramesh ka bill banana hai', parseLocal('Ramesh ka bill banana hai', []), emptyCtx)
  await cm.processTurn(id, 'kaccha', parseLocal('kaccha', []), emptyCtx)
  const r = await cm.processTurn(id, 'items bolta jaunga', parseLocal('items bolta jaunga', []), emptyCtx)
  assert.equal(r.status, 'needs_info')
  assert.match(r.message, /Items bolte jao/i)
}

test('continuous: multiple items append to the same draft', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  await cm.processTurn(id, '5 kilo sugar 48 ke rate se', parseLocal('5 kilo sugar 48 ke rate se', []), emptyCtx)
  await cm.processTurn(id, '10 kilo atta 42 ke rate se', parseLocal('10 kilo atta 42 ke rate se', []), emptyCtx)
  await cm.processTurn(id, '2 litre oil 145 ke rate se', parseLocal('2 litre oil 145 ke rate se', []), emptyCtx)
  const c = cm.get(id)
  assert.equal(c.items.length, 3)
  assert.equal(c.items[0].name, 'Sugar')
  assert.equal(c.items[0].qty, 5)
  assert.equal(c.items[1].name, 'Atta')
  assert.equal(c.items[2].name, 'Oil')
  assert.equal(c.items[2].unit, 'litre')
})

test('continuous: 5+ recognition windows preserve one conversation', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  // window 1: customer
  await cm.processTurn(id, 'Ramesh ka bill banana hai', parseLocal('Ramesh ka bill banana hai', []), emptyCtx)
  // window 2: bill type
  await cm.processTurn(id, 'kaccha', parseLocal('kaccha', []), emptyCtx)
  // window 3: opt in
  await cm.processTurn(id, 'items bolta jaunga', parseLocal('items bolta jaunga', []), emptyCtx)
  // window 4/5/6: items
  await cm.processTurn(id, '5 kilo sugar 48 ke rate se', parseLocal('5 kilo sugar 48 ke rate se', []), emptyCtx)
  await cm.processTurn(id, '10 kilo atta 42 ke rate se', parseLocal('10 kilo atta 42 ke rate se', []), emptyCtx)
  await cm.processTurn(id, '2 litre oil 145 ke rate se', parseLocal('2 litre oil 145 ke rate se', []), emptyCtx)
  const c = cm.get(id)
  assert.equal(c.customer.name, 'Ramesh')
  assert.equal(c.billType, 'kaccha')
  assert.equal(c.items.length, 3, 'recognition windows must not reset the draft')
})

test('continuous: 200+ items preserve order and data integrity', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  for (let i = 1; i <= 200; i++) {
    const r = await cm.processTurn(id, i + ' kilo item' + i + ' ' + (100 + i) + ' ke rate se', parseLocal(i + ' kilo item' + i + ' ' + (100 + i) + ' ke rate se', []), emptyCtx)
    assert.equal(r.status, 'needs_info', 'continuous must keep accepting items at ' + i)
  }
  const c = cm.get(id)
  assert.equal(c.items.length, 200)
  assert.equal(c.items[0].name, 'Item1')
  assert.equal(c.items[199].name, 'Item200')
  assert.equal(c.items[199].qty, 200)
  assert.equal(c.items[199].rate, 300)
  const fin = await cm.processTurn(id, 'bas', parseLocal('bas', []), emptyCtx)
  assert.equal(fin.status, 'needs_confirm')
  assert.equal(cm.canExecute(id), true)
  assert.equal(cm.isContinuous(id), null, 'bas must exit continuous mode')
})

test('continuous: recognition window stop does not create a new conversation', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  await cm.processTurn(id, '5 kilo sugar 48 ke rate se', parseLocal('5 kilo sugar 48 ke rate se', []), emptyCtx)
  const beforeId = id
  // A "window stop" is simulated by the next utterance arriving on the SAME conversation id.
  await cm.processTurn(id, '10 kilo atta 42 ke rate se', parseLocal('10 kilo atta 42 ke rate se', []), emptyCtx)
  assert.equal(cm.get(beforeId).customer.name, 'Ramesh')
  assert.equal(cm.get(beforeId).items.length, 2)
})

test('continuous: "bas" exits and "cancel" discards draft', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  await cm.processTurn(id, '5 kilo sugar 48 ke rate se', parseLocal('5 kilo sugar 48 ke rate se', []), emptyCtx)
  const r = await cm.processTurn(id, 'bas', parseLocal('bas', []), emptyCtx)
  assert.equal(r.status, 'needs_confirm')
  assert.equal(cm.isContinuous(id), null)
  // cancel discards
  const cm2 = new ConversationManager()
  const id2 = cm2.newConversation()
  await startContinuousBill(cm2, id2)
  await cm2.processTurn(id2, '5 kilo sugar 48 ke rate se', parseLocal('5 kilo sugar 48 ke rate se', []), emptyCtx)
  const c2 = await cm2.processTurn(id2, 'cancel', parseLocal('cancel', []), emptyCtx)
  assert.equal(c2.status, 'none')
  assert.equal(cm2.get(id2).items.length, 0, 'cancel must discard the draft')
})

test('continuous: undo removes only the latest item', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  await cm.processTurn(id, '5 kilo sugar 48 ke rate se', parseLocal('5 kilo sugar 48 ke rate se', []), emptyCtx)
  await cm.processTurn(id, '10 kilo atta 42 ke rate se', parseLocal('10 kilo atta 42 ke rate se', []), emptyCtx)
  const r = await cm.processTurn(id, 'pichla item hatao', parseLocal('pichla item hatao', []), emptyCtx)
  assert.match(r.message, /Pichla item hata diya/i)
  const c = cm.get(id)
  assert.equal(c.items.length, 1)
  assert.equal(c.items[0].name, 'Sugar')
})

test('continuous: corrections to rate, quantity and product', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  await cm.processTurn(id, '5 kilo sugar 48 ke rate se', parseLocal('5 kilo sugar 48 ke rate se', []), emptyCtx)
  await cm.processTurn(id, 'pichle item ka rate 50 kar do', parseLocal('pichle item ka rate 50 kar do', []), emptyCtx)
  assert.equal(cm.get(id).items[0].rate, 50)
  await cm.processTurn(id, 'pichle item ki quantity 8 kar do', parseLocal('pichle item ki quantity 8 kar do', []), emptyCtx)
  assert.equal(cm.get(id).items[0].qty, 8)
  await cm.processTurn(id, 'pichla item sugar nahi salt tha', parseLocal('pichla item sugar nahi salt tha', []), emptyCtx)
  assert.equal(cm.get(id).items[0].name, 'Salt')
})

test('continuous: ambiguous correction asks rather than guessing', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  await cm.processTurn(id, '5 kilo sugar 48 ke rate se', parseLocal('5 kilo sugar 48 ke rate se', []), emptyCtx)
  const r = await cm.processTurn(id, 'pichle item ka rate batao', parseLocal('pichle item ka rate batao', []), emptyCtx)
  assert.equal(r.status, 'needs_info')
  assert.equal(cm.get(id).items[0].rate, 48, 'no guess applied')
})

test('continuous: missing rate creates item-level clarification', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  const r = await cm.processTurn(id, '20 kilo dal', parseLocal('20 kilo dal', []), emptyCtx)
  assert.equal(r.status, 'needs_info')
  assert.match(r.message, /Rate batao/i)
  assert.equal(cm.get(id).items[0].name, 'Dal')
  const r2 = await cm.processTurn(id, '110', parseLocal('110', []), emptyCtx)
  assert.equal(cm.get(id).items[0].rate, 110)
})

test('continuous: missing product does not fabricate product', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  const r = await cm.processTurn(id, '3000 bori 340 ke bhav se', parseLocal('3000 bori 340 ke bhav se', []), emptyCtx)
  assert.equal(r.status, 'needs_info')
  assert.match(r.message, /Material ka naam/i)
  assert.equal(cm.get(id).items.length, 0, 'must not fabricate an item')
})

test('continuous: duplicate items remain separate', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  await cm.processTurn(id, '10 kilo sugar 48 ke rate se', parseLocal('10 kilo sugar 48 ke rate se', []), emptyCtx)
  await cm.processTurn(id, '5 kilo sugar 50 ke rate se', parseLocal('5 kilo sugar 50 ke rate se', []), emptyCtx)
  assert.equal(cm.get(id).items.length, 2, 'duplicates are separate lines unless explicitly merged')
})

test('continuous: no bill executed before confirmation', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await startContinuousBill(cm, id)
  await cm.processTurn(id, '5 kilo sugar 48 ke rate se', parseLocal('5 kilo sugar 48 ke rate se', []), emptyCtx)
  // A confirm word mid-continuous should NOT execute the bill
  const r = await cm.processTurn(id, 'haan', parseLocal('haan', []), emptyCtx)
  assert.notEqual(r.status, 'execute')
  assert.equal(cm.canExecute(id), true, 'draft intact, awaiting bas + confirm')
})

test('inventory: continuous inventory builds a draft, commits only on confirm', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  const r1 = await cm.processTurn(id, 'inventory banana hai items bolta jaunga', parseLocal('inventory banana hai items bolta jaunga', []), emptyCtx)
  assert.equal(r1.status, 'needs_info')
  await cm.processTurn(id, 'ACC cement 500 bag', parseLocal('ACC cement 500 bag', []), emptyCtx)
  await cm.processTurn(id, 'Ambuja 300 bag', parseLocal('Ambuja 300 bag', []), emptyCtx)
  assert.equal(cm.inventoryItems(id).length, 2)
  assert.equal(cm.isContinuous(id), 'inventory')
  const fin = await cm.processTurn(id, 'bas', parseLocal('bas', []), emptyCtx)
  assert.equal(fin.status, 'inventory_confirm')
  assert.match(fin.message, /Inventory review/)
  assert.equal(cm.isContinuous(id), null)
})

test('inventory: cancel discards inventory draft', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()
  await cm.processTurn(id, 'inventory banana hai items bolta jaunga', parseLocal('inventory banana hai items bolta jaunga', []), emptyCtx)
  await cm.processTurn(id, 'ACC cement 500 bag', parseLocal('ACC cement 500 bag', []), emptyCtx)
  const r = await cm.processTurn(id, 'cancel', parseLocal('cancel', []), emptyCtx)
  assert.equal(r.status, 'none')
  assert.equal(cm.inventoryItems(id).length, 0, 'cancel must discard inventory draft')
})
