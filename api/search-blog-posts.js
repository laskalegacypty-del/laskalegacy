import { list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const { q } = req.query

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: "Search query is required" })
  }

  try {
    // List all blog post files
    const { blobs } = await list({
      prefix: "blog/",
    })

    // Fetch and parse each blog post
    const posts = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const response = await fetch(blob.url)
          const post = await response.json()
          return post
        } catch (error) {
          return null
        }
      })
    )

    // Filter to only published posts
    let validPosts = posts.filter((post) => post !== null && post.status === "published")

    // Normalize search query
    const query = q.toLowerCase().trim()
    const queryTerms = query.split(/\s+/).filter((term) => term.length > 0)

    // Search function - checks if query matches in various fields
    const matchesPost = (post) => {
      const searchableText = [
        post.title,
        post.excerpt,
        post.content?.replace(/<[^>]*>/g, " "), // Strip HTML tags
        post.author,
        ...(post.categories || []),
        ...(post.metaKeywords || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      // Check if all query terms appear in searchable text
      return queryTerms.every((term) => searchableText.includes(term))
    }

    // Filter posts that match search
    const matchingPosts = validPosts.filter(matchesPost)

    // Sort by relevance (posts with matches in title/excerpt first, then by date)
    matchingPosts.sort((a, b) => {
      const aTitleMatch = a.title.toLowerCase().includes(query)
      const bTitleMatch = b.title.toLowerCase().includes(query)
      const aExcerptMatch = a.excerpt?.toLowerCase().includes(query)
      const bExcerptMatch = b.excerpt?.toLowerCase().includes(query)

      // Title matches first
      if (aTitleMatch && !bTitleMatch) return -1
      if (!aTitleMatch && bTitleMatch) return 1

      // Then excerpt matches
      if (aExcerptMatch && !bExcerptMatch) return -1
      if (!aExcerptMatch && bExcerptMatch) return 1

      // Then by date (newest first)
      return new Date(b.publishDate) - new Date(a.publishDate)
    })

    return res.status(200).json({
      query: q,
      results: matchingPosts,
      count: matchingPosts.length,
    })
  } catch (error) {
    console.error("Error searching blog posts:", error)
    return res.status(500).json({ error: "Failed to search blog posts" })
  }
}
