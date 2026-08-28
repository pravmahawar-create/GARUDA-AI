import React, { useEffect, useState } from 'react'
import { db, getSetting, setSetting } from '../db'
import { exportAll, downloadBackup, importAll } from '../lib/backup'
import { navigate } from '../App'
import { Icon } from '../components/Icon'
import GarudaSigil from '../components/GarudaSigil'

export default function SettingsScreen() {
  const [passcode, setPasscode] = useState('')
  const [kacchaMode, setKacchaMode] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = React.useRef(null)

  useEffect(() => {
    ;(async () => {
      setPasscode((await getSetting('passcode', '')) || '')
      setKacchaMode(Boolean(await getSetting('kacchaMode', false)))
    })()
  }, [])

  const save = async () => {
    if (passcode) await setSetting('passcode', String(passcode))
    else await setSetting('passcode', '')
    await setSetting('kacchaMode', kacchaMode)
    setMsg('Saved')
    setTimeout(() => setMsg(''), 2000)
  }

  const doBackup = async () => {
    const data = await exportAll()
    downloadBackup('garuda-backup-' + new Date().toISOString().slice(0, 10) + '.json', data)
  }

  const onRestore = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!confirm('Restore se aaj ka sab data REPLACE ho jayega. Karna hai?')) return
    try {
      const text = await file.text()
      const res = await importAll(text)
      setMsg(res)
      setTimeout(() => { location.hash = '#/'; location.reload() }, 1200)
    } catch (err) {
      setMsg('Restore fail: ' + err.message)
    }
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Settings</div>
      </header>

      <div className="menu-card">
        <div className="menu-row" onClick={() => navigate('#/companies')}>
          <b>Companies</b>
          <span className="ip-muted">Shops/firms, GSTIN, invoice no., bank + UPI</span>
          <span className="menu-arrow">›</span>
        </div>
        <div className="menu-row" onClick={() => navigate('#/templates')}>
          <b>Invoice Templates</b>
          <span className="ip-muted">5 design — har company apna chun sakti hai</span>
          <span className="menu-arrow">›</span>
        </div>
      </div>

      <section className="card">
        <div className="card-title">Non-GST mode</div>
        <label className="form-label toggle-row">
          <div>
            <b>Non-GST bills chhupao</b>
            <div className="ip-muted">OFF = Non-GST bills list/reports/search me nahi dikhenge</div>
          </div>
          <input type="checkbox" className="toggle" checked={kacchaMode} onChange={(e) => setKacchaMode(e.target.checked)} />
        </label>
      </section>

      <section className="card">
        <div className="card-title">Passcode (app lock)</div>
        <input className="input" inputMode="numeric" placeholder="4-digit passcode (khali = no lock)" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
      </section>

      <section className="card">
        <div className="card-title">Backup & Restore</div>
        <div className="row-actions">
          <button className="btn" onClick={doBackup}><Icon name="download" size={14} /> Backup le lo</button>
          <button className="btn btn-ghost" onClick={() => fileRef.current && fileRef.current.click()}><Icon name="upload" size={14} /> Restore karo</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onRestore} />
        </div>
        <div className="ip-muted" style={{ marginTop: 6 }}>Backup JSON me companies, customers, bills, payments, catalog + settings sab aa jayega.</div>
      </section>

      <button className="primary big" onClick={save}>Save</button>
      {msg && <div className="status">{msg}</div>}
      <div className="garuda-footer">
        <GarudaSigil size={44} />
        <div className="garuda-footer-text">Powered by GARUDA</div>
        <div className="garuda-footer-sub">One Mind. One AI.</div>
      </div>
    </div>
  )
}