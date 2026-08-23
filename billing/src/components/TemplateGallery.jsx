import React from 'react'
import { TEMPLATES, SAMPLE_INVOICE, SAMPLE_COMPANY } from '../lib/templates'
import InvoicePaper from './InvoicePaper'
import { navigate } from '../App'

export default function TemplateGallery({ onPick }) {
  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/settings')}>‹</button>
        <div className="top-title">Invoice Templates</div>
      </header>
      <div className="ip-muted" style={{ margin: '4px 2px 8px' }}>
        Har template sample data se preview ho raha hai. Jo pasand aaye, usse company ke liye select karo — purane bills apne template ke saath wapas aayenge.
      </div>
      {TEMPLATES.map((t) => (
        <div className="card" key={t.id}>
          <div className="card-title">
            <span>{t.name} <span className="ip-muted">— {t.tagline}</span></span>
            <button className="chip chip-other" onClick={() => onPick && onPick(t.id)}>Use this</button>
          </div>
          <div className="tpl-preview">
            <InvoicePaper invoice={{ ...SAMPLE_INVOICE, templateId: t.id }} company={SAMPLE_COMPANY} customer={SAMPLE_INVOICE.customer} />
          </div>
        </div>
      ))}
    </div>
  )
}