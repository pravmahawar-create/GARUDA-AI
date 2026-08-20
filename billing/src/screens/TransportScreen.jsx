import React, { useEffect, useState } from 'react'
import { db } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'

export default function TransportScreen() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    ;(async () => {
      const invoices = await db.invoices.orderBy('createdAt').reverse().toArray()
      const list = invoices.filter((i) => i.transport && (i.transport.vehicleNo || i.transport.driverName || i.transport.site))
      setRows(list)
    })()
  }, [])

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Transport / Deliveries</div>
      </header>
      {rows.length === 0 && <div className="empty">Abhi koi delivery nahi — bill mein transport bharne par yahan dikhegi.</div>}
      {rows.map((i) => {
        const t = i.transport
        return (
          <button className="card invoice-row" key={i.id} onClick={() => navigate('#/invoice?id=' + i.id)}>
            <div>
              <div className="cust-name">{t.vehicleNo || 'Vehicle —'} · {t.driverName || 'driver —'}</div>
              <div className="ip-muted">{i.customerName} · {i.date}{t.site ? ' · ' + t.site : ''}{t.lrNo ? ' · LR ' + t.lrNo : ''}</div>
              {t.freight > 0 && <div className="ip-muted">Freight {inrFull(t.freight)}</div>}
            </div>
            <div className="cust-bal">{inrFull(i.totals.grandTotal)}</div>
          </button>
        )
      })}
    </div>
  )
}