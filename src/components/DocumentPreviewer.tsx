import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface DocumentPreviewerProps {
  open: boolean;
  onClose: () => void;
  documentUrl: string;
  documentName: string;
  documentType?: string;
}

export function DocumentPreviewer({ 
  open, 
  onClose, 
  documentUrl, 
  documentName,
  documentType 
}: DocumentPreviewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);
  const [rotation, setRotation] = useState(0);
  const fileUrl = documentUrl;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = documentUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open(documentUrl, "_blank");
    printWindow?.print();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const fileExtension = documentName.split(".").pop()?.toLowerCase();
  const isPDF = fileExtension === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fileExtension || "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>{documentName}</DialogTitle>
              {documentType && (
                <Badge variant="secondary">{documentType}</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPDF && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="overflow-auto p-6 bg-muted/10" style={{ maxHeight: "calc(90vh - 180px)" }}>
          <div className="flex items-center justify-center">
            {isPDF && (
              <iframe
                src={`${documentUrl}#page=${currentPage}`}
                className="border rounded-lg shadow-lg bg-white"
                style={{
                  width: `${zoom}%`,
                  height: "800px",
                  maxWidth: "100%"
                }}
                title={documentName}
              />
            )}

            {documentType === "image" && (
              <div className="relative">
                <Image
                  src={fileUrl}
                  alt="Document preview"
                  width={800}
                  height={600}
                  className="max-w-full h-auto"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s"
                  }}
                />
              </div>
            )}

            {!isPDF && !isImage && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Preview not available for this file type
                </p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download to View
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}