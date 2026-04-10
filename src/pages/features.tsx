import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Calendar, 
  Users, 
  BookOpen, 
  BarChart3, 
  Shield, 
  Zap,
  FileText,
  Search,
  Bell,
  CreditCard,
  Camera,
  Download,
  PenTool,
  Brain,
  Lock,
  Smartphone
} from "lucide-react";

export default function FeaturesPage() {
  const featureCategories = [
    {
      category: "Course Management",
      icon: BookOpen,
      features: [
        {
          icon: Calendar,
          title: "Smart Scheduling",
          description: "Automated course scheduling with conflict detection, calendar sync, and capacity management."
        },
        {
          icon: Users,
          title: "Student Enrollment",
          description: "Streamlined enrollment process with online booking, payment integration, and instant confirmations."
        },
        {
          icon: BookOpen,
          title: "Course Templates",
          description: "Reusable course templates with customizable content, pricing, and scheduling rules."
        }
      ]
    },
    {
      category: "Student Management",
      icon: Users,
      features: [
        {
          icon: FileText,
          title: "Complete Records",
          description: "Comprehensive student profiles with enrollment history, documents, and payment tracking."
        },
        {
          icon: BarChart3,
          title: "Progress Tracking",
          description: "Monitor student progress, attendance, and performance with detailed analytics."
        },
        {
          icon: Bell,
          title: "Automated Notifications",
          description: "Email and SMS reminders for upcoming classes, payments, and important updates."
        }
      ]
    },
    {
      category: "Payments & Billing",
      icon: CreditCard,
      features: [
        {
          icon: CreditCard,
          title: "Stripe Integration",
          description: "Secure online payments with support for full payment, deposits, and installment plans."
        },
        {
          icon: Download,
          title: "Automated Receipts",
          description: "Instant receipt generation and email delivery for all transactions."
        },
        {
          icon: BarChart3,
          title: "Payment Aging Reports",
          description: "Track outstanding balances, overdue payments, and collection priorities."
        }
      ]
    },
    {
      category: "Document Management",
      icon: FileText,
      features: [
        {
          icon: FileText,
          title: "Centralized Hub",
          description: "All documents linked to students, courses, and bookings in one organized system."
        },
        {
          icon: Download,
          title: "Version Control",
          description: "Complete document history with version tracking and audit trails."
        },
        {
          icon: PenTool,
          title: "E-Signatures",
          description: "Digital signature workflow for contracts, waivers, and enrollment agreements."
        }
      ]
    },
    {
      category: "Compliance & Evidence",
      icon: Shield,
      features: [
        {
          icon: Camera,
          title: "Evidence Capture",
          description: "Mobile-optimized tool for capturing attendance photos, assessments, and completed work."
        },
        {
          icon: Shield,
          title: "Audit Logs",
          description: "Complete activity trail for GDPR and SOC2 compliance requirements."
        },
        {
          icon: Lock,
          title: "Role-Based Access",
          description: "Granular permissions with 5 predefined roles and custom permission sets."
        }
      ]
    },
    {
      category: "AI & Automation",
      icon: Brain,
      features: [
        {
          icon: Brain,
          title: "Predictive Analytics",
          description: "AI-powered predictions for churn risk, upsell opportunities, and no-show alerts."
        },
        {
          icon: Search,
          title: "Smart Search",
          description: "Universal Cmd+K search across all records with natural language understanding."
        },
        {
          icon: Zap,
          title: "Workflow Automation",
          description: "Automated notifications, reminders, and follow-ups based on booking events."
        }
      ]
    }
  ];

  return (
    <>
      <SEO
        title="Features - GTS Training Centre"
        description="Explore all the powerful features of our training management platform"
      />
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <Badge className="mb-4" variant="secondary">
                Complete Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Everything You Need to Run Your Training Center
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                From student enrollment to compliance tracking, our platform handles it all
              </p>
              <Link href="/contact">
                <Button size="lg">
                  Schedule a Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="space-y-20">
              {featureCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="animate-slide-up" style={{ animationDelay: `${categoryIndex * 100}ms` }}>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold">{category.category}</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {category.features.map((feature, featureIndex) => (
                      <Card 
                        key={featureIndex} 
                        className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <feature.icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle>{feature.title}</CardTitle>
                          <CardDescription>{feature.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile App Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge className="mb-4" variant="secondary">
                    Progressive Web App
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Mobile-First Design
                  </h2>
                  <p className="text-xl text-muted-foreground mb-6">
                    Install our platform as an app on any device. Works offline, sends notifications, 
                    and provides a native app experience.
                  </p>
                  <div className="space-y-3">
                    {[
                      "Install on iOS, Android, or desktop",
                      "Offline evidence capture and sync",
                      "Push notifications for important updates",
                      "Native app performance",
                      "No app store required"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Smartphone className="h-48 w-48 text-primary opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to See It in Action?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Schedule a personalized demo to see how our platform can transform your training center
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="secondary">
                  Schedule Demo
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}