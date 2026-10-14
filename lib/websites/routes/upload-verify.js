import { NextResponse } from 'next/server';
import { BUCKET, MAX_SVG_BYTES, UPLOAD_KINDS } from '@/lib/websites/schema';
import { serviceClient, checkImageBuffer, UUID_RE } from '@/lib/websites/server';

export const runtime = 'nodejs';

// Step 2 of an upload: inspect what was actually stored (not the filename or declared type)
// and delete it if it is not a safe image. Only the first 4 KB is read, so large photos are cheap to check.
export async function POST(req) {
  try {
    const { submissionId, path, kind } = await req.json();
    const rule = UPLOAD_KINDS[kind];
    if (!UUID_RE.test(submissionId || '') || !rule || typeof path !== 'string' || !path.startsWith(`${submissionId}/`) || path.includes('..')) {
      return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
    }
    const db = serviceClient();
    const bucket = db.storage.from(BUCKET);

    const { data: signed, error: signError } = await bucket.createSignedUrl(path, 60);
    if (signError || !signed) return NextResponse.json({ error: 'We could not find that upload. Please try again.' }, { status: 404 });

    const head = await fetch(signed.signedUrl, { headers: { Range: 'bytes=0-4095' } });
    if (!head.ok) return NextResponse.json({ error: 'We could not find that upload. Please try again.' }, { status: 404 });
    const range = head.headers.get('content-range'); // e.g. "bytes 0-4095/12345678"
    const buf = Buffer.from(await head.arrayBuffer());
    const total = range ? Number(range.split('/')[1]) : Number(head.headers.get('content-length')) || buf.length;

    let bytes = buf;
    // SVGs can carry scripts, so they are read in full (and are limited to a small size).
    if (buf.toString('utf8', 0, 512).toLowerCase().includes('<svg') && total <= MAX_SVG_BYTES && buf.length < total) {
      const { data: blob } = await bucket.download(path);
      if (blob) bytes = Buffer.from(await blob.arrayBuffer());
    }

    const result = checkImageBuffer(bytes, rule.types, total);
    if (result.error) {
      await bucket.remove([path]);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const { data } = bucket.getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  } catch (err) {
    console.error('[websites/upload/verify]', err);
    return NextResponse.json({ error: 'Could not check that file. Please try again.' }, { status: 500 });
  }
}
