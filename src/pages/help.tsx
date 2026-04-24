import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Search,
  MessageCircle,
  Book,
  Video,
  Download,
  Mail,
  Phone,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import Image from "next/image";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      id: "student",
      title: "For Students",
      icon: GraduationCap,
      color: "text-blue-600 dark:text-blue-400",
      articles: 12
    },
    {
      id: "trainer",
      title: "For Trainers",
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      articles: 8
    },
    {
      id: "admin",
      title: "For Admins",
      icon: Settings,
      color: "text-purple-600 dark:text-purple-400",
      articles: 15
    }
  ];

  const studentFAQs = [
    {
      question: "How do I enroll in a course?",
      answer: "Browse available courses on the Courses page, select a course, choose a class date/time, and complete the booking form. You'll receive a confirmation email with payment instructions."
    },
    {
      question: "How do I make a payment?",
      answer: "After booking, click the 'Pay Now' button in your confirmation email or Student Portal. You'll be redirected to our secure Stripe payment page. We accept all major credit and debit cards."
    },
    {
      question: "Can I get a refund if I cancel?",
      answer: "Refund policies vary by course. Generally, full refunds are available up to 7 days before the course start date. Check your booking confirmation or contact support for specific details."
    },
    {
      question: "How do I access my course materials?",
      answer: "Log in to the Student Portal, navigate to 'My Courses', and click on your enrolled course. All materials, videos, and resources will be available there."
    },
    {
      question: "How do I download my certificate?",
      answer: "After completing your course, go to Student Portal → My Certificates. Click the 'Download' button next to your certificate. Certificates are automatically generated upon course completion."
    },
    {
      question: "What if I miss a class?",
      answer: "Contact your trainer or support team as soon as possible. Depending on the course, you may be able to attend a makeup session or access recorded materials."
    },
    {
      question: "How do I reset my password?",
      answer: "Click 'Forgot Password' on the login page, enter your email, and you'll receive a password reset link. Follow the instructions in the email to create a new password."
    },
    {
      question: "Can I change my enrollment details?",
      answer: "Yes! Go to Student Portal → My Bookings, click on the booking you want to modify, and use the 'Edit' option. For major changes, contact support."
    }
  ];

  const trainerFAQs = [
    {
      question: "How do I take attendance for my class?",
      answer: "Use the Field Worker Mobile app or login at /field. Find your class, tap 'Take Attendance', check off students who are present, and save. Attendance syncs automatically."
    },
    {
      question: "How do I upload class evidence/photos?",
      answer: "In the Field app, navigate to your class → Evidence → Capture Photo or Upload. Tag photos with descriptions and student names as needed."
    },
    {
      question: "When do I get paid?",
      answer: "Instructor payouts are processed monthly on the 1st. Check Admin Dashboard → Instructor Payouts to view your earnings history and pending payments."
    },
    {
      question: "How do I answer student questions in forums?",
      answer: "Go to the course page → Discussion Forum. You'll see student questions marked with a '?' icon. Click to view and type your response."
    },
    {
      question: "Can I work offline?",
      answer: "Yes! The Field Worker app has full offline support. Take attendance and upload evidence without internet. Data syncs automatically when you're back online."
    },
    {
      question: "How do I update my availability?",
      answer: "Contact your admin or go to Profile → Availability Settings. Mark dates you're unavailable, and the system won't schedule you for classes during those times."
    }
  ];

  const adminFAQs = [
    {
      question: "How do I create a new course?",
      answer: "Go to Admin Dashboard → Courses → 'Create New Course'. Fill in course details, set pricing, add description and image, then save. The course will appear in the public course catalog."
    },
    {
      question: "How do I schedule a class?",
      answer: "Admin Dashboard → Calendar → Click a date → 'Schedule New Class'. Select course template, assign trainer, set time/location, and save. Students can now book this class."
    },
    {
      question: "How do I manage user roles?",
      answer: "Admin Dashboard → User Management → Select user → 'Edit Roles'. Assign roles (Student, Trainer, Admin, Super Admin). Changes apply immediately."
    },
    {
      question: "How do I generate certificates?",
      answer: "Admin Dashboard → Certificates → Select completed bookings → 'Generate Certificates'. Certificates are auto-sent to students and available for download."
    },
    {
      question: "How do I view payment reports?",
      answer: "Admin Dashboard → Analytics → Payments tab. View revenue charts, filter by date range, export to Excel/PDF for accounting."
    },
    {
      question: "How do I backup the database?",
      answer: "Admin Dashboard → Backups (Super Admin only). Click 'Create Backup Now'. Backups are stored securely and can be restored if needed."
    },
    {
      question: "How do I send signature requests?",
      answer: "Admin Dashboard → Bookings → Select booking → Signatures tab → 'Send Signature Request'. Student receives email with signing link."
    },
    {
      question: "How do I handle enquiries?",
      answer: "Admin Dashboard → Enquiries. View all contact form submissions, mark as resolved, and send responses directly from the interface."
    }
  ];

  const gettingStartedGuides = [
    {
      title: "Student Quick Start",
      description: "Learn how to browse courses, enroll, and access your materials",
      icon: GraduationCap,
      link: "#student-guide",
      time: "5 min"
    },
    {
      title: "Trainer Onboarding",
      description: "Get started with class management and the Field Worker app",
      icon: Users,
      link: "#trainer-guide",
      time: "10 min"
    },
    {
      title: "Admin Setup Guide",
      description: "Complete guide to setting up courses, schedules, and managing users",
      icon: Settings,
      link: "#admin-guide",
      time: "15 min"
    },
    {
      title: "Payment Processing",
      description: "Understand how payments work, refunds, and Stripe integration",
      icon: CreditCard,
      link: "#payment-guide",
      time: "7 min"
    }
  ];

  const videoTutorials = [
    {
      title: "How to Enroll in a Course",
      duration: "3:45",
      category: "Student",
      thumbnail: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=400",
      videoId: "dQw4w9WgXcQ"
    },
    {
      title: "Taking Attendance with Field Worker App",
      duration: "5:20",
      category: "Trainer",
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400",
      videoId: "dQw4w9WgXcQ"
    },
    {
      title: "Creating and Scheduling Classes",
      duration: "8:15",
      category: "Admin",
      thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400",
      videoId: "dQw4w9WgXcQ"
    }
  ];

  return (
    <>
      <SEO
        title="Help Center - The Training Hub"
        description="Find answers to common questions about The Training Hub platform"
      />
      <Navigation />

      <div className="min-h-screen bg-background pt-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <HelpCircle className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Find answers, watch tutorials, and get the support you need
            </p>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for help articles, guides, and FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`h-12 w-12 rounded-lg bg-background flex items-center justify-center ${category.color}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{category.title}</CardTitle>
                      <CardDescription>{category.articles} articles</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="faq" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
              <TabsTrigger value="faq">
                <BookOpen className="h-4 w-4 mr-2" />
                FAQs
              </TabsTrigger>
              <TabsTrigger value="guides">
                <FileText className="h-4 w-4 mr-2" />
                Guides
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

                <div className="space-y-8">
                  {/* Student FAQs */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      <h3 className="text-xl font-semibold">For Students</h3>
                      <Badge variant="secondary">{studentFAQs.length}</Badge>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {studentFAQs.map((faq, index) => (
                        <AccordionItem key={index} value={`student-${index}`}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>

                  {/* Trainer FAQs */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-green-600" />
                      <h3 className="text-xl font-semibold">For Trainers</h3>
                      <Badge variant="secondary">{trainerFAQs.length}</Badge>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {trainerFAQs.map((faq, index) => (
                        <AccordionItem key={index} value={`trainer-${index}`}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>

                  {/* Admin FAQs */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="h-5 w-5 text-purple-600" />
                      <h3 className="text-xl font-semibold">For Admins</h3>
                      <Badge variant="secondary">{adminFAQs.length}</Badge>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {adminFAQs.map((faq, index) => (
                        <AccordionItem key={index} value={`admin-${index}`}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Guides Tab */}
            <TabsContent value="guides">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Getting Started Guides</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {gettingStartedGuides.map((guide, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <guide.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="mb-2">{guide.title}</CardTitle>
                            <CardDescription>{guide.description}</CardDescription>
                            <div className="flex items-center gap-4 mt-4">
                              <Badge variant="outline">{guide.time}</Badge>
                              <Link href={guide.link} className="text-primary hover:underline text-sm font-medium">
                                Read Guide →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Video Tutorials</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videoTutorials.map((video, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer">
                      <div className="relative aspect-video bg-muted">
                        <Image
                          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
                          alt="Platform tutorial"
                          width={800}
                          height={450}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader>
                        <Badge variant="outline" className="w-fit mb-2">{video.category}</Badge>
                        <CardTitle className="text-lg">{video.title}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Contact Support Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Still Need Help?</CardTitle>
                    <CardDescription>Our support team is here to assist you</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/contact">
                    <Button className="w-full" size="lg">
                      <Mail className="h-5 w-5 mr-2" />
                      Send us a message
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="w-full">
                    <Phone className="h-5 w-5 mr-2" />
                    Call Support
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Average response time: 2 hours during business hours
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}