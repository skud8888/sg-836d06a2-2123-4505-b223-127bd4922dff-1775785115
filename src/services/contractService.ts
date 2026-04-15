import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ContractTemplate = Tables<"contract_templates">;
type SignatureRequest = Tables<"signature_requests">;
type Booking = Tables<"bookings">;

/**
 * Contract Service
 * Manages contract templates, generation, and tracking
 */
export const contractService = {
  /**
   * Get all contract templates
   */
  async getTemplates(): Promise<ContractTemplate[]> {
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .order("name");

    if (error) {
      console.error("Get templates error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get active contract templates
   */
  async getActiveTemplates(): Promise<ContractTemplate[]> {
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Get active templates error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Create contract template
   */
  async createTemplate(params: {
    name: string;
    documentType: string;
    templateContent: string;
    variables?: any;
  }): Promise<{ template: ContractTemplate | null; error: any }> {
    try {
      const { data: template, error } = await supabase
        .from("contract_templates")
        .insert({
          name: params.name,
          document_type: params.documentType,
          template_content: params.templateContent,
          variables: params.variables || {},
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return { template, error: null };
    } catch (error) {
      console.error("Create template error:", error);
      return { template: null, error };
    }
  },

  /**
   * Update contract template
   */
  async updateTemplate(
    templateId: string,
    params: {
      name?: string;
      documentType?: string;
      templateContent?: string;
      variables?: any;
      isActive?: boolean;
    }
  ): Promise<{ template: ContractTemplate | null; error: any }> {
    try {
      const updates: any = {};
      if (params.name !== undefined) updates.name = params.name;
      if (params.documentType !== undefined) updates.document_type = params.documentType;
      if (params.templateContent !== undefined) updates.template_content = params.templateContent;
      if (params.variables !== undefined) updates.variables = params.variables;
      if (params.isActive !== undefined) updates.is_active = params.isActive;

      updates.updated_at = new Date().toISOString();

      const { data: template, error } = await supabase
        .from("contract_templates")
        .update(updates)
        .eq("id", templateId)
        .select()
        .single();

      if (error) throw error;

      return { template, error: null };
    } catch (error) {
      console.error("Update template error:", error);
      return { template: null, error };
    }
  },

  /**
   * Generate contract from template
   */
  async generateContract(
    templateId: string,
    bookingId: string
  ): Promise<{ content: string | null; error: any }> {
    try {
      // Get template
      const { data: template, error: templateError } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;
      if (!template) throw new Error("Template not found");

      // Get booking data with related course
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          scheduled_class:scheduled_classes(
            *,
            course_template:course_templates(*)
          )
        `)
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;
      if (!booking) throw new Error("Booking not found");

      // Prepare merge data
      const mergeData = {
        student_name: booking.student_name,
        student_email: booking.student_email,
        student_phone: booking.student_phone || "",
        booking_date: new Date(booking.booking_date || "").toLocaleDateString(),
        course_name: (booking.scheduled_class as any)?.course_template?.name || "",
        course_code: (booking.scheduled_class as any)?.course_template?.code || "",
        class_start_date: new Date((booking.scheduled_class as any)?.start_datetime || "").toLocaleDateString(),
        class_start_time: new Date((booking.scheduled_class as any)?.start_datetime || "").toLocaleTimeString(),
        location: (booking.scheduled_class as any)?.location || "",
        total_amount: booking.total_amount,
        usi_number: booking.usi_number || "Not provided",
        current_date: new Date().toLocaleDateString(),
      };

      // Replace merge fields in template
      let content = template.template_content;
      Object.entries(mergeData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        content = content.replace(regex, String(value));
      });

      return { content, error: null };
    } catch (error) {
      console.error("Generate contract error:", error);
      return { content: null, error };
    }
  },

  /**
   * Create signature request with contract
   */
  async createSignatureRequestWithContract(params: {
    bookingId: string;
    templateId: string;
    recipientName: string;
    recipientEmail: string;
    expiresInDays?: number;
  }): Promise<{ request: SignatureRequest | null; error: any }> {
    try {
      // Generate contract content
      const { content, error: genError } = await this.generateContract(
        params.templateId,
        params.bookingId
      );

      if (genError || !content) throw genError || new Error("Failed to generate contract");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (params.expiresInDays || 7));

      // Get template to determine document type
      const { data: template } = await supabase
        .from("contract_templates")
        .select("document_type")
        .eq("id", params.templateId)
        .single();

      const { data: request, error } = await supabase
        .from("signature_requests")
        .insert({
          booking_id: params.bookingId,
          contract_template_id: params.templateId,
          document_type: template?.document_type || "other",
          recipient_name: params.recipientName,
          recipient_email: params.recipientEmail,
          status: "pending",
          expires_at: expiresAt.toISOString(),
          metadata: { generated_content: content },
        })
        .select()
        .single();

      if (error) throw error;

      return { request, error: null };
    } catch (error) {
      console.error("Create signature request error:", error);
      return { request: null, error };
    }
  },

  /**
   * Get contracts requiring renewal
   */
  async getContractsForRenewal(daysBeforeExpiry: number = 30): Promise<SignatureRequest[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

    const { data, error } = await supabase
      .from("signature_requests")
      .select(`
        *,
        booking:bookings(
          student_name,
          student_email,
          scheduled_class:scheduled_classes(
            course_template:course_templates(name)
          )
        )
      `)
      .eq("status", "signed")
      .lte("expires_at", futureDate.toISOString())
      .order("expires_at");

    if (error) {
      console.error("Get contracts for renewal error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Track contract expiry
   */
  async checkExpiredContracts(): Promise<{
    expired: SignatureRequest[];
    expiringSoon: SignatureRequest[];
  }> {
    const now = new Date();
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 7); // 7 days before expiry

    // Get expired unsigned contracts
    const { data: expired } = await supabase
      .from("signature_requests")
      .select("*")
      .in("status", ["pending", "sent", "viewed"])
      .lt("expires_at", now.toISOString());

    // Get contracts expiring soon
    const { data: expiringSoon } = await supabase
      .from("signature_requests")
      .select("*")
      .in("status", ["pending", "sent", "viewed"])
      .gte("expires_at", now.toISOString())
      .lte("expires_at", soonDate.toISOString());

    // Update expired contracts status
    if (expired && expired.length > 0) {
      await supabase
        .from("signature_requests")
        .update({ status: "expired" })
        .in("id", expired.map(r => r.id));
    }

    return {
      expired: expired || [],
      expiringSoon: expiringSoon || [],
    };
  },

  /**
   * Get signed contracts for a booking
   */
  async getBookingContracts(bookingId: string): Promise<Tables<"signature_requests">[]> {
    const { data } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("status", "signed")
      .order("signed_at", { ascending: false });

    return data || [];
  },

  /**
   * Check contract expiry and renewal eligibility
   */
  async checkContractExpiry(contractId: string): Promise<{
    isExpired: boolean;
    daysUntilExpiry: number;
    needsRenewal: boolean;
  }> {
    const { data: contract } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("id", contractId)
      .single();

    if (!contract || !contract.expires_at) {
      return { isExpired: false, daysUntilExpiry: 0, needsRenewal: false };
    }

    const now = new Date();
    const expiryDate = new Date(contract.expires_at);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysUntilExpiry < 0;
    const needsRenewal = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

    return { isExpired, daysUntilExpiry, needsRenewal };
  },

  /**
   * Renew expired contract
   */
  async renewContract(contractId: string, expiryMonths: number = 12): Promise<{
    contract: Tables<"signature_requests"> | null;
    error: any;
  }> {
    const { data: originalContract } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("id", contractId)
      .single();

    if (!originalContract) {
      return { contract: null, error: new Error("Contract not found") };
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);

    const { data, error } = await supabase
      .from("signature_requests")
      .insert({
        contract_template_id: originalContract.contract_template_id,
        booking_id: originalContract.booking_id,
        document_type: originalContract.document_type,
        recipient_name: originalContract.recipient_name,
        recipient_email: originalContract.recipient_email,
        metadata: originalContract.metadata,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    return { contract: data, error };
  },

  /**
   * Get merge field suggestions
   */
  getMergeFields(): { name: string; label: string; description: string }[] {
    return [
      { name: "student_name", label: "Student Name", description: "Full name of the student" },
      { name: "student_email", label: "Student Email", description: "Student's email address" },
      { name: "student_phone", label: "Student Phone", description: "Student's phone number" },
      { name: "booking_date", label: "Booking Date", description: "Date the booking was made" },
      { name: "course_name", label: "Course Name", description: "Full name of the course" },
      { name: "course_code", label: "Course Code", description: "Course code/identifier" },
      { name: "class_start_date", label: "Class Start Date", description: "Date the class begins" },
      { name: "class_start_time", label: "Class Start Time", description: "Time the class begins" },
      { name: "location", label: "Location", description: "Class venue/location" },
      { name: "total_amount", label: "Total Amount", description: "Total booking amount" },
      { name: "usi_number", label: "USI Number", description: "Unique Student Identifier" },
      { name: "current_date", label: "Current Date", description: "Today's date" },
    ];
  },
};