import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type ScheduledClass = Tables<"scheduled_classes"> & {
  course_templates: Pick<Tables<"course_templates">, "name" | "code" | "price_full" | "price_deposit"> | null;
};

export default function BookingPage() {
  const router = useRouter();
  const { classId } = router.query as { classId: string };
  const { toast } = useToast();
  
  const [classData, setClassData] = useState<ScheduledClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    usiNumber: "",
    paymentType: "deposit"
  });

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
    }
  }, [classId]);

  const fetchClassDetails = async () => {
    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        course_templates(name, code, price_full, price_deposit)
      `)
      .eq("id", classId)
      .single();

    console.log("Class details:", { data, error });

    if (data) {
      setClassData(data as any);
    } else if (error) {
      toast({
        title: "Error",
        description: "Failed to load class details",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const paymentAmount = formData.paymentType === "deposit" 
        ? Number(classData?.course_templates?.price_deposit || 0)
        : Number(classData?.course_templates?.price_full || 0);

      // Generate access token for student portal
      const { data: tokenData } = await supabase.rpc("generate_student_token");
      const accessToken = tokenData as string;

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          scheduled_class_id: classId,
          student_name: `${formData.firstName} ${formData.lastName}`.trim(),
          student_email: formData.email,
          student_phone: formData.phone,
          usi_number: formData.usiNumber || null,
          status: "pending",
          payment_status: "unpaid",
          total_amount: Number(classData?.course_templates?.price_full || 0),
          paid_amount: 0,
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        })
        .select()
        .single();

      console.log("Booking created:", { booking, bookingError });

      if (bookingError) throw bookingError;

      // Send booking confirmation email
      if (booking && classData && classData.course_templates) {
        await emailService.sendBookingConfirmation({
          booking,
          scheduledClass: classData,
          courseTemplate: classData.course_templates as any,
          studentName: `${formData.firstName} ${formData.lastName}`,
          studentEmail: formData.email,
          accessToken
        });

        // Schedule 24-hour reminder
        await emailService.schedule24HourReminder(booking.id);
      }

      toast({
        title: "Booking confirmed!",
        description: "Check your email for confirmation and portal access link"
      });

      // Redirect to success page or student portal
      setTimeout(() => {
        router.push(`/student/portal?token=${accessToken}&email=${formData.email}`);
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background pt-24">
          <div className="container mx-auto px-4 text-center py-12">
            Loading booking form...
          </div>
        </main>
      </>
    );
  }

  if (!classData) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background pt-24">
          <div className="container mx-auto px-4 text-center py-12">
            <h1 className="text-2xl font-heading font-bold mb-4">Class Not Found</h1>
            <Button onClick={() => router.push("/courses")}>Back to Courses</Button>
          </div>
        </main>
      </>
    );
  }

  const paymentAmount = formData.paymentType === "deposit"
    ? Number(classData.course_templates?.price_deposit || 0)
    : Number(classData.course_templates?.price_full || 0);

  return (
    <>
      <SEO
        title={`Book ${classData.course_templates?.name} - GTS Training`}
        description="Complete your booking"
      />
      <Navigation />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl font-heading font-bold mb-8">Complete Your Booking</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{classData.course_templates?.name}</CardTitle>
              <CardDescription>{classData.course_templates?.code}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(classData.start_datetime), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(classData.start_datetime), "h:mm a")} - {format(new Date(classData.end_datetime), "h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{classData.location || "TBA"}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Total: ${Number(classData.course_templates?.price_full || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usiNumber">USI Number (if known)</Label>
                  <Input
                    id="usiNumber"
                    value={formData.usiNumber}
                    onChange={(e) => setFormData({ ...formData, usiNumber: e.target.value })}
                    placeholder="Optional - can be provided later"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Payment Option *</Label>
                  <RadioGroup
                    value={formData.paymentType}
                    onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="deposit" id="deposit" />
                      <Label htmlFor="deposit" className="font-normal cursor-pointer">
                        Pay Deposit (${Number(classData.course_templates?.price_deposit || 0)}) - Secure your spot
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="font-normal cursor-pointer">
                        Pay Full Amount (${Number(classData.course_templates?.price_full || 0)})
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-1">Payment Due Today: ${paymentAmount}</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.paymentType === "deposit" && 
                      `Remaining balance of $${Number(classData.course_templates?.price_full || 0) - Number(classData.course_templates?.price_deposit || 0)} payable before course date`
                    }
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? "Processing..." : `Proceed to Payment ($${paymentAmount})`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}