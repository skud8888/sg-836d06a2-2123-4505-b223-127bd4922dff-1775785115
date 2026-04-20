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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  Clock,
  DollarSign,
  BookOpen,
  ArrowRight,
  Filter,
  Heart,
  Star,
  Users
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
  is_featured?: boolean;
  average_rating?: number;
  total_ratings?: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    loadCourses();
    checkAuth();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchQuery, sortBy]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    
    if (session) {
      loadWishlist(session.user.id);
    }
  };

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

  const toggleWishlist = async (courseId: string) => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isInWishlist = wishlistIds.includes(courseId);

      if (isInWishlist) {
        const { error } = await supabase
          .from("course_wishlist")
          .delete()
          .eq("student_id", user.id)
          .eq("course_template_id", courseId);

        if (error) throw error;

        setWishlistIds(prev => prev.filter(id => id !== courseId));
        toast({
          title: "Removed from wishlist",
          description: "Course removed from your wishlist"
        });
      } else {
        const { error } = await supabase
          .from("course_wishlist")
          .insert({
            student_id: user.id,
            course_template_id: courseId
          });

        if (error) throw error;

        setWishlistIds(prev => [...prev, courseId]);
        toast({
          title: "Added to wishlist",
          description: "Course saved to your wishlist"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_templates")
        .select("*")
        .order("is_featured", { ascending: false })
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

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "featured":
        filtered.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return 0;
        });
        break;
      case "rating":
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case "price-low":
        filtered.sort((a, b) => a.price_full - b.price_full);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price_full - a.price_full);
        break;
      case "duration":
        filtered.sort((a, b) => a.duration_hours - b.duration_hours);
        break;
    }

    setFilteredCourses(filtered);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <SEO
        title="Browse Courses - The Training Hub"
        description="Explore our comprehensive range of professional training courses"
      />
      <Navigation />
      <div className="min-h-screen bg-background pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-background py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Our Courses
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Professional training programs designed to advance your career
            </p>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured First</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Check back later for new courses"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card
                  key={course.id}
                  className="group hover:shadow-lg transition-all cursor-pointer relative"
                  onClick={() => router.push(`/enroll/${course.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {course.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {course.is_featured && (
                            <Badge className="bg-amber-600">Featured</Badge>
                          )}
                          {course.total_ratings && course.total_ratings > 0 && (
                            <div className="flex items-center gap-1">
                              {renderStars(course.average_rating || 0)}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({course.total_ratings})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(course.id);
                        }}
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            wishlistIds.includes(course.id)
                              ? "fill-red-600 text-red-600"
                              : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration_hours} hours</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Max {course.max_students} students</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            ${course.price_full}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${course.price_deposit} deposit
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/enroll/${course.id}`);
                          }}
                        >
                          Enroll Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </>
  );
}