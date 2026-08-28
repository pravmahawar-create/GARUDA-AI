import { db, enqueue, getActiveCompany, getActiveCompanyId, nextBillNo, recordStockOutForInvoice, saveCustomer, recordAuditEvent, findAuditEventByIdempotencyKey } from '../db.js'
import { calcBill } from './money.js'
import { gstTypeFor } from './gst.js'

export async function executeCreateBill(parsed, companyOverride = null, options = {}) {
  if (!parsed || parsed.intent !== 'create_bill') throw new Error('Not a create_bill command')
  if (parsed.missing && parsed.missing.length) throw new Error('Missing: ' + parsed.missing.join(', '))
  if (!parsed.customer || !parsed.customer.name) throw new Error('Customer missing')
  if (!parsed.items || !parsed.items.length) throw new Error('No items')

  // FINANCIAL INPUT SAFETY: Rate Guard & Quantity Safety
  for (const it of parsed.items) {
    const qty = Number(it.qty || 0)
    const rate = Number(it.rate || 0)
    if (qty <= 0) throw new Error(`INVALID_QUANTITY: Item '${it.name}' quantity must be greater than 0`)
    if (rate <= 0) throw new Error(`MINIMUM_RATE_REQUIRED: Item '${it.name}' rate must be greater than 0`)
  }

  const comp = companyOverride || await getActiveCompany()
  if (!comp) throw new Error('No company')

  // ENTITY AMBIGUITY SAFETY: Size Ambiguity Guard
  for (const it of parsed.items) {
    const name = String(it.name || '').trim().toLowerCase()
    if ((name === 'tmt steel' || name === 'sariya' || name === 'steel') && !/\d+mm/i.test(name)) {
      const items = await db.items.where('companyId').equals(comp.id).toArray()
      const sizes = new Set(items.filter((i) => (i.name.match(/\d+mm/i) || [])[0]).map((i) => (i.name.match(/\d+mm/i) || [])[0]))
      if (sizes.size > 1) {
        throw new Error(`AMBIGUOUS_SIZE_REQUIRED: Multiple steel sizes exist (${Array.from(sizes).join(', ')}). Specify size.`)
      }
    }
  }

  // IDEMPOTENCY / DUPLICATE EXECUTION LOCK
  const idempotencyKey = options.idempotencyKey || parsed.idempotencyKey || null
  if (idempotencyKey) {
    const existingAudit = await findAuditEventByIdempotencyKey(idempotencyKey, comp.id)
    if (existingAudit && existingAudit.result && existingAudit.result.invoice) {
      console.log('[IDEMPOTENCY_LOCK] Returning existing invoice for key:', idempotencyKey)
      return existingAudit.result
    }
  }

  // ATOMIC DEXIE TRANSACTION BOUNDARY
  return await db.transaction('rw', [db.invoices, db.customers, db.items, db.stockTransactions, db.syncQueue, db.auditEvents, db.companies], async () => {
    const existing = await db.customers.where('companyId').equals(comp.id).toArray()
    const byName = existing.find((c) => c.name.toLowerCase() === String(parsed.customer.name).toLowerCase())
    const byMobile = parsed.customer.mobile && existing.find((c) => c.mobile === parsed.customer.mobile)
    let cust = byName || byMobile
    const gstin = String((parsed.customer && parsed.customer.gstin) || parsed.customerGstin || '').trim().toUpperCase()

    if (!cust) {
      cust = {
        id: 'c' + Date.now() + Math.random().toString(36).slice(2, 6),
        name: String(parsed.customer.name).trim(),
        mobile: parsed.customer.mobile || '',
        gstin,
        billType: gstin ? 'gst' : 'kaccha',
        address: '',
        creditLimit: 0,
        companyId: comp.id,
        createdAt: new Date().toISOString()
      }
      await db.customers.put(cust)
      await enqueue('customer', 'create', cust)
    }

    const billType = parsed.billType || cust.billType || (cust.gstin ? 'gst' : 'kaccha')
    const mode = gstTypeFor(comp.gstin, cust.gstin)
    const rows = parsed.items.map((it) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || 'bag', rate: Number(it.rate), hsn: it.hsn || '' }))
    const totals = calcBill(rows, { gstRate: comp.gstRate, discount: 0, transport: parsed.transport || {}, billType, mode })
    const invoiceNo = await nextBillNo(comp.id, billType)

    const invoice = {
      id: 'inv' + Date.now() + Math.random().toString(36).slice(2, 6),
      invoiceNo,
      companyId: comp.id,
      companyName: comp.name,
      templateId: comp.templateId || 'classic',
      billType,
      customerId: cust.id,
      customerName: cust.name,
      date: new Date().toISOString().slice(0, 10),
      items: totals.lines,
      totals,
      discount: 0,
      transport: parsed.transport || {},
      bank: { bankName: comp.bankName, bankHolder: comp.bankHolder, bankAccount: comp.bankAccount, bankIfsc: comp.bankIfsc, upiId: comp.upiId },
      status: 'saved',
      paidAmount: 0,
      createdAt: new Date().toISOString()
    }

    await db.invoices.put(invoice)
    const verify = await db.invoices.get(invoice.id)
    if (!verify) throw new Error('Invoice not persisted — read-back failed')

    await enqueue('invoice', 'create', invoice)
    await recordStockOutForInvoice(comp.id, verify, totals.lines)

    const executionResult = { invoice: verify, customer: cust, totals }

    if (idempotencyKey) {
      await recordAuditEvent({
        companyId: comp.id,
        action: 'executeCreateBill',
        idempotencyKey,
        payload: { customerName: cust.name, invoiceNo: verify.invoiceNo, total: totals.grandTotal },
        result: executionResult
      })
    }

    return executionResult
  })
}

