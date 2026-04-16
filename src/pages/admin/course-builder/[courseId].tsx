import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  BookOpen,
  FileText,
  Video,
  Upload,
  Trash2,
  Edit,
  GripVertical,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  Save
} from "lucide-react";

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order_index: number;
  duration_hours: number;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  duration_minutes: number;
  order_index: number;
  video_url: string | null;
  objectives: LearningObjective[];
  materials: CourseMaterial[];
}

interface LearningObjective {
  id: string;
  objective: string;
  order_index: number;
}

interface CourseMaterial {
  id: string;
  title: string;
  file_type: string;
  file_url: string;
  file_size: number;
}

export default function CourseBuilderPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    duration_hours: 0
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    content: "",
    duration_minutes: 0,
    video_url: ""
  });

  const courseIdStr = typeof courseId === 'string' ? courseId : Array.isArray(courseId) ? courseId[0] : '';

  useEffect(() => {
    if (courseIdStr) {
      loadCourseContent();
    }
  }, [courseIdStr]);

  const loadCourseContent = async () => {
    if (!courseIdStr) return;
    setLoading(true);
    try {
      // Load course details
      const { data: courseData, error: courseError } = await supabase
        .from("course_templates")
        .select("name")
        .eq("id", courseIdStr)
        .single();

      if (courseError) throw courseError;
      setCourseName(courseData.name);

      // Load modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select(`
          id,
          title,
          description,
          order_index,
          duration_hours,
          course_lessons (
            id,
            module_id,
            title,
            content,
            duration_minutes,
            order_index,
            video_url,
            learning_objectives (
              id,
              objective,
              order_index
            ),
            course_materials (
              id,
              title,
              file_type,
              file_url,
              file_size
            )
          )
        `)
        .eq("course_id", courseIdStr)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      const formattedModules = modulesData.map((module: any) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        order_index: module.order_index,
        duration_hours: module.duration_hours,
        lessons: (module.course_lessons || []).map((lesson: any) => ({
          id: lesson.id,
          module_id: lesson.module_id,
          title: lesson.title,
          content: lesson.content,
          duration_minutes: lesson.duration_minutes,
          order_index: lesson.order_index,
          video_url: lesson.video_url,
          objectives: lesson.learning_objectives || [],
          materials: lesson.course_materials || []
        }))
      }));

      setModules(formattedModules);

    } catch (err: any) {
      console.error("Error loading course content:", err);
      toast({
        title: "Error",
        description: "Failed to load course content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title) {
      toast({
        title: "Validation Error",
        description: "Module title is required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("course_modules")
        .insert({
          course_id: courseIdStr,
          title: moduleForm.title,
          description: moduleForm.description,
          duration_hours: moduleForm.duration_hours,
          order_index: modules.length
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module created successfully"
      });

      setModuleForm({ title: "", description: "", duration_hours: 0 });
      setModuleDialogOpen(false);
      loadCourseContent();

    } catch (err: any) {
      console.error("Error creating module:", err);
      toast({
        title: "Error",
        description: "Failed to create module",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.title || !selectedModuleId) {
      toast({
        title: "Validation Error",
        description: "Lesson title and module selection are required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const targetModule = modules.find(m => m.id === selectedModuleId);
      const lessonCount = targetModule?.lessons.length || 0;

      const { error } = await supabase
        .from("course_lessons")
        .insert({
          module_id: selectedModuleId,
          title: lessonForm.title,
          content: lessonForm.content,
          duration_minutes: lessonForm.duration_minutes,
          video_url: lessonForm.video_url || null,
          order_index: lessonCount
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson created successfully"
      });

      setLessonForm({ title: "", content: "", duration_minutes: 0, video_url: "" });
      setLessonDialogOpen(false);
      loadCourseContent();

    } catch (err: any) {
      console.error("Error creating lesson:", err);
      toast({
        title: "Error",
        description: "Failed to create lesson",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module? All lessons will be deleted.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module deleted successfully"
      });

      loadCourseContent();

    } catch (err: any) {
      console.error("Error deleting module:", err);
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("course_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson deleted successfully"
      });

      loadCourseContent();

    } catch (err: any) {
      console.error("Error deleting lesson:", err);
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Course Builder - ${courseName} - The Training Hub`}
        description={`Build and customize your course: ${courseName}`}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/courses")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{courseName}</h1>
                <p className="text-muted-foreground">Course Content Builder</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Module</DialogTitle>
                    <DialogDescription>
                      Add a new module to organize course content
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="moduleTitle">Module Title</Label>
                      <Input
                        id="moduleTitle"
                        placeholder="e.g., Introduction to First Aid"
                        value={moduleForm.title}
                        onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="moduleDescription">Description</Label>
                      <Textarea
                        id="moduleDescription"
                        placeholder="Describe what students will learn in this module"
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="moduleDuration">Duration (hours)</Label>
                      <Input
                        id="moduleDuration"
                        type="number"
                        min="0"
                        step="0.5"
                        value={moduleForm.duration_hours}
                        onChange={(e) => setModuleForm({ ...moduleForm, duration_hours: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateModule} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Module"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Course Modules */}
          {modules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
                <p className="text-muted-foreground mb-4">Start building your course by adding modules</p>
                <Button onClick={() => setModuleDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Module
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {modules.map((module, moduleIndex) => (
                <Card key={module.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">Module {moduleIndex + 1}</Badge>
                            {module.duration_hours > 0 && (
                              <span className="text-sm text-muted-foreground">
                                {module.duration_hours} hours
                              </span>
                            )}
                          </div>
                          <CardTitle className="mb-2">{module.title}</CardTitle>
                          {module.description && (
                            <CardDescription>{module.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedModuleId(module.id);
                            setLessonDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Lesson
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteModule(module.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {module.lessons.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No lessons in this module</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedModuleId(module.id);
                            setLessonDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Lesson
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3 flex-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground mt-1 cursor-move" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="text-xs">
                                      Lesson {lessonIndex + 1}
                                    </Badge>
                                    {lesson.duration_minutes > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {lesson.duration_minutes} min
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-semibold mb-2">{lesson.title}</h4>
                                  {lesson.content && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {lesson.content.substring(0, 150)}
                                      {lesson.content.length > 150 && "..."}
                                    </p>
                                  )}
                                  {lesson.video_url && (
                                    <div className="flex items-center gap-2 text-sm text-primary">
                                      <Video className="h-4 w-4" />
                                      Video attached
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {lesson.objectives.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-medium mb-2">Learning Objectives:</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                  {lesson.objectives.map((obj) => (
                                    <li key={obj.id}>{obj.objective}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {lesson.materials.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-medium mb-2">Materials:</p>
                                <div className="flex flex-wrap gap-2">
                                  {lesson.materials.map((material) => (
                                    <Badge key={material.id} variant="outline">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {material.title}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add Lesson Dialog */}
          <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Lesson</DialogTitle>
                <DialogDescription>
                  Add a new lesson to this module
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="lessonTitle">Lesson Title</Label>
                  <Input
                    id="lessonTitle"
                    placeholder="e.g., CPR Basics"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="lessonContent">Lesson Content</Label>
                  <Textarea
                    id="lessonContent"
                    placeholder="Describe what students will learn in this lesson"
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lessonDuration">Duration (minutes)</Label>
                    <Input
                      id="lessonDuration"
                      type="number"
                      min="0"
                      value={lessonForm.duration_minutes}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="videoUrl">Video URL (optional)</Label>
                    <Input
                      id="videoUrl"
                      type="url"
                      placeholder="https://youtube.com/..."
                      value={lessonForm.video_url}
                      onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLesson} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Lesson"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}