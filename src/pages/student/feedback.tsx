import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Star, CheckCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Booking = Tables<"bookings"> & {
  scheduled_classes: Tables<"scheduled_classes"> & {
    course_templates: Pick<Tables<"course_templates">, "name" | "code"> | null;
  } | null;
};

export default function CourseFeedback() {
  const router = useRouter();
  const { booking: bookingId } = router.query as { booking: string };
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    rating: 0,
    courseQuality: 0,
    trainerQuality: 0,
    venueQuality: 0,
    comments: "",
    wouldRecommend: false,
    allowTestimonial: false
  });

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        scheduled_classes(
          *,
          course_templates(name, code)
        )
      `)
      .eq("id", bookingId)
      .single();

    console.log("Booking for feedback:", { data, error });

    if (data) {
      setBooking(data as any);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide an overall rating",
        variant: "destructive"
      });
      return;
    }

    if (!booking) return;

    const { error } = await supabase
      .from("course_feedback")
      .insert({
        booking_id: bookingId,
        scheduled_class_id: booking.scheduled_class_id,
        student_email: booking.student_email,
        rating: formData.rating,
        course_quality: formData.courseQuality || null,
        trainer_quality: formData.trainerQuality || null,
        venue_quality: formData.venueQuality || null,
        comments: formData.comments || null,
        would_recommend: formData.wouldRecommend,
        testimonial_approved: false
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setSubmitted(true);
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully"
      });
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (val: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <SEO title="Course Feedback | The Training Hub" />
        <Navigation />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            Loading...
          </div>
        </main>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <SEO title="Course Feedback | The Training Hub" />
        <Navigation />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-2xl mx-auto px-4">
            <Card>
              <CardContent className="py-12 text-center">
                Booking not found. Please check your link.
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <SEO title="Feedback Submitted | The Training Hub" />
        <Navigation />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-2xl mx-auto px-4">
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold">Thank You!</h2>
                <p className="text-muted-foreground">
                  Your feedback helps us improve our training courses.
                </p>
                <Button onClick={() => router.push("/student/portal")}>
                  Back to Portal
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO title="Course Feedback | The Training Hub" />
      <Navigation />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Feedback</CardTitle>
              <CardDescription>
                {booking.scheduled_classes?.course_templates?.name} - {" "}
                {booking.scheduled_classes?.course_templates?.code}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <StarRating
                  label="Overall Rating *"
                  value={formData.rating}
                  onChange={(val) => setFormData({ ...formData, rating: val })}
                />

                <StarRating
                  label="Course Content Quality"
                  value={formData.courseQuality}
                  onChange={(val) => setFormData({ ...formData, courseQuality: val })}
                />

                <StarRating
                  label="Trainer Quality"
                  value={formData.trainerQuality}
                  onChange={(val) => setFormData({ ...formData, trainerQuality: val })}
                />

                <StarRating
                  label="Venue Quality"
                  value={formData.venueQuality}
                  onChange={(val) => setFormData({ ...formData, venueQuality: val })}
                />

                <div className="space-y-2">
                  <Label htmlFor="comments">Additional Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Share your experience, suggestions, or concerns..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recommend"
                      checked={formData.wouldRecommend}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, wouldRecommend: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="recommend"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I would recommend this course to others
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="testimonial"
                      checked={formData.allowTestimonial}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, allowTestimonial: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="testimonial"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      You may use my feedback as a testimonial
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Submit Feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}