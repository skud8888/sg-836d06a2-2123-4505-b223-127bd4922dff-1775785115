import type { NextApiRequest, NextApiResponse } from "next";
import twilio from "twilio";

/**
 * SMS Send API - Twilio Integration
 * 
 * Environment Variables Required (Add to Vercel):
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number (format: +1234567890)
 * 
 * Setup Instructions:
 * 1. Create Twilio account at https://www.twilio.com
 * 2. Get Account SID and Auth Token from console.twilio.com
 * 3. Buy a phone number from Twilio
 * 4. Add environment variables to Vercel project settings
 * 5. Install Twilio: npm install twilio
 * 
 * Usage:
 * POST /api/sms/send
 * Body: { to: "+61400000000", body: "Your message", logId: "uuid" }
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, body, logId } = req.body;

    // Validate inputs
    if (!to || !body) {
      return res.status(400).json({ error: "Missing required fields: to, body" });
    }

    // Check if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Twilio not configured. Add environment variables.");
      return res.status(500).json({ 
        error: "SMS service not configured. Please add Twilio credentials to environment variables.",
        configured: false
      });
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: body,
      from: fromNumber,
      to: to
    });

    console.log(`SMS sent successfully: ${message.sid}`);

    return res.status(200).json({
      success: true,
      messageId: message.sid,
      status: message.status,
      logId: logId
    });
  } catch (error: any) {
    console.error("Error sending SMS:", error);

    // Handle Twilio-specific errors
    if (error.code) {
      return res.status(400).json({
        error: `Twilio error ${error.code}: ${error.message}`,
        code: error.code
      });
    }

    return res.status(500).json({
      error: error.message || "Failed to send SMS"
    });
  }
}