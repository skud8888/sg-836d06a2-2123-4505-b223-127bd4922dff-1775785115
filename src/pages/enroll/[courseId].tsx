import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  ArrowRight,
  CreditCard
} from "lucide-react";

interface CourseDetails {
  id: string;
  name: string;
  description: string;
  duration_hours: number;
  price_full: number;
  price_deposit: number;
  capacity: number;
  start_date: string;
  end_date: string;
  instructor: string;
}

export default function EnrollmentPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [paymentType, setPaymentType] = useState<"full" | "deposit" | "installment">("full");

  const [enrollmentForm, setEnrollmentForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    emergency_contact: "",
    emergency_phone: ""
  });

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    }
  }, [courseId]);

  const loadCourseDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_templates")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) throw error;

      setCourse({
        id: data.id,
        name: data.name,
        description: data.description,
        duration_hours: data.duration_hours,
        price_full: data.price_full,
        price_deposit: data.price_deposit,
        capacity: data.capacity,
        start_date: data.start_date,
        end_date: data.end_date,
        instructor: data.instructor
      });

    } catch (err: any) {
      console.error("Error loading course:", err);
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    // Validate form
    if (!enrollmentForm.full_name || !enrollmentForm.email || !enrollmentForm.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setEnrolling(true);
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      let studentId = session?.user?.id;

      // If not logged in, create student account
      if (!studentId) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: enrollmentForm.email,
          password: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
          options: {
            data: {
              full_name: enrollmentForm.full_name,
              phone: enrollmentForm.phone
            }
          }
        });

        if (signUpError) throw signUpError;
        studentId = signUpData.user?.id;
      }

      if (!studentId) {
        throw new Error("Failed to create student account");
      }

      // Calculate amount based on payment type
      let amountDue = course?.price_full || 0;
      let amountPaid = 0;

      if (paymentType === "deposit") {
        amountDue = course?.price_full || 0;
        amountPaid = course?.price_deposit || 0;
      } else if (paymentType === "full") {
        amountDue = course?.price_full || 0;
        amountPaid = course?.price_full || 0;
      }

      // Create enrollment record
      const { data: enrollment, error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          course_template_id: courseId,
          student_id: studentId,
          status: "pending",
          payment_status: paymentType === "full" ? "paid" : "partial",
          payment_type: paymentType,
          amount_paid: amountPaid,
          amount_due: amountDue
        })
        .select()
        .single();

      if (enrollError) throw enrollError;

      // If payment required, redirect to Stripe checkout
      if (amountPaid > 0) {
        const response = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountPaid,
            courseId: courseId,
            enrollmentId: enrollment.id,
            studentEmail: enrollmentForm.email,
            studentName: enrollmentForm.full_name
          }),
        });

        const { url } = await response.json();
        
        if (url) {
          window.location.href = url;
        }
      } else {
        // No payment required, redirect to confirmation
        router.push(`/enrollment-confirmation?enrollmentId=${enrollment.id}`);
      }

    } catch (err: any) {
      console.error("Error enrolling:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to complete enrollment",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
            <Link href="/courses">
              <Button>Browse All Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Enroll in ${course.name} - GTS Training`}
        description={`Enroll in ${course.name} training course`}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Course Summary */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{course.name}</CardTitle>
                    <CardDescription className="text-base">
                      {course.description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    ${course.price_full}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{course.duration_hours} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Max {course.capacity} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(course.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{course.instructor}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Enrollment Form */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Information</CardTitle>
                    <CardDescription>
                      Please provide your details to complete enrollment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Smith"
                        value={enrollmentForm.full_name}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={enrollmentForm.email}
                          onChange={(e) => setEnrollmentForm({ ...enrollmentForm, email: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+61 400 000 000"
                          value={enrollmentForm.phone}
                          onChange={(e) => setEnrollmentForm({ ...enrollmentForm, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St, Sydney NSW 2000"
                        value={enrollmentForm.address}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, address: e.target.value })}
                      />
                    </div>

                    <Separator />

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                        <Input
                          id="emergencyContact"
                          placeholder="Jane Smith"
                          value={enrollmentForm.emergency_contact}
                          onChange={(e) => setEnrollmentForm({ ...enrollmentForm, emergency_contact: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                        <Input
                          id="emergencyPhone"
                          type="tel"
                          placeholder="+61 400 000 000"
                          value={enrollmentForm.emergency_phone}
                          onChange={(e) => setEnrollmentForm({ ...enrollmentForm, emergency_phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Options */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Option</CardTitle>
                    <CardDescription>
                      Choose how you'd like to pay
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2 border rounded-lg p-3">
                          <RadioGroupItem value="full" id="full" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="full" className="font-semibold cursor-pointer">
                              Pay in Full
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              ${course.price_full}
                            </p>
                          </div>
                        </div>

                        {course.price_deposit > 0 && (
                          <div className="flex items-start space-x-2 border rounded-lg p-3">
                            <RadioGroupItem value="deposit" id="deposit" className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor="deposit" className="font-semibold cursor-pointer">
                                Pay Deposit
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                ${course.price_deposit} now, ${course.price_full - course.price_deposit} later
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start space-x-2 border rounded-lg p-3">
                          <RadioGroupItem value="installment" id="installment" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="installment" className="font-semibold cursor-pointer">
                              Payment Plan
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Pay later with installments
                            </p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>

                    <Separator className="my-4" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Course Price:</span>
                        <span className="font-semibold">${course.price_full}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Due Today:</span>
                        <span className="font-semibold text-primary">
                          ${paymentType === "full" ? course.price_full : paymentType === "deposit" ? course.price_deposit : 0}
                        </span>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-6" 
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          {paymentType === "installment" ? "Complete Enrollment" : "Proceed to Payment"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Secure payment powered by Stripe
                    </p>
                  </CardContent>
                </Card>

                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    You'll receive a confirmation email after enrollment
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}