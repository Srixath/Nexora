import { FormEvent, useEffect, useRef, useState } from 'react'
import { Check, Clipboard, Smartphone, Wifi, X, Zap } from 'lucide-react'

type Message = { type: string; [key: string]: unknown }

export default function PhoneApp() {
  const [code, setCode] = useState('')
  const [name, setName] = useState('My Android phone')
  const [status, setStatus] = useState<'idle' | 'connecting' | 'paired' | 'error'>('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => () => socketRef.current?.close(), [])

  const pair = (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code shown on the Windows app.')
      setStatus('error')
      return
    }
    setStatus('connecting')
    setError('')
    const socket = new WebSocket(`ws://${window.location.hostname}:8787`)
    socketRef.current = socket
    socket.onopen = () => socket.send(JSON.stringify({
      version: 1,
      type: 'pair',
      code,
      deviceId: `android-${crypto.randomUUID()}`,
      deviceName: name.trim() || 'Android phone',
    }))
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as Message
      if (message.type === 'paired') {
        setStatus('paired')
        setNotice('Your phone is now connected to Nexora.')
      }
      if (message.type === 'clipboard') setNotice(`Clipboard received from ${String(message.from || 'desktop')}`)
      if (message.type === 'error') {
        setStatus('error')
        setError(String(message.message || 'Pairing failed.'))
      }
    }
    socket.onerror = () => {
      setStatus('error')
      setError('Could not reach the Windows app. Keep both devices on the same Wi-Fi.')
    }
    socket.onclose = () => { if (status !== 'paired') setStatus('idle') }
  }

  const sendClipboard = () => {
    const text = window.prompt('Text to send to Windows')
    if (!text || socketRef.current?.readyState !== WebSocket.OPEN) return
    socketRef.current.send(JSON.stringify({ version: 1, type: 'clipboard', text }))
    setNotice('Clipboard sent to Windows.')
  }

  return (
    <div className="phone-app">
      <header className="phone-app-header"><div className="brand"><div className="brand-mark"><Zap size={17} fill="currentColor" /></div><span>Nexora</span></div><span className="local-pill"><Wifi size={13} /> Local only</span></header>
      <main className="phone-app-main">
        <div className="phone-app-icon"><Smartphone size={30} /></div>
        <p className="eyebrow">ANDROID COMPANION</p>
        <h1>{status === 'paired' ? 'You’re connected.' : 'Connect your phone.'}</h1>
        <p className="phone-app-subtitle">{status === 'paired' ? 'Nexora is ready to share clipboard and activity with your Windows PC.' : 'Keep this page open while pairing. Your data stays on your local Wi-Fi network.'}</p>
        {status === 'paired' ? (
          <section className="phone-connected-card"><div className="phone-connected-icon"><Check size={22} /></div><div><strong>Connected to Windows</strong><span>Nexora desktop is online</span></div><button onClick={sendClipboard}><Clipboard size={17} /> Send clipboard</button></section>
        ) : (
          <form className="phone-pair-form" onSubmit={pair}>
            <label htmlFor="phone-name">Phone name</label>
            <input id="phone-name" value={name} onChange={(event) => setName(event.target.value)} />
            <label htmlFor="pair-code">Pairing code</label>
            <input id="pair-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
            {error && <div className="phone-error"><X size={15} />{error}</div>}
            <button className="phone-pair-button" type="submit" disabled={status === 'connecting'}>{status === 'connecting' ? 'Connecting…' : 'Connect to Windows'}</button>
          </form>
        )}
        {notice && <div className="phone-notice" role="status"><Check size={15} />{notice}</div>}
        <p className="phone-privacy">Nexora never sends your data to the cloud.</p>
      </main>
    </div>
  )
}
