import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Star,
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Award
} from "lucide-react";

interface CourseRating {
  id: string;
  course_name: string;
  average_rating: number;
  total_ratings: number;
  recent_feedback: Array<{
    id: string;
    student_email: string;
    rating: number;
    comments: string;
    would_recommend: boolean;
    created_at: string;
  }>;
}

export default function CourseRatingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<CourseRating[]>([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalFeedback: 0,
    recommendationRate: 0,
    topRatedCourse: ""
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
      return;
    }
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load course ratings with feedback
      const { data: coursesData } = await supabase
        .from("course_templates")
        .select("id, name, average_rating, total_ratings")
        .order("average_rating", { ascending: false });

      if (coursesData) {
        const ratingsWithFeedback = await Promise.all(
          coursesData.map(async (course) => {
            const { data: feedback } = await supabase
              .from("course_feedback")
              .select(`
                id,
                student_email,
                rating,
                comments,
                would_recommend,
                created_at
              `)
              .eq("scheduled_class_id", course.id)
              .order("created_at", { ascending: false })
              .limit(5);

            return {
              id: course.id,
              course_name: course.name,
              average_rating: course.average_rating || 0,
              total_ratings: course.total_ratings || 0,
              recent_feedback: feedback || []
            };
          })
        );

        setRatings(ratingsWithFeedback);

        // Calculate stats
        const allFeedback = ratingsWithFeedback.flatMap(r => r.recent_feedback);
        const avgRating = ratingsWithFeedback.reduce((sum, r) => sum + (r.average_rating || 0), 0) / ratingsWithFeedback.length;
        const totalFeedback = ratingsWithFeedback.reduce((sum, r) => sum + r.total_ratings, 0);
        const recommendations = allFeedback.filter(f => f.would_recommend).length;
        const recommendationRate = allFeedback.length > 0 ? (recommendations / allFeedback.length) * 100 : 0;
        const topCourse = ratingsWithFeedback[0]?.course_name || "N/A";

        setStats({
          averageRating: avgRating,
          totalFeedback,
          recommendationRate,
          topRatedCourse: topCourse
        });
      }
    } catch (err: any) {
      console.error("Error loading ratings:", err);
      toast({
        title: "Error",
        description: "Failed to load course ratings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <SEO title="Course Ratings - Admin Dashboard" />
        <Navigation />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Course Ratings - Admin Dashboard" />
      <Navigation />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/admin">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <Star className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Course Ratings & Feedback</h1>
              <p className="text-muted-foreground">Monitor student satisfaction and course performance</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</div>
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{stats.totalFeedback}</div>
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recommendation Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{stats.recommendationRate.toFixed(0)}%</div>
                  <ThumbsUp className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Rated Course
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-amber-600" />
                  <div className="text-sm font-medium truncate">{stats.topRatedCourse}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Ratings List */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Courses</TabsTrigger>
              <TabsTrigger value="top">Top Rated</TabsTrigger>
              <TabsTrigger value="recent">Recent Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {ratings.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{course.course_name}</CardTitle>
                        <CardDescription className="mt-2">
                          {course.total_ratings} total ratings
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {renderStars(course.average_rating)}
                          <span className="text-lg font-bold">{course.average_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {course.recent_feedback.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Recent Feedback</h4>
                        {course.recent_feedback.map((feedback) => (
                          <div key={feedback.id} className="border-l-2 border-primary/20 pl-4">
                            <div className="flex items-center gap-2 mb-1">
                              {renderStars(feedback.rating)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(feedback.created_at).toLocaleDateString()}
                              </span>
                              {feedback.would_recommend && (
                                <Badge variant="secondary" className="text-xs">
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  Recommends
                                </Badge>
                              )}
                            </div>
                            {feedback.comments && (
                              <p className="text-sm text-muted-foreground">{feedback.comments}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              - {feedback.student_email}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No feedback yet</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="top">
              <div className="space-y-4">
                {ratings.filter(r => r.average_rating >= 4).map((course) => (
                  <Card key={course.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {course.course_name}
                            <Award className="h-5 w-5 text-amber-600" />
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {course.total_ratings} ratings
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(course.average_rating)}
                          <span className="text-lg font-bold">{course.average_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recent">
              <div className="space-y-4">
                {ratings
                  .flatMap(r => r.recent_feedback.map(f => ({ ...f, course_name: r.course_name })))
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 20)
                  .map((feedback) => (
                    <Card key={feedback.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{feedback.course_name}</CardTitle>
                            <CardDescription>{feedback.student_email}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(feedback.rating)}
                            {feedback.would_recommend && (
                              <Badge variant="secondary">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Recommends
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {feedback.comments && (
                        <CardContent>
                          <p className="text-sm">{feedback.comments}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(feedback.created_at).toLocaleString()}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}