import { useEffect } from "react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

export function KeyboardShortcuts() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K - Command Palette (handled by CommandPalette component)
      // Cmd/Ctrl + / - Show shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        toast({
          title: "Keyboard Shortcuts",
          description: (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Command Palette</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ K</kbd>
              </div>
              <div className="flex justify-between">
                <span>Dashboard</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ D</kbd>
              </div>
              <div className="flex justify-between">
                <span>Bookings</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ B</kbd>
              </div>
              <div className="flex justify-between">
                <span>Calendar</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ C</kbd>
              </div>
              <div className="flex justify-between">
                <span>Students</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ S</kbd>
              </div>
              <div className="flex justify-between">
                <span>Search</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ F</kbd>
              </div>
            </div>
          ),
        });
      }

      // Cmd/Ctrl + D - Dashboard
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        router.push("/admin");
      }

      // Cmd/Ctrl + B - Bookings
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        router.push("/admin/bookings");
      }

      // Cmd/Ctrl + Shift + C - Calendar
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        router.push("/admin/calendar");
      }

      // Cmd/Ctrl + Shift + S - Students
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "s") {
        e.preventDefault();
        router.push("/admin/students");
      }

      // Cmd/Ctrl + Shift + A - Analytics
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "a") {
        e.preventDefault();
        router.push("/admin/analytics");
      }

      // Cmd/Ctrl + Shift + P - Payments
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "p") {
        e.preventDefault();
        router.push("/admin/payments");
      }

      // Escape - Close modals/dialogs (handled by UI components)
      // Arrow keys - Navigate lists (handled by UI components)
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, toast]);

  return null;
}