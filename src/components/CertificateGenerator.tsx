import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Award, Download, Eye } from "lucide-react";

interface Student {
  id: string;
  student_name: string;
  student_email: string;
}

interface Course {
  id: string;
  name: string;
}

interface CertificateGeneratorProps {
  enrollmentId?: string;
  studentId?: string;
  courseId?: string;
}

export function CertificateGenerator({ enrollmentId, studentId, courseId }: CertificateGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudent, setSelectedStudent] = useState(studentId || "");
  const [selectedCourse, setSelectedCourse] = useState(courseId || "");
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split("T")[0]);
  const { toast } = useToast();

  async function generateCertificate() {
    try {
      setGenerating(true);

      const { data: certificate, error } = await supabase
        .from("certificates")
        .insert({
          student_id: selectedStudent,
          course_id: selectedCourse,
          completion_date: completionDate,
          certificate_number: `CERT-${Date.now()}`,
          status: "issued"
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Certificate generated",
        description: "Certificate has been created successfully"
      });

      return certificate;
    } catch (error) {
      console.error("Error generating certificate:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate certificate";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  }
}