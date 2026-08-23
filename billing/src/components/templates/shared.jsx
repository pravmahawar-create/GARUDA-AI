import React, { useEffect, useState } from 'react'
import { inrFull } from '../../lib/money'
import { upiQrDataUrl, bankLines } from '../../lib/upi'
import { Icon } from '../Icon'
export { Icon }

export function TaxLines({ totals }) {
  if (totals.billType === 'kaccha') return null
  const t = totals
  return (
    <>
      {t.discount > 0 && <div className="tp-tline"><span>Discount</span><span>-{inrFull(t.discount)}</span></div>}
      {t.igst > 0 ? (
        <div className="tp-tline"><span>IGST ({t.gstRate}%)</span><span>{inrFull(t.igst)}</span></div>
      ) : (
        <>
          <div className="tp-tline"><span>CGST ({t.gstRate / 2}%)</span><span>{inrFull(t.cgst)}</span></div>
          <div className="tp-tline"><span>SGST ({t.gstRate / 2}%)</span><span>{inrFull(t.sgst)}</span></div>
        </>
      )}
    </>
  )
}

export function TransportBlock({ transport, mutedClass = 'tp-muted', wrapClass = 'tp-tr' }) {
  const tr = transport || {}
  if (!tr.vehicleNo && !tr.driverName && !tr.site && !tr.lrNo) return null
  return (
    <div className={wrapClass}>
      <div className={mutedClass}>Transport / Bhada</div>
      <div>
        {tr.vehicleNo && <span><Icon name="truck" size={12} /> {tr.vehicleNo} </span>}
        {tr.driverName && <span>· {tr.driverName}{tr.driverMobile ? ' (' + tr.driverMobile + ')' : ''}</span>}
        {tr.site && <span> · <Icon name="pin" size={12} /> {tr.site}</span>}
        {tr.lrNo && <span> · LR {tr.lrNo}</span>}
      </div>
      {tr.freight > 0 && <div className={mutedClass}>Freight: {inrFull(tr.freight)}</div>}
    </div>
  )
}

export function BillTypeBadge({ invoice }) {
  const isKaccha = invoice?.billType === 'kaccha'
  return <span className={`billtype-badge ${isKaccha ? 'bt-kaccha' : 'bt-gst'}`}>{isKaccha ? 'KACCHA BILL' : 'TAX INVOICE'}</span>
}

export function QrImg({ company, amount, note }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let alive = true
    upiQrDataUrl(company, amount, note).then((d) => { if (alive && d) setSrc(d) })
    return () => { alive = false }
  }, [company?.upiId, amount, note])
  if (!src) return null
  return <img className="tp-qr" src={src} alt="UPI QR" />
}

export function BankBlock({ company, amount, note, label = 'Payment Details (UPI)' }) {
  const lines = bankLines(company)
  if (!lines.length && !company?.upiId) return null
  return (
    <div className="tp-bank">
      <div className="tp-bank-left">
        <div className="tp-muted" style={{ fontWeight: 700 }}>{label}</div>
        {lines.map(([v, l]) => (
          <div key={l} className="tp-tline" style={{ fontSize: 11 }}>
            <span style={{ color: '#6b7280' }}>{l}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
      <div className="tp-bank-right">
        <QrImg company={company} amount={amount} note={note} />
        {company?.upiId && <div className="tp-muted" style={{ fontSize: 10 }}>{company.upiId}</div>}
      </div>
    </div>
  )
}

export function CancelledStamp({ status }) {
  if (status !== 'cancelled') return null
  return <div className="tp-cancelled">CANCELLED</div>
}