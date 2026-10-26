import WebSocket from 'ws'

const bridgeUrl = process.env.NEXORA_BRIDGE || 'ws://127.0.0.1:8787'
const code = process.env.NEXORA_PAIRING_CODE
if (!code) {
  console.error('Set NEXORA_PAIRING_CODE to the six-digit code printed by npm run bridge.')
  process.exit(1)
}

const socket = new WebSocket(bridgeUrl)
socket.on('open', () => {
  socket.send(JSON.stringify({ version: 1, type: 'pair', code, deviceId: 'simulated-pixel-8', deviceName: 'Pixel 8 (simulator)' }))
})
socket.on('message', (raw) => {
  const message = JSON.parse(raw.toString())
  console.log('[phone]', message)
  if (message.type === 'paired') {
    setInterval(() => socket.send(JSON.stringify({ version: 1, type: 'heartbeat' })), 10000)
    socket.send(JSON.stringify({ version: 1, type: 'clipboard', text: 'Clipboard from the simulated Pixel 8.' }))
  }
})
