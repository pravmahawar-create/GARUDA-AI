import React, { useEffect, useMemo, useState } from 'react'
import { db, getSetting, nextInvoiceNo, UNITS, enqueue } from '../db'
import { calcBill } from '../lib/money'
import { navigate } from '../App'
import VoiceModal from '../components/VoiceModal'

let k = 0
const freshRow = (name = '', unit = 'bag', rate = 0) => ({ key: 'r' + ++k, name, unit, rate: Number(rate) || 0, qty: 0, hsn: '' })

export default function NewBillScreen() {
  const [customers, setCustomers] = useState([])
  const [catalog, setCatalog] = useState([])
  const [gstRate, setGstRate] = useState(18)

  const [customerId, setCustomerId] = useState('')
  const [newName, setNewName] = useState('')
  const [newMobile, setNewMobile] = useState('')
  const [rows, setRows] = useState([freshRow('Cement - ACC', 'bag', 390), freshRow('TMT Steel 10mm', 'kg', 60)])
  const [discount, setDiscount] = useState(0)
  const [transport, setTransport] = useState({})
  const [showTr, setShowTr] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [voiceOpen, setVoiceOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      setCustomers(await db.customers.toArray())
      setCatalog(await db.items.toArray())
      setGstRate(Number((await getSetting('gstRate', 18)) || 18))
    })()
  }, [])

  const totals = useMemo(() => calcBill(rows, { gstRate, discount, transport }), [rows, gstRate, discount, transport])
  const validLines = totals.lines.length > 0

  const pickCustomer = (id) => {
    setCustomerId(id)
    const c = customers.find((x) => x.id === id)
    if (c) {
      setNewName(c.name)
      setNewMobile(c.mobile || '')
    }
  }

  const addRow = (cat) => {
    if (cat === 'steel') setRows((r) => [...r, freshRow('TMT Steel 12mm', 'kg', 61)])
    else if (cat === 'cement') setRows((r) => [...r, freshRow('Cement - UltraTech', 'bag', 395)])
    else setRows((r) => [...r, freshRow()])
  }

  const setRow = (key, patch) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)))

  const save = async () => {
    setErr('')
    if (!newName.trim()) return setErr('Customer ka naam likho ya chuno')
    if (!validLines) return setErr('Kam se kam ek item qty ke saath daalo')

    let cust = customers.find((c) => c.id === customerId)
    if (!cust && newName.trim()) {
      cust = {
        id: 'c' + Date.now(),
        name: newName.trim(),
        mobile: newMobile.trim(),
        gstin: '',
        address: '',
        createdAt: new Date().toISOString()
      }
      await db.customers.put(cust)
      await enqueue('customer', 'create', cust)
    }

    const invoiceNo = await nextInvoiceNo()
    const invoice = {
      id: 'inv' + Date.now(),
      invoiceNo,
      customerId: cust.id,
      customerName: cust.name,
      date: new Date().toISOString().slice(0, 10),
      items: totals.lines,
      totals,
      discount,
      transport,
      status: 'saved',
      paidAmount: 0,
      createdAt: new Date().toISOString()
    }
    await db.invoices.put(invoice)
    await enqueue('invoice', 'create', invoice)
    setSaving(true)
    navigate('#/invoice?id=' + invoice.id)
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">New Bill</div>
      </header>

      <section className="card">
        <div className="card-title">Customer</div>
        <select className="input" value={customerId} onChange={(e) => pickCustomer(e.target.value)}>
          <option value="">+ Naya customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.mobile ? ' (' + c.mobile + ')' : ''}</option>)}
        </select>
        <input className="input" placeholder="Naam *" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input className="input" type="tel" placeholder="Mobile" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} />
      </section>

      <section className="card">
        <div className="card-title">Items</div>
        {rows.map((row) => (
          <div className="item-row" key={row.key}>
            <div className="ir-top">
              <input className="input ir-name" placeholder="Item name" value={row.name} onChange={(e) => setRow(row.key, { name: e.target.value })} />
              <select className="input ir-unit" value={row.unit} onChange={(e) => setRow(row.key, { unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="ir-bottom">
              <input className="input" inputMode="decimal" placeholder="Qty" value={row.qty || ''} onChange={(e) => setRow(row.key, { qty: e.target.value })} />
              <input className="input" inputMode="decimal" placeholder="Rate ₹" value={row.rate || ''} onChange={(e) => setRow(row.key, { rate: e.target.value })} />
              <div className="ir-amt">{row.qty > 0 && row.rate > 0 ? '₹' + ((row.qty * row.rate).toLocaleString('en-IN')) : ''}</div>
              <button className="del" onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}>✕</button>
            </div>
          </div>
        ))}
        <div className="add-btns">
          <button className="chip chip-cement" onClick={() => addRow('cement')}>+ Cement</button>
          <button className="chip chip-steel" onClick={() => addRow('steel')}>+ Steel</button>
          <button className="chip chip-other" onClick={() => addRow('other')}>+ Item</button>
        </div>
      </section>

      <section className="card">
        <button className="card-title collapsible" onClick={() => setShowTr((s) => !s)}>
          Transport / Delivery {showTr ? '▾' : '▸'}
        </button>
        {showTr && (
          <div className="tr-grid">
            <input className="input" placeholder="Vehicle no (MP20AB1234)" value={transport.vehicleNo || ''} onChange={(e) => setTransport({ ...transport, vehicleNo: e.target.value })} />
            <input className="input" placeholder="Driver name" value={transport.driverName || ''} onChange={(e) => setTransport({ ...transport, driverName: e.target.value })} />
            <input className="input" type="tel" placeholder="Driver mobile" value={transport.driverMobile || ''} onChange={(e) => setTransport({ ...transport, driverMobile: e.target.value })} />
            <input className="input" placeholder="Site / location" value={transport.site || ''} onChange={(e) => setTransport({ ...transport, site: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="Freight ₹" value={transport.freight || ''} onChange={(e) => setTransport({ ...transport, freight: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="Loading ₹" value={transport.loading || ''} onChange={(e) => setTransport({ ...transport, loading: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="Unloading ₹" value={transport.unloading || ''} onChange={(e) => setTransport({ ...transport, unloading: e.target.value })} />
            <input className="input" placeholder="LR / challan no" value={transport.lrNo || ''} onChange={(e) => setTransport({ ...transport, lrNo: e.target.value })} />
          </div>
        )}
      </section>

      <section className="card">
        <div className="total-line"><span>Subtotal</span><span>₹{totals.subtotal.toLocaleString('en-IN')}</span></div>
        <div className="total-line"><span>Discount</span><input className="input inline" inputMode="decimal" value={discount || ''} onChange={(e) => setDiscount(e.target.value)} /></div>
        <div className="total-line"><span>CGST ({gstRate / 2}%)</span><span>₹{totals.cgst.toLocaleString('en-IN')}</span></div>
        <div className="total-line"><span>SGST ({gstRate / 2}%)</span><span>₹{totals.sgst.toLocaleString('en-IN')}</span></div>
        {totals.freight > 0 && <div className="total-line"><span>Freight</span><span>₹{totals.freight.toLocaleString('en-IN')}</span></div>}
        {totals.loading > 0 && <div className="total-line"><span>Loading</span><span>₹{totals.loading.toLocaleString('en-IN')}</span></div>}
        {totals.unloading > 0 && <div className="total-line"><span>Unloading</span><span>₹{totals.unloading.toLocaleString('en-IN')}</span></div>}
        <div className="total-line grand"><span>GRAND TOTAL</span><span>₹{totals.grandTotal.toLocaleString('en-IN')}</span></div>
        {err && <div className="err">{err}</div>}
        <button className="primary big" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Bill →'}</button>
      </section>

      <button className="fab" onClick={() => setVoiceOpen(true)}>🎙️</button>
      {voiceOpen && <VoiceModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />}
    </div>
  )
}