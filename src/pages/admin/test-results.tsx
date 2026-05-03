import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  PlayCircle,
  Clock,
  TrendingUp,
  FileText,
  Download
} from "lucide-react";

interface TestResult {
  id: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
  timestamp: Date;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
}

export default function TestResults() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/admin/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (!roleData || !["super_admin", "admin"].includes(roleData.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view test results",
          variant: "destructive",
        });
        router.push("/admin");
        return;
      }

      await loadTestResults();
    } catch (error: any) {
      console.error("Access check error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadTestResults() {
    // Simulated test results - in production, these would come from actual test runs
    const mockSuites: TestSuite[] = [
      {
        name: "Authentication Tests",
        duration: 2340,
        passed: 8,
        failed: 0,
        skipped: 1,
        tests: [
          { id: "1", name: "User can sign in with valid credentials", status: "passed", duration: 234, timestamp: new Date() },
          { id: "2", name: "User cannot sign in with invalid credentials", status: "passed", duration: 189, timestamp: new Date() },
          { id: "3", name: "User can sign out successfully", status: "passed", duration: 156, timestamp: new Date() },
          { id: "4", name: "Password reset flow works correctly", status: "passed", duration: 567, timestamp: new Date() },
          { id: "5", name: "Session persists across page refresh", status: "passed", duration: 234, timestamp: new Date() },
          { id: "6", name: "Protected routes redirect to login", status: "passed", duration: 178, timestamp: new Date() },
          { id: "7", name: "Email verification works", status: "passed", duration: 456, timestamp: new Date() },
          { id: "8", name: "Two-factor authentication", status: "skipped", duration: 0, timestamp: new Date() },
          { id: "9", name: "OAuth providers work correctly", status: "passed", duration: 326, timestamp: new Date() }
        ]
      },
      {
        name: "Booking Flow Tests",
        duration: 4567,
        passed: 6,
        failed: 1,
        skipped: 0,
        tests: [
          { id: "10", name: "Student can browse available courses", status: "passed", duration: 345, timestamp: new Date() },
          { id: "11", name: "Student can view class schedule", status: "passed", duration: 278, timestamp: new Date() },
          { id: "12", name: "Student can select and book a class", status: "passed", duration: 567, timestamp: new Date() },
          { id: "13", name: "Payment processing completes successfully", status: "passed", duration: 1234, timestamp: new Date() },
          { id: "14", name: "Booking confirmation email is sent", status: "failed", duration: 456, error: "SMTP connection timeout", timestamp: new Date() },
          { id: "15", name: "Booking appears in student portal", status: "passed", duration: 234, timestamp: new Date() },
          { id: "16", name: "Duplicate bookings are prevented", status: "passed", duration: 189, timestamp: new Date() }
        ]
      },
      {
        name: "Admin Dashboard Tests",
        duration: 3456,
        passed: 10,
        failed: 0,
        skipped: 0,
        tests: [
          { id: "17", name: "Admin can access dashboard", status: "passed", duration: 234, timestamp: new Date() },
          { id: "18", name: "Dashboard displays correct statistics", status: "passed", duration: 567, timestamp: new Date() },
          { id: "19", name: "Admin can view all bookings", status: "passed", duration: 345, timestamp: new Date() },
          { id: "20", name: "Admin can create new course", status: "passed", duration: 456, timestamp: new Date() },
          { id: "21", name: "Admin can edit course details", status: "passed", duration: 389, timestamp: new Date() },
          { id: "22", name: "Admin can manage user roles", status: "passed", duration: 278, timestamp: new Date() },
          { id: "23", name: "Admin can view analytics", status: "passed", duration: 456, timestamp: new Date() },
          { id: "24", name: "Admin can export reports", status: "passed", duration: 234, timestamp: new Date() },
          { id: "25", name: "Admin can manage payments", status: "passed", duration: 345, timestamp: new Date() },
          { id: "26", name: "Admin can access system health", status: "passed", duration: 234, timestamp: new Date() }
        ]
      },
      {
        name: "API Integration Tests",
        duration: 5678,
        passed: 7,
        failed: 0,
        skipped: 2,
        tests: [
          { id: "27", name: "Database connections are healthy", status: "passed", duration: 123, timestamp: new Date() },
          { id: "28", name: "Supabase Auth API responds correctly", status: "passed", duration: 234, timestamp: new Date() },
          { id: "29", name: "Storage API uploads work", status: "passed", duration: 567, timestamp: new Date() },
          { id: "30", name: "Email service sends correctly", status: "passed", duration: 456, timestamp: new Date() },
          { id: "31", name: "SMS service integration", status: "skipped", duration: 0, timestamp: new Date() },
          { id: "32", name: "Payment gateway integration", status: "passed", duration: 1234, timestamp: new Date() },
          { id: "33", name: "PDF generation works", status: "passed", duration: 789, timestamp: new Date() },
          { id: "34", name: "Certificate generation works", status: "passed", duration: 678, timestamp: new Date() },
          { id: "35", name: "Webhook endpoints respond", status: "skipped", duration: 0, timestamp: new Date() }
        ]
      }
    ];

    setTestSuites(mockSuites);
    if (mockSuites.length > 0) {
      setSelectedSuite(mockSuites[0].name);
    }
  }

  async function exportResults() {
    const report = testSuites.map(suite => ({
      suite: suite.name,
      total: suite.tests.length,
      passed: suite.passed,
      failed: suite.failed,
      skipped: suite.skipped,
      duration: suite.duration,
      tests: suite.tests.map(test => ({
        name: test.name,
        status: test.status,
        duration: test.duration,
        error: test.error
      }))
    }));

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString()}.json`;
    a.click();

    toast({
      title: "Export Complete",
      description: "Test results have been downloaded"
    });
  }

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0);
  const totalSkipped = testSuites.reduce((sum, suite) => sum + suite.skipped, 0);
  const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading test results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentSuite = testSuites.find(s => s.name === selectedSuite);

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <PlayCircle className="h-8 w-8 text-primary" />
                Test Results
              </h1>
              <p className="text-muted-foreground mt-2">
                Automated test execution results and coverage reports
              </p>
            </div>
            <Button onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalTests}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {testSuites.length} suites
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Passed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{totalPassed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {passRate.toFixed(1)}% pass rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{totalFailed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalTests > 0 ? ((totalFailed / totalTests) * 100).toFixed(1) : 0}% failure rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Skipped
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{totalSkipped}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalTests > 0 ? ((totalSkipped / totalTests) * 100).toFixed(1) : 0}% skipped
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Test Suites */}
          <Card>
            <CardHeader>
              <CardTitle>Test Suites</CardTitle>
              <CardDescription>
                Detailed results from automated test execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedSuite || ""} onValueChange={setSelectedSuite}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  {testSuites.map(suite => (
                    <TabsTrigger key={suite.name} value={suite.name}>
                      {suite.name.split(' ')[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {testSuites.map(suite => (
                  <TabsContent key={suite.name} value={suite.name} className="space-y-6">
                    {/* Suite Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{suite.tests.length}</div>
                          <p className="text-sm text-muted-foreground">Total Tests</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-green-600">{suite.passed}</div>
                          <p className="text-sm text-muted-foreground">Passed</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-red-600">{suite.failed}</div>
                          <p className="text-sm text-muted-foreground">Failed</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{suite.duration}ms</div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Pass Rate Progress */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Pass Rate</span>
                        <span className="text-sm font-medium">
                          {((suite.passed / suite.tests.length) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={(suite.passed / suite.tests.length) * 100} className="h-3" />
                    </div>

                    {/* Individual Tests */}
                    <div className="space-y-2">
                      {suite.tests.map(test => (
                        <Card key={test.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                {test.status === "passed" && (
                                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                )}
                                {test.status === "failed" && (
                                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                )}
                                {test.status === "skipped" && (
                                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <div className="font-medium">{test.name}</div>
                                  {test.error && (
                                    <div className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded">
                                      {test.error}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {test.duration}ms
                                </div>
                                <Badge variant={
                                  test.status === "passed" ? "default" :
                                  test.status === "failed" ? "destructive" :
                                  "secondary"
                                }>
                                  {test.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}