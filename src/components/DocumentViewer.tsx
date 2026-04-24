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
        .from("documents" as any)
        .select("*")
        .order("created_at", { ascending: false });

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

  if (loading) {
    return <div className="p-4 text-center">Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No documents found</CardTitle>
            <CardDescription>No documents have been uploaded for this booking.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <CardTitle>{doc.file_name}</CardTitle>
              <CardDescription>{doc.document_type}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant={doc.status === "approved" ? "success" : doc.status === "rejected" ? "destructive" : "default"}>
                    {doc.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    Uploaded {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, "_blank")}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}