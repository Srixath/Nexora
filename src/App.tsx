import { useState } from 'react'
import { Check, Smartphone, Zap } from 'lucide-react'
import { useConnection } from './connection'

function App() {
  const [connectedDevice, setConnectedDevice] = useState('')
  const { status, pairingCode, bridgeHost, lastError } = useConnection((message) => {
    if (message.type === 'device_connected') {
      setConnectedDevice(String(message.deviceName || 'Android phone'))
    }
    if (message.type === 'device_disconnected') setConnectedDevice('')
  })

  const statusText = connectedDevice
    ? `${connectedDevice} is connected`
    : status === 'paired'
      ? 'A phone is connected'
      : status === 'online'
        ? 'Bridge ready. Open Nexora on your phone to connect.'
        : status === 'connecting'
          ? 'Connecting to bridge…'
          : 'Bridge offline. Start npm run bridge.'

  return (
    <main className="phone-app">
      <header className="phone-app-header">
        <div className="brand"><div className="brand-mark"><Zap size={17} fill="currentColor" /></div><span>Nexora</span></div>
        <span className="local-pill"><Smartphone size={13} /> Local connection</span>
      </header>
      <section className="phone-app-main">
        <div className="phone-app-icon"><Smartphone size={30} /></div>
        <p className="eyebrow">CONNECT YOUR PHONE</p>
        <h1>{connectedDevice ? `${connectedDevice} connected` : 'Connect your phone'}</h1>
        <p className="phone-app-subtitle" role="status">{lastError || statusText}</p>
        {!connectedDevice && (
          <div className="phone-pair-form">
            <label htmlFor="windows-address">Windows address</label>
            <div id="windows-address" className="pairing-url">{bridgeHost || 'Finding laptop address…'}</div>
            <label htmlFor="desktop-pairing-code">Pairing code</label>
            <div id="desktop-pairing-code" className="pairing-code">{pairingCode || '------'}</div>
            <p className="phone-privacy">Open Nexora on Android and enter these details.</p>
          </div>
        )}
        {connectedDevice && <div className="phone-notice"><Check size={15} /> Your phone is connected to Nexora.</div>}
      </section>
    </main>
  )
}

export default App
