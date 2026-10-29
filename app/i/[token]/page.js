'use client';

import { useEffect, useMemo, useState } from 'react';
import * as db from '@/lib/supabase';
import { lineTotal, lineSaving, formatZAR, buildAndDownloadInvoicePdf } from '@/lib/invoicePdf';

const BANK = {
  bank: "FNB",
  type: "First Business Zero",
  account: "63196690804",
};

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
        <span className="li-eyebrow li-eyebrow-grey">{label}</span>
        <span className="li-copy-value">{display || value}</span>
      </span>
      <span className={`li-pill ${copied ? "done" : ""}`}>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export default function DigitalInvoicePage({ params }) {
  const token = params.token;
  const [state, setState] = useState("loading"); // loading | ready | missing
  const [invoice, setInvoice] = useState(null);
  const [open, setOpen] = useState(null);
  const [downloading, setDownloading] = useState("idle"); // idle | busy | done | error
  const [shareMsg, setShareMsg] = useState("");

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

  const dateLabel = invoice
    ? new Date(invoice.invoice_date).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const handleDownload = async () => {
    if (downloading === "busy") return;
    setDownloading("busy");
    try {
      await buildAndDownloadInvoicePdf(invoice.invoice_number, items, total, invoice.invoice_date, {
        name: invoice.customer_name, phone: invoice.customer_phone, email: invoice.customer_email,
      });
      setDownloading("done");
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
      setShareMsg("Link copied");
    } catch {
      window.prompt("Copy this link:", url);
    }
    setTimeout(() => setShareMsg(""), 1800);
  };

  const hasCustomer = invoice && (invoice.customer_name || invoice.customer_phone || invoice.customer_email);

  return (
    <div className="li-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav className="li-nav">
        <div className="li-nav-inner">
          <img src="/logo-white.png" alt="Laska Legacy" />
          <div>
            <div className="li-wordmark">LASKA LEGACY</div>
            <div className="li-tagline">Leather &amp; Canvas</div>
          </div>
        </div>
      </nav>

      {state === "loading" && (
        <>
          <section className="li-hero"><div className="li-hero-inner li-hero-loading">Loading</div></section>
        </>
      )}

      {state === "missing" && (
        <main className="li-body">
          <div className="li-card li-missing">
            <div className="li-eyebrow li-eyebrow-teal">Invoice</div>
            <h1>We couldn’t find that invoice</h1>
            <p>The link may be incomplete or out of date. Please get in touch and we’ll send you a fresh one.</p>
            <a className="li-btn li-btn-outline" href="mailto:laskalegacy@gmail.com">laskalegacy@gmail.com</a>
          </div>
        </main>
      )}

      {state === "ready" && (
        <>
          <section className="li-hero">
            <div className="li-hero-glow" aria-hidden="true" />
            <div className="li-hero-inner li-fade">
              <div className="li-eyebrow li-eyebrow-teal">Invoice</div>
              <h1 className="li-h1">#{invoice.invoice_number}</h1>
              <div className="li-hero-date">Issued {dateLabel}</div>

              <div className="li-due">
                <div className="li-eyebrow li-eyebrow-light">Amount due</div>
                <div className="li-due-amount">{formatZAR(total)}</div>
              </div>

              {saved > 0 && (
                <div className="li-saved">Discount applied &middot; you saved {formatZAR(saved)}</div>
              )}
            </div>
          </section>

          <main className="li-body">
            {hasCustomer && (
              <section className="li-card li-fade">
                <div className="li-eyebrow li-eyebrow-purple">Billed to</div>
                {invoice.customer_name && <div className="li-billed-name">{invoice.customer_name}</div>}
                {invoice.customer_phone && <div className="li-billed-line">{invoice.customer_phone}</div>}
                {invoice.customer_email && <div className="li-billed-line">{invoice.customer_email}</div>}
              </section>
            )}

            <section className="li-card li-fade">
              <div className="li-section-head">
                <div>
                  <div className="li-eyebrow li-eyebrow-teal">Your order</div>
                  <h2>What’s included</h2>
                </div>
                <span className="li-count">{items.length} item{items.length !== 1 ? "s" : ""}</span>
              </div>

              <ul className="li-items">
                {items.map((it, i) => {
                  const isOpen = open === i;
                  const hasDisc = Number(it.discount) > 0;
                  return (
                    <li key={i} className={`li-item ${isOpen ? "open" : ""}`}>
                      <button className="li-item-row" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                        <span className="li-item-main">
                          <span className="li-item-name">{it.name}</span>
                          <span className="li-item-sub">
                            {it.quantity} &times; {formatZAR(it.price)}
                            {hasDisc && <span className="li-tag">{it.discount}% off</span>}
                          </span>
                        </span>
                        <span className="li-item-amt">{formatZAR(lineTotal(it))}</span>
                        <span className="li-chevron" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                        </span>
                      </button>
                      <div className="li-item-detail" aria-hidden={!isOpen}>
                        <div className="li-detail-inner">
                          <div className="li-detail-line"><span>Quantity</span><span>{it.quantity}</span></div>
                          <div className="li-detail-line"><span>Unit price</span><span>{formatZAR(it.price)}</span></div>
                          <div className="li-detail-line"><span>Subtotal</span><span>{formatZAR(it.quantity * it.price)}</span></div>
                          {hasDisc && (
                            <div className="li-detail-line li-detail-disc">
                              <span>Discount ({it.discount}%)</span><span>&minus;{formatZAR(lineSaving(it))}</span>
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
                  <div className="li-sum-line"><span>Discounts</span><span className="li-sum-disc">&minus;{formatZAR(saved)}</span></div>
                )}
                <div className="li-sum-line li-sum-total"><span>Total</span><span>{formatZAR(total)}</span></div>
              </div>
            </section>

            <section className="li-card li-fade">
              <div className="li-eyebrow li-eyebrow-purple">Payment</div>
              <h2 className="li-h2-spaced">How to pay</h2>
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
                {downloading === "idle" && "Download PDF"}
                {downloading === "busy" && "Preparing your PDF…"}
                {downloading === "done" && "Downloaded"}
                {downloading === "error" && "Something went wrong — tap to retry"}
              </button>
              <button className="li-btn li-btn-outline" onClick={handleShare}>
                {shareMsg || "Share"}
              </button>
            </div>
          </main>
        </>
      )}

      <footer className="li-footer">
        <img src="/logo-white.png" alt="" />
        <p className="li-footer-thanks">We appreciate your business, and so do our horses.</p>
        <p>Plot 50 Buffeldooring, Potchefstroom</p>
        <p>072 585 8288 &middot; laskalegacy@gmail.com</p>
      </footer>
    </div>
  );
}

const css = `
.li-root{--teal:#0097b2;--teal-dark:#007a91;--teal-light:#e6f6f9;--purple:#5e17eb;--purple-light:#f0e8fd;--black:#000;--off:#f7f8fa;--grey:#6b7280;--line:#e5e7eb;--hair:rgba(0,0,0,.06);
  min-height:100vh;display:flex;flex-direction:column;background:var(--off);color:var(--black);font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.li-root *{box-sizing:border-box}
.li-root h1,.li-root h2,.li-root p{margin:0}

.li-nav{background:var(--black);position:sticky;top:0;z-index:10}
.li-nav-inner{max-width:1200px;margin:0 auto;padding:0 24px;height:68px;display:flex;align-items:center;gap:12px}
.li-nav-inner img{height:38px}
.li-wordmark{font-family:'Montserrat',sans-serif;font-size:17px;font-weight:800;color:#fff;line-height:1;letter-spacing:1px}
.li-tagline{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--teal);margin-top:2px;font-weight:600}

.li-hero{position:relative;overflow:hidden;background:var(--black);padding:64px 24px 72px;text-align:center}
.li-hero-glow{position:absolute;inset:0;opacity:.08;background:radial-gradient(ellipse at 30% 50%,var(--teal),transparent 60%),radial-gradient(ellipse at 70% 50%,var(--purple),transparent 60%)}
.li-hero-inner{position:relative;max-width:620px;margin:0 auto}
.li-hero-loading{color:rgba(255,255,255,.6);font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700;padding:40px 0}
.li-h1{font-family:'Montserrat',sans-serif;font-size:clamp(36px,7vw,56px);font-weight:900;color:#fff;letter-spacing:-1px;line-height:1.1;margin-top:10px}
.li-hero-date{color:rgba(255,255,255,.5);font-size:14px;margin-top:10px}
.li-due{margin-top:36px;padding-top:28px;border-top:1px solid rgba(255,255,255,.12)}
.li-due-amount{font-family:'Montserrat',sans-serif;font-size:clamp(34px,8vw,48px);font-weight:800;color:var(--teal);margin-top:8px;font-variant-numeric:tabular-nums}
.li-saved{display:inline-block;margin-top:18px;background:var(--teal-light);color:var(--teal-dark);font-size:12.5px;font-weight:700;letter-spacing:.5px;padding:7px 16px;border-radius:100px}

.li-eyebrow{font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700}
.li-eyebrow-teal{color:var(--teal)}
.li-eyebrow-purple{color:var(--purple)}
.li-eyebrow-light{color:rgba(255,255,255,.55)}
.li-eyebrow-grey{color:var(--grey);letter-spacing:2px;font-size:10px}

.li-body{width:100%;max-width:640px;margin:0 auto;padding:40px 16px 8px;display:flex;flex-direction:column;gap:20px;flex:1}
.li-card{background:#fff;border:1px solid var(--hair);border-radius:10px;padding:26px}
.li-fade{animation:li-fade .6s ease both}
@keyframes li-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

.li-billed-name{font-family:'Montserrat',sans-serif;font-size:19px;font-weight:800;margin-top:10px}
.li-billed-line{font-size:14px;color:var(--grey);margin-top:3px}

.li-section-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px}
.li-section-head h2,.li-h2-spaced{font-family:'Montserrat',sans-serif;font-size:22px;font-weight:800;margin-top:8px}
.li-count{font-size:12px;color:var(--grey);font-weight:600;padding-bottom:3px}
.li-muted{font-size:14px;color:var(--grey);margin:6px 0 18px}

.li-items{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.li-item{border-bottom:1px solid var(--line)}
.li-item-row{all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:14px;padding:16px 2px;cursor:pointer;transition:color .2s}
.li-item-row:hover .li-item-name{color:var(--teal-dark)}
.li-item-row:focus-visible{outline:2px solid var(--teal);outline-offset:2px;border-radius:4px}
.li-item-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.li-item-name{font-family:'Montserrat',sans-serif;font-size:16px;font-weight:700;overflow-wrap:anywhere;transition:color .2s}
.li-item-sub{font-size:13px;color:var(--grey);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.li-tag{background:var(--purple-light);color:var(--purple);font-size:11px;font-weight:700;letter-spacing:.5px;padding:2px 9px;border-radius:100px}
.li-item-amt{font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;font-variant-numeric:tabular-nums;white-space:nowrap}
.li-chevron{display:flex;color:var(--grey);transition:transform .3s}
.li-item.open .li-chevron{transform:rotate(180deg);color:var(--teal)}
.li-item-detail{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s ease}
.li-item.open .li-item-detail{grid-template-rows:1fr}
.li-detail-inner{overflow:hidden;background:var(--off);border-radius:8px}
.li-item.open .li-detail-inner{margin-bottom:16px;padding:6px 16px}
.li-detail-line{display:flex;justify-content:space-between;font-size:13.5px;color:var(--grey);padding:9px 0;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}
.li-detail-line:last-child{border-bottom:none}
.li-detail-disc{color:var(--purple);font-weight:600}
.li-detail-total{color:var(--black);font-weight:800}

.li-sum{margin-top:20px;display:flex;flex-direction:column;gap:8px}
.li-sum-line{display:flex;justify-content:space-between;font-size:14px;color:var(--grey);font-variant-numeric:tabular-nums}
.li-sum-disc{color:var(--purple);font-weight:600}
.li-sum-total{margin-top:6px;padding:16px 18px;background:var(--teal-light);border-radius:10px;color:var(--teal-dark);font-family:'Montserrat',sans-serif;font-size:18px;font-weight:800}

.li-copy-list{display:flex;flex-direction:column;gap:10px}
.li-copy{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-radius:10px;background:#fff;border:1px solid var(--hair);cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s}
.li-copy:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,.08);border-color:var(--teal)}
.li-copy:focus-visible{outline:2px solid var(--teal);outline-offset:2px}
.li-copy-text{display:flex;flex-direction:column;gap:3px;min-width:0}
.li-copy-value{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.li-pill{flex-shrink:0;font-size:12px;font-weight:700;padding:6px 14px;border-radius:100px;background:var(--teal-light);color:var(--teal-dark);transition:background .2s,color .2s}
.li-pill.done{background:var(--teal);color:#fff}

.li-actions{display:flex;gap:12px;margin-top:4px}
.li-btn{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:10px;padding:16px 28px;border-radius:100px;font-size:15px;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;transition:transform .2s,box-shadow .2s,background .2s,color .2s}
.li-btn:focus-visible{outline:2px solid var(--teal);outline-offset:3px}
.li-btn-primary{flex:1;background:var(--teal);color:#fff}
.li-btn-primary:hover{background:var(--teal-dark);transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,151,178,.3)}
.li-btn-primary.busy{cursor:progress;opacity:.85}
.li-btn-primary.error{background:#dc2626}
.li-btn-outline{background:#fff;border:1px solid var(--line);color:var(--black)}
.li-btn-outline:hover{border-color:var(--teal);color:var(--teal-dark)}
.li-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;animation:li-rot .8s linear infinite}
@keyframes li-rot{to{transform:rotate(360deg)}}

.li-missing{text-align:center;padding:48px 28px;display:flex;flex-direction:column;align-items:center;gap:12px}
.li-missing h1{font-family:'Montserrat',sans-serif;font-size:24px;font-weight:800}
.li-missing p{color:var(--grey);font-size:14px;max-width:360px;margin-bottom:8px}

.li-footer{background:var(--black);color:rgba(255,255,255,.5);padding:48px 24px;margin-top:56px;text-align:center;font-size:13px}
.li-footer img{height:36px;margin-bottom:16px;opacity:.9}
.li-footer p{margin-top:4px}
.li-footer .li-footer-thanks{font-family:'Montserrat',sans-serif;color:#fff;font-weight:700;font-size:15px;margin-bottom:14px}

@media (max-width:480px){
  .li-card{padding:20px}
  .li-actions{flex-direction:column}
  .li-hero{padding:48px 20px 56px}
}
@media (prefers-reduced-motion:reduce){
  .li-root *{animation:none!important;transition:none!important}
}
@media print{
  .li-nav,.li-actions,.li-pill{display:none!important}
  .li-hero{padding:24px}
}
`;
