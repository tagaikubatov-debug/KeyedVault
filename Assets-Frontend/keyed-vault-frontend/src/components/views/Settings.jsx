import { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState({ asset: true, ledger: true, threat: true, node: false });
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '36px', height: '20px',
        borderRadius: '10px',
        background: checked ? 'var(--purple)' : 'var(--bg-input)',
        border: `1px solid ${checked ? 'var(--purple)' : 'var(--border-bright)'}`,
        cursor: 'pointer', position: 'relative', transition: 'var(--transition)',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px',
        left: checked ? '17px' : '2px',
        width: '14px', height: '14px',
        borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
        display: 'block',
      }} />
    </button>
  );

  return (
    <div>
      <div className="view-header">
        <h1 className="view-title">Vault Configuration</h1>
        <p className="view-subtitle">Manage your vault identity, security preferences, and system settings</p>
      </div>

      <div className="settings-grid">

        {/* Identity */}
        <div className="settings-section">
          <div className="settings-section-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L2 4v4c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L8 1.5z" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            Global Vault Identity
          </div>

          <div className="input-group">
            <div className="input-label">Author Identity</div>
            <input
              className="input-field"
              value="GLOBAL AUTHOR IDENTITY: ID:7734_EMIR"
              disabled
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.04em' }}
            />
          </div>

          <div className="input-group">
            <div className="input-label">Owner ID</div>
            <input
              className="input-field"
              value="USR-0xA3F7C2"
              disabled
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--purple)' }}
            />
          </div>

          <div className="input-group">
            <div className="input-label">Vault Key</div>
            <input
              className="input-field"
              value="vk_7f3a2c8b…e4d1"
              disabled
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            />
          </div>

          <div style={{
            background: 'var(--orange-bg)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            fontSize: '12px', color: 'var(--orange)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ⚠️ Identity fields are read-only. Contact your vault administrator to make changes.
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <div className="settings-section-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2a5.5 5.5 0 015.5 5.5c0 2.5.8 3.8 1.5 4.5H1c.7-.7 1.5-2 1.5-4.5A5.5 5.5 0 018 2z" stroke="var(--accent)" strokeWidth="1.4"/>
              <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Notifications
          </div>

          {[
            { key: 'asset',  label: 'Asset hardened',   desc: 'Notify when a new asset is processed' },
            { key: 'ledger', label: 'Ledger sync',       desc: 'Notify when the ledger syncs with node' },
            { key: 'threat', label: 'Threat detected',   desc: 'Notify on unauthorized access attempts' },
            { key: 'node',   label: 'Node status change',desc: 'Notify when a P2P node goes offline' },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>
              </div>
              <Toggle
                checked={notifications[key]}
                onChange={v => setNotifications(prev => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
        </div>

        {/* Security */}
        <div className="settings-section">
          <div className="settings-section-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="var(--accent)" strokeWidth="1.4"/>
              <path d="M5 7V5a3 3 0 016 0v2" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Security Settings
          </div>

          {[
            { label: '2FA Authentication', status: 'Enabled',  color: 'var(--orange)', note: 'Action needed' },
            { label: 'End-to-end Encryption', status: 'Active', color: 'var(--green)',  note: null },
            { label: 'Audit Logging', status: 'Active',         color: 'var(--green)',  note: null },
          ].map(({ label, status, color, note }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, display: 'inline-block' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color, fontWeight: 600 }}>{status}</span>
                {note && <span style={{ fontSize: '11px', color: 'var(--orange)', cursor: 'pointer' }}>{note}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* API / Backend */}
        <div className="settings-section">
          <div className="settings-section-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 5l4 2.5L2 10M8 13h6" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Backend Connection
          </div>

          <div className="input-group">
            <div className="input-label">API Base URL</div>
            <input className="input-field" defaultValue="http://localhost:8080/api/local" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }} />
          </div>

          <div className="input-group">
            <div className="input-label">Process Endpoint</div>
            <input className="input-field" value="/process" disabled style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }} />
          </div>

          <div className="input-group">
            <div className="input-label">Ledger Endpoint</div>
            <input className="input-field" value="/ledger" disabled style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} onClick={save}>
            {saved ? '✅ Saved' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}