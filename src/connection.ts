import { useEffect, useRef, useState } from 'react'

export type ConnectionStatus = 'offline' | 'connecting' | 'paired'
export type BridgeMessage = { type: string; [key: string]: unknown }

export function useConnection(onMessage: (message: BridgeMessage) => void, deviceName = 'Nexora desktop') {
  const socketRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  const pairingCodeRef = useRef('')
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [pairingCode, setPairingCode] = useState('')
  const [lastError, setLastError] = useState('')

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  useEffect(() => {
    let retryTimer: number | undefined
    let closed = false
    const connect = () => {
      setStatus('connecting')
      const bridgeHost = window.location.hostname || '127.0.0.1'
      const socket = new WebSocket(import.meta.env.VITE_NEXORA_BRIDGE || `ws://${bridgeHost}:8787`)
      socketRef.current = socket
      socket.onopen = () => {
        setLastError('')
        if (pairingCodeRef.current) {
          socket.send(JSON.stringify({
            version: 1,
            type: 'pair',
            code: pairingCodeRef.current,
            deviceId: deviceName === 'Nexora desktop' ? 'nexora-desktop' : undefined,
            deviceName,
          }))
        }
      }
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as BridgeMessage
          if (message.type === 'paired' || message.type === 'device_connected') setStatus('paired')
          if (message.type === 'error') setLastError(String(message.message || message.code || 'Bridge error'))
          onMessageRef.current(message)
        } catch { setLastError('Received an invalid bridge message.') }
      }
      socket.onerror = () => setLastError('Bridge is unavailable. Start npm run bridge.')
      socket.onclose = () => {
        setStatus('offline')
        if (!closed) retryTimer = window.setTimeout(connect, 2000)
      }
    }
    const bridgeHost = window.location.hostname || '127.0.0.1'
    fetch((import.meta.env.VITE_NEXORA_HTTP || `http://${bridgeHost}:8787`) + '/pairing')
      .then((response) => response.json())
      .then((data: { code?: string }) => {
        pairingCodeRef.current = data.code || ''
        setPairingCode(data.code || '')
        if (socketRef.current?.readyState === WebSocket.OPEN && data.code) {
          socketRef.current.send(JSON.stringify({ version: 1, type: 'pair', code: data.code, deviceId: 'nexora-desktop', deviceName }))
        }
      })
      .catch(() => setLastError('Bridge is unavailable. Start npm run bridge.'))
    connect()
    return () => { closed = true; if (retryTimer) window.clearTimeout(retryTimer); socketRef.current?.close() }
  }, [])

  const send = (message: Record<string, unknown>) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setLastError('Not connected to the Nexora bridge.')
      return false
    }
    socketRef.current.send(JSON.stringify({ version: 1, ...message }))
    return true
  }

  return { status, pairingCode, lastError, send }
}
