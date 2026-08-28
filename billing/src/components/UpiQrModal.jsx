import React, { useEffect, useState } from 'react'
import { upiQrDataUrl, upiUrl, bankLines } from '../lib/upi'
import { inrFull } from '../lib/money'
import { Icon } from './Icon'

export default function UpiQrModal({ open, onClose, company, amount = 0, txnRef = '' }) {
  const [qr, setQr] = useState(null)

  useEffect(() => {
    if (!open) return
    setQr(null)
    if (!company || !company.upiId) return
    upiQrDataUrl(company, amount, txnRef).then(setQr).catch(() => setQr(null))
  }, [open, company, amount, txnRef])

  if (!open) return null
  const url = upiUrl(company, amount, txnRef)
  const banks = bankLines(company)

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><Icon name="rupee" size={18} /> UPI Payment</div>
          <button className="del" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        {!company || !company.upiId ? (
          <div className="empty" style={{ padding: '20px 10px' }}>
            <div className="empty-title">UPI ID set nahi hai</div>
            <div className="empty-sub">Company settings mein apna UPI ID add karo.</div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div className="stock-big" style={{ fontSize: 22 }}>{amount > 0 ? inrFull(amount) : 'Amount?'}</div>
              <div className="ip-muted">{company.bankHolder || company.name}</div>
            </div>
            {qr ? (
              <div style={{ textAlign: 'center' }}>
                <img src={qr} alt="UPI QR" style={{ width: 240, height: 240, borderRadius: 12 }} />
              </div>
            ) : (
              <div className="status">QR bana raha hoon…</div>
            )}
            <div className="ip-muted" style={{ textAlign: 'center', wordBreak: 'break-all', marginTop: 8 }}>{url}</div>
            {banks.length > 0 && (
              <div className="card" style={{ marginTop: 10 }}>
                {banks.map(([v, l]) => (
                  <div className="vc-item" key={l}><span>{l}</span><span>{v}</span></div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
