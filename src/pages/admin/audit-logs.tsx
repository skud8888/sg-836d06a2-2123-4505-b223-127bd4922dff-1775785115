import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, Filter, Download, ShieldAlert, Activity, Users, Settings, Database, CalendarDays, CreditCard } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  action: string;
  action_category: string;
  severity: string;
  details: string;
  ip_address: string | null;
  created_at: string;
  user: { email: string } | null;
  affected_user: { email: string } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [categoryFilter, severityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select(`
          id, action, action_category, severity, details, ip_address, created_at,
          user:profiles!audit_logs_user_id_fkey(email),
          affected_user:profiles!audit_logs_affected_user_id_fkey(email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (categoryFilter !== "all") {
        query = query.eq("action_category", categoryFilter);
      }
      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setLogs((data || []) as any);
    } catch (err: any) {
      console.error("Error fetching logs:", err);
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <ShieldAlert className="h-4 w-4 text-purple-500" />;
      case 'user_management': return <Users className="h-4 w-4 text-blue-500" />;
      case 'system': return <Settings className="h-4 w-4 text-slate-500" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'booking_management': return <CalendarDays className="h-4 w-4 text-orange-500" />;
      case 'course_management': return <Database className="h-4 w-4 text-indigo-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Warning</Badge>;
      default: return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
    }
  };

  const filteredLogs = logs.filter(log => 
    search === "" || 
    log.details?.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Activity Logs</h1>
              <p className="text-slate-500 mt-1">System-wide audit trail and security events</p>
            </div>
            
            <Button variant="outline" onClick={() => fetchLogs()} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-white pb-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search logs by action, details, or user..." 
                    className="pl-9 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                    <SelectItem value="user_management">User Management</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                        Loading audit logs...
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                        No activity logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="whitespace-nowrap text-sm text-slate-500">
                          {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(log.severity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm capitalize">
                            {getCategoryIcon(log.action_category)}
                            {log.action_category.replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user?.email || "System"}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate" title={log.details}>
                          {log.details}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 font-mono">
                          {log.ip_address || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}