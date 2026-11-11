import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import CustomerWeb from './apps/CustomerWeb.jsx';
import ManagementWeb from './apps/ManagementWeb.jsx';
import BusinessLogin from './apps/BusinessLogin.jsx';
import { getBusinessSession, signInBusiness, signOutBusiness } from './services/businessAuth.js';

// Roles are loaded from the protected employee record, never granted by the URL.
const businessViews = ['business', 'business-login', 'login', 'manager', 'staff', 'delivery', 'owner'];
const readView = () => new URLSearchParams(window.location.search).get('view');
const setViewUrl = (nextView) => {
  window.history.replaceState({}, '', `${import.meta.env.BASE_URL}?view=${nextView}`);
};

function App() {
  const [view, setView] = useState(readView);
  const isBusinessRoute = businessViews.includes(view);
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(isBusinessRoute && view !== 'business-login');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isBusinessRoute || view === 'business-login') {
      setCheckingSession(false);
      setSession(null);
      setAuthError('');
      return undefined;
    }

    let cancelled = false;
    setCheckingSession(true);
    getBusinessSession()
      .then((employee) => {
        if (!cancelled) setSession(employee);
      })
      .catch((error) => {
        if (!cancelled) {
          setSession(null);
          setAuthError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });

    return () => { cancelled = true; };
  }, [isBusinessRoute, view]);

  const signIn = async (email, password) => {
    const employee = await signInBusiness(email, password);
    setSession(employee);
    setAuthError('');
    setViewUrl('business');
    setView('business');
  };

  const signOut = async () => {
    try {
      await signOutBusiness();
    } finally {
      setSession(null);
      setAuthError('');
      setViewUrl('business-login');
      setView('business-login');
    }
  };

  if (!isBusinessRoute) return <CustomerWeb />;
  if (checkingSession) return <main className="business-auth"><p style={{ textAlign: 'center', padding: '48px 16px' }}>Checking staff access…</p></main>;
  if (view === 'business-login' || !session) return <BusinessLogin onLogin={signIn} initialError={authError} />;
  return <ManagementWeb key={`${session.role}:${session.authUserId}`} role={session.role} onLogout={signOut} />;
}
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
