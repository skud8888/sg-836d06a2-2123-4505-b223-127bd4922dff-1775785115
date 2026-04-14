import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, LogOut, User, Settings, Home, BookOpen, 
  Calendar, Users, BarChart3, Bell, FileText, Shield,
  ChevronLeft, ChevronDown, LayoutDashboard, GraduationCap,
  ClipboardList, DollarSign, Wrench
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitch } from "./ThemeSwitch";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        checkUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) {
      await checkUserRole(session.user.id);
    }
  };

  const checkUserRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["super_admin", "admin", "trainer"]);

    if (roleData && roleData.length > 0) {
      setUserRole(roleData[0].role);
    } else {
      setUserRole("student");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserRole(null);
      toast({ title: "Logged out successfully" });
      router.push("/");
    } catch (error) {
      toast({
        title: "Error logging out",
        variant: "destructive"
      });
    }
  };

  // Public navigation links (shown when not logged in)
  const publicNavLinks = [
    { href: "/courses", label: "Courses" },
    { href: "/classes", label: "Classes" },
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" }
  ];

  // Admin navigation links (shown when logged in as admin/super_admin)
  const adminNavLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/calendar", label: "Calendar", icon: Calendar },
    { href: "/admin/courses", label: "Courses", icon: GraduationCap },
    { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings }
  ];

  // Student navigation links
  const studentNavLinks = [
    { href: "/student/portal", label: "My Dashboard" },
    { href: "/courses", label: "Browse Courses" },
    { href: "/classes", label: "Browse Classes" },
    { href: "/student/certificates", label: "My Certificates" }
  ];

  // Trainer navigation links
  const trainerNavLinks = [
    { href: "/trainer", label: "Trainer Portal" },
    { href: "/admin/calendar", label: "My Schedule" },
    { href: "/classes", label: "Browse Classes" }
  ];

  const getBackButtonConfig = () => {
    const path = router.pathname;
    
    const backRoutes: Record<string, { label: string; path: string }> = {
      "/admin/calendar": { label: "Dashboard", path: "/admin" },
      "/admin/courses": { label: "Dashboard", path: "/admin" },
      "/admin/bookings": { label: "Dashboard", path: "/admin" },
      "/admin/trainers": { label: "Dashboard", path: "/admin" },
      "/admin/enquiries": { label: "Dashboard", path: "/admin" },
      "/admin/analytics": { label: "Dashboard", path: "/admin" },
      "/admin/ai-insights": { label: "Dashboard", path: "/admin" },
      "/admin/users": { label: "Dashboard", path: "/admin" },
      "/admin/audit-logs": { label: "Dashboard", path: "/admin" },
      "/admin/students": { label: "Dashboard", path: "/admin" },
      "/admin/payments": { label: "Dashboard", path: "/admin" },
      "/admin/profile": { label: "Dashboard", path: "/admin" },
      "/admin/system-health": { label: "Dashboard", path: "/admin" },
      "/admin/feedback": { label: "Dashboard", path: "/admin" },
      "/admin/backups": { label: "Dashboard", path: "/admin" },
      "/admin/settings": { label: "Dashboard", path: "/admin" },
      "/admin/team": { label: "Dashboard", path: "/admin" },
      "/admin/waitlist": { label: "Dashboard", path: "/admin" },
      "/admin/certificates": { label: "Dashboard", path: "/admin" },
      "/admin/instructor-payouts": { label: "Dashboard", path: "/admin" },
      "/student/portal": { label: "Home", path: "/" },
      "/student/feedback": { label: "Portal", path: "/student/portal" },
      "/student/certificates": { label: "Portal", path: "/student/portal" },
      "/student/pre-course": { label: "Portal", path: "/student/portal" },
      "/trainer": { label: "Home", path: "/" },
      "/field": { label: "Home", path: "/" },
    };

    if (path.startsWith("/admin/course-builder/")) {
      return { label: "Courses", path: "/admin/courses" };
    }
    if (path.startsWith("/booking/")) {
      return { label: "Classes", path: "/classes" };
    }
    if (path.startsWith("/enroll/")) {
      return { label: "Courses", path: "/courses" };
    }
    if (path.startsWith("/courses/") && path.includes("/forum")) {
      return { label: "My Enrollments", path: "/student/portal" };
    }

    return backRoutes[path] || null;
  };

  const backConfig = getBackButtonConfig();

  // Determine which nav links to show
  const getNavLinks = () => {
    if (!isAuthenticated) return publicNavLinks;
    if (userRole === "super_admin" || userRole === "admin") return adminNavLinks;
    if (userRole === "trainer") return trainerNavLinks;
    return studentNavLinks;
  };

  const navLinks = getNavLinks();
  const isAdmin = userRole === "super_admin" || userRole === "admin";

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Back Button */}
          <div className="flex items-center gap-4">
            {backConfig && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => router.push(backConfig.path)}
              >
                <ChevronLeft className="h-4 w-4" />
                {backConfig.label}
              </Button>
            )}
            <Link href={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">The Training Hub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => {
              const Icon = "icon" in link ? (link.icon as React.ElementType) : null;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="flex items-center gap-2 hover:text-primary transition-colors font-medium text-sm"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitch />
            
            {isAuthenticated && <NotificationCenter />}
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Account
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings" className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/admin/login">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t mt-4">
            {navLinks.map((link) => {
              const Icon = "icon" in link ? (link.icon as React.ElementType) : null;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-4 space-y-3 border-t">
              <div className="flex items-center gap-3 mb-3">
                <ThemeSwitch />
                {isAuthenticated && <NotificationCenter />}
              </div>
              {isAuthenticated ? (
                <>
                  <Link href="/admin/profile" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/admin/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Login</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}