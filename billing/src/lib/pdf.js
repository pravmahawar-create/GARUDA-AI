import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { inr, amountInWords } from './money.js'

const Rs = (n) => 'Rs. ' + inr(n)

const GREEN = rgb(0.04, 0.24, 0.18)
const DARK = rgb(0.16, 0.16, 0.16)
const GRAY = rgb(0.4, 0.4, 0.4)
const LINE = rgb(0.85, 0.85, 0.85)

export async function buildInvoicePdf(invoice, settings, customer) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  let page = doc.addPage([595, 842])
  const { width, height } = page.getSize()
  let y = height - 60

  page.drawText(String(settings.shopName || 'SHOP NAME'), { x: 50, y, size: 20, font: bold, color: GREEN })
  y -= 18
  if (settings.shopAddress) {
    page.drawText(String(settings.shopAddress), { x: 50, y, size: 10, font, color: GRAY })
    y -= 14
  }
  if (settings.shopPhone) {
    page.drawText('Phone: ' + String(settings.shopPhone), { x: 50, y, size: 10, font, color: GRAY })
    y -= 14
  }
  if (settings.shopGstin) {
    page.drawText('GSTIN: ' + String(settings.shopGstin), { x: 50, y, size: 10, font, color: GRAY })
    y -= 14
  }
  page.drawText('GST INVOICE', { x: width - 200, y: height - 60, size: 16, font: bold, color: DARK })
  page.drawText('Invoice No: ' + String(invoice.invoiceNo), { x: width - 200, y: height - 80, size: 11, font, color: DARK })
  page.drawText('Date: ' + String(invoice.date), { x: width - 200, y: height - 96, size: 11, font, color: DARK })

  page.drawRectangle({ x: 50, y: y - 30, width: width - 100, height: 1, color: LINE })
  y -= 44

  page.drawText('Bill To:', { x: 50, y, size: 10, font: bold, color: DARK })
  y -= 16
  page.drawText(String(customer?.name || invoice.customerName || '-'), { x: 50, y, size: 13, font: bold, color: DARK })
  y -= 16
  if (customer?.mobile) {
    page.drawText('Mobile: ' + String(customer.mobile), { x: 50, y, size: 10, font, color: GRAY })
    y -= 14
  }
  if (customer?.gstin) {
    page.drawText('GSTIN: ' + String(customer.gstin), { x: 50, y, size: 10, font, color: GRAY })
    y -= 14
  }
  if (customer?.address) {
    page.drawText(String(customer.address), { x: 50, y, size: 10, font, color: GRAY })
    y -= 14
  }

  y -= 20
  page.drawRectangle({ x: 50, y: y - 2, width: width - 100, height: 1, color: LINE })
  y -= 18

  const colX = { item: 50, hsn: 300, qty: 360, rate: 420, amt: 490 }
  page.drawText('Item', { x: colX.item, y, size: 10, font: bold })
  page.drawText('HSN', { x: colX.hsn, y, size: 10, font: bold })
  page.drawText('Qty', { x: colX.qty, y, size: 10, font: bold })
  page.drawText('Rate', { x: colX.rate, y, size: 10, font: bold })
  page.drawText('Amount', { x: colX.amt, y, size: 10, font: bold })
  y -= 16

  for (const line of invoice.items || []) {
    page.drawText(String(line.name || '-'), { x: colX.item, y, size: 10, font })
    page.drawText(String(line.hsn || ''), { x: colX.hsn, y, size: 10, font })
    page.drawText(String(line.qty) + ' ' + String(line.unit || ''), { x: colX.qty, y, size: 10, font })
    page.drawText(Rs(line.rate), { x: colX.rate, y, size: 10, font })
    page.drawText(Rs(line.amount), { x: colX.amt, y, size: 10, font })
    y -= 16
    if (y < 120) {
      page = doc.addPage([595, 842])
      y = 780
    }
  }

  y -= 10
  const total = invoice.totals.grandTotal
  const rows = [
    ['Subtotal', Rs(invoice.totals.subtotal)],
    ['Discount', '-' + Rs(invoice.totals.discount)],
    ['CGST (' + invoice.totals.gstRate / 2 + '%)', Rs(invoice.totals.cgst)],
    ['SGST (' + invoice.totals.gstRate / 2 + '%)', Rs(invoice.totals.sgst)]
  ]
  if (invoice.totals.freight) rows.push(['Freight', Rs(invoice.totals.freight)])
  if (invoice.totals.loading) rows.push(['Loading', Rs(invoice.totals.loading)])
  if (invoice.totals.unloading) rows.push(['Unloading', Rs(invoice.totals.unloading)])

  const col1 = 400
  const col2 = 500
  for (const [label, val] of rows) {
    page.drawText(label, { x: col1, y, size: 10, font, color: DARK })
    page.drawText(val, { x: col2, y, size: 10, font, color: DARK })
    y -= 14
  }
  y -= 2
  page.drawRectangle({ x: 390, y: y + 4, width: 155, height: 1, color: GREEN })
  page.drawText('TOTAL', { x: col1, y, size: 12, font: bold, color: GREEN })
  page.drawText(Rs(total), { x: col2, y, size: 12, font: bold, color: GREEN })
  y -= 24
  page.drawText('In words: ' + amountInWords(total), { x: 50, y, size: 9, font, color: DARK })

  y -= 30
  const tr = invoice.transport || {}
  const trLines = [
    tr.vehicleNo && 'Vehicle: ' + tr.vehicleNo,
    tr.driverName && 'Driver: ' + tr.driverName + (tr.driverMobile ? ' (' + tr.driverMobile + ')' : ''),
    tr.site && 'Delivery: ' + tr.site,
    tr.lrNo && 'LR/Challan: ' + tr.lrNo,
    tr.notes && 'Notes: ' + tr.notes
  ].filter(Boolean)
  if (trLines.length) {
    page.drawText('Transport / Delivery', { x: 50, y, size: 10, font: bold, color: DARK })
    y -= 14
    for (const l of trLines) {
      page.drawText(l, { x: 50, y, size: 9, font, color: GRAY })
      y -= 13
    }
  }

  page.drawText('Thank you for your business!', { x: 50, y: 80, size: 11, font: bold, color: GREEN })
  return doc.save()
}