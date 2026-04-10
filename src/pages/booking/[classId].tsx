import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";
import { StripeCheckout } from "@/components/StripeCheckout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, DollarSign, User, Mail, Phone, CreditCard } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type ScheduledClass = Tables<"scheduled_classes"> & {
  course_templates: Pick<Tables<"course_templates">, "name" | "code" | "description" | "price_full" | "duration_hours"> | null;
};

export default function BookingPage() {
  const router = useRouter();
  const { classId } = router.query;
  const { toast } = useToast();
  const [scheduledClass, setScheduledClass] = useState<ScheduledClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Form state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [usiNumber, setUsiNumber] = useState("");

  useEffect(() => {
    if (classId) {
      fetchScheduledClass();
    }
  }, [classId]);

  const fetchScheduledClass = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scheduled_classes")
      .select("*, course_templates(name, code, description, price_full, duration_hours)")
      .eq("id", classId as string)
      .single();

    if (error) {
      toast({
        title: "Error loading class",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setScheduledClass(data);
    }
    setLoading(false);
  };

  const handleBooking = async () => {
    if (!scheduledClass) return;

    if (!studentName || !studentEmail || !studentPhone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const accessToken = Math.random().toString(36).substring(2, 15);

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          scheduled_class_id: scheduledClass.id,
          student_name: studentName,
          student_email: studentEmail,
          student_phone: studentPhone,
          usi_number: usiNumber || null,
          total_amount: scheduledClass.course_templates?.price_full || 0,
          paid_amount: 0,
          status: "pending",
          payment_status: "unpaid",
          access_token: accessToken,
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email
      await emailService.sendBookingConfirmation(booking as any);

      setBookingId(booking.id);

      toast({
        title: "Booking created",
        description: "Please complete payment to confirm your enrollment",
      });
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
      setSubmitting(false);
    }
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

  if (!scheduledClass) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Class not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`Book ${scheduledClass.course_templates?.name} - GTS Training`}
        description={scheduledClass.course_templates?.description || ""}
      />
      <Navigation />
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl font-bold mb-8">Book Your Course</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{scheduledClass.course_templates?.name}</CardTitle>
                  <CardDescription>{scheduledClass.course_templates?.code}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {scheduledClass.course_templates?.description}
                  </p>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(scheduledClass.start_datetime), "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(scheduledClass.start_datetime), "p")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{scheduledClass.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        ${scheduledClass.course_templates?.price_full}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form or Payment */}
            <div>
              {!bookingId ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Student Information</CardTitle>
                    <CardDescription>
                      Please provide your details to book this course
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="studentName">Full Name *</Label>
                      <Input
                        id="studentName"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="John Smith"
                      />
                    </div>

                    <div>
                      <Label htmlFor="studentEmail">Email *</Label>
                      <Input
                        id="studentEmail"
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="studentPhone">Phone *</Label>
                      <Input
                        id="studentPhone"
                        type="tel"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="0412 345 678"
                      />
                    </div>

                    <div>
                      <Label htmlFor="usiNumber">USI Number</Label>
                      <Input
                        id="usiNumber"
                        value={usiNumber}
                        onChange={(e) => setUsiNumber(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>

                    <Button
                      onClick={handleBooking}
                      disabled={submitting}
                      className="w-full"
                      size="lg"
                    >
                      {submitting ? "Creating Booking..." : "Continue to Payment"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <StripeCheckout
                  bookingId={bookingId}
                  totalAmount={scheduledClass.course_templates?.price_full || 0}
                  studentName={studentName}
                  courseName={scheduledClass.course_templates?.name || ""}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}