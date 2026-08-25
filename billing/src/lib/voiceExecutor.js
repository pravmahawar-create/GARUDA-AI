import { db, enqueue, getActiveCompany, nextBillNo, recordStockOutForInvoice } from '../db.js'
import { calcBill } from './money.js'
import { gstTypeFor } from './gst.js'

export async function executeCreateBill(parsed, companyOverride = null) {
  if (!parsed || parsed.intent !== 'create_bill') throw new Error('Not a create_bill command')
  if (parsed.missing && parsed.missing.length) throw new Error('Missing: ' + parsed.missing.join(', '))
  if (!parsed.customer || !parsed.customer.name) throw new Error('Customer missing')
  if (!parsed.items || !parsed.items.length) throw new Error('No items')
  const comp = companyOverride || await getActiveCompany()
  if (!comp) throw new Error('No company')
  const existing = await db.customers.toArray()
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
      createdAt: new Date().toISOString()
    }
    await db.customers.put(cust)
    await enqueue('customer', 'create', cust)
  }
  const billType = parsed.billType || cust.billType || (cust.gstin ? 'gst' : 'kaccha')
  const mode = gstTypeFor(comp.gstin, cust.gstin)
  const rows = parsed.items.map((it) => ({ name: it.name, qty: it.qty, unit: it.unit || 'bag', rate: it.rate || 0, hsn: it.hsn || '' }))
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
  // read-after-write proof — must be readable before reporting success
  const verify = await db.invoices.get(invoice.id)
  if (!verify) throw new Error('Invoice not persisted — read-back failed')
  await enqueue('invoice', 'create', invoice)
  await recordStockOutForInvoice(verify, totals.lines)
  return { invoice: verify, customer: cust, totals }
}
