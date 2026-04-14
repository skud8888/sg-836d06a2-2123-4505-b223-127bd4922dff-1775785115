import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { signatureService } from "@/services/signatureService";
import { FileSignature, Send, Clock, CheckCircle, XCircle, Eye, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type SignatureRequest = Tables<"signature_requests">;
type Booking = Tables<"bookings">;

export default function SignaturesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SignatureRequest | null>(null);

  const [newRequest, setNewRequest] = useState({
    bookingId: "",
    documentType: "course_agreement" as SignatureRequest["document_type"],
    expiresInDays: 7
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load signature requests
      const { data: sigs } = await supabase
        .from("signature_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (sigs) setRequests(sigs);

      // Load bookings for dropdown
      const { data: bkgs } = await supabase
        .from("bookings")
        .select("id, student_name, student_email")
        .order("created_at", { ascending: false })
        .limit(50);

      if (bkgs) setBookings(bkgs);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function createSignatureRequest() {
    if (!newRequest.bookingId) {
      toast({
        title: "Missing Information",
        description: "Please select a booking",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const booking = bookings.find(b => b.id === newRequest.bookingId);
      if (!booking) throw new Error("Booking not found");

      const { request, error } = await signatureService.createSignatureRequest({
        bookingId: newRequest.bookingId,
        documentType: newRequest.documentType,
        recipientName: booking.student_name,
        recipientEmail: booking.student_email,
        expiresInDays: newRequest.expiresInDays
      });

      if (error) throw error;

      toast({
        title: "Signature Request Created",
        description: `Request sent to ${booking.student_email}`
      });

      setShowCreateDialog(false);
      setNewRequest({
        bookingId: "",
        documentType: "course_agreement",
        expiresInDays: 7
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function sendReminder(requestId: string) {
    setLoading(true);
    try {
      await signatureService.sendSignatureReminder(requestId);
      toast({
        title: "Reminder Sent",
        description: "Signature reminder has been sent"
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      sent: { variant: "outline", icon: Send, label: "Sent" },
      signed: { variant: "default", icon: CheckCircle, label: "Signed" },
      expired: { variant: "destructive", icon: XCircle, label: "Expired" }
    };

    const config = variants[status] || { variant: "outline" as const, icon: FileSignature, label: status };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    signed: requests.filter(r => r.status === "signed").length,
    expired: requests.filter(r => new Date(r.expires_at!) < new Date() && r.status !== "signed").length
  };

  return (
    <>
      <SEO 
        title="E-Signatures - Admin"
        description="Manage digital signature requests and track signing status"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">E-Signatures</h1>
              <p className="text-slate-600">Digital signature requests and tracking</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Signed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.signed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Expired</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
              </CardContent>
            </Card>
          </div>

          {/* Signature Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Signature Requests</CardTitle>
              <CardDescription>Track and manage digital signature requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Signed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const isExpired = new Date(request.expires_at!) < new Date() && request.status !== "signed";
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.recipient_name}</div>
                            <div className="text-sm text-slate-500">{request.recipient_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.document_type.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(isExpired ? "expired" : request.status)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(request.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(request.expires_at!), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.signed_at ? format(new Date(request.signed_at), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {request.status === "pending" && !isExpired && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendReminder(request.id)}
                                disabled={loading}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Remind
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Request Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Signature Request</DialogTitle>
            <DialogDescription>
              Send a signature request to a student for a specific booking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="booking">Booking</Label>
              <Select
                value={newRequest.bookingId}
                onValueChange={(value) => setNewRequest({ ...newRequest, bookingId: value })}
              >
                <SelectTrigger id="booking">
                  <SelectValue placeholder="Select booking" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.student_name} ({booking.student_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <Select
                value={newRequest.documentType}
                onValueChange={(value: any) => setNewRequest({ ...newRequest, documentType: value })}
              >
                <SelectTrigger id="documentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course_agreement">Course Agreement</SelectItem>
                  <SelectItem value="liability_waiver">Liability Waiver</SelectItem>
                  <SelectItem value="payment_agreement">Payment Agreement</SelectItem>
                  <SelectItem value="photo_consent">Photo Consent</SelectItem>
                  <SelectItem value="medical_declaration">Medical Declaration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expiresInDays">Expires In (Days)</Label>
              <Input
                id="expiresInDays"
                type="number"
                min="1"
                max="30"
                value={newRequest.expiresInDays}
                onChange={(e) => setNewRequest({ ...newRequest, expiresInDays: parseInt(e.target.value) })}
              />
            </div>
            <Button onClick={createSignatureRequest} disabled={loading} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Send Signature Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signature Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-600">Recipient</Label>
                  <p className="font-medium">{selectedRequest.recipient_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Email</Label>
                  <p className="font-medium">{selectedRequest.recipient_email}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Document Type</Label>
                  <p className="font-medium">{selectedRequest.document_type.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Created</Label>
                  <p className="font-medium">{format(new Date(selectedRequest.created_at), "PPP")}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Expires</Label>
                  <p className="font-medium">{format(new Date(selectedRequest.expires_at!), "PPP")}</p>
                </div>
                {selectedRequest.signed_at && (
                  <>
                    <div>
                      <Label className="text-sm text-slate-600">Signed At</Label>
                      <p className="font-medium">{format(new Date(selectedRequest.signed_at), "PPP 'at' p")}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Signer IP</Label>
                      <p className="font-medium">{selectedRequest.signer_ip}</p>
                    </div>
                  </>
                )}
              </div>
              {selectedRequest.status === "pending" && (
                <Button onClick={() => sendReminder(selectedRequest.id)} disabled={loading} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}