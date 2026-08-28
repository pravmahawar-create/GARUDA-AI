import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { ConversationManager } from './conversation.js'
import { processV3NluTurn } from './v3NluEngine.js'
import { db } from '../db.js'

const mockCtx = { customers: [], stockItems: [], getHistory: () => null, resolveCustomer: () => null }

beforeEach(async () => {
  try {
    await db.conversationSessions.clear()
    await db.invoices.clear()
    await db.customers.clear()
  } catch (e) {}
})

// ============================================================================
// PHASE V3 VOICE INTELLIGENCE — FIRST-CLASS CONVERSATIONAL SUITE
// ============================================================================

test('V3.1: Basic Multi-Turn Dialogue (Customer -> Item/Qty -> Rate)', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  // Turn 1: Customer
  await cm.processTurn(id, 'Ravi ka bill bana do.', { intent: 'create_bill', customer: { name: 'Ravi' } }, mockCtx)
  assert.equal(cm.get(id).customer.name, 'Ravi')

  // Turn 2: Item & Quantity
  await cm.processTurn(id, '50 bag ACC cement.', { intent: 'create_bill', items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 0 }] }, mockCtx)
  assert.equal(cm.get(id).items.length, 1)
  assert.equal(cm.get(id).items[0].qty, 50)

  // Turn 3: Rate
  const turn3 = await cm.processTurn(id, '390.', { intent: 'create_bill' }, mockCtx)
  assert.equal(cm.get(id).items[0].rate, 390)
  assert.equal(turn3.status, 'needs_confirm')
})

test('V3.2: Rate Correction ("390 nahi 395")', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  await cm.processTurn(id, 'Ravi ke naam 50 bag ACC cement 390 ke rate se bill banao', {
    intent: 'create_bill', customer: { name: 'Ravi' }, items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 390 }]
  }, mockCtx)

  assert.equal(cm.get(id).items[0].rate, 390)

  // Rate Correction turn
  await cm.processTurn(id, '390 nahi 395.', {}, mockCtx)
  assert.equal(cm.get(id).items[0].rate, 395)
})

test('V3.3: Quantity Correction ("50 nahi 60 bag")', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  await cm.processTurn(id, 'Ravi ke naam 50 bag ACC cement 390 ke rate se bill banao', {
    intent: 'create_bill', customer: { name: 'Ravi' }, items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 390 }]
  }, mockCtx)

  assert.equal(cm.get(id).items[0].qty, 50)

  // Quantity Correction turn
  await cm.processTurn(id, '50 nahi 60 bag.', {}, mockCtx)
  assert.equal(cm.get(id).items[0].qty, 60)
})

test('V3.4: Customer Correction ("Ravi nahi Ramesh")', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  await cm.processTurn(id, 'Ravi ke naam 50 bag ACC cement 390 ke rate se bill banao', {
    intent: 'create_bill', customer: { name: 'Ravi' }, items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 390 }]
  }, mockCtx)

  assert.equal(cm.get(id).customer.name, 'Ravi')

  // Customer Correction turn
  await cm.processTurn(id, 'Ravi nahi Ramesh.', {}, mockCtx)
  assert.equal(cm.get(id).customer.name, 'Ramesh')
})

test('V3.5: Product Correction ("ACC nahi UltraTech")', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  await cm.processTurn(id, 'Ravi ke naam 50 bag ACC cement 390 ke rate se bill banao', {
    intent: 'create_bill', customer: { name: 'Ravi' }, items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 390 }]
  }, mockCtx)

  assert.equal(cm.get(id).items[0].name, 'ACC Cement')

  // Product Correction turn
  await cm.processTurn(id, 'ACC nahi UltraTech.', {}, mockCtx)
  assert.equal(cm.get(id).items[0].name.toUpperCase(), 'ULTRATECH')
})

test('V3.6: Tax Modification ("Bina GST" & "GST nahi")', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  await cm.processTurn(id, 'Ravi ke naam 50 bag ACC cement 390 ke rate se bill banao', {
    intent: 'create_bill', customer: { name: 'Ravi' }, items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 390 }]
  }, mockCtx)

  // Tax Modification turn
  await cm.processTurn(id, 'Bina GST.', {}, mockCtx)
  assert.equal(cm.get(id).billType, 'kaccha')
})

test('V3.7: Transport Addition ("Transport bhi")', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  await cm.processTurn(id, 'Ravi ke naam 50 bag ACC cement 390 ke rate se bill banao', {
    intent: 'create_bill', customer: { name: 'Ravi' }, items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 390 }]
  }, mockCtx)

  // Transport Addition turn
  await cm.processTurn(id, 'Transport bhi.', {}, mockCtx)
  assert.equal(cm.get(id).transport.type, 'included')
})

test('V3.8: Sequential Multi-Turn Dialogue ("390" -> "nahi 395" -> "Bina GST" -> "Transport bhi")', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  // 1. Initial
  await cm.processTurn(id, 'Ravi ka bill bana do.', { intent: 'create_bill', customer: { name: 'Ravi' } }, mockCtx)
  await cm.processTurn(id, '50 bag ACC cement.', { intent: 'create_bill', items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 0 }] }, mockCtx)
  await cm.processTurn(id, '390.', {}, mockCtx)

  assert.equal(cm.get(id).items[0].rate, 390)

  // 2. Correction
  await cm.processTurn(id, '390 nahi 395.', {}, mockCtx)
  assert.equal(cm.get(id).items[0].rate, 395)

  // 3. Tax Modification
  await cm.processTurn(id, 'Bina GST.', {}, mockCtx)
  assert.equal(cm.get(id).billType, 'kaccha')

  // 4. Transport Addition
  await cm.processTurn(id, 'Transport bhi.', {}, mockCtx)
  assert.equal(cm.get(id).transport.type, 'included')
  assert.equal(cm.get(id).customer.name, 'Ravi')
  assert.equal(cm.get(id).items[0].qty, 50)
  assert.equal(cm.get(id).items[0].rate, 395)
})

test('V3.9: Devanagari Hindi Text Transliteration & Rate Correction', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  await cm.processTurn(id, 'Ravi ke naam 50 bag ACC cement 390 ke rate se bill banao', {
    intent: 'create_bill', customer: { name: 'Ravi' }, items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 390 }]
  }, mockCtx)

  // Devanagari Correction
  await cm.processTurn(id, 'नहीं इसको 395 के भाव से बनाओ', {}, mockCtx)
  assert.equal(cm.get(id).items[0].rate, 395)
})

test('V3.10: No Active Draft Safety Guard ("395 kar do" with no draft prompts user)', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  const res = await cm.processTurn(id, '395 kar do.', {}, mockCtx)
  assert.equal(res.status, 'needs_info')
  assert.equal(res.message.includes('Pehle bill draft'), true)
})
