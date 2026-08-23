import React from 'react'
import { navigate } from '../App'
import { Icon } from './Icon'

const TABS = [
  { id: 'home', label: 'HOME', icon: 'home', route: '#/' },
  { id: 'invoices', label: 'BILLS', icon: 'list', route: '#/invoices' },
  { id: 'stock', label: 'STOCK', icon: 'stack', route: '#/stock' },
  { id: 'customers', label: 'KHATA', icon: 'book', route: '#/customers' },
  { id: 'settings', label: 'MORE', icon: 'grid', route: '#/settings' }
]

export default function TabBar({ route }) {
  const base = route.split('?')[0]
  const activeMap = { '#': 'home', '#/invoices': 'invoices', '#/stock': 'stock', '#/customers': 'customers', '#/settings': 'settings' }
  const activeId = activeMap[base] || null

  return (
    <nav className="nav">
      {TABS.map((t) => {
        const on = activeId === t.id
        return (
          <button
            key={t.id}
            className={`nav-btn ${on ? 'nav-btn-active' : ''}`}
            onClick={() => navigate(t.route)}
            aria-label={t.label}
            style={{
              minHeight: '44px',
              padding: '8px 4px',
            }}
          >
            <Icon name={t.icon} size={22} style={{ marginBottom: 2 }} />
            <span className="nav-label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}