import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Star,
  Target,
  BarChart3,
  Download
} from "lucide-react";
import Link from "next/link";

interface RevenueStats {
  totalRevenue: number;
  paidRevenue: number;
  outstandingRevenue: number;
  revenueByMonth: { month: string; amount: number }[];
  revenueByCourse: { courseName: string; revenue: number; bookings: number }[];
}

interface EnrollmentStats {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  enrollmentTrend: { month: string; count: number }[];
  topCourses: { courseName: string; bookings: number }[];
}

interface PaymentStats {
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  paymentsByStatus: { status: string; count: number; amount: number }[];
}

interface FeedbackStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { stars: number; count: number }[];
  averageByCategory: {
    overall: number;
    course: number;
    trainer: number;
    venue: number;
  };
}

export default function Analytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);

  useEffect(() => {
    checkAuth();
    fetchAnalytics();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
    }
  };

  const fetchAnalytics = async () => {
    await Promise.all([
      fetchRevenueStats(),
      fetchEnrollmentStats(),
      fetchPaymentStats(),
      fetchFeedbackStats()
    ]);
    setLoading(false);
  };

  const fetchRevenueStats = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        *,
        scheduled_classes(
          start_datetime,
          course_templates(name)
        )
      `);

    if (!bookings) return;

    const totalRevenue = bookings.reduce((sum, b) => sum + b.total_amount, 0);
    const paidRevenue = bookings.reduce((sum, b) => sum + b.paid_amount, 0);
    const outstandingRevenue = totalRevenue - paidRevenue;

    // Revenue by course
    const courseRevenue = new Map<string, { revenue: number; bookings: number }>();
    bookings.forEach(b => {
      const courseName = (b.scheduled_classes as any)?.course_templates?.name || "Unknown";
      const current = courseRevenue.get(courseName) || { revenue: 0, bookings: 0 };
      courseRevenue.set(courseName, {
        revenue: current.revenue + b.paid_amount,
        bookings: current.bookings + 1
      });
    });

    const revenueByCourse = Array.from(courseRevenue.entries())
      .map(([courseName, data]) => ({ courseName, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    setRevenueStats({
      totalRevenue,
      paidRevenue,
      outstandingRevenue,
      revenueByMonth: [], // Would need more complex date grouping
      revenueByCourse
    });
  };

  const fetchEnrollmentStats = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        *,
        scheduled_classes(course_templates(name))
      `);

    if (!bookings) return;

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
    const completedBookings = bookings.filter(b => b.status === "completed").length;
    const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;

    // Top courses by enrollment
    const courseBookings = new Map<string, number>();
    bookings.forEach(b => {
      const courseName = (b.scheduled_classes as any)?.course_templates?.name || "Unknown";
      courseBookings.set(courseName, (courseBookings.get(courseName) || 0) + 1);
    });

    const topCourses = Array.from(courseBookings.entries())
      .map(([courseName, bookings]) => ({ courseName, bookings }))
      .sort((a, b) => b.bookings - a.bookings);

    setEnrollmentStats({
      totalBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      enrollmentTrend: [],
      topCourses
    });
  };

  const fetchPaymentStats = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*");

    if (!bookings) return;

    const totalCollected = bookings.reduce((sum, b) => sum + b.paid_amount, 0);
    const totalAmount = bookings.reduce((sum, b) => sum + b.total_amount, 0);
    const totalOutstanding = totalAmount - totalCollected;
    const collectionRate = totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0;

    const paymentsByStatus = Object.entries(
      bookings.reduce((acc, b) => {
        acc[b.payment_status] = acc[b.payment_status] || { count: 0, amount: 0 };
        acc[b.payment_status].count++;
        acc[b.payment_status].amount += b.paid_amount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>)
    ).map(([status, data]) => ({ status, ...data }));

    setPaymentStats({
      totalCollected,
      totalOutstanding,
      collectionRate,
      paymentsByStatus
    });
  };

  const fetchFeedbackStats = async () => {
    const { data: feedback } = await supabase
      .from("course_feedback")
      .select("*");

    if (!feedback || feedback.length === 0) {
      setFeedbackStats({
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: [],
        averageByCategory: { overall: 0, course: 0, trainer: 0, venue: 0 }
      });
      return;
    }

    const totalReviews = feedback.length;
    const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / totalReviews;

    const ratingBreakdown = [1, 2, 3, 4, 5].map(stars => ({
      stars,
      count: feedback.filter(f => Math.round(f.rating) === stars).length
    }));

    const averageByCategory = {
      overall: feedback.reduce((sum, f) => sum + f.rating, 0) / totalReviews,
      course: feedback.reduce((sum, f) => sum + (f.course_quality || 0), 0) / totalReviews,
      trainer: feedback.reduce((sum, f) => sum + (f.trainer_quality || 0), 0) / totalReviews,
      venue: feedback.reduce((sum, f) => sum + (f.venue_quality || 0), 0) / totalReviews
    };

    setFeedbackStats({
      averageRating,
      totalReviews,
      ratingBreakdown,
      averageByCategory
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold">Business Analytics</h1>
            <p className="text-muted-foreground">Key metrics and performance insights</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenueStats?.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${revenueStats?.paidRevenue.toLocaleString()} collected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollmentStats?.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {enrollmentStats?.confirmedBookings} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats?.collectionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${paymentStats?.totalOutstanding.toLocaleString()} outstanding
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feedbackStats?.averageRating.toFixed(1)} ⭐</div>
              <p className="text-xs text-muted-foreground mt-1">
                {feedbackStats?.totalReviews} reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Course</CardTitle>
                <CardDescription>Total revenue generated per course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueStats?.revenueByCourse.map((course, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{course.courseName}</p>
                        <p className="text-sm text-muted-foreground">{course.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${course.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${revenueStats?.totalRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Revenue Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">${revenueStats?.paidRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Outstanding</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">${revenueStats?.outstandingRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="enrollment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Courses by Enrollment</CardTitle>
                <CardDescription>Most popular courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {enrollmentStats?.topCourses.map((course, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Badge variant="outline">{idx + 1}</Badge>
                      <div className="flex-1">
                        <p className="font-medium">{course.courseName}</p>
                      </div>
                      <p className="text-sm font-bold">{course.bookings} bookings</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{enrollmentStats?.totalBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Confirmed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{enrollmentStats?.confirmedBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{enrollmentStats?.completedBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cancelled</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">{enrollmentStats?.cancelledBookings}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Breakdown</CardTitle>
                <CardDescription>Payments grouped by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentStats?.paymentsByStatus.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Badge variant={
                          item.status === "paid" ? "default" :
                          item.status === "partial" ? "secondary" :
                          "destructive"
                        }>
                          {item.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">{item.count} bookings</p>
                      </div>
                      <p className="text-lg font-bold">${item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">${paymentStats?.totalCollected.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Outstanding</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">${paymentStats?.totalOutstanding.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Collection Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{paymentStats?.collectionRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Average Ratings by Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Overall Experience</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{feedbackStats?.averageByCategory.overall.toFixed(1)}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Course Quality</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{feedbackStats?.averageByCategory.course.toFixed(1)}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Trainer Quality</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{feedbackStats?.averageByCategory.trainer.toFixed(1)}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Venue Quality</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{feedbackStats?.averageByCategory.venue.toFixed(1)}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feedbackStats?.ratingBreakdown.reverse().map((rating) => (
                    <div key={rating.stars} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-20">
                        <span className="font-medium">{rating.stars}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ 
                            width: `${feedbackStats.totalReviews > 0 ? (rating.count / feedbackStats.totalReviews) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {rating.count}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}