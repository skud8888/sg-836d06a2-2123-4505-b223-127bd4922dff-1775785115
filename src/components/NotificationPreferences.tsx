import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare, Clock, Volume2, Monitor, Loader2, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type NotificationPreferences = {
  email_new_booking: boolean;
  email_booking_cancelled: boolean;
  email_payment_received: boolean;
  email_payment_failed: boolean;
  email_new_enquiry: boolean;
  email_course_reminder: boolean;
  email_attendance_marked: boolean;
  email_document_uploaded: boolean;
  sms_new_booking: boolean;
  sms_booking_cancelled: boolean;
  sms_payment_received: boolean;
  sms_course_reminder: boolean;
  daily_digest: boolean;
  weekly_digest: boolean;
  digest_time: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notification_sound: boolean;
  desktop_notifications: boolean;
};

export function NotificationPreferences() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error loading preferences:", error);
    } else if (data) {
      setPreferences(data as NotificationPreferences);
    }
    setLoading(false);
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from("notification_preferences")
      .update(preferences)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Preferences saved",
        description: "Your notification settings have been updated"
      });
    }
    setSaving(false);
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load notification preferences
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose which events trigger email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email_new_booking">New booking created</Label>
            <Switch
              id="email_new_booking"
              checked={preferences.email_new_booking}
              onCheckedChange={(checked) => updatePreference("email_new_booking", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email_booking_cancelled">Booking cancelled</Label>
            <Switch
              id="email_booking_cancelled"
              checked={preferences.email_booking_cancelled}
              onCheckedChange={(checked) => updatePreference("email_booking_cancelled", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email_payment_received">Payment received</Label>
            <Switch
              id="email_payment_received"
              checked={preferences.email_payment_received}
              onCheckedChange={(checked) => updatePreference("email_payment_received", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email_payment_failed">Payment failed</Label>
            <Switch
              id="email_payment_failed"
              checked={preferences.email_payment_failed}
              onCheckedChange={(checked) => updatePreference("email_payment_failed", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email_new_enquiry">New enquiry submitted</Label>
            <Switch
              id="email_new_enquiry"
              checked={preferences.email_new_enquiry}
              onCheckedChange={(checked) => updatePreference("email_new_enquiry", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email_course_reminder">Course reminders</Label>
            <Switch
              id="email_course_reminder"
              checked={preferences.email_course_reminder}
              onCheckedChange={(checked) => updatePreference("email_course_reminder", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email_attendance_marked">Attendance marked</Label>
            <Switch
              id="email_attendance_marked"
              checked={preferences.email_attendance_marked}
              onCheckedChange={(checked) => updatePreference("email_attendance_marked", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email_document_uploaded">Document uploaded</Label>
            <Switch
              id="email_document_uploaded"
              checked={preferences.email_document_uploaded}
              onCheckedChange={(checked) => updatePreference("email_document_uploaded", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>SMS Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive urgent notifications via SMS (requires phone number)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sms_new_booking">New booking created</Label>
            <Switch
              id="sms_new_booking"
              checked={preferences.sms_new_booking}
              onCheckedChange={(checked) => updatePreference("sms_new_booking", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms_booking_cancelled">Booking cancelled</Label>
            <Switch
              id="sms_booking_cancelled"
              checked={preferences.sms_booking_cancelled}
              onCheckedChange={(checked) => updatePreference("sms_booking_cancelled", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms_payment_received">Payment received</Label>
            <Switch
              id="sms_payment_received"
              checked={preferences.sms_payment_received}
              onCheckedChange={(checked) => updatePreference("sms_payment_received", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms_course_reminder">Course reminders</Label>
            <Switch
              id="sms_course_reminder"
              checked={preferences.sms_course_reminder}
              onCheckedChange={(checked) => updatePreference("sms_course_reminder", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Digest Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Digest Settings</CardTitle>
          </div>
          <CardDescription>
            Receive summary emails instead of individual notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily_digest">Daily digest</Label>
            <Switch
              id="daily_digest"
              checked={preferences.daily_digest}
              onCheckedChange={(checked) => updatePreference("daily_digest", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly_digest">Weekly digest</Label>
            <Switch
              id="weekly_digest"
              checked={preferences.weekly_digest}
              onCheckedChange={(checked) => updatePreference("weekly_digest", checked)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="digest_time">Digest delivery time</Label>
            <Select
              value={preferences.digest_time}
              onValueChange={(value) => updatePreference("digest_time", value)}
            >
              <SelectTrigger id="digest_time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="06:00:00">6:00 AM</SelectItem>
                <SelectItem value="07:00:00">7:00 AM</SelectItem>
                <SelectItem value="08:00:00">8:00 AM</SelectItem>
                <SelectItem value="09:00:00">9:00 AM</SelectItem>
                <SelectItem value="10:00:00">10:00 AM</SelectItem>
                <SelectItem value="12:00:00">12:00 PM</SelectItem>
                <SelectItem value="17:00:00">5:00 PM</SelectItem>
                <SelectItem value="18:00:00">6:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Quiet Hours</CardTitle>
          </div>
          <CardDescription>
            Pause notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet_hours_enabled">Enable quiet hours</Label>
            <Switch
              id="quiet_hours_enabled"
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => updatePreference("quiet_hours_enabled", checked)}
            />
          </div>
          {preferences.quiet_hours_enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_start">Start time</Label>
                  <Select
                    value={preferences.quiet_hours_start}
                    onValueChange={(value) => updatePreference("quiet_hours_start", value)}
                  >
                    <SelectTrigger id="quiet_hours_start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={`${String(i).padStart(2, "0")}:00:00`}>
                          {`${String(i).padStart(2, "0")}:00`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_end">End time</Label>
                  <Select
                    value={preferences.quiet_hours_end}
                    onValueChange={(value) => updatePreference("quiet_hours_end", value)}
                  >
                    <SelectTrigger id="quiet_hours_end">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={`${String(i).padStart(2, "0")}:00:00`}>
                          {`${String(i).padStart(2, "0")}:00`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Other Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <CardTitle>Other Settings</CardTitle>
          </div>
          <CardDescription>
            Additional notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notification_sound">Notification sounds</Label>
            </div>
            <Switch
              id="notification_sound"
              checked={preferences.notification_sound}
              onCheckedChange={(checked) => updatePreference("notification_sound", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="desktop_notifications">Desktop notifications</Label>
            </div>
            <Switch
              id="desktop_notifications"
              checked={preferences.desktop_notifications}
              onCheckedChange={(checked) => updatePreference("desktop_notifications", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}