/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from 'react';

/* ─── Context ─────────────────────────────────────────────────── */
const ToastCtx = createContext(null);

/**
 * useToast()
 * Returns: { success, error, info, warn }
 * Each takes (message, durationMs = 3500)
 */
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ─── Icons ────────────────────────────────────────────────────── */
const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="var(--green)" strokeWidth="1.4"/>
      <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="var(--red)" strokeWidth="1.4"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  warn: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13.5H1.5L8 2z" stroke="var(--orange)" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M8 6v3.5" stroke="var(--orange)" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="11.5" r="0.75" fill="var(--orange)"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="var(--accent)" strokeWidth="1.4"/>
      <path d="M8 7v5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="4.5" r="0.85" fill="var(--accent)"/>
    </svg>
  ),
};

const ACCENT = {
  success: 'var(--green)',
  error:   'var(--red)',
  warn:    'var(--orange)',
  info:    'var(--accent)',
};

/* ─── Single Toast ─────────────────────────────────────────────── */
function Toast({ id, type, message, onDismiss }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-bright)',
        borderLeft: `3px solid ${ACCENT[type]}`,
        borderRadius: 'var(--radius-md)',
        padding: '11px 14px',
        minWidth: '280px', maxWidth: '380px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        animation: 'toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'default',
      }}
    >
      {/* Icon */}
      <span style={{ flexShrink: 0 }}>{ICONS[type]}</span>

      {/* Message */}
      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {message}
      </span>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1,
          padding: '0 2px', flexShrink: 0, transition: 'var(--transition)',
        }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/* ─── Provider ─────────────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timerRef.current[id]);
    delete timerRef.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, [setToasts]);

  const push = useCallback((type, message, duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    timerRef.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss, setToasts]);

  const api = {
    success: (msg, ms) => push('success', msg, ms),
    error:   (msg, ms) => push('error',   msg, ms),
    warn:    (msg, ms) => push('warn',    msg, ms),
    info:    (msg, ms) => push('info',    msg, ms),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}

      {/* Portal-like fixed container — always on top */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: '10px',
          alignItems: 'flex-end',
          pointerEvents: 'none',   // container transparent to mouse …
        }}
      >
        {toasts.map(t => (
          /* … but each toast is clickable */
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast id={t.id} type={t.type} message={t.message} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      {/* Keyframe injected once via a style tag */}
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastCtx.Provider>
  );
}