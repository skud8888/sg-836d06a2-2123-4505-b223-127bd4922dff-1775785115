import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const sections = [
    { id: "information-collection", title: "Information We Collect" },
    { id: "how-we-use", title: "How We Use Your Information" },
    { id: "data-storage", title: "Data Storage and Security" },
    { id: "data-sharing", title: "Data Sharing and Disclosure" },
    { id: "your-rights", title: "Your Rights" },
    { id: "cookies", title: "Cookies and Tracking" },
    { id: "children", title: "Children's Privacy" },
    { id: "changes", title: "Changes to This Policy" },
    { id: "contact", title: "Contact Us" }
  ];

  return (
    <>
      <SEO
        title="Privacy Policy - The Training Hub"
        description="Learn how The Training Hub collects, uses, and protects your personal information. GDPR compliant privacy policy."
      />
      <Navigation />
      
      <main className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4">Legal</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground mb-2">
              Last updated: April 10, 2026
            </p>
            <p className="text-muted-foreground">
              We are committed to protecting your privacy and ensuring your data is handled securely.
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
                  The Training Hub ("we", "our", or "us") operates the training management platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                </p>
              </section>

              {/* Information We Collect */}
              <section id="information-collection">
                <h2 className="text-3xl font-bold mb-4">Information We Collect</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Personal Information</h3>
                    <p>We collect information that you provide directly to us, including:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Name, email address, and contact information</li>
                      <li>Account credentials (username and password)</li>
                      <li>Payment information (processed securely through Stripe)</li>
                      <li>Profile information (photo, preferences, settings)</li>
                      <li>Course enrollment and attendance records</li>
                      <li>Documents and files you upload</li>
                      <li>Communications with our support team</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Automatically Collected Information</h3>
                    <p>When you use our platform, we automatically collect:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Device information (IP address, browser type, operating system)</li>
                      <li>Usage data (pages viewed, features used, time spent)</li>
                      <li>Log data (access times, error logs, performance metrics)</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section id="how-we-use">
                <h2 className="text-3xl font-bold mb-4">How We Use Your Information</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process your bookings and payments</li>
                    <li>Send you booking confirmations and reminders</li>
                    <li>Communicate with you about your account</li>
                    <li>Provide customer support</li>
                    <li>Analyze usage patterns and improve user experience</li>
                    <li>Prevent fraud and ensure platform security</li>
                    <li>Comply with legal obligations</li>
                    <li>Send marketing communications (with your consent)</li>
                  </ul>
                </div>
              </section>

              {/* Data Storage and Security */}
              <section id="data-storage">
                <h2 className="text-3xl font-bold mb-4">Data Storage and Security</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We implement appropriate technical and organizational measures to protect your data:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Data is stored on secure servers (Supabase) with encryption at rest</li>
                    <li>All data transmission is encrypted using SSL/TLS</li>
                    <li>Access to personal data is restricted to authorized personnel only</li>
                    <li>We conduct regular security audits and vulnerability assessments</li>
                    <li>Automated backups are performed daily with 30-day retention</li>
                    <li>Multi-factor authentication available for enhanced security</li>
                  </ul>
                  <p className="mt-4">
                    While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                  </p>
                </div>
              </section>

              {/* Data Sharing */}
              <section id="data-sharing">
                <h2 className="text-3xl font-bold mb-4">Data Sharing and Disclosure</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We may share your information in the following circumstances:</p>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Service Providers</h3>
                    <p>We share data with third-party service providers who help us operate our platform:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li><strong>Supabase</strong> - Database and authentication services</li>
                      <li><strong>Stripe</strong> - Payment processing</li>
                      <li><strong>Vercel</strong> - Hosting and deployment</li>
                      <li><strong>Email service providers</strong> - Sending notifications and receipts</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Legal Requirements</h3>
                    <p>We may disclose your information if required by law or in response to:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Court orders or legal processes</li>
                      <li>Government or regulatory requests</li>
                      <li>Enforcement of our terms of service</li>
                      <li>Protection of our rights, property, or safety</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Business Transfers</h3>
                    <p>If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section id="your-rights">
                <h2 className="text-3xl font-bold mb-4">Your Rights</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Under GDPR and other privacy laws, you have the following rights:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li><strong>Access</strong> - Request a copy of your personal data</li>
                    <li><strong>Rectification</strong> - Correct inaccurate or incomplete data</li>
                    <li><strong>Erasure</strong> - Request deletion of your personal data</li>
                    <li><strong>Restriction</strong> - Restrict processing of your data</li>
                    <li><strong>Portability</strong> - Receive your data in a machine-readable format</li>
                    <li><strong>Objection</strong> - Object to processing of your data</li>
                    <li><strong>Withdraw consent</strong> - Withdraw consent for data processing</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, please contact us at <a href="mailto:privacy@gtstraining.com.au" className="text-primary hover:underline">privacy@gtstraining.com.au</a>
                  </p>
                </div>
              </section>

              {/* Cookies */}
              <section id="cookies">
                <h2 className="text-3xl font-bold mb-4">Cookies and Tracking</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We use cookies and similar tracking technologies to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Keep you logged in to your account</li>
                    <li>Remember your preferences and settings</li>
                    <li>Analyze usage patterns and improve our platform</li>
                    <li>Provide personalized content and features</li>
                  </ul>
                  <p className="mt-4">
                    You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our platform. Learn more in our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
                  </p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section id="children">
                <h2 className="text-3xl font-bold mb-4">Children's Privacy</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Our platform is designed for training centers and adult learners. We do not knowingly collect personal information from children under 13 years of age. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                  </p>
                </div>
              </section>

              {/* Changes to Policy */}
              <section id="changes">
                <h2 className="text-3xl font-bold mb-4">Changes to This Policy</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section id="contact">
                <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
                  <div className="bg-muted p-6 rounded-lg mt-4">
                    <p><strong>The Training Hub</strong></p>
                    <p>Email: <a href="mailto:privacy@thetraininghub.com.au" className="text-primary hover:underline">privacy@thetraininghub.com.au</a></p>
                    <p>Phone: 1300 XXX XXX</p>
                    <p>Address: Queensland, Australia</p>
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