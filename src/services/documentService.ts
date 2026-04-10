import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Document = Tables<"documents">;
type DocumentAuditLog = Tables<"document_audit_logs">;

export const documentService = {
  /**
   * Upload a document and create database record
   */
  async uploadDocument(params: {
    file: File;
    documentType: Document["document_type"];
    relatedBookingId?: string;
    relatedCourseId?: string;
    relatedTrainerId?: string;
    description?: string;
    tags?: string[];
  }): Promise<{ document: Document | null; error: any }> {
    const { file, documentType, relatedBookingId, relatedCourseId, relatedTrainerId, description, tags } = params;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Determine storage bucket based on document type
      const bucket = documentType === "invoice" ? "invoices" : 
                     documentType === "contract" ? "contracts" :
                     documentType === "certificate" ? "certificates" :
                     "documents";

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${timestamp}_${sanitizedFilename}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from("documents")
        .insert({
          filename: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          document_type: documentType,
          related_booking_id: relatedBookingId || null,
          related_course_id: relatedCourseId || null,
          related_trainer_id: relatedTrainerId || null,
          description: description || null,
          tags: tags || null,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Log the upload
      await supabase.rpc("log_document_access", {
        p_document_id: document.id,
        p_action: "created",
        p_user_id: user.id,
        p_metadata: { filename: file.name, size: file.size }
      });

      return { document, error: null };
    } catch (error) {
      console.error("Upload error:", error);
      return { document: null, error };
    }
  },

  /**
   * Get document download URL
   */
  async getDocumentUrl(document: Document): Promise<string | null> {
    const bucket = document.document_type === "invoice" ? "invoices" : 
                   document.document_type === "contract" ? "contracts" :
                   document.document_type === "certificate" ? "certificates" :
                   "documents";

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(document.file_path);

    // Log the access
    await supabase.rpc("log_document_access", {
      p_document_id: document.id,
      p_action: "viewed"
    });

    return data.publicUrl;
  },

  /**
   * Download document
   */
  async downloadDocument(document: Document): Promise<void> {
    const bucket = document.document_type === "invoice" ? "invoices" : 
                   document.document_type === "contract" ? "contracts" :
                   document.document_type === "certificate" ? "certificates" :
                   "documents";

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(document.file_path);

    if (error) throw error;

    // Log the download
    await supabase.rpc("log_document_access", {
      p_document_id: document.id,
      p_action: "downloaded"
    });

    // Trigger browser download
    const url = URL.createObjectURL(data);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document.filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Get documents for a booking
   */
  async getBookingDocuments(bookingId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("related_booking_id", bookingId)
      .eq("is_latest_version", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching booking documents:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get documents for a course
   */
  async getCourseDocuments(courseId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("related_course_id", courseId)
      .eq("is_latest_version", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching course documents:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Create new version of a document
   */
  async createDocumentVersion(params: {
    documentId: string;
    newFile: File;
  }): Promise<{ document: Document | null; error: any }> {
    const { documentId, newFile } = params;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get original document
      const { data: originalDoc, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (fetchError) throw fetchError;

      // Determine bucket
      const bucket = originalDoc.document_type === "invoice" ? "invoices" : 
                     originalDoc.document_type === "contract" ? "contracts" :
                     originalDoc.document_type === "certificate" ? "certificates" :
                     "documents";

      // Upload new version
      const timestamp = Date.now();
      const sanitizedFilename = newFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${timestamp}_${sanitizedFilename}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, newFile);

      if (uploadError) throw uploadError;

      // Use function to create new version
      const { data: newDocId, error: versionError } = await supabase.rpc("create_document_version", {
        p_document_id: documentId,
        p_new_file_path: uploadData.path,
        p_new_filename: newFile.name,
        p_uploaded_by: user.id
      });

      if (versionError) throw versionError;

      // Fetch the new document
      const { data: newDocument } = await supabase
        .from("documents")
        .select("*")
        .eq("id", newDocId)
        .single();

      return { document: newDocument, error: null };
    } catch (error) {
      console.error("Version creation error:", error);
      return { document: null, error };
    }
  },

  /**
   * Get document version history
   */
  async getDocumentVersions(documentId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .or(`id.eq.${documentId},parent_document_id.eq.${documentId}`)
      .order("version", { ascending: false });

    if (error) {
      console.error("Error fetching versions:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get document audit logs
   */
  async getDocumentAuditLogs(documentId: string): Promise<DocumentAuditLog[]> {
    const { data, error } = await supabase
      .from("document_audit_logs")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit logs:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", documentId);

      if (error) throw error;

      await supabase.rpc("log_document_access", {
        p_document_id: documentId,
        p_action: "deleted"
      });

      return { success: true, error: null };
    } catch (error) {
      console.error("Delete error:", error);
      return { success: false, error };
    }
  },

  /**
   * Search documents
   */
  async searchDocuments(params: {
    query?: string;
    documentType?: string;
    bookingId?: string;
    courseId?: string;
    trainerId?: string;
  }): Promise<Document[]> {
    let queryBuilder = supabase
      .from("documents")
      .select("*")
      .eq("is_latest_version", true)
      .is("deleted_at", null);

    if (params.query) {
      queryBuilder = queryBuilder.or(
        `filename.ilike.%${params.query}%,description.ilike.%${params.query}%`
      );
    }

    if (params.documentType) {
      queryBuilder = queryBuilder.eq("document_type", params.documentType);
    }

    if (params.bookingId) {
      queryBuilder = queryBuilder.eq("related_booking_id", params.bookingId);
    }

    if (params.courseId) {
      queryBuilder = queryBuilder.eq("related_course_id", params.courseId);
    }

    if (params.trainerId) {
      queryBuilder = queryBuilder.eq("related_trainer_id", params.trainerId);
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false });

    if (error) {
      console.error("Search error:", error);
      return [];
    }

    return data || [];
  }
};