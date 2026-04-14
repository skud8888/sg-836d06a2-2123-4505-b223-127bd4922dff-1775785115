import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

type QBOWebhookPayload = {
  eventNotifications: Array<{
    realmId: string;
    dataChangeEvent: {
      entities: Array<{
        name: string;
        id: string;
        operation: string;
        lastUpdated: string;
      }>;
    };
  }>;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body as QBOWebhookPayload;
    
    // Verify webhook signature (implement based on QBO docs)
    const signature = req.headers["intuit-signature"] as string;
    if (!signature) {
      return res.status(401).json({ error: "Missing signature" });
    }

    // Process webhook events
    for (const notification of payload.eventNotifications) {
      for (const entity of notification.dataChangeEvent.entities) {
        if (entity.name === "Invoice") {
          await handleInvoiceUpdate(entity.id, entity.operation);
        } else if (entity.name === "Payment") {
          await handlePaymentUpdate(entity.id, entity.operation);
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("QBO webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleInvoiceUpdate(qboInvoiceId: string, operation: string) {
  // Sync invoice status with bookings table
  if (operation === "Update" || operation === "Create") {
    // Fetch invoice details from QBO API
    // Update corresponding booking record
    console.log("Processing invoice update:", qboInvoiceId);
  }
}

async function handlePaymentUpdate(qboPaymentId: string, operation: string) {
  // Sync payment with bookings and payments tables
  if (operation === "Update" || operation === "Create") {
    // Fetch payment details from QBO API
    // Update corresponding booking payment status
    console.log("Processing payment update:", qboPaymentId);
  }
}