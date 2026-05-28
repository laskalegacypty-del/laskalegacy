import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars — check .env.local');
}

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('example.supabase.co') &&
    supabaseAnonKey !== 'public-anon-key'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'public-anon-key'
);

// ─── Storage helpers ───

const EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
};

function fileExt(file) {
  const name = file.name || '';
  const i = name.lastIndexOf('.');
  if (i <= 0 || i === name.length - 1) return '';
  return name.slice(i + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** True if the file is an image by MIME or by a known image extension (some mobile browsers omit type). */
export function isImageFile(file) {
  if (file.type && file.type.startsWith('image/')) return true;
  const ext = fileExt(file);
  return !!EXT_TO_MIME[ext];
}

function resolveUploadType(file) {
  if (file.type && file.type.startsWith('image/')) {
    const ext = fileExt(file);
    const safeExt = ext && EXT_TO_MIME[ext] ? ext : mimeToExt(file.type);
    return { contentType: file.type, safeExt };
  }
  const ext = fileExt(file);
  if (ext && EXT_TO_MIME[ext]) {
    return { contentType: EXT_TO_MIME[ext], safeExt: ext };
  }
  return { contentType: 'image/jpeg', safeExt: 'jpg' };
}

function mimeToExt(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
  };
  return map[mime] || 'jpg';
}

export async function uploadImage(bucket, file) {
  const { contentType, safeExt } = resolveUploadType(file);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${safeExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType });

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
      subcategory: product.subcategory || '',
      price: product.price,
      description: product.description,
      images: product.images || [],
      image_labels: product.image_labels || product.imageLabels || [],
      sizes: product.sizes || [],
      featured: product.featured,
      updated_at: new Date().toISOString(),
    }).eq('id', product.id).select().single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase.from('products').insert({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory || '',
      price: product.price,
      description: product.description,
      images: product.images || [],
      image_labels: product.image_labels || product.imageLabels || [],
      sizes: product.sizes || [],
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

// ─── Horses for Sale ───

function normalizeHorse(payload) {
  return {
    name: payload.name || '',
    breed: payload.breed || '',
    sex: payload.sex || '',
    age: Number(payload.age) || 0,
    height_hh: Number(payload.height_hh ?? payload.heightHh) || 0,
    color: payload.color || '',
    price: Number(payload.price) || 0,
    price_label: payload.price_label || payload.priceLabel || '',
    location: payload.location || '',
    province: payload.province || '',
    vaccinations: payload.vaccinations || '',
    ahs_up_to_date: !!payload.ahs_up_to_date,
    flu_up_to_date: !!payload.flu_up_to_date,
    hooves_up_to_date: !!payload.hooves_up_to_date,
    teeth_up_to_date: !!payload.teeth_up_to_date,
    deworming_up_to_date: !!payload.deworming_up_to_date,
    passport: !!payload.passport,
    passport_details: payload.passport_details || payload.passportDetails || '',
    registration: payload.registration || '',
    registered: !!payload.registered,
    microchipped: !!payload.microchipped,
    rider_level: payload.rider_level || payload.riderLevel || '',
    disciplines: Array.isArray(payload.disciplines) ? payload.disciplines : [],
    experience: payload.experience || '',
    temperament: payload.temperament || '',
    health_notes: payload.health_notes || payload.healthNotes || '',
    description: payload.description || '',
    images: Array.isArray(payload.images) ? payload.images : [],
    videos: Array.isArray(payload.videos) ? payload.videos : [],
    status: payload.status || 'available',
    featured: !!payload.featured,
    contact_name: payload.contact_name || payload.contactName || '',
    contact_email: payload.contact_email || payload.contactEmail || '',
    contact_phone: payload.contact_phone || payload.contactPhone || '',
    contact_name_2: payload.contact_name_2 || payload.contactName2 || '',
    contact_email_2: payload.contact_email_2 || payload.contactEmail2 || '',
    contact_phone_2: payload.contact_phone_2 || payload.contactPhone2 || '',
  };
}

export async function loadHorses() {
  const { data, error } = await supabase
    .from('horses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

export async function saveHorse(horse) {
  const payload = normalizeHorse(horse);
  if (horse.id) {
    const { data, error } = await supabase
      .from('horses')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', horse.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('horses')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHorse(id) {
  const { error } = await supabase.from('horses').delete().eq('id', id);
  if (error) throw error;
}
