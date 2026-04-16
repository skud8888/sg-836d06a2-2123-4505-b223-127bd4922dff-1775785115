import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { gamificationService } from "@/services/gamificationService";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Award,
  TrendingUp,
  Zap,
  Star,
  Target,
  Medal,
  Flame,
  Crown,
  Loader2,
  Gift,
  ChevronRight
} from "lucide-react";

export default function GamificationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    await loadGamificationData(user.id);
  };

  const loadGamificationData = async (userId: string) => {
    setLoading(true);
    try {
      // Load stats
      const statsData = await gamificationService.getStudentStats(userId);
      setStats(statsData);

      // Load badges
      const badgesData = await gamificationService.getStudentBadges(userId);
      setBadges(badgesData);

      // Load point history
      const historyData = await gamificationService.getPointHistory(userId);
      setHistory(historyData);

      // Load leaderboard
      const leaderboardData = await gamificationService.getLeaderboard(20);
      setLeaderboard(leaderboardData);

      // Find user's rank
      const rank = leaderboardData.findIndex(entry => entry.student_id === userId) + 1;
      setUserRank(rank > 0 ? rank : null);

      // Update streak
      await gamificationService.updateStreak(userId);

      // Check for new achievements
      const newBadges = await gamificationService.checkAchievements(userId);
      if (newBadges.length > 0) {
        toast({
          title: "New Achievement!",
          description: `You earned: ${newBadges.map(b => b.badge_name).join(", ")}`,
          duration: 5000
        });
        // Reload badges
        const updatedBadges = await gamificationService.getStudentBadges(userId);
        setBadges(updatedBadges);
      }
    } catch (err: any) {
      console.error("Error loading gamification data:", err);
      toast({
        title: "Error",
        description: "Failed to load gamification data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelName = (level: number) => {
    if (level < 5) return "Beginner";
    if (level < 10) return "Learner";
    if (level < 20) return "Scholar";
    if (level < 30) return "Expert";
    if (level < 50) return "Master";
    return "Legend";
  };

  const getStreakIcon = (days: number) => {
    if (days >= 100) return "🔥🔥🔥";
    if (days >= 30) return "🔥🔥";
    if (days >= 7) return "🔥";
    return "⭐";
  };

  if (loading) {
    return (
      <>
        <SEO title="Achievements & Rewards" />
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Achievements & Rewards" />
      <Navigation />
      <div className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Your Achievements</h1>
            <p className="text-muted-foreground">Track your progress, earn badges, and climb the leaderboard!</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Points</CardTitle>
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.total_points || 0}</div>
                <Progress value={((stats?.total_points || 0) % 1000) / 10} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Current Level</CardTitle>
                  <Trophy className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Level {stats?.current_level || 1}</div>
                <p className="text-sm text-muted-foreground mt-1">{getLevelName(stats?.current_level || 1)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Learning Streak</CardTitle>
                  <Flame className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {stats?.streak_days || 0} {getStreakIcon(stats?.streak_days || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Days in a row</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rank</CardTitle>
                  <Medal className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {userRank ? `#${userRank}` : "Unranked"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Global ranking</p>
              </CardContent>
            </Card>
          </div>

          {/* Level Progress */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Level Progress
              </CardTitle>
              <CardDescription>
                {stats?.points_to_next_level || 0} points until next level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress 
                value={stats?.points_to_next_level 
                  ? ((stats.total_points - (Math.pow(stats.current_level - 1, 2) * 100)) / (stats.points_to_next_level + (stats.total_points - (Math.pow(stats.current_level - 1, 2) * 100)))) * 100
                  : 0
                } 
                className="h-3"
              />
            </CardContent>
          </Card>

          <Tabs defaultValue="badges" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="badges">
                <Award className="h-4 w-4 mr-2" />
                Badges ({badges.length})
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="history">
                <TrendingUp className="h-4 w-4 mr-2" />
                Point History
              </TabsTrigger>
            </TabsList>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-4">
              {badges.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Badges Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete courses and maintain learning streaks to earn badges!
                    </p>
                    <Button asChild>
                      <Link href="/student/portal">
                        Start Learning
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <Card key={badge.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{badge.badge_name}</CardTitle>
                            <CardDescription>{badge.badge_description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {badge.badge_type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Gift className="h-4 w-4" />
                            +{badge.points_awarded} points
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(badge.earned_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    Top Learners
                  </CardTitle>
                  <CardDescription>
                    See how you stack up against other students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          entry.student_id === stats?.student_id
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            index === 0 ? "bg-yellow-500 text-white" :
                            index === 1 ? "bg-gray-400 text-white" :
                            index === 2 ? "bg-orange-700 text-white" :
                            "bg-muted"
                          }`}>
                            {entry.rank}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {entry.full_name}
                              {entry.student_id === stats?.student_id && (
                                <Badge variant="outline" className="ml-2">You</Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {entry.badges_count} badges earned
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{entry.total_points}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your point earning history</CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No activity yet. Start learning to earn points!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{transaction.description || transaction.action_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className={`font-bold ${transaction.points > 0 ? "text-green-600" : "text-red-600"}`}>
                            {transaction.points > 0 ? "+" : ""}{transaction.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Back to Portal */}
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/student/portal">
                Back to Student Portal
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}