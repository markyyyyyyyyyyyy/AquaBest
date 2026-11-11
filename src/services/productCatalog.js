import { supabase, supabaseConfigured } from './supabaseClient.js';
import { bottleOptions } from '../apps/Component_Customer/orderData.js';

function mapProduct(row) {
  const imageFallback = bottleOptions.find((item) =>
    row.name.toLowerCase().includes(item.name.toLowerCase()) &&
    row.name.toLowerCase().includes(item.shape.toLowerCase().split(' ')[0]),
  ) || bottleOptions.find((item) => row.name.toLowerCase().includes(item.name.toLowerCase()));
  const channels = row.channels || [];
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description || '',
    price: Number(row.price_cents) / 100,
    active: row.active,
    image_url: row.image_url,
    image: row.image_url || imageFallback?.image || '',
    availability: channels.includes('online') && channels.includes('walk_in')
      ? 'Walk-in & Online'
      : channels.includes('online') ? 'Online Only' : 'Walk-in Only',
    channels,
  };
}

export async function loadCustomerProducts() {
  if (!supabaseConfigured) throw new Error('Product catalog is not configured yet.');
  const { data, error } = await supabase
    .from('products')
    .select('id,name,description,category,price_cents,active,image_url,channels')
    .eq('active', true)
    .contains('channels', ['online'])
    .order('name');
  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function loadManagementProducts() {
  if (!supabaseConfigured) throw new Error('Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  const { data, error } = await supabase
    .from('products')
    .select('id,name,description,category,price_cents,active,image_url,channels')
    .order('name');
  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function saveCatalogProduct(product, imageFile) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  let imageUrl = product.image_url || null;
  if (imageFile) {
    const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
    if (uploadError) throw uploadError;
    imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  }

  const payload = {
    name: product.name.trim(),
    description: product.description?.trim() || null,
    category: product.category,
    price_cents: Math.round(Number(product.price) * 100),
    active: Boolean(product.active),
    image_url: imageUrl,
    channels: product.availability === 'Walk-in & Online'
      ? ['walk_in', 'online']
      : product.availability === 'Online Only' ? ['online'] : ['walk_in'],
    updated_at: new Date().toISOString(),
  };

  let query = supabase.from('products');
  if (product.id) query = query.update(payload).eq('id', product.id);
  else query = query.insert(payload);
  const { data, error } = await query
    .select('id,name,description,category,price_cents,active,image_url,channels')
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function setCatalogProductActive(id, active) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('products')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,name,description,category,price_cents,active,image_url,channels')
    .single();
  if (error) throw error;
  return mapProduct(data);
}
