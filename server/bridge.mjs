import { createServer } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { WebSocketServer } from 'ws'

const port = Number(process.env.NEXORA_PORT || 8787)
const host = process.env.NEXORA_HOST || '0.0.0.0'
const pairingCode = String(Math.floor(100000 + Math.random() * 900000))
const token = randomBytes(32).toString('hex')
const peers = new Set()
const pairedDevices = new Map()

const send = (socket, message) => {
  if (socket.readyState === 1) socket.send(JSON.stringify({ version: 1, ...message }))
}

const broadcast = (message, except) => {
  for (const peer of peers) {
    if (peer !== except && peer.authenticated) send(peer, message)
  }
}

const json = (response, status, body) => {
  response.writeHead(status, {
    'access-control-allow-origin': '*',
    'content-type': 'application/json',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(body))
}

const httpServer = createServer((request, response) => {
  if (request.url === '/health') return json(response, 200, { ok: true, service: 'nexora-bridge', peers: peers.size })
  if (request.url === '/pairing') return json(response, 200, { code: pairingCode, expiresInSeconds: 900 })
  return json(response, 404, { error: 'not_found' })
})

const webSocketServer = new WebSocketServer({ server: httpServer })
webSocketServer.on('connection', (socket) => {
  socket.authenticated = false
  socket.isAlive = true
  peers.add(socket)

  send(socket, { type: 'hello', pairingRequired: true, expiresInSeconds: 900 })

  socket.on('pong', () => { socket.isAlive = true })
  socket.on('message', (raw) => {
    let message
    try { message = JSON.parse(raw.toString()) } catch { return send(socket, { type: 'error', code: 'invalid_json' }) }

    if (message.type === 'pair') {
      const supplied = String(message.code || '')
      const valid = supplied.length === pairingCode.length &&
        timingSafeEqual(Buffer.from(supplied), Buffer.from(pairingCode))
      if (!valid) return send(socket, { type: 'error', code: 'invalid_pairing_code', message: 'Pairing code is invalid or expired.' })
      socket.authenticated = true
      socket.deviceId = String(message.deviceId || `device-${Date.now()}`)
      socket.deviceName = String(message.deviceName || 'Android device').slice(0, 80)
      pairedDevices.set(socket.deviceId, { name: socket.deviceName, pairedAt: new Date().toISOString() })
      send(socket, { type: 'paired', deviceId: socket.deviceId, deviceName: socket.deviceName, token })
      broadcast({ type: 'device_connected', deviceId: socket.deviceId, deviceName: socket.deviceName }, socket)
      return
    }

    if (!socket.authenticated) return send(socket, { type: 'error', code: 'not_authenticated', message: 'Pair this device before sending messages.' })
    if (message.type === 'heartbeat') return send(socket, { type: 'heartbeat_ack', timestamp: Date.now() })
    if (message.type === 'clipboard') {
      const text = String(message.text || '').slice(0, 100000)
      broadcast({ type: 'clipboard', text, from: socket.deviceName, timestamp: Date.now() }, socket)
      return send(socket, { type: 'clipboard_ack', timestamp: Date.now() })
    }
    if (message.type === 'transfer_request') {
      const name = String(message.name || 'unnamed file').slice(0, 180)
      broadcast({ type: 'transfer_started', name, size: Number(message.size || 0), from: socket.deviceName, timestamp: Date.now() }, socket)
      return send(socket, { type: 'transfer_ack', name, timestamp: Date.now() })
    }
    send(socket, { type: 'error', code: 'unsupported_message', message: `Unsupported message type: ${message.type}` })
  })

  socket.on('close', () => {
    peers.delete(socket)
    if (socket.authenticated) broadcast({ type: 'device_disconnected', deviceId: socket.deviceId })
  })
})

const heartbeat = setInterval(() => {
  for (const socket of peers) {
    if (!socket.isAlive) { socket.terminate(); continue }
    socket.isAlive = false
    socket.ping()
  }
}, 30000)

httpServer.listen(port, host, () => {
  console.log(`Nexora bridge listening on http://${host}:${port}`)
  console.log(`Pairing code: ${pairingCode}`)
})
process.on('SIGINT', () => { clearInterval(heartbeat); httpServer.close(() => process.exit(0)) })
