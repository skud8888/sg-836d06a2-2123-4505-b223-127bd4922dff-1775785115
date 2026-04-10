import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { exportService } from "@/services/exportService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowLeft, Download, User, Mail, Phone, DollarSign, BookOpen, Calendar, Star } from "lucide-react";
import { format } from "date-fns";

type StudentRecord = {
  student_email: string;
  student_name: string;
  student_phone: string;
  total_bookings: number;
  completed_courses: number;
  cancelled_courses: number;
  lifetime_value: number;
  total_paid: number;
  outstanding_balance: number;
  avg_rating: number | null;
  last_booking_date: string;
  first_booking_date: string;
};

type StudentBooking = {
  id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  usi_number: string | null;
  status: string;
  payment_status: string;
  total_amount: number;
  paid_amount: number;
  created_at: string;
  scheduled_classes: {
    start_datetime: string;
    location: string;
    course_templates: {
      name: string;
      code: string;
    } | null;
  } | null;
};

export default function StudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [studentBookings, setStudentBookings] = useState<StudentBooking[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(s => 
        s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_phone?.includes(searchTerm)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("student_analytics")
      .select("*")
      .order("last_booking_date", { ascending: false });

    if (error) {
      toast({
        title: "Error loading students",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setStudents(data || []);
      setFilteredStudents(data || []);
    }
    setLoading(false);
  };

  const viewStudentDetails = async (student: StudentRecord) => {
    setSelectedStudent(student);
    setDialogOpen(true);

    // Fetch all bookings for this student
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        scheduled_classes (
          start_datetime,
          location,
          course_templates (name, code)
        )
      `)
      .eq("student_email", student.student_email)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStudentBookings(data as any);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-green-500",
      pending: "bg-yellow-500",
      completed: "bg-blue-500",
      cancelled: "bg-red-500"
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-500",
      partial: "bg-orange-500",
      unpaid: "bg-red-500"
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Student Management</h1>
            <p className="text-muted-foreground">View all student records and enrollment history</p>
          </div>
          <Button
            onClick={async () => {
              const csv = await exportService.exportBookingsCSV();
              exportService.downloadCSV(csv, `students-${format(new Date(), "yyyy-MM-dd")}.csv`);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No students found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Students ({filteredStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Courses</TableHead>
                    <TableHead className="text-right">Lifetime Value</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.student_email}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.student_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Member since {format(new Date(student.first_booking_date), "MMM yyyy")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {student.student_email}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {student.student_phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <p className="font-semibold">{student.total_bookings}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.completed_courses} completed
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${student.lifetime_value?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right">
                        {student.outstanding_balance > 0 ? (
                          <span className="text-orange-600 font-semibold">
                            ${student.outstanding_balance.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-green-600">Paid</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.avg_rating ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{student.avg_rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewStudentDetails(student)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Profile</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6">
                {/* Student Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedStudent.student_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedStudent.student_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedStudent.student_phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                        <p className="font-semibold text-lg">{selectedStudent.total_bookings}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed Courses</p>
                        <p className="font-semibold text-lg">{selectedStudent.completed_courses}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lifetime Value</p>
                        <p className="font-semibold text-lg text-green-600">
                          ${selectedStudent.lifetime_value?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                        <p className="font-semibold text-lg text-orange-600">
                          ${selectedStudent.outstanding_balance?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Booking History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Enrollment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentBookings.map((booking) => (
                        <div key={booking.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">
                                {booking.scheduled_classes?.course_templates?.name || "Unknown Course"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {booking.scheduled_classes?.course_templates?.code}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(booking.status)}
                              {getPaymentBadge(booking.payment_status)}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Start Date</p>
                              <p className="font-medium">
                                {booking.scheduled_classes?.start_datetime
                                  ? format(new Date(booking.scheduled_classes.start_datetime), "PP")
                                  : "TBD"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Amount</p>
                              <p className="font-medium">${booking.total_amount}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Paid</p>
                              <p className="font-medium text-green-600">${booking.paid_amount}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}