import React, { useEffect, useState } from 'react'
import { getOrders, getOrderTrips } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'
import { Icon } from '../components/Icon'

export default function OrdersScreen() {
  const [orders, setOrders] = useState([])
  const [detail, setDetail] = useState(null)
  const [trips, setTrips] = useState([])

  useEffect(() => { getOrders().then(setOrders) }, [])

  const openDetail = async (o) => {
    setDetail(o)
    setTrips(await getOrderTrips(o.id))
  }

  if (detail) {
    return (
      <div className="screen">
        <header className="topbar backbar">
          <button className="back" onClick={() => { setDetail(null); setTrips([]) }}>‹</button>
          <div className="top-title">Order #{detail.invoiceNo}</div>
        </header>
        <section className="card">
          <div className="card-title">Commercial Order</div>
          <div className="vc-item"><span>Customer</span><span>{detail.customerName}</span></div>
          <div className="vc-item"><span>Value</span><span>{inrFull(detail.value)}</span></div>
          <div className="vc-item"><span>Product</span><span>{detail.product} @ {inrFull(detail.rate)}/{detail.unit}</span></div>
          <div className="vc-item"><span>Date Range</span><span>{detail.startDate} → {detail.endDate}</span></div>
          <div className="vc-item"><span>Schedule</span><span>{detail.vehicles} gaadi × {detail.tripsPerDay} trip/day</span></div>
          <div className="vc-item"><span>Status</span><span className={`badge badge-${detail.status === 'created' ? 'ok' : 'warn'}`}>{detail.status}</span></div>
          <div className="vc-item"><span>Invoice</span><span>#{detail.invoiceNo}</span></div>
        </section>
        <section className="card">
          <div className="card-title">Planned Trips ({trips.length})</div>
          {trips.slice().sort((a, b) => a.date.localeCompare(b.date)).map((t, i) => (
            <div className="vc-item" key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <span className="ip-muted">{t.date} · {t.vehicleNo || '—'}</span>
              <span>{t.itemName} {t.qty} {t.unit} · {t.status}</span>
            </div>
          ))}
        </section>
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Orders</div>
      </header>
      {orders.length === 0 && (
        <div className="empty">
          <div className="empty-sigil"><Icon name="list" size={44} /></div>
          <div className="empty-title">Abhi koi order nahi</div>
          <div className="empty-sub">Voice se bolo: "Vijay Singh ka ₹10 lakh ka bill bana do, 2 se 5 July, 3 gaadi, 4 trip per day"</div>
        </div>
      )}
      {orders.map((o) => (
        <div className="card sm-row" key={o.id} onClick={() => openDetail(o)} style={{ cursor: 'pointer' }}>
          <div className="sm-main">
            <span className="sm-name">#{o.invoiceNo} — {o.customerName}</span>
            <span className="sm-meta">
              <span className="ip-muted">{o.product} @ {inrFull(o.rate)}/{o.unit}</span>
              <span className="sm-rate">{inrFull(o.value)}</span>
            </span>
            <span className="ip-muted">{o.startDate} → {o.endDate} · {o.vehicles} gaadi × {o.tripsPerDay} trip/day</span>
          </div>
          <Icon name="chevronRight" size={16} />
        </div>
      ))}
    </div>
  )
}