'use client';

import { useEffect, useRef, useState } from 'react';
import * as db from '@/lib/supabase';

const BRAND = {
  teal: "#0097b2", purple: "#5e17eb", black: "#000000", white: "#ffffff",
  offWhite: "#f7f8fa", tealDark: "#007a91", tealLight: "#e6f6f9",
  purpleLight: "#f0e8fd", grey: "#6b7280", greyLight: "#e5e7eb",
};

export default function StallScanPage({ params }) {
  const { itemId } = params;
  const recordedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null); // 'not-found' | 'no-event'
  const [wasAlreadyZero, setWasAlreadyZero] = useState(false);
  const [sale, setSale] = useState(null);
  const [undone, setUndone] = useState(false);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    (async () => {
      const foundItem = await db.getStallItemById(itemId);
      if (!foundItem) {
        setError('not-found');
        setLoading(false);
        return;
      }
      const wasZero = (foundItem.stock || 0) <= 0;
      const activeEvent = await db.getActiveStallEvent();
      if (!activeEvent) {
        setItem(foundItem);
        setError('no-event');
        setLoading(false);
        return;
      }
      try {
        const { sale: newSale, item: updatedItem } = await db.recordStallSale(activeEvent.id, itemId);
        setItem(updatedItem);
        setSale(newSale);
        setWasAlreadyZero(wasZero);
      } catch (err) {
        console.error(err);
        setItem(foundItem);
        setError('record-failed');
      }
      setLoading(false);
    })();
  }, [itemId]);

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

  return (
    <div style={{ minHeight: "100vh", background: BRAND.black, fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: BRAND.white, borderRadius: 18, padding: 28, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
        {loading && (
          <p style={{ color: BRAND.grey, fontSize: 14, padding: "40px 0" }}>Logging sale…</p>
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

        {!loading && !error && item && (
          <>
            {item.image && (
              <div style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", margin: "0 auto 16px", background: BRAND.offWhite }}>
                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: BRAND.teal, fontWeight: 700, marginBottom: 6 }}>✅ Sold</div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800, color: BRAND.black, marginBottom: 4 }}>{item.name}</h1>
            <div style={{ fontWeight: 800, fontSize: 17, color: BRAND.purple, marginBottom: 16 }}>{item.price}</div>
            <div style={{ background: BRAND.tealLight, borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 700, color: BRAND.tealDark, marginBottom: 16 }}>
              {item.stock} left in stock
            </div>

            {wasAlreadyZero && (
              <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                Heads up — this was already showing 0 in stock before this scan.
              </div>
            )}

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
