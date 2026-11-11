import { useState } from 'react';
import logo from '../assets/AquaBest logo.png';
import './businessLogin.css';

export default function BusinessLogin({ onLogin, initialError = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your work email and password to continue.');
      return;
    }
    setBusy(true);
    try {
      await onLogin(email, password);
    } catch (loginError) {
      setError(loginError.message || 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="business-auth">
      <div className="business-auth-layout">
        <section className="business-auth-intro" aria-label="AquaBest business portal">
          <div className="business-auth-brand">
            <img src={logo} alt="AquaBest" />
            <span>BUSINESS OPERATIONS</span>
          </div>
          <div className="business-auth-intro-copy">
            <p className="business-auth-kicker">YOUR WORKSPACE, SIMPLIFIED</p>
            <h1>One station.<br />One connected <em>team.</em></h1>
            <p className="business-auth-description">Manage orders, coordinate refills, track deliveries, and keep daily operations running smoothly—all from one place.</p>
            <div className="business-auth-benefits" aria-label="Workspace features">
              <span>Role-based workspaces</span>
              <span>Daily operations at a glance</span>
              <span>Designed for your team</span>
            </div>
          </div>
          <p className="business-auth-intro-footer">AquaBest Management System <span aria-hidden="true">·</span> Internal workspace</p>
        </section>
        <main className="business-auth-right">
          <div className="business-auth-mobile-brand"><img src={logo} alt="AquaBest" /><span>BUSINESS OPERATIONS</span></div>
          <div className="business-auth-card">
            {recovering ? (
              <>
                <div className="business-auth-heading">
                  <span className="business-auth-eyebrow">ACCOUNT ASSISTANCE</span>
                  <h2>Forgot your password?</h2>
                  <p>Account access is managed by the AquaBest administrator.</p>
                </div>
                <div className="business-auth-help">
                  <strong>How to regain access</strong>
                  <p>Contact your Owner / Admin to reset your password or restore access.</p>
                </div>
                <button type="button" className="business-auth-button" onClick={() => { setRecovering(false); setError(''); }}>Back to sign in</button>
              </>
            ) : (
              <>
                <div className="business-auth-heading">
                  <span className="business-auth-eyebrow">WELCOME BACK</span>
                  <h2>Sign in to your workspace</h2>
                  <p>Enter your employee credentials to continue.</p>
                </div>
                <form noValidate onSubmit={submit}>
                  <label htmlFor="business-email">Work email</label>
                  <div className="business-auth-input">
                    <input id="business-email" type="email" autoComplete="username" inputMode="email" placeholder="name@aquabest.com" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required />
                  </div>
                  <div className="business-auth-password-label">
                    <label htmlFor="business-password">Password</label>
                    <button type="button" className="business-auth-text-button" onClick={() => { setRecovering(true); setError(''); }}>Forgot password?</button>
                  </div>
                  <div className="business-auth-input business-auth-password-input">
                    <input id="business-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required />
                    <button type="button" className="business-auth-eye" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                  {error && <p className="business-auth-error" role="alert">{error}</p>}
                  <button className="business-auth-button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
                </form>
              </>
            )}
            <div className="business-auth-account-help">
              <strong>Staff account access</strong>
              <p>Accounts are created by an authorized AquaBest administrator. Contact the administrator if you need access or a password reset.</p>
            </div>
          </div>
          <div className="business-auth-bottom">For AquaBest personnel <span aria-hidden="true">·</span> <a href={import.meta.env.BASE_URL}>Customer website</a></div>
        </main>
      </div>
    </div>
  );
}
