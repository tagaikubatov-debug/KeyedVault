import { useState } from 'react';

export default function GlobalNetwork() {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleConnect = async () => {
    setConnecting(true);
    await new Promise(r => setTimeout(r, 2200));
    setConnecting(false);
    setConnected(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="view-header-row">
        <div className="view-header">
          <h1 className="view-title">Global Swarm Network</h1>
          <p className="view-subtitle">P2P node distribution and connection management</p>
        </div>

        {/* Search */}
        <div className="search-bar" style={{ width: '300px' }}>
          <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by DNA Hash or Author ID…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Sandbox Panel */}
      {!connected ? (
        <div className="network-sandbox">
          {/* Animated background rings */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {[200, 340, 480].map((r, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: r, height: r,
                border: '1px solid rgba(124,108,248,0.06)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
              }} />
            ))}
          </div>

          <div className="sandbox-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 10c0-3 4.5-6.5 10-6.5S24 7 24 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M7.5 13.5c0-2 3-4 6.5-4s6.5 2 6.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M11 17c0-1.1 1.3-2 3-2s3 .9 3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="5" y1="5" x2="23" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>

          <h2 className="sandbox-title">P2P Sandbox Mode</h2>
          <p className="sandbox-sub">You are currently in isolated mode. Connect to the Swarm to view other nodes.</p>

          <button className="btn btn-outline" onClick={handleConnect} disabled={connecting}>
            {connecting ? (
              <><span className="spinner" style={{ borderTopColor: 'var(--purple)' }} />Initializing…</>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7c0-2.5 2.2-5 5-5s5 2.5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M4 9c0-1.6 1.3-3 3-3s3 1.4 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="7" cy="11" r="1.3" fill="currentColor"/>
                </svg>
                Initialize Connection
              </>
            )}
          </button>
        </div>
      ) : (
        /* Connected state — live node grid */
        <div>
          {/* Status bar */}
          <div style={{
            background: 'var(--green-bg)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--radius-md)', padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '20px', fontSize: '13px', color: 'var(--green)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Connected to Swarm — 47 active nodes detected
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setConnected(false)}
            >
              Disconnect
            </button>
          </div>

          {/* Node cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {[
              { id: '#47', loc: 'Frankfurt, DE', lat: 50.1, status: 'online',  ping: '12ms',  load: 34 },
              { id: '#12', loc: 'New York, US',  lat: 40.7, status: 'online',  ping: '88ms',  load: 61 },
              { id: '#29', loc: 'Singapore, SG', lat: 1.3,  status: 'online',  ping: '143ms', load: 48 },
              { id: '#33', loc: 'London, UK',    lat: 51.5, status: 'online',  ping: '24ms',  load: 27 },
              { id: '#08', loc: 'Tokyo, JP',     lat: 35.6, status: 'online',  ping: '196ms', load: 52 },
              { id: '#55', loc: 'São Paulo, BR', lat: -23.5,status: 'syncing', ping: '210ms', load: 79 },
            ].map(node => (
              <div className="card" key={node.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--purple)' }}>Node {node.id}</span>
                  <span className={`badge ${node.status === 'online' ? 'badge-green' : 'badge-orange'}`}>
                    <span className="badge-dot" />{node.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>🌍 {node.loc}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Ping: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{node.ping}</span></span>
                  <span>Load: <span style={{ color: node.load > 70 ? 'var(--orange)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{node.load}%</span></span>
                </div>
                <div className="progress-track" style={{ marginTop: '8px' }}>
                  <div
                    className={`progress-fill ${node.load > 70 ? '' : 'progress-fill-purple'}`}
                    style={{ width: `${node.load}%`, background: node.load > 70 ? 'var(--orange)' : undefined }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}