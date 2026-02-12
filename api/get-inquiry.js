import { list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: "Inquiry ID required" })
  }

  try {
    // Find the inquiry file
    const { blobs } = await list({
      prefix: `inquiries/${id}`,
    })

    if (blobs.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" })
    }

    const response = await fetch(blobs[0].url)
    const inquiry = await response.json()

    return res.status(200).json(inquiry)
  } catch (error) {
    console.error("Error fetching inquiry:", error)
    return res.status(500).json({ error: "Failed to fetch inquiry" })
  }
}
