import React from 'react'
import { Icon } from './Icon'

export default function BusinessCardPreview({ company }) {
  const name = company.name || 'Business'
  const category = company.category || 'Trading'
  const owner = company.ownerName || ''
  const gstin = company.gstin || ''
  const phone = company.phone || ''
  const whatsapp = company.whatsapp || ''
  const email = company.email || ''
  const website = company.website || ''
  const address = company.address || ''

  const layouts = [
    {
      name: 'Classic',
      bg: 'var(--surface)',
      textColor: 'var(--steel)',
      goldAccent: 'var(--gold)',
      showGold: true
    },
    {
      name: 'Modern',
      bg: 'var(--surface-2)',
      textColor: 'var(--muted)',
      goldAccent: 'var(--gold-2)',
      showGold: true
    },
    {
      name: 'Minimal',
      bg: 'var(--bg)',
      textColor: 'var(--steel)',
      goldAccent: '',
      showGold: false
    }
  ]

  const layout = layouts[0] // Default to Classic

  return (
    <div style={{ padding: 24, background: layout.bg, minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {layout.showGold && (
          <div style={{
            width: 60, height: 2, background: layout.goldAccent,
            margin: '0 auto 16px', borderRadius: 1
          }} />
        )}
        <div style={{ fontSize: 36, fontWeight: 800, color: layout.textColor, marginBottom: 8 }}>
          {name}
        </div>
        {category && (
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, letterSpacing: '2px' }}>
            {category}
          </div>
        )}
        {gstin && (
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, letterSpacing: '2px' }}>
            GSTIN: {gstin}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, color: layout.textColor }}>
          {phone && (
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: 4 }}>Phone</div>
              <div>{phone}</div>
            </div>
          )}
          {whatsapp && (
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: 4 }}>WhatsApp</div>
              <div>{whatsapp}</div>
            </div>
          )}
          {email && (
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: 4 }}>Email</div>
              <div>{email}</div>
            </div>
          )}
          {website && (
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: 4 }}>Website</div>
              <a href={website} target="_blank" rel="noopener" style={{ color: layout.goldAccent, textDecoration: 'none', fontSize: 13 }}>
                {website}
              </a>
            </div>
          )}
          {address && (
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: 4 }}>Address</div>
              <div>{address}</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', color: layout.goldAccent }}>
          <Icon name="share" size={20} />
          <Icon name="download" size={20} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 24, textAlign: 'center' }}>
          Powered by GARUDA
        </div>
      </div>
    </div>
  )
}