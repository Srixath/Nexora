import { FormEvent, useEffect, useRef, useState } from 'react'

type Message = { type: string; [key: string]: unknown }

function detectDeviceName() {
  const userAgent = navigator.userAgent
  if (/Android/i.test(userAgent)) {
    const model = userAgent.match(/Android [^;]+;\s*([^;)]+?)(?:\s+Build\/[^;)]+)?[;)]/i)?.[1]?.trim()
    return model && !/^(k|wv|mobile|unknown)$/i.test(model) ? model : 'Android phone'
  }
  if (/iPhone/i.test(userAgent)) return 'iPhone'
  return 'My device'
}

export default function PhoneApp() {
  const [code, setCode] = useState('')
  const [name, setName] = useState(detectDeviceName)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'paired' | 'error'>('idle')
  const [error, setError] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const displayName = name.trim() || 'My device'

  useEffect(() => {
    type UserAgentData = { getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string }> }
    const userAgentData = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData
    userAgentData?.getHighEntropyValues?.(['model'])
      .then((values) => { if (values.model?.trim()) setName(values.model.trim()) })
      .catch(() => {})
  }, [])

  useEffect(() => () => socketRef.current?.close(), [])

  const pair = (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code shown on your laptop.')
      setStatus('error')
      return
    }

    setStatus('connecting')
    setError('')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(`${protocol}//${window.location.hostname}:8787`)
    socketRef.current = socket

    socket.onopen = () => {
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      socket.send(JSON.stringify({
        version: 1,
        type: 'pair',
        code,
        deviceId: `android-${id}`,
        deviceName: displayName,
      }))
    }
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as Message
        if (message.type === 'paired') setStatus('paired')
        if (message.type === 'error') {
          setStatus('error')
          setError(String(message.message || 'Pairing failed.'))
        }
      } catch {
        setStatus('error')
        setError('The laptop sent an invalid response.')
      }
    }
    socket.onerror = () => {
      setStatus('error')
      setError('Could not connect to the laptop. Check that both devices are on the same Wi-Fi.')
    }
    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null
        setStatus((current) => current === 'paired' ? 'idle' : current)
      }
    }
  }

  return (
    <main className="phone-app">
      <section className="phone-app-main">
        <p className="eyebrow">NEXORA</p>
        {status === 'paired' ? (
          <>
            <h1>{displayName} connected</h1>
            <p className="phone-app-subtitle" role="status">Your phone is connected to the laptop.</p>
          </>
        ) : (
          <>
            <h1>Connect your phone</h1>
            <form className="phone-pair-form" onSubmit={pair}>
              <label htmlFor="pair-code">Pairing code</label>
              <input id="pair-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
              {error && <div className="phone-error" role="alert">{error}</div>}
              <button className="phone-pair-button" type="submit" disabled={status === 'connecting'}>
                {status === 'connecting' ? 'Connecting…' : 'Connect'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}
