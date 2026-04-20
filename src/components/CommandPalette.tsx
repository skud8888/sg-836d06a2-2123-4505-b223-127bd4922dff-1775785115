import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar, GraduationCap, LayoutDashboard, Settings, User, BookOpen } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/admin"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Admin Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/student/portal"))}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Student Portal
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/courses"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Courses
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/calendar"))}>
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/profile"))}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}