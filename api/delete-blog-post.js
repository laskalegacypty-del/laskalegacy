import { del, list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id } = req.body

  if (!id) {
    return res.status(400).json({ error: "Post ID is required" })
  }

  try {
    // Find the blog post file
    const { blobs } = await list({
      prefix: `blog/${id}`,
    })

    if (blobs.length === 0) {
      return res.status(404).json({ error: "Blog post not found" })
    }

    // Delete the blob
    await del(blobs[0].url)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return res.status(500).json({ error: "Failed to delete blog post" })
  }
}
