import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-50 px-4">
      <div className="container mx-auto max-w-2xl">
        <Alert className={isOnline ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-600" />
            )}
            <AlertDescription className={isOnline ? "text-green-800" : "text-amber-800"}>
              {isOnline ? (
                <strong>Back online!</strong>
              ) : (
                <>
                  <strong>You're offline.</strong> Some features may be limited. Changes will sync when you reconnect.
                </>
              )}
            </AlertDescription>
          </div>
        </Alert>
      </div>
    </div>
  );
}