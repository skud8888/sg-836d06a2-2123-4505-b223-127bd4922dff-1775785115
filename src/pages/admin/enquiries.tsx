import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Mail, Phone, Calendar, MessageSquare, Download } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";
import { exportService } from "@/services/exportService";

type Enquiry = Tables<"enquiries">;

export default function Enquiries() {
  const router = useRouter();
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    checkAuth();
    fetchEnquiries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, enquiries]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
    }
  };

  const fetchEnquiries = async () => {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Fetched enquiries:", { data, error });

    if (data) {
      setEnquiries(data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...enquiries];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          e.email.toLowerCase().includes(search) ||
          e.phone?.toLowerCase().includes(search) ||
          e.course_interest?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    setFilteredEnquiries(filtered);
  };

  const handleUpdateStatus = async (enquiryId: string, newStatus: string) => {
    const { error } = await supabase
      .from("enquiries")
      .update({ status: newStatus })
      .eq("id", enquiryId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Enquiry status updated" });
      fetchEnquiries();
      if (selectedEnquiry?.id === enquiryId) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "contacted": return "secondary";
      case "converted": return "outline";
      case "closed": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Enquiries</h1>
            <p className="text-muted-foreground">Manage contact form submissions</p>
          </div>
          <Button
            onClick={async () => {
              const csv = await exportService.exportEnquiriesCSV();
              exportService.downloadCSV(csv, `enquiries-${format(new Date(), "yyyy-MM-dd")}.csv`);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {enquiries.filter((e) => e.status === "new").length}
              </div>
              <p className="text-xs text-muted-foreground">New</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {enquiries.filter((e) => e.status === "contacted").length}
              </div>
              <p className="text-xs text-muted-foreground">Contacted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {enquiries.filter((e) => e.status === "converted").length}
              </div>
              <p className="text-xs text-muted-foreground">Converted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{enquiries.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, or course interest..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enquiries List */}
        {loading ? (
          <div className="text-center py-12">Loading enquiries...</div>
        ) : filteredEnquiries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "No enquiries match your filters"
                : "No enquiries yet"}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => (
              <Card key={enquiry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{enquiry.name}</CardTitle>
                        <Badge variant={getStatusColor(enquiry.status)}>
                          {enquiry.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{enquiry.email}</span>
                        </div>
                        {enquiry.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{enquiry.phone}</span>
                          </div>
                        )}
                        {enquiry.course_interest && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            <span>Interested in: {enquiry.course_interest}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(enquiry.created_at), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={enquiry.status}
                        onValueChange={(value) => handleUpdateStatus(enquiry.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEnquiry(enquiry);
                          setDialogOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {enquiry.message && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {enquiry.message}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Enquiry Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enquiry Details</DialogTitle>
              <DialogDescription>
                {selectedEnquiry && format(new Date(selectedEnquiry.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>
            {selectedEnquiry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Name</p>
                    <p className="text-sm text-muted-foreground">{selectedEnquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Status</p>
                    <Badge variant={getStatusColor(selectedEnquiry.status)}>
                      {selectedEnquiry.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Email</p>
                    <a
                      href={`mailto:${selectedEnquiry.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedEnquiry.email}
                    </a>
                  </div>
                  {selectedEnquiry.phone && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Phone</p>
                      <a
                        href={`tel:${selectedEnquiry.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedEnquiry.phone}
                      </a>
                    </div>
                  )}
                </div>

                {selectedEnquiry.course_interest && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Course Interest</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEnquiry.course_interest}
                    </p>
                  </div>
                )}

                {selectedEnquiry.preferred_dates && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Preferred Dates</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEnquiry.preferred_dates}
                    </p>
                  </div>
                )}

                {selectedEnquiry.message && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Message</p>
                    <Textarea
                      value={selectedEnquiry.message}
                      readOnly
                      className="min-h-[120px]"
                    />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Update Status</p>
                  <Select
                    value={selectedEnquiry.status}
                    onValueChange={(value) => handleUpdateStatus(selectedEnquiry.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="converted">Converted to Booking</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}