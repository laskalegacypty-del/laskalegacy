'use client';

import { useEffect, useRef, useState } from 'react';
import * as db from '@/lib/supabase';

const BRAND = {
  teal: "#0097b2", purple: "#5e17eb", black: "#000000", white: "#ffffff",
  offWhite: "#f7f8fa", tealDark: "#007a91", tealLight: "#e6f6f9",
  purpleLight: "#f0e8fd", grey: "#6b7280", greyLight: "#e5e7eb",
};

function parsePrice(s) { return parseFloat((s || "0").replace(/[^0-9.]/g, "")) || 0; }

export default function StallScanPage({ params }) {
  const { itemId } = params;
  const initRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [error, setError] = useState(null); // 'not-found' | 'no-event' | 'record-failed'

  const [quantity, setQuantity] = useState(1);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [sale, setSale] = useState(null);
  const [undone, setUndone] = useState(false);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      const foundItem = await db.getStallItemById(itemId);
      if (!foundItem) {
        setError('not-found');
        setLoading(false);
        return;
      }
      setItem(foundItem);
      const evt = await db.getActiveStallEvent();
      if (!evt) {
        setError('no-event');
        setLoading(false);
        return;
      }
      setActiveEvent(evt);
      setLoading(false);
    })();
  }, [itemId]);

  const adjustQty = (delta) => setQuantity(q => Math.max(1, q + delta));

  const handleAccept = async () => {
    if (accepting || !activeEvent) return;
    setAccepting(true);
    try {
      const { sale: newSale, item: updatedItem } = await db.recordStallSale(activeEvent.id, itemId, quantity);
      setItem(updatedItem);
      setSale(newSale);
      setAccepted(true);
    } catch (err) {
      console.error(err);
      setError('record-failed');
    }
    setAccepting(false);
  };

  const handleUndo = async () => {
    if (!sale || undone || undoing) return;
    setUndoing(true);
    try {
      const updatedItem = await db.undoStallSale(sale.id, itemId, sale.quantity);
      setItem(updatedItem);
      setUndone(true);
    } catch (err) {
      console.error(err);
    }
    setUndoing(false);
  };

  const total = item ? parsePrice(item.price) * quantity : 0;
  const soldTotal = item && sale ? parsePrice(item.price) * sale.quantity : 0;
  const shownStock = item ? Math.max(0, item.stock || 0) : 0;
  const overselling = item && quantity > shownStock;

  return (
    <div style={{ minHeight: "100vh", background: BRAND.black, fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: BRAND.white, borderRadius: 18, padding: 28, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
        {loading && (
          <p style={{ color: BRAND.grey, fontSize: 14, padding: "40px 0" }}>Loading item…</p>
        )}

        {!loading && error === 'not-found' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>❓</div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 800, color: BRAND.black, marginBottom: 8 }}>Item Not Found</h1>
            <p style={{ fontSize: 13, color: BRAND.grey }}>This QR code doesn't match anything in the Stall Price List.</p>
          </>
        )}

        {!loading && error === 'record-failed' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 800, color: BRAND.black, marginBottom: 8 }}>Couldn't Log Sale</h1>
            <p style={{ fontSize: 13, color: BRAND.grey }}>Something went wrong recording this scan for {item?.name}. Try scanning again.</p>
          </>
        )}

        {!loading && error === 'no-event' && item && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏸️</div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 800, color: BRAND.black, marginBottom: 4 }}>{item.name}</h1>
            <div style={{ fontWeight: 800, fontSize: 16, color: BRAND.purple, marginBottom: 16 }}>{item.price}</div>
            <p style={{ fontSize: 13, color: BRAND.grey, background: BRAND.offWhite, borderRadius: 8, padding: 12 }}>No event running right now — nothing was recorded. Start an event in Admin → Stall Events first.</p>
          </>
        )}

        {!loading && !error && item && !accepted && (
          <>
            {item.image && (
              <div style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", margin: "0 auto 16px", background: BRAND.offWhite }}>
                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800, color: BRAND.black, marginBottom: 4 }}>{item.name}</h1>
            <div style={{ fontWeight: 800, fontSize: 17, color: BRAND.purple, marginBottom: 4 }}>{item.price} each</div>
            <div style={{ fontSize: 12, color: BRAND.grey, marginBottom: 20 }}>{shownStock} shown in stock</div>

            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: BRAND.grey, fontWeight: 700, marginBottom: 10 }}>Quantity</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
              <button onClick={() => adjustQty(-1)} style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${BRAND.greyLight}`, background: BRAND.white, fontSize: 20, fontWeight: 700, cursor: "pointer" }}>{"−"}</button>
              <span style={{ fontSize: 28, fontWeight: 800, color: BRAND.black, minWidth: 40 }}>{quantity}</span>
              <button onClick={() => adjustQty(1)} style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${BRAND.greyLight}`, background: BRAND.white, fontSize: 20, fontWeight: 700, cursor: "pointer" }}>+</button>
            </div>

            {overselling && (
              <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                Only {shownStock} shown in stock — selling {quantity} anyway.
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accepting}
              style={{ width: "100%", padding: "16px 20px", borderRadius: 100, border: "none", background: BRAND.teal, color: BRAND.white, fontSize: 15, fontWeight: 700, cursor: accepting ? "wait" : "pointer" }}
            >
              {accepting ? "Logging…" : `Accept Sale — R${total.toFixed(2)}`}
            </button>
          </>
        )}

        {!loading && !error && item && accepted && (
          <>
            {item.image && (
              <div style={{ width: 90, height: 90, borderRadius: 12, overflow: "hidden", margin: "0 auto 14px", background: BRAND.offWhite }}>
                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: BRAND.teal, fontWeight: 700, marginBottom: 6 }}>✅ Sold</div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 19, fontWeight: 800, color: BRAND.black, marginBottom: 2 }}>{item.name}</h1>
            <div style={{ fontSize: 13, color: BRAND.grey, marginBottom: 14 }}>Qty {sale.quantity} {"·"} R{soldTotal.toFixed(2)}</div>

            <div style={{ background: BRAND.black, borderRadius: 12, padding: "16px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 700, marginBottom: 6 }}>Card Machine Reference</div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 32, fontWeight: 800, color: BRAND.white, letterSpacing: 4 }}>{sale.reference_code}</div>
            </div>

            <div style={{ background: BRAND.tealLight, borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 700, color: BRAND.tealDark, marginBottom: 16 }}>
              {shownStock} left in stock
            </div>

            {!undone ? (
              <button
                onClick={handleUndo}
                disabled={undoing}
                style={{ width: "100%", padding: "14px 20px", borderRadius: 100, border: `2px solid #dc2626`, background: BRAND.white, color: "#dc2626", fontSize: 14, fontWeight: 700, cursor: undoing ? "wait" : "pointer" }}
              >
                {undoing ? "Undoing…" : "Undo This Sale"}
              </button>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.grey }}>Sale undone — stock restored.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
