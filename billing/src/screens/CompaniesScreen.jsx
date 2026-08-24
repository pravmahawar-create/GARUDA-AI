import React, { useEffect, useState, useRef } from 'react'
import { getCompanies, saveCompany, deleteCompany, setActiveCompany, getActiveCompany, enqueue } from '../db'
import { validateGstin, gstStateCode } from '../lib/gst'
import { TEMPLATES } from '../lib/templates'
import { navigate } from '../App'
import { Icon } from '../components/Icon'
import CompanyLogo from '../components/CompanyLogo'

const tplName = (id) => (TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]).name

export default function CompaniesScreen() {
  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [logoData, setLogoData] = useState('')
  const logoInputRef = useRef(null)

  useEffect(() => {
    if (editing) setLogoData(editing.logo || '')
  }, [editing])

  const refresh = async () => {
    const cs = await getCompanies()
    const active = await getActiveCompany()
    setList(cs)
    setActiveId(active.id)
  }

  useEffect(() => { refresh() }, [])

  const switchCompany = async (id) => {
    await setActiveCompany(id)
    setActiveId(id)
    setMsg('Active company changed — saare screens ab is company ke liye hain.')
  }

  const remove = async (c) => {
    if (!confirm('Delete company "' + c.name + '"? Existing bills ke saath rahenge.')) return
    const ok = await deleteCompany(c.id)
    if (ok) { await refresh(); setMsg('Company deleted.') }
    else setMsg('At least one company needed.')
  }

  const onLogoFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 800 * 1024) { setMsg('Logo 800KB se bada hai — chhota image chune.'); return }
    const reader = new FileReader()
    reader.onload = () => setLogoData(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const save = async (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const data = {
      id: editing?.id,
      name: String(f.get('name') || '').trim() || '',
      category: String(f.get('category') || '').trim() || '',
      logo: String(logoData || '').trim(),
      ownerName: String(f.get('ownerName') || '').trim(),
      website: String(f.get('website') || '').trim(),
      whatsapp: String(f.get('whatsapp') || '').trim(),
      email: String(f.get('email') || '').trim().toLowerCase(),
      gstin: String(f.get('gstin') || '').trim().toUpperCase(),
      address: String(f.get('address') || '').trim(),
      phone: String(f.get('phone') || '').trim(),
      gstRate: Number(f.get('gstRate')) || 18,
      templateId: editing?.templateId || 'classic',
      bankName: String(f.get('bankName') || '').trim(),
      bankHolder: String(f.get('bankHolder') || '').trim(),
      bankAccount: String(f.get('bankAccount') || '').trim(),
      bankIfsc: String(f.get('bankIfsc') || '').trim().toUpperCase(),
      upiId: String(f.get('upiId') || '').trim()
    }
    if (data.gstin && !validateGstin(data.gstin)) {
      setMsg('GSTIN checksum galat hai. Dobara check karo.')
      return
    }
    setSaving(true)
    const saved = await saveCompany(data)
    setSaving(false)
    setEditing(null)
    await enqueue('company', 'create', saved)
    await refresh()
    if (saved.gstin) setMsg('Company saved. GSTIN checksum valid (' + gstStateCode(saved.gstin) + ').')
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/settings')}>‹</button>
        <div className="top-title">{list.some((c) => !c.name) ? 'Set up your business' : 'Business Profile'}</div>
      </header>
      {msg && <div className="chip chip-ok" style={{ margin: '4px 2px' }}>{msg}</div>}
      {list.some((c) => !c.name) && (
        <div className="setup-card">
          <div className="setup-card-text">
            <div className="setup-card-title">Welcome — let's set up your business</div>
            <div className="setup-card-sub">Enter your business name, GSTIN (optional) and contact details. You can start billing even before setting GSTIN.</div>
          </div>
        </div>
      )}
      {list.map((c) => (
        <div className="card" key={c.id}>
          <div className="card-title">
            <span>{c.name} {c.id === activeId && <span className="chip chip-active">Active</span>}</span>
            <button className="chip chip-other" onClick={() => switchCompany(c.id)}>Switch</button>
          </div>
          <div className="detail-grid">
            <div><span>Category</span><b>{c.category || '—'}</b></div>
            <div><span>GSTIN</span><b>{c.gstin || '—'}</b></div>
            <div><span>GST Rate</span><b>{c.gstRate}%</b></div>
            <div><span>Template</span><b>{tplName(c.templateId)}</b></div>
            <div><span>Next GST bill</span><b>#{c.nextInvoiceNo}</b></div>
            <div><span>Next kaccha</span><b>#{c.nextKacchaNo}</b></div>
            {c.logo && <div><span>Logo</span><b>URL loaded</b></div>}
            {c.ownerName && <div><span>Owner</span><b>{c.ownerName}</b></div>}
            {c.website && <div><span>Website</span><b>{c.website}</b></div>}
            {c.whatsapp && <div><span>WhatsApp</span><b>{c.whatsapp}</b></div>}
            {c.email && <div><span>Email</span><b>{c.email}</b></div>}
            {c.address && <div><span>Address</span><b>{c.address}</b></div>}
            {c.phone && <div><span>Phone</span><b>{c.phone}</b></div>}
            {c.upiId && <div><span>UPI</span><b>{c.upiId}</b></div>}
            {(c.bankName || c.bankAccount) && <div><span>Bank</span><b>{c.bankName || ''} {c.bankAccount ? '· ' + c.bankAccount : ''}</b></div>}
          </div>
          <div className="row-actions">
            <button className="btn btn-sm" onClick={() => setEditing(c)}>Edit</button>
            <button className="btn btn-sm" onClick={() => navigate('#/templates?company=' + encodeURIComponent(c.id))}>Template</button>
            <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>Delete</button>
          </div>
        </div>
      ))}

      {editing ? (
        <form className="card form" onSubmit={save}>
          <div className="card-title"><span>{editing.id ? 'Edit Company' : 'New Company'}</span></div>
          <div className="form-label">Company Logo</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <CompanyLogo company={{ name: editing.name || 'Company', logo: logoData }} size={64} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm" onClick={() => logoInputRef.current && logoInputRef.current.click()}><Icon name="upload" size={12} /> {logoData ? 'Change Logo' : 'Add Logo'}</button>
              {logoData && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLogoData('')}>Remove</button>}
              <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onLogoFile} />
            </div>
          </div>
          <div className="ip-muted" style={{ fontSize: 11, marginBottom: 10 }}>Logo dashboard par dikhega. 800KB tak, phone gallery se chune.</div>
          <div className="form-label">Name *</div>
          <input name="name" defaultValue={editing.name} required className="input" />
          <div className="form-label">Category</div>
          <input name="category" defaultValue={editing.category} placeholder="e.g. Hardware · Steel · Cement" className="input" />
          <div className="form-label">Owner Name</div>
          <input name="ownerName" defaultValue={editing.ownerName} className="input" />
          <div className="form-label">Website</div>
          <input name="website" defaultValue={editing.website} placeholder="https://example.com" className="input" />
          <div className="form-label">WhatsApp</div>
          <input name="whatsapp" defaultValue={editing.whatsapp} placeholder="+91 98765 43210" className="input" />
          <div className="form-label">Email</div>
          <input name="email" defaultValue={editing.email} placeholder="info@example.com" className="input" />
          <div className="form-label">GSTIN</div>
          <input name="gstin" defaultValue={editing.gstin} placeholder="23AABCA0000A1Z5" className="input" />
          <div className="form-label">Address</div>
          <input name="address" defaultValue={editing.address} className="input" />
          <div className="form-label">Phone</div>
          <input name="phone" defaultValue={editing.phone} className="input" />
          <div className="form-label">Default GST %</div>
          <select name="gstRate" defaultValue={editing.gstRate} className="input">
            {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
          </select>
          <div className="card-title" style={{ marginTop: 10, marginBottom: 6, fontSize: 12, color: 'var(--muted)' }}><Icon name="creditCard" size={15} /> Payment details (bill + QR par dikhega)</div>
          <div className="form-label">UPI ID (QR isi se banega)</div>
          <input name="upiId" defaultValue={editing.upiId || ''} placeholder="yourname@bank" className="input" />
          <div className="ip-muted">UPI + bank daalo to har bill (screen aur PDF) par QR aur bank details automatically aa jayega.</div>
          <div className="form-label">Account holder</div>
          <input name="bankHolder" defaultValue={editing.bankHolder || ''} className="input" />
          <div className="form-label">Bank name</div>
          <input name="bankName" defaultValue={editing.bankName || ''} className="input" />
          <div className="form-label">Account no</div>
          <input name="bankAccount" defaultValue={editing.bankAccount || ''} className="input" />
          <div className="form-label">IFSC</div>
          <input name="bankIfsc" defaultValue={editing.bankIfsc || ''} placeholder="SBIN0001234" className="input" />
          <div className="row-actions">
            <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-block" onClick={() => setEditing({ gstRate: 18 })}>+ Add company</button>
      )}
    </div>
  )
}