import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  MapPin, 
  Users, 
  Clock, 
  Calendar as CalendarIcon,
  User,
  Filter,
  Grid3x3,
  List
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PublicClass {
  id: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  max_students: number;
  status: string;
  course_name: string;
  course_code: string;
  course_description: string;
  price: number;
  trainer_name: string;
  enrolled_count: number;
}

export default function PublicClassBrowsing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<PublicClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<PublicClass[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [locationFilter, setLocationFilter] = useState("all");
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [locations, setLocations] = useState<string[]>([]);
  const [trainers, setTrainers] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    loadPublicClasses();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [classes, searchQuery, selectedDate, locationFilter, trainerFilter]);

  const loadPublicClasses = async () => {
    setLoading(true);

    try {
      // Load all upcoming public classes
      const { data, error } = await supabase
        .from("scheduled_classes")
        .select(`
          id,
          start_datetime,
          end_datetime,
          location,
          max_students,
          status,
          course_templates!inner (
            name,
            code,
            description,
            price
          ),
          profiles (
            full_name
          ),
          bookings (
            id
          )
        `)
        .gte("start_datetime", new Date().toISOString())
        .eq("status", "scheduled")
        .order("start_datetime", { ascending: true });

      if (error) throw error;

      const formattedClasses = (data || []).map((cls: any) => ({
        id: cls.id,
        start_datetime: cls.start_datetime,
        end_datetime: cls.end_datetime,
        location: cls.location || "TBA",
        max_students: cls.max_students,
        status: cls.status,
        course_name: cls.course_templates?.name || "Unknown Course",
        course_code: cls.course_templates?.code || "",
        course_description: cls.course_templates?.description || "",
        price: cls.course_templates?.price || 0,
        trainer_name: cls.profiles?.full_name || "TBA",
        enrolled_count: Array.isArray(cls.bookings) ? cls.bookings.length : 0
      }));

      setClasses(formattedClasses);
      setFilteredClasses(formattedClasses);

      // Extract unique locations and trainers
      const uniqueLocations = [...new Set(formattedClasses.map(c => c.location))].filter(Boolean);
      const uniqueTrainers = [...new Set(formattedClasses.map(c => ({
        id: c.trainer_name,
        name: c.trainer_name
      })))];

      setLocations(uniqueLocations);
      setTrainers(uniqueTrainers);

    } catch (error) {
      console.error("Error loading public classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    let filtered = [...classes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cls =>
        cls.course_name.toLowerCase().includes(query) ||
        cls.course_code.toLowerCase().includes(query) ||
        cls.course_description.toLowerCase().includes(query) ||
        cls.location.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(cls => {
        const classDate = new Date(cls.start_datetime);
        return classDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(cls => cls.location === locationFilter);
    }

    // Trainer filter
    if (trainerFilter !== "all") {
      filtered = filtered.filter(cls => cls.trainer_name === trainerFilter);
    }

    setFilteredClasses(filtered);
  };

  const getAvailabilityBadge = (enrolled: number, max: number) => {
    const percentage = (enrolled / max) * 100;
    
    if (percentage >= 100) {
      return <Badge variant="destructive">Full</Badge>;
    } else if (percentage >= 80) {
      return <Badge variant="secondary">Limited</Badge>;
    } else {
      return <Badge className="bg-green-600">Available</Badge>;
    }
  };

  if (loading) {
    return (
      <>
        <SEO 
          title="Browse Classes"
          description="Find and book upcoming training classes"
        />
        <Navigation />
        <div className="min-h-screen bg-background pt-16">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Browse Classes"
        description="Find and book upcoming training classes across Australia"
      />
      <Navigation />
      
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Browse Upcoming Classes</h1>
            <p className="text-muted-foreground text-lg">
              Find the perfect class for your training needs
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search courses, locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                    {selectedDate && (
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(undefined)}
                          className="w-full"
                        >
                          Clear Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Location Filter */}
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Trainer Filter */}
                <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Trainers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trainers</SelectItem>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredClasses.length} of {classes.length} classes
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classes Grid/List */}
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Classes Found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search query
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setSelectedDate(undefined);
                  setLocationFilter("all");
                  setTrainerFilter("all");
                }}>
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {filteredClasses.map((cls) => (
                <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl">{cls.course_name}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {cls.course_code}
                        </Badge>
                      </div>
                      {getAvailabilityBadge(cls.enrolled_count, cls.max_students)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {cls.course_description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Date & Time */}
                      <div className="flex items-start gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(cls.start_datetime).toLocaleDateString("en-AU", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(cls.start_datetime).toLocaleTimeString("en-AU", { hour: '2-digit', minute: '2-digit' })} - {new Date(cls.end_datetime).toLocaleTimeString("en-AU", { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{cls.location}</span>
                      </div>

                      {/* Trainer */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{cls.trainer_name}</span>
                      </div>

                      {/* Capacity */}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {cls.enrolled_count}/{cls.max_students} spots filled
                        </span>
                      </div>

                      {/* Price */}
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold">
                              ${cls.price.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              per person
                            </div>
                          </div>
                          <Button asChild>
                            <Link href={`/booking/${cls.id}`}>
                              Book Now
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}