import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { FeaturedCourses } from "@/components/FeaturedCourses";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, Users, BookOpen, FileText, BarChart3, Bell,
  CreditCard, Award, Clock, TrendingUp, Shield, CheckCircle,
  ArrowRight, Star, Zap, Target, MessageSquare, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const [stats, setStats] = useState({
    students: 500,
    courses: 50,
    satisfaction: 98
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: students } = await supabase.from("profiles").select("id", { count: "exact" });
      const { data: courses } = await supabase.from("course_templates").select("id", { count: "exact" });
      
      setStats({
        students: students?.length || 500,
        courses: courses?.length || 50,
        satisfaction: 98
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automated course scheduling with conflict detection, calendar sync, and capacity management.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Student Management",
      description: "Comprehensive student profiles with enrollment history, documents, and payment tracking.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards with revenue tracking, enrollment trends, and performance metrics.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Automated email and SMS reminders for classes, payments, and important updates.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: CreditCard,
      title: "Payment Processing",
      description: "Secure Stripe integration with support for full payment, deposits, and installments.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Award,
      title: "Certifications",
      description: "Automated certificate generation and digital credential management.",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Save Time",
      description: "Automate administrative tasks and focus on teaching",
      stat: "80%",
      label: "Time Saved"
    },
    {
      icon: TrendingUp,
      title: "Grow Revenue",
      description: "Increase enrollment with streamlined booking process",
      stat: "3x",
      label: "Revenue Growth"
    },
    {
      icon: Shield,
      title: "Stay Compliant",
      description: "Maintain complete audit trails and documentation",
      stat: "100%",
      label: "Compliance"
    },
    {
      icon: Target,
      title: "Better Outcomes",
      description: "Track student progress and improve course quality",
      stat: "95%",
      label: "Completion Rate"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Training Center Director",
      content: "This platform transformed how we manage our training programs. Enrollment is up 40% and admin time is down 60%.",
      rating: 5,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
      name: "Michael Chen",
      role: "Operations Manager",
      content: "The automation features are incredible. Payment processing, certificates, and reminders all happen automatically.",
      rating: 5,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
    },
    {
      name: "Emma Davis",
      role: "Course Coordinator",
      content: "Our students love the online booking system. The mobile-friendly portal makes everything so accessible.",
      rating: 5,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma"
    }
  ];

  return (
    <>
      <SEO />
      <Navigation />
      
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section - Enhanced */}
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
          {/* Animated Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 px-4 py-2">
                <Zap className="h-3 w-3 mr-2" />
                Trusted by 500+ Training Centers
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
                Transform Your
                <span className="block mt-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Training Business
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
                Complete training management platform with CRM, online booking, 
                automated workflows, and AI-powered insights. Everything you need in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up">
                <Link href="/admin/signup">
                  <Button size="lg" className="gap-2 group">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Browse Courses
                  </Button>
                </Link>
              </div>

              {/* Social Proof Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{stats.students}+</div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{stats.courses}+</div>
                  <div className="text-sm text-muted-foreground">Courses Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{stats.satisfaction}%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Enhanced */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="outline" className="mb-4">Features</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Everything You Need to Excel
              </h2>
              <p className="text-lg text-muted-foreground">
                Powerful features designed specifically for training centers and educational institutions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Card key={i} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-full w-full text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section - New */}
        <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="outline" className="mb-4">Benefits</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Measurable Results That Matter
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{benefit.stat}</div>
                      <div className="text-sm text-muted-foreground mb-3">{benefit.label}</div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Courses */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="outline" className="mb-4">Popular Programs</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Featured Training Courses
              </h2>
              <p className="text-lg text-muted-foreground">
                Discover our most sought-after compliance and certification programs.
              </p>
            </div>
            
            <FeaturedCourses />
          </div>
        </section>

        {/* Testimonials Section - New */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="outline" className="mb-4">Testimonials</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Loved by Training Professionals
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Enhanced */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">Ready to Get Started?</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Start Your Free Trial Today
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of training centers already using our platform. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/admin/signup">
                  <Button size="lg" className="gap-2 group">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Talk to Sales
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                  <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                  <li><Link href="/courses" className="hover:text-foreground">Courses</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                  <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                  <li><Link href="/help" className="hover:text-foreground">Help</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                  <li><Link href="/cookies" className="hover:text-foreground">Cookies</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Connect</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Facebook</a></li>
                  <li><a href="#" className="hover:text-foreground">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-foreground">Twitter</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} The Training Hub. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}