import React, { useEffect, useMemo, useState } from 'react'
import { db, getActiveCompany, nextBillNo, invoiceNoExists, formatInvoiceNo, UNITS, enqueue } from '../db'
import { calcBill, inrFull } from '../lib/money'
import { gstTypeFor } from '../lib/gst'
import { navigate } from '../App'
import VoiceModal from '../components/VoiceModal'
import { Icon } from '../components/Icon'

let k = 0
const freshRow = (name = '', unit = 'bag', rate = 0, hsn = '') => ({ key: 'r' + ++k, name, unit, rate: Number(rate) || 0, qty: 0, hsn })

export default function NewBillScreen() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const editId = params.get('id')
  const copyId = params.get('copy')
  const [customers, setCustomers] = useState([])
  const [catalog, setCatalog] = useState([])
  const [company, setCompany] = useState(null)

  const [customerId, setCustomerId] = useState('')
  const [newName, setNewName] = useState('')
  const [newMobile, setNewMobile] = useState('')
  const [newGstin, setNewGstin] = useState('')
  const [rows, setRows] = useState([freshRow('Cement - ACC', 'bag', 390), freshRow('TMT Steel 10mm', 'kg', 60)])
  const [discount, setDiscount] = useState(0)
  const [transport, setTransport] = useState({})
  const [showTr, setShowTr] = useState(false)
  const [invoiceNo, setInvoiceNo] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      const cs = await db.customers.toArray()
      const cat = await db.items.toArray()
      setCustomers(cs)
      setCatalog(cat)
      const comp = await getActiveCompany()
      setCompany(comp)

      const sourceId = editId || copyId
      if (sourceId) {
        const inv = await db.invoices.get(sourceId)
        if (inv) {
          setCustomerId(inv.customerId || '')
          setNewName(inv.customerName || '')
          const c = cs.find((x) => x.id === inv.customerId)
          setNewMobile(c?.mobile || '')
          setNewGstin(c?.gstin || '')
          setRows((inv.items || []).map((l) => freshRow(l.name, l.unit, l.rate, l.hsn)))
          setDiscount(inv.discount || 0)
          setTransport(inv.transport || {})
          setDate(inv.date || new Date().toISOString().slice(0, 10))
          if (editId) setInvoiceNo(String(inv.invoiceNo))
          else setInvoiceNo(formatInvoiceNo(Number(comp.nextInvoiceNo) || 1))
        } else {
          setErr('Invoice nahi mila')
        }
      } else {
        setInvoiceNo(formatInvoiceNo(Number(comp.nextInvoiceNo) || 1))
      }
      setLoaded(true)
    })()
  }, [editId])

  const pickCustomer = (id) => {
    setCustomerId(id)
    const c = customers.find((x) => x.id === id)
    if (c) {
      setNewName(c.name)
      setNewMobile(c.mobile || '')
      setNewGstin(c.gstin || '')
      setNotice('')
    }
  }

  const selectedCustomer = customers.find((c) => c.id === customerId)
  const billType = (selectedCustomer && (selectedCustomer.billType || (selectedCustomer.gstin ? 'gst' : 'kaccha'))) || 'kaccha'
  const isKaccha = billType === 'kaccha'

  const totals = useMemo(() => {
    const mode = gstTypeFor(company?.gstin, selectedCustomer?.gstin)
    return calcBill(rows, { gstRate: company?.gstRate ?? 18, discount, transport, billType, mode })
  }, [rows, company, selectedCustomer, discount, transport, billType])

  const validLines = totals.lines.length > 0

  const addRow = (cat) => {
    if (cat === 'steel') setRows((r) => [...r, freshRow('TMT Steel 12mm', 'kg', 61)])
    else if (cat === 'cement') setRows((r) => [...r, freshRow('Cement - UltraTech', 'bag', 395)])
    else setRows((r) => [...r, freshRow()])
  }

  const setRow = (key, patch) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)))

  const onNameChange = (key, value) => {
    setRow(key, { name: value })
    const match = catalog.find((c) => c.name.toLowerCase() === value.trim().toLowerCase())
    if (match) setRow(key, { unit: match.unit || 'bag', rate: match.rate || 0, hsn: match.hsn || '' })
  }

  const creditLimit = Number(selectedCustomer?.creditLimit) || 0
  const outstandingOf = (custId) => {
    let billed = 0
    for (const i of localInvoices) if (i.customerId === custId) billed += i.totals.grandTotal
    let paid = 0
    for (const p of localPayments) if (p.customerId === custId) paid += p.amount
    return Math.max(0, billed - paid)
  }
  const [localInvoices, setLocalInvoices] = useState([])
  const [localPayments, setLocalPayments] = useState([])
  useEffect(() => {
    ;(async () => {
      setLocalInvoices(await db.invoices.toArray())
      setLocalPayments(await db.payments.toArray())
    })()
  }, [])
  const limitWarn = creditLimit > 0 && customerId && (outstandingOf(customerId) + totals.grandTotal) > creditLimit

  const save = async () => {
    setErr(''); setNotice('')
    try {
      if (!newName.trim()) return setErr('Customer ka naam likho ya chuno')
      if (!validLines) return setErr('Kam se kam ek item qty ke saath daalo')
      const no = String(invoiceNo || '').trim()
      if (!no) return setErr('Bill number daalo')

      let cust = customers.find((c) => c.id === customerId)
      if (!cust && newName.trim()) {
        const gstin = newGstin.trim().toUpperCase()
        if (gstin) {
          const dup = customers.find((c) => c.gstin === gstin)
          if (dup) {
            setNotice('GSTIN ' + gstin + ' pehle se records mein hai ("' + dup.name + '") — usi se bill ban raha hai.')
            cust = dup
          }
        }
        if (!cust) {
          cust = {
            id: 'c' + Date.now(),
            name: newName.trim(),
            mobile: newMobile.trim(),
            gstin: gstin || '',
            billType: gstin ? 'gst' : 'kaccha',
            address: '',
            creditLimit: 0,
            createdAt: new Date().toISOString()
          }
          await db.customers.put(cust)
          await enqueue('customer', 'create', cust)
        }
      }

      const mode = gstTypeFor(company.gstin, cust.gstin)
      const finalBillType = cust.billType || (cust.gstin ? 'gst' : 'kaccha')
      if (editId) {
        const dup = await invoiceNoExists(company.id, no, editId)
        if (dup) return setErr('Ye bill number pehle se hai — doosra rakho.')
      } else {
        const dup = await invoiceNoExists(company.id, no)
        if (dup) return setErr('Ye bill number pehle se hai — doosra rakho.')
      }
      const freshNo = editId ? no : no
      const newTotals = calcBill(rows, { gstRate: company.gstRate, discount, transport, billType: finalBillType, mode })
      const invoice = {
        id: editId || 'inv' + Date.now(),
        invoiceNo: freshNo,
        companyId: company.id,
        companyName: company.name,
        templateId: company.templateId || 'classic',
        billType: finalBillType,
        customerId: cust.id,
        customerName: cust.name,
        date,
        items: newTotals.lines,
        totals: newTotals,
        discount,
        transport,
        bank: { bankName: company.bankName, bankHolder: company.bankHolder, bankAccount: company.bankAccount, bankIfsc: company.bankIfsc, upiId: company.upiId },
        status: editId ? undefined : 'saved',
        paidAmount: 0,
        createdAt: new Date().toISOString()
      }
      if (editId) {
        const old = await db.invoices.get(editId)
        invoice.paidAmount = old?.paidAmount || 0
        invoice.status = old?.status || 'saved'
      }
      await db.invoices.put(invoice)
      await enqueue('invoice', editId ? 'update' : 'create', invoice)
      if (!editId) await nextBillNo(company.id, finalBillType)
      setSaving(true)
      navigate('#/invoice?id=' + invoice.id)
    } catch (e) {
      console.error('[GARUDA] save error:', e)
      setSaving(false)
      setErr('Bill save nahi hua: ' + (e && e.message ? e.message : e))
    }
  }

  if (!loaded) return <div className="screen"><div className="center">Loading…</div></div>

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate(editId ? '#/invoice?id=' + editId : '#/')}>‹</button>
        <div className="top-title">{editId ? 'Edit Bill' : 'New Bill'}</div>
      </header>

      <div className={`billtype-chip ${isKaccha ? 'bt-kaccha' : 'bt-gst'}`}>
        {isKaccha ? 'KACCHA BILL' : 'TAX INVOICE'} — <span className="ip-muted-light">{billType === 'kaccha' ? 'customer GSTIN nahi' : 'GST ' + (company?.gstRate ?? 18) + '%'}</span>
      </div>

      <section className="card">
        <div className="card-title">Customer</div>
        <select className="input" value={customerId} onChange={(e) => pickCustomer(e.target.value)}>
          <option value="">+ Naya customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.gstin ? ' (GST)' : ''}{c.mobile ? ' · ' + c.mobile : ''}</option>)}
        </select>
        <input className="input" placeholder="Naam *" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <div className="scope-bar">
          <button type="button" className={`chip ${!selectedCustomer && newGstin ? 'chip-active' : ''}`} onClick={() => setNewGstin('')} disabled={Boolean(selectedCustomer)}>Kaccha (bina GSTIN)</button>
          <button type="button" className={`chip ${!selectedCustomer && newGstin ? '' : 'chip-active'}`} onClick={() => setNewGstin(prompt('GSTIN daalo (15 digit)')?.toUpperCase() || newGstin)} disabled={Boolean(selectedCustomer)}>GST bill (GSTIN)</button>
        </div>
        <div className="ir-top">
          <input className="input" type="tel" placeholder="Mobile" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} />
          <input className="input" placeholder="GSTIN (GST bill ke liye)" value={newGstin} onChange={(e) => setNewGstin(e.target.value.toUpperCase())} disabled={Boolean(selectedCustomer)} />
        </div>
        {newGstin && newGstin.length === 15 && <div className="ip-muted">GSTIN bhara hai → naya customer GST bill wala banega.</div>}
        {selectedCustomer && <div className="ip-muted">Bill type customer se locked hai: {selectedCustomer.billType === 'gst' ? 'GST' : 'Kaccha'} — edit customer se nahi badlega.</div>}
      </section>

      <section className="card">
        <div className="card-title">Bill details</div>
        <div className="ir-top">
          <input className="input" placeholder="Bill number" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </section>

      <section className="card">
        <div className="card-title">Items</div>
        {rows.map((row) => (
          <div className="item-row" key={row.key}>
            <div className="ir-top">
              <input className="input ir-name" list="catalog-list" placeholder="Item name (catalog se chuno)" value={row.name} onChange={(e) => onNameChange(row.key, e.target.value)} />
              <select className="input ir-unit" value={row.unit} onChange={(e) => setRow(row.key, { unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="ir-bottom">
              <input className="input" inputMode="decimal" placeholder="Qty" value={row.qty || ''} onChange={(e) => setRow(row.key, { qty: e.target.value })} />
              <input className="input" inputMode="decimal" placeholder="Rate ₹" value={row.rate || ''} onChange={(e) => setRow(row.key, { rate: e.target.value })} />
              <input className="input" placeholder="HSN" value={row.hsn || ''} onChange={(e) => setRow(row.key, { hsn: e.target.value })} />
              <div className="ir-amt">{row.qty > 0 && row.rate > 0 ? '₹' + ((row.qty * row.rate).toLocaleString('en-IN')) : ''}</div>
              <button className="del" onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}><Icon name="x" size={16} /></button>
            </div>
          </div>
        ))}
        <datalist id="catalog-list">
          {catalog.map((c) => <option key={c.id} value={c.name} />)}
        </datalist>
        <div className="add-btns">
          <button className="chip chip-cement" onClick={() => addRow('cement')}>+ Cement</button>
          <button className="chip chip-steel" onClick={() => addRow('steel')}>+ Steel</button>
          <button className="chip chip-other" onClick={() => addRow('other')}>+ Item</button>
        </div>
      </section>

      <section className="card">
        <button className="card-title collapsible" onClick={() => setShowTr((s) => !s)}>
          Transport / Bhada (must-have) <Icon name={showTr ? 'chevronDown' : 'chevronRight'} size={15} />
        </button>
        {showTr && (
          <div className="tr-grid">
            <input className="input" placeholder="Vehicle no (MP20AB1234)" value={transport.vehicleNo || ''} onChange={(e) => setTransport({ ...transport, vehicleNo: e.target.value })} />
            <input className="input" placeholder="Driver name" value={transport.driverName || ''} onChange={(e) => setTransport({ ...transport, driverName: e.target.value })} />
            <input className="input" type="tel" placeholder="Driver mobile" value={transport.driverMobile || ''} onChange={(e) => setTransport({ ...transport, driverMobile: e.target.value })} />
            <input className="input" placeholder="Site / location" value={transport.site || ''} onChange={(e) => setTransport({ ...transport, site: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="Freight/Bhada ₹" value={transport.freight || ''} onChange={(e) => setTransport({ ...transport, freight: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="Loading ₹" value={transport.loading || ''} onChange={(e) => setTransport({ ...transport, loading: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="Unloading ₹" value={transport.unloading || ''} onChange={(e) => setTransport({ ...transport, unloading: e.target.value })} />
            <input className="input" placeholder="LR / challan no" value={transport.lrNo || ''} onChange={(e) => setTransport({ ...transport, lrNo: e.target.value })} />
          </div>
        )}
      </section>

      <section className="card">
        <div className="total-line"><span>Subtotal</span><span>₹{totals.subtotal.toLocaleString('en-IN')}</span></div>
        <div className="total-line"><span>Discount</span><input className="input inline" inputMode="decimal" value={discount || ''} onChange={(e) => setDiscount(e.target.value)} /></div>
        {isKaccha ? (
          <div className="total-line"><span>GST</span><span className="ip-muted">Kaccha — 0%</span></div>
        ) : totals.igst > 0 ? (
          <div className="total-line"><span>IGST ({totals.gstRate}%)</span><span>₹{totals.igst.toLocaleString('en-IN')}</span></div>
        ) : (
          <>
            <div className="total-line"><span>CGST ({totals.gstRate / 2}%)</span><span>₹{totals.cgst.toLocaleString('en-IN')}</span></div>
            <div className="total-line"><span>SGST ({totals.gstRate / 2}%)</span><span>₹{totals.sgst.toLocaleString('en-IN')}</span></div>
          </>
        )}
        {totals.freight > 0 && <div className="total-line"><span>Freight</span><span>₹{totals.freight.toLocaleString('en-IN')}</span></div>}
        {totals.loading > 0 && <div className="total-line"><span>Loading</span><span>₹{totals.loading.toLocaleString('en-IN')}</span></div>}
        {totals.unloading > 0 && <div className="total-line"><span>Unloading</span><span>₹{totals.unloading.toLocaleString('en-IN')}</span></div>}
        <div className="total-line grand"><span>GRAND TOTAL</span><span>₹{totals.grandTotal.toLocaleString('en-IN')}</span></div>
        {limitWarn && <div className="warn">{selectedCustomer.name} ka limit {inrFull(creditLimit)} hai — outstanding + ye bill usse zyada ho raha hai.</div>}
        {err && <div className="err">{err}</div>}
        {notice && <div className="status">{notice}</div>}
        <button className="primary big" disabled={saving} onClick={save}>{saving ? 'Saving…' : (editId ? 'Update Bill →' : 'Save Bill →')}</button>
      </section>

      <button className="fab" onClick={() => setVoiceOpen(true)}><Icon name="mic" size={22} /></button>
      {voiceOpen && <VoiceModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />}
    </div>
  )
}