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

interface BookingDetails {
  id: string;
  course_name: string;
  student_name: string;
  student_email: string;
  paid_amount: number;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { session_id, booking_id } = router.query;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  useEffect(() => {
    if (booking_id) {
      loadBookingDetails();
    }
  }, [booking_id]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      const bookingIdStr = typeof booking_id === 'string' ? booking_id : '';
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          student_name,
          student_email,
          paid_amount,
          total_amount,
          payment_status,
          status,
          created_at,
          scheduled_classes!bookings_scheduled_class_id_fkey (
            course_templates!scheduled_classes_course_template_id_fkey (
              name
            )
          )
        `)
        .eq("id", bookingIdStr)
        .single();

      if (error) throw error;

      setBooking({
        id: data.id,
        course_name: (data.scheduled_classes as any)?.course_templates?.name || "Course",
        student_name: data.student_name,
        student_email: data.student_email,
        paid_amount: data.paid_amount,
        total_amount: data.total_amount,
        payment_status: data.payment_status,
        status: data.status,
        created_at: data.created_at
      });

    } catch (err: any) {
      console.error("Error loading booking:", err);
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
        title="Payment Successful - GTS Training"
        description="Your booking has been confirmed"
      />

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-3xl mb-2">Payment Successful!</CardTitle>
            <CardDescription className="text-base">
              Thank you for your booking. Your payment has been processed successfully.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {booking && (
              <>
                {/* Booking Details */}
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Booking Details</h3>
                  
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Course:</span>
                      <span className="font-medium">{booking.course_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Student:</span>
                      <span className="font-medium">{booking.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{booking.student_email}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold">${booking.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-semibold text-lg text-green-600">${booking.paid_amount.toFixed(2)}</span>
                    </div>
                    {booking.paid_amount < booking.total_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Balance Due:</span>
                        <span className="font-semibold text-orange-600">
                          ${(booking.total_amount - booking.paid_amount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Status:</span>
                      <Badge className="capitalize bg-green-600">
                        {booking.payment_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking Status:</span>
                      <Badge variant="outline" className="capitalize">
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking Date:</span>
                      <span className="font-medium">
                        {new Date(booking.created_at).toLocaleDateString()}
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
                      <span>A confirmation email has been sent to <strong>{booking.student_email}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Your receipt and booking invoice are attached</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>You&apos;ll receive course details and enrollment contract within 24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Check your email for the e-signature link to complete enrollment</span>
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

            {!booking && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Unable to load booking details
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