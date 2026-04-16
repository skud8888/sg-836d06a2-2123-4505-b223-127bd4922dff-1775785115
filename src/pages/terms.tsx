import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TermsOfServicePage() {
  const sections = [
    { id: "acceptance", title: "Acceptance of Terms" },
    { id: "services", title: "Description of Services" },
    { id: "accounts", title: "User Accounts" },
    { id: "usage", title: "Acceptable Use" },
    { id: "payments", title: "Payments and Billing" },
    { id: "intellectual-property", title: "Intellectual Property" },
    { id: "user-content", title: "User Content" },
    { id: "termination", title: "Termination" },
    { id: "warranties", title: "Disclaimers and Warranties" },
    { id: "liability", title: "Limitation of Liability" },
    { id: "disputes", title: "Dispute Resolution" },
    { id: "changes", title: "Changes to Terms" },
    { id: "contact", title: "Contact Information" }
  ];

  return (
    <>
      <SEO
        title="Terms of Service - The Training Hub"
        description="Read the Terms of Service for The Training Hub platform. Understand your rights and responsibilities when using our services."
      />
      <Navigation />
      
      <main className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4">Legal</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-muted-foreground mb-2">
              Last updated: April 10, 2026
            </p>
            <p className="text-muted-foreground">
              Please read these terms carefully before using our platform.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Contents</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {section.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 space-y-12">
              
              {/* Introduction */}
              <section>
                <p className="text-lg leading-relaxed">
                  These Terms of Service ("Terms") govern your access to and use of The Training Hub platform ("Service"). By accessing or using the Service, you agree to be bound by these Terms.
                </p>
              </section>

              {/* Acceptance */}
              <section id="acceptance">
                <h2 className="text-3xl font-bold mb-4">Acceptance of Terms</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    By creating an account or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Service.
                  </p>
                  <p>
                    You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that you are at least 18 years of age.
                  </p>
                </div>
              </section>

              {/* Services */}
              <section id="services">
                <h2 className="text-3xl font-bold mb-4">Description of Services</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>The Training Hub provides a comprehensive training management platform that includes:</p>
                </div>
              </section>

              {/* User Accounts */}
              <section id="accounts">
                <h2 className="text-3xl font-bold mb-4">User Accounts</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Account Creation</h3>
                    <p>To use certain features of the Service, you must create an account. You agree to:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Provide accurate and complete information</li>
                      <li>Maintain the security of your password</li>
                      <li>Promptly update your account information</li>
                      <li>Accept responsibility for all activities under your account</li>
                      <li>Notify us immediately of any unauthorized access</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Account Types</h3>
                    <p>We offer different account types with varying permissions:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Super Admin - Full platform access and configuration</li>
                      <li>Admin - Administrative access to manage operations</li>
                      <li>Trainer - Access to courses and student information</li>
                      <li>Receptionist - Booking and enrollment management</li>
                      <li>Student - Personal portal and course access</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Acceptable Use */}
              <section id="usage">
                <h2 className="text-3xl font-bold mb-4">Acceptable Use</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>You agree not to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                    <li>Upload malicious code or viruses</li>
                    <li>Attempt to gain unauthorized access to the Service</li>
                    <li>Interfere with the proper functioning of the Service</li>
                    <li>Use the Service for any illegal or unauthorized purpose</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Impersonate any person or entity</li>
                    <li>Collect or store personal data of other users without consent</li>
                  </ul>
                </div>
              </section>

              {/* Payments */}
              <section id="payments">
                <h2 className="text-3xl font-bold mb-4">Payments and Billing</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Subscription Plans</h3>
                    <p>We offer various subscription plans with different features and pricing. You agree to:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Pay all fees associated with your chosen plan</li>
                      <li>Provide valid payment information</li>
                      <li>Authorize automatic billing for recurring subscriptions</li>
                      <li>Review and accept our pricing and billing terms</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Payment Processing</h3>
                    <p>
                      All payments are processed securely through Stripe. We do not store your payment card information on our servers. By making a payment, you agree to Stripe's terms and conditions.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Refunds</h3>
                    <p>
                      Subscription fees are non-refundable except as required by law. If you cancel your subscription, you will continue to have access until the end of your current billing period.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Price Changes</h3>
                    <p>
                      We reserve the right to change our pricing at any time. We will provide at least 30 days' notice of any price changes for existing subscriptions.
                    </p>
                  </div>
                </div>
              </section>

              {/* Intellectual Property */}
              <section id="intellectual-property">
                <h2 className="text-3xl font-bold mb-4">Intellectual Property</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    The Service and its original content, features, and functionality are owned by The Training Hub and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                  </p>
                </div>
              </section>

              {/* User Content */}
              <section id="user-content">
                <h2 className="text-3xl font-bold mb-4">User Content</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    You retain ownership of any content you upload to the Service ("User Content"). By uploading User Content, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and display your content solely for the purpose of providing the Service.
                  </p>
                  <p>You represent and warrant that:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>You own or have the right to upload the User Content</li>
                    <li>Your User Content does not violate any third-party rights</li>
                    <li>Your User Content complies with these Terms</li>
                  </ul>
                  <p className="mt-4">
                    We reserve the right to remove any User Content that violates these Terms or is otherwise objectionable.
                  </p>
                </div>
              </section>

              {/* Termination */}
              <section id="termination">
                <h2 className="text-3xl font-bold mb-4">Termination</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    You may terminate your account at any time by contacting us or using the account settings. We may terminate or suspend your account immediately, without prior notice, if you breach these Terms.
                  </p>
                  <p>Upon termination:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Your right to use the Service will immediately cease</li>
                    <li>We may delete your account and User Content</li>
                    <li>You remain responsible for all fees incurred before termination</li>
                    <li>You must cease all use of our intellectual property</li>
                  </ul>
                </div>
              </section>

              {/* Warranties */}
              <section id="warranties">
                <h2 className="text-3xl font-bold mb-4">Disclaimers and Warranties</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="uppercase font-semibold">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                  </p>
                  <p>
                    We do not warrant that:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>The Service will be uninterrupted or error-free</li>
                    <li>Defects will be corrected</li>
                    <li>The Service is free of viruses or harmful components</li>
                    <li>Results from using the Service will meet your requirements</li>
                  </ul>
                </div>
              </section>

              {/* Liability */}
              <section id="liability">
                <h2 className="text-3xl font-bold mb-4">Limitation of Liability</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE TRAINING HUB SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                  </p>
                  <p>
                    Our total liability shall not exceed the amount you paid to us in the 12 months preceding the claim.
                  </p>
                </div>
              </section>

              {/* Disputes */}
              <section id="disputes">
                <h2 className="text-3xl font-bold mb-4">Dispute Resolution</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of Queensland, Australia, without regard to its conflict of law provisions.
                  </p>
                  <p>
                    Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in Queensland, Australia, except where prohibited by law.
                  </p>
                </div>
              </section>

              {/* Changes */}
              <section id="changes">
                <h2 className="text-3xl font-bold mb-4">Changes to Terms</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting a notice on our platform or sending an email to your registered address.
                  </p>
                  <p>
                    Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section id="contact">
                <h2 className="text-3xl font-bold mb-4">Contact Information</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>If you have questions about these Terms, please contact us:</p>
                  <div className="bg-muted p-6 rounded-lg mt-4">
                    <p><strong>The Training Hub</strong></p>
                    <p>Email: <a href="mailto:legal@thetraininghub.com.au" className="text-primary hover:underline">legal@thetraininghub.com.au</a></p>
                  </div>
                </div>
              </section>

              {/* Back to Top */}
              <div className="text-center pt-8 border-t">
                <a href="#" className="text-primary hover:underline">Back to Top ↑</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}