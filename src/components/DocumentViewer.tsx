import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  status: string;
  uploaded_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
}

interface DocumentViewerProps {
  bookingId?: string;
  studentId?: string;
}

export function DocumentViewer({ bookingId, studentId }: DocumentViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDocuments = useCallback(async () => {
    try {
      let query = supabase
        .from("documents")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (bookingId) {
        query = query.eq("booking_id", bookingId);
      }

      if (studentId) {
        query = query.eq("student_id", studentId);
      }

      const { data } = await query;
      setDocuments(data || []);
    } catch (err) {
      console.error("Error loading documents:", err);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId, studentId, toast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);
}