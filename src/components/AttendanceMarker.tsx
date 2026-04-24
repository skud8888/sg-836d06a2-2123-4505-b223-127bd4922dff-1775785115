import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  student_name: string;
  student_email: string;
  status: string;
  attended?: boolean;
  attendance_notes?: string;
}

interface AttendanceMarkerProps {
  classId: string;
}

export function AttendanceMarker({ classId }: AttendanceMarkerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEnrollments();
  }, [classId]);

  async function loadEnrollments() {
    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("class_id", classId)
        .eq("status", "confirmed");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error loading enrollments:", error);
      toast({
        title: "Error",
        description: "Failed to load student list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function markAttendance(studentId: string, attended: boolean) {
    try {
      const { error } = await supabase
        .from("enrollments")
        .update({ attended, updated_at: new Date().toISOString() })
        .eq("id", studentId);

      if (error) throw error;

      setStudents(students.map(s => 
        s.id === studentId ? { ...s, attended } : s
      ));

      toast({
        title: "Attendance marked",
        description: `Student marked as ${attended ? "present" : "absent"}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mark attendance";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }
}