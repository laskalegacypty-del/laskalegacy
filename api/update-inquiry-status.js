import { put, list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id, status } = req.body

  if (!id || !status) {
    return res.status(400).json({ error: "Inquiry ID and status required" })
  }

  if (!["pending", "reviewed", "invoiced"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" })
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

    // Update status
    inquiry.status = status

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
    console.error("Error updating inquiry status:", error)
    return res.status(500).json({ error: "Failed to update inquiry status" })
  }
}
