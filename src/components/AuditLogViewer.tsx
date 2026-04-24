import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search, Download, CalendarIcon, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  action_category: string;
  details: string;
  ip_address: string;
  user_agent: string;
  severity: string;
  created_at: string;
  metadata: any;
  affected_user_id: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>("7d");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
    
    // Set up real-time subscription
    const channel = supabase
      .channel("audit_logs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_logs" },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateRange, actionFilter, userFilter]);

  async function fetchLogs() {
    try {
      setLoading(true);

      let query = supabase
        .from("audit_logs")
        .select(`
          *,
          profiles!audit_logs_user_id_fkey (full_name, email)
        `)
        .order("created_at", { ascending: false });

      // Apply date range filter
      if (dateRange !== "all") {
        const daysAgo = parseInt(dateRange.replace("d", ""));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        query = query.gte("created_at", cutoffDate.toISOString());
      }

      // Apply action filter
      if (actionFilter !== "all") {
        query = query.eq("action_category", actionFilter);
      }

      // Apply user filter
      if (userFilter !== "all") {
        query = query.eq("user_id", userFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Type assertion to handle the profiles join
      setLogs((data as any[]).map((log: any) => ({
        ...log,
        profiles: log.profiles || null
      })));
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function exportToCsv() {
    try {
      const csv = [
        ["Date", "User", "Action", "Details", "IP Address", "User Agent"].join(","),
        ...logs.map(log => [
          format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
          log.profiles?.full_name || log.profiles?.email || "System",
          log.action,
          `"${log.details || ""}"`,
          log.ip_address || "",
          `"${log.user_agent || ""}"`
        ].join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();

      toast({
        title: "Export successful",
        description: `Exported ${logs.length} audit log entries`
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search) ||
      log.profiles?.full_name?.toLowerCase().includes(search) ||
      log.profiles?.email?.toLowerCase().includes(search) ||
      log.ip_address?.toLowerCase().includes(search)
    );
  });

  const actionTypes = [
    "all",
    "login",
    "logout",
    "create",
    "update",
    "delete",
    "upload",
    "download",
    "payment",
    "booking"
  ];

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      login: "bg-green-500",
      logout: "bg-gray-500",
      create: "bg-blue-500",
      update: "bg-yellow-500",
      delete: "bg-red-500",
      upload: "bg-purple-500",
      download: "bg-indigo-500",
      payment: "bg-emerald-500",
      booking: "bg-cyan-500"
    };

    return (
      <Badge className={cn("text-white", colors[action] || "bg-slate-500")}>
        {action}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>
              Track all system activities and security events
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCsv} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type === "all" ? "All Actions" : type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateFrom ? format(dateFrom, "PP") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateTo ? format(dateTo, "PP") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No audit logs found
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {log.profiles?.full_name || "System"}
                        </span>
                        {log.profiles?.email && (
                          <span className="text-xs text-muted-foreground">
                            {log.profiles.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.details}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.ip_address || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} total logs
        </div>
      </CardContent>
    </Card>
  );
}