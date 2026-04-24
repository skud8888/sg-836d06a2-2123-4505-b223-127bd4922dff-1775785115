import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Calendar, MapPin, FileText, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Evidence {
  id: string;
  file_url: string;
  notes: string;
  captured_at: string;
  location?: string;
}

interface EvidenceGalleryProps {
  classId?: string;
  studentId?: string;
  scheduledClassId?: string;
  bookingId?: string;
}

export function EvidenceGallery({ classId, studentId, scheduledClassId, bookingId }: EvidenceGalleryProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvidence = useCallback(async () => {
    try {
      let query = supabase
        .from("field_evidence" as any)
        .select("*")
        .order("captured_at", { ascending: false });

      if (classId) query = query.eq("class_id", classId);
      if (scheduledClassId) query = query.eq("scheduled_class_id", scheduledClassId);
      if (studentId) query = query.eq("student_id", studentId);
      if (bookingId) query = query.eq("booking_id", bookingId);

      const { data, error } = await query;

      if (error) throw error;
      setEvidence(data || []);
    } catch (error) {
      console.error("Error fetching evidence:", error);
      toast({
        title: "Error",
        description: "Failed to load evidence",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [classId, studentId, scheduledClassId, bookingId, toast]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  if (loading) {
    return <div className="p-4 text-center">Loading evidence...</div>;
  }

  return (
    <div className="space-y-4">
      {evidence.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>No evidence available</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        evidence.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <CardDescription>{e.notes}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{format(new Date(e.captured_at), "MMM d, yyyy")}</span>
                </div>
                {e.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{e.location}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}