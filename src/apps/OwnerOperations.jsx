import {useMemo,useState} from 'react';
import {FiBarChart2,FiUsers,FiDollarSign,FiCreditCard,FiSettings,FiShield,FiSave,FiClock,FiCheckCircle,FiActivity,FiPackage,FiTruck,FiClipboard,FiAlertTriangle} from 'react-icons/fi';
import {formatMoney} from '../data/managerDemo.js';
import EmployeeDirectory from './EmployeeDirectory.jsx';
import ProductCatalog from './ProductCatalog.jsx';
import ExpenseReport from './ExpenseReport.jsx';

// Only Owner-specific pages. POS, Orders, Delivery, Inventory and Payments reuse Manager pages.
function Title({eyebrow,title,description}){return <div className="mgmt-heading"><div className="overline">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>}
function Stat({title,value,Icon}){return <div className="mgmt-stat"><div className="mgmt-stat-top"><span>{title}</span><Icon size={17}/></div><strong>{value}</strong></div>}
const today=()=>new Date().toLocaleString('en-PH');
export default function OwnerOperations({page,go,orders,stock,trips,availability,onMessage,expenses,setExpenses}){
 const [settings,setSettings]=useState({deliveryFee:'0',lowStock:'15',hours:'Confirm operating hours with client'});
 const [draft,setDraft]=useState(settings);
 const [audit,setAudit]=useState([]);
 const [verification,setVerification]=useState([]);
 const [period,setPeriod]=useState('All');
 const [approvals,setApprovals]=useState([]);
 const [auditFilter,setAuditFilter]=useState('All');
 const record=description=>{setAudit(old=>[{id:Date.now()+'-'+old.length,description,time:today()},...old]);onMessage(description+' · Working in Progress: saved in this browser only.')};
 const paid=orders.filter(o=>o.paymentStatus==='Paid');
 const collected=paid.reduce((n,o)=>n+o.amount,0);
 const sales=orders.filter(o=>o.status!=='Cancelled').reduce((n,o)=>n+o.amount,0);
 const outstanding=orders.filter(o=>o.paymentStatus!=='Paid').reduce((n,o)=>n+o.amount,0);
 const remittance=trips.reduce((n,t)=>n+(t.remittance==='Awaiting Remittance'?t.collectedCash||0:0),0);
 const pendingElectronic=trips.filter(t=>t.paymentStatus==='Pending Verification'&&!verification.includes(t.id));
 const activity=orders.length+trips.length;
 const expenseTotal=expenses.filter(e=>e.active).reduce((n,e)=>n+e.amount,0);
 const action=(title,target)=><button className="mgmt-quick" onClick={()=>go(target)}>{title}</button>;
 const demo=<p className="mgmt-notice">Working in Progress: dashboard data and administrative changes are not yet connected to the shared database.</p>;
 return <>
 {page==='dashboard'&&<>
  <Title eyebrow="Executive overview" title="Owner Dashboard" description="Station-wide business performance, collections, inventory and activity."/>
  <div className="mgmt-stats"><Stat title="Gross Sales" value={formatMoney(sales)} Icon={FiBarChart2}/><Stat title="Verified Collected" value={formatMoney(collected)} Icon={FiDollarSign}/><Stat title="Unpaid / Unverified" value={formatMoney(outstanding)} Icon={FiClock}/><Stat title="Cash Pending Remittance" value={formatMoney(remittance)} Icon={FiCreditCard}/></div>
  <div className="mgmt-section-title"><h2>Owner Shortcuts</h2></div><div className="mgmt-grid">{action('Sales & Reports','reports')}{action('Payments','payments')}{action('Employee Access','employees')}{action('Products & Services','products')}</div>
  <div className="mgmt-section-title"><h2>Business Snapshot</h2></div><div className="mgmt-card">
   <div className="mgmt-row"><span className="mgmt-sub">Recorded orders</span><strong>{orders.length}</strong></div>
   <div className="mgmt-row"><span className="mgmt-sub">Active deliveries</span><strong>{trips.filter(t=>!['Delivered','Failed Delivery'].includes(t.status)).length}</strong></div>
   <div className="mgmt-row"><span className="mgmt-sub">Low stock items</span><strong>{stock.filter(s=>s.quantity<s.minimum).length}</strong></div>
   <div className="mgmt-row"><span className="mgmt-sub">Pending e-payment verification</span><strong>{pendingElectronic.length}</strong></div>
  </div>
  <div className="mgmt-section-title"><h2>Recent Transactions</h2><button className="mgmt-link" onClick={()=>go('orders')}>View Orders</button></div>
  <div className="mgmt-card">{orders.slice(0,4).map(o=><div className="mgmt-row" key={o.id}><div><div className="mgmt-row-title">{o.id} · {o.customer}</div><div className="mgmt-sub">{o.source} · {o.paymentStatus}</div></div><strong>{formatMoney(o.amount)}</strong></div>)}</div>{demo}
 </>}
 {page==='reports'&&<>
  <Title eyebrow="Business intelligence" title="Sales & Financial Reports" description="Separate billed sales, verified collection, unpaid orders and expenses."/>
  <div className="mgmt-controls">{['All','Today','This Week'].map(p=><button key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div>
  <div className="mgmt-stats"><Stat title="Gross Sales" value={formatMoney(sales)} Icon={FiBarChart2}/><Stat title="Verified Collected" value={formatMoney(collected)} Icon={FiDollarSign}/><Stat title="Outstanding" value={formatMoney(outstanding)} Icon={FiClock}/><Stat title="Expenses Recorded" value={formatMoney(expenseTotal)} Icon={FiCreditCard}/></div>
  <div className="mgmt-card"><strong>Estimated Margin</strong><p className="mgmt-sub">Verified collection minus recorded expenses, not actual net profit.</p><h2 style={{color:'#1b2f63',marginTop:10}}>{formatMoney(collected-expenseTotal)}</h2></div>
  <div className="mgmt-section-title"><h2>Sales by Source</h2></div><div className="mgmt-card">{['Online','Walk-in','Messenger','Phone'].map(source=><div className="mgmt-row" key={source}><span className="mgmt-sub">{source}</span><strong>{formatMoney(orders.filter(o=>o.source===source).reduce((n,o)=>n+o.amount,0))}</strong></div>)}</div>
  <ExpenseReport expenses={expenses} setExpenses={setExpenses} onEvent={record}/>
  <div className="mgmt-notice">Working in Progress: date filters and profit reporting require complete transaction dates and cost records in the database.</div>{demo}
 </>}
 {page==='employees'&&<EmployeeDirectory availability={availability} orders={orders} onEvent={record}/>}
  {page==='approvals'&&<>
  <Title eyebrow="Payment review" title="Payment Verification" description="Check submitted GCash/bank references and cash received from drivers."/>
  <div className="mgmt-notice">A reference number alone does not prove payment. Check the actual AquaBest account or physically count cash before acknowledging any transaction.</div>
  <div className="mgmt-section-title"><h2>GCash & Bank Transfers</h2></div>
  <div className="mgmt-card">{pendingElectronic.length?pendingElectronic.map(t=><div className="mgmt-row" key={t.id}><div><strong className="mgmt-row-title">{t.orderId} · {t.customer}</strong><p className="mgmt-sub">{t.paymentMethod} · {formatMoney(t.amount)} · Ref: {t.reference||'Missing'}</p><p className="mgmt-sub">Status: Pending verification</p></div><button className="mgmt-btn secondary" onClick={()=>{setVerification(old=>[...old,t.id]);record('Reviewed electronic payment proof for order '+t.orderId)}}>Mark Reviewed</button></div>):<div className="owner-empty"><FiCreditCard size={22}/><strong>No pending electronic payment proofs</strong><p>When a driver records a GCash or bank reference, it should appear here after the shared database is connected. Working in Progress: real payment verification is not connected.</p></div>}</div>
  <div className="mgmt-section-title"><h2>Cash Collected by Drivers</h2></div>
  <div className="mgmt-card">{trips.filter(t=>t.remittance==='Awaiting Remittance').length?trips.filter(t=>t.remittance==='Awaiting Remittance').map(t=><div className="mgmt-row" key={t.id}><div><strong className="mgmt-row-title">{t.orderId} · {t.driver}</strong><p className="mgmt-sub">{formatMoney(t.collectedCash||0)} collected · Pending handover</p></div><button className="mgmt-btn secondary" disabled={approvals.includes(t.id)} onClick={()=>{setApprovals(old=>[...old,t.id]);record('Reviewed pending cash remittance for order '+t.orderId)}}>{approvals.includes(t.id)?'Reviewed':'Mark Reviewed'}</button></div>):<div className="owner-empty"><FiDollarSign size={22}/><strong>No cash awaiting remittance</strong><p>Driver COD collections will be listed after delivery records synchronize with this workspace.</p></div>}</div>
  <div className="mgmt-notice">Mark Reviewed is a local checklist only. It does not set an order to Paid or acknowledge a real remittance. Production verification requires validated bank/GCash transactions, counting cash, and an immutable audit trail.</div>{demo}
 </>}
  {page==='products'&&<ProductCatalog onEvent={record}/>}
 {page==='settings'&&<>
  <Title eyebrow="Configuration" title="Business Settings" description="Operating information, delivery fees and other business rules."/>
  <div className="mgmt-card"><strong>Store Operating Rules</strong><div className="mgmt-formgrid">{[['deliveryFee','Delivery fee (₱)'],['lowStock','Low-stock threshold'],['hours','Operating hours']].map(([key,l])=><div className="mgmt-field" key={key}><label>{l}</label><input value={draft[key]} onChange={e=>setDraft(old=>({...old,[key]:e.target.value}))}/></div>)}</div><div className="owner-actions"><button className="mgmt-btn" onClick={()=>{setSettings({...draft});record('Updated business operating settings')}}><FiSave/> Save Settings</button><button className="mgmt-btn secondary" onClick={()=>go('products')}>Manage Products & Prices</button></div><p className="mgmt-sub">Saved delivery fee: {settings.deliveryFee}</p></div>{demo}
 </>}
 {page==='audit'&&<>
  <Title eyebrow="Change history" title="Audit & Activity Logs" description="Who changed employee, product, payment or business settings, and when."/>
  <div className="mgmt-stats"><Stat title="Owner Actions" value={audit.length} Icon={FiShield}/><Stat title="Recorded Operations" value={activity} Icon={FiActivity}/></div>
  <div className="mgmt-controls">{['All','Employees','Products','Expenses','Payments','Settings'].map(f=><button key={f} className={auditFilter===f?'active':''} onClick={()=>setAuditFilter(f)}>{f}</button>)}</div>
  <div className="mgmt-card">{audit.filter(e=>auditFilter==='All'||(auditFilter==='Employees'?/employee|profile|account|role/i.test(e.description):auditFilter==='Products'?/product/i.test(e.description):auditFilter==='Expenses'?/expense/i.test(e.description):auditFilter==='Payments'?/payment|remittance/i.test(e.description):/setting/i.test(e.description))).length?audit.filter(e=>auditFilter==='All'||(auditFilter==='Employees'?/employee|profile|account|role/i.test(e.description):auditFilter==='Products'?/product/i.test(e.description):auditFilter==='Expenses'?/expense/i.test(e.description):auditFilter==='Payments'?/payment|remittance/i.test(e.description):/setting/i.test(e.description))).map(e=><div className="mgmt-row" key={e.id}><div><strong className="mgmt-row-title">{e.description}</strong><p className="mgmt-sub">{e.time} · Owner</p></div><FiCheckCircle color="#244ea3"/></div>):<div className="owner-empty"><FiShield size={22}/><strong>No changes found</strong><p>Try adding a product, updating an employee or recording an expense to generate audit activity.</p></div>}</div>
  <div className="mgmt-notice">Working in Progress: audit entries must be stored server-side with employee identity and before/after values.</div>{demo}
 </>}
  {page==='more'&&<>
  <Title eyebrow="Owner access" title="All Modules" description="Operational views and business administration."/>
  <div className="mgmt-more">{[[FiPackage,'Products & Services','products'],[FiClipboard,'Orders','orders'],[FiTruck,'Delivery','delivery'],[FiPackage,'Inventory','inventory'],[FiCreditCard,'Payments','payments'],[FiUsers,'Employees','employees'],[FiSettings,'Settings','settings'],[FiShield,'Audit Logs','audit'],[FiAlertTriangle,'Verification','approvals']].map(([Icon,title,target])=><button key={target} onClick={()=>go(target)}><Icon/><strong>{title}</strong><small>Open {title.toLowerCase()}</small></button>)}</div>{demo}
 </>}
 </>;
}
