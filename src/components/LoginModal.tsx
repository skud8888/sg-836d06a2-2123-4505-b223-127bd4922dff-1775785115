import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Loader2, User, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "admin" | "student";
}

export function LoginModal({ open, onOpenChange, defaultTab = "admin" }: LoginModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error("Authentication failed");

      // Check admin access
      const userRoles = await rbacService.getUserRoles(data.user.id);
      const allowedRoles = ["super_admin", "admin", "trainer", "receptionist"];
      const hasAdminAccess = userRoles.some(roleAssignment => 
        allowedRoles.includes(roleAssignment.role)
      );

      if (!hasAdminAccess) {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      toast({
        title: "Welcome back!",
        description: "Redirecting to admin dashboard..."
      });

      onOpenChange(false);
      router.push("/admin");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error("Authentication failed");

      toast({
        title: "Welcome back!",
        description: "Redirecting to student portal..."
      });

      onOpenChange(false);
      router.push("/student/portal");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Welcome Back</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to access your account
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin">
              <User className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
            <TabsTrigger value="student">
              <Mail className="h-4 w-4 mr-2" />
              Student
            </TabsTrigger>
          </TabsList>

          {/* Admin Login */}
          <TabsContent value="admin">
            <form onSubmit={handleAdminLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="admin-password">Password</Label>
                  <Link 
                    href="/admin/reset-password" 
                    className="text-xs text-primary hover:underline"
                    onClick={() => onOpenChange(false)}
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link 
                  href="/admin/signup" 
                  className="text-primary hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  Sign up
                </Link>
              </p>
            </form>
          </TabsContent>

          {/* Student Login */}
          <TabsContent value="student">
            <form onSubmit={handleStudentLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="student-email">Email</Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-password">Password</Label>
                <Input
                  id="student-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>New student? Book a course to create your account</p>
                <Link 
                  href="/courses" 
                  className="text-primary hover:underline block"
                  onClick={() => onOpenChange(false)}
                >
                  Browse Courses
                </Link>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}