import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { exportService } from "@/services/exportService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, DollarSign, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";

type PaymentRecord = {
  booking_id: string;
  student_name: string;
  student_email: string;
  start_datetime: string;
  course_name: string;
  course_code: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: string;
  booking_status: string;
  days_overdue: number;
  booking_date: string;
};

export default function PaymentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchPayments();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, payments]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_tracking")
      .select("*")
      .order("days_overdue", { ascending: false });

    if (error) {
      toast({
        title: "Error loading payments",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setPayments(data || []);
      setFilteredPayments(data || []);
    }
    setLoading(false);
  };

  const applyFilter = () => {
    if (filter === "all") {
      setFilteredPayments(payments);
    } else if (filter === "overdue") {
      setFilteredPayments(payments.filter(p => p.days_overdue > 0 && new Date(p.start_datetime) < new Date()));
    } else if (filter === "upcoming") {
      setFilteredPayments(payments.filter(p => new Date(p.start_datetime) > new Date()));
    } else if (filter === "unpaid") {
      setFilteredPayments(payments.filter(p => p.payment_status === "unpaid"));
    } else if (filter === "partial") {
      setFilteredPayments(payments.filter(p => p.payment_status === "partial"));
    }
  };

  const getTotalOutstanding = () => {
    return payments.reduce((sum, p) => sum + p.balance_due, 0);
  };

  const getOverdueCount = () => {
    return payments.filter(p => p.days_overdue > 0 && new Date(p.start_datetime) < new Date()).length;
  };

  const getAgingBadge = (daysOverdue: number, startDate: string) => {
    const courseStarted = new Date(startDate) < new Date();
    
    if (!courseStarted) {
      return <Badge className="bg-blue-500">Upcoming</Badge>;
    }
    
    if (daysOverdue === 0) {
      return <Badge className="bg-green-500">Current</Badge>;
    } else if (daysOverdue <= 7) {
      return <Badge className="bg-yellow-500">1-7 Days</Badge>;
    } else if (daysOverdue <= 30) {
      return <Badge className="bg-orange-500">8-30 Days</Badge>;
    } else {
      return <Badge className="bg-red-500">30+ Days</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Payment Tracking</h1>
            <p className="text-muted-foreground">Monitor outstanding balances and payment aging</p>
          </div>
          <Button
            onClick={async () => {
              const csv = await exportService.exportBookingsCSV();
              exportService.downloadCSV(csv, `payments-${format(new Date(), "yyyy-MM-dd")}.csv`);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <p className="text-2xl font-bold">${getTotalOutstanding().toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-2xl font-bold">{getOverdueCount()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outstanding ({payments.length})</SelectItem>
                <SelectItem value="overdue">Overdue ({getOverdueCount()})</SelectItem>
                <SelectItem value="upcoming">Upcoming Courses</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial Payment</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Payments Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No outstanding payments found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Payments ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Start Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Aging</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.booking_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.student_name}</p>
                          <p className="text-xs text-muted-foreground">{payment.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.course_name}</p>
                          <p className="text-xs text-muted-foreground">{payment.course_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {payment.start_datetime ? format(new Date(payment.start_datetime), "MMM d, yyyy") : "TBD"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">${payment.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">${payment.paid_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-orange-600">
                          ${payment.balance_due.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getAgingBadge(payment.days_overdue, payment.start_datetime)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={payment.payment_status === "unpaid" ? "destructive" : "secondary"}>
                          {payment.payment_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}