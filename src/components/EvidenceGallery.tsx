import { useState, useEffect, useCallback } from "react";
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
  classId: string;
  studentId?: string;
}

export function EvidenceGallery({ classId, studentId }: EvidenceGalleryProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvidence = useCallback(async () => {
    try {
      let query = supabase
        .from("field_evidence")
        .select("*")
        .eq("class_id", classId)
        .order("captured_at", { ascending: false });

      if (studentId) {
        query = query.eq("student_id", studentId);
      }

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
  }, [classId, studentId, toast]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);
}