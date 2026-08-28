import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
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

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function shareFilesNative(files, text, title) {
  const uris = []
  const writePaths = []
  try {
    for (const f of files) {
      const name = f.name || ('share-' + Date.now())
      const buf = await f.arrayBuffer()
      const path = 'garuda-share/' + name
      await Filesystem.writeFile({ path, data: arrayBufferToBase64(buf), directory: Directory.Cache, recursive: true })
      writePaths.push(path)
      const res = await Filesystem.getUri({ path, directory: Directory.Cache })
      uris.push(res.uri)
    }
    const opts = { title: title || '', dialogTitle: title || '' }
    if (text) opts.text = text
    if (uris.length) opts.files = uris
    const result = await Share.share(opts)
    return { ok: Boolean(result && result.completed), cancelled: Boolean(result && !result.completed) }
  } catch (e) {
    const msg = e && e.message ? e.message : String(e)
    if (/cancel/i.test(msg)) return { ok: false, cancelled: true, message: 'Share cancelled' }
    return { ok: false, message: msg }
  } finally {
    for (const path of writePaths) {
      try {
        await Filesystem.deleteFile({ path, directory: Directory.Cache })
      } catch (e) { /* ignore cleanup errors */ }
    }
  }
}

async function shareWeb(payload) {
  if (!navigator || typeof navigator.share !== 'function') {
    return { ok: false, notSupported: true, message: 'Share is not supported on this device' }
  }
  try {
    await navigator.share(payload)
    return { ok: true }
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, cancelled: true, message: 'Share cancelled' }
    return { ok: false, message: e && e.message ? e.message : String(e) }
  }
}

async function nativeShare({ files, text, title }) {
  if (Capacitor.isNativePlatform() && window.Capacitor?.Plugins?.Share && files && files.length) {
    return await shareFilesNative(files, text, title)
  }
  const payload = {}
  if (files && files.length && navigator.canShare && navigator.canShare({ files })) payload.files = files
  if (text) payload.text = text
  if (title) payload.title = title
  return await shareWeb(payload)
}

function downloadFile(file) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function shareInvoicePdf(invoice, company, customer) {
  try {
    const file = await buildPdfFile(invoice, company, customer)
    const res = await nativeShare({ files: [file], title: `Bill-${invoice?.invoiceNo || ''}` })
    if (res.ok || res.cancelled) return res
    if (res.notSupported) {
      downloadFile(file)
      return { ok: true, message: 'PDF download ho gaya — file se share/WhatsApp kar sakte hain' }
    }
    return res
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
    if (res.notSupported) return await copyBillText(text)
    return res
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

// Generic file share — writes to cache, shares via Capacitor native share sheet.
// Falls back to download when native share is unavailable.
export async function shareFile(file, title = 'File', text = '') {
  const res = await nativeShare({ files: [file], title, text })
  if (res.notSupported) {
    downloadFile(file)
    return { ok: true, message: 'Download ho gaya — file se share kar sakte hain' }
  }
  return res
}
