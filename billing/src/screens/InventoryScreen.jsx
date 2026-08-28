import React, { useEffect, useState } from 'react'
import { db, applyStockOp, getSuppliers, getSupplierLedger, getVehicles, saveVehicle, saveSupplier, getSupplierList, canonicalName, getActiveCompany, getItems } from '../db'
import { inrFull } from '../lib/money'
import { navigate } from '../App'
import { Icon } from '../components/Icon'

const CATS = [
  { id: 'cement', label: 'Cement' },
  { id: 'steel', label: 'Steel' },
  { id: 'other', label: 'Other' }
]

export default function InventoryScreen() {
  const [suppliers, setSuppliers] = useState([])
  const [detailName, setDetailName] = useState(null)
  const [ledger, setLedger] = useState([])
  const [items, setItems] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [msg, setMsg] = useState('')
  const [arrivalOpen, setArrivalOpen] = useState(false)
  const [form, setForm] = useState({ supplier: '', vehicleNo: '', item: '', qty: '', unit: 'bag', rate: '', supplierGstin: '', supplierPhone: '', supplierAddress: '' })
  const [fileName, setFileName] = useState('')
  const [supplierMaster, setSupplierMaster] = useState([])
  const [company, setCompany] = useState(null)

  const refresh = async () => {
    const comp = company || (await db.companies.toArray())[0] || null
    setSuppliers(await getSuppliers(comp ? comp.id : null))
    setItems(await getItems(comp ? comp.id : null))
    setVehicles(await getVehicles(comp ? comp.id : null))
    setSupplierMaster(await getSupplierList(comp ? comp.id : null))
  }
  useEffect(() => {
    ;(async () => {
      const comp = await getActiveCompany()
      setCompany(comp)
      await refresh()
    })()
  }, [])

  const openDetail = async (name) => {
    setDetailName(name)
    setLedger(await getSupplierLedger(company ? company.id : null, name))
  }

  const saveArrival = async (e) => {
    e.preventDefault()
    const qty = Number(form.qty)
    if (!form.supplier.trim() || !form.item.trim() || !qty || qty <= 0) return setMsg('Supplier, item aur qty daalo')
    try {
      await saveSupplier({ name: form.supplier.trim(), gstin: form.supplierGstin, phone: form.supplierPhone, address: form.supplierAddress })
      await applyStockOp({
        name: form.item.trim(),
        qty,
        unit: form.unit || 'bag',
        operation: 'add',
        sourceType: 'inward',
        supplierName: form.supplier.trim(),
        vehicleNo: form.vehicleNo.trim().toUpperCase() || '',
        rate: Number(form.rate) || 0
      })
      if (form.vehicleNo.trim()) {
        const existing = vehicles.find((v) => v.number === form.vehicleNo.trim().toUpperCase())
        if (!existing) await saveVehicle({ number: form.vehicleNo.trim().toUpperCase(), type: '', capacity: 0, unit: 'kg' })
      }
      setArrivalOpen(false); setMsg('Arrival record ho gaya — supplier + stock + vehicle update')
      await refresh()
    } catch (err) { setMsg('Error: ' + (err && err.message ? err.message : err)) }
  }

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0]
    setFileName(f ? f.name : '')
    // Auto-parse of photos/PDFs needs a vision AI (Gemini/OCR) — not available offline.
    // File is selected; user fills the arrival form manually.
    setMsg('File select ho gaya: ' + (f ? f.name : '') + '. Auto-parse vision AI ke liye hai — abhi arrival manual bharo.')
  }

  if (detailName) {
    return (
      <div className="screen">
        <header className="topbar backbar">
          <button className="back" onClick={() => { setDetailName(null); setLedger([]) }}>‹</button>
          <div className="top-title">{detailName} — Ledger</div>
        </header>
        {(() => {
          const m = supplierMaster.find((x) => x.name.toLowerCase() === String(detailName).toLowerCase())
          if (!m) return null
          return (
            <section className="card">
              <div className="card-title">Supplier Details</div>
              {m.gstin && <div className="vc-item"><span>GSTIN</span><span>{m.gstin}</span></div>}
              {m.phone && <div className="vc-item"><span>Phone</span><span>{m.phone}</span></div>}
              {m.address && <div className="vc-item"><span>Address</span><span>{m.address}</span></div>}
            </section>
          )
        })()}
        <section className="card">
          <div className="card-title">Arrivals / Ledger</div>
          {ledger.length === 0 && <div className="empty-sub">Koi arrival nahi</div>}
          {ledger.map((t, i) => (
            <div className="vc-item" key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <div>
                <span className="ip-muted">{t.date} · {t.vehicleNo ? 'Vehicle ' + t.vehicleNo : 'No vehicle'}</span>
                <div style={{ fontWeight: 700 }}>{t.itemName} — {t.quantity > 0 ? '+' : ''}{t.quantity} {t.unit}</div>
                {t.rate ? <div className="ip-muted">Rate {inrFull(t.rate)}/{t.unit}</div> : null}
              </div>
              <span className={`badge badge-${t.movementType === 'stock_in' || t.movementType === 'opening' ? 'ok' : 'warn'}`}>
                {t.movementType === 'stock_in' ? 'Inward' : t.movementType}
              </span>
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
        <div className="top-title">Inventory</div>
        <button className="mini-add" style={{ marginLeft: 'auto' }} onClick={() => setArrivalOpen(true)}><Icon name="plus" size={14} /> Arrival</button>
      </header>

      <div className="sm-actions">
        <button className="voice-card" onClick={() => setArrivalOpen(true)} style={{ margin: 0 }}>
          <span className="voice-card-icon"><Icon name="truck" size={20} /></span>
          <span>
            <span className="voice-card-label">VEHICLE ARRIVED</span>
            <span className="voice-card-hint">"MP20AB1234 gaadi se 50 bag ACC cement aaya"</span>
          </span>
          <Icon name="chevronRight" size={16} style={{ marginLeft: 'auto', opacity: .5 }} />
        </button>
      </div>

      <input className="input" type="file" accept="image/*,application/pdf" onChange={handleFile} style={{ margin: '8px 0' }} />
      {fileName && <div className="ip-muted" style={{ marginBottom: 6 }}>File: {fileName}</div>}
      {msg && <div className="status">{msg}</div>}

      <div className="sec-title">Suppliers / Companies</div>
      {suppliers.length === 0 && (
        <div className="empty">
          <div className="empty-sigil"><Icon name="truck" size={44} /></div>
          <div className="empty-title">Abhi koi supplier entry nahi</div>
          <div className="empty-sub">"Arrival" dabao — supplier, vehicle, item daalo. Supplier ka ledger apne aap banega.</div>
        </div>
      )}
      {suppliers.map((s) => {
        const m = supplierMaster.find((x) => x.name.toLowerCase() === s.name.toLowerCase())
        return (
          <div className="card sm-row" key={s.name} onClick={() => openDetail(s.name)} style={{ cursor: 'pointer' }}>
            <div className="sm-main">
              <span className="sm-name">{s.name}</span>
              <span className="sm-meta">
                <span className="ip-muted">{m && m.gstin ? 'GSTIN ' + m.gstin + ' · ' : ''}{s.arrivals} arrivals · last {s.lastDate || '—'}</span>
                <span className="sm-rate">{s.qty} units</span>
              </span>
              {m && m.address && <span className="ip-muted" style={{ fontSize: 11 }}>{m.address}</span>}
            </div>
            <Icon name="chevronRight" size={16} />
          </div>
        )
      })}

      {arrivalOpen && (
        <div className="modal-mask" onClick={() => setArrivalOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={saveArrival}>
            <div className="modal-title">Vehicle Arrival</div>
            <label className="form-label">Supplier / Company <input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="e.g. Ambuja Cement Depot" /></label>
            <div className="tr-grid">
              <label className="form-label">Supplier GSTIN <input className="input" value={form.supplierGstin} onChange={(e) => setForm({ ...form, supplierGstin: e.target.value.toUpperCase() })} placeholder="optional" /></label>
              <label className="form-label">Supplier Phone <input className="input" value={form.supplierPhone} onChange={(e) => setForm({ ...form, supplierPhone: e.target.value })} placeholder="optional" /></label>
            </div>
            <label className="form-label">Supplier Address <input className="input" value={form.supplierAddress} onChange={(e) => setForm({ ...form, supplierAddress: e.target.value })} placeholder="optional" /></label>
            <label className="form-label">Vehicle Number <input className="input" value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value.toUpperCase() })} placeholder="MP20AB1234" /></label>
            <label className="form-label">Item
              <select className="input" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })}>
                <option value="">— select / type —</option>
                {items.map((it) => <option key={it.id} value={it.name}>{it.name}</option>)}
              </select>
            </label>
            <input className="input" style={{ marginTop: 6 }} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="Ya item naam type karo" />
            <div className="tr-grid">
              <label className="form-label">Qty <input className="input" inputMode="decimal" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></label>
              <label className="form-label">Unit
                <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {['bag', 'kg', 'ton', 'piece', 'box', 'trolley'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            </div>
            <label className="form-label">Rate ₹ <input className="input" inputMode="decimal" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="optional" /></label>
            {msg && <div className="err">{msg}</div>}
            <div className="row-actions">
              <button className="btn">Save Arrival</button>
              <button type="button" className="btn btn-ghost" onClick={() => setArrivalOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
