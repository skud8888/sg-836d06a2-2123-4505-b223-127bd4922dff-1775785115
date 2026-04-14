import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Circle, 
  Building2, 
  BookOpen, 
  Users, 
  Settings, 
  Rocket,
  ArrowRight,
  Home
} from "lucide-react";

interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  icon: any;
  link: string;
  completed: boolean;
  skipped: boolean;
}

export default function AdminOnboarding() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const defaultSteps: OnboardingStep[] = [
    {
      id: "organization",
      name: "Set Up Organization",
      description: "Configure your training center's basic information and branding",
      icon: Building2,
      link: "/admin/settings",
      completed: false,
      skipped: false
    },
    {
      id: "first_course",
      name: "Create First Course",
      description: "Add your first course template to start scheduling classes",
      icon: BookOpen,
      link: "/admin/courses",
      completed: false,
      skipped: false
    },
    {
      id: "first_trainer",
      name: "Add First Trainer",
      description: "Invite trainers to teach your courses",
      icon: Users,
      link: "/admin/team",
      completed: false,
      skipped: false
    },
    {
      id: "system_settings",
      name: "Configure System Settings",
      description: "Set up email templates, notifications, and preferences",
      icon: Settings,
      link: "/admin/settings",
      completed: false,
      skipped: false
    }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push("/admin/login");
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isAdmin = roles?.some(r => ["super_admin", "admin"].includes(r.role));
      
      if (!isAdmin) {
        router.push("/");
        return;
      }

      await loadOnboardingProgress(session.user.id);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/admin/login");
    }
  };

  const loadOnboardingProgress = async (userId: string) => {
    try {
      // Load saved progress
      const { data: savedProgress, error } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      // Merge with default steps
      const mergedSteps = defaultSteps.map(step => {
        const saved = savedProgress?.find(p => p.step_id === step.id);
        return {
          ...step,
          completed: saved?.completed || false,
          skipped: saved?.skipped || false
        };
      });

      setSteps(mergedSteps);
      calculateProgress(mergedSteps);

      // Check if all completed
      const allCompleted = mergedSteps.every(s => s.completed || s.skipped);
      if (allCompleted) {
        setShowCompletion(true);
      }

    } catch (error) {
      console.error("Error loading progress:", error);
      setSteps(defaultSteps);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (currentSteps: OnboardingStep[]) => {
    const completed = currentSteps.filter(s => s.completed).length;
    const total = currentSteps.length;
    const percentage = (completed / total) * 100;
    setProgress(Math.round(percentage));
  };

  const toggleStepComplete = async (stepId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      const newCompleted = !step.completed;

      // Update in database
      const { error } = await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: session.user.id,
          step_id: stepId,
          step_name: step.name,
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
          skipped: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,step_id"
        });

      if (error) throw error;

      // Update local state
      const updatedSteps = steps.map(s => 
        s.id === stepId ? { ...s, completed: newCompleted, skipped: false } : s
      );
      setSteps(updatedSteps);
      calculateProgress(updatedSteps);

      // Check completion
      const allCompleted = updatedSteps.every(s => s.completed || s.skipped);
      if (allCompleted) {
        setShowCompletion(true);
      }

      toast({
        title: newCompleted ? "Step Completed!" : "Step Marked Incomplete",
        description: step.name
      });

    } catch (error) {
      console.error("Error updating step:", error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const skipStep = async (stepId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      // Update in database
      await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: session.user.id,
          step_id: stepId,
          step_name: step.name,
          completed: false,
          skipped: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,step_id"
        });

      // Update local state
      const updatedSteps = steps.map(s => 
        s.id === stepId ? { ...s, skipped: true, completed: false } : s
      );
      setSteps(updatedSteps);
      calculateProgress(updatedSteps);

      // Check completion
      const allCompleted = updatedSteps.every(s => s.completed || s.skipped);
      if (allCompleted) {
        setShowCompletion(true);
      }

      toast({
        title: "Step Skipped",
        description: `You can return to "${step.name}" anytime from the dashboard.`
      });

    } catch (error) {
      console.error("Error skipping step:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (showCompletion) {
    return (
      <>
        <SEO 
          title="Onboarding Complete - Training Centre"
          description="Your admin account is all set up!"
        />
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl">🎉 All Set!</CardTitle>
              <CardDescription className="text-lg">
                Your training center is ready to go
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  You've completed the initial setup. Your training center is now ready to start scheduling classes and managing students.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild>
                  <Link href="/admin">
                    <Home className="h-5 w-5 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShowCompletion(false)}>
                  Review Checklist
                </Button>
              </div>

              <div className="pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Quick Links to Get Started:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/calendar">Schedule a Class</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/students">View Students</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/analytics">View Analytics</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/help">Get Help</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Admin Onboarding - Training Centre"
        description="Complete your admin account setup"
      />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome to Your Training Centre! 👋</h1>
                <p className="text-muted-foreground">
                  Let's get your admin account set up. Complete these steps to unlock the full potential of your training management system.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>

            {/* Progress Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Setup Progress</span>
                    <span className="text-muted-foreground">{progress}% Complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {steps.filter(s => s.completed).length} of {steps.length} steps completed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card 
                  key={step.id} 
                  className={step.completed ? "border-primary/50 bg-primary/5" : ""}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon & Status */}
                      <div className="flex-shrink-0">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? "bg-primary text-primary-foreground" 
                            : step.skipped 
                            ? "bg-muted text-muted-foreground"
                            : "bg-muted text-foreground"
                        }`}>
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {index + 1}. {step.name}
                              </h3>
                              {step.completed && (
                                <Badge variant="default" className="bg-primary">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {step.skipped && (
                                <Badge variant="secondary">
                                  Skipped
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <Button 
                            size="sm" 
                            variant={step.completed ? "outline" : "default"}
                            asChild
                          >
                            <Link href={step.link}>
                              {step.completed ? "Review" : "Get Started"}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`complete-${step.id}`}
                              checked={step.completed}
                              onCheckedChange={() => toggleStepComplete(step.id)}
                            />
                            <label
                              htmlFor={`complete-${step.id}`}
                              className="text-sm cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                              Mark as complete
                            </label>
                          </div>

                          {!step.completed && !step.skipped && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => skipStep(step.id)}
                            >
                              Skip for now
                            </Button>
                          )}

                          {step.skipped && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => toggleStepComplete(step.id)}
                            >
                              Mark as complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link href="/admin">Skip Onboarding</Link>
            </Button>

            {progress === 100 && (
              <Button size="lg" onClick={() => setShowCompletion(true)}>
                Complete Setup
                <Rocket className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>

          {/* Help Section */}
          <Card className="mt-8 border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Need help getting started? Check out our comprehensive help center.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help">
                  View Help Center
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}