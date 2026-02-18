import { list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

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
    const publishedPosts = posts.filter(
      (post) => post !== null && post.status === "published"
    )

    // Get base URL from request
    const baseUrl = req.headers.host
    const protocol = req.headers["x-forwarded-proto"] || "https"
    const fullBaseUrl = `${protocol}://${baseUrl}`

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${fullBaseUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${fullBaseUrl}/blog</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${publishedPosts
  .map(
    (post) => `  <url>
    <loc>${fullBaseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt || post.publishDate).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
  )
  .join("\n")}
</urlset>`

    res.setHeader("Content-Type", "application/xml")
    return res.status(200).send(sitemap)
  } catch (error) {
    console.error("Error generating sitemap:", error)
    return res.status(500).json({ error: "Failed to generate sitemap" })
  }
}
