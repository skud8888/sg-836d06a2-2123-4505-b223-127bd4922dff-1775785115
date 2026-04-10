import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { 
  Activity, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  FileText, 
  User, 
  BookOpen,
  RefreshCw,
  Filter
} from "lucide-react";

type ActivityEvent = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: any;
  created_at: string;
  user_email: string | null;
  event_type: string;
  event_icon: string;
};

export function ActivityFeed({ limit = 20 }: { limit?: number }) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadActivities();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audit_logs"
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [filter, limit]);

  const loadActivities = async () => {
    setLoading(true);

    let query = (supabase as any)
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filter !== "all") {
      query = query.eq("resource_type", filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading activities:", error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  const getEventDescription = (event: ActivityEvent) => {
    const user = event.user_email || "System";
    const action = event.action;
    const resource = event.resource_type;

    switch (event.event_type) {
      case "booking_created":
        return `${user} created a new booking`;
      case "booking_updated":
        return `${user} updated a booking`;
      case "booking_cancelled":
        return `${user} cancelled a booking`;
      case "payment_received":
        return `Payment received for booking`;
      case "enquiry_submitted":
        return `New enquiry from ${event.metadata?.email || "a visitor"}`;
      case "document_uploaded":
        return `${user} uploaded a document`;
      case "student_updated":
        return `${user} updated student information`;
      case "course_created":
        return `${user} created a new course`;
      default:
        return `${user} performed ${action} on ${resource}`;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "booking_created":
      case "booking_updated":
      case "booking_cancelled":
        return <Calendar className="h-4 w-4" />;
      case "payment_received":
        return <DollarSign className="h-4 w-4" />;
      case "enquiry_submitted":
        return <MessageSquare className="h-4 w-4" />;
      case "document_uploaded":
        return <FileText className="h-4 w-4" />;
      case "student_updated":
        return <User className="h-4 w-4" />;
      case "course_created":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "booking_created":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "booking_cancelled":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      case "payment_received":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "enquiry_submitted":
        return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30";
      case "document_uploaded":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Feed
            </CardTitle>
            <CardDescription>Recent system events and actions</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={loadActivities}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="booking">Bookings</TabsTrigger>
            <TabsTrigger value="payment">Payments</TabsTrigger>
            <TabsTrigger value="enquiry">Enquiries</TabsTrigger>
          </TabsList>
          <TabsContent value={filter} className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Loading activities...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className={`p-2 rounded-lg ${getEventColor(event.event_type)}`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {getEventDescription(event)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </p>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(event.metadata).slice(0, 2).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {String(value).substring(0, 20)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}