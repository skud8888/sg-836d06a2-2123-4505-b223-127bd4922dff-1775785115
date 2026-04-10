import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Download, Mail } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccess() {
  const router = useRouter();
  const { session_id, booking_id } = router.query;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (booking_id) {
      fetchBooking();
    }
  }, [booking_id]);

  const fetchBooking = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, scheduled_classes(course_templates(name))")
      .eq("id", booking_id as string)
      .single();

    if (!error && data) {
      setBooking(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Payment Successful"
        description="Your payment has been processed successfully"
      />
      <Navigation />
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-2 border-green-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                Your payment has been processed successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {booking && (
                <>
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Course</span>
                      <span className="font-medium">
                        {booking.scheduled_classes?.course_templates?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Student</span>
                      <span className="font-medium">{booking.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="text-xl font-bold text-green-600">
                        ${booking.paid_amount}
                      </span>
                    </div>
                    {booking.total_amount > booking.paid_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining Balance</span>
                        <span className="font-medium text-orange-600">
                          ${(booking.total_amount - booking.paid_amount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      <Mail className="h-4 w-4 inline mr-1" />
                      A payment receipt has been sent to {booking.student_email}
                    </p>

                    <div className="flex flex-col gap-3">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>

                      <Link href="/">
                        <Button className="w-full">
                          Return to Home
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {booking.total_amount > booking.paid_amount && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Note:</strong> You still have an outstanding balance of{" "}
                        <strong>${(booking.total_amount - booking.paid_amount).toFixed(2)}</strong>.
                        Please make the remaining payment before your course starts.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}