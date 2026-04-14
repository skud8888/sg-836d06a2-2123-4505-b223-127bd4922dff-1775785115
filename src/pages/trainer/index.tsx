import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Users, 
  BookOpen, 
  DollarSign, 
  Clock, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  LogOut,
  Settings,
  FileText
} from "lucide-react";

interface UpcomingClass {
  id: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  max_students: number;
  status: string;
  course_name: string;
  enrolled_count: number;
}

interface RecentPayout {
  id: string;
  instructor_share: number;
  paid_at: string;
  created_at: string;
  status: string;
}

export default function TrainerPortal() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<RecentPayout[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    upcomingClasses: 0,
    totalStudents: 0,
    completedClasses: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/admin/login");
      return;
    }

    // Check if user is a trainer
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isTrainer = roles?.some(r => r.role === "trainer" || r.role === "admin" || r.role === "super_admin");
    
    if (!isTrainer) {
      toast({
        title: "Access Denied",
        description: "You need trainer access to view this page.",
        variant: "destructive"
      });
      router.push("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setUser(profile);
    loadTrainerData(session.user.id);
  };

  const loadTrainerData = async (trainerId: string) => {
    setLoading(true);

    try {
      // Load upcoming classes
      const { data: classesData, error: classesError } = await supabase
        .from("scheduled_classes")
        .select(`
          id,
          start_datetime,
          end_datetime,
          location,
          max_students,
          status,
          course_templates!inner (
            name
          ),
          bookings (
            id
          )
        `)
        .eq("trainer_id", trainerId)
        .gte("start_datetime", new Date().toISOString())
        .order("start_datetime", { ascending: true })
        .limit(5);

      if (classesError) throw classesError;

      const formattedClasses = (classesData || []).map((cls: any) => ({
        id: cls.id,
        start_datetime: cls.start_datetime,
        end_datetime: cls.end_datetime,
        location: cls.location,
        max_students: cls.max_students,
        status: cls.status,
        course_name: cls.course_templates?.name || "Unknown Course",
        enrolled_count: Array.isArray(cls.bookings) ? cls.bookings.length : 0
      }));

      setUpcomingClasses(formattedClasses);

      // Load recent payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from("instructor_payouts")
        .select("*")
        .eq("instructor_id", trainerId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (payoutsError) throw payoutsError;
      
      const formattedPayouts = (payoutsData || []).map((p: any) => ({
        id: p.id,
        instructor_share: p.instructor_share || 0,
        paid_at: p.paid_at || p.created_at,
        created_at: p.created_at,
        status: p.status || "pending"
      }));
      setRecentPayouts(formattedPayouts);

      // Calculate stats
      const { data: allClasses } = await supabase
        .from("scheduled_classes")
        .select("id, status, bookings(id)")
        .eq("trainer_id", trainerId);

      const totalClasses = allClasses?.length || 0;
      const upcomingCount = allClasses?.filter(c => 
        c.status === "scheduled" || c.status === "in_progress"
      ).length || 0;
      const completedCount = allClasses?.filter(c => 
        c.status === "completed"
      ).length || 0;
      const totalStudents = allClasses?.reduce((sum, c) => 
        sum + (Array.isArray((c as any).bookings) ? (c as any).bookings.length : 0), 0
      ) || 0;

      setStats({
        totalClasses,
        upcomingClasses: upcomingCount,
        totalStudents,
        completedClasses: completedCount
      });

    } catch (error) {
      console.error("Error loading trainer data:", error);
      toast({
        title: "Error",
        description: "Failed to load trainer data. Please try again.",
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
      case "scheduled":
        return <Badge>Scheduled</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "processing":
        return <Badge>Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <>
        <SEO 
          title="Trainer Portal"
          description="Manage your classes, students, and payouts"
        />
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Trainer Portal"
        description="Manage your classes, students, and payouts"
      />
      
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Trainer Portal</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.full_name || user?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/profile">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingClasses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled classes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Students taught
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedClasses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Classes finished
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/field">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg">Today's Classes</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/trainer/students">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg">My Students</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/trainer/payouts">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg">Payouts</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
              <TabsTrigger value="payouts">Recent Payouts</TabsTrigger>
            </TabsList>

            {/* Upcoming Classes */}
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingClasses.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Upcoming Classes</h3>
                    <p className="text-muted-foreground mb-6">
                      You don't have any classes scheduled at the moment.
                    </p>
                    <Button asChild>
                      <Link href="/admin/calendar">View Calendar</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingClasses.map((cls) => (
                    <Card key={cls.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle>{cls.course_name}</CardTitle>
                            <CardDescription>
                              {new Date(cls.start_datetime).toLocaleDateString("en-AU", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}
                            </CardDescription>
                          </div>
                          {getStatusBadge(cls.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(cls.start_datetime).toLocaleTimeString("en-AU", { hour: '2-digit', minute: '2-digit' })} - {new Date(cls.end_datetime).toLocaleTimeString("en-AU", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {cls.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{cls.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {cls.enrolled_count}/{cls.max_students} students
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button size="sm" asChild>
                            <Link href={`/field/class/${cls.id}`}>
                              View Class
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Recent Payouts */}
            <TabsContent value="payouts" className="space-y-4">
              {recentPayouts.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
                    <p className="text-muted-foreground">
                      Your payout history will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {recentPayouts.map((payout) => (
                    <Card key={payout.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold">
                              ${payout.instructor_share.toFixed(2)}
                            </CardTitle>
                            <CardDescription>
                              {new Date(payout.paid_at).toLocaleDateString("en-AU", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}
                            </CardDescription>
                          </div>
                          {getPayoutStatusBadge(payout.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Recorded: {new Date(payout.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}