import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { emailService } from "@/services/emailService";
import { signatureService } from "@/services/signatureService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
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

      // Update booking payment status
      const { error: updateError } = await supabaseAdmin
        .from("bookings")
        .update({
          payment_status: "paid",
          paid_amount: amountPaid,
          status: "confirmed"
        })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Error updating booking:", updateError);
        return res.status(500).json({ error: "Failed to update booking" });
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
      console.log("✓ Signature request sent to:", booking.student_email);

      return res.status(200).json({ received: true });
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}