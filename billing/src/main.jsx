import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()
if (!isNative) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
}

createRoot(document.getElementById('root')).render(<App />)