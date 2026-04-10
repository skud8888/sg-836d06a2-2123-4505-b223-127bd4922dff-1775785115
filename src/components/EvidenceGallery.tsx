import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, MapPin, Calendar, User, Download, Eye } from "lucide-react";
import { format } from "date-fns";

type Evidence = {
  id: string;
  evidence_type: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  description: string | null;
  captured_at: string;
  geolocation: { lat: number; lng: number } | null;
};

type EvidenceGalleryProps = {
  bookingId?: string;
  scheduledClassId?: string;
};

export function EvidenceGallery({ bookingId, scheduledClassId }: EvidenceGalleryProps) {
  const { toast } = useToast();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    fetchEvidence();
  }, [bookingId, scheduledClassId]);

  const fetchEvidence = async () => {
    setLoading(true);
    let query = supabase.from("evidence_capture").select("*");

    if (bookingId) {
      query = query.eq("booking_id", bookingId);
    }
    if (scheduledClassId) {
      query = query.eq("scheduled_class_id", scheduledClassId);
    }

    const { data, error } = await query.order("captured_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading evidence",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setEvidence((data as unknown) as Evidence[]);
    }
    setLoading(false);
  };

  const viewEvidence = async (item: Evidence) => {
    setSelectedEvidence(item);
    setViewerOpen(true);

    // Get signed URL for image
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(item.file_path, 3600);

    if (data?.signedUrl) {
      setImageUrl(data.signedUrl);
    }
  };

  const downloadEvidence = async (item: Evidence) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(item.file_path);

    if (error) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = item.file_name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getEvidenceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      attendance_photo: "bg-blue-500",
      practical_assessment: "bg-green-500",
      completed_work: "bg-purple-500",
      document: "bg-orange-500",
      safety_compliance: "bg-red-500",
      other: "bg-gray-500"
    };
    return colors[type] || "bg-gray-500";
  };

  const getEvidenceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      attendance_photo: "Attendance Photo",
      practical_assessment: "Practical Assessment",
      completed_work: "Completed Work",
      document: "Document",
      safety_compliance: "Safety Compliance",
      other: "Other"
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading evidence...</p>
        </CardContent>
      </Card>
    );
  }

  if (evidence.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No evidence captured yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidence.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Badge className={getEvidenceTypeColor(item.evidence_type)}>
                  {getEvidenceTypeLabel(item.evidence_type)}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => viewEvidence(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadEvidence(item)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium text-sm truncate">{item.file_name}</p>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(item.captured_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
              {item.geolocation && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  GPS: {item.geolocation.lat.toFixed(4)}, {item.geolocation.lng.toFixed(4)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedEvidence?.file_name}</DialogTitle>
          </DialogHeader>
          {selectedEvidence && (
            <div className="space-y-4">
              {imageUrl && selectedEvidence.mime_type?.startsWith("image/") && (
                <img 
                  src={imageUrl} 
                  alt={selectedEvidence.file_name}
                  className="w-full rounded-lg"
                />
              )}
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <Badge className={getEvidenceTypeColor(selectedEvidence.evidence_type)}>
                    {getEvidenceTypeLabel(selectedEvidence.evidence_type)}
                  </Badge>
                </div>
                {selectedEvidence.description && (
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{selectedEvidence.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Captured</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEvidence.captured_at), "PPP 'at' p")}
                  </p>
                </div>
                {selectedEvidence.geolocation && (
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvidence.geolocation.lat.toFixed(6)}, {selectedEvidence.geolocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
              <Button
                onClick={() => downloadEvidence(selectedEvidence)}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}