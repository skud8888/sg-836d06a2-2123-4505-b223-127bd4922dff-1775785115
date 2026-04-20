import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  BookOpen,
  Star,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Download,
} from "lucide-react";
import { exportService } from "@/services/exportService";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface AnalyticsMetrics {
  revenue: {
    total: number;
    growth: number;
    monthlyTrend: { month: string; amount: number }[];
  };
  students: {
    total: number;
    active: number;
    growth: number;
    retentionRate: number;
  };
  courses: {
    totalEnrollments: number;
    completionRate: number;
    averageRating: number;
    popularCourses: { name: string; enrollments: number }[];
  };
  engagement: {
    dailyActiveUsers: number;
    averageSessionDuration: number;
    forumPosts: number;
    feedbackCount: number;
  };
}

export default function AdvancedAnalytics() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);

  useEffect(() => {
    checkAuth();
    fetchAnalytics();
  }, [dateRange]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      router.push("/");
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = parseInt(dateRange);
    const startDate = subDays(new Date(), days);

    try {
      const [revenueData, studentsData, coursesData, engagementData] = await Promise.all([
        fetchRevenueMetrics(startDate),
        fetchStudentMetrics(startDate),
        fetchCourseMetrics(startDate),
        fetchEngagementMetrics(startDate),
      ]);

      setMetrics({
        revenue: revenueData,
        students: studentsData,
        courses: coursesData,
        engagement: engagementData,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const fetchRevenueMetrics = async (startDate: Date) => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("paid_amount, created_at")
      .gte("created_at", startDate.toISOString());

    const total = bookings?.reduce((sum, b) => sum + b.paid_amount, 0) || 0;
    
    const prevPeriodStart = subDays(startDate, parseInt(dateRange));
    const { data: prevBookings } = await supabase
      .from("bookings")
      .select("paid_amount")
      .gte("created_at", prevPeriodStart.toISOString())
      .lt("created_at", startDate.toISOString());

    const prevTotal = prevBookings?.reduce((sum, b) => sum + b.paid_amount, 0) || 0;
    const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

    const monthlyTrend = bookings?.reduce((acc, b) => {
      const month = format(new Date(b.created_at), "MMM yyyy");
      acc[month] = (acc[month] || 0) + b.paid_amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      growth,
      monthlyTrend: Object.entries(monthlyTrend || {}).map(([month, amount]) => ({ month, amount })),
    };
  };

  const fetchStudentMetrics = async (startDate: Date) => {
    const { data: students } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("role", "student");

    const total = students?.length || 0;
    const newStudents = students?.filter(s => new Date(s.created_at) >= startDate).length || 0;

    const prevPeriodStart = subDays(startDate, parseInt(dateRange));
    const prevStudents = students?.filter(
      s => new Date(s.created_at) >= prevPeriodStart && new Date(s.created_at) < startDate
    ).length || 0;

    const growth = prevStudents > 0 ? ((newStudents - prevStudents) / prevStudents) * 100 : 0;

    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id, status")
      .gte("created_at", subDays(new Date(), 30).toISOString());

    const active = new Set(enrollments?.filter(e => e.status === "active").map(e => e.student_id)).size;
    const retentionRate = total > 0 ? (active / total) * 100 : 0;

    return { total, active, growth, retentionRate };
  };

  const fetchCourseMetrics = async (startDate: Date) => {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select(`
        *,
        course_templates(name)
      `)
      .gte("created_at", startDate.toISOString());

    const totalEnrollments = enrollments?.length || 0;
    const completed = enrollments?.filter(e => e.status === "completed").length || 0;
    const completionRate = totalEnrollments > 0 ? (completed / totalEnrollments) * 100 : 0;

    const { data: feedback } = await supabase
      .from("course_feedback")
      .select("rating");
    const averageRating = feedback?.length 
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
      : 0;

    const courseEnrollments = enrollments?.reduce((acc, e) => {
      const courseName = (e.course_templates as any)?.name || "Unknown";
      acc[courseName] = (acc[courseName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularCourses = Object.entries(courseEnrollments || {})
      .map(([name, enrollments]) => ({ name, enrollments }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    return { totalEnrollments, completionRate, averageRating, popularCourses };
  };

  const fetchEngagementMetrics = async (startDate: Date) => {
    const { data: activities } = await supabase
      .from("user_activities")
      .select("user_id, created_at")
      .gte("created_at", subDays(new Date(), 1).toISOString());

    const dailyActiveUsers = new Set(activities?.map(a => a.user_id)).size;

    const { data: forum } = await supabase
      .from("forum_posts")
      .select("id")
      .gte("created_at", startDate.toISOString());

    const { data: feedback } = await supabase
      .from("course_feedback")
      .select("id")
      .gte("created_at", startDate.toISOString());

    return {
      dailyActiveUsers,
      averageSessionDuration: 0,
      forumPosts: forum?.length || 0,
      feedbackCount: feedback?.length || 0,
    };
  };

  const handleExport = async () => {
    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        dateRange: `Last ${dateRange} days`,
        metrics,
      };
      exportService.exportToJSON([reportData], `analytics_report_${format(new Date(), "yyyy-MM-dd")}`);
      toast({ title: "Report exported successfully" });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export analytics report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading advanced analytics...</div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Advanced Analytics - Admin Dashboard" />
      <Navigation />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Advanced Analytics" },
            ]}
          />

          <div className="flex items-center justify-between mb-8 mt-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Advanced Analytics
              </h1>
              <p className="text-muted-foreground mt-1">Comprehensive business insights and metrics</p>
            </div>
            <div className="flex gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics?.revenue.total.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {metrics?.revenue.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={metrics?.revenue.growth >= 0 ? "text-green-500" : "text-red-500"}>
                    {Math.abs(metrics?.revenue.growth || 0).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">vs previous period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.students.active}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.students.retentionRate.toFixed(1)}% retention rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Course Completion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.courses.completionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.courses.totalEnrollments} total enrollments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.courses.averageRating.toFixed(1)} ⭐</div>
                <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.revenue.monthlyTrend.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.month}</span>
                        <span className="text-sm font-bold">${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Students</span>
                        <span className="font-bold">{metrics?.students.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Active Students</span>
                        <span className="font-bold">{metrics?.students.active}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Growth Rate</span>
                        <Badge variant={metrics?.students.growth >= 0 ? "default" : "destructive"}>
                          {metrics?.students.growth.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Retention Rate</span>
                        <span className="font-bold">{metrics?.students.retentionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Student Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Detailed student behavior analysis and segmentation coming soon
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Courses</CardTitle>
                  <CardDescription>Top 5 courses by enrollment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.courses.popularCourses.map((course, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{idx + 1}</Badge>
                          <span className="text-sm font-medium">{course.name}</span>
                        </div>
                        <span className="text-sm font-bold">{course.enrollments} enrollments</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Daily Active Users</span>
                        <span className="font-bold">{metrics?.engagement.dailyActiveUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Forum Posts</span>
                        <span className="font-bold">{metrics?.engagement.forumPosts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Feedback Submitted</span>
                        <span className="font-bold">{metrics?.engagement.feedbackCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-center py-8">
                      {(
                        (metrics?.engagement.dailyActiveUsers || 0) /
                        (metrics?.students.total || 1) *
                        100
                      ).toFixed(1)}%
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      Overall platform engagement
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}