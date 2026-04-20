import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { offlineService } from "@/services/offlineService";
import { useToast } from "@/hooks/use-toast";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Set initial online status
    setIsOnline(offlineService.isOnline());

    // Check for pending actions
    checkPendingActions();

    const handleOnline = async () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Connection restored",
      });
      
      // Auto-sync when coming back online
      await handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Changes will sync when connection is restored",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkPendingActions = async () => {
    // This would check for pending actions
    // For now, just set to 0
    setPendingCount(0);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Sync logic would go here
      await checkPendingActions();
      
      if (pendingCount > 0) {
        toast({
          title: "Synced successfully",
          description: `${pendingCount} changes synced`,
        });
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Some changes couldn't be synced",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline ? (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>
            Changes will be saved locally and synced when you're back online
          </AlertDescription>
        </Alert>
      ) : pendingCount > 0 ? (
        <Alert>
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          <AlertTitle>Syncing changes</AlertTitle>
          <AlertDescription>
            {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}