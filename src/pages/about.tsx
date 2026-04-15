import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Award, Target, Heart, Users, TrendingUp, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About Us - The Training Hub"
        description="Learn about The Training Hub's mission, values, and commitment to excellence in training and education"
      />
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Building Better Futures Through Quality Training
              </h1>
              <p className="text-xl text-muted-foreground">
                For over 15 years, we've been committed to delivering exceptional training experiences 
                that transform careers and change lives.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Mission & Values</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Target,
                    title: "Our Mission",
                    description: "To provide world-class training that equips individuals with the skills and confidence they need to succeed in their careers."
                  },
                  {
                    icon: Heart,
                    title: "Student-Centered",
                    description: "Every decision we make puts our students first. Your success is our success, and we're committed to your journey."
                  },
                  {
                    icon: Award,
                    title: "Excellence",
                    description: "We maintain the highest standards in training delivery, trainer expertise, and student support services."
                  }
                ].map((value, i) => (
                  <Card key={i} className="text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <CardContent className="pt-8 pb-8">
                      <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <value.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Impact</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { icon: Users, value: "10,000+", label: "Students Trained" },
                  { icon: Award, value: "98%", label: "Success Rate" },
                  { icon: TrendingUp, value: "500+", label: "Courses Delivered" },
                  { icon: Shield, value: "15+", label: "Years Experience" }
                ].map((stat, i) => (
                  <div key={i} className="text-center animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
                      <stat.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="text-4xl font-bold mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose The Training Hub?</h2>
              
              <div className="space-y-6">
                {[
                  {
                    title: "Industry-Leading Trainers",
                    description: "All our trainers are industry professionals with real-world experience and recognized qualifications."
                  },
                  {
                    title: "Modern Learning Environment",
                    description: "State-of-the-art facilities equipped with the latest tools and technology to support your learning."
                  },
                  {
                    title: "Flexible Learning Options",
                    description: "Choose from classroom, online, or blended learning options to fit your schedule and learning style."
                  },
                  {
                    title: "Career Support Services",
                    description: "Comprehensive career guidance, job placement assistance, and ongoing alumni support."
                  },
                  {
                    title: "Nationally Recognized Qualifications",
                    description: "Earn certificates and qualifications that are recognized and valued by employers nationwide."
                  }
                ].map((item, i) => (
                  <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of successful graduates who have transformed their careers with The Training Hub
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg" variant="secondary">
                  Browse Courses
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}