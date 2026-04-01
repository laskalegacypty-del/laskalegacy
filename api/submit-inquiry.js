import { put, list } from "@vercel/blob"
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

const SIZE_ORDER = { XS: 0, S: 1, M: 2, L: 3, XL: 4 }

function getLargestSize(items, products) {
  if (!items || items.length === 0) return null

  let largest = "XS"
  items.forEach((item) => {
    const product = products.find((p) => p.name === item.name)
    if (product && SIZE_ORDER[product.pudoSize] > SIZE_ORDER[largest]) {
      largest = product.pudoSize
    }
  })
  return largest
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const { name, email, phone, address, shippingRoute, items } = req.body

    if (!name || !email || !phone || !address || !shippingRoute || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const products = loadProducts()
    const shipping = loadShipping()

    // Validate products
    const validatedItems = items.map((item) => {
      const product = products.find((p) => p.name === item.name)
      if (!product) {
        throw new Error(`Product not found: ${item.name}`)
      }
      return {
        name: product.name,
        qty: Number(item.qty) || 0,
        price: product.price,
        pudoSize: product.pudoSize,
      }
    })

    // Calculate largest size
    const largestSize = getLargestSize(validatedItems, products)
    if (!largestSize) {
      return res.status(400).json({ error: "No valid products selected" })
    }

    // Calculate shipping
    if (!shipping[shippingRoute] || !shipping[shippingRoute][largestSize]) {
      return res.status(400).json({ error: "Invalid shipping route or size" })
    }
    const shippingCost = shipping[shippingRoute][largestSize]

    // Calculate totals
    let productTotal = 0
    const lines = validatedItems.map((item) => {
      const lineTotal = item.price * item.qty
      productTotal += lineTotal
      return {
        name: item.name,
        qty: item.qty,
        price: item.price,
        lineTotal,
        pudoSize: item.pudoSize,
      }
    })

    const grandTotal = productTotal + shippingCost

    // Create inquiry object
    const inquiryId = `inquiry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const inquiry = {
      id: inquiryId,
      status: "pending",
      createdAt: new Date().toISOString(),
      client: {
        name,
        email,
        phone,
        address,
      },
      shipping: {
        route: shippingRoute,
        size: largestSize,
        cost: shippingCost,
      },
      items: lines,
      totals: {
        products: productTotal,
        shipping: shippingCost,
        total: grandTotal,
      },
    }

    // Store in Vercel Blob
    const blob = await put(
      `inquiries/${inquiryId}.json`,
      JSON.stringify(inquiry, null, 2),
      {
        access: "public",
        contentType: "application/json",
      }
    )

    return res.status(200).json({
      success: true,
      id: inquiryId,
      message: "Inquiry submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting inquiry:", error)
    return res.status(500).json({ error: error.message || "Failed to submit inquiry" })
  }
}
