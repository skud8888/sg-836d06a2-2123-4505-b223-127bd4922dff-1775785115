import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Calendar, 
  Users, 
  BookOpen, 
  TrendingUp,
  Sun,
  Moon,
  Sunrise
} from "lucide-react";

interface DashboardWelcomeProps {
  userName?: string;
  userRole?: string;
}

interface TimeIconType {
  className?: string;
}

export function DashboardWelcome({ userName, userRole }: DashboardWelcomeProps) {
  const [visible, setVisible] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [timeIcon, setTimeIcon] = useState<React.ComponentType<TimeIconType>>(Sun);

  useEffect(() => {
    // Check if user has dismissed the welcome message
    const dismissed = localStorage.getItem("dashboard_welcome_dismissed");
    if (dismissed === "true") {
      setVisible(false);
    }

    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
      setTimeIcon(Sunrise);
    } else if (hour < 18) {
      setGreeting("Good afternoon");
      setTimeIcon(Sun);
    } else {
      setGreeting("Good evening");
      setTimeIcon(Moon);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("dashboard_welcome_dismissed", "true");
  };

  const quickActions = [
    {
      icon: Calendar,
      label: "Schedule Class",
      href: "/admin/calendar",
      color: "text-blue-500"
    },
    {
      icon: Users,
      label: "Add Student",
      href: "/admin/students",
      color: "text-green-500"
    },
    {
      icon: BookOpen,
      label: "Create Course",
      href: "/admin/courses",
      color: "text-purple-500"
    },
    {
      icon: TrendingUp,
      label: "View Analytics",
      href: "/admin/analytics",
      color: "text-orange-500"
    }
  ];

  if (!visible) return null;

  const TimeIcon = timeIcon;

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <TimeIcon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">
                {greeting}, {userName || "Admin"}!
              </h2>
            </div>
            
            <p className="text-muted-foreground mb-4">
              {userRole === "super_admin" ? "Super Admin" : "Admin"} • 
              <span className="ml-2">
                {new Date().toLocaleDateString("en-AU", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </span>
            </p>

            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.href}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.location.href = action.href}
                >
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}