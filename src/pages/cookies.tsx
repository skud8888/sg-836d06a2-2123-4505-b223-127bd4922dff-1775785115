import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CookiePolicyPage() {
  const sections = [
    { id: "what-are-cookies", title: "What Are Cookies?" },
    { id: "how-we-use", title: "How We Use Cookies" },
    { id: "types-of-cookies", title: "Types of Cookies" },
    { id: "third-party", title: "Third-Party Cookies" },
    { id: "manage-cookies", title: "Managing Cookies" },
    { id: "updates", title: "Updates to This Policy" },
    { id: "contact", title: "Contact Us" }
  ];

  const cookieTypes = [
    {
      name: "Essential Cookies",
      purpose: "Required for the platform to function properly",
      examples: "Authentication, session management, security",
      canDisable: false
    },
    {
      name: "Functional Cookies",
      purpose: "Remember your preferences and settings",
      examples: "Theme preference (dark mode), language settings",
      canDisable: true
    },
    {
      name: "Analytics Cookies",
      purpose: "Help us understand how users interact with our platform",
      examples: "Page views, feature usage, performance metrics",
      canDisable: true
    },
    {
      name: "Marketing Cookies",
      purpose: "Track visits across websites for marketing purposes",
      examples: "Ad targeting, campaign effectiveness",
      canDisable: true
    }
  ];

  return (
    <>
      <SEO
        title="Cookie Policy - The Training Hub"
        description="Learn about how The Training Hub uses cookies and similar technologies. Understand your cookie preferences and choices."
      />
      <Navigation />
      
      <main className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4">Legal</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-xl text-muted-foreground mb-2">
              Last updated: April 10, 2026
            </p>
            <p className="text-muted-foreground">
              Learn how we use cookies and similar technologies on our platform.
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
                <p className="text-lg leading-relaxed mb-6">
                  This Cookie Policy explains how The Training Hub uses cookies and similar tracking technologies when you use our platform. This policy should be read alongside our Privacy Policy.
                </p>
              </section>

              {/* What Are Cookies */}
              <section id="what-are-cookies">
                <h2 className="text-3xl font-bold mb-4">What Are Cookies?</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
                  </p>
                  <p>
                    Cookies can be "session cookies" (deleted when you close your browser) or "persistent cookies" (remain on your device for a set period or until you delete them).
                  </p>
                </div>
              </section>

              {/* How We Use Cookies */}
              <section id="how-we-use">
                <h2 className="text-3xl font-bold mb-4">How We Use Cookies</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We use cookies for the following purposes:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li><strong>Authentication</strong> - To keep you logged in to your account</li>
                    <li><strong>Security</strong> - To detect and prevent security risks</li>
                    <li><strong>Preferences</strong> - To remember your settings (e.g., dark mode, language)</li>
                    <li><strong>Analytics</strong> - To understand how users interact with our platform</li>
                    <li><strong>Performance</strong> - To monitor and improve platform performance</li>
                    <li><strong>Features</strong> - To enable specific functionality you've requested</li>
                  </ul>
                </div>
              </section>

              {/* Types of Cookies */}
              <section id="types-of-cookies">
                <h2 className="text-3xl font-bold mb-4">Types of Cookies We Use</h2>
                <div className="space-y-6">
                  {cookieTypes.map((cookie, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{cookie.name}</CardTitle>
                            <CardDescription className="mt-2">{cookie.purpose}</CardDescription>
                          </div>
                          {cookie.canDisable ? (
                            <Badge variant="secondary">Optional</Badge>
                          ) : (
                            <Badge>Required</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          <strong>Examples:</strong> {cookie.examples}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Can be disabled:</strong> {cookie.canDisable ? "Yes" : "No - Required for platform functionality"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Third-Party Cookies */}
              <section id="third-party">
                <h2 className="text-3xl font-bold mb-4">Third-Party Cookies</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We use services from third-party providers who may set their own cookies:</p>
                  
                  <div className="bg-muted p-6 rounded-lg space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Supabase</h3>
                      <p>Used for authentication and database services. Cookies help maintain your login session and ensure security.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Stripe</h3>
                      <p>Used for payment processing. Stripe may set cookies to detect fraud and ensure payment security.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Vercel</h3>
                      <p>Our hosting provider may set cookies for analytics and performance monitoring.</p>
                    </div>
                  </div>

                  <p className="mt-4">
                    These third-party services have their own privacy policies and cookie policies. We recommend reviewing their policies for more information.
                  </p>
                </div>
              </section>

              {/* Managing Cookies */}
              <section id="manage-cookies">
                <h2 className="text-3xl font-bold mb-4">Managing Your Cookie Preferences</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Browser Settings</h3>
                    <p>Most web browsers allow you to control cookies through their settings. You can:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>View which cookies are stored on your device</li>
                      <li>Delete cookies individually or all at once</li>
                      <li>Block cookies from specific websites</li>
                      <li>Block all third-party cookies</li>
                      <li>Clear all cookies when you close your browser</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Browser-Specific Instructions</h3>
                    <div className="bg-muted p-6 rounded-lg space-y-2">
                      <p><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</p>
                      <p><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</p>
                      <p><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</p>
                      <p><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Impact of Disabling Cookies</h3>
                    <p>
                      Please note that disabling certain cookies may affect your ability to use some features of our platform. Essential cookies cannot be disabled as they are necessary for the platform to function.
                    </p>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg mt-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Manage Your Preferences</h3>
                    <p className="mb-4">Update your cookie preferences in your account settings.</p>
                    <Button>Go to Account Settings</Button>
                  </div>
                </div>
              </section>

              {/* Updates */}
              <section id="updates">
                <h2 className="text-3xl font-bold mb-4">Updates to This Policy</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section id="contact">
                <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>If you have questions about our use of cookies, please contact us:</p>
                  <div className="bg-muted p-6 rounded-lg mt-4">
                    <p><strong>The Training Hub</strong></p>
                    <p>Email: <a href="mailto:privacy@thetraininghub.com.au" className="text-primary hover:underline">privacy@thetraininghub.com.au</a></p>
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