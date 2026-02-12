export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end()
  
    if (req.body.password !== process.env.ADMIN_PASSWORD)
      return res.status(401).end()
  
    res.setHeader(
      "Set-Cookie",
      "admin=1; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax"
    )
  
    res.status(200).json({ ok: true })
  }