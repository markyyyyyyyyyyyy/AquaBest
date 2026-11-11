import { useMemo, useState } from 'react';
import { FiBell, FiClipboard, FiDroplet, FiPackage, FiCheck, FiCheckCircle, FiArrowRight, FiInbox } from 'react-icons/fi';

export default function ManagementNotifications({isStaff,isDelivery=false,trips=[],orders,stock,onNavigate}){
 const [readIds,setReadIds]=useState([]);
 const [filter,setFilter]=useState('unread');
 const notices=useMemo(()=>{
  const list=[];
  if(isDelivery){
   trips.filter(t=>t.driver==='Driver A'&&['Assigned','Ready for Dispatch','Loaded','Out for Delivery'].includes(t.status)).forEach(t=>list.push({id:'delivery-'+t.id,category:'Delivery',title:t.status==='Out for Delivery'?'Delivery in progress':'Assigned delivery trip',description:t.orderId+' · '+t.customer+' · '+t.status,target:'deliveries',icon:FiDroplet}));
   trips.filter(t=>t.driver==='Driver A'&&t.remittance==='Awaiting Remittance').forEach(t=>list.push({id:'remit-'+t.id,category:'Collections',title:'Cash awaiting remittance',description:t.orderId+' · cash collection requires manager acknowledgment',target:'collections',icon:FiClipboard}));
  }else if(isStaff){
   orders.filter(o=>o.assigned==='Staff A'&&['Confirmed','Preparing'].includes(o.status)).forEach(o=>{
    list.push({id:'refill-'+o.id,category:'Refill',title:o.status==='Preparing'?'Refill in progress':'Refill task assigned',description:o.id+' · '+o.customer+' · '+o.items.reduce((n,i)=>n+i.quantity,0)+' container(s)',target:'refill',icon:FiDroplet});
   });
   orders.filter(o=>o.assigned==='Staff A'&&o.status==='Ready').forEach(o=>{
    list.push({id:'ready-'+o.id,category:'Orders',title:'Order ready for handover',description:o.id+' · '+o.customer+' · Preparation completed',target:'orders',icon:FiClipboard});
   });
  }else{
   orders.filter(o=>o.source==='Online'&&o.status==='Pending Confirmation').forEach(o=>{
    list.push({id:'pending-'+o.id,category:'Orders',title:'Online order needs confirmation',description:o.id+' · '+o.customer+' · Review order details',target:'orders',icon:FiClipboard});
   });
   orders.filter(o=>o.status==='Ready'&&o.service!=='Walk-in').forEach(o=>{
    list.push({id:'dispatch-'+o.id,category:'Delivery',title:'Order ready for dispatch',description:o.id+' · '+o.customer+' · Assign or review delivery',target:'delivery',icon:FiDroplet});
   });
  }
  if(!isDelivery)stock.filter(s=>s.quantity<s.minimum).forEach(s=>{
   const names={round5:'5-gallon round containers',slim25:'2.5-gallon slim containers',slim5:'5-gallon slim containers'};
   list.push({id:'stock-'+s.id,category:'Inventory',title:'Low bottle stock',description:(names[s.id]||s.id)+' · '+s.quantity+' remaining (minimum '+s.minimum+')',target:'inventory',icon:FiPackage});
  });
  return list;
 },[isStaff,isDelivery,trips,orders,stock]);
 const unread=notices.filter(n=>!readIds.includes(n.id)).length;
 const visible=filter==='unread'?notices.filter(n=>!readIds.includes(n.id)):notices;
 const read=(id)=>setReadIds(prev=>prev.includes(id)?prev:[...prev,id]);
 return <section className="mgmt-notification-page">
  <div className="mgmt-heading"><div className="overline">Activity Center</div><h1>Notifications</h1><p>{isDelivery?'Assigned trips and cash collection reminders.':isStaff?'Your refill tasks and stock alerts.':'Order requests, dispatch reminders and inventory alerts.'}</p></div>
  <div className="mgmt-notification-toolbar">
   <div className="mgmt-notification-tabs" role="group" aria-label="Notification filter">
    <button type="button" className={filter==='unread'?'active':''} aria-pressed={filter==='unread'} onClick={()=>setFilter('unread')}>Unread <span>{unread}</span></button>
    <button type="button" className={filter==='all'?'active':''} aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All <span>{notices.length}</span></button>
   </div>
   <button type="button" className="mgmt-notification-markall" disabled={!unread} onClick={()=>setReadIds(old=>[...new Set([...old,...notices.map(n=>n.id)])])}><FiCheckCircle/> Mark all read</button>
  </div>
  {visible.length===0?<div className="mgmt-notification-empty"><FiInbox size={32}/><h2>{filter==='unread'?'All caught up!':'No notifications yet'}</h2><p>{filter==='unread'?'No unread alerts. Switch to All to review previous notifications.':'New alerts will appear here as orders and stock change.'}</p></div>:
   <div className="mgmt-notification-list">{visible.map(n=>{
    const Icon=n.icon,seen=readIds.includes(n.id);
    return <article className={'mgmt-notification-card '+(seen?'is-read':'')} key={n.id}>
     <div className="mgmt-notification-icon"><Icon/></div>
     <div className="mgmt-notification-content">
      <div className="mgmt-notification-kicker"><span>{n.category}</span>{!seen&&<span className="mgmt-unread-dot" aria-label="Unread"/>}</div>
      <h2>{n.title}</h2><p>{n.description}</p>
      <div className="mgmt-notification-actions">
       <button type="button" className="mgmt-notification-open" onClick={()=>{read(n.id);onNavigate(n.target)}}>View details <FiArrowRight/></button>
       {!seen&&<button type="button" className="mgmt-notification-read" onClick={()=>read(n.id)}><FiCheck/> Mark read</button>}
      </div>
     </div>
    </article>;
   })}</div>
  }
  <p className="mgmt-notice"><FiBell/> Working in Progress: notifications use current browser records and read status resets on refresh. Real-time push notifications are not connected.</p>
 </section>;
}
