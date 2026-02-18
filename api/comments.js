import { put, list, del } from "@vercel/blob"

export default async function handler(req, res) {
  // GET - Get comments for a post
  if (req.method === "GET") {
    const { postId } = req.query

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" })
    }

    const isAdmin = req.headers.cookie?.includes("admin=1")

    try {
      const { blobs } = await list({ prefix: `blog-comments/${postId}` })

      if (blobs.length === 0) {
        return res.status(200).json({ postId, comments: [] })
      }

      const response = await fetch(blobs[0].url)
      const commentsData = await response.json()

      let comments = commentsData.comments || []
      if (!isAdmin) {
        comments = comments.filter((comment) => comment.approved === true)
      }

      comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return res.status(200).json({ postId, comments })
    } catch (error) {
      console.error("Error fetching comments:", error)
      return res.status(500).json({ error: "Failed to fetch comments" })
    }
  }

  // POST - Submit new comment
  if (req.method === "POST") {
    const { postId, author, email, content, commentId, approved } = req.body

    // Approve comment (admin only)
    if (commentId !== undefined && approved !== undefined) {
      const isAdmin = req.headers.cookie?.includes("admin=1")
      if (!isAdmin) {
        return res.status(401).json({ error: "Unauthorized" })
      }

      if (!postId) {
        return res.status(400).json({ error: "Post ID is required" })
      }

      try {
        const { blobs } = await list({ prefix: `blog-comments/${postId}` })

        if (blobs.length === 0) {
          return res.status(404).json({ error: "Comments not found for this post" })
        }

        const response = await fetch(blobs[0].url)
        const commentsData = await response.json()

        const commentIndex = commentsData.comments.findIndex((c) => c.id === commentId)
        if (commentIndex === -1) {
          return res.status(404).json({ error: "Comment not found" })
        }

        commentsData.comments[commentIndex].approved = approved === true

        await put(blobs[0].pathname, JSON.stringify(commentsData, null, 2), {
          access: "public",
          contentType: "application/json",
        })

        return res.status(200).json({
          success: true,
          comment: commentsData.comments[commentIndex],
        })
      } catch (error) {
        console.error("Error approving comment:", error)
        return res.status(500).json({ error: "Failed to update comment" })
      }
    }

    // Submit new comment
    if (!postId || !author || !email || !content) {
      return res.status(400).json({ error: "All fields are required" })
    }

    if (author.trim().length === 0 || content.trim().length === 0) {
      return res.status(400).json({ error: "Author and content cannot be empty" })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" })
    }

    const sanitize = (str) => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
    }

    try {
      const postBlobs = await list({ prefix: `blog/${postId}` })
      if (postBlobs.blobs.length === 0) {
        return res.status(404).json({ error: "Blog post not found" })
      }

      const { blobs } = await list({ prefix: `blog-comments/${postId}` })

      let commentsData = { postId, comments: [] }

      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url)
        commentsData = await response.json()
      }

      const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newComment = {
        id: commentId,
        author: sanitize(author.trim()),
        email: email.trim().toLowerCase(),
        content: sanitize(content.trim()),
        createdAt: new Date().toISOString(),
        approved: false,
      }

      commentsData.comments.push(newComment)

      await put(`blog-comments/${postId}.json`, JSON.stringify(commentsData, null, 2), {
        access: "public",
        contentType: "application/json",
      })

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

  // DELETE - Delete comment
  if (req.method === "DELETE") {
    const isAdmin = req.headers.cookie?.includes("admin=1")
    if (!isAdmin) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { postId, commentId } = req.query

    if (!postId || !commentId) {
      return res.status(400).json({ error: "Post ID and comment ID are required" })
    }

    try {
      const { blobs } = await list({ prefix: `blog-comments/${postId}` })

      if (blobs.length === 0) {
        return res.status(404).json({ error: "Comments not found for this post" })
      }

      const response = await fetch(blobs[0].url)
      const commentsData = await response.json()

      const initialLength = commentsData.comments.length
      commentsData.comments = commentsData.comments.filter((c) => c.id !== commentId)

      if (commentsData.comments.length === initialLength) {
        return res.status(404).json({ error: "Comment not found" })
      }

      await put(blobs[0].pathname, JSON.stringify(commentsData, null, 2), {
        access: "public",
        contentType: "application/json",
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error("Error deleting comment:", error)
      return res.status(500).json({ error: "Failed to delete comment" })
    }
  }

  return res.status(405).end()
}
