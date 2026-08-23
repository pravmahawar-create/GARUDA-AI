import React, { useEffect, useState } from 'react'
import { seedDefaults, getSetting, getActiveCompany, setCompanyTemplate } from './db'
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
import CompaniesScreen from './screens/CompaniesScreen'
import TemplateGallery from './components/TemplateGallery'
import PasscodeGate from './screens/PasscodeGate'
import TabBar from './components/TabBar'
import GarudaSigil from './components/GarudaSigil'
import { Icon } from './components/Icon'
import BusinessCardScreen from './screens/BusinessCardScreen'

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

class Boundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { err: null }
  }
  static getDerivedStateFromError(err) {
    return { err }
  }
  componentDidCatch(err, info) {
    console.error('[GARUDA] render error:', err, info)
  }
  render() {
    if (this.state.err) {
      return (
        <div className="screen center" style={{ paddingTop: 60 }}>
          <Icon name="ban" size={24} />
          <div className="card-title" style={{ justifyContent: 'center' }}>Kuch error hua</div>
          <div className="ip-muted" style={{ wordBreak: 'break-word', margin: '10px 0' }}>{String(this.state.err.message || this.state.err)}</div>
          <button className="primary big" onClick={() => location.reload()}>Reload karo</button>
          <button className="ghost" onClick={() => navigate('#/')}>Home</button>
        </div>
      )
    }
    return this.props.children
  }
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

  if (!ready) {
    return (
      <div className="boot gate">
        <div className="gate-sigil"><GarudaSigil size={86} /></div>
        <div className="gate-title">GARUDA</div>
        <div className="gate-sub" style={{ marginTop: 8, fontSize: 12, letterSpacing: 1 }}>Loading…</div>
      </div>
    )
  }

  const screen = route.split('?')[0]

  const showTabBar = !['#/bill', '#/invoice', '#/import', '#/templates'].includes(screen)

  return (
    <div className="app">
      <Boundary>
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
            {screen === '#/companies' && <CompaniesScreen />}
            {screen === '#/templates' && <TemplateGallery onPick={applyTemplate} />}
            {screen === '#/settings' && <SettingsScreen />}
            {screen === '#/business-card' && <BusinessCardScreen />}
          </div>
        )}
      </Boundary>
      {!locked && ready && showTabBar && <TabBar route={route} />}
    </div>
  )
}

async function applyTemplate(templateId) {
  const m = window.location.hash.match(/company=([^&]+)/)
  const companyId = m ? decodeURIComponent(m[1]) : null
  const target = companyId ? { id: companyId } : await getActiveCompany()
  if (target) await setCompanyTemplate(target.id, templateId)
  navigate('#/companies')
}