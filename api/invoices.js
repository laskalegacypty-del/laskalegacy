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
    // GET - List/search invoices or get single invoice
    if (req.method === "GET") {
      const { id, invoiceNumber, inquiryId, status, clientEmail, startDate, endDate } = req.query

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

      // Filter by inquiry ID (for get-invoice functionality)
      if (inquiryId) {
        const invoice = validInvoices.find((inv) => inv.inquiryId === inquiryId)
        if (!invoice) {
          return res.status(404).json({ error: "Invoice not found for this inquiry" })
        }
        return res.status(200).json(invoice)
      }

      // Filter by invoice number
      if (invoiceNumber) {
        const invoice = validInvoices.find((inv) => inv.invoiceNumber === invoiceNumber)
        if (!invoice) {
          return res.status(404).json({ error: "Invoice not found" })
        }
        return res.status(200).json(invoice)
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

    // POST - Handle different invoice actions
    if (req.method === "POST") {
      const { action, ...invoiceData } = req.body

      // Route to different actions
      if (action === "approve") {
        return await handleApproveInvoice(req, res, invoiceData)
      } else if (action === "update-status") {
        return await handleUpdateStatus(req, res, invoiceData)
      } else if (action === "send-email") {
        return await handleSendEmail(req, res, invoiceData)
      } else {
        // Default: Create invoice record
        return await handleCreateInvoice(req, res, invoiceData)
      }
    }
  } catch (error) {
    console.error("Error in invoices API:", error)
    return res.status(500).json({ error: "Failed to process request" })
  }
}

// Helper function to get invoice by ID
async function getInvoiceById(id) {
  const { blobs } = await list({ prefix: `invoices/${id}` })
  if (blobs.length === 0) return null
  const response = await fetch(blobs[0].url)
  return { invoice: await response.json(), blob: blobs[0] }
}

// Create invoice record
async function handleCreateInvoice(req, res, invoiceData) {
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

// Approve invoice
async function handleApproveInvoice(req, res, invoiceData) {
  const { id } = invoiceData
  if (!id) {
    return res.status(400).json({ error: "Invoice ID required" })
  }

  const result = await getInvoiceById(id)
  if (!result) {
    return res.status(404).json({ error: "Invoice not found" })
  }

  const { invoice, blob } = result

  if (invoice.status !== "draft") {
    return res.status(400).json({ 
      error: `Invoice cannot be approved. Current status: ${invoice.status}` 
    })
  }

  invoice.status = "approved"
  invoice.updatedAt = new Date().toISOString()
  invoice.approvedAt = new Date().toISOString()

  if (!invoice.statusHistory) {
    invoice.statusHistory = []
  }
  invoice.statusHistory.push({
    status: "approved",
    changedAt: new Date().toISOString(),
  })

  await put(blob.pathname, JSON.stringify(invoice, null, 2), {
    access: "public",
    contentType: "application/json",
  })

  return res.status(200).json({ success: true, invoice })
}

// Update invoice status
async function handleUpdateStatus(req, res, invoiceData) {
  const { id, status } = invoiceData
  if (!id || !status) {
    return res.status(400).json({ error: "Invoice ID and status required" })
  }

  const validStatuses = ["draft", "approved", "sent", "paid", "overdue", "cancelled"]
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: "Invalid status. Must be one of: " + validStatuses.join(", ") 
    })
  }

  const result = await getInvoiceById(id)
  if (!result) {
    return res.status(404).json({ error: "Invoice not found" })
  }

  const { invoice, blob } = result

  invoice.status = status
  invoice.updatedAt = new Date().toISOString()

  if (!invoice.statusHistory) {
    invoice.statusHistory = []
  }
  invoice.statusHistory.push({
    status,
    changedAt: new Date().toISOString(),
  })

  await put(blob.pathname, JSON.stringify(invoice, null, 2), {
    access: "public",
    contentType: "application/json",
  })

  return res.status(200).json({ success: true, invoice })
}

// Send invoice email
async function handleSendEmail(req, res, invoiceData) {
  const { invoiceId } = invoiceData
  if (!invoiceId) {
    return res.status(400).json({ error: "Invoice ID required" })
  }

  const result = await getInvoiceById(invoiceId)
  if (!result) {
    return res.status(404).json({ error: "Invoice not found" })
  }

  const { invoice, blob } = result

  if (invoice.status !== "approved" && invoice.status !== "sent") {
    return res.status(400).json({ 
      error: `Invoice must be approved before sending. Current status: ${invoice.status}` 
    })
  }

  if (!invoice.client?.email) {
    return res.status(400).json({ error: "Client email not found in invoice" })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return res.status(500).json({ 
      error: "Email service not configured. Please set RESEND_API_KEY environment variable." 
    })
  }

  const pdfResponse = await fetch(invoice.pdfUrl)
  if (!pdfResponse.ok) {
    return res.status(500).json({ error: "Failed to fetch invoice PDF" })
  }
  const pdfBuffer = await pdfResponse.arrayBuffer()

  let Resend
  try {
    Resend = (await import("resend")).Resend
  } catch (error) {
    return res.status(500).json({ 
      error: "Resend package not installed. Please run: npm install resend" 
    })
  }

  const resend = new Resend(resendApiKey)

  const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0aa7a7; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .invoice-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .total { font-size: 18px; font-weight: bold; color: #0aa7a7; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Laska Legacy</h1>
          <p>Handcrafted Tack Made for Real Riding</p>
        </div>
        <div class="content">
          <h2>Invoice ${invoice.invoiceNumber}</h2>
          <p>Dear ${invoice.client.name},</p>
          <p>Thank you for your order! Please find your invoice attached.</p>
          <div class="invoice-details">
            <div class="detail-row">
              <strong>Invoice Number:</strong>
              <span>${invoice.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <strong>Invoice Date:</strong>
              <span>${invoiceDate}</span>
            </div>
            <div class="detail-row">
              <strong>Due Date:</strong>
              <span>${dueDate}</span>
            </div>
            <div class="detail-row total">
              <span>Total Amount:</span>
              <span>R${invoice.totals.total.toFixed(2)}</span>
            </div>
          </div>
          <h3>Payment Details</h3>
          <p>
            <strong>Bank:</strong> FNB<br>
            <strong>Account Type:</strong> Savings<br>
            <strong>Account Number:</strong> 62850552780<br>
            <strong>Reference:</strong> Inv #${invoice.invoiceNumber}
          </p>
          <p>Please use the invoice number as your payment reference when making the transfer.</p>
          <p>If you have any questions, please contact us at laskalegacy@gmail.com or 0725858288.</p>
          <p>Thank you for your business!</p>
          <p>Best regards,<br>Laska Legacy</p>
        </div>
        <div class="footer">
          <p>Plot 50 Buffeldooring Potchefstroom</p>
          <p>laskalegacy@gmail.com | 0725858288</p>
        </div>
      </div>
    </body>
    </html>
  `

  const emailResult = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Laska Legacy <noreply@laskalegacy.com>",
    to: invoice.client.email,
    subject: `Invoice ${invoice.invoiceNumber} - Laska Legacy`,
    html: emailHtml,
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  })

  if (emailResult.error) {
    console.error("Resend error:", emailResult.error)
    return res.status(500).json({ 
      error: "Failed to send email: " + emailResult.error.message 
    })
  }

  invoice.status = "sent"
  invoice.updatedAt = new Date().toISOString()
  invoice.sentAt = new Date().toISOString()
  invoice.emailSentTo = invoice.client.email

  if (!invoice.statusHistory) {
    invoice.statusHistory = []
  }
  invoice.statusHistory.push({
    status: "sent",
    changedAt: new Date().toISOString(),
  })

  await put(blob.pathname, JSON.stringify(invoice, null, 2), {
    access: "public",
    contentType: "application/json",
  })

  return res.status(200).json({ 
    success: true, 
    message: "Invoice sent successfully",
    emailId: emailResult.data?.id,
    invoice 
  })
}
  } catch (error) {
    console.error("Error in invoices API:", error)
    return res.status(500).json({ error: "Failed to process request" })
  }
}
