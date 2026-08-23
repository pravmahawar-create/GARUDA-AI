import React, { useEffect, useState } from 'react'
import { navigate } from '../App'
import { db, getCompanies, getActiveCompany, setActiveCompany } from '../db'
import { syncNow } from '../lib/sync'
import VoiceModal from '../components/VoiceModal'
import GarudaSigil from '../components/GarudaSigil'
import { Icon } from '../components/Icon'
import CompanyLogo from '../components/CompanyLogo'

const COMMANDS = [
  { id: 'customers', label: 'Customers / Khata', sub: 'Baki, khata, GSTIN', icon: 'book' },
  { id: 'payments', label: 'Payments', sub: 'Rupaye lena', icon: 'rupee' },
  { id: 'invoices', label: 'Invoices', sub: 'Purane bills', icon: 'list' },
  { id: 'stock', label: 'Stock / Rates', sub: 'Cement · steel · rate list', icon: 'stack' },
  { id: 'transport', label: 'Transport', sub: 'Deliveries, vehicle, LR', icon: 'truck' },
  { id: 'reports', label: 'Reports', sub: 'Bechna, baki, GST', icon: 'chart' },
  { id: 'import', label: 'Import', sub: 'Photo / PDF se', icon: 'scan' }
]

const MORE = [
  { id: 'companies', label: 'Companies', icon: 'gear' },
  { id: 'settings', label: 'Settings', icon: 'cog' },
  { id: 'business-card', label: 'Business Card', icon: 'file' }
]

export default function HomeScreen() {
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [companies, setCompanies] = useState([])
  const [active, setActive] = useState(null)
  const [picker, setPicker] = useState(false)
  const [syncBadge, setSyncBadge] = useState('')
  const [kpi, setKpi] = useState(null)

  useEffect(() => {
    ;(async () => {
      const comps = await getCompanies()
      const act = await getActiveCompany()
      setCompanies(comps)
      setActive(act)

      const invoices = (await db.invoices.toArray()).filter((i) => !i.companyId || i.companyId === act.id)
      const payments = await db.payments.toArray()
      const today = new Date().toISOString().slice(0, 10)
      const live = invoices.filter((i) => i.status !== 'cancelled')
      const todaySales = live.filter((i) => i.date === today).reduce((s, i) => s + i.totals.grandTotal, 0)
      const billed = live.reduce((s, i) => s + i.totals.grandTotal, 0)
      const custIds = new Set(live.map((i) => i.customerId))
      const paid = payments.filter((p) => custIds.has(p.customerId)).reduce((s, p) => s + p.amount, 0)
      setKpi({
        todaySales,
        collection: paid,
        outstanding: Math.max(0, billed - paid),
        bills: live.length
      })

      const s = await syncNow()
      setSyncBadge(s.ok ? (s.pushed ? `Synced ${s.pushed}` : 'In sync') : `Pending ${s.queued}`)
    })()
  }, [])

  const switchTo = async (id) => {
    await setActiveCompany(id)
    setActive(await getActiveCompany())
    setPicker(false)
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

  return (
    <div className="screen">
      <section className="home-hero">
        <div className="hero-identity">
          <CompanyLogo company={active} size={56} />
          <div className="hero-info">
            {active ? (
              <>
                <h1 className="hero-name">{active.name}</h1>
                {active.category && <div className="hero-category">{active.category}</div>}
                <div className="hero-gstin">
                  {active.gstin ? `GSTIN: ${active.gstin}` : 'GSTIN not set'}
                </div>
              </>
            ) : (
              <>
                <h1 className="hero-name">Set up a company</h1>
                <div className="hero-category">to begin billing</div>
              </>
            )}
          </div>
        </div>
        <button className="hero-company-switch" onClick={() => setPicker(true)} aria-label="Switch company">
          <Icon name="chevronDown" size={18} />
        </button>
      </section>

      {kpi && (
        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-v num">{formatINR(kpi.todaySales)}</div>
            <div className="kpi-l">Today's Sales</div>
          </div>
          <div className="kpi">
            <div className="kpi-v ok num">{formatINR(kpi.collection)}</div>
            <div className="kpi-l">Collection</div>
          </div>
          <div className="kpi">
            <div className={`kpi-v ${kpi.outstanding > 0 ? 'due' : 'ok'} num`}>{formatINR(kpi.outstanding)}</div>
            <div className="kpi-l">Outstanding</div>
          </div>
          <div className="kpi">
            <div className="kpi-v num">{kpi.bills}</div>
            <div className="kpi-l">Bills</div>
          </div>
        </div>
      )}

      <button className="bill-cta" onClick={() => navigate('#/bill')}>
        <span className="bill-cta-icon"><Icon name="plus" size={26} strokeWidth={2.4} /></span>
        <span>
          <span className="bill-cta-label">CREATE BILL</span>
          <span className="bill-cta-sub">Naya bill / invoice banao</span>
        </span>
        <Icon name="chevronRight" size={20} style={{ marginLeft: 'auto', opacity: .7 }} />
      </button>

      <button className="voice-card" onClick={() => setVoiceOpen(true)}>
        <span className="voice-card-icon"><Icon name="mic" size={20} /></span>
        <span>
          <span className="voice-card-label">VOICE BILLING</span>
          <span className="voice-card-hint">"3 bag cement, 2 sariya…"</span>
        </span>
        <Icon name="chevronRight" size={16} style={{ marginLeft: 'auto', opacity: .5 }} />
      </button>

      <div className="sec-title">Workspace</div>
      <div className="cmd-list">
        {COMMANDS.map((c) => (
          <button key={c.id} className="cmd" onClick={() => navigate('#/' + c.id)}>
            <span className="cmd-icon"><Icon name={c.icon} size={19} /></span>
            <span>
              <span className="cmd-label">{c.label}</span>
              <span className="cmd-sub">{c.sub}</span>
            </span>
            <span className="cmd-arrow"><Icon name="chevronRight" size={17} /></span>
          </button>
        ))}
      </div>

      <div className="sec-title" style={{ marginTop: 16 }}>System</div>
      <div className="cmd-list">
        {MORE.map((c) => (
          <button key={c.id} className="cmd" onClick={() => navigate('#/' + c.id)}>
            <span className="cmd-icon"><Icon name={c.icon} size={19} /></span>
            <span><span className="cmd-label">{c.label}</span></span>
            <span className="cmd-arrow"><Icon name="chevronRight" size={17} /></span>
          </button>
        ))}
      </div>

      {picker && (
        <div className="sheet" onClick={() => setPicker(false)}>
          <div className="sheet-inner" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">Select company</div>
            {companies.map((c) => (
              <button key={c.id} className={`sheet-row ${c.id === active?.id ? 'sheet-row-active' : ''}`} onClick={() => switchTo(c.id)}>
                <CompanyLogo company={c} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  <div className="ip-muted" style={{ fontSize: 12 }}>{c.gstin || 'no GSTIN'}</div>
                </div>
                {c.id === active?.id && <Icon name="check" size={18} style={{ color: 'var(--gold)' }} />}
              </button>
            ))}
            <button className="btn btn-block" onClick={() => { setPicker(false); navigate('#/companies') }}>+ Manage companies</button>
          </div>
        </div>
      )}

      {voiceOpen && <VoiceModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />}
    </div>
  )
}