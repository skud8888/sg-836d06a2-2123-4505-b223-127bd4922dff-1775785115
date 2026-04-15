import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Filter
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

  useEffect(() => {
    loadCourses();
  }, []);

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
                </div>
              </div>
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
                  <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl">{course.name}</CardTitle>
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

                      <Link href={`/enroll/${course.id}`}>
                        <Button className="w-full">
                          Enroll Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
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
    </>
  );
}