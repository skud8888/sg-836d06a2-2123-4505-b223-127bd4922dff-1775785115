import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Award, Download, Search, Eye, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { certificateService } from "@/services/certificateService";

interface Certificate {
  id: string;
  certificate_number: string;
  issue_date: string;
  completion_date: string;
  status: string;
  verification_code: string;
  course_templates: {
    name: string;
  };
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function CertificatesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
    loadCertificates();
  };

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select(`
          *,
          course_templates (name),
          profiles (full_name, email)
        `)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (err: any) {
      console.error("Error loading certificates:", err);
      toast({
        title: "Error",
        description: "Failed to load certificates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (cert: Certificate) => {
    try {
      const html = certificateService.generateCertificateHTML({
        studentName: cert.profiles.full_name || cert.profiles.email,
        courseName: cert.course_templates.name,
        completionDate: new Date(cert.completion_date).toLocaleDateString(),
        certificateNumber: cert.certificate_number,
        duration: 0, // Would need to fetch from course_templates
        template: null // Would use stored template
      });

      setPreviewHtml(html);
      setSelectedCertificate(cert);
      setPreviewOpen(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive"
      });
    }
  };

  const handleRevoke = async (certificateId: string) => {
    try {
      await certificateService.revokeCertificate(certificateId);
      toast({
        title: "Success",
        description: "Certificate revoked successfully"
      });
      loadCertificates();
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to revoke certificate",
        variant: "destructive"
      });
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const searchLower = searchQuery.toLowerCase();
    return (
      cert.certificate_number.toLowerCase().includes(searchLower) ||
      cert.profiles.full_name?.toLowerCase().includes(searchLower) ||
      cert.profiles.email.toLowerCase().includes(searchLower) ||
      cert.course_templates.name.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: certificates.length,
    active: certificates.filter(c => c.status === 'active').length,
    revoked: certificates.filter(c => c.status === 'revoked').length
  };

  return (
    <>
      <SEO
        title="Certificate Management - Admin"
        description="Manage course completion certificates"
      />
      <Navigation />
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Certificate Management</h1>
            <p className="text-muted-foreground">
              View and manage course completion certificates
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revoked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.revoked}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by certificate number, student name, or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Certificates List */}
          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading certificates...</p>
              </CardContent>
            </Card>
          ) : filteredCertificates.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No certificates found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "Certificates will appear here when students complete courses"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((cert) => (
                <Card key={cert.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            {cert.profiles.full_name || cert.profiles.email}
                          </h3>
                          <Badge variant={cert.status === 'active' ? 'default' : 'destructive'}>
                            {cert.status}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground ml-8">
                          <p><strong>Course:</strong> {cert.course_templates.name}</p>
                          <p><strong>Certificate #:</strong> {cert.certificate_number}</p>
                          <p><strong>Issued:</strong> {new Date(cert.issue_date).toLocaleDateString()}</p>
                          <p><strong>Completed:</strong> {new Date(cert.completion_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(cert)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>

                        {cert.status === 'active' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRevoke(cert.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Preview Dialog */}
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Certificate Preview</DialogTitle>
                <DialogDescription>
                  Certificate #{selectedCertificate?.certificate_number}
                </DialogDescription>
              </DialogHeader>

              <div className="border rounded-lg p-4 bg-white">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}