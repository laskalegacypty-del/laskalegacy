import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/websites/server';

export const runtime = 'nodejs';

export async function GET(req) {
  const owner = requireAdmin(req);
  if (!owner) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  const { data, error } = await owner.db.from('website_submissions')
    .select('id, created_at, status, client_name, client_email, payment_status, answers->about->>businessName')
    .order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: 'Could not load submissions.' }, { status: 500 });
  return NextResponse.json({ submissions: data });
}
