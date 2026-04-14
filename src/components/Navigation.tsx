import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, LogOut, User, Settings, Home, BookOpen, 
  Calendar, Users, BarChart3, Bell, FileText, Shield,
  ChevronLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitch } from "./ThemeSwitch";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const navLinks = [
    { href: "/courses", label: "Courses" },
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" }
  ];

  const studentPortalLinks = [
    { href: "/student/portal", label: "My Dashboard" },
    { href: "/student/feedback", label: "Submit Feedback" },
    { href: "/courses", label: "Browse Courses" }
  ];

  const getBackButtonConfig = () => {
    const path = router.pathname;
    
    // Map of paths to their back destinations
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

    // Handle dynamic routes
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

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">GTS Training</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
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
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitch />
            
            {/* Show notification center if authenticated */}
            {isAuthenticated && <NotificationCenter />}
            
            {/* Student Portal Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Student Portal
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {studentPortalLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="cursor-pointer">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/admin/login">
              <Button>Admin Login</Button>
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t mt-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="block hover:text-primary transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t">
              <div className="flex items-center gap-3 mb-3">
                <ThemeSwitch />
                {isAuthenticated && <NotificationCenter />}
              </div>
              <div className="text-sm font-semibold text-muted-foreground mb-2">Student Portal</div>
              {studentPortalLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="block pl-4 hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/admin/login" className="block pt-3" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Admin Login</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}