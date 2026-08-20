import React, { useEffect, useState } from 'react'
import { db } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'

export default function ReportsScreen() {
  const [r, setR] = useState(null)

  useEffect(() => {
    ;(async () => {
      const invoices = await db.invoices.toArray()
      const payments = await db.payments.toArray()
      const customers = await db.customers.toArray()

      const totalRevenue = invoices.reduce((s, i) => s + i.totals.grandTotal, 0)
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
      const totalOutstanding = Math.max(0, totalRevenue - totalPaid)

      const today = new Date().toISOString().slice(0, 10)
      const todaySales = invoices.filter((i) => i.date === today).reduce((s, i) => s + i.totals.grandTotal, 0)

      const itemTotals = {}
      for (const i of invoices) {
        for (const l of i.items || []) {
          const key = l.name
          itemTotals[key] = itemTotals[key] || { qty: 0, amount: 0 }
          itemTotals[key].qty += Number(l.qty) || 0
          itemTotals[key].amount += Number(l.amount) || 0
        }
      }
      const topItems = Object.entries(itemTotals).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5)

      const bal = {}
      for (const c of customers) {
        const billed = invoices.filter((i) => i.customerId === c.id).reduce((s, i) => s + i.totals.grandTotal, 0)
        const paid = payments.filter((p) => p.customerId === c.id).reduce((s, p) => s + p.amount, 0)
        bal[c.id] = billed - paid
      }
      const topDue = customers.map((c) => ({ name: c.name, bal: bal[c.id] || 0 })).filter((c) => c.bal > 0).sort((a, b) => b.bal - a.bal).slice(0, 5)

      setR({ invoices, totalRevenue, totalPaid, totalOutstanding, todaySales, topItems, topDue })
    })()
  }, [])

  if (!r) return <div className="screen"><div className="center">Loading…</div></div>

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Reports</div>
      </header>

      <div className="stat-grid">
        <div className="stat"><div className="stat-v">{inrFull(r.todaySales)}</div><div className="stat-l">Aaj ki bikri</div></div>
        <div className="stat"><div className="stat-v">{r.invoices.length}</div><div className="stat-l">Total bills</div></div>
        <div className="stat"><div className="stat-v">{inrFull(r.totalRevenue)}</div><div className="stat-l">Total revenue</div></div>
        <div className="stat"><div className="stat-v due">{inrFull(r.totalOutstanding)}</div><div className="stat-l">Total baki</div></div>
      </div>

      {r.topItems.length > 0 && (
        <section className="card">
          <div className="card-title">Top items (amount)</div>
          {r.topItems.map(([name, v]) => (
            <div className="vc-item" key={name}><span>{name} <span className="ip-muted">({v.qty} qty)</span></span><b>{inrFull(v.amount)}</b></div>
          ))}
        </section>
      )}

      {r.topDue.length > 0 && (
        <section className="card">
          <div className="card-title">Sabse zyada baki</div>
          {r.topDue.map((c) => (
            <div className="vc-item" key={c.name}><span>{c.name}</span><b className="due">{inrFull(c.bal)}</b></div>
          ))}
        </section>
      )}
    </div>
  )
}