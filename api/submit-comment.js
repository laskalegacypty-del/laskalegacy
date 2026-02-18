import { put, list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const { postId, author, email, content } = req.body

  if (!postId || !author || !email || !content) {
    return res.status(400).json({ error: "All fields are required" })
  }

  // Basic validation
  if (author.trim().length === 0 || content.trim().length === 0) {
    return res.status(400).json({ error: "Author and content cannot be empty" })
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address" })
  }

  // Sanitize content (basic HTML escaping)
  const sanitize = (str) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
  }

  try {
    // Verify post exists
    const postBlobs = await list({ prefix: `blog/${postId}` })
    if (postBlobs.blobs.length === 0) {
      return res.status(404).json({ error: "Blog post not found" })
    }

    // Check if comments file exists
    const { blobs } = await list({
      prefix: `blog-comments/${postId}`,
    })

    let commentsData = { postId, comments: [] }

    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url)
      commentsData = await response.json()
    }

    // Create new comment
    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newComment = {
      id: commentId,
      author: sanitize(author.trim()),
      email: email.trim().toLowerCase(),
      content: sanitize(content.trim()),
      createdAt: new Date().toISOString(),
      approved: false, // Requires admin approval
    }

    commentsData.comments.push(newComment)

    // Save comments
    await put(
      `blog-comments/${postId}.json`,
      JSON.stringify(commentsData, null, 2),
      {
        access: "public",
        contentType: "application/json",
      }
    )

    return res.status(200).json({
      success: true,
      comment: newComment,
      message: "Comment submitted and awaiting approval",
    })
  } catch (error) {
    console.error("Error submitting comment:", error)
    return res.status(500).json({ error: "Failed to submit comment" })
  }
}
