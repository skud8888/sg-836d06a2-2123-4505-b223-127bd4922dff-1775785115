import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Star, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Enrollment {
  id: string;
  course_template_id: string;
  status: string;
  course_templates: {
    name: string;
  };
  scheduled_classes: {
    id: string;
    start_datetime: string;
    end_datetime: string;
    location: string;
  }[];
}

export default function RateCoursePage() {
  const router = useRouter();
  const { enrollmentId } = router.query;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [alreadyRated, setAlreadyRated] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [courseQuality, setCourseQuality] = useState(0);
  const [trainerQuality, setTrainerQuality] = useState(0);
  const [venueQuality, setVenueQuality] = useState(0);
  const [comments, setComments] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [allowTestimonial, setAllowTestimonial] = useState(false);

  useEffect(() => {
    if (enrollmentId) {
      loadEnrollment();
    }
  }, [enrollmentId]);

  const loadEnrollment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          course_templates (name),
          scheduled_classes (id, start_datetime, end_datetime, location)
        `)
        .eq("id", enrollmentId)
        .eq("student_id", user.id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Not found",
          description: "Enrollment not found",
          variant: "destructive"
        });
        router.push("/student/portal");
        return;
      }

      setEnrollment(data as any);

      // Check if already rated
      const scheduledClass = (data as any).scheduled_classes[0];
      if (scheduledClass) {
        const { data: feedback } = await supabase
          .from("course_feedback")
          .select("id")
          .eq("scheduled_class_id", scheduledClass.id)
          .eq("student_email", user.email)
          .single();

        if (feedback) {
          setAlreadyRated(true);
        }
      }
    } catch (err: any) {
      console.error("Error loading enrollment:", err);
      toast({
        title: "Error",
        description: "Failed to load enrollment details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select an overall rating",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !enrollment) return;

      const scheduledClass = enrollment.scheduled_classes[0];
      if (!scheduledClass) {
        throw new Error("No scheduled class found");
      }

      const { error } = await supabase
        .from("course_feedback")
        .insert({
          booking_id: enrollment.id,
          scheduled_class_id: scheduledClass.id,
          student_email: user.email || "",
          rating,
          course_quality: courseQuality || null,
          trainer_quality: trainerQuality || null,
          venue_quality: venueQuality || null,
          comments: comments || null,
          would_recommend: wouldRecommend,
          testimonial_approved: allowTestimonial
        });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully"
      });

      router.push("/student/portal");
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const RatingStars = ({ 
    value, 
    onChange, 
    onHover 
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    onHover?: (rating: number) => void;
  }) => {
    const displayRating = hoverRating || value;
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover && onHover(star)}
            onMouseLeave={() => onHover && onHover(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <SEO title="Rate Course - The Training Hub" />
        <Navigation />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  if (alreadyRated) {
    return (
      <>
        <SEO title="Already Rated - The Training Hub" />
        <Navigation />
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-12 max-w-2xl">
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Already Submitted</h2>
                <p className="text-muted-foreground mb-6">
                  You've already submitted feedback for this course. Thank you!
                </p>
                <Link href="/student/portal">
                  <Button>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (!enrollment) {
    return null;
  }

  return (
    <>
      <SEO 
        title={`Rate ${enrollment.course_templates.name} - The Training Hub`}
        description="Share your feedback about this course"
      />
      <Navigation />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Link href="/student/portal">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portal
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Rate Your Course Experience</CardTitle>
              <CardDescription>
                {enrollment.course_templates.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Overall Rating */}
                <div className="space-y-3">
                  <Label className="text-base">Overall Rating *</Label>
                  <p className="text-sm text-muted-foreground">
                    How would you rate your overall experience?
                  </p>
                  <RatingStars 
                    value={rating} 
                    onChange={setRating}
                    onHover={setHoverRating}
                  />
                </div>

                {/* Course Quality */}
                <div className="space-y-3">
                  <Label className="text-base">Course Content Quality</Label>
                  <p className="text-sm text-muted-foreground">
                    How would you rate the course materials and content?
                  </p>
                  <RatingStars value={courseQuality} onChange={setCourseQuality} />
                </div>

                {/* Trainer Quality */}
                <div className="space-y-3">
                  <Label className="text-base">Instructor Quality</Label>
                  <p className="text-sm text-muted-foreground">
                    How effective was the instructor?
                  </p>
                  <RatingStars value={trainerQuality} onChange={setTrainerQuality} />
                </div>

                {/* Venue Quality */}
                <div className="space-y-3">
                  <Label className="text-base">Venue & Facilities</Label>
                  <p className="text-sm text-muted-foreground">
                    How would you rate the training venue and facilities?
                  </p>
                  <RatingStars value={venueQuality} onChange={setVenueQuality} />
                </div>

                {/* Comments */}
                <div className="space-y-3">
                  <Label htmlFor="comments" className="text-base">Additional Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Share any specific feedback or suggestions
                  </p>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="What did you like? What could be improved?"
                    rows={5}
                  />
                </div>

                {/* Would Recommend */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="recommend" className="text-base">
                      Would you recommend this course?
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Help others make informed decisions
                    </p>
                  </div>
                  <Switch
                    id="recommend"
                    checked={wouldRecommend}
                    onCheckedChange={setWouldRecommend}
                  />
                </div>

                {/* Testimonial Permission */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="testimonial" className="text-base">
                      Allow us to use your feedback as a testimonial?
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Your name will be included with the feedback
                    </p>
                  </div>
                  <Switch
                    id="testimonial"
                    checked={allowTestimonial}
                    onCheckedChange={setAllowTestimonial}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting || rating === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/student/portal")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}