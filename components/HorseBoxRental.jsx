'use client';

import { useState } from 'react';
import * as db from '@/lib/supabase';

const BRAND = {
  teal: '#0097b2', purple: '#5e17eb', black: '#000000', white: '#ffffff',
  offWhite: '#f7f8fa', tealDark: '#007a91', tealLight: '#e6f6f9',
  purpleLight: '#f0e8fd', grey: '#6b7280', greyLight: '#e5e7eb',
  red: '#dc2626',
};

const TERMS = [
  'You must hold a valid driver’s license appropriate for towing a horse box, and a roadworthy towing vehicle with the correct towing capacity and working trailer electrics.',
  'A refundable security deposit is payable before collection. The deposit (or part of it) will be forfeited to cover any damage, loss, or late return.',
  'The horse box must be returned mucked out, hosed down, and in the same condition it was collected in, by the agreed return date and time.',
  'You are fully liable for any damage, loss, theft, or traffic fines incurred while the horse box is in your possession.',
  'The horse box may only be used to transport horses/livestock, and may not be sublet or lent to a third party without our written consent.',
  'We do not provide insurance cover for the box, its contents, or animals transported in it — please confirm your own insurance covers this before travelling. We accept no liability for injury to horses, riders, or third parties during transport.',
  'Cancellations made less than 48 hours before the collection date may forfeit the deposit.',
  'Fuel and running costs for the duration of the rental are for your account.',
  'Please inspect the horse box at collection and report any pre-existing damage to us immediately, before departing.',
];

const emptyForm = {
  name: '', email: '', phone: '',
  numHorses: '1', horseDetails: '',
  collectionDate: '', returnDate: '',
  destination: '', towingVehicleConfirmed: false,
  notes: '', termsAccepted: false,
};

export default function HorseBoxRental() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('form'); // form | submitting | done
  const [submitError, setSubmitError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.email.trim() || !form.email.includes('@')) e.email = true;
    if (!form.phone.trim()) e.phone = true;
    if (!form.numHorses || Number(form.numHorses) < 1) e.numHorses = true;
    if (!form.collectionDate) e.collectionDate = true;
    if (!form.returnDate) e.returnDate = true;
    if (form.collectionDate && form.returnDate && form.returnDate < form.collectionDate) e.returnDate = true;
    if (!form.towingVehicleConfirmed) e.towingVehicleConfirmed = true;
    if (!form.termsAccepted) e.termsAccepted = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setStatus('submitting');
    setSubmitError('');
    try {
      await db.saveHorseBoxRental({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        numHorses: Number(form.numHorses),
        horseDetails: form.horseDetails.trim(),
        collectionDate: form.collectionDate,
        returnDate: form.returnDate,
        destination: form.destination.trim(),
        towingVehicleConfirmed: form.towingVehicleConfirmed,
        notes: form.notes.trim(),
      });
      setStatus('done');
    } catch (err) {
      console.error(err);
      setSubmitError('Something went wrong submitting your request — please try again.');
      setStatus('form');
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10,
    border: `1px solid ${hasError ? BRAND.red : BRAND.greyLight}`, fontSize: 14, fontFamily: 'inherit',
  });
  const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 700, color: BRAND.black, marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: BRAND.offWhite, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes hbrFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .hbr-in { animation: hbrFadeUp 0.35s ease both; }
        .hbr-btn { transition: transform 0.15s ease, opacity 0.15s ease; }
        .hbr-btn:active { transform: scale(0.98); }
        .hbr-btn:hover { opacity: 0.92; }
      `}</style>

      <div style={{ textAlign: 'center', padding: '32px 20px 8px' }}>
        <img src="/logo-dark.png" alt="Laska Legacy" style={{ height: 40, marginBottom: 10 }} />
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: BRAND.teal, fontWeight: 700 }}>Horse Box Rental</div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 20px 80px' }}>
        {status === 'done' ? (
          <div className="hbr-in" style={{ background: BRAND.white, borderRadius: 16, padding: '40px 28px', textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🐎</div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800, color: BRAND.black, margin: '0 0 8px' }}>Request Received</h2>
            <p style={{ fontSize: 14, color: BRAND.grey, lineHeight: 1.6, margin: 0 }}>
              Thanks, {form.name.split(' ')[0] || 'there'}! We’ve got your horse box rental request and will be in touch on {form.email || 'your email'} or {form.phone || 'your phone'} shortly to confirm availability and the deposit.
            </p>
          </div>
        ) : (
          <div className="hbr-in" style={{ background: BRAND.white, borderRadius: 16, padding: '28px 24px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 24, fontWeight: 800, color: BRAND.black, margin: '0 0 6px' }}>Rent a Horse Box</h1>
            <p style={{ fontSize: 13.5, color: BRAND.grey, margin: '0 0 24px', lineHeight: 1.5 }}>
              Fill in your details below. We’ll confirm availability and get back to you to arrange collection.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle(errors.name)} value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" style={inputStyle(errors.email)} value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input type="tel" style={inputStyle(errors.phone)} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Number of Horses *</label>
                  <input type="number" min="1" style={inputStyle(errors.numHorses)} value={form.numHorses} onChange={(e) => set('numHorses', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Horse Name(s) / Details</label>
                  <input style={inputStyle(false)} placeholder="e.g. names, breeds, any special handling notes" value={form.horseDetails} onChange={(e) => set('horseDetails', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Collection Date *</label>
                  <input type="date" style={inputStyle(errors.collectionDate)} value={form.collectionDate} onChange={(e) => set('collectionDate', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Return Date *</label>
                  <input type="date" style={inputStyle(errors.returnDate)} value={form.returnDate} onChange={(e) => set('returnDate', e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Destination</label>
                <input style={inputStyle(false)} placeholder="Where are you travelling to?" value={form.destination} onChange={(e) => set('destination', e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>Additional Notes</label>
                <textarea style={{ ...inputStyle(false), minHeight: 80, resize: 'vertical' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 18, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.towingVehicleConfirmed}
                onChange={(e) => set('towingVehicleConfirmed', e.target.checked)}
                style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, accentColor: BRAND.teal }}
              />
              <span style={{ fontSize: 13, color: errors.towingVehicleConfirmed ? BRAND.red : BRAND.black, lineHeight: 1.5 }}>
                I confirm I have a valid towing-appropriate driver’s license and a roadworthy vehicle able to tow the horse box.
              </span>
            </label>

            <div style={{ background: BRAND.offWhite, border: `1px solid ${BRAND.greyLight}`, borderRadius: 12, padding: '16px 18px', marginTop: 20, maxHeight: 220, overflowY: 'auto' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: BRAND.black, marginBottom: 10 }}>Rental Terms &amp; Conditions</div>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TERMS.map((t, i) => (
                  <li key={i} style={{ fontSize: 12.5, color: BRAND.grey, lineHeight: 1.55 }}>{t}</li>
                ))}
              </ol>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => set('termsAccepted', e.target.checked)}
                style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, accentColor: BRAND.teal }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: errors.termsAccepted ? BRAND.red : BRAND.black, lineHeight: 1.5 }}>
                I have read and agree to the rental terms &amp; conditions above. *
              </span>
            </label>

            {submitError && <p style={{ fontSize: 12.5, color: BRAND.red, marginTop: 14 }}>{submitError}</p>}

            <button
              className="hbr-btn"
              disabled={status === 'submitting'}
              onClick={handleSubmit}
              style={{
                width: '100%', marginTop: 22, padding: '15px 20px', borderRadius: 100, fontSize: 15,
                fontWeight: 800, cursor: status === 'submitting' ? 'not-allowed' : 'pointer', border: 'none',
                background: BRAND.black, color: BRAND.white, boxShadow: '0 10px 22px rgba(0,0,0,0.18)',
              }}
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit Request'}
            </button>
            <p style={{ fontSize: 11.5, color: BRAND.grey, textAlign: 'center', marginTop: 10 }}>
              This is a request, not a confirmed booking — we’ll be in touch to confirm availability.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
