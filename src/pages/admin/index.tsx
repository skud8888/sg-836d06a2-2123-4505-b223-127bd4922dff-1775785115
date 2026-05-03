import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { QuickNav } from "@/components/QuickNav";
import { DashboardCharts } from "@/components/DashboardCharts";
import { AdminWelcomeTour } from "@/components/AdminWelcomeTour";
import { DashboardWelcome } from "@/components/DashboardWelcome";
import { ActivityFeed } from "@/components/ActivityFeed";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { TutorialOverlay, adminDashboardTutorial } from "@/components/TutorialOverlay";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Users,
  BookOpen,
  BarChart3,
  FileText,
  UserCog,
  MessageSquare,
  Brain,
  Shield,
  DollarSign,
  User,
  Activity,
  Database,
  Settings,
  LogOut,
  GraduationCap,
  ChevronDown,
  RefreshCw,
  Award,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    activeBookings: 0,
    totalStudents: 0,
    monthlyRevenueAmount: 0,
    pendingEnquiries: 0,
    monthlyRevenue: [],
    courseDistribution: [],
    paymentMethods: [],
    studentActivity: []
  });
  const [showTour, setShowTour] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [quickStats, setQuickStats] = useState({
    upcomingClasses: 0,
    activeStudents: 0,
    pendingBookings: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/admin/login");
        return;
      }

      setUser(session.user);
      setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Admin");
      
      // Check if user has super_admin or admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["super_admin", "admin", "trainer", "receptionist"]);

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have admin access",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      setUserRole(roles[0].role);

      // Check if this is user's first time on the ADMIN DASHBOARD (not other pages)
      const { data: preferences } = await supabase
        .from("notification_preferences")
        .select("has_seen_admin_tour, has_seen_admin_dashboard_tutorial")
        .eq("user_id", session.user.id)
        .single();

      // Only auto-start tour on DASHBOARD page for first-time users
      if (!preferences?.has_seen_admin_tour) {
        // Small delay to let the dashboard render first
        setTimeout(() => setShowTour(true), 1000);
      } else if (!preferences?.has_seen_admin_dashboard_tutorial) {
        // Show tutorial overlay after tour is complete
        setTimeout(() => setShowTutorial(true), 500);
      }

      await loadQuickStats();
      await loadDashboardStats();
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const loadDashboardStats = async () => {
    try {
      // Active bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id")
        .in("status", ["confirmed", "pending"]);

      // Total students
      const { data: students } = await supabase
        .from("profiles")
        .select("id");

      // Monthly revenue
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data: payments } = await supabase
        .from("payments")
        .select("amount, created_at, payment_method")
        .eq("status", "completed")
        .gte("created_at", firstDayOfMonth.toISOString());

      const revenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Pending enquiries
      const { data: enquiries } = await supabase
        .from("enquiries")
        .select("id")
        .eq("status", "new");

      // Chart data - last 6 months
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { data: monthPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        const { data: monthBookings } = await supabase
          .from("bookings")
          .select("id")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        monthlyData.push({
          name: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
          bookings: monthBookings?.length || 0
        });
      }

      // Course distribution
      const { data: courseStats } = await supabase
        .from("bookings")
        .select("scheduled_class_id, scheduled_classes!inner(course_template_id, course_templates!inner(name))");

      const courseMap = new Map();
      courseStats?.forEach((booking: any) => {
        const courseName = booking.scheduled_classes?.course_templates?.name || "Unknown";
        courseMap.set(courseName, (courseMap.get(courseName) || 0) + 1);
      });

      const courseDistribution = Array.from(courseMap.entries()).map(([name, value]) => ({
        name,
        value
      }));

      // Payment methods
      const paymentMethodMap = new Map();
      payments?.forEach((payment: any) => {
        const method = payment.payment_method || "Unknown";
        paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + 1);
      });

      const paymentMethods = Array.from(paymentMethodMap.entries()).map(([name, value]) => ({
        name,
        value
      }));

      // Student activity - last 6 months
      const studentActivity = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { data: newStudents } = await supabase
          .from("profiles")
          .select("id")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        const { data: activeEnrollments } = await supabase
          .from("enrollments")
          .select("student_id")
          .eq("status", "active")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        studentActivity.push({
          name: date.toLocaleDateString('en-US', { month: 'short' }),
          new: newStudents?.length || 0,
          active: new Set(activeEnrollments?.map(e => e.student_id)).size || 0
        });
      }

      setStats({
        activeBookings: bookings?.length || 0,
        totalStudents: students?.length || 0,
        monthlyRevenueAmount: revenue,
        pendingEnquiries: enquiries?.length || 0,
        monthlyRevenue: monthlyData,
        courseDistribution,
        paymentMethods,
        studentActivity
      });
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    }
  };

  const loadQuickStats = async () => {
    try {
      // Get upcoming classes (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const { data: classes } = await supabase
        .from("scheduled_classes")
        .select("id")
        .gte("start_datetime", new Date().toISOString())
        .lte("start_datetime", nextWeek.toISOString())
        .eq("status", "scheduled");

      // Get active students (enrolled in current courses)
      const { data: students } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("status", "active");

      // Get pending bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("status", "pending");

      // Get current month revenue
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", firstDayOfMonth.toISOString());

      const revenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setQuickStats({
        upcomingClasses: classes?.length || 0,
        activeStudents: new Set(students?.map(s => s.student_id)).size || 0,
        pendingBookings: bookings?.length || 0,
        monthlyRevenue: revenue
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // Organized dashboard sections
  const dashboardSections: Record<string, {
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
    tourId?: string;
    badge?: string;
    show?: boolean;
  }[]> = {
    quickActions: [
      {
        title: "Bookings",
        description: "Manage enrollments & registrations",
        icon: Calendar,
        href: "/admin/bookings",
        color: "text-blue-600 dark:text-blue-400",
        tourId: "bookings",
        badge: quickStats.pendingBookings > 0 ? `${quickStats.pendingBookings} pending` : undefined
      },
      {
        title: "Calendar",
        description: "Schedule & view classes",
        icon: Calendar,
        href: "/admin/calendar",
        color: "text-purple-600 dark:text-purple-400",
        tourId: "calendar",
        badge: quickStats.upcomingClasses > 0 ? `${quickStats.upcomingClasses} upcoming` : undefined
      },
      {
        title: "Students",
        description: "View student records",
        icon: Users,
        href: "/admin/students",
        color: "text-green-600 dark:text-green-400",
        tourId: "students",
        badge: `${quickStats.activeStudents} active`
      },
      {
        title: "Analytics",
        description: "Business insights & reports",
        icon: BarChart3,
        href: "/admin/analytics",
        color: "text-red-600 dark:text-red-400",
        tourId: "analytics"
      }
    ],
    
    courseManagement: [
      {
        title: "Courses",
        description: "Manage course templates",
        icon: BookOpen,
        href: "/admin/courses",
        color: "text-orange-600 dark:text-orange-400"
      },
      {
        title: "Certificates",
        description: "Generate & manage certificates",
        icon: Award,
        href: "/admin/certificates",
        color: "text-yellow-600 dark:text-yellow-400",
        badge: "NEW"
      },
      {
        title: "Trainers",
        description: "Instructor management",
        icon: UserCog,
        href: "/admin/trainers",
        color: "text-indigo-600 dark:text-indigo-400"
      },
      {
        title: "Waitlist",
        description: "Manage waiting lists",
        icon: Users,
        href: "/admin/waitlist",
        color: "text-amber-600 dark:text-amber-400"
      }
    ],

    financial: [
      {
        title: "Payments",
        description: "Payment tracking & history",
        icon: DollarSign,
        href: "/admin/payments",
        color: "text-emerald-600 dark:text-emerald-400",
        badge: quickStats.monthlyRevenue > 0 ? `$${quickStats.monthlyRevenue.toFixed(0)}` : undefined
      },
      {
        title: "Instructor Payouts",
        description: "Revenue sharing & payouts",
        icon: DollarSign,
        href: "/admin/instructor-payouts",
        color: "text-lime-600 dark:text-lime-400"
      }
    ],

    communication: [
      {
        title: "Enquiries",
        description: "Contact form submissions",
        icon: MessageSquare,
        href: "/admin/enquiries",
        color: "text-pink-600 dark:text-pink-400"
      },
      {
        title: "Feedback",
        description: "User feedback & bug reports",
        icon: MessageSquare,
        href: "/admin/feedback",
        color: "text-rose-600 dark:text-rose-400",
        badge: "NEW",
        show: userRole === "super_admin" || userRole === "admin"
      }
    ],

    aiTools: [
      {
        title: "AI Insights",
        description: "Predictive analytics & trends",
        icon: Brain,
        href: "/admin/ai-insights",
        color: "text-cyan-600 dark:text-cyan-400",
        tourId: "ai-insights",
        badge: "AI"
      }
    ],

    systemAdmin: [
      {
        title: "Document Reports",
        description: "Upload & certificate logs",
        icon: FileText,
        href: "/admin/reports/documents",
        color: "text-teal-600 dark:text-teal-400",
        badge: "NEW"
      },
      {
        title: "User Management",
        description: "Manage admin roles",
        icon: Shield,
        href: "/admin/users",
        color: "text-yellow-600 dark:text-yellow-400",
        show: userRole === "super_admin"
      },
      {
        title: "Team Management",
        description: "Staff & permissions",
        icon: Users,
        href: "/admin/team",
        color: "text-sky-600 dark:text-sky-400",
        show: userRole === "super_admin" || userRole === "admin"
      },
      {
        title: "Audit Logs",
        description: "System activity tracking",
        icon: FileText,
        href: "/admin/audit-logs",
        color: "text-slate-600 dark:text-slate-400",
        badge: "NEW",
        show: userRole === "super_admin" || userRole === "admin"
      },
      {
        title: "System Health",
        description: "Service monitoring",
        icon: Activity,
        href: "/admin/system-health",
        color: "text-teal-600 dark:text-teal-400",
        badge: "NEW",
        show: userRole === "super_admin" || userRole === "admin"
      },
      {
        title: "Backups",
        description: "Database backups",
        icon: Database,
        href: "/admin/backups",
        color: "text-violet-600 dark:text-violet-400",
        badge: "NEW",
        show: userRole === "super_admin"
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          {/* Header Skeleton */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Quick Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Section Cards Skeleton */}
          <div className="space-y-8">
            {[...Array(3)].map((_, sectionIdx) => (
              <div key={sectionIdx}>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, cardIdx) => (
                    <Card key={cardIdx}>
                      <CardHeader>
                        <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <OfflineIndicator />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb />
          
          {/* Header */}
          <DashboardWelcome />

          {/* Universal Search Tip */}
          <div className="mb-6" data-tour="search">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Press <kbd className="px-2 py-1 text-xs bg-muted rounded">Cmd+K</kbd> to open universal search
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Active Bookings", value: stats.activeBookings, icon: Calendar, color: "text-blue-600" },
              { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-green-600" },
              { label: "This Month Revenue", value: `$${stats.monthlyRevenueAmount}`, icon: DollarSign, color: "text-purple-600" },
              { label: "Pending Enquiries", value: stats.pendingEnquiries, icon: Mail, color: "text-orange-600" }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Navigation */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
            <QuickNav role="admin" />
          </div>

          {/* Dashboard Charts */}
          <DashboardCharts data={stats as any} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Side (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Actions */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-primary rounded" />
                  <h2 className="text-lg font-semibold">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardSections.quickActions
                    .filter(card => card.show !== false)
                    .map((card, index) => (
                      <Link key={index} href={card.href}>
                        <Card 
                          className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                          data-tour={card.tourId}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center group-hover:scale-110 transition-transform ${card.color}`}>
                                <card.icon className="h-6 w-6" />
                              </div>
                              {card.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {card.badge}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="mt-4">{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                </div>
              </section>

              {/* Course Management */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-orange-500 rounded" />
                  <h2 className="text-lg font-semibold">Course Management</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardSections.courseManagement
                    .filter(card => card.show !== false)
                    .map((card, index) => (
                      <Link key={index} href={card.href}>
                        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center group-hover:scale-110 transition-transform ${card.color}`}>
                                <card.icon className="h-6 w-6" />
                              </div>
                              {card.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {card.badge}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="mt-4">{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                </div>
              </section>

              {/* Financial */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-emerald-500 rounded" />
                  <h2 className="text-lg font-semibold">Financial</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardSections.financial
                    .filter(card => card.show !== false)
                    .map((card, index) => (
                      <Link key={index} href={card.href}>
                        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center group-hover:scale-110 transition-transform ${card.color}`}>
                                <card.icon className="h-6 w-6" />
                              </div>
                              {card.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {card.badge}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="mt-4">{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                </div>
              </section>

              {/* Communication */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-pink-500 rounded" />
                  <h2 className="text-lg font-semibold">Communication</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardSections.communication
                    .filter(card => card.show !== false)
                    .map((card, index) => (
                      <Link key={index} href={card.href}>
                        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center group-hover:scale-110 transition-transform ${card.color}`}>
                                <card.icon className="h-6 w-6" />
                              </div>
                              {card.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {card.badge}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="mt-4">{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                </div>
              </section>

              {/* AI Tools */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-cyan-500 rounded" />
                  <h2 className="text-lg font-semibold">AI-Powered Tools</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardSections.aiTools
                    .filter(card => card.show !== false)
                    .map((card, index) => (
                      <Link key={index} href={card.href}>
                        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center group-hover:scale-110 transition-transform ${card.color}`}>
                                <card.icon className="h-6 w-6" />
                              </div>
                              {card.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {card.badge}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="mt-4">{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                </div>
              </section>

              {/* System Administration */}
              {(userRole === "super_admin" || userRole === "admin") && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-8 bg-slate-500 rounded" />
                    <h2 className="text-lg font-semibold">System Administration</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dashboardSections.systemAdmin
                      .filter(card => card.show !== false)
                      .map((card, index) => (
                        <Link key={index} href={card.href}>
                          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center group-hover:scale-110 transition-transform ${card.color}`}>
                                  <card.icon className="h-6 w-6" />
                                </div>
                                {card.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {card.badge}
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="mt-4">{card.title}</CardTitle>
                              <CardDescription>{card.description}</CardDescription>
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                  </div>
                </section>
              )}
            </div>

            {/* Activity Feed - Right Sidebar (1/3) */}
            <div className="lg:col-span-1">
              <ActivityFeed limit={15} />
            </div>
          </div>

          {/* Admin Welcome Tour - Auto-starts on first login */}
          <AdminWelcomeTour 
            open={showTour} 
            onOpenChange={setShowTour}
          />

          {/* Tutorial Overlay - Shows keyboard shortcuts and features */}
          {showTutorial && (
            <TutorialOverlay
              steps={adminDashboardTutorial}
              tutorialKey="admin_dashboard_tutorial"
              onComplete={() => setShowTutorial(false)}
            />
          )}
        </div>
      </div>
    </>
  );
}