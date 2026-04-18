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
import { gamificationService } from "@/services/gamificationService";
import { recommendationService } from "@/services/recommendationService";
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
  Star,
  Brain
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
  const [gamificationStats, setGamificationStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [insightsCount, setInsightsCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/");
      return;
    }

    setUser(user);
    await loadStudentData(user.id);
    await loadGamificationStats(user.id);
    await loadRecommendations(user.id);
    await loadInsightsCount(user.id);
  };

  const loadInsightsCount = async (userId: string) => {
    try {
      const { studentInsightsService } = await import("@/services/studentInsightsService");
      const count = await studentInsightsService.getUnreadCount(userId);
      setInsightsCount(count);
    } catch (err) {
      console.error("Error loading insights count:", err);
    }
  };

  const loadGamificationStats = async (userId: string) => {
    try {
      const stats = await gamificationService.getStudentStats(userId);
      setGamificationStats(stats);
    } catch (err) {
      console.error("Error loading gamification stats:", err);
    }
  };

  const loadRecommendations = async (userId: string) => {
    try {
      await recommendationService.generateRecommendations(userId);
      const recs = await recommendationService.getRecommendations(userId);
      setRecommendations(recs);
    } catch (err) {
      console.error("Error loading recommendations:", err);
    }
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

      // Award points for completing lesson
      if (user) {
        await gamificationService.awardPoints(
          user.id,
          10,
          "lesson_complete",
          "Completed a lesson"
        );
        await loadGamificationStats(user.id);
      }

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

      // If 100% complete, generate certificate automatically and award bonus points
      if (percentage === 100) {
        const progress = progressData.find(p => p.id === progressId);
        if (progress && !progress.certificate_issued) {
          const enrollment = enrollments.find(e => e.id === progress.enrollment_id);
          if (enrollment && enrollment.course_template_id) {
            await generateCertificate(progressId, enrollment.course_template_id);
            
            // Award bonus points for course completion
            if (user) {
              await gamificationService.awardPoints(
                user.id,
                100,
                "course_complete",
                "Completed a full course"
              );
              await gamificationService.checkAchievements(user.id);
              await loadGamificationStats(user.id);

              // Generate AI insights
              const { studentInsightsService } = await import("@/services/studentInsightsService");
              await studentInsightsService.generateInsights(user.id);
              await loadInsightsCount(user.id);
            }
          }
        }
      }

      toast({
        title: "Progress saved",
        description: percentage === 100 
          ? "Congratulations! Course completed! Certificate generated. +100 points!" 
          : "Lesson marked as complete. +10 points!"
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
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold">Welcome back!</h1>
              <p className="text-muted-foreground">Continue your learning journey</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Gamification Stats Banner */}
          {gamificationStats && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 via-accent/10 to-background">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/student/gamification" className="group cursor-pointer">
                    <div className="text-center p-3 rounded-lg hover:bg-background transition-colors">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <p className="font-bold text-2xl">{gamificationStats.total_points}</p>
                      </div>
                      <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Points</p>
                    </div>
                  </Link>
                  <Link href="/student/gamification" className="group cursor-pointer">
                    <div className="text-center p-3 rounded-lg hover:bg-background transition-colors">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Award className="h-5 w-5 text-purple-600" />
                        <p className="font-bold text-2xl">Lv{gamificationStats.current_level}</p>
                      </div>
                      <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Level</p>
                    </div>
                  </Link>
                  <Link href="/student/gamification" className="group cursor-pointer">
                    <div className="text-center p-3 rounded-lg hover:bg-background transition-colors">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <p className="font-bold text-2xl">{gamificationStats.streak_days}🔥</p>
                      </div>
                      <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Day Streak</p>
                    </div>
                  </Link>
                  <Link href="/student/gamification" className="group cursor-pointer">
                    <div className="text-center p-3 rounded-lg hover:bg-background transition-colors bg-background border-2 border-primary/20">
                      <p className="font-semibold text-primary mb-1">View All Achievements</p>
                      <p className="text-xs text-muted-foreground">→</p>
                    </div>
                  </Link>
                  <Link href="/student/insights" className="group cursor-pointer">
                    <div className="text-center p-3 rounded-lg hover:bg-background transition-colors">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <p className="font-bold text-2xl">{insightsCount}</p>
                      </div>
                      <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">AI Insights</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

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
            <Tabs defaultValue="courses" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="courses">My Courses</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="certificates">Certificates</TabsTrigger>
                <TabsTrigger value="recommended">Recommended</TabsTrigger>
              </TabsList>

              {/* Enrollments Tab */}
              <TabsContent value="courses" className="space-y-4">
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
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/courses/${enrollment.course_template_id}/forum`}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Course Q&A
                              </Link>
                            </Button>
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

              {/* Recommended Courses Tab */}
              <TabsContent value="recommended" className="space-y-4">
                {recommendations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Enroll in more courses to get personalized recommendations
                      </p>
                      <Button asChild>
                        <Link href="/courses">Browse All Courses</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Recommended For You</h3>
                      <p className="text-sm text-muted-foreground">Based on your learning history and similar students</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendations.map((rec) => (
                        <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <CardTitle className="text-lg">{rec.course_templates.name}</CardTitle>
                              {rec.course_templates.is_featured && (
                                <Badge className="ml-2 bg-amber-600">Featured</Badge>
                              )}
                            </div>
                            <CardDescription className="line-clamp-2">
                              {rec.course_templates.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{rec.course_templates.duration_hours} hours</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span>${rec.course_templates.price_full}</span>
                              </div>
                              <div className="p-2 bg-primary/10 rounded text-xs">
                                <p className="font-medium text-primary">{rec.reason}</p>
                              </div>
                              <Button className="w-full" asChild>
                                <Link href={`/enroll/${rec.course_template_id}`}>
                                  Enroll Now
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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