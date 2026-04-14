import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { emailService } from "@/services/emailService";
import { signatureService } from "@/services/signatureService";
import { generateInvoiceHTML, prepareInvoiceData } from "@/lib/invoiceGenerator";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"]!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract booking ID from metadata
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) {
        console.error("No booking ID in session metadata");
        return res.status(400).json({ error: "No booking ID" });
      }

      // Get booking details
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .select("*, scheduled_classes(*, course_templates(name, code))")
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        console.error("Booking not found:", bookingError);
        return res.status(404).json({ error: "Booking not found" });
      }

      // Calculate payment amount
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
      const newPaidTotal = booking.paid_amount + amountPaid;

      // Update booking payment status
      const { error: updateError } = await supabaseAdmin
        .from("bookings")
        .update({
          payment_status: newPaidTotal >= booking.total_amount ? "paid" : "partial",
          paid_amount: newPaidTotal,
          status: "confirmed"
        })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Error updating booking:", updateError);
        return res.status(500).json({ error: "Failed to update booking" });
      }

      // Update payment record
      await supabaseAdmin
        .from("stripe_payments")
        .update({
          stripe_payment_intent_id: session.payment_intent as string,
          status: "completed",
          metadata: {
            session_url: session.url,
            amount_total: session.amount_total,
            payment_status: session.payment_status
          }
        })
        .eq("stripe_checkout_session_id", session.id);

      // GENERATE AND SEND INVOICE
      try {
        const invoiceNumber = `INV-${booking.id.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const invoiceData = prepareInvoiceData(booking as any, invoiceNumber);
        const invoiceHTML = generateInvoiceHTML(invoiceData);

        // Send invoice via email
        await emailService.sendEmail(booking.student_email, {
          subject: `Invoice ${invoiceNumber} - ${booking.scheduled_classes?.course_templates?.name}`,
          html: invoiceHTML
        });

        console.log("✓ Invoice generated and sent:", invoiceNumber);
      } catch (invoiceErr) {
        console.error("Error generating/sending invoice:", invoiceErr);
        // Don't fail the webhook - invoice can be regenerated manually
      }

      // Send payment receipt email
      const bookingWithClass = booking as any;
      await emailService.sendPaymentReceipt(bookingWithClass, amountPaid);

      // AUTO-CREATE SIGNATURE REQUEST
      // This is the critical integration point that was missing
      try {
        const { request, error: sigError } = await signatureService.createSignatureRequest({
          bookingId: booking.id,
          documentType: 'enrollment_contract',
          recipientName: booking.student_name,
          recipientEmail: booking.student_email,
          expiresInDays: 7
        });

        if (sigError) {
          console.error("Error creating signature request:", sigError);
          // Don't fail the whole webhook - signature can be sent manually
        } else {
          console.log("✓ Signature request created and sent:", request?.id);
        }
      } catch (sigErr) {
        console.error("Exception creating signature request:", sigErr);
        // Log but don't fail - admin can send manually
      }

      console.log("✓ Payment processed successfully for booking:", bookingId);
      console.log("✓ Amount paid:", amountPaid);
      console.log("✓ New total paid:", newPaidTotal);
      console.log("✓ Payment status:", newPaidTotal >= booking.total_amount ? "paid" : "partial");
      console.log("✓ Signature request sent to:", booking.student_email);

      return res.status(200).json({ received: true });
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}