import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia"
});

const supabase = createClient(
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          // Update booking payment status
          const { error: bookingError } = await supabase
            .from("bookings")
            .update({
              payment_status: "paid",
              paid_amount: (session.amount_total || 0) / 100,
            })
            .eq("id", bookingId);

          if (bookingError) {
            console.error("Error updating booking:", bookingError);
          }

          // Update Stripe payment record
          await supabase
            .from("stripe_payments")
            .update({
              stripe_payment_intent_id: session.payment_intent as string,
              status: "succeeded",
              payment_method: session.payment_method_types?.[0] || "card",
              receipt_url: session.url,
            })
            .eq("stripe_checkout_session_id", session.id);

          // Log the payment
          await supabase.rpc("log_audit_event", {
            p_action: "PAYMENT_RECORDED",
            p_resource_type: "booking",
            p_resource_id: bookingId,
            p_metadata: {
              amount: (session.amount_total || 0) / 100,
              payment_method: "stripe",
              stripe_session_id: session.id,
            },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from("stripe_payments")
          .update({
            status: "failed",
            metadata: { error: paymentIntent.last_payment_error?.message },
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntent = charge.payment_intent as string;

        await supabase
          .from("stripe_payments")
          .update({
            status: "refunded",
            refunded_amount: charge.amount_refunded,
            refund_id: charge.refunds?.data[0]?.id,
          })
          .eq("stripe_payment_intent_id", paymentIntent);
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ error: error.message });
  }
}