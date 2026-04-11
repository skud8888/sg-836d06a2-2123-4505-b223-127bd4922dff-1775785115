import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  CheckCircle, 
  User, 
  Building, 
  Bell, 
  BookOpen, 
  Users,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Form data for each step
  const [profileData, setProfileData] = useState({
    phone: "",
    bio: ""
  });

  const [centerData, setCenterData] = useState({
    centerName: "",
    address: "",
    phone: "",
    website: ""
  });

  const [notificationData, setNotificationData] = useState({
    emailBookings: true,
    emailPayments: true,
    emailEnquiries: true,
    smsBookings: false,
    smsPayments: false
  });

  const [courseData, setCourseData] = useState({
    courseName: "",
    duration: "",
    price: ""
  });

  const [inviteData, setInviteData] = useState({
    email1: "",
    email2: "",
    email3: ""
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

    setUserId(session.user.id);

    // Check if onboarding is already completed
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .single();

    if (profile?.onboarding_completed) {
      router.push("/admin");
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Mark onboarding as completed
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Redirect to admin dashboard
      router.push("/admin");
    } catch (err: any) {
      console.error("Error completing onboarding:", err);
      setError(err.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          phone: profileData.phone || null,
          bio: profileData.bio || null
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      handleNext();
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          organization_name: centerData.centerName || null,
          address: centerData.address || null,
          phone: centerData.phone || profileData.phone || null,
          website: centerData.website || null
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      handleNext();
    } catch (err: any) {
      setError(err.message || "Failed to save training center details");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const { error: prefError } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: userId,
          email_new_booking: notificationData.emailBookings,
          email_payment_received: notificationData.emailPayments,
          email_new_enquiry: notificationData.emailEnquiries,
          sms_new_booking: notificationData.smsBookings,
          sms_payment_received: notificationData.smsPayments
        }, {
          onConflict: "user_id"
        });

      if (prefError) throw prefError;

      handleNext();
    } catch (err: any) {
      setError(err.message || "Failed to save notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Submit = async () => {
    setLoading(true);
    setError("");

    try {
      // Only create course if user filled in the form
      if (courseData.courseName && courseData.duration && courseData.price) {
        const { error: courseError } = await supabase
          .from("course_templates")
          .insert({
            name: courseData.courseName,
            code: courseData.courseName.substring(0, 3).toUpperCase() + '-101',
            duration_hours: parseInt(courseData.duration) || 0,
            price_full: parseFloat(courseData.price) || 0,
            description: `Initial course template created during onboarding`
          });

        if (courseError) throw courseError;
      }

      handleNext();
    } catch (err: any) {
      setError(err.message || "Failed to create course template");
    } finally {
      setLoading(false);
    }
  };

  const handleStep5Submit = async () => {
    setLoading(true);
    setError("");

    try {
      // Send invitations if emails provided (optional feature for future)
      const emails = [inviteData.email1, inviteData.email2, inviteData.email3].filter(e => e.trim());
      
      // For now, just complete onboarding
      // TODO: Implement email invitations in future
      
      await completeOnboarding();
    } catch (err: any) {
      setError(err.message || "Failed to send invitations");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Profile", icon: User, complete: currentStep > 1 },
    { number: 2, title: "Training Center", icon: Building, complete: currentStep > 2 },
    { number: 3, title: "Notifications", icon: Bell, complete: currentStep > 3 },
    { number: 4, title: "First Course", icon: BookOpen, complete: currentStep > 4 },
    { number: 5, title: "Invite Team", icon: Users, complete: currentStep > 5 }
  ];

  return (
    <>
      <SEO
        title="Admin Onboarding - GTS Training"
        description="Complete your admin setup"
      />

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to GTS Training! 🎉</h1>
            <p className="text-muted-foreground">
              Let&apos;s get your training center set up in just a few steps
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        step.complete
                          ? "bg-green-500 text-white"
                          : currentStep === step.number
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.complete ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs mt-2 hidden md:block">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors ${
                        step.complete ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {currentStep === 1 && "Complete Your Profile"}
                    {currentStep === 2 && "Training Center Details"}
                    {currentStep === 3 && "Notification Preferences"}
                    {currentStep === 4 && "Create Your First Course"}
                    {currentStep === 5 && "Invite Your Team"}
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 && "Tell us a bit about yourself"}
                    {currentStep === 2 && "Provide information about your training center"}
                    {currentStep === 3 && "Choose how you want to be notified"}
                    {currentStep === 4 && "Add your first course template (optional)"}
                    {currentStep === 5 && "Invite team members to collaborate (optional)"}
                  </CardDescription>
                </div>
                <Badge variant="outline">Step {currentStep} of 5</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Step 1: Profile */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+61 400 000 000"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio (Optional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your role and experience..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Training Center */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="centerName">Training Center Name</Label>
                    <Input
                      id="centerName"
                      type="text"
                      placeholder="ABC Training Center"
                      value={centerData.centerName}
                      onChange={(e) => setCenterData({ ...centerData, centerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address (Optional)</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="123 Main St, Brisbane, QLD 4000"
                      value={centerData.address}
                      onChange={(e) => setCenterData({ ...centerData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="centerPhone">Phone Number (Optional)</Label>
                    <Input
                      id="centerPhone"
                      type="tel"
                      placeholder="1300 XXX XXX"
                      value={centerData.phone}
                      onChange={(e) => setCenterData({ ...centerData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={centerData.website}
                      onChange={(e) => setCenterData({ ...centerData, website: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Notifications */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Email Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="emailBookings">New Bookings</Label>
                          <p className="text-sm text-muted-foreground">Get notified when students book courses</p>
                        </div>
                        <Switch
                          id="emailBookings"
                          checked={notificationData.emailBookings}
                          onCheckedChange={(checked) =>
                            setNotificationData({ ...notificationData, emailBookings: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="emailPayments">Payments</Label>
                          <p className="text-sm text-muted-foreground">Get notified about payment transactions</p>
                        </div>
                        <Switch
                          id="emailPayments"
                          checked={notificationData.emailPayments}
                          onCheckedChange={(checked) =>
                            setNotificationData({ ...notificationData, emailPayments: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="emailEnquiries">New Enquiries</Label>
                          <p className="text-sm text-muted-foreground">Get notified about new contact form submissions</p>
                        </div>
                        <Switch
                          id="emailEnquiries"
                          checked={notificationData.emailEnquiries}
                          onCheckedChange={(checked) =>
                            setNotificationData({ ...notificationData, emailEnquiries: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">SMS Notifications (Optional)</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="smsBookings">New Bookings</Label>
                          <p className="text-sm text-muted-foreground">Receive SMS for new bookings</p>
                        </div>
                        <Switch
                          id="smsBookings"
                          checked={notificationData.smsBookings}
                          onCheckedChange={(checked) =>
                            setNotificationData({ ...notificationData, smsBookings: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="smsPayments">Payments</Label>
                          <p className="text-sm text-muted-foreground">Receive SMS for payments</p>
                        </div>
                        <Switch
                          id="smsPayments"
                          checked={notificationData.smsPayments}
                          onCheckedChange={(checked) =>
                            setNotificationData({ ...notificationData, smsPayments: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: First Course */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-600 dark:text-blue-400">
                      This step is optional. You can create your first course now or add courses later from the admin dashboard.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      type="text"
                      placeholder="e.g., First Aid Training"
                      value={courseData.courseName}
                      onChange={(e) => setCourseData({ ...courseData, courseName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="8"
                      value={courseData.duration}
                      onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="250.00"
                      value={courseData.price}
                      onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Invite Team */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-600 dark:text-blue-400">
                      This step is optional. You can invite team members now or add them later from the admin dashboard.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="email1">Team Member 1 Email</Label>
                    <Input
                      id="email1"
                      type="email"
                      placeholder="trainer@example.com"
                      value={inviteData.email1}
                      onChange={(e) => setInviteData({ ...inviteData, email1: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email2">Team Member 2 Email</Label>
                    <Input
                      id="email2"
                      type="email"
                      placeholder="admin@example.com"
                      value={inviteData.email2}
                      onChange={(e) => setInviteData({ ...inviteData, email2: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email3">Team Member 3 Email</Label>
                    <Input
                      id="email3"
                      type="email"
                      placeholder="staff@example.com"
                      value={inviteData.email3}
                      onChange={(e) => setInviteData({ ...inviteData, email3: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div>
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={handleBack} disabled={loading}>
                      Back
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentStep < 5 && (
                    <Button variant="ghost" onClick={handleSkip} disabled={loading}>
                      Skip Setup
                    </Button>
                  )}

                  <Button
                    onClick={() => {
                      if (currentStep === 1) handleStep1Submit();
                      else if (currentStep === 2) handleStep2Submit();
                      else if (currentStep === 3) handleStep3Submit();
                      else if (currentStep === 4) handleStep4Submit();
                      else if (currentStep === 5) handleStep5Submit();
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : currentStep === 5 ? (
                      "Complete Setup"
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}