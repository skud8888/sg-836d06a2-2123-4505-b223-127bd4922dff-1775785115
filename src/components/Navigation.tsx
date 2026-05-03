import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { LoginModal } from "@/components/LoginModal";
import { NotificationCenter } from "@/components/NotificationCenter";
import { GlobalSearch } from "@/components/GlobalSearch";
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
  LogIn,
  Sun,
  Moon,
  Laptop,
  ChevronDown,
  Award
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

export function Navigation() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    checkUser();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      
      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      setUserRole(roleData?.role || null);
    }
  }

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
              <span className="text-xl font-bold">
                The Training Hub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                Home
              </Link>
              <Link href="/courses" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                Courses
              </Link>
              <Link href="/classes" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                Classes
              </Link>
              <Link href="/about" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                About
              </Link>
              <Link href="/contact" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                Contact
              </Link>
              <Link href="/help" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                Help
              </Link>
            </div>

            {/* Right Side - Dashboard & Auth Buttons */}
            <div className="flex items-center gap-3">
              <ThemeSwitch />
              
              {user ? (
                <>
                  {/* Dashboard Button - Visible when logged in */}
                  {userRole && (
                    <Link 
                      href={
                        userRole === 'admin' || userRole === 'super_admin' 
                          ? '/admin' 
                          : userRole === 'trainer' 
                          ? '/trainer/dashboard'
                          : '/student/portal'
                      }
                    >
                      <Button variant="default" size="sm" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="hidden lg:inline">Dashboard</span>
                      </Button>
                    </Link>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden lg:inline">{user.email?.split('@')[0]}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {userRole === 'admin' || userRole === 'super_admin' ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="flex items-center gap-2">
                              <LayoutDashboard className="h-4 w-4" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/profile" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/settings" className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Settings
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : userRole === 'trainer' ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/trainer/dashboard" className="flex items-center gap-2">
                              <LayoutDashboard className="h-4 w-4" />
                              Trainer Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/trainer" className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              My Classes
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/student/portal" className="flex items-center gap-2">
                              <LayoutDashboard className="h-4 w-4" />
                              Student Portal
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/student/profile" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              My Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/student/certificates" className="flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              My Certificates
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setLoginModalOpen(true)}>
                    Sign In
                  </Button>
                  <Link href="/admin/signup">
                    <Button variant="default" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
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

                {/* Help Link - Mobile */}
                <Link 
                  href="/help"
                  className="block px-4 py-3 hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HelpCircle className="h-4 w-4" />
                  Help Center
                </Link>

                {/* Theme Toggle - Mobile */}
                {mounted && (
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium mb-2">Theme</p>
                    <div className="flex gap-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className="flex-1"
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className="flex-1"
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system")}
                        className="flex-1"
                      >
                        <Laptop className="h-4 w-4 mr-2" />
                        Auto
                      </Button>
                    </div>
                  </div>
                )}

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
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Signed in as {user.email}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => setLoginModalOpen(true)}>
                      Sign In
                    </Button>
                    <Link href="/admin/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="default" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </div>
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