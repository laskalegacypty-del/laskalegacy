'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Birthday breakfast order form. The form itself is a standalone page in
// public/birthday/form.html; it reuses this site's Supabase client through
// window.__SB (same origin), so no extra serverless function is needed.
export default function BirthdayPage() {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    window.__SB = supabase;
    const host = new URLSearchParams(window.location.search).has('host');
    setSrc(`/birthday/form.html${host ? '?host' : ''}`);
    return () => { delete window.__SB; };
  }, []);

  if (!src) return null;
  return (
    <iframe
      title="Birthday breakfast orders"
      src={src}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0 }}
    />
  );
}
