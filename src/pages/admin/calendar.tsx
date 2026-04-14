import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, MapPin, Users, Clock, Edit, UserPlus, ArrowLeft, Plus, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isSameMonth, parseISO } from "date-fns";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";

type ScheduledClass = Tables<"scheduled_classes"> & {
  course_templates: Pick<Tables<"course_templates">, "name" | "code"> | null;
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
  bookings: { count: number }[];
};

type Profile = Tables<"profiles">;
type CourseTemplate = Tables<"course_templates">;

type CalendarView = "month" | "week" | "day";

export default function CourseCalendar() {
  const router = useRouter();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [courses, setCourses] = useState<CourseTemplate[]>([]);
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [filterTrainer, setFilterTrainer] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    course_template_id: "",
    start_datetime: "",
    end_datetime: "",
    location: "",
    max_students: "20",
    trainer_id: ""
  });

  useEffect(() => {
    checkAuth();
    fetchClasses();
    fetchTrainers();
    fetchCourses();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
    }
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        course_templates(name, code),
        profiles(full_name),
        bookings(count)
      `)
      .order("start_datetime", { ascending: true });

    if (!error && data) {
      setClasses(data as any);
    }
    setLoading(false);
  };

  const fetchTrainers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["admin", "trainer"])
      .order("full_name");

    if (data) setTrainers(data);
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("course_templates")
      .select("*")
      .order("name");

    if (data) setCourses(data);
  };

  const handleAssignTrainer = async (trainerId: string) => {
    if (!selectedClass) return;

    const { error } = await supabase
      .from("scheduled_classes")
      .update({ trainer_id: trainerId })
      .eq("id", selectedClass.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trainer assigned successfully" });
      setAssignDialogOpen(false);
      setSelectedClass(null);
      fetchClasses();
    }
  };

  const handleOpenAssignDialog = (classItem: ScheduledClass) => {
    setSelectedClass(classItem);
    setAssignDialogOpen(true);
  };

  const handleOpenDialog = (classItem?: ScheduledClass, selectedDate?: Date) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        course_template_id: classItem.course_template_id,
        start_datetime: format(new Date(classItem.start_datetime), "yyyy-MM-dd'T'HH:mm"),
        end_datetime: format(new Date(classItem.end_datetime), "yyyy-MM-dd'T'HH:mm"),
        location: classItem.location || "",
        max_students: classItem.max_students.toString(),
        trainer_id: classItem.trainer_id || ""
      });
    } else {
      setEditingClass(null);
      const defaultStart = selectedDate ? format(selectedDate, "yyyy-MM-dd'T'09:00") : "";
      const defaultEnd = selectedDate ? format(selectedDate, "yyyy-MM-dd'T'17:00") : "";
      setFormData({
        course_template_id: "",
        start_datetime: defaultStart,
        end_datetime: defaultEnd,
        location: "",
        max_students: "20",
        trainer_id: ""
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const classData = {
      course_template_id: formData.course_template_id,
      start_datetime: new Date(formData.start_datetime).toISOString(),
      end_datetime: new Date(formData.end_datetime).toISOString(),
      location: formData.location || null,
      max_students: parseInt(formData.max_students),
      trainer_id: formData.trainer_id || null,
      status: "scheduled" as const
    };

    if (editingClass) {
      const { error } = await supabase
        .from("scheduled_classes")
        .update(classData)
        .eq("id", editingClass.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Class updated successfully" });
        setDialogOpen(false);
        fetchClasses();
      }
    } else {
      const { error } = await supabase
        .from("scheduled_classes")
        .insert(classData);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Class scheduled successfully" });
        setDialogOpen(false);
        fetchClasses();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "default";
      case "in_progress": return "secondary";
      case "completed": return "outline";
      case "cancelled": return "destructive";
      default: return "default";
    }
  };

  const exportToICS = () => {
    const filteredClasses = getFilteredClasses();
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Training Centre//Calendar//EN\n";
    
    filteredClasses.forEach((classItem) => {
      const start = format(new Date(classItem.start_datetime), "yyyyMMdd'T'HHmmss");
      const end = format(new Date(classItem.end_datetime), "yyyyMMdd'T'HHmmss");
      const summary = `${classItem.course_templates?.code || ""} - ${classItem.course_templates?.name || ""}`;
      const location = classItem.location || "";
      const trainer = classItem.profiles?.full_name || "TBA";
      
      icsContent += `BEGIN:VEVENT\nUID:${classItem.id}\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${summary}\nLOCATION:${location}\nDESCRIPTION:Trainer: ${trainer}\\nCapacity: ${classItem.bookings?.[0]?.count || 0}/${classItem.max_students}\nSTATUS:${classItem.status.toUpperCase()}\nEND:VEVENT\n`;
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training-calendar-${format(currentDate, "yyyy-MM")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredClasses = () => {
    return classes.filter((classItem) => {
      if (filterTrainer !== "all" && classItem.trainer_id !== filterTrainer) return false;
      if (filterCourse !== "all" && classItem.course_template_id !== filterCourse) return false;
      if (filterStatus !== "all" && classItem.status !== filterStatus) return false;
      return true;
    });
  };

  const getClassesForDate = (date: Date) => {
    return getFilteredClasses().filter((classItem) => 
      isSameDay(new Date(classItem.start_datetime), date)
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center font-semibold text-sm">
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => {
          const dayClasses = getClassesForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={index}
              className={`min-h-[120px] border rounded-lg p-2 ${
                isCurrentMonth ? "bg-background" : "bg-muted/30"
              } ${isToday ? "ring-2 ring-primary" : ""} hover:bg-muted/50 cursor-pointer transition-colors`}
              onClick={() => handleOpenDialog(undefined, day)}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary font-bold" : ""}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayClasses.slice(0, 3).map((classItem) => (
                  <div
                    key={classItem.id}
                    className="text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 cursor-pointer truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(classItem);
                    }}
                  >
                    <div className="font-medium truncate">
                      {classItem.course_templates?.code}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(classItem.start_datetime), "HH:mm")}
                    </div>
                  </div>
                ))}
                {dayClasses.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayClasses.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayClasses = getClassesForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toString()} className="border rounded-lg">
              <div className={`p-2 text-center border-b ${isToday ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <div className="text-sm font-semibold">{format(day, "EEE")}</div>
                <div className="text-lg font-bold">{format(day, "d")}</div>
              </div>
              <div className="p-2 space-y-2">
                {dayClasses.map((classItem) => (
                  <Card
                    key={classItem.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleOpenDialog(classItem)}
                  >
                    <CardContent className="p-3">
                      <div className="font-semibold text-sm mb-1 truncate">
                        {classItem.course_templates?.name}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(classItem.start_datetime), "HH:mm")} - {format(new Date(classItem.end_datetime), "HH:mm")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {classItem.bookings?.[0]?.count || 0}/{classItem.max_students}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(classItem.status)} className="mt-2">
                        {classItem.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const hours = [...Array(24)].map((_, i) => i);
    const dayClasses = getClassesForDate(currentDate);

    return (
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-muted">
          <h3 className="text-lg font-semibold">
            {format(currentDate, "EEEE, MMMM d, yyyy")}
          </h3>
        </div>
        <div className="divide-y">
          {hours.map((hour) => {
            const hourClasses = dayClasses.filter((classItem) => {
              const startHour = new Date(classItem.start_datetime).getHours();
              return startHour === hour;
            });

            return (
              <div key={hour} className="flex">
                <div className="w-20 p-2 text-sm text-muted-foreground border-r">
                  {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                </div>
                <div className="flex-1 p-2 space-y-2">
                  {hourClasses.map((classItem) => (
                    <Card
                      key={classItem.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleOpenDialog(classItem)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">
                              {classItem.course_templates?.name}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {format(new Date(classItem.start_datetime), "HH:mm")} - {format(new Date(classItem.end_datetime), "HH:mm")}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {classItem.location || "TBA"}
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {classItem.bookings?.[0]?.count || 0}/{classItem.max_students} students
                              </div>
                              <div className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                {classItem.profiles?.full_name || "No trainer assigned"}
                              </div>
                            </div>
                          </div>
                          <Badge variant={getStatusColor(classItem.status)}>
                            {classItem.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold">Course Calendar</h1>
            <p className="text-muted-foreground">Manage scheduled classes and trainer assignments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToICS}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingClass ? "Edit Scheduled Class" : "Schedule New Class"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingClass ? "Update class details" : "Add a new class to the calendar"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course *</Label>
                    <Select
                      value={formData.course_template_id}
                      onValueChange={(value) => setFormData({ ...formData, course_template_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start">Start Date/Time *</Label>
                      <Input
                        id="start"
                        type="datetime-local"
                        required
                        value={formData.start_datetime}
                        onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end">End Date/Time *</Label>
                      <Input
                        id="end"
                        type="datetime-local"
                        required
                        value={formData.end_datetime}
                        onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Brisbane CBD Training Room"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxStudents">Max Students *</Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        required
                        value={formData.max_students}
                        onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainer">Assign Trainer</Label>
                      <Select
                        value={formData.trainer_id}
                        onValueChange={(value) => setFormData({ ...formData, trainer_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trainer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No trainer assigned</SelectItem>
                          {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id}>
                              {trainer.full_name || trainer.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingClass ? "Update Class" : "Schedule Class"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTrainer} onValueChange={setFilterTrainer}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Trainers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trainers</SelectItem>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.full_name || trainer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (calendarView === "month") setCurrentDate(subMonths(currentDate, 1));
                    else if (calendarView === "week") setCurrentDate(addDays(currentDate, -7));
                    else setCurrentDate(addDays(currentDate, -1));
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (calendarView === "month") setCurrentDate(addMonths(currentDate, 1));
                    else if (calendarView === "week") setCurrentDate(addDays(currentDate, 7));
                    else setCurrentDate(addDays(currentDate, 1));
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <CardTitle className="ml-4">
                  {calendarView === "month" && format(currentDate, "MMMM yyyy")}
                  {calendarView === "week" && `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`}
                  {calendarView === "day" && format(currentDate, "MMMM d, yyyy")}
                </CardTitle>
              </div>
              <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as CalendarView)}>
                <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Loading calendar...</div>
            ) : (
              <>
                {calendarView === "month" && renderMonthView()}
                {calendarView === "week" && renderWeekView()}
                {calendarView === "day" && renderDayView()}
              </>
            )}
          </CardContent>
        </Card>

        {/* Trainer Assignment Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Trainer</DialogTitle>
              <DialogDescription>
                Select a trainer for {selectedClass?.course_templates?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {trainers.map((trainer) => (
                <Button
                  key={trainer.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAssignTrainer(trainer.id)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {trainer.full_name || trainer.email}
                  <Badge variant="secondary" className="ml-auto">
                    {trainer.role}
                  </Badge>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}