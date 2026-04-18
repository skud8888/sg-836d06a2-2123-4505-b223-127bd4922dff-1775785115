import { supabase } from "@/integrations/supabase/client";

export const pushNotificationService = {
  /**
   * Check if browser supports push notifications
   */
  isSupported(): boolean {
    return "serviceWorker" in navigator && "PushManager" in window;
  },

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error("Push notifications not supported");
    }

    return await Notification.requestPermission();
  },

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        return { success: false, error: "Permission denied" };
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
        ),
      });

      const subscriptionJSON = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: userId,
        endpoint: subscriptionJSON.endpoint || "",
        p256dh: subscriptionJSON.keys?.p256dh || "",
        auth: subscriptionJSON.keys?.auth || "",
        user_agent: navigator.userAgent,
        is_active: true,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error("Push subscription error:", error);
      return { success: false, error };
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId);
    } catch (error) {
      console.error("Push unsubscribe error:", error);
    }
  },

  /**
   * Queue a notification
   */
  async queueNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
    url?: string
  ): Promise<void> {
    await supabase.from("notification_queue").insert({
      user_id: userId,
      title,
      body,
      data,
      url,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      status: "pending",
    });
  },

  /**
   * Get notification subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    return !!data;
  },

  /**
   * Convert VAPID key
   */
  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
};