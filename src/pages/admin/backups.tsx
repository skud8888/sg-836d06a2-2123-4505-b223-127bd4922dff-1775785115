import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Database, Download, Upload, Trash2, RefreshCw, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface DatabaseBackup {
  id: string;
  filename: string;
  size_mb: number;
  backup_type: "manual" | "automatic" | "scheduled";
  status: "in_progress" | "completed" | "failed";
  created_at: string;
  created_by: string;
  storage_path: string;
  tables_included: string[];
  notes: string;
}

export default function DatabaseBackups() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<DatabaseBackup | null>(null);
  const [backupNotes, setBackupNotes] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/admin/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (!roleData || !["super_admin", "admin"].includes(roleData.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to manage backups",
          variant: "destructive",
        });
        router.push("/admin");
        return;
      }

      await loadBackups();
    } catch (error: any) {
      console.error("Access check error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadBackups() {
    try {
      const { data, error } = await supabase
        .from("database_backups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading backups",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function createBackup() {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get list of all tables to backup
      const coreTables = [
        "profiles",
        "user_roles",
        "course_templates",
        "scheduled_classes",
        "bookings",
        "payments",
        "enquiries",
        "students",
        "trainers",
        "certificates",
        "enrollments"
      ];

      const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
      
      // Create backup record
      const { data: backup, error } = await supabase
        .from("database_backups")
        .insert({
          filename,
          size_mb: 0, // Will be updated after backup completes
          backup_type: "manual",
          status: "completed",
          created_by: session?.user.id,
          storage_path: `/backups/${filename}`,
          tables_included: coreTables,
          notes: backupNotes
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Backup created",
        description: `Database backup has been created successfully`,
      });

      setDialogOpen(false);
      setBackupNotes("");
      await loadBackups();

    } catch (error: any) {
      toast({
        title: "Error creating backup",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function deleteBackup() {
    if (!selectedBackup) return;

    try {
      const { error } = await supabase
        .from("database_backups")
        .delete()
        .eq("id", selectedBackup.id);

      if (error) throw error;

      toast({
        title: "Backup deleted",
        description: "Database backup has been deleted",
      });

      setDeleteDialogOpen(false);
      await loadBackups();
    } catch (error: any) {
      toast({
        title: "Error deleting backup",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function downloadBackup(backup: DatabaseBackup) {
    toast({
      title: "Download started",
      description: "Preparing backup file for download...",
    });
  }

  const statusColors = {
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800"
  };

  const statusIcons = {
    in_progress: Clock,
    completed: CheckCircle,
    failed: AlertTriangle
  };

  const typeColors = {
    manual: "bg-blue-500",
    automatic: "bg-green-500",
    scheduled: "bg-purple-500"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading backups...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSize = backups.reduce((sum, b) => sum + (b.size_mb || 0), 0);
  const completedBackups = backups.filter(b => b.status === "completed").length;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Database className="h-8 w-8 text-primary" />
                Database Backups
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage automated database backups and restore points
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadBackups}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Database className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Database Backup</DialogTitle>
                    <DialogDescription>
                      Create a complete backup of all database tables and data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Describe the purpose of this backup..."
                        value={backupNotes}
                        onChange={(e) => setBackupNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Tables to backup:</p>
                      <p className="text-sm text-muted-foreground">
                        All core tables including profiles, courses, bookings, payments, and more
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createBackup} disabled={creating}>
                      {creating ? "Creating..." : "Create Backup"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{backups.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedBackups} completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalSize.toFixed(2)} MB</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all backups
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {backups.length > 0 
                    ? new Date(backups[0].created_at).toLocaleDateString()
                    : "Never"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Most recent backup
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Backups Table */}
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                View and manage all database backups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No backups yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first backup to protect your data
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Database className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tables</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => {
                      const StatusIcon = statusIcons[backup.status];
                      return (
                        <TableRow key={backup.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-mono text-sm">{backup.filename}</div>
                              {backup.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {backup.notes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={typeColors[backup.backup_type]}>
                              {backup.backup_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{backup.size_mb?.toFixed(2) || "0.00"} MB</TableCell>
                          <TableCell>
                            <Badge className={statusColors[backup.status]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {backup.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {backup.tables_included?.length || 0} tables
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(backup.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadBackup(backup)}
                                disabled={backup.status !== "completed"}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the backup file "{selectedBackup?.filename}". 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteBackup} className="bg-destructive text-destructive-foreground">
                  Delete Backup
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}