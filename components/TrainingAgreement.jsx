'use client';

import { useEffect, useRef, useState } from 'react';
import * as db from '@/lib/supabase';

const BRAND = {
  teal: '#0097b2', purple: '#5e17eb', black: '#000000', white: '#ffffff',
  offWhite: '#f7f8fa', tealDark: '#007a91', tealLight: '#e6f6f9',
  purpleLight: '#f0e8fd', grey: '#6b7280', greyLight: '#e5e7eb',
  red: '#dc2626',
};

const CONTRACT_VERSION = '2026-10-v1';
const TRAINER = 'Liani vd Walt';
const FEE = 5000;
const DEPOSIT = 1500;
const BALANCE = 3500;
const DAYS = 30;

const fmtR = (n) => 'R' + n.toLocaleString('en-ZA').replace(/ /g, ',');

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso) {
  if (!iso) return '________';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function makeEmptyForm() {
  const start = todayISO();
  return {
    ownerName: '', ownerIdNumber: '', ownerPhone: '', ownerEmail: '', ownerAddress: '', emergencyContact: '',
    horseName: '', horseAge: '', horseBreed: '', horseSex: '', passportNumber: '',
    startDate: start, endDate: addDaysISO(start, DAYS),
    paymentOption: 'split',
    dietaryInstructions: '', vetDetails: '', trainingGoals: '', behaviourDisclosure: '',
    termsAccepted: false, riskAccepted: false, disclosureConfirmed: false,
    signedName: '',
  };
}

// The agreement text. Kept as data so the form page and the signed copy render identically.
function Clauses({ form }) {
  const h = { fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 800, color: BRAND.black, margin: '18px 0 6px' };
  const p = { fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 6px' };
  const ul = { fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 6px', paddingLeft: 20 };
  return (
    <div>
      <h3 style={h}>1. Training Period</h3>
      <p style={p}>
        The Owner agrees to place the horse{form.horseName ? ` (${form.horseName})` : ''} with the Trainer for a minimum period of {DAYS} consecutive days.
      </p>
      <p style={p}><strong>Start Date:</strong> {fmtDate(form.startDate)} &nbsp;&nbsp; <strong>End Date:</strong> {fmtDate(form.endDate)}</p>
      <p style={p}>Early collection does not reduce the agreed fee.</p>

      <h3 style={h}>2. Fees</h3>
      <p style={p}><strong>Total Training Fee: {fmtR(FEE)} for {DAYS} days</strong></p>
      <p style={p}>This includes:</p>
      <ul style={ul}>
        <li>Daily handling and structured training</li>
        <li>Groundwork and/or riding as determined necessary by the Trainer</li>
        <li>Behaviour correction focus</li>
      </ul>
      <p style={p}>Excludes:</p>
      <ul style={ul}>
        <li>Stabling</li>
        <li>Feed, hay, and supplements (to be supplied by Owner)</li>
        <li>Farrier costs</li>
        <li>Veterinary costs</li>
        <li>Emergency medical treatment</li>
        <li>Transport</li>
      </ul>
      <p style={p}><strong>Payment Terms:</strong></p>
      <ul style={ul}>
        <li>30% ({fmtR(DEPOSIT)}) due on arrival</li>
        <li>70% ({fmtR(BALANCE)}) due by Day 15</li>
        <li>OR full payment upfront</li>
      </ul>
      <p style={p}>
        <strong>Owner’s chosen option:</strong>{' '}
        {form.paymentOption === 'full'
          ? `Full payment of ${fmtR(FEE)} upfront`
          : `${fmtR(DEPOSIT)} on arrival, ${fmtR(BALANCE)} by Day 15`}
      </p>
      <p style={p}>Late payments may result in suspension of training.</p>

      <h3 style={h}>3. Feed &amp; Care</h3>
      <p style={p}>The Owner agrees to supply:</p>
      <ul style={ul}>
        <li>All feed and hay required for the duration</li>
        <li>Any supplements currently used</li>
        <li>Special dietary instructions in writing</li>
      </ul>
      <p style={p}>If feed runs out and the Trainer needs to supply emergency feed, the Owner will be billed accordingly.</p>

      <h3 style={h}>4. Veterinary &amp; Emergency Care</h3>
      <p style={p}>The Owner authorises the Trainer to obtain veterinary assistance if deemed necessary.</p>
      <p style={p}>All veterinary, medication, emergency, and related costs remain the responsibility of the Owner.</p>
      <p style={p}>The Trainer will attempt to contact the Owner before major decisions where possible.</p>

      <h3 style={h}>5. Training Disclaimer</h3>
      <p style={p}>The Owner understands:</p>
      <ul style={ul}>
        <li>Behavioural improvement depends on consistency.</li>
        <li>No guarantee is given that the horse will be “fully corrected” within {DAYS} days.</li>
        <li>Long-term success depends on continued handling and correct riding after collection.</li>
        <li>Horses are animals and unpredictable behaviour may occur.</li>
      </ul>

      <h3 style={h}>6. Risk &amp; Liability</h3>
      <p style={p}>The Owner acknowledges:</p>
      <ul style={ul}>
        <li>Training involves inherent risk.</li>
        <li>The Trainer is not liable for illness, injury, escape, theft, or death unless caused by proven gross negligence.</li>
        <li>Minor scrapes, cuts, or typical paddock injuries may occur.</li>
        <li>The Owner confirms the horse is not known to have undisclosed dangerous behaviour.</li>
      </ul>

      <h3 style={h}>7. Owner Visits</h3>
      <p style={p}>Owner visits must be arranged in advance and are more than welcome.</p>

      <h3 style={h}>8. Acceptance</h3>
      <p style={p}>By signing below, both parties confirm that they understand and agree to the terms of this agreement.</p>
    </div>
  );
}

function SignaturePad({ onChange, hasError }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
    // A tap leaves a dot
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(last.current.x, last.current.y, 1, 0, Math.PI * 2);
    ctx.fill();
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setEmpty(false);
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange('');
  };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          style={{
            width: '100%', height: 150, display: 'block', touchAction: 'none', cursor: 'crosshair',
            background: BRAND.white, borderRadius: 10,
            border: `1px ${hasError ? 'solid' : 'dashed'} ${hasError ? BRAND.red : BRAND.grey}`,
          }}
        />
        {empty && (
          <span style={{ position: 'absolute', left: 14, top: 12, fontSize: 13, color: '#9ca3af', pointerEvents: 'none' }}>
            Sign here with your finger or mouse
          </span>
        )}
      </div>
      <button type="button" onClick={clear} style={{ marginTop: 6, background: 'none', border: 'none', color: BRAND.teal, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: 0 }}>
        Clear signature
      </button>
    </div>
  );
}

export default function TrainingAgreement() {
  const [form, setForm] = useState(makeEmptyForm);
  const [signature, setSignature] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('form'); // form | submitting | done
  const [submitError, setSubmitError] = useState('');
  const [signedAt, setSignedAt] = useState(null);
  const endTouched = useRef(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function setStart(v) {
    setForm((f) => ({ ...f, startDate: v, endDate: endTouched.current || !v ? f.endDate : addDaysISO(v, DAYS) }));
  }

  function validate() {
    const e = {};
    const required = ['ownerName', 'ownerIdNumber', 'ownerPhone', 'ownerAddress', 'horseName', 'horseAge', 'horseBreed', 'horseSex', 'signedName'];
    required.forEach((k) => { if (!form[k].trim()) e[k] = true; });
    if (!form.ownerEmail.trim() || !form.ownerEmail.includes('@')) e.ownerEmail = true;
    if (!form.startDate) e.startDate = true;
    if (!form.endDate || (form.startDate && form.endDate < addDaysISO(form.startDate, DAYS))) e.endDate = true;
    if (!form.termsAccepted) e.termsAccepted = true;
    if (!form.riskAccepted) e.riskAccepted = true;
    if (!form.disclosureConfirmed) e.disclosureConfirmed = true;
    if (!signature) e.signature = true;
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => {
        document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setStatus('submitting');
    setSubmitError('');
    try {
      await db.saveTrainingAgreement({
        contractVersion: CONTRACT_VERSION,
        ownerName: form.ownerName.trim(),
        ownerIdNumber: form.ownerIdNumber.trim(),
        ownerPhone: form.ownerPhone.trim(),
        ownerEmail: form.ownerEmail.trim(),
        ownerAddress: form.ownerAddress.trim(),
        emergencyContact: form.emergencyContact.trim(),
        horseName: form.horseName.trim(),
        horseAge: form.horseAge.trim(),
        horseBreed: form.horseBreed.trim(),
        horseSex: form.horseSex.trim(),
        passportNumber: form.passportNumber.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        feeTotal: FEE,
        paymentOption: form.paymentOption,
        dietaryInstructions: form.dietaryInstructions.trim(),
        vetDetails: form.vetDetails.trim(),
        trainingGoals: form.trainingGoals.trim(),
        behaviourDisclosure: form.behaviourDisclosure.trim(),
        signedName: form.signedName.trim(),
        signatureData: signature,
      });
      setSignedAt(new Date());
      setStatus('done');
      window.scrollTo({ top: 0 });
    } catch (err) {
      console.error(err);
      setSubmitError('Something went wrong submitting the agreement — please try again, or contact Liani directly.');
      setStatus('form');
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10,
    border: `1px solid ${hasError ? BRAND.red : BRAND.greyLight}`, fontSize: 14, fontFamily: 'inherit',
  });
  const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 700, color: BRAND.black, marginBottom: 6 };
  const sectionTitle = { fontFamily: "'Montserrat', sans-serif", fontSize: 15, fontWeight: 800, color: BRAND.teal, margin: '26px 0 12px' };
  const row = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 };

  const field = (key, label, props = {}, required = true) => (
    <div data-error={errors[key] ? 'true' : undefined}>
      <label style={labelStyle}>{label}{required ? ' *' : ''}</label>
      <input style={inputStyle(errors[key])} value={form[key]} onChange={(e) => set(key, e.target.value)} {...props} />
    </div>
  );

  const check = (key, text) => (
    <label data-error={errors[key] ? 'true' : undefined} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={form[key]}
        onChange={(e) => set(key, e.target.checked)}
        style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, accentColor: BRAND.teal }}
      />
      <span style={{ fontSize: 13, color: errors[key] ? BRAND.red : BRAND.black, lineHeight: 1.5 }}>{text}</span>
    </label>
  );

  const card = { background: BRAND.white, borderRadius: 16, padding: '28px 24px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' };

  return (
    <div style={{ minHeight: '100vh', background: BRAND.offWhite, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes taFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .ta-in { animation: taFadeUp 0.35s ease both; }
        .ta-btn { transition: transform 0.15s ease, opacity 0.15s ease; }
        .ta-btn:active { transform: scale(0.98); }
        .ta-btn:hover { opacity: 0.92; }
        @media print {
          .ta-noprint { display: none !important; }
          body, .ta-page { background: #fff !important; }
          .ta-card { box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>

      <div className="ta-noprint" style={{ background: BRAND.black, color: BRAND.white, textAlign: 'center', padding: '40px 20px 34px', borderBottom: `5px solid ${BRAND.teal}`, backgroundImage: `linear-gradient(135deg, #000 55%, ${BRAND.purple}55 100%)` }}>
        <img src="/logo-icon.png" alt="Laska Legacy" style={{ display: 'block', margin: '0 auto 14px', height: 96, width: 96, borderRadius: '50%', boxShadow: '0 0 0 4px rgba(255,255,255,0.15)' }} />
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: 6, textTransform: 'uppercase', lineHeight: 1.1 }}>Laska Legacy</div>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontStyle: 'italic', color: '#7fdcec', margin: '10px 0 16px', letterSpacing: 0.5 }}>More than a horse, a lasting legacy</div>
        <div style={{ display: 'inline-block', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.35)' }}>
          Horse Training with {TRAINER}
        </div>
      </div>

      <div className="ta-page" style={{ maxWidth: 680, margin: '0 auto', padding: '16px 20px 80px' }}>
        {status === 'done' ? (
          <>
            <div className="ta-in ta-noprint" style={{ ...card, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🐎</div>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Agreement Signed</h2>
              <p style={{ fontSize: 14, color: BRAND.grey, lineHeight: 1.6, margin: '0 0 16px' }}>
                Thanks, {form.ownerName.split(' ')[0]} — your agreement for {form.horseName} has been sent to {TRAINER}. Save a copy for your records below.
              </p>
              <button className="ta-btn" onClick={() => window.print()} style={{ padding: '12px 24px', borderRadius: 100, border: 'none', background: BRAND.black, color: BRAND.white, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                Print / Save as PDF
              </button>
            </div>

            <div className="ta-card" style={card}>
              <SignedCopy form={form} signature={signature} signedAt={signedAt} />
            </div>
          </>
        ) : (
          <div className="ta-in" style={card}>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>{DAYS}-Day Training &amp; Correction Agreement</h1>
            <p style={{ fontSize: 13.5, color: BRAND.grey, margin: '0 0 6px', lineHeight: 1.5 }}>
              Please complete your details, read the agreement, and sign at the bottom. Fields marked * are required.
            </p>

            <h2 style={sectionTitle}>Owner details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {field('ownerName', 'Full name')}
              <div style={row}>
                {field('ownerIdNumber', 'ID number')}
                {field('ownerPhone', 'Contact number', { type: 'tel' })}
              </div>
              {field('ownerEmail', 'Email', { type: 'email' })}
              {field('ownerAddress', 'Address')}
              {field('emergencyContact', 'Emergency contact (name & number)', { placeholder: 'Someone we can reach if you can’t be reached' }, false)}
            </div>

            <h2 style={sectionTitle}>Horse details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={row}>
                {field('horseName', 'Horse’s name')}
                {field('horseAge', 'Age', { placeholder: 'e.g. 6 years' })}
              </div>
              <div style={row}>
                {field('horseBreed', 'Breed')}
                <div data-error={errors.horseSex ? 'true' : undefined}>
                  <label style={labelStyle}>Sex *</label>
                  <select style={inputStyle(errors.horseSex)} value={form.horseSex} onChange={(e) => set('horseSex', e.target.value)}>
                    <option value="">Select…</option>
                    <option>Mare</option>
                    <option>Gelding</option>
                    <option>Stallion</option>
                  </select>
                </div>
              </div>
              {field('passportNumber', 'Passport number', { placeholder: 'If the horse has one' }, false)}
            </div>

            <h2 style={sectionTitle}>Training period</h2>
            <div style={row}>
              <div data-error={errors.startDate ? 'true' : undefined}>
                <label style={labelStyle}>Start date *</label>
                <input type="date" style={inputStyle(errors.startDate)} value={form.startDate} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div data-error={errors.endDate ? 'true' : undefined}>
                <label style={labelStyle}>End date * <span style={{ fontWeight: 400, color: BRAND.grey }}>(minimum {DAYS} days)</span></label>
                <input type="date" style={inputStyle(errors.endDate)} value={form.endDate} onChange={(e) => { endTouched.current = true; set('endDate', e.target.value); }} />
              </div>
            </div>

            <h2 style={sectionTitle}>Payment option</h2>
            {[
              ['split', `${fmtR(DEPOSIT)} on arrival (30%) + ${fmtR(BALANCE)} by Day 15 (70%)`],
              ['full', `Full payment of ${fmtR(FEE)} upfront`],
            ].map(([val, text]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', border: `1px solid ${form.paymentOption === val ? BRAND.teal : BRAND.greyLight}`, background: form.paymentOption === val ? BRAND.tealLight : BRAND.white }}>
                <input type="radio" name="payment" checked={form.paymentOption === val} onChange={() => set('paymentOption', val)} style={{ accentColor: BRAND.teal }} />
                <span style={{ fontSize: 13.5 }}>{text}</span>
              </label>
            ))}

            <h2 style={sectionTitle}>Care, health &amp; behaviour</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Special dietary instructions &amp; supplements</label>
                <textarea style={{ ...inputStyle(false), minHeight: 70, resize: 'vertical' }} value={form.dietaryInstructions} onChange={(e) => set('dietaryInstructions', e.target.value)} placeholder="What, how much, how often — you supply all feed, hay and supplements" />
              </div>
              <div>
                <label style={labelStyle}>Your vet (name &amp; number)</label>
                <input style={inputStyle(false)} value={form.vetDetails} onChange={(e) => set('vetDetails', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>What would you like to work on?</label>
                <textarea style={{ ...inputStyle(false), minHeight: 70, resize: 'vertical' }} value={form.trainingGoals} onChange={(e) => set('trainingGoals', e.target.value)} placeholder="Problems, goals, history of the horse" />
              </div>
              <div>
                <label style={labelStyle}>Known behavioural issues, injuries or health conditions</label>
                <textarea style={{ ...inputStyle(false), minHeight: 70, resize: 'vertical' }} value={form.behaviourDisclosure} onChange={(e) => set('behaviourDisclosure', e.target.value)} placeholder="Biting, kicking, bolting, rearing, loading issues, lameness, allergies… or “none”" />
              </div>
            </div>

            <h2 style={sectionTitle}>The agreement</h2>
            <p style={{ fontSize: 12.5, color: BRAND.grey, margin: '0 0 8px' }}>
              Between <strong>{TRAINER}</strong> (“Trainer”) and <strong>{form.ownerName || 'the Owner'}</strong> (“Owner”). Scroll to read it all.
            </p>
            <div style={{ background: BRAND.offWhite, border: `1px solid ${BRAND.greyLight}`, borderRadius: 12, padding: '4px 18px 12px', maxHeight: 360, overflowY: 'auto' }}>
              <Clauses form={form} />
            </div>

            {check('termsAccepted', <>I have read and agree to the terms of this agreement, including the fees and payment terms. *</>)}
            {check('riskAccepted', <>I understand training involves inherent risk, that no guarantee of results is given, and the Trainer is not liable except for proven gross negligence. *</>)}
            {check('disclosureConfirmed', <>I confirm the horse has no undisclosed dangerous behaviour, and the information above is true and complete. *</>)}

            <h2 style={sectionTitle}>Sign</h2>
            <div style={{ marginBottom: 12 }} data-error={errors.signedName ? 'true' : undefined}>
              <label style={labelStyle}>Type your full name *</label>
              <input style={inputStyle(errors.signedName)} value={form.signedName} onChange={(e) => set('signedName', e.target.value)} />
            </div>
            <div data-error={errors.signature ? 'true' : undefined}>
              <label style={labelStyle}>Owner signature *</label>
              <SignaturePad onChange={setSignature} hasError={errors.signature} />
            </div>
            <p style={{ fontSize: 12, color: BRAND.grey, margin: '10px 0 0' }}>Date: {fmtDate(todayISO())}</p>

            {Object.keys(errors).length > 0 && <p style={{ fontSize: 12.5, color: BRAND.red, marginTop: 14 }}>Please complete the highlighted fields.</p>}
            {submitError && <p style={{ fontSize: 12.5, color: BRAND.red, marginTop: 14 }}>{submitError}</p>}

            <button
              className="ta-btn"
              disabled={status === 'submitting'}
              onClick={handleSubmit}
              style={{
                width: '100%', marginTop: 22, padding: '15px 20px', borderRadius: 100, fontSize: 15,
                fontWeight: 800, cursor: status === 'submitting' ? 'not-allowed' : 'pointer', border: 'none',
                background: BRAND.black, color: BRAND.white, boxShadow: '0 10px 22px rgba(0,0,0,0.18)',
              }}
            >
              {status === 'submitting' ? 'Submitting…' : 'Sign & Submit Agreement'}
            </button>
            <p style={{ fontSize: 11.5, color: BRAND.grey, textAlign: 'center', marginTop: 10 }}>
              Your typed name, drawn signature and the time of signing are recorded as your electronic signature.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Read-only signed copy shown after submission (printable).
function SignedCopy({ form, signature, signedAt }) {
  const line = { fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 };
  const h = { fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 800, color: BRAND.black, margin: '18px 0 6px' };
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 18, paddingBottom: 16, borderBottom: `3px solid ${BRAND.teal}` }}>
        <img src="/logo-icon.png" alt="Laska Legacy" style={{ display: 'block', margin: '0 auto 6px', height: 72, width: 72 }} />
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: 5, textTransform: 'uppercase' }}>Laska Legacy</div>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12.5, fontStyle: 'italic', color: BRAND.teal, margin: '4px 0 14px' }}>More than a horse, a lasting legacy</div>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 800, margin: 0 }}>{DAYS}-Day Training &amp; Correction Agreement</h1>
      </div>

      <h3 style={h}>Parties</h3>
      <p style={line}><strong>Trainer:</strong> {TRAINER}</p>
      <p style={line}><strong>Owner:</strong> {form.ownerName}</p>
      <p style={line}><strong>ID number:</strong> {form.ownerIdNumber}</p>
      <p style={line}><strong>Contact:</strong> {form.ownerPhone} · {form.ownerEmail}</p>
      <p style={line}><strong>Address:</strong> {form.ownerAddress}</p>
      {form.emergencyContact && <p style={line}><strong>Emergency contact:</strong> {form.emergencyContact}</p>}

      <h3 style={h}>Horse details</h3>
      <p style={line}><strong>Name:</strong> {form.horseName} · <strong>Age:</strong> {form.horseAge} · <strong>Breed:</strong> {form.horseBreed} · <strong>Sex:</strong> {form.horseSex}</p>
      {form.passportNumber && <p style={line}><strong>Passport number:</strong> {form.passportNumber}</p>}
      {form.dietaryInstructions && <p style={line}><strong>Dietary instructions:</strong> {form.dietaryInstructions}</p>}
      {form.vetDetails && <p style={line}><strong>Vet:</strong> {form.vetDetails}</p>}
      {form.trainingGoals && <p style={line}><strong>Training goals:</strong> {form.trainingGoals}</p>}
      {form.behaviourDisclosure && <p style={line}><strong>Disclosed behaviour / health:</strong> {form.behaviourDisclosure}</p>}

      <Clauses form={form} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BRAND.greyLight}` }}>
        <div>
          <p style={{ ...line, fontWeight: 700 }}>Owner</p>
          <img src={signature} alt="Owner signature" style={{ height: 70, display: 'block', borderBottom: '1px solid #9ca3af', marginBottom: 4 }} />
          <p style={line}>{form.signedName}</p>
          <p style={line}>Signed {signedAt ? signedAt.toLocaleString('en-ZA', { dateStyle: 'long', timeStyle: 'short' }) : ''}</p>
        </div>
        <div>
          <p style={{ ...line, fontWeight: 700 }}>Trainer</p>
          <div style={{ height: 70, borderBottom: '1px solid #9ca3af', marginBottom: 4 }} />
          <p style={line}>{TRAINER}</p>
          <p style={line}>Date: ______________</p>
        </div>
      </div>
      <p style={{ fontSize: 11, color: BRAND.grey, marginTop: 14 }}>Agreement version {CONTRACT_VERSION}</p>
      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11.5, fontStyle: 'italic', color: BRAND.teal, textAlign: 'center', marginTop: 18 }}>Laska Legacy — more than a horse, a lasting legacy</p>
    </div>
  );
}
