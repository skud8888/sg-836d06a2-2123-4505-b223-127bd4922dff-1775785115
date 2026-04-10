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
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, MapPin, Users, Clock, Edit, UserPlus, ArrowLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";

type ScheduledClass = Tables<"scheduled_classes"> & {
  course_templates: Pick<Tables<"course_templates">, "name" | "code"> | null;
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
  bookings: { count: number }[];
};

type Profile = Tables<"profiles">;

export default function CourseCalendar() {
  const router = useRouter();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  
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

    console.log("Fetched classes:", { data, error });

    if (data) {
      setClasses(data as any as ScheduledClass[]);
    }
    setLoading(false);
  };

  const fetchTrainers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["admin", "trainer"])
      .order("full_name");

    console.log("Fetched trainers:", { data, error });

    if (data) {
      setTrainers(data);
    }
  };

  const handleAssignTrainer = async (trainerId: string) => {
    if (!selectedClass) return;

    const { error } = await supabase
      .from("scheduled_classes")
      .update({ trainer_id: trainerId })
      .eq("id", selectedClass.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
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

  const handleOpenDialog = async (classItem?: ScheduledClass) => {
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
      setFormData({
        course_template_id: "",
        start_datetime: "",
        end_datetime: "",
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
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
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
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
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
                      {classes.length > 0 && classes[0].course_templates && (
                        <SelectItem value={classes[0].course_template_id}>
                          {classes[0].course_templates.name}
                        </SelectItem>
                      )}
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
                    <Label htmlFor="trainer">Assign Trainer (optional)</Label>
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

        {loading ? (
          <div className="text-center py-12">Loading calendar...</div>
        ) : (
          <div className="space-y-4">
            {classes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No classes scheduled. Click "Schedule Class" to add one.
                </CardContent>
              </Card>
            ) : (
              classes.map((classItem) => (
                <Card key={classItem.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {classItem.course_templates?.name || "Course"}
                          </CardTitle>
                          <Badge variant={getStatusColor(classItem.status)}>
                            {classItem.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {format(new Date(classItem.start_datetime), "EEEE, MMMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(classItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!classItem.trainer_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAssignDialog(classItem)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                          {classItem.bookings?.[0]?.count || 0} / {classItem.max_students} students
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <span>{classItem.profiles?.full_name || "No trainer assigned"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}