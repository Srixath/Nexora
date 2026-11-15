import { useState } from 'react'
import { Check, Copy, Smartphone, Zap } from 'lucide-react'
import { useConnection } from './connection'

function App() {
  const [connectedDevice, setConnectedDevice] = useState('')
  const [copied, setCopied] = useState(false)
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
          : 'Starting the local connection…'

  const copyPairingCode = async () => {
    if (!pairingCode) return
    try {
      await navigator.clipboard.writeText(pairingCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

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
            <div className="pairing-code-row">
              <div id="desktop-pairing-code" className="pairing-code" aria-live="polite">{pairingCode || '------'}</div>
              <button className="copy-pairing-code" type="button" onClick={copyPairingCode} disabled={!pairingCode} aria-label="Copy pairing code">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="phone-privacy">Open Nexora on Android and enter the Windows address and this code.</p>
          </div>
        )}
        {connectedDevice && <div className="phone-notice"><Check size={15} /> Your phone is connected to Nexora.</div>}
      </section>
    </main>
  )
}

export default App
