import React, { useEffect, useState } from 'react'
import { db, getSetting } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'
import useCompanyScope from '../lib/useCompanyScope'
import CompanyScopeBar from '../components/CompanyScopeBar'
import { Icon } from '../components/Icon'

export default function TransportScreen() {
  const [rows, setRows] = useState([])
  const [kacchaMode, setKacchaMode] = useState(false)
  const { scope, setScope, companies, activeId, matches } = useCompanyScope()

  useEffect(() => {
    ;(async () => {
      const invoices = await db.invoices.orderBy('createdAt').reverse().toArray()
      const list = invoices.filter((i) => i.transport && (i.transport.vehicleNo || i.transport.driverName || i.transport.site))
      setRows(list)
      setKacchaMode(Boolean(await getSetting('kacchaMode', false)))
    })()
  }, [])

  const shown = rows.filter(matches).filter((i) => kacchaMode || i.billType !== 'kaccha')

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Transport / Deliveries</div>
      </header>
      <CompanyScopeBar scope={scope} setScope={setScope} activeName={companies.find((c) => c.id === activeId)?.name} companies={companies} />
      {shown.length === 0 && (
        <div className="empty">
          <div className="empty-sigil"><Icon name="truck" size={44} /></div>
          <div className="empty-title">Koi delivery nahi</div>
          <div className="empty-sub">Bill mein transport bharne par yahan delivery dikhegi.</div>
        </div>
      )}
      {shown.map((i) => {
        const t = i.transport
        return (
          <button className="card invoice-row" key={i.id} onClick={() => navigate('#/invoice?id=' + i.id)}>
            <div>
              <div className="cust-name">
                <span style={{ color: 'var(--gold)', marginRight: 7, verticalAlign: -1 }}><Icon name="truck" size={15} /></span>
                {t.vehicleNo || 'Vehicle —'} · {t.driverName || 'driver —'}
              </div>
              <div className="ip-muted">{i.customerName} · {i.date}{t.site ? ' · ' + t.site : ''}{t.lrNo ? ' · LR ' + t.lrNo : ''}</div>
              <div className="ip-muted">{t.freight > 0 ? 'Freight ' + inrFull(t.freight) : ''}{t.loading > 0 ? ' · Loading ' + inrFull(t.loading) : ''}{t.unloading > 0 ? ' · Unloading ' + inrFull(t.unloading) : ''}</div>
            </div>
            <div className="cust-bal num">{inrFull(i.totals.grandTotal)}</div>
          </button>
        )
      })}
    </div>
  )
}