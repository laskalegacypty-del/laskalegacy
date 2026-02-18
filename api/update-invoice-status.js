import { put, list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id, status } = req.body

  if (!id || !status) {
    return res.status(400).json({ error: "Invoice ID and status required" })
  }

  const validStatuses = ["draft", "approved", "sent", "paid", "overdue", "cancelled"]
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: "Invalid status. Must be one of: " + validStatuses.join(", ") 
    })
  }

  try {
    // Find the invoice file
    const { blobs } = await list({
      prefix: `invoices/${id}`,
    })

    if (blobs.length === 0) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    // Fetch current invoice
    const response = await fetch(blobs[0].url)
    const invoice = await response.json()

    // Update status
    invoice.status = status
    invoice.updatedAt = new Date().toISOString()

    // Add status change timestamp
    if (!invoice.statusHistory) {
      invoice.statusHistory = []
    }
    invoice.statusHistory.push({
      status,
      changedAt: new Date().toISOString(),
    })

    // Save back to blob
    await put(
      blobs[0].pathname,
      JSON.stringify(invoice, null, 2),
      {
        access: "public",
        contentType: "application/json",
      }
    )

    return res.status(200).json({ success: true, invoice })
  } catch (error) {
    console.error("Error updating invoice status:", error)
    return res.status(500).json({ error: "Failed to update invoice status" })
  }
}
