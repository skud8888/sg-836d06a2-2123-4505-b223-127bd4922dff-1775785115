import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Map } from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Welcome to The Training Hub!",
    description: "Let's take a quick tour of your new learning platform. We've added several new features to help you succeed.",
  },
  {
    title: "Command Palette",
    description: "Press Cmd+K (or Ctrl+K) anywhere in the app to quickly search for courses, navigate to pages, or perform actions.",
  },
  {
    title: "Social Profile",
    description: "Connect with other learners! Build your profile, share your achievements, and join study groups.",
  },
  {
    title: "Referral Program",
    description: "Invite friends and earn rewards. You can find your unique referral link in the Student Portal.",
  },
  {
    title: "Offline Mode",
    description: "No internet? No problem! Core features now work offline, and your progress syncs automatically when you reconnect.",
  }
];

export function FeatureDiscoveryTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem("has_seen_feature_tour");
    if (!hasSeenTour) {
      // Delay opening slightly for better UX
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("has_seen_feature_tour", "true");
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Map className="h-6 w-6 text-primary" />
            {TOUR_STEPS[currentStep].title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <p className="text-muted-foreground text-base">
            {TOUR_STEPS[currentStep].description}
          </p>
          
          <div className="flex justify-center gap-2 mt-8">
            {TOUR_STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all ${idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'}`}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="text-muted-foreground px-0 hover:bg-transparent hover:text-foreground"
          >
            Skip Tour
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentStep === TOUR_STEPS.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}