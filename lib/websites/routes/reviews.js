import { NextResponse } from 'next/server';
import { serviceClient, rateLimited } from '@/lib/websites/server';

export const runtime = 'nodejs';

// Public: approved reviews only, newest first, with a running average.
export async function GET() {
  try {
    const db = serviceClient();
    const { data, error } = await db.from('reviews')
      .select('id, name, business, rating, message, created_at')
      .eq('status', 'approved').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    const count = data.length;
    const average = count ? data.reduce((s, r) => s + r.rating, 0) / count : 0;
    return NextResponse.json({ reviews: data, count, average }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not load reviews.' }, { status: 500 });
  }
}

// Public: submit a review. It waits for approval before it is shown.
export async function POST(req) {
  try {
    if (Number(req.headers.get('content-length') || 0) > 10_000) {
      return NextResponse.json({ error: 'That review is too large.' }, { status: 413 });
    }
    const body = await req.json();

    // Honeypot: real people never see this field. Pretend success so bots learn nothing.
    if (typeof body.website === 'string' && body.website.trim() !== '') return NextResponse.json({ ok: true });

    const name = String(body.name ?? '').trim();
    const business = String(body.business ?? '').trim();
    const message = String(body.message ?? '').trim();
    const rating = Number(body.rating);
    if (!name || name.length > 80) return NextResponse.json({ error: 'Please enter your name.' }, { status: 422 });
    if (business.length > 100) return NextResponse.json({ error: 'That business name is too long.' }, { status: 422 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Please choose a star rating.' }, { status: 422 });
    if (message.length < 10 || message.length > 1000) return NextResponse.json({ error: 'Please write between 10 and 1000 characters.' }, { status: 422 });

    const db = serviceClient();
    if (await rateLimited(db, req, 'review', 5, 60)) {
      return NextResponse.json({ error: 'You have sent a few reviews already. Please try again later.' }, { status: 429 });
    }
    const { error } = await db.from('reviews').insert({ name, business: business || null, rating, message });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
