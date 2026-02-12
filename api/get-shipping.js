import fs from "fs"
import path from "path"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  try {
    const filePath = path.join(process.cwd(), "lib", "shipping.json")
    const raw = fs.readFileSync(filePath, "utf8")
    const shipping = JSON.parse(raw)
    return res.status(200).json(shipping)
  } catch (error) {
    return res.status(500).json({ error: "Failed to load shipping prices" })
  }
}
