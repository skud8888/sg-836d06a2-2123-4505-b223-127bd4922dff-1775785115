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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Users, TrendingUp, Calendar, Loader2, CheckCircle, Clock, XCircle } from "lucide-react";

interface Payout {
  id: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  instructor_share: number;
  platform_fee: number;
  commission_rate: number;
  students_taught: number;
  courses_completed: number;
  status: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function InstructorPayoutsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [generatingPayout, setGeneratingPayout] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
    loadPayouts();
  };

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("instructor_payouts")
        .select(`
          *,
          profiles (full_name, email)
        `)
        .order("period_end", { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (err: any) {
      console.error("Error loading payouts:", err);
      toast({
        title: "Error",
        description: "Failed to load payouts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayouts = async () => {
    setGeneratingPayout(true);
    try {
      // Get all instructors
      const { data: instructors, error: instructorError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "trainer");

      if (instructorError) throw instructorError;

      // Calculate period (last month)
      const periodEnd = new Date();
      periodEnd.setDate(0); // Last day of previous month
      const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);

      // Generate payout for each instructor
      for (const instructor of instructors || []) {
        // Get completed enrollments in period
        const { data: enrollments, error: enrollError } = await supabase
          .from("enrollments")
          .select(`
            *,
            course_templates (price_full)
          `)
          .eq("status", "completed")
          .gte("updated_at", periodStart.toISOString())
          .lte("updated_at", periodEnd.toISOString());

        if (enrollError) continue;

        const totalRevenue = enrollments?.reduce((sum, e) => sum + (e.course_templates?.price_full || 0), 0) || 0;
        const commissionRate = 70; // 70% to instructor
        const instructorShare = (totalRevenue * commissionRate) / 100;
        const platformFee = totalRevenue - instructorShare;

        // Create payout record
        await supabase
          .from("instructor_payouts")
          .insert({
            instructor_id: instructor.user_id,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            total_revenue: totalRevenue,
            instructor_share: instructorShare,
            platform_fee: platformFee,
            commission_rate: commissionRate,
            students_taught: enrollments?.length || 0,
            courses_completed: enrollments?.length || 0,
            status: 'pending'
          });
      }

      toast({
        title: "Success",
        description: "Payouts generated for all instructors"
      });

      loadPayouts();
    } catch (err: any) {
      console.error("Error generating payouts:", err);
      toast({
        title: "Error",
        description: "Failed to generate payouts",
        variant: "destructive"
      });
    } finally {
      setGeneratingPayout(false);
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    try {
      const { error } = await supabase
        .from("instructor_payouts")
        .update({ status: 'approved' })
        .eq("id", payoutId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payout approved"
      });

      loadPayouts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to approve payout",
        variant: "destructive"
      });
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    try {
      const { error } = await supabase
        .from("instructor_payouts")
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq("id", payoutId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payout marked as paid"
      });

      loadPayouts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to update payout",
        variant: "destructive"
      });
    }
  };

  const filteredPayouts = payouts.filter(p => {
    if (filterStatus === "all") return true;
    return p.status === filterStatus;
  });

  const stats = {
    totalPaid: payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.instructor_share, 0),
    pending: payouts.filter(p => p.status === 'pending').length,
    approved: payouts.filter(p => p.status === 'approved').length,
    thisMonth: payouts.filter(p => {
      const periodEnd = new Date(p.period_end);
      const now = new Date();
      return periodEnd.getMonth() === now.getMonth() && periodEnd.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + p.instructor_share, 0)
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      pending: "outline",
      approved: "secondary",
      paid: "default",
      failed: "destructive"
    };
    return variants[status] || "outline";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <>
      <SEO
        title="Instructor Payouts - Admin"
        description="Manage instructor payouts and revenue sharing"
      />
      <Navigation />
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Instructor Payouts</h1>
              <p className="text-muted-foreground">
                Manage instructor revenue sharing and payments
              </p>
            </div>

            <Button onClick={handleGeneratePayouts} disabled={generatingPayout}>
              {generatingPayout ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Payouts
                </>
              )}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Paid Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${stats.totalPaid.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">${stats.thisMonth.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.approved}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Filter by Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payouts List */}
          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading payouts...</p>
              </CardContent>
            </Card>
          ) : filteredPayouts.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payouts found</h3>
                <p className="text-muted-foreground mb-6">
                  {filterStatus === "all" 
                    ? "Click 'Generate Payouts' to create payouts for the last period"
                    : `No ${filterStatus} payouts found`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPayouts.map((payout) => (
                <Card key={payout.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Users className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            {payout.profiles.full_name || payout.profiles.email}
                          </h3>
                          <Badge variant={getStatusBadge(payout.status)} className="flex items-center gap-1">
                            {getStatusIcon(payout.status)}
                            {payout.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ml-8">
                          <div>
                            <p className="text-muted-foreground">Period</p>
                            <p className="font-medium">
                              {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Total Revenue</p>
                            <p className="font-medium">${payout.total_revenue.toFixed(2)}</p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Instructor Share ({payout.commission_rate}%)</p>
                            <p className="font-medium text-green-600">${payout.instructor_share.toFixed(2)}</p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Students Taught</p>
                            <p className="font-medium">{payout.students_taught}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {payout.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleApprovePayout(payout.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}

                        {payout.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleMarkPaid(payout.id)}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}