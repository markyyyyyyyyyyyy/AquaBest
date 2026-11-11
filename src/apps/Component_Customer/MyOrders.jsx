import { useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiClock, FiClipboard, FiTruck, FiRefreshCcw } from 'react-icons/fi';
import { orderOptions } from './orderData.js';

export default function MyOrders({ orders=[], products=[], onBack, onNewOrder, onReorder }) {
  const [tab,setTab]=useState('ongoing');
  const [expanded,setExpanded]=useState(null);
  const ongoing=orders.filter(o=>!['Completed','Cancelled'].includes(o.status));
  const history=orders.filter(o=>['Completed','Cancelled'].includes(o.status));
  const showing=tab==='ongoing'?ongoing:history;
  return <section className="order-screen" aria-labelledby="my-orders-title">
    <div className="order-page-heading"><h1 id="my-orders-title">My Orders</h1><p>Check the progress of your orders and previous transactions.</p></div>
    <div className="order-tabs" role="tablist" aria-label="Order category">
      <button type="button" role="tab" aria-selected={tab==='ongoing'} onClick={()=>setTab('ongoing')}>Ongoing ({ongoing.length})</button>
      <button type="button" role="tab" aria-selected={tab==='history'} onClick={()=>setTab('history')}>Order History ({history.length})</button>
    </div>
    {showing.map(order=><article className="order-panel saved-order-card" key={order.id}>
      <div className="saved-order-head"><strong>Order #{order.id}</strong><span className={'order-status '+(order.status==='Completed'?'completed':'')}>{order.status}</span></div>
      <p>{order.items?.map(({sizeId,quantity})=>{const product=orderOptions(products).find((item)=>item.id===sizeId);return `${quantity} × ${product?.name||sizeId} ${product?.shape||''}`;}).join(' · ')}</p><div className="saved-order-meta"><FiClock /> {order.createdAt} <span>· {order.paymentStatus}</span></div>
      {tab==='ongoing' && <><button type="button" className="btn order-primary" onClick={()=>setExpanded(expanded===order.id?null:order.id)}><FiTruck /> {expanded===order.id?'Hide Progress':'Track Progress'} <FiArrowRight /></button>
        {expanded===order.id && <div className="progress-detail" aria-label={'Tracking for '+order.id}>
          {['Pending Confirmation','Confirmed','Preparing','Out for Delivery','Delivered'].map((stage,i)=><div className={'progress-point '+((order.currentStep??0)>=i?'complete':'')} key={stage}>{(order.currentStep??0)>=i?<FiCheckCircle/>:<FiClock/>}<span>{stage}</span></div>)}
        </div>}
      </>}
      {tab==='history' && <button className="btn order-secondary" type="button" onClick={()=>onReorder(order)}><FiRefreshCcw /> Order Again</button>}
    </article>)}
    {!showing.length && <div className="order-panel empty-orders"><FiClipboard size={30}/><h2>No orders here yet</h2></div>}
    <button type="button" className="btn order-primary" onClick={onNewOrder}>New Water Order <FiArrowRight /></button>
    <button className="btn order-text-back" type="button" onClick={onBack}><FiArrowLeft/> Back to Home</button>
    <p className="sample-disclosure">Sample orders for UI testing only. Live status requires backend connection.</p>
  </section>;
}
