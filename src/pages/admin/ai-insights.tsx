import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { aiAgentService } from "@/services/aiAgentService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Brain, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type AIInsight = Tables<"ai_insights">;
type AIAction = Tables<"ai_action_queue">;

export default function AIInsightsDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [actions, setActions] = useState<AIAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    const [insightsData, actionsData] = await Promise.all([
      aiAgentService.getPendingInsights(),
      aiAgentService.getPendingActions()
    ]);

    setInsights(insightsData);
    setActions(actionsData);
    setLoading(false);
  };

  const handleReviewInsight = async (insightId: string, status: "reviewed" | "actioned" | "dismissed") => {
    const { success, error } = await aiAgentService.reviewInsight(insightId, status);
    
    if (success) {
      toast({ title: "Insight updated" });
      fetchData();
    } else {
      toast({
        title: "Error",
        description: error?.message || "Failed to update insight",
        variant: "destructive"
      });
    }
  };

  const handleReviewAction = async (actionId: string, approved: boolean) => {
    const { success, error } = await aiAgentService.reviewAction(actionId, approved);
    
    if (success) {
      toast({ 
        title: approved ? "Action approved and executed" : "Action rejected"
      });
      fetchData();
    } else {
      toast({
        title: "Error",
        description: error?.message || "Failed to review action",
        variant: "destructive"
      });
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "churn_risk":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "upsell_opportunity":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "no_show_risk":
        return <Clock className="h-5 w-5 text-red-500" />;
      default:
        return <Brain className="h-5 w-5 text-blue-500" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return "text-red-600";
    if (score >= 0.4) return "text-orange-600";
    return "text-green-600";
  };

  const stats = {
    totalInsights: insights.length,
    highRisk: insights.filter(i => (i.confidence_score || 0) >= 0.7).length,
    pendingActions: actions.length
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold">AI Insights & Automation</h1>
          <p className="text-muted-foreground">Smart predictions and recommended actions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalInsights}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Risk Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.highRisk}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingActions}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList>
            <TabsTrigger value="insights">AI Insights ({insights.length})</TabsTrigger>
            <TabsTrigger value="actions">Proposed Actions ({actions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">Loading insights...</CardContent>
              </Card>
            ) : insights.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending insights. AI is monitoring all bookings automatically.
                </CardContent>
              </Card>
            ) : (
              insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getInsightIcon(insight.insight_type)}
                        <div>
                          <CardTitle className="text-lg">
                            {insight.insight_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </CardTitle>
                          <CardDescription>
                            Confidence: <span className={getConfidenceColor(insight.confidence_score || 0)}>
                              {Math.round((insight.confidence_score || 0) * 100)}%
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={
                        (insight.confidence_score || 0) >= 0.7 ? "destructive" : "secondary"
                      }>
                        {(insight.confidence_score || 0) >= 0.7 ? "High Priority" : "Medium Priority"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium mb-2">Recommendation:</p>
                      <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                    </div>

                    {insight.prediction_data && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-medium mb-2">Details:</p>
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(insight.prediction_data, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReviewInsight(insight.id, "actioned")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Take Action
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewInsight(insight.id, "reviewed")}
                      >
                        Mark Reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReviewInsight(insight.id, "dismissed")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Dismiss
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Generated {insight.created_at ? format(new Date(insight.created_at), "PPP 'at' p") : ""}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">Loading actions...</CardContent>
              </Card>
            ) : actions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending actions require approval.
                </CardContent>
              </Card>
            ) : (
              actions.map((action) => (
                <Card key={action.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {action.action_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </CardTitle>
                        <CardDescription>
                          Confidence: {Math.round((action.confidence_score || 0) * 100)}%
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Awaiting Approval</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium mb-2">AI Reasoning:</p>
                      <p className="text-sm text-muted-foreground">{action.reasoning}</p>
                    </div>

                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-2">Proposed Action:</p>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(action.proposed_action, null, 2)}
                      </pre>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReviewAction(action.id, true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Execute
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReviewAction(action.id, false)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Proposed {action.created_at ? format(new Date(action.created_at), "PPP 'at' p") : ""}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}