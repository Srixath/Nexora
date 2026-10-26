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

If Windows Firewall asks about Node.js, allow access on **Private networks** for ports `5173` and `8787`. If the phone cannot open the page, run `ipconfig` again and make sure the phone is using the IPv4 address of the active Wi-Fi adapter, not a VPN or virtual adapter. Do not expose port `8787` or `5173` to public networks.

The current browser client uses local Wi-Fi because browsers cannot provide a reliable Bluetooth
transport between an Android phone and a Windows computer. Bluetooth support requires the planned
native Windows shell and Android client; it is not enabled by the web UI.

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

1. Install the Windows native prerequisites, then run `npm run tauri:build` to create the Windows `.msi` and `.exe` installers.
2. Open `android` in Android Studio, sync Gradle, and run `app > assembleDebug` to create `android/app/build/outputs/apk/debug/app-debug.apk`.
3. Exchange the existing short-lived pairing challenge over QR/manual code, then store device credentials in platform secure storage.
4. Implement binary/chunked file transfer with checksums.
5. Implement Android clipboard and notification permissions only after explicit user consent.

### Native app builds

The repository now includes:

- `src-tauri/` — Tauri 2 Windows application shell. It packages the existing Nexora desktop UI as an installable Windows app.
- `android/` — Kotlin Android application with a native pairing screen and WebSocket connection to the local bridge.

Windows prerequisites:

1. Install Rust with `rustup`, Visual Studio Build Tools with **Desktop development with C++**, and WebView2.
2. Run `npm install`.
3. Start the bridge with `npm run bridge`.
4. Build the installer with `npm run tauri:build`.

Android prerequisites:

1. Install Android Studio and SDK Platform 35.
2. Open the `android` folder in Android Studio and allow Gradle to sync.
3. Build the debug APK with `gradlew.bat app:assembleDebug` from that folder.

The first native release uses Wi-Fi. Bluetooth is deliberately not included in this scaffold yet;
it needs a separate native transport implementation on both Windows and Android, plus pairing and
permission UX.

No cloud account is required for the local-first connection model. Sensitive features must remain opt-in and permission-gated.