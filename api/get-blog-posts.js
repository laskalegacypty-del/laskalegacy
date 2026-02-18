import { list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const isAdmin = req.headers.cookie?.includes("admin=1")
  const category = req.query.category
  const statusFilter = req.query.status

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
          console.error(`Error loading blog post ${blob.pathname}:`, error)
          return null
        }
      })
    )

    // Filter out nulls
    let validPosts = posts.filter((post) => post !== null)

    // Filter by status (only published for public, all for admin)
    if (!isAdmin) {
      validPosts = validPosts.filter((post) => post.status === "published")
    } else if (statusFilter) {
      validPosts = validPosts.filter((post) => post.status === statusFilter)
    }

    // Filter by category if provided
    if (category) {
      validPosts = validPosts.filter((post) =>
        post.categories && post.categories.some((cat) =>
          cat.toLowerCase() === category.toLowerCase()
        )
      )
    }

    // Sort by publishDate (newest first)
    validPosts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))

    return res.status(200).json(validPosts)
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return res.status(500).json({ error: "Failed to fetch blog posts" })
  }
}
