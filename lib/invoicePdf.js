// Shared helpers for the invoice builder (/invoice) and the public
// digital invoice (/i/<token>) so both produce the same numbers and PDF.

export function lineTotal(it) {
  const gross = it.quantity * it.price;
  const d = Math.min(100, Math.max(0, Number(it.discount) || 0));
  return gross * (1 - d / 100);
}

export function lineSaving(it) {
  return it.quantity * it.price - lineTotal(it);
}

export function formatZAR(n) {
  return "R" + (Math.round(n * 100) / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function filenameDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}${m}${y}`;
}

// Downscales the source logo (1024x1024) to a small square before embedding
// it in the PDF — it only ever renders at ~64pt there, so keeping the file
// full-res just bloats the invoice for no visual gain.
export async function logoToDataUrl(url, maxDimension = 240) {
  const res = await fetch(url);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function buildAndDownloadInvoicePdf(invoiceNumber, items, total, invoiceDate, customer = {}) {
  const [{ pdf }, { default: InvoiceDocument }, logoDataUrl] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/app/invoice/InvoiceDocument"),
    logoToDataUrl("/logo-icon.png"),
  ]);
  const blob = await pdf(
    <InvoiceDocument
      invoiceNumber={invoiceNumber}
      items={items}
      total={total}
      logoDataUrl={logoDataUrl}
      customerName={customer.name}
      customerPhone={customer.phone}
      customerEmail={customer.email}
    />
  ).toBlob();
  downloadBlob(blob, `LL_INV${invoiceNumber}_${filenameDate(invoiceDate)}.pdf`);
}
