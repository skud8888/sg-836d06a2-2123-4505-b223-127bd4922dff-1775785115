import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PowerProService, PowerProStudent, PowerProCourse } from "@/services/powerProService";
import { Download, CheckCircle, AlertCircle, Database, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function IntegrationsPage() {
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Preview Data
  const [previewStudents, setPreviewStudents] = useState<PowerProStudent[]>([]);
  const [previewCourses, setPreviewCourses] = useState<PowerProCourse[]>([]);

  useEffect(() => {
    checkAccess();
    loadConfig();
  }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['super_admin', 'admin'])
      .single();

    if (!roleData) {
      router.push("/student/portal");
    }
  };

  const loadConfig = () => {
    // In a real app, this might be loaded from a secure table or server
    const savedKey = localStorage.getItem("powerpro_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsConfigured(true);
    }
  };

  const handleSaveConfig = () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "API Key is required",
        variant: "destructive"
      });
      return;
    }
    
    // Securely saving to local storage for demo purposes
    localStorage.setItem("powerpro_api_key", apiKey);
    setIsConfigured(true);
    toast({
      title: "Configuration Saved",
      description: "PowerPro integration is now configured."
    });
  };

  const handleRemoveConfig = () => {
    localStorage.removeItem("powerpro_api_key");
    setApiKey("");
    setIsConfigured(false);
    setPreviewStudents([]);
    setPreviewCourses([]);
  };

  const handleFetchPreview = async () => {
    setLoading(true);
    try {
      const service = new PowerProService(apiKey);
      const [students, courses] = await Promise.all([
        service.getStudents(),
        service.getCourses()
      ]);
      
      setPreviewStudents(students);
      setPreviewCourses(courses);
      
      toast({
        title: "Data Fetched",
        description: `Found ${students.length} students and ${courses.length} courses to import.`
      });
    } catch (err: any) {
      toast({
        title: "Error fetching data",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewStudents.length && !previewCourses.length) return;
    
    setImporting(true);
    try {
      const service = new PowerProService(apiKey);
      
      // Import Courses
      let courseResults = { success: 0, errors: 0 };
      if (previewCourses.length > 0) {
        courseResults = await service.importCoursesToSupabase(previewCourses);
      }
      
      // Import Students
      let studentResults = { success: 0, errors: 0 };
      if (previewStudents.length > 0) {
        studentResults = await service.importStudentsToSupabase(previewStudents);
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${courseResults.success} courses and ${studentResults.success} students. Errors: ${courseResults.errors + studentResults.errors}`
      });

      // Clear previews after successful import
      setPreviewStudents([]);
      setPreviewCourses([]);
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Integrations</h1>
            <p className="text-slate-500 mt-2">Connect external tools and import data into your system.</p>
          </div>

          <div className="grid gap-6">
            {/* PowerPro Integration Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>PowerPro SMS API</CardTitle>
                      <CardDescription>Import students, courses, and enrollments</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isConfigured ? "default" : "outline"} className={isConfigured ? "bg-green-500 hover:bg-green-600" : ""}>
                    {isConfigured ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {!isConfigured ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">PowerPro API Key</Label>
                      <Input 
                        id="api-key"
                        type="password" 
                        placeholder="Enter your API key..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <p className="text-sm text-slate-500">
                        You can find this in your PowerPro administration dashboard under API Settings.
                      </p>
                    </div>
                    <Button onClick={handleSaveConfig}>Save Configuration</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border">
                      <Settings className="h-5 w-5 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">API Connection Active</p>
                        <p className="text-sm text-slate-500">Connected with provided credentials</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleRemoveConfig}>
                        Disconnect
                      </Button>
                    </div>

                    {!previewStudents.length && !previewCourses.length ? (
                      <Button 
                        onClick={handleFetchPreview} 
                        disabled={loading}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {loading ? "Fetching Data..." : "Fetch Data for Import"}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="bg-slate-50 border-dashed">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium">Students</p>
                                <p className="text-2xl font-bold">{previewStudents.length}</p>
                              </div>
                              <Users className="h-8 w-8 text-slate-300" />
                            </CardContent>
                          </Card>
                          <Card className="bg-slate-50 border-dashed">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium">Courses</p>
                                <p className="text-2xl font-bold">{previewCourses.length}</p>
                              </div>
                              <GraduationCap className="h-8 w-8 text-slate-300" />
                            </CardContent>
                          </Card>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium">Ready to Import</p>
                            <p>This will create new user accounts and course templates. Imported users will be assigned default passwords and will need to reset them upon first login.</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button 
                            onClick={handleImport} 
                            disabled={importing}
                            className="flex-1"
                          >
                            {importing ? "Importing Data..." : "Start Import"}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setPreviewStudents([]);
                              setPreviewCourses([]);
                            }}
                            disabled={importing}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

// Need these icons for the UI above
import { Users, GraduationCap } from "lucide-react";