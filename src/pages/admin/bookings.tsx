import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Filter, Edit, DollarSign, Mail, Phone, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";
import { emailService } from "@/services/emailService";

type Booking = Tables<"bookings"> & {
  scheduled_classes: {
    start_datetime: string;
    course_templates: {
      name: string;
      code: string;
    } | null;
  } | null;
};

export default function BookingsDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, paymentFilter, bookings]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
    }
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        scheduled_classes(
          start_datetime,
          course_templates(name, code)
        )
      `)
      .order("created_at", { ascending: false });

    console.log("Fetched bookings:", { data, error });

    if (data) {
      setBookings(data as any);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.student_name?.toLowerCase().includes(search) ||
          b.student_email?.toLowerCase().includes(search) ||
          b.student_phone?.toLowerCase().includes(search) ||
          b.usi_number?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter((b) => b.payment_status === paymentFilter);
    }

    setFilteredBookings(filtered);
  };

  const handleOpenDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedBooking) return;

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", selectedBooking.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Booking status updated" });
      fetchBookings();
      setDialogOpen(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentStatus: string) => {
    if (!selectedBooking) return;

    const { error } = await supabase
      .from("bookings")
      .update({ payment_status: paymentStatus })
      .eq("id", selectedBooking.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Payment status updated" });
      fetchBookings();
      setDialogOpen(false);
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;

    const { error } = await supabase
      .from("bookings")
      .update({
        status: editFormData.status,
        payment_status: editFormData.payment_status,
        paid_amount: parseFloat(editFormData.paid_amount)
      })
      .eq("id", selectedBooking.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      // Check if payment was updated
      const oldPaidAmount = selectedBooking.paid_amount;
      const newPaidAmount = parseFloat(editFormData.paid_amount);
      
      if (newPaidAmount > oldPaidAmount) {
        // Payment was added, send receipt email
        const paymentAmount = newPaidAmount - oldPaidAmount;
        const updatedBooking = { ...selectedBooking, paid_amount: newPaidAmount };
        await emailService.sendPaymentReceipt(updatedBooking, paymentAmount);
      }

      toast({ title: "Booking updated successfully" });
      setDetailsDialogOpen(false);
      setSelectedBooking(null);
      fetchBookings();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "partial": return "secondary";
      case "unpaid": return "destructive";
      default: return "secondary";
    }
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    paid: bookings.filter((b) => b.payment_status === "paid").length,
    unpaid: bookings.filter((b) => b.payment_status === "unpaid").length,
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
          <h1 className="text-3xl font-heading font-bold">Student Bookings</h1>
          <p className="text-muted-foreground">Manage all student enrollments and payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, USI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No bookings found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.student_name}
                          {booking.usi_number && (
                            <div className="text-xs text-muted-foreground">
                              USI: {booking.usi_number}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {booking.scheduled_classes?.course_templates?.name || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.scheduled_classes?.course_templates?.code || ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.scheduled_classes?.start_datetime
                            ? format(new Date(booking.scheduled_classes.start_datetime), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{booking.student_email}</div>
                          <div className="text-xs text-muted-foreground">{booking.student_phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusColor(booking.payment_status)}>
                            {booking.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            ${booking.paid_amount} / ${booking.total_amount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(booking)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                View and update booking information
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Student Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedBooking.student_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedBooking.student_email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedBooking.student_phone}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">USI Number</Label>
                      <p className="font-medium">{selectedBooking.usi_number || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Course Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Course</Label>
                      <p className="font-medium">
                        {selectedBooking.scheduled_classes?.course_templates?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <p className="font-medium">
                        {selectedBooking.scheduled_classes?.start_datetime
                          ? format(new Date(selectedBooking.scheduled_classes.start_datetime), "EEEE, MMMM d, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Payment Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Amount</Label>
                      <p className="font-medium text-lg">${selectedBooking.total_amount}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Paid</Label>
                      <p className="font-medium text-lg text-green-600">${selectedBooking.paid_amount}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Remaining</Label>
                      <p className="font-medium text-lg text-red-600">
                        ${selectedBooking.total_amount - selectedBooking.paid_amount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Updates */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Update Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Booking Status</Label>
                      <Select
                        value={selectedBooking.status}
                        onValueChange={handleUpdateStatus}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Status</Label>
                      <Select
                        value={selectedBooking.payment_status}
                        onValueChange={handleUpdatePaymentStatus}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={selectedBooking.notes} readOnly rows={3} />
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}