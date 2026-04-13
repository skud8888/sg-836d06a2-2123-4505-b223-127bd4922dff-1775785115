import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import {
  Calendar,
  Users,
  Camera,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Download
} from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import Link from "next/link";

interface ClassSchedule {
  id: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  course_templates: {
    name: string;
    code: string;
  } | null;
  bookings: Array<{
    id: string;
    student_name: string;
    student_email: string;
    student_phone: string;
    status: string;
  }>;
}

export default function FieldWorkerView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState<ClassSchedule[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSchedule[]>([]);
  const [userName, setUserName] = useState("");

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
    if (role !== "trainer" && role !== "admin" && role !== "super_admin") {
      router.push("/");
      return;
    }

    setUserName(user.user_metadata?.full_name || user.email || "Trainer");
    await loadSchedule(user.id);
    setLoading(false);
  };

  const loadSchedule = async (userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Get classes for today
    const { data: todayData, error: todayError } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        course_templates(name, code),
        bookings(id, student_name, student_email, student_phone, status)
      `)
      .gte("start_datetime", today.toISOString())
      .lt("start_datetime", tomorrow.toISOString())
      .order("start_datetime", { ascending: true });

    if (!todayError && todayData) {
      setTodayClasses(todayData as ClassSchedule[]);
    }

    // Get upcoming classes (next 7 days)
    const { data: upcomingData, error: upcomingError } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        course_templates(name, code),
        bookings(id, student_name, student_email, student_phone, status)
      `)
      .gte("start_datetime", tomorrow.toISOString())
      .lt("start_datetime", nextWeek.toISOString())
      .order("start_datetime", { ascending: true });

    if (!upcomingError && upcomingData) {
      setUpcomingClasses(upcomingData as ClassSchedule[]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow ${format(date, "h:mm a")}`;
    return format(date, "EEE, MMM d 'at' h:mm a");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <SEO title="Field Worker - GTS Training" />
      <OfflineIndicator />
      
      <div className="min-h-screen bg-background">
        {/* Mobile-optimized header */}
        <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold">Field View</h1>
              <Link href="/admin">
                <Button variant="secondary" size="sm">
                  Full Dashboard
                </Button>
              </Link>
            </div>
            <p className="text-sm opacity-90">Welcome back, {userName}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="today">
                Today
                {todayClasses.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {todayClasses.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming
                {upcomingClasses.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {upcomingClasses.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              {todayClasses.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No classes today</h3>
                      <p className="text-sm text-muted-foreground">
                        Check the upcoming tab for your next sessions
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                todayClasses.map((classItem) => (
                  <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {classItem.course_templates?.name || "Class"}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(classItem.start_datetime)}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {classItem.bookings?.length || 0} students
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {classItem.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {classItem.location}
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Students:</h4>
                        {classItem.bookings?.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{booking.student_name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <a href={`mailto:${booking.student_email}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  Email
                                </a>
                                {booking.student_phone && (
                                  <a href={`tel:${booking.student_phone}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Call
                                  </a>
                                )}
                              </div>
                            </div>
                            <Badge variant={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-3">
                        <Link href={`/field/class/${classItem.id}`} className="flex-1">
                          <Button className="w-full" size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Take Attendance
                          </Button>
                        </Link>
                        <Link href={`/field/class/${classItem.id}/evidence`}>
                          <Button variant="outline" size="sm">
                            <Camera className="h-4 w-4 mr-2" />
                            Evidence
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingClasses.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No upcoming classes</h3>
                      <p className="text-sm text-muted-foreground">
                        Your schedule is clear for the next week
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                upcomingClasses.map((classItem) => (
                  <Card key={classItem.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {classItem.course_templates?.name || "Class"}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(classItem.start_datetime)}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {classItem.bookings?.length || 0} students
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {classItem.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {classItem.location}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}