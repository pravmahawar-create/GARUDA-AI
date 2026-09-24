import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { warmOmAudio } from './services/audioService'

// Start buffering full Om BEFORE React renders → splash pe instant play, no delay
warmOmAudio()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
