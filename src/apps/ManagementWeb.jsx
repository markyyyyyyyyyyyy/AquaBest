import { useMemo, useState } from 'react';
import {
 FiHome,FiMonitor,FiClipboard,FiMenu,FiBell,FiDroplet,FiTruck,
 FiPackage,FiCreditCard,FiBarChart2,FiUsers,FiPlus,FiMinus,FiArrowRight,
 FiCheckCircle,FiClock,FiX,FiAlertTriangle,FiActivity,FiDollarSign,
 FiEdit3,FiRefreshCw,FiSave,FiLogOut,FiLogIn
} from 'react-icons/fi';
import logo from '../assets/AquaBest logo.png';
import { bottleOptions } from './Component_Customer/orderData.js';
import { DEMO_PRICES, DEMO_PRODUCTS, INITIAL_ORDERS, INITIAL_STOCK, formatMoney, orderSummary } from '../data/managerDemo.js';
import { useEmployeeAvailability, availabilityFor, TeamAvailability } from './EmployeeAvailability.jsx';
import ManagementHeaderActions from './ManagementHeaderActions.jsx';
import ManagementNotifications from './ManagementNotifications.jsx';
import DeliveryOperations, { INITIAL_DELIVERY_TRIPS } from './DeliveryOperations.jsx';
import OwnerOperations from './OwnerOperations.jsx';
import ExpenseReport from './ExpenseReport.jsx';
import './managementWeb.css';

const modules=[
 ['dashboard','Dashboard',FiHome],['pos','POS',FiMonitor],['orders','Orders',FiClipboard],
 ['refill','Refill Tasks',FiDroplet],['delivery','Delivery',FiTruck],
 ['inventory','Inventory',FiPackage],['payments','Payments',FiCreditCard],
 ['reports','Sales Reports',FiBarChart2],['staff','Staff Tasks',FiUsers]
];
const ownerModules=[['dashboard','Dashboard',FiHome],['reports','Sales Reports',FiBarChart2],['employees','Employees',FiUsers],['products','Products & Services',FiPackage],['approvals','Verification',FiCreditCard],['orders','Orders',FiClipboard],['pos','POS',FiMonitor],['refill','Refill Tasks',FiDroplet],['delivery','Delivery',FiTruck],['inventory','Inventory',FiPackage],['payments','Payments',FiDollarSign],['settings','Business Settings',FiEdit3],['audit','Audit Logs',FiActivity]];
const staffModules=[['dashboard','Dashboard',FiHome],['refill','Refill Tasks',FiDroplet],['orders','Assigned Orders',FiClipboard],['inventory','Inventory',FiPackage],['activity','My Activity',FiActivity]];
const deliveryModules=[['dashboard','Dashboard',FiHome],['deliveries','My Deliveries',FiTruck],['bottles','Bottle Handling',FiPackage],['collections','Collections',FiCreditCard],['history','Delivery History',FiActivity]];
const stages=['Pending Confirmation','Confirmed','Preparing','Ready','Out for Delivery','Delivered','Completed'];
const initialSale=()=>({source:'Walk-in',customer:'',ownership:'own',arrangement:'purchase',service:'Walk-in',quantities:{round5:0,slim25:0,slim5:0},paymentMethod:'Cash',paymentStatus:'Paid',reference:'',notes:''});
const statusKind=s=>['Completed','Paid','Delivered','Ready'].includes(s)?'ok':['Pending Confirmation','Unpaid','Waiting'].includes(s)?'warn':'';
const Pill=({children})=><span className={'mgmt-pill '+statusKind(children)}>{children}</span>;
const Stat=({label,value,Icon})=><div className="mgmt-stat"><div className="mgmt-stat-top"><span>{label}</span><Icon size={17}/></div><strong>{value}</strong></div>;
const Heading=({kicker,title,subtitle})=><div className="mgmt-heading"><div className="overline">{kicker}</div><h1>{title}</h1><p>{subtitle}</p></div>;
const Section=({title,action,onClick})=><div className="mgmt-section-title"><h2>{title}</h2>{action&&<button className="mgmt-link" onClick={onClick}>{action} <FiArrowRight/></button>}</div>;
const Field=({label,children})=><div className="mgmt-field"><label>{label}</label>{children}</div>;
const today=()=>new Date().toISOString().slice(0,10);

export default function ManagementWeb({role='manager',onLogout}){
 const isStaff=role==='staff';
 const isDelivery=role==='delivery';
 const isOwner=role==='owner';
 const [trips,setTrips]=useState(INITIAL_DELIVERY_TRIPS);
 const [page,setPage]=useState('dashboard');
 const {entries:availability,update:updateAvailability}=useEmployeeAvailability();
 const [orders,setOrders]=useState(INITIAL_ORDERS);
 const [staffHistory,setStaffHistory]=useState([]);
 const [stock,setStock]=useState(INITIAL_STOCK);
 const [expenses,setExpenses]=useState([]);
 const [stockLog,setStockLog]=useState([]);
 const [stockError,setStockError]=useState('');
 const [sale,setSale]=useState(initialSale);
 const [filter,setFilter]=useState('All');
 const [selected,setSelected]=useState(null);
 const [assigned,setAssigned]=useState('Unassigned');
 const [nextStatus,setNextStatus]=useState('');
 const [notification,setNotification]=useState('');
 const [reportPeriod,setReportPeriod]=useState('Today');
 const [newStock,setNewStock]=useState({id:'round5',type:'IN',quantity:1,reason:''});
 const [stockOpen,setStockOpen]=useState(false);
 const go=(p)=>{if(isDelivery&&!['dashboard','deliveries','bottles','collections','history','more','notifications'].includes(p))return;if(isStaff&&!['dashboard','refill','orders','inventory','activity','more','notifications'].includes(p))return;setPage(p);setSelected(null);window.scrollTo(0,0)};
 const assignedOrders=orders.filter(o=>o.assigned==='Staff A');
 const ownStatusName=isOwner?'Owner':isDelivery?'Driver A':isStaff?'Staff A':'Manager';
 const deliveryAvailabilityOrders=trips.map(t=>({id:t.id,assigned:t.driver,status:t.status}));
 const logout=()=>{setSelected(null);setStockOpen(false);setPage('dashboard');onLogout?.()};
 const active=orders.filter(o=>!['Completed','Cancelled'].includes(o.status));
 const payments=orders.filter(o=>o.paymentStatus==='Paid');
 const revenue=payments.reduce((sum,o)=>sum+o.amount,0);
 const unpaid=orders.filter(o=>o.paymentStatus!=='Paid').reduce((sum,o)=>sum+o.amount,0);
 const selectedTotal=useMemo(()=>Object.entries(sale.quantities).reduce((s,[id,quantity])=>s+quantity*(DEMO_PRICES[id]||0),0),[sale.quantities]);
 const selectedQty=Object.values(sale.quantities).reduce((a,b)=>a+b,0);
 const setSaleProp=(key,val)=>setSale(p=>({...p,[key]:val}));
 const updateQty=(id,change)=>setSale(p=>({...p,quantities:{...p.quantities,[id]:Math.max(0,Math.min(99,(p.quantities[id]||0)+change))}}));
 const startSale=()=>{if(isStaff)return;setSale(initialSale());go('pos')};
 const saveSale=()=>{
  if(isStaff||!selectedQty)return;
  if(sale.ownership==='store' && Object.entries(sale.quantities).some(([id,q])=>q>(stock.find(x=>x.id===id)?.quantity||0))){setNotification('Insufficient AquaBest bottle stock.');return;}
  const id='POS-'+String(Date.now()).slice(-6);
  const isPaid=sale.paymentStatus==='Paid';
  const record={id,customer:sale.customer.trim()||'Walk-in Customer',source:sale.source,items:Object.entries(sale.quantities).filter(([,q])=>q>0).map(([sizeId,quantity])=>({sizeId,quantity})),
   status:sale.service==='Walk-in'?(isPaid?'Completed':'Confirmed'):'Pending Confirmation',paymentStatus:sale.paymentStatus,method:sale.paymentMethod,
   reference:sale.reference,amount:selectedTotal,service:sale.service,ownership:sale.ownership,assigned:'Unassigned',date:today(),notes:sale.notes};
  if(sale.ownership==='store'){
   const events=record.items.map(item=>({id:id+'-'+item.sizeId,productId:item.sizeId,type:'OUT',quantity:item.quantity,reason:sale.arrangement==='returnable'?'Returnable bottle issued':'Container sold',orderId:id,automatic:true,time:new Date().toLocaleString('en-PH')}));
   setStock(old=>old.map(x=>({...x,quantity:x.quantity-(record.items.find(i=>i.sizeId===x.id)?.quantity||0)})));
   setStockLog(old=>[...events,...old]);
  }
  setOrders(old=>[record,...old]);setNotification('Working in Progress: order saved in this browser only. '+(sale.ownership==='store'?'AquaBest bottle stock automatically deducted.':'Customer-owned container: no bottle stock deduction.'));
  setSale(initialSale());go('orders');
 };
 const changeOrder=(id,patch)=>setOrders(old=>old.map(o=>o.id===id?{...o,...patch}:o));
 const openOrder=(order)=>{if(isStaff&&order.assigned!=='Staff A')return;setSelected(order.id);setAssigned(order.assigned||'Unassigned');setNextStatus(order.status)};
 const current=orders.find(o=>o.id===selected);
 const applyOrder=()=>{if(!current)return;if(!isStaff&&assigned!==current.assigned){const x=availabilityFor(assigned,availability,orders);if(!x.assignable){setNotification(assigned+' is '+x.label+'. Cannot assign a new task.');return}if(x.queued>=3){setNotification(assigned+' already has 3 queued tasks. Soft limit exceeded; review workload.')}}if(isStaff){const next=current.status==='Confirmed'?'Preparing':current.status==='Preparing'?'Ready':null;if(current.assigned!=='Staff A'||!next||nextStatus!==next)return;changeOrder(current.id,{status:next});setStaffHistory(h=>[{id:Date.now(),label:current.id+' moved to '+next,time:new Date().toLocaleString('en-PH')},...h]);}else changeOrder(current.id,{status:nextStatus,assigned});setSelected(null);setNotification('Working in Progress: task status changed in this browser only.')};
 const applyPayment=()=>{if(isStaff||!current)return;changeOrder(current.id,{paymentStatus:'Paid'});setSelected(null);setNotification('Working in Progress: payment status changed locally; payment verification is not connected.')};
 const adjustStock=()=>{
 const n=Number(newStock.quantity),item=stock.find(s=>s.id===newStock.id),reason=newStock.reason.trim();
 if(!Number.isInteger(n)||n<1){setStockError('Enter a valid positive whole number.');return}
 if(!reason){setStockError('Reason is required.');return}
 if(newStock.type==='OUT'&&n>item.quantity){setStockError('Insufficient bottle stock.');return}
 setStock(old=>old.map(s=>s.id===newStock.id?{...s,quantity:s.quantity+(newStock.type==='IN'?n:-n)}:s));
 setStockLog(old=>[{id:'MAN-'+Date.now(),productId:newStock.id,type:newStock.type,quantity:n,reason,automatic:false,time:new Date().toLocaleString('en-PH')},...old]);
 if(isStaff)setStaffHistory(h=>[{id:Date.now(),label:'Inventory '+newStock.type+' ('+n+'): '+reason,time:new Date().toLocaleString('en-PH')},...h]);
 setStockOpen(false);setStockError('');setNewStock({id:'round5',type:'IN',quantity:1,reason:''});setNotification('Working in Progress: stock movement saved in this browser only.');
 };
 const filtered=(isStaff?assignedOrders:orders).filter(o=>filter==='All'||(filter==='Unpaid'?o.paymentStatus!=='Paid':o.status===filter));
 const section=<div className="mgmt-notice">Working in Progress</div>;

 return <div className="mgmt">
  <header className="mgmt-header"><div className="mgmt-header-inner">
    <button type="button" className="mgmt-brand mgmt-brand-button" aria-label="AquaBest — Go to Dashboard" onClick={()=>go('dashboard')}><img src={logo} alt="AquaBest"/><span className="mgmt-brand-label"><small>Management System</small><strong style={{fontSize:12,color:'#1b2f63'}}>{isOwner?'Owner Workspace':isDelivery?'Delivery Workspace':isStaff?'Staff Workspace':'Manager Workspace'}</strong></span></button>
    <div className="mgmt-header-end">
      <ManagementHeaderActions name={ownStatusName} entries={availability} orders={isDelivery?deliveryAvailabilityOrders:orders} onUpdate={updateAvailability} onNotifications={()=>go('notifications')}/>
      <button type="button" className="mgmt-header-logout" onClick={logout} aria-label="Log out of business workspace" title="Log out of business workspace"><FiLogOut aria-hidden="true"/><span>Log Out</span></button>
    </div>
  </div></header>
  <div className="mgmt-body">
   <aside className="mgmt-sidebar" aria-label="Management sections">{(isOwner?ownerModules:isDelivery?deliveryModules:isStaff?staffModules:modules).map(([id,label,Icon])=><button key={id} className={'mgmt-sidebtn '+(page===id?'active':'')} onClick={()=>go(id)}><Icon/><span className="mgmt-side-text"><strong>{label}</strong><small>{({dashboard:'Daily operations overview',pos:'Walk-in and manual sales',orders:'Review and assign orders',refill:'Preparation work queue',delivery:'Dispatch and pickups',inventory:'Bottle stock and movement logs',payments:'Collections and balances',reports:'Revenue and sales breakdown',staff:'Personnel assignments',activity:'Your task and stock movement history',deliveries:'Your assigned trips and stops',bottles:'Loaded bottles, empties and returns',collections:'COD and remittance records',history:'Completed trips and activity',employees:'Accounts and role permissions',approvals:'Electronic proofs and cash remittances',settings:'Product prices and business rules',audit:'Administrative activity and audit history',products:'Manage products, images and availability'})[id]}</small></span></button>)}<button className="mgmt-sidebtn mgmt-logout-link" onClick={logout}><FiLogOut/><span className="mgmt-side-text"><strong>Log Out</strong><small>Log out of the workspace</small></span></button></aside>
   <main className="mgmt-main">
    {notification&&<div className="mgmt-notice" role="status">{notification} <button className="mgmt-link" onClick={()=>setNotification('')}>Dismiss</button></div>}
    {isOwner&&<OwnerOperations page={page} go={go} orders={orders} stock={stock} trips={trips} availability={availability} onMessage={setNotification} expenses={expenses} setExpenses={setExpenses}/>}
    {isDelivery&&<DeliveryOperations page={page} go={go} trips={trips} setTrips={setTrips} onMessage={setNotification} onLogout={logout}/>}
    {isStaff&&page==='dashboard'&&<>
     <Heading kicker="Staff workspace" title="My Work Today" subtitle="Assigned orders, refill preparation and container tasks."/>
     <div className="mgmt-stats">
      <Stat label="Assigned Orders" value={assignedOrders.length} Icon={FiClipboard}/>
      <Stat label="Pending Refill" value={assignedOrders.filter(o=>['Confirmed','Preparing'].includes(o.status)).length} Icon={FiDroplet}/>
      <Stat label="Ready" value={assignedOrders.filter(o=>o.status==='Ready').length} Icon={FiCheckCircle}/>
      <Stat label="My Updates" value={staffHistory.length} Icon={FiActivity}/>
     </div>
     <Section title="Quick Actions"/><div className="mgmt-grid">
      <button className="mgmt-quick" onClick={()=>go('refill')}><FiDroplet/> Refill Queue</button>
      <button className="mgmt-quick" onClick={()=>go('orders')}><FiClipboard/> Assigned Orders</button>
      <button className="mgmt-quick" onClick={()=>go('inventory')}><FiPackage/> Bottle Inventory</button>
      <button className="mgmt-quick" onClick={()=>go('activity')}><FiActivity/> My Activity</button>
     </div>
     <Section title="My Assigned Orders" action="View All" onClick={()=>go('orders')}/>
     <div className="mgmt-card">{assignedOrders.map(o=><div className="mgmt-row" key={o.id}><div><div className="mgmt-row-title">{o.id} · {o.customer}</div><div className="mgmt-sub">{orderSummary(o.items)}</div></div><button className="mgmt-link" onClick={()=>openOrder(o)}>{o.status} <FiArrowRight/></button></div>)}</div>{section}
    </>}
    {!isOwner&&!isStaff&&!isDelivery&&page==='dashboard'&&<>
      <Heading kicker="Manager workspace" title="Station Overview" subtitle="Quick access to daily orders, refills, payments and deliveries."/>
      <TeamAvailability entries={availability} orders={orders}/>
      <div className="mgmt-stats"><Stat label="Collected" value={formatMoney(revenue)} Icon={FiDollarSign}/><Stat label="Orders" value={orders.length} Icon={FiClipboard}/><Stat label="Pending Refill" value={orders.filter(o=>['Confirmed','Preparing'].includes(o.status)).length} Icon={FiDroplet}/><Stat label="For Delivery" value={orders.filter(o=>o.service!=='Walk-in'&&!['Delivered','Completed','Cancelled'].includes(o.status)).length} Icon={FiTruck}/></div>
      <Section title="Quick Actions"/><div className="mgmt-grid">{[['New POS Sale',FiPlus,'pos'],['Manage Orders',FiClipboard,'orders'],['Refill Queue',FiDroplet,'refill'],['Dispatch',FiTruck,'delivery']].map(([label,Icon,id])=><button key={id} className="mgmt-quick" onClick={()=>id==='pos'?startSale():go(id)}><Icon/>{label}</button>)}</div>
      <Section title="Recent Orders" action="View All" onClick={()=>go('orders')}/><div className="mgmt-card">{orders.slice(0,4).map(o=><div key={o.id} className="mgmt-row"><div><div className="mgmt-row-title">{o.customer} · {o.id}</div><div className="mgmt-sub">{orderSummary(o.items)}</div></div><Pill>{o.status}</Pill></div>)}</div>
      <Section title="Sales Summary" action="View Reports" onClick={()=>go('reports')}/><div className="mgmt-card"><div className="mgmt-row"><span className="mgmt-sub">Collected payments</span><strong>{formatMoney(revenue)}</strong></div><div className="mgmt-row"><span className="mgmt-sub">Outstanding</span><strong>{formatMoney(unpaid)}</strong></div></div>{section}
    </>}
    {!isStaff&&!isDelivery&&page==='pos'&&<>
      <Heading kicker="Counter / manual encoding" title="New POS Sale" subtitle="For walk-ins, customers calling the station, and Messenger orders."/>
      <div className="mgmt-card"><Section title="1. Transaction & Customer"/>
       <div className="mgmt-formgrid">
        <Field label="Order Source"><select value={sale.source} onChange={e=>setSaleProp('source',e.target.value)}>{['Walk-in','Messenger','Phone'].map(x=><option key={x}>{x}</option>)}</select></Field>
        <Field label="Customer Name"><input value={sale.customer} onChange={e=>setSaleProp('customer',e.target.value)} placeholder={sale.source==='Walk-in'?'Optional for walk-in':'Customer / contact name'} /></Field>
        <Field label="Containers"><select value={sale.ownership} onChange={e=>setSale(p=>({...p,ownership:e.target.value}))}><option value="own">Customer-owned (Refill)</option><option value="store">AquaBest-provided</option></select></Field>
        <Field label="Service / Fulfillment"><select value={sale.service} onChange={e=>setSaleProp('service',e.target.value)}><option>Walk-in</option><option>Pickup & Delivery</option><option>Drop-off & Delivery</option><option>Delivery</option></select></Field>
       </div>
       {sale.ownership==='store'&&<Field label="Container Arrangement"><select value={sale.arrangement} onChange={e=>setSaleProp('arrangement',e.target.value)}><option value="purchase">Purchase container</option><option value="returnable">Returnable / borrowed (policy pending)</option></select></Field>}
      </div>
      <div className="mgmt-card" style={{marginTop:12}}><Section title="2. Select Sizes & Quantities"/><p className="mgmt-sub">Same multi-size ordering as the customer site. Prices below are reference values.</p>
        {bottleOptions.map(p=><div className="mgmt-product" key={p.id}><img src={p.image} alt={p.name+' '+p.shape}/><div className="mgmt-product-info"><strong>{p.name}</strong><small>{p.shape} • {formatMoney(DEMO_PRICES[p.id])}</small></div><div className="mgmt-qty"><button onClick={()=>updateQty(p.id,-1)} disabled={!sale.quantities[p.id]} aria-label={'Remove '+p.name}><FiMinus/></button><span>{sale.quantities[p.id]}</span><button onClick={()=>updateQty(p.id,1)} aria-label={'Add '+p.name}><FiPlus/></button></div></div>)}
      </div>
      {sale.ownership==='store'&&<div className="mgmt-notice" style={{marginTop:12}}>AquaBest-provided bottles automatically deduct bottle inventory when saved. Customer-owned containers do not.</div>}
      <div className="mgmt-card" style={{marginTop:12}}><Section title="3. Payment"/>
        <div className="mgmt-formgrid">
          <Field label="Payment Method"><select value={sale.paymentMethod} onChange={e=>setSaleProp('paymentMethod',e.target.value)}>{['Cash','GCash','Bank Transfer'].map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field label="Payment Status"><select value={sale.paymentStatus} onChange={e=>setSaleProp('paymentStatus',e.target.value)}><option>Paid</option><option>Unpaid</option></select></Field>
          {sale.paymentMethod!=='Cash'&&<Field label="Payment Reference (optional)"><input placeholder="Reference number / proof note" value={sale.reference} onChange={e=>setSaleProp('reference',e.target.value)}/></Field>}
          <Field label="Internal note"><input placeholder="Special request or instructions" value={sale.notes} onChange={e=>setSaleProp('notes',e.target.value)}/></Field>
        </div>
      </div>
      <div className="mgmt-summary" style={{marginTop:12}}><strong>Transaction Summary</strong>{DEMO_PRODUCTS.filter(p=>sale.quantities[p.id]>0).map(p=><div key={p.id}><span>{p.label} · {p.shape} × {sale.quantities[p.id]}</span><b>{formatMoney(sale.quantities[p.id]*DEMO_PRICES[p.id])}</b></div>)}<div className="total"><span>Total</span><strong>{formatMoney(selectedTotal)}</strong></div></div>
      <div style={{display:'flex',gap:9,marginTop:14}}><button className="mgmt-btn secondary" onClick={()=>setSale(initialSale())}>Clear</button><button className="mgmt-btn" style={{flex:1}} disabled={!selectedQty} onClick={saveSale}><FiSave/> Save Transaction</button></div>
      {section}
    </>}
    {!isDelivery&&page==='orders'&&<>
     <Heading kicker={isStaff?'My assigned work':'Centralized order queue'} title={isStaff?'Assigned Orders':'Orders'} subtitle={isStaff?'Only orders assigned to you.':'Online, walk-in, Messenger and phone orders in one place.'}/>
     <div className="mgmt-controls">{(isStaff?['All','Confirmed','Preparing','Ready']:['All','Pending Confirmation','Confirmed','Preparing','Out for Delivery','Completed','Unpaid']).map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>
     {filtered.map(o=><article className="mgmt-card mgmt-order" key={o.id}><div className="mgmt-order-head"><strong>{o.id} · {o.customer}</strong><Pill>{o.status}</Pill></div><p>{o.source} • {o.service} • {o.date}</p><p>{orderSummary(o.items)}</p><div className="mgmt-order-actions">{!isStaff&&<strong>{formatMoney(o.amount)} <span className="mgmt-sub">({o.paymentStatus})</span></strong>}<button className="mgmt-btn secondary" onClick={()=>openOrder(o)}>View Details <FiArrowRight/></button></div></article>)}
     {!filtered.length&&<div className="mgmt-card">No orders in this filter.</div>}
     {!isStaff&&<button className="mgmt-btn full" onClick={startSale}><FiPlus/> Encode Manual Order</button>}{section}
    </>}
    {!isDelivery&&page==='refill'&&<>
     <Heading kicker="Preparation" title="Refill Tasks" subtitle="Track confirmed orders from preparation to ready for pickup or delivery."/>
     {(isStaff?assignedOrders:orders).filter(o=>['Confirmed','Preparing','Ready'].includes(o.status)).map(o=><article className="mgmt-card mgmt-order" key={o.id}><div className="mgmt-order-head"><strong>{o.id} · {o.customer}</strong><Pill>{o.status}</Pill></div><p>{orderSummary(o.items)}</p><p>Assigned: {o.assigned}</p><button className="mgmt-btn secondary" onClick={()=>openOrder(o)}>{isStaff?'Update Refill':'Assign / Update'} <FiEdit3/></button></article>)}
     <div className="mgmt-notice">Staff will reuse this queue with permissions limited to assigned tasks.</div>{section}
    </>}
    {!isStaff&&!isDelivery&&page==='delivery'&&<>
     <Heading kicker="Dispatch" title="Delivery Management" subtitle="Assign drivers, monitor drop-offs, and track collections."/>
     {orders.filter(o=>o.service!=='Walk-in'&&!['Completed','Cancelled'].includes(o.status)).map(o=><article className="mgmt-card mgmt-order" key={o.id}><div className="mgmt-order-head"><strong>{o.id} · {o.customer}</strong><Pill>{o.status}</Pill></div><p>{o.service} • {orderSummary(o.items)}</p><p>Assigned: {o.assigned}</p><button className="mgmt-btn secondary" onClick={()=>openOrder(o)}>Manage Delivery <FiTruck/></button></article>)}
     <div className="mgmt-notice">Delivery routes, coordinates, vehicle assignment and cash remittance are future integrations.</div>{section}
    </>}
    {!isDelivery&&page==='inventory'&&<>
     <Heading kicker="Stock control" title="Inventory & Bottles" subtitle="Available containers, minimum stock and movement recording."/>
     <div className="mgmt-stats"><Stat label="Total Bottles" value={stock.reduce((a,s)=>a+s.quantity,0)} Icon={FiPackage}/><Stat label="Low Stock" value={stock.filter(s=>s.quantity<s.minimum).length} Icon={FiAlertTriangle}/></div>
     {stock.map(s=><div className="mgmt-card mgmt-order" key={s.id}><div className="mgmt-order-head"><strong>{DEMO_PRODUCTS.find(p=>p.id===s.id)?.label} · {DEMO_PRODUCTS.find(p=>p.id===s.id)?.shape}</strong><Pill>{s.quantity<s.minimum?'Low Stock':'Available'}</Pill></div><p>Quantity: {s.quantity} • Minimum: {s.minimum}</p></div>)}
     <button className="mgmt-btn full" onClick={()=>{setStockError('');setStockOpen(true)}}><FiPlus/> Record Stock IN / OUT</button>
     <Section title="Movement History"/>
     <div className="mgmt-card">{stockLog.length?stockLog.map(m=><div className="mgmt-row" key={m.id}><div><div className="mgmt-row-title">{m.automatic?'Automatic':'Manual'} {m.type} · {DEMO_PRODUCTS.find(p=>p.id===m.productId)?.label} {DEMO_PRODUCTS.find(p=>p.id===m.productId)?.shape}</div><div className="mgmt-sub">{m.reason}{m.orderId?' · '+m.orderId:''}</div><div className="mgmt-sub">{m.time}</div></div><Pill>{(m.type==='IN'?'+':'−')+m.quantity}</Pill></div>):<p className="mgmt-sub">No stock movements recorded during this session. Save a store-owned POS order or record manual IN/OUT.</p>}</div>{section}
    </>}
    {!isStaff&&!isDelivery&&page==='payments'&&<>
     <Heading kicker="Collections" title="Payments" subtitle="Keep payment status separate from order preparation."/>
     <div className="mgmt-stats"><Stat label="Paid Total" value={formatMoney(revenue)} Icon={FiDollarSign}/><Stat label="Outstanding" value={formatMoney(unpaid)} Icon={FiClock}/></div>
     {orders.map(o=><div className="mgmt-card mgmt-order" key={o.id}><div className="mgmt-order-head"><strong>{o.id} · {o.customer}</strong><Pill>{o.paymentStatus}</Pill></div><p>{o.source} • {formatMoney(o.amount)}</p>{o.paymentStatus!=='Paid'&&<button className="mgmt-btn secondary" onClick={()=>openOrder(o)}>Review Payment <FiCreditCard/></button>}</div>)}{section}
    </>}
    {!isOwner&&!isStaff&&!isDelivery&&page==='reports'&&<>
     <Heading kicker="Business insights" title="Sales Reports" subtitle="Sales totals and order counts for the selected period."/>
     <div className="mgmt-controls">{['Today','This Week','This Month'].map(x=><button key={x} className={reportPeriod===x?'active':''} onClick={()=>setReportPeriod(x)}>{x}</button>)}</div>
     <div className="mgmt-stats"><Stat label="Collected" value={formatMoney(revenue)} Icon={FiDollarSign}/><Stat label="Paid Transactions" value={payments.length} Icon={FiCheckCircle}/><Stat label="Unpaid Balance" value={formatMoney(unpaid)} Icon={FiClock}/><Stat label="Total Orders" value={orders.length} Icon={FiClipboard}/></div>
     <Section title="Sales Trend"/><div className="mgmt-card"><div className="mgmt-chart">{[0,0,0,0,0,0,0].map((height,i)=><div key={i}><b style={{height:height+'%'}}/><small>{['M','T','W','T','F','S','S'][i]}</small></div>)}</div><p className="mgmt-sub">Working in Progress</p></div>
     <Section title="Sales by Source"/><div className="mgmt-card">{['Walk-in','Online','Messenger','Phone'].map(source=><div className="mgmt-row" key={source}><span className="mgmt-sub">{source}</span><strong>{formatMoney(payments.filter(o=>o.source===source).reduce((a,o)=>a+o.amount,0))}</strong></div>)}</div>
     <ExpenseReport expenses={expenses} setExpenses={setExpenses} onEvent={setNotification}/>
     <div className="mgmt-notice">Date tabs and chart are visual demo controls. Verified sales reports will require real payment dates and database queries.</div>{section}
    </>}
    {!isOwner&&!isStaff&&!isDelivery&&page==='staff'&&<>
     <Heading kicker="Operations team" title="Staff Assignments" subtitle="Shared work queue, not a separate system for each role."/>
     <TeamAvailability entries={availability} orders={orders}/>
     {['Manager','Staff A · Refiller','Staff B · POS / Refill','Driver A · Delivery','Driver B · Delivery'].map(s=><div className="mgmt-card mgmt-order" key={s}><div className="mgmt-order-head"><strong>{s}</strong><FiUsers color="#244ea3"/></div><p>Role and task assignments are sample data, pending client confirmation.</p></div>)}{section}
    </>}
    {isStaff&&page==='activity'&&<>
     <Heading kicker="My work history" title="My Activity" subtitle="Your refill status and inventory changes for this session."/>
     <div className="mgmt-card">{staffHistory.length?staffHistory.map(a=><div className="mgmt-row" key={a.id}><div><strong className="mgmt-row-title">{a.label}</strong><div className="mgmt-sub">{a.time}</div></div><FiCheckCircle color="#244ea3"/></div>):<p className="mgmt-sub">No activity yet. Start a refill task or record an inventory movement.</p>}</div>{section}
    </>}
    {page==='notifications'&&<ManagementNotifications isStaff={isStaff} isDelivery={isDelivery} trips={trips} orders={orders} stock={stock} onNavigate={go}/>}
    {isStaff&&page==='more'&&<>
     <Heading kicker="Staff access" title="More Modules" subtitle="Your additional work tools and account."/>
     <div className="mgmt-more">
      <button onClick={()=>go('inventory')}><FiPackage/><strong>Inventory</strong><small>Available bottles and stock movements</small></button>
      <button onClick={()=>go('activity')}><FiActivity/><strong>My Activity</strong><small>My updates and work history</small></button>
      <button onClick={()=>go('orders')}><FiClipboard/><strong>Assigned Orders</strong><small>View orders assigned to Staff A</small></button>
      <button onClick={logout}><FiLogOut/><strong>Log Out</strong><small>Log out of the workspace</small></button>
     </div>{section}
    </>}
    {!isOwner&&!isStaff&&!isDelivery&&page==='more'&&<><Heading kicker="Manager access" title="More Modules" subtitle="Open another operational workspace."/><div className="mgmt-more">{modules.slice(3).map(([id,label,Icon])=><button key={id} onClick={()=>go(id)}><Icon/><strong>{label}</strong><small>{({refill:'Preparation and refill queue',delivery:'Assignments and pickups',inventory:'Bottle stock and movement logs',payments:'Collections and unpaid orders',reports:'Sales trends and breakdown',staff:'Personnel tasks'})[id]}</small></button>)}<button onClick={logout}><FiLogOut/><strong>Log Out</strong><small>Log out of the workspace</small></button></div>{section}</>}
   </main>
  </div>
  <nav className="mgmt-bottom" aria-label="Primary management navigation">{(isOwner?[['dashboard','Home',FiHome],['reports','Reports',FiBarChart2],['employees','Employees',FiUsers],['more','More',FiMenu]]:isDelivery?[['dashboard','Home',FiHome],['deliveries','Deliveries',FiTruck],['collections','Collections',FiCreditCard],['more','More',FiMenu]]:isStaff?[['dashboard','Home',FiHome],['refill','Refill',FiDroplet],['orders','Orders',FiClipboard],['more','More',FiMenu]]:[['dashboard','Home',FiHome],['pos','POS',FiMonitor],['orders','Orders',FiClipboard],['more','More',FiMenu]]).map(([id,label,Icon])=><button key={id} className={page===id||(id==='more'&&!['dashboard','pos','orders','refill','deliveries','collections',...(isOwner?['reports','employees']:[])].includes(page))?'active':''} onClick={()=>go(id)}><Icon/>{label}</button>)}</nav>
  {!isDelivery&&(current||stockOpen)&&<div className="mgmt-drawer" role="presentation" onClick={()=>{setSelected(null);setStockOpen(false)}}>
    <div className="mgmt-sheet" role="dialog" aria-modal="true" aria-label={stockOpen?'Stock movement':'Order details'} onClick={e=>e.stopPropagation()}>
      <div className="mgmt-sheet-head"><h2>{stockOpen?'Record Stock Movement':current?.id+' · '+current?.customer}</h2><button className="mgmt-icobtn" aria-label="Close" onClick={()=>{setSelected(null);setStockOpen(false)}}><FiX/></button></div>
      {stockOpen?<><Field label="Item"><select value={newStock.id} onChange={e=>setNewStock(p=>({...p,id:e.target.value}))}>{DEMO_PRODUCTS.map(p=><option value={p.id} key={p.id}>{p.label} · {p.shape}</option>)}</select></Field><Field label="Type"><select value={newStock.type} onChange={e=>setNewStock(p=>({...p,type:e.target.value}))}><option>IN</option><option>OUT</option></select></Field><Field label="Quantity"><input type="number" min="1" step="1" value={newStock.quantity} onChange={e=>setNewStock(p=>({...p,quantity:e.target.value}))}/></Field><Field label="Reason (required)"><input value={newStock.reason} placeholder="New stock, damaged bottle, bottle return..." onChange={e=>{setNewStock(p=>({...p,reason:e.target.value}));setStockError('')}}/></Field>{stockError&&<div className="mgmt-notice" role="alert">{stockError}</div>}<button className="mgmt-btn full" style={{marginTop:12}} onClick={adjustStock}>Save Movement</button></>:
       current&&<><p className="mgmt-sub">{current.source} • {current.service} • {current.date}</p>
        <div className="mgmt-card" style={{margin:'12px 0'}}><strong>Items</strong><p className="mgmt-sub">{orderSummary(current.items)}</p>{!isStaff&&<><div className="mgmt-row"><span>Total</span><strong>{formatMoney(current.amount)}</strong></div><div className="mgmt-row"><span>Payment</span><Pill>{current.paymentStatus}</Pill></div></>}</div>
        <Field label="Order / Task Status"><select value={nextStatus} onChange={e=>setNextStatus(e.target.value)}>{(isStaff?[current.status,...(current.status==='Confirmed'?['Preparing']:current.status==='Preparing'?['Ready']:[])]:stages).map(s=><option key={s}>{s}</option>)}</select></Field>
        {!isStaff&&<Field label="Assigned Personnel"><select value={assigned} onChange={e=>setAssigned(e.target.value)}>{['Unassigned','Manager','Staff A','Staff B','Driver A','Driver B'].map(a=><option key={a}>{a}</option>)}</select></Field>}
        <div className="mgmt-progress" style={{margin:'14px 0'}}>{stages.slice(0,5).map((s,i)=><div key={s} className={stages.indexOf(current.status)>=i?'done':''}>{stages.indexOf(current.status)>=i?<FiCheckCircle/>:<FiClock/>}{s}</div>)}</div>
        <button className="mgmt-btn full" disabled={isStaff&&!['Confirmed','Preparing'].includes(current.status)} onClick={applyOrder}><FiSave/> {isStaff?'Update Refill Status':'Save Status'}</button>
        {!isStaff&&current.paymentStatus!=='Paid'&&<button className="mgmt-btn full secondary" style={{marginTop:9}} onClick={applyPayment}><FiCreditCard/> Mark Paid</button>}
       </>}
    </div>
  </div>}
 </div>;
}
