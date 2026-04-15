import type { Tables } from "@/integrations/supabase/types";

type Booking = Tables<"bookings"> & {
  scheduled_classes: {
    course_templates: {
      name: string;
      code: string;
    } | null;
    start_datetime: string;
    location: string | null;
  } | null;
};

interface InvoiceData {
  invoiceNumber: string;
  bookingId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseCode: string;
  courseDate: string;
  location: string;
  subtotal: number;
  gst: number;
  total: number;
  paid: number;
  balance: number;
  generatedDate: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      border-bottom: 3px solid #0F172A;
      padding-bottom: 20px;
    }
    .company-info h1 {
      margin: 0;
      color: #0F172A;
      font-size: 28px;
    }
    .company-info p {
      margin: 5px 0;
      color: #64748b;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      margin: 0;
      color: #0F172A;
      font-size: 32px;
    }
    .invoice-info p {
      margin: 5px 0;
      color: #64748b;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h3 {
      color: #0F172A;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 10px;
    }
    .label {
      font-weight: bold;
      color: #64748b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #0F172A;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .totals {
      margin-top: 30px;
      float: right;
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .totals-row.total {
      font-size: 18px;
      font-weight: bold;
      border-top: 2px solid #0F172A;
      padding-top: 12px;
      color: #0F172A;
    }
    .totals-row.balance {
      background: #fef3c7;
      padding: 12px;
      margin-top: 10px;
      border-radius: 4px;
    }
    .footer {
      clear: both;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .payment-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .payment-info h4 {
      margin-top: 0;
      color: #0F172A;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>The Training Hub</h1>
      <p>ABN: XX XXX XXX XXX</p>
      <p>info@thetraininghub.com.au</p>
      <p>1300 XXX XXX</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>${data.invoiceNumber}</strong></p>
      <p>${data.generatedDate}</p>
    </div>
  </div>

  <div class="section">
    <h3>Bill To</h3>
    <div class="info-grid">
      <span class="label">Name:</span>
      <span>${data.studentName}</span>
      <span class="label">Email:</span>
      <span>${data.studentEmail}</span>
      <span class="label">Booking ID:</span>
      <span>${data.bookingId.substring(0, 8)}</span>
    </div>
  </div>

  <div class="section">
    <h3>Course Details</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Course Code</th>
          <th>Date</th>
          <th>Location</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.courseName}</td>
          <td>${data.courseCode}</td>
          <td>${data.courseDate}</td>
          <td>${data.location}</td>
          <td>$${data.subtotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>$${data.subtotal.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>GST (10%):</span>
      <span>$${data.gst.toFixed(2)}</span>
    </div>
    <div class="totals-row total">
      <span>Total:</span>
      <span>$${data.total.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Paid:</span>
      <span>$${data.paid.toFixed(2)}</span>
    </div>
    <div class="totals-row balance">
      <span><strong>Balance Due:</strong></span>
      <span><strong>$${data.balance.toFixed(2)}</strong></span>
    </div>
  </div>

  <div class="payment-info">
    <h4>Payment Information</h4>
    <p><strong>Bank Details:</strong></p>
    <p>Account Name: The Training Hub<br>
    BSB: XXX-XXX<br>
    Account Number: XXXXXXXXXX</p>
    <p style="margin-top: 15px;">
      <strong>Reference:</strong> ${data.invoiceNumber}
    </p>
    <p style="margin-top: 15px; font-size: 12px; color: #64748b;">
      Payment is due before course commencement. Please use the invoice number as your payment reference.
    </p>
  </div>

  <div class="footer">
    <p>Thank you for choosing The Training Hub</p>
    <p>This is a computer-generated invoice and does not require a signature</p>
  </div>
</body>
</html>
  `;
}

export function prepareInvoiceData(booking: Booking, invoiceNumber: string): InvoiceData {
  const subtotal = booking.total_amount / 1.1; // Remove GST to get subtotal
  const gst = booking.total_amount - subtotal;
  const balance = booking.total_amount - booking.paid_amount;

  return {
    invoiceNumber,
    bookingId: booking.id,
    studentName: booking.student_name,
    studentEmail: booking.student_email,
    courseName: booking.scheduled_classes?.course_templates?.name || "Training Course",
    courseCode: booking.scheduled_classes?.course_templates?.code || "N/A",
    courseDate: booking.scheduled_classes?.start_datetime 
      ? new Date(booking.scheduled_classes.start_datetime).toLocaleDateString("en-AU", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      : "TBA",
    location: booking.scheduled_classes?.location || "TBA",
    subtotal,
    gst,
    total: booking.total_amount,
    paid: booking.paid_amount,
    balance,
    generatedDate: new Date().toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  };
}