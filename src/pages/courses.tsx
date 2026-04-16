import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { LoginModal } from "@/components/LoginModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  Clock,
  Users,
  DollarSign,
  Calendar,
  BookOpen,
  ArrowRight,
  Filter,
  X,
  CheckCircle,
  MapPin,
  Award,
  FileText,
  GraduationCap
} from "lucide-react";

interface Course {
  id: string;
  name: string;
  description: string;
  duration_hours: number;
  price_full: number;
  price_deposit: number;
  max_students: number;
  created_at: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    loadCourses();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCourses(data || []);
    } catch (err: any) {
      console.error("Error loading courses:", err);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setPreviewModalOpen(true);
  };

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      setPreviewModalOpen(false);
      setLoginModalOpen(true);
    } else if (selectedCourse) {
      router.push(`/enroll/${selectedCourse.id}`);
    }
  };

  const filteredCourses = courses.filter(course => {
    return course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           course.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <SEO
        title="Training Courses - The Training Hub"
        description="Browse our comprehensive training courses"
      />

      <Navigation />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Our Training Courses
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Professional training programs designed to help you succeed
              </p>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {!isAuthenticated && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium mb-1">Guest Preview Mode</p>
                      <p className="text-muted-foreground">
                        Click any course to preview. Sign in to enroll and access full course materials.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-12 pb-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Check back soon for new courses"}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                      }}
                    >
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card 
                    key={course.id} 
                    className="flex flex-col hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleCourseClick(course)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {course.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="line-clamp-3">
                        {course.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration_hours} hours</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Max {course.max_students} students</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-lg">${course.price_full}</span>
                          {course.price_deposit > 0 && (
                            <span className="text-sm text-muted-foreground">
                              or ${course.price_deposit} deposit
                            </span>
                          )}
                        </div>
                      </div>

                      <Button className="w-full group-hover:bg-primary group-hover:scale-105 transition-all">
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary/5 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Can&apos;t Find What You&apos;re Looking For?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Contact us to discuss custom training programs tailored to your needs
            </p>
            <Link href="/contact">
              <Button size="lg">
                Contact Us
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Course Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedCourse.name}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedCourse.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Course Highlights */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">{selectedCourse.duration_hours} hours of training</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Class Size</p>
                      <p className="text-sm text-muted-foreground">Maximum {selectedCourse.max_students} students per class</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Award className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Certification</p>
                      <p className="text-sm text-muted-foreground">Certificate upon completion</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Materials</p>
                      <p className="text-sm text-muted-foreground">All course materials included</p>
                    </div>
                  </div>
                </div>

                {/* What You'll Learn */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">What You&apos;ll Learn</h3>
                  <ul className="space-y-2">
                    {[
                      "Comprehensive understanding of course fundamentals",
                      "Hands-on practical experience with real-world scenarios",
                      "Industry best practices and safety protocols",
                      "Assessment preparation and certification guidance"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pricing */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Course Fee</p>
                      <p className="text-3xl font-bold">${selectedCourse.price_full}</p>
                      {selectedCourse.price_deposit > 0 && (
                        <p className="text-sm text-muted-foreground">
                          or ${selectedCourse.price_deposit} deposit + installments
                        </p>
                      )}
                    </div>
                  </div>

                  {!isAuthenticated && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-900 dark:text-amber-100">
                        <strong>Sign in required:</strong> You need to sign in or create an account to enroll in this course.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1" 
                      size="lg"
                      onClick={handleEnrollClick}
                    >
                      {isAuthenticated ? "Enroll Now" : "Sign In to Enroll"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => setPreviewModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <LoginModal 
        open={loginModalOpen} 
        onOpenChange={setLoginModalOpen}
        defaultTab="student"
      />
    </>
  );
}