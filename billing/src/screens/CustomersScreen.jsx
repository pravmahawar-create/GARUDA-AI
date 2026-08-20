import React, { useEffect, useState } from 'react'
import { db, enqueue } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'
import GstVerifyModal from '../components/GstVerifyModal'

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([])
  const [outstanding, setOutstanding] = useState({})
  const [gstOpen, setGstOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      const custs = await db.customers.toArray()
      const invoices = await db.invoices.toArray()
      const payments = await db.payments.toArray()
      const map = {}
      for (const c of custs) {
        const invs = invoices.filter((i) => i.customerId === c.id)
        const billed = invs.reduce((s, i) => s + i.totals.grandTotal, 0)
        const paid = payments.filter((p) => p.customerId === c.id).reduce((s, p) => s + p.amount, 0)
        map[c.id] = { billed, paid, balance: billed - paid }
      }
      setCustomers(custs)
      setOutstanding(map)
    })()
  }, [])

  const addQuick = async () => {
    const name = prompt('Naya customer naam?')
    if (!name) return
    const cust = { id: 'c' + Date.now(), name: name.trim(), mobile: '', gstin: '', address: '', createdAt: new Date().toISOString() }
    await db.customers.put(cust)
    await enqueue('customer', 'create', cust)
    setCustomers(await db.customers.toArray())
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Customers</div>
        <button className="mini-add" onClick={() => setGstOpen(true)}>GSTIN+</button>
        <button className="mini-add" onClick={addQuick}>+ Add</button>
      </header>
      {customers.length === 0 && <div className="empty">Abhi koi customer nahi — pehle bill banao.</div>}
      {customers.map((c) => {
        const o = outstanding[c.id]
        return (
          <div className="card cust-row" key={c.id}>
            <div>
              <div className="cust-name">{c.name}</div>
              {c.mobile && <div className="ip-muted">{c.mobile}</div>}
              {c.gstin && <div className="ip-muted">{c.gstin}</div>}
            </div>
            <div className={`cust-bal ${o && o.balance > 0 ? 'due' : 'clear'}`}>
              {o ? inrFull(o.balance) : '₹0'}
              <div className="ip-muted">{o && o.balance > 0 ? 'baki' : 'clear'}</div>
            </div>
          </div>
        )
      })}
      {gstOpen && <GstVerifyModal open={gstOpen} onClose={() => setGstOpen(false)} />}
    </div>
  )
}