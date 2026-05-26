import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ACTIVITY = [
  { dot: 'dot-green',  name: 'Asset hardened',  file: 'Q4_Report_Final.pdf',      time: '2 min ago' },
  { dot: 'dot-green',  name: 'Ledger synced',   file: 'contract_v2.docx',          time: '14 min ago' },
  { dot: 'dot-purple', name: 'Node connected',  file: 'Node #47 — Frankfurt',      time: '1 hr ago' },
  { dot: 'dot-orange', name: 'Threat blocked',  file: 'Unauthorized access attempt',time: '3 hr ago' },
  { dot: 'dot-green',  name: 'Asset hardened',  file: 'design_assets.zip',         time: '5 hr ago' },
];

function ActivityChart() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const svg = canvasRef.current;
    if (!svg) return;
    const W = svg.clientWidth || 680;
    const H = 180;
    const pts = [0.72, 0.55, 0.50, 0.48, 0.52, 0.58, 0.54, 0.62, 0.78, 0.85, 0.88, 0.84, 0.91, 0.96];
    const step = W / (pts.length - 1);

    const coords = pts.map((y, i) => [i * step, H - y * (H - 20) - 10]);
    const line = coords.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `C${coords[i-1][0] + step/2},${coords[i-1][1]} ${p[0] - step/2},${p[1]} ${p[0]},${p[1]}`)).join(' ');
    const area = `${line} L${W},${H} L0,${H} Z`;

    svg.innerHTML = `
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#7c6cf8"/>
          <stop offset="100%" stop-color="#00f0ff"/>
        </linearGradient>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7c6cf8" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.01"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#areaGrad)"/>
      <path d="${line}" fill="none" stroke="url(#lineGrad)" stroke-width="2" stroke-linejoin="round"/>
    `;
  }, []);

  return (
    <svg
      ref={canvasRef}
      className="chart-canvas"
      viewBox="0 0 680 180"
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height: '180px' }}
    />
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <h1 className="view-title">Security Overview</h1>
        <p className="view-subtitle">Welcome back, John. Your vault is secure.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">
            Assets Secured
            <div className="stat-icon stat-icon-blue">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L2 4v4c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L8 1.5z" stroke="#00f0ff" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="stat-value stat-value-blue">42</div>
          <div className="stat-sub">+3 this week</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Network Status
            <div className="stat-icon stat-icon-green">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M1 6.5C4 3.5 12 3.5 15 6.5" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M3 9C5 7 11 7 13 9" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M5.5 11.5C6.5 10.5 9.5 10.5 10.5 11.5" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="8" cy="13.5" r="1" fill="#10b981"/>
              </svg>
            </div>
          </div>
          <div className="stat-value stat-value-online">ONLINE</div>
          <div className="stat-sub">🟢 Node #47 active</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Storage Used
            <div className="stat-icon stat-icon-purple">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="#7c6cf8" strokeWidth="1.4"/>
                <path d="M4 8h8M4 10.5h5" stroke="#7c6cf8" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="stat-value stat-value-blue">
            1.8 <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)' }}>GB</span>
          </div>
          <div className="stat-sub">of 10 GB allocated</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Threats Blocked
            <div className="stat-icon stat-icon-orange">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5z" stroke="#f59e0b" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="stat-value stat-value-yellow">7</div>
          <div className="stat-sub">today</div>
        </div>
      </div>

      {/* Main Grid: Chart + Widgets */}
      <div className="dashboard-grid">
        {/* Activity Chart */}
        <div className="activity-chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Activity Trends</div>
              <div className="chart-subtitle">Asset operations — last 24 hours</div>
            </div>
            <div className="chart-badge">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 7L4 4L6 6L9 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              +12.4%
            </div>
          </div>
          <ActivityChart />
        </div>

        {/* Right Widgets */}
        <div className="sidebar-widgets">
          {/* Telemetry */}
          <div className="telemetry-card">
            <div className="widget-title">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 9L4 5L7 7L10 3L13 6" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Telemetry
            </div>
            {[
              { label: 'CPU Load',   val: 23, cls: 'progress-fill-purple' },
              { label: 'Memory',     val: 41, cls: 'progress-fill-purple' },
              { label: 'Network I/O',val: 67, cls: 'progress-fill-cyan'   },
            ].map(r => (
              <div className="telemetry-row" key={r.label}>
                <span className="telemetry-label">{r.label}</span>
                <div className="progress-track">
                  <div className={`progress-fill ${r.cls}`} style={{ width: `${r.val}%` }} />
                </div>
                <span className="telemetry-val">{r.val}%</span>
              </div>
            ))}
          </div>

          {/* Ledger Health */}
          <div className="ledger-health-card">
            <div className="widget-title">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="var(--accent)" strokeWidth="1.3"/>
                <path d="M3.5 7h7M3.5 4.5h7M3.5 9.5h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Ledger Health
            </div>
            <div className="health-status">
              <span className="health-dot" />
              Fully Synced
            </div>
            <div className="health-meta">
              Last sync: 2 minutes ago<br />
              42 entries committed
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="activity-header">
          <div className="activity-title">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v6l3 2" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="6" stroke="var(--accent)" strokeWidth="1.3"/>
            </svg>
            Recent Activity
          </div>
          <span className="view-all-link" onClick={() => navigate('/ledger')}>View all</span>
        </div>

        <div className="activity-list">
          {ACTIVITY.map((a, i) => (
            <div className="activity-item" key={i}>
              <div className="activity-left">
                <span className={`activity-dot ${a.dot}`} />
                <div className="activity-info">
                  <div className="activity-name">{a.name}</div>
                  <div className="activity-file">{a.file}</div>
                </div>
              </div>
              <span className="activity-time">🕐 {a.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Economy of Trust Pillars */}
      <div style={{ marginTop: '24px' }}>
        <div className="section-head">Economy of Trust — Core Pillars</div>
        <div className="pillars-grid">
          {[
            { icon: '🔗', title: 'Immutable Registration',  desc: 'Transforming digital files into verifiable assets through a fixed history of transactions.' },
            { icon: '🔬', title: 'Data Integrity',          desc: 'Automating extraction of deep metadata and generating unique SHA-256 hashes.' },
            { icon: '🛡️', title: 'Proactive Protection',   desc: 'Providing a "technical passport" and Copyright Noise to defend IP against AI training.' },
            { icon: '🌉', title: 'Seamless Verification',   desc: 'Bridging simple cloud storage and complex blockchain registries effortlessly.' },
          ].map(p => (
            <div className="pillar-card" key={p.title}>
              <div className="pillar-icon">{p.icon}</div>
              <div className="pillar-title">{p.title}</div>
              <div className="pillar-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}