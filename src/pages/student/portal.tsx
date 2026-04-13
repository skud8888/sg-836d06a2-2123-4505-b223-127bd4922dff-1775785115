import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Award,
  Calendar,
  DollarSign,
  LogOut,
  FileText,
  MessageSquare,
  Download,
  Eye
} from "lucide-react";
import Link from "next/link";

interface Enrollment {
  id: string;
  status: string;
  payment_status: string;
  amount_paid: number;
  amount_due: number;
  created_at: string;
  course: {
    name: string;
    duration_hours: number;
  };
}

interface Progress {
  id: string;
  completion_percentage: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  certificate_issued: boolean;
  enrollment: {
    course: {
      name: string;
    };
  };
}

interface LessonCompletion {
  id: string;
  completed: boolean;
  completed_at: string | null;
  lesson: {
    title: string;
    duration_minutes: number;
    module: {
      title: string;
    };
  };
}

export default function StudentPortalPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [lessonCompletions, setLessonCompletions] = useState<LessonCompletion[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setUser(profile);
    loadStudentData(session.user.id);
  };

  const loadStudentData = async (userId: string) => {
    setLoading(true);
    try {
      // Load enrollments
      const { data: enrollmentsData, error: enrollError } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:course_templates!enrollments_course_template_id_fkey(name, duration_hours)
        `)
        .eq("student_id", userId)
        .order("created_at", { ascending: false });

      if (enrollError) throw enrollError;
      setEnrollments(enrollmentsData || []);

      // Load progress
      const { data: progressData, error: progressError } = await supabase
        .from("student_progress")
        .select(`
          *,
          enrollment:enrollments!student_progress_enrollment_id_fkey(
            course:course_templates!enrollments_course_template_id_fkey(name)
          )
        `)
        .eq("student_id", userId);

      if (progressError) throw progressError;
      setProgressData(progressData || []);

      // Load lesson completions
      const progressIds = progressData?.map(p => p.id) || [];
      if (progressIds.length > 0) {
        const { data: completions, error: completionsError } = await supabase
          .from("lesson_completions")
          .select(`
            *,
            lesson:course_lessons!lesson_completions_lesson_id_fkey(
              title,
              duration_minutes,
              module:course_modules!course_lessons_module_id_fkey(title)
            )
          `)
          .in("student_progress_id", progressIds);

        if (completionsError) throw completionsError;
        setLessonCompletions(completions || []);
      }

    } catch (err: any) {
      console.error("Error loading student data:", err);
      toast({
        title: "Error",
        description: "Failed to load your data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-600">Confirmed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600">Paid</Badge>;
      case "partial":
        return <Badge variant="secondary">Partial</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <SEO
        title="Student Portal"
        description="View your course enrollments, progress, and certificates"
      />
      <Navigation />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Student Portal</h1>
                <p className="text-muted-foreground">
                  Welcome back, {user?.full_name || user?.email}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/courses">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg">Browse Courses</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/student/feedback">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg">Submit Feedback</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/certificates">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg">My Certificates</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="enrollments" className="space-y-6">
              <TabsList>
                <TabsTrigger value="enrollments">My Enrollments</TabsTrigger>
                <TabsTrigger value="progress">Course Progress</TabsTrigger>
                <TabsTrigger value="certificates">Certificates</TabsTrigger>
              </TabsList>

              {/* Enrollments Tab */}
              <TabsContent value="enrollments" className="space-y-4">
                {enrollments.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Enrollments Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Browse our course catalog to get started
                      </p>
                      <Link href="/courses">
                        <Button>
                          Browse Courses
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {enrollments.map((enrollment) => (
                      <Card key={enrollment.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{enrollment.course.name}</CardTitle>
                              <CardDescription className="mt-2">
                                Duration: {enrollment.course.duration_hours} hours
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(enrollment.status)}
                              {getPaymentBadge(enrollment.payment_status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Enrolled: {new Date(enrollment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Paid: ${enrollment.amount_paid} 
                                {enrollment.amount_due > 0 && ` / Due: $${enrollment.amount_due}`}
                              </span>
                            </div>
                          </div>
                          {enrollment.amount_due > 0 && (
                            <div className="mt-4">
                              <Button size="sm">
                                Make Payment
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="space-y-4">
                {progressData.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Progress Data</h3>
                      <p className="text-muted-foreground">
                        Enroll in a course to start tracking your progress
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {progressData.map((progress) => {
                      const courseLessons = lessonCompletions.filter(
                        lc => lc.lesson && progressData.find(p => p.id === lc.id)
                      );
                      const completedLessons = courseLessons.filter(lc => lc.completed).length;
                      const totalLessons = courseLessons.length;

                      return (
                        <Card key={progress.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle>{progress.enrollment.course.name}</CardTitle>
                                <CardDescription className="mt-2">
                                  Started: {new Date(progress.started_at).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <Badge 
                                className={
                                  progress.status === "completed" 
                                    ? "bg-green-600" 
                                    : "bg-blue-600"
                                }
                              >
                                {progress.status === "completed" ? "Completed" : "In Progress"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">
                                    Overall Progress
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {Math.round(progress.completion_percentage)}%
                                  </span>
                                </div>
                                <Progress value={progress.completion_percentage} />
                              </div>

                              {totalLessons > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>
                                    {completedLessons} of {totalLessons} lessons completed
                                  </span>
                                </div>
                              )}

                              {progress.status === "completed" && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <Award className="h-4 w-4" />
                                  <span>
                                    Completed on {new Date(progress.completed_at!).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Certificates Tab */}
              <TabsContent value="certificates" className="space-y-4">
                {progressData.filter(p => p.certificate_issued).length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
                      <p className="text-muted-foreground">
                        Complete a course to earn your certificate
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {progressData
                      .filter(p => p.certificate_issued)
                      .map((progress) => (
                        <Card key={progress.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  <Award className="h-5 w-5 text-yellow-600" />
                                  {progress.enrollment.course.name}
                                </CardTitle>
                                <CardDescription className="mt-2">
                                  Completed: {new Date(progress.completed_at!).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <Button size="sm">
                                Download Certificate
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Certificate issued and verified</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  );
}