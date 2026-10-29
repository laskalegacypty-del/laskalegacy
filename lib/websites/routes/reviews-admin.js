import { NextResponse } from 'next/server';
import { requireAdmin, UUID_RE } from '@/lib/websites/server';

export const runtime = 'nodejs';

const STATUSES = ['pending', 'approved', 'hidden'];

// Admin: every review, any status. Also used for /api/websites/reviews/admin/<id> (PATCH, DELETE).
export async function GET(req) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  const { data, error } = await owner.db.from('reviews').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: 'Could not load reviews.' }, { status: 500 });
  return NextResponse.json({ reviews: data });
}

export async function PATCH(req, { params }) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  if (!UUID_RE.test(params.id || '')) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const { status } = await req.json();
  if (!STATUSES.includes(status)) return NextResponse.json({ error: 'Bad status.' }, { status: 400 });
  const { error } = await owner.db.from('reviews').update({ status }).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not save that change.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  if (!UUID_RE.test(params.id || '')) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const { error } = await owner.db.from('reviews').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not delete that review.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
