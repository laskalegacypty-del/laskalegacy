import { put } from "@vercel/blob"
import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"

function loadProducts() {
  const filePath = path.join(process.cwd(), "lib", "products.json")
  const raw = fs.readFileSync(filePath, "utf8")
  return JSON.parse(raw)
}

function loadShipping() {
  const filePath = path.join(process.cwd(), "lib", "shipping.json")
  const raw = fs.readFileSync(filePath, "utf8")
  return JSON.parse(raw)
}

export default async function handler(req, res) {
  if (!req.headers.cookie?.includes("admin=1")) return res.status(401).end()

  try {
    const {
      items,
      route,
      inquiryId,
      client,
      shipping: shippingData,
      totals: totalsData,
    } = req.body || {}

    const products = loadProducts()
    const shipping = loadShipping()

    // Validate required data
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required and cannot be empty" })
    }

    // Calculate items and totals
    let productTotal = 0
    let shippingCost = 0
    let lines = []

    if (inquiryId && totalsData) {
      // Use inquiry data if provided
      lines = (items || []).map((i) => {
        const p = products.find((x) => x.name === i.name)
        if (!p) {
          throw new Error(`Product not found: ${i.name}`)
        }
        const qty = Number(i.qty || 0)
        const lineTotal = p.price * qty
        productTotal += lineTotal
        return { name: p.name, qty, price: p.price, lineTotal }
      })
      productTotal = totalsData.products || productTotal
      shippingCost = totalsData.shipping || shippingData?.cost || 0
    } else {
      // Manual invoice creation
      lines = (items || []).map((i) => {
        const p = products.find((x) => x.name === i.name)
        if (!p || typeof p.price !== "number") {
          throw new Error(`Product missing or price invalid: ${i.name}`)
        }
        const qty = Number(i.qty || 0)
        const lineTotal = p.price * qty
        productTotal += lineTotal
        return { name: p.name, qty, price: p.price, lineTotal }
      })

      // Calculate shipping if route provided
      if (route) {
        // Find largest size from products
        const SIZE_ORDER = { XS: 0, S: 1, M: 2, L: 3, XL: 4 }
        let largestSize = "XS"
        lines.forEach((line) => {
          const product = products.find((p) => p.name === line.name)
          if (product && SIZE_ORDER[product.pudoSize] > SIZE_ORDER[largestSize]) {
            largestSize = product.pudoSize
          }
        })

        if (shipping[route] && shipping[route][largestSize]) {
          shippingCost = shipping[route][largestSize]
        }
      }
    }

    const grandTotal = productTotal + shippingCost

    // Build PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 })
    const chunks = []
    doc.on("data", (c) => chunks.push(c))
    
    // Set up promise to wait for PDF completion
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on("end", resolve)
      doc.on("error", reject)
    })

    // Colors
    const teal = "#0aa7a7"
    const tealDark = "#078989"
    const bgLight = "#fbfaf8"
    const textDark = "#141414"
    const textMuted = "#5a5f66"

    // Header with logo
    try {
      const logoPath = path.join(process.cwd(), "src", "images", "ll 1.png")
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 60, height: 60 })
      }
    } catch (err) {
      console.log("Logo not found, continuing without it")
    }

    // Company info
    doc
      .fontSize(24)
      .fillColor(tealDark)
      .text("Laska Legacy", 120, 50, { align: "left" })
      .fontSize(10)
      .fillColor(textMuted)
      .text("Handcrafted Tack Made for Real Riding", 120, 80)
      .moveDown(2)

    // Invoice title and date
    doc
      .fontSize(20)
      .fillColor(textDark)
      .text("INVOICE", 50, 130)
      .fontSize(10)
      .fillColor(textMuted)
      .text(`Date: ${new Date().toLocaleDateString("en-ZA")}`, 400, 130, {
        align: "right",
      })

    // Generate random 3-digit invoice number
    const invoiceNumber = Math.floor(100 + Math.random() * 900).toString()
    doc.text(`Invoice #: ${invoiceNumber}`, 400, 150, { align: "right" })

    doc.moveDown(2)

    // Client details
    let clientY = doc.y
    if (client) {
      doc
        .fontSize(12)
        .fillColor(textDark)
        .text("Bill To:", 50, clientY)
      
      clientY += 18
      doc
        .fontSize(10)
        .fillColor(textMuted)
        .text(client.name, 50, clientY)
      
      clientY += 15
      doc.text(client.email, 50, clientY)
      
      clientY += 15
      doc.text(client.phone, 50, clientY)
      
      clientY += 15
      // Split address into lines if it contains commas or is long
      const addressLines = client.address.split(',').map(line => line.trim()).filter(line => line)
      if (addressLines.length > 1) {
        addressLines.forEach((line, index) => {
          doc.text(line, 50, clientY + (index * 15), { width: 200 })
        })
        clientY += addressLines.length * 15
      } else {
        // If no commas, try to wrap long addresses
        doc.text(client.address, 50, clientY, { width: 200 })
        clientY += 15
      }
      
      doc.y = clientY + 10
    }

    doc.moveDown()

    // Line items table
    const tableTop = doc.y
    const itemHeight = 25

    // Table header
    doc
      .fontSize(10)
      .fillColor("#ffffff")
      .rect(50, tableTop, 500, 25)
      .fill(teal)
      .fillColor("#ffffff")
      .text("Item", 60, tableTop + 8)
      .text("Quantity", 300, tableTop + 8)
      .text("Price", 380, tableTop + 8)
      .text("Total", 460, tableTop + 8, { align: "right" })

    // Table rows
    let yPos = tableTop + 25
    lines.forEach((line) => {
      doc
        .fillColor(textDark)
        .rect(50, yPos, 500, itemHeight)
        .fill(bgLight)
        .fillColor(textDark)
        .fontSize(10)
        .text(line.name, 60, yPos + 8, { width: 230 })
        .text(line.qty.toString(), 300, yPos + 8)
        .text(`R${line.price.toFixed(2)}`, 380, yPos + 8)
        .text(`R${line.lineTotal.toFixed(2)}`, 460, yPos + 8, {
          align: "right",
          width: 80,
        })
      yPos += itemHeight
    })

    // Shipping row
    if (shippingCost > 0) {
      const routeLabels = {
        "locker-locker": "Locker → Locker",
        "locker-door": "Locker → Door",
        "locker-kiosk": "Locker → Kiosk",
        "kiosk-door": "Kiosk → Door",
      }
      const routeLabel = routeLabels[route || shippingData?.route] || route || "Shipping"
      doc
        .fillColor(textDark)
        .rect(50, yPos, 500, itemHeight)
        .fill(bgLight)
        .fillColor(textDark)
        .fontSize(10)
        .text(`Shipping (${routeLabel})`, 60, yPos + 8)
        .text(`R${shippingCost.toFixed(2)}`, 460, yPos + 8, {
          align: "right",
          width: 80,
        })
      yPos += itemHeight
    }

    // Total section
    const totalY = yPos + 20
    doc
      .fillColor(tealDark)
      .rect(350, totalY, 200, 40)
      .fill(tealDark)
      .fillColor("#ffffff")
      .fontSize(12)
      .text("Subtotal:", 360, totalY + 8)
      .text(`R${productTotal.toFixed(2)}`, 460, totalY + 8, {
        align: "right",
        width: 80,
      })
      .fontSize(10)
      .text("Shipping:", 360, totalY + 22)
      .text(`R${shippingCost.toFixed(2)}`, 460, totalY + 22, {
        align: "right",
        width: 80,
      })

    doc
      .fillColor(tealDark)
      .rect(350, totalY + 40, 200, 40)
      .fill(tealDark)
      .fillColor("#ffffff")
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("TOTAL:", 360, totalY + 52)
      .text(`R${grandTotal.toFixed(2)}`, 460, totalY + 52, {
        align: "right",
        width: 80,
      })

    // Company information and bank details
    const infoY = totalY + 100
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(textDark)
      .text("Laska Legacy", 50, infoY)
      .fontSize(9)
      .fillColor(textMuted)
      .text("Plot 50 Buffeldooring Potchefstroom", 50, infoY + 15)
      .text("0725858288", 50, infoY + 30)
      .text("laskalegacy@gmail.com", 50, infoY + 45)

    // Bank details
    doc
      .fontSize(10)
      .fillColor(textDark)
      .text("Bank Details:", 50, infoY + 70)
      .fontSize(9)
      .fillColor(textMuted)
      .text("FNB", 50, infoY + 85)
      .text("Savings", 50, infoY + 100)
      .text("62850552780", 50, infoY + 115)
      .text(`Ref: Inv #${invoiceNumber}`, 50, infoY + 130)

    // Footer
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(textMuted)
      .text(
        "Thank you for your order. For questions, contact laskalegacy@gmail.com",
        50,
        750,
        { align: "center", width: 500 }
      )

    doc.end()
    
    // Wait for PDF to finish generating
    await pdfPromise

    const buffer = Buffer.concat(chunks)

    const filename = inquiryId
      ? `invoice-${inquiryId}.pdf`
      : `invoice-${Date.now()}.pdf`
    const blob = await put(filename, buffer, { access: "public" })
    return res.status(200).json({ url: blob.url })
  } catch (error) {
    console.error("Error creating invoice:", error)
    console.error("Error stack:", error.stack)
    return res.status(500).json({ 
      error: error.message || "Failed to create invoice",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
