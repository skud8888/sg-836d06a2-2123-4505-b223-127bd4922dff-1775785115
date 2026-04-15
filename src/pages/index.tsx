import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Users, 
  BookOpen, 
  BarChart3, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Award,
  FileText,
  CreditCard,
  Bell,
  Search,
  Database,
  Lock,
  Smartphone,
  Globe,
  MessageSquare,
  Camera,
  PenTool,
  Brain,
  Mail,
  Activity,
  Code,
  Sparkles,
  LayoutDashboard,
  GraduationCap
} from "lucide-react";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        checkUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) {
      await checkUserRole(session.user.id);
    }
  };

  const checkUserRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["super_admin", "admin", "trainer"]);

    if (roleData && roleData.length > 0) {
      setUserRole(roleData[0].role);
    } else {
      setUserRole("student");
    }
  };

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automated course scheduling with conflict detection, calendar sync, and capacity management.",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Users,
      title: "Student Enrollment",
      description: "Streamlined enrollment process with online booking, payment integration, and instant confirmations.",
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: BookOpen,
      title: "Course Templates",
      description: "Reusable course templates with customizable content, pricing, and scheduling rules.",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: FileText,
      title: "Complete Records",
      description: "Comprehensive student profiles with enrollment history, documents, and payment tracking.",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description: "Monitor student progress, attendance, and performance with detailed analytics.",
      color: "text-cyan-600 dark:text-cyan-400"
    },
    {
      icon: Bell,
      title: "Automated Notifications",
      description: "Email and SMS reminders for upcoming classes, payments, and important updates.",
      color: "text-yellow-600 dark:text-yellow-400"
    },
    {
      icon: CreditCard,
      title: "Stripe Integration",
      description: "Secure online payments with support for full payment, deposits, and installment plans.",
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      icon: FileText,
      title: "Automated Receipts",
      description: "Instant receipt generation and email delivery for all transactions.",
      color: "text-indigo-600 dark:text-indigo-400"
    },
    {
      icon: BarChart3,
      title: "Payment Aging Reports",
      description: "Track outstanding balances, overdue payments, and collection priorities.",
      color: "text-pink-600 dark:text-pink-400"
    },
    {
      icon: FileText,
      title: "Centralized Hub",
      description: "All documents linked to students, courses, and bookings in one organized system.",
      color: "text-violet-600 dark:text-violet-400"
    },
    {
      icon: Database,
      title: "Version Control",
      description: "Complete document history with version tracking and audit trails.",
      color: "text-slate-600 dark:text-slate-400"
    },
    {
      icon: PenTool,
      title: "E-Signatures",
      description: "Digital signature workflow for contracts, waivers, and enrollment agreements.",
      color: "text-rose-600 dark:text-rose-400"
    },
    {
      icon: Camera,
      title: "Evidence Capture",
      description: "Mobile-optimized tool for capturing attendance photos, assessments, and completed work.",
      color: "text-teal-600 dark:text-teal-400"
    },
    {
      icon: Shield,
      title: "Audit Logs",
      description: "Complete activity trail for GDPR and SOC2 compliance requirements.",
      color: "text-red-600 dark:text-red-400"
    },
    {
      icon: Lock,
      title: "Role-Based Access",
      description: "Granular permissions with 5 predefined roles and custom permission sets.",
      color: "text-amber-600 dark:text-amber-400"
    },
    {
      icon: Brain,
      title: "Predictive Analytics",
      description: "AI-powered predictions for churn risk, upsell opportunities, and no-show alerts.",
      color: "text-fuchsia-600 dark:text-fuchsia-400"
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Universal Cmd+K search across all records with natural language understanding.",
      color: "text-sky-600 dark:text-sky-400"
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description: "Automated notifications, reminders, and follow-ups based on booking events.",
      color: "text-lime-600 dark:text-lime-400"
    }
  ];

  const isAdmin = userRole === "super_admin" || userRole === "admin";
  const isStudent = userRole === "student";

  return (
    <>
      <SEO
        title="The Training Hub - Professional Training Management System"
        description="Modern training center management platform with CRM, document management, AI insights, and online bookings. Built for excellence."
      />
      <Navigation />
      
      <main className="min-h-screen bg-background overflow-visible">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge className="mb-4 text-sm" variant="secondary">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Trusted by 500+ Training Centers Worldwide
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent leading-tight overflow-visible">
                Transform Your Training Center Management
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                All-in-one platform for bookings, student management, compliance, payments, and AI-powered insights. 
                Built for modern training centers who demand excellence.
              </p>
              
              {/* Portal Buttons for Authenticated Users */}
              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  {isAdmin && (
                    <Link href="/admin">
                      <Button size="lg" className="group transition-all hover:scale-105 text-lg px-8 py-6">
                        <LayoutDashboard className="mr-2 h-5 w-5" />
                        Admin Dashboard
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  )}
                  {isStudent && (
                    <Link href="/student/portal">
                      <Button size="lg" className="group transition-all hover:scale-105 text-lg px-8 py-6">
                        <GraduationCap className="mr-2 h-5 w-5" />
                        Student Portal
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/courses">
                    <Button size="lg" variant="outline" className="transition-all hover:scale-105 text-lg px-8 py-6">
                      Browse Courses
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Link href="/courses">
                    <Button size="lg" className="group transition-all hover:scale-105 text-lg px-8 py-6">
                      Browse Courses
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline" className="transition-all hover:scale-105 text-lg px-8 py-6">
                      Schedule a Demo
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-16">
                {[
                  { label: "Active Students", value: "1,000+", icon: Users, color: "text-blue-600 dark:text-blue-400" },
                  { label: "Courses Delivered", value: "500+", icon: BookOpen, color: "text-green-600 dark:text-green-400" },
                  { label: "Satisfaction Rate", value: "98%", icon: Star, color: "text-yellow-600 dark:text-yellow-400" },
                  { label: "Years Experience", value: "15+", icon: Award, color: "text-purple-600 dark:text-purple-400" }
                ].map((stat, i) => (
                  <div key={i} className="animate-slide-up bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50 hover:border-primary/50 transition-all hover:scale-105" style={{ animationDelay: `${i * 100}ms` }}>
                    <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                    <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comprehensive Features Section */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" variant="outline">40+ Features</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything Your Training Center Needs</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed specifically for training centers, driving schools, and educational institutions
              </p>
            </div>

            {/* Feature Categories */}
            <div className="space-y-20">
              
              {/* Core Management Features */}
              <div>
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  Core Management
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: Calendar,
                      title: "Smart Scheduling",
                      description: "Automated course scheduling with calendar management, drag-and-drop booking, and conflict detection",
                      color: "text-blue-600 dark:text-blue-400",
                      features: ["Calendar sync", "Auto-reminders", "Capacity management"]
                    },
                    {
                      icon: Users,
                      title: "Student CRM",
                      description: "Complete student records with enrollment history, progress tracking, and communication logs",
                      color: "text-green-600 dark:text-green-400",
                      features: ["360° student view", "Enrollment tracking", "Communication history"]
                    },
                    {
                      icon: BookOpen,
                      title: "Course Templates",
                      description: "Reusable course templates with pricing tiers, requirements, and automatic documentation",
                      color: "text-orange-600 dark:text-orange-400",
                      features: ["Template library", "Multi-tier pricing", "Custom fields"]
                    },
                    {
                      icon: FileText,
                      title: "Document Hub",
                      description: "Centralized document management with versioning, smart search, and role-based access",
                      color: "text-purple-600 dark:text-purple-400",
                      features: ["Version control", "Smart search", "Access control"]
                    },
                    {
                      icon: Camera,
                      title: "Evidence Capture",
                      description: "Photo capture with geolocation, timestamps, and automatic linking to student records",
                      color: "text-pink-600 dark:text-pink-400",
                      features: ["Camera integration", "Geolocation", "Auto-categorization"]
                    },
                    {
                      icon: PenTool,
                      title: "E-Signatures",
                      description: "Digital signature workflows with email notifications, legal compliance, and audit trails",
                      color: "text-indigo-600 dark:text-indigo-400",
                      features: ["Mobile signing", "Email requests", "Legal compliance"]
                    }
                  ].map((feature, i) => (
                    <Card 
                      key={i} 
                      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                    >
                      <CardHeader>
                        <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color} border border-current/20`}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feature.features.map((f, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Payments & Finance */}
              <div>
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary" />
                  Payments & Finance
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: CreditCard,
                      title: "Stripe Integration",
                      description: "Accept online payments with deposits, installments, and automated receipt generation",
                      color: "text-emerald-600 dark:text-emerald-400",
                      features: ["Deposit collection", "Payment plans", "Auto receipts"]
                    },
                    {
                      icon: BarChart3,
                      title: "Revenue Analytics",
                      description: "Real-time revenue tracking with forecasting, trend analysis, and financial reporting",
                      color: "text-cyan-600 dark:text-cyan-400",
                      features: ["Revenue forecasting", "Trend analysis", "Export reports"]
                    },
                    {
                      icon: FileText,
                      title: "Invoice Generator",
                      description: "Professional invoice generation with custom branding, line items, and payment tracking",
                      color: "text-violet-600 dark:text-violet-400",
                      features: ["Custom branding", "Auto-numbering", "Payment tracking"]
                    }
                  ].map((feature, i) => (
                    <Card 
                      key={i} 
                      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                    >
                      <CardHeader>
                        <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color} border border-current/20`}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feature.features.map((f, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* AI & Automation */}
              <div>
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  AI & Automation
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: Brain,
                      title: "AI Insights",
                      description: "Predictive analytics for churn risk, upsell opportunities, enrollment forecasting, and revenue prediction",
                      color: "text-purple-600 dark:text-purple-400",
                      features: ["Churn prediction", "Upsell detection", "Revenue forecasting"]
                    },
                    {
                      icon: Bell,
                      title: "Smart Notifications",
                      description: "Automated email and SMS reminders with customizable preferences and quiet hours",
                      color: "text-yellow-600 dark:text-yellow-400",
                      features: ["Email & SMS", "Custom preferences", "Quiet hours"]
                    },
                    {
                      icon: Search,
                      title: "Global Search",
                      description: "Lightning-fast search across students, bookings, documents, and courses with Cmd+K hotkey",
                      color: "text-blue-600 dark:text-blue-400",
                      features: ["Cmd+K hotkey", "Multi-entity search", "Instant results"]
                    }
                  ].map((feature, i) => (
                    <Card 
                      key={i} 
                      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                    >
                      <CardHeader>
                        <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color} border border-current/20`}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feature.features.map((f, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Security & Compliance */}
              <div>
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Security & Compliance
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: Shield,
                      title: "Role-Based Access",
                      description: "5-tier permission system (Super Admin, Admin, Trainer, Receptionist, Student) with granular controls",
                      color: "text-red-600 dark:text-red-400",
                      features: ["5 role types", "Granular permissions", "Access logs"]
                    },
                    {
                      icon: FileText,
                      title: "Audit Trail",
                      description: "Comprehensive activity logs with user tracking, IP logging, and compliance reporting",
                      color: "text-slate-600 dark:text-slate-400",
                      features: ["Full activity log", "IP tracking", "Compliance reports"]
                    },
                    {
                      icon: Database,
                      title: "Automated Backups",
                      description: "Daily database backups with encryption, retention policies, and one-click restoration",
                      color: "text-violet-600 dark:text-violet-400",
                      features: ["Daily backups", "Encryption", "One-click restore"]
                    },
                    {
                      icon: Lock,
                      title: "Data Encryption",
                      description: "End-to-end encryption for sensitive data with secure storage and GDPR compliance",
                      color: "text-green-600 dark:text-green-400",
                      features: ["E2E encryption", "GDPR compliant", "Secure storage"]
                    },
                    {
                      icon: Activity,
                      title: "Health Monitoring",
                      description: "Real-time system health checks with automated alerts and performance tracking",
                      color: "text-teal-600 dark:text-teal-400",
                      features: ["Real-time monitoring", "Auto alerts", "Performance metrics"]
                    },
                    {
                      icon: MessageSquare,
                      title: "Feedback System",
                      description: "Built-in user feedback widget with bug reporting, feature requests, and admin dashboard",
                      color: "text-pink-600 dark:text-pink-400",
                      features: ["Bug reports", "Feature requests", "Admin dashboard"]
                    }
                  ].map((feature, i) => (
                    <Card 
                      key={i} 
                      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                    >
                      <CardHeader>
                        <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color} border border-current/20`}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feature.features.map((f, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* User Experience */}
              <div>
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <Smartphone className="h-6 w-6 text-primary" />
                  User Experience
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: Smartphone,
                      title: "Progressive Web App",
                      description: "Install on any device with offline support, push notifications, and native app experience",
                      color: "text-indigo-600 dark:text-indigo-400",
                      features: ["Offline support", "Install prompt", "Push notifications"]
                    },
                    {
                      icon: Globe,
                      title: "Dark Mode",
                      description: "Beautiful dark theme with system preference detection and seamless switching",
                      color: "text-slate-600 dark:text-slate-400",
                      features: ["Auto-detect", "Toggle switch", "Persistent preference"]
                    },
                    {
                      icon: TrendingUp,
                      title: "Responsive Design",
                      description: "Optimized for all devices from mobile phones to 4K displays with touch support",
                      color: "text-green-600 dark:text-green-400",
                      features: ["Mobile-first", "Touch optimized", "4K ready"]
                    }
                  ].map((feature, i) => (
                    <Card 
                      key={i} 
                      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                    >
                      <CardHeader>
                        <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color} border border-current/20`}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feature.features.map((f, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

            </div>

            {/* View All Features CTA */}
            <div className="text-center mt-16">
              <Link href="/features">
                <Button size="lg" variant="outline" className="group">
                  View All Features
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <Badge className="mb-4" variant="outline">Why Training Centers Choose Us</Badge>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    Built by Training Experts,
                    <span className="text-primary block mt-2">For Training Experts</span>
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    15+ years of training industry experience distilled into the perfect management platform
                  </p>
                </div>
                
                <div className="grid gap-6">
                  {[
                    {
                      icon: Clock,
                      title: "Save 10+ Hours Weekly",
                      description: "Automate repetitive admin tasks and focus on teaching"
                    },
                    {
                      icon: TrendingUp,
                      title: "Increase Retention 25%",
                      description: "AI-powered insights prevent student churn before it happens"
                    },
                    {
                      icon: Bell,
                      title: "Reduce No-Shows 40%",
                      description: "Automated reminders keep students engaged and on-schedule"
                    },
                    {
                      icon: Shield,
                      title: "100% Audit-Ready",
                      description: "Complete compliance with automatic evidence capture and e-signatures"
                    },
                    {
                      icon: CreditCard,
                      title: "Get Paid Faster",
                      description: "Seamless online payments with automated invoicing and receipts"
                    },
                    {
                      icon: Smartphone,
                      title: "Work Anywhere",
                      description: "Mobile-first design means your team stays productive on the go"
                    }
                  ].map((benefit, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className={`h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors`}>
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link href="/about">
                    <Button size="lg" className="group">
                      Learn More About Us
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center p-8 border border-primary/20">
                  <div className="grid grid-cols-2 gap-6 w-full">
                    {[
                      { icon: TrendingUp, value: "98%", label: "Satisfaction", color: "text-green-600 dark:text-green-400" },
                      { icon: Clock, value: "24/7", label: "Support", color: "text-blue-600 dark:text-blue-400" },
                      { icon: Shield, value: "100%", label: "Secure", color: "text-red-600 dark:text-red-400" },
                      { icon: Award, value: "15+", label: "Years", color: "text-purple-600 dark:text-purple-400" }
                    ].map((stat, i) => (
                      <div 
                        key={i} 
                        className="bg-background rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-border/50"
                      >
                        <stat.icon className={`h-10 w-10 mb-3 ${stat.color}`} />
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" variant="outline">What Our Clients Say</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Trusted by Training Centers Worldwide</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join hundreds of training centers who have transformed their operations
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "This platform cut our admin time in half. The automated reminders alone have saved us hundreds of hours and reduced no-shows dramatically.",
                  author: "Sarah Johnson",
                  role: "Director, Springfield Driving School",
                  rating: 5
                },
                {
                  quote: "The AI insights helped us identify at-risk students before they dropped out. Our retention rate improved by 30% in the first quarter.",
                  author: "Michael Chen",
                  role: "Owner, TechSkills Academy",
                  rating: 5
                },
                {
                  quote: "Payment processing is seamless. Students love the online booking and instant receipts. We've nearly doubled our course enrollment.",
                  author: "Emma Williams",
                  role: "Manager, ProTrain Centre",
                  rating: 5
                }
              ].map((testimonial, i) => (
                <Card key={i} className="border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      "{testimonial.quote}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" variant="outline">Simple, Transparent Pricing</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Plans That Grow With You</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start free, upgrade when you're ready. No hidden fees, no surprises.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "Free",
                  description: "Perfect for small training centers",
                  features: [
                    "Up to 50 students",
                    "Basic booking system",
                    "Email notifications",
                    "Document storage (1GB)",
                    "Community support"
                  ]
                },
                {
                  name: "Professional",
                  price: "$99",
                  period: "/month",
                  description: "For growing training centers",
                  features: [
                    "Unlimited students",
                    "Payment processing",
                    "AI-powered insights",
                    "E-signatures",
                    "Priority support",
                    "Custom branding"
                  ],
                  popular: true
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  description: "For large organizations",
                  features: [
                    "Everything in Professional",
                    "Multi-location support",
                    "Advanced analytics",
                    "Dedicated account manager",
                    "Custom integrations",
                    "SLA guarantee"
                  ]
                }
              ].map((plan, i) => (
                <Card key={i} className={`relative ${plan.popular ? 'border-primary shadow-xl scale-105' : 'border-border/50'} hover:shadow-lg transition-all`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <div className="mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/pricing">
                      <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                        {plan.price === "Free" ? "Get Started" : plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="group">
                  View Full Pricing Details
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Transform Your Training Center?</h2>
            <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              Join leading training centers who trust our platform to manage their operations and delight their students
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg" variant="secondary" className="group text-lg px-8 py-6">
                  Browse Courses
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-6">
                  Schedule a Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm mt-8 opacity-75">
              ✨ No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-muted/30 border-t py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Product */}
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                  <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                  <li><Link href="/courses" className="hover:text-primary transition-colors">Courses</Link></li>
                  <li><Link href="/student/portal" className="hover:text-primary transition-colors">Student Portal</Link></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                  <li><Link href="/admin/login" className="hover:text-primary transition-colors">Admin Login</Link></li>
                  <li><Link href="/student/feedback" className="hover:text-primary transition-colors">Submit Feedback</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                  <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    info@thetraininghub.com.au
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Queensland, Australia
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-8 text-center text-sm text-muted-foreground">
              <p>© 2026 The Training Hub. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}