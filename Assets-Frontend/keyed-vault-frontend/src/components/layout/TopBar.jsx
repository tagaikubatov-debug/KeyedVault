import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const TITLES = {
  '/':          'Dashboard',
  '/workspace': 'Protect Asset',
  '/ledger':    'Immutable Ledger',
  '/network':   'Global Network',
  '/settings':  'Vault Configuration',
  '/profile':   'My Profile',
  '/ai':        'AI Legal Suite',
};

function initials(name) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('');
}

export default function TopBar() {
  const { pathname } = useLocation();
  const { user }     = useAuth();

  const pageTitle   = TITLES[pathname] ?? 'Enterprise Vault';
  // AuthResponse возвращает displayName (Full Name) и username
  const displayName = user?.displayName ?? user?.username ?? 'Vault User';
  const avatarText  = initials(displayName);

  return (
    <header className="topbar">
      <span style={{
        position: 'absolute', left: '28px',
        fontSize: '10px', fontWeight: 600,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {pageTitle}
      </span>

      <div className="topbar-notification">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2a5.5 5.5 0 0 1 5.5 5.5c0 2.5.8 3.8 1.5 4.5H2c.7-.7 1.5-2 1.5-4.5A5.5 5.5 0 0 1 9 2z"
            stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7 14.5a2 2 0 0 0 4 0"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span className="notif-dot" />
      </div>

      <div className="topbar-user">
        <div className="user-avatar">{avatarText}</div>
        <span className="user-name">{displayName}</span>
      </div>
    </header>
  );
}
