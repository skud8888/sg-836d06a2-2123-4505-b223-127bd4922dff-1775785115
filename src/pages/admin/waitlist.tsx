import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { emailTriggerService } from "@/services/emailTriggerService";
import { Loader2, Users, Mail, Clock, CheckCircle, XCircle, Search } from "lucide-react";
import Link from "next/link";

interface WaitlistEntry {
  id: string;
  course_template_id: string;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  position: number;
  status: string;
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
  course: {
    name: string;
  };
}

export default function WaitlistManagementPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
    loadWaitlist();
  };

  const loadWaitlist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_waitlist")
        .select(`
          *,
          course:course_templates!course_waitlist_course_template_id_fkey(name)
        `)
        .order("course_template_id", { ascending: true })
        .order("position", { ascending: true });

      if (error) throw error;

      setWaitlistEntries(data || []);
    } catch (err: any) {
      console.error("Error loading waitlist:", err);
      toast({
        title: "Error",
        description: "Failed to load waitlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const notifyNextPerson = async (courseId: string) => {
    setProcessing(courseId);
    try {
      // Find next person in waiting status
      const { data: nextPerson, error: findError } = await supabase
        .from("course_waitlist")
        .select("*")
        .eq("course_template_id", courseId)
        .eq("status", "waiting")
        .order("position", { ascending: true })
        .limit(1)
        .single();

      if (findError || !nextPerson) {
        toast({
          title: "No waiting students",
          description: "No students are currently waiting for this course",
        });
        return;
      }

      // Send notification email
      await emailTriggerService.sendWaitlistSpotAvailable(nextPerson.id);

      toast({
        title: "Notification Sent",
        description: `Email sent to ${nextPerson.student_name}`,
      });

      loadWaitlist();
    } catch (err: any) {
      console.error("Error notifying student:", err);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const removeFromWaitlist = async (id: string) => {
    setProcessing(id);
    try {
      const { error } = await supabase
        .from("course_waitlist")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "Student removed from waitlist",
      });

      loadWaitlist();
    } catch (err: any) {
      console.error("Error removing from waitlist:", err);
      toast({
        title: "Error",
        description: "Failed to remove from waitlist",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const filteredEntries = waitlistEntries.filter(entry =>
    entry.status !== "cancelled" &&
    (entry.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     entry.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     entry.course.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group by course
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const courseName = entry.course.name;
    if (!acc[courseName]) {
      acc[courseName] = [];
    }
    acc[courseName].push(entry);
    return acc;
  }, {} as Record<string, WaitlistEntry[]>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Waiting</Badge>;
      case "notified":
        return <Badge variant="default"><Mail className="h-3 w-3 mr-1" />Notified</Badge>;
      case "enrolled":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Enrolled</Badge>;
      case "expired":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <SEO
        title="Waitlist Management - Admin"
        description="Manage course waitlists and notify students when spots become available"
      />
      <Navigation />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Waitlist Management</h1>
                <p className="text-muted-foreground">
                  Manage course waitlists and notify students when spots open up
                </p>
              </div>
              <Link href="/admin">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, email, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : Object.keys(groupedEntries).length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Waitlist Entries</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No waitlist entries match your search"
                    : "No students are currently on any waitlists"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEntries).map(([courseName, entries]) => (
                <Card key={courseName}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{courseName}</CardTitle>
                        <CardDescription>
                          {entries.length} {entries.length === 1 ? "person" : "people"} waiting
                        </CardDescription>
                      </div>
                      {entries.some(e => e.status === "waiting") && (
                        <Button
                          onClick={() => notifyNextPerson(entries[0].course_template_id)}
                          disabled={processing === entries[0].course_template_id}
                        >
                          {processing === entries[0].course_template_id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Notifying...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Notify Next Person
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Position</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Added</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">#{entry.position}</TableCell>
                            <TableCell>{entry.student_name}</TableCell>
                            <TableCell>{entry.student_email}</TableCell>
                            <TableCell>{entry.student_phone || "—"}</TableCell>
                            <TableCell>{getStatusBadge(entry.status)}</TableCell>
                            <TableCell>
                              {new Date(entry.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {entry.status === "waiting" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromWaitlist(entry.id)}
                                  disabled={processing === entry.id}
                                >
                                  {processing === entry.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Remove"
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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