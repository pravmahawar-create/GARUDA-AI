import React, { useEffect, useState } from 'react'
import { db, getSetting, setSetting } from '../db'
import { navigate } from '../App'

export default function SettingsScreen() {
  const [f, setF] = useState({})
  const [passcode, setPasscode] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      const keys = ['shopName', 'shopGstin', 'shopAddress', 'shopPhone', 'gstRate', 'passcode']
      const obj = {}
      for (const k of keys) obj[k] = await getSetting(k, '')
      setF(obj)
      setPasscode(obj.passcode || '')
    })()
  }, [])

  const save = async () => {
    await setSetting('shopName', f.shopName)
    await setSetting('shopGstin', f.shopGstin)
    await setSetting('shopAddress', f.shopAddress)
    await setSetting('shopPhone', f.shopPhone)
    await setSetting('gstRate', Number(f.gstRate) || 18)
    if (passcode) await setSetting('passcode', String(passcode))
    setMsg('Saved ✅')
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <div className="screen">
      <header className="topbar backbar">
        <button className="back" onClick={() => navigate('#/')}>‹</button>
        <div className="top-title">Settings</div>
      </header>

      <section className="card">
        <div className="card-title">Shop (seller)</div>
        <input className="input" placeholder="Shop ka naam" value={f.shopName || ''} onChange={(e) => setF({ ...f, shopName: e.target.value })} />
        <input className="input" placeholder="Shop GSTIN" value={f.shopGstin || ''} onChange={(e) => setF({ ...f, shopGstin: e.target.value })} />
        <input className="input" placeholder="Address" value={f.shopAddress || ''} onChange={(e) => setF({ ...f, shopAddress: e.target.value })} />
        <input className="input" type="tel" placeholder="Phone" value={f.shopPhone || ''} onChange={(e) => setF({ ...f, shopPhone: e.target.value })} />
        <div className="ip-muted">GST rate (%)</div>
        <input className="input" inputMode="numeric" placeholder="18" value={f.gstRate || ''} onChange={(e) => setF({ ...f, gstRate: e.target.value })} />
      </section>

      <section className="card">
        <div className="card-title">Passcode (app lock)</div>
        <input className="input" inputMode="numeric" placeholder="4-digit passcode (khali = no lock)" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
      </section>

      <button className="primary big" onClick={save}>Save</button>
      {msg && <div className="status">{msg}</div>}
    </div>
  )
}