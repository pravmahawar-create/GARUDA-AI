import React from 'react'
import { inrFull, amountInWords } from '../../lib/money'
import { TaxLines, TransportBlock, BillTypeBadge, BankBlock, CancelledStamp } from './shared'

export default function PremiumTemplate({ invoice, company, customer }) {
  const t = invoice.totals || {}
  const isKaccha = invoice.billType === 'kaccha'
  return (
    <div className="tp tp-premium">
      <CancelledStamp status={invoice.status} />
      <div className="tp-prem-band">
        <div>
          <div className="tp-shop-gold">{company.name}</div>
          <div className="tp-muted-gold">{company.address}</div>
          {company.phone && <div className="tp-muted-gold">Ph: {company.phone}</div>}
        </div>
        <div className="tp-right">
          <BillTypeBadge invoice={invoice} />
          <div className="tp-muted-gold">No: {invoice.invoiceNo}</div>
          <div className="tp-muted-gold">Date: {invoice.date}</div>
        </div>
      </div>
      <div className="tp-goldline" />
      <div className="tp-cust-grid">
        <div>
          <div className="tp-muted">Billed To</div>
          <div className="tp-cust-name">{invoice.customerName}</div>
          {customer?.mobile && <div className="tp-muted">Mobile: {customer.mobile}</div>}
          {!isKaccha && customer?.gstin && <div className="tp-muted">GSTIN: {customer.gstin}</div>}
        </div>
        {!isKaccha && (
          <div className="tp-right">
            <div className="tp-muted">GSTIN</div>
            <div className="tp-gstin-box dark">{company.gstin || '—'}</div>
          </div>
        )}
      </div>
      <table className="tp-table">
        <thead><tr><th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>
          {(invoice.items || []).map((l, i) => (
            <tr key={i}><td>{i + 1}</td><td>{l.name}</td><td>{isKaccha ? '' : (l.hsn || '')}</td><td>{l.qty} {l.unit}</td><td>{inrFull(l.rate)}</td><td>{inrFull(l.amount)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="tp-tax-grid">
        <div className="tp-tax-box">
          <div className="tp-tline"><span>Subtotal</span><span>{inrFull(t.subtotal)}</span></div>
          <TaxLines totals={t} />
          {t.freight > 0 && <div className="tp-tline"><span>Freight</span><span>{inrFull(t.freight)}</span></div>}
          {t.loading > 0 && <div className="tp-tline"><span>Loading</span><span>{inrFull(t.loading)}</span></div>}
          {t.unloading > 0 && <div className="tp-tline"><span>Unloading</span><span>{inrFull(t.unloading)}</span></div>}
          <div className="tp-grand"><span>GRAND TOTAL</span><span>{inrFull(t.grandTotal)}</span></div>
        </div>
        <div className="tp-words-box">
          <div className="tp-muted">Amount in words</div>
          <div className="tp-words">{amountInWords(t.grandTotal)}</div>
        </div>
      </div>
      <BankBlock company={company} amount={t.grandTotal} note={'INV-' + invoice.invoiceNo} />
      <TransportBlock transport={invoice.transport} />
      <div className="tp-sign">
        <div className="tp-muted">For {company.name}</div>
        <div className="tp-sign-line">Authorised Signatory</div>
      </div>
    </div>
  )
}