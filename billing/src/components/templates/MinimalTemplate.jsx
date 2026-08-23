import React from 'react'
import { inrFull, amountInWords } from '../../lib/money'
import { TaxLines, TransportBlock, BillTypeBadge, BankBlock, CancelledStamp } from './shared'

export default function MinimalTemplate({ invoice, company, customer }) {
  const t = invoice.totals || {}
  const isKaccha = invoice.billType === 'kaccha'
  return (
    <div className="tp tp-minimal">
      <CancelledStamp status={invoice.status} />
      <div className="tp-min-top">
        <div className="tp-shop-min">{company.name}</div>
        <div className="tp-muted">{company.address}</div>
        {company.phone && <div className="tp-muted">Ph: {company.phone} · {!isKaccha && company.gstin ? 'GSTIN: ' + company.gstin : ''}</div>}
        <div className="tp-min-rule" />
        <div className="tp-min-meta">
          <BillTypeBadge invoice={invoice} />
          <span>#{invoice.invoiceNo} · {invoice.date}</span>
        </div>
      </div>
      <div className="tp-cust">
        <div className="tp-muted">BILLED TO</div>
        <div className="tp-cust-name">{invoice.customerName}</div>
        {customer?.mobile && <div className="tp-muted">{customer.mobile}</div>}
        {!isKaccha && customer?.gstin && <div className="tp-muted">GSTIN: {customer.gstin}</div>}
      </div>
      <table className="tp-table-min">
        <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th className="right">Amount</th></tr></thead>
        <tbody>
          {(invoice.items || []).map((l, i) => (
            <tr key={i}><td>{l.name}</td><td>{l.qty} {l.unit}</td><td>{inrFull(l.rate)}</td><td className="right">{inrFull(l.amount)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="tp-totals-min">
        <div className="tp-tline"><span>Subtotal</span><span>{inrFull(t.subtotal)}</span></div>
        <TaxLines totals={t} />
        {t.freight > 0 && <div className="tp-tline"><span>Freight</span><span>{inrFull(t.freight)}</span></div>}
        {t.loading > 0 && <div className="tp-tline"><span>Loading</span><span>{inrFull(t.loading)}</span></div>}
        {t.unloading > 0 && <div className="tp-tline"><span>Unloading</span><span>{inrFull(t.unloading)}</span></div>}
        <div className="tp-grand-min"><span>Total</span><span>{inrFull(t.grandTotal)}</span></div>
        <div className="tp-words">{amountInWords(t.grandTotal)}</div>
      </div>
      <BankBlock company={company} amount={t.grandTotal} note={'INV-' + invoice.invoiceNo} />
      <TransportBlock transport={invoice.transport} wrapClass="tp-tr-min" />
      <div className="tp-foot-min">Thanks for your business.</div>
    </div>
  )
}