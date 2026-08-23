import React from 'react'

export default function CompanyScopeBar({ scope, setScope, activeName, companies }) {
  return (
    <div className="scope-bar">
      <button className={`chip ${scope === 'active' ? 'chip-active' : 'chip-other'}`} onClick={() => setScope('active')}>
        {activeName || 'Active'}
      </button>
      <button className={`chip ${scope === 'all' ? 'chip-active' : 'chip-other'}`} onClick={() => setScope('all')}>
        All ({companies.length})
      </button>
    </div>
  )
}