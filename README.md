# Nexora

Nexora is a local-first Android + Windows companion designed to make a phone feel like a natural extension of a Windows desktop.

## Current milestone

The repository now includes a working local connection slice:

- Connection dashboard with device health and connection quality
- A local WebSocket bridge with six-digit pairing codes
- Authenticated pairing and heartbeat handling
- Clipboard messages sent through the bridge
- Transfer request protocol and acknowledgements
- A phone simulator for testing before the Android app exists
- Pairing entry point with permission-aware copy
- Transfer queue with progress states
- Notification preview and quick actions
- Light/dark theme control and accessible sidebar navigation

Android-specific features are not fabricated: `NotificationListenerService`, `MediaProjection`, USB transport, and Android permissions still require the Kotlin client and physical-device validation. The bridge protocol is ready for that client.

## Development

```powershell
npm install
npm run bridge
```

Keep the bridge running, open a second PowerShell window, and run:

```powershell
cd "C:\Users\bavur\OneDrive\Documents\GitHub\Nexora"
npm run dev
```

Open the local Vite URL shown in the terminal. The bridge prints a six-digit pairing code.

### Connect a real phone now

1. Connect the Windows computer and Android phone to the same Wi-Fi network.
2. Find the Windows computer's local IPv4 address:

   ```powershell
   ipconfig
   ```

   Look for the `IPv4 Address` under the active Wi-Fi adapter, for example `192.168.1.25`.
3. On the phone, open `http://YOUR-PC-IP:5173/phone`, replacing `YOUR-PC-IP` with that address.
4. Enter the six-digit code printed by `npm run bridge`.
5. Give the phone a name and tap **Connect to Windows**.

The Windows dashboard will change to **Connected now**. The phone page can send clipboard text through the live authenticated connection.

If Windows Firewall asks about Node.js, allow private networks. Do not expose port `8787` or `5173` to public networks.

### Test pairing without a phone

Open a third PowerShell window and use the code printed by `npm run bridge`:

```powershell
$env:NEXORA_PAIRING_CODE = "123456"
npm run simulate:phone
```

Replace `123456` with the actual code. The dashboard will change to **Connected now** and receive a clipboard event from the simulated phone.

## Project structure

- `src/App.tsx` — desktop shell and feature interactions
- `src/connection.ts` — browser WebSocket connection and reconnect handling
- `server/bridge.mjs` — local pairing/authentication bridge
- `server/phone-simulator.mjs` — protocol test peer
- `src/styles.css` — Nexora design tokens, responsive layout, and component styling
- `src/main.tsx` — React entry point

## Next native integration steps

1. Add a Tauri 2 Rust workspace and expose the existing bridge through commands/events.
2. Add the Android Kotlin project with a pairing screen and a foreground WebSocket service.
3. Exchange the existing short-lived pairing challenge over QR/manual code, then store device credentials in platform secure storage.
4. Implement binary/chunked file transfer with checksums.
5. Implement Android clipboard and notification permissions only after explicit user consent.

No cloud account is required for the local-first connection model. Sensitive features must remain opt-in and permission-gated.