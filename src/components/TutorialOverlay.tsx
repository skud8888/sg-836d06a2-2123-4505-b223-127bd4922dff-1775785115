import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TutorialStep {
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: string;
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  tutorialKey: string;
}

export function TutorialOverlay({ steps, onComplete, tutorialKey }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    setIsVisible(false);
    
    // Save completion to user preferences
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from("notification_preferences")
        .upsert({
          user_id: session.user.id,
          [`has_seen_${tutorialKey}`]: true
        });
    }

    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100] animate-in fade-in" />

      {/* Tutorial Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md p-4 animate-in zoom-in-95">
        <Card className="shadow-2xl">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} / {steps.length}
              </span>
            </div>
            <CardTitle>{step.title}</CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {step.action && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Try it:</p>
                <p className="text-sm text-muted-foreground">{step.action}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Pre-built tutorial configurations
export const adminDashboardTutorial: TutorialStep[] = [
  {
    title: "Welcome to the Admin Dashboard",
    description: "Let's take a quick tour of the key features to get you started.",
    action: "Click Next to continue"
  },
  {
    title: "Quick Stats Overview",
    description: "View real-time statistics about bookings, students, revenue, and enquiries at a glance.",
    target: "[data-tour='stats']"
  },
  {
    title: "Navigation Shortcuts",
    description: "Use the quick navigation cards to access commonly used features quickly.",
    action: "Try clicking on any card to navigate"
  },
  {
    title: "Command Palette",
    description: "Press Cmd+K (Mac) or Ctrl+K (Windows) to open the command palette for quick navigation.",
    action: "Try it now: Press Cmd/Ctrl + K"
  },
  {
    title: "Keyboard Shortcuts",
    description: "Use Cmd/Ctrl + / to see all available keyboard shortcuts.",
    action: "Try it: Press Cmd/Ctrl + /"
  }
];

export const studentPortalTutorial: TutorialStep[] = [
  {
    title: "Welcome to Your Student Portal",
    description: "This is your personal learning hub. Let's explore the main features.",
  },
  {
    title: "My Courses",
    description: "View all your enrolled courses, track progress, and access course materials.",
    target: "[data-tour='courses']"
  },
  {
    title: "Certificates",
    description: "Download and share your earned certificates from completed courses.",
    target: "[data-tour='certificates']"
  },
  {
    title: "Progress Tracking",
    description: "Monitor your learning journey with detailed progress indicators and achievements.",
  }
];