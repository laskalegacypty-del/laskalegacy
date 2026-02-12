import { put } from "@vercel/blob"
import PDFDocument from "pdfkit"
import products from "../lib/products.json" assert { type: "json" }

export default async function handler(req, res) {

  if (!req.headers.cookie?.includes("admin=1"))
    return res.status(401).end()

  const { items } = req.body

  let total = 0

  const doc = new PDFDocument()
  const chunks = []

  doc.on("data", c => chunks.push(c))

  doc.fontSize(20).text("Laska Legacy Invoice\n\n")

  items.forEach(i => {
    const p = products.find(x => x.name === i.name)
    const line = p.price * i.qty
    total += line
    doc.text(`${i.name}  x${i.qty}  R${line}`)
  })

  doc.text("\nTotal: R" + total)
  doc.end()

  const buffer = Buffer.concat(chunks)

  const blob = await put(
    `invoice-${Date.now()}.pdf`,
    buffer,
    { access: "public" }
  )

  res.json({ url: blob.url })
}