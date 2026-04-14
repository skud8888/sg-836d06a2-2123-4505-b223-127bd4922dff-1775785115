import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { AdminWelcomeTour } from "@/components/AdminWelcomeTour";
import { ActivityFeed } from "@/components/ActivityFeed";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Award
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/admin/login");
      return;
    }

    const role = await rbacService.getUserPrimaryRole();
    if (!role) {
      router.push("/admin/login");
      return;
    }

    setUserRole(role);
    setUserName(user.user_metadata?.full_name || user.email || "Admin");
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const dashboardCards = [
    {
      title: "Bookings",
      description: "Manage student enrollments",
      icon: Calendar,
      href: "/admin/bookings",
      color: "text-blue-600 dark:text-blue-400",
      tourId: "bookings"
    },
    {
      title: "Students",
      description: "View student records",
      icon: Users,
      href: "/admin/students",
      color: "text-green-600 dark:text-green-400",
      tourId: "students"
    },
    {
      title: "Calendar",
      description: "Schedule classes",
      icon: Calendar,
      href: "/admin/calendar",
      color: "text-purple-600 dark:text-purple-400",
      tourId: "calendar"
    },
    {
      title: "Courses",
      description: "Manage course templates",
      icon: BookOpen,
      href: "/admin/courses",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "Trainers",
      description: "Instructor management",
      icon: UserCog,
      href: "/admin/trainers",
      color: "text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Enquiries",
      description: "Contact form submissions",
      icon: MessageSquare,
      href: "/admin/enquiries",
      color: "text-pink-600 dark:text-pink-400"
    },
    {
      title: "Analytics",
      description: "Business insights",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "text-red-600 dark:text-red-400",
      tourId: "analytics"
    },
    {
      title: "AI Insights",
      description: "Predictive analytics",
      icon: Brain,
      href: "/admin/ai-insights",
      color: "text-cyan-600 dark:text-cyan-400",
      tourId: "ai-insights",
      badge: "AI"
    },
    {
      title: "Payments",
      description: "Payment tracking",
      icon: DollarSign,
      href: "/admin/payments",
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Certificates",
      description: "Generate certificates",
      icon: Award,
      href: "/admin/certificates",
      color: "text-yellow-600 dark:text-yellow-400",
      badge: "NEW"
    },
    {
      title: "Document Reports",
      description: "Upload & certificate logs",
      icon: FileText,
      href: "/admin/reports/documents",
      color: "text-teal-600 dark:text-teal-400",
      badge: "NEW"
    },
    {
      title: "Instructor Payouts",
      description: "Revenue sharing",
      icon: DollarSign,
      href: "/admin/instructor-payouts",
      color: "text-lime-600 dark:text-lime-400"
    },
    {
      title: "Feedback",
      description: "User feedback & bugs",
      icon: MessageSquare,
      href: "/admin/feedback",
      color: "text-rose-600 dark:text-rose-400",
      badge: "NEW",
      show: userRole === "super_admin" || userRole === "admin"
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
      title: "Audit Logs",
      description: "System activity",
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
    },
    {
      title: "Waitlist",
      description: "Manage waiting lists",
      icon: Users,
      href: "/admin/waitlist",
      color: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "Team Management",
      description: "Staff & permissions",
      icon: Users,
      href: "/admin/team",
      color: "text-sky-600 dark:text-sky-400",
      show: userRole === "super_admin" || userRole === "admin"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
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

          {/* Tip Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-5 w-96" />
          </div>

          {/* Dashboard Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                    <Skeleton className="h-6 w-32 mt-4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Activity Feed Skeleton */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <AdminWelcomeTour />
      <OfflineIndicator />
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
              <p className="text-muted-foreground">
                {userRole && `Logged in as ${userRole.replace("_", " ")}`}
              </p>
            </div>
            <div className="flex items-center gap-3" data-tour="user-menu">
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <User className="h-4 w-4" />
                    {userName}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/onboarding" className="cursor-pointer">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restart Tutorial
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-6" data-tour="search">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Press <kbd className="px-2 py-1 text-xs bg-muted rounded">Cmd+K</kbd> to open universal search
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main dashboard cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboardCards
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

            {/* Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeed limit={15} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}