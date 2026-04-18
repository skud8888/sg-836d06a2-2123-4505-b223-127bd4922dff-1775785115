import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pushNotificationService } from "@/services/pushNotificationService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Check, X, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
  metadata?: any;
  read_at?: string;
  user_id?: string;
}

export function NotificationCenter() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);

  useEffect(() => {
    loadNotifications();
    checkPushSubscription();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setNotifications(data || []);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkPushSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isSubscribed = await pushNotificationService.getSubscriptionStatus(user.id);
      setPushEnabled(isSubscribed);
    } catch (err) {
      console.error("Error checking push subscription:", err);
    }
  };

  const handleTogglePush = async (enabled: boolean) => {
    if (!user) return;

    setCheckingPermission(true);
    try {
      if (enabled) {
        const { success, error } = await pushNotificationService.subscribe(user.id);
        if (success) {
          setPushEnabled(true);
          toast({
            title: "Push Notifications Enabled",
            description: "You'll receive real-time alerts",
          });
        } else {
          toast({
            title: "Permission Denied",
            description: error || "Please enable notifications in your browser settings",
            variant: "destructive",
          });
        }
      } else {
        await pushNotificationService.unsubscribe(user.id);
        setPushEnabled(false);
        toast({
          title: "Push Notifications Disabled",
          description: "You won't receive push alerts",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCheckingPermission(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );

    toast({
      title: "All notifications marked as read",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Stay updated with your activity</CardDescription>
          </div>
          {notifications.some((n) => !n.is_read) && (
            <Button size="sm" variant="ghost" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Push Notification Toggle */}
        {pushNotificationService.isSupported() && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              {pushEnabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="push-toggle" className="cursor-pointer">
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  {pushEnabled ? "Enabled - You'll receive alerts" : "Enable real-time alerts"}
                </p>
              </div>
            </div>
            <Switch
              id="push-toggle"
              checked={pushEnabled}
              onCheckedChange={handleTogglePush}
              disabled={checkingPermission}
            />
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border rounded-lg ${
                  notification.is_read ? "bg-background" : "bg-primary/5 border-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      {!notification.is_read && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}