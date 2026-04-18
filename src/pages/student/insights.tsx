import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { studentInsightsService } from "@/services/studentInsightsService";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  Trophy,
  Loader2,
  RefreshCw,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  data: any;
}

export default function StudentInsightsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    setUser(user);
    await loadInsights(user.id);
  };

  const loadInsights = async (userId: string) => {
    setLoading(true);
    try {
      const data = await studentInsightsService.getInsights(userId);
      setInsights(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to load insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      await studentInsightsService.generateInsights(user.id);
      await loadInsights(user.id);

      toast({
        title: "Insights Generated",
        description: "Your AI insights have been updated",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsRead = async (insightId: string) => {
    try {
      await studentInsightsService.markAsRead(insightId);
      setInsights((prev) =>
        prev.map((i) => (i.id === insightId ? { ...i, is_read: true } : i))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "learning_pattern":
        return <Brain className="h-5 w-5" />;
      case "strength":
        return <Trophy className="h-5 w-5" />;
      case "improvement_area":
        return <Target className="h-5 w-5" />;
      case "recommendation":
        return <Lightbulb className="h-5 w-5" />;
      case "milestone":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "learning_pattern":
        return "text-blue-600 bg-blue-100";
      case "strength":
        return "text-green-600 bg-green-100";
      case "improvement_area":
        return "text-orange-600 bg-orange-100";
      case "recommendation":
        return "text-purple-600 bg-purple-100";
      case "milestone":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <>
      <SEO
        title="AI Insights - Student Portal"
        description="Personalized learning insights powered by AI"
      />
      <Navigation />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">AI Insights</h1>
                <p className="text-muted-foreground">
                  Personalized recommendations powered by AI
                </p>
              </div>
              <Button onClick={handleGenerateInsights} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Insights
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : insights.length === 0 ? (
            /* Empty State */
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Insights Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Complete more courses to unlock personalized AI insights
                </p>
                <Button onClick={handleGenerateInsights} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Insights
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Insights Grid */
            <div className="grid gap-4">
              {insights.map((insight) => (
                <Card
                  key={insight.id}
                  className={`relative hover:shadow-lg transition-shadow ${
                    !insight.is_read ? "border-l-4 border-l-primary" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`p-2 rounded-lg ${getInsightColor(
                            insight.insight_type
                          )}`}
                        >
                          {getInsightIcon(insight.insight_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">
                              {insight.title}
                            </CardTitle>
                            {!insight.is_read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{insight.description}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={
                          insight.priority === "high"
                            ? "destructive"
                            : insight.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Generated{" "}
                        {new Date(insight.created_at).toLocaleDateString()}
                      </p>
                      {!insight.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(insight.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Back to Portal */}
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/student/portal">← Back to Student Portal</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}