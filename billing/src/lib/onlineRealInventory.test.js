import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import {
  db,
  saveCompany,
  setActiveCompany,
  saveItem,
  getItems,
  findStockItem,
  saveCustomer
} from '../db.js'
import { ConversationManager } from './conversation.js'

const mockCtx = { customers: [], stockItems: [], getHistory: () => null, resolveCustomer: () => null }

beforeEach(async () => {
  try {
    await db.companies.clear()
    await db.customers.clear()
    await db.items.clear()
    await db.invoices.clear()
    await db.conversationSessions.clear()
  } catch (e) {}
})

test('ONLINE-FIRST REAL INVENTORY INTELLIGENCE: 750 ACC + 200 UltraTech + 1000 JK Laxmi = 1950 Bags Total Cement', async () => {
  // 1. Setup Company A (Trading Co)
  const compA = await saveCompany({ id: 'comp_a_trading', name: 'Trading Co' })
  await setActiveCompany(compA.id)

  // 2. Populate Real Database Items for Company A
  await saveItem({ id: 'item_acc', name: 'ACC Cement', category: 'cement', qty: 750, unit: 'bag', companyId: compA.id })
  await saveItem({ id: 'item_ultratech', name: 'UltraTech Cement', category: 'cement', qty: 200, unit: 'bag', companyId: compA.id })
  await saveItem({ id: 'item_jklaxmi', name: 'JK Laxmi Cement', category: 'cement', qty: 1000, unit: 'bag', companyId: compA.id })

  // 3. Test Query 1: "Total cement kitni hai?"
  const allItemsCompA = await getItems(compA.id)
  const cementItems = allItemsCompA.filter((i) => i.category === 'cement' || /cement/i.test(i.name))
  const totalCementQty = cementItems.reduce((sum, i) => sum + Number(i.qty || 0), 0)
  assert.equal(totalCementQty, 1950)

  // 4. Test Query 2: "ACC kitna hai?"
  const accItem = await findStockItem('ACC', compA.id)
  assert.equal(Number(accItem.qty), 750)

  // 5. Test Query 3: "UltraTech aur JK Laxmi mila ke kitna hai?"
  const ultratechItem = await findStockItem('UltraTech', compA.id)
  const jklaxmiItem = await findStockItem('JK Laxmi', compA.id)
  const combinedQty = Number(ultratechItem.qty) + Number(jklaxmiItem.qty)
  assert.equal(combinedQty, 1200)

  // 6. Test Company Isolation: Setup Company B with ACC = 100
  const compB = await saveCompany({ id: 'comp_b_mmsr', name: 'MMSR Building Materials' })
  await saveItem({ id: 'item_acc_b', name: 'ACC Cement', category: 'cement', qty: 100, unit: 'bag', companyId: compB.id })

  const accItemCompA = await findStockItem('ACC', compA.id)
  const accItemCompB = await findStockItem('ACC', compB.id)

  assert.equal(Number(accItemCompA.qty), 750)
  assert.equal(Number(accItemCompB.qty), 100)
  assert.notEqual(accItemCompA.qty, accItemCompB.qty)
})

test('ONLINE-FIRST CONVERSATIONAL BILLING DEMO: 5-Step Conversational Billing Sequence', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  // Step 4: "Ravi ka bill bana do 50 bag ACC cement."
  await cm.processTurn(id, 'Ravi ka bill bana do 50 bag ACC cement.', {
    intent: 'create_bill', customer: { name: 'Ravi' }, items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 0 }]
  }, mockCtx)

  assert.equal(cm.get(id).customer.name, 'Ravi')
  assert.equal(cm.get(id).items[0].qty, 50)

  // Step 5: "Rate 390."
  await cm.processTurn(id, 'Rate 390.', {}, mockCtx)
  assert.equal(cm.get(id).items[0].rate, 390)

  // Step 6: "Nahi 395."
  await cm.processTurn(id, 'Nahi 395.', {}, mockCtx)
  assert.equal(cm.get(id).items[0].rate, 395)

  // Step 7: "Bina GST."
  await cm.processTurn(id, 'Bina GST.', {}, mockCtx)
  assert.equal(cm.get(id).billType, 'kaccha')

  // Step 8: "Transport bhi."
  await cm.processTurn(id, 'Transport bhi.', {}, mockCtx)
  assert.equal(cm.get(id).transport.type, 'included')

  // Verify final bill draft state
  const draft = cm.get(id)
  assert.equal(draft.customer.name, 'Ravi')
  assert.equal(draft.items[0].qty, 50)
  assert.equal(draft.items[0].rate, 395)
  assert.equal(draft.billType, 'kaccha')
  assert.equal(draft.transport.type, 'included')
})
