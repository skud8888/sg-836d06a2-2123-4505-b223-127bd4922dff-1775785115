import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  FileText,
  Activity,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: any;
  metadata: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export default function AuditLogs() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterResource, setFilterResource] = useState("all");
  const [dateRange, setDateRange] = useState("7");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/admin/login");
      return;
    }

    const role = await rbacService.getUserPrimaryRole();
    if (!role || (role !== "super_admin" && role !== "admin")) {
      router.push("/admin");
      return;
    }

    loadLogs();
  };

  const loadLogs = async () => {
    setLoading(true);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));

    let query = (supabase as any)
      .from("system_audit_logs")
      .select("*")
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterAction !== "all") {
      query = query.eq("action", filterAction);
    }

    if (filterResource !== "all") {
      query = query.eq("resource_type", filterResource);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) {
      loadLogs();
    }
  }, [filterAction, filterResource, dateRange]);

  const exportLogs = () => {
    const csv = [
      ["Date", "User", "Action", "Resource Type", "Resource ID", "IP Address"].join(","),
      ...logs.map(log => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.user_email,
        log.action,
        log.resource_type,
        log.resource_id,
        log.ip_address || "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Audit logs exported to CSV"
    });
  };

  const filteredLogs = logs.filter(log => 
    searchTerm === "" || 
    log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      create: "bg-green-600",
      update: "bg-blue-600",
      delete: "bg-red-600",
      login: "bg-purple-600",
      logout: "bg-gray-600"
    };
    return (
      <Badge className={actionColors[action.toLowerCase()] || "bg-gray-600"}>
        {action}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Audit Logs</h1>
              <p className="text-muted-foreground">System activity and security audit trail</p>
            </div>
            <Button onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterResource} onValueChange={setFilterResource}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="booking">Bookings</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{filteredLogs.length}</div>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredLogs.filter(l => l.action === "create").length}
              </div>
              <p className="text-sm text-muted-foreground">Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {filteredLogs.filter(l => l.action === "update").length}
              </div>
              <p className="text-sm text-muted-foreground">Updated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {filteredLogs.filter(l => l.action === "delete").length}
              </div>
              <p className="text-sm text-muted-foreground">Deleted</p>
            </CardContent>
          </Card>
        </div>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} events from the last {dateRange} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No audit logs found</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getActionBadge(log.action)}
                          <Badge variant="outline">{log.resource_type}</Badge>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">{log.user_email}</span>
                          {" "}performed{" "}
                          <span className="font-medium">{log.action}</span>
                          {" "}on{" "}
                          <span className="font-medium">{log.resource_type}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), "PPp")}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Log Detail Modal */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>
                Event ID: {selectedLog?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">User</p>
                    <p className="text-sm text-muted-foreground">{selectedLog.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Action</p>
                    <div>{getActionBadge(selectedLog.action)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Resource Type</p>
                    <Badge variant="outline">{selectedLog.resource_type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Resource ID</p>
                    <p className="text-sm text-muted-foreground font-mono">{selectedLog.resource_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Timestamp</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedLog.created_at), "PPpp")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">IP Address</p>
                    <p className="text-sm text-muted-foreground">{selectedLog.ip_address || "N/A"}</p>
                  </div>
                </div>

                {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Changes</p>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Metadata</p>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.user_agent && (
                  <div>
                    <p className="text-sm font-medium mb-1">User Agent</p>
                    <p className="text-xs text-muted-foreground break-all">{selectedLog.user_agent}</p>
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