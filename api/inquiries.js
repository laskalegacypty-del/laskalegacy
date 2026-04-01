import { list, put } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end()
  }

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    // GET - List or get single inquiry
    if (req.method === "GET") {
      const { id } = req.query

      // List all inquiry files
      const { blobs } = await list({
        prefix: "inquiries/",
      })

      // Fetch and parse each inquiry
      const inquiries = await Promise.all(
        blobs.map(async (blob) => {
          try {
            const response = await fetch(blob.url)
            const inquiry = await response.json()
            return inquiry
          } catch (error) {
            console.error(`Error loading inquiry ${blob.pathname}:`, error)
            return null
          }
        })
      )

      // Filter out nulls
      const validInquiries = inquiries.filter((inq) => inq !== null)

      // If ID is provided, return single inquiry
      if (id) {
        const inquiry = validInquiries.find((inq) => inq.id === id)
        if (!inquiry) {
          return res.status(404).json({ error: "Inquiry not found" })
        }
        return res.status(200).json(inquiry)
      }

      // Otherwise return all inquiries sorted by date (newest first)
      validInquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return res.status(200).json(validInquiries)
    }

    // POST - Handle different inquiry actions
    if (req.method === "POST") {
      const { action, ...data } = req.body

      if (action === "update-status") {
        return await handleUpdateInquiryStatus(req, res, data)
      } else if (action === "store-invoice-url") {
        return await handleStoreInvoiceUrl(req, res, data)
      } else {
        return res.status(400).json({ error: "Invalid action. Use 'update-status' or 'store-invoice-url'" })
      }
    }
  } catch (error) {
    console.error("Error in inquiries API:", error)
    return res.status(500).json({ error: "Failed to process request" })
  }
}

// Helper function to get inquiry by ID
async function getInquiryById(id) {
  const { blobs } = await list({ prefix: `inquiries/${id}` })
  if (blobs.length === 0) return null
  const response = await fetch(blobs[0].url)
  return { inquiry: await response.json(), blob: blobs[0] }
}

// Update inquiry status
async function handleUpdateInquiryStatus(req, res, data) {
  const { id, status } = data

  if (!id || !status) {
    return res.status(400).json({ error: "Inquiry ID and status required" })
  }

  const validStatuses = ["pending", "reviewed", "invoiced", "invoice-sent", "payment-received", "shipped"]
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be one of: " + validStatuses.join(", ") })
  }

  const result = await getInquiryById(id)
  if (!result) {
    return res.status(404).json({ error: "Inquiry not found" })
  }

  const { inquiry, blob } = result
  inquiry.status = status

  await put(blob.pathname, JSON.stringify(inquiry, null, 2), {
    access: "public",
    contentType: "application/json",
  })

  return res.status(200).json({ success: true, inquiry })
}

// Store invoice URL in inquiry
async function handleStoreInvoiceUrl(req, res, data) {
  const { id, invoiceUrl } = data

  if (!id || !invoiceUrl) {
    return res.status(400).json({ error: "Inquiry ID and invoice URL required" })
  }

  const result = await getInquiryById(id)
  if (!result) {
    return res.status(404).json({ error: "Inquiry not found" })
  }

  const { inquiry, blob } = result
  inquiry.invoiceUrl = invoiceUrl

  await put(blob.pathname, JSON.stringify(inquiry, null, 2), {
    access: "public",
    contentType: "application/json",
  })

  return res.status(200).json({ success: true, inquiry })
}
