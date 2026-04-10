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
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Award
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      <SEO
        title="GTS Training Centre - Professional Training Management System"
        description="Modern training center management platform with CRM, document management, AI insights, and online bookings"
      />
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge className="mb-4" variant="secondary">
                🚀 Trusted by Leading Training Centers
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Transform Your Training Center Management
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                All-in-one platform for bookings, student management, compliance, and payments. 
                Built for modern training centers who demand excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/courses">
                  <Button size="lg" className="group transition-all hover:scale-105">
                    Browse Courses
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="transition-all hover:scale-105">
                    Contact Sales
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
                {[
                  { label: "Active Students", value: "1,000+", icon: Users },
                  { label: "Courses Delivered", value: "500+", icon: BookOpen },
                  { label: "Satisfaction Rate", value: "98%", icon: Star },
                  { label: "Years Experience", value: "15+", icon: Award }
                ].map((stat, i) => (
                  <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed specifically for training centers
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Smart Scheduling",
                  description: "Automated course scheduling, calendar management, and booking workflows",
                  color: "text-blue-600 dark:text-blue-400"
                },
                {
                  icon: Users,
                  title: "Student Management",
                  description: "Complete student records, enrollment history, and communication tracking",
                  color: "text-green-600 dark:text-green-400"
                },
                {
                  icon: BarChart3,
                  title: "AI-Powered Insights",
                  description: "Predictive analytics for churn risk, upsell opportunities, and attendance",
                  color: "text-purple-600 dark:text-purple-400"
                },
                {
                  icon: Shield,
                  title: "Compliance Ready",
                  description: "Evidence capture, e-signatures, audit logs, and GDPR compliance",
                  color: "text-red-600 dark:text-red-400"
                },
                {
                  icon: Zap,
                  title: "Payment Processing",
                  description: "Stripe integration for deposits, installments, and automated receipts",
                  color: "text-yellow-600 dark:text-yellow-400"
                },
                {
                  icon: BookOpen,
                  title: "Document Hub",
                  description: "Centralized document management with versioning and smart search",
                  color: "text-indigo-600 dark:text-indigo-400"
                }
              ].map((feature, i) => (
                <Card 
                  key={i} 
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="animate-slide-in-right">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Training Centers Choose Us</h2>
                <div className="space-y-4">
                  {[
                    "Save 10+ hours per week on admin tasks",
                    "Increase student retention by 25%",
                    "Reduce no-shows with automated reminders",
                    "Streamline compliance and auditing",
                    "Accept online payments seamlessly",
                    "Mobile-first design for trainers on the go"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-lg">{benefit}</p>
                    </div>
                  ))}
                </div>
                <Link href="/contact">
                  <Button size="lg" className="mt-8 group">
                    Get Started Today
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-scale-in">
                  <div className="grid grid-cols-2 gap-4 p-8">
                    {[TrendingUp, Clock, Shield, Award].map((Icon, i) => (
                      <div 
                        key={i} 
                        className="bg-background rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <Icon className="h-12 w-12 text-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Training Center?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join leading training centers who trust our platform to manage their operations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg" variant="secondary" className="group">
                  View Our Courses
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Schedule a Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}