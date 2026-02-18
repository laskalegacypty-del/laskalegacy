import { list } from "@vercel/blob"

export default async function handler(req, res) {
  const { type } = req.query

  // RSS Feed
  if (type === "rss" || (!type && req.headers.accept?.includes("application/rss+xml"))) {
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

      const publishedPosts = posts
        .filter((post) => post !== null && post.status === "published")
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(0, 20)

      const baseUrl = req.headers.host
      const protocol = req.headers["x-forwarded-proto"] || "https"
      const fullBaseUrl = `${protocol}://${baseUrl}`

      const escapeXml = (str) => {
        if (!str) return ""
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;")
      }

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

  // Sitemap
  if (type === "sitemap") {
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

      const publishedPosts = posts.filter((post) => post !== null && post.status === "published")

      const baseUrl = req.headers.host
      const protocol = req.headers["x-forwarded-proto"] || "https"
      const fullBaseUrl = `${protocol}://${baseUrl}`

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

  return res.status(400).json({ error: "Invalid feed type. Use ?type=rss or ?type=sitemap" })
}
