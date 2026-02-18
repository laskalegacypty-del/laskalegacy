import { list, put } from "@vercel/blob"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  // Admin-only
  if (!req.headers.cookie?.includes("admin=1")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { invoiceId } = req.body

  if (!invoiceId) {
    return res.status(400).json({ error: "Invoice ID required" })
  }

  try {
    // Find the invoice file
    const { blobs } = await list({
      prefix: `invoices/${invoiceId}`,
    })

    if (blobs.length === 0) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    // Fetch invoice
    const response = await fetch(blobs[0].url)
    const invoice = await response.json()

    // Check if invoice is approved or sent
    if (invoice.status !== "approved" && invoice.status !== "sent") {
      return res.status(400).json({ 
        error: `Invoice must be approved before sending. Current status: ${invoice.status}` 
      })
    }

    // Check if client email exists
    if (!invoice.client?.email) {
      return res.status(400).json({ error: "Client email not found in invoice" })
    }

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return res.status(500).json({ 
        error: "Email service not configured. Please set RESEND_API_KEY environment variable." 
      })
    }

    // Fetch PDF from URL
    const pdfResponse = await fetch(invoice.pdfUrl)
    if (!pdfResponse.ok) {
      return res.status(500).json({ error: "Failed to fetch invoice PDF" })
    }
    const pdfBuffer = await pdfResponse.arrayBuffer()

    // Import Resend dynamically (to avoid issues if not installed)
    let Resend
    try {
      Resend = (await import("resend")).Resend
    } catch (error) {
      return res.status(500).json({ 
        error: "Resend package not installed. Please run: npm install resend" 
      })
    }

    const resend = new Resend(resendApiKey)

    // Format invoice date and due date
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

    // Create HTML email template
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
          .button { display: inline-block; padding: 12px 24px; background-color: #0aa7a7; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
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

    // Send email with Resend
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

    // Update invoice status to "sent"
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

    // Save updated invoice
    await put(
      blobs[0].pathname,
      JSON.stringify(invoice, null, 2),
      {
        access: "public",
        contentType: "application/json",
      }
    )

    return res.status(200).json({ 
      success: true, 
      message: "Invoice sent successfully",
      emailId: emailResult.data?.id,
      invoice 
    })
  } catch (error) {
    console.error("Error sending invoice email:", error)
    return res.status(500).json({ 
      error: "Failed to send invoice email: " + error.message 
    })
  }
}
