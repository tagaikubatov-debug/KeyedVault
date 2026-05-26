import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../ui/ToastContainer.jsx';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const AI_BASE  = `${BASE_URL}/api/ai`;

function getToken() {
  return localStorage.getItem('keyed_jwt') || sessionStorage.getItem('keyed_jwt') || null;
}
function authHeaders(extra = {}) {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

// ─── Notary Tab ────────────────────────────────────────────────────────────
function NotaryTab() {
  const { user } = useAuth();
  const toast     = useToast();
  const authorId  = user?.authorId ?? user?.username ?? 'ANONYMOUS';

  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [aiStatus, setAiStatus]   = useState(null); // null | 'UP' | 'DOWN'
  const bottomRef                 = useRef(null);
  const textareaRef               = useRef(null);

  useEffect(() => {
    fetch(`${AI_BASE}/health`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setAiStatus(d.python_ai_engine === 'UP' ? 'UP' : 'DOWN'))
      .catch(() => setAiStatus('DOWN'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${AI_BASE}/notary/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ description: text, authorId, assetHash: '' }),
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setMessages(prev => [...prev, {
          role: 'ai', text: data.document,
          lawRefs: data.law_refs || [], timestamp: data.timestamp,
        }]);
      } else {
        throw new Error(data.message || 'Ошибка генерации');
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: err.message }]);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [input, loading, authorId, toast]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Скопировано'));
  };

  const exportPdf = async (text) => {
    try {
      const res = await fetch(`${AI_BASE}/notary/export-pdf`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text, filename: `notary_${Date.now()}.pdf` }),
      });
      if (!res.ok) throw new Error('PDF генерация не удалась');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `notary_${Date.now()}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('PDF скачан');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="ai-chat-layout">
      {/* Status bar */}
      <div className="ai-status-bar">
        <span className={`ai-status-dot ${aiStatus === 'UP' ? 'dot-green' : aiStatus === 'DOWN' ? 'dot-red' : 'dot-orange'}`} />
        <span className="ai-status-label">
          {aiStatus === 'UP' ? 'AI Engine Online' : aiStatus === 'DOWN' ? 'AI Engine Offline' : 'Checking…'}
        </span>
        <span className="ai-status-hint">Claude Sonnet · RAG · KG Law</span>
      </div>

      {/* Messages */}
      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <div className="ai-welcome-icon">⚖️</div>
            <div className="ai-welcome-title">AI Notary</div>
            <div className="ai-welcome-sub">Опишите нужный документ — получите готовый нотариальный текст на основе законодательства КР</div>
            <div className="ai-suggestions">
              {['Доверенность на управление автомобилем', 'Договор аренды квартиры', 'Согласие на выезд ребёнка'].map(s => (
                <button key={s} className="ai-suggestion" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ai-msg-${msg.role}`}>
            {msg.role === 'user' && (
              <div className="ai-msg-user-bubble">{msg.text}</div>
            )}
            {msg.role === 'ai' && (
              <div className="ai-msg-ai-wrap">
                <div className="ai-msg-avatar">⚖️</div>
                <div className="ai-msg-ai-content">
                  <pre className="ai-doc-text">{msg.text}</pre>
                  {msg.lawRefs?.length > 0 && (
                    <div className="ai-law-refs">
                      {msg.lawRefs.map(r => <span key={r} className="ai-law-tag">{r}</span>)}
                    </div>
                  )}
                  <div className="ai-msg-actions">
                    <button className="ai-action-btn" onClick={() => copyText(msg.text)}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M11 5V3.5A1.5 1.5 0 009.5 2H3.5A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.4"/>
                      </svg>
                      Копировать
                    </button>
                    <button className="ai-action-btn ai-action-pdf" onClick={() => exportPdf(msg.text)}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M9 2H4a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 004 14h8a1.5 1.5 0 001.5-1.5V6.5L9 2z" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M9 2v4.5H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        <path d="M6 10h4M6 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
            {msg.role === 'error' && (
              <div className="ai-msg-error">{msg.text}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="ai-msg ai-msg-ai">
            <div className="ai-msg-ai-wrap">
              <div className="ai-msg-avatar">⚖️</div>
              <div className="ai-typing">
                <span/><span/><span/>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="ai-input-bar">
        <textarea
          ref={textareaRef}
          className="ai-input"
          rows={2}
          placeholder="Опишите нужный документ… (Enter — отправить, Shift+Enter — новая строка)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className={`ai-send-btn ${loading ? 'ai-send-loading' : ''}`}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          {loading
            ? <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
            : <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8L14 2L8 14L7 9L2 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
          }
        </button>
      </div>
    </div>
  );
}

// ─── Advocate Tab ──────────────────────────────────────────────────────────
function AdvocateTab() {
  const toast     = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [context, setContext]   = useState('');
  const [lang, setLang]         = useState('ru');
  const [loading, setLoading]   = useState(false);
  const [showCtx, setShowCtx]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${AI_BASE}/legal/ask`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ question: q, context, language: lang }),
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setMessages(prev => [...prev, { role: 'ai', text: data.answer, sources: data.sources || [], disclaimer: data.disclaimer }]);
      } else {
        throw new Error(data.message || 'Ошибка');
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: err.message }]);
    } finally {
      setLoading(false);
    }
  }, [input, context, lang, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="ai-chat-layout">
      {/* Lang + Context controls */}
      <div className="ai-controls-bar">
        <div className="ai-lang-select">
          {[['ru','RU'],['en','EN'],['ky','KY']].map(([v,l]) => (
            <button key={v} className={`ai-lang-btn ${lang===v?'active':''}`} onClick={() => setLang(v)}>{l}</button>
          ))}
        </div>
        <button className="ai-ctx-toggle" onClick={() => setShowCtx(p => !p)}>
          {showCtx ? 'Скрыть контекст' : 'Добавить контекст'}
        </button>
      </div>
      {showCtx && (
        <textarea
          className="ai-context-input"
          rows={3}
          placeholder="Дополнительный контекст к вашему вопросу…"
          value={context}
          onChange={e => setContext(e.target.value)}
        />
      )}

      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <div className="ai-welcome-icon">🏛️</div>
            <div className="ai-welcome-title">AI Advocate</div>
            <div className="ai-welcome-sub">Задайте вопрос по международному праву, ЕКПЧ, МУС или законодательству КР</div>
            <div className="ai-suggestions">
              {['Как подать жалобу в ЕКПЧ?', 'Права при задержании', 'Нарушение трудового договора'].map(s => (
                <button key={s} className="ai-suggestion" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ai-msg-${msg.role}`}>
            {msg.role === 'user' && <div className="ai-msg-user-bubble">{msg.text}</div>}
            {msg.role === 'ai' && (
              <div className="ai-msg-ai-wrap">
                <div className="ai-msg-avatar">🏛️</div>
                <div className="ai-msg-ai-content">
                  <div className="ai-doc-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  {msg.sources?.length > 0 && (
                    <div className="ai-law-refs">{msg.sources.map(s => <span key={s} className="ai-law-tag">{s}</span>)}</div>
                  )}
                  {msg.disclaimer && <div className="ai-disclaimer">{msg.disclaimer}</div>}
                  <div className="ai-msg-actions">
                    <button className="ai-action-btn" onClick={() => navigator.clipboard.writeText(msg.text).then(() => toast.success('Скопировано'))}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M11 5V3.5A1.5 1.5 0 009.5 2H3.5A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.4"/>
                      </svg>
                      Копировать
                    </button>
                  </div>
                </div>
              </div>
            )}
            {msg.role === 'error' && <div className="ai-msg-error">{msg.text}</div>}
          </div>
        ))}
        {loading && (
          <div className="ai-msg ai-msg-ai">
            <div className="ai-msg-ai-wrap">
              <div className="ai-msg-avatar">🏛️</div>
              <div className="ai-typing"><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ai-input-bar">
        <textarea className="ai-input" rows={2} placeholder="Ваш правовой вопрос…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown} disabled={loading} />
        <button className={`ai-send-btn ${loading ? 'ai-send-loading' : ''}`}
          onClick={send} disabled={loading || !input.trim()}>
          {loading
            ? <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
            : <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8L14 2L8 14L7 9L2 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
          }
        </button>
      </div>
    </div>
  );
}

// ─── Plagiarism Tab ────────────────────────────────────────────────────────
function PlagiarismTab() {
  const toast = useToast();
  const [fileA, setFileA]     = useState(null);
  const [fileB, setFileB]     = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!fileA || !fileB) { toast.error('Загрузите оба файла'); return; }
    setLoading(true); setResult(null);
    try {
      const form = new FormData();
      form.append('file_a', fileA);
      form.append('file_b', fileB);
      const token = getToken();
      const res = await fetch(`${AI_BASE}/plagiarism/check`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setResult(data);
      } else {
        throw new Error(data.message || 'Ошибка анализа');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = {
    ORIGINAL:  'var(--green)',
    SUSPECT:   'var(--orange)',
    DUPLICATE: 'var(--red)',
  };

  return (
    <div className="ai-plagiarism-layout">
      <div className="ai-welcome" style={{ marginBottom: '24px' }}>
        <div className="ai-welcome-icon">🔬</div>
        <div className="ai-welcome-title">CLIP Plagiarism Check</div>
        <div className="ai-welcome-sub">Сравнение изображений через нейросеть CLIP. Загрузите два файла для проверки схожести.</div>
      </div>

      <div className="ai-plagiarism-uploads">
        {[['A', fileA, setFileA], ['B', fileB, setFileB]].map(([label, file, setter]) => (
          <label key={label} className={`ai-upload-zone ${file ? 'has-file' : ''}`}>
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => setter(e.target.files[0] || null)} />
            {file ? (
              <>
                <img src={URL.createObjectURL(file)} alt="" className="ai-upload-preview" />
                <div className="ai-upload-name">{file.name}</div>
              </>
            ) : (
              <>
                <div className="ai-upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15V4M8 8l4-4 4 4" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 18v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="ai-upload-label">Файл {label}</div>
                <div className="ai-upload-sub">PNG, JPG, WEBP</div>
              </>
            )}
          </label>
        ))}
      </div>

      <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}
        onClick={check} disabled={loading || !fileA || !fileB}>
        {loading
          ? <><span className="spinner" style={{ width: '13px', height: '13px', borderWidth: '2px' }} /> Анализируется…</>
          : '🔍 Проверить схожесть'
        }
      </button>

      {result && (
        <div className="ai-plagiarism-result">
          <div className="ai-result-score" style={{ color: verdictColor[result.verdict] }}>
            {result.similarity_pct}%
          </div>
          <div className="ai-result-verdict" style={{ color: verdictColor[result.verdict] }}>
            {result.verdict}
          </div>
          <div className="ai-result-details">{result.details}</div>
          <div className="ai-result-bar">
            <div className="ai-result-fill"
              style={{ width: `${result.similarity_pct}%`, background: verdictColor[result.verdict] }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
const TABS = [
  { id: 'notary',    label: 'Notary',    icon: '⚖️' },
  { id: 'advocate',  label: 'Advocate',  icon: '🏛️' },
  { id: 'plagiarism',label: 'Plagiarism',icon: '🔬' },
];

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('notary');

  return (
    <div>
      <div className="view-header">
        <h1 className="view-title">AI Legal Suite</h1>
        <p className="view-subtitle">Claude Sonnet · RAG · Законодательство КР · CLIP Vision</p>
      </div>

      <div className="ai-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`ai-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="ai-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ai-panel">
        {activeTab === 'notary'     && <NotaryTab />}
        {activeTab === 'advocate'   && <AdvocateTab />}
        {activeTab === 'plagiarism' && <PlagiarismTab />}
      </div>
    </div>
  );
}
