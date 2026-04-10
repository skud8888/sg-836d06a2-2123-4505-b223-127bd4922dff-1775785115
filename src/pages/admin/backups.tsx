import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Database,
  Download,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Calendar,
  Settings,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface BackupHistory {
  id: string;
  config_id: string;
  backup_type: string;
  status: string;
  file_size: number | null;
  storage_location: string | null;
  verification_status: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface BackupConfig {
  id: string;
  backup_type: string;
  schedule: string;
  retention_days: number;
  storage_location: string;
  encryption_enabled: boolean;
  auto_verify: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function BackupsDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [configs, setConfigs] = useState<BackupConfig[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupHistory | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Config form state
  const [backupType, setBackupType] = useState("full");
  const [schedule, setSchedule] = useState("daily");
  const [retentionDays, setRetentionDays] = useState(30);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [autoVerify, setAutoVerify] = useState(true);

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
    if (!role || role !== "super_admin") {
      router.push("/admin");
      return;
    }

    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBackupHistory(), loadConfigurations()]);
    setLoading(false);
  };

  const loadBackupHistory = async () => {
    const { data, error } = await (supabase as any)
      .from("backup_history")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading backup history:", error);
      toast({
        title: "Error",
        description: "Failed to load backup history",
        variant: "destructive"
      });
    } else {
      setBackupHistory(data || []);
    }
  };

  const loadConfigurations = async () => {
    const { data, error } = await (supabase as any)
      .from("backup_configurations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading configurations:", error);
    } else {
      setConfigs(data || []);
      
      // Set form values from active config
      const activeConfig = data?.find((c: BackupConfig) => c.status === "active");
      if (activeConfig) {
        setBackupType(activeConfig.backup_type);
        setSchedule(activeConfig.schedule);
        setRetentionDays(activeConfig.retention_days);
        setEncryptionEnabled(activeConfig.encryption_enabled);
        setAutoVerify(activeConfig.auto_verify);
      }
    }
  };

  const triggerManualBackup = async () => {
    setTriggering(true);

    try {
      const { data, error } = await supabase.functions.invoke("backup-database");

      if (error) throw error;

      toast({
        title: "Backup started",
        description: "The backup process has been initiated successfully"
      });

      // Refresh backup history after 3 seconds
      setTimeout(() => {
        loadBackupHistory();
      }, 3000);
    } catch (error: any) {
      console.error("Backup trigger error:", error);
      toast({
        title: "Backup failed",
        description: error.message || "Failed to trigger backup",
        variant: "destructive"
      });
    } finally {
      setTriggering(false);
    }
  };

  const downloadBackup = async (backup: BackupHistory) => {
    if (!backup.storage_location) {
      toast({
        title: "Error",
        description: "No storage location found for this backup",
        variant: "destructive"
      });
      return;
    }

    setDownloading(backup.id);

    try {
      const { data, error } = await supabase.storage
        .from("backups")
        .download(backup.storage_location);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.storage_location.split("/").pop() || "backup.json";
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your backup file is downloading"
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloading(null);
    }
  };

  const updateConfiguration = async () => {
    const activeConfig = configs.find(c => c.status === "active");
    if (!activeConfig) return;

    const { error } = await (supabase as any)
      .from("backup_configurations")
      .update({
        backup_type: backupType,
        schedule,
        retention_days: retentionDays,
        encryption_enabled: encryptionEnabled,
        auto_verify: autoVerify,
        updated_at: new Date().toISOString()
      })
      .eq("id", activeConfig.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Configuration updated",
        description: "Backup settings have been saved"
      });
      loadConfigurations();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-600">Failed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-600">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const stats = {
    total: backupHistory.length,
    completed: backupHistory.filter(b => b.status === "completed").length,
    failed: backupHistory.filter(b => b.status === "failed").length,
    lastBackup: backupHistory[0],
    totalSize: backupHistory
      .filter(b => b.file_size)
      .reduce((sum, b) => sum + (b.file_size || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Loading backups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Database Backups</h1>
              <p className="text-muted-foreground">Automated backup management and disaster recovery</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={triggerManualBackup} disabled={triggering}>
                {triggering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Backup Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-sm text-muted-foreground">Total Backups</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
                  <p className="text-sm text-muted-foreground">Total Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList>
            <TabsTrigger value="history">
              <Calendar className="h-4 w-4 mr-2" />
              Backup History
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Backup History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Backup History</CardTitle>
                <CardDescription>
                  Last {stats.total} backups. Files are retained for {retentionDays} days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {backupHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No backups found</p>
                        <Button onClick={triggerManualBackup} className="mt-4">
                          <Play className="h-4 w-4 mr-2" />
                          Create First Backup
                        </Button>
                      </div>
                    ) : (
                      backupHistory.map((backup) => (
                        <div
                          key={backup.id}
                          onClick={() => setSelectedBackup(backup)}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {getStatusIcon(backup.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusBadge(backup.status)}
                              <Badge variant="outline">{backup.backup_type}</Badge>
                              {backup.verification_status === "verified" && (
                                <Badge variant="outline" className="text-green-600">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">
                              Started: {format(new Date(backup.started_at), "PPp")}
                            </p>
                            {backup.completed_at && (
                              <p className="text-sm text-muted-foreground">
                                Completed: {format(new Date(backup.completed_at), "PPp")}
                              </p>
                            )}
                            {backup.error_message && (
                              <p className="text-sm text-red-600 mt-1">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                {backup.error_message}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatFileSize(backup.file_size)}</p>
                            {backup.status === "completed" && backup.storage_location && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadBackup(backup);
                                }}
                                disabled={downloading === backup.id}
                                className="mt-2"
                              >
                                {downloading === backup.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-3 w-3 mr-2" />
                                    Download
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Backup Configuration</CardTitle>
                <CardDescription>Configure automated backup settings and retention policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Backup Type</Label>
                    <Select value={backupType} onValueChange={setBackupType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Backup</SelectItem>
                        <SelectItem value="incremental">Incremental Backup</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Full backups include all data. Incremental only backs up changes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <Select value={schedule} onValueChange={setSchedule}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How often automated backups should run.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Retention Period (Days)</Label>
                    <Input
                      type="number"
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                      min={1}
                      max={365}
                    />
                    <p className="text-xs text-muted-foreground">
                      Old backups will be automatically deleted after this many days.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Encryption Enabled</Label>
                      <input
                        type="checkbox"
                        checked={encryptionEnabled}
                        onChange={(e) => setEncryptionEnabled(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-Verify Backups</Label>
                      <input
                        type="checkbox"
                        checked={autoVerify}
                        onChange={(e) => setAutoVerify(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Current Configuration:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Backup Type: {backupType}</li>
                    <li>• Schedule: {schedule}</li>
                    <li>• Retention: {retentionDays} days</li>
                    <li>• Encryption: {encryptionEnabled ? "Enabled" : "Disabled"}</li>
                    <li>• Auto-Verify: {autoVerify ? "Enabled" : "Disabled"}</li>
                  </ul>
                </div>

                <Button onClick={updateConfiguration}>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>Backup Contents:</strong> All database tables including user data, bookings, payments, courses, audit logs, and system configurations.
                </p>
                <p>
                  <strong>Storage:</strong> Backups are stored in Supabase Storage bucket "backups" with restricted access.
                </p>
                <p>
                  <strong>Restoration:</strong> To restore from a backup, download the file and contact support for assistance.
                </p>
                <p>
                  <strong>Testing:</strong> Regularly test your backups by downloading and verifying the JSON structure.
                </p>
                <p className="text-yellow-600">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  <strong>Note:</strong> File attachments and media are not included in database backups. Set up separate Storage bucket backups.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Backup Detail Modal */}
        <Dialog open={!!selectedBackup} onOpenChange={() => setSelectedBackup(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Backup Details</DialogTitle>
              <DialogDescription>
                Backup ID: {selectedBackup?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedBackup && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Status</p>
                    <div>{getStatusBadge(selectedBackup.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Type</p>
                    <Badge variant="outline">{selectedBackup.backup_type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">File Size</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedBackup.file_size)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Verification</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBackup.verification_status || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Started At</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedBackup.started_at), "PPpp")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Completed At</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBackup.completed_at ? format(new Date(selectedBackup.completed_at), "PPpp") : "N/A"}
                    </p>
                  </div>
                </div>

                {selectedBackup.storage_location && (
                  <div>
                    <p className="text-sm font-medium mb-1">Storage Location</p>
                    <p className="text-xs text-muted-foreground font-mono break-all bg-muted p-2 rounded">
                      {selectedBackup.storage_location}
                    </p>
                  </div>
                )}

                {selectedBackup.error_message && (
                  <div>
                    <p className="text-sm font-medium mb-1">Error Message</p>
                    <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded">
                      {selectedBackup.error_message}
                    </p>
                  </div>
                )}

                {selectedBackup.status === "completed" && selectedBackup.storage_location && (
                  <Button
                    onClick={() => downloadBackup(selectedBackup)}
                    disabled={downloading === selectedBackup.id}
                    className="w-full"
                  >
                    {downloading === selectedBackup.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Backup File
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}