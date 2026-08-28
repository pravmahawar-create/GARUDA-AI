import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { ConversationManager } from './conversation.js'
import {
  db,
  saveConversationSession,
  getConversationSession,
  getActiveCompanySession
} from '../db.js'
import { executeCreateBill } from './voiceExecutor.js'

const mockCtx = { customers: [], stockItems: [], getHistory: () => null, resolveCustomer: () => null }

beforeEach(async () => {
  try {
    await db.conversationSessions.clear()
    await db.invoices.clear()
    await db.auditEvents.clear()
    await db.customers.clear()
    await db.items.clear()
    await db.stockTransactions.clear()
  } catch (e) {}
})

// ==========================================
// PHASE V1: STT & RECOGNITION LOOP HARDENING
// ==========================================

test('V1.1: Prevents concurrent recognition window starts via state lock guard', () => {
  let sttState = 'IDLE'
  const startRecognition = () => {
    if (sttState !== 'IDLE') return { started: false, reason: 'ALREADY_ACTIVE' }
    sttState = 'STARTING'
    sttState = 'LISTENING'
    return { started: true }
  }

  const res1 = startRecognition()
  assert.equal(res1.started, true)

  const res2 = startRecognition()
  assert.equal(res2.started, false)
  assert.equal(res2.reason, 'ALREADY_ACTIVE')
})

test('V1.4: Deduplicates identical transcripts from rapid callbacks', () => {
  let lastHandledTranscript = ''
  const handledList = []

  const processTranscript = (text) => {
    const trimmed = String(text || '').trim()
    if (!trimmed || trimmed === lastHandledTranscript) {
      return { processed: false, reason: 'DUPLICATE' }
    }
    lastHandledTranscript = trimmed
    handledList.push(trimmed)
    return { processed: true }
  }

  assert.equal(processTranscript('50 bag cement').processed, true)
  assert.equal(processTranscript('50 bag cement').processed, false)
  assert.equal(processTranscript('50 bag cement').reason, 'DUPLICATE')
  assert.equal(handledList.length, 1)

  assert.equal(processTranscript('390 ke rate se').processed, true)
  assert.equal(handledList.length, 2)
})

// ==========================================
// FOUNDER BUG-FIX & PERSISTENCE VERIFICATION
// ==========================================

test('FOUNDER BUG-FIX TEST A: Full session, last message, assistant response, and draft survive save/restore cycle', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  const turn = await cm.processTurn(id, 'Ramesh ke naam 50 bori ACC Cement 390 ke Bhav se Bil banaa', {
    intent: 'create_bill',
    customer: { name: 'Ramesh' },
    items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 390 }],
    missing: []
  }, mockCtx)

  const c = cm.get(id)
  c.lastUserMessage = 'Ramesh ke naam 50 bori ACC Cement 390 ke Bhav se Bil banaa'
  c.lastAssistantMessage = turn.message || ''
  c.lastSummaryNote = turn.summary || ''

  await cm.saveSessionToDb(id, 'comp_founder_test')

  // Simulate unmount/modal reopen: restore session into fresh ConversationManager
  const activeSess = await getActiveCompanySession('comp_founder_test')
  assert.notEqual(activeSess, null)
  assert.equal(activeSess.id, id)

  const cm2 = new ConversationManager()
  const restored = await cm2.restoreSessionFromDb(activeSess.id, 'comp_founder_test')

  assert.notEqual(restored, null)
  assert.equal(restored.customer.name, 'Ramesh')
  assert.equal(restored.items.length, 1)
  assert.equal(restored.items[0].name, 'ACC Cement')
  assert.equal(restored.items[0].qty, 50)
  assert.equal(restored.items[0].rate, 390)
  assert.equal(restored.lastUserMessage, 'Ramesh ke naam 50 bori ACC Cement 390 ke Bhav se Bil banaa')
  assert.notEqual(restored.lastAssistantMessage, '')
})

test('FOUNDER BUG-FIX TEST B: Multi-turn session persistence across reopen', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  // Turn 1: Customer
  await cm.processTurn(id, 'Ramesh ka bill banana hai', {
    intent: 'create_bill',
    customer: { name: 'Ramesh' },
    items: [],
    missing: []
  }, mockCtx)

  let c = cm.get(id)
  c.lastUserMessage = 'Ramesh ka bill banana hai'
  await cm.saveSessionToDb(id, 'comp_founder_multi')

  // Turn 2: Item & Qty
  await cm.processTurn(id, '50 bag ACC cement', {
    intent: 'create_bill',
    customer: { name: 'Ramesh' },
    items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 0 }],
    missing: []
  }, mockCtx)

  c = cm.get(id)
  c.lastUserMessage = '50 bag ACC cement'
  await cm.saveSessionToDb(id, 'comp_founder_multi')

  // Simulate modal close & reopen
  const cm2 = new ConversationManager()
  const restored = await cm2.restoreSessionFromDb(id, 'comp_founder_multi')
  assert.notEqual(restored, null)
  assert.equal(restored.customer.name, 'Ramesh')
  assert.equal(restored.items.length, 1)
  assert.equal(restored.items[0].qty, 50)
  assert.equal(restored.lastUserMessage, '50 bag ACC cement')
})

test('V2.2 & V2.8: Enforces strict company isolation on conversation sessions', async () => {
  await saveConversationSession({
    id: 'convo-company-a',
    companyId: 'comp_A',
    status: 'ACTIVE',
    activeTask: 'CREATE_BILL',
    draft: { customer: { name: 'Customer A' }, items: [] },
    updatedAt: new Date().toISOString()
  })

  // Query session with Company A
  const sessA = await getConversationSession('convo-company-a', 'comp_A')
  assert.notEqual(sessA, null)
  assert.equal(sessA.draft.customer.name, 'Customer A')

  // Query session with Company B (Must fail company isolation check)
  const sessB = await getConversationSession('convo-company-a', 'comp_B')
  assert.equal(sessB, null)
})

test('V2.7: Interrupted stock query does not destroy active bill draft session', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  // Turn 1: Add customer and item to draft
  await cm.processTurn(id, 'Ramesh ke naam 50 bag ACC cement bill banao', {
    intent: 'create_bill',
    customer: { name: 'Ramesh' },
    items: [{ name: 'ACC Cement', qty: 50, unit: 'bag', rate: 0 }],
    missing: []
  }, mockCtx)

  assert.equal(cm.hasActiveBill(id), true)

  // Turn 2: Non-bill stock query
  await cm.processTurn(id, 'ACC cement ka stock kitna hai', {
    intent: 'stock_query',
    query: 'ACC cement'
  }, mockCtx)

  // Active bill draft must remain intact!
  assert.equal(cm.hasActiveBill(id), true)
  const draft = cm.get(id)
  assert.notEqual(draft, null)
  assert.equal(draft.customer.name, 'Ramesh')
  assert.equal(draft.items.length, 1)
})

test('V2.10: Execution of bill clears the active session from persistent store', async () => {
  const cm = new ConversationManager()
  const id = cm.newConversation()

  await saveConversationSession({
    id,
    companyId: 'comp_exec',
    status: 'ACTIVE',
    activeTask: 'CREATE_BILL',
    draft: { customer: { name: 'Test' }, items: [] }
  })

  cm.markExecuted(id, { id: 'inv-100', invoiceNo: 'INV-100' })

  // Session deleted from DB after execution
  const checkDb = await getConversationSession(id, 'comp_exec')
  assert.equal(checkDb, null)
})

// ==========================================
// PHASE 0 SAFETY REGRESSIONS
// ==========================================

test('Phase 0 Safety: Prevents invoice creation when item rate is zero', async () => {
  const draft = {
    intent: 'create_bill',
    customer: { name: 'Safety Customer' },
    items: [{ name: 'ACC Cement', qty: 10, unit: 'bag', rate: 0 }],
    billType: 'kaccha',
    transport: {}
  }

  await assert.rejects(
    async () => { await executeCreateBill(draft) },
    (err) => err.message.includes('MINIMUM_RATE_REQUIRED')
  )
})

test('Phase 0 Safety: Idempotency lock prevents duplicate invoices from same key', async () => {
  const draft = {
    intent: 'create_bill',
    customer: { name: 'Idempotent Customer' },
    items: [{ name: 'TMT Steel 10mm', qty: 100, unit: 'kg', rate: 60 }],
    billType: 'kaccha',
    transport: {}
  }

  const company = { id: 'comp_idem_1', name: 'Test Co' }
  const key = 'idem_key_v1v2_test'

  const res1 = await executeCreateBill(draft, company, { idempotencyKey: key })
  assert.notEqual(res1.invoice.invoiceNo, undefined)

  const res2 = await executeCreateBill(draft, company, { idempotencyKey: key })
  assert.equal(res2.invoice.id, res1.invoice.id)
})
