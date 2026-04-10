import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

type AdminWelcomeTourProps = {
  autoStart?: boolean;
};

export function AdminWelcomeTour({ autoStart = false }: AdminWelcomeTourProps) {
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    const tourCompleted = localStorage.getItem("admin_tour_completed");
    setHasSeenTour(!!tourCompleted);

    if (autoStart && !tourCompleted) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startTour();
      }, 500);
    }
  }, [autoStart]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: "body",
          popover: {
            title: "👋 Welcome to GTS Training Admin!",
            description: "Let's take a quick tour to show you around. This will only take a minute.",
            side: "over",
            align: "center"
          }
        },
        {
          element: '[data-tour="bookings"]',
          popover: {
            title: "📅 Manage Bookings",
            description: "View and manage all student enrollments, track payments, and handle booking requests. This is your central hub for course registrations.",
            side: "bottom",
            align: "start"
          }
        },
        {
          element: '[data-tour="students"]',
          popover: {
            title: "👥 Student Records",
            description: "Access comprehensive student information, track progress, manage documents, and view enrollment history.",
            side: "bottom",
            align: "start"
          }
        },
        {
          element: '[data-tour="calendar"]',
          popover: {
            title: "📆 Schedule Management",
            description: "Plan courses, manage class schedules, assign trainers, and view capacity at a glance.",
            side: "bottom",
            align: "start"
          }
        },
        {
          element: '[data-tour="analytics"]',
          popover: {
            title: "📊 Business Analytics",
            description: "Track revenue, monitor enrollment trends, analyze student demographics, and measure business performance.",
            side: "bottom",
            align: "start"
          }
        },
        {
          element: '[data-tour="ai-insights"]',
          popover: {
            title: "🤖 AI-Powered Insights",
            description: "Get predictive analytics on churn risk, upsell opportunities, and no-show predictions powered by artificial intelligence.",
            side: "bottom",
            align: "start"
          }
        },
        {
          element: '[data-tour="search"]',
          popover: {
            title: "🔍 Universal Search",
            description: "Press Cmd+K (or Ctrl+K on Windows) to instantly search across bookings, students, courses, and documents.",
            side: "bottom",
            align: "start"
          }
        },
        {
          element: '[data-tour="user-menu"]',
          popover: {
            title: "⚙️ Your Profile",
            description: "Access your profile settings, change preferences, update your password, and manage notifications.",
            side: "bottom",
            align: "end"
          }
        },
        {
          element: "body",
          popover: {
            title: "🎉 You're All Set!",
            description: "You're ready to start managing your training center. If you need help later, click the Help button to restart this tour.",
            side: "over",
            align: "center"
          }
        }
      ],
      onDestroyStarted: () => {
        localStorage.setItem("admin_tour_completed", "true");
        setHasSeenTour(true);
        driverObj.destroy();
      }
    });

    driverObj.drive();
  };

  const resetTour = () => {
    localStorage.removeItem("admin_tour_completed");
    setHasSeenTour(false);
    startTour();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={resetTour}
      className="gap-2"
      data-tour="help-button"
    >
      <HelpCircle className="h-4 w-4" />
      Start Tour
    </Button>
  );
}