import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";
import { exportService } from "@/services/exportService";
import { signatureService } from "@/services/signatureService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { EvidenceCapture } from "@/components/EvidenceCapture";
import { EvidenceGallery } from "@/components/EvidenceGallery";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, DollarSign, Calendar, Mail, Phone, FileText, Upload, ArrowLeft, Edit, Download, Camera, Check, Copy, Bell } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { notificationService } from "@/services/notificationService";

type Booking = Tables<"bookings"> & {
  scheduled_classes: (Tables<"scheduled_classes"> & {
    course_templates: Pick<Tables<"course_templates">, "name" | "code"> | null;
  }) | null;
};

type SignatureRequest = Tables<"signature_requests">;

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
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
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

  const handleOpenDialog = async (booking: Booking) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
    
    // Load signature requests for this booking
    setLoadingSignatures(true);
    const requests = await signatureService.getBookingSignatureRequests(booking.id);
    setSignatureRequests(requests);
    setLoadingSignatures(false);
  };

  const handleSendSignatureRequest = async () => {
    if (!selectedBooking) return;

    try {
      const { request, error } = await signatureService.createSignatureRequest({
        bookingId: selectedBooking.id,
        documentType: 'enrollment_contract',
        recipientName: selectedBooking.student_name,
        recipientEmail: selectedBooking.student_email,
        expiresInDays: 7
      });

      if (error) throw error;

      toast({ 
        title: "Signature request sent",
        description: `Email sent to ${selectedBooking.student_email}`
      });

      // Reload signature requests
      const requests = await signatureService.getBookingSignatureRequests(selectedBooking.id);
      setSignatureRequests(requests);
    } catch (error: any) {
      toast({
        title: "Error sending signature request",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSendReminder = async (requestId: string) => {
    try {
      await signatureService.sendSignatureReminder(requestId);
      toast({ title: "Reminder sent successfully" });
    } catch (error: any) {
      toast({
        title: "Error sending reminder",
        description: error.message,
        variant: "destructive"
      });
    }
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
      // Send feedback request if completed
      if (status === "completed") {
        await notificationService.sendFeedbackRequest(selectedBooking.id);
      }

      toast({ title: "Booking status updated" });
      fetchBookings();
      setDialogOpen(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentStatus: string) => {
    if (!selectedBooking) return;

    const updates: any = { payment_status: paymentStatus };
    let paymentAmount = 0;
    
    // If changing to paid, set the paid amount to total amount
    if (paymentStatus === "paid" && selectedBooking.payment_status !== "paid") {
      updates.paid_amount = selectedBooking.total_amount;
      paymentAmount = selectedBooking.total_amount - selectedBooking.paid_amount;
    }

    const { error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", selectedBooking.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      // Send payment receipt if marked as paid
      if (paymentStatus === "paid" && paymentAmount > 0) {
        const updatedBooking = { ...selectedBooking, ...updates };
        await emailService.sendPaymentReceipt(updatedBooking as any, paymentAmount);
      }
      
      toast({ title: "Payment status updated" });
      fetchBookings();
      setDialogOpen(false);
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

  const getSignatureStatusColor = (status: string) => {
    switch (status) {
      case "signed": return "default";
      case "sent": return "secondary";
      case "pending": return "outline";
      case "expired": return "destructive";
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Bookings Management</h1>
            <p className="text-muted-foreground">Manage all course bookings</p>
          </div>
          <Button
            onClick={async () => {
              const csv = await exportService.exportBookingsCSV();
              exportService.downloadCSV(csv, `bookings-${format(new Date(), "yyyy-MM-dd")}.csv`);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                View and manage booking information
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details & Payment</TabsTrigger>
                  <TabsTrigger value="signatures">
                    Signatures
                    {signatureRequests.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {signatureRequests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 mt-4">
                  <div className="grid gap-6">
                    {/* Student Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Student Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Name</Label>
                            <p className="font-medium">{selectedBooking.student_name}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">USI Number</Label>
                            <p className="font-medium">{selectedBooking.usi_number || "Not provided"}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${selectedBooking.student_email}`} className="text-primary hover:underline">
                              {selectedBooking.student_email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${selectedBooking.student_phone}`} className="text-primary hover:underline">
                              {selectedBooking.student_phone}
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Course Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Course Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-muted-foreground">Course</Label>
                          <p className="font-medium">
                            {selectedBooking.scheduled_classes?.course_templates?.name || "Unknown Course"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedBooking.scheduled_classes?.course_templates?.code}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Schedule</Label>
                          <p className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {selectedBooking.scheduled_classes?.start_datetime 
                              ? format(new Date(selectedBooking.scheduled_classes.start_datetime), "PPP 'at' p")
                              : "Not scheduled"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Status & Payment */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Status & Payment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Booking Status</Label>
                            <Select 
                              value={selectedBooking.status} 
                              onValueChange={(value) => handleUpdateStatus(value)}
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
                          <div>
                            <Label>Payment Status</Label>
                            <Select 
                              value={selectedBooking.payment_status} 
                              onValueChange={(value) => handleUpdatePaymentStatus(value)}
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

                        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                          <div>
                            <Label className="text-muted-foreground text-xs">Total Amount</Label>
                            <p className="text-lg font-bold">${selectedBooking.total_amount}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Paid Amount</Label>
                            <p className="text-lg font-bold text-green-600">${selectedBooking.paid_amount}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Balance Due</Label>
                            <p className="text-lg font-bold text-orange-600">
                              ${selectedBooking.total_amount - selectedBooking.paid_amount}
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-muted-foreground text-xs">Booked On</Label>
                          <p className="text-sm">
                            {selectedBooking.created_at 
                              ? format(new Date(selectedBooking.created_at), "PPP 'at' p")
                              : "Unknown"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="signatures" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Signature Requests</h3>
                    <Button onClick={handleSendSignatureRequest}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Signature Request
                    </Button>
                  </div>

                  {loadingSignatures ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading signature requests...
                    </div>
                  ) : signatureRequests.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h4 className="font-semibold mb-2">No signature requests yet</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Send a signature request to collect the student's enrollment contract
                          </p>
                          <Button onClick={handleSendSignatureRequest}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send First Signature Request
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {signatureRequests.map((request) => (
                        <Card key={request.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">
                                    {request.document_type.replace(/_/g, " ").toUpperCase()}
                                  </h4>
                                  <Badge variant={getSignatureStatusColor(request.status)}>
                                    {request.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Recipient: {request.recipient_name} ({request.recipient_email})
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-muted-foreground">Created:</span>{" "}
                                <span className="font-medium">
                                  {format(new Date(request.created_at), "PPP")}
                                </span>
                              </div>
                              {request.sent_at && (
                                <div>
                                  <span className="text-muted-foreground">Sent:</span>{" "}
                                  <span className="font-medium">
                                    {format(new Date(request.sent_at), "PPP")}
                                  </span>
                                </div>
                              )}
                              {request.signed_at && (
                                <div>
                                  <span className="text-muted-foreground">Signed:</span>{" "}
                                  <span className="font-medium text-green-600">
                                    {format(new Date(request.signed_at), "PPP 'at' p")}
                                  </span>
                                </div>
                              )}
                              {request.expires_at && (
                                <div>
                                  <span className="text-muted-foreground">Expires:</span>{" "}
                                  <span className={`font-medium ${new Date(request.expires_at) < new Date() ? 'text-red-600' : ''}`}>
                                    {format(new Date(request.expires_at), "PPP")}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {request.status === "signed" ? (
                                <Button variant="outline" size="sm" disabled>
                                  <Check className="h-4 w-4 mr-2" />
                                  Completed
                                </Button>
                              ) : (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `${window.location.origin}/sign/${request.id}`
                                      );
                                      toast({ title: "Link copied to clipboard" });
                                    }}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </Button>
                                  {request.status === "sent" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSendReminder(request.id)}
                                    >
                                      <Bell className="h-4 w-4 mr-2" />
                                      Send Reminder
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <DocumentUpload 
                      relatedBookingId={selectedBooking.id}
                      onUploadComplete={() => {
                        // Trigger document list refresh
                      }}
                    />
                    <DocumentList bookingId={selectedBooking.id} />
                  </div>
                </TabsContent>

                <TabsContent value="evidence" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <EvidenceCapture
                      bookingId={selectedBooking.id}
                      scheduledClassId={selectedBooking.scheduled_class_id || undefined}
                      onCaptureComplete={() => {
                        // Trigger evidence gallery refresh
                      }}
                    />
                    <EvidenceGallery
                      bookingId={selectedBooking.id}
                      scheduledClassId={selectedBooking.scheduled_class_id || undefined}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}