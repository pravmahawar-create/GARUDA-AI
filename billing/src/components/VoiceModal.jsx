import React, { useEffect, useRef, useState } from 'react'
import { db, applyStockOp, getStockQty, findStockItem, getActiveCompany, canonicalName } from '../db'
import { inrFull, calcBill } from '../lib/money'
import { parseVoice, normalizeDevanagari } from '../lib/voice'
import { ConversationManager } from '../lib/conversation'
import { getCustomerHistory, findCustomerByRef } from '../lib/customerContext'
import { executeCreateBill } from '../lib/voiceExecutor'
import { recordPayment, getLedger, getLastPayment, getTotalPaid, customerOutstanding } from '../lib/ledger'
import UpiQrModal from './UpiQrModal'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import { navigate } from '../App'
import { Icon } from './Icon'

const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
const native = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()
const LISTEN_MAX_MS = 20000
const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timeout after ' + ms + 'ms')), ms))
])

function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'hi-IN'
    u.rate = 0.95
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch (e) {}
}

export default function VoiceModal({ open, onClose, initialCustomer }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const [confirmedBill, setConfirmedBill] = useState(null)
  const [confirmedInvoiceId, setConfirmedInvoiceId] = useState(null)
  const [stockResult, setStockResult] = useState(null)
  const [company, setCompany] = useState(null)
  const [clickDiag, setClickDiag] = useState(false)
  const [draftNote, setDraftNote] = useState('')
  const [financeDraft, setFinanceDraft] = useState(null)
  const [upiOpen, setUpiOpen] = useState(false)
  const [upiAmount, setUpiAmount] = useState(0)
  const recRef = useRef(null)
  const mediaRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const listenTimerRef = useRef(null)
  const conversation = useRef(new ConversationManager())
  const convoIdRef = useRef(null)
  const executingRef = useRef(false)

  useEffect(() => {
    if (!open) return
    setTranscript(''); setResult(null); setMessage(''); setConfirmedBill(null); setConfirmedInvoiceId(null); setErrMsg(''); setStockResult(null); setDraftNote(''); setFinanceDraft(null); setUpiOpen(false)
    ;(async () => setCompany(await getActiveCompany()))()
  }, [open])

  useEffect(() => {
    const id = conversation.current.newConversation()
    convoIdRef.current = id
    if (initialCustomer) conversation.current.seedCustomer(id, initialCustomer)
    return () => conversation.current.endConversation(id)
  }, [initialCustomer])

  useEffect(() => {
    return () => {
      try { streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop()) } catch (e) {}
      try { if (mediaRef.current) mediaRef.current.stop() } catch (e) {}
      try { if (native) SpeechRecognition.stop() } catch (e) {}
      if (listenTimerRef.current) clearTimeout(listenTimerRef.current)
    }
  }, [])

  const clearListenTimer = () => {
    if (listenTimerRef.current) { clearTimeout(listenTimerRef.current); listenTimerRef.current = null }
  }

  const stop = async () => {
    clearListenTimer()
    try { if (native) await SpeechRecognition.stop() } catch (e) {}
    try { if (mediaRef.current) mediaRef.current.stop() } catch (e) {}
    try { recRef.current && recRef.current.stop() } catch (e) {}
    setListening(false)
  }

  const transcribeUpload = async (blob) => {
    setBusy(true)
    setMessage('Samajh raha hoon…')
    try {
      if (!apiBase) {
        setMessage('Is browser mein voice supported nahi hai. Android app install karo ya Chrome use karo.')
        return
      }
      const fd = new FormData()
      fd.append('audio', blob, 'voice.webm')
      const res = await fetch(apiBase + '/api/billing/stt', { method: 'POST', body: fd })
      const data = await res.json()
      const text = String((data && data.text) || '').trim()
      setTranscript(text)
      if (text) await handle(text)
      else setMessage('Kuch suna nahi. Fir bolo — jaise "Ramesh ke naam 50 bag cement 390 ke bill bana do".')
    } catch (e) {
      setMessage('Voice server error: ' + (e && e.message ? e.message : e))
    } finally {
      setBusy(false)
    }
  }

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMessage('Mic access nahi mila (browser supports nahi karta).')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const rec = new MediaRecorder(stream)
      mediaRef.current = rec
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        clearListenTimer()
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        chunksRef.current = []
        if (blob.size > 0) await transcribeUpload(blob)
        setListening(false)
      }
      rec.onerror = () => { clearListenTimer(); setListening(false); setMessage('Recording error. Dobara try karo.') }
      setListening(true)
      rec.start()
      listenTimerRef.current = setTimeout(() => { try { rec.stop() } catch (e) {} }, LISTEN_MAX_MS)
    } catch (e) {
      setListening(false)
      setMessage('Mic permission nahi mili: ' + (e && e.message ? e.message : e))
    }
  }

  const start = async () => {
    console.log('[VOICE_CLICK] BOLO CLICKED')
    setClickDiag(true); setTimeout(() => setClickDiag(false), 1500)
    console.log('[VOICE_START] entered')
    console.log('[VOICE] session created, listening=' + listening + ' busy=' + busy)
    if (listening || busy) {
      console.log('[VOICE] already listening/busy — stopping previous session first')
      await stop()
      // small delay to let Android reset
      await new Promise((r) => setTimeout(r, 300))
    }
    setErrMsg(''); setMessage(''); setStockResult(null); setFinanceDraft(null)
    // CLEANUP any stale session before starting — critical for consecutive commands, non-blocking
    console.log('[VOICE] cleanup start')
    try { await withTimeout(SpeechRecognition.stop().catch(()=>{}), 1000, 'cleanup stop') } catch (e) { console.log('[VOICE] cleanup stop timeout/error', e && e.message) }
    try { await withTimeout(SpeechRecognition.removeAllListeners().catch(()=>{}), 1000, 'cleanup listeners') } catch (e) { console.log('[VOICE] cleanup listeners timeout', e && e.message) }
    clearListenTimer()
    setListening(false)
    transcriptRef.current = ''
    setTranscript('')
    if (native) {
      try {
        console.log('[VOICE] permission check')
        let perm
        try {
          perm = await withTimeout(SpeechRecognition.requestPermissions(), 5000, 'permission')
          console.log('[VOICE_PERMISSION] result', JSON.stringify(perm))
        } catch (e) {
          console.log('[VOICE_ERROR] permission timeout/error', e && e.message)
          setMessage('Microphone permission timeout — App Settings se allow karo aur dobara try karo.')
          setListening(false); clearListenTimer()
          return
        }
        const granted = perm && (perm.speechRecognition === 'granted' || perm.speechRecognition === true)
        if (!granted) { setMessage('Mic permission nahi mili. App Settings se allow karo.'); console.log('[VOICE ERROR] permission denied'); setListening(false); clearListenTimer(); return }
        console.log('[VOICE] available check')
        let avail
        try {
          avail = await withTimeout(SpeechRecognition.available(), 5000, 'available')
          console.log('[VOICE_AVAILABLE] result', JSON.stringify(avail))
        } catch (e) {
          console.log('[VOICE_ERROR] available timeout/error', e && e.message)
          setMessage('Voice check timeout — dobara try karo.')
          setListening(false); clearListenTimer()
          return
        }
        if (!avail || !avail.available) { setMessage('Is phone par voice recognition available nahi hai.'); console.log('[VOICE ERROR] not available'); setListening(false); clearListenTimer(); return }
        let lang = 'hi-IN'
        try {
          const sup = await withTimeout(SpeechRecognition.getSupportedLanguages(), 3000, 'getSupportedLanguages')
          const list = sup && sup.languages ? sup.languages : []
          if (list.length && !list.includes('hi-IN') && !list.includes('hi')) lang = 'en-IN'
        } catch (e) { console.log('[VOICE] getSupportedLanguages timeout/error, using hi-IN') }
        console.log('[VOICE] start lang=' + lang)
        setListening(true); setTranscript(''); setMessage('Sun raha hoon… (' + lang + ') pura bolo'); setResult(null)
        transcriptRef.current = ''
        let text = ''
        let partialListener = null
        let listeningListener = null
        try {
          partialListener = await SpeechRecognition.addListener('partialResults', (data) => {
            console.log('[VOICE_PARTIAL] ' + JSON.stringify(data))
            if (data && data.matches && data.matches[0]) {
              text = String(data.matches[0] || '').trim()
              transcriptRef.current = text
              setTranscript(text)
            }
          })
          listeningListener = await SpeechRecognition.addListener('listeningState', (data) => {
            console.log('[VOICE_LISTENING_STATE] ' + JSON.stringify(data))
          })
          console.log('[VOICE] listeners registered BEFORE start')
        } catch (e) { console.log('[VOICE_ERROR] addListener failed', e && e.message) }
        listenTimerRef.current = setTimeout(() => { console.log('[VOICE] timeout stop'); try { SpeechRecognition.stop() } catch (e) {} }, LISTEN_MAX_MS)
        try {
          console.log('[VOICE] SpeechRecognition.start')
          const r = await withTimeout(SpeechRecognition.start({ language: lang, maxResults: 5, partialResults: false }), 25000, 'start')
          clearListenTimer()
          console.log('[VOICE_RESULT] ' + JSON.stringify(r))
          if (r && r.matches && r.matches[0]) text = String(r.matches[0] || '').trim()
          if (!text) text = String(transcriptRef.current || '').trim()
          console.log('[VOICE_RAW] ' + text)
        } catch (e) {
          clearListenTimer()
          console.log('[VOICE_ERROR] start failed ' + (e && e.message ? e.message : e))
          text = String(transcriptRef.current || '').trim()
          console.log('[VOICE_RAW] fallback text ' + text)
          if (!text) setMessage('Voice error: ' + (e && e.message ? e.message : e))
          if (!text && lang === 'hi-IN') {
            try {
              console.log('[VOICE] fallback en-IN')
              listenTimerRef.current = setTimeout(() => { try { SpeechRecognition.stop() } catch (e2) {} }, LISTEN_MAX_MS)
              const r2 = await withTimeout(SpeechRecognition.start({ language: 'en-IN', maxResults: 5, partialResults: false }), 25000, 'start-en')
              clearListenTimer()
              console.log('[VOICE_RESULT] fallback ' + JSON.stringify(r2))
              if (r2 && r2.matches && r2.matches[0]) text = String(r2.matches[0] || '').trim()
              console.log('[VOICE_RAW] fallback ' + text)
            } catch (e2) { clearListenTimer(); console.log('[VOICE_ERROR] fallback failed ' + (e2 && e2.message ? e2.message : e2)) }
          }
        }
        try { if (partialListener) await withTimeout(partialListener.remove(), 1000, 'cleanup partialListener') } catch (e) {}
        try { if (listeningListener) await withTimeout(listeningListener.remove(), 1000, 'cleanup listeningListener') } catch (e) {}
        try { await withTimeout(SpeechRecognition.removeAllListeners(), 1000, 'cleanup removeAllListeners') } catch (e) {}
        try { await withTimeout(SpeechRecognition.stop(), 1000, 'cleanup stop') } catch (e) {}
        clearListenTimer()
        setListening(false)
        console.log('[VOICE_END] text=' + text)
        if (text) { setTranscript(text); await handle(text) }
        else if (!message) setMessage('Kuch suna nahi. Fir bolo — "Ramesh ke naam 50 bag cement 390 ke bill bana do".')
        console.log('[VOICE] cleanup ready for next session')
      } catch (e) {
        clearListenTimer()
        try { await SpeechRecognition.removeAllListeners() } catch (e2) {}
        try { await SpeechRecognition.stop() } catch (e2) {}
        setListening(false)
        console.log('[VOICE ERROR] outer', e && e.message)
        setMessage('Voice error: ' + (e && e.message ? e.message : e))
      }
      return
    }
    if (!SpeechRec) {
      return startRecording()
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
      clearListenTimer()
      setListening(false)
      const text = transcriptRef.current
      if (text) handle(text)
      else setMessage('Kuch suna nahi. Dobara bolo.')
    }
    rec.onerror = (e) => {
      clearListenTimer()
      setListening(false)
      setMessage('Voice error: ' + e.error + '. Dobara try karo.')
    }
    recRef.current = rec
    setListening(true)
    setMessage('Sun raha hoon… pura bolo')
    rec.start()
    listenTimerRef.current = setTimeout(() => { try { rec.stop() } catch (e) {} }, LISTEN_MAX_MS)
  }

  const transcriptRef = useRef('')
  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  const handle = async (text) => {
    console.log('[VOICE_HANDLE_ENTER] ' + text)
    console.log('[VOICE_RAW] ' + text)
    try { console.log('[VOICE_NORMALIZED] ' + normalizeDevanagari(text)) } catch (e) {}
    setBusy(true)
    setResult(null)
    setStockResult(null)
    setConfirmedBill(null)
    setConfirmedInvoiceId(null)
    setMessage('Samajh raha hoon…')
    setErrMsg('')
    let parsed
    let customers = []
    let stage = 'init'
    try {
      stage = 'db_customers'
      console.log('[VOICE_DB_CUSTOMERS_BEFORE]')
      customers = await withTimeout(db.customers.toArray(), 5000, 'db customers')
      console.log('[VOICE_DB_CUSTOMERS_AFTER] count=' + customers.length)
      stage = 'db_items'
      const stockItems = await withTimeout(db.items.toArray(), 5000, 'db items')
      stage = 'parse'
      console.log('[VOICE_PARSE_BEFORE]')
      parsed = await parseVoice(text, customers.map((c) => c.name), apiBase, stockItems)
      console.log('[VOICE_PARSE_AFTER] ' + JSON.stringify(parsed).slice(0,800))
      console.log('[VOICE_INTENT] ' + (parsed && parsed.intent))
      stage = 'exec_' + (parsed && parsed.intent)
      setResult(parsed)
      setBusy(false)

      const isNonBill = ['query_outstanding', 'query_report', 'query_delivery', 'stock_entry', 'stock_query', 'stock_ledger_query'].includes(parsed.intent)
      if (!isNonBill) {
        // BILL / FIELD / CLARIFY turn → conversational layer (never auto-executes)
        const bizCtx = { customers, stockItems, company, getHistory: (cid) => getCustomerHistory(cid), resolveCustomer: (name) => findCustomerByRef(customers, name) }
        const turn = await conversation.current.processTurn(convoIdRef.current, text, parsed, bizCtx)
        setDraftNote(turn.summary || '')
        if (turn.status === 'execute') {
          try {
            executingRef.current = true
            const draft = conversation.current.draftForExecution(convoIdRef.current)
            if (!draft) throw new Error('No draft')
            const { invoice, totals } = await executeCreateBill(draft, company)
            conversation.current.markExecuted(convoIdRef.current, invoice)
            setConfirmedBill(invoice.invoiceNo)
            setConfirmedInvoiceId(invoice.id)
            const msg = 'Bill created successfully — #' + invoice.invoiceNo + ' — ' + invoice.customerName + ' — ' + totals.grandTotal.toLocaleString('en-IN') + ' rupaye'
            setMessage(msg)
            speak('Bill ban gaya. Invoice number ' + invoice.invoiceNo)
          } catch (e) {
            console.log('[VOICE ERROR] bill write', e && e.message)
            setErrMsg('Bill nahi bana: ' + (e && e.message ? e.message : e))
          } finally {
            executingRef.current = false
          }
          return
        }
        if (turn.status === 'needs_confirm') {
          setResult(turn.renderDraft || null)
          setMessage(turn.message)
          speak(turn.message)
          return
        }
        if (turn.status === 'needs_info' || turn.status === 'suggest' || turn.status === 'ambiguous_customer') {
          setResult(null)
          setMessage(turn.message)
          speak(turn.message)
          return
        }
        if (turn.status === 'intent_switch') {
          setMessage(turn.message)
          speak(turn.message)
          return
        }
        if (turn.status === 'payment_confirm') {
          setResult(null)
          setFinanceDraft(turn.renderFinance || null)
          let msg = turn.message
          const f = turn.renderFinance
          if (f && f.customerId) {
            const out = await customerOutstanding(f.customerId, company?.id || '')
            if (out < f.amount) msg = msg + ' Baki ₹' + out + ' hai — ₹' + (f.amount - out) + ' advance ke roop mein rakhu?'
          }
          setMessage(msg); speak(msg)
          return
        }
        if (turn.status === 'payment_needs_info') {
          setResult(null); setFinanceDraft(null); setMessage(turn.message); speak(turn.message); return
        }
        if (turn.status === 'payment_execute') {
          try {
            const f = conversation.current.get(convoIdRef.current) && conversation.current.get(convoIdRef.current).finance
            if (!f || f.executed) { setMessage('Payment already record ho gaya tha.'); return }
            const pay = await recordPayment({ customerId: f.customerId, invoiceId: f.invoiceId || '', amount: f.amount, date: '', mode: f.method || 'Cash', note: f.note || '', companyId: company?.id || '' })
            conversation.current.markFinanceExecuted(convoIdRef.current)
            setFinanceDraft(null)
            const out = await customerOutstanding(f.customerId, company?.id || '')
            const msg = 'Payment ₹' + pay.amount + ' record ho gaya. ' + (f.customer && f.customer.name || '') + ' ka remaining baki ' + inrFull(out) + ' hai.'
            setMessage(msg); speak('Payment record ho gaya. Baki ' + out + ' rupaye.')
          } catch (e) { console.error('[GARUDA] payment error:', e); setErrMsg('Payment nahi hua: ' + (e && e.message ? e.message : e)) }
          return
        }
        if (turn.status === 'khata_query' || turn.status === 'last_payment_query' || turn.status === 'total_paid_query') {
          const name = turn.customerName || ''
          const cust = customers.find((c) => String(c.name).toLowerCase() === String(name).toLowerCase())
          if (!cust) { const msg = name ? (name + ' customer list mein nahi mila.') : 'Customer ka naam batao.'; setMessage(msg); speak(msg); return }
          if (turn.status === 'khata_query') {
            const rows = await getLedger(cust.id)
            if (!rows.length) { const msg = cust.name + ' ka khata khali hai.'; setMessage(msg); speak(msg); return }
            const lines = rows.map((r) => (r.type === 'bill' ? 'Bill ' + r.ref + ' ₹' + r.debit + ' — Balance ₹' + r.balance : r.ref + ' ₹' + r.credit + ' — Balance ₹' + r.balance))
            const msg = cust.name + ' ka khata:\n' + lines.join('\n')
            setMessage(msg); setStockResult({ operation: 'khata', lines }); speak(cust.name + ' ka khata ' + rows.length + ' entry hai.')
          } else if (turn.status === 'last_payment_query') {
            const lp = await getLastPayment(cust.id)
            const msg = lp ? (cust.name + ' ki last payment ' + lp.date + ' ko ' + inrFull(lp.amount) + ' (' + lp.mode + ') aayi thi.') : (cust.name + ' ki abhi tak koi payment nahi aayi.')
            setMessage(msg); speak(msg)
          } else {
            const tp = await getTotalPaid(cust.id)
            const msg = cust.name + ' ne total ' + inrFull(tp) + ' payment diya hai.'
            setMessage(msg); speak(msg)
          }
          return
        }
        if (turn.status === 'upi_qr') {
          const name = turn.customerName || ''
          const cust = customers.find((c) => String(c.name).toLowerCase() === String(name).toLowerCase())
          let amt = Number(turn.amount) || 0
          if (!amt && cust) amt = Math.max(0, await customerOutstanding(cust.id, company?.id || ''))
          const msg = cust ? (cust.name + ' ka outstanding ' + inrFull(amt) + ' hai. QR bana raha hoon.') : (name ? name + ' customer list mein nahi mila.' : 'Customer ka naam batao.')
          setMessage(msg); speak(cust ? 'QR bana raha hoon' : 'Customer ka naam batao')
          setUpiAmount(amt)
          setUpiOpen(true)
          return
        }
        setResult(null)
        setMessage(turn.message || parsed.message || 'Samajh nahi aaya.')
        return
      }

      // Non-bill commands: a stock mutation discards an unfinished bill draft (announced).
      if (parsed.intent === 'stock_entry' && conversation.current.hasActiveBill(convoIdRef.current)) {
        conversation.current.discard(convoIdRef.current)
        setDraftNote('')
        setMessage('Bill draft cancel ho gaya — ab stock update karta hoon.')
      }

      if (parsed.intent === 'query_outstanding') {
        const name = parsed.customerName
        const cust = customers.find((c) => c.name.toLowerCase() === String(name || '').toLowerCase())
        if (cust) {
          const invoices = await db.invoices.where('customerId').equals(cust.id).toArray()
          const payments = await db.payments.where('customerId').equals(cust.id).toArray()
          const billed = invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0)
          const paid = payments.reduce((s, p) => s + p.amount, 0)
          const bal = billed - paid
          const msg = cust.name + ' ka baki: ' + inrFull(bal)
          setMessage(msg)
          speak(msg)
        } else {
          const msg = name ? (name + ' customer list mein nahi mila.') : 'Customer ka naam batayein — "Ramesh ka kitna baki hai?"'
          setMessage(msg)
          speak(msg)
        }
      } else if (parsed.intent === 'query_report') {
        const invoices = await db.invoices.toArray()
        const total = invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0)
        const msg = 'Total bills: ' + invoices.length + ', total: ' + inrFull(total)
        setMessage(msg)
        speak(msg)
      } else if (parsed.intent === 'query_delivery') {
        const q = String(parsed.query || text).toLowerCase()
        const invoices = await db.invoices.toArray()
        const hits = invoices.filter((inv) => {
          const tr = inv.transport || {}
          return (tr.vehicleNo && q.includes(tr.vehicleNo.toLowerCase())) || (tr.driverName && q.includes(tr.driverName.toLowerCase())) || q.includes('delivery')
        })
        if (hits.length) {
          const msg = hits.length + ' delivery mili — ' + hits.slice(0, 3).map((h) => h.customerName + ' #' + h.invoiceNo).join(', ')
          setMessage(msg); speak(msg)
        } else {
          const msg = 'Koi matching delivery nahi mili.'
          setMessage(msg); speak(msg)
        }
      } else if (parsed.intent === 'stock_entry') {
        console.log('[VOICE] executor stock_entry start', parsed)
        const op = parsed.operation || 'add'
        // SAFETY: never mutate on ambiguous/conflicting input — clarify instead.
        const allItems = await db.items.toArray()
        const steelFamily = (name) => {
          const n = String(name || '').toLowerCase()
          return /sariya|tmt|steel|rod/.test(n)
        }
        const sizeOf = (name) => (String(name || '').match(/\d+mm/) || [])[0] || ''
        for (const it of (parsed.items || [])) {
          const target = await findStockItem(it.name)
          if (target) {
            // Unit mismatch: never silently use a different unit than the item's inventory unit.
            if (it.unit && target.unit && String(it.unit).toLowerCase() !== String(target.unit).toLowerCase()) {
              const msg = it.name + ' ' + target.unit + ' mein hai — aapne ' + it.unit + ' kaha. ' + it.qty + ' ' + target.unit + ' hi sahi lagega. Dobara bolo.'
              setMessage(msg); speak(msg)
              setStockResult({ operation: 'clarify', lines: [msg] })
              return
            }
            // Size ambiguity: sariya/tmt/steel without a size when multiple sizes exist.
            if (!sizeOf(it.name) && steelFamily(it.name)) {
              const sized = allItems.filter((x) => steelFamily(x.name) && sizeOf(x.name) && x.id !== target.id)
              const matching = sized.filter((x) => {
                const key = canonicalName(x.name).replace(/\d+mm/g, '').split('').sort().join('')
                const tkey = canonicalName(target.name).replace(/\d+mm/g, '').split('').sort().join('')
                return key === tkey
              })
              if (matching.length > 0) {
                const sizes = [...new Set([target.name, ...matching.map((x) => x.name)])].join(', ')
                const msg = 'Kaunsa size? ' + sizes + ' — size batao, jaise "8mm TMT 50 piece add karo".'
                setMessage(msg); speak(msg)
                setStockResult({ operation: 'clarify', lines: [msg] })
                return
              }
            }
          }
        }
        const outs = []
        for (const it of (parsed.items || [])) {
          try {
            console.log('[VOICE] DB write stock', it.name, it.qty, op)
            const res = await applyStockOp({
              name: it.name, qty: it.qty, unit: it.unit, operation: op,
              vehicleNo: parsed.vehicleNo || '',
              sourceType: op === 'add' && parsed.vehicleNo ? 'inward' : undefined,
              notes: parsed.notes || ''
            })
            // read-after-write proof
            const check = await db.items.get(res.item.id)
            if (!check || Number(check.qty) !== Number(res.nextQty)) throw new Error('Stock read-back failed for ' + it.name)
            console.log('[VOICE] DB write success', res.item.name, res.nextQty)
            outs.push(res)
          } catch (e) {
            console.log('[VOICE ERROR] stock write', e && e.message)
            setErrMsg('Stock error: ' + (e && e.message ? e.message : e))
            return
          }
        }
        setStockResult({ operation: op, items: outs, vehicleNo: parsed.vehicleNo })
        const msg = (op === 'set' ? 'Stock set ho gaya: ' : 'Stock updated successfully: ') + outs.map((r) => r.item.name + ' ' + r.nextQty + ' ' + r.item.unit).join(', ')
        const fullMsg = msg + (parsed.vehicleNo ? ' — Vehicle ' + parsed.vehicleNo : '')
        console.log('[VOICE] DB read-back success stock', fullMsg)
        setMessage(fullMsg)
        speak(msg)
      } else if (parsed.intent === 'stock_query') {
        // Category aggregate query — sum real persisted items in that category
        if (parsed.operation === 'query_category') {
          const cat = parsed.category
          const all = await db.items.toArray()
          const label = cat === 'cement' ? 'Cement' : cat === 'steel' ? 'Steel' : 'Other'
          const rawMembers = all.filter((it) => cat === 'other' ? !['cement', 'steel'].includes(it.category) : it.category === cat)
          // Merge canonical duplicates (e.g. "ACC Cement" + "Cement - ACC" are one product)
          const mergedMap = new Map()
          for (const it of rawMembers) {
            const key = canonicalName(it.name)
            if (!mergedMap.has(key)) {
              mergedMap.set(key, { ...it, aliases: 1 })
            } else {
              const cur = mergedMap.get(key)
              cur.aliases += 1
              if (it.name.length < cur.name.length) cur.name = it.name
            }
          }
          const members = [...mergedMap.values()]
          if (!members.length) {
            const msg = label + ' mein koi stock item nahi hai.'
            setMessage(msg); speak(msg)
            setStockResult({ operation: 'query_category', lines: [msg], category: cat, members: [] })
          } else {
            const byUnit = {}
            for (const it of members) {
              const u = it.unit || 'bag'
              byUnit[u] = (byUnit[u] || 0) + Number(it.qty || 0)
            }
            const parts = Object.entries(byUnit).map(([u, v]) => v + ' ' + u)
            const msg = label + ': ' + parts.join(' + ') + ' (' + members.length + ' item)'
            setMessage(msg); speak(label + ': ' + parts.join(' + '))
            setStockResult({ operation: 'query_category', lines: [msg], category: cat, members: members.map((m) => ({ name: m.name, qty: Number(m.qty || 0), unit: m.unit })) })
          }
          return
        }
        const names = (parsed.items && parsed.items.length) ? parsed.items.map((x) => x.name) : []
        // If a stated qty was captured ("ACC cement ka stock 120 bag hai") show current and offer Set
        if (parsed.stated) {
          const target = names[0] || ''
          const curItem = target ? await findStockItem(target) : null
          const cur = curItem ? Number(curItem.qty || 0) : 0
          const curName = (curItem && curItem.name) || target || 'Item'
          const msg = curName + ' ka stock abhi ' + cur + ' ' + (curItem?.unit || 'bag') + ' hai — aapne kaha ' + parsed.stated.qty + ' ' + parsed.stated.unit + '. Set karna hai?'
          setMessage(msg)
          setStockResult({ operation: 'query_stated', stated: parsed.stated, currentName: curName, currentQty: cur, currentUnit: curItem?.unit || 'bag' })
          speak(curName + ' ka stock ' + cur + ' hai')
          return
        }
        if (names.length) {
          const lines = []
          for (const n of names) {
            const it = await findStockItem(n)
            const qty = it ? Number(it.qty || 0) : 0
            const unit = (it && it.unit) || 'bag'
            const label = (it && it.name) || n
            lines.push(label + ': ' + qty + ' ' + unit)
          }
          const msg = lines.join(' — ')
          setMessage(msg); speak(msg)
          setStockResult({ operation: 'query', lines })
        } else {
          const all = await db.items.toArray()
          if (!all.length) { setMessage('Stock mein koi item nahi hai.'); speak('Stock khali hai') }
          else {
            const qtyLines = all.slice(0, 8).map((it) => it.name + ' ' + Number(it.qty || 0) + ' ' + it.unit)
            const msg = qtyLines.join(' — ')
            setMessage(msg); setStockResult({ operation: 'query_all', lines: [msg] })
          }
        }
      } else if (parsed.intent === 'stock_ledger_query') {
        const allItems = await db.items.toArray()
        const catOf = (itemName) => {
          const key = canonicalName(itemName)
          const hit = allItems.find((it) => canonicalName(it.name) === key)
          if (hit) return hit.category
          const n = String(itemName || '').toLowerCase()
          if (n.includes('cement')) return 'cement'
          if (n.includes('steel') || n.includes('sariya') || n.includes('tmt') || n.includes('rod')) return 'steel'
          return 'other'
        }
        const catLabel = (c) => c === 'cement' ? 'Cement' : c === 'steel' ? 'Steel' : 'Other'
        const txs = await db.stockTransactions.toArray()
        const scope = parsed.scope || 'inward'
        const today = new Date().toISOString().slice(0, 10)
        const inTxs = txs.filter((t) => t.movementType === 'stock_in' || t.movementType === 'opening')
        const groupByItem = (list) => {
          const byItem = {}
          for (const t of list) byItem[t.itemName] = (byItem[t.itemName] || 0) + Number(t.quantity || 0)
          return Object.entries(byItem).map(([n, q]) => n + ' ' + q + ' ' + (list.find((m) => m.itemName === n)?.unit || 'bag')).join(', ')
        }
        let msg = 'Koi inward entry nahi mili.'
        if (scope === 'vehicle') {
          const v = String(parsed.vehicleNo || '').toUpperCase()
          const matches = inTxs.filter((t) => String(t.vehicleNo || '').toUpperCase() === v)
          if (matches.length) msg = 'Vehicle ' + v + ': ' + groupByItem(matches)
        } else if (scope === 'today') {
          const matches = inTxs.filter((t) => t.date === today && (!parsed.category || catOf(t.itemName) === parsed.category))
          if (matches.length) msg = 'Aaj ka inward: ' + groupByItem(matches)
        } else if (scope === 'last_incoming') {
          const name = parsed.itemName || ''
          const target = name ? await findStockItem(name) : null
          const targetName = target ? target.name : name
          const matches = inTxs.filter((t) => !targetName || String(t.itemName).toLowerCase() === String(targetName).toLowerCase())
          const last = matches.slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0]
          if (last) msg = 'Last incoming: ' + last.itemName + ' ' + last.quantity + ' ' + (last.unit || 'bag') + (last.vehicleNo ? ' — gaadi ' + last.vehicleNo : '') + ' (' + last.date + ')'
        } else if (scope === 'last_vehicle') {
          const matches = inTxs.filter((t) => t.vehicleNo && (!parsed.category || catOf(t.itemName) === parsed.category))
          const last = matches.slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0]
          if (last) msg = 'Last ' + (parsed.category ? catLabel(parsed.category) + ' ' : '') + 'gaadi: ' + last.vehicleNo + ' — ' + last.itemName + ' ' + last.quantity + ' ' + (last.unit || 'bag') + ' (' + last.date + ')'
        } else {
          const matches = inTxs.filter((t) => !parsed.category || catOf(t.itemName) === parsed.category)
          if (matches.length) msg = 'Total inward: ' + groupByItem(matches)
        }
        setMessage(msg); speak(msg)
        setStockResult({ operation: 'ledger', lines: [msg], scope })
      } else if (parsed.intent === 'clarify') {
        setMessage(parsed.message || 'Thoda aur clearly batao.')
        speak(parsed.message || 'Thoda aur clearly batao.')
      }
    } catch (e) {
      setBusy(false)
      console.log('[VOICE_ERROR] ' + stage + ' ' + (e && e.message ? e.message : e))
      setErrMsg('Error: ' + (e && e.message ? e.message : e))
    } finally {
      console.log('[VOICE_HANDLE_FINALLY]')
    }
  }

  const confirmCreate = async () => {
    try {
      if (executingRef.current) return
      if (!conversation.current.canExecute(convoIdRef.current)) {
        setMessage('Pehle bill ki details batao.')
        return
      }
      executingRef.current = true
      const draft = conversation.current.draftForExecution(convoIdRef.current)
      const { invoice, totals } = await executeCreateBill(draft, company)
      conversation.current.markExecuted(convoIdRef.current, invoice)
      setConfirmedBill(invoice.invoiceNo)
      setConfirmedInvoiceId(invoice.id)
      speak((invoice.billType === 'kaccha' ? 'Kaccha bill ban gaya' : 'Bill ban gaya') + '. Invoice number ' + invoice.invoiceNo)
      setMessage('Bill created successfully — #' + invoice.invoiceNo + ' — ' + invoice.customerName + ' — ' + totals.grandTotal.toLocaleString('en-IN') + ' rupaye')
    } catch (e) {
      console.error('[GARUDA] voice create error:', e)
      setErrMsg('Bill nahi bana: ' + (e && e.message ? e.message : e))
    } finally {
      executingRef.current = false
    }
  }

  const doStockSet = async (name, qty, unit) => {
    try {
      const res = await applyStockOp({ name, qty, unit, operation: 'set' })
      setMessage('Stock set ho gaya: ' + res.item.name + ' ' + res.nextQty + ' ' + res.item.unit)
      setStockResult({ operation: 'set_done', item: res.item, nextQty: res.nextQty })
      speak('Stock set ho gaya')
    } catch (e) { setErrMsg(e.message) }
  }

  const confirmPayment = async () => {
    try {
      const f = conversation.current.get(convoIdRef.current) && conversation.current.get(convoIdRef.current).finance
      if (!f || f.executed || !f.customerId || !f.amount) { setMessage('Payment details nahi hain.'); return }
      const pay = await recordPayment({ customerId: f.customerId, invoiceId: f.invoiceId || '', amount: f.amount, date: '', mode: f.method || 'Cash', note: f.note || '', companyId: company?.id || '' })
      conversation.current.markFinanceExecuted(convoIdRef.current)
      setFinanceDraft(null)
      const out = await customerOutstanding(f.customerId, company?.id || '')
      const msg = 'Payment ₹' + pay.amount + ' record ho gaya. ' + (f.customer && f.customer.name || '') + ' ka remaining baki ' + inrFull(out) + ' hai.'
      setMessage(msg); speak('Payment record ho gaya. Baki ' + out + ' rupaye.')
    } catch (e) { console.error('[GARUDA] payment error:', e); setErrMsg('Payment nahi hua: ' + (e && e.message ? e.message : e)) }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><Icon name="mic" size={18} /> Garuda Voice</div>
          <button className="del" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="vm-tagline">Speak naturally in Hindi or Hinglish</div>
        <button className={`mic ${listening ? 'mic-on' : ''}`} onClick={listening ? stop : start}>
          <span className="mic-icon"><Icon name={listening ? 'x' : 'mic'} size={20} /></span>
          <span>{clickDiag ? 'CLICK RECEIVED' : listening ? 'Sun raha hoon… pura bolo' : 'Bolo (Hindi / Hinglish)'}</span>
        </button>
        <div className="vm-examples">"Ramesh ke naam 50 bag cement ₹390 ke rate se bill banao."</div>
        <div className="vm-examples">"ACC Cement ka stock batao" · "50 bag ACC Cement add karo"</div>

        {transcript && <div className="voice-transcript">{transcript}</div>}
        {busy && <div className="status">Samajh raha hoon…</div>}
        {listening && !busy && <div className="status">Listening…</div>}
        {errMsg && <div className="err">{errMsg}</div>}
        {draftNote && !result && <div className="card"><div className="vm-sec">Draft so far</div><div className="answer" style={{ whiteSpace: 'pre-wrap' }}>{draftNote}</div></div>}
        {message && !['stock_entry', 'stock_query', 'query_outstanding', 'query_report', 'query_delivery', 'clarify'].includes(result?.intent) && (
          <div className="card"><div className="answer" style={{ whiteSpace: 'pre-wrap' }}>{message}</div></div>
        )}

        {result && result.intent === 'create_bill' && (
          <div className="card">
            <div className="vm-sec">Understood</div>
            <div className="vm-block">
              <div className="vc-cust" style={{ marginBottom: 6 }}>Customer: <b>{result.customer.name || '—'}</b> {result.missing && result.missing.length > 0 && <span style={{ color: 'var(--danger)', fontSize: 12 }}> — {result.missing.join(', ')} chahiye</span>}</div>
              {result.items.map((it, i) => (
                <div className="vc-item" key={i}>
                  <span>{it.name}</span>
                  <span>{it.qty} {it.unit} × {inrFull(it.rate)}</span>
                </div>
              ))}
              {result.transport?.freight > 0 && <div className="vc-item"><span>Freight</span><span>{inrFull(result.transport.freight)}</span></div>}
              {result.transport?.vehicleNo && <div className="vc-item"><span>Vehicle</span><span>{result.transport.vehicleNo}</span></div>}
            </div>
            <div className="vm-sec vm-accent">Action</div>
            <div className="vm-block">
              {result.missing && result.missing.length > 0 ? (
                <div className="vc-total draft-total" style={{ borderTop: 0, paddingTop: 0 }}>Draft / Needs information</div>
              ) : (
                <div className="vc-total" style={{ borderTop: 0, paddingTop: 0 }}>Total: {inrFull(calcBill(result.items, { gstRate: company?.gstRate ?? 18, billType: result.billType || (company ? (result.customerGstin ? 'gst' : 'kaccha') : 'gst'), transport: result.transport || {} }).grandTotal)}</div>
              )}
              {!confirmedBill && result.missing && result.missing.length === 0 && (
                <div className="actions" style={{ marginTop: 8 }}>
                  <button className="primary" onClick={confirmCreate}><Icon name="check" size={14} /> Confirm & Create Bill</button>
                  <button className="ghost" onClick={() => { conversation.current.discard(convoIdRef.current); setDraftNote(''); setResult(null) }}>Cancel</button>
                </div>
              )}
              {confirmedBill && <div className="vm-sec vm-accent">Result</div>}
              {confirmedBill && <div className="status">Bill #{confirmedBill} ban gaya.</div>}
              {confirmedBill && (
                <div className="actions" style={{ marginTop: 8 }}>
                  <button className="primary" onClick={() => { onClose(); navigate(confirmedInvoiceId ? '#/invoice?id=' + confirmedInvoiceId : '#/invoices') }}><Icon name="share" size={14} /> View & Share Bill</button>
                  <button className="ghost" onClick={() => { onClose(); navigate('#/invoices') }}>Bills list</button>
                </div>
              )}
            </div>
          </div>
        )}

        {result && (result.intent === 'stock_entry' || result.intent === 'stock_query') && message && (
          <div className="card">
            <div className="vm-sec vm-accent">Result</div>
            <div className="answer" style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
            {stockResult && stockResult.operation === 'query_stated' && (
              <div className="actions">
                <button className="primary" onClick={() => doStockSet(stockResult.currentName, stockResult.stated.qty, stockResult.stated.unit)}>Set to {stockResult.stated.qty} {stockResult.stated.unit}</button>
                <button className="ghost" onClick={() => setStockResult(null)}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {result && ['query_outstanding', 'query_report', 'query_delivery'].includes(result.intent) && message && (
          <div className="card">
            <div className="vm-sec vm-accent">Result</div>
            <div className="answer" style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
          </div>
        )}

        {result && result.intent === 'clarify' && message && (
          <div className="card">
            <div className="vm-sec" style={{ color: 'var(--danger)' }}>Needs more information</div>
            <div className="answer">{message}</div>
          </div>
        )}

        {financeDraft && (
          <div className="card">
            <div className="vm-sec vm-accent">Payment</div>
            <div className="answer" style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="primary" onClick={confirmPayment}><Icon name="check" size={14} /> Confirm & Record Payment</button>
              <button className="ghost" onClick={() => { conversation.current.get(convoIdRef.current) && (conversation.current.get(convoIdRef.current).finance = null); setFinanceDraft(null) }}>Cancel</button>
            </div>
          </div>
        )}

        {!result && message && !busy && !listening && !financeDraft && <div className="card"><div className="answer" style={{ whiteSpace: 'pre-wrap' }}>{message}</div></div>}

        {upiOpen && <UpiQrModal open={upiOpen} onClose={() => setUpiOpen(false)} company={company} amount={upiAmount} ref={confirmedInvoiceId ? 'Inv-' + confirmedInvoiceId : ''} />}
      </div>
    </div>
  )
}
