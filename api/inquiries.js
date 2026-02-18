import { list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id } = req.query

  try {
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
  } catch (error) {
    console.error("Error fetching inquiries:", error)
    return res.status(500).json({ error: "Failed to fetch inquiries" })
  }
}
