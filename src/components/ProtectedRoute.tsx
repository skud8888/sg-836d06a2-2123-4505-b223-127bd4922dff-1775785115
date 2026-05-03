import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { canAccessPage, getUserRole, Role } from "@/lib/rbac";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole = [],
  redirectTo = "/admin/login"
}: ProtectedRouteProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [router.pathname]);

  async function checkAccess() {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(redirectTo);
        return;
      }

      // Get user role
      const role = await getUserRole(session.user.id);
      
      if (!role) {
        toast({
          title: "Access Denied",
          description: "No role assigned to your account",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      // Check role requirements
      if (requiredRole.length > 0 && !requiredRole.includes(role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      // Check page-specific permissions
      const hasAccess = canAccessPage(role, router.pathname);
      
      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        router.push("/admin");
        return;
      }

      setAuthorized(true);
    } catch (error: any) {
      console.error("Access check error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}