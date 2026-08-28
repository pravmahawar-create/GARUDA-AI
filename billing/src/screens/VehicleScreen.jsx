import React, { useEffect, useState } from 'react'
import { db, getVehicles, saveVehicle, deleteVehicle } from '../db'
import { navigate } from '../App'
import { Icon } from '../components/Icon'

export default function VehicleScreen() {
  const [vehicles, setVehicles] = useState([])
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState(null)

  const refresh = async () => { setVehicles(await getVehicles()) }
  useEffect(() => { refresh() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (!form.number.trim()) return setMsg('Vehicle number daalo')
    try {
      await saveVehicle(form)
      setForm(null); setMsg('Vehicle save ho gaya')
      await refresh()
    } catch (err) { setMsg('Error: ' + (err && err.message ? err.message : err)) }
  }

  const shown = vehicles.filter((v) => {
    const s = q.trim().toLowerCase()
    if (!s) return true
    return String(v.number).toLowerCase().includes(s) || String(v.type || '').toLowerCase().includes(s)
  })

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Vehicles</div>
        <button className="mini-add" style={{ marginLeft: 'auto' }} onClick={() => setForm({ number: '', type: '', capacity: '', unit: 'kg', active: true })}>+ Add Vehicle</button>
      </header>

      <div className="sm-summary" style={{ marginTop: 10 }}>
        <div className="sm-sum-item"><div className="sm-sum-v">{vehicles.length}</div><div className="sm-sum-l">Vehicles</div></div>
        <div className="sm-sum-item"><div className="sm-sum-v">{vehicles.filter((v) => v.active).length}</div><div className="sm-sum-l">Active</div></div>
        <div className="sm-sum-item"><div className="sm-sum-v">{vehicles.reduce((s, v) => s + (Number(v.capacity) || 0), 0)}</div><div className="sm-sum-l">Total Capacity</div></div>
      </div>

      <input className="input search-input" placeholder="Vehicle number / type se dhundo" value={q} onChange={(e) => setQ(e.target.value)} />

      {vehicles.length === 0 && (
        <div className="empty">
          <div className="empty-sigil"><Icon name="truck" size={44} /></div>
          <div className="empty-title">Abhi koi vehicle nahi</div>
          <div className="empty-sub">Vehicle add karo — "Chhota Hathi, MP20AB1234, 1500 kg".</div>
          <button className="btn btn-big" style={{ marginTop: 12 }} onClick={() => setForm({ number: '', type: '', capacity: '', unit: 'kg', active: true })}>+ Add Vehicle</button>
        </div>
      )}

      {shown.map((v) => (
        <div className="card sm-row" key={v.id}>
          <div className="sm-main">
            <span className="sm-name">{v.number} {v.active === false && <span className="sm-alias">Inactive</span>}</span>
            <span className="sm-meta">
              <span className="ip-muted">{v.type || '—'}</span>
              <span className="sm-rate">Capacity {v.capacity || 0} {v.unit || 'kg'}</span>
            </span>
          </div>
          <div className="sm-actions">
            <button className="sm-btn" onClick={() => setForm({ ...v })} title="Edit"><Icon name="edit" size={14} /></button>
            <button className="sm-btn sm-btn-minus" onClick={async () => { await deleteVehicle(v.id); await refresh() }} title="Delete"><Icon name="trash" size={14} /></button>
          </div>
        </div>
      ))}

      {shown.length === 0 && vehicles.length > 0 && (
        <div className="empty"><div className="empty-title">No matching vehicles</div></div>
      )}

      {form && (
        <div className="modal-mask" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="modal-title">{form.id ? 'Edit Vehicle' : 'Add Vehicle'}</div>
            <label className="form-label">Vehicle Number <input className="input" autoFocus value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value.toUpperCase() })} placeholder="MP20AB1234" /></label>
            <label className="form-label">Type <input className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Chhota Hathi / Truck / Trolley" /></label>
            <div className="tr-grid">
              <label className="form-label">Capacity <input className="input" inputMode="decimal" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="1500" /></label>
              <label className="form-label">Unit
                <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {['kg', 'ton', 'bag', 'trolley'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            </div>
            {msg && <div className="err">{msg}</div>}
            <div className="row-actions">
              <button className="btn">Save</button>
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
