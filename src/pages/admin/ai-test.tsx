import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { aiAgentService } from "@/services/aiAgentService";
import { recommendationService } from "@/services/recommendationService";
import { gamificationService } from "@/services/gamificationService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play, CheckCircle, XCircle, Loader2, Brain, TrendingUp, Star } from "lucide-react";

export default function AITestPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [bookingId, setBookingId] = useState("");
  const [studentId, setStudentId] = useState("");

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
      toast({
        title: `✅ ${testName} Passed`,
        description: "Test completed successfully"
      });
    } catch (error: any) {
      setResults(prev => ({ ...prev, [testName]: { success: false, error: error.message } }));
      toast({
        title: `❌ ${testName} Failed`,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testChurnRisk = () => runTest("Churn Risk Analysis", async () => {
    if (!bookingId) throw new Error("Enter a booking ID first");
    const result = await aiAgentService.analyzeChurnRisk(bookingId);
    return result;
  });

  const testUpsellDetection = () => runTest("Upsell Detection", async () => {
    if (!bookingId) throw new Error("Enter a booking ID first");
    const result = await aiAgentService.detectUpsellOpportunity(bookingId);
    return result;
  });

  const testNoShowPrediction = () => runTest("No-Show Prediction", async () => {
    if (!bookingId) throw new Error("Enter a booking ID first");
    const result = await aiAgentService.predictNoShowRisk(bookingId);
    return result;
  });

  const testFullBookingAnalysis = () => runTest("Full Booking Analysis", async () => {
    if (!bookingId) throw new Error("Enter a booking ID first");
    const result = await aiAgentService.analyzeBooking(bookingId);
    return result;
  });

  const testRecommendations = () => runTest("Course Recommendations", async () => {
    if (!studentId) throw new Error("Enter a student ID first");
    await recommendationService.generateRecommendations(studentId);
    const recs = await recommendationService.getRecommendations(studentId);
    return recs;
  });

  const testGamificationStats = () => runTest("Gamification Stats", async () => {
    if (!studentId) throw new Error("Enter a student ID first");
    const stats = await gamificationService.getStudentStats(studentId);
    return stats;
  });

  const testDatabaseFunctions = () => runTest("Database Functions", async () => {
    const { data, error } = await supabase.rpc("calculate_churn_risk", {
      p_booking_id: bookingId || "00000000-0000-0000-0000-000000000000"
    });
    if (error) throw error;
    return data;
  });

  const getFirstBooking = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("id")
      .limit(1)
      .single();
    if (data) setBookingId(data.id);
  };

  const getFirstStudent = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .limit(1)
      .single();
    if (data) setStudentId(data.id);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold">AI Systems Testing</h1>
          <p className="text-muted-foreground">Test and verify all AI features</p>
        </div>

        {/* Test Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
            <CardDescription>Enter IDs or auto-fetch from database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Booking ID</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter booking UUID"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                  />
                  <Button variant="outline" onClick={getFirstBooking}>
                    Auto-Fill
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Student ID</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter student UUID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                  <Button variant="outline" onClick={getFirstStudent}>
                    Auto-Fill
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Agent Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Agent Service Tests
            </CardTitle>
            <CardDescription>Churn risk, upsell detection, no-show prediction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <TestButton
                label="Churn Risk Analysis"
                onClick={testChurnRisk}
                loading={loading["Churn Risk Analysis"]}
                result={results["Churn Risk Analysis"]}
              />
              <TestButton
                label="Upsell Detection"
                onClick={testUpsellDetection}
                loading={loading["Upsell Detection"]}
                result={results["Upsell Detection"]}
              />
              <TestButton
                label="No-Show Prediction"
                onClick={testNoShowPrediction}
                loading={loading["No-Show Prediction"]}
                result={results["No-Show Prediction"]}
              />
              <TestButton
                label="Full Booking Analysis"
                onClick={testFullBookingAnalysis}
                loading={loading["Full Booking Analysis"]}
                result={results["Full Booking Analysis"]}
              />
            </div>
            {results["Full Booking Analysis"]?.data && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Last Result:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(results["Full Booking Analysis"].data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendation Engine Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Recommendation Engine Tests
            </CardTitle>
            <CardDescription>Personalized course recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TestButton
              label="Course Recommendations"
              onClick={testRecommendations}
              loading={loading["Course Recommendations"]}
              result={results["Course Recommendations"]}
              fullWidth
            />
            {results["Course Recommendations"]?.data && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">
                  Found {results["Course Recommendations"].data.length} recommendations:
                </p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(results["Course Recommendations"].data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gamification Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Gamification System Tests
            </CardTitle>
            <CardDescription>Points, levels, badges, streaks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TestButton
              label="Gamification Stats"
              onClick={testGamificationStats}
              loading={loading["Gamification Stats"]}
              result={results["Gamification Stats"]}
              fullWidth
            />
            {results["Gamification Stats"]?.data && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Student Stats:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(results["Gamification Stats"].data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Functions Test */}
        <Card>
          <CardHeader>
            <CardTitle>Database Functions Test</CardTitle>
            <CardDescription>Direct database function calls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TestButton
              label="Database Functions"
              onClick={testDatabaseFunctions}
              loading={loading["Database Functions"]}
              result={results["Database Functions"]}
              fullWidth
            />
            {results["Database Functions"]?.data && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Function Result:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(results["Database Functions"].data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface TestButtonProps {
  label: string;
  onClick: () => void;
  loading: boolean;
  result?: { success: boolean; data?: any; error?: string };
  fullWidth?: boolean;
}

function TestButton({ label, onClick, loading, result, fullWidth }: TestButtonProps) {
  return (
    <div className={fullWidth ? "w-full" : ""}>
      <Button
        onClick={onClick}
        disabled={loading}
        variant={result?.success ? "default" : "outline"}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Running...
          </>
        ) : result?.success ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            {label} ✓
          </>
        ) : result?.success === false ? (
          <>
            <XCircle className="h-4 w-4 mr-2 text-red-600" />
            {label} ✗
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Test {label}
          </>
        )}
      </Button>
      {result?.error && (
        <p className="text-xs text-red-600 mt-1">{result.error}</p>
      )}
    </div>
  );
}