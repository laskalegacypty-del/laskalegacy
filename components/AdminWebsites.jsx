'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BRAND } from '@/components/websites/ui';
import { PRICE_ZAR } from '@/lib/websites/schema';

const STATUS_LABEL = { new: 'New', in_progress: 'In progress', awaiting_approval: 'Awaiting approval', live: 'Live' };
const STATUS_COLOR = { new: BRAND.teal, in_progress: '#d97706', awaiting_approval: BRAND.purple, live: '#16a34a' };

const isFile = (v) => v && typeof v === 'object' && typeof v.url === 'string' && 'name' in v;
const slugOf = (a) => (a.about.businessName || 'website').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

function collectFiles(a) {
  const out = [];
  if (a.brand?.logo) out.push({ role: 'logo', ...a.brand.logo });
  if (a.content?.heroImage) out.push({ role: 'hero', ...a.content.heroImage });
  (a.content?.galleryImages || []).forEach((f, i) => out.push({ role: `gallery-${i + 1}`, ...f }));
  if (a.content?.teamPhoto) out.push({ role: 'team', ...a.content.teamPhoto });
  (a.services?.items || []).forEach((s, i) => s.image && out.push({ role: `service-${i + 1}`, ...s.image }));
  return out;
}
const fileName = (f) => `${f.role}.${(f.url.split('.').pop() || 'jpg').split('?')[0]}`;

function saveBlob(blob, name) {
  const href = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href, download: name });
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}

function Pretty({ value, depth = 0 }) {
  if (isFile(value)) return <a href={value.url} target="_blank" rel="noreferrer" style={{ color: BRAND.teal }}>{value.name}</a>;
  if (Array.isArray(value)) {
    if (!value.length) return <span style={{ color: BRAND.grey }}>none</span>;
    return <div>{value.map((v, i) => <div key={i} style={{ marginBottom: 6 }}><Pretty value={v} depth={depth + 1} /></div>)}</div>;
  }
  if (value && typeof value === 'object') {
    return (
      <div style={{ paddingLeft: depth ? 12 : 0, borderLeft: depth ? `2px solid ${BRAND.greyLight}` : 'none' }}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 10, padding: '3px 0', fontSize: 13 }}>
            <span style={{ width: 130, flexShrink: 0, color: BRAND.grey, fontWeight: 600 }}>{k}</span>
            <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}><Pretty value={v} depth={depth + 1} /></div>
          </div>
        ))}
      </div>
    );
  }
  if (value === true) return <span>Yes</span>;
  if (value === false) return <span style={{ color: BRAND.grey }}>No</span>;
  if (value === '' || value == null) return <span style={{ color: BRAND.greyLight }}>empty</span>;
  return <span>{String(value)}</span>;
}

function Badge({ color, children }) {
  return <span style={{ background: `${color}1a`, color, fontWeight: 800, fontSize: 11, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>{children}</span>;
}

function Panel({ title, children }) {
  return (
    <section style={{ background: BRAND.white, borderRadius: 14, padding: '18px 20px', marginTop: 16, border: `1px solid ${BRAND.greyLight}` }}>
      <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>{title}</h2>
      {children}
    </section>
  );
}

export default function AdminWebsites({ password, onBack, showToast }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const api = useCallback(async (path, options = {}) => {
    const res = await fetch(path, { ...options, headers: { ...(options.headers || {}), 'x-admin-password': password, 'Content-Type': 'application/json' } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(res.status === 401 ? 'Not allowed. Check WEBSITE_ADMIN_PASSWORD matches your admin password.' : json.error || 'Request failed.');
    return json;
  }, [password]);

  const load = useCallback(() => {
    setError('');
    api('/api/websites/admin/list').then((j) => setRows(j.submissions)).catch((e) => setError(e.message));
  }, [api]);
  useEffect(load, [load]);

  const counts = useMemo(() => {
    const c = { all: rows?.length || 0, unpaid: 0, new: 0, in_progress: 0, awaiting_approval: 0, live: 0 };
    rows?.forEach((r) => { c[r.status] += 1; if (r.payment_status !== 'paid') c.unpaid += 1; });
    return c;
  }, [rows]);

  const shown = useMemo(() => (rows || []).filter((r) => {
    if (filter === 'unpaid' ? r.payment_status === 'paid' : filter !== 'all' && r.status !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || `${r.businessName} ${r.client_name} ${r.client_email}`.toLowerCase().includes(q);
  }), [rows, filter, query]);

  if (openId) {
    return <Detail id={openId} api={api} showToast={showToast} onBack={() => { setOpenId(null); load(); }} />;
  }

  const stat = (key, label, color) => (
    <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)}
      style={{ flex: '1 1 120px', textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', background: filter === key ? `${color}14` : BRAND.white, border: `2px solid ${filter === key ? color : BRAND.greyLight}` }}>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 900, color }}>{counts[key]}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: BRAND.grey, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
    </button>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.grey, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 }}>← Back to Admin</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, color: BRAND.black, fontWeight: 800, margin: 0 }}>Website Briefs</h1>
          <p style={{ fontSize: 13, color: BRAND.grey, margin: '4px 0 0' }}>R{PRICE_ZAR} one page websites. Open a brief to export it for Claude Code.</p>
        </div>
        <a href="/websites" target="_blank" rel="noreferrer" className="ll-btn ll-btn-outline ll-btn-sm" style={{ textDecoration: 'none' }}>Open client form ↗</a>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {stat('new', 'New', STATUS_COLOR.new)}
        {stat('in_progress', 'In progress', STATUS_COLOR.in_progress)}
        {stat('awaiting_approval', 'Awaiting approval', STATUS_COLOR.awaiting_approval)}
        {stat('live', 'Live', STATUS_COLOR.live)}
        {stat('unpaid', 'Unpaid', '#dc2626')}
      </div>

      <input className="ll-input" placeholder="Search business, client or email" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 16 }} />

      {error && <p role="alert" style={{ color: '#dc2626', fontWeight: 700, fontSize: 14 }}>{error}</p>}
      {!rows && !error && <p style={{ color: BRAND.grey, textAlign: 'center', padding: 40 }}>Loading briefs...</p>}
      {rows && !shown.length && <p style={{ color: BRAND.grey, textAlign: 'center', padding: 40 }}>{rows.length ? 'Nothing matches that filter.' : 'No briefs yet. They appear here when someone submits the form at /websites.'}</p>}
      {shown.map((r) => (
        <div key={r.id} className="admin-row" style={{ cursor: 'pointer' }} onClick={() => setOpenId(r.id)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: BRAND.black, fontSize: 14 }}>{r.businessName || '(no business name)'}</div>
            <div style={{ fontSize: 12, color: BRAND.grey }}>{r.client_name} · {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
            <Badge color={r.payment_status === 'paid' ? '#16a34a' : '#dc2626'}>{r.payment_status === 'paid' ? 'PAID' : 'UNPAID'}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function Detail({ id, api, showToast, onBack }) {
  const [row, setRow] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api(`/api/websites/admin/${id}`).then((j) => setRow(j.submission)).catch((e) => setError(e.message));
  }, [api, id]);

  const files = useMemo(() => (row ? collectFiles(row.answers) : []), [row]);

  async function patch(body, msg) {
    setBusy('save');
    try {
      await api(`/api/websites/admin/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setRow((r) => ({ ...r, ...body }));
      showToast(msg || 'Saved');
    } catch (e) { showToast(e.message); } finally { setBusy(''); }
  }

  function downloadMd() {
    saveBlob(new Blob([row.generated_prompt], { type: 'text/markdown' }), `${slugOf(row.answers)}-website-brief.md`);
    showToast('Downloaded. Import it into Claude Code.');
  }

  async function copyPrompt() {
    try { await navigator.clipboard.writeText(row.generated_prompt); showToast('Prompt copied'); } catch { showToast('Could not copy. Use Download .md instead.'); }
  }

  async function downloadZip() {
    setBusy('zip');
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (const f of files) zip.file(`assets/${fileName(f)}`, await (await fetch(f.url)).blob());
      zip.file('prompt.md', row.generated_prompt);
      zip.file('settings.json', JSON.stringify(row.settings_json, null, 2));
      saveBlob(await zip.generateAsync({ type: 'blob' }), `${slugOf(row.answers)}-assets.zip`);
    } catch { showToast('Could not build the zip.'); } finally { setBusy(''); }
  }

  async function downloadOne(f) {
    setBusy(f.url);
    try { saveBlob(await (await fetch(f.url)).blob(), fileName(f)); } catch { showToast('Download failed.'); } finally { setBusy(''); }
  }

  async function remove() {
    if (!confirm(`Permanently delete the brief for ${row.answers.about.businessName}, including its uploaded files? This cannot be undone.`)) return;
    try { await api(`/api/websites/admin/${id}`, { method: 'DELETE' }); showToast('Brief deleted'); onBack(); } catch (e) { showToast(e.message); }
  }

  const wa = row ? `https://wa.me/${String(row.client_phone).replace(/\D/g, '').replace(/^0/, '27')}?text=${encodeURIComponent(`Hi ${row.client_name.split(' ')[0]}, thanks for your website details for ${row.answers.about.businessName}! `)}` : '';

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.grey, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 }}>← Back to Website Briefs</button>
      {error && <p role="alert" style={{ color: '#dc2626', fontWeight: 700 }}>{error}</p>}
      {!row && !error && <p style={{ color: BRAND.grey }}>Loading...</p>}
      {row && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 800, margin: 0 }}>{row.answers.about.businessName}</h1>
              <div style={{ fontSize: 13, color: BRAND.grey, marginTop: 4 }}>
                {row.client_name} · <a href={`mailto:${row.client_email}`} style={{ color: BRAND.teal }}>{row.client_email}</a> · {row.client_phone} · {new Date(row.created_at).toLocaleString('en-ZA')}
              </div>
            </div>
            <select aria-label="Status" className="ll-input" value={row.status} disabled={busy === 'save'} onChange={(e) => patch({ status: e.target.value }, 'Status updated')}
              style={{ width: 'auto', fontWeight: 700, border: `2px solid ${STATUS_COLOR[row.status]}` }}>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '12px 16px', borderRadius: 12, marginBottom: 16, background: row.payment_status === 'paid' ? '#dcfce7' : '#fef3c7', color: row.payment_status === 'paid' ? '#166534' : '#92400e', fontSize: 13.5, fontWeight: 600 }}>
            <span style={{ flex: 1, minWidth: 200 }}>{row.payment_status === 'paid' ? `Paid. You can start building.` : `Not paid yet. Send your R${PRICE_ZAR} payment link before starting.`}</span>
            <a className="ll-btn ll-btn-outline ll-btn-sm" href={wa} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>WhatsApp client</a>
            <button className="ll-btn ll-btn-outline ll-btn-sm" disabled={busy === 'save'}
              onClick={() => patch({ payment_status: row.payment_status === 'paid' ? 'unpaid' : 'paid' }, row.payment_status === 'paid' ? 'Marked unpaid' : 'Marked paid')}>
              {row.payment_status === 'paid' ? 'Mark unpaid' : 'Mark as paid'}
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button className="ll-btn ll-btn-primary" onClick={downloadMd}>Download .md for Claude Code</button>
            <button className="ll-btn ll-btn-outline" onClick={copyPrompt}>Copy prompt</button>
            <button className="ll-btn ll-btn-outline" onClick={downloadZip} disabled={busy === 'zip'}>{busy === 'zip' ? 'Building zip...' : 'Download all assets (zip)'}</button>
          </div>

          <Panel title={`Uploaded files (${files.length})`}>
            {!files.length && <span style={{ color: BRAND.grey, fontSize: 13 }}>No files uploaded.</span>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {files.map((f) => (
                <div key={f.url} style={{ border: `1px solid ${BRAND.greyLight}`, borderRadius: 10, padding: 8 }}>
                  <img src={f.url} alt={f.role} style={{ width: '100%', height: 100, objectFit: 'contain', background: BRAND.offWhite, borderRadius: 6 }} />
                  <div style={{ fontSize: 12, fontWeight: 700, margin: '6px 0' }}>{f.role}</div>
                  <button className="ll-btn ll-btn-outline ll-btn-sm" style={{ width: '100%' }} disabled={busy === f.url} onClick={() => downloadOne(f)}>{busy === f.url ? '...' : 'Download'}</button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Generated brief (this is the .md file)">
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12.5, background: BRAND.offWhite, padding: 14, borderRadius: 10, maxHeight: 380, overflow: 'auto', margin: 0 }}>{row.generated_prompt}</pre>
          </Panel>

          <Panel title="All answers"><Pretty value={row.answers} /></Panel>

          <div style={{ marginTop: 28, textAlign: 'right' }}>
            <button className="ll-btn ll-btn-outline ll-btn-sm" style={{ color: '#dc2626' }} onClick={remove}>Delete this brief</button>
          </div>
        </>
      )}
    </div>
  );
}
