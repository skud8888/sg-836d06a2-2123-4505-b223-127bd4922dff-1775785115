import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Users,
  DollarSign,
  ArrowRight,
  Star,
  Loader2,
  BookOpen,
  Heart
} from "lucide-react";

interface FeaturedCourse {
  id: string;
  name: string;
  description: string;
  duration_hours: number;
  price_full: number;
  price_deposit: number;
  max_students: number;
}

export function FeaturedCoursesSection() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    
    if (session) {
      loadWishlist(session.user.id);
    }
  }, []);

  useEffect(() => {
    loadFeaturedCourses();
    checkAuth();
  }, [checkAuth]);

  const loadWishlist = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("course_wishlist")
        .select("course_template_id")
        .eq("student_id", userId);

      setWishlistIds(data?.map(w => w.course_template_id) || []);
    } catch (err) {
      console.error("Error loading wishlist:", err);
    }
  };

  const loadFeaturedCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("course_templates")
        .select("*")
        .eq("is_featured", true)
        .order("featured_order")
        .limit(3);

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error("Error loading featured courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      router.push("/admin/login");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isInWishlist = wishlistIds.includes(courseId);

      if (isInWishlist) {
        await supabase
          .from("course_wishlist")
          .delete()
          .eq("student_id", user.id)
          .eq("course_template_id", courseId);

        setWishlistIds(prev => prev.filter(id => id !== courseId));
      } else {
        await supabase
          .from("course_wishlist")
          .insert({
            student_id: user.id,
            course_template_id: courseId
          });

        setWishlistIds(prev => [...prev, courseId]);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium mb-4">
            <Star className="h-4 w-4 fill-current" />
            Featured Courses
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Popular Training Programs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our most sought-after courses, hand-picked for career advancement
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-400 to-amber-600 text-white px-4 py-1 rounded-bl-lg text-xs font-bold">
                FEATURED
              </div>
              
              <CardHeader className="pt-8">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {course.name}
                  </CardTitle>
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => toggleWishlist(course.id, e)}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          wishlistIds.includes(course.id)
                            ? "fill-red-600 text-red-600"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  )}
                </div>
                <CardDescription className="line-clamp-3">
                  {course.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
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
                  <Button className="w-full group-hover:bg-primary group-hover:scale-105 transition-all">
                    Enroll Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/courses">
            <Button variant="outline" size="lg">
              <BookOpen className="h-5 w-5 mr-2" />
              View All Courses
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}