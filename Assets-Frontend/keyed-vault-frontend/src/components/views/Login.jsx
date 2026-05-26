import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import LogoIcon from '../ui/LogoIcon.jsx';
import SignUp from './SignUp.jsx';

export default function Login() {
  const { login }   = useAuth();
  const [view,      setView]     = useState('login');
  // Переименовали переменную в loginInput, так как туда можно вводить и username
  const [loginInput, setLoginInput] = useState('');
  const [password,  setPassword] = useState('');
  const [showPw,    setShowPw]   = useState(false);
  const [remember,  setRemember] = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');

  if (view === 'signup') {
    return <SignUp onSwitch={() => setView('login')} />;
  }

  const handleSubmit = async () => {
    if (!loginInput || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);

    // 1. Динамически получаем URL бэкенда из окружения Vercel/Vite
    const BASE_URL = import.meta.env.VITE_API_URL || '';

    try {
      // 2. Подставляем BASE_URL, чтобы запрос летел на Render в продакшене
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Поле на бэке в LoginRequest называется email, передаем туда наш инпут
        body: JSON.stringify({ email: loginInput.trim(), password }),
      });

      // Если бэкенд на Render спит / запускается
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        const currentBackend = BASE_URL || 'http://localhost:8080';
        setError(`Server is spinning up. Please check backend at: ${currentBackend}`);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.token) {
         setError(data.message || 'Invalid credentials. Please try again.');
         setLoading(false);
         return;
      }

      // Pass payload + remember preference to AuthContext
      login(data, remember);

    } catch (err) {
      const currentBackend = BASE_URL || 'http://localhost:8080';
      setError(`Cannot reach server at ${currentBackend}. Please check your connection.`);
      console.error("Login fatal error:", err);
      setLoading(false);
    }
  };

  return (
      <div className="login-page">
        <div className="login-bg-glow" />

        {/* Logo */}
        <div className="login-logo">
          <LogoIcon size={72} radius="20px" />
          <div>
            <div className="login-logo-title">
              <span className="keyed">KEYED</span>
              <span className="sep">|</span>
              <span className="vault">ENTERPRISE VAULT</span>
            </div>
            <div className="login-logo-sub">Secure access to your digital fortress</div>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-title">Sign in to your vault</div>

          {error && (
              <div style={{
                background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px',
                fontSize: '12px', color: 'var(--red)', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '7px',
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5.5" stroke="var(--red)" strokeWidth="1.2"/>
                  <path d="M6 3.5V6.5" stroke="var(--red)" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="6" cy="8.5" r=".7" fill="var(--red)"/>
                </svg>
                {error}
              </div>
          )}

          {/* Username or Email Input */}
          <div className="input-group">
            {/* Изменили плейсхолдер и лейбл под новые возможности бэка */}
            <div className="input-label">Username or Email</div>
            <div className="input-icon-wrap">
              <svg className="input-icon-left" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1 5l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                  className="input-field"
                  type="text"
                  placeholder="username or you@domain.com"
                  value={loginInput}
                  onChange={e => setLoginInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <div className="input-label">Password</div>
            <div className="input-icon-wrap">
              <svg className="input-icon-left" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4 6V4a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                  className="input-field"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoComplete="current-password"
                  style={{ paddingRight: '40px' }}
              />
              <button
                  type="button"
                  className="show-pw-btn"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
              >
                {showPw ? (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M1 7.5C1 7.5 3.5 3 7.5 3s6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5S1 7.5 1 7.5z"
                            stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M2 2l11 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                ) : (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M1 7.5C1 7.5 3.5 3 7.5 3s6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5S1 7.5 1 7.5z"
                            stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="login-footer-row">
            <label className="remember-row">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <span className="forgot-link">Forgot password?</span>
          </div>

          {/* Submit */}
          <button
              className="btn btn-lg"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', justifyContent: 'center',
                background: 'linear-gradient(135deg, #5a4fcf, #7c6cf8, #00b8cc)',
                color: '#fff', fontWeight: 700, fontSize: '14px',
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
          >
            {loading ? <><span className="spinner" /> Authenticating…</> : 'Access Vault'}
          </button>

          <div className="login-register">
            Don&apos;t have an account?{' '}
            <span className="register-link" onClick={() => { setError(''); setView('signup'); }}>
            Create account
          </span>
          </div>
        </div>
      </div>
  );
}