import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Play, RotateCcw, Check, BookOpen, Users, Calendar, TrendingUp, Shield, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface OnboardingStatus {
  is_completed: boolean;
  current_step: number | null;
  completed_at: string | null;
}

const ADMIN_TOUR_STEPS = [
  { icon: Shield, title: "User Management", description: "Create users, assign roles, manage permissions" },
  { icon: BookOpen, title: "Course Management", description: "Create courses, schedule classes, manage content" },
  { icon: Calendar, title: "Booking System", description: "Track enrollments, process payments, manage registrations" },
  { icon: TrendingUp, title: "Analytics Dashboard", description: "Monitor revenue, enrollment trends, generate reports" },
  { icon: Users, title: "Activity Logs", description: "Track system activities and security events" }
];

const TRAINER_TOUR_STEPS = [
  { icon: Calendar, title: "Your Schedule", description: "View classes, mark attendance, manage calendar" },
  { icon: Users, title: "Student Management", description: "View enrolled students, track progress" },
  { icon: Award, title: "Instructor Payouts", description: "Track earnings, view payment history" }
];

const STUDENT_TOUR_STEPS = [
  { icon: BookOpen, title: "Browse Courses", description: "Explore available training courses" },
  { icon: Calendar, title: "Enroll in Courses", description: "Complete enrollment and process payment" },
  { icon: TrendingUp, title: "Student Portal", description: "Track progress, download certificates" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [userRole, setUserRole] = useState<string>("student");

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      // Get onboarding status
      const { data: onboardingData } = await supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setOnboarding(onboardingData);

      // Determine user role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roles && roles.length > 0) {
        if (roles.some(r => r.role === "super_admin" || r.role === "admin")) {
          setUserRole("admin");
        } else if (roles.some(r => r.role === "trainer")) {
          setUserRole("trainer");
        } else {
          setUserRole("student");
        }
      }
    } catch (error: any) {
      console.error("Error loading onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to load onboarding status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTour = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_onboarding")
        .update({ 
          is_completed: false,
          current_step: 0
        })
        .eq("user_id", user.id);

      router.push("/admin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleResetTour = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_onboarding")
        .update({ 
          is_completed: false,
          current_step: 0,
          completed_at: null
        })
        .eq("user_id", user.id);

      toast({ title: "Tour reset successfully" });
      loadOnboardingStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const tourSteps = userRole === "admin" ? ADMIN_TOUR_STEPS : userRole === "trainer" ? TRAINER_TOUR_STEPS : STUDENT_TOUR_STEPS;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Onboarding Tour</h1>
            <p className="text-slate-500 mt-1">Get started with an interactive guided tour</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                Loading onboarding status...
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="border-indigo-200 bg-indigo-50/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {onboarding?.is_completed ? "Onboarding Completed!" : `Welcome, ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}!`}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {onboarding?.is_completed 
                          ? `You completed the onboarding tour on ${new Date(onboarding.completed_at || "").toLocaleDateString()}`
                          : "Take a guided tour to learn how to use the platform effectively"
                        }
                      </CardDescription>
                    </div>
                    {onboarding?.is_completed && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {!onboarding?.is_completed ? (
                      <Button onClick={handleStartTour} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Play className="h-4 w-4" />
                        Start Onboarding Tour
                      </Button>
                    ) : (
                      <Button onClick={handleResetTour} variant="outline" className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Restart Tour
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tour Overview</CardTitle>
                  <CardDescription>
                    What you'll learn in the {userRole} onboarding tour
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tourSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <Icon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">{step.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Step {index + 1}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Need Help?</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        You can restart the tour anytime from this page or access help documentation.
                      </p>
                    </div>
                    <Button variant="outline" className="bg-white">
                      View Docs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}