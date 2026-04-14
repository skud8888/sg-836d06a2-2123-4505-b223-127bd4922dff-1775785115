import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentPreviewer } from "@/components/DocumentPreviewer";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  CheckCircle2, 
  Clock, 
  PlayCircle,
  Download,
  ArrowLeft,
  Lock
} from "lucide-react";

interface PreCourseMaterial {
  id: string;
  title: string;
  description: string;
  material_type: "video" | "pdf" | "document" | "link" | "quiz";
  file_url: string | null;
  external_url: string | null;
  duration_minutes: number | null;
  is_required: boolean;
  order_index: number;
  course_name: string;
  course_id: string;
  enrollment_id: string;
  progress: {
    completed: boolean;
    progress_percentage: number;
    time_spent_minutes: number;
    last_accessed_at: string | null;
  } | null;
}

export default function PreCourseStudy() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<PreCourseMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<PreCourseMaterial | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/admin/login");
      return;
    }

    setUserId(session.user.id);
    loadPreCourseMaterials(session.user.id);
  };

  const loadPreCourseMaterials = async (userId: string) => {
    setLoading(true);

    try {
      // Get student's enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select(`
          id,
          course_template_id,
          course_templates!inner (
            name
          )
        `)
        .eq("student_id", userId)
        .eq("status", "active");

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setMaterials([]);
        setLoading(false);
        return;
      }

      // Get all course IDs
      const courseIds = enrollments.map(e => e.course_template_id);

      // Get pre-course materials for these courses
      const { data: materialsData, error: materialsError } = await supabase
        .from("pre_course_materials")
        .select("*")
        .in("course_template_id", courseIds)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (materialsError) throw materialsError;

      // Get progress for these materials
      const materialIds = (materialsData || []).map(m => m.id);
      const { data: progressData } = await supabase
        .from("material_access")
        .select("*")
        .eq("student_id", userId)
        .in("material_id", materialIds);

      // Combine materials with progress and enrollment info
      const combinedMaterials: PreCourseMaterial[] = (materialsData || []).map((material: any) => {
        const enrollment = enrollments.find(e => e.course_template_id === material.course_template_id);
        const courseData = enrollment?.course_templates as any;
        const progress = (progressData || []).find((p: any) => p.material_id === material.id);

        return {
          id: material.id,
          title: material.title,
          description: material.description,
          material_type: material.material_type,
          file_url: material.file_url,
          external_url: material.external_url,
          duration_minutes: material.duration_minutes,
          is_required: material.is_required,
          order_index: material.order_index,
          course_name: courseData?.name || "Unknown Course",
          course_id: material.course_template_id,
          enrollment_id: enrollment?.id || "",
          progress: progress ? {
            completed: !!progress.completed_at,
            progress_percentage: progress.progress_percentage || 0,
            time_spent_minutes: progress.time_spent_minutes || 0,
            last_accessed_at: progress.last_accessed_at
          } : null
        };
      });

      setMaterials(combinedMaterials);
    } catch (error) {
      console.error("Error loading pre-course materials:", error);
      toast({
        title: "Error",
        description: "Failed to load study materials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const trackMaterialAccess = async (material: PreCourseMaterial) => {
    if (!userId) return;

    try {
      // Check if access record exists
      const { data: existingAccess } = await supabase
        .from("material_access")
        .select("id")
        .eq("student_id", userId)
        .eq("material_id", material.id)
        .eq("enrollment_id", material.enrollment_id)
        .single();

      if (existingAccess) {
        // Update last accessed
        await supabase
          .from("material_access")
          .update({ last_accessed_at: new Date().toISOString() })
          .eq("id", existingAccess.id);
      } else {
        // Create new access record
        await supabase
          .from("material_access")
          .insert({
            student_id: userId,
            material_id: material.id,
            enrollment_id: material.enrollment_id,
            first_accessed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            progress_percentage: 0
          });
      }

      // Reload materials to update progress
      if (userId) {
        loadPreCourseMaterials(userId);
      }
    } catch (error) {
      console.error("Error tracking material access:", error);
    }
  };

  const markAsComplete = async (material: PreCourseMaterial) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("material_access")
        .upsert({
          student_id: userId,
          material_id: material.id,
          enrollment_id: material.enrollment_id,
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
          last_accessed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Marked as Complete",
        description: `"${material.title}" has been marked as completed.`
      });

      // Reload to update UI
      if (userId) {
        loadPreCourseMaterials(userId);
      }
    } catch (error) {
      console.error("Error marking material as complete:", error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openMaterial = (material: PreCourseMaterial) => {
    setSelectedMaterial(material);
    trackMaterialAccess(material);

    if (material.material_type === "pdf" || material.material_type === "document") {
      setPreviewOpen(true);
    } else if (material.material_type === "link" && material.external_url) {
      window.open(material.external_url, "_blank");
    } else if (material.material_type === "video") {
      setPreviewOpen(true);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "pdf":
      case "document":
        return <FileText className="h-5 w-5" />;
      case "link":
        return <LinkIcon className="h-5 w-5" />;
      case "quiz":
        return <BookOpen className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return "Video";
      case "pdf":
        return "PDF";
      case "document":
        return "Document";
      case "link":
        return "External Link";
      case "quiz":
        return "Quiz";
      default:
        return type;
    }
  };

  // Group materials by course
  const materialsByCourse = materials.reduce((acc, material) => {
    if (!acc[material.course_id]) {
      acc[material.course_id] = {
        courseName: material.course_name,
        materials: []
      };
    }
    acc[material.course_id].materials.push(material);
    return acc;
  }, {} as Record<string, { courseName: string; materials: PreCourseMaterial[] }>);

  const calculateCourseProgress = (courseMaterials: PreCourseMaterial[]) => {
    const totalRequired = courseMaterials.filter(m => m.is_required).length;
    if (totalRequired === 0) return 100;

    const completed = courseMaterials.filter(m => m.is_required && m.progress?.completed).length;
    return Math.round((completed / totalRequired) * 100);
  };

  if (loading) {
    return (
      <>
        <SEO 
          title="Pre-Course Study Materials"
          description="Access your pre-course study materials"
        />
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
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
        title="Pre-Course Study Materials"
        description="Access your pre-course study materials and resources"
      />
      
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/portal">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Portal
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold">Pre-Course Study Materials</h1>
              <p className="text-muted-foreground">
                Prepare for your courses with these learning materials
              </p>
            </div>
          </div>

          {/* Empty State */}
          {materials.length === 0 && (
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                No pre-course materials available yet. Check back closer to your course start date.
              </AlertDescription>
            </Alert>
          )}

          {/* Materials by Course */}
          {Object.entries(materialsByCourse).map(([courseId, { courseName, materials: courseMaterials }]) => {
            const progress = calculateCourseProgress(courseMaterials);

            return (
              <Card key={courseId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{courseName}</CardTitle>
                      <CardDescription>
                        {courseMaterials.filter(m => m.is_required).length} required materials
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{progress}%</div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                  </div>
                  <Progress value={progress} className="mt-4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {courseMaterials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {material.progress?.completed ? (
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          ) : (
                            <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center">
                              {getMaterialIcon(material.material_type)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{material.title}</h3>
                            {material.is_required && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {getMaterialTypeLabel(material.material_type)}
                            </Badge>
                          </div>
                          {material.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {material.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {material.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {material.duration_minutes} min
                              </div>
                            )}
                            {material.progress && material.progress.last_accessed_at && (
                              <div>
                                Last accessed: {new Date(material.progress.last_accessed_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMaterial(material)}
                          >
                            {material.material_type === "video" && <PlayCircle className="h-4 w-4 mr-2" />}
                            {material.material_type === "link" && <LinkIcon className="h-4 w-4 mr-2" />}
                            {(material.material_type === "pdf" || material.material_type === "document") && <FileText className="h-4 w-4 mr-2" />}
                            Open
                          </Button>

                          {!material.progress?.completed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsComplete(material)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Document/Video Previewer */}
      {selectedMaterial && selectedMaterial.file_url && (
        <DocumentPreviewer
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          documentUrl={selectedMaterial.file_url}
          documentName={selectedMaterial.title}
          documentType={
            selectedMaterial.material_type === "video" 
              ? "video/mp4" 
              : "application/pdf"
          }
        />
      )}
    </>
  );
}