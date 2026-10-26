import { useState } from 'react'
import {
  ArrowUpRight,
  BatteryCharging,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Cloud,
  FileText,
  FolderUp,
  HardDrive,
  LayoutDashboard,
  Link2,
  MessageSquare,
  MonitorPlay,
  MoreHorizontal,
  Moon,
  Plus,
  Search,
  Settings,
  Smartphone,
  Sun,
  Wifi,
  X,
  Zap,
} from 'lucide-react'
import { useConnection } from './connection'

type Icon = typeof LayoutDashboard

const navigation: { label: string; icon: Icon; badge?: string }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Screen mirror', icon: MonitorPlay },
  { label: 'Notifications', icon: Bell, badge: '3' },
  { label: 'Messages', icon: MessageSquare },
  { label: 'File transfer', icon: FolderUp },
  { label: 'Clipboard', icon: Clipboard },
]

const recentNotifications = [
  { app: 'Calendar', title: 'Design sync in 15 minutes', time: '9:45 AM', color: 'purple', icon: 'C' },
  { app: 'Messages', title: 'Maya: “The launch looks great!”', time: '9:32 AM', color: 'blue', icon: 'M' },
  { app: 'Photos', title: '12 new memories are ready', time: '8:51 AM', color: 'orange', icon: 'P' },
]

const transfers = [
  { name: 'Q4-Product-Overview.pdf', size: '2.4 MB', status: 'Sent to Pixel 8', icon: FileText, color: 'blue' },
  { name: 'Launch assets', size: '184 MB', status: 'Received from Pixel 8', icon: FolderUp, color: 'green' },
]

function App() {
  const [active, setActive] = useState('Overview')
  const [darkMode, setDarkMode] = useState(false)
  const [pairing, setPairing] = useState(false)
  const [toast, setToast] = useState('')

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }
  const { status, pairingCode, lastError, send } = useConnection((message) => {
    if (message.type === 'paired') notify(`Connected to ${String(message.deviceName || 'device')}`)
    if (message.type === 'clipboard') notify(`Clipboard received from ${String(message.from || 'phone')}`)
    if (message.type === 'transfer_started') notify(`Transfer started: ${String(message.name || 'file')}`)
    if (message.type === 'device_disconnected') notify('Phone disconnected')
  })
  const connected = status === 'paired'
  const connectionLabel = status === 'paired' ? 'Connected now' : status === 'connecting' ? 'Connecting…' : 'Bridge offline'
  const connectColor = status === 'paired' ? 'online-dot' : 'offline-dot'
  const phoneUrl = `${window.location.protocol}//${window.location.hostname || 'localhost'}:${window.location.port || '5173'}/phone`
  const copyPairingDetails = async () => {
    try {
      await navigator.clipboard.writeText(`Open ${phoneUrl} on your phone and enter pairing code ${pairingCode}.`)
      setPairing(false)
      notify('Phone pairing instructions copied')
    } catch {
      notify(`Open ${phoneUrl} on your phone`)
    }
  }

  return (
    <div className={darkMode ? 'app dark' : 'app'}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Zap size={17} fill="currentColor" /></div>
          <span>Nexora</span>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Primary navigation">
          {navigation.map(({ label, icon: NavIcon, badge }) => (
            <button
              className={active === label ? 'nav-item active' : 'nav-item'}
              key={label}
              onClick={() => setActive(label)}
              aria-current={active === label ? 'page' : undefined}
            >
              <NavIcon size={18} strokeWidth={active === label ? 2.2 : 1.8} />
              <span>{label}</span>
              {badge && <span className="nav-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <button className="nav-item" onClick={() => notify('Device manager is ready')}>
          <Smartphone size={18} />
          <span>Connected devices</span>
        </button>
        <button className="nav-item" onClick={() => notify('Settings opened')}>
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="sidebar-footer">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={17} /></div>
            <div>
              <strong>Need a hand?</strong>
              <span>Visit the help center</span>
            </div>
            <ChevronRight size={15} />
          </div>
          <div className="profile">
            <div className="avatar">JD</div>
            <div className="profile-copy"><strong>Jordan Davis</strong><span>Personal workspace</span></div>
            <MoreHorizontal size={17} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{active}</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search" onClick={() => notify('Search is coming soon')}><Search size={18} /></button>
            <button className="icon-button theme-toggle" aria-label="Toggle color theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setActive('Notifications')}><Bell size={18} /><i /></button>
            <div className="top-avatar">JD</div>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">MONDAY, OCTOBER 26, 2026</p>
              <h1>Good morning, Jordan <span>✦</span></h1>
              <p className="subtitle">Everything is in sync. What would you like to do?</p>
            </div>
            <button className="primary-button" onClick={() => setPairing(true)}><Plus size={17} /> Add device</button>
          </section>

          <section className="device-hero">
            <div className="device-glow" />
            <div className="phone-wrap">
              <div className="phone">
                <div className="phone-camera" />
                <div className="phone-screen">
                  <div className="phone-time">9:41</div>
                  <div className="phone-status"><Wifi size={10} /><BatteryCharging size={12} /></div>
                  <div className="phone-wallpaper"><span>Good<br /><b>morning.</b></span></div>
                  <div className="phone-dock"><div /><div /><div /><div /></div>
                </div>
              </div>
            </div>
            <div className="device-details">
              <div className="connected-label"><span className={connectColor} /> {connectionLabel}</div>
              <h2>Pixel 8 <span className="verified"><Check size={11} /></span></h2>
              <p>Last synced just now <span className="dot-separator">·</span> Wi-Fi</p>
              <div className="device-metrics">
                <div className="metric"><BatteryCharging size={16} /><span><b>84%</b> battery</span></div>
                <div className="metric"><Wifi size={16} /><span><b>{connected ? 'Excellent' : 'Unavailable'}</b> connection</span></div>
              </div>
              <div className="hero-actions">
                <button className="light-button" onClick={() => setActive('Screen mirror')}><MonitorPlay size={16} /> Mirror screen</button>
                <button className="text-button" onClick={() => connected ? notify('Close the bridge or phone session to disconnect') : setPairing(true)}>{connected ? 'Connection details' : 'Reconnect'} <ArrowUpRight size={15} /></button>
              </div>
            </div>
            <div className="signal-chart" aria-label="Connection quality is excellent">
              <div className="chart-header"><span>Connection quality</span><strong>Excellent</strong></div>
              <div className="bars">{[35, 54, 46, 70, 55, 78, 64, 87, 72, 90, 83, 96].map((height, i) => <span key={i} style={{ height: `${height}%` }} />)}</div>
              <div className="chart-footer"><span>10:00 AM</span><span>Now</span></div>
            </div>
          </section>

          <div className="section-heading"><div><h2>Quick actions</h2><p>Pick up where you left off</p></div></div>
          <section className="quick-grid">
            <button className="quick-card accent-blue" onClick={() => setActive('File transfer')}><div className="quick-icon"><FolderUp size={21} /></div><div><strong>Send files</strong><span>Move anything instantly</span></div><ChevronRight size={17} /></button>
            <button className="quick-card accent-violet" onClick={() => setActive('Clipboard')}><div className="quick-icon"><Clipboard size={21} /></div><div><strong>Share clipboard</strong><span>Text is ready to paste</span></div><ChevronRight size={17} /></button>
            <button className="quick-card accent-amber" onClick={() => setActive('Messages')}><div className="quick-icon"><MessageSquare size={21} /></div><div><strong>View messages</strong><span>2 conversations waiting</span></div><ChevronRight size={17} /></button>
          </section>

          <div className="dashboard-grid">
            <section className="panel notifications-panel">
              <div className="panel-heading"><div><h2>Recent notifications</h2><p>Synced from your phone</p></div><button className="more-link" onClick={() => setActive('Notifications')}>View all <ArrowUpRight size={14} /></button></div>
              <div className="notification-list">
                {recentNotifications.map((item) => <button className="notification-row" key={item.title} onClick={() => notify(`Opened ${item.app} notification`)}><div className={`app-icon ${item.color}`}>{item.icon}</div><div className="notification-copy"><strong>{item.app}</strong><span>{item.title}</span></div><time>{item.time}</time></button>)}
              </div>
            </section>
            <section className="panel transfer-panel">
              <div className="panel-heading"><div><h2>Recent transfers</h2><p>Your latest activity</p></div><button className="more-link" onClick={() => setActive('File transfer')}>See history <ArrowUpRight size={14} /></button></div>
              <div className="transfer-list">
                {transfers.map(({ name, size, status, icon: TransferIcon, color }) => <button className="transfer-row" key={name} onClick={() => notify(`${name} details opened`)}><div className={`transfer-icon ${color}`}><TransferIcon size={18} /></div><div className="transfer-copy"><strong>{name}</strong><span>{size} <i /> {status}</span></div><Check className="transfer-check" size={16} /></button>)}
              </div>
            </section>
          </div>

          <section className="clipboard-strip">
            <div className="clipboard-symbol"><Link2 size={19} /></div>
            <div className="clipboard-copy"><strong>Clipboard is shared</strong><span>“The simplest way to stay in flow.”</span></div>
            <span className="clipboard-time">Updated 2 min ago</span>
            <button className="clipboard-action" onClick={() => {
              const sent = send({ type: 'clipboard', text: 'The simplest way to stay in flow.' })
              if (sent) notify('Clipboard sent to phone')
            }}><Cloud size={16} /> Send to phone</button>
          </section>
        </div>
      </main>

      {pairing && <div className="modal-backdrop" role="presentation" onClick={() => setPairing(false)}><div className="pairing-modal" role="dialog" aria-modal="true" aria-labelledby="pair-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setPairing(false)}><X size={18} /></button><div className="pairing-mark"><Smartphone size={25} /></div><p className="eyebrow">LOCAL CONNECTION</p><h2 id="pair-title">Pair a device</h2><p>On your phone, open this address while both devices are on the same Wi‑Fi, then enter the code below.</p><div className="pairing-url">{phoneUrl}</div><div className="pairing-code">{pairingCode || '------'}</div><div className="pairing-status">{lastError || 'Waiting for your phone to pair…'}</div><button className="primary-button full" onClick={copyPairingDetails}>Copy phone instructions <Clipboard size={16} /></button><button className="modal-secondary" onClick={() => setPairing(false)}>Close</button></div></div>}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  )
}

export default App
