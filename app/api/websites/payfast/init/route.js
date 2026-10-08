import { NextResponse } from 'next/server';
import { serviceClient, buildPayfastFields, UUID_RE } from '@/lib/websites/server';

export const runtime = 'nodejs';

// Rebuilds the signed PayFast form for an unpaid submission (e.g. the client returns later).
// Only exposes data the caller already typed in themselves; the submission id is an unguessable UUID.
export async function POST(req) {
  try {
    const { id } = await req.json();
    if (!UUID_RE.test(id || '')) return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
    const db = serviceClient();
    const { data, error } = await db.from('website_submissions')
      .select('client_name, client_email, payment_status, answers').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'We could not find that submission.' }, { status: 404 });
    if (data.payment_status === 'paid') return NextResponse.json({ ok: true, paid: true });
    return NextResponse.json({
      ok: true, paid: false,
      pay: buildPayfastFields({ id, name: data.client_name, email: data.client_email, businessName: data.answers.about.businessName }),
    });
  } catch (err) {
    console.error('[websites/payfast/init]', err);
    return NextResponse.json({ error: 'Could not load the payment. Please try again.' }, { status: 500 });
  }
}
