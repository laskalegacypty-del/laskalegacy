import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars — check .env.local');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// ─── Storage helpers ───

export async function uploadImage(bucket, file) {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function deleteImage(bucket, url) {
  if (!url) return;
  const path = url.split(`/storage/v1/object/public/${bucket}/`)[1];
  if (path) {
    await supabase.storage.from(bucket).remove([path]);
  }
}

// ─── Products ───

export async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

export async function saveProduct(product) {
  if (product.id) {
    const { data, error } = await supabase.from('products').update({
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      images: product.images || [],
      featured: product.featured,
      updated_at: new Date().toISOString(),
    }).eq('id', product.id).select().single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase.from('products').insert({
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      images: product.images || [],
      featured: product.featured,
    }).select().single();
    if (error) throw error;
    return data;
  }
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ─── Messages ───

export async function loadMessages() {
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

export async function saveMessage(msg) {
  const { data, error } = await supabase.from('messages').insert({
    name: msg.name,
    email: msg.email,
    phone: msg.phone || '',
    message: msg.message,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMessage(id) {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw error;
}

// ─── Gallery ───

export async function loadGallery() {
  const { data, error } = await supabase.from('gallery').select('*').order('sort_order', { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

export async function addGalleryItems(items) {
  const { data, error } = await supabase.from('gallery').insert(items).select();
  if (error) throw error;
  return data;
}

export async function updateGalleryItem(id, updates) {
  const { error } = await supabase.from('gallery').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteGalleryItem(id) {
  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderGallery(items) {
  // Update sort_order for each item
  for (let i = 0; i < items.length; i++) {
    await supabase.from('gallery').update({ sort_order: i }).eq('id', items[i].id);
  }
}

// ─── Orders ───

export async function loadOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

export async function createOrder(order) {
  // Get next invoice number
  const { data: invoiceData } = await supabase.rpc('get_next_invoice_number');
  const invoiceNumber = invoiceData || `LL-${Date.now().toString().slice(-4)}`;

  const { data, error } = await supabase.from('orders').insert({
    invoice_number: invoiceNumber,
    status: 'new',
    client: order.client,
    items: order.items,
    courier: order.courier,
    courier_fee: order.courierFee,
    discount: 0,
    total: order.total,
    notes: order.notes || '',
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateOrder(order) {
  const { data, error } = await supabase.from('orders').update({
    status: order.status,
    items: order.items,
    courier: order.courier,
    courier_fee: order.courier_fee ?? order.courierFee,
    discount: order.discount,
    total: order.total,
    notes: order.notes,
    updated_at: new Date().toISOString(),
  }).eq('id', order.id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// ─── Blog ───

export async function loadBlogPosts(publishedOnly = false) {
  let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
  if (publishedOnly) query = query.eq('published', true);
  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  return data;
}

export async function saveBlogPost(post) {
  if (post.id) {
    const { data, error } = await supabase.from('blog_posts').update({
      title: post.title,
      excerpt: post.excerpt || '',
      body: post.body || '',
      cover_image: post.cover_image || post.coverImage || '',
      images: post.images || [],
      videos: post.videos || [],
      published: post.published ?? true,
      updated_at: new Date().toISOString(),
    }).eq('id', post.id).select().single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase.from('blog_posts').insert({
      title: post.title,
      excerpt: post.excerpt || '',
      body: post.body || '',
      cover_image: post.cover_image || post.coverImage || '',
      images: post.images || [],
      videos: post.videos || [],
      published: post.published ?? true,
    }).select().single();
    if (error) throw error;
    return data;
  }
}

export async function deleteBlogPost(id) {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw error;
}
