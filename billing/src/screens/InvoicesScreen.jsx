import React, { useEffect, useState } from 'react'
import { db, getSetting } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'
import useCompanyScope from '../lib/useCompanyScope'
import CompanyScopeBar from '../components/CompanyScopeBar'
import { Icon } from '../components/Icon'

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState([])
  const [q, setQ] = useState('')
  const [kacchaMode, setKacchaMode] = useState(true)
  const [showCancelled, setShowCancelled] = useState(false)
  const { scope, setScope, companies, activeId, matches } = useCompanyScope()

  useEffect(() => {
    ;(async () => {
      const list = await db.invoices.orderBy('createdAt').reverse().toArray()
      setInvoices(list)
      const stored = await getSetting('kacchaMode', null)
      setKacchaMode(stored === null ? true : Boolean(stored))
    })()
  }, [])

  const shown = invoices
    .filter(matches)
    .filter((i) => kacchaMode || i.billType !== 'kaccha')
    .filter((i) => showCancelled || i.status !== 'cancelled')
    .filter((i) => {
      const s = q.trim().toLowerCase()
      if (!s) return true
      return String(i.invoiceNo).toLowerCase().includes(s) || (i.customerName || '').toLowerCase().includes(s)
    })

  const payStatus = (i) => {
    if (i.status === 'cancelled') return { label: 'CANCELLED', cls: 'cancelled' }
    const paid = Number(i.paidAmount || 0)
    const total = Number(i.totals?.grandTotal || 0)
    if (total > 0 && paid >= total) return { label: 'PAID', cls: 'paid' }
    if (paid > 0) return { label: 'PARTIAL', cls: 'partial' }
    return { label: 'PENDING', cls: 'pending' }
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Bills</div>
      </header>
      <CompanyScopeBar scope={scope} setScope={setScope} activeName={companies.find((c) => c.id === activeId)?.name} companies={companies} />
      <div className="scope-bar">
        <button className={`chip ${kacchaMode ? 'chip-active' : 'chip-other'}`} onClick={() => setKacchaMode((k) => !k)}>Kaccha {kacchaMode ? 'ON' : 'OFF'}</button>
        <button className={`chip ${showCancelled ? 'chip-active' : 'chip-other'}`} onClick={() => setShowCancelled((s) => !s)}>Cancelled</button>
      </div>
      <input className="input search-input" placeholder="Bill no / customer se dhundo" value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.length === 0 && (
        <div className="empty">
          <div className="empty-sigil"><Icon name="list" size={44} /></div>
          <div className="empty-title">No bills found</div>
          <div className="empty-sub">{!kacchaMode && invoices.some((i) => matches(i) && i.billType === 'kaccha') ? 'Kaccha bills hidden — turn "Kaccha ON" above.' : 'Create your first bill to see it here.'}</div>
        </div>
      )}
      {shown.map((i) => {
        const st = payStatus(i)
        return (
          <button className="card invoice-row" key={i.id} onClick={() => navigate('#/invoice?id=' + i.id)}>
            <div>
              <div className="cust-name">
                #{i.invoiceNo} — {i.customerName}
                {i.billType === 'kaccha' && <span className="billtype-badge bt-kaccha" style={{ marginLeft: 6 }}>KACCHA</span>}
              </div>
              <div className="ip-muted" style={{ marginTop: 4 }}>{i.date}{scope === 'all' && i.companyName ? ' · ' + i.companyName : ''}</div>
              <span className={`status-badge ${st.cls}`} style={{ marginTop: 6 }}>{st.label}</span>
            </div>
            <div className={`cust-bal ${i.status === 'cancelled' ? 'muted' : ''}`}>{inrFull(i.totals.grandTotal)}</div>
          </button>
        )
      })}
    </div>
  )
}