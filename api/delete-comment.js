import { put, list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { postId, commentId } = req.body

  if (!postId || !commentId) {
    return res.status(400).json({ error: "Post ID and comment ID are required" })
  }

  try {
    // Find comments file
    const { blobs } = await list({
      prefix: `blog-comments/${postId}`,
    })

    if (blobs.length === 0) {
      return res.status(404).json({ error: "Comments not found for this post" })
    }

    // Fetch comments
    const response = await fetch(blobs[0].url)
    const commentsData = await response.json()

    // Remove comment
    const initialLength = commentsData.comments.length
    commentsData.comments = commentsData.comments.filter((c) => c.id !== commentId)

    if (commentsData.comments.length === initialLength) {
      return res.status(404).json({ error: "Comment not found" })
    }

    // Save updated comments
    await put(
      blobs[0].pathname,
      JSON.stringify(commentsData, null, 2),
      {
        access: "public",
        contentType: "application/json",
      }
    )

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return res.status(500).json({ error: "Failed to delete comment" })
  }
}
