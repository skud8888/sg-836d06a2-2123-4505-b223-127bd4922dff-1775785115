import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { auditService, type AuditLog, type AuditAction, type ResourceType } from "@/services/auditService";
import { rbacService } from "@/services/rbacService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AuditLogsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Filters
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterResource, setFilterResource] = useState<string>("");
  const [filterUserEmail, setFilterUserEmail] = useState("");
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  useEffect(() => {
    checkPermissions();
    fetchLogs();
  }, []);

  const checkPermissions = async () => {
    const canViewLogs = await rbacService.hasPermission("audit_logs", "read");
    if (!canViewLogs) {
      router.push("/admin");
    }
  };

  const fetchLogs = async () => {
    setLoading(true);

    const filters: any = {};
    if (filterAction) filters.action = filterAction as AuditAction;
    if (filterResource) filters.resourceType = filterResource as ResourceType;
    if (dateRange.start) filters.startDate = dateRange.start;
    if (dateRange.end) filters.endDate = dateRange.end;

    const data = await auditService.getLogs(filters);
    setLogs(data);
    setLoading(false);
  };

  const handleExport = async () => {
    const csv = await auditService.exportLogs({
      action: filterAction as AuditAction | undefined,
      resourceType: filterResource as ResourceType | undefined,
      startDate: dateRange.start,
      endDate: dateRange.end
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Audit logs exported successfully" });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-500 text-white";
      case "UPDATE":
        return "bg-blue-500 text-white";
      case "DELETE":
        return "bg-red-500 text-white";
      case "VIEW":
        return "bg-gray-500 text-white";
      case "EXPORT":
        return "bg-purple-500 text-white";
      case "LOGIN":
        return "bg-green-600 text-white";
      case "LOGOUT":
        return "bg-orange-500 text-white";
      default:
        return "";
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterUserEmail && !log.user_email?.toLowerCase().includes(filterUserEmail.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">System Audit Logs</h1>
            <p className="text-muted-foreground">Complete activity trail for compliance</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchLogs} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="action">Action</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger id="action">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All actions</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="VIEW">View</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resource">Resource Type</Label>
                <Select value={filterResource} onValueChange={setFilterResource}>
                  <SelectTrigger id="resource">
                    <SelectValue placeholder="All resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All resources</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user-email">User Email</Label>
                <Input
                  id="user-email"
                  placeholder="Filter by email..."
                  value={filterUserEmail}
                  onChange={(e) => setFilterUserEmail(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={fetchLogs} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>{filteredLogs.length} events recorded</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading logs...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No audit logs found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setSelectedLog(log);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_at), "MMM d, yyyy h:mm:ss a")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.user_email || "System"}</p>
                          {log.user_role && (
                            <Badge variant="outline" className="mt-1">
                              {log.user_role.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.resource_type}</span>
                        {log.resource_id && (
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">
                            {log.resource_id}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.metadata && Object.keys(log.metadata).length > 0
                          ? Object.keys(log.metadata).length + " metadata fields"
                          : "No details"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete event information
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Timestamp</Label>
                  <p className="font-mono text-sm">
                    {format(new Date(selectedLog.created_at), "PPpp")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">User</Label>
                  <p className="font-medium">{selectedLog.user_email || "System"}</p>
                  {selectedLog.user_role && (
                    <Badge variant="outline" className="mt-1">
                      {selectedLog.user_role.replace("_", " ")}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Action</Label>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Resource</Label>
                  <p className="font-medium">{selectedLog.resource_type}</p>
                  {selectedLog.resource_id && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {selectedLog.resource_id}
                    </p>
                  )}
                </div>
              </div>

              {selectedLog.old_values && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Previous Values</Label>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">New Values</Label>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Metadata</Label>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}