import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Hero } from "@/components/Hero";
import FeaturedCourses from "@/components/FeaturedCourses";
import { InstallPWA } from "@/components/InstallPWA";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Award,
  TrendingUp,
  CheckCircle,
  Shield,
  Clock,
  Zap,
  Globe,
  BookOpen,
  Star,
  Calendar,
  FileText,
  BarChart3,
  Bell,
  CreditCard,
  Database,
  PenTool,
  Camera,
  Brain,
  Search,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Activity,
  MessageSquare,
  Smartphone,
  Mail
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  
  // Computed values that were missing
  const isAuthenticated = userType !== null;
  const userRole = userType;

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUserType(null);
        return;
      }

      // Check user role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (roles && roles.length > 0) {
        const role = roles[0].role;
        if (role === "super_admin" || role === "admin") {
          setUserType("admin");
        } else if (role === "trainer") {
          setUserType("trainer");
        } else {
          setUserType("student");
        }
      } else {
        setUserType("student");
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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

  const isAdmin = userType === "super_admin" || userType === "admin";
  const isStudent = userType === "student";

  return (
    <>
      <SEO
        title="The Training Hub - Professional Training Management System"
        description="Modern training center management platform with CRM, document management, AI insights, and online bookings. Built for excellence."
      />
      <Navigation />
      
      <main className="min-h-screen bg-background overflow-visible">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background -z-10" />
          
          <div className="max-w-6xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Professional Training & Certification Platform
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Your Gateway to
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Professional Excellence
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Industry-leading training programs with expert instructors, hands-on learning, and recognized certifications.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                userRole === "student" ? (
                  <Button 
                    size="lg" 
                    onClick={() => router.push("/student/portal")}
                    className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                  >
                    Go to Student Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      onClick={() => router.push("/admin")}
                      className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => router.push("/student/portal")}
                      className="text-lg px-8 py-6 border-2 hover:bg-primary/5"
                    >
                      <GraduationCap className="mr-2 h-5 w-5" />
                      Student Portal
                    </Button>
                  </>
                )
              ) : (
                <>
                  <Button 
                    size="lg" 
                    onClick={() => router.push("/courses")}
                    className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                  >
                    Browse Courses
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="default"
                    onClick={() => router.push("/student/portal")}
                    className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
                  >
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Student Portal
                  </Button>
                </>
              )}
            </div>

            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground pt-2">
                Already enrolled? Access your courses, certificates, and progress in the Student Portal
              </p>
            )}
          </div>
        </section>

        {/* Featured Courses Section */}
        <div className="py-24 bg-white relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="outline" className="mb-4">Popular Programs</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">
                Featured Training Courses
              </h2>
              <p className="text-lg text-slate-600">
                Discover our most sought-after compliance and certification programs.
              </p>
            </div>
            
            <FeaturedCourses />
          </div>
        </div>

        {/* Benefits Section */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" variant="outline">Why Training Centers Choose Us</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Built by Training Experts, For Training Experts</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                15+ years of training industry experience distilled into the perfect management platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <Badge className="mb-4" variant="outline">What Our Clients Say</Badge>
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">Trusted by Training Centers Worldwide</h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Join hundreds of training centers who have transformed their operations
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
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
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

        {/* Student Portal CTA Section - For Guests */}
        {!isAuthenticated && (
          <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <GraduationCap className="h-4 w-4" />
                    For Students
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                    Everything You Need in One Place
                  </h2>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Access your personalized learning dashboard with course materials, schedules, certificates, and progress tracking - all in the Student Portal.
                  </p>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Course Materials</h3>
                        <p className="text-sm text-muted-foreground">Access all your learning resources, documents, and study materials</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Class Schedule</h3>
                        <p className="text-sm text-muted-foreground">View upcoming classes, attendance records, and session details</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Certificates</h3>
                        <p className="text-sm text-muted-foreground">Download and share your earned certificates and credentials</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Progress Tracking</h3>
                        <p className="text-sm text-muted-foreground">Monitor your learning journey and achievement milestones</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button 
                      size="lg"
                      onClick={() => router.push("/student/portal")}
                      className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                    >
                      <GraduationCap className="mr-2 h-5 w-5" />
                      Access Student Portal
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={() => router.push("/courses")}
                      className="text-lg px-8 py-6 border-2"
                    >
                      Explore Courses
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 backdrop-blur-sm border border-primary/10">
                    <div className="h-full w-full rounded-xl bg-background/50 backdrop-blur-sm border border-primary/20 flex flex-col items-center justify-center gap-6 p-8">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-10 w-10 text-primary" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">Student Portal</h3>
                        <p className="text-muted-foreground">Your personalized learning hub</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="text-center p-4 rounded-lg bg-primary/5">
                          <div className="text-3xl font-bold text-primary">24/7</div>
                          <div className="text-sm text-muted-foreground">Access</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-primary/5">
                          <div className="text-3xl font-bold text-primary">100%</div>
                          <div className="text-sm text-muted-foreground">Online</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

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