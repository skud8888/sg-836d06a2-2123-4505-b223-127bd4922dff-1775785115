import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { batchReportService } from "@/services/batchReportService";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Calendar,
  Download,
  Send,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  BarChart,
} from "lucide-react";

interface BatchReport {
  id: string;
  report_type: string;
  report_name: string;
  generated_at: string;
  status: string;
  recipients: string[];
  file_url?: string;
  data?: any;
}

export default function BatchReportsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<BatchReport[]>([]);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [reportName, setReportName] = useState("");
  const [recipients, setRecipients] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/admin/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "admin"].includes(profile.role)) {
      router.push("/");
      return;
    }

    await loadReports();
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await batchReportService.getScheduledReports();
      setReports(data);
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a report name",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Generate the report data
      let reportData;
      if (reportType === "daily") {
        const { report } = await batchReportService.generateDailySummary();
        reportData = report;
      } else if (reportType === "weekly") {
        const { report } = await batchReportService.generateWeeklySummary();
        reportData = report;
      } else {
        const { report } = await batchReportService.generateMonthlySummary();
        reportData = report;
      }

      // Schedule the report
      const recipientList = recipients
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r);

      const { id, error } = await batchReportService.scheduleReport(
        reportType,
        reportName,
        recipientList
      );

      if (error) throw error;

      // Update with report data
      if (id) {
        await supabase
          .from("batch_reports")
          .update({
            data: reportData,
            status: "sent",
          })
          .eq("id", id);
      }

      toast({
        title: "Report Generated",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report created successfully`,
      });

      setReportName("");
      setRecipients("");
      setDialogOpen(false);
      await loadReports();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <SEO
        title="Batch Reports - Admin Dashboard"
        description="Automated reporting system"
      />
      <Navigation />

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Batch Reports</h1>
              <p className="text-muted-foreground">
                Automated daily, weekly, and monthly summaries
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin">← Back to Dashboard</Link>
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate New Report</DialogTitle>
                    <DialogDescription>
                      Create and schedule a new batch report
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Report Type</Label>
                      <Select
                        value={reportType}
                        onValueChange={(v: any) => setReportType(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily Summary</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                          <SelectItem value="monthly">Monthly Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Report Name</Label>
                      <Input
                        placeholder="e.g., Weekly Sales Report"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Recipients (comma-separated emails)</Label>
                      <Input
                        placeholder="admin@example.com, manager@example.com"
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleGenerateReport}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Generate & Send
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
              setReportType("daily");
              setReportName(`Daily Report - ${new Date().toLocaleDateString()}`);
              setDialogOpen(true);
            }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Daily Report
                </CardTitle>
                <CardDescription>Generate today's summary</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
              setReportType("weekly");
              setReportName(`Weekly Report - ${new Date().toLocaleDateString()}`);
              setDialogOpen(true);
            }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Weekly Report
                </CardTitle>
                <CardDescription>Last 7 days overview</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
              setReportType("monthly");
              setReportName(`Monthly Report - ${new Date().toLocaleDateString()}`);
              setDialogOpen(true);
            }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-purple-600" />
                  Monthly Report
                </CardTitle>
                <CardDescription>This month's performance</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>Recent automated reports</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reports generated yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{report.report_name}</h3>
                          {getStatusBadge(report.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.generated_at).toLocaleDateString()}
                          </span>
                          <span className="capitalize">{report.report_type}</span>
                          <span>{report.recipients?.length || 0} recipients</span>
                        </div>
                      </div>
                      {report.data && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(report.data, null, 2)], {
                              type: "application/json",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${report.report_name}.json`;
                            a.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}