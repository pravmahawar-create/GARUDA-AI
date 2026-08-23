import React, { useEffect, useState } from 'react'
import { db, enqueue } from '../db'
import { buildInvoicePdf, buildKhataPdf } from '../lib/pdf'
import { inrFull } from '../lib/money'
import { upiQrDataUrl } from '../lib/upi'
import InvoicePaper from '../components/InvoicePaper'
import { navigate } from '../App'
import { Icon } from '../components/Icon'

const dataUrlToBlob = (url) => fetch(url).then((r) => r.blob())

export default function InvoicePreviewScreen() {
  const id = new URLSearchParams(window.location.hash.split('?')[1] || '').get('id')
  const [invoice, setInvoice] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [company, setCompany] = useState(null)
  const [status, setStatus] = useState('')
  const [deleteChoice, setDeleteChoice] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const reload = async () => {
    const inv = await db.invoices.get(id)
    setInvoice(inv)
    if (!inv) return
    setCustomer(await db.customers.get(inv.customerId))
    const comp = await db.companies.get(inv.companyId)
    setCompany(comp || {
      id: inv.companyId,
      name: inv.companyName || 'Company',
      gstin: '',
      address: '',
      phone: '',
      gstRate: inv.totals?.gstRate ?? 18,
      templateId: inv.templateId || 'classic',
      ...(inv.bank || {})
    })
  }

  useEffect(() => { reload() }, [id])

  if (!invoice || !company) return <div className="screen"><div className="center">Loading…</div></div>

  const t = invoice.totals || {}
  const isKaccha = invoice.billType === 'kaccha'
  const paid = Number(invoice.paidAmount || 0)
  const balance = Math.max(0, Number(t.grandTotal || 0) - paid)

  const shareFile = async (file) => {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: file.name })
    } else {
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const sharePdf = async () => {
    setStatus('Generating PDF…')
    try {
      const bytes = await buildInvoicePdf(invoice, company, customer, invoice.templateId)
      const file = new File([new Blob([bytes], { type: 'application/pdf' })], `Invoice-${invoice.invoiceNo}.pdf`, { type: 'application/pdf' })
      await shareFile(file)
      setStatus('Done')
    } catch (e) {
      setStatus('Share cancel hua / error: ' + e.message)
    }
  }

  const shareKhata = async () => {
    setStatus('Khata PDF bana raha hoon…')
    try {
      const invs = await db.invoices.where('customerId').equals(invoice.customerId).toArray()
      const pays = await db.payments.where('customerId').equals(invoice.customerId).toArray()
      const bytes = await buildKhataPdf(customer, invs, pays, company)
      const file = new File([new Blob([bytes], { type: 'application/pdf' })], `Khata-${customer?.name || 'customer'}.pdf`, { type: 'application/pdf' })
      await shareFile(file)
      setStatus('Khata share ho gaya')
    } catch (e) {
      setStatus('Error: ' + e.message)
    }
  }

  const shareReminder = async () => {
    try {
      const text = `Namaste ${invoice.customerName} ji,\nAapka baki: ${inrFull(balance)} (Invoice #${invoice.invoiceNo}, ${invoice.date})\nKripya jaldi bhej dijiye. Dhanyavaad!\n${company?.name || ''}`
      if (company?.upiId) {
        const qr = await upiQrDataUrl(company, balance, 'Baki-' + invoice.invoiceNo)
        if (qr) {
          const blob = await dataUrlToBlob(qr)
          const file = new File([blob], 'upi-qr.png', { type: 'image/png' })
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text, title: 'Baki reminder' })
            return
          }
        }
      }
      const wa = 'https://wa.me/?text=' + encodeURIComponent(text)
      window.open(wa, '_blank')
    } catch (e) {
      setStatus('Error: ' + e.message)
    }
  }

  const doDelete = async (mode) => {
    setDeleteChoice(false)
    setStatus('…')
    if (mode === 'cancel') {
      invoice.status = 'cancelled'
      await db.invoices.put(invoice)
      await enqueue('invoice', 'update', invoice)
      setStatus('Bill cancel ho gaya (audit ke liye rakha hai).')
      await reload()
    } else {
      await db.invoices.delete(id)
      await enqueue('invoice', 'delete', { id, entity: 'invoice' })
      navigate('#/invoices')
    }
  }

  const duplicate = async () => {
    const d = { ...invoice }
    delete d.id
    navigate('#/bill?copy=' + id)
  }

  const paidStr = paid > 0 ? 'Paid ' + inrFull(paid) : ''
  const balStr = balance > 0 ? 'Baki ' + inrFull(balance) : 'Clear'

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/invoices')}>‹</button>
        <div className="top-title">{isKaccha ? 'Kaccha Bill' : 'Invoice'} #{invoice.invoiceNo}</div>
      </header>

      <div className="invoice-paper">
        <InvoicePaper invoice={invoice} company={company} customer={customer} />
      </div>

      <div className="card pay-card">
        <div className="pay-row">
          <span className="pay-total">{inrFull(t.grandTotal)}</span>
          <span className={`pay-bal ${balance > 0 ? 'due' : 'clear'}`}>{balStr}</span>
        </div>
        {paidStr && <div className="ip-muted">{paidStr}</div>}
        {balance > 0 && <button className="btn btn-sm" onClick={() => navigate('#/payments?customer=' + invoice.customerId + '&amount=' + balance)}><Icon name="wallet" size={14} /> Collect {inrFull(balance)}</button>}
      </div>

      {!company?.upiId && !company?.bankAccount && (
        <div className="card warn" style={{ margin: '10px 0' }}>
          <b>QR / bank bill par nahi dikh raha</b> — Companies mein apni company ke "Payment details" mein UPI ID ya bank account daalo. Iske baad QR + bank info automatically har bill (screen + PDF) par aa jayegi.
          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('#/companies')}><Icon name="cog" size={14} /> Payment details set karo</button>
        </div>
      )}

      <div className="actions">
        <button className="primary big" onClick={sharePdf}><Icon name="share" size={15} /> Share / WhatsApp PDF</button>
        <button className="btn" onClick={shareKhata}><Icon name="book" size={14} /> Khata (statement) PDF</button>
        <button className="btn" onClick={shareReminder} disabled={balance <= 0}><Icon name="bell" size={14} /> Baki reminder ({balance > 0 ? 'UPI QR' : 'nahi'})</button>
      </div>

      {invoice.status !== 'cancelled' && (
        <div className="row-actions">
          <button className="btn btn-sm" onClick={() => navigate('#/bill?id=' + id)}><Icon name="edit" size={14} /> Edit bill</button>
          <button className="btn btn-sm" onClick={duplicate}><Icon name="copy" size={14} /> Copy as new</button>
          <button className="btn btn-sm btn-danger" onClick={() => setDeleteChoice(true)}><Icon name="trash" size={14} /> Delete</button>
        </div>
      )}

      {deleteChoice && (
        <div className="modal-mask" onClick={() => setDeleteChoice(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Bill #{invoice.invoiceNo} ka kya karein?</div>
            <div className="row-actions">
              <button className="btn" onClick={() => doDelete('cancel')}><Icon name="ban" size={14} /> Cancel (soft) — audit ke liye rakhega</button>
              <button className="btn btn-danger" onClick={() => doDelete('hard')}><Icon name="trash" size={14} /> Delete permanently</button>
              <button className="btn btn-ghost" onClick={() => setDeleteChoice(false)}>Bahut hua, band</button>
            </div>
          </div>
        </div>
      )}
      {status && <div className="status">{status}</div>}
    </div>
  )
}