import React, { useEffect, useState } from 'react'
import { db, enqueue, getCustomers, getPayments } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'
import useCompanyScope from '../lib/useCompanyScope'
import CompanyScopeBar from '../components/CompanyScopeBar'
import { Icon } from '../components/Icon'

const MODES = [
  { m: 'Cash', icon: 'wallet' },
  { m: 'UPI', icon: 'rupee' },
  { m: 'Cheque', icon: 'file' },
  { m: 'Bank Transfer', icon: 'bill' },
  { m: 'Other', icon: 'grid' }
]

export default function PaymentsScreen() {
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [balances, setBalances] = useState({})
  const [custId, setCustId] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cash')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const { scope, setScope, companies, activeId, matches } = useCompanyScope()

  useEffect(() => {
    ;(async () => {
      await refresh()
      const p = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const cid = p.get('customer')
      const amt = p.get('amount')
      if (cid) setCustId(cid)
      if (amt) setAmount(amt)
    })()
  }, [])

  const refresh = async () => {
    if (!activeId && scope !== 'all') return
    const custs = await getCustomers(activeId)
    const pays = await getPayments(activeId)
    const invoices = await getInvoices(activeId)
    const bal = {}
    for (const c of custs) {
      const inScope = invoices.filter((i) => i.customerId === c.id)
      const billed = inScope.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0)
      const paid = pays.filter((p) => p.customerId === c.id).reduce((s, p) => s + (p.amount || 0), 0)
      bal[c.id] = billed - paid
    }
    setCustomers(custs)
    setPayments(pays)
    setBalances(bal)
  }

  useEffect(() => {
    setCustomers([]); setPayments([]); setBalances({}) // INSTANT CLEAR ON COMPANY SWITCH
    refresh()
  }, [activeId, scope])

  const save = async () => {
    const amt = Number(amount)
    if (!custId || !amt || amt <= 0) return setMsg('Customer aur amount daalo')
    const p = {
      id: 'pay' + Date.now(),
      customerId: custId,
      invoiceId: '',
      companyId: activeId || '',
      amount: Math.round(amt * 100) / 100,
      date: new Date().toISOString().slice(0, 10),
      mode,
      note,
      createdAt: new Date().toISOString()
    }
    await db.payments.put(p)
    await enqueue('payment', 'create', p)
    setAmount(''); setNote(''); setMsg('Payment save ho gaya')
    await refresh()
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Payments</div>
      </header>
      <CompanyScopeBar scope={scope} setScope={setScope} activeName={companies.find((c) => c.id === activeId)?.name} companies={companies} />

      <section className="card">
        <div className="card-title">Rupaye lena (payment)</div>
        <label className="form-label">Customer</label>
        <select className="input" value={custId} onChange={(e) => setCustId(e.target.value)}>
          <option value="">Customer chuno</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({balances[c.id] > 0 ? 'baki ' + inrFull(balances[c.id]) : 'clear'})</option>
          ))}
        </select>
        <label className="form-label">Amount</label>
        <input className="input" inputMode="decimal" placeholder="₹ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label className="form-label">Payment mode</label>
        <div className="seg">
          {MODES.map((m) => (
            <button key={m.m} className={`seg-btn ${mode === m.m ? 'seg-btn-active' : ''}`} onClick={() => setMode(m.m)}>
              <Icon name={m.icon} size={16} /> {m.m}
            </button>
          ))}
        </div>
        <label className="form-label">Note</label>
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
                <b className="num">{inrFull(p.amount)}</b>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}