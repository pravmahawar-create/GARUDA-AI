import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { db, saveItem, getActiveCompany } from '../db.js'
import { executeCreateBill } from './voiceExecutor.js'
import { ConversationManager } from './conversation.js'

before(async () => {
  try { await db.delete() } catch (e) {}
  await db.open()
})

after(async () => {
  try { await db.close() } catch (e) {}
})

test('PHASE 0 SAFETY: Minimum Rate Guard blocks zero-rate invoice creation', async () => {
  const parsed = {
    intent: 'create_bill',
    customer: { name: 'Ramesh Sharma' },
    items: [{ name: 'ACC Cement', qty: 50, rate: 0, unit: 'bag' }],
    billType: 'kaccha',
    missing: []
  }
  await assert.rejects(
    async () => {
      await executeCreateBill(parsed, { id: 'comp-test-safety-1', name: 'Test Comp 1' })
    },
    (err) => {
      assert.match(err.message, /MINIMUM_RATE_REQUIRED/)
      return true
    }
  )
})

test('PHASE 0 SAFETY: Quantity Guard blocks zero-quantity item creation', async () => {
  const parsed = {
    intent: 'create_bill',
    customer: { name: 'Ramesh Sharma' },
    items: [{ name: 'ACC Cement', qty: 0, rate: 390, unit: 'bag' }],
    billType: 'kaccha',
    missing: []
  }
  await assert.rejects(
    async () => {
      await executeCreateBill(parsed, { id: 'comp-test-safety-2', name: 'Test Comp 2' })
    },
    (err) => {
      assert.match(err.message, /INVALID_QUANTITY/)
      return true
    }
  )
})

test('PHASE 0 SAFETY: Size Ambiguity Guard blocks size-less steel when multiple sizes exist', async () => {
  const compId = 'comp-test-safety-3'
  await saveItem({ name: 'TMT Steel 8mm', unit: 'ton', rate: 62000, companyId: compId })
  await saveItem({ name: 'TMT Steel 10mm', unit: 'ton', rate: 61000, companyId: compId })

  const parsed = {
    intent: 'create_bill',
    customer: { name: 'Ravi Chandran' },
    items: [{ name: 'TMT Steel', qty: 2, rate: 62000, unit: 'ton' }],
    billType: 'kaccha',
    missing: []
  }

  await assert.rejects(
    async () => {
      await executeCreateBill(parsed, { id: compId, name: 'Test Comp 3' })
    },
    (err) => {
      assert.match(err.message, /AMBIGUOUS_SIZE_REQUIRED/)
      return true
    }
  )
})

test('PHASE 0 SAFETY: Ambiguous customer prompts for clarification', async () => {
  const cm = new ConversationManager()
  const convoId = cm.newConversation()
  const c = cm.get(convoId)
  c.intent = 'create_bill'
  c.customer = { name: 'Ravi' }

  const mockCtx = {
    resolveCustomer: async (name) => {
      return {
        ambiguous: [
          { id: 'c1', name: 'Ravi Sharma' },
          { id: 'c2', name: 'Ravi Chandran' }
        ]
      }
    }
  }

  const res = await cm.resolveCustomerAmbiguity(c, mockCtx)
  assert.ok(res, 'Ambiguity result should be returned')
  assert.equal(res.status, 'ambiguous_customer')
  assert.match(res.message, /Is naam ke do customer mil rahe hain/)
})

test('PHASE 0 SAFETY: Idempotency Key prevents duplicate invoice execution', async () => {
  const comp = { id: 'comp-test-safety-4', name: 'Test Comp 4' }
  const parsed = {
    intent: 'create_bill',
    customer: { name: 'Suresh Kumar' },
    items: [{ name: 'UltraTech Cement', qty: 100, rate: 380, unit: 'bag' }],
    billType: 'kaccha',
    missing: []
  }

  const key = 'idem_key_unique_123'
  const firstRes = await executeCreateBill(parsed, comp, { idempotencyKey: key })
  assert.ok(firstRes.invoice, 'First invoice should be created')

  // Second execution with same idempotency key
  const secondRes = await executeCreateBill(parsed, comp, { idempotencyKey: key })
  assert.equal(secondRes.invoice.id, firstRes.invoice.id, 'Idempotent call must return identical invoice')
})
