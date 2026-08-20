import React, { useState } from 'react'
import { db, enqueue } from '../db'
import { validateGstin, gstStateCode } from '../lib/gst'

const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export default function GstVerifyModal({ open, onClose }) {
  const [gstin, setGstin] = useState('')
  const [step, setStep] = useState('input')
  const [info, setInfo] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')

  if (!open) return null

  const reset = () => { setGstin(''); setStep('input'); setInfo(null); setErr(''); setDone('') }

  const verify = async () => {
    setErr(''); setDone('')
    const g = gstin.trim().toUpperCase()
    if (!validateGstin(g)) {
      setStep('result')
      setInfo({ valid: false, message: 'GSTIN format/checksum sahi nahi hai. Dobara check karo.' })
      return
    }
    const dup = await db.customers.where('gstin').equals(g).count()
    if (dup > 0) {
      setStep('result')
      setInfo({ valid: true, dup: true, message: 'Ye business pehle se records mein hai.', state: gstStateCode(g), gstin: g })
      return
    }
    setBusy(true)
    let live = null
    if (apiBase) {
      try {
        const r = await fetch(apiBase + '/api/billing/gst-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gstin: g })
        })
        const j = await r.json()
        live = j
      } catch (e) { /* offline */ }
    }
    setBusy(false)
    setStep('result')
    setInfo({ valid: true, gstin: g, state: gstStateCode(g), live })
  }

  const add = async () => {
    const b = info.live?.business
    const cust = {
      id: 'c' + Date.now(),
      name: (b && (b.legalName || b.tradeName)) || gstin,
      mobile: '',
      gstin: info.gstin,
      address: (b && b.address) || '',
      createdAt: new Date().toISOString()
    }
    await db.customers.put(cust)
    await enqueue('customer', 'create', cust)
    setDone('✅ ' + (b ? b.legalName || b.tradeName : info.gstin) + ' records mein add ho gaya')
  }

  const liveBiz = info?.live?.business

  return (
    <div className="modal-mask" onClick={() => { onClose(); reset() }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Verify GSTIN</div>
          <button className="del" onClick={() => { onClose(); reset() }}>✕</button>
        </div>

        {step === 'input' && (
          <>
            <input className="input" placeholder="GSTIN (15 digit)" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} />
            <button className="primary" disabled={busy} onClick={verify}>{busy ? 'Checking…' : 'Verify'}</button>
            <div className="ip-muted" style={{ marginTop: 8 }}>Checksum validation + (agar key set ho) GSTN live verify. Sirf aapke approve par add hoga.</div>
          </>
        )}

        {step === 'result' && info && (
          <>
            {!info.valid && <div className="card"><div className="err">{info.message}</div></div>}

            {info.valid && !info.dup && !liveBiz && (
              <div className="card">
                <div className="card-title">Checksum valid ✅</div>
                <div className="ip-muted">GSTIN: {info.gstin}</div>
                <div className="ip-muted">State: {info.state}</div>
                {info.live?.live === false && <div className="ip-muted">Live verification: unavailable (API key nahi hai).</div>}
                {!info.live && <div className="ip-muted">Live verification: offline / server nahi pahuncha.</div>}
              </div>
            )}

            {info.valid && !info.dup && liveBiz && (
              <div className="card">
                <div className="card-title">Business found</div>
                <div className="cust-name">{liveBiz.legalName || liveBiz.tradeName || '—'}</div>
                <div className="ip-muted">GSTIN: {liveBiz.gstin || info.gstin}</div>
                {liveBiz.state && <div className="ip-muted">State: {liveBiz.state}</div>}
                {liveBiz.address && <div className="ip-muted">{liveBiz.address}</div>}
                {liveBiz.status && <div className="ip-muted">Status: {liveBiz.status}</div>}
                <div className="ip-muted" style={{ margin: '8px 0' }}>Add this business to your records?</div>
                <button className="primary" onClick={add}>➕ Add Business</button>
                <button className="ghost" onClick={reset}>Cancel</button>
              </div>
            )}

            {info.valid && info.dup && <div className="card"><div className="status">{info.message}</div></div>}
            {done && <div className="status">{done}</div>}
            <button className="ghost" onClick={reset}>Verify another</button>
          </>
        )}
      </div>
    </div>
  )
}