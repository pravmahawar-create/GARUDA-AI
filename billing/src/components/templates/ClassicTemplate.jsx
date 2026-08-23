import React from 'react'
import { inrFull, amountInWords } from '../../lib/money'
import { TaxLines, TransportBlock, BillTypeBadge, BankBlock, CancelledStamp } from './shared'

export default function ClassicTemplate({ invoice, company, customer }) {
  const t = invoice.totals || {}
  const isKaccha = invoice.billType === 'kaccha'
  return (
    <div className="tp tp-classic">
      <CancelledStamp status={invoice.status} />
      <div className="tp-head">
        <div>
          <div className="tp-shop">{company.name}</div>
          {!isKaccha && company.gstin && <div className="tp-muted">GSTIN: {company.gstin}</div>}
          {company.address && <div className="tp-muted">{company.address}</div>}
          {company.phone && <div className="tp-muted">Ph: {company.phone}</div>}
        </div>
        <div className="tp-right">
          <BillTypeBadge invoice={invoice} />
          <div className="tp-muted">No: {invoice.invoiceNo}</div>
          <div className="tp-muted">Date: {invoice.date}</div>
        </div>
      </div>
      <div className="tp-cust">
        <div className="tp-muted">Bill To</div>
        <div className="tp-cust-name">{invoice.customerName}</div>
        {customer?.mobile && <div className="tp-muted">Mobile: {customer.mobile}</div>}
        {!isKaccha && customer?.gstin && <div className="tp-muted">GSTIN: {customer.gstin}</div>}
      </div>
      <table className="tp-table">
        <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead>
        <tbody>
          {(invoice.items || []).map((l, i) => (
            <tr key={i}><td>{l.name}{l.hsn && !isKaccha ? <span className="tp-hsn"> ({l.hsn})</span> : ''}</td><td>{l.qty} {l.unit}</td><td>{inrFull(l.rate)}</td><td>{inrFull(l.amount)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="tp-totals">
        <div className="tp-tline"><span>Subtotal</span><span>{inrFull(t.subtotal)}</span></div>
        <TaxLines totals={t} />
        {t.freight > 0 && <div className="tp-tline"><span>Freight</span><span>{inrFull(t.freight)}</span></div>}
        {t.loading > 0 && <div className="tp-tline"><span>Loading</span><span>{inrFull(t.loading)}</span></div>}
        {t.unloading > 0 && <div className="tp-tline"><span>Unloading</span><span>{inrFull(t.unloading)}</span></div>}
        <div className="tp-grand"><span>GRAND TOTAL</span><span>{inrFull(t.grandTotal)}</span></div>
        <div className="tp-words">{amountInWords(t.grandTotal)}</div>
      </div>
      <BankBlock company={company} amount={t.grandTotal} note={'INV-' + invoice.invoiceNo} />
      <TransportBlock transport={invoice.transport} />
      <div className="tp-foot">Thank you for your business!</div>
    </div>
  )
}