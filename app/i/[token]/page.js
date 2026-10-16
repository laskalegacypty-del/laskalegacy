'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as db from '@/lib/supabase';
import { lineTotal, lineSaving, formatZAR, buildAndDownloadInvoicePdf } from '@/lib/invoicePdf';

const BANK = {
  bank: "FNB",
  type: "First Business Zero",
  account: "63196690804",
};

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setValue(target); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function CopyRow({ label, value, display }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt(`Copy ${label}:`, value);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className="li-copy" onClick={copy} aria-label={`Copy ${label}`}>
      <span className="li-copy-text">
        <span className="li-copy-label">{label}</span>
        <span className="li-copy-value">{display || value}</span>
      </span>
      <span className={`li-copy-pill ${copied ? "done" : ""}`}>{copied ? "Copied ✓" : "Copy"}</span>
    </button>
  );
}

export default function DigitalInvoicePage({ params }) {
  const token = params.token;
  const [state, setState] = useState("loading"); // loading | ready | missing
  const [invoice, setInvoice] = useState(null);
  const [open, setOpen] = useState(null);
  const [downloading, setDownloading] = useState("idle"); // idle | busy | done | error
  const [burst, setBurst] = useState(0);
  const [shareMsg, setShareMsg] = useState("");
  const cardRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!db.isSupabaseConfigured()) { setState("missing"); return; }
      const inv = await db.loadManualInvoiceByToken(token);
      if (!inv) { setState("missing"); return; }
      setInvoice(inv);
      setState("ready");
    })();
  }, [token]);

  const items = invoice?.items || [];
  const total = invoice ? Number(invoice.total) || 0 : 0;
  const saved = useMemo(() => items.reduce((s, it) => s + lineSaving(it), 0), [items]);
  const animatedTotal = useCountUp(state === "ready" ? total : 0);
  const animatedSaved = useCountUp(state === "ready" ? saved : 0, 1800);

  const dateLabel = invoice
    ? new Date(invoice.invoice_date).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const onTilt = (e) => {
    const el = cardRef.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${x * 7}deg`);
    el.style.setProperty("--rx", `${-y * 7}deg`);
    el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };
  const resetTilt = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };

  const handleDownload = async () => {
    if (downloading === "busy") return;
    setDownloading("busy");
    try {
      await buildAndDownloadInvoicePdf(invoice.invoice_number, items, total, invoice.invoice_date, {
        name: invoice.customer_name, phone: invoice.customer_phone, email: invoice.customer_email,
      });
      setDownloading("done");
      setBurst(b => b + 1);
      setTimeout(() => setDownloading("idle"), 2600);
    } catch (err) {
      console.error(err);
      setDownloading("error");
      setTimeout(() => setDownloading("idle"), 3000);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Invoice #${invoice.invoice_number} — Laska Legacy`, url }); } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg("Link copied ✓");
    } catch {
      window.prompt("Copy this link:", url);
    }
    setTimeout(() => setShareMsg(""), 1800);
  };

  return (
    <div className="li-root">
      <style>{css}</style>
      <div className="li-bg" aria-hidden="true">
        <span className="li-orb li-orb-a" />
        <span className="li-orb li-orb-b" />
        <span className="li-grid" />
      </div>

      <main className="li-wrap">
        <header className="li-brand">
          <img src="/logo-white.png" alt="Laska Legacy" />
        </header>

        {state === "loading" && (
          <div className="li-card li-skeleton" aria-busy="true">
            <span className="li-sk li-sk-s" />
            <span className="li-sk li-sk-l" />
            <span className="li-sk li-sk-m" />
          </div>
        )}

        {state === "missing" && (
          <div className="li-card li-missing">
            <div className="li-missing-icon">🐴</div>
            <h1>We couldn’t find that invoice</h1>
            <p>The link may be incomplete or out of date. Please get in touch and we’ll send you a fresh one.</p>
            <a className="li-btn li-btn-ghost" href="mailto:laskalegacy@gmail.com">laskalegacy@gmail.com</a>
          </div>
        )}

        {state === "ready" && (
          <>
            <section
              ref={cardRef}
              className="li-card li-hero"
              onPointerMove={onTilt}
              onPointerLeave={resetTilt}
            >
              <span className="li-glare" aria-hidden="true" />
              <div className="li-hero-top">
                <div>
                  <div className="li-eyebrow">Invoice</div>
                  <div className="li-number">#{invoice.invoice_number}</div>
                </div>
                <div className="li-date">
                  <span className="li-eyebrow">Issued</span>
                  <span>{dateLabel}</span>
                </div>
              </div>

              <div className="li-total-label">Amount due</div>
              <div className="li-total" aria-label={formatZAR(total)}>{formatZAR(animatedTotal)}</div>

              {saved > 0 && (
                <div className="li-saved">
                  <span className="li-saved-spark">✦</span> You’re saving {formatZAR(animatedSaved)} with your discount
                </div>
              )}

              {(invoice.customer_name || invoice.customer_phone || invoice.customer_email) && (
                <div className="li-billed">
                  <div className="li-eyebrow">Billed to</div>
                  {invoice.customer_name && <div className="li-billed-name">{invoice.customer_name}</div>}
                  {invoice.customer_phone && <div>{invoice.customer_phone}</div>}
                  {invoice.customer_email && <div>{invoice.customer_email}</div>}
                </div>
              )}
            </section>

            <section className="li-card">
              <div className="li-section-head">
                <h2>What’s included</h2>
                <span className="li-count">{items.length} item{items.length !== 1 ? "s" : ""}</span>
              </div>
              <ul className="li-items">
                {items.map((it, i) => {
                  const isOpen = open === i;
                  const hasDisc = Number(it.discount) > 0;
                  return (
                    <li key={i} className={`li-item ${isOpen ? "open" : ""}`} style={{ animationDelay: `${0.25 + i * 0.07}s` }}>
                      <button className="li-item-row" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                        <span className="li-item-main">
                          <span className="li-item-name">{it.name}</span>
                          <span className="li-item-sub">
                            {it.quantity} × {formatZAR(it.price)}
                            {hasDisc && <span className="li-tag">−{it.discount}%</span>}
                          </span>
                        </span>
                        <span className="li-item-amt">{formatZAR(lineTotal(it))}</span>
                        <span className="li-chevron" aria-hidden="true">⌄</span>
                      </button>
                      <div className="li-item-detail" aria-hidden={!isOpen}>
                        <div className="li-detail-inner">
                          <div className="li-detail-line"><span>Quantity</span><span>{it.quantity}</span></div>
                          <div className="li-detail-line"><span>Unit price</span><span>{formatZAR(it.price)}</span></div>
                          <div className="li-detail-line"><span>Subtotal</span><span>{formatZAR(it.quantity * it.price)}</span></div>
                          {hasDisc && (
                            <div className="li-detail-line li-detail-disc">
                              <span>Discount ({it.discount}%)</span><span>−{formatZAR(lineSaving(it))}</span>
                            </div>
                          )}
                          <div className="li-detail-line li-detail-total"><span>Line total</span><span>{formatZAR(lineTotal(it))}</span></div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="li-sum">
                {saved > 0 && (
                  <div className="li-sum-line"><span>Discounts</span><span className="li-green">−{formatZAR(saved)}</span></div>
                )}
                <div className="li-sum-line li-sum-total"><span>Total</span><span>{formatZAR(total)}</span></div>
              </div>
            </section>

            <section className="li-card">
              <div className="li-section-head"><h2>How to pay</h2></div>
              <p className="li-muted">EFT to our {BANK.bank} account. Tap a line to copy it.</p>
              <div className="li-copy-list">
                <CopyRow label="Bank" value={`${BANK.bank} ${BANK.type}`} />
                <CopyRow label="Account number" value={BANK.account} display={BANK.account.replace(/(\d{3})(?=\d)/g, "$1 ")} />
                <CopyRow label="Reference" value={String(invoice.invoice_number)} display={`Invoice ${invoice.invoice_number}`} />
                <CopyRow label="Amount" value={(Math.round(total * 100) / 100).toFixed(2)} display={formatZAR(total)} />
              </div>
            </section>

            <div className="li-actions">
              <button
                className={`li-btn li-btn-primary ${downloading}`}
                onClick={handleDownload}
                disabled={downloading === "busy"}
              >
                {downloading === "busy" && <span className="li-spin" />}
                {downloading === "idle" && "↓  Download PDF"}
                {downloading === "busy" && "Preparing your PDF…"}
                {downloading === "done" && "✓  Downloaded"}
                {downloading === "error" && "Something went wrong — tap to retry"}
                {burst > 0 && downloading === "done" && (
                  <span className="li-confetti" key={burst} aria-hidden="true">
                    {Array.from({ length: 18 }).map((_, k) => (
                      <i key={k} style={{ "--a": `${(k / 18) * 360}deg`, "--d": `${60 + (k % 4) * 14}px`, "--c": ["#0097b2", "#5e17eb", "#ffffff", "#7be0f2"][k % 4] }} />
                    ))}
                  </span>
                )}
              </button>
              <button className="li-btn li-btn-ghost" onClick={handleShare}>
                {shareMsg || "Share"}
              </button>
            </div>

            <footer className="li-foot">
              <p>Thank you for your business — and from all of us (horses included).</p>
              <p className="li-foot-small">Laska Legacy · Plot 50 Buffeldooring, Potchefstroom · 072 585 8288 · laskalegacy@gmail.com</p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

const css = `
.li-root{--teal:#0097b2;--purple:#5e17eb;--ink:#07050f;--glass:rgba(255,255,255,0.06);--line:rgba(255,255,255,0.12);--muted:rgba(255,255,255,0.62);
  position:relative;min-height:100vh;background:var(--ink);color:#fff;font-family:'Inter',system-ui,-apple-system,sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased}
.li-root *{box-sizing:border-box}
.li-bg{position:fixed;inset:0;pointer-events:none;z-index:0}
.li-orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55}
.li-orb-a{width:520px;height:520px;background:var(--purple);top:-160px;right:-140px;animation:li-float 14s ease-in-out infinite}
.li-orb-b{width:460px;height:460px;background:var(--teal);bottom:-180px;left:-160px;animation:li-float 17s ease-in-out infinite reverse}
.li-grid{position:absolute;inset:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:44px 44px;opacity:.12;mask-image:radial-gradient(ellipse at 50% 20%,#000,transparent 70%);-webkit-mask-image:radial-gradient(ellipse at 50% 20%,#000,transparent 70%)}
@keyframes li-float{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,30px)}}
.li-wrap{position:relative;z-index:1;max-width:560px;margin:0 auto;padding:28px 16px 56px;display:flex;flex-direction:column;gap:16px}
.li-brand{text-align:center;padding:8px 0 4px;animation:li-up .7s both}
.li-brand img{height:42px}
.li-card{background:var(--glass);border:1px solid var(--line);border-radius:22px;padding:22px;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);animation:li-up .7s both}
.li-card:nth-of-type(2){animation-delay:.1s}.li-card:nth-of-type(3){animation-delay:.2s}
@keyframes li-up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}

.li-hero{--rx:0deg;--ry:0deg;--gx:50%;--gy:0%;position:relative;overflow:hidden;transform:perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));transition:transform .25s ease-out;
  background:linear-gradient(145deg,rgba(94,23,235,.35),rgba(0,151,178,.22) 60%,rgba(255,255,255,.05))}
.li-glare{position:absolute;inset:0;background:radial-gradient(420px circle at var(--gx) var(--gy),rgba(255,255,255,.16),transparent 55%);pointer-events:none}
.li-hero-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:26px;position:relative}
.li-eyebrow{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;color:var(--muted)}
.li-number{font-family:'Montserrat','Inter',sans-serif;font-size:30px;font-weight:800;margin-top:2px}
.li-date{display:flex;flex-direction:column;align-items:flex-end;font-size:14px;font-weight:600;gap:2px;text-align:right}
.li-total-label{font-size:13px;color:var(--muted);font-weight:600;position:relative}
.li-total{font-family:'Montserrat','Inter',sans-serif;font-size:clamp(40px,12vw,58px);font-weight:800;letter-spacing:-1px;line-height:1.1;font-variant-numeric:tabular-nums;position:relative;
  background:linear-gradient(90deg,#fff,#a8ecf7);-webkit-background-clip:text;background-clip:text;color:transparent}
.li-saved{margin-top:14px;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#7ef0b6;background:rgba(46,204,113,.14);border:1px solid rgba(126,240,182,.3);padding:8px 14px;border-radius:100px;position:relative;font-variant-numeric:tabular-nums}
.li-saved-spark{animation:li-pulse 2s ease-in-out infinite}
@keyframes li-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:.7}}
.li-billed{margin-top:22px;padding-top:18px;border-top:1px solid var(--line);font-size:14px;color:var(--muted);display:flex;flex-direction:column;gap:2px;position:relative}
.li-billed .li-eyebrow{margin-bottom:6px}
.li-billed-name{color:#fff;font-weight:700;font-size:16px}

.li-section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.li-section-head h2{margin:0;font-family:'Montserrat','Inter',sans-serif;font-size:16px;font-weight:800}
.li-count{font-size:12px;color:var(--muted);font-weight:600}
.li-muted{margin:0 0 14px;font-size:13px;color:var(--muted)}
.li-items{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.li-item{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:14px;overflow:hidden;animation:li-up .6s both;transition:border-color .2s,background .2s}
.li-item:hover{border-color:rgba(255,255,255,.28)}
.li-item.open{background:rgba(0,151,178,.12);border-color:rgba(0,151,178,.5)}
.li-item-row{all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:12px;padding:14px;cursor:pointer}
.li-item-row:focus-visible{outline:2px solid var(--teal);outline-offset:-2px}
.li-item-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.li-item-name{font-weight:700;font-size:15px;overflow-wrap:anywhere}
.li-item-sub{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.li-tag{background:rgba(94,23,235,.45);color:#e5d8ff;font-weight:700;font-size:11px;padding:2px 8px;border-radius:100px}
.li-item-amt{font-weight:800;font-size:15px;font-variant-numeric:tabular-nums;white-space:nowrap}
.li-chevron{font-size:18px;color:var(--muted);transition:transform .3s;line-height:1}
.li-item.open .li-chevron{transform:rotate(180deg)}
.li-item-detail{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s ease}
.li-item.open .li-item-detail{grid-template-rows:1fr}
.li-detail-inner{overflow:hidden;padding:0 14px}
.li-item.open .li-detail-inner{padding-bottom:14px}
.li-detail-line{display:flex;justify-content:space-between;font-size:13px;color:var(--muted);padding:5px 0;border-top:1px dashed var(--line)}
.li-detail-disc{color:#7ef0b6}
.li-detail-total{color:#fff;font-weight:800}
.li-sum{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
.li-sum-line{display:flex;justify-content:space-between;font-size:14px;color:var(--muted);font-variant-numeric:tabular-nums}
.li-green{color:#7ef0b6}
.li-sum-total{color:#fff;font-size:19px;font-weight:800;font-family:'Montserrat','Inter',sans-serif}

.li-copy-list{display:flex;flex-direction:column;gap:8px}
.li-copy{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid var(--line);cursor:pointer;transition:transform .15s,border-color .2s,background .2s}
.li-copy:hover{border-color:var(--teal);background:rgba(0,151,178,.1)}
.li-copy:active{transform:scale(.98)}
.li-copy:focus-visible{outline:2px solid var(--teal)}
.li-copy-text{display:flex;flex-direction:column;gap:2px;min-width:0}
.li-copy-label{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-weight:700}
.li-copy-value{font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.li-copy-pill{font-size:12px;font-weight:700;padding:6px 12px;border-radius:100px;background:rgba(255,255,255,.1);flex-shrink:0;transition:background .2s,color .2s}
.li-copy-pill.done{background:#7ef0b6;color:#052e1a}

.li-actions{display:flex;gap:10px;animation:li-up .7s .3s both}
.li-btn{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:center;justify-content:center;gap:10px;padding:17px 22px;border-radius:100px;font-weight:800;font-size:15px;cursor:pointer;text-align:center;transition:transform .15s,box-shadow .25s,background .2s}
.li-btn:active{transform:scale(.97)}
.li-btn:focus-visible{outline:2px solid #fff;outline-offset:3px}
.li-btn-primary{flex:1;background:linear-gradient(90deg,var(--teal),var(--purple));box-shadow:0 10px 30px rgba(94,23,235,.35)}
.li-btn-primary:hover{box-shadow:0 14px 40px rgba(0,151,178,.45);transform:translateY(-1px)}
.li-btn-primary.busy{cursor:progress;opacity:.9}
.li-btn-primary.done{background:linear-gradient(90deg,#16a34a,#0097b2)}
.li-btn-primary.error{background:#b91c1c}
.li-btn-ghost{background:var(--glass);border:1px solid var(--line);padding-left:26px;padding-right:26px;text-decoration:none;color:#fff}
.li-btn-ghost:hover{border-color:rgba(255,255,255,.4)}
.li-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:li-rot .8s linear infinite}
@keyframes li-rot{to{transform:rotate(360deg)}}
.li-confetti{position:absolute;left:50%;top:50%;pointer-events:none}
.li-confetti i{position:absolute;width:7px;height:7px;border-radius:2px;background:var(--c);animation:li-pop .9s ease-out forwards}
@keyframes li-pop{from{transform:rotate(var(--a)) translateX(0) scale(1);opacity:1}to{transform:rotate(var(--a)) translateX(var(--d)) scale(.4);opacity:0}}

.li-foot{text-align:center;color:var(--muted);font-size:13px;margin-top:8px;animation:li-up .7s .4s both}
.li-foot p{margin:0 0 6px}
.li-foot-small{font-size:11px;opacity:.7}

.li-skeleton{display:flex;flex-direction:column;gap:14px;padding:28px}
.li-sk{display:block;border-radius:10px;background:linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.16),rgba(255,255,255,.06));background-size:200% 100%;animation:li-shim 1.4s linear infinite}
.li-sk-s{height:14px;width:30%}.li-sk-l{height:48px;width:70%}.li-sk-m{height:14px;width:50%}
@keyframes li-shim{to{background-position:-200% 0}}
.li-missing{text-align:center;padding:40px 24px;display:flex;flex-direction:column;align-items:center;gap:10px}
.li-missing-icon{font-size:44px}
.li-missing h1{margin:0;font-family:'Montserrat','Inter',sans-serif;font-size:20px}
.li-missing p{margin:0 0 10px;color:var(--muted);font-size:14px;max-width:340px}

@media (prefers-reduced-motion:reduce){
  .li-root *,.li-root *::before,.li-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
@media print{
  .li-bg,.li-actions,.li-copy-pill{display:none!important}
  .li-root{background:#fff;color:#000}
}
`;
