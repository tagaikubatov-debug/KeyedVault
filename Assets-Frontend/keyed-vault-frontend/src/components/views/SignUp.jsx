import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import LogoIcon from '../ui/LogoIcon.jsx';

// ── Validation helpers ────────────────────────────────────────────
const validate = (fields) => {
  const errs = {};
  if (!fields.fullName.trim())                     errs.fullName    = 'Full name is required.';
  if (!fields.username.trim())                     errs.username    = 'Username is required.';
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(fields.username))
                                                   errs.username    = '3–20 chars, letters/numbers/underscore only.';
  if (!fields.email.trim())                        errs.email       = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
                                                   errs.email       = 'Enter a valid email address.';
  if (!fields.phone.trim())                        errs.phone       = 'Phone number is required.';
  else if (!/^\+?[\d\s\-().]{7,20}$/.test(fields.phone))
                                                   errs.phone       = 'Enter a valid phone number.';
  if (!fields.password)                            errs.password    = 'Password is required.';
  else if (fields.password.length < 8)             errs.password    = 'Minimum 8 characters.';
  else if (!/[A-Z]/.test(fields.password))         errs.password    = 'Must contain at least one uppercase letter.';
  else if (!/[0-9]/.test(fields.password))         errs.password    = 'Must contain at least one number.';
  if (!fields.confirm)                             errs.confirm     = 'Please confirm your password.';
  else if (fields.confirm !== fields.password)     errs.confirm     = 'Passwords do not match.';
  if (!fields.gender)                              errs.gender      = 'Please select your gender.';
  return errs;
};

// ── Password strength meter ───────────────────────────────────────
function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ].filter(Boolean).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];

  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? colors[score] : 'var(--border-bright)',
            transition: 'background .3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>
        {labels[score]}
      </span>
    </div>
  );
}

// ── Eye toggle icon ───────────────────────────────────────────────
function EyeIcon({ show }) {
  return show ? (
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
  );
}

// ── Field wrapper ─────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="input-group" style={{ marginBottom: error ? 6 : 16 }}>
      <div className="input-label">{label}</div>
      {children}
      {error && (
        <div style={{
          fontSize: 11, color: 'var(--red)', marginTop: 5,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4.5" stroke="var(--red)" strokeWidth="1.2"/>
            <path d="M5 3v2.5" stroke="var(--red)" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="5" cy="7" r=".6" fill="var(--red)"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Gender Option ─────────────────────────────────────────────────
function GenderOption({ value, label, icon, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      style={{
        flex: 1, padding: '10px 8px',
        background: selected ? 'rgba(124,108,248,0.12)' : 'var(--bg-input)',
        border: `1px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer', transition: 'all .18s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        color: selected ? 'var(--purple)' : 'var(--text-secondary)',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: selected ? 600 : 400 }}>{label}</span>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function SignUp({ onSwitch }) {
  const { login } = useAuth();
  const [fields, setFields] = useState({
    fullName: '', username: '', email: '',
    phone: '', password: '', confirm: '', gender: '',
  });
  const [showPw,    setShowPw]    = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);

  const set = (key) => (e) =>
      setFields(prev => ({ ...prev, [key]: e.target.value }));

  const setGender = (val) =>
      setFields(prev => ({ ...prev, gender: val }));

  const handleSubmit = async () => {
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    // 1. Динамически получаем URL бэкенда из окружения Vercel/Vite
    const BASE_URL = import.meta.env.VITE_API_URL || '';

    try {
      // 2. Подставляем BASE_URL в fetch, чтобы запрос улетал на Render в продакшене
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: fields.fullName.trim(), // Твой бэкенд ждет displayName вместо fullName
          username:    fields.username.trim(),
          email:       fields.email.trim(),
          phoneNumber: fields.phone.trim(),    // Переименовали в phoneNumber под RegisterRequest бэка
          password:    fields.password,
          confirmPassword: fields.confirm,     // Передаем confirmPassword для проверки в AuthService
          gender:      fields.gender ? fields.gender.toUpperCase() : null, // Переводим в 'MALE'/'FEMALE'/'OTHER' под Java Enum
        }),
      });

      // Если бэкенд на Render «спит» (холодный старт бесплатного тарифа)
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        const currentBackend = BASE_URL || 'http://localhost:8080';
        setErrors(prev => ({ ...prev, _global: `Server is spinning up. Make sure backend is active at: ${currentBackend}` }));
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        // Обработка ошибок валидации, если бэк вернул Map<String, String> с ошибками полей
        if (data.errors) {
          setErrors(prev => ({ ...prev, ...data.errors }));
        } else {
          setErrors(prev => ({ ...prev, _global: data.message || 'Registration failed.' }));
        }
        setLoading(false);
        return;
      }

      // Если бэк при регистрации сразу возвращает JWT-токен в обертке payload
      if (data.payload?.token) {
        login(data.payload, false);
        return;
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => onSwitch(), 2200);

    } catch (err) {
      const currentBackend = BASE_URL || 'http://localhost:8080';
      setErrors(prev => ({ ...prev, _global: `Cannot reach server at ${currentBackend}. Please check your connection.` }));
      console.error("Fetch fatal error:", err);
      setLoading(false);
    }
  };

  // ── Остальной JSX код рендеринга формы (success state и return) остается без изменений ──
  // ── Success state ─────────────────────────────────────────────
  if (success) {
    return (
      <div className="login-page">
        <div className="login-bg-glow" />
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '48px 40px',
          textAlign: 'center', maxWidth: 440, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,.5)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--green-bg)', border: '1px solid rgba(16,185,129,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 20px',
          }}>✅</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Vault Created!
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your account has been registered successfully.<br />
            Redirecting you to sign in…
          </p>
          <div style={{ marginTop: 20 }}>
            <span className="spinner" style={{ margin: '0 auto', display: 'block', width: 18, height: 18 }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-bg-glow" />

      {/* Logo */}
      <div className="login-logo" style={{ marginBottom: 16 }}>
        <LogoIcon size={48} radius="14px" />
        <div>
          <div className="login-logo-title">
            <span className="keyed">KEYED</span>
            <span className="sep">|</span>
            <span className="vault">ENTERPRISE VAULT</span>
          </div>
          <div className="login-logo-sub">Create your secure vault identity</div>
        </div>
      </div>

      {/* Card */}
      <div className="login-card" style={{ maxWidth: 540, padding: '24px 28px' }}>
        <div className="login-title" style={{ fontSize: 18, marginBottom: 4 }}>Create your account</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24, marginTop: -12 }}>
          All fields are required to register your vault identity.
        </p>

        {/* ── Row 1: Full Name + Username ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Full Name" error={errors.fullName}>
            <div className="input-icon-wrap">
              <svg className="input-icon-left" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1.5 12.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                className="input-field"
                type="text"
                placeholder="John Doe"
                value={fields.fullName}
                onChange={set('fullName')}
                style={{ borderColor: errors.fullName ? 'var(--red)' : undefined }}
              />
            </div>
          </Field>

          <Field label="Username" error={errors.username}>
            <div className="input-icon-wrap">
              <svg className="input-icon-left" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z"
                  stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4.5 9.5c.5-1.5 1-2 2.5-2s2 .5 2.5 2"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="7" cy="5.5" r="1.2" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <input
                className="input-field"
                type="text"
                placeholder="john_doe"
                value={fields.username}
                onChange={set('username')}
                style={{ borderColor: errors.username ? 'var(--red)' : undefined }}
              />
            </div>
          </Field>
        </div>

        {/* ── Row 2: Email + Phone ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Email Address" error={errors.email}>
            <div className="input-icon-wrap">
              <svg className="input-icon-left" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1 5l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                className="input-field"
                type="email"
                placeholder="you@domain.com"
                value={fields.email}
                onChange={set('email')}
                autoComplete="email"
                style={{ borderColor: errors.email ? 'var(--red)' : undefined }}
              />
            </div>
          </Field>

          <Field label="Phone Number" error={errors.phone}>
            <div className="input-icon-wrap">
              <svg className="input-icon-left" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="3" y="1" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="7" cy="10.5" r=".8" fill="currentColor"/>
              </svg>
              <input
                className="input-field"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={fields.phone}
                onChange={set('phone')}
                autoComplete="tel"
                style={{ borderColor: errors.phone ? 'var(--red)' : undefined }}
              />
            </div>
          </Field>
        </div>

        {/* ── Row 3: Password + Confirm ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Password" error={errors.password}>
            <div className="input-icon-wrap">
              <svg className="input-icon-left" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4 6V4a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                className="input-field"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={fields.password}
                onChange={set('password')}
                autoComplete="new-password"
                style={{ paddingRight: 40, borderColor: errors.password ? 'var(--red)' : undefined }}
              />
              <button
                type="button"
                className="show-pw-btn"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
              >
                <EyeIcon show={showPw} />
              </button>
            </div>
            <PasswordStrength password={fields.password} />
          </Field>

          <Field label="Confirm Password" error={errors.confirm}>
            <div className="input-icon-wrap">
              <svg className="input-icon-left" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4 6V4a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M5.5 9.5l1.5 1.5 2-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                className="input-field"
                type={showConf ? 'text' : 'password'}
                placeholder="Repeat password"
                value={fields.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                style={{
                  paddingRight: 40,
                  borderColor: errors.confirm
                    ? 'var(--red)'
                    : fields.confirm && fields.confirm === fields.password
                      ? 'var(--green)'
                      : undefined,
                }}
              />
              <button
                type="button"
                className="show-pw-btn"
                onClick={() => setShowConf(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
              >
                <EyeIcon show={showConf} />
              </button>
            </div>
            {/* Match indicator */}
            {fields.confirm && fields.confirm === fields.password && !errors.confirm && (
              <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 5,
                display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="var(--green)" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Passwords match
              </div>
            )}
          </Field>
        </div>

        {/* ── Gender ── */}
        <div style={{ marginBottom: 22 }}>
          <div className="input-label" style={{ marginBottom: 8 }}>Gender</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <GenderOption value="male"   label="Male"   icon="♂️"  selected={fields.gender === 'male'}   onSelect={setGender} />
            <GenderOption value="female" label="Female" icon="♀️"  selected={fields.gender === 'female'} onSelect={setGender} />
            <GenderOption value="other"  label="Other"  icon="⚧️"  selected={fields.gender === 'other'}  onSelect={setGender} />
          </div>
          {errors.gender && (
            <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6,
              display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4.5" stroke="var(--red)" strokeWidth="1.2"/>
                <path d="M5 3v2.5" stroke="var(--red)" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="5" cy="7" r=".6" fill="var(--red)"/>
              </svg>
              {errors.gender}
            </div>
          )}
        </div>

        {/* ── Global API error ── */}
        {errors._global && (
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
            {errors._global}
          </div>
        )}

        {/* ── Terms notice ── */}
        <div style={{
          background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.1)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
          fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20,
        }}>
          🛡️ By registering, you agree that your data will be cryptographically protected under
          the <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms of Service</span> and{' '}
          <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Privacy Policy</span> of KEYED Enterprise Vault.
        </div>

        {/* ── Submit ── */}
        <button
          className="btn btn-lg"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', justifyContent: 'center',
            background: 'linear-gradient(135deg, #5a4fcf, #7c6cf8, #00b8cc)',
            color: '#fff', fontWeight: 700, fontSize: 14,
            opacity: loading ? 0.75 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <><span className="spinner" /> Creating Vault Identity…</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5L2 4v4c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L7 1.5z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              Register
            </>
          )}
        </button>

        {/* ── Switch to Login ── */}
        <div className="login-register">
          Already have an account?{' '}
          <span className="register-link" onClick={onSwitch}>Sign in</span>
        </div>
      </div>
    </div>
  );
}