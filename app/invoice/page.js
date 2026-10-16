'use client';

import { useEffect, useMemo, useState } from 'react';
import * as db from '@/lib/supabase';
import { lineTotal, formatZAR, buildAndDownloadInvoicePdf } from '@/lib/invoicePdf';

const BRAND = {
  teal: "#0097b2", purple: "#5e17eb", black: "#000000", white: "#ffffff",
  offWhite: "#f7f8fa", tealDark: "#007a91", tealLight: "#e6f6f9",
  purpleLight: "#f0e8fd", grey: "#6b7280", greyLight: "#e5e7eb",
};

function parsePrice(s) { return parseFloat(String(s || "0").replace(/[^0-9.]/g, "")) || 0; }

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function InvoicePage() {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [nextNumber, setNextNumber] = useState(null);
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [redownloadingId, setRedownloadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [showCustomerFields, setShowCustomerFields] = useState(false);

  const [editingInvoice, setEditingInvoice] = useState(null); // { id, invoice_number, invoice_date } or null

  useEffect(() => {
    (async () => {
      const [products, stallItems, peek, hist] = await Promise.all([
        db.isSupabaseConfigured() ? db.loadProducts() : Promise.resolve([]),
        db.isSupabaseConfigured() ? db.loadStallItems() : Promise.resolve([]),
        db.isSupabaseConfigured() ? db.peekNextManualInvoiceNumber() : Promise.resolve(null),
        db.isSupabaseConfigured() ? db.loadManualInvoices() : Promise.resolve([]),
      ]);
      const combined = [
        ...(products || []).map(p => ({ name: p.name, price: parsePrice(p.price) })),
        ...(stallItems || []).map(s => ({ name: s.name, price: parsePrice(s.price) })),
      ];
      setCatalog(combined);
      setNextNumber(peek);
      setHistory(hist || []);
      setLoading(false);
    })();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set();
    return catalog.filter(c => {
      const key = c.name.toLowerCase();
      if (!key.includes(q) || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
  }, [search, catalog]);

  const addItem = (name, price) => {
    setItems(prev => [...prev, { name, quantity: 1, price, discount: 0 }]);
    setSearch("");
  };
  const addCustomItem = () => {
    if (!search.trim()) return;
    addItem(search.trim(), 0);
  };
  const updateItem = (i, patch) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const total = items.reduce((s, it) => s + lineTotal(it), 0);

  const buildAndDownload = buildAndDownloadInvoicePdf;

  const resetBuilder = () => {
    setItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setShowCustomerFields(false);
    setEditingInvoice(null);
  };

  const handleGenerate = async () => {
    if (items.length === 0 || generating) return;
    setGenerating(true);
    const customer = { name: customerName, phone: customerPhone, email: customerEmail };
    try {
      if (editingInvoice) {
        await buildAndDownload(editingInvoice.invoice_number, items, total, editingInvoice.invoice_date, customer);
        const saved = await db.updateManualInvoice(editingInvoice.id, {
          items, total, customerName, customerPhone, customerEmail,
        });
        setHistory(prev => prev.map(h => h.id === saved.id ? saved : h));
        showToast(`Invoice #${editingInvoice.invoice_number} updated`);
      } else {
        const invoiceNumber = await db.getNextManualInvoiceNumber();
        const invoiceDate = todayISO();
        await buildAndDownload(invoiceNumber, items, total, invoiceDate, customer);
        const saved = await db.createManualInvoice({
          invoiceNumber, invoiceDate, items, total, customerName, customerPhone, customerEmail,
        });
        setHistory(prev => [saved, ...prev]);
        setNextNumber(invoiceNumber + 1);
        showToast(`Invoice #${invoiceNumber} downloaded`);
      }
      resetBuilder();
    } catch (err) {
      console.error(err);
      showToast("Something went wrong generating the invoice");
    }
    setGenerating(false);
  };

  const handleRedownload = async (inv) => {
    setRedownloadingId(inv.id);
    try {
      await buildAndDownload(inv.invoice_number, inv.items, inv.total, inv.invoice_date, {
        name: inv.customer_name, phone: inv.customer_phone, email: inv.customer_email,
      });
    } catch (err) {
      console.error(err);
      showToast("Couldn't re-download that invoice");
    }
    setRedownloadingId(null);
  };

  const handleCopyLink = async (inv) => {
    const url = `${window.location.origin}/i/${inv.share_token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(`Link for Invoice #${inv.invoice_number} copied`);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const handleEditInvoice = (inv) => {
    if (items.length > 0 && !editingInvoice) {
      if (!confirm("This will replace the items you're currently working on. Continue?")) return;
    }
    setItems((inv.items || []).map(it => ({ ...it })));
    setCustomerName(inv.customer_name || "");
    setCustomerPhone(inv.customer_phone || "");
    setCustomerEmail(inv.customer_email || "");
    setShowCustomerFields(Boolean(inv.customer_name || inv.customer_phone || inv.customer_email));
    setEditingInvoice({ id: inv.id, invoice_number: inv.invoice_number, invoice_date: inv.invoice_date });
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.offWhite, fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      <div style={{ background: BRAND.black, padding: "28px 20px 22px", textAlign: "center" }}>
        <img src="/logo-white.png" alt="Laska Legacy" style={{ height: 40, marginBottom: 10 }} />
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: BRAND.teal, fontWeight: 700 }}>Invoicing</div>
        {nextNumber != null && (
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 6 }}>Next up: Invoice #{nextNumber}</div>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: BRAND.black, color: BRAND.white, padding: "10px 20px", borderRadius: 100, fontSize: 13, fontWeight: 700, zIndex: 100, boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", padding: 60, color: BRAND.grey, fontSize: 14 }}>Loading…</p>
      ) : (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>

          {editingInvoice && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: BRAND.purpleLight, border: `1px solid ${BRAND.purple}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.purple }}>Editing Invoice #{editingInvoice.invoice_number}</span>
              <button onClick={resetBuilder} style={{ background: "none", border: "none", color: BRAND.purple, fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Cancel</button>
            </div>
          )}

          {/* Search / add items */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: BRAND.grey, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Add an item</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products or type a custom item…"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: `1px solid ${BRAND.greyLight}`, fontSize: 15, boxSizing: "border-box" }}
            />
            {search.trim() && (
              <div style={{ background: BRAND.white, borderRadius: 10, border: `1px solid ${BRAND.greyLight}`, marginTop: 8, overflow: "hidden" }}>
                {searchResults.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => addItem(c.name, c.price)}
                    style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${BRAND.greyLight}` }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: BRAND.purple }}>{formatZAR(c.price)}</span>
                  </div>
                ))}
                <div onClick={addCustomItem} style={{ padding: "12px 16px", cursor: "pointer", color: BRAND.teal, fontWeight: 700, fontSize: 13 }}>
                  {"+"} Add "{search.trim()}" as a custom item
                </div>
              </div>
            )}
          </div>

          {/* Current invoice items */}
          <div style={{ marginBottom: 20 }}>
            {items.length === 0 && (
              <p style={{ textAlign: "center", color: BRAND.grey, fontSize: 13, padding: "20px 0" }}>No items yet — search above to add the first one.</p>
            )}
            {items.map((it, i) => (
              <div key={i} style={{ background: BRAND.white, borderRadius: 10, border: `1px solid ${BRAND.greyLight}`, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <input
                    value={it.name}
                    onChange={e => updateItem(i, { name: e.target.value })}
                    style={{ border: "none", fontSize: 14, fontWeight: 700, color: BRAND.black, flex: 1, outline: "none" }}
                  />
                  <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>{"✕"}</button>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: BRAND.grey, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Qty</div>
                    <input
                      type="number" min="1" value={it.quantity}
                      onChange={e => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${BRAND.greyLight}`, fontSize: 14, boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: BRAND.grey, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Price</div>
                    <input
                      type="number" min="0" value={it.price}
                      onChange={e => updateItem(i, { price: Math.max(0, parseFloat(e.target.value) || 0) })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${BRAND.greyLight}`, fontSize: 14, boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: BRAND.grey, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>% Discount</div>
                    <input
                      type="number" min="0" max="100" value={it.discount || 0}
                      onChange={e => updateItem(i, { discount: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${BRAND.greyLight}`, fontSize: 14, boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: BRAND.grey, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Total</div>
                    <div style={{ fontWeight: 800, color: BRAND.purple, fontSize: 15 }}>{formatZAR(lineTotal(it))}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Customer details (optional) */}
          <div style={{ marginBottom: 20 }}>
            {!showCustomerFields ? (
              <button
                onClick={() => setShowCustomerFields(true)}
                style={{ background: "none", border: `1px dashed ${BRAND.greyLight}`, borderRadius: 10, padding: "12px 16px", width: "100%", textAlign: "left", color: BRAND.grey, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                {"+"} Add customer details (optional)
              </button>
            ) : (
              <div style={{ background: BRAND.white, borderRadius: 10, border: `1px solid ${BRAND.greyLight}`, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: BRAND.grey, textTransform: "uppercase" }}>Customer Details (optional)</span>
                  <button onClick={() => { setShowCustomerFields(false); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); }} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Remove</button>
                </div>
                <input
                  value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Name"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${BRAND.greyLight}`, fontSize: 14, boxSizing: "border-box", marginBottom: 8 }}
                />
                <input
                  value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${BRAND.greyLight}`, fontSize: 14, boxSizing: "border-box", marginBottom: 8 }}
                />
                <input
                  value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${BRAND.greyLight}`, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div style={{ background: BRAND.tealLight, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontWeight: 700, color: BRAND.tealDark, fontSize: 14 }}>Total</span>
              <span style={{ fontWeight: 800, color: BRAND.tealDark, fontSize: 20 }}>{formatZAR(total)}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={items.length === 0 || generating}
            style={{
              width: "100%", padding: "16px 20px", borderRadius: 100, border: "none",
              background: items.length === 0 ? BRAND.greyLight : BRAND.teal, color: BRAND.white,
              fontSize: 15, fontWeight: 700, cursor: items.length === 0 || generating ? "not-allowed" : "pointer",
            }}
          >
            {generating ? "Generating…" : editingInvoice ? "Save Changes & Re-download" : "Generate & Download Invoice"}
          </button>

          {/* Recent invoices */}
          {history.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 15, fontWeight: 800, color: BRAND.black, marginBottom: 12 }}>Recent Invoices</h2>
              {history.slice(0, 15).map(inv => (
                <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: BRAND.white, borderRadius: 10, border: `1px solid ${BRAND.greyLight}`, padding: "12px 14px", marginBottom: 8, gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: BRAND.black }}>Invoice #{inv.invoice_number}{inv.customer_name ? ` — ${inv.customer_name}` : ""}</div>
                    <div style={{ fontSize: 12, color: BRAND.grey }}>
                      {new Date(inv.invoice_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} {"·"} {formatZAR(inv.total)} {"·"} {(inv.items || []).length} item{(inv.items || []).length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {inv.share_token && (
                      <button
                        onClick={() => handleCopyLink(inv)}
                        style={{ padding: "8px 14px", borderRadius: 100, border: `1px solid ${BRAND.purple}`, background: BRAND.white, color: BRAND.purple, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Copy link
                      </button>
                    )}
                    <button
                      onClick={() => handleEditInvoice(inv)}
                      style={{ padding: "8px 14px", borderRadius: 100, border: `1px solid ${BRAND.greyLight}`, background: BRAND.white, color: BRAND.black, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRedownload(inv)}
                      disabled={redownloadingId === inv.id}
                      style={{ padding: "8px 14px", borderRadius: 100, border: `1px solid ${BRAND.teal}`, background: BRAND.white, color: BRAND.teal, fontSize: 12, fontWeight: 700, cursor: redownloadingId === inv.id ? "wait" : "pointer" }}
                    >
                      {redownloadingId === inv.id ? "…" : "Re-download"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
