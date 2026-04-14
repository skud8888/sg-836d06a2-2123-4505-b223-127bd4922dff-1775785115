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
            <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span>GTS Training</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && (
                <>
                  <GlobalSearch />
                  <NotificationCenter />
                  <ThemeSwitch />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <User className="h-4 w-4" />
                        {userName}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem asChild>
                        <Link href="/student/portal" className="cursor-pointer">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Student Portal
                        </Link>
                      </DropdownMenuItem>

                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin/profile" className="cursor-pointer">
                            <User className="h-4 w-4 mr-2" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin/settings" className="cursor-pointer">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {!isAuthenticated && (
                <>
                  <ThemeSwitch />
                  <Button onClick={() => setLoginModalOpen(true)} variant="ghost">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Link href="/courses">
                    <Button>Browse Courses</Button>
                  </Link>
                </>
              )}
            </div>

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
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 px-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}

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