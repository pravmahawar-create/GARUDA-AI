import React, { useEffect, useState } from 'react'
import { db } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    ;(async () => {
      const list = await db.invoices.orderBy('createdAt').reverse().toArray()
      setInvoices(list)
    })()
  }, [])

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Invoices</div>
      </header>
      {invoices.length === 0 && <div className="empty">Abhi koi bill nahi bana.</div>}
      {invoices.map((i) => (
        <button className="card invoice-row" key={i.id} onClick={() => navigate('#/invoice?id=' + i.id)}>
          <div>
            <div className="cust-name">#{i.invoiceNo} — {i.customerName}</div>
            <div className="ip-muted">{i.date}</div>
          </div>
          <div className="cust-bal">{inrFull(i.totals.grandTotal)}</div>
        </button>
      ))}
    </div>
  )
}