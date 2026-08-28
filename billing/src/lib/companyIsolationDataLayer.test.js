import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import {
  db,
  saveCompany,
  setActiveCompany,
  saveCustomer,
  getCustomers
} from '../db.js'
import {
  getLedger,
  getCustomerPayments,
  customerOutstanding,
  recordPayment
} from './ledger.js'
import { getCustomerHistory, getCustomerSummary, findCustomerByRef } from './customerContext.js'

beforeEach(async () => {
  try {
    await db.companies.clear()
    await db.customers.clear()
    await db.invoices.clear()
    await db.payments.clear()
    await db.settings.clear()
    await db.auditEvents.clear()
  } catch (e) {}
})

test('COMPANY ISOLATION: Data Access Layer strictly isolates identical customer names and invoices', async () => {
  // 1. Setup Company A and Company B
  const compA = await saveCompany({ id: 'comp_A_iso', name: 'Hardware Shop A' })
  const compB = await saveCompany({ id: 'comp_B_iso', name: 'Hardware Shop B' })

  // 2. Add identical customer name "Ravi" in both companies
  const custA = await saveCustomer({ id: 'ravi_comp_A', name: 'Ravi', companyId: compA.id })
  const custB = await saveCustomer({ id: 'ravi_comp_B', name: 'Ravi', companyId: compB.id })

  // 3. Add Invoice & Payment for Company A
  const invA = {
    id: 'inv_A_101',
    invoiceNo: '0001',
    customerId: custA.id,
    companyId: compA.id,
    totals: { grandTotal: 5000 },
    date: '2026-08-25',
    status: 'active'
  }
  await db.invoices.put(invA)
  await recordPayment({ customerId: custA.id, amount: 2000, date: '2026-08-26', mode: 'Cash', companyId: compA.id })

  // 4. Add Invoice & Payment for Company B
  const invB = {
    id: 'inv_B_201',
    invoiceNo: '0001',
    customerId: custB.id,
    companyId: compB.id,
    totals: { grandTotal: 12000 },
    date: '2026-08-27',
    status: 'active'
  }
  await db.invoices.put(invB)
  await recordPayment({ customerId: custB.id, amount: 4000, date: '2026-08-27', mode: 'UPI', companyId: compB.id })

  // 5. Open Company A Context
  await setActiveCompany(compA.id)

  const outA = await customerOutstanding(custA.id, compA.id)
  assert.equal(outA, 3000) // ₹5000 - ₹2000

  const ledgerA = await getLedger(custA.id, compA.id)
  assert.equal(ledgerA.length, 2)
  assert.equal(ledgerA[0].debit, 5000)
  assert.equal(ledgerA[1].credit, 2000)
  assert.equal(ledgerA[1].balance, 3000)

  // 6. Switch to Company B Context (without page reload)
  await setActiveCompany(compB.id)

  const outB = await customerOutstanding(custB.id, compB.id)
  assert.equal(outB, 8000) // ₹12000 - ₹4000

  const ledgerB = await getLedger(custB.id, compB.id)
  assert.equal(ledgerB.length, 2)
  assert.equal(ledgerB[0].debit, 12000)
  assert.equal(ledgerB[1].credit, 4000)
  assert.equal(ledgerB[1].balance, 8000)

  // 7. Verify Company A customer ledger under Company B scope returns ZERO records (Isolation Guard)
  const leakCheck = await getLedger(custA.id, compB.id)
  assert.equal(leakCheck.length, 0)

  // 8. Switch Back to Company A Context
  await setActiveCompany(compA.id)

  const outA_recheck = await customerOutstanding(custA.id, compA.id)
  assert.equal(outA_recheck, 3000)

  const findA = await findCustomerByRef(null, 'Ravi', compA.id)
  assert.equal(findA.customer.id, custA.id)

  const findB = await findCustomerByRef(null, 'Ravi', compB.id)
  assert.equal(findB.customer.id, custB.id)
})
