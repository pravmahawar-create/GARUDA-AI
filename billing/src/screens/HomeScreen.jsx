import React, { useState } from 'react'
import { navigate } from '../App'
import VoiceModal from '../components/VoiceModal'

const actions = [
  { id: 'bill', label: 'NEW BILL', sub: 'Naya bill banao', icon: '🧾', primary: true },
  { id: 'customers', label: 'CUSTOMERS', sub: 'Khata / baki', icon: '👥' },
  { id: 'invoices', label: 'INVOICES', sub: 'Purane bills', icon: '📄' },
  { id: 'payments', label: 'PAYMENTS', sub: 'Rupaye lena', icon: '💰' },
  { id: 'transport', label: 'TRANSPORT', sub: 'Deliveries', icon: '🚛' },
  { id: 'stock', label: 'STOCK', sub: 'Rate list', icon: '🏗️' },
  { id: 'reports', label: 'REPORTS', sub: 'Bechna / baki', icon: '📊' },
  { id: 'import', label: 'IMPORT', sub: 'Photo/PDF se', icon: '📷' },
  { id: 'settings', label: 'SETTINGS', sub: 'Shop / passcode', icon: '⚙️' }
]

export default function HomeScreen() {
  const [voiceOpen, setVoiceOpen] = useState(false)
  return (
    <div className="screen home">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">₹</span>
          <div>
            <div className="brand-name">Garuda Billing</div>
            <div className="brand-sub">Loha • Cement • Transport</div>
          </div>
        </div>
      </header>

      <button className="voice-btn" onClick={() => setVoiceOpen(true)}>
        🎙️ Bolo — "3 bag cement, 2 sariya…"
      </button>

      <div className="grid">
        {actions.map((a) => (
          <button
            key={a.id}
            className={`tile ${a.primary ? 'tile-primary' : ''}`}
            onClick={() => navigate('#/' + a.id)}
          >
            <span className="tile-icon">{a.icon}</span>
            <span className="tile-label">{a.label}</span>
            <span className="tile-sub">{a.sub}</span>
          </button>
        ))}
      </div>
      {voiceOpen && <VoiceModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />}
    </div>
  )
}