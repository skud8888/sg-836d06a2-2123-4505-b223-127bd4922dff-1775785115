import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Mail, MessageSquare, Send, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type NotificationLog = Tables<"notification_log">;
type EmailQueue = Tables<"email_queue">;
type SMSNotification = Tables<"sms_notifications">;

export default function NotificationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailQueue[]>([]);
  const [smsLogs, setSMSLogs] = useState<SMSNotification[]>([]);
  const [stats, setStats] = useState({
    emailsSent: 0,
    smsSent: 0,
    emailsPending: 0,
    smsPending: 0
  });

  // Manual notification form state
  const [manualEmail, setManualEmail] = useState({
    recipient: "",
    subject: "",
    message: ""
  });

  const [manualSMS, setManualSMS] = useState({
    phone: "",
    message: ""
  });

  useEffect(() => {
    loadNotificationData();
  }, []);

  async function loadNotificationData() {
    try {
      // Load email logs
      const { data: emails } = await supabase
        .from("email_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (emails) setEmailLogs(emails);

      // Load SMS logs
      const { data: sms } = await supabase
        .from("sms_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (sms) setSMSLogs(sms);

      // Calculate stats
      const emailsSent = emails?.filter(e => e.status === "sent").length || 0;
      const emailsPending = emails?.filter(e => e.status === "pending").length || 0;
      const smsSent = sms?.filter(s => s.status === "sent" || s.status === "delivered").length || 0;
      const smsPending = sms?.filter(s => s.status === "pending").length || 0;

      setStats({ emailsSent, smsSent, emailsPending, smsPending });
    } catch (error) {
      console.error("Error loading notification data:", error);
    }
  }

  async function sendManualEmail() {
    if (!manualEmail.recipient || !manualEmail.subject || !manualEmail.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all email fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("email_queue").insert({
        recipient_email: manualEmail.recipient,
        subject: manualEmail.subject,
        html_content: manualEmail.message.replace(/\n/g, "<br>"),
        template_type: "manual",
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "Email Queued",
        description: "Email has been queued for delivery"
      });

      setManualEmail({ recipient: "", subject: "", message: "" });
      loadNotificationData();
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

  async function sendManualSMS() {
    if (!manualSMS.phone || !manualSMS.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all SMS fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("sms_notifications").insert({
        recipient_phone: manualSMS.phone,
        message_body: manualSMS.message,
        notification_type: "manual",
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "SMS Queued",
        description: "SMS has been queued for delivery"
      });

      setManualSMS({ phone: "", message: "" });
      loadNotificationData();
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

  async function triggerScheduler() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("notification-scheduler");
      
      if (error) throw error;

      toast({
        title: "Scheduler Triggered",
        description: `Sent ${data.remindersSent} reminders, ${data.emailsSent} emails, ${data.smsSent} SMS`
      });

      loadNotificationData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger scheduler",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      sent: { variant: "default", icon: CheckCircle },
      delivered: { variant: "default", icon: CheckCircle },
      pending: { variant: "secondary", icon: Clock },
      failed: { variant: "destructive", icon: XCircle }
    };

    const config = variants[status] || { variant: "outline" as const, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  }

  return (
    <>
      <SEO 
        title="Notifications - Admin"
        description="Manage automated notifications and send manual messages"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Notifications</h1>
            <p className="text-slate-600">Automated reminders and manual notification triggers</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Emails Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.emailsSent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">SMS Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.smsSent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Emails Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{stats.emailsPending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">SMS Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{stats.smsPending}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="manual" className="space-y-6">
            <TabsList>
              <TabsTrigger value="manual">
                <Send className="h-4 w-4 mr-2" />
                Manual Send
              </TabsTrigger>
              <TabsTrigger value="scheduler">
                <Clock className="h-4 w-4 mr-2" />
                Scheduler
              </TabsTrigger>
              <TabsTrigger value="history">
                <Bell className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Manual Email */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Send Email
                    </CardTitle>
                    <CardDescription>Send a one-off email notification</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email-recipient">Recipient Email</Label>
                      <Input
                        id="email-recipient"
                        type="email"
                        placeholder="student@example.com"
                        value={manualEmail.recipient}
                        onChange={(e) => setManualEmail({ ...manualEmail, recipient: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-subject">Subject</Label>
                      <Input
                        id="email-subject"
                        placeholder="Important update"
                        value={manualEmail.subject}
                        onChange={(e) => setManualEmail({ ...manualEmail, subject: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-message">Message</Label>
                      <Textarea
                        id="email-message"
                        placeholder="Your message here..."
                        rows={6}
                        value={manualEmail.message}
                        onChange={(e) => setManualEmail({ ...manualEmail, message: e.target.value })}
                      />
                    </div>
                    <Button onClick={sendManualEmail} disabled={loading} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </CardContent>
                </Card>

                {/* Manual SMS */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Send SMS
                    </CardTitle>
                    <CardDescription>Send a one-off SMS notification</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="sms-phone">Phone Number</Label>
                      <Input
                        id="sms-phone"
                        type="tel"
                        placeholder="+61400000000"
                        value={manualSMS.phone}
                        onChange={(e) => setManualSMS({ ...manualSMS, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sms-message">Message</Label>
                      <Textarea
                        id="sms-message"
                        placeholder="Your SMS message (160 chars max)..."
                        rows={6}
                        maxLength={160}
                        value={manualSMS.message}
                        onChange={(e) => setManualSMS({ ...manualSMS, message: e.target.value })}
                      />
                      <p className="text-sm text-slate-500 mt-1">
                        {manualSMS.message.length}/160 characters
                      </p>
                    </div>
                    <Button onClick={sendManualSMS} disabled={loading} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send SMS
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="scheduler">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Scheduler</CardTitle>
                  <CardDescription>
                    Automated scheduler runs hourly to send 24-hour reminders. Manually trigger if needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Automated Tasks:</h3>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Send 24-hour course reminders (email + SMS)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Process pending email queue
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Process pending SMS queue
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Respect notification preferences
                      </li>
                    </ul>
                  </div>
                  <Button onClick={triggerScheduler} disabled={loading} size="lg">
                    <Clock className="h-4 w-4 mr-2" />
                    Trigger Scheduler Now
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Tabs defaultValue="emails" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="emails">Email History</TabsTrigger>
                  <TabsTrigger value="sms">SMS History</TabsTrigger>
                </TabsList>

                <TabsContent value="emails">
                  <Card>
                    <CardHeader>
                      <CardTitle>Email History</CardTitle>
                      <CardDescription>Recent email notifications (last 50)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sent At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emailLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">{log.recipient_email}</TableCell>
                              <TableCell>{log.subject}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{log.template_type || "manual"}</Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(log.status)}</TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {log.sent_at ? new Date(log.sent_at).toLocaleString() : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sms">
                  <Card>
                    <CardHeader>
                      <CardTitle>SMS History</CardTitle>
                      <CardDescription>Recent SMS notifications (last 50)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Phone</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sent At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {smsLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">{log.recipient_phone}</TableCell>
                              <TableCell className="max-w-md truncate">{log.message_body}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{log.notification_type}</Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(log.status)}</TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {log.sent_at ? new Date(log.sent_at).toLocaleString() : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}