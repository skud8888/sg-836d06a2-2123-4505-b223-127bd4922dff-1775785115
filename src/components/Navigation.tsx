import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">GTS Training</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/courses" className="hover:text-primary transition-colors">
              Courses
            </Link>
            <Link href="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/features" className="hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
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
          <div className="md:hidden py-4 space-y-4 border-t mt-4">
            <Link href="/courses" className="block hover:text-primary transition-colors">
              Courses
            </Link>
            <Link href="/about" className="block hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/features" className="block hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="block hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="block hover:text-primary transition-colors">
              Contact
            </Link>
            <div className="pt-4 space-y-3 flex items-center gap-3">
              <ThemeSwitch />
              <Link href="/admin/login" className="flex-1">
                <Button className="w-full">Admin Login</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}