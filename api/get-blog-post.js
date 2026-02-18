import { list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const { id, slug } = req.query

  if (!id && !slug) {
    return res.status(400).json({ error: "ID or slug is required" })
  }

  const isAdmin = req.headers.cookie?.includes("admin=1")

  try {
    // List all blog post files
    const { blobs } = await list({
      prefix: "blog/",
    })

    // Find the matching post
    let post = null
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        const candidate = await response.json()
        
        if ((id && candidate.id === id) || (slug && candidate.slug === slug)) {
          // Check if user can access this post
          if (!isAdmin && candidate.status !== "published") {
            return res.status(404).json({ error: "Post not found" })
          }
          post = candidate
          break
        }
      } catch (error) {
        console.error(`Error loading blog post ${blob.pathname}:`, error)
      }
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    // Get related posts
    const allPosts = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const response = await fetch(blob.url)
          const p = await response.json()
          return p
        } catch (error) {
          return null
        }
      })
    )

    const publishedPosts = allPosts.filter(
      (p) => p !== null && p.status === "published" && p.id !== post.id
    )

    // Find related posts by category (highest priority), then author, then recent
    const relatedPosts = []
    
    // Same categories
    if (post.categories && post.categories.length > 0) {
      const categoryMatches = publishedPosts
        .filter((p) =>
          p.categories && p.categories.some((cat) => post.categories.includes(cat))
        )
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(0, 3)
      relatedPosts.push(...categoryMatches)
    }

    // Same author
    if (relatedPosts.length < 3) {
      const authorMatches = publishedPosts
        .filter((p) => p.author === post.author && !relatedPosts.find(rp => rp.id === p.id))
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(0, 3 - relatedPosts.length)
      relatedPosts.push(...authorMatches)
    }

    // Recent posts as fallback
    if (relatedPosts.length < 3) {
      const recentPosts = publishedPosts
        .filter((p) => !relatedPosts.find(rp => rp.id === p.id))
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
