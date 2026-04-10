import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";

type CourseTemplate = Tables<"course_templates">;

export default function CourseManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    price_full: "",
    price_deposit: "",
    duration_hours: "",
    units: "",
    max_students: "20"
  });

  useEffect(() => {
    checkAuth();
    fetchCourses();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
    }
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("course_templates")
      .select("*")
      .order("name");

    console.log("Courses:", { data, error });

    if (data) {
      setCourses(data);
    }
    setLoading(false);
  };

  const handleOpenDialog = (course?: CourseTemplate) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        code: course.code,
        description: course.description || "",
        price_full: course.price_full.toString(),
        price_deposit: course.price_deposit.toString(),
        duration_hours: course.duration_hours.toString(),
        units: course.units?.join(", ") || "",
        max_students: course.max_students.toString()
      });
    } else {
      setEditingCourse(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        price_full: "",
        price_deposit: "",
        duration_hours: "",
        units: "",
        max_students: "20"
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const courseData = {
      name: formData.name,
      code: formData.code,
      description: formData.description || null,
      price_full: parseFloat(formData.price_full),
      price_deposit: parseFloat(formData.price_deposit),
      duration_hours: parseInt(formData.duration_hours),
      units: formData.units 
        ? formData.units.split(",").map(u => u.trim())
        : null,
      max_students: parseInt(formData.max_students)
    };

    if (editingCourse) {
      const { error } = await supabase
        .from("course_templates")
        .update(courseData)
        .eq("id", editingCourse.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ title: "Course updated successfully" });
        setDialogOpen(false);
        fetchCourses();
      }
    } else {
      const { error } = await supabase
        .from("course_templates")
        .insert(courseData);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ title: "Course created successfully" });
        setDialogOpen(false);
        fetchCourses();
      }
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
            <h1 className="text-3xl font-heading font-bold">Course Templates</h1>
            <p className="text-muted-foreground">Manage your course catalog</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? "Edit Course" : "Create New Course"}
                </DialogTitle>
                <DialogDescription>
                  {editingCourse ? "Update course details" : "Add a new course template to your catalog"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Course Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Course Code *</Label>
                    <Input
                      id="code"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      required
                      value={formData.price_full}
                      onChange={(e) => setFormData({ ...formData, price_full: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Deposit ($) *</Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.01"
                      required
                      value={formData.price_deposit}
                      onChange={(e) => setFormData({ ...formData, price_deposit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (hrs) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      required
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">Units of Competency (comma-separated)</Label>
                  <Input
                    id="units"
                    placeholder="HLTAID011, HLTAID009"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                  />
                </div>

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

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCourse ? "Update Course" : "Create Course"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading courses...</div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{course.name}</CardTitle>
                      <CardDescription className="mt-1">{course.code}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {course.description && (
                      <p className="text-muted-foreground">{course.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-semibold">${course.price_full}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Deposit</p>
                        <p className="font-semibold">${course.price_deposit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-semibold">{course.duration_hours}hrs</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Max Students</p>
                        <p className="font-semibold">{course.max_students}</p>
                      </div>
                    </div>
                    {course.units && course.units.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Units</p>
                        <p className="text-xs">{course.units.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}