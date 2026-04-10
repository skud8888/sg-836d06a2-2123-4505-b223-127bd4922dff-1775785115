import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { DocumentList } from "@/components/DocumentList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, Download, Star, AlertCircle, User, Mail, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";

type Booking = Tables<"bookings"> & {
  scheduled_classes: (Tables<"scheduled_classes"> & {
    course_templates: Pick<Tables<"course_templates">, "name" | "code" | "price_full"> | null;
  }) | null;
};

export default function StudentPortal() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{ name: string; email: string; phone: string } | null>(null);

  useEffect(() => {
    // Check URL params for auto-login
    const urlToken = router.query.token as string;
    const urlEmail = router.query.email as string;
    
    if (urlToken && urlEmail) {
      setEmail(urlEmail);
      setToken(urlToken);
      handleLogin(urlEmail, urlToken);
    }
  }, [router.query]);

  const handleLogin = async (emailParam?: string, tokenParam?: string) => {
    const loginEmail = emailParam || email;
    const loginToken = tokenParam || token;

    if (!loginEmail || !loginToken) {
      toast({
        title: "Missing information",
        description: "Please enter both email and access code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        scheduled_classes(
          *,
          course_templates(name, code)
        )
      `)
      .eq("student_email", loginEmail)
      .eq("access_token", loginToken)
      .gte("token_expires_at", new Date().toISOString());

    console.log("Portal login:", { data, error });

    if (error || !data || data.length === 0) {
      toast({
        title: "Access denied",
        description: "Invalid email or access code. Please check your email for the correct link.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    setBookings(data as any);
    setIsAuthenticated(true);
    
    // Set student info from first booking
    if (data[0]) {
      setStudentInfo({
        name: data[0].student_name,
        email: data[0].student_email,
        phone: data[0].student_phone
      });
    }

    setLoading(false);
    toast({
      title: "Welcome!",
      description: "Access granted to your student portal"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge>Confirmed</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "partial":
        return <Badge variant="secondary">Partial</Badge>;
      default:
        return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <SEO title="Student Portal | GTS Training" />
        <Navigation />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-md mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Portal Access</CardTitle>
                <CardDescription>
                  Enter your email and access code to view your bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your access code was sent to your email after booking. Check your inbox or contact us for help.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Access Code</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Enter your access code"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => handleLogin()}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Access Portal"}
                </Button>

                <div className="text-center pt-4">
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                    Need help accessing your portal?
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const upcomingBookings = bookings.filter(
    b => b.scheduled_classes && new Date(b.scheduled_classes.start_datetime) > new Date()
  );
  const pastBookings = bookings.filter(
    b => b.scheduled_classes && new Date(b.scheduled_classes.start_datetime) <= new Date()
  );

  return (
    <>
      <SEO title="My Bookings | GTS Training" />
      <Navigation />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold">Welcome, {studentInfo?.name}</h1>
              <p className="text-muted-foreground">Manage your course bookings and certificates</p>
            </div>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
              Logout
            </Button>
          </div>

          {/* Student Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{studentInfo?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{studentInfo?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{studentInfo?.phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for upcoming/past courses */}
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming Courses ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past Courses ({pastBookings.length})
              </TabsTrigger>
              <TabsTrigger value="documents">
                My Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No upcoming courses. <Link href="/courses" className="text-primary hover:underline">Browse available courses</Link>
                  </CardContent>
                </Card>
              ) : (
                upcomingBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">
                            {booking.scheduled_classes?.course_templates?.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {booking.scheduled_classes?.course_templates?.code}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(booking.status)}
                          {getPaymentBadge(booking.payment_status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {booking.scheduled_classes && 
                              format(new Date(booking.scheduled_classes.start_datetime), "EEEE, MMMM d, yyyy")
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {booking.scheduled_classes && 
                              format(new Date(booking.scheduled_classes.start_datetime), "h:mm a")
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.scheduled_classes?.location || "TBA"}</span>
                        </div>
                      </div>

                      {booking.payment_status !== "paid" && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Outstanding balance: ${(booking.total_amount - booking.paid_amount).toFixed(2)}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-3">
                        <Link href={`/student/feedback?booking=${booking.id}`}>
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            Leave Feedback
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No completed courses yet.
                  </CardContent>
                </Card>
              ) : (
                pastBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">
                            {booking.scheduled_classes?.course_templates?.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {booking.scheduled_classes?.course_templates?.code}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {booking.scheduled_classes && 
                              format(new Date(booking.scheduled_classes.start_datetime), "MMMM d, yyyy")
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.scheduled_classes?.location || "TBA"}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {booking.status === "completed" && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download Certificate
                          </Button>
                        )}
                        <Link href={`/student/feedback?booking=${booking.id}`}>
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            Leave Feedback
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    My Documents
                  </CardTitle>
                  <CardDescription>
                    All your course-related documents in one place
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No documents available yet
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {bookings.map((booking) => (
                        <div key={booking.id}>
                          <h3 className="font-semibold mb-3">
                            {booking.scheduled_classes?.course_templates?.name} - {" "}
                            {booking.scheduled_classes?.start_datetime 
                              ? format(new Date(booking.scheduled_classes.start_datetime), "MMM d, yyyy")
                              : ""}
                          </h3>
                          <DocumentList bookingId={booking.id} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}