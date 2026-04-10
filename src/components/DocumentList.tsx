import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { documentService } from "@/services/documentService";
import { FileText, Download, Eye, History, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Document = Tables<"documents">;

interface DocumentListProps {
  bookingId?: string;
  courseId?: string;
  trainerId?: string;
  showUpload?: boolean;
}

export function DocumentList({ bookingId, courseId, trainerId, showUpload = false }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [versions, setVersions] = useState<Document[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [bookingId, courseId, trainerId]);

  const fetchDocuments = async () => {
    setLoading(true);
    let docs: Document[] = [];

    if (bookingId) {
      docs = await documentService.getBookingDocuments(bookingId);
    } else if (courseId) {
      docs = await documentService.getCourseDocuments(courseId);
    }

    setDocuments(docs);
    setLoading(false);
  };

  const handleDownload = async (doc: Document) => {
    await documentService.downloadDocument(doc);
  };

  const handleViewVersions = async (doc: Document) => {
    setSelectedDoc(doc);
    const versionHistory = await documentService.getDocumentVersions(doc.id);
    setVersions(versionHistory);
    setShowVersions(true);
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      invoice: "bg-green-100 text-green-800",
      contract: "bg-blue-100 text-blue-800",
      certificate: "bg-purple-100 text-purple-800",
      evidence: "bg-yellow-100 text-yellow-800",
      id_verification: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[type] || colors.other;
  };

  if (loading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No documents uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    {doc.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{doc.notes}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className={getDocumentTypeColor(doc.document_type)}>
                        {doc.document_type}
                      </Badge>
                      {doc.version && doc.version > 1 && (
                        <Badge variant="outline">v{doc.version}</Badge>
                      )}
                      {doc.tags && doc.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {doc.uploaded_at ? format(new Date(doc.uploaded_at), "MMM d, yyyy") : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewVersions(doc)}
                    title="Version History"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {versions.map((version) => (
              <Card key={version.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Version {version.version}</p>
                      <p className="text-sm text-muted-foreground">
                        {version.uploaded_at ? format(new Date(version.uploaded_at), "MMM d, yyyy 'at' h:mm a") : ""}
                      </p>
                      {version.is_latest_version && (
                        <Badge variant="default" className="mt-1">Latest</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(version)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}