import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia"
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { bookingId, amount, currency = "aud", metadata = {} } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, scheduled_classes(course_templates(name))")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: booking.scheduled_classes?.course_templates?.name || "Course Booking",
              description: `Booking for ${booking.student_name}`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/booking/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${req.headers.origin}/booking/${booking.scheduled_class_id}?canceled=true`,
      metadata: {
        bookingId,
        ...metadata,
      },
      customer_email: booking.student_email,
    });

    // Store payment intent reference
    await supabase.from("stripe_payments").insert({
      booking_id: bookingId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string || "pending",
      amount,
      currency,
      status: "pending",
      metadata: {
        session_url: session.url,
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({ error: error.message });
  }
}