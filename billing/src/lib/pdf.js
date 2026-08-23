import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import { inr, amountInWords } from './money.js'
import { upiQrDataUrl } from './upi.js'

const Rs = (n) => 'Rs. ' + inr(n)

const C = {
  classic: { a: rgb(0.04, 0.24, 0.18), b: rgb(0.1, 0.4, 0.3) },
  modern: { a: rgb(0.06, 0.3, 0.5), b: rgb(0.04, 0.2, 0.36) },
  premium: { a: rgb(0.1, 0.1, 0.18), b: rgb(0.86, 0.77, 0.4) },
  minimal: { a: rgb(0.22, 0.22, 0.22), b: rgb(0.5, 0.5, 0.5) },
  transport: { a: rgb(0.7, 0.35, 0.05), b: rgb(0.55, 0.27, 0.04) }
}

const DARK = rgb(0.16, 0.16, 0.16)
const GRAY = rgb(0.42, 0.42, 0.42)
const LINE = rgb(0.86, 0.86, 0.86)
const WHITE = rgb(1, 1, 1)

function pager(doc) {
  return {
    page: doc.addPage([595, 842]),
    next() {
      const p = doc.addPage([595, 842])
      this.page = p
      return p
    }
  }
}

function dataUrlToBytes(dataUrl) {
  const base64 = String(dataUrl).split(',')[1]
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function titleFor(invoice) {
  return invoice.billType === 'kaccha' ? 'KACCHA BILL' : 'TAX INVOICE'
}

function drawItemsTable(pg, font, bold, y, items, colX, colored = false, headColor = C.classic.a) {
  let page = pg.page
  if (colored) {
    page.drawRectangle({ x: 50, y: y - 2, width: 495, height: 18, color: headColor })
    page.drawText('ITEM', { x: colX.item, y, size: 9, font: bold, color: WHITE })
    page.drawText('HSN', { x: colX.hsn, y, size: 9, font: bold, color: WHITE })
    page.drawText('QTY', { x: colX.qty, y, size: 9, font: bold, color: WHITE })
    page.drawText('RATE', { x: colX.rate, y, size: 9, font: bold, color: WHITE })
    page.drawText('AMOUNT', { x: colX.amt, y, size: 9, font: bold, color: WHITE })
  } else {
    page.drawText('ITEM', { x: colX.item, y, size: 9, font: bold, color: DARK })
    page.drawText('HSN', { x: colX.hsn, y, size: 9, font: bold, color: DARK })
    page.drawText('QTY', { x: colX.qty, y, size: 9, font: bold, color: DARK })
    page.drawText('RATE', { x: colX.rate, y, size: 9, font: bold, color: DARK })
    page.drawText('AMOUNT', { x: colX.amt, y, size: 9, font: bold, color: DARK })
  }
  y -= 16
  for (const line of items || []) {
    if (y < 120) { pg.next(); y = 780; page = pg.page }
    page.drawText(String(line.name || '-').slice(0, 42), { x: colX.item, y, size: 9, font })
    page.drawText(String(line.hsn || ''), { x: colX.hsn, y, size: 9, font })
    page.drawText(String(line.qty) + ' ' + String(line.unit || ''), { x: colX.qty, y, size: 9, font })
    page.drawText(Rs(line.rate), { x: colX.rate, y, size: 9, font })
    page.drawText(Rs(line.amount), { x: colX.amt, y, size: 9, font })
    page.drawLine({ start: { x: 50, y: y - 2 }, end: { x: 545, y: y - 2 }, thickness: 0.3, color: LINE })
    y -= 16
  }
  return y
}

function drawTotals(pg, font, bold, y, t, accent, withWords = true) {
  const { page } = pg
  const col1 = 380
  const col2 = 495
  const isKaccha = t.billType === 'kaccha'
  page.drawText('Subtotal', { x: col1, y, size: 9, font, color: DARK })
  page.drawText(Rs(t.subtotal), { x: col2, y, size: 9, font, color: DARK })
  y -= 14
  if (t.discount > 0) {
    page.drawText('Discount', { x: col1, y, size: 9, font, color: DARK })
    page.drawText('- ' + Rs(t.discount), { x: col2, y, size: 9, font, color: DARK })
    y -= 14
  }
  if (!isKaccha) {
    if (t.igst > 0) {
      page.drawText('IGST (' + Number(t.gstRate || 0) + '%)', { x: col1, y, size: 9, font, color: DARK })
      page.drawText(Rs(t.igst), { x: col2, y, size: 9, font, color: DARK })
      y -= 14
    } else {
      page.drawText('CGST', { x: col1, y, size: 9, font, color: DARK })
      page.drawText(Rs(t.cgst), { x: col2, y, size: 9, font, color: DARK })
      y -= 14
      page.drawText('SGST', { x: col1, y, size: 9, font, color: DARK })
      page.drawText(Rs(t.sgst), { x: col2, y, size: 9, font, color: DARK })
      y -= 14
    }
  }
  if (t.freight > 0) {
    page.drawText('Freight', { x: col1, y, size: 9, font, color: DARK })
    page.drawText(Rs(t.freight), { x: col2, y, size: 9, font, color: DARK })
    y -= 14
  }
  if (t.loading > 0) {
    page.drawText('Loading', { x: col1, y, size: 9, font, color: DARK })
    page.drawText(Rs(t.loading), { x: col2, y, size: 9, font, color: DARK })
    y -= 14
  }
  if (t.unloading > 0) {
    page.drawText('Unloading', { x: col1, y, size: 9, font, color: DARK })
    page.drawText(Rs(t.unloading), { x: col2, y, size: 9, font, color: DARK })
    y -= 14
  }
  page.drawRectangle({ x: col1 - 4, y: y + 6, width: 120, height: 1, color: accent })
  page.drawRectangle({ x: 270, y: y + 6, width: 230, height: 20, color: accent })
  page.drawText('GRAND TOTAL', { x: 290, y: y + 5, size: 9, font: bold, color: WHITE })
  page.drawText(Rs(t.grandTotal), { x: col2, y, size: 11, font: bold, color: accent })
  y -= 24
  if (withWords) {
    page.drawText('In words: ' + amountInWords(t.grandTotal), { x: 50, y, size: 8, font, color: DARK })
    y -= 16
  }
  return y
}

function drawTransport(pg, font, bold, y, tr) {
  if (!tr || (!tr.vehicleNo && !tr.driverName && !tr.site && !tr.lrNo)) return y
  let page = pg.page
  page.drawText('Transport / Bhada', { x: 50, y, size: 9, font: bold, color: DARK })
  y -= 13
  const lines = [
    tr.vehicleNo && 'Vehicle: ' + tr.vehicleNo,
    tr.driverName && 'Driver: ' + tr.driverName + (tr.driverMobile ? ' (' + tr.driverMobile + ')' : ''),
    tr.site && 'Delivery: ' + tr.site,
    tr.lrNo && 'LR/Challan: ' + tr.lrNo,
    tr.freight > 0 && 'Freight: ' + Rs(tr.freight),
    tr.notes && 'Notes: ' + tr.notes
  ].filter(Boolean)
  for (const l of lines) {
    if (y < 100) { pg.next(); y = 780; page = pg.page }
    page.drawText(l, { x: 50, y, size: 8, font, color: GRAY })
    y -= 12
  }
  return y - 6
}

async function drawBankQr(pg, font, bold, y, company, amount, ref, qrBytes, dark = DARK, doc) {
  let page = pg.page
  const bank = {
    holder: company?.bankHolder, name: company?.bankName, acct: company?.bankAccount, ifsc: company?.bankIfsc
  }
  const hasBank = bank.holder || bank.name || bank.acct || bank.ifsc || company?.upiId
  if (!hasBank) return y
  if (y < 150) { pg.next(); y = 780; page = pg.page }
  page.drawRectangle({ x: 50, y: y - 6, width: 495, height: 1, color: LINE })
  y -= 14
  page.drawText('Payment Details (UPI / Bank)', { x: 50, y, size: 9, font: bold, color: dark })
  y -= 14
  const leftCol = 50
  const valCol = 170
  const rows = [
    [bank.holder, 'A/c Holder'],
    [bank.name, 'Bank'],
    [bank.acct, 'A/c No'],
    [bank.ifsc, 'IFSC']
  ]
  for (const [v, l] of rows) {
    if (!v) continue
    if (y < 120) { pg.next(); y = 780; page = pg.page }
    page.drawText(l + ': ', { x: leftCol, y, size: 8, font, color: GRAY })
    page.drawText(String(v).slice(0, 34), { x: valCol, y, size: 9, font: bold, color: DARK })
    y -= 13
  }
  if (company?.upiId) {
    if (y < 120) { pg.next(); y = 780; page = pg.page }
    page.drawText('UPI ID: ', { x: leftCol, y, size: 8, font, color: GRAY })
    page.drawText(String(company.upiId).slice(0, 34), { x: valCol, y, size: 9, font: bold, color: DARK })
    y -= 13
  }
  if (qrBytes) {
    const qrSize = 90
    const img = await doc.embedPng(qrBytes)
    pg.page.drawImage(img, { x: 470, y: y - 40, width: qrSize, height: qrSize })
  }
  return y - 8
}

function drawCancelled(doc, font, bold) {
  for (let i = 0; i < doc.getPageCount(); i++) {
    const p = doc.getPage(i)
    const { height } = p.getSize()
    for (let yy = -60; yy < height + 60; yy += 110) {
      p.drawText('CANCELLED', { x: -90, y: yy, size: 44, font: bold, rotate: degrees(35), color: rgb(0.85, 0.3, 0.3), opacity: 0.3 })
    }
  }
}

async function renderClassic(pg, font, bold, invoice, company, customer, ctx) {
  const { page } = pg
  const width = page.getSize().width
  let y = 812
  page.drawText(String(company.name || 'SHOP NAME'), { x: 50, y, size: 18, font: bold, color: C.classic.a })
  y -= 16
  const sellerLines = [
    company.address,
    company.phone && 'Phone: ' + company.phone,
    invoice.billType !== 'kaccha' && company.gstin && 'GSTIN: ' + company.gstin
  ].filter(Boolean)
  for (const l of sellerLines) {
    page.drawText(String(l), { x: 50, y, size: 9, font, color: GRAY })
    y -= 12
  }
  page.drawText(titleFor(invoice), { x: width - 200, y: 812, size: 14, font: bold, color: DARK })
  page.drawText('No: ' + String(invoice.invoiceNo), { x: width - 200, y: 794, size: 10, font, color: DARK })
  page.drawText('Date: ' + String(invoice.date), { x: width - 200, y: 780, size: 10, font, color: DARK })
  page.drawLine({ start: { x: 50, y: y + 4 }, end: { x: 545, y: y + 4 }, thickness: 1, color: C.classic.a })
  y -= 18
  page.drawText('Bill To:', { x: 50, y, size: 9, font: bold, color: DARK })
  y -= 14
  page.drawText(String(invoice.customerName || '-'), { x: 50, y, size: 12, font: bold, color: DARK })
  y -= 15
  if (customer?.mobile) { page.drawText('Mobile: ' + String(customer.mobile), { x: 50, y, size: 9, font, color: GRAY }); y -= 13 }
  if (invoice.billType !== 'kaccha' && customer?.gstin) { page.drawText('GSTIN: ' + String(customer.gstin), { x: 50, y, size: 9, font, color: GRAY }); y -= 13 }
  if (customer?.address) { page.drawText(String(customer.address), { x: 50, y, size: 9, font, color: GRAY }); y -= 13 }
  y -= 12
  y = drawItemsTable(pg, font, bold, y, invoice.items, { item: 50, hsn: 280, qty: 345, rate: 415, amt: 495 }, false)
  y -= 8
  y = drawTotals(pg, font, bold, y, invoice.totals, C.classic.a)
  y = await drawBankQr(pg, font, bold, y, company, invoice.totals.grandTotal, 'INV-' + invoice.invoiceNo, ctx.qrBytes, C.classic.a, ctx.doc)
  y = drawTransport(pg, font, bold, y - 4, invoice.transport)
  page.drawText('Thank you for your business!', { x: 50, y: 60, size: 10, font: bold, color: C.classic.a })
}

async function renderModern(pg, font, bold, invoice, company, customer, ctx) {
  const { page } = pg
  const width = page.getSize().width
  page.drawRectangle({ x: 0, y: 760, width: width, height: 82, color: C.modern.b })
  let y = 806
  page.drawText(String(company.name || ''), { x: 50, y, size: 20, font: bold, color: WHITE })
  y -= 14
  if (company.address) { page.drawText(String(company.address), { x: 50, y, size: 9, font, color: rgb(0.9, 0.93, 0.97) }); y -= 12 }
  if (company.phone) { page.drawText('Phone: ' + String(company.phone), { x: 50, y, size: 9, font, color: rgb(0.9, 0.93, 0.97) }); y -= 12 }
  if (invoice.billType !== 'kaccha' && company.gstin) { page.drawText('GSTIN: ' + String(company.gstin), { x: 50, y, size: 9, font, color: rgb(0.9, 0.93, 0.97) }); y -= 12 }
  page.drawText(titleFor(invoice), { x: width - 200, y: 806, size: 16, font: bold, color: WHITE })
  page.drawText('#' + String(invoice.invoiceNo) + '  ·  ' + String(invoice.date), { x: width - 200, y: 786, size: 10, font, color: rgb(0.9, 0.93, 0.97) })
  y = 742
  page.drawText('Bill To:', { x: 50, y, size: 9, font: bold, color: DARK })
  y -= 14
  page.drawText(String(invoice.customerName || '-'), { x: 50, y, size: 12, font: bold, color: DARK })
  y -= 15
  if (customer?.mobile) { page.drawText('Mobile: ' + String(customer.mobile), { x: 50, y, size: 9, font, color: GRAY }); y -= 13 }
  if (invoice.billType !== 'kaccha' && customer?.gstin) { page.drawText('GSTIN: ' + String(customer.gstin), { x: 50, y, size: 9, font, color: GRAY }); y -= 13 }
  if (invoice.billType !== 'kaccha') {
    page.drawText('Seller GSTIN', { x: width - 180, y: 742, size: 9, font: bold, color: DARK })
    page.drawRectangle({ x: width - 180, y: 718, width: 130, height: 20, color: rgb(0.94, 0.96, 1) })
    page.drawText(String(company.gstin || '—'), { x: width - 172, y: 724, size: 9, font: bold, color: C.modern.a })
  }
  y -= 16
  y = drawItemsTable(pg, font, bold, y - 10, invoice.items, { item: 50, hsn: 280, qty: 345, rate: 415, amt: 495 }, true, C.modern.a)
  y -= 8
  y = drawTotals(pg, font, bold, y, invoice.totals, C.modern.a)
  y = await drawBankQr(pg, font, bold, y, company, invoice.totals.grandTotal, 'INV-' + invoice.invoiceNo, ctx.qrBytes, C.modern.a, ctx.doc)
  y = drawTransport(pg, font, bold, y - 4, invoice.transport)
  page.drawText('Thank you for your business!', { x: 50, y: 60, size: 10, font: bold, color: C.modern.a })
}

async function renderPremium(pg, font, bold, invoice, company, customer, ctx) {
  const { page } = pg
  const width = page.getSize().width
  page.drawRectangle({ x: 0, y: 752, width: width, height: 90, color: C.premium.a })
  page.drawRectangle({ x: 0, y: 750, width: width, height: 2, color: C.premium.b })
  let y = 806
  page.drawText(String(company.name || ''), { x: 50, y, size: 22, font: bold, color: C.premium.b })
  y -= 14
  if (company.address) { page.drawText(String(company.address), { x: 50, y, size: 9, font, color: rgb(0.82, 0.82, 0.9) }); y -= 12 }
  if (company.phone) { page.drawText('Phone: ' + String(company.phone), { x: 50, y, size: 9, font, color: rgb(0.82, 0.82, 0.9) }); y -= 12 }
  if (invoice.billType !== 'kaccha' && company.gstin) { page.drawText('GSTIN: ' + String(company.gstin), { x: 50, y, size: 9, font, color: rgb(0.82, 0.82, 0.9) }); y -= 12 }
  page.drawText(titleFor(invoice), { x: width - 200, y: 806, size: 16, font: bold, color: WHITE })
  page.drawText('No: ' + String(invoice.invoiceNo), { x: width - 200, y: 786, size: 10, font, color: rgb(0.82, 0.82, 0.9) })
  page.drawText('Date: ' + String(invoice.date), { x: width - 200, y: 772, size: 10, font, color: rgb(0.82, 0.82, 0.9) })
  y = 734
  page.drawText('Billed To:', { x: 50, y, size: 9, font: bold, color: DARK })
  y -= 14
  page.drawText(String(invoice.customerName || '-'), { x: 50, y, size: 13, font: bold, color: DARK })
  y -= 15
  if (customer?.mobile) { page.drawText('Mobile: ' + String(customer.mobile), { x: 50, y, size: 9, font, color: GRAY }); y -= 13 }
  if (invoice.billType !== 'kaccha' && customer?.gstin) { page.drawText('GSTIN: ' + String(customer.gstin), { x: 50, y, size: 9, font, color: GRAY }); y -= 13 }
  y -= 10
  y = drawItemsTable(pg, font, bold, y, invoice.items, { item: 50, hsn: 300, qty: 350, rate: 415, amt: 495 }, false)
  y -= 8
  y = drawTotals(pg, font, bold, y, invoice.totals, C.premium.b)
  y = await drawBankQr(pg, font, bold, y, company, invoice.totals.grandTotal, 'INV-' + invoice.invoiceNo, ctx.qrBytes, C.premium.b, ctx.doc)
  y = drawTransport(pg, font, bold, y - 4, invoice.transport)
  page.drawText('For ' + String(company.name || ''), { x: 50, y: 130, size: 9, font, color: DARK })
  page.drawLine({ start: { x: 50, y: 108 }, end: { x: 190, y: 108 }, thickness: 0.7, color: C.premium.a })
  page.drawText('Authorised Signatory', { x: 50, y: 96, size: 9, font: bold, color: C.premium.a })
}

async function renderMinimal(pg, font, bold, invoice, company, customer, ctx) {
  const { page } = pg
  const width = page.getSize().width
  let y = 812
  page.drawText(String(company.name || '').toUpperCase(), { x: 50, y, size: 16, font: bold, color: C.minimal.a })
  y -= 14
  if (company.address) { page.drawText(String(company.address), { x: 50, y, size: 9, font, color: GRAY }); y -= 12 }
  if (company.phone || company.gstin) { page.drawText([company.phone && 'Ph: ' + company.phone, invoice.billType !== 'kaccha' && company.gstin && 'GSTIN: ' + company.gstin].filter(Boolean).join('   '), { x: 50, y, size: 9, font, color: GRAY }); y -= 14 }
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.7, color: LINE })
  y -= 16
  page.drawText(titleFor(invoice) + ' #' + String(invoice.invoiceNo), { x: 50, y, size: 11, font: bold, color: C.minimal.a })
  page.drawText(String(invoice.date), { x: width - 160, y, size: 10, font, color: GRAY })
  y -= 22
  page.drawText('BILLED TO', { x: 50, y, size: 8, font: bold, color: GRAY })
  y -= 13
  page.drawText(String(invoice.customerName || '-'), { x: 50, y, size: 12, font: bold, color: DARK })
  y -= 15
  if (customer?.mobile) { page.drawText(String(customer.mobile), { x: 50, y, size: 9, font, color: GRAY }); y -= 12 }
  if (invoice.billType !== 'kaccha' && customer?.gstin) { page.drawText('GSTIN: ' + String(customer.gstin), { x: 50, y, size: 9, font, color: GRAY }); y -= 12 }
  y -= 8
  y = drawItemsTable(pg, font, bold, y, invoice.items, { item: 50, hsn: 280, qty: 345, rate: 415, amt: 495 }, false)
  y -= 6
  y = drawTotals(pg, font, bold, y, invoice.totals, C.minimal.a)
  y = await drawBankQr(pg, font, bold, y, company, invoice.totals.grandTotal, 'INV-' + invoice.invoiceNo, ctx.qrBytes, C.minimal.a, ctx.doc)
  y = drawTransport(pg, font, bold, y - 4, invoice.transport)
  page.drawText('Thanks for your business.', { x: 50, y: 60, size: 9, font: bold, color: C.minimal.a })
}

async function renderTransport(pg, font, bold, invoice, company, customer, ctx) {
  const { page } = pg
  const width = page.getSize().width
  page.drawRectangle({ x: 0, y: 760, width: width, height: 82, color: C.transport.b })
  let y = 806
  page.drawText(String(company.name || ''), { x: 50, y, size: 20, font: bold, color: WHITE })
  y -= 14
  if (company.address) { page.drawText(String(company.address), { x: 50, y, size: 9, font, color: rgb(0.97, 0.92, 0.85) }); y -= 12 }
  if (company.phone) { page.drawText('Phone: ' + String(company.phone), { x: 50, y, size: 9, font, color: rgb(0.97, 0.92, 0.85) }); y -= 12 }
  if (invoice.billType !== 'kaccha' && company.gstin) { page.drawText('GSTIN: ' + String(company.gstin), { x: 50, y, size: 9, font, color: rgb(0.97, 0.92, 0.85) }); y -= 12 }
  page.drawText(titleFor(invoice), { x: width - 200, y: 806, size: 15, font: bold, color: WHITE })
  page.drawText('#' + String(invoice.invoiceNo) + '  ·  ' + String(invoice.date), { x: width - 200, y: 786, size: 10, font, color: rgb(0.97, 0.92, 0.85) })
  y = 740
  const tr = invoice.transport || {}
  page.drawRectangle({ x: 50, y: y - 8, width: 495, height: 2, color: C.transport.a })
  page.drawText('DELIVERY / TRANSPORT / BHADA DETAILS', { x: 50, y, size: 10, font: bold, color: C.transport.a })
  y -= 16
  const fields = [
    ['Vehicle', tr.vehicleNo || '—'],
    ['Driver', tr.driverName ? tr.driverName + (tr.driverMobile ? ' (' + tr.driverMobile + ')' : '') : '—'],
    ['Site', tr.site || '—'],
    ['LR / Challan', tr.lrNo || '—'],
    ['Freight/Bhada', invoice.totals.freight > 0 ? Rs(invoice.totals.freight) : '—'],
    ['Loading', invoice.totals.loading > 0 ? Rs(invoice.totals.loading) : '—']
  ]
  const colW = 248
  for (let i = 0; i < fields.length; i += 2) {
    const [lab, val] = fields[i]
    const x1 = 50
    page.drawText(lab + ': ', { x: x1, y, size: 9, font, color: GRAY })
    page.drawText(String(val).slice(0, 30), { x: x1 + 58, y, size: 9, font: bold, color: DARK })
    const f2 = fields[i + 1]
    if (f2) {
      const x2 = x1 + colW
      page.drawText(f2[0] + ': ', { x: x2, y, size: 9, font, color: GRAY })
      page.drawText(String(f2[1]).slice(0, 30), { x: x2 + 58, y, size: 9, font: bold, color: DARK })
    }
    y -= 14
  }
  y -= 10
  page.drawText('Bill To:', { x: 50, y, size: 9, font: bold, color: DARK })
  y -= 14
  page.drawText(String(invoice.customerName || '-'), { x: 50, y, size: 12, font: bold, color: DARK })
  y -= 15
  if (customer?.mobile) { page.drawText('Mobile: ' + String(customer.mobile), { x: 50, y, size: 9, font, color: GRAY }); y -= 13 }
  if (invoice.billType !== 'kaccha' && customer?.gstin) { page.drawText('GSTIN: ' + String(customer.gstin), { x: 50, y, size: 9, font, color: GRAY }); y -= 13 }
  y -= 8
  y = drawItemsTable(pg, font, bold, y, invoice.items, { item: 50, hsn: 280, qty: 345, rate: 415, amt: 495 }, true, C.transport.a)
  y -= 8
  y = drawTotals(pg, font, bold, y, invoice.totals, C.transport.a)
  y = await drawBankQr(pg, font, bold, y, company, invoice.totals.grandTotal, 'INV-' + invoice.invoiceNo, ctx.qrBytes, C.transport.a, ctx.doc)
  page.drawText('Thank you for your business!', { x: 50, y: 60, size: 10, font: bold, color: C.transport.a })
}

const RENDERERS = {
  classic: renderClassic,
  modern: renderModern,
  premium: renderPremium,
  minimal: renderMinimal,
  transport: renderTransport
}

export async function buildInvoicePdf(invoice, company, customer, templateId = 'classic') {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const pg = pager(doc)
  const ctx = { qrBytes: null, doc }
  if (company?.upiId) {
    try {
      const url = await upiQrDataUrl(company, invoice.totals?.grandTotal, 'INV-' + invoice.invoiceNo)
      if (url) ctx.qrBytes = dataUrlToBytes(url)
    } catch (e) { /* QR optional */ }
  }
  const renderer = RENDERERS[templateId] || RENDERERS.classic
  await renderer(pg, font, bold, invoice, company || {}, customer || {}, ctx)
  if (invoice.status === 'cancelled') drawCancelled(doc, font, bold)
  return doc.save()
}

export async function buildKhataPdf(customer, invoices, payments, company) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const pg = pager(doc)
  let { page } = pg
  let y = 812
  page.drawText(String(company?.name || ''), { x: 50, y, size: 18, font: bold, color: C.classic.a })
  y -= 16
  page.drawText('KHATA STATEMENT', { x: 50, y, size: 11, font: bold, color: DARK })
  y -= 18
  page.drawText('Customer: ' + String(customer?.name || ''), { x: 50, y, size: 12, font: bold, color: DARK })
  y -= 14
  if (customer?.mobile) { page.drawText('Mobile: ' + String(customer.mobile), { x: 50, y, size: 9, font, color: GRAY }); y -= 12 }
  if (customer?.gstin) { page.drawText('GSTIN: ' + String(customer.gstin), { x: 50, y, size: 9, font, color: GRAY }); y -= 12 }
  y -= 10
  page.drawRectangle({ x: 50, y: y - 2, width: 495, height: 18, color: C.classic.a })
  page.drawText('DATE', { x: 52, y, size: 9, font: bold, color: WHITE })
  page.drawText('PARTICULARS', { x: 130, y, size: 9, font: bold, color: WHITE })
  page.drawText('BILL', { x: 400, y, size: 9, font: bold, color: WHITE })
  page.drawText('PAID', { x: 450, y, size: 9, font: bold, color: WHITE })
  page.drawText('BALANCE', { x: 500, y, size: 9, font: bold, color: WHITE })
  y -= 16
  const all = [
    ...(invoices || []).map((i) => ({ date: i.date, desc: 'Bill #' + i.invoiceNo + (i.billType === 'kaccha' ? ' (Kaccha)' : ''), bill: i.totals?.grandTotal || 0, paid: 0 })),
    ...(payments || []).map((p) => ({ date: p.date, desc: 'Payment (' + (p.mode || '') + ')', bill: 0, paid: p.amount }))
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  let running = 0
  for (const row of all) {
    if (y < 100) { pg.next(); y = 780; page = pg.page }
    running += (row.bill || 0) - (row.paid || 0)
    page.drawText(String(row.date || ''), { x: 52, y, size: 9, font })
    page.drawText(String(row.desc).slice(0, 44), { x: 130, y, size: 9, font })
    page.drawText(row.bill ? Rs(row.bill) : '', { x: 400, y, size: 9, font })
    page.drawText(row.paid ? Rs(row.paid) : '', { x: 450, y, size: 9, font })
    page.drawText(Rs(running), { x: 500, y, size: 9, font, color: running > 0 ? rgb(0.7, 0.2, 0.2) : DARK })
    page.drawLine({ start: { x: 50, y: y - 2 }, end: { x: 545, y: y - 2 }, thickness: 0.3, color: LINE })
    y -= 16
  }
  y -= 6
  page.drawText('Closing Balance: ' + Rs(running), { x: 50, y, size: 11, font: bold, color: running > 0 ? rgb(0.7, 0.2, 0.2) : C.classic.a })
  return doc.save()
}