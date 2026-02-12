import { put } from "@vercel/blob"
import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"

function loadProducts() {
  const filePath = path.join(process.cwd(), "lib", "products.json")
  const raw = fs.readFileSync(filePath, "utf8")
  return JSON.parse(raw)
}

export default async function handler(req, res) {
  if (!req.headers.cookie?.includes("admin=1")) return res.status(401).end()

  const { items, route } = req.body || {}

  const products = loadProducts()

  // Example: calculate totals using your product list
  let total = 0
  const lines = (items || []).map((i) => {
    const p = products.find((x) => x.name === i.name)
    if (!p || typeof p.price !== "number") {
      throw new Error(`Product missing or price invalid: ${i.name}`)
    }
    const qty = Number(i.qty || 0)
    const lineTotal = p.price * qty
    total += lineTotal
    return { name: p.name, qty, price: p.price, lineTotal }
  })

  // Build PDF
  const doc = new PDFDocument()
  const chunks = []
  doc.on("data", (c) => chunks.push(c))

  doc.fontSize(18).text("Laska Legacy Invoice")
  doc.moveDown()

  lines.forEach((l) => {
    doc.fontSize(12).text(`${l.name}  x${l.qty}  R${l.lineTotal.toFixed(2)}`)
  })

  doc.moveDown()
  doc.fontSize(14).text(`Total: R${total.toFixed(2)}`)
  doc.end()

  const buffer = Buffer.concat(chunks)

  const blob = await put(`invoice-${Date.now()}.pdf`, buffer, { access: "public" })
  return res.status(200).json({ url: blob.url })
}
