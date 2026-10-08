import { NextResponse } from 'next/server';
import { PRICE_ZAR } from '@/lib/websites/schema';
import { serviceClient, payfastConfig, payfastSignature, UUID_RE } from '@/lib/websites/server';

export const runtime = 'nodejs';

// PayFast ITN (Instant Transaction Notification) webhook.
// Marks a submission as paid ONLY after: signature matches, amount matches,
// and PayFast's own server confirms the notification is genuine.
export async function POST(req) {
  const cfg = payfastConfig();
  try {
    const raw = await req.text();
    const pairs = [...new URLSearchParams(raw).entries()];
    const data = Object.fromEntries(pairs);

    if (payfastSignature(pairs, cfg.passphrase) !== data.signature) {
      console.error('[payfast/notify] bad signature', data.m_payment_id);
      return new NextResponse('Bad signature', { status: 400 });
    }

    // Ask PayFast to confirm it really sent this (guards against replayed or forged posts).
    const confirm = await fetch(cfg.validateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: raw.replace(/&?signature=[^&]*/, '').replace(/^&/, ''),
    });
    if ((await confirm.text()).trim() !== 'VALID') {
      console.error('[payfast/notify] PayFast did not validate', data.m_payment_id);
      return new NextResponse('Not validated', { status: 400 });
    }

    const id = data.m_payment_id;
    if (!UUID_RE.test(id || '')) return new NextResponse('Bad id', { status: 400 });
    if (Number(data.amount_gross) !== PRICE_ZAR) {
      console.error('[payfast/notify] amount mismatch', id, data.amount_gross);
      return new NextResponse('Bad amount', { status: 400 });
    }

    if (data.payment_status === 'COMPLETE') {
      const db = serviceClient();
      const { error } = await db.from('website_submissions')
        .update({ payment_status: 'paid', paid_at: new Date().toISOString(), payfast_payment_id: data.pf_payment_id || null })
        .eq('id', id);
      if (error) throw error;
    }
    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('[payfast/notify]', err);
    return new NextResponse('Error', { status: 500 }); // PayFast retries on non-200
  }
}
