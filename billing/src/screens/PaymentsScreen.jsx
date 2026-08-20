import React, { useEffect, useState } from 'react'
import { db, enqueue } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'

export default function PaymentsScreen() {
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [balances, setBalances] = useState({})
  const [custId, setCustId] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cash')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      await refresh()
    })()
  }, [])

  const refresh = async () => {
    const custs = await db.customers.toArray()
    const pays = await db.payments.orderBy('date').reverse().toArray()
    const invoices = await db.invoices.toArray()
    const bal = {}
    for (const c of custs) {
      const billed = invoices.filter((i) => i.customerId === c.id).reduce((s, i) => s + i.totals.grandTotal, 0)
      const paid = pays.filter((p) => p.customerId === c.id).reduce((s, p) => s + p.amount, 0)
      bal[c.id] = billed - paid
    }
    setCustomers(custs)
    setPayments(pays)
    setBalances(bal)
  }

  const save = async () => {
    const amt = Number(amount)
    if (!custId || !amt || amt <= 0) return setMsg('Customer aur amount daalo')
    const p = {
      id: 'pay' + Date.now(),
      customerId: custId,
      invoiceId: '',
      amount: Math.round(amt * 100) / 100,
      date: new Date().toISOString().slice(0, 10),
      mode,
      note,
      createdAt: new Date().toISOString()
    }
    await db.payments.put(p)
    await enqueue('payment', 'create', p)
    setAmount(''); setNote(''); setMsg('✅ Payment save ho gaya')
    await refresh()
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Payments</div>
      </header>

      <section className="card">
        <div className="card-title">Rupaye lena (payment)</div>
        <select className="input" value={custId} onChange={(e) => setCustId(e.target.value)}>
          <option value="">Customer chuno</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({balances[c.id] > 0 ? 'baki ' + inrFull(balances[c.id]) : 'clear'})</option>
          ))}
        </select>
        <input className="input" inputMode="decimal" placeholder="Amount ₹" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
          {['Cash', 'UPI', 'Cheque', 'Bank Transfer', 'Other'].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="primary" onClick={save}>Save Payment</button>
        {msg && <div className="status">{msg}</div>}
      </section>

      {payments.length > 0 && (
        <section className="card">
          <div className="card-title">Payment history</div>
          {payments.slice(0, 20).map((p) => {
            const c = customers.find((x) => x.id === p.customerId)
            return (
              <div className="vc-item" key={p.id}>
                <span>{c ? c.name : '—'} · {p.date} · {p.mode}</span>
                <b>{inrFull(p.amount)}</b>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}