import { useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiLock, FiMail, FiMapPin, FiPhone, FiShield, FiUser } from 'react-icons/fi';
import { sendOtp, verifyOtp, isValidEmail, normalizeEmail, normalizePhonePH } from '../../services/customerAuth.js';
import { loadMyCustomer, createMyCustomer } from '../../services/customerProfile.js';
import logo from '../../assets/AquaBest logo.png';
import deliveryModel from '../../assets/Model_Imgs/DeliverModel.png';

const defaultProfile = { fullName: '', phone: '', address: { street: '', barangay: '', city: 'Quezon City', landmark: '' } };
export default function CustomerOnboarding({ onComplete }) {
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState(defaultProfile);
  const setAddress = (key, value) => setProfile(p => ({ ...p, address: { ...p.address, [key]: value } }));
  const requestCode = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try { await sendOtp(email); setCode(''); setStage('otp'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const resend = async () => {
    setBusy(true); setError('');
    try { await sendOtp(email); setCode(''); setError('A new code was sent.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const verify = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await verifyOtp(email, code);
      const existing = await loadMyCustomer();
      if (existing) onComplete(existing);
      else setStage('profile');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const save = async (event) => {
    event.preventDefault();
    if (!normalizePhonePH(profile.phone)) { setError('Enter a valid mobile number starting with 09.'); return; }
    if (!profile.fullName.trim() || !profile.address.street.trim() || !profile.address.barangay.trim()) return;
    setBusy(true); setError('');
    try {
      const created = await createMyCustomer({
        fullName: profile.fullName.trim(),
        phone: profile.phone,
        address: { ...profile.address, street: profile.address.street.trim(), barangay: profile.address.barangay.trim() },
      });
      onComplete(created);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return (
    <main className={`onboarding-shell ${stage === "email" ? "phone-entry-screen" : ""}`}>
      <div className="onboarding-top"><img src={logo} alt="AquaBest" /></div>
      {stage !== 'email' && <button type="button" className="onboarding-back" onClick={() => { setStage('email'); setError(''); }}><FiArrowLeft /> Back</button>}
      
      {stage === 'email' && <section className="onboarding-step welcome-stage">
        <h1>Welcome to AquaBest!</h1><p>Enter your email to get started with your water orders.</p>
        <div className="onboarding-photo"><img src={deliveryModel} alt="AquaBest delivery staff helping a customer with a water container" /></div>
        <form onSubmit={requestCode} className="onboarding-form welcome-phone-form">
          <label htmlFor="start-email">Email address</label>
          <div className="field-with-icon"><FiMail /><input id="start-email" autoComplete="email" type="email" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required /></div>
          <small>We will email you a 6-digit code. No password needed.</small>
          {error && stage==='email' && <p className="onboarding-error" role="alert">{error}</p>}
          <button type="submit" className="btn order-primary" disabled={!isValidEmail(email) || busy}>{busy ? 'Sending code…' : 'Continue'} <FiArrowRight /></button>
        </form>
      </section>}
      {stage==='otp' && <section className="onboarding-step otp-stage">
        <div className="onboarding-symbol"><FiShield size={32}/></div><h1>Enter the 6-digit code</h1>
        <p>We emailed a code to <strong>{normalizeEmail(email)}</strong></p>
        <form className="onboarding-form" onSubmit={verify}>
          <label htmlFor="otp-code">Verification code</label>
          <input id="otp-code" className="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder="••••••" />
          <small>It can take a minute to arrive. Check your spam folder if you do not see it.</small>
          {error && <p className="onboarding-error" role="alert">{error}</p>}
          <button type="submit" className="btn order-primary" disabled={code.length!==6 || busy}>{busy ? 'Checking…' : 'Verify & Continue'} <FiArrowRight /></button>
          <button type="button" className="btn btn-link" onClick={resend} disabled={busy}>Send a new code</button>
        </form>
      </section>}
      {stage==='profile' && <section className="onboarding-step">
        <div className="onboarding-verified"><FiCheckCircle /> Email verified</div>
        <h1>Complete your details</h1><p>We'll prefill these next time you order water.</p>
        <form onSubmit={save} className="onboarding-form">
          <label htmlFor="join-name"><FiUser/> Full name</label><input id="join-name" className="form-control" autoComplete="name" value={profile.fullName} onChange={e=>setProfile(p=>({...p,fullName:e.target.value}))} required maxLength={80} placeholder="Full name" />
          <label htmlFor="join-phone"><FiPhone/> Mobile number</label><input id="join-phone" className="form-control" type="tel" inputMode="tel" autoComplete="tel" value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} required placeholder="0917 123 4567" />
          <small>Our delivery team may call or text this number.</small>
          <h2><FiMapPin /> Delivery address</h2>
          <label htmlFor="join-street">House / Unit / Street</label><input id="join-street" className="form-control" autoComplete="address-line1" value={profile.address.street} onChange={e=>setAddress('street',e.target.value)} required placeholder="House no., street and subdivision" />
          <label htmlFor="join-barangay">Barangay</label><input id="join-barangay" className="form-control" value={profile.address.barangay} onChange={e=>setAddress('barangay',e.target.value)} required placeholder="Barangay" />
          <label htmlFor="join-landmark">Landmark (optional)</label><input id="join-landmark" className="form-control" value={profile.address.landmark} onChange={e=>setAddress('landmark',e.target.value)} placeholder="Nearby landmark" />
          {error && <p className="onboarding-error" role="alert">{error}</p>}
          <button className="btn order-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save & Continue'} <FiArrowRight /></button>
        </form>
      </section>}
      <p className="onboarding-footer"><FiLock /> Your email is used to log you in. Your mobile number is used only for your deliveries.</p>
    </main>
  );
}