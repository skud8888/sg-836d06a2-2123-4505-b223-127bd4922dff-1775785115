import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";
import { 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  Calendar,
  User,
  Tag,
  Eye,
  Filter
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Document = Tables<"documents">;

type DocumentViewerProps = {
  bookingId?: string;
  courseId?: string;
  trainerId?: string;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
};

export function DocumentViewer({ 
  bookingId, 
  courseId, 
  trainerId,
  showUploadButton = false,
  onUploadClick 
}: DocumentViewerProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    loadDocuments();
  }, [bookingId, courseId, trainerId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let docs: Document[] = [];
      
      if (bookingId) {
        docs = await documentService.getBookingDocuments(bookingId);
      } else if (courseId) {
        docs = await documentService.getCourseDocuments(courseId);
      } else {
        docs = await documentService.searchDocuments({
          trainerId,
          documentType: filterType !== "all" ? filterType : undefined,
          query: searchQuery || undefined
        });
      }
      
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      await documentService.downloadDocument(document);
    } catch (error) {
      toast({
        title: "Download failed",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    const { success } = await documentService.deleteDocument(documentId);
    if (success) {
      toast({ title: "Document deleted" });
      loadDocuments();
    } else {
      toast({
        title: "Delete failed",
        variant: "destructive"
      });
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (filterType !== "all" && doc.document_type !== filterType) return false;
    if (searchQuery && !doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getDocumentIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileText className="h-8 w-8 text-muted-foreground" />;
    
    if (mimeType.startsWith("image/")) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (mimeType === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (mimeType.startsWith("video/")) {
      return <FileText className="h-8 w-8 text-purple-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({filteredDocs.length})
          </CardTitle>
          {showUploadButton && onUploadClick && (
            <Button onClick={onUploadClick} size="sm">
              Upload Document
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="student_id">ID Verification</SelectItem>
              <SelectItem value="evidence_photo">Evidence Photos</SelectItem>
              <SelectItem value="evidence_video">Evidence Videos</SelectItem>
              <SelectItem value="certificate">Certificates</SelectItem>
              <SelectItem value="sign_in_sheet">Sign-in Sheets</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading documents...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No documents found
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                {getDocumentIcon(doc.mime_type)}
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{doc.file_name}</div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.uploaded_at)}
                    </span>
                    <span>{formatFileSize(doc.file_size)}</span>
                    {doc.version && doc.version > 1 && (
                      <Badge variant="outline" className="text-xs">
                        v{doc.version}
                      </Badge>
                    )}
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {doc.notes && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {doc.notes}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}