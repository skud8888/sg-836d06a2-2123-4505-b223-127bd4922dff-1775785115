import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { DocumentPreviewer } from "@/components/DocumentPreviewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Award, Download, Eye, Calendar, FileText, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Certificate {
  id: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string | null;
  course_name: string;
  student_name: string;
  certificate_url: string | null;
  status: string;
}

export default function StudentCertificates() {
  const router = useRouter();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    checkAuthAndLoadCertificates();
  }, []);

  const checkAuthAndLoadCertificates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/admin/login");
      return;
    }

    await loadCertificates(user.id);
  };

  const loadCertificates = async (userId: string) => {
    setLoading(true);

    // Get certificates by student id
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        id,
        certificate_number,
        issue_date,
        completion_date,
        pdf_url,
        status,
        student:profiles!student_id (
          full_name
        ),
        course:course_templates!course_template_id (
          name
        )
      `)
      .eq("student_id", userId)
      .order("issue_date", { ascending: false });

    if (error) {
      console.error("Error loading certificates:", error);
      toast({
        title: "Error",
        description: "Failed to load certificates. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const formattedCertificates = (data || []).map((cert: any) => {
      const studentData = cert.student as any;
      const courseData = cert.course as any;

      return {
        id: cert.id,
        certificate_number: cert.certificate_number,
        issue_date: cert.issue_date,
        expiry_date: null, // Certificates don't have expiry_date in current schema
        course_name: courseData?.name || "Unknown Course",
        student_name: studentData?.full_name || "Student",
        certificate_url: cert.pdf_url, // Maps pdf_url to certificate_url
        status: cert.status
      };
    });

    setCertificates(formattedCertificates);
    setLoading(false);
  };

  const handlePreview = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setPreviewOpen(true);
  };

  const handleDownload = async (certificate: Certificate) => {
    if (!certificate.certificate_url) {
      toast({
        title: "No certificate file",
        description: "This certificate doesn't have a downloadable file yet.",
        variant: "destructive"
      });
      return;
    }

    // Trigger download
    const link = document.createElement("a");
    link.href = certificate.certificate_url;
    link.download = `Certificate_${certificate.certificate_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your certificate is being downloaded."
    });
  };

  if (loading) {
    return (
      <>
        <SEO 
          title="My Certificates"
          description="View and download your course certificates"
        />
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your certificates...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="My Certificates - Training Centre"
        description="View and download your course completion certificates"
      />
      <Navigation />

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/student/portal">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Portal
              </Button>
            </Link>
            
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Certificates</h1>
                <p className="text-muted-foreground">View and download your course completion certificates</p>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {certificates.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Complete a course to earn your first certificate!
                </p>
                <Link href="/courses">
                  <Button>Browse Courses</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Certificates Grid */}
          {certificates.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {certificates.map((certificate) => (
                <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          {certificate.course_name}
                        </CardTitle>
                        <CardDescription>
                          Certificate #{certificate.certificate_number}
                        </CardDescription>
                      </div>
                      <Badge variant={certificate.status === "issued" ? "default" : "secondary"}>
                        {certificate.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Certificate Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Issued to:</span>
                        <span className="font-medium">{certificate.student_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Issue Date:</span>
                        <span className="font-medium">
                          {new Date(certificate.issue_date).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </span>
                      </div>

                      {certificate.expiry_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Expires:</span>
                          <span className="font-medium">
                            {new Date(certificate.expiry_date).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {certificate.certificate_url && (
                        <>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handlePreview(certificate)}
                          >
                            <Eye className="mr-2 w-4 h-4" />
                            Preview
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={() => handleDownload(certificate)}
                          >
                            <Download className="mr-2 w-4 h-4" />
                            Download
                          </Button>
                        </>
                      )}
                      {!certificate.certificate_url && (
                        <Button variant="outline" className="w-full" disabled>
                          Certificate being generated...
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info Card */}
          {certificates.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">About Your Certificates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Certificates are issued upon successful completion of each course</p>
                <p>• All certificates are digitally signed and verifiable</p>
                <p>• Download and keep a copy for your records</p>
                <p>• Some certificates may have expiry dates and require renewal</p>
                <p>
                  • Need help? <Link href="/contact" className="text-primary hover:underline">Contact support</Link>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Document Previewer */}
      {selectedCertificate?.certificate_url && (
        <DocumentPreviewer
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          documentUrl={selectedCertificate.certificate_url}
          documentName={`Certificate_${selectedCertificate.certificate_number}.pdf`}
          documentType="application/pdf"
        />
      )}
    </>
  );
}