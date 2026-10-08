'use client';

import { useId, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BUCKET, MAX_FILE_BYTES } from '@/lib/websites/schema';

export const BRAND = {
  teal: '#0097b2', purple: '#5e17eb', black: '#000000', white: '#ffffff',
  offWhite: '#f7f8fa', tealDark: '#007a91', tealLight: '#e6f6f9',
  purpleLight: '#f0e8fd', grey: '#6b7280', greyLight: '#e5e7eb', red: '#dc2626',
};

export const inputStyle = (hasError) => ({
  width: '100%', boxSizing: 'border-box', padding: '13px 14px', minHeight: 48, borderRadius: 10,
  border: `1.5px solid ${hasError ? BRAND.red : BRAND.greyLight}`, fontSize: 16, fontFamily: 'inherit',
  background: BRAND.white, color: BRAND.black,
});

// ─── Field wrapper: label, helper text, error ───

export function Field({ label, required, helper, error, children, id }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 14, fontWeight: 700, color: BRAND.black, marginBottom: 4 }}>
          {label}{required && <span style={{ color: BRAND.red }}> *</span>}
        </label>
      )}
      {helper && <p style={{ fontSize: 13, color: BRAND.grey, margin: '0 0 8px', lineHeight: 1.45 }}>{helper}</p>}
      {children}
      {error && <p role="alert" style={{ fontSize: 13, color: BRAND.red, margin: '6px 0 0', fontWeight: 600 }}>{error}</p>}
    </div>
  );
}

export function TextField({ label, required, helper, error, value, onChange, type = 'text', placeholder, maxLength, inputMode }) {
  const id = useId();
  return (
    <Field id={id} label={label} required={required} helper={helper} error={error}>
      <input id={id} type={type} inputMode={inputMode} value={value} maxLength={maxLength} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} style={inputStyle(error)} aria-invalid={!!error} />
    </Field>
  );
}

export function TextAreaField({ label, required, helper, error, value, onChange, placeholder, maxLength, rows = 4, counter }) {
  const id = useId();
  return (
    <Field id={id} label={label} required={required} helper={helper} error={error}>
      <textarea id={id} value={value} rows={rows} maxLength={maxLength} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle(error), resize: 'vertical' }} aria-invalid={!!error} />
      {counter && <div style={{ textAlign: 'right', fontSize: 12, color: BRAND.grey, marginTop: 4 }}>{value.trim().length} / {counter}</div>}
    </Field>
  );
}

export function SelectField({ label, required, helper, error, value, onChange, options, placeholder = 'Choose one' }) {
  const id = useId();
  return (
    <Field id={id} label={label} required={required} helper={helper} error={error}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle(error)} aria-invalid={!!error}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

export function CheckField({ checked, onChange, children, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', minHeight: 44 }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
          style={{ width: 24, height: 24, flexShrink: 0, marginTop: 1, accentColor: BRAND.teal }} />
        <span style={{ fontSize: 14, lineHeight: 1.5, color: error ? BRAND.red : BRAND.black }}>{children}</span>
      </label>
      {error && <p role="alert" style={{ fontSize: 13, color: BRAND.red, margin: '2px 0 0 36px', fontWeight: 600 }}>{error}</p>}
    </div>
  );
}

// Pill / card choice buttons (radio-like or multi-select)
export function ChoiceChip({ selected, onClick, children, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected}
      style={{
        minHeight: 48, padding: '10px 18px', borderRadius: 999, cursor: disabled ? 'not-allowed' : 'pointer',
        border: `2px solid ${selected ? BRAND.teal : BRAND.greyLight}`, background: selected ? BRAND.tealLight : BRAND.white,
        color: selected ? BRAND.tealDark : BRAND.black, fontWeight: 700, fontSize: 14, fontFamily: 'inherit', opacity: disabled ? 0.5 : 1,
      }}>
      {children}
    </button>
  );
}

// ─── Image upload (direct to Supabase via a server-issued signed URL, then server verifies the bytes) ───

const EXT_OK = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };

function typeOf(file) {
  if (file.type) return file.type;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return EXT_OK[ext] || '';
}

export async function uploadImage({ submissionId, kind, file, allowed }) {
  const type = typeOf(file);
  if (!allowed.includes(type)) throw new Error(`Please choose one of: ${allowed.map((t) => t.split('/')[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg')).join(', ').toUpperCase()}.`);
  if (file.size > MAX_FILE_BYTES) throw new Error('That file is bigger than 5 MB. Please choose a smaller one.');

  const post = async (url, body) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Upload failed. Please try again.');
    return json;
  };

  const { path, token } = await post('/api/websites/upload', { submissionId, kind, size: file.size, type });
  const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(path, token, file, { contentType: type });
  if (error) throw new Error('Upload failed. Please check your connection and try again.');
  const { url } = await post('/api/websites/upload/verify', { submissionId, kind, path });
  return { url, name: file.name };
}

export function ImageUpload({ label, required, helper, error, kind, allowed, submissionId, value, onChange, accept }) {
  const id = useId();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setUploadError('');
    try {
      onChange(await uploadImage({ submissionId, kind, file, allowed }));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field id={id} label={label} required={required} helper={helper} error={uploadError || error}>
      <input ref={inputRef} id={id} type="file" accept={accept} onChange={pick} style={{ display: 'none' }} />
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: `1.5px solid ${BRAND.greyLight}`, borderRadius: 12 }}>
          <img src={value.url} alt={`Preview of ${value.name}`} style={{ width: 72, height: 72, objectFit: 'contain', background: BRAND.offWhite, borderRadius: 8 }} />
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.name}</div>
          <button type="button" onClick={() => onChange(null)} style={smallBtn}>Remove</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          style={{ width: '100%', minHeight: 64, border: `2px dashed ${BRAND.teal}`, borderRadius: 12, background: BRAND.tealLight, color: BRAND.tealDark, fontWeight: 700, fontSize: 15, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
          {busy ? 'Uploading, please wait...' : 'Tap to choose a file'}
        </button>
      )}
    </Field>
  );
}

export function GalleryUpload({ label, helper, error, kind, allowed, submissionId, values, onChange, max, accept }) {
  const id = useId();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(0);
  const [uploadError, setUploadError] = useState('');

  async function pick(e) {
    const files = [...(e.target.files || [])].slice(0, max - values.length);
    e.target.value = '';
    if (!files.length) return;
    setBusy(files.length); setUploadError('');
    const added = [];
    for (const file of files) {
      try {
        added.push(await uploadImage({ submissionId, kind, file, allowed }));
      } catch (err) {
        setUploadError(`${file.name}: ${err.message}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (added.length) onChange([...values, ...added]);
  }

  return (
    <Field id={id} label={label} helper={helper} error={uploadError || error}>
      <input ref={inputRef} id={id} type="file" multiple accept={accept} onChange={pick} style={{ display: 'none' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10, marginBottom: 10 }}>
        {values.map((v, i) => (
          <div key={v.url} style={{ position: 'relative' }}>
            <img src={v.url} alt={`Gallery image ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10 }} />
            <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))}
              style={{ position: 'absolute', top: 4, right: 4, width: 32, height: 32, borderRadius: 16, border: 'none', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
          </div>
        ))}
      </div>
      {values.length < max && (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy > 0}
          style={{ width: '100%', minHeight: 56, border: `2px dashed ${BRAND.teal}`, borderRadius: 12, background: BRAND.tealLight, color: BRAND.tealDark, fontWeight: 700, fontSize: 15, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
          {busy > 0 ? `Uploading ${busy} file${busy > 1 ? 's' : ''}...` : `Add photos (${values.length} of ${max})`}
        </button>
      )}
    </Field>
  );
}

export const smallBtn = {
  minHeight: 40, padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${BRAND.greyLight}`,
  background: BRAND.white, color: BRAND.black, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
};
