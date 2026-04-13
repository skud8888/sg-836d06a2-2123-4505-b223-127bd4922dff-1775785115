import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { SEO } from "@/components/SEO";
import { EvidenceCapture } from "@/components/EvidenceCapture";
import { EvidenceGallery } from "@/components/EvidenceGallery";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ClassEvidencePage() {
  const router = useRouter();
  const classId = router.query.classId as string;
  
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");

  useEffect(() => {
    if (classId) {
      checkAuth();
    }
  }, [classId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/admin/login");
      return;
    }

    const role = await rbacService.getUserPrimaryRole();
    if (role !== "trainer" && role !== "admin" && role !== "super_admin") {
      router.push("/");
      return;
    }

    await loadClassData();
    setLoading(false);
  };

  const loadClassData = async () => {
    const { data } = await supabase
      .from("scheduled_classes")
      .select("*, course_templates(name)")
      .eq("id", classId)
      .single();

    if (data) {
      setClassName(data.course_templates?.name || "Class");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <SEO title={`Evidence - ${className} - GTS Training`} />
      <OfflineIndicator />
      
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/field">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Training Evidence</h1>
            </div>
            <p className="text-sm opacity-90">{className}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <EvidenceCapture 
            contextType="class"
            contextId={classId as string}
          />
          
          <div className="mt-8">
            <EvidenceGallery 
              contextType="class"
              contextId={classId as string}
            />
          </div>
        </div>
      </div>
    </>
  );
}