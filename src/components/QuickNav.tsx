import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  BookOpen,
  CreditCard,
  BarChart3,
  MessageSquare,
  Award,
  ClipboardList,
  UserPlus,
  Bell
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface QuickNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

interface QuickNavProps {
  role: 'admin' | 'trainer' | 'student';
}

const adminLinks: QuickNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, description: "Overview & stats" },
  { label: "Calendar", href: "/admin/calendar", icon: Calendar, description: "Schedule classes" },
  { label: "Bookings", href: "/admin/bookings", icon: ClipboardList, description: "Manage bookings" },
  { label: "Students", href: "/admin/students", icon: Users, description: "Student records" },
  { label: "Courses", href: "/admin/courses", icon: BookOpen, description: "Course templates" },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, description: "Payment tracking" },
  { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare, description: "Contact requests" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, description: "Reports & insights" },
  { label: "Settings", href: "/admin/settings", icon: Settings, description: "System config" },
];

const trainerLinks: QuickNavItem[] = [
  { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard, description: "Your overview" },
  { label: "My Classes", href: "/trainer", icon: Calendar, description: "Upcoming sessions" },
  { label: "Students", href: "/trainer/students", icon: Users, description: "Your students" },
];

const studentLinks: QuickNavItem[] = [
  { label: "Portal", href: "/student/portal", icon: LayoutDashboard, description: "Your dashboard" },
  { label: "Courses", href: "/courses", icon: BookOpen, description: "Browse courses" },
  { label: "Certificates", href: "/student/certificates", icon: Award, description: "Your certificates" },
  { label: "Profile", href: "/student/profile", icon: Users, description: "Account settings" },
];

export function QuickNav({ role }: QuickNavProps) {
  const links = role === 'admin' ? adminLinks : role === 'trainer' ? trainerLinks : studentLinks;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm mb-1">{link.label}</h3>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}