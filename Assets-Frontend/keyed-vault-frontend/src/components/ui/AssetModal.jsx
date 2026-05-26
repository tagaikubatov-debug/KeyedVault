import { useEffect, useState, useCallback } from 'react';

/**
 * AssetModal
 * Props:
 *   asset  – object { name, hash, size, status, protectedAt? }  |  null
 *   onClose – () => void
 */
export default function AssetModal({ asset, onClose }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    if (!asset) return;

    // tiny delay so CSS transition fires
    const t = setTimeout(() => setVisible(true), 10);
    return () => {
      clearTimeout(t);
      setVisible(false);
    };
  }, [asset, setVisible]);

  // Close on Escape key
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!asset) return;
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [asset, handleKey]);

  const copyHash = () => {
    if (!asset?.hash) return;
    navigator.clipboard.writeText(asset.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!asset) return null;

  const statusColor = {
    hardened:   'var(--green)',
    processing: 'var(--orange)',
    failed:     'var(--red)',
  }[asset.status] ?? 'var(--text-muted)';

  const statusBg = {
    hardened:   'var(--green-bg)',
    processing: 'var(--orange-bg)',
    failed:     'var(--red-bg)',
  }[asset.status] ?? 'transparent';

  const statusBorder = {
    hardened:   'rgba(16,185,129,0.3)',
    processing: 'rgba(245,158,11,0.3)',
    failed:     'rgba(239,68,68,0.3)',
  }[asset.status] ?? 'var(--border)';

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Panel — stop click propagation so backdrop click only closes */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(124,108,248,0.08)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}
      >
        {/* Top accent line */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, var(--purple), var(--accent))',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '22px 24px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Asset Details
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {asset.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)',
              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', lineHeight: 1, transition: 'var(--transition)', flexShrink: 0, marginLeft: '12px',
            }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-bright)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: statusBg,
              border: `1px solid ${statusBorder}`,
              color: statusColor,
              padding: '5px 14px', borderRadius: '99px',
              fontSize: '12px', fontWeight: 700,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
              {asset.status.toUpperCase()}
            </div>
          </div>

          {/* DNA Hash */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              DNA Hash (SHA-256)
            </div>
            <div style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', wordBreak: 'break-all', flex: 1 }}>
                {asset.hash || '—'}
              </span>
              {asset.hash && (
                <button
                  onClick={copyHash}
                  style={{
                    background: copied ? 'var(--green-bg)' : 'var(--bg-card)',
                    border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--border-bright)'}`,
                    borderRadius: '6px', cursor: 'pointer',
                    color: copied ? 'var(--green)' : 'var(--text-secondary)',
                    padding: '5px 10px', fontSize: '11px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '5px',
                    transition: 'var(--transition)', flexShrink: 0,
                  }}
                >
                  {copied ? (
                    <>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M1.5 5.5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M2.5 7.5H2a1 1 0 01-1-1V2a1 1 0 011-1h4.5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'File Name',    value: asset.name,                     mono: true  },
              { label: 'File Size',    value: asset.size || '—',              mono: true  },
              { label: 'Owner ID',     value: 'USR-0xA3F7C2',                mono: true  },
              { label: 'Protected At', value: asset.protectedAt
                  ? new Date(asset.protectedAt).toLocaleString()
                  : new Date().toLocaleString(),                              mono: false },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '12px 14px',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  {label}
                </div>
                <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)', fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Security notice */}
          <div style={{
            background: 'rgba(124,108,248,0.06)', border: '1px solid rgba(124,108,248,0.18)',
            borderRadius: 'var(--radius-md)', padding: '12px 14px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>🛡️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                Cryptographically Secured
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                This asset's SHA-256 hash is immutably registered on the ledger. Any modification to the original file will produce a different hash, instantly detecting tampering.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
        }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={copyHash}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Copy Full Hash
          </button>
        </div>
      </div>
    </div>
  );
}