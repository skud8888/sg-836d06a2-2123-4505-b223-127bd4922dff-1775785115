import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { activityTimelineService } from "@/services/activityTimelineService";
import { 
  BookOpen, 
  Award, 
  MessageSquare, 
  FileText, 
  UserPlus,
  Calendar,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  user_id: string;
  action_type: string;
  action_description: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

interface ActivityFeedProps {
  userId?: string;
  limit?: number;
}

export function ActivityFeed({ userId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [userId, limit]);

  const loadActivities = async () => {
    try {
      const { activities: data } = userId
        ? await activityTimelineService.getUserTimeline(userId, limit)
        : await activityTimelineService.getRecentActivities(limit);
      
      setActivities(data);
    } catch (error) {
      console.error("Error loading activities:", error);
    }
    setLoading(false);
  };

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
            const Icon = getActivityIcon(activity.action_type);
            const colorClass = getActivityColor(activity.action_type);
            const userName = activity.profiles?.full_name || activity.profiles?.email || "User";
            const initials = userName.substring(0, 2).toUpperCase();

            return (
              <div key={activity.id} className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <span className="text-sm font-medium">{userName}</span>
                    <Badge variant="outline" className="text-xs">
                      {activity.action_type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.action_description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}