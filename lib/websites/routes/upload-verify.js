import { NextResponse } from 'next/server';
import { BUCKET, UPLOAD_KINDS } from '@/lib/websites/schema';
import { serviceClient, checkImageBuffer, UUID_RE } from '@/lib/websites/server';

export const runtime = 'nodejs';

// Step 2 of an upload: download what was actually stored, check the real bytes
// (not the filename or declared type), and delete it if it is not a safe image.
export async function POST(req) {
  try {
    const { submissionId, path, kind } = await req.json();
    const rule = UPLOAD_KINDS[kind];
    if (!UUID_RE.test(submissionId || '') || !rule || typeof path !== 'string' || !path.startsWith(`${submissionId}/`) || path.includes('..')) {
      return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
    }
    const db = serviceClient();
    const { data: blob, error } = await db.storage.from(BUCKET).download(path);
    if (error || !blob) return NextResponse.json({ error: 'We could not find that upload. Please try again.' }, { status: 404 });

    const result = checkImageBuffer(Buffer.from(await blob.arrayBuffer()), rule.types);
    if (result.error) {
      await db.storage.from(BUCKET).remove([path]);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  } catch (err) {
    console.error('[websites/upload/verify]', err);
    return NextResponse.json({ error: 'Could not check that file. Please try again.' }, { status: 500 });
  }
}
