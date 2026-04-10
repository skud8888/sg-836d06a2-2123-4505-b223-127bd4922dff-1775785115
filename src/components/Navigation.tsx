import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-heading font-bold">GTS Training</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/courses" className="hover:text-primary transition-colors">
              Courses
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <GlobalSearch />
            <ThemeSwitch />
            <Link href="/admin/login">
              <Button>Admin Login</Button>
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 px-6 space-y-4 border-t">
            <Link href="/courses" className="block hover:text-primary transition-colors">
              Courses
            </Link>
            <Link href="/contact" className="block hover:text-primary transition-colors">
              Contact
            </Link>
            <div className="pt-4 space-y-3">
              <GlobalSearch />
              <Link href="/admin/login">
                <Button className="w-full">Admin Login</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}