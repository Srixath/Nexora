import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import PhoneApp from './PhoneApp'
import './styles.css'

const Root = window.location.pathname === '/phone' ? PhoneApp : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
