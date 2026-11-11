import {useState} from 'react';
import {FiPlus,FiEdit2,FiCheck,FiX,FiFileText} from 'react-icons/fi';
import {formatMoney} from '../data/managerDemo.js';
const categories=['Fuel','Electricity','Supplies','Maintenance','Wages','Other'];
export default function ExpenseReport({expenses,setExpenses,onEvent}){
 const [open,setOpen]=useState(false);
 const [editing,setEditing]=useState(null);
 const [form,setForm]=useState({category:'Fuel',description:'',amount:'',date:new Date().toISOString().slice(0,10)});
 const total=expenses.filter(x=>x.active).reduce((n,x)=>n+x.amount,0);
 const edit=e=>{setEditing(e.id);setForm({category:e.category,description:e.description,amount:String(e.amount),date:e.date});setOpen(true)};
 const save=()=>{
  const amount=Number(form.amount);
  if(!form.description.trim()||!Number.isFinite(amount)||amount<=0||!form.date){onEvent('Fill in description, date and a positive amount.');return}
  if(editing){setExpenses(old=>old.map(x=>x.id===editing?{...x,...form,amount}:x));onEvent('Edited expense: '+form.description)}
  else {setExpenses(old=>[{...form,id:'EXP-'+Date.now(),amount,active:true},...old]);onEvent('Recorded expense: '+form.description)}
  setOpen(false);setEditing(null);setForm({category:'Fuel',description:'',amount:'',date:new Date().toISOString().slice(0,10)});
 };
 const change=(key,v)=>setForm(old=>({...old,[key]:v}));
 return <section className="expense-report" aria-label="Expense report">
  <div className="mgmt-section-title"><h2>Expenses</h2><button className="mgmt-link" onClick={()=>{setEditing(null);setOpen(!open)}}><FiPlus/> {open?'Close':'Add Expense'}</button></div>
  <div className="mgmt-card">
   <div className="mgmt-row"><strong>Recorded Expenses</strong><strong>{formatMoney(total)}</strong></div>
   <p className="mgmt-sub">Fuel, utilities, supplies and other station expenses. Entries are browser-only and included in reporting, not counted as sales.</p>
   {open&&<div className="owner-form" style={{marginTop:14}}>
    <div className="mgmt-formgrid">
     <div className="mgmt-field"><label>Category</label><select value={form.category} onChange={e=>change('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
     <div className="mgmt-field"><label>Date</label><input type="date" value={form.date} onChange={e=>change('date',e.target.value)}/></div>
     <div className="mgmt-field"><label>Description</label><input value={form.description} onChange={e=>change('description',e.target.value)} placeholder="e.g., Delivery fuel"/></div>
     <div className="mgmt-field"><label>Amount (₱)</label><input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>change('amount',e.target.value)}/></div>
    </div>
    <div className="owner-actions"><button className="mgmt-btn" onClick={save}><FiCheck/> {editing?'Save Changes':'Save Expense'}</button><button className="mgmt-btn secondary" onClick={()=>{setOpen(false);setEditing(null)}}><FiX/> Cancel</button></div>
   </div>}
   {expenses.length?expenses.map(e=><div className="mgmt-row" key={e.id}>
    <div><strong className="mgmt-row-title">{e.description}</strong><p className="mgmt-sub">{e.category} · {e.date} · {e.active?'Recorded':'Voided'}</p></div>
    <div className="owner-row-actions"><strong>{formatMoney(e.amount)}</strong>{e.active&&<><button className="mgmt-link" onClick={()=>edit(e)} aria-label={'Edit '+e.description}><FiEdit2/></button><button className="mgmt-link" onClick={()=>{setExpenses(old=>old.map(x=>x.id===e.id?{...x,active:false}:x));onEvent('Voided expense: '+e.description)}}>Void</button></>}</div>
   </div>):<div className="owner-empty"><FiFileText/><p>No expenses recorded yet.</p></div>}
  </div>
 </section>;
}
