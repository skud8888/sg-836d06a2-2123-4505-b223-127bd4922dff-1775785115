import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { LoginModal } from "@/components/LoginModal";
import { NotificationCenter } from "@/components/NotificationCenter";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  Mail,
  HelpCircle,
  GraduationCap,
  LogIn
} from "lucide-react";

export function Navigation() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        setUserName(session.user.user_metadata?.full_name || session.user.email || "User");
        checkUserRole(session.user.id);
      } else {
        setUserName("");
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
      setUserName(session.user.user_metadata?.full_name || session.user.email || "User");
      await checkUserRole(session.user.id);
    }
  };

  const checkUserRole = async (userId: string) => {
    const role = await rbacService.getUserPrimaryRole(userId);
    setUserRole(role);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push("/");
  };

  const isAdmin = userRole === "super_admin" || userRole === "admin" || userRole === "trainer" || userRole === "receptionist";

  const navLinks = [
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/contact", label: "Contact", icon: Mail },
    { href: "/help", label: "Help", icon: HelpCircle },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                The Training Hub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/courses" 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Courses
              </Link>
              <Link 
                href="/about" 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                About
              </Link>
              <Link 
                href="/student/portal" 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <GraduationCap className="h-4 w-4" />
                Student Portal
              </Link>
              <Link 
                href="/contact" 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Contact
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/courses"
                  className="block px-4 py-3 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Courses
                </Link>
                <Link 
                  href="/about"
                  className="block px-4 py-3 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="/student/portal"
                  className="block px-4 py-3 hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <GraduationCap className="h-4 w-4" />
                  Student Portal
                </Link>
                <Link 
                  href="/contact"
                  className="block px-4 py-3 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>

                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 px-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/student/portal"
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 px-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <GraduationCap className="h-4 w-4" />
                      Student Portal
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/profile"
                        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 px-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="text-red-600 hover:text-red-700 transition-colors flex items-center gap-2 px-2 text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setLoginModalOpen(true);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 px-2 text-left"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </button>
                    <Link
                      href="/courses"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full">Browse Courses</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal 
        open={loginModalOpen} 
        onOpenChange={setLoginModalOpen}
        defaultTab="admin"
      />
    </>
  );
}