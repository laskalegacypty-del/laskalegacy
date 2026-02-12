import { put, list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id, invoiceUrl } = req.body

  if (!id || !invoiceUrl) {
    return res.status(400).json({ error: "Inquiry ID and invoice URL required" })
  }

  try {
    // Find the inquiry file
    const { blobs } = await list({
      prefix: `inquiries/${id}`,
    })

    if (blobs.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" })
    }

    // Fetch current inquiry
    const response = await fetch(blobs[0].url)
    const inquiry = await response.json()

    // Update invoice URL
    inquiry.invoiceUrl = invoiceUrl

    // Save back to blob
    await put(
      blobs[0].pathname,
      JSON.stringify(inquiry, null, 2),
      {
        access: "public",
        contentType: "application/json",
      }
    )

    return res.status(200).json({ success: true, inquiry })
  } catch (error) {
    console.error("Error storing invoice URL:", error)
    return res.status(500).json({ error: "Failed to store invoice URL" })
  }
}
