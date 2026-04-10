import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign, Search, Filter } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";

type ScheduledClass = Tables<"scheduled_classes"> & {
  course_templates: Pick<Tables<"course_templates">, "name" | "code" | "description" | "price_full" | "price_deposit"> | null;
  bookings: { count: number }[];
};

export default function Courses() {
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, courseFilter, locationFilter, dateFilter, classes]);

  const fetchAvailableClasses = async () => {
    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        course_templates(name, code, description, price_full, price_deposit),
        bookings(count)
      `)
      .eq("status", "scheduled")
      .gte("start_datetime", new Date().toISOString())
      .order("start_datetime", { ascending: true });

    console.log("Fetched classes:", { data, error });

    if (data) {
      setClasses(data as any);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...classes];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.course_templates?.name.toLowerCase().includes(search) ||
          c.course_templates?.code.toLowerCase().includes(search) ||
          c.course_templates?.description?.toLowerCase().includes(search) ||
          c.location?.toLowerCase().includes(search)
      );
    }

    // Course type filter
    if (courseFilter !== "all") {
      filtered = filtered.filter(
        (c) => c.course_templates?.code === courseFilter
      );
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter((c) => c.location === locationFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = startOfDay(now);
      const weekEnd = endOfDay(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
      const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));

      filtered = filtered.filter((c) => {
        const classDate = new Date(c.start_datetime);
        if (dateFilter === "week") {
          return isAfter(classDate, today) && isBefore(classDate, weekEnd);
        } else if (dateFilter === "month") {
          return isAfter(classDate, today) && isBefore(classDate, monthEnd);
        }
        return true;
      });
    }

    setFilteredClasses(filtered);
  };

  const getUniqueCourseCodes = () => {
    const codes = new Set<string>();
    classes.forEach((c) => {
      if (c.course_templates?.code) {
        codes.add(c.course_templates.code);
      }
    });
    return Array.from(codes);
  };

  const getUniqueLocations = () => {
    const locations = new Set<string>();
    classes.forEach((c) => {
      if (c.location) {
        locations.add(c.location);
      }
    });
    return Array.from(locations);
  };

  const isClassFull = (classItem: ScheduledClass) => {
    const bookingCount = classItem.bookings?.[0]?.count || 0;
    return bookingCount >= classItem.max_students;
  };

  return (
    <>
      <SEO
        title="Available Courses | GTS Training"
        description="Browse upcoming training courses and book your spot"
      />
      <Navigation />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading font-bold">Available Courses</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse our upcoming training sessions and secure your spot today
            </p>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses, codes, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {getUniqueCourseCodes().map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {getUniqueLocations().map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredClasses.length} of {classes.length} courses
            </p>
            {(searchTerm || courseFilter !== "all" || locationFilter !== "all" || dateFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setCourseFilter("all");
                  setLocationFilter("all");
                  setDateFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">Loading courses...</div>
          ) : filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No courses match your search criteria. Try adjusting your filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredClasses.map((classItem) => {
                const isFull = isClassFull(classItem);
                return (
                  <Card key={classItem.id} className={isFull ? "opacity-60" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-2xl">
                              {classItem.course_templates?.name || "Course"}
                            </CardTitle>
                            {isFull && (
                              <Badge variant="destructive">Fully Booked</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {classItem.course_templates?.code}
                          </p>
                          {classItem.course_templates?.description && (
                            <p className="mt-2 text-muted-foreground">
                              {classItem.course_templates.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(classItem.start_datetime), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{classItem.location || "TBA"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {classItem.bookings?.[0]?.count || 0} / {classItem.max_students} enrolled
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>
                            ${classItem.course_templates?.price_full} (${classItem.course_templates?.price_deposit} deposit to secure)
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        {isFull ? (
                          <Button disabled className="w-full md:w-auto">
                            Fully Booked
                          </Button>
                        ) : (
                          <Link href={`/booking/${classItem.id}`}>
                            <Button className="w-full md:w-auto">
                              Book Now
                            </Button>
                          </Link>
                        )}
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