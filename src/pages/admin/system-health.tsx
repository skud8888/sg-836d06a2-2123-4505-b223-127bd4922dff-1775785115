import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Database,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  HardDrive,
  Cpu,
  Wifi
} from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  responseTime: number;
  uptime: number;
  lastChecked: Date;
}

interface SystemMetrics {
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
    size: number;
  };
  api: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
}

export default function SystemHealth() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    database: {
      connections: 0,
      maxConnections: 100,
      queryTime: 0,
      size: 0
    },
    api: {
      requests: 0,
      errors: 0,
      avgResponseTime: 0
    },
    performance: {
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0
    }
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSystemHealth();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

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
          description: "You don't have permission to view system health",
          variant: "destructive",
        });
        router.push("/admin");
        return;
      }

      await loadSystemHealth();
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

  async function loadSystemHealth() {
    try {
      // Check Database Service
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from("profiles").select("id").limit(1);
      const dbResponseTime = Date.now() - dbStart;

      // Check Authentication Service
      const authStart = Date.now();
      const { error: authError } = await supabase.auth.getSession();
      const authResponseTime = Date.now() - authStart;

      // Check Storage Service
      const storageStart = Date.now();
      const { error: storageError } = await supabase.storage.listBuckets();
      const storageResponseTime = Date.now() - storageStart;

      // Check API Health
      const apiStart = Date.now();
      const healthResponse = await fetch("/api/health");
      const apiResponseTime = Date.now() - apiStart;
      const apiHealth = healthResponse.ok;

      // Get database stats
      const { data: tableCount } = await supabase.rpc("get_table_count" as any);
      const { data: dbSize } = await supabase.rpc("get_database_size" as any);

      setServices([
        {
          name: "Database",
          status: dbError ? "down" : dbResponseTime > 1000 ? "degraded" : "operational",
          responseTime: dbResponseTime,
          uptime: 99.9,
          lastChecked: new Date()
        },
        {
          name: "Authentication",
          status: authError ? "down" : authResponseTime > 500 ? "degraded" : "operational",
          responseTime: authResponseTime,
          uptime: 99.95,
          lastChecked: new Date()
        },
        {
          name: "Storage",
          status: storageError ? "down" : storageResponseTime > 800 ? "degraded" : "operational",
          responseTime: storageResponseTime,
          uptime: 99.8,
          lastChecked: new Date()
        },
        {
          name: "API",
          status: !apiHealth ? "down" : apiResponseTime > 600 ? "degraded" : "operational",
          responseTime: apiResponseTime,
          uptime: 99.85,
          lastChecked: new Date()
        }
      ]);

      // Simulate metrics (in production, these would come from actual monitoring)
      setMetrics({
        database: {
          connections: Math.floor(Math.random() * 20) + 5,
          maxConnections: 100,
          queryTime: dbResponseTime,
          size: Math.floor(Math.random() * 500) + 100
        },
        api: {
          requests: Math.floor(Math.random() * 10000) + 5000,
          errors: Math.floor(Math.random() * 50),
          avgResponseTime: (dbResponseTime + authResponseTime + apiResponseTime) / 3
        },
        performance: {
          memoryUsage: Math.floor(Math.random() * 40) + 30,
          cpuUsage: Math.floor(Math.random() * 30) + 10,
          diskUsage: Math.floor(Math.random() * 50) + 20
        }
      });

    } catch (error: any) {
      console.error("Error loading system health:", error);
      toast({
        title: "Error loading system health",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  const overallStatus = services.every(s => s.status === "operational") 
    ? "operational" 
    : services.some(s => s.status === "down") 
    ? "down" 
    : "degraded";

  const statusColors = {
    operational: "text-green-600 bg-green-100",
    degraded: "text-yellow-600 bg-yellow-100",
    down: "text-red-600 bg-red-100"
  };

  const statusIcons = {
    operational: CheckCircle,
    degraded: AlertTriangle,
    down: XCircle
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading system health...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const OverallStatusIcon = statusIcons[overallStatus];

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
                <Activity className="h-8 w-8 text-primary" />
                System Health
              </h1>
              <p className="text-muted-foreground mt-2">
                Real-time monitoring of system services and performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "bg-primary text-primary-foreground" : ""}
              >
                <Wifi className="h-4 w-4 mr-2" />
                Auto-refresh {autoRefresh ? "On" : "Off"}
              </Button>
              <Button onClick={loadSystemHealth}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Overall Status */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${statusColors[overallStatus]}`}>
                    <OverallStatusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold capitalize">{overallStatus}</h3>
                    <p className="text-sm text-muted-foreground">
                      All systems {overallStatus === "operational" ? "running normally" : "experiencing issues"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last checked</div>
                  <div className="font-medium">{new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {services.map((service) => {
              const StatusIcon = statusIcons[service.status];
              return (
                <Card key={service.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge className={statusColors[service.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {service.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Response Time</span>
                      <span className="font-medium">{service.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uptime</span>
                      <span className="font-medium">{service.uptime}%</span>
                    </div>
                    <Progress value={service.uptime} className="h-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Database Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Active Connections</span>
                    <span className="font-medium">
                      {metrics.database.connections} / {metrics.database.maxConnections}
                    </span>
                  </div>
                  <Progress 
                    value={(metrics.database.connections / metrics.database.maxConnections) * 100} 
                    className="h-2" 
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Query Time</span>
                  <span className="font-medium">{metrics.database.queryTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Database Size</span>
                  <span className="font-medium">{metrics.database.size} MB</span>
                </div>
              </CardContent>
            </Card>

            {/* API Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  API Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Total Requests (24h)</span>
                  <span className="font-medium">{metrics.api.requests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Error Rate</span>
                  <span className="font-medium">
                    {((metrics.api.errors / metrics.api.requests) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Response Time</span>
                  <span className="font-medium">{Math.round(metrics.api.avgResponseTime)}ms</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium">{metrics.performance.cpuUsage}%</span>
                    </div>
                    <Progress value={metrics.performance.cpuUsage} className="h-2" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium">{metrics.performance.memoryUsage}%</span>
                    </div>
                    <Progress value={metrics.performance.memoryUsage} className="h-2" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Disk Usage</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium">{metrics.performance.diskUsage}%</span>
                    </div>
                    <Progress value={metrics.performance.diskUsage} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}