import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Shield,
  Flag,
  Palette,
  Database,
  Activity,
  FileText,
  BarChart3,
  Settings,
  UserCog,
  TrendingUp,
  ArrowRight,
  Zap
} from "lucide-react";

export default function QuickAccess() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

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
          description: "You don't have permission to access admin tools",
          variant: "destructive",
        });
        router.push("/admin");
        return;
      }
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

  const quickLinks = [
    {
      title: "User Management",
      description: "View and manage all user accounts",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-500",
      stats: "Manage accounts"
    },
    {
      title: "Roles & Permissions",
      description: "Assign roles and manage access control",
      icon: Shield,
      href: "/admin/roles",
      color: "bg-purple-500",
      stats: "RBAC system"
    },
    {
      title: "Team Management",
      description: "Manage staff members and trainers",
      icon: UserCog,
      href: "/admin/team",
      color: "bg-green-500",
      stats: "Staff & trainers"
    },
    {
      title: "Feature Flags",
      description: "Toggle features on/off across the platform",
      icon: Flag,
      href: "/admin/feature-flags",
      color: "bg-yellow-500",
      stats: "Feature control"
    },
    {
      title: "Branding Settings",
      description: "Customize platform appearance and branding",
      icon: Palette,
      href: "/admin/branding",
      color: "bg-pink-500",
      stats: "Visual identity"
    },
    {
      title: "System Backups",
      description: "Create and manage database backups",
      icon: Database,
      href: "/admin/backups",
      color: "bg-indigo-500",
      stats: "Data protection"
    },
    {
      title: "System Health",
      description: "Monitor system status and performance",
      icon: Activity,
      href: "/admin/system-health",
      color: "bg-red-500",
      stats: "Real-time monitoring"
    },
    {
      title: "Test Results",
      description: "View automated test execution reports",
      icon: FileText,
      href: "/admin/test-results",
      color: "bg-teal-500",
      stats: "QA metrics"
    },
    {
      title: "Analytics",
      description: "View detailed analytics and insights",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-orange-500",
      stats: "Data insights"
    },
    {
      title: "Advanced Analytics",
      description: "Deep dive into performance metrics",
      icon: TrendingUp,
      href: "/admin/advanced-analytics",
      color: "bg-cyan-500",
      stats: "Advanced metrics"
    },
    {
      title: "Settings",
      description: "Configure system settings and preferences",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-500",
      stats: "Configuration"
    },
    {
      title: "Audit Logs",
      description: "View system activity and security logs",
      icon: FileText,
      href: "/admin/audit-logs",
      color: "bg-slate-500",
      stats: "Security tracking"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb />

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Quick Access</h1>
                <p className="text-muted-foreground mt-1">
                  Fast access to all administrative tools and settings
                </p>
              </div>
            </div>
          </div>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-3 rounded-lg ${link.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {link.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {link.stats}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">User Management</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Create, edit, and manage users
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">Access Control</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Roles, permissions, and security
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">Configuration</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Feature flags and branding
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold">Monitoring</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    System health and analytics
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}