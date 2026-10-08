import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { BUCKET, MAX_FILE_BYTES, MIME_EXT, UPLOAD_KINDS } from '@/lib/websites/schema';
import { serviceClient, rateLimited, UUID_RE } from '@/lib/websites/server';

export const runtime = 'nodejs';

// Step 1 of an upload: the browser asks for permission to upload ONE file.
// We check the declared kind, type and size, then hand back a one-time signed upload URL.
// (Files go straight to Supabase because Vercel functions cap request bodies at ~4.5 MB.)
// Step 2 is /api/websites/upload/verify, which inspects the real bytes.
export async function POST(req) {
  try {
    const { submissionId, kind, size, type } = await req.json();
    const rule = UPLOAD_KINDS[kind];
    if (!UUID_RE.test(submissionId || '') || !rule) return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
    if (!rule.types.includes(type)) return NextResponse.json({ error: 'That file type is not accepted here.' }, { status: 400 });
    if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Files must be 5 MB or smaller.' }, { status: 400 });
    }

    const db = serviceClient();
    if (await rateLimited(db, req, 'upload', 60, 60)) {
      return NextResponse.json({ error: 'Too many uploads. Please try again in a little while.' }, { status: 429 });
    }

    const path = `${submissionId}/${kind}-${crypto.randomBytes(6).toString('hex')}.${MIME_EXT[type]}`;
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return NextResponse.json({ path, token: data.token });
  } catch (err) {
    console.error('[websites/upload]', err);
    return NextResponse.json({ error: 'Could not start the upload. Please try again.' }, { status: 500 });
  }
}
