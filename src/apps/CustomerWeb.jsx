import { useEffect, useState } from 'react';
import { FiArrowRight, FiDroplet, FiPackage, FiShield, FiTruck, FiActivity, FiMapPin } from 'react-icons/fi';
import NavBarCustomer from './Component_Customer/navBarCustomer.jsx';
import CustomerOnboarding from './Component_Customer/CustomerOnboarding.jsx';
import OrderWaterStep1 from './Component_Customer/OrderWaterStep1.jsx';
import OrderDetailsStep2 from './Component_Customer/OrderDetailsStep2.jsx';
import ReviewOrderStep3 from './Component_Customer/ReviewOrderStep3.jsx';
import MyOrders from './Component_Customer/MyOrders.jsx';
import { getSessionUser, signOutCustomer } from '../services/customerAuth.js';
import { loadMyCustomer } from '../services/customerProfile.js';
import { loadCustomerProducts } from '../services/productCatalog.js';
import { orderOptions } from './Component_Customer/orderData.js';
import sampleData from '../data/sampleData.json';
import model from '../assets/Model_Imgs/model.png';
import explainingModel from '../assets/Model_Imgs/ExplainingModel.png';
import ownBottle from '../assets/WaterBottleOffer/ownBottle.png';
import buyBottle from '../assets/Model_Imgs/buyBottle.png';
import bottleBundle from '../assets/WaterBottleOffer/bottleBundle.png';
import './customerWeb.css';
import './orderFlow.css';
import './onboarding.css';

const tips=['Keep drinking water within reach throughout your day.','Wash reusable water bottles regularly.','Store drinking water in clean, covered containers.'];
const makeDraft = (customer, quantities={}, products=[])=>({
  ownership:'own', arrangement:'purchase', quantities:Object.fromEntries(orderOptions(products).map((product)=>[product.id,quantities[product.id]||0])), service:'pickup-return',
  details:{address:customer?.address?.street||'',barangay:customer?.address?.barangay||'',landmark:customer?.address?.landmark||'',name:customer?.fullName||'',phone:customer?.phone||'',date:'',time:'',notes:''},
});
export default function CustomerWeb(){
  const [customer,setCustomer]=useState(null);
  const [page,setPage]=useState('home');
  const [step,setStep]=useState(1);
  const [draft,setDraft]=useState(()=>makeDraft(null));
  const [orders,setOrders]=useState(sampleData.orders);
  const [products,setProducts]=useState([]);
  const [catalogError,setCatalogError]=useState('');
  const [notice,setNotice]=useState('');
  const [checking,setChecking]=useState(true);
  useEffect(()=>{
    let cancelled=false;
    loadCustomerProducts().then((available)=>{
      if(cancelled)return;
      setProducts(available);
      setCatalogError('');
      setDraft((current)=>({...current,quantities:Object.fromEntries(orderOptions(available).map((product)=>[product.id,current.quantities[product.id]||0]))}));
    }).catch((error)=>{if(!cancelled)setCatalogError(error.message||'Product catalog is unavailable.');});
    return()=>{cancelled=true};
  },[page]);
  // Restore a previous login (Supabase keeps the session in the browser).
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        if(await getSessionUser()){
          const existing=await loadMyCustomer();
          if(existing&&!cancelled){setCustomer(existing);setDraft((current)=>({...current,details:{...current.details,address:existing.address?.street||'',barangay:existing.address?.barangay||'',landmark:existing.address?.landmark||'',name:existing.fullName||'',phone:existing.phone||''}}));}
        }
      }catch{/* show the login screen if anything fails */}
      if(!cancelled)setChecking(false);
    })();
    return()=>{cancelled=true};
  },[]);
  const onLogout=async()=>{await signOutCustomer();setCustomer(null);setDraft(makeDraft(null,{},products));setOrders(sampleData.orders);setPage('home');setNotice('');scrollTop();};
  const scrollTop=()=>window.scrollTo(0,0);
  const onOnboard=(next)=>{setCustomer(next);setDraft(makeDraft(next,{},products));setPage('home');scrollTop();};
  const goHome=()=>{setPage('home');setNotice('');scrollTop();};
  const goOrders=()=>{setPage('orders');setNotice('');scrollTop();};
  const startOrder=(ownership='own',quantities)=>{
    const ongoing=orders.filter(o=>!['Completed','Cancelled'].includes(o.status));
    setNotice(ongoing.length?'You already have '+ongoing.length+' ongoing order(s). Check My Orders before submitting another request.':'');
    setDraft({...makeDraft(customer,quantities,products),ownership,service:ownership==='own'?'pickup-return':'delivery'});
    setStep(1);setPage('order');scrollTop();
  };
  const onReorder=(order)=>{
    const quantities=Object.fromEntries(orderOptions(products).map((product)=>[product.id,0]));
    for(const item of order.items) if(Object.hasOwn(quantities,item.sizeId)) quantities[item.sizeId]=item.quantity;
    startOrder('own',quantities);
  };
  const updateDraft=partial=>setDraft(current=>({...current,...partial}));
  const moveStep=next=>{setStep(next);scrollTop();};
  const previewRequest=()=>{
    // This is an in-memory sample record. No server request is made.
    const order={
      id:'LOCAL-'+String(Date.now()).slice(-6),createdAt:new Date().toLocaleDateString('en-CA'),customerId:customer?.id,
      status:'Pending Confirmation',paymentStatus:'Unpaid',currentStep:0,service:draft.service,
      items:Object.entries(draft.quantities).filter(([,quantity])=>quantity>0).map(([sizeId,quantity])=>({sizeId,quantity})),sample:true
    };
    setOrders(current=>[order,...current]);goOrders();
  };
  if(checking) return <main className="onboarding-shell"><p style={{textAlign:'center',padding:'48px 16px'}}>Loading…</p></main>;
  if(!customer) return <CustomerOnboarding onComplete={onOnboard}/>;
  return <div id="home" className="customer-site">
    <NavBarCustomer page={page} onHome={goHome} onOrder={()=>startOrder()} onOrders={goOrders} onLogout={onLogout}/>
    <main className="customer-main container-fluid px-3 px-md-4">
      {page==='home' && <>
        <section className="hero-banner" aria-labelledby="hero-title">
          <div className="hero-content"><p className="hero-eyebrow">FRESH • CLEAN • RELIABLE</p><h1 id="hero-title">Fresh water, right at your doorstep.</h1>
          <button className="btn hero-action" type="button" onClick={()=>startOrder()}>Order Now <FiArrowRight/></button></div>
          <img className="hero-model" src={model} alt="AquaBest ambassador holding bottled water"/>
        </section>
        <section className="section-block" id="products" aria-labelledby="offer-title">
          <h2 id="offer-title" className="section-title">What We Offer</h2>
          <p className="panel-hint">Choose your water service. Select sizes and quantities in the next step.</p>
          <div className="row g-3">
            <div className="col-6"><article className="product-card h-100">
              <div className="product-illustration offer-illustration"><img className="offer-bottle" src={ownBottle} alt="AquaBest refill my own container service"/></div>
              <h3>Refill My Container</h3><p>Have your own bottles refilled.</p>
              <button className="btn add-button" onClick={()=>startOrder('own')} type="button">Order Refill <FiArrowRight/></button>
            </article></div>
            <div className="col-6"><article className="product-card h-100">
              <div className="product-illustration offer-illustration"><img className="offer-bottle" src={buyBottle} alt="AquaBest provided water container service"/></div>
              <h3>Container + Water</h3><p>Request AquaBest-provided containers.</p>
              <button className="btn add-button" onClick={()=>startOrder('store')} type="button">Order Container <FiArrowRight/></button>
            </article></div>
          </div>
        </section>
        <section className="bulk-card" aria-labelledby="bulk-title"><img className="bulk-product-image" src={bottleBundle} alt="AquaBest bulk and custom water bottle services"/><div>
          <h2 id="bulk-title">Custom & Bulk Orders</h2><p>Offices, events, special sizes, or customer-provided labels.</p><a href="tel:09994544981" className="bulk-link">Call for a quotation <FiArrowRight size={15}/></a>
        </div></section>
        <section className="why-section" aria-labelledby="why-title"><h2 id="why-title" className="section-title">Why AquaBest?</h2>
          <div className="row g-2">{[
            {label:'Multi-Stage Purification',Icon:FiDroplet},
            {label:'Regular Water Testing',Icon:FiActivity},
            {label:'Clean & Sealed Containers',Icon:FiShield}
          ].map(({label,Icon})=><div className="col-4" key={label}><div className="why-item"><span><Icon size={23}/></span><p>{label}</p></div></div>)}</div>
          <article className="why-care-card"><div className="why-care-text"><h3>Care in Every Order</h3><p>From preparation to delivery, our team puts care into every water order.</p></div><img src={explainingModel} alt="AquaBest team member assisting a customer"/></article>
        </section>
        <section className="tips-section" aria-labelledby="tips-title"><h2 id="tips-title" className="section-title">Water Tips</h2><div className="tips-track" aria-label="Swipe for water tips">
          {tips.map((tip,index)=><article className="tip-card" key={tip}><span>TIP {String(index+1).padStart(2,'0')}</span><p>{tip}</p></article>)}
        </div></section>
      </>}
      {page==='order' && <>
        {notice && <div className="order-notice" role="status"><FiMapPin/>{notice}<button type="button" onClick={goOrders}>My Orders</button></div>}
        {step===1 && <OrderWaterStep1 draft={draft} updateDraft={updateDraft} onNext={()=>moveStep(2)} products={products} catalogError={catalogError}/>}
        {step===2 && <OrderDetailsStep2 draft={draft} updateDraft={updateDraft} onBack={()=>moveStep(1)} onNext={()=>moveStep(3)} verifiedPhone={customer.phone}/>}
        {step===3 && <ReviewOrderStep3 draft={draft} onBack={()=>moveStep(2)} onEditWater={()=>moveStep(1)} onEditDetails={()=>moveStep(2)} onPreview={previewRequest} products={products}/>}
      </>}
      {page==='orders' && <MyOrders orders={orders} products={products} onBack={goHome} onNewOrder={()=>startOrder()} onReorder={onReorder}/>}
    </main>
    <div className="sample-disclosure" style={{padding:'12px',textAlign:'center'}}>Customer login and profile are live (Supabase). Orders are still sample data for now.</div>
  </div>;
}
