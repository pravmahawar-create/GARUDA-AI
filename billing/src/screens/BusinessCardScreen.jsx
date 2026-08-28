import React, { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { navigate } from '../App'
import { db, getCompanies, getActiveCompany } from '../db'
import BusinessCardPreview from '../components/BusinessCardPreview'

export default function BusinessCardScreen() {
  const [active, setActive] = useState(null)
  const [layout, setLayout] = useState('classic')
  const [shareOpen, setShareOpen] = useState(false)
  const [link, setLink] = useState('')
  const [companies, setCompanies] = useState([])

  useEffect(() => {
    ;(async () => {
      const activeComp = await getActiveCompany()
      setActive(activeComp)
      const compList = await getCompanies()
      setCompanies(compList)
    })()
  }, [])

  const generateShareLink = () => {
    if (!active) return ''
    const { name, gstin, category, phone, email, website, address } = active
    const details = [
      `Company: ${name}`,
      gstin ? `GSTIN: ${gstin}` : '',
      category && `Category: ${category}`,
      phone && `Phone: ${phone}`,
      email && `Email: ${email}`,
      website && `Website: ${website}`,
      address && `Address: ${address}`
    ].filter(Boolean).join('\n')
    return `Powered by GARUDA • ${details}`
  }

  const handleShare = async () => {
    const text = generateShareLink()
    setShareOpen(true)
    try {
      await Share.share({ title: 'Business Card - ' + (active?.name || 'Company'), text, dialogTitle: 'Share Business Card' })
    } catch (e) {
      // Capacitor Share unavailable or cancelled
      if (!/cancel/i.test(e && e.message ? e.message : String(e))) {
        try { await navigator.clipboard.writeText(text) } catch (e2) { /* ignore */ }
      }
    }
    setTimeout(() => setShareOpen(false), 1500)
  }

  const downloadCard = () => {
    // Create a simple card image/PDF using the preview data
    // For now, show a link to the share functionality
    window.open(`/#/business-card`, '_blank')
  }

  if (!active) {
    return (
      <div className="screen">
        <div className="center" style={{ padding: 40, color: 'var(--muted)' }}>
          <div style={{ fontSize: 18, marginBottom: 16 }}>Select a company</div>
          <div style={{ marginBottom: 12 }}>
{companies.map((c) => (
              <div key={c.id} style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer', marginBottom: 8 }}
                onClick={() => setActive(c)}
              >
                <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}> - {c.gstin || 'no GSTIN'}</span>
              </div>
            ))}
          </div>
          <button className="primary" onClick={() => navigate('#/companies')}>Manage Companies</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Business Card</div>
      </header>

      <div style={{ padding: 20 }}>
        <BusinessCardPreview company={active} />

        <div style={{ margin: '24px 0', padding: '12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Current Layout</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{layout.charAt(0).toUpperCase() + layout.slice(1)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setLayout('classic')} style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 4, background: layout === 'classic' ? 'var(--gold)' : 'var(--surface)', color: layout === 'classic' ? 'var(--gold-ink)' : 'var(--steel)' }}>Classic</button>
            <button onClick={() => setLayout('modern')} style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 4, background: layout === 'modern' ? 'var(--gold-2)' : 'var(--surface)', color: layout === 'modern' ? 'var(--gold-ink)' : 'var(--steel)' }}>Modern</button>
            <button onClick={() => setLayout('minimal')} style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 4, background: layout === 'minimal' ? 'var(--bg)' : 'var(--surface)', color: layout === 'minimal' ? 'var(--steel)' : 'var(--steel)' }}>Minimal</button>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button className="primary big" onClick={handleShare}>
            Share / WhatsApp
          </button>
          <button className="ghost" onClick={downloadCard}>Download</button>
          <button className="ghost" onClick={() => navigate('#/companies')}>Back to Companies</button>
        </div>
        {shareOpen && <div className="status" style={{ marginTop: 8, textAlign: 'center' }}>Shared successfully!</div>}
        {link && <div className="status" style={{ marginTop: 8, textAlign: 'center' }}>Link: {link}</div>}
      </div>
    </div>
  )
}