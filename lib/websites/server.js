// Server-only helpers for the Website Intake feature. Never import this from a client component.
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { MAX_FILE_BYTES, MIME_EXT, PRICE_ZAR } from './schema';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://laskalegacy.co.za').replace(/\/$/, '');

export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server is missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// ─── Request helpers ───

export function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

const hashIp = (ip) => crypto.createHash('sha256').update(`laska-websites:${ip}`).digest('hex');

// Returns true if the caller is over the limit. Otherwise records the hit.
export async function rateLimited(db, req, kind, max, windowMinutes) {
  const ip_hash = hashIp(clientIp(req));
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count, error } = await db
    .from('website_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ip_hash).eq('kind', kind).gte('created_at', since);
  if (error) throw error;
  if ((count || 0) >= max) return true;
  await db.from('website_rate_limits').insert({ ip_hash, kind });
  return false;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Image sniffing: trust the bytes, not the filename or declared type ───

export function sniffImage(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG') return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  const head = buf.toString('utf8', 0, Math.min(buf.length, 2048)).trimStart().toLowerCase();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'image/svg+xml';
  return null;
}

// SVG can carry scripts. Reject anything active rather than trying to sanitise it.
export function svgIsSafe(buf) {
  const s = buf.toString('utf8').toLowerCase();
  return !(/<script/.test(s) || /\son[a-z]+\s*=/.test(s) || /javascript:/.test(s) || /<foreignobject/.test(s) || /<!entity/.test(s));
}

export function checkImageBuffer(buf, allowedTypes) {
  if (buf.length > MAX_FILE_BYTES) return { error: 'That file is bigger than 5 MB.' };
  const type = sniffImage(buf);
  if (!type || !allowedTypes.includes(type)) return { error: 'Please upload an image in one of the accepted formats.' };
  if (type === 'image/svg+xml' && !svgIsSafe(buf)) return { error: 'That SVG contains scripts and cannot be used. Please export a plain SVG or use a PNG.' };
  return { type, ext: MIME_EXT[type] };
}

// ─── Email (Resend REST API, no SDK needed) ───

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function sendEmail({ to, subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[websites] RESEND_API_KEY not set, skipped email "${subject}" to ${to}`);
    return { skipped: true };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Laska Legacy Websites <onboarding@resend.dev>',
      to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return { ok: true };
}

export function ownerContact() {
  return {
    email: process.env.OWNER_CONTACT_EMAIL || 'laskalegacypty@gmail.com',
    whatsapp: process.env.OWNER_CONTACT_WHATSAPP || '072 585 8288',
  };
}

export function clientConfirmationEmail({ name, businessName, id }) {
  const o = ownerContact();
  const turnaround = process.env.WEBSITE_TURNAROUND || 'within 5 working days of your payment';
  return {
    subject: `We got your website details, ${businessName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
<h2 style="color:#0097b2">Thanks ${esc(name.split(' ')[0])}, we have your details</h2>
<p>Your website brief for <strong>${esc(businessName)}</strong> is in.</p>
<h3>What happens next</h3>
<ol>
<li><strong>Payment.</strong> Pay the once off R${PRICE_ZAR} to start. We only begin work once it is paid. If you closed the payment page, reply to this email and we will send you a fresh link.</li>
<li><strong>We build.</strong> Your one page website is ready ${esc(turnaround)}.</li>
<li><strong>You review.</strong> You get one round of changes included. Extra work is quoted separately.</li>
<li><strong>Go live.</strong> After you approve, we publish your site.</li>
</ol>
<p>Reference: <code>${esc(id.slice(0, 8))}</code></p>
<p>Questions? Email <a href="mailto:${esc(o.email)}">${esc(o.email)}</a> or WhatsApp ${esc(o.whatsapp)}.</p>
<p style="color:#6b7280;font-size:12px">Laska Legacy Websites</p></div>`,
  };
}

export function ownerNotificationEmail({ clientName, businessName, id }) {
  const link = `${SITE_URL}/admin/submissions/${id}`;
  return {
    subject: `New website brief: ${businessName}`,
    html: `<div style="font-family:Arial,sans-serif"><p><strong>${esc(clientName)}</strong> submitted a brief for <strong>${esc(businessName)}</strong>. Payment status starts as unpaid.</p>
<p><a href="${esc(link)}">Open the submission</a></p></div>`,
  };
}

// ─── PayFast ───

export function payfastConfig() {
  const sandbox = process.env.PAYFAST_SANDBOX !== 'false';
  // TODO(live): set PAYFAST_SANDBOX=false and real PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY / PAYFAST_PASSPHRASE in Vercel.
  // The fallbacks below are PayFast's public sandbox test merchant, usable only on sandbox.payfast.co.za.
  return {
    sandbox,
    processUrl: sandbox ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process',
    validateUrl: sandbox ? 'https://sandbox.payfast.co.za/eng/query/validate' : 'https://www.payfast.co.za/eng/query/validate',
    merchantId: process.env.PAYFAST_MERCHANT_ID || (sandbox ? '10000100' : ''),
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || (sandbox ? '46f0cd694581a' : ''),
    passphrase: process.env.PAYFAST_PASSPHRASE ?? '',
  };
}

const pfEncode = (v) => encodeURIComponent(String(v).trim()).replace(/%20/g, '+');

// PayFast signs fields in the order they are sent (NOT alphabetical) and skips the signature field itself.
export function payfastSignature(pairs, passphrase) {
  let str = pairs
    .filter(([k, v]) => k !== 'signature' && v !== '' && v != null)
    .map(([k, v]) => `${k}=${pfEncode(v)}`)
    .join('&');
  if (passphrase) str += `&passphrase=${pfEncode(passphrase)}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

export function buildPayfastFields({ id, name, email, businessName }) {
  const cfg = payfastConfig();
  const [first, ...rest] = name.trim().split(/\s+/);
  const pairs = [
    ['merchant_id', cfg.merchantId],
    ['merchant_key', cfg.merchantKey],
    ['return_url', `${SITE_URL}/websites?paid=${id}`],
    ['cancel_url', `${SITE_URL}/websites?cancelled=${id}`],
    ['notify_url', `${SITE_URL}/api/websites/payfast/notify`],
    ['name_first', first],
    ['name_last', rest.join(' ')],
    ['email_address', email],
    ['m_payment_id', id],
    ['amount', PRICE_ZAR.toFixed(2)],
    ['item_name', `One page website: ${businessName}`.slice(0, 100)],
  ];
  pairs.push(['signature', payfastSignature(pairs, cfg.passphrase)]);
  return { action: cfg.processUrl, sandbox: cfg.sandbox, fields: pairs.filter(([, v]) => v !== '' && v != null) };
}

// ─── Admin auth ───
// Matches the shop admin: one shared password, sent as a header by the Admin page and checked here.
// NOTE: the shop admin password is also in the browser bundle, so this is only as private as the shop admin itself.
export function requireAdmin(req) {
  const expected = process.env.WEBSITE_ADMIN_PASSWORD || '';
  const given = req.headers.get('x-admin-password') || '';
  if (!expected || !given) return null;
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { db: serviceClient() };
}
