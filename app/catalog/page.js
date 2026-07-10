'use client';

import { useEffect, useState } from 'react';
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

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.004 2c-5.514 0-9.997 4.478-9.997 9.997 0 1.763.462 3.484 1.34 5.002L2 22l5.135-1.322a9.99 9.99 0 0 0 4.869 1.24h.004c5.514 0 9.997-4.478 9.997-9.997C22 6.478 17.518 2 12.004 2zm5.868 15.86a8.29 8.29 0 0 1-4.868 1.523h-.003a8.28 8.28 0 0 1-4.221-1.155l-.303-.18-3.049.785.814-2.973-.198-.306a8.256 8.256 0 0 1-1.267-4.4c0-4.585 3.732-8.316 8.32-8.316a8.26 8.26 0 0 1 5.882 2.439 8.26 8.26 0 0 1 2.434 5.883c0 4.585-3.731 8.316-8.541 8.7z" />
    </svg>
  );
}

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ minHeight: "100vh", background: BRAND.offWhite, fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      <div style={{ background: BRAND.black, padding: "36px 20px 28px", textAlign: "center" }}>
        <img src="/logo-white.png" alt="Laska Legacy" style={{ height: 44, marginBottom: 14 }} />
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: BRAND.teal, fontWeight: 700 }}>Stall Price List</div>
      </div>

      {/* Contact card — the one place to reach out */}
      <div style={{ maxWidth: 900, margin: "-20px auto 0", padding: "0 16px" }}>
        <div style={{ background: BRAND.white, borderRadius: 14, border: `1px solid ${BRAND.greyLight}`, padding: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 13, color: BRAND.grey, marginBottom: 14, textAlign: "center" }}>
            Like something? Get in touch and we'll sort you out.
          </div>
          <a
            href={waLink("Hi! I'm at your stall and I'd like to order something from the price list.")}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", padding: "14px 20px", borderRadius: 100, fontSize: 15, fontWeight: 700, textDecoration: "none" }}
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
        <div style={{ padding: "28px 16px 4px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {items.map((item) => {
              const soldOut = (item.stock || 0) <= 0;
              return (
                <div key={item.id} style={{ display: "flex", gap: 14, background: BRAND.white, borderRadius: 12, padding: 12, border: `1px solid ${BRAND.greyLight}`, alignItems: "center", opacity: soldOut ? 0.55 : 1 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: BRAND.offWhite, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <span style={{ fontSize: 9, color: BRAND.grey, textAlign: "center" }}>No photo</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: BRAND.black, lineHeight: 1.3 }}>{item.name}</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: BRAND.purple, marginTop: 4 }}>{item.price}</div>
                  </div>
                  {soldOut && (
                    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#dc2626", background: "#fef2f2", padding: "6px 10px", borderRadius: 100 }}>
                      Sold Out
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
