import React, { useEffect, useState } from 'react'
import { db, getSetting } from '../db'
import { buildInvoicePdf } from '../lib/pdf'
import { inrFull, amountInWords } from '../lib/money'
import { navigate } from '../App'

export default function InvoicePreviewScreen() {
  const id = new URLSearchParams(window.location.hash.split('?')[1] || '').get('id')
  const [invoice, setInvoice] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [settings, setSettings] = useState({})
  const [status, setStatus] = useState('')

  useEffect(() => {
    ;(async () => {
      const inv = await db.invoices.get(id)
      setInvoice(inv)
      if (inv) setCustomer(await db.customers.get(inv.customerId))
      setSettings({
        shopName: await getSetting('shopName', ''),
        shopGstin: await getSetting('shopGstin', ''),
        shopAddress: await getSetting('shopAddress', ''),
        shopPhone: await getSetting('shopPhone', '')
      })
    })()
  }, [id])

  if (!invoice) return <div className="screen"><div className="center">Loading…</div></div>

  const t = invoice.totals

  const sharePdf = async () => {
    setStatus('Generating PDF…')
    try {
      const bytes = await buildInvoicePdf(invoice, settings, customer)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const file = new File([blob], `Invoice-${invoice.invoiceNo}.pdf`, { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Invoice ' + invoice.invoiceNo })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Invoice-${invoice.invoiceNo}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
      setStatus('Done ✅')
    } catch (e) {
      setStatus('Share cancel hua / error: ' + e.message)
    }
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/bill')}>‹</button>
        <div className="top-title">Invoice #{invoice.invoiceNo}</div>
      </header>

      <div className="invoice-paper">
        <div className="ip-head">
          <div>
            <div className="ip-shop">{settings.shopName || 'Your Shop'}</div>
            {settings.shopGstin && <div className="ip-muted">GSTIN: {settings.shopGstin}</div>}
            {settings.shopAddress && <div className="ip-muted">{settings.shopAddress}</div>}
            {settings.shopPhone && <div className="ip-muted">Ph: {settings.shopPhone}</div>}
          </div>
          <div className="ip-right">
            <div className="ip-inv">GST INVOICE</div>
            <div className="ip-muted">No: {invoice.invoiceNo}</div>
            <div className="ip-muted">Date: {invoice.date}</div>
          </div>
        </div>
        <div className="ip-cust">
          <div className="ip-muted">Bill To</div>
          <div className="ip-cust-name">{invoice.customerName}</div>
          {customer?.mobile && <div className="ip-muted">Mobile: {customer.mobile}</div>}
          {customer?.gstin && <div className="ip-muted">GSTIN: {customer.gstin}</div>}
        </div>
        <table className="ip-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead>
          <tbody>
            {invoice.items.map((l, i) => (
              <tr key={i}><td>{l.name}{l.hsn ? <span className="ip-hsn"> ({l.hsn})</span> : ''}</td><td>{l.qty} {l.unit}</td><td>{inrFull(l.rate)}</td><td>{inrFull(l.amount)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="ip-totals">
          <div className="ip-tline"><span>Subtotal</span><span>{inrFull(t.subtotal)}</span></div>
          {t.discount > 0 && <div className="ip-tline"><span>Discount</span><span>-{inrFull(t.discount)}</span></div>}
          <div className="ip-tline"><span>CGST</span><span>{inrFull(t.cgst)}</span></div>
          <div className="ip-tline"><span>SGST</span><span>{inrFull(t.sgst)}</span></div>
          {t.freight > 0 && <div className="ip-tline"><span>Freight</span><span>{inrFull(t.freight)}</span></div>}
          {t.loading > 0 && <div className="ip-tline"><span>Loading</span><span>{inrFull(t.loading)}</span></div>}
          {t.unloading > 0 && <div className="ip-tline"><span>Unloading</span><span>{inrFull(t.unloading)}</span></div>}
          <div className="ip-tline ip-grand"><span>GRAND TOTAL</span><span>{inrFull(t.grandTotal)}</span></div>
          <div className="ip-words">{amountInWords(t.grandTotal)}</div>
        </div>
        {invoice.transport?.vehicleNo && (
          <div className="ip-tr">
            <div className="ip-muted">Transport</div>
            <div>{invoice.transport.vehicleNo}{invoice.transport.driverName ? ' • Driver: ' + invoice.transport.driverName : ''}</div>
            {invoice.transport.site && <div className="ip-muted">Site: {invoice.transport.site}</div>}
          </div>
        )}
        <div className="ip-foot">Thank you for your business!</div>
      </div>

      <div className="actions">
        <button className="primary big" onClick={sharePdf}>📤 Share / WhatsApp PDF</button>
        <button className="ghost" onClick={() => navigate('#/bill')}>+ Naya bill</button>
      </div>
      {status && <div className="status">{status}</div>}
    </div>
  )
}