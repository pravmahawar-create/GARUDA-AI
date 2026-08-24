import { buildInvoicePdf } from './pdf.js'
import { inrFull } from './money.js'

export function generateBillText(invoice) {
  const items = (invoice?.items || []).map((l) => `  ${l.name} — ${l.qty} ${l.unit || ''} × ${inrFull(l.rate)}`)
  const total = inrFull(invoice?.totals?.grandTotal || 0)
  return [
    invoice?.customerName || '',
    `Bill No: ${invoice?.invoiceNo || ''}`,
    `Date: ${invoice?.date || ''}`,
    ...items,
    `Total: ${total}`
  ].filter(Boolean).join('\n')
}

export function generateBillShareMessage(invoice, company) {
  const total = inrFull(invoice?.totals?.grandTotal || 0)
  const items = (invoice?.items || []).slice(0, 3).map((l) => `${l.name} ${l.qty} ${l.unit || ''}`).join(', ')
  const lines = [
    `Namaste ${invoice?.customerName || ''} ji,`,
    `Aapka bill ${total} ka hai.`,
    items ? `Bill detail: ${items}` : '',
    'Bill attached hai.',
    'Dhanyavaad.'
  ]
  if (company?.name) lines.push(String(company.name))
  return lines.filter(Boolean).join('\n')
}

export function generateBillEmailSubject(invoice) {
  return `Bill - ${invoice?.customerName || ''} - ${inrFull(invoice?.totals?.grandTotal || 0)}`
}

async function buildPdfFile(invoice, company, customer) {
  const bytes = await buildInvoicePdf(invoice, company || {}, customer || {}, invoice?.templateId || 'classic')
  return new File([new Blob([bytes], { type: 'application/pdf' })], `Bill-${invoice?.invoiceNo || 'bill'}.pdf`, { type: 'application/pdf' })
}

async function nativeShare({ files, text, title }) {
  if (!navigator || typeof navigator.share !== 'function') return { ok: false, message: 'Share is not supported on this device' }
  const payload = {}
  if (files && files.length && navigator.canShare && navigator.canShare({ files })) payload.files = files
  if (text) payload.text = text
  if (title) payload.title = title
  try {
    await navigator.share(payload)
    return { ok: true }
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, cancelled: true, message: 'Share cancelled' }
    return { ok: false, message: e && e.message ? e.message : String(e) }
  }
}

export async function shareInvoicePdf(invoice, company, customer) {
  try {
    const file = await buildPdfFile(invoice, company, customer)
    return await nativeShare({ files: [file], title: `Bill-${invoice?.invoiceNo || ''}` })
  } catch (e) {
    return { ok: false, message: e && e.message ? e.message : String(e) }
  }
}

export async function shareInvoiceText(invoice, company) {
  try {
    const text = generateBillText(invoice)
    const res = await nativeShare({ text, title: `Bill-${invoice?.invoiceNo || ''}` })
    if (res.ok) return res
    if (res.cancelled) return res
    return await copyBillText(text)
  } catch (e) {
    return { ok: false, message: e && e.message ? e.message : String(e) }
  }
}

export async function shareInvoiceWhatsApp(invoice, company, customer) {
  const message = generateBillShareMessage(invoice, company)
  try {
    const file = await buildPdfFile(invoice, company, customer)
    const res = await nativeShare({ files: [file], text: message, title: 'Bill via WhatsApp' })
    if (res.ok) return res
    if (res.cancelled) return res
  } catch (e) { /* fall through to wa.me */ }
  try {
    const url = 'https://wa.me/?text=' + encodeURIComponent(message)
    window.open(url, '_blank')
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e && e.message ? e.message : String(e) }
  }
}

export async function shareInvoiceEmail(invoice, company, customer) {
  const subject = encodeURIComponent(generateBillEmailSubject(invoice))
  const body = encodeURIComponent(generateBillShareMessage(invoice, company))
  try {
    const file = await buildPdfFile(invoice, company, customer)
    const res = await nativeShare({ files: [file], text: generateBillShareMessage(invoice, company), title: subject })
    if (res.ok) return res
    if (res.cancelled) return res
  } catch (e) { /* fall through to mailto */ }
  try {
    const url = 'mailto:?subject=' + subject + '&body=' + body
    window.open(url, '_blank')
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e && e.message ? e.message : String(e) }
  }
}

export async function copyBillText(invoice) {
  const text = generateBillText(invoice)
  try {
    await navigator.clipboard.writeText(text)
    return { ok: true, message: 'Bill text copy ho gaya' }
  } catch (e) {
    return { ok: false, message: 'Copy not supported: ' + (e && e.message ? e.message : String(e)) }
  }
}
