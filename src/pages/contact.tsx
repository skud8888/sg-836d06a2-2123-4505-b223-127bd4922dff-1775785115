import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save enquiry to database
      const { error: dbError } = await supabase
        .from("enquiries")
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          course_interest: formData.subject,
          message: formData.message,
          status: "new"
        });

      if (dbError) throw dbError;

      // Show success state
      setSubmitted(true);
      
      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });

    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "info@gtstraining.com.au",
      detail: "We typically respond within 24 hours",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "1300 XXX XXX",
      detail: "Mon-Fri, 9:00 AM - 5:00 PM AEST",
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Queensland, Australia",
      detail: "By appointment only",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: Clock,
      title: "Business Hours",
      description: "Monday - Friday",
      detail: "9:00 AM - 5:00 PM AEST",
      color: "text-purple-600 dark:text-purple-400"
    }
  ];

  const faqs = [
    {
      question: "How long does setup take?",
      answer: "Most training centers are up and running within 24-48 hours. Our team will guide you through the entire setup process."
    },
    {
      question: "Can I import existing student data?",
      answer: "Yes! We support bulk import from CSV files and can help migrate data from most common training management systems."
    },
    {
      question: "Is training provided?",
      answer: "Absolutely. We offer comprehensive onboarding, video tutorials, and ongoing support to ensure your team is confident using the platform."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and bank transfers. All payments are processed securely through Stripe."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel anytime. You'll continue to have access until the end of your current billing period with no additional charges."
    },
    {
      question: "Do you offer a free trial?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start."
    }
  ];

  return (
    <>
      <SEO
        title="Contact Us - GTS Training Centre"
        description="Get in touch with GTS Training Centre. Request a demo, ask questions, or speak with our team about how we can help transform your training operations."
      />
      <Navigation />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4">Contact Us</Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Let's Transform Your Training Center Together
              </h1>
              <p className="text-xl text-muted-foreground">
                Have questions? Want to see a demo? Our team is here to help you get started.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {contactMethods.map((method, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-lg bg-background border border-current/20 flex items-center justify-center mx-auto mb-4 ${method.color}`}>
                      <method.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{method.title}</CardTitle>
                    <CardDescription className="text-base font-semibold text-foreground">
                      {method.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{method.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-bold mb-4">Send Us a Message</h2>
                <p className="text-muted-foreground mb-8">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>

                {submitted ? (
                  <Card className="border-green-500/50 bg-green-500/10">
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                        <p className="text-muted-foreground mb-6">
                          Your message has been sent successfully. We'll be in touch soon!
                        </p>
                        <Button onClick={() => setSubmitted(false)} variant="outline">
                          Send Another Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                          Full Name *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-2">
                          Phone Number
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="1300 XXX XXX"
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium mb-2">
                          Subject *
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Request a demo"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your training center and how we can help..."
                        rows={6}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      By submitting this form, you agree to our{" "}
                      <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                    </p>
                  </form>
                )}
              </div>

              {/* FAQ Section */}
              <div>
                <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-muted-foreground mb-8">
                  Quick answers to common questions about our platform.
                </p>

                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="mt-6 bg-primary text-primary-foreground">
                  <CardHeader>
                    <CardTitle>Still have questions?</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                      Our team is available Monday-Friday, 9 AM - 5 PM AEST
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        info@gtstraining.com.au
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        1300 XXX XXX
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}