import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ArrowLeft, Save, CheckCircle, Users } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface Student {
  bookingId: string;
  studentName: string;
  studentEmail: string;
  status: string;
  attended: boolean;
}

export default function ClassAttendancePage() {
  const router = useRouter();
  const { classId } = router.query;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState("");
  const [classDate, setClassDate] = useState("");
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (classId) {
      checkAuth();
    }
  }, [classId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/admin/login");
      return;
    }

    const role = await rbacService.getUserPrimaryRole();
    if (role !== "trainer" && role !== "admin" && role !== "super_admin") {
      router.push("/");
      return;
    }

    await loadClassData();
    setLoading(false);
  };

  const loadClassData = async () => {
    const { data: classData, error: classError } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        course_templates(name, code),
        bookings(id, student_name, student_email, status)
      `)
      .eq("id", classId)
      .single();

    if (classError || !classData) {
      toast({
        title: "Error loading class",
        description: classError?.message,
        variant: "destructive"
      });
      return;
    }

    setClassName(classData.course_templates?.name || "Class");
    setClassDate(format(new Date(classData.start_datetime), "PPP 'at' p"));

    // Get existing attendance records
    const { data: attendanceData } = await supabase
      .from("class_attendance")
      .select("*")
      .eq("class_id", classId);

    const attendanceMap = new Map(
      attendanceData?.map(a => [a.booking_id, a.status === "present"]) || []
    );

    const studentList: Student[] = (classData.bookings || []).map((booking: any) => ({
      bookingId: booking.id,
      studentName: booking.student_name,
      studentEmail: booking.student_email,
      status: booking.status,
      attended: attendanceMap.get(booking.id) || false
    }));

    setStudents(studentList);
  };

  const toggleAttendance = (bookingId: string) => {
    setStudents(prev => prev.map(s => 
      s.bookingId === bookingId ? { ...s, attended: !s.attended } : s
    ));
  };

  const saveAttendance = async () => {
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const student of students) {
        const { error } = await supabase
          .from("class_attendance")
          .upsert({
            class_id: classId as string,
            booking_id: student.bookingId,
            student_name: student.studentName,
            student_email: student.studentEmail,
            status: student.attended ? "present" : "absent",
            check_in_time: student.attended ? new Date().toISOString() : null,
            checked_in_by: user.id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "class_id,booking_id"
          });

        if (error) throw error;
      }

      toast({
        title: "Attendance saved",
        description: "All changes have been saved successfully"
      });

      router.push("/field");
    } catch (error: any) {
      toast({
        title: "Error saving attendance",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const presentCount = students.filter(s => s.attended).length;

  return (
    <>
      <SEO title={`Attendance - ${className} - GTS Training`} />
      <OfflineIndicator />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/field">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Take Attendance</h1>
            </div>
            <p className="text-sm opacity-90">{className}</p>
            <p className="text-xs opacity-75">{classDate}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Attendance Summary
                </span>
                <Badge variant="secondary" className="text-lg">
                  {presentCount}/{students.length}
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Student List */}
          <div className="space-y-3 mb-6">
            {students.map((student) => (
              <Card 
                key={student.bookingId}
                className={`cursor-pointer transition-all ${
                  student.attended ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""
                }`}
                onClick={() => toggleAttendance(student.bookingId)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={student.attended}
                      onCheckedChange={() => toggleAttendance(student.bookingId)}
                      className="h-6 w-6"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                    </div>
                    {student.attended && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={saveAttendance}
            disabled={saving}
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>
    </>
  );
}