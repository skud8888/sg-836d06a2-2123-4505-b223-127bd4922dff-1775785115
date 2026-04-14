import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Filter,
  Award,
  Camera,
  TrendingUp,
  Users,
  RefreshCw,
  FileImage,
  FileVideo
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Document = Tables<"documents">;
type Certificate = Tables<"certificates">;
type EvidenceCapture = Tables<"evidence_capture">;
type DocumentAuditLog = Tables<"document_audit_logs">;

interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  documentsByType: Record<string, number>;
  recentUploads: number;
  uploaderBreakdown: Array<{ name: string; count: number }>;
}

interface CertificateStats {
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  recentCertificates: number;
  courseBreakdown: Array<{ course: string; count: number }>;
}

interface EvidenceStats {
  totalEvidence: number;
  photoCount: number;
  videoCount: number;
  recentCaptures: number;
  typeBreakdown: Record<string, number>;
}

export default function DocumentReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [evidence, setEvidence] = useState<EvidenceCapture[]>([]);
  const [auditLogs, setAuditLogs] = useState<DocumentAuditLog[]>([]);
  
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(null);
  const [certificateStats, setCertificateStats] = useState<CertificateStats | null>(null);
  const [evidenceStats, setEvidenceStats] = useState<EvidenceStats | null>(null);

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("all");
  const [certificateStatus, setCertificateStatus] = useState<string>("all");
  const [evidenceType, setEvidenceType] = useState<string>("all");

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/admin/login");
      return;
    }

    const role = await rbacService.getUserPrimaryRole();
    if (!role || !["super_admin", "admin"].includes(role)) {
      router.push("/admin");
      return;
    }

    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    await Promise.all([
      loadDocuments(),
      loadCertificates(),
      loadEvidence(),
      loadAuditLogs()
    ]);
  };

  const loadDocuments = async () => {
    let query = supabase
      .from("documents")
      .select(`
        *,
        uploaded_by_profile:profiles!documents_uploaded_by_fkey(full_name, email),
        booking:bookings(student_name)
      `)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false });

    if (dateFrom) {
      query = query.gte("uploaded_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("uploaded_at", dateTo);
    }
    if (documentType !== "all") {
      query = query.eq("document_type", documentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading documents:", error);
      return;
    }

    setDocuments(data || []);
    calculateDocumentStats(data || []);
  };

  const loadCertificates = async () => {
    let query = supabase
      .from("certificates")
      .select(`
        *,
        student:profiles!certificates_student_id_fkey(full_name, email),
        course:course_templates!certificates_course_template_id_fkey(name)
      `)
      .order("issue_date", { ascending: false });

    if (dateFrom) {
      query = query.gte("issue_date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("issue_date", dateTo);
    }
    if (certificateStatus !== "all") {
      query = query.eq("status", certificateStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading certificates:", error);
      return;
    }

    setCertificates(data || []);
    calculateCertificateStats(data || []);
  };

  const loadEvidence = async () => {
    let query = supabase
      .from("evidence_capture")
      .select(`
        *,
        booking:bookings(student_name),
        class:scheduled_classes(location, start_datetime)
      `)
      .order("captured_at", { ascending: false });

    if (dateFrom) {
      query = query.gte("captured_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("captured_at", dateTo);
    }
    if (evidenceType !== "all") {
      query = query.eq("evidence_type", evidenceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading evidence:", error);
      return;
    }

    setEvidence(data || []);
    calculateEvidenceStats(data || []);
  };

  const loadAuditLogs = async () => {
    let query = supabase
      .from("document_audit_logs")
      .select(`
        *,
        document:documents(file_name),
        performer:profiles!document_audit_logs_performed_by_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading audit logs:", error);
      return;
    }

    setAuditLogs(data || []);
  };

  const calculateDocumentStats = (docs: Document[]) => {
    const totalSize = docs.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    
    const documentsByType = docs.reduce((acc, doc) => {
      acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUploads = docs.filter(
      doc => new Date(doc.uploaded_at || "") > sevenDaysAgo
    ).length;

    const uploaderMap = new Map<string, number>();
    docs.forEach(doc => {
      const uploader = (doc as any).uploaded_by_profile?.full_name || 
                       (doc as any).uploaded_by_profile?.email || 
                       "Unknown";
      uploaderMap.set(uploader, (uploaderMap.get(uploader) || 0) + 1);
    });

    const uploaderBreakdown = Array.from(uploaderMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setDocumentStats({
      totalDocuments: docs.length,
      totalSize,
      documentsByType,
      recentUploads,
      uploaderBreakdown
    });
  };

  const calculateCertificateStats = (certs: Certificate[]) => {
    const activeCertificates = certs.filter(c => c.status === "active").length;
    const revokedCertificates = certs.filter(c => c.status === "revoked").length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCertificates = certs.filter(
      cert => new Date(cert.issue_date) > sevenDaysAgo
    ).length;

    const courseMap = new Map<string, number>();
    certs.forEach(cert => {
      const course = (cert as any).course?.name || "Unknown Course";
      courseMap.set(course, (courseMap.get(course) || 0) + 1);
    });

    const courseBreakdown = Array.from(courseMap.entries())
      .map(([course, count]) => ({ course, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setCertificateStats({
      totalCertificates: certs.length,
      activeCertificates,
      revokedCertificates,
      recentCertificates,
      courseBreakdown
    });
  };

  const calculateEvidenceStats = (ev: EvidenceCapture[]) => {
    const photoCount = ev.filter(e => 
      e.mime_type?.startsWith("image/")
    ).length;
    
    const videoCount = ev.filter(e => 
      e.mime_type?.startsWith("video/")
    ).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCaptures = ev.filter(
      e => new Date(e.captured_at || "") > sevenDaysAgo
    ).length;

    const typeBreakdown = ev.reduce((acc, e) => {
      acc[e.evidence_type] = (acc[e.evidence_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setEvidenceStats({
      totalEvidence: ev.length,
      photoCount,
      videoCount,
      recentCaptures,
      typeBreakdown
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    loadAllData().then(() => setLoading(false));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Document & Certificate Reports</h1>
              <p className="text-muted-foreground">
                Comprehensive overview of all document uploads, certificates, and evidence
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <Label>Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="student_id">Student ID</SelectItem>
                      <SelectItem value="evidence_photo">Evidence Photo</SelectItem>
                      <SelectItem value="evidence_video">Evidence Video</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="sign_in_sheet">Sign-in Sheet</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Certificate Status</Label>
                  <Select value={certificateStatus} onValueChange={setCertificateStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="revoked">Revoked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Evidence Type</Label>
                  <Select value={evidenceType} onValueChange={setEvidenceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="attendance_photo">Attendance Photo</SelectItem>
                      <SelectItem value="practical_assessment">Practical Assessment</SelectItem>
                      <SelectItem value="completed_work">Completed Work</SelectItem>
                      <SelectItem value="safety_compliance">Safety Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={loadAllData}>Apply Filters</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setDocumentType("all");
                    setCertificateStatus("all");
                    setEvidenceType("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">{documentStats?.totalDocuments || 0}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Size: {formatBytes(documentStats?.totalSize || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Recent (7 days): {documentStats?.recentUploads || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">{certificateStats?.totalCertificates || 0}</div>
                  <div className="text-sm text-muted-foreground">
                    Active: {certificateStats?.activeCertificates || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Recent (7 days): {certificateStats?.recentCertificates || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-green-600" />
                  Evidence Captures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">{evidenceStats?.totalEvidence || 0}</div>
                  <div className="text-sm text-muted-foreground">
                    Photos: {evidenceStats?.photoCount || 0} | Videos: {evidenceStats?.videoCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Recent (7 days): {evidenceStats?.recentCaptures || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Document Upload History</CardTitle>
                  <CardDescription>All document uploads across the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded By</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Version</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.file_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {doc.document_type.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatBytes(doc.file_size || 0)}</TableCell>
                          <TableCell>
                            {(doc as any).uploaded_by_profile?.full_name || 
                             (doc as any).uploaded_by_profile?.email || 
                             "System"}
                          </TableCell>
                          <TableCell>{(doc as any).booking?.student_name || "N/A"}</TableCell>
                          <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                          <TableCell>
                            <Badge variant={doc.is_latest_version ? "default" : "outline"}>
                              v{doc.version}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Generation Log</CardTitle>
                  <CardDescription>All certificates issued by the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate #</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Completion Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verification Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-mono">{cert.certificate_number}</TableCell>
                          <TableCell>
                            {(cert as any).student?.full_name || 
                             (cert as any).student?.email}
                          </TableCell>
                          <TableCell>{(cert as any).course?.name}</TableCell>
                          <TableCell>{new Date(cert.issue_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {cert.completion_date ? new Date(cert.completion_date).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={cert.status === "active" ? "default" : "destructive"}
                            >
                              {cert.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {cert.verification_code}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evidence Tab */}
            <TabsContent value="evidence">
              <Card>
                <CardHeader>
                  <CardTitle>Evidence Capture Log</CardTitle>
                  <CardDescription>All photos and videos captured in the field</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Media</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Captured Date</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidence.map((ev) => (
                        <TableRow key={ev.id}>
                          <TableCell className="font-medium">{ev.file_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {ev.evidence_type.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {ev.mime_type?.startsWith("image/") ? (
                              <FileImage className="h-4 w-4 text-blue-600" />
                            ) : (
                              <FileVideo className="h-4 w-4 text-purple-600" />
                            )}
                          </TableCell>
                          <TableCell>{(ev as any).booking?.student_name || "N/A"}</TableCell>
                          <TableCell>{(ev as any).class?.location || "N/A"}</TableCell>
                          <TableCell>{formatDate(ev.captured_at)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {ev.description || "No description"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Document Audit Trail</CardTitle>
                  <CardDescription>Complete history of document access and modifications (Last 100 entries)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDate(log.created_at)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.action === "created" ? "default" :
                                log.action === "deleted" ? "destructive" :
                                "secondary"
                              }
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>{(log as any).document?.file_name || "Unknown"}</TableCell>
                          <TableCell>
                            {(log as any).performer?.full_name || 
                             (log as any).performer?.email || 
                             "System"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {JSON.stringify(log.metadata || {})}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}