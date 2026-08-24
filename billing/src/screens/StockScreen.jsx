import React, { useEffect, useState } from 'react'
import { db, getStockLedger, applyStockOp, canonicalName, UNITS } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'
import { Icon } from '../components/Icon'
import VoiceModal from '../components/VoiceModal'

const CATS = [
  { id: 'cement', label: 'Cement', icon: 'stack' },
  { id: 'steel', label: 'Steel', icon: 'layers' },
  { id: 'other', label: 'Other', icon: 'grid' }
]

const MOVEMENT_LABEL = {
  opening: 'Opening',
  purchase: 'GST Purchase',
  unbilled_inward: 'Unbilled Inward',
  inward: 'Vehicle Inward',
  sale: 'Sale',
  adjustment: 'Adjustment'
}

const LOW_STOCK_THRESHOLD = 10

export default function StockScreen() {
  const [items, setItems] = useState([])
  const [physical, setPhysical] = useState({})
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [ledger, setLedger] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [f, setF] = useState({ name: '', unit: 'bag', rate: '', category: 'other', hsn: '' })
  const [drafts, setDrafts] = useState({})

  const refreshItems = async () => {
    const all = await db.items.toArray()
    setItems(all)
    const map = {}
    for (const it of all) map[it.id] = Number(it.qty || 0)
    setPhysical(map)
  }

  useEffect(() => {
    refreshItems()
  }, [])

  const openDetail = async (item) => {
    setDetailItem(item)
    const ledgerData = await getStockLedger(item.id)
    setLedger(ledgerData)
  }

  const updateRate = async (id, rate) => {
    await db.items.update(id, { rate: Number(rate) || 0 })
    refreshItems()
  }

  const adjust = async (it, sign) => {
    const draft = drafts[it.id]
    let qty = 1
    if (draft !== undefined && draft !== '' && Number(draft) > 0 && Number(draft) !== Number(it.stock)) qty = Math.round(Number(draft))
    const delta = sign * qty
    if (!delta) return
    const op = delta > 0 ? 'add' : 'subtract'
    try {
      await applyStockOp({ name: it.name, qty: Math.abs(delta), unit: it.unit, operation: op })
      setDrafts((d) => { const c = { ...d }; delete c[it.id]; return c })
      setMsg(op === 'add' ? it.name + ' +' + Math.abs(delta) + ' ' + it.unit : it.name + ' -' + Math.abs(delta) + ' ' + it.unit)
      refreshItems()
    } catch (e) {
      setMsg('Stock error: ' + (e && e.message ? e.message : e))
    }
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
    setShowAdd(false)
    setMsg('Item add ho gaya')
    refreshItems()
  }

  const merged = []
  const byKey = new Map()
  for (const it of items) {
    const key = canonicalName(it.name)
    if (!byKey.has(key)) {
      byKey.set(key, { ...it, aliases: 1 })
      merged.push(byKey.get(key))
    } else {
      const cur = byKey.get(key)
      cur.aliases += 1
      if (it.name.length < cur.name.length) cur.name = it.name
      if (it.name.length === cur.name.length) cur.unit = it.unit
      cur.qty = (cur.qty || 0) + (it.qty || 0)
    }
  }
  const displayItems = merged.map((it) => {
    let qty = 0
    for (const raw of items) {
      if (canonicalName(raw.name) === canonicalName(it.name)) qty += Number(physical[raw.id] || 0)
    }
    return { ...it, stock: qty }
  })

  const filtered = displayItems.filter((it) => {
    const s = q.trim().toLowerCase()
    if (!s) return true
    return it.name.toLowerCase().includes(s) || it.category.includes(s) || it.unit.toLowerCase().includes(s)
  })

  const totalItems = displayItems.length
  const lowStock = displayItems.filter((it) => it.stock <= LOW_STOCK_THRESHOLD).length
  const stockValue = displayItems.reduce((s, it) => s + Number(it.rate || 0) * Number(it.stock || 0), 0)

  const groups = { cement: [], steel: [], other: [] }
  for (const it of filtered) (groups[it.category] || groups.other).push(it)

  if (detailItem) {
    const inQty = ledger.filter(t => t.movementType === 'stock_in' || t.movementType === 'opening').reduce((s, t) => s + Number(t.quantity || 0), 0)
    const outQty = ledger.filter(t => t.movementType === 'stock_out').reduce((s, t) => s + Number(t.quantity || 0), 0)
    const stock = displayItems.find((d) => canonicalName(d.name) === canonicalName(detailItem.name))
    const qty = stock ? stock.stock : 0
    return (
      <div className="screen">
        <header className="topbar backbar">
          <button className="back" onClick={() => { setDetailItem(null); setLedger([]); refreshItems() }}>‹</button>
          <div className="top-title">{detailItem.name}</div>
        </header>

        <section className="card">
          <div className="card-title">Current Stock</div>
          <div className="stock-big">{qty} <span className="stock-big-unit">{detailItem.unit}</span></div>
          {detailItem.rate ? <div className="ip-muted">Rate {inrFull(detailItem.rate)} / {detailItem.unit}</div> : null}
          <div className="tr-grid" style={{ marginTop: 8 }}>
            <div><span className="ip-muted">Inward:</span> <b>+{inQty}</b></div>
            <div><span className="ip-muted">Outward:</span> <b>-{outQty}</b></div>
          </div>
        </section>

        <section className="card">
          <div className="card-title">Transactions</div>
          {ledger.length === 0 && <div className="empty-sub">No transactions yet</div>}
          {ledger.map((t, i) => (
            <div className="vc-item" key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="ip-muted">{t.date}</span>
                <span className={`badge badge-${t.movementType === 'stock_in' || t.movementType === 'opening' ? 'ok' : 'warn'}`}>
                  {MOVEMENT_LABEL[t.sourceType] || t.movementType}
                </span>
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={{ fontWeight: 700 }}>{t.quantity > 0 ? '+' : ''}{t.quantity} {t.unit}</span>
                {t.rate ? <span className="num ip-muted"> @ {inrFull(t.rate)}/{t.unit}</span> : null}
              </div>
              {t.supplierName && <div className="ip-muted">Supplier: {t.supplierName}</div>}
              {t.invoiceNo && <div className="ip-muted">Invoice: {t.invoiceNo}</div>}
              {t.vehicleNo && <div className="ip-muted">Vehicle: {t.vehicleNo}</div>}
              {t.notes && <div className="ip-muted">{t.notes}</div>}
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
        <div className="top-title">Stock Manager</div>
        <button className="mini-add" style={{ marginLeft: 'auto' }} onClick={() => setVoiceOpen(true)}><Icon name="mic" size={14} /> Voice</button>
      </header>

      <div className="sm-summary">
        <div className="sm-sum-item"><div className="sm-sum-v">{totalItems}</div><div className="sm-sum-l">Items</div></div>
        <div className="sm-sum-item"><div className="sm-sum-v due">{lowStock}</div><div className="sm-sum-l">Low Stock</div></div>
        <div className="sm-sum-item"><div className="sm-sum-v">{inrFull(stockValue)}</div><div className="sm-sum-l">Stock Value</div></div>
      </div>

      <div className="sm-actions">
        <button className="voice-card" onClick={() => setVoiceOpen(true)} style={{ margin: 0 }}>
          <span className="voice-card-icon"><Icon name="mic" size={20} /></span>
          <span>
            <span className="voice-card-label">VOICE STOCK</span>
            <span className="voice-card-hint">"ACC Cement mein 50 bag add karo"</span>
          </span>
          <Icon name="chevronRight" size={16} style={{ marginLeft: 'auto', opacity: .5 }} />
        </button>
      </div>

      <input className="input search-input" placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)} />

      {totalItems === 0 && (
        <div className="empty">
          <div className="empty-sigil"><Icon name="stack" size={44} /></div>
          <div className="empty-title">No stock items yet</div>
          <div className="empty-sub">Add an item or use voice — "ACC Cement mein 50 bag add karo".</div>
          <button className="btn btn-big" style={{ marginTop: 12 }} onClick={() => setShowAdd(true)}>+ Add New Item</button>
        </div>
      )}

      {totalItems > 0 && !showAdd && (
        <button className="sm-add-link" onClick={() => setShowAdd(true)}><Icon name="plus" size={14} /> Add New Item</button>
      )}

      {showAdd && (
        <section className="card">
          <div className="card-title">Add New Item</div>
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
          <div className="row-actions">
            <button className="btn" onClick={addItem}>Save Item</button>
            <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setMsg('') }}>Cancel</button>
          </div>
        </section>
      )}

      {msg && <div className="status">{msg}</div>}

      {voiceOpen && <VoiceModal open={voiceOpen} onClose={() => { setVoiceOpen(false); refreshItems() }} />}

      {filtered.length === 0 && totalItems > 0 && (
        <div className="empty">
          <div className="empty-title">No matching items</div>
          <div className="empty-sub">"ACC", "cement", "steel" try karo.</div>
        </div>
      )}

      {CATS.map((cat) =>
        groups[cat.id].length > 0 ? (
          <section className="card" key={cat.id}>
            <div className="card-title">
              <span><span style={{ color: 'var(--gold)', marginRight: 7, verticalAlign: -2 }}><Icon name={cat.icon} size={15} /></span>{cat.label.toUpperCase()}</span>
              <span className="sub">{groups[cat.id].length} item{groups[cat.id].length > 1 ? 's' : ''}</span>
            </div>
            {groups[cat.id].map((it) => (
              <div className="sm-row" key={it.id}>
                <button className="sm-main" onClick={() => openDetail(it)}>
                  <span className="sm-name">
                    {it.name}
                    {it.aliases > 1 && <span className="sm-alias" title="Multiple names merged into one item">Merged</span>}
                  </span>
                  <span className="sm-meta">
                    <span className="sm-stock">{it.stock} <span className="ip-muted">{it.unit}</span></span>
                    <span className="sm-rate">{inrFull(it.rate || 0)}/{it.unit}</span>
                  </span>
                </button>
                <div className="sm-actions">
                  <button className="sm-btn sm-btn-minus" onClick={() => adjust(it, -1)} title="Reduce"><Icon name="minus" size={14} /></button>
                  <input className="sm-qty" inputMode="numeric"
                    value={drafts[it.id] !== undefined ? drafts[it.id] : it.stock}
                    onChange={(e) => setDrafts((d) => ({ ...d, [it.id]: e.target.value }))}
                    onBlur={() => setDrafts((d) => { const c = { ...d }; delete c[it.id]; return c })}
                  />
                  <button className="sm-btn sm-btn-plus" onClick={() => adjust(it, 1)} title="Add"><Icon name="plus" size={14} /></button>
                </div>
              </div>
            ))}
          </section>
        ) : null
      )}
    </div>
  )
}
