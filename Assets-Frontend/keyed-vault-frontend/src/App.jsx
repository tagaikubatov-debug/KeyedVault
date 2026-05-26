import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ui/ToastContainer.jsx';
import Sidebar       from './components/layout/Sidebar.jsx';
import TopBar        from './components/layout/TopBar.jsx';
import Dashboard     from './components/views/Dashboard.jsx';
import ProtectAsset  from './components/views/ProtectAsset.jsx';
import Ledger        from './components/views/Ledger.jsx';
import GlobalNetwork from './components/views/GlobalNetwork.jsx';
import Settings      from './components/views/Settings.jsx';
import Profile       from './components/views/Profile.jsx';
import Login         from './components/views/Login.jsx';
import AIAssistant   from './components/views/AIAssistant.jsx';

export default function App() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Login />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar onSignOut={logout} />
        <div className="main-content">
          <TopBar />
          <div className="view-container">
            <Routes>
              <Route path="/"          element={<Dashboard />}     />
              <Route path="/workspace" element={<ProtectAsset />}  />
              <Route path="/ledger"    element={<Ledger />}        />
              <Route path="/network"   element={<GlobalNetwork />} />
              <Route path="/settings"  element={<Settings />}      />
              <Route path="/profile"   element={<Profile />}       />
              <Route path="/ai"        element={<AIAssistant />}   />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
