import React, { useRef, useState } from 'react'
import { setSetting } from '../db'

export default function PasscodeGate({ hasPasscode, passcode, onUnlock, onSet }) {
  const [pin, setPin] = useState('')
  const [mode, setMode] = useState(hasPasscode ? 'unlock' : 'set')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const mounted = useRef(true)

  const submit = async () => {
    setErr('')
    if (mode === 'unlock') {
      if (pin === passcode) {
        onUnlock()
      } else {
        setErr('Galat passcode')
        setPin('')
      }
    } else {
      if (pin.length < 4) return setErr('Kam se kam 4 digit')
      if (pin !== confirm) return setErr('Dono passcode match nahi hue')
      await setSetting('passcode', pin)
      onSet(pin)
    }
  }

  return (
    <div className="gate">
      <div className="gate-box">
        <div className="gate-icon">₹</div>
        <div className="gate-title">Garuda Billing</div>
        {mode === 'set' && <div className="gate-sub">App lock banao</div>}
        <input
          className="input gate-input"
          inputMode="numeric"
          type="password"
          placeholder={mode === 'unlock' ? 'Passcode' : 'Naya passcode (4 digit)'}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {mode === 'set' && (
          <input
            className="input gate-input"
            inputMode="numeric"
            type="password"
            placeholder="Dobara passcode"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        )}
        {err && <div className="err">{err}</div>}
        <button className="primary big" onClick={submit}>{mode === 'unlock' ? 'Unlock' : 'Set passcode'}</button>
        {mode === 'set' && <button className="ghost" onClick={() => { setMode('unlock'); setPin(''); setConfirm('') }}>Cancel</button>}
      </div>
    </div>
  )
}