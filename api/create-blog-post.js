import { put } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const {
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

  if (!title || !content || !author) {
    return res.status(400).json({ error: "Title, content, and author are required" })
  }

  try {
    // Generate unique ID and slug
    const id = `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const now = new Date().toISOString()
    const blogPost = {
      id,
      title,
      excerpt: excerpt || "",
      content,
      featuredImage: featuredImage || "",
      author,
      categories: Array.isArray(categories) ? categories : (categories ? categories.split(",").map(c => c.trim()).filter(c => c) : []),
      publishDate: publishDate || now,
      createdAt: now,
      updatedAt: now,
      status: status || "draft",
      slug,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || "",
      metaKeywords: Array.isArray(metaKeywords) ? metaKeywords : (metaKeywords ? metaKeywords.split(",").map(k => k.trim()).filter(k => k) : []),
    }

    // Store in Vercel Blob
    await put(
      `blog/${id}.json`,
      JSON.stringify(blogPost, null, 2),
      {
        access: "public",
        contentType: "application/json",
      }
    )

    return res.status(200).json({ success: true, post: blogPost })
  } catch (error) {
    console.error("Error creating blog post:", error)
    return res.status(500).json({ error: "Failed to create blog post" })
  }
}
