import { supabase } from "@/integrations/supabase/client";
import { emailService } from "./emailService";
import type { Tables } from "@/integrations/supabase/types";

type SignatureRequest = Tables<"signature_requests">;

export const signatureService = {
  /**
   * Create a new signature request
   */
  async createSignatureRequest(params: {
    bookingId: string;
    documentType: SignatureRequest["document_type"];
    recipientName: string;
    recipientEmail: string;
    expiresInDays?: number;
  }): Promise<{ request: SignatureRequest | null; error: any }> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (params.expiresInDays || 7));

      const { data: request, error } = await supabase
        .from("signature_requests")
        .insert({
          booking_id: params.bookingId,
          document_type: params.documentType,
          recipient_name: params.recipientName,
          recipient_email: params.recipientEmail,
          status: "pending",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Send signature request email
      await this.sendSignatureRequestEmail(request);

      return { request, error: null };
    } catch (error) {
      console.error("Create signature request error:", error);
      return { request: null, error };
    }
  },

  /**
   * Send signature request email
   */
  async sendSignatureRequestEmail(request: SignatureRequest): Promise<void> {
    const signUrl = `${window.location.origin}/sign/${request.id}`;

    await emailService.sendEmail(
      request.recipient_email,
      {
        subject: `Signature Required: ${request.document_type.replace(/_/g, " ")}`,
        html: `
        <h2>Document Signature Request</h2>
        <p>Hello ${request.recipient_name},</p>
        <p>You have been requested to sign the following document:</p>
        <p><strong>${request.document_type.replace(/_/g, " ").toUpperCase()}</strong></p>
        <p>Please click the button below to review and sign the document:</p>
        <p>
          <a href="${signUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Sign Document
          </a>
        </p>
        <p>This signature request will expire on ${new Date(request.expires_at!).toLocaleDateString()}.</p>
        <p>If you have any questions, please contact us.</p>
      `,
      }
    );

    // Update status to sent
    await supabase
      .from("signature_requests")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", request.id);
  },

  /**
   * Complete signature
   */
  async completeSignature(
    requestId: string,
    signatureData: string
  ): Promise<{ documentId: string | null; error: any }> {
    try {
      // Get user's IP address
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const { ip } = await ipResponse.json();

      const { data, error } = await supabase.rpc("complete_signature", {
        p_request_id: requestId,
        p_signature_data: signatureData,
        p_signer_ip: ip,
      });

      if (error) throw error;

      // Get request details for notification
      const { data: request } = await supabase
        .from("signature_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (request) {
        // Send completion notification
        await this.sendSignatureCompletedEmail(request);
      }

      return { documentId: data, error: null };
    } catch (error) {
      console.error("Complete signature error:", error);
      return { documentId: null, error };
    }
  },

  /**
   * Send signature completed notification
   */
  async sendSignatureCompletedEmail(request: SignatureRequest): Promise<void> {
    await emailService.sendEmail(
      request.recipient_email,
      {
        subject: "Document Signed Successfully",
        html: `
        <h2>Signature Completed</h2>
        <p>Hello ${request.recipient_name},</p>
        <p>Your signature has been successfully recorded for:</p>
        <p><strong>${request.document_type.replace(/_/g, " ").toUpperCase()}</strong></p>
        <p>Signed on: ${new Date(request.signed_at!).toLocaleString()}</p>
        <p>You will receive a copy of the signed document shortly.</p>
        <p>Thank you!</p>
      `,
      }
    );
  },

  /**
   * Get signature request by ID
   */
  async getSignatureRequest(requestId: string): Promise<SignatureRequest | null> {
    const { data, error } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error) {
      console.error("Get signature request error:", error);
      return null;
    }

    return data;
  },

  /**
   * Get signature requests for a booking
   */
  async getBookingSignatureRequests(bookingId: string): Promise<SignatureRequest[]> {
    const { data, error } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get booking signature requests error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Send reminder for pending signature
   */
  async sendSignatureReminder(requestId: string): Promise<void> {
    const request = await this.getSignatureRequest(requestId);
    if (!request || request.status !== "pending") return;

    await supabase.rpc("send_signature_reminder", { p_request_id: requestId });
    await this.sendSignatureRequestEmail(request);
  },
};