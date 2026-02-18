import { put, list, del } from "@vercel/blob"

export default async function handler(req, res) {
  const isAdmin = req.headers.cookie?.includes("admin=1")

  // GET - List posts or get single post
  if (req.method === "GET") {
    const { id, slug, category, status, q } = req.query

    // Search functionality
    if (q) {
      try {
        const { blobs } = await list({ prefix: "blog/" })
        const posts = await Promise.all(
          blobs.map(async (blob) => {
            try {
              const response = await fetch(blob.url)
              return await response.json()
            } catch (error) {
              return null
            }
          })
        )

        let validPosts = posts.filter((post) => post !== null && post.status === "published")
        const query = q.toLowerCase().trim()
        const queryTerms = query.split(/\s+/).filter((term) => term.length > 0)

        const matchesPost = (post) => {
          const searchableText = [
            post.title,
            post.excerpt,
            post.content?.replace(/<[^>]*>/g, " "),
            post.author,
            ...(post.categories || []),
            ...(post.metaKeywords || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          return queryTerms.every((term) => searchableText.includes(term))
        }

        const matchingPosts = validPosts.filter(matchesPost)
        matchingPosts.sort((a, b) => {
          const aTitleMatch = a.title.toLowerCase().includes(query)
          const bTitleMatch = b.title.toLowerCase().includes(query)
          const aExcerptMatch = a.excerpt?.toLowerCase().includes(query)
          const bExcerptMatch = b.excerpt?.toLowerCase().includes(query)

          if (aTitleMatch && !bTitleMatch) return -1
          if (!aTitleMatch && bTitleMatch) return 1
          if (aExcerptMatch && !bExcerptMatch) return -1
          if (!aExcerptMatch && bExcerptMatch) return 1
          return new Date(b.publishDate) - new Date(a.publishDate)
        })

        return res.status(200).json({ query: q, results: matchingPosts, count: matchingPosts.length })
      } catch (error) {
        console.error("Error searching blog posts:", error)
        return res.status(500).json({ error: "Failed to search blog posts" })
      }
    }

    // Get single post by ID or slug
    if (id || slug) {
      try {
        const { blobs } = await list({ prefix: "blog/" })
        let post = null
        let postBlob = null

        for (const blob of blobs) {
          try {
            const response = await fetch(blob.url)
            const candidate = await response.json()
            if ((id && candidate.id === id) || (slug && candidate.slug === slug)) {
              if (!isAdmin && candidate.status !== "published") {
                return res.status(404).json({ error: "Post not found" })
              }
              post = candidate
              postBlob = blob
              break
            }
          } catch (error) {
            console.error(`Error loading blog post ${blob.pathname}:`, error)
          }
        }

        if (!post) {
          return res.status(404).json({ error: "Post not found" })
        }

        // Increment view count for published posts viewed by non-admin users
        if (!isAdmin && post.status === "published" && slug) {
          try {
            // Initialize views if it doesn't exist
            if (typeof post.views !== "number") {
              post.views = 0
            }
            post.views = (post.views || 0) + 1
            post.updatedAt = new Date().toISOString()

            // Save updated post with view count
            await put(postBlob.pathname, JSON.stringify(post, null, 2), {
              access: "public",
              contentType: "application/json",
            })
          } catch (error) {
            console.error("Error updating view count:", error)
            // Continue even if view count update fails
          }
        }

        // Get related posts
        const allPosts = await Promise.all(
          blobs.map(async (blob) => {
            try {
              const response = await fetch(blob.url)
              return await response.json()
            } catch (error) {
              return null
            }
          })
        )

        const publishedPosts = allPosts.filter(
          (p) => p !== null && p.status === "published" && p.id !== post.id
        )

        const relatedPosts = []
        if (post.categories && post.categories.length > 0) {
          const categoryMatches = publishedPosts
            .filter((p) =>
              p.categories && p.categories.some((cat) => post.categories.includes(cat))
            )
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, 3)
          relatedPosts.push(...categoryMatches)
        }

        if (relatedPosts.length < 3) {
          const authorMatches = publishedPosts
            .filter((p) => p.author === post.author && !relatedPosts.find((rp) => rp.id === p.id))
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, 3 - relatedPosts.length)
          relatedPosts.push(...authorMatches)
        }

        if (relatedPosts.length < 3) {
          const recentPosts = publishedPosts
            .filter((p) => !relatedPosts.find((rp) => rp.id === p.id))
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, 3 - relatedPosts.length)
          relatedPosts.push(...recentPosts)
        }

        return res.status(200).json({
          ...post,
          relatedPosts: relatedPosts.slice(0, 5),
        })
      } catch (error) {
        console.error("Error fetching blog post:", error)
        return res.status(500).json({ error: "Failed to fetch blog post" })
      }
    }

    // List all posts
    try {
      const { blobs } = await list({ prefix: "blog/" })
      const posts = await Promise.all(
        blobs.map(async (blob) => {
          try {
            const response = await fetch(blob.url)
            return await response.json()
          } catch (error) {
            console.error(`Error loading blog post ${blob.pathname}:`, error)
            return null
          }
        })
      )

      let validPosts = posts.filter((post) => post !== null)

      if (!isAdmin) {
        validPosts = validPosts.filter((post) => post.status === "published")
      } else if (status) {
        validPosts = validPosts.filter((post) => post.status === status)
      }

      if (category) {
        validPosts = validPosts.filter((post) =>
          post.categories && post.categories.some((cat) => cat.toLowerCase() === category.toLowerCase())
        )
      }

      validPosts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))

      return res.status(200).json(validPosts)
    } catch (error) {
      console.error("Error fetching blog posts:", error)
      return res.status(500).json({ error: "Failed to fetch blog posts" })
    }
  }

  // POST - Create new post
  if (req.method === "POST") {
    if (!isAdmin) {
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
        categories: Array.isArray(categories)
          ? categories
          : categories
          ? categories.split(",").map((c) => c.trim()).filter((c) => c)
          : [],
        publishDate: publishDate || now,
        createdAt: now,
        updatedAt: now,
        status: status || "draft",
        slug,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt || "",
        metaKeywords: Array.isArray(metaKeywords)
          ? metaKeywords
          : metaKeywords
          ? metaKeywords.split(",").map((k) => k.trim()).filter((k) => k)
          : [],
      }

      await put(`blog/${id}.json`, JSON.stringify(blogPost, null, 2), {
        access: "public",
        contentType: "application/json",
      })

      return res.status(200).json({ success: true, post: blogPost })
    } catch (error) {
      console.error("Error creating blog post:", error)
      return res.status(500).json({ error: "Failed to create blog post" })
    }
  }

  // PUT - Update post
  if (req.method === "PUT") {
    if (!isAdmin) {
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
      const { blobs } = await list({ prefix: `blog/${id}` })

      if (blobs.length === 0) {
        return res.status(404).json({ error: "Blog post not found" })
      }

      const response = await fetch(blobs[0].url)
      const currentPost = await response.json()

      const updatedPost = {
        ...currentPost,
        updatedAt: new Date().toISOString(),
      }

      if (title !== undefined) {
        updatedPost.title = title
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

      await put(blobs[0].pathname, JSON.stringify(updatedPost, null, 2), {
        access: "public",
        contentType: "application/json",
      })

      return res.status(200).json({ success: true, post: updatedPost })
    } catch (error) {
      console.error("Error updating blog post:", error)
      return res.status(500).json({ error: "Failed to update blog post" })
    }
  }

  // DELETE - Delete post
  if (req.method === "DELETE") {
    if (!isAdmin) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: "Post ID is required" })
    }

    try {
      const { blobs } = await list({ prefix: `blog/${id}` })

      if (blobs.length === 0) {
        return res.status(404).json({ error: "Blog post not found" })
      }

      await del(blobs[0].url)

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error("Error deleting blog post:", error)
      return res.status(500).json({ error: "Failed to delete blog post" })
    }
  }

  return res.status(405).end()
}
