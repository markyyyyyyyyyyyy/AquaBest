import { FiArrowRight, FiCheckCircle, FiMinus, FiPlus, FiTruck, FiHome } from 'react-icons/fi';
import { orderOptions, serviceOptions, countBottles, selectedBottles } from './orderData.js';

export default function OrderWaterStep1({ draft, updateDraft, onNext, products = [], catalogError = '' }) {
  const total = countBottles(draft.quantities);
  const sizes = orderOptions(products);
  const setQuantity = (id, amount) => {
    updateDraft({ quantities: { ...draft.quantities, [id]: Math.max(0, Math.min(99, (draft.quantities[id] || 0) + amount)) } });
  };
  const chooseOwnership = (ownership) => updateDraft({
    ownership, service: ownership === 'own' ? 'pickup-return' : 'delivery',
  });
  return (
    <section className="order-screen" aria-labelledby="order-water-title">
      <div className="order-page-heading"><span className="order-step-pill">Step 1 of 3</span><h1 id="order-water-title">Order Water</h1><p>Select all the container sizes you need in one order.</p></div>

      <div className="order-panel">
        <h2>1. Whose containers will you use?</h2>
        <div className="ownership-grid">
          {[{ id: 'own', name: 'My own containers', help: 'Refill containers you already own.' }, { id: 'store', name: 'AquaBest containers', help: 'Containers provided by AquaBest.' }].map((item) => (
            <button key={item.id} type="button" className={'choice-card ' + (draft.ownership === item.id ? 'is-selected' : '')} aria-pressed={draft.ownership === item.id} onClick={() => chooseOwnership(item.id)}>
              <span className="choice-check">{draft.ownership === item.id && <FiCheckCircle />}</span>
              <strong>{item.name}</strong><small>{item.help}</small>
            </button>
          ))}
        </div>
        {draft.ownership === 'store' && (
          <div className="container-arrangement">
            <label htmlFor="arrangement">Container arrangement</label>
            <select id="arrangement" className="form-select" value={draft.arrangement} onChange={(e) => updateDraft({ arrangement: e.target.value })}>
              <option value="purchase">Buy AquaBest containers</option>
              <option value="returnable">Request returnable containers (subject to approval)</option>
            </select>
            <small>Returnable container availability, deposits, and pricing require store confirmation.</small>
          </div>
        )}
      </div>

      <div className="order-panel">
        <h2>2. Select sizes and quantities</h2>
        <p className="panel-hint">Use + and − for each size. No cart needed.</p>
        <div className="bottle-rows">
          {sizes.map((item) => (
            <div className={'bottle-row ' + (draft.quantities[item.id] > 0 ? 'is-picked' : '')} key={item.id}>
              <img src={item.image} alt={item.name + ' ' + item.shape} className="bottle-thumbnail" />
              <div className="bottle-info"><strong>{item.name}</strong><small>{item.shape}{item.price !== undefined && ` · ₱${Number(item.price).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}`}</small></div>
              <div className="bottle-qty">
                <button type="button" aria-label={'Remove one ' + item.name + ' ' + item.shape} disabled={!draft.quantities[item.id]} onClick={() => setQuantity(item.id, -1)}><FiMinus /></button>
                <output aria-label={'Quantity for ' + item.name + ' ' + item.shape}>{draft.quantities[item.id] || 0}</output>
                <button type="button" aria-label={'Add one ' + item.name + ' ' + item.shape} disabled={draft.quantities[item.id] >= 99} onClick={() => setQuantity(item.id, 1)}><FiPlus /></button>
              </div>
            </div>
          ))}
          {catalogError && <p className="panel-hint">Working in Progress: additional products are unavailable. The three standard container sizes remain available.</p>}
        </div>
      </div>

      <div className="order-panel">
        <h2>3. Service method</h2>
        <div className="service-choices">
          {serviceOptions[draft.ownership].map((item) => (
            <button key={item.id} type="button" className={'service-choice ' + (draft.service === item.id ? 'is-selected' : '')} aria-pressed={draft.service === item.id} onClick={() => updateDraft({ service: item.id })}>
              {item.id === 'walkin' ? <FiHome size={23} /> : <FiTruck size={23} />}
              <span><strong>{item.name}</strong><small>{item.detail}</small></span>
              <span className="radio-indicator" />
            </button>
          ))}
        </div>
      </div>

      <div className="order-mini-summary">
        <strong>Order summary</strong><span>{total} container{total === 1 ? '' : 's'}</span>
        {selectedBottles(draft.quantities, products).map((item) => <p key={item.id}>{item.name} · {item.shape} <b>× {draft.quantities[item.id]}</b></p>)}
        {total === 0 && <p>Select at least one container size to continue.</p>}
      </div>
      <button type="button" disabled={total === 0} className="btn order-primary" onClick={onNext}>Continue to Order Details <FiArrowRight /></button>
    </section>
  );
}
