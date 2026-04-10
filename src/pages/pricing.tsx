import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { Check, HelpCircle } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "Contact Us",
      description: "Perfect for small training centers just getting started",
      features: [
        "Up to 100 students",
        "5 admin users",
        "Basic course scheduling",
        "Student management",
        "Email notifications",
        "Document storage (5GB)",
        "Community support"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Professional",
      price: "Contact Us",
      description: "For growing training centers with advanced needs",
      features: [
        "Up to 500 students",
        "15 admin users",
        "Advanced scheduling & calendar",
        "AI-powered insights",
        "E-signature workflows",
        "Evidence capture tool",
        "Payment processing (Stripe)",
        "Document storage (50GB)",
        "Priority email support",
        "RBAC & audit logs"
      ],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with custom requirements",
      features: [
        "Unlimited students",
        "Unlimited admin users",
        "White-label branding",
        "Custom integrations",
        "Dedicated account manager",
        "Custom training & onboarding",
        "SLA guarantee",
        "Document storage (unlimited)",
        "24/7 phone support",
        "Custom development"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "How does pricing work?",
      answer: "We offer flexible pricing based on your training center's size and needs. Contact us for a personalized quote that fits your budget and requirements."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial."
    },
    {
      question: "Can I change plans later?",
      answer: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, bank transfers, and can accommodate purchase orders for enterprise customers."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees for Starter and Professional plans. Enterprise plans may include an onboarding fee depending on customization requirements."
    },
    {
      question: "What's included in support?",
      answer: "All plans include email support. Professional plans get priority support, and Enterprise plans receive dedicated phone support with guaranteed response times."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "We offer a 30-day money-back guarantee on all plans. If you're not completely satisfied, we'll refund your payment, no questions asked."
    },
    {
      question: "Do you offer discounts for educational institutions?",
      answer: "Yes! We offer special pricing for non-profit educational organizations. Contact our sales team to learn more about our education discount program."
    }
  ];

  return (
    <>
      <SEO
        title="Pricing - GTS Training Centre"
        description="Simple, transparent pricing for training centers of all sizes"
      />
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-muted-foreground">
                Choose the perfect plan for your training center. All plans include core features.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, i) => (
                <Card 
                  key={i} 
                  className={`relative animate-slide-up ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link href="/contact" className="block">
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? "default" : "outline"}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">All Plans Include</h2>
              <p className="text-xl text-muted-foreground">
                Core features available in every plan
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
              {[
                "Student enrollment management",
                "Course scheduling & calendar",
                "Automated email notifications",
                "Document management system",
                "Payment tracking & receipts",
                "Mobile-responsive design",
                "Data export (CSV/Excel)",
                "Regular software updates",
                "SSL security encryption",
                "99.9% uptime guarantee"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-xl text-muted-foreground">
                  Everything you need to know about our pricing
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Our team is here to help you find the perfect plan for your training center
            </p>
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                Contact Sales Team
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}