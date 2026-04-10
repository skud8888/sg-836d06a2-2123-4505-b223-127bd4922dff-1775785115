import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Database,
  Shield,
  HardDrive,
  Zap,
  Server,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Cpu,
  MemoryStick
} from "lucide-react";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: ServiceHealth;
    auth: ServiceHealth;
    storage: ServiceHealth;
    api: ServiceHealth;
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

interface ServiceHealth {
  status: "operational" | "degraded" | "down";
  responseTime: number;
  message?: string;
}

export default function SystemHealth() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchHealthStatus(true);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

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

    fetchHealthStatus();
  };

  const fetchHealthStatus = async (silent = false) => {
    if (!silent) setRefreshing(true);

    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error("Failed to fetch health status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch system health status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "unhealthy":
      case "down":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
      case "operational":
        return <Badge className="bg-green-600">Operational</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-600">Degraded</Badge>;
      case "unhealthy":
      case "down":
        return <Badge className="bg-red-600">Down</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Loading system health...</p>
        </div>
      </div>
    );
  }

  const services = healthData?.services || {};
  const system = healthData?.system;

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
              <h1 className="text-3xl font-bold">System Health</h1>
              <p className="text-muted-foreground">Monitor service status and performance</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
                Auto-refresh {autoRefresh ? "ON" : "OFF"}
              </Button>
              <Button
                onClick={() => fetchHealthStatus()}
                disabled={refreshing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthData?.status || "unknown")}
                <div>
                  <CardTitle>Overall Status</CardTitle>
                  <CardDescription>
                    Last checked: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : "Never"}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(healthData?.status || "unknown")}
            </div>
          </CardHeader>
        </Card>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle>Database</CardTitle>
                </div>
                {getStatusBadge(services.database?.status || "unknown")}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-medium">{services.database?.responseTime.toFixed(0)}ms</span>
                </div>
                {services.database?.message && (
                  <p className="text-sm text-destructive">{services.database.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Authentication</CardTitle>
                </div>
                {getStatusBadge(services.auth?.status || "unknown")}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-medium">{services.auth?.responseTime.toFixed(0)}ms</span>
                </div>
                {services.auth?.message && (
                  <p className="text-sm text-destructive">{services.auth.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <CardTitle>Storage</CardTitle>
                </div>
                {getStatusBadge(services.storage?.status || "unknown")}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-medium">{services.storage?.responseTime.toFixed(0)}ms</span>
                </div>
                {services.storage?.message && (
                  <p className="text-sm text-destructive">{services.storage.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle>API Endpoints</CardTitle>
                </div>
                {getStatusBadge(services.api?.status || "unknown")}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-medium">{services.api?.responseTime.toFixed(0)}ms</span>
                </div>
                {services.api?.message && (
                  <p className="text-sm text-destructive">{services.api.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Resources */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-primary" />
              <CardTitle>System Resources</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Server Uptime</span>
                </div>
                <p className="text-2xl font-bold">{system ? formatUptime(system.uptime) : "N/A"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {system?.memory.used}MB / {system?.memory.total}MB
                    </span>
                    <span className="font-medium">{system?.memory.percentage}%</span>
                  </div>
                  <Progress value={system?.memory.percentage || 0} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    const { error } = await (supabase as any)
      .from("profiles")
      .select("id")
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: "down",
        responseTime,
        message: error.message
      };
    }

    return {
      status: responseTime > 1000 ? "degraded" : "operational",
      responseTime
    };
  } catch (error: any) {
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      message: error.message
    };
  }
}

async function checkAuth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check if we can get session (doesn't require authenticated user)
    const { error } = await supabase.auth.getSession();
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: "down",
        responseTime,
        message: error.message
      };
    }

    return {
      status: responseTime > 1000 ? "degraded" : "operational",
      responseTime
    };
  } catch (error: any) {
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      message: error.message
    };
  }
}

async function checkStorage(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Try to list buckets (public operation)
    const { error } = await supabase.storage.listBuckets();
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: "down",
        responseTime,
        message: error.message
      };
    }

    return {
      status: responseTime > 1000 ? "degraded" : "operational",
      responseTime
    };
  } catch (error: any) {
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      message: error.message
    };
  }
}

async function checkAPI(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check if API route is responsive
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/hello`);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: "degraded",
        responseTime,
        message: `HTTP ${response.status}`
      };
    }

    return {
      status: responseTime > 1000 ? "degraded" : "operational",
      responseTime
    };
  } catch (error: any) {
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      message: error.message
    };
  }
}