'use client';

import { useEffect, useMemo, useState } from 'react';
import * as db from '@/lib/supabase';

const BRAND = {
  teal: "#0097b2", purple: "#5e17eb", black: "#000000", white: "#ffffff",
  offWhite: "#f7f8fa", tealDark: "#007a91", tealLight: "#e6f6f9",
  purpleLight: "#f0e8fd", grey: "#6b7280", greyLight: "#e5e7eb",
};

const WHATSAPP_NUMBER = "27725858288";
const WHATSAPP_DISPLAY = "+27 72 585 8288";
const EMAIL = "laskalegacypty@gmail.com";
const INSTAGRAM = "@laska_legacy";
const CATEGORY_ORDER = ["bridles", "breastplates", "reins", "bags"];

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function toKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "other";
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase()) || "Other";
}

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.004 2c-5.514 0-9.997 4.478-9.997 9.997 0 1.763.462 3.484 1.34 5.002L2 22l5.135-1.322a9.99 9.99 0 0 0 4.869 1.24h.004c5.514 0 9.997-4.478 9.997-9.997C22 6.478 17.518 2 12.004 2zm5.868 15.86a8.29 8.29 0 0 1-4.868 1.523h-.003a8.28 8.28 0 0 1-4.221-1.155l-.303-.18-3.049.785.814-2.973-.198-.306a8.256 8.256 0 0 1-1.267-4.4c0-4.585 3.732-8.316 8.32-8.316a8.26 8.26 0 0 1 5.882 2.439 8.26 8.26 0 0 1 2.434 5.883c0 4.585-3.731 8.316-8.541 8.7z" />
    </svg>
  );
}

function ItemImage({ item }) {
  const [broken, setBroken] = useState(false);
  if (item.image && !broken) {
    return <img src={item.image} alt={item.name} onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
  }
  const initials = (item.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, #0a0a0a, #1a1a2e)` }}>
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 20, color: BRAND.teal, opacity: 0.85, letterSpacing: 2 }}>{initials}</span>
    </div>
  );
}

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = db.isSupabaseConfigured() ? await db.loadStallItems() : [];
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const key = toKey(it.category);
      if (!map.has(key)) map.set(key, titleCase(it.category) || "Other");
    });
    return [...map.entries()].sort(([a], [b]) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [items]);

  const grouped = useMemo(() => {
    const filtered = filter === "all" ? items : items.filter((it) => toKey(it.category) === filter);
    const map = new Map();
    filtered.forEach((it) => {
      const key = toKey(it.category);
      const label = titleCase(it.category) || "Other";
      if (!map.has(key)) map.set(key, { label, items: [] });
      map.get(key).items.push(it);
    });
    return [...map.entries()].sort(([a], [b]) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [items, filter]);

  return (
    <div style={{ minHeight: "100vh", background: BRAND.offWhite, fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      <style>{`
        @keyframes catFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .catalog-card { animation: catFadeUp 0.4s ease both; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .catalog-card:hover { transform: translateY(-3px); box-shadow: 0 14px 28px rgba(0,0,0,0.1); }
        .catalog-pill { transition: all 0.2s ease; }
      `}</style>

      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${BRAND.black} 0%, #0a1620 60%, ${BRAND.tealDark} 100%)`, padding: "44px 20px 84px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, background: `radial-gradient(ellipse at 20% 20%, ${BRAND.teal}, transparent 55%), radial-gradient(ellipse at 80% 60%, ${BRAND.purple}, transparent 55%)` }} />
        <div style={{ position: "relative" }}>
          <img src="/logo-white.png" alt="Laska Legacy" style={{ height: 46, marginBottom: 16 }} />
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: BRAND.teal, fontWeight: 700, marginBottom: 8 }}>At the Stall Today</div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 26, fontWeight: 800, color: BRAND.white, margin: 0 }}>Price List</h1>
        </div>
      </div>

      {/* Contact card — the one place to reach out */}
      <div style={{ maxWidth: 900, margin: "-48px auto 0", padding: "0 16px", position: "relative", zIndex: 2 }}>
        <div style={{ background: BRAND.white, borderRadius: 16, padding: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.18)" }}>
          <div style={{ fontSize: 13, color: BRAND.grey, marginBottom: 14, textAlign: "center" }}>
            Like something? Get in touch and we'll sort you out.
          </div>
          <a
            href={waLink("Hi! I'm at your stall and I'd like to order something from the price list.")}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", padding: "14px 20px", borderRadius: 100, fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 18px rgba(37,211,102,0.35)" }}
          >
            <WhatsAppIcon size={20} />
            Message Us on WhatsApp
          </a>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px", marginTop: 14, fontSize: 12.5, color: BRAND.grey }}>
            <span>{WHATSAPP_DISPLAY}</span>
            <span>{"·"}</span>
            <span>{EMAIL}</span>
            <span>{"·"}</span>
            <span>{INSTAGRAM}</span>
          </div>
        </div>
      </div>

      {loading && (
        <p style={{ textAlign: "center", padding: 60, color: BRAND.grey, fontSize: 14 }}>Loading price list…</p>
      )}

      {!loading && items.length === 0 && (
        <p style={{ textAlign: "center", padding: 60, color: BRAND.grey, fontSize: 14 }}>No items on the price list right now.</p>
      )}

      {!loading && items.length > 0 && (
        <>
          {/* Category pills */}
          <div style={{ maxWidth: 900, margin: "28px auto 0", padding: "0 16px" }}>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              <button
                className="catalog-pill"
                onClick={() => setFilter("all")}
                style={{
                  flexShrink: 0, padding: "9px 18px", borderRadius: 100, fontSize: 12.5, fontWeight: 700,
                  border: filter === "all" ? "none" : `1px solid ${BRAND.greyLight}`,
                  background: filter === "all" ? BRAND.black : BRAND.white,
                  color: filter === "all" ? BRAND.white : BRAND.black, cursor: "pointer",
                }}
              >
                All
              </button>
              {categories.map(([key, label]) => (
                <button
                  key={key}
                  className="catalog-pill"
                  onClick={() => setFilter(key)}
                  style={{
                    flexShrink: 0, padding: "9px 18px", borderRadius: 100, fontSize: 12.5, fontWeight: 700,
                    border: filter === key ? "none" : `1px solid ${BRAND.greyLight}`,
                    background: filter === key ? BRAND.teal : BRAND.white,
                    color: filter === key ? BRAND.white : BRAND.black, cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {grouped.map(([key, group]) => (
            <div key={key} style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 4px" }}>
              {filter === "all" && (
                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 800, color: BRAND.black, marginBottom: 14, paddingLeft: 2, display: "flex", alignItems: "center", gap: 10 }}>
                  {group.label}
                  <span style={{ height: 1, flex: 1, background: BRAND.greyLight }} />
                </h2>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
                {group.items.map((item, i) => {
                  const soldOut = (item.stock || 0) <= 0;
                  return (
                    <div
                      key={item.id}
                      className="catalog-card"
                      style={{ animationDelay: `${i * 0.04}s`, background: BRAND.white, borderRadius: 14, overflow: "hidden", border: `1px solid ${BRAND.greyLight}` }}
                    >
                      <div style={{ width: "100%", aspectRatio: "1", position: "relative", background: BRAND.offWhite }}>
                        <ItemImage item={item} />
                        {soldOut && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#dc2626", background: BRAND.white, padding: "6px 12px", borderRadius: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "12px 14px 14px" }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: BRAND.black, lineHeight: 1.3, marginBottom: 4 }}>{item.name}</div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: BRAND.purple }}>{item.price}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
