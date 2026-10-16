import { NextResponse } from 'next/server';
import { requireAdmin, UUID_RE } from '@/lib/websites/server';

export const runtime = 'nodejs';

const STATUSES = ['signed', 'approved', 'declined'];

export async function GET(req, { params }) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const { data, error } = await owner.db.from('training_agreements').select('*').eq('id', params.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load that agreement.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ agreement: data });
}

// Approve, decline, or send back to "signed", plus private trainer notes.
export async function PATCH(req, { params }) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const body = await req.json();
  const patch = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Bad status.' }, { status: 400 });
    patch.status = body.status;
    patch.reviewed_at = body.status === 'signed' ? null : new Date().toISOString();
  }
  if (body.trainer_notes !== undefined) patch.trainer_notes = String(body.trainer_notes).slice(0, 4000);
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  const { error } = await owner.db.from('training_agreements').update(patch).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not save that change.' }, { status: 500 });
  return NextResponse.json({ ok: true, reviewed_at: patch.reviewed_at ?? undefined });
}

export async function DELETE(req, { params }) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const { error } = await owner.db.from('training_agreements').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not delete that agreement.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
