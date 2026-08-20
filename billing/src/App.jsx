import React, { useEffect, useState } from 'react'
import { seedDefaults, getSetting } from './db'
import { watchSync } from './lib/sync'
import HomeScreen from './screens/HomeScreen'
import NewBillScreen from './screens/NewBillScreen'
import InvoicePreviewScreen from './screens/InvoicePreviewScreen'
import CustomersScreen from './screens/CustomersScreen'
import SettingsScreen from './screens/SettingsScreen'
import InvoicesScreen from './screens/InvoicesScreen'
import PaymentsScreen from './screens/PaymentsScreen'
import StockScreen from './screens/StockScreen'
import TransportScreen from './screens/TransportScreen'
import ReportsScreen from './screens/ReportsScreen'
import ImportScreen from './screens/ImportScreen'
import PasscodeGate from './screens/PasscodeGate'

function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(to) {
  window.location.hash = to
}

export default function App() {
  const route = useHashRoute()
  const [ready, setReady] = useState(false)
  const [locked, setLocked] = useState(true)
  const [passcode, setPasscode] = useState(null)

  useEffect(() => {
    ;(async () => {
      await seedDefaults()
      const pc = await getSetting('passcode', null)
      setPasscode(pc)
      setLocked(Boolean(pc))
      setReady(true)
      watchSync()
    })()
  }, [])

  if (!ready) return <div className="boot">Garuda Billing…</div>

  const screen = route.split('?')[0]

  return (
    <div className="app">
      {locked ? (
        <PasscodeGate hasPasscode={Boolean(passcode)} passcode={passcode} onUnlock={() => setLocked(false)} onSet={(pc) => { setPasscode(pc); setLocked(true) }} />
      ) : (
        <div className="screen-wrap">
          {screen === '#/' && <HomeScreen />}
          {screen === '#/bill' && <NewBillScreen />}
          {screen === '#/invoice' && <InvoicePreviewScreen />}
          {screen === '#/customers' && <CustomersScreen />}
          {screen === '#/invoices' && <InvoicesScreen />}
          {screen === '#/payments' && <PaymentsScreen />}
          {screen === '#/stock' && <StockScreen />}
          {screen === '#/transport' && <TransportScreen />}
          {screen === '#/reports' && <ReportsScreen />}
          {screen === '#/import' && <ImportScreen />}
          {screen === '#/settings' && <SettingsScreen />}
        </div>
      )}
    </div>
  )
}