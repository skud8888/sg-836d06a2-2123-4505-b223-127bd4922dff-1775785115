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
  Eye,
  MapPin,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Star
} from "lucide-react";
import Link from "next/link";

interface Enrollment {
  id: string;
  status: string;
  payment_status: string;
  amount_paid: number;
  amount_due: number;
  created_at: string;
  course_template_id: string;
  course: {
    name: string;
    duration_hours: number;
  };
}

interface Progress {
  id: string;
  enrollment_id: string;
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

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order_index: number;
  duration_hours: number;
}

interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  duration_minutes: number;
  order_index: number;
  video_url: string | null;
}

interface LessonCompletion {
  id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export default function StudentPortalPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [lessonCompletions, setLessonCompletions] = useState<LessonCompletion[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [courseLessons, setCourseLessons] = useState<CourseLesson[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

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
          .select("*")
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

  const loadCourseDetails = async (courseId: string, progressId: string) => {
    setLoadingProgress(true);
    try {
      // Load modules
      const { data: modules, error: modulesError } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (modulesError) throw modulesError;
      setCourseModules(modules || []);

      // Load lessons
      const moduleIds = modules?.map(m => m.id) || [];
      if (moduleIds.length > 0) {
        const { data: lessons, error: lessonsError } = await supabase
          .from("course_lessons")
          .select("*")
          .in("module_id", moduleIds)
          .order("order_index");

        if (lessonsError) throw lessonsError;
        setCourseLessons(lessons || []);
      }

      // Load completions for this course
      const { data: completions, error: completionsError } = await supabase
        .from("lesson_completions")
        .select("*")
        .eq("student_progress_id", progressId);

      if (completionsError) throw completionsError;
      setLessonCompletions(completions || []);

    } catch (err: any) {
      console.error("Error loading course details:", err);
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive"
      });
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleMarkLessonComplete = async (lessonId: string, progressId: string) => {
    try {
      const { error } = await supabase
        .from("lesson_completions")
        .upsert({
          student_progress_id: progressId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reload completions
      const { data: completions } = await supabase
        .from("lesson_completions")
        .select("*")
        .eq("student_progress_id", progressId);

      setLessonCompletions(completions || []);

      // Update overall progress percentage
      const totalLessons = courseLessons.length;
      const completedLessons = (completions || []).filter(c => c.completed).length;
      const percentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      // Update progress
      const { error: progressError } = await supabase
        .from("student_progress")
        .update({ 
          completion_percentage: percentage,
          status: percentage === 100 ? "completed" : "in_progress",
          completed_at: percentage === 100 ? new Date().toISOString() : null
        })
        .eq("id", progressId);

      if (progressError) throw progressError;

      // If 100% complete, generate certificate automatically
      if (percentage === 100) {
        const progress = progressData.find(p => p.id === progressId);
        if (progress && !progress.certificate_issued) {
          await generateCertificate(progressId, progress.course_template_id);
        }
      }

      toast({
        title: "Progress saved",
        description: percentage === 100 ? "Congratulations! Course completed! Certificate generated." : "Lesson marked as complete"
      });

      // Reload progress data
      loadStudentData(user.id);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const generateCertificate = async (progressId: string, courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if certificate already exists
      const { data: existing } = await supabase
        .from("certificates")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_template_id", courseId)
        .single();

      if (existing) return; // Already has certificate

      // Generate certificate
      const certificateNumber = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const verificationCode = Math.random().toString(36).substring(2, 15).toUpperCase();

      const { error } = await supabase
        .from("certificates")
        .insert({
          student_id: user.id,
          course_template_id: courseId,
          certificate_number: certificateNumber,
          verification_code: verificationCode,
          issue_date: new Date().toISOString().split("T")[0],
          completion_date: new Date().toISOString().split("T")[0],
          status: "active"
        });

      if (error) throw error;

      // Update progress to mark certificate as issued
      await supabase
        .from("student_progress")
        .update({ certificate_issued: true })
        .eq("id", progressId);

      toast({
        title: "Certificate Generated!",
        description: "Your completion certificate is now available in the Certificates tab",
        duration: 5000
      });
    } catch (err: any) {
      console.error("Error generating certificate:", err);
    }
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
                      <div className="flex gap-2">
                        <Button className="flex-1" variant="outline" asChild>
                          <Link href="/courses">Browse Courses</Link>
                        </Button>
                        <Button className="flex-1" variant="outline" asChild>
                          <Link href="/student/certificates">My Certificates</Link>
                        </Button>
                      </div>
                      <div className="mt-2">
                        <Button className="w-full" variant="secondary" asChild>
                          <Link href="/student/pre-course">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Pre-Course Study Materials
                          </Link>
                        </Button>
                      </div>
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
                          <div className="mt-4 flex gap-2">
                            {enrollment.amount_due > 0 && (
                              <Button size="sm">
                                Make Payment
                              </Button>
                            )}
                            {enrollment.status === "completed" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => router.push(`/student/rate-course?enrollmentId=${enrollment.id}`)}
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Rate Course
                              </Button>
                            )}
                          </div>
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
                      const enrollment = enrollments.find(e => e.id === progress.enrollment_id);
                      const courseId = enrollment?.course_template_id;
                      const isExpanded = selectedCourseId === courseId;

                      return (
                        <Card key={progress.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="flex items-center gap-2">
                                  {progress.enrollment.course.name}
                                  {progress.status === "completed" && (
                                    <Badge className="bg-green-600">Completed</Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="mt-2">
                                  Started: {new Date(progress.started_at).toLocaleDateString()}
                                </CardDescription>
                              </div>
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

                              {progress.status === "completed" && progress.completed_at && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <Award className="h-4 w-4" />
                                  <span>
                                    Completed on {new Date(progress.completed_at).toLocaleDateString()}
                                  </span>
                                </div>
                              )}

                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  if (isExpanded) {
                                    setSelectedCourseId(null);
                                  } else {
                                    setSelectedCourseId(courseId || null);
                                    if (courseId) {
                                      loadCourseDetails(courseId, progress.id);
                                    }
                                  }
                                }}
                              >
                                {isExpanded ? "Hide" : "View"} Detailed Progress
                                {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                              </Button>

                              {isExpanded && (
                                <div className="mt-4 space-y-6">
                                  {loadingProgress ? (
                                    <div className="flex justify-center py-8">
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                  ) : courseModules.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">
                                      No modules available yet
                                    </p>
                                  ) : (
                                    courseModules.map((module, moduleIndex) => {
                                      const moduleLessons = courseLessons.filter(l => l.module_id === module.id);
                                      const completedInModule = moduleLessons.filter(lesson =>
                                        lessonCompletions.some(c => c.lesson_id === lesson.id && c.completed)
                                      ).length;
                                      const moduleProgress = moduleLessons.length > 0
                                        ? (completedInModule / moduleLessons.length) * 100
                                        : 0;

                                      return (
                                        <div key={module.id} className="border rounded-lg p-4">
                                          <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                              <h4 className="font-semibold">
                                                Module {moduleIndex + 1}: {module.title}
                                              </h4>
                                              <Badge variant="outline">
                                                {completedInModule}/{moduleLessons.length}
                                              </Badge>
                                            </div>
                                            {module.description && (
                                              <p className="text-sm text-muted-foreground mb-2">
                                                {module.description}
                                              </p>
                                            )}
                                            <Progress value={moduleProgress} className="h-2" />
                                          </div>

                                          <div className="space-y-2">
                                            {moduleLessons.map((lesson, lessonIndex) => {
                                              const isCompleted = lessonCompletions.some(
                                                c => c.lesson_id === lesson.id && c.completed
                                              );

                                              return (
                                                <div
                                                  key={lesson.id}
                                                  className={`flex items-center justify-between p-3 rounded-lg border ${
                                                    isCompleted ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/50"
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-3 flex-1">
                                                    {isCompleted ? (
                                                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                    ) : (
                                                      <div className="h-5 w-5 rounded-full border-2 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1">
                                                      <p className="font-medium text-sm">
                                                        {lessonIndex + 1}. {lesson.title}
                                                      </p>
                                                      {lesson.duration_minutes && (
                                                        <p className="text-xs text-muted-foreground">
                                                          {lesson.duration_minutes} minutes
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                  {!isCompleted && progress.status !== "completed" && (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleMarkLessonComplete(lesson.id, progress.id)}
                                                    >
                                                      Mark Complete
                                                    </Button>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
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