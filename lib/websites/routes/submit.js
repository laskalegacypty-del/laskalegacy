import { NextResponse } from 'next/server';
import { BUCKET, MAX_GALLERY, MAX_REFERENCES, MAX_TESTIMONIALS, validateAll, stepForPath } from '@/lib/websites/schema';
import { buildPrompt, buildSettings } from '@/lib/websites/build';
import {
  serviceClient, rateLimited, sendEmail, clientConfirmationEmail, ownerNotificationEmail,
  buildPayfastFields, UUID_RE,
} from '@/lib/websites/server';

export const runtime = 'nodejs';

// Cap every string so nobody can stuff megabytes into the JSONB column.
function capStrings(v, depth = 0) {
  if (depth > 8) return null;
  if (typeof v === 'string') return v.slice(0, 5000);
  if (Array.isArray(v)) return v.slice(0, 50).map((x) => capStrings(x, depth + 1));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).slice(0, 60).map(([k, x]) => [k, capStrings(x, depth + 1)]));
  return v;
}

function fileObjects(a) {
  return [
    a.brand.logo, ...a.services.items.map((s) => s.image),
    a.content.heroImage, ...a.content.galleryImages, a.content.teamPhoto,
  ].filter(Boolean);
}

export async function POST(req) {
  try {
    if (Number(req.headers.get('content-length') || 0) > 300_000) {
      return NextResponse.json({ error: 'That submission is too large.' }, { status: 413 });
    }
    const body = await req.json();

    // Honeypot: real people never see this field. Pretend success so bots learn nothing.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json({ ok: true, id: crypto.randomUUID(), pay: null });
    }

    const id = body.submissionId;
    if (!UUID_RE.test(id || '') || !body.answers || typeof body.answers !== 'object') {
      return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
    }

    const answers = capStrings(body.answers);
    let errors;
    try {
      errors = validateAll(answers);
      if (answers.content.galleryImages.length > MAX_GALLERY) errors['content.galleryImages'] = `Up to ${MAX_GALLERY} images.`;
      if (answers.content.testimonials.length > MAX_TESTIMONIALS) errors['content.testimonials'] = `Up to ${MAX_TESTIMONIALS}.`;
      if (answers.extras.references.length > MAX_REFERENCES) errors['extras.references'] = `Up to ${MAX_REFERENCES}.`;
    } catch {
      return NextResponse.json({ error: 'Some of your answers are in an unexpected format. Please refresh and try again.' }, { status: 400 });
    }
    if (Object.keys(errors).length) {
      const first = Object.keys(errors)[0];
      return NextResponse.json({ error: 'Some answers need attention.', errors, step: stepForPath(first) }, { status: 422 });
    }

    // Every file must live in this submission's own storage folder.
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${id}/`;
    if (fileObjects(answers).some((f) => typeof f.url !== 'string' || !f.url.startsWith(prefix))) {
      return NextResponse.json({ error: 'One of your files looks invalid. Please remove it and upload it again.' }, { status: 400 });
    }

    const db = serviceClient();
    if (await rateLimited(db, req, 'submit', 5, 60)) {
      return NextResponse.json({ error: 'Too many submissions from your connection. Please try again later.' }, { status: 429 });
    }

    const settings = buildSettings(answers);
    const prompt = buildPrompt(answers, settings);

    const { error: insertError } = await db.from('website_submissions').insert({
      id,
      client_name: answers.about.fullName.trim(),
      client_email: answers.about.email.trim(),
      client_phone: answers.about.phone.trim(),
      answers,
      generated_prompt: prompt,
      settings_json: settings,
    });
    if (insertError && insertError.code !== '23505') throw insertError; // 23505: double submit, treat as success

    const name = answers.about.fullName.trim();
    const businessName = answers.about.businessName.trim();

    if (!insertError) {
      // Emails must never block or fail the submission.
      const owner = process.env.OWNER_EMAIL;
      await Promise.allSettled([
        sendEmail({ to: answers.about.email.trim(), ...clientConfirmationEmail({ name, businessName, id }), replyTo: process.env.OWNER_CONTACT_EMAIL }),
        owner ? sendEmail({ to: owner, ...ownerNotificationEmail({ clientName: name, businessName, id }), replyTo: answers.about.email.trim() }) : Promise.resolve(),
      ]).then((r) => r.forEach((x) => x.status === 'rejected' && console.error('[websites/submit] email failed', x.reason)));
    }

    return NextResponse.json({
      ok: true, id,
      // Set WEBSITE_PAYFAST_ENABLED=false to skip the built-in payment screen (you send your own payment link).
      pay: process.env.WEBSITE_PAYFAST_ENABLED === 'false' ? null : buildPayfastFields({ id, name, email: answers.about.email.trim(), businessName }),
    });
  } catch (err) {
    console.error('[websites/submit]', err);
    return NextResponse.json({ error: 'Something went wrong saving your details. Your answers are still saved in this browser, please try again.' }, { status: 500 });
  }
}
