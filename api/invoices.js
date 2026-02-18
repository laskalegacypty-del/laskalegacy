import { put, list } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end()
  }

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    // GET - List/search invoices
    if (req.method === "GET") {
      const { id, invoiceNumber, status, clientEmail, startDate, endDate } = req.query

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
      let validInvoices = invoices.filter((inv) => inv !== null)

      // Filter by ID
      if (id) {
        const invoice = validInvoices.find((inv) => inv.id === id)
        if (!invoice) {
          return res.status(404).json({ error: "Invoice not found" })
        }
        return res.status(200).json(invoice)
      }

      // Filter by invoice number
      if (invoiceNumber) {
        validInvoices = validInvoices.filter(
          (inv) => inv.invoiceNumber === invoiceNumber
        )
      }

      // Filter by status
      if (status) {
        validInvoices = validInvoices.filter((inv) => inv.status === status)
      }

      // Filter by client email
      if (clientEmail) {
        validInvoices = validInvoices.filter(
          (inv) => inv.client?.email?.toLowerCase() === clientEmail.toLowerCase()
        )
      }

      // Filter by date range
      if (startDate) {
        const start = new Date(startDate)
        validInvoices = validInvoices.filter(
          (inv) => new Date(inv.invoiceDate) >= start
        )
      }

      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // End of day
        validInvoices = validInvoices.filter(
          (inv) => new Date(inv.invoiceDate) <= end
        )
      }

      // Sort by date (newest first) or invoice number
      validInvoices.sort((a, b) => {
        const dateA = new Date(a.invoiceDate)
        const dateB = new Date(b.invoiceDate)
        return dateB - dateA
      })

      return res.status(200).json(validInvoices)
    }

    // POST - Create invoice record
    if (req.method === "POST") {
      const invoiceData = req.body

      // Validate required fields
      if (!invoiceData.invoiceNumber || !invoiceData.invoiceDate || !invoiceData.client) {
        return res.status(400).json({ error: "Missing required fields: invoiceNumber, invoiceDate, client" })
      }

      // Generate invoice ID if not provided
      const invoiceId = invoiceData.id || `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const invoice = {
        id: invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate || new Date(new Date(invoiceData.invoiceDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: invoiceData.status || "draft",
        client: invoiceData.client,
        items: invoiceData.items || [],
        totals: invoiceData.totals || {},
        pdfUrl: invoiceData.pdfUrl,
        inquiryId: invoiceData.inquiryId,
        createdAt: invoiceData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Store invoice in blob
      await put(
        `invoices/${invoiceId}.json`,
        JSON.stringify(invoice, null, 2),
        {
          access: "public",
          contentType: "application/json",
        }
      )

      return res.status(200).json({ success: true, invoice })
    }
  } catch (error) {
    console.error("Error in invoices API:", error)
    return res.status(500).json({ error: "Failed to process request" })
  }
}
