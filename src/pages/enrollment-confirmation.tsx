import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Calendar, Download, ArrowRight, Mail, Clock } from "lucide-react";

interface EnrollmentDetails {
  id: string;
  course_name: string;
  class_date: string;
  class_time: string;
  location: string;
  student_name: string;
  student_email: string;
  amount_paid: number;
  payment_status: string;
  certificate_id?: string;
}

export default function EnrollmentConfirmation() {
  const router = useRouter();
  const { enrollmentId } = router.query;
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (enrollmentId) {
      loadEnrollmentDetails(enrollmentId as string);
    }
  }, [enrollmentId]);

  const loadEnrollmentDetails = async (id: string) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        amount_paid,
        payment_status,
        student:profiles!student_id (
          full_name,
          email
        ),
        scheduled_classes!inner (
          id,
          start_datetime,
          location,
          course_templates!inner (
            name
          )
        ),
        payments (
          amount,
          status
        ),
        certificates (
          id
        )
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      const classData = data.scheduled_classes as any;
      const courseData = classData?.course_templates;
      const paymentData = Array.isArray(data.payments) && data.payments.length > 0 ? data.payments[0] : null;
      const certificateData = Array.isArray(data.certificates) && data.certificates.length > 0 ? data.certificates[0] : null;
      const studentData = data.student as any;

      // Extract date and time from start_datetime
      let classDate = "";
      let classTime = "";
      if (classData?.start_datetime) {
        const dateObj = new Date(classData.start_datetime);
        classDate = dateObj.toISOString();
        classTime = dateObj.toLocaleTimeString("en-AU", { hour: '2-digit', minute: '2-digit' });
      }

      setEnrollment({
        id: data.id,
        course_name: courseData?.name || "Unknown Course",
        class_date: classDate,
        class_time: classTime,
        location: classData?.location || "",
        student_name: studentData?.full_name || "Student",
        student_email: studentData?.email || "",
        amount_paid: (paymentData as any)?.amount || Number(data.amount_paid) || 0,
        payment_status: (paymentData as any)?.status || data.payment_status || "pending",
        certificate_id: (certificateData as any)?.id
      });
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <SEO 
          title="Enrollment Confirmation"
          description="Your course enrollment confirmation"
        />
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading enrollment details...</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!enrollment) {
    return (
      <>
        <SEO 
          title="Enrollment Not Found"
          description="Enrollment confirmation page"
        />
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Enrollment Not Found</h2>
              <p className="text-muted-foreground mb-6">We couldn't find the enrollment details you're looking for.</p>
              <Link href="/courses">
                <Button>Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Enrollment Confirmed - Training Centre"
        description={`Successfully enrolled in ${enrollment.course_name}`}
      />
      <Navigation />
      
      <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Enrollment Confirmed! 🎉</h1>
            <p className="text-xl text-muted-foreground">
              You're all set for {enrollment.course_name}
            </p>
          </div>

          {/* Enrollment Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Enrollment Details</CardTitle>
              <CardDescription>Your course and payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Course Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Course</p>
                    <p className="font-medium">{enrollment.course_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(enrollment.class_date).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium">{enrollment.class_time}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{enrollment.location}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Student Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Student Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{enrollment.student_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{enrollment.student_email}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold mb-3">Payment Confirmation</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Amount Paid</p>
                    <p className="text-2xl font-bold">${enrollment.amount_paid.toFixed(2)}</p>
                  </div>
                  <Badge variant={enrollment.payment_status === "completed" ? "default" : "secondary"}>
                    {enrollment.payment_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
              <CardDescription>Here's what to expect</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Confirmation Email</h4>
                  <p className="text-sm text-muted-foreground">
                    You'll receive a confirmation email at {enrollment.student_email} with your course details and receipt.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Pre-Course Preparation</h4>
                  <p className="text-sm text-muted-foreground">
                    Check your email for pre-course materials and any required preparation before the class starts.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Certificate on Completion</h4>
                  <p className="text-sm text-muted-foreground">
                    After successfully completing the course, you'll receive a certificate of completion in your student portal.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/student/portal" className="flex-1">
              <Button className="w-full" size="lg">
                Go to Student Portal
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            
            {enrollment.certificate_id && (
              <Link href="/student/certificates" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  <Download className="mr-2 w-4 h-4" />
                  View Certificate
                </Button>
              </Link>
            )}
            
            <Link href="/courses" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                Browse More Courses
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Questions about your enrollment?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}