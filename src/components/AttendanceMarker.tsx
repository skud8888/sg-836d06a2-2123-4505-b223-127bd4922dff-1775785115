import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, AlertCircle } from "lucide-react";

type AttendanceRecord = {
  id: string;
  booking_id: string;
  student_name: string;
  student_email: string;
  status: string;
  notes: string | null;
  check_in_time: string | null;
};

type Booking = {
  id: string;
  student_name: string;
  student_email: string;
};

type AttendanceMarkerProps = {
  classId: string;
  bookings: Booking[];
  onUpdate?: () => void;
};

export function AttendanceMarker({ classId, bookings, onUpdate }: AttendanceMarkerProps) {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);

  const loadAttendance = async () => {
    const { data } = await supabase
      .from("class_attendance")
      .select("*")
      .eq("class_id", classId);

    if (data) {
      const attendanceMap: Record<string, AttendanceRecord> = {};
      data.forEach((record) => {
        attendanceMap[record.booking_id] = record as AttendanceRecord;
      });
      setAttendance(attendanceMap);
    }
  };

  const markAttendance = async (bookingId: string, status: string, notes: string = "") => {
    setLoading(true);
    
    const existingRecord = attendance[bookingId];
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      toast({ title: "Error", description: "Booking not found", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from("class_attendance")
          .update({
            status,
            notes,
            check_in_time: status === "present" ? new Date().toISOString() : existingRecord.check_in_time
          })
          .eq("id", existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from("class_attendance")
          .insert({
            class_id: classId,
            booking_id: bookingId,
            student_name: booking.student_name,
            student_email: booking.student_email,
            status,
            notes,
            check_in_time: status === "present" ? new Date().toISOString() : null
          });

        if (error) throw error;
      }

      toast({ title: "Attendance marked", description: `${booking.student_name} marked as ${status}` });
      await loadAttendance();
      onUpdate?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadAttendance();
  });

  const getStatusBadge = (status: string) => {
    const config = {
      present: { icon: Check, color: "bg-green-500", label: "Present" },
      absent: { icon: X, color: "bg-red-500", label: "Absent" },
      late: { icon: Clock, color: "bg-orange-500", label: "Late" },
      excused: { icon: AlertCircle, color: "bg-blue-500", label: "Excused" }
    };
    const { icon: Icon, color, label } = config[status as keyof typeof config] || config.absent;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.map((booking) => {
            const record = attendance[booking.id];
            return (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{booking.student_name}</p>
                  <p className="text-sm text-muted-foreground">{booking.student_email}</p>
                  {record?.check_in_time && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Checked in: {new Date(record.check_in_time).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {record && getStatusBadge(record.status)}
                  <Select
                    value={record?.status || ""}
                    onValueChange={(value) => markAttendance(booking.id, value, record?.notes || "")}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Mark..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}