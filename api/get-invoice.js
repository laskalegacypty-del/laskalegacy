import { list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id, invoiceNumber, inquiryId } = req.query

  if (!id && !invoiceNumber && !inquiryId) {
    return res.status(400).json({ error: "Must provide id, invoiceNumber, or inquiryId" })
  }

  try {
    // List all invoice files
    const { blobs } = await list({
      prefix: "invoices/",
    })

    // Fetch and parse each invoice
    const invoices = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const response = await fetch(blob.url)
          const invoice = await response.json()
          return invoice
        } catch (error) {
          console.error(`Error loading invoice ${blob.pathname}:`, error)
          return null
        }
      })
    )

    // Filter out nulls
    const validInvoices = invoices.filter((inv) => inv !== null)

    // Find invoice by ID
    if (id) {
      const invoice = validInvoices.find((inv) => inv.id === id)
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" })
      }
      return res.status(200).json(invoice)
    }

    // Find invoice by invoice number
    if (invoiceNumber) {
      const invoice = validInvoices.find((inv) => inv.invoiceNumber === invoiceNumber)
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" })
      }
      return res.status(200).json(invoice)
    }

    // Find invoice by inquiry ID
    if (inquiryId) {
      const invoice = validInvoices.find((inv) => inv.inquiryId === inquiryId)
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found for this inquiry" })
      }
      return res.status(200).json(invoice)
    }
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return res.status(500).json({ error: "Failed to fetch invoice" })
  }
}
