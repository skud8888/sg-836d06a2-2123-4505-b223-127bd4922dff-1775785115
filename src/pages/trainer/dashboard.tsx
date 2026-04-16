import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  MessageSquare,
  FileText,
  BarChart3,
  Star
} from "lucide-react";

interface DashboardStats {
  totalClasses: number;
  upcomingClasses: number;
  completedClasses: number;
  totalStudents: number;
  averageRating: number;
  totalEarnings: number;
  pendingPayouts: number;
}

interface UpcomingClass {
  id: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  status: string;
  course_templates: {
    name: string;
  };
  bookings: { count: number }[];
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  enrollment_count: number;
  avg_progress: number;
}

export default function TrainerDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    upcomingClasses: 0,
    completedClasses: 0,
    totalStudents: 0,
    averageRating: 0,
    totalEarnings: 0,
    pendingPayouts: 0
  });
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      router.push("/admin/login");
      return;
    }

    const role = await rbacService.getUserPrimaryRole();
    const allowedRoles = ["trainer", "admin", "super_admin"];

    if (!role || !allowedRoles.includes(role)) {
      toast({
        title: "Access Denied",
        description: "You need trainer access to view this page",
        variant: "destructive"
      });
      router.push("/");
      return;
    }

    setUser(currentUser);
    loadDashboardData(currentUser.id);
  };

  const loadDashboardData = async (trainerId: string) => {
    setLoading(true);
    try {
      // Load stats
      await Promise.all([
        loadStats(trainerId),
        loadUpcomingClasses(trainerId),
        loadStudents(trainerId)
      ]);
    } catch (err: any) {
      console.error("Error loading dashboard:", err);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (trainerId: string) => {
    // Total classes
    const { data: allClasses } = await supabase
      .from("scheduled_classes")
      .select("id, status")
      .eq("trainer_id", trainerId);

    const totalClasses = allClasses?.length || 0;
    const completedClasses = allClasses?.filter(c => c.status === "completed").length || 0;
    const upcomingClasses = allClasses?.filter(c => c.status === "scheduled" || c.status === "in_progress").length || 0;

    // Total students
    const { data: studentEnrollments } = await supabase
      .from("bookings")
      .select("student_id")
      .in("scheduled_class_id", allClasses?.map(c => c.id) || []);

    const uniqueStudents = new Set(studentEnrollments?.map(e => e.student_id));
    const totalStudents = uniqueStudents.size;

    // Average rating
    const { data: feedback } = await supabase
      .from("course_feedback")
      .select("trainer_quality")
      .in("scheduled_class_id", allClasses?.map(c => c.id) || [])
      .not("trainer_quality", "is", null);

    const avgRating = feedback && feedback.length > 0
      ? feedback.reduce((sum, f) => sum + (f.trainer_quality || 0), 0) / feedback.length
      : 0;

    // Earnings
    const { data: payouts } = await supabase
      .from("instructor_payouts")
      .select("instructor_share, status")
      .eq("instructor_id", trainerId);

    const totalEarnings = payouts?.filter(p => p.status === "paid")
      .reduce((sum, p) => sum + (p.instructor_share || 0), 0) || 0;

    const pendingPayouts = payouts?.filter(p => p.status === "pending" || p.status === "approved")
      .reduce((sum, p) => sum + (p.instructor_share || 0), 0) || 0;

    setStats({
      totalClasses,
      upcomingClasses,
      completedClasses,
      totalStudents,
      averageRating: avgRating,
      totalEarnings,
      pendingPayouts
    });
  };

  const loadUpcomingClasses = async (trainerId: string) => {
    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        course_templates (name),
        bookings (count)
      `)
      .eq("trainer_id", trainerId)
      .in("status", ["scheduled", "in_progress"])
      .gte("start_datetime", new Date().toISOString())
      .order("start_datetime")
      .limit(5);

    if (!error && data) {
      setUpcomingClasses(data as any);
    }
  };

  const loadStudents = async (trainerId: string) => {
    // Get all classes for this trainer
    const { data: classes } = await supabase
      .from("scheduled_classes")
      .select("id")
      .eq("trainer_id", trainerId);

    if (!classes || classes.length === 0) {
      setStudents([]);
      return;
    }

    // Get student enrollments with progress
    const { data: enrollments } = await supabase
      .from("bookings")
      .select(`
        student_id,
        student_name,
        student_email
      `)
      .in("scheduled_class_id", classes.map(c => c.id));

    if (!enrollments) {
      setStudents([]);
      return;
    }

    // Group by student
    const studentMap = new Map();
    enrollments.forEach((enrollment: any) => {
      if (!studentMap.has(enrollment.student_id)) {
        studentMap.set(enrollment.student_id, {
          id: enrollment.student_id,
          full_name: enrollment.student_name,
          email: enrollment.student_email,
          enrollment_count: 0,
          avg_progress: 0
        });
      }
      const student = studentMap.get(enrollment.student_id);
      student.enrollment_count += 1;
    });

    setStudents(Array.from(studentMap.values()).slice(0, 10));
  };

  if (loading) {
    return (
      <>
        <SEO title="Trainer Dashboard" />
        <Navigation />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Trainer Dashboard - Manage Your Classes" />
      <Navigation />

      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Instructor Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your teaching overview.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Classes
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.upcomingClasses} upcoming
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Across all courses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                  {stats.averageRating > 0 && <span className="text-lg text-muted-foreground">/5</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Student feedback
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Earnings
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${stats.pendingPayouts.toFixed(2)} pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="classes" className="space-y-6">
            <TabsList>
              <TabsTrigger value="classes">Upcoming Classes</TabsTrigger>
              <TabsTrigger value="students">My Students</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Upcoming Classes Tab */}
            <TabsContent value="classes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Classes</CardTitle>
                  <CardDescription>
                    Your next {upcomingClasses.length} scheduled classes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingClasses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No upcoming classes scheduled
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingClasses.map((cls) => (
                        <div 
                          key={cls.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">
                              {cls.course_templates.name}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(cls.start_datetime).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(cls.start_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {cls.bookings[0]?.count || 0} enrolled
                              </div>
                            </div>
                          </div>
                          <Badge variant={cls.status === "scheduled" ? "default" : "secondary"}>
                            {cls.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Students</CardTitle>
                  <CardDescription>
                    Students enrolled in your classes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No students yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {students.map((student) => (
                        <div 
                          key={student.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-semibold">{student.full_name}</h4>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              {student.enrollment_count} {student.enrollment_count === 1 ? "class" : "classes"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Teaching Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Completed Classes</span>
                      <span className="font-semibold">{stats.completedClasses}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Average Class Size</span>
                      <span className="font-semibold">
                        {stats.totalClasses > 0 
                          ? Math.round(stats.totalStudents / stats.totalClasses)
                          : 0} students
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-semibold">
                        {stats.totalClasses > 0
                          ? Math.round((stats.completedClasses / stats.totalClasses) * 100)
                          : 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Earnings</span>
                      <span className="font-semibold">${stats.totalEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pending Payouts</span>
                      <span className="font-semibold text-amber-600">
                        ${stats.pendingPayouts.toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-4">
                      <Link href="/trainer/payouts">
                        <Button variant="outline" className="w-full">
                          View Detailed Payouts
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Link href="/admin/calendar">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    View Schedule
                  </CardTitle>
                  <CardDescription>
                    See your full teaching calendar
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/field">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Field Tools
                  </CardTitle>
                  <CardDescription>
                    Mark attendance and capture evidence
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/analytics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    View Reports
                  </CardTitle>
                  <CardDescription>
                    Analyze your teaching performance
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}