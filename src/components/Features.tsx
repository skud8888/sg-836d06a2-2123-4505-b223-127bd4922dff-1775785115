import { BookOpen, Users, BarChart3, Award, Calendar, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: BookOpen,
    title: "Course Management",
    description: "Create, organize, and deliver engaging courses with our intuitive content builder and multimedia support."
  },
  {
    icon: Users,
    title: "Student Portal",
    description: "Give students a seamless learning experience with personalized dashboards and progress tracking."
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Track performance metrics, completion rates, and learning outcomes with comprehensive analytics."
  },
  {
    icon: Award,
    title: "Certifications",
    description: "Issue professional certificates automatically upon course completion with customizable templates."
  },
  {
    icon: Calendar,
    title: "Scheduling",
    description: "Manage classes, sessions, and events with integrated calendar and automated notifications."
  },
  {
    icon: Zap,
    title: "Automated Workflows",
    description: "Save time with automated enrollment, reminders, and progress tracking for seamless operations."
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to
            <span className="text-primary"> Manage Training</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to streamline your training operations and enhance learning outcomes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border hover:border-primary/50 transition-colors group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}