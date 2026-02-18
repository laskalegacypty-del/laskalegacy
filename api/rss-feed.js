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

    // Filter to only published posts and sort by date
    const publishedPosts = posts
      .filter((post) => post !== null && post.status === "published")
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, 20) // Limit to 20 most recent posts

    // Get base URL from request
    const baseUrl = req.headers.host
    const protocol = req.headers["x-forwarded-proto"] || "https"
    const fullBaseUrl = `${protocol}://${baseUrl}`

    // Escape XML special characters
    const escapeXml = (str) => {
      if (!str) return ""
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
    }

    // Generate RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Between the Poles - Laska Legacy Blog</title>
    <link>${fullBaseUrl}/blog</link>
    <description>Blog posts from Laska Legacy</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${publishedPosts.length > 0 ? new Date(publishedPosts[0].publishDate).toUTCString() : new Date().toUTCString()}</pubDate>
${publishedPosts
  .map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${fullBaseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${fullBaseUrl}/blog/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || post.metaDescription || "")}</description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <author>${escapeXml(post.author)}</author>
      <pubDate>${new Date(post.publishDate).toUTCString()}</pubDate>
      <category>${(post.categories || []).map((cat) => escapeXml(cat)).join(", ")}</category>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`

    res.setHeader("Content-Type", "application/rss+xml")
    return res.status(200).send(rss)
  } catch (error) {
    console.error("Error generating RSS feed:", error)
    return res.status(500).json({ error: "Failed to generate RSS feed" })
  }
}
