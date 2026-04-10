import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type DocumentType = Tables<"documents">["document_type"];

interface DocumentUploadProps {
  relatedBookingId?: string;
  relatedCourseId?: string;
  relatedTrainerId?: string;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ 
  relatedBookingId, 
  relatedCourseId, 
  relatedTrainerId,
  onUploadComplete 
}: DocumentUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("other");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);

    const { document, error } = await documentService.uploadDocument({
      file: selectedFile,
      documentType,
      relatedBookingId,
      relatedCourseId,
      relatedTrainerId,
      description: description || undefined,
      tags: tagArray.length > 0 ? tagArray : undefined
    });

    if (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Document uploaded",
        description: `${selectedFile.name} uploaded successfully`
      });
      
      // Reset form
      setSelectedFile(null);
      setDescription("");
      setTags("");
      setDocumentType("other");
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    }

    setUploading(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label>Document Type *</Label>
          <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="certificate">Certificate</SelectItem>
              <SelectItem value="evidence">Evidence (Photos/Videos)</SelectItem>
              <SelectItem value="id_verification">ID Verification</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>File *</Label>
          {selectedFile ? (
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mov"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, Images, Videos (max 50MB)
                </p>
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Optional description of the document"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Tags (comma-separated)</Label>
          <Input
            placeholder="e.g., urgent, signed, final"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Upload Document
        </Button>
      </CardContent>
    </Card>
  );
}