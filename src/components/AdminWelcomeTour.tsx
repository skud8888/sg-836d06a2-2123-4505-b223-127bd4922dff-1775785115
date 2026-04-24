import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
}

const ADMIN_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to the Training Centre Admin",
    description: "This quick tour will help you get started with managing your training centre. You can skip this tour at any time and restart it from your profile settings.",
    action: "Let's Begin"
  },
  {
    title: "User Management",
    description: "Create and manage users, assign roles (Admin, Trainer, Receptionist, Student), and control access permissions.",
    action: "View Users",
    actionUrl: "/admin/users"
  },
  {
    title: "Course Management",
    description: "Create courses, schedule classes, set pricing, and manage course content. Build custom courses using the Course Builder.",
    action: "View Courses",
    actionUrl: "/admin/courses"
  },
  {
    title: "Booking System",
    description: "Track student enrollments, manage payments, process refunds, and handle class registrations.",
    action: "View Bookings",
    actionUrl: "/admin/bookings"
  },
  {
    title: "Analytics Dashboard",
    description: "Monitor revenue, student enrollment trends, course performance, and generate reports.",
    action: "View Analytics",
    actionUrl: "/admin/analytics"
  },
  {
    title: "Activity Logs",
    description: "Track all system activities, user actions, and security events for compliance and auditing.",
    action: "View Logs",
    actionUrl: "/admin/audit-logs"
  },
  {
    title: "You're All Set!",
    description: "You've completed the admin onboarding tour. Explore the dashboard and start managing your training centre. You can always access this tour again from Settings → Onboarding.",
    action: "Get Started"
  }
];

const TRAINER_STEPS: OnboardingStep[] = [
  {
    title: "Welcome, Trainer!",
    description: "This tour will show you how to manage your classes and students.",
    action: "Let's Begin"
  },
  {
    title: "Your Schedule",
    description: "View your upcoming classes, mark attendance, and manage your teaching calendar.",
    action: "View Calendar",
    actionUrl: "/admin/calendar"
  },
  {
    title: "Student Management",
    description: "View enrolled students, track their progress, and provide feedback.",
    action: "View Students",
    actionUrl: "/admin/students"
  },
  {
    title: "Instructor Payouts",
    description: "Track your earnings, view payment history, and monitor your performance metrics.",
    action: "View Earnings",
    actionUrl: "/admin/instructor-payouts"
  },
  {
    title: "Ready to Teach!",
    description: "You're all set! Start managing your classes and helping students succeed.",
    action: "Get Started"
  }
];

const STUDENT_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Your Learning Journey!",
    description: "Let's explore how to make the most of your training experience.",
    action: "Let's Begin"
  },
  {
    title: "Browse Courses",
    description: "Explore available training courses, view details, and check schedules.",
    action: "Browse Courses",
    actionUrl: "/courses"
  },
  {
    title: "Enroll in a Course",
    description: "Choose a course, complete the enrollment form, and process payment.",
    action: "View Courses",
    actionUrl: "/courses"
  },
  {
    title: "Student Portal",
    description: "Track your progress, view enrolled courses, download certificates, and access course materials.",
    action: "Open Portal",
    actionUrl: "/student/portal"
  },
  {
    title: "You're Ready to Learn!",
    description: "Start your training journey! Browse courses and enroll to begin learning.",
    action: "Get Started"
  }
];

interface AdminWelcomeTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminWelcomeTour({ open, onOpenChange }: AdminWelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [userRole, setUserRole] = useState<string>("student");
  const { toast } = useToast();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if onboarding is completed
      const { data: onboarding } = await supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (onboarding && !onboarding.is_completed) {
        setIsVisible(true);
      }

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
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  const steps = userRole === "admin" ? ADMIN_STEPS : userRole === "trainer" ? TRAINER_STEPS : STUDENT_STEPS;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleClose = async () => {
    onOpenChange(false);
    setCurrentStep(0);

    // Mark tour as completed for this user
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from("notification_preferences")
          .update({ has_seen_admin_tour: true })
          .eq("user_id", session.user.id);
      }
    } catch (error) {
      console.error("Error marking tour as completed:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
      toast({
        title: "Welcome aboard! 🎉",
        description: "You're all set to start managing your training center.",
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleAction = () => {
    const step = steps[currentStep];
    if (step.actionUrl) {
      window.location.href = step.actionUrl;
    } else {
      handleNext();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-slate-600">
                {steps[currentStep].description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length - 1 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip Tour
                </Button>
              )}
              
              <Button
                onClick={handleAction}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {steps[currentStep].action || "Next"}
                {currentStep < steps.length - 1 ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}