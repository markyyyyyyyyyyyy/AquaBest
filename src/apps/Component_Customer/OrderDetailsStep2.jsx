import { FiArrowLeft, FiArrowRight, FiCalendar, FiClock, FiMapPin, FiPhone, FiUser } from 'react-icons/fi';
import { isDelivery } from './orderData.js';

export default function OrderDetailsStep2({ draft, updateDraft, onBack, onNext, verifiedPhone }) {
  const delivery = isDelivery(draft.service);
  const details = draft.details;
  const setDetail = (key, value) => updateDraft({ details: { ...details, [key]: value } });
  const valid = details.name.trim() && /^09\d{9}$/.test(details.phone.replace(/\s/g, '')) && details.date && details.time && (!delivery || (details.address.trim() && details.barangay.trim()));
  const change = (key) => (event) => setDetail(key, event.target.value);
  return (
    <form className="order-screen" onSubmit={(event) => { event.preventDefault(); if (valid) onNext(); }} aria-labelledby="order-details-title">
      <div className="order-page-heading"><span className="order-step-pill">Step 2 of 3</span><h1 id="order-details-title">Order Details</h1><p>{delivery ? 'Where and when should we deliver?' : 'When would you like to collect your order?'}</p></div>

      {delivery && <div className="order-panel">
        <h2><FiMapPin /> Delivery address</h2>
        <label htmlFor="street">House / unit, street and subdivision</label>
        <input id="street" className="form-control" value={details.address} onChange={change('address')} required maxLength={150} placeholder="House number, street, unit" />
        <label htmlFor="barangay">Barangay / service area</label>
        <input id="barangay" className="form-control" value={details.barangay} onChange={change('barangay')} required maxLength={80} placeholder="Barangay, city" />
        <label htmlFor="landmark">Landmark (optional)</label>
        <input id="landmark" className="form-control" value={details.landmark} onChange={change('landmark')} maxLength={120} placeholder="Nearby landmark" />
        <small className="panel-hint">Address is only held in this demo page; service-area checking is not connected yet.</small>
      </div>}

      <div className="order-panel">
        <h2><FiUser /> Contact details</h2>
        <label htmlFor="recipient">Recipient / customer name</label>
        <input id="recipient" className="form-control" value={details.name} onChange={change('name')} required maxLength={80} autoComplete="name" placeholder="Full name" />
        <label htmlFor="phone"><FiPhone /> Phone number</label>
        <input id="phone" className="form-control" type="tel" value={verifiedPhone || details.phone} readOnly aria-readonly="true" />
        <small className="panel-hint">Phone is filled in from your profile.</small>
      </div>

      <div className="order-panel">
        <h2><FiCalendar /> Preferred {delivery ? 'delivery' : 'pickup'} schedule</h2>
        <div className="schedule-grid">
          <div><label htmlFor="schedule-date">Preferred date</label><input id="schedule-date" type="date" className="form-control" value={details.date} onChange={change('date')} required min={new Date().toISOString().slice(0, 10)} /></div>
          <div><label htmlFor="schedule-time"><FiClock /> Time window</label><select id="schedule-time" className="form-select" value={details.time} onChange={change('time')} required>
            <option value="">Select time</option>
            <option value="Morning (9 AM–12 PM)">Morning (9 AM–12 PM)</option>
            <option value="Afternoon (1 PM–5 PM)">Afternoon (1 PM–5 PM)</option>
          </select></div>
        </div>
        <small className="panel-hint">These are preferred windows, not confirmed AquaBest operating hours.</small>
      </div>

      <div className="order-panel">
        <h2>Additional instructions <small>(Optional)</small></h2>
        <textarea className="form-control" rows={3} maxLength={250} value={details.notes} onChange={change('notes')} placeholder="Gate code, landmark, or special instructions" />
      </div>
      <div className="order-actions"><button type="button" className="btn order-secondary" onClick={onBack}><FiArrowLeft /> Back</button><button type="submit" className="btn order-primary" disabled={!valid}>Continue to Review <FiArrowRight /></button></div>
    </form>
  );
}