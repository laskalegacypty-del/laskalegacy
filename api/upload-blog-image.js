import { put } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return res.status(400).json({ error: "No file provided" })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return res.status(400).json({ error: "Invalid file type. Allowed: jpg, png, webp, gif" })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return res.status(400).json({ error: "File size too large. Maximum 10MB" })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const blobPath = `blog-images/${timestamp}-${filename}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Vercel Blob
    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
    })

    return res.status(200).json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return res.status(500).json({ error: "Failed to upload image" })
  }
}
