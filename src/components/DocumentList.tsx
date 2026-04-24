import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
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

interface DocumentListProps {
  bookingId?: string;
  studentId?: string;
  documentType?: string;
}

export function DocumentList({ bookingId, studentId, documentType }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
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

      if (documentType) {
        query = query.eq("document_type", documentType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId, studentId, documentType, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (loading) {
    return <div className="p-4 text-center">Loading documents...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>
          {documents.length === 0 ? (
            <div className="p-4 text-center">No documents found.</div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{doc.file_name}</div>
                      <div className="text-sm text-muted-foreground">{doc.document_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Uploaded {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
                      </div>
                    </div>
                    {doc.status === "reviewed" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div className="text-sm text-green-500">
                          Reviewed {format(new Date(doc.reviewed_at || doc.uploaded_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    )}
                    {doc.status === "rejected" && (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <div className="text-sm text-red-500">
                          Rejected {format(new Date(doc.reviewed_at || doc.uploaded_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardDescription>
      </CardContent>
    </Card>
  );
}