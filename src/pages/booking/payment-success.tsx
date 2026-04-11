import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  CheckCircle,
  Mail,
  Download,
  Home,
  Calendar,
  BookOpen
} from "lucide-react";

interface EnrollmentDetails {
  id: string;
  course_name: string;
  student_name: string;
  student_email: string;
  amount_paid: number;
  payment_type: string;
  status: string;
  created_at: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { session_id, enrollment_id } = router.query;

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null);

  useEffect(() => {
    if (enrollment_id) {
      loadEnrollmentDetails();
    }
  }, [enrollment_id]);

  const loadEnrollmentDetails = async () => {
    setLoading(true);
    try {
      const enrollmentIdStr = typeof enrollment_id === 'string' ? enrollment_id : '';
      
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          amount_paid,
          payment_type,
          status,
          created_at,
          course_templates!enrollments_course_template_id_fkey (
            name
          ),
          profiles!enrollments_student_id_fkey (
            full_name,
            email
          )
        `)
        .eq("id", enrollmentIdStr)
        .single();

      if (error) throw error;

      setEnrollment({
        id: data.id,
        course_name: (data.course_templates as any)?.name || "Course",
        student_name: (data.profiles as any)?.full_name || "",
        student_email: (data.profiles as any)?.email || "",
        amount_paid: data.amount_paid,
        payment_type: data.payment_type,
        status: data.status,
        created_at: data.created_at
      });

    } catch (err: any) {
      console.error("Error loading enrollment:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Enrollment Successful - GTS Training"
        description="Your enrollment has been confirmed"
      />

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-3xl mb-2">Enrollment Successful!</CardTitle>
            <CardDescription className="text-base">
              Thank you for enrolling. Your payment has been processed successfully.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {enrollment && (
              <>
                {/* Enrollment Details */}
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Enrollment Details</h3>
                  
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Course:</span>
                      <span className="font-medium">{enrollment.course_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Student:</span>
                      <span className="font-medium">{enrollment.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{enrollment.student_email}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-semibold text-lg">${enrollment.amount_paid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Type:</span>
                      <Badge variant="outline" className="capitalize">
                        {enrollment.payment_type}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className="capitalize bg-green-600">
                        {enrollment.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enrollment Date:</span>
                      <span className="font-medium">
                        {new Date(enrollment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What's Next */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    What&apos;s Next?
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>A confirmation email has been sent to <strong>{enrollment.student_email}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Your receipt and enrollment details are attached</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>You&apos;ll receive course schedule details within 24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Access your student portal to view course materials</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <Link href="/student/portal">
                    <Button variant="outline" className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Student Portal
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button variant="outline" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Browse More Courses
                    </Button>
                  </Link>
                </div>

                <Link href="/">
                  <Button className="w-full" size="lg">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </>
            )}

            {!enrollment && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Unable to load enrollment details
                </p>
                <Link href="/courses">
                  <Button>Browse Courses</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}