import React, { useEffect, useState } from 'react'
import { db, getActiveCompany, getSetting } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'
import useCompanyScope from '../lib/useCompanyScope'
import CompanyScopeBar from '../components/CompanyScopeBar'
import { buildGstr1Csv, buildGstSummaryCsv, downloadCsv } from '../lib/csv'
import { Icon } from '../components/Icon'

const monthKey = (d) => String(d || '').slice(0, 7)

export default function ReportsScreen() {
  const [r, setR] = useState(null)
  const { scope, setScope, companies, activeId } = useCompanyScope()

  useEffect(() => {
    ;(async () => {
      const invoices = await db.invoices.toArray()
      const payments = await db.payments.toArray()
      const customers = await db.customers.toArray()
      const company = await getActiveCompany()
      const kacchaMode = Boolean(await getSetting('kacchaMode', false))

      const inScope = scope === 'all'
        ? invoices
        : invoices.filter((i) => !i.companyId || i.companyId === activeId)
      const visible = inScope.filter((i) => i.status !== 'cancelled' && (kacchaMode || i.billType !== 'kaccha'))

      const inScopeCustomers = new Set(visible.map((i) => i.customerId))
      const totalRevenue = visible.reduce((s, i) => s + i.totals.grandTotal, 0)
      const totalPaid = payments.filter((p) => inScopeCustomers.has(p.customerId)).reduce((s, p) => s + p.amount, 0)
      const totalOutstanding = Math.max(0, totalRevenue - totalPaid)

      const today = new Date().toISOString().slice(0, 10)
      const todaySales = visible.filter((i) => i.date === today).reduce((s, i) => s + i.totals.grandTotal, 0)

      const thisMonth = today.slice(0, 7)
      const monthSales = visible.filter((i) => monthKey(i.date) === thisMonth).reduce((s, i) => s + i.totals.grandTotal, 0)
      const monthCount = visible.filter((i) => monthKey(i.date) === thisMonth).length

      const itemTotals = {}
      for (const i of visible) {
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
        const billed = visible.filter((i) => i.customerId === c.id).reduce((s, i) => s + i.totals.grandTotal, 0)
        const paid = payments.filter((p) => p.customerId === c.id).reduce((s, p) => s + p.amount, 0)
        bal[c.id] = billed - paid
      }
      const topDue = customers.map((c) => ({ name: c.name, bal: bal[c.id] || 0 })).filter((c) => c.bal > 0).sort((a, b) => b.bal - a.bal).slice(0, 5)

      const gstBills = visible.filter((i) => i.billType !== 'kaccha' && (i.totals?.cgst || i.totals?.sgst || i.totals?.igst))
      const byMonth = {}
      for (const i of gstBills) {
        const m = monthKey(i.date)
        byMonth[m] = byMonth[m] || { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
        const t = i.totals
        byMonth[m].count++
        byMonth[m].taxable += t.taxable || 0
        byMonth[m].cgst += t.cgst || 0
        byMonth[m].sgst += t.sgst || 0
        byMonth[m].igst += t.igst || 0
        byMonth[m].total += (t.cgst || 0) + (t.sgst || 0) + (t.igst || 0)
      }
      const gstMonths = Object.keys(byMonth).sort().reverse().slice(0, 6).map((m) => {
        const cur = byMonth[m]
        const prevKey = Object.keys(byMonth).filter((x) => x < m).sort().pop()
        const prev = prevKey ? byMonth[prevKey] : null
        const change = prev && prev.total > 0 ? ((cur.total - prev.total) / prev.total) * 100 : null
        return { month: m, ...cur, change }
      })

      const payMode = {}
      for (const p of payments) payMode[p.mode || 'Other'] = (payMode[p.mode || 'Other'] || 0) + p.amount

      setR({ count: visible.length, totalRevenue, totalPaid, totalOutstanding, todaySales, monthSales, monthCount, topItems, topDue, gstMonths, payMode, company })
    })()
  }, [scope, activeId])

  if (!r) return <div className="screen"><div className="center">Loading…</div></div>

  const exportGstr1 = async () => {
    const invoices = await db.invoices.toArray()
    const csv = buildGstr1Csv(invoices.filter((i) => i.status !== 'cancelled'), r.company)
    downloadCsv('GSTR-1-' + new Date().toISOString().slice(0, 7) + '.csv', csv)
  }

  const exportGst = () => {
    downloadCsv('GST-summary.csv', buildGstSummaryCsv(r.gstMonths))
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Reports</div>
      </header>
      <CompanyScopeBar scope={scope} setScope={setScope} activeName={companies.find((c) => c.id === activeId)?.name} companies={companies} />

      <div className="stat-grid">
        <div className="stat"><div className="stat-v">{inrFull(r.todaySales)}</div><div className="stat-l">Aaj ki bikri</div></div>
        <div className="stat"><div className="stat-v">{inrFull(r.monthSales)}</div><div className="stat-l">Is mahine ({r.monthCount} bills)</div></div>
        <div className="stat"><div className="stat-v">{r.count}</div><div className="stat-l">Total bills</div></div>
        <div className="stat"><div className="stat-v">{inrFull(r.totalRevenue)}</div><div className="stat-l">Total revenue</div></div>
        <div className="stat"><div className="stat-v due">{inrFull(r.totalOutstanding)}</div><div className="stat-l">Total baki</div></div>
      </div>

      <section className="card">
        <div className="card-title">GST monthly (CGST/SGST/IGST) — growth/downfall</div>
        <div className="row-actions">
          <button className="btn btn-sm" onClick={exportGst}><Icon name="download" size={14} /> CSV</button>
        </div>
        {r.gstMonths.length === 0 && <div className="ip-muted">Abhi GST bills nahi.</div>}
        {r.gstMonths.map((m) => (
          <div className="gst-month" key={m.month}>
            <div className="gst-month-head">
              <b>{m.month}</b>
              <span className={`gst-change ${m.change >= 0 ? 'up' : 'down'}`}>{m.change === null ? '' : (m.change >= 0 ? '↑ ' : '↓ ') + Math.abs(m.change).toFixed(1) + '%'}</span>
            </div>
            <div className="gst-cols">
              <span>CGST {inrFull(m.cgst)}</span>
              <span>SGST {inrFull(m.sgst)}</span>
              <span>IGST {inrFull(m.igst)}</span>
            </div>
            <div className="ip-muted">{m.count} bills · taxable {inrFull(m.taxable)} · total GST {inrFull(m.total)}</div>
          </div>
        ))}
      </section>

      {Object.keys(r.payMode).length > 0 && (
        <section className="card">
          <div className="card-title">Payment mode analytics</div>
          {Object.entries(r.payMode).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
            <div className="vc-item" key={m}><span>{m}</span><b>{inrFull(v)}</b></div>
          ))}
        </section>
      )}

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

      <button className="btn btn-block" onClick={exportGstr1}><Icon name="download" size={14} /> GSTR-1 CSV (sirf GST bills)</button>
    </div>
  )
}