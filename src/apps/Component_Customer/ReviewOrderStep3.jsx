import { FiArrowLeft, FiCheckCircle, FiClipboard, FiEdit2, FiMapPin, FiTruck } from 'react-icons/fi';
import { selectedBottles, countBottles, serviceOptions, isDelivery } from './orderData.js';

export default function ReviewOrderStep3({ draft, onBack, onEditWater, onEditDetails, onPreview, products = [] }) {
  const total = countBottles(draft.quantities);
  const selectedService = serviceOptions[draft.ownership].find((s) => s.id === draft.service);
  const delivery = isDelivery(draft.service);
  return (
    <section className="order-screen" aria-labelledby="review-title">
      <div className="order-page-heading"><span className="order-step-pill">Step 3 of 3</span><h1 id="review-title">Review & Place Order</h1><p>Check the details before preparing your request.</p></div>
      <div className="order-panel">
        <div className="panel-title-row"><h2><FiClipboard /> Order items</h2><button type="button" onClick={onEditWater} className="edit-link"><FiEdit2 /> Edit</button></div>
        {selectedBottles(draft.quantities, products).map((item) => <div className="review-item" key={item.id}>
          <img src={item.image} alt="" /><span><strong>{item.name} · {item.shape}</strong><small>{draft.ownership === 'own' ? 'My own container' : draft.arrangement === 'purchase' ? 'Purchase container + water' : 'Returnable container request'}</small></span><b>× {draft.quantities[item.id]}</b>
        </div>)}
        <div className="review-count">Total containers <strong>{total}</strong></div>
      </div>
      <div className="order-panel">
        <div className="panel-title-row"><h2><FiTruck /> Service method</h2><button type="button" className="edit-link" onClick={onEditWater}><FiEdit2 /> Edit</button></div>
        <strong>{selectedService?.name}</strong><p className="panel-hint">{selectedService?.detail}</p>
      </div>
      <div className="order-panel">
        <div className="panel-title-row"><h2><FiMapPin /> {delivery ? 'Delivery details' : 'Pickup details'}</h2><button type="button" className="edit-link" onClick={onEditDetails}><FiEdit2 /> Edit</button></div>
        {delivery && <p>{draft.details.address}, {draft.details.barangay}{draft.details.landmark ? ', ' + draft.details.landmark : ''}</p>}
        <p>{draft.details.name} · {draft.details.phone}</p>
        <p>Requested: {draft.details.date} · {draft.details.time}</p>
        {draft.details.notes && <p>Notes: {draft.details.notes}</p>}
      </div>
      <div className="order-panel order-price-panel">
        <h2>Charges & payment</h2>
        <p>Product prices and any applicable delivery or container fees are pending store confirmation.</p>
        <p className="panel-hint">No payment is collected on this preview. No real order will be sent.</p>
      </div>
      <div className="order-actions"><button type="button" className="btn order-secondary" onClick={onBack}><FiArrowLeft /> Back</button><button type="button" className="btn order-primary" onClick={onPreview}>Preview Request <FiCheckCircle /></button></div>
    </section>
  );
}
