import React, { useEffect, useRef, useState } from 'react'
import { db, enqueue } from '../db'
import { calcBill, inrFull } from '../lib/money'
import { parseVoice, parseLocal } from '../lib/voice'
import { navigate } from '../App'

const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition

function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'hi-IN'
    u.rate = 0.95
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch (e) { /* ignore */ }
}

export default function VoiceModal({ open, onClose }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmedBill, setConfirmedBill] = useState(null)
  const recRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setTranscript(''); setResult(null); setMessage(''); setConfirmedBill(null)
  }, [open])

  const stop = () => {
    try { recRef.current && recRef.current.stop() } catch (e) {}
    setListening(false)
  }

  const start = () => {
    if (!SpeechRec) {
      setMessage('Ye browser voice support nahi karta. Chrome use karo (mobile par bhi).')
      return
    }
    const rec = new SpeechRec()
    rec.lang = 'hi-IN'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e) => {
      let final = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      setTranscript((final || interim).trim())
    }
    rec.onend = () => {
      setListening(false)
      const text = transcriptRef.current
      if (text) handle(text)
    }
    rec.onerror = (e) => {
      setListening(false)
      setMessage('Voice error: ' + e.error + '. Dobara try karo.')
    }
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  const transcriptRef = useRef('')
  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  const handle = async (text) => {
    setBusy(true)
    setResult(null)
    const customers = await db.customers.toArray()
    const parsed = await parseVoice(text, customers.map((c) => c.name), apiBase)
    setResult(parsed)
    setBusy(false)

    if (parsed.intent === 'query_outstanding') {
      const name = parsed.customerName
      const cust = customers.find((c) => c.name.toLowerCase() === String(name || '').toLowerCase())
      if (cust) {
        const invoices = await db.invoices.where('customerId').equals(cust.id).toArray()
        const payments = await db.payments.where('customerId').equals(cust.id).toArray()
        const billed = invoices.reduce((s, i) => s + i.totals.grandTotal, 0)
        const paid = payments.reduce((s, p) => s + p.amount, 0)
        const bal = billed - paid
        const msg = cust.name + ' ka baki: ' + inrFull(bal)
        setMessage(msg)
        speak(msg)
      } else {
        const msg = name ? (name + ' customer list mein nahi mila.') : 'Customer ka naam batayein.'
        setMessage(msg)
        speak(msg)
      }
    } else if (parsed.intent === 'query_report') {
      const invoices = await db.invoices.toArray()
      const total = invoices.reduce((s, i) => s + i.totals.grandTotal, 0)
      const msg = 'Total bills: ' + invoices.length + ', total bachat: ' + inrFull(total)
      setMessage(msg)
      speak(msg)
    } else if (parsed.intent === 'clarify') {
      setMessage(parsed.message || 'Thoda aur clearly batao.')
      speak(parsed.message || 'Thoda aur clearly batao.')
    }
  }

  const confirmCreate = async () => {
    const p = result
    let cust
    const existing = await db.customers.toArray()
    const match = existing.find((c) => c.name.toLowerCase() === String(p.customer.name || '').toLowerCase())
    if (match) cust = match
    else {
      cust = { id: 'c' + Date.now(), name: p.customer.name || 'Customer', mobile: p.customer.mobile || '', gstin: '', address: '', createdAt: new Date().toISOString() }
      await db.customers.put(cust)
      await enqueue('customer', 'create', cust)
    }
    const rows = p.items.map((it) => ({ name: it.name, qty: it.qty, unit: it.unit || 'bag', rate: it.rate || 0, hsn: '' }))
    const totals = calcBill(rows, { gstRate: 18, discount: 0, transport: p.transport || {} })
    const seq = await db.settings.get('nextInvoiceNo')
    const invoiceNo = seq ? Number(seq.value) : 1001
    await db.settings.put({ key: 'nextInvoiceNo', value: invoiceNo + 1 })
    const invoice = {
      id: 'inv' + Date.now(),
      invoiceNo,
      customerId: cust.id,
      customerName: cust.name,
      date: new Date().toISOString().slice(0, 10),
      items: totals.lines,
      totals,
      discount: 0,
      transport: p.transport || {},
      status: 'saved',
      paidAmount: 0,
      createdAt: new Date().toISOString()
    }
    await db.invoices.put(invoice)
    await enqueue('invoice', 'create', invoice)
    setConfirmedBill(invoice.invoiceNo)
    speak('Bill ban gaya. Invoice number ' + invoiceNo)
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">🎙️ Garuda Voice</div>
          <button className="del" onClick={onClose}>✕</button>
        </div>

        <button className={`mic ${listening ? 'mic-on' : ''}`} onClick={listening ? stop : start}>
          <span className="mic-icon">{listening ? '⏹' : '🎙️'}</span>
          <span>{listening ? 'Suna raha hoon… bolna band karo' : 'Bolo (Hindi/Hinglish)'}</span>
        </button>

        {transcript && <div className="voice-transcript">{transcript}</div>}
        {busy && <div className="status">Samajh raha hoon…</div>}

        {result && result.intent === 'create_bill' && (
          <div className="card">
            <div className="card-title">Bill summary</div>
            <div className="vc-cust">Customer: <b>{result.customer.name || '—'}</b></div>
            {result.items.map((it, i) => (
              <div className="vc-item" key={i}>
                <span>{it.name}</span>
                <span>{it.qty} {it.unit} × {inrFull(it.rate)}</span>
              </div>
            ))}
            {result.transport?.freight > 0 && <div className="vc-item"><span>Freight</span><span>{inrFull(result.transport.freight)}</span></div>}
            <div className="vc-total">Total: {inrFull(calcBill(result.items, { gstRate: 18, transport: result.transport || {} }).grandTotal)}</div>
            {!confirmedBill && (
              <div className="actions">
                <button className="primary" onClick={confirmCreate}>✅ Create bill</button>
                <button className="ghost" onClick={() => setResult(null)}>Cancel</button>
              </div>
            )}
            {confirmedBill && <div className="status">✅ Bill #{confirmedBill} ban gaya. <button className="link" onClick={() => { onClose(); navigate('#/invoices') }}>Dekho →</button></div>}
          </div>
        )}

        {result && result.intent !== 'create_bill' && message && <div className="card"><div className="answer">{message}</div></div>}
      </div>
    </div>
  )
}