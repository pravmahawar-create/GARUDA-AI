import React, { useEffect, useState } from 'react'
import { db, enqueue } from '../db'
import { inrFull } from '../lib/money'
import { buildKhataPdf } from '../lib/pdf'
import { getCustomerHistory, getCustomerSummary } from '../lib/customerContext'
import { getLedger, getCustomerPayments, recordPayment, deletePayment, customerOutstanding } from '../lib/ledger'
import { navigate } from '../App'
import GstVerifyModal from '../components/GstVerifyModal'
import UpiQrModal from '../components/UpiQrModal'
import VoiceModal from '../components/VoiceModal'
import { Icon } from '../components/Icon'

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([])
  const [outstanding, setOutstanding] = useState({})
  const [gstOpen, setGstOpen] = useState(false)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(null)
  const [detail, setDetail] = useState(null)
  const [history, setHistory] = useState(null)
  const [summary, setSummary] = useState(null)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [billCustomer, setBillCustomer] = useState(null)
  const [ledgerRows, setLedgerRows] = useState([])
  const [payments, setPayments] = useState([])
  const [payModal, setPayModal] = useState(null)
  const [payMsg, setPayMsg] = useState('')
  const [upiOpen, setUpiOpen] = useState(false)
  const [upiAmount, setUpiAmount] = useState(0)
  const [company, setCompany] = useState(null)

  const openDetail = async (c) => {
    setDetail(c)
    const comps = await db.companies.toArray()
    setCompany(comps[0] || null)
    const [h, s] = await Promise.all([getCustomerHistory(c.id), getCustomerSummary(c.id)])
    setHistory(h)
    setSummary(s)
    setLedgerRows(await getLedger(c.id))
    setPayments(await getCustomerPayments(c.id))
  }

  const startBill = (c) => {
    setBillCustomer(c)
    setVoiceOpen(true)
  }

  const refreshDetail = async () => {
    if (!detail) return
    const [h, s] = await Promise.all([getCustomerHistory(detail.id), getCustomerSummary(detail.id)])
    setHistory(h)
    setSummary(s)
    setLedgerRows(await getLedger(detail.id))
    setPayments(await getCustomerPayments(detail.id))
  }

  const savePayment = async () => {
    const amt = Number(payModal.amount)
    if (!amt || amt <= 0) return setPayMsg('Amount sahi daalo')
    try {
      await recordPayment({ customerId: detail.id, invoiceId: '', amount: amt, date: '', mode: payModal.mode || 'Cash', note: '', companyId: '' })
      setPayModal(null); setPayMsg('')
      await refreshDetail()
    } catch (e) { setPayMsg('Payment nahi hua: ' + e.message) }
  }

  const removePayment = async (id) => {
    await deletePayment(id)
    await refreshDetail()
  }

  const showUpi = async () => {
    const out = await customerOutstanding(detail.id)
    setUpiAmount(Math.max(0, out))
    setUpiOpen(true)
  }

  const refresh = async () => {
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
  }

  useEffect(() => { refresh() }, [])

  const addQuick = () => setAdding({ name: '', mobile: '', gstin: '', billType: 'kaccha' })

  const saveNew = async (e) => {
    e.preventDefault()
    if (!adding.name.trim()) return
    const gstin = adding.gstin.trim().toUpperCase()
    const finalType = adding.billType
    if (finalType === 'gst' && !gstin) { setBusy('Error: GST bill ke liye GSTIN chahiye.'); return }
    if (gstin) {
      const dup = customers.find((c) => c.gstin === gstin)
      if (dup) { setBusy('Error: GSTIN ' + gstin + ' pehle se "' + dup.name + '" ke paas hai.'); return }
    }
    const cust = { id: 'c' + Date.now(), name: adding.name.trim(), mobile: adding.mobile.trim(), gstin, billType: finalType, address: '', creditLimit: 0, createdAt: new Date().toISOString() }
    await db.customers.put(cust)
    await enqueue('customer', 'create', cust)
    setAdding(null)
    setBusy('')
    await refresh()
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    let gstin = String(f.get('gstin') || '').trim().toUpperCase()
    if (editing.billType === 'gst') gstin = String(editing.gstin || '').trim().toUpperCase()
    if (gstin && gstin.length !== 15) {
      setBusy('Error: GSTIN 15 digit ka hona chahiye (' + gstin + ').')
      return
    }
    const data = {
      ...editing,
      name: String(f.get('name') || '').trim() || editing.name,
      mobile: String(f.get('mobile') || '').trim(),
      gstin,
      billType: gstin ? 'gst' : editing.billType,
      address: String(f.get('address') || '').trim(),
      creditLimit: Number(f.get('creditLimit')) || 0
    }
    if (data.gstin) {
      const dup = customers.find((c) => c.gstin === data.gstin && c.id !== editing.id)
      if (dup) { setBusy('Error: GSTIN ' + data.gstin + ' pehle se "' + dup.name + '" ke paas hai.'); return }
    }
    await db.customers.put(data)
    await enqueue('customer', 'update', data)
    setEditing(null)
    setBusy('')
    await refresh()
  }

  const doDelete = async () => {
    const c = deleting
    setDeleting(null)
    if (!c) return
    await db.customers.delete(c.id)
    await enqueue('customer', 'delete', { id: c.id, entity: 'customer' })
    await refresh()
  }

  const shareKhata = async (c) => {
    const company = (await db.companies.toArray())[0]
    const invs = await db.invoices.where('customerId').equals(c.id).toArray()
    const pays = await db.payments.where('customerId').equals(c.id).toArray()
    const bytes = await buildKhataPdf(c, invs, pays, company)
    const file = new File([new Blob([bytes], { type: 'application/pdf' })], `Khata-${c.name}.pdf`, { type: 'application/pdf' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Khata ' + c.name })
    else {
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = `Khata-${c.name}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const shown = customers.filter((c) => {
    const s = q.trim().toLowerCase()
    if (!s) return true
    return (c.name || '').toLowerCase().includes(s) || (c.mobile || '').includes(s) || (c.gstin || '').toLowerCase().includes(s)
  })

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Customers</div>
        <button className="mini-add" onClick={() => setGstOpen(true)}>GSTIN+</button>
        <button className="mini-add" onClick={addQuick}>+ Add</button>
      </header>

      <input className="input search-input" placeholder="Naam / mobile / GSTIN se dhundo" value={q} onChange={(e) => setQ(e.target.value)} />

      {detail && (
        <div className="screen">
          <header className="topbar backbar">
            <button className="back" onClick={() => { setDetail(null); setHistory(null); setSummary(null); refresh() }}>‹</button>
            <div className="top-title">{detail.name}</div>
            <button className="mini-add" onClick={() => startBill(detail)}><Icon name="mic" size={14} /> Bill Banaao</button>
          </header>
          {summary && (
            <div className="sm-summary" style={{ marginTop: 10 }}>
              <div className="sm-sum-item"><div className="sm-sum-v">{summary.bills}</div><div className="sm-sum-l">Bills</div></div>
              <div className="sm-sum-item"><div className="sm-sum-v">{inrFull(summary.sales)}</div><div className="sm-sum-l">Sales</div></div>
              <div className="sm-sum-item"><div className={`sm-sum-v ${summary.outstanding > 0 ? 'due' : ''}`}>{inrFull(summary.outstanding)}</div><div className="sm-sum-l">Outstanding</div></div>
            </div>
          )}
          <section className="card">
            <div className="card-title">Details</div>
            <div className="vc-item"><span>Mobile</span><span>{detail.mobile || '—'}</span></div>
            <div className="vc-item"><span>GSTIN</span><span>{detail.gstin || '—'}</span></div>
            <div className="vc-item"><span>Bill Type</span><span className={`billtype-badge ${detail.billType === 'gst' || detail.gstin ? 'bt-gst' : 'bt-kaccha'}`}>{detail.billType === 'gst' || detail.gstin ? 'GST' : 'Kaccha'}</span></div>
            <div className="vc-item"><span>Last Transaction</span><span>{summary && summary.lastDate ? summary.lastDate : '—'}</span></div>
            <div className="vc-item"><span>Credit Limit</span><span>{detail.creditLimit > 0 ? inrFull(detail.creditLimit) : '—'}</span></div>
          </section>

          <section className="card">
            <div className="card-title">Financial Summary</div>
            <div className="vc-item"><span>Total Billed</span><span>{inrFull(summary ? summary.sales : 0)}</span></div>
            <div className="vc-item"><span>Total Paid</span><span>{inrFull(summary ? summary.payments : 0)}</span></div>
            <div className="vc-item"><span>Outstanding</span><span className={summary && summary.outstanding > 0 ? 'num due' : 'num ok'}>{inrFull(summary ? summary.outstanding : 0)}</span></div>
            {payments.length > 0 && <div className="vc-item"><span>Last Payment</span><span>{payments[payments.length - 1].date} · {inrFull(payments[payments.length - 1].amount)} · {payments[payments.length - 1].mode}</span></div>}
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="primary" onClick={() => setPayModal({ amount: summary ? Math.max(0, summary.outstanding) : 0, mode: 'Cash' })}><Icon name="rupee" size={14} /> Receive Payment</button>
              <button className="btn" onClick={showUpi}><Icon name="file" size={14} /> Show UPI QR</button>
            </div>
          </section>

          <section className="card">
            <div className="card-title">Khata</div>
            {ledgerRows.length === 0 && <div className="empty-sub">Khata khali hai</div>}
            {ledgerRows.map((r, i) => (
              <div className="vc-item" key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                <span className="ip-muted">{r.date} · {r.type === 'bill' ? 'Bill ' + r.ref : r.ref}</span>
                <span>
                  <b className={r.type === 'bill' ? 'num due' : 'num ok'}>{r.type === 'bill' ? '+' : '−'}{inrFull(r.type === 'bill' ? r.debit : r.credit)}</b>
                  <div className="ip-muted">Balance {inrFull(r.balance)}</div>
                </span>
              </div>
            ))}
          </section>

          <section className="card">
            <div className="card-title">Payments</div>
            {payments.length === 0 && <div className="empty-sub">Abhi koi payment nahi</div>}
            {payments.slice().reverse().map((p) => (
              <div className="vc-item" key={p.id}>
                <span>{p.date} · {p.mode}{p.note ? ' · ' + p.note : ''}</span>
                <span className="num ok">{inrFull(p.amount)} <button className="del" onClick={() => removePayment(p.id)} title="Delete"><Icon name="trash" size={14} /></button></span>
              </div>
            ))}
          </section>
          {history && history.recentItems.length > 0 && (
            <section className="card">
              <div className="card-title">Recent Items</div>
              {history.recentItems.slice(0, 5).map((it, i) => (
                <div className="vc-item" key={i}>
                  <span>{it.name}</span>
                  <span className="ip-muted">{it.date} · {it.qty} {it.unit} × ₹{it.rate}</span>
                </div>
              ))}
            </section>
          )}
          {history && history.recentBills.length > 0 && (
            <section className="card">
              <div className="card-title">Recent Bills</div>
              {history.recentBills.slice(0, 8).map((inv) => (
                <div className="rec-row" key={inv.id} onClick={() => navigate('#/invoice?id=' + inv.id)}>
                  <div className="rec-left">
                    <div className="rec-name">#{inv.invoiceNo} — {inrFull(inv.totals?.grandTotal || 0)}</div>
                    <div className="rec-meta">{inv.date} · <span className={`billtype-badge ${inv.billType === 'gst' ? 'bt-gst' : 'bt-kaccha'}`}>{inv.billType === 'gst' ? 'GST' : 'KACCHA'}</span></div>
                  </div>
                  <Icon name="chevronRight" size={16} />
                </div>
              ))}
            </section>
          )}
          {!history || (history.recentBills.length === 0 && (
            <div className="empty" style={{ marginTop: 10 }}>
              <div className="empty-title">No transactions yet</div>
              <div className="empty-sub" style={{ marginBottom: 10 }}>Is customer ka abhi koi bill nahi hai.</div>
              <button className="btn btn-big" onClick={() => startBill(detail)}><Icon name="mic" size={15} /> Bill Banaao</button>
            </div>
          ))}
        </div>
      )}

      {!detail && shown.length === 0 && (
        <div className="empty">
          <div className="empty-sigil"><Icon name="users" size={44} /></div>
          <div className="empty-title">Abhi koi customer nahi</div>
          <div className="empty-sub">Pehla bill banate hi customer apne aap bane jaayenge.</div>
        </div>
      )}
      {shown.map((c) => {
        const o = outstanding[c.id]
        return (
          <div className="card cust-row" key={c.id} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }}>
            <div style={{ minWidth: 0 }}>
              <div className="cust-name">{c.name}
                <span className={`billtype-badge ${(c.billType === 'gst' || c.gstin) ? 'bt-gst' : 'bt-kaccha'}`} style={{ marginLeft: 6 }}>{c.billType === 'gst' || c.gstin ? 'GST' : 'KACCHA'}</span>
                {c.creditLimit > 0 && <span className="billtype-badge bt-gst" style={{ marginLeft: 4 }}>LIMIT</span>}
              </div>
              {c.mobile && <div className="ip-muted">{c.mobile}</div>}
              {c.gstin && <div className="ip-muted">GSTIN: {c.gstin}</div>}
            </div>
            <div className="cust-right">
              <div className={`cust-bal ${o && o.balance > 0 ? 'due' : 'clear'}`}>
                {o ? inrFull(o.balance) : '₹0'}
                <div className="ip-muted">{o && o.balance > 0 ? 'baki' : 'clear'}</div>
              </div>
              <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); shareKhata(c) }}><Icon name="book" size={15} /> Khata</button>
                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setEditing(c) }}><Icon name="edit" size={15} /></button>
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); setDeleting(c) }}><Icon name="trash" size={15} /></button>
              </div>
            </div>
          </div>
        )
      })}

      {editing && (
        <div className="modal-mask" onClick={() => setEditing(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={saveEdit}>
            <div className="modal-title">Edit Customer</div>
            <div className="scope-bar" style={{ marginBottom: 8 }}>
              <span className={`chip ${editing.billType === 'gst' ? 'chip-active' : ''}`}>GST</span>
              <span className={`chip ${editing.billType !== 'gst' ? 'chip-active' : ''}`}>Kaccha</span>
            </div>
            <div className="ip-muted" style={{ marginBottom: 8 }}>Bill type add ke waqt set hua tha — GSTIN dalne par GST ban jayega.</div>
            <label className="form-label">Naam <input className="input" name="name" defaultValue={editing.name} /></label>
            <label className="form-label">Mobile <input className="input" name="mobile" defaultValue={editing.mobile} /></label>
            {editing.billType === 'gst' && <label className="form-label">GSTIN <input className="input" name="gstin" defaultValue={editing.gstin} disabled /></label>}
            {editing.billType !== 'gst' && (
              <>
                <label className="form-label">GSTIN (daloge to GST/pakka ban jayega) <input className="input" name="gstin" placeholder="15 digit GSTIN" /></label>
                <div className="ip-muted">Abhi kaccha hai — GSTIN bhar kar save karoge to ye customer GST (pakka) ban jayega. GST wale se wapas kaccha nahi hota.</div>
              </>
            )}
            <label className="form-label">Address <input className="input" name="address" defaultValue={editing.address} /></label>
            <label className="form-label">Credit limit (₹) — 0 = no limit <input className="input" inputMode="numeric" name="creditLimit" defaultValue={editing.creditLimit || 0} /></label>
            {busy && <div className="err">{busy}</div>}
            <div className="row-actions">
              <button className="btn">Save</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {adding && (
        <div className="modal-mask" onClick={() => { setAdding(null); setBusy('') }}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={saveNew}>
            <div className="modal-title">Naya Customer</div>
            <label className="form-label">Naam <input className="input" name="name" autoFocus value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} /></label>
            <label className="form-label">Mobile <input className="input" type="tel" name="mobile" value={adding.mobile} onChange={(e) => setAdding({ ...adding, mobile: e.target.value })} /></label>
            <div className="scope-bar" style={{ marginBottom: 8 }}>
              <button type="button" className={`chip ${adding.billType === 'kaccha' ? 'chip-active' : ''}`} onClick={() => setAdding({ ...adding, billType: 'kaccha', gstin: '' })}>Kaccha (bina GSTIN)</button>
              <button type="button" className={`chip ${adding.billType === 'gst' ? 'chip-active' : ''}`} onClick={() => setAdding({ ...adding, billType: 'gst' })}>GST bill</button>
            </div>
            {adding.billType === 'gst' && (
              <>
                <label className="form-label">GSTIN (15 digit) <input className="input" name="gstin" value={adding.gstin} onChange={(e) => setAdding({ ...adding, gstin: e.target.value.toUpperCase() })} /></label>
                <div className="ip-muted">GST bill wala customer banega — baad me GSTIN lock rahega.</div>
              </>
            )}
            {busy && <div className="err">{busy}</div>}
            <div className="row-actions">
              <button className="btn">Save</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setAdding(null); setBusy('') }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="modal-mask" onClick={() => setDeleting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Customer delete karein?</div>
            <div className="ip-muted" style={{ margin: '6px 0' }}>"{deleting.name}" ka record hat jayega. Unke purane bills list mein rahenge (sirf customer record delete hota hai).</div>
            {outstanding[deleting.id] && outstanding[deleting.id].balance > 0 && (
              <div className="err">Is customer ka baki hai: {inrFull(outstanding[deleting.id].balance)} — pehle payment le lena behtar hoga.</div>
            )}
            <div className="row-actions">
              <button className="btn btn-danger" onClick={doDelete}><Icon name="trash" size={15} /> Delete</button>
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {gstOpen && <GstVerifyModal open={gstOpen} onClose={() => setGstOpen(false)} />}

      {voiceOpen && (
        <VoiceModal
          open={voiceOpen}
          onClose={() => {
            setVoiceOpen(false)
            setBillCustomer(null)
            if (detail) refreshDetail()
            else refresh()
          }}
          initialCustomer={billCustomer}
        />
      )}

      {payModal && (
        <div className="modal-mask" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Receive Payment — {detail.name}</div>
            <div className="ip-muted" style={{ margin: '6px 0 10px' }}>Outstanding: {inrFull(summary ? summary.outstanding : 0)}</div>
            <label className="form-label">Amount ₹ <input className="input" inputMode="decimal" value={payModal.amount} onChange={(e) => setPayModal({ ...payModal, amount: e.target.value })} /></label>
            <label className="form-label">Mode</label>
            <select className="input" value={payModal.mode} onChange={(e) => setPayModal({ ...payModal, mode: e.target.value })}>
              {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {payMsg && <div className="err">{payMsg}</div>}
            <div className="row-actions">
              <button className="btn" onClick={savePayment}>Save Payment</button>
              <button className="btn btn-ghost" onClick={() => { setPayModal(null); setPayMsg('') }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {upiOpen && <UpiQrModal open={upiOpen} onClose={() => setUpiOpen(false)} company={company} amount={upiAmount} ref={'Cust-' + detail.id} />}
    </div>
  )
}