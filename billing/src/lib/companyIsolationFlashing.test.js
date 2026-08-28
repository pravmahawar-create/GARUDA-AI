import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import {
  db,
  saveCompany,
  setActiveCompany,
  getInvoices,
  saveCustomer
} from '../db.js'

beforeEach(async () => {
  try {
    await db.companies.clear()
    await db.customers.clear()
    await db.invoices.clear()
    await db.payments.clear()
    await db.settings.clear()
  } catch (e) {}
})

test('COMPANY ISOLATION FLASH PREVENTION: Trading vs MMSR invoices strictly isolated at Data Access Layer', async () => {
  // 1. Setup Trading Company and MMSR Company
  const compTrading = await saveCompany({ id: 'comp_trading', name: 'Trading Co' })
  const compMmsr = await saveCompany({ id: 'comp_mmsr', name: 'MMSR Building Materials' })

  // 2. Add Customer "Ravi" to both companies
  const custTrading = await saveCustomer({ id: 'cust_ravi_trading', name: 'Ravi', companyId: compTrading.id })
  const custMmsr = await saveCustomer({ id: 'cust_ravi_mmsr', name: 'Ravi', companyId: compMmsr.id })

  // 3. Add Trading Company Bills
  await db.invoices.put({
    id: 'inv_trading_101',
    invoiceNo: 'TRD-001',
    customerId: custTrading.id,
    customerName: 'Ravi',
    companyId: compTrading.id,
    companyName: 'Trading Co',
    totals: { grandTotal: 15000 },
    date: '2026-08-27',
    createdAt: '2026-08-27T10:00:00.000Z',
    status: 'active'
  })
  await db.invoices.put({
    id: 'inv_trading_102',
    invoiceNo: 'TRD-002',
    customerId: custTrading.id,
    customerName: 'Ravi',
    companyId: compTrading.id,
    companyName: 'Trading Co',
    totals: { grandTotal: 25000 },
    date: '2026-08-27',
    createdAt: '2026-08-27T11:00:00.000Z',
    status: 'active'
  })

  // 4. Add MMSR Company Bills
  await db.invoices.put({
    id: 'inv_mmsr_201',
    invoiceNo: 'MMSR-001',
    customerId: custMmsr.id,
    customerName: 'Ravi',
    companyId: compMmsr.id,
    companyName: 'MMSR Building Materials',
    totals: { grandTotal: 8000 },
    date: '2026-08-28',
    createdAt: '2026-08-28T09:00:00.000Z',
    status: 'active'
  })
  await db.invoices.put({
    id: 'inv_mmsr_202',
    invoiceNo: 'MMSR-002',
    customerId: custMmsr.id,
    customerName: 'Ravi',
    companyId: compMmsr.id,
    companyName: 'MMSR Building Materials',
    totals: { grandTotal: 12000 },
    date: '2026-08-28',
    createdAt: '2026-08-28T10:00:00.000Z',
    status: 'active'
  })

  // 5. Query MMSR Invoices via Data Access Layer
  const mmsrInvoices = await getInvoices(compMmsr.id)
  assert.equal(mmsrInvoices.length, 2)
  assert.equal(mmsrInvoices.every((i) => i.companyId === compMmsr.id), true)

  // Verify ZERO Trading Company invoices leak into MMSR query
  const tradingLeakingInMmsr = mmsrInvoices.filter((i) => i.companyId === compTrading.id)
  assert.equal(tradingLeakingInMmsr.length, 0)

  // 6. Rapid Switching Simulation: Trading -> MMSR -> Trading -> MMSR
  await setActiveCompany(compTrading.id)
  const query1 = await getInvoices(compTrading.id)
  assert.equal(query1.length, 2)
  assert.equal(query1[0].invoiceNo, 'TRD-002')

  await setActiveCompany(compMmsr.id)
  const query2 = await getInvoices(compMmsr.id)
  assert.equal(query2.length, 2)
  assert.equal(query2[0].invoiceNo, 'MMSR-002')

  await setActiveCompany(compTrading.id)
  const query3 = await getInvoices(compTrading.id)
  assert.equal(query3.length, 2)
  assert.equal(query3.some((i) => i.companyId === compMmsr.id), false)

  await setActiveCompany(compMmsr.id)
  const query4 = await getInvoices(compMmsr.id)
  assert.equal(query4.length, 2)
  assert.equal(query4.some((i) => i.companyId === compTrading.id), false)
})
