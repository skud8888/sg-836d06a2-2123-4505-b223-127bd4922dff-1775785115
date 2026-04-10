import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { CheckCircle, X, HelpCircle, Zap } from "lucide-react";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small training centers getting started",
      price: { monthly: 0, annual: 0 },
      priceLabel: "Free",
      features: [
        "Up to 50 active students",
        "Basic booking system",
        "Email notifications",
        "Student portal access",
        "Document storage (1GB)",
        "Community support",
        "Mobile responsive",
        "Dark mode"
      ],
      limitations: [
        "No payment processing",
        "No e-signatures",
        "No AI insights",
        "Limited customization"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Professional",
      description: "For growing training centers ready to scale",
      price: { monthly: 149, annual: 1490 },
      priceLabel: annual ? "$124/mo" : "$149/mo",
      savingsLabel: annual ? "Save $298/year" : null,
      features: [
        "Unlimited students",
        "Advanced booking system",
        "Stripe payment processing",
        "Automated invoicing & receipts",
        "E-signature workflows",
        "Document management (50GB)",
        "Evidence capture (photos)",
        "AI-powered insights",
        "Email & SMS notifications",
        "Priority support",
        "Custom branding",
        "Calendar integrations",
        "Advanced analytics",
        "Backup & recovery"
      ],
      limitations: [],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      description: "For large organizations with advanced needs",
      price: { monthly: null, annual: null },
      priceLabel: "Custom",
      features: [
        "Everything in Professional",
        "Multi-location support",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced API access",
        "White-label options",
        "Custom training programs",
        "SLA guarantee (99.9% uptime)",
        "Advanced security features",
        "Compliance reporting",
        "Unlimited storage",
        "24/7 priority support",
        "Custom contracts",
        "Dedicated infrastructure"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const comparisonFeatures = [
    {
      category: "Core Features",
      items: [
        { name: "Active Students", starter: "Up to 50", professional: "Unlimited", enterprise: "Unlimited" },
        { name: "Booking System", starter: "Basic", professional: "Advanced", enterprise: "Advanced" },
        { name: "Student Portal", starter: true, professional: true, enterprise: true },
        { name: "Email Notifications", starter: true, professional: true, enterprise: true },
        { name: "SMS Notifications", starter: false, professional: true, enterprise: true },
        { name: "Mobile App", starter: "Web only", professional: "PWA", enterprise: "PWA + Native" }
      ]
    },
    {
      category: "Payments & Billing",
      items: [
        { name: "Payment Processing", starter: false, professional: true, enterprise: true },
        { name: "Automated Invoicing", starter: false, professional: true, enterprise: true },
        { name: "Receipt Generation", starter: false, professional: true, enterprise: true },
        { name: "Payment Plans", starter: false, professional: true, enterprise: true },
        { name: "Multi-Currency", starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: "Advanced Features",
      items: [
        { name: "E-Signatures", starter: false, professional: true, enterprise: true },
        { name: "Evidence Capture", starter: false, professional: true, enterprise: true },
        { name: "AI Insights", starter: false, professional: true, enterprise: true },
        { name: "Custom Branding", starter: false, professional: true, enterprise: true },
        { name: "API Access", starter: false, professional: "Read-only", enterprise: "Full" },
        { name: "White-label", starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: "Storage & Support",
      items: [
        { name: "Document Storage", starter: "1GB", professional: "50GB", enterprise: "Unlimited" },
        { name: "Backup Retention", starter: "7 days", professional: "30 days", enterprise: "Custom" },
        { name: "Support", starter: "Community", professional: "Priority", enterprise: "24/7 Dedicated" },
        { name: "Onboarding", starter: "Self-service", professional: "Guided", enterprise: "White-glove" }
      ]
    }
  ];

  const faqs = [
    {
      question: "Can I change plans later?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the end of your current billing period."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, Amex) and debit cards. Enterprise customers can also pay via bank transfer or invoice."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees for any plan. You only pay the monthly or annual subscription price. Enterprise customers may have custom pricing based on their requirements."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period. No cancellation fees."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 14-day money-back guarantee for annual plans. If you're not satisfied within the first 14 days, we'll refund your payment in full."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "You can export all your data before cancelling. We retain your data for 30 days after cancellation in case you want to reactivate. After 30 days, data is permanently deleted."
    },
    {
      question: "Do you offer discounts for non-profits?",
      answer: "Yes! We offer a 25% discount for registered non-profit organizations and educational institutions. Contact our sales team to learn more."
    },
    {
      question: "Can I try before I buy?",
      answer: "Absolutely! The Starter plan is completely free forever. For Professional and Enterprise, we offer a 14-day free trial with full access to all features."
    }
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <>
      <SEO
        title="Pricing - GTS Training Centre"
        description="Simple, transparent pricing for training centers of all sizes. Start free or choose a plan that fits your needs. No hidden fees."
      />
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4">Pricing</Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Choose the perfect plan for your training center. Start free, upgrade as you grow.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <span className={`text-sm ${!annual ? "font-semibold" : "text-muted-foreground"}`}>
                  Monthly
                </span>
                <Switch
                  checked={annual}
                  onCheckedChange={setAnnual}
                />
                <span className={`text-sm ${annual ? "font-semibold" : "text-muted-foreground"}`}>
                  Annual
                  <Badge variant="secondary" className="ml-2">Save 17%</Badge>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
              {plans.map((plan, index) => (
                <Card 
                  key={index}
                  className={`relative ${plan.popular ? "border-primary shadow-xl scale-105" : "border-border/50"} hover:shadow-lg transition-all`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Zap className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-8 pt-6">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="mb-4">{plan.description}</CardDescription>
                    <div className="mb-2">
                      <span className="text-4xl font-bold">{plan.priceLabel}</span>
                      {plan.price.annual !== null && (
                        <span className="text-muted-foreground ml-2">
                          {annual ? "/year" : "/month"}
                        </span>
                      )}
                    </div>
                    {plan.savingsLabel && (
                      <Badge variant="secondary" className="mt-2">{plan.savingsLabel}</Badge>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4 mb-6">
                      <div>
                        <p className="text-sm font-semibold mb-3">Included features:</p>
                        <ul className="space-y-3">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {plan.limitations.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-3 text-muted-foreground">Not included:</p>
                          <ul className="space-y-3">
                            {plan.limitations.map((limitation, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <Link href="/contact">
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

            {/* Feature Comparison Table */}
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
              
              <div className="space-y-8">
                {comparisonFeatures.map((section, sectionIdx) => (
                  <div key={sectionIdx}>
                    <h3 className="text-xl font-semibold mb-4">{section.category}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 pr-4 font-medium">Feature</th>
                            <th className="text-center py-3 px-4 font-medium">Starter</th>
                            <th className="text-center py-3 px-4 font-medium">Professional</th>
                            <th className="text-center py-3 px-4 font-medium">Enterprise</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.items.map((item, itemIdx) => (
                            <tr key={itemIdx} className="border-b">
                              <td className="py-4 pr-4">{item.name}</td>
                              <td className="py-4 px-4 text-center">
                                {renderFeatureValue(item.starter)}
                              </td>
                              <td className="py-4 px-4 text-center">
                                {renderFeatureValue(item.professional)}
                              </td>
                              <td className="py-4 px-4 text-center">
                                {renderFeatureValue(item.enterprise)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-20">
              {[
                { icon: "✓", text: "14-day free trial" },
                { icon: "✓", text: "No credit card required" },
                { icon: "✓", text: "Cancel anytime" },
                { icon: "✓", text: "Money-back guarantee" }
              ].map((badge, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <p className="text-sm font-medium">{badge.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-start gap-2">
                        <HelpCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-primary" />
                        {faq.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-12 bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle>Still have questions?</CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    Our team is here to help you find the perfect plan for your training center.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/contact">
                    <Button variant="secondary" size="lg">
                      Contact Our Sales Team
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}