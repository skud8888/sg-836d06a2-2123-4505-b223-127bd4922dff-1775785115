import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { referralService } from "@/services/referralService";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Gift,
  Share2,
  Copy,
  Check,
  TrendingUp,
  Mail,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function ReferralsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    conversionRate: 0,
  });
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/student/portal");
        return;
      }

      setUser(user);
      await loadData(user.id);
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/student/portal");
    }
  };

  const loadData = async (userId: string) => {
    try {
      setLoading(true);

      const [codesResult, referralsResult, statsResult] = await Promise.all([
        referralService.getUserCodes(userId),
        referralService.getUserReferrals(userId),
        referralService.getReferralStats(userId),
      ]);

      setCodes(codesResult.codes);
      setReferrals(referralsResult.referrals);
      setStats(statsResult);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error loading referrals",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!user) return;

    setGeneratingCode(true);
    try {
      const { code, error } = await referralService.generateCode(user.id);

      if (error) throw error;

      toast({
        title: "Referral code generated",
        description: "Share your code with friends!",
      });

      await loadData(user.id);
    } catch (error: any) {
      toast({
        title: "Error generating code",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Code copied!",
        description: "Share it with your friends",
      });

      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleSendInvite = async () => {
    if (!user || !emailInput || codes.length === 0) return;

    setSendingInvite(true);
    try {
      const activeCode = codes.find(c => c.is_active);
      if (!activeCode) {
        toast({
          title: "No active code",
          description: "Please generate a referral code first",
          variant: "destructive",
        });
        return;
      }

      // In production, this would call an email service
      toast({
        title: "Invite sent!",
        description: `Invitation sent to ${emailInput}`,
      });

      setEmailInput("");
    } catch (error: any) {
      toast({
        title: "Error sending invite",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <>
        <SEO title="Referrals" />
        <Navigation />
        <div className="min-h-screen bg-background pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </>
    );
  }

  const activeCode = codes.find(c => c.is_active);

  return (
    <>
      <SEO title="Referrals - Student Portal" />
      <Navigation />
      
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Breadcrumb
            items={[
              { label: "Student Portal", href: "/student/portal" },
              { label: "Referrals" },
            ]}
          />

          <div className="flex items-center gap-3 mb-8">
            <Gift className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Refer Friends & Earn Rewards</h1>
              <p className="text-muted-foreground">Share your unique code and get benefits when friends join</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Check className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Friends joined</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Loader2 className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Not joined yet</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Success rate</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="share" className="space-y-6">
            <TabsList>
              <TabsTrigger value="share">
                <Share2 className="h-4 w-4 mr-2" />
                Share Code
              </TabsTrigger>
              <TabsTrigger value="referrals">
                Referrals
                <Badge variant="secondary" className="ml-2">{referrals.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rewards">
                <Gift className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="share">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Referral Code Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Referral Code</CardTitle>
                    <CardDescription>
                      Share this code with friends
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeCode ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={activeCode.code} 
                            readOnly 
                            className="font-mono text-lg"
                          />
                          <Button
                            size="icon"
                            onClick={() => handleCopyCode(activeCode.code)}
                          >
                            {copiedCode === activeCode.code ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>✅ Active until {new Date(activeCode.expires_at).toLocaleDateString()}</p>
                          <p>📊 Used {activeCode.usage_count} times (max {activeCode.max_uses})</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">No active referral code</p>
                        <Button onClick={handleGenerateCode} disabled={generatingCode}>
                          {generatingCode ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Gift className="h-4 w-4 mr-2" />
                          )}
                          Generate Code
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Send Invite Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Send Invite</CardTitle>
                    <CardDescription>
                      Invite friends via email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Friend's Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="friend@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={handleSendInvite}
                      disabled={!emailInput || codes.length === 0 || sendingInvite}
                    >
                      {sendingInvite ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Send Invitation
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* How It Works */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>How Referrals Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Share2 className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">1. Share Your Code</h3>
                      <p className="text-sm text-muted-foreground">
                        Send your unique referral code to friends
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">2. Friend Joins</h3>
                      <p className="text-sm text-muted-foreground">
                        They sign up using your referral code
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Gift className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">3. Both Get Rewards</h3>
                      <p className="text-sm text-muted-foreground">
                        You both receive exclusive benefits
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals">
              {referrals.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No referrals yet</p>
                    <p className="text-sm text-muted-foreground">
                      Share your code to start earning rewards
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <Card key={referral.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            referral.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 
                            'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20'
                          }`}>
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {referral.referred?.user_metadata?.full_name || referral.referred?.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Referred {new Date(referral.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                          {referral.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rewards">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Rewards</CardTitle>
                  <CardDescription>
                    Earn benefits for every successful referral
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <Gift className="h-6 w-6 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">10% Course Discount</h4>
                        <p className="text-sm text-muted-foreground">
                          Get 10% off your next course for every friend who joins
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <TrendingUp className="h-6 w-6 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Bonus Points</h4>
                        <p className="text-sm text-muted-foreground">
                          Earn 500 points for each successful referral
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <Users className="h-6 w-6 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Exclusive Access</h4>
                        <p className="text-sm text-muted-foreground">
                          Refer 5+ friends to unlock premium content
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}