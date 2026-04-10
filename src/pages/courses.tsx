import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";

type ScheduledClass = Tables<"scheduled_classes"> & {
  course_templates: Pick<Tables<"course_templates">, "name" | "code" | "description" | "price" | "deposit_amount"> | null;
  bookings: { count: number }[];
};

export default function Courses() {
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        course_templates(name, code, description, price, deposit_amount),
        bookings(count)
      `)
      .eq("status", "scheduled")
      .gte("start_datetime", new Date().toISOString())
      .order("start_datetime", { ascending: true });

    console.log("Available classes:", { data, error });

    if (data) {
      setClasses(data as any as ScheduledClass[]);
    }
    setLoading(false);
  };

  const getSpotsLeft = (classItem: ScheduledClass) => {
    const booked = classItem.bookings?.[0]?.count || 0;
    return classItem.max_students - booked;
  };

  return (
    <>
      <SEO
        title="Available Courses - GTS Training"
        description="Browse and book available training courses"
      />
      <Navigation />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-12 text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">Available Courses</h1>
            <p className="text-lg text-muted-foreground">
              Book your place in our upcoming training sessions
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading courses...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No upcoming courses available at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6 max-w-4xl mx-auto">
              {classes.map((classItem) => {
                const spotsLeft = getSpotsLeft(classItem);
                const isFull = spotsLeft <= 0;

                return (
                  <Card key={classItem.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl mb-2">
                            {classItem.course_templates?.name || "Course"}
                          </CardTitle>
                          <CardDescription>
                            {classItem.course_templates?.description}
                          </CardDescription>
                        </div>
                        <Badge variant={isFull ? "secondary" : "default"}>
                          {classItem.course_templates?.code}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(classItem.start_datetime), "EEEE, MMMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(classItem.start_datetime), "h:mm a")} - {format(new Date(classItem.end_datetime), "h:mm a")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{classItem.location || "TBA"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {isFull ? "Fully Booked" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>
                            ${classItem.course_templates?.price} (${classItem.course_templates?.deposit_amount} deposit to secure)
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <Link href={`/booking/${classItem.id}`} className="flex-1">
                          <Button className="w-full" disabled={isFull}>
                            {isFull ? "Fully Booked" : "Book Now"}
                          </Button>
                        </Link>
                        <Link href={`/courses/${classItem.id}`}>
                          <Button variant="outline">View Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}