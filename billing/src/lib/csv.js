export function csvEscape(v) {
  const s = String(v === undefined || v === null ? '' : v)
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function toCsv(header, rows) {
  const all = [header, ...rows]
  return all.map((r) => r.map(csvEscape).join(',')).join('\n')
}

export function buildGstr1Csv(invoices, company) {
  const gstInvoices = (invoices || []).filter((i) => i.billType !== 'kaccha')
  const header = ['GSTIN', 'Trade Name', 'Invoice No', 'Date', 'Place of Supply', 'Invoice Type', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Cess', 'Total']
  const rows = gstInvoices.map((i) => {
    const t = i.totals || {}
    return [
      company?.gstin || '',
      company?.name || '',
      i.invoiceNo,
      i.date,
      t.mode === 'inter' ? '16' : '23',
      'R',
      Number(t.taxable || 0).toFixed(2),
      Number(t.cgst || 0).toFixed(2),
      Number(t.sgst || 0).toFixed(2),
      Number(t.igst || 0).toFixed(2),
      '0.00',
      Number(t.grandTotal || 0).toFixed(2)
    ]
  })
  return toCsv(header, rows)
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function buildGstSummaryCsv(months) {
  const header = ['Month', 'Bills', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total GST', 'Change %']
  const rows = months.map((m) => [
    m.month,
    m.count,
    Number(m.taxable).toFixed(2),
    Number(m.cgst).toFixed(2),
    Number(m.sgst).toFixed(2),
    Number(m.igst).toFixed(2),
    Number(m.total).toFixed(2),
    m.change === null ? '' : Number(m.change).toFixed(1)
  ])
  return toCsv(header, rows)
}