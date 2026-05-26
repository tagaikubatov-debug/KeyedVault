/**
 * LogoIcon
 *
 * Renders your custom logo from /public/logo.png (or .svg / .webp).
 * If the image fails to load (file not added yet), falls back to
 * the animated gradient circle so the UI never breaks.
 *
 * HOW TO ADD YOUR LOGO:
 *   1. Drop your file into  keyed-vault-frontend/public/
 *      Supported names: logo.png | logo.svg | logo.webp | logo.jpg
 *   2. That's it — no import needed. Vite serves public/ at the root URL.
 *
 * Props:
 *   size    (number) – width & height in px.  Default: 32
 *   radius  (string) – border-radius value.   Default: "50%" (circle)
 */

import { useState } from 'react';

// Priority-ordered list: first match that loads wins
const CANDIDATES = ['/logo.png', '/logo.svg', '/logo.webp', '/logo.jpg'];

export default function LogoIcon({ size = 32, radius = '50%' }) {
  const [idx,    setIdx]    = useState(0);   // which candidate to try
  const [failed, setFailed] = useState(false); // all candidates exhausted?

  const handleError = () => {
    const next = idx + 1;
    if (next < CANDIDATES.length) {
      setIdx(next);   // try next format
    } else {
      setFailed(true); // give up → show fallback
    }
  };

  const base = {
    width:        size,
    height:       size,
    borderRadius: radius,
    flexShrink:   0,
    display:      'block',
    objectFit:    'contain',
  };

  // ── Fallback: animated gradient circle ───────────────────────────
  if (failed) {
    return (
      <div style={{
        ...base,
        background: 'conic-gradient(from 180deg, #7c6cf8, #00f0ff, #7c6cf8)',
        animation:  'logoSpin 8s linear infinite',
        boxShadow:  '0 0 14px rgba(124,108,248,.35)',
      }} />
    );
  }

  // ── Custom logo ──────────────────────────────────────────────────
  return (
    <img
      key={idx}                    // force re-mount when switching candidates
      src={CANDIDATES[idx]}
      alt="KEYED logo"
      onError={handleError}
      style={base}
    />
  );
}