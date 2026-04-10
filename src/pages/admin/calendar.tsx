import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Users, User } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ScheduledClass = Tables<"scheduled_classes"> & {
  course_templates: Pick<Tables<"course_templates">, "name" | "code">;
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
};

export default function CourseCalendar() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);

  useEffect(() => {
    checkAuth();
    fetchClasses();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "trainer") {
      router.push("/");
      return;
    }

    setLoading(false);
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        course_templates!scheduled_classes_course_id_fkey(name, code),
        profiles!scheduled_classes_trainer_id_fkey(full_name)
      `)
      .order("start_datetime", { ascending: true });

    console.log("Fetched classes:", { data, error });

    if (data) {
      setClasses(data as ScheduledClass[]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
      case "completed":
        return "bg-gray-500/10 text-gray-700 border-gray-200";
      case "cancelled":
        return "bg-red-500/10 text-red-700 border-red-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString("en-AU", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-heading font-bold">Course Calendar</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No scheduled classes found. Add your first class to get started.
              </CardContent>
            </Card>
          ) : (
            classes.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {classItem.course_templates?.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="font-mono">
                          {classItem.course_templates?.code}
                        </Badge>
                        <Badge className={getStatusColor(classItem.status)}>
                          {classItem.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatDateTime(classItem.start_datetime)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{classItem.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {classItem.profiles?.full_name || "No trainer assigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {classItem.enrolled_count || 0} / {classItem.max_students} students
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}