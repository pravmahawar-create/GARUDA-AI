import React, { useEffect, useState } from 'react'
import { db, UNITS } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'

export default function StockScreen() {
  const [items, setItems] = useState([])
  const [f, setF] = useState({ name: '', unit: 'bag', rate: '', category: 'other', hsn: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => setItems(await db.items.toArray()))()
  }, [])

  const updateRate = async (id, rate) => {
    await db.items.update(id, { rate: Number(rate) || 0 })
    setItems(await db.items.toArray())
  }

  const addItem = async () => {
    if (!f.name.trim()) return setMsg('Item naam daalo')
    await db.items.add({
      id: 'itm' + Date.now(),
      name: f.name.trim(),
      unit: f.unit,
      rate: Number(f.rate) || 0,
      category: f.category,
      hsn: f.hsn
    })
    setF({ name: '', unit: 'bag', rate: '', category: 'other', hsn: '' })
    setMsg('✅ Item add ho gaya')
    setItems(await db.items.toArray())
  }

  const groups = { cement: [], steel: [], other: [] }
  for (const it of items) (groups[it.category] || groups.other).push(it)

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Stock / Rate list</div>
      </header>

      <section className="card">
        <div className="card-title">Naya item</div>
        <input className="input" placeholder="Item naam" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="tr-grid">
          <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            <option value="cement">Cement</option>
            <option value="steel">Steel</option>
            <option value="other">Other</option>
          </select>
          <select className="input" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="tr-grid">
          <input className="input" inputMode="decimal" placeholder="Rate ₹" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} />
          <input className="input" placeholder="HSN" value={f.hsn} onChange={(e) => setF({ ...f, hsn: e.target.value })} />
        </div>
        <button className="primary" onClick={addItem}>+ Add item</button>
        {msg && <div className="status">{msg}</div>}
      </section>

      {['cement', 'steel', 'other'].map((cat) =>
        groups[cat].length > 0 ? (
          <section className="card" key={cat}>
            <div className="card-title">{cat.toUpperCase()}</div>
            {groups[cat].map((it) => (
              <div className="vc-item" key={it.id}>
                <span>{it.name} <span className="ip-muted">({it.unit}{it.hsn ? ', HSN ' + it.hsn : ''})</span></span>
                <span><input className="input inline stock-rate" inputMode="decimal" value={it.rate || ''} onChange={(e) => updateRate(it.id, e.target.value)} /> /{it.unit}</span>
              </div>
            ))}
          </section>
        ) : null
      )}
    </div>
  )
}