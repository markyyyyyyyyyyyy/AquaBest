import {useState} from 'react';
import {FiTruck,FiPackage,FiCreditCard,FiClock,FiCheckCircle,FiArrowRight,FiAlertTriangle,FiMapPin,FiFileText,FiRefreshCcw,FiLogOut,FiDollarSign} from 'react-icons/fi';
import {formatMoney} from '../data/managerDemo.js';

export const INITIAL_DELIVERY_TRIPS=[];
const STEPS=['Assigned','Ready for Pickup','Out for Delivery','Delivered'];
const terminal=['Delivered','Failed Delivery'];
function Summary({title,value,Icon}){return <div className="mgmt-stat"><div className="mgmt-stat-top"><span>{title}</span><Icon size={17}/></div><strong>{value}</strong></div>}
function Title({tag,title,description}){return <div className="mgmt-heading"><div className="overline">{tag}</div><h1>{title}</h1><p>{description}</p></div>}
function Label({children}){return <span className="mgmt-pill">{children}</span>}
const stamp=()=>new Date().toLocaleString('en-PH');
export default function DeliveryOperations({page,go,trips,setTrips,driver='Driver A',onMessage,onLogout}){
 const [selected,setSelected]=useState(null);
 const [tab,setTab]=useState('Active');
 const [count,setCount]=useState('1');
 const [note,setNote]=useState('');
 const [result,setResult]=useState('Delivered');
 const [method,setMethod]=useState('Cash');
 const [amount,setAmount]=useState('');
 const [reference,setReference]=useState('');
 const [bottleLog,setBottleLog]=useState([]);
 const [collections,setCollections]=useState([]);
 const [activity,setActivity]=useState([]);
 const mine=trips.filter(t=>t.driver===driver);
 const active=mine.filter(t=>!terminal.includes(t.status));
 const completed=mine.filter(t=>terminal.includes(t.status));
 const cashToRemit=mine.reduce((sum,t)=>sum+(t.remittance==='Awaiting Remittance'?t.collectedCash:0),0);
 const chosen=mine.find(t=>t.id===selected);
 const open=id=>{setSelected(id);setCount('1');setNote('');setResult('Delivered');setMethod('Cash');setAmount('');setReference('')};
 const update=(t,patch,action)=>{
  setTrips(old=>old.map(row=>row.id===t.id?{...row,...patch}:row));
  setActivity(old=>[{id:Date.now()+'-'+old.length,action,time:stamp()},...old]);
  onMessage(action+' (demo only)');
 };
 const move=(t)=>{
  if(t.status==='Assigned'){update(t,{status:'Ready for Pickup'},t.orderId+' marked ready for pickup (demo)');setSelected(null)}
  else if(t.status==='Ready for Pickup'){
   if(t.bottlesLoaded!==t.expectedBottles){onMessage('Record all '+t.expectedBottles+' loaded filled containers first.');return}
   update(t,{status:'Out for Delivery'},t.orderId+' dispatched');setSelected(null);
  }
 };
 const bottles=(t,type)=>{
  const n=Number(count);
  if(!Number.isInteger(n)||n<1||n>100){onMessage('Enter a valid bottle quantity (1–100).');return}
  if(type==='loaded'&&t.bottlesLoaded+n>t.expectedBottles){onMessage('Already loaded '+t.bottlesLoaded+' of '+t.expectedBottles+'. Cannot exceed the order quantity.');return}
  if(type==='returned'&&!note.trim()){onMessage('A note is required for returned bottles.');return}
  const label=type==='loaded'?'Filled bottles loaded':type==='empty'?'Empty containers collected':'Containers returned to station';
  const patch=type==='loaded'?{bottlesLoaded:t.bottlesLoaded+n}:type==='empty'?{emptiesCollected:t.emptiesCollected+n}:{};
  update(t,patch,label+' × '+n+' · '+t.orderId);
  setBottleLog(old=>[{id:Date.now()+'-'+old.length,trip:t.id,label,quantity:n,note:note.trim(),time:stamp()},...old]);
  setCount('1');setNote('');
 };
 const confirm=(t)=>{
  if(result==='Failed'){
   if(!note.trim()){onMessage('Enter why the delivery failed.');return}
   update(t,{status:'Failed Delivery',failureReason:note.trim()},'Failed delivery reported: '+note.trim());setSelected(null);return;
  }
  if(t.paymentStatus==='Paid'){update(t,{status:'Delivered'},t.orderId+' delivered (prepaid verified)');setSelected(null);return}
  if(method==='Cash'){
   const received=Number(amount);
   if(!Number.isFinite(received)||received<t.amount){onMessage('Enter cash received of at least '+formatMoney(t.amount)+'.');return}
   update(t,{status:'Delivered',paymentStatus:'Collected',paymentMethod:'Cash',collectedCash:t.amount,remittance:'Awaiting Remittance'},t.orderId+' delivered · Cash '+formatMoney(t.amount)+' collected');
   setCollections(old=>[{id:Date.now()+'-'+old.length,trip:t.id,method:'Cash',amount:t.amount,reference:'',status:'Awaiting Remittance',time:stamp()},...old]);
  }else{
   if(!reference.trim()){onMessage('Enter the '+method+' transaction reference before confirming delivery.');return}
   update(t,{status:'Delivered',paymentStatus:'Pending Verification',paymentMethod:method,reference:reference.trim()},t.orderId+' delivered · '+method+' proof submitted for verification');
   setCollections(old=>[{id:Date.now()+'-'+old.length,trip:t.id,method,amount:t.amount,reference:reference.trim(),status:'Pending Verification',time:stamp()},...old]);
  }
  setSelected(null);
 };
 const card=t=><article className="mgmt-card mgmt-order" key={t.id}>
  <div className="mgmt-order-head"><strong>{t.customer} · {t.orderId}</strong><Label>{t.status}</Label></div>
  <p>{t.items}</p><p><FiMapPin/> {t.address}</p>
  <div className="mgmt-order-actions"><span className="mgmt-sub">{t.paymentStatus==='Paid'?'Paid · Verified':t.paymentStatus==='Pending Verification'?'Payment pending verification':t.paymentStatus==='Collected'?'Cash collected':formatMoney(t.amount)+' due'}</span><button className="mgmt-btn secondary" onClick={()=>open(t.id)}>View Details <FiArrowRight/></button></div>
 </article>;
 return <>
  {page==='dashboard'&&<><Title tag="Delivery workspace" title="My Delivery Overview" description="Assigned trips, delivery progress and collections."/>
   <div className="mgmt-stats"><Summary title="Assigned Trips" value={mine.length} Icon={FiTruck}/><Summary title="Active Trips" value={active.length} Icon={FiClock}/><Summary title="Delivered / Failed" value={completed.length} Icon={FiCheckCircle}/><Summary title="Cash to Remit" value={formatMoney(cashToRemit)} Icon={FiDollarSign}/></div>
   <div className="mgmt-section-title"><h2>Quick Actions</h2></div>
   <div className="mgmt-grid"><button className="mgmt-quick" onClick={()=>go('deliveries')}><FiTruck/> My Deliveries</button><button className="mgmt-quick" onClick={()=>go('bottles')}><FiPackage/> Bottle Handling</button><button className="mgmt-quick" onClick={()=>go('collections')}><FiCreditCard/> Collections</button><button className="mgmt-quick" onClick={()=>go('history')}><FiClock/> Trip History</button></div>
   <div className="mgmt-section-title"><h2>Current Trips</h2><button className="mgmt-link" onClick={()=>go('deliveries')}>View All <FiArrowRight/></button></div>{active.map(card)}
   <div className="mgmt-notice">Working in Progress</div>
  </>}
  {page==='deliveries'&&<><Title tag="Delivery operations" title="My Deliveries" description="Your assigned stops. Confirm delivery and payment together at drop-off."/>
   <div className="mgmt-controls">{['Active','Completed','All'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</div>
   {(tab==='Active'?active:tab==='Completed'?completed:mine).map(card)}
   {!mine.length&&<div className="mgmt-card">No assigned trips yet.</div>}
  </>}
  {page==='bottles'&&<><Title tag="Container movement" title="Bottle Handling" description="Only record a bottle action when it physically happens."/>
   <div className="mgmt-notice">Trip handover records do not adjust real inventory. Backend reconciliation is required.</div>
   {active.map(t=><article className="mgmt-card mgmt-order" key={t.id}><div className="mgmt-order-head"><strong>{t.orderId} · {t.customer}</strong><Label>{t.status}</Label></div><p>Filled loaded: {t.bottlesLoaded}/{t.expectedBottles} · Empty pickups: {t.emptiesCollected}</p><button className="mgmt-btn secondary" onClick={()=>open(t.id)}>Record Handover</button></article>)}
   <div className="mgmt-section-title"><h2>Recent Bottle Movements</h2></div><div className="mgmt-card">{bottleLog.length?bottleLog.map(l=><div className="mgmt-row" key={l.id}><div><strong className="mgmt-row-title">{l.label} · {l.trip}</strong><div className="mgmt-sub">{l.time} · {l.note||'No note'}</div></div><Label>× {l.quantity}</Label></div>):<p className="mgmt-sub">No bottle movements yet.</p>}</div>
  </>}
  {page==='collections'&&<><Title tag="Payment & remittance" title="Collections" description="Cash, GCash and bank proof are tracked separately from delivery."/>
   <div className="mgmt-stats"><Summary title="Cash to Remit" value={formatMoney(cashToRemit)} Icon={FiCreditCard}/><Summary title="Payments Recorded" value={collections.length} Icon={FiFileText}/></div>
   {mine.map(t=><div className="mgmt-card mgmt-order" key={t.id}><div className="mgmt-order-head"><strong>{t.orderId} · {t.customer}</strong><Label>{t.paymentStatus}</Label></div><p>{t.paymentMethod||'Payment on delivery'} · {formatMoney(t.amount)} · {t.remittance}</p><button className="mgmt-btn secondary" onClick={()=>open(t.id)}>View Details</button></div>)}
   <button className="mgmt-btn full" disabled={!cashToRemit} onClick={()=>onMessage('Demo remittance request submitted. Manager acknowledgment requires shared backend.')}>Request Cash Remittance Confirmation</button>
   <div className="mgmt-section-title"><h2>Collection Records</h2></div><div className="mgmt-card">{collections.length?collections.map(l=><div className="mgmt-row" key={l.id}><div><strong className="mgmt-row-title">{l.trip} · {l.method} · {formatMoney(l.amount)}</strong><div className="mgmt-sub">{l.time} · {l.reference||l.status}</div></div></div>):<p className="mgmt-sub">No collections recorded in this session.</p>}</div>
  </>}
  {page==='history'&&<><Title tag="Read-only records" title="Delivery History" description="Delivered, failed and recently updated trips."/>
   {completed.length?completed.map(card):<div className="mgmt-card">No completed trips yet.</div>}
   <div className="mgmt-section-title"><h2>My Activity</h2></div><div className="mgmt-card">{activity.length?activity.map(a=><div className="mgmt-row" key={a.id}><div><strong className="mgmt-row-title">{a.action}</strong><div className="mgmt-sub">{a.time}</div></div></div>):<p className="mgmt-sub">No activity yet.</p>}</div>
  </>}
  {page==='more'&&<><Title tag="Delivery access" title="More Modules" description="Your trip and account tools."/><div className="mgmt-more">{[[FiPackage,'Bottle Handling','bottles'],[FiCreditCard,'Collections','collections'],[FiClock,'Delivery History','history'],[FiTruck,'My Deliveries','deliveries']].map(([Icon,label,target])=><button key={target} onClick={()=>go(target)}><Icon/><strong>{label}</strong><small>Open {label.toLowerCase()}</small></button>)}<button onClick={onLogout}><FiLogOut/><strong>Log Out</strong><small>Exit delivery demo</small></button></div></>}
  {chosen&&<div className="mgmt-drawer" role="presentation" onClick={()=>setSelected(null)}><div className="mgmt-sheet" role="dialog" aria-modal="true" aria-label="Delivery details" onClick={e=>e.stopPropagation()}>
   <div className="mgmt-sheet-head"><h2>{chosen.orderId} · {chosen.customer}</h2><button className="mgmt-icobtn" aria-label="Close" onClick={()=>setSelected(null)}>✕</button></div>
   <p className="mgmt-sub">{chosen.items} · {chosen.address}</p><p className="mgmt-sub">{chosen.notes}</p>
   <div className="mgmt-notice">Sample location and customer details. Maps is disabled until verified addresses exist.</div><button className="mgmt-btn secondary" disabled><FiMapPin/> Open Maps (Soon)</button>
   <div className="mgmt-section-title"><h2>Delivery Progress</h2></div>
   <div className="mgmt-progress">{STEPS.map((step,i)=><div key={step} className={STEPS.indexOf(chosen.status)>=i?'done':''}>{STEPS.indexOf(chosen.status)>=i?<FiCheckCircle/>:<FiClock/>}{step}</div>)}</div>
   {['Assigned','Ready for Pickup'].includes(chosen.status)&&<div style={{marginTop:12}}><button className="mgmt-btn full" onClick={()=>move(chosen)}><FiArrowRight/> {chosen.status==='Assigned'?'Confirm Ready for Pickup':'Confirm Loaded & Start Delivery'}</button></div>}
   {chosen.status==='Out for Delivery'&&<div className="delivery-confirm">
    <div className="mgmt-section-title"><h2>Confirm Delivery</h2></div>
    <div className="mgmt-field"><label>Delivery outcome</label><select value={result} onChange={e=>setResult(e.target.value)}><option value="Delivered">Successfully Delivered</option><option value="Failed">Delivery Failed</option></select></div>
    {result==='Failed'?<div className="mgmt-field"><label>Failure reason (required)</label><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Customer unavailable, wrong address, refused delivery"/></div>:
    chosen.paymentStatus==='Paid'?<div className="mgmt-notice delivery-paid"><FiCheckCircle/> Verified paid — no payment collection needed.</div>:
    <><div className="mgmt-notice">Payment due: <strong>{formatMoney(chosen.amount)}</strong>. Collect by cash, GCash or bank transfer at drop-off.</div>
    <div className="mgmt-field"><label>Payment method</label><select value={method} onChange={e=>setMethod(e.target.value)}><option>Cash</option><option>GCash</option><option>Bank Transfer</option></select></div>
    {method==='Cash'?<div className="mgmt-field"><label>Cash received (₱)</label><input type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={String(chosen.amount)}/></div>:
     <div className="mgmt-field"><label>{method} reference number (required)</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Transaction reference / proof number"/><small>Electronic payment proof is pending verification, not automatically Paid.</small></div>}</>}
    <button className="mgmt-btn full" onClick={()=>confirm(chosen)}><FiCheckCircle/> {result==='Failed'?'Report Failed Delivery':'Confirm Delivered & Record Payment'}</button>
   </div>}
   {['Assigned','Ready for Pickup'].includes(chosen.status)&&<><div className="mgmt-section-title"><h2>Container Handover</h2></div><p className="mgmt-sub">Filled bottles loaded: {chosen.bottlesLoaded}/{chosen.expectedBottles} · Customer empties: {chosen.emptiesCollected}</p>
    <div className="mgmt-field"><label>Quantity</label><input type="number" min="1" max="100" value={count} onChange={e=>setCount(e.target.value)}/></div>
    <div className="mgmt-field"><label>Return note (required only for returns)</label><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Container notes"/></div>
    <div className="delivery-actions"><button className="mgmt-btn secondary" disabled={chosen.bottlesLoaded>=chosen.expectedBottles} onClick={()=>bottles(chosen,'loaded')}><FiPackage/> Record Filled Load</button><button className="mgmt-btn secondary" onClick={()=>bottles(chosen,'empty')}><FiRefreshCcw/> Collect Empties</button><button className="mgmt-btn secondary" onClick={()=>bottles(chosen,'returned')}>Return to Station</button></div>
   </>}
   <p className="mgmt-demo">Prototype only. No real payment, delivery, remittance or inventory transaction occurs.</p>
  </div></div>}
 </>;
}
