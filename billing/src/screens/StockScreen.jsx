import React, { useEffect, useState } from 'react'
import { db, UNITS } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'
import { Icon } from '../components/Icon'
import VoiceModal from '../components/VoiceModal'

const CATS = [
  { id: 'cement', label: 'Cement', icon: 'stack' },
  { id: 'steel', label: 'Steel', icon: 'layers' },
  { id: 'other', label: 'Other', icon: 'grid' }
]

export default function StockScreen() {
  const [items, setItems] = useState([])
  const [f, setF] = useState({ name: '', unit: 'bag', rate: '', category: 'other', hsn: '' })
  const [msg, setMsg] = useState('')
  const [voiceOpen, setVoiceOpen] = useState(false)

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
    setMsg('Item add ho gaya')
    setItems(await db.items.toArray())
  }

  const groups = { cement: [], steel: [], other: [] }
  for (const it of items) (groups[it.category] || groups.other).push(it)

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Stock / Rate list</div>
        <button className="mini-add" style={{ marginLeft: 'auto' }} onClick={() => setVoiceOpen(true)}><Icon name="mic" size={14} /> Voice</button>
      </header>

      <button className="voice-card" onClick={() => setVoiceOpen(true)} style={{ marginTop: 10 }}>
        <span className="voice-card-icon"><Icon name="mic" size={20} /></span>
        <span>
          <span className="voice-card-label">VOICE STOCK</span>
          <span className="voice-card-hint">"50 bag ACC cement add karo"</span>
        </span>
        <Icon name="chevronRight" size={16} style={{ marginLeft: 'auto', opacity: .5 }} />
      </button>

      <section className="card">
        <div className="card-title">Naya item</div>
        <input className="input" placeholder="Item naam" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="tr-grid">
          <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select className="input" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="tr-grid">
          <input className="input" inputMode="decimal" placeholder="Rate ₹" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} />
          <input className="input" placeholder="HSN" value={f.hsn} onChange={(e) => setF({ ...f, hsn: e.target.value })} />
        </div>
        <button className="primary" onClick={addItem}>Add item</button>
        {msg && <div className="status">{msg}</div>}
      </section>

      {voiceOpen && <VoiceModal open={voiceOpen} onClose={() => { setVoiceOpen(false); db.items.toArray().then(setItems) }} />}

      {CATS.map((cat) =>
        groups[cat.id].length > 0 ? (
          <section className="card" key={cat.id}>
            <div className="card-title">
              <span><span style={{ color: 'var(--gold)', marginRight: 7, verticalAlign: -2 }}><Icon name={cat.icon} size={15} /></span>{cat.label.toUpperCase()}</span>
              <span className="sub">{groups[cat.id].length} items</span>
            </div>
            {groups[cat.id].map((it) => (
              <div className="vc-item" key={it.id}>
                <span>{it.name} <span className="ip-muted">({it.unit}{it.hsn ? ', HSN ' + it.hsn : ''} · {it.qty || 0} {it.unit} stock)</span></span>
                <span className="num"><input className="input inline stock-rate" inputMode="decimal" value={it.rate || ''} onChange={(e) => updateRate(it.id, e.target.value)} /> /{it.unit}</span>
              </div>
            ))}
          </section>
        ) : null
      )}
    </div>
  )
}