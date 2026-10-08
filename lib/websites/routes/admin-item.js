import { NextResponse } from 'next/server';
import { requireAdmin, UUID_RE } from '@/lib/websites/server';

export const runtime = 'nodejs';

const STATUSES = ['new', 'in_progress', 'awaiting_approval', 'live'];
const PAYMENTS = ['unpaid', 'paid'];

export async function GET(req, { params }) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const { data, error } = await owner.db.from('website_submissions').select('*').eq('id', params.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load that submission.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ submission: data });
}

// Owner can change the workflow status, or mark paid by hand (e.g. EFT).
export async function PATCH(req, { params }) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const body = await req.json();
  const patch = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Bad status.' }, { status: 400 });
    patch.status = body.status;
  }
  if (body.payment_status !== undefined) {
    if (!PAYMENTS.includes(body.payment_status)) return NextResponse.json({ error: 'Bad payment status.' }, { status: 400 });
    patch.payment_status = body.payment_status;
    patch.paid_at = body.payment_status === 'paid' ? new Date().toISOString() : null;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  const { error } = await owner.db.from('website_submissions').update(patch).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not save that change.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Permanently removes a submission and its uploaded files. The Admin page asks for confirmation first.
export async function DELETE(req, { params }) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Bad id.' }, { status: 400 });
  const { data: files } = await owner.db.storage.from('website-assets').list(params.id);
  if (files?.length) await owner.db.storage.from('website-assets').remove(files.map((f) => `${params.id}/${f.name}`));
  const { error } = await owner.db.from('website_submissions').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not delete that submission.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
