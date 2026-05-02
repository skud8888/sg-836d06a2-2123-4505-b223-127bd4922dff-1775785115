import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { activityTimelineService } from "@/services/activityTimelineService";
import { 
  BookOpen, 
  Award, 
  MessageSquare, 
  FileText, 
  UserPlus,
  Calendar,
  Clock,
  Activity as ActivityIcon
} from "lucide-react";

interface Activity {
  id: string;
  user_id: string;
  action_type: string;
  action_description: string;
  description?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
  users?: {
    email?: string;
  };
  user_name?: string;
}

interface ActivityFeedProps {
  userId?: string;
  limit?: number;
}

export function ActivityFeed({ userId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const { activities: data } = userId
        ? await activityTimelineService.getUserTimeline(userId, limit)
        : await activityTimelineService.getRecentActivities(limit);
      
      // Ensure we map any potentially missing fields with safe fallbacks
      const mappedActivities = (data || []).map((activity: any) => ({
        ...activity,
        action_type: activity.action_type || 'activity',
        action_description: activity.action_description || activity.description || 'Activity recorded',
        user_name: activity.profiles?.full_name || activity.users?.email?.split('@')[0] || 'Unknown User'
      }));
      
      setActivities(mappedActivities as Activity[]);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case "course_enrollment":
      case "course_completion":
        return BookOpen;
      case "achievement_earned":
      case "certificate_issued":
        return Award;
      case "forum_post":
      case "forum_reply":
        return MessageSquare;
      case "document_upload":
        return FileText;
      case "user_signup":
        return UserPlus;
      case "class_booking":
      case "booking_created":
        return Calendar;
      default:
        return Clock;
    }
  };

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case "course_completion":
      case "achievement_earned":
      case "certificate_issued":
        return "text-green-500";
      case "course_enrollment":
      case "class_booking":
      case "booking_created":
        return "text-blue-500";
      case "forum_post":
      case "forum_reply":
        return "text-purple-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading activities...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const userName = activity.user_name || 'Unknown User';
            const actionType = activity.action_type || 'activity';
            const description = activity.action_description || 'Activity recorded';
            const Icon = getActivityIcon(actionType);
            const colorClass = getActivityColor(actionType);
            
            return (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <span className="text-sm font-medium">{userName}</span>
                    <Badge variant="outline" className="text-xs">
                      {actionType.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}