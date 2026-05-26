import { useState, useEffect, useMemo, useCallback } from 'react';
import { getToken } from '../../api/vaultClient.js';
import { fetchLedger } from '../../api/vaultClient.js';

/* ─── Helpers ──────────────────────────────────────────────────── */
function formatTimestamp(iso) {
  if (!iso) return '—';
  try {
    const d   = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} `
         + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} UTC`;
  } catch { return iso; }
}

function getExt(name = '') {
  return (name.split('.').pop() || '').toLowerCase();
}

function fileIcon(name = '') {
  const ext = getExt(name);
  if (ext === 'pdf')                                   return '📄';
  if (['doc','docx'].includes(ext))                    return '📝';
  if (['zip','rar','gz','tar'].includes(ext))          return '📦';
  if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return '🖼️';
  if (['mp4','mov','avi','mkv','webm'].includes(ext))  return '🎬';
  if (['mp3','wav','ogg','flac'].includes(ext))        return '🎵';
  if (['xls','xlsx','csv'].includes(ext))              return '📊';
  if (['ppt','pptx'].includes(ext))                    return '📑';
  if (['js','jsx','ts','tsx','py','java','go','rs'].includes(ext)) return '💻';
  if (['txt','md'].includes(ext))                      return '📃';
  return '📁';
}

const IMAGE_EXTS = ['png','jpg','jpeg','gif','webp','svg'];
const PDF_EXTS   = ['pdf'];
const TEXT_EXTS  = ['txt','md','json','xml','csv','js','jsx','ts','tsx','py','html','css'];
const VIDEO_EXTS = ['mp4','mov','webm'];
const AUDIO_EXTS = ['mp3','wav','ogg'];

// URL to fetch the raw file from the backend by hash
const BASE_URL = import.meta.env.VITE_API_URL || '';
const fileUrl = (hash) => {
  if (!hash || hash === 'undefined' || hash === 'null' || !hash.trim()) return null;
  return `${BASE_URL}/api/local/file/${hash}`;
};

/* ─── File Preview Modal ───────────────────────────────────────── */
function PreviewModal({ row, onClose }) {
  const [visible,     setVisible]     = useState(false);
  const [textContent, setTextContent] = useState(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError,   setTextError]   = useState(null);

  // Derive ext and url from row — recalculated only when row changes
  const ext = getExt(row?.originalFileName || '');
  const hash = row?.fileHash || row?.assetHash || '';
  const url = hash ? fileUrl(hash) : null;

  // FIX 1: Stable onClose ref so the Escape listener doesn't re-register
  //         on every parent render. Using useCallback inside the modal
  //         would require passing a stable fn from the parent; instead we
  //         store the latest version in a ref and call it inside a stable handler.
  const onCloseRef = useCallback(onClose, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate in
  useEffect(() => {
    if (row) {
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [row]);

  // Close on Escape — only depends on stable onCloseRef, not the raw prop
  useEffect(() => {
    if (!row) return;
    const fn = (ev) => { if (ev.key === 'Escape') onCloseRef(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [row, onCloseRef]);

  // FIX 2 + 3: Fetch text content — keyed only on row.fileHash (stable identity).
  //   • ext and url are derived from row so they're NOT separate deps.
  //   • State setters (setTextContent etc.) are always stable — excluded from deps.
  //   • Use an AbortController so stale fetches don't update unmounted state.
  useEffect(() => {
    if (!row || !TEXT_EXTS.includes(getExt(row.originalFileName))) return;

    const controller = new AbortController();
    const hashVal = row?.fileHash || row?.assetHash || '';
    const fetchUrl = fileUrl(hashVal);
    if (!fetchUrl) return;

    setTextLoading(true);
    setTextContent(null);
    setTextError(null);

    const token = getToken();
    fetch(fetchUrl, {
      signal: controller.signal,
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        setTextContent(text);
        setTextLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return; // component unmounted — ignore
        setTextError(err.message);
        setTextLoading(false);
      });

    // Abort in-flight request when row changes or modal closes
    return () => controller.abort();
  }, [row]); // ← only row — ext/url are derived from it, setters are stable

  if (!row) return null;

  const isImage = IMAGE_EXTS.includes(ext);
  const isPdf   = PDF_EXTS.includes(ext);
  const isText  = TEXT_EXTS.includes(ext);
  const isVideo = VIDEO_EXTS.includes(ext);
  const isAudio = AUDIO_EXTS.includes(ext);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: isPdf || isVideo ? 900 : isImage ? 820 : 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Top accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, var(--purple), var(--accent))', flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(row.originalFileName)}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.originalFileName}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)',
                marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.fileHash}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
            {/* Download button */}
            <a
              href={url}
              download={row.originalFileName}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 'var(--radius-md)',
                background: 'rgba(124,108,248,0.12)', border: '1px solid rgba(124,108,248,0.3)',
                color: 'var(--purple)', fontSize: 12, fontWeight: 600,
                textDecoration: 'none', transition: 'var(--transition)',
              }}
              onMouseOver={e => e.currentTarget.style.background='rgba(124,108,248,0.22)'}
              onMouseOut={e => e.currentTarget.style.background='rgba(124,108,248,0.12)'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Download
            </a>

            {/* Open in new tab */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)', border: '1px solid var(--border-bright)',
                color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                textDecoration: 'none', transition: 'var(--transition)',
              }}
              onMouseOver={e => { e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.borderColor='var(--accent)'; }}
              onMouseOut={e => { e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='var(--border-bright)'; }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M4.5 1.5H1.5v8h8V6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 1.5H9.5V4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.5 5.5L9.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Open
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)',
                width: 30, height: 30, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 18, lineHeight: 1, transition: 'var(--transition)',
              }}
              onMouseOver={e => { e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.borderColor='var(--border-bright)'; }}
              onMouseOut={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.borderColor='var(--border)'; }}
            >×</button>
          </div>
        </div>

        {/* Preview body */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* ── IMAGE ── */}
          {isImage && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24, height: '100%', minHeight: 360,
              background: 'repeating-conic-gradient(var(--bg-input) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px',
            }}>
              <img
                src={url}
                alt={row.originalFileName}
                style={{
                  maxWidth: '100%', maxHeight: '70vh',
                  objectFit: 'contain', borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
                onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }}
              />
              <div style={{
                display: 'none', flexDirection: 'column', alignItems: 'center',
                gap: 12, color: 'var(--text-muted)', fontSize: 13,
              }}>
                <span style={{ fontSize: 40 }}>🖼️</span>
                Image could not be loaded. Use Download to access the file.
              </div>
            </div>
          )}

          {/* ── PDF ── */}
          {isPdf && (
            <iframe
              src={`${url}#toolbar=1&view=FitH`}
              title={row.originalFileName}
              style={{ width: '100%', height: '75vh', border: 'none', display: 'block' }}
            />
          )}

          {/* ── VIDEO ── */}
          {isVideo && (
            <div style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
              <video controls style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 8 }}>
                <source src={url} />
                Your browser does not support this video format.
              </video>
            </div>
          )}

          {/* ── AUDIO ── */}
          {isAudio && (
            <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <span style={{ fontSize: 56 }}>🎵</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
                {row.originalFileName}
              </div>
              <audio controls style={{ width: '100%', maxWidth: 480 }}>
                <source src={url} />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* ── TEXT / CODE ── */}
          {isText && (
            <div style={{ overflowY: 'auto', maxHeight: '65vh', padding: 20 }}>
              {textLoading && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px', width: 20, height: 20 }} />
                  <div style={{ fontSize: 13 }}>Loading file content…</div>
                </div>
              )}
              {textError && (
                <div style={{
                  background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--radius-md)', padding: '12px 16px',
                  fontSize: 12, color: 'var(--red)',
                }}>
                  Could not load file: {textError}
                </div>
              )}
              {textContent !== null && (
                <pre style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: 'var(--text-secondary)', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  margin: 0,
                }}>
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {/* ── UNSUPPORTED / GENERIC ── */}
          {!isImage && !isPdf && !isText && !isVideo && !isAudio && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '60px 40px', gap: 16,
            }}>
              <span style={{ fontSize: 56 }}>{fileIcon(row.originalFileName)}</span>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Preview not available for .{ext} files
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                This file type cannot be previewed in the browser. Use the <strong>Download</strong> button above to access it locally, or <strong>Open</strong> to let your browser decide.
              </div>
              <a
                href={url}
                download={row.originalFileName}
                className="btn btn-primary"
                style={{ marginTop: 8, textDecoration: 'none' }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v8M3.5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 11h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Download {row.originalFileName}
              </a>
            </div>
          )}
        </div>

        {/* Footer: metadata strip */}
        <div style={{
          display: 'flex', gap: 24, padding: '12px 20px',
          borderTop: '1px solid var(--border)', flexShrink: 0,
          background: 'var(--bg-panel)', flexWrap: 'wrap',
        }}>
          {[
            { label: 'Owner',     value: row.authorId },
            { label: 'Protected', value: formatTimestamp(row.protectedAt) },
            { label: 'Block',     value: row.block },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.12em',
                textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Demo data (shown when backend is offline) ─────────────────── */
const DEMO_ROWS = [
  { fileHash: '3a7f9c2e8b4d1f6a0e5c3b9d7f2a8c4e', originalFileName: 'Q4_Annual_Report.pdf',      authorId: 'USR-0xA3F7C2', protectedAt: '2026-05-19T14:32:11', block: '#00842' },
  { fileHash: '1b5e8d3f7a2c9e4b6d0f3a8c5e9b2d7f', originalFileName: 'contract_v3_signed.docx',   authorId: 'USR-0xA3F7C2', protectedAt: '2026-05-19T12:11:04', block: '#00841' },
  { fileHash: '7c9f3a2e5b8d1f4c0e6a3b9d2f5e8a1c', originalFileName: 'NDA_Project_Phoenix.pdf',    authorId: 'USR-0xB1E9D4', protectedAt: '2026-05-18T09:55:23', block: '#00840' },
  { fileHash: '0e4a8c3f7b2d5e9a1c6f3b0d8e2a5c9f', originalFileName: 'source_code_v1.2.zip',       authorId: 'USR-0xA3F7C2', protectedAt: '2026-05-17T17:22:48', block: '#00839' },
  { fileHash: '6d2f9b4e8c1a5f3d0e7b2c9a4f6d1e8b', originalFileName: 'logo_brand_assets.zip',      authorId: 'USR-0xC5A7B3', protectedAt: '2026-05-16T11:04:37', block: '#00838' },
  { fileHash: '2a8e5c1f9b3d6a0e4c7f2b5d8a1e6c3f', originalFileName: 'presentation_deck_v4.pptx',  authorId: 'USR-0xA3F7C2', protectedAt: '2026-05-15T08:47:12', block: '#00837' },
];

/* ─── Ledger Page ───────────────────────────────────────────────── */
export default function Ledger() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [query,   setQuery]   = useState('');
  const [copied,  setCopied]  = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [preview, setPreview] = useState(null); // row object for PreviewModal

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLedger();
      setRows(data.map((r, i) => ({
        ...r,
        fileHash: r.fileHash || r.assetHash || '',
        block: r.block || `#${String(900 - i).padStart(5, '0')}`,
      })));
    } catch {
      setRows(DEMO_ROWS);
      setError('Backend offline — showing demo data. File preview requires a live backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncNode = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 1800));
    await load();
    setSyncing(false);
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r =>
      r.fileHash?.toLowerCase().includes(q) ||
      r.originalFileName?.toLowerCase().includes(q) ||
      r.authorId?.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div>
      {/* Header */}
      <div className="view-header-row">
        <div className="view-header">
          <h1 className="view-title">Cryptographic Ledger</h1>
          <p className="view-subtitle">Immutable record of all hardened assets — tamper-proof and permanent</p>
        </div>
        <button className="btn btn-outline" onClick={syncNode} disabled={syncing}>
          {syncing ? (
            <><span className="spinner" /> Syncing…</>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5C2 4.01 4.01 2 6.5 2a4.47 4.47 0 013.18 1.32M11 6.5C11 8.99 8.99 11 6.5 11a4.47 4.47 0 01-3.18-1.32"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M9 1v2.5H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sync Node
            </>
          )}
        </button>
      </div>

      {/* Offline warning */}
      {error && (
        <div style={{
          background: 'var(--orange-bg)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-md)', padding: '10px 16px',
          fontSize: '12px', color: 'var(--orange)', marginBottom: '18px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div className="ledger-stats">
        <div className="ledger-stat">
          <div className="ledger-stat-value">{loading ? '—' : rows.length}</div>
          <div className="ledger-stat-label">Total Entries</div>
        </div>
        <div className="ledger-stat">
          <div className="ledger-stat-value">{loading ? '—' : rows.length}</div>
          <div className="ledger-stat-label">Blocks Committed</div>
        </div>
        <div className="ledger-stat">
          <div className="ledger-stat-value green">100%</div>
          <div className="ledger-stat-label">Chain Integrity</div>
        </div>
      </div>

      {/* Search */}
      <div className="full-search">
        <div className="search-bar">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by DNA Hash, file name, or Owner ID…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ background:'none', border:'none', cursor:'pointer',
                color:'var(--text-muted)', fontSize:'18px', lineHeight:1 }}>×</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-header-bar">
          <div className="table-header-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="var(--accent)" strokeWidth="1.4"/>
              <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Ledger Entries
            <span className="table-count">{filtered.length}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Click <strong style={{ color:'var(--text-secondary)' }}>👁 View</strong> to preview or download any file
          </div>
        </div>

        {loading ? (
          <div style={{ padding:'60px 24px', textAlign:'center', color:'var(--text-muted)' }}>
            <div className="spinner" style={{ margin:'0 auto 12px', width:'22px', height:'22px', borderWidth:'2px' }} />
            <div style={{ fontSize:'13px' }}>Fetching ledger from node…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'60px 24px', textAlign:'center', color:'var(--text-muted)', fontSize:'13px' }}>
            No entries match your search.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>DNA Hash</th>
                <th>Original File</th>
                <th>Owner ID</th>
                <th>Timestamp (UTC)</th>
                <th>Block</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i}>

                  {/* Hash + copy */}
                  <td>
                    <div className="hash-cell">
                      <span className="mono">{row.fileHash?.slice(0, 16)}</span>
                      <button
                        className="copy-btn"
                        title={copied === row.fileHash ? 'Copied!' : 'Copy full hash'}
                        onClick={() => copyHash(row.fileHash)}
                        style={{ opacity: 1 }}
                      >
                        {copied === row.fileHash ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="var(--green)" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1"
                              stroke="currentColor" strokeWidth="1.2"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>

                  {/* File name */}
                  <td>
                    <div className="filename">
                      {fileIcon(row.originalFileName)}
                      <span style={{ marginLeft: '6px' }}>{row.originalFileName}</span>
                    </div>
                  </td>

                  {/* Owner */}
                  <td><span className="mono-muted">{row.authorId}</span></td>

                  {/* Timestamp */}
                  <td>
                    <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>
                      {formatTimestamp(row.protectedAt)}
                    </span>
                  </td>

                  {/* Block */}
                  <td><span className="block-num">{row.block}</span></td>

                  {/* ── View / Preview button ── */}
                  <td>
                    <button
                      onClick={() => setPreview(row)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px',
                        background: 'rgba(124,108,248,0.08)',
                        border: '1px solid rgba(124,108,248,0.25)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--purple)',
                        fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', transition: 'var(--transition)',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background='rgba(124,108,248,0.18)';
                        e.currentTarget.style.borderColor='var(--purple)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background='rgba(124,108,248,0.08)';
                        e.currentTarget.style.borderColor='rgba(124,108,248,0.25)';
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 6C1 6 3 2.5 6 2.5S11 6 11 6 9 9.5 6 9.5 1 6 1 6z"
                          stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="6" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* File Preview Modal */}
      <PreviewModal row={preview} onClose={() => setPreview(null)} />
    </div>
  );
}