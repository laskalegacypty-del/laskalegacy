import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/websites/server';

export const runtime = 'nodejs';

// Lean list for the Admin page. signature_data is left out; the detail route returns it.
export async function GET(req) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  const { data, error } = await owner.db.from('training_agreements')
    .select('id, created_at, status, owner_name, owner_phone, horse_name, start_date, end_date, payment_option')
    .order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: 'Could not load training agreements.' }, { status: 500 });
  return NextResponse.json({ agreements: data });
}
