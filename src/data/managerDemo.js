// Prototype fixture data only. Prices are illustrative, NOT AquaBest-approved.
export const DEMO_PRICES = {round5:35,slim25:20,slim5:35};
export const DEMO_PRODUCTS = [
  {id:'round5',label:'5 Gallons',shape:'Round Container'},
  {id:'slim25',label:'2.5 Gallons',shape:'Slim Container'},
  {id:'slim5',label:'5 Gallons',shape:'Slim Container'}
];
export const INITIAL_ORDERS = [];
export const INITIAL_STOCK = [];
export const formatMoney = amount => '₱'+Number(amount||0).toLocaleString('en-PH',{maximumFractionDigits:2});
export const orderSummary = items => (items||[]).map(({sizeId,quantity})=>{
 const item=DEMO_PRODUCTS.find(p=>p.id===sizeId);
 return quantity+' × '+(item?.label||sizeId)+' '+(item?.shape||'');
}).join(' • ');
