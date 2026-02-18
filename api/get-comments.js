import { list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const { postId } = req.query

  if (!postId) {
    return res.status(400).json({ error: "Post ID is required" })
  }

  const isAdmin = req.headers.cookie?.includes("admin=1")

  try {
    // Try to find comments file for this post
    const { blobs } = await list({
      prefix: `blog-comments/${postId}`,
    })

    if (blobs.length === 0) {
      return res.status(200).json({ postId, comments: [] })
    }

    // Fetch comments
    const response = await fetch(blobs[0].url)
    const commentsData = await response.json()

    // Filter comments based on admin status
    let comments = commentsData.comments || []
    if (!isAdmin) {
      // Only return approved comments for public
      comments = comments.filter((comment) => comment.approved === true)
    }

    // Sort by date (newest first)
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return res.status(200).json({
      postId,
      comments,
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return res.status(500).json({ error: "Failed to fetch comments" })
  }
}
