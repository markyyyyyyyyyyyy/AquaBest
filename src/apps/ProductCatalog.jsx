import { useEffect, useRef, useState } from 'react';
import { FiPlus, FiEdit2, FiPackage, FiImage, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { formatMoney } from '../data/managerDemo.js';
import { loadManagementProducts, saveCatalogProduct, setCatalogProductActive } from '../services/productCatalog.js';

const empty = { name: '', category: 'Water Refill', description: '', price: '', active: true, image: '', image_url: null, imageFile: null, availability: 'Walk-in & Online' };
function friendlyError(error) {
  const message = error?.message || 'Could not save the product.';
  if (/products|schema cache|does not exist/i.test(message)) return 'Working in Progress: run backend/schema/products-catalog-supabase.sql in Supabase SQL Editor, then reload this page.';
  if (/row-level security|permission|not allowed/i.test(message)) return 'Your account is not authorized to manage products. Sign in with an active owner account.';
  return message;
}

export default function ProductCatalog({ onEvent }) {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const refresh = async () => {
    setLoading(true);
    setError('');
    try { setProducts(await loadManagementProducts()); }
    catch (err) { setError(friendlyError(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const start = (product = null) => {
    setEditing(product?.id || null);
    setForm(product ? { ...product, imageFile: null } : empty);
    setError('');
    setOpen(true);
  };
  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Use JPG, PNG or WebP under 2 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, image: String(reader.result), imageFile: file }));
    reader.readAsDataURL(file);
  };
  const save = async () => {
    const amount = Number(form.price);
    if (!form.name.trim() || form.price === '' || !Number.isFinite(amount) || amount < 0) {
      setError('Product needs a name and valid nonnegative price.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await saveCatalogProduct(form, form.imageFile);
      setProducts((current) => editing ? current.map((product) => product.id === editing ? saved : product) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      onEvent?.(`${editing ? 'Updated' : 'Added'} product: ${saved.name}`);
      setOpen(false);
      setEditing(null);
      setForm(empty);
    } catch (err) { setError(friendlyError(err)); }
    finally { setSaving(false); }
  };
  const toggle = async (product) => {
    setError('');
    try {
      const updated = await setCatalogProductActive(product.id, !product.active);
      setProducts((current) => current.map((item) => item.id === product.id ? updated : item));
      onEvent?.(`${updated.active ? 'Activated' : 'Deactivated'} product: ${updated.name}`);
    } catch (err) { setError(friendlyError(err)); }
  };

  return <>
    <div className="mgmt-heading"><div className="overline">Product catalog</div><h1>Products & Services</h1><p>Products saved here appear in customer ordering when marked active and available online.</p></div>
    <div className="owner-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="mgmt-sub">{products.filter((product) => product.active).length} active · {products.length} products</span>
      <div style={{ display: 'flex', gap: 8 }}><button className="mgmt-btn secondary" onClick={refresh} disabled={loading}><FiRefreshCw/> Refresh</button><button className="mgmt-btn" onClick={() => start()}><FiPlus/> Add Product</button></div>
    </div>
    {error && <div className="mgmt-notice" role="alert">{error}</div>}
    {open && <div className="mgmt-card owner-form">
      <div className="mgmt-section-title"><h2>{editing ? 'Edit Product' : 'New Product'}</h2><button className="mgmt-link" onClick={() => setOpen(false)}><FiX/> Close</button></div>
      <div className="owner-product-upload"><div className="owner-product-image">{form.image ? <img src={form.image} alt="Product preview"/> : <FiImage size={25}/>}</div><div><button className="mgmt-btn secondary" onClick={() => input.current?.click()}>Upload Image</button><p className="mgmt-sub">JPG, PNG, WebP · Max 2 MB</p><input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} style={{ display: 'none' }}/></div></div>
      <div className="mgmt-formgrid">
        <div className="mgmt-field"><label>Product Name</label><input value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="e.g., 5-Gallon Refill"/></div>
        <div className="mgmt-field"><label>Category</label><select value={form.category} onChange={(event) => set('category', event.target.value)}><option>Water Refill</option><option>Container</option><option>Bundle</option><option>Other</option></select></div>
        <div className="mgmt-field"><label>Price (₱)</label><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => set('price', event.target.value)}/></div>
        <div className="mgmt-field"><label>Available Through</label><select value={form.availability} onChange={(event) => set('availability', event.target.value)}><option>Walk-in & Online</option><option>Walk-in Only</option><option>Online Only</option></select></div>
        <div className="mgmt-field owner-span"><label>Description</label><textarea value={form.description} onChange={(event) => set('description', event.target.value)} rows="3" placeholder="Description shown in product catalog"/></div>
      </div>
      <div className="owner-actions"><button className="mgmt-btn" onClick={save} disabled={saving}><FiCheck/> {saving ? 'Saving…' : 'Save Product'}</button><button className="mgmt-btn secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</button></div>
    </div>}
    {loading ? <div className="mgmt-card">Loading products…</div> : !products.length ? <div className="mgmt-card">No products in the catalog yet.</div> : <div className="owner-product-list">{products.map((product) => <article className="mgmt-card owner-product" key={product.id}>
      <div className="owner-product-image">{product.image ? <img src={product.image} alt={product.name}/> : <FiPackage size={25}/>}</div>
      <div className="owner-product-info"><strong>{product.name}</strong><p className="mgmt-sub">{product.category} · {product.availability}</p><strong>{formatMoney(product.price)}</strong><span className={'owner-state '+(product.active ? 'active' : '')}>{product.active ? 'Active' : 'Inactive'}</span></div>
      <div className="owner-product-actions"><button className="mgmt-btn secondary" onClick={() => start(product)}><FiEdit2/> Edit</button><button className="mgmt-btn secondary" onClick={() => toggle(product)}>{product.active ? 'Deactivate' : 'Activate'}</button></div>
    </article>)}</div>}
    <div className="mgmt-notice">Products are saved to the shared catalog. Active products marked “Online” are shown to customers.</div>
  </>;
}
