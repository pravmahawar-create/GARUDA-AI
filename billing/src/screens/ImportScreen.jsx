import React, { useState } from 'react'
import { db, enqueue, getActiveCompany, nextBillNo } from '../db'
import { inrFull, calcBill } from '../lib/money'
import { gstTypeFor } from '../lib/gst'
import { navigate } from '../App'
import { Icon } from '../components/Icon'

const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export default function ImportScreen() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [parsed, setParsed] = useState(null)
  const [needsReview, setNeedsReview] = useState([])
  const [imported, setImported] = useState('')

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result).split(',')[1])
      r.onerror = reject
      r.readAsDataURL(file)
    })

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (!apiBase) return setMsg('Server address (VITE_API_BASE) set nahi hai — pehle set karo (Settings/deploy).')
    setBusy(true); setMsg('Padh raha hoon…'); setParsed(null); setNeedsReview([])
    try {
      const data = await fileToBase64(file)
      const mime = file.type || 'image/jpeg'
      const res = await fetch(apiBase + '/api/billing/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, mimeType: mime, kind: 'invoice' })
      })
      const j = await res.json()
      if (!j.success) {
        setMsg('Extract fail: ' + (j.message || 'AI ne kuch samjha nahi') + '. Pakka photo/PDF daalo.')
        return
      }
      const p = j.parsed
      setParsed(p)
      const low = []
      if ((p.confidence || 0) < 0.6) low.push('poora document')
      if (p.items && p.items.length === 0) low.push('items')
      if (!p.invoice?.invoiceNo) low.push('invoice number')
      setNeedsReview(low)
      setMsg(`Confidence: ${Math.round((p.confidence || 0) * 100)}%` + (low.length ? ' — review chahiye: ' + low.join(', ') : ' — high confidence'))
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const doImport = async () => {
    const p = parsed
    let customerId = ''
    const biz = p.businesses && p.businesses[0]
    if (biz && (biz.name || biz.gstin)) {
      const dup = await db.customers.where('gstin').equals(biz.gstin || '____none').count()
      if (!dup) {
        const cust = { id: 'c' + Date.now(), name: biz.name || biz.gstin || 'Customer', mobile: '', gstin: biz.gstin || '', billType: biz.gstin ? 'gst' : 'kaccha', address: biz.address || '', creditLimit: 0, createdAt: new Date().toISOString() }
        await db.customers.put(cust)
        await enqueue('customer', 'create', cust)
        customerId = cust.id
      }
    }
    if (p.items && p.items.length > 0) {
      const rows = p.items.filter((it) => Number(it.qty) > 0)
      if (rows.length > 0) {
        const comp = await getActiveCompany()
        const custGstin = biz?.gstin || ''
        const billType = (cust && cust.billType) || (custGstin ? 'gst' : 'kaccha')
        const mode = gstTypeFor(comp.gstin, custGstin)
        const totals = calcBill(rows, { gstRate: comp.gstRate, transport: p.transport || {}, billType, mode })
        const invoiceNo = await nextBillNo(comp.id, billType)
        const invoice = {
          id: 'inv' + Date.now(),
          invoiceNo,
          companyId: comp.id,
          companyName: comp.name,
          templateId: comp.templateId || 'classic',
          billType,
          customerId,
          customerName: p.invoice?.customerName || (biz && biz.name) || '—',
          date: p.invoice?.date || new Date().toISOString().slice(0, 10),
          items: rows,
          totals,
          discount: p.tax?.discount || 0,
          transport: p.transport || {},
          bank: { bankName: comp.bankName, bankHolder: comp.bankHolder, bankAccount: comp.bankAccount, bankIfsc: comp.bankIfsc, upiId: comp.upiId },
          status: 'saved',
          paidAmount: 0,
          createdAt: new Date().toISOString()
        }
        await db.invoices.put(invoice)
        await enqueue('invoice', 'create', invoice)
        setImported('Import ho gaya — ' + (billType === 'kaccha' ? 'Non-GST bill' : 'Invoice') + ' #' + invoiceNo)
      }
    } else {
      setImported('Business/customer record import ho gaya')
    }
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Import Document</div>
      </header>

      <section className="card">
        <div className="card-title">Bill ka photo/PDF/screenshot</div>
        <input type="file" accept="image/*,application/pdf" onChange={handleFile} disabled={busy} className="file-input" />
        <div className="ip-muted">Photo, invoice PDF, WhatsApp screenshot — sab chalega. AI padhega, aap review karke approve karo. Kabhi bhi invent nahi karega.</div>
        {msg && <div className="status">{msg}</div>}
      </section>

      {parsed && (
        <section className="card">
          <div className="card-title">Extracted data {needsReview.length > 0 && <span className="chip chip-other">Needs review</span>}</div>
          {parsed.invoice && (parsed.invoice.invoiceNo || parsed.invoice.date) && (
            <div className="ip-muted">Invoice {parsed.invoice.invoiceNo} · {parsed.invoice.date}</div>
          )}
          {(parsed.invoice?.customerName || (parsed.businesses && parsed.businesses[0]?.name)) && (
            <div className="cust-name">{parsed.invoice?.customerName || parsed.businesses[0].name}</div>
          )}
          {parsed.businesses && parsed.businesses[0]?.gstin && <div className="ip-muted">GSTIN: {parsed.businesses[0].gstin}</div>}
          {(parsed.items || []).map((it, i) => (
            <div className="vc-item" key={i}><span>{it.name || 'item'}</span><span>{it.qty} {it.unit} × {inrFull(it.rate)}</span></div>
          ))}
          {parsed.tax?.grandTotal > 0 && <div className="vc-total">Total: {inrFull(parsed.tax.grandTotal)}</div>}
          <div className="actions">
            <button className="primary" onClick={doImport}><Icon name="check" size={14} /> Approve & Import</button>
          </div>
          {imported && <div className="status">{imported}</div>}
        </section>
      )}
    </div>
  )
}