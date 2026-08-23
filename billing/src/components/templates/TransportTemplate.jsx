import React from 'react'
import { inrFull, amountInWords } from '../../lib/money'
import { TaxLines, BillTypeBadge, BankBlock, CancelledStamp, Icon } from './shared'

export default function TransportTemplate({ invoice, company, customer }) {
  const t = invoice.totals || {}
  const tr = invoice.transport || {}
  const isKaccha = invoice.billType === 'kaccha'
  return (
    <div className="tp tp-transport">
      <CancelledStamp status={invoice.status} />
      <div className="tp-band amber">
        <div>
          <div className="tp-shop-light">{company.name}</div>
          <div className="tp-muted-light">{company.address} · Ph: {company.phone}</div>
          {!isKaccha && <div className="tp-muted-light">GSTIN: {company.gstin}</div>}
        </div>
        <div className="tp-right">
          <BillTypeBadge invoice={invoice} />
          <div className="tp-muted-light">#{invoice.invoiceNo} · {invoice.date}</div>
        </div>
      </div>

      <div className="tp-delivery-box">
        <div className="tp-del-head"><Icon name="truck" size={14} /> DELIVERY / TRANSPORT / BHADA DETAILS</div>
        <div className="tp-del-grid">
          <div><span className="tp-muted">Vehicle</span><b>{tr.vehicleNo || '—'}</b></div>
          <div><span className="tp-muted">Driver</span><b>{tr.driverName || '—'}{tr.driverMobile ? ' (' + tr.driverMobile + ')' : ''}</b></div>
          <div><span className="tp-muted">Site</span><b>{tr.site || '—'}</b></div>
          <div><span className="tp-muted">LR/Challan</span><b>{tr.lrNo || '—'}</b></div>
          <div><span className="tp-muted">Freight/Bhada</span><b>{t.freight > 0 ? inrFull(t.freight) : '—'}</b></div>
          <div><span className="tp-muted">Loading</span><b>{t.loading > 0 ? inrFull(t.loading) : '—'}</b></div>
        </div>
      </div>

      <div className="tp-cust-grid">
        <div>
          <div className="tp-muted">Bill To</div>
          <div className="tp-cust-name">{invoice.customerName}</div>
          {customer?.mobile && <div className="tp-muted">Mobile: {customer.mobile}</div>}
          {!isKaccha && customer?.gstin && <div className="tp-muted">GSTIN: {customer.gstin}</div>}
        </div>
      </div>

      <table className="tp-table">
        <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
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
      <div className="tp-foot">Thank you for your business!</div>
    </div>
  )
}