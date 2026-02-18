import { put, list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const {
    id,
    title,
    excerpt,
    content,
    featuredImage,
    author,
    categories,
    publishDate,
    status,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = req.body

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

    // Fetch current post
    const response = await fetch(blobs[0].url)
    const currentPost = await response.json()

    // Update fields
    const updatedPost = {
      ...currentPost,
      updatedAt: new Date().toISOString(),
    }

    if (title !== undefined) {
      updatedPost.title = title
      // Regenerate slug if title changed
      if (title !== currentPost.title) {
        updatedPost.slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      }
    }
    if (excerpt !== undefined) updatedPost.excerpt = excerpt
    if (content !== undefined) updatedPost.content = content
    if (featuredImage !== undefined) updatedPost.featuredImage = featuredImage
    if (author !== undefined) updatedPost.author = author
    if (categories !== undefined) {
      updatedPost.categories = Array.isArray(categories)
        ? categories
        : categories
        ? categories.split(",").map((c) => c.trim()).filter((c) => c)
        : []
    }
    if (publishDate !== undefined) updatedPost.publishDate = publishDate
    if (status !== undefined) updatedPost.status = status
    if (metaTitle !== undefined) updatedPost.metaTitle = metaTitle
    if (metaDescription !== undefined) updatedPost.metaDescription = metaDescription
    if (metaKeywords !== undefined) {
      updatedPost.metaKeywords = Array.isArray(metaKeywords)
        ? metaKeywords
        : metaKeywords
        ? metaKeywords.split(",").map((k) => k.trim()).filter((k) => k)
        : []
    }

    // Save back to blob
    await put(
      blobs[0].pathname,
      JSON.stringify(updatedPost, null, 2),
      {
        access: "public",
        contentType: "application/json",
      }
    )

    return res.status(200).json({ success: true, post: updatedPost })
  } catch (error) {
    console.error("Error updating blog post:", error)
    return res.status(500).json({ error: "Failed to update blog post" })
  }
}
