import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { rbacService } from "@/services/rbacService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Bug,
  Lightbulb,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter
} from "lucide-react";
import { format } from "date-fns";

interface Feedback {
  id: string;
  user_email: string;
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export default function FeedbackManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/admin/login");
      return;
    }

    const role = await rbacService.getUserPrimaryRole();
    if (!role || (role !== "super_admin" && role !== "admin")) {
      router.push("/admin");
      return;
    }

    loadFeedback();
  };

  const loadFeedback = async () => {
    setLoading(true);

    let query = (supabase as any)
      .from("user_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    if (filterCategory !== "all") {
      query = query.eq("category", filterCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive"
      });
    } else {
      setFeedback(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) {
      loadFeedback();
    }
  }, [filterStatus, filterCategory]);

  const updateFeedbackStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any)
      .from("user_feedback")
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        resolved_at: status === "resolved" ? new Date().toISOString() : null
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update feedback status",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Status updated",
        description: `Feedback marked as ${status}`
      });
      loadFeedback();
      if (selectedFeedback?.id === id) {
        setSelectedFeedback({ ...selectedFeedback, status });
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bug":
        return <Bug className="h-4 w-4" />;
      case "feature":
        return <Lightbulb className="h-4 w-4" />;
      case "feedback":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-600">New</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-600">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-600">Resolved</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-600">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-600">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const stats = {
    total: feedback.length,
    new: feedback.filter(f => f.status === "new").length,
    inProgress: feedback.filter(f => f.status === "in_progress").length,
    resolved: feedback.filter(f => f.status === "resolved").length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">User Feedback</h1>
          <p className="text-muted-foreground">Manage user feedback, bug reports, and feature requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
              <p className="text-sm text-muted-foreground">New</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="bug">Bug Reports</SelectItem>
                  <SelectItem value="feature">Feature Requests</SelectItem>
                  <SelectItem value="feedback">General Feedback</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No feedback found</p>
              </CardContent>
            </Card>
          ) : (
            feedback.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedFeedback(item)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{item.subject}</CardTitle>
                        <CardDescription className="mt-1">
                          From: {item.user_email} • {format(new Date(item.created_at), "PPp")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(item.status)}
                      {getPriorityBadge(item.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.message}
                  </p>
                  {item.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Feedback Detail Modal */}
        <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedFeedback && getCategoryIcon(selectedFeedback.category)}
                {selectedFeedback?.subject}
              </DialogTitle>
              <DialogDescription>
                Submitted by {selectedFeedback?.user_email} on{" "}
                {selectedFeedback && format(new Date(selectedFeedback.created_at), "PPP")}
              </DialogDescription>
            </DialogHeader>
            {selectedFeedback && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {getStatusBadge(selectedFeedback.status)}
                  {getPriorityBadge(selectedFeedback.priority)}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Message</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </p>
                </div>

                {selectedFeedback.rating && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Rating</h4>
                    <div className="flex gap-1">
                      {Array.from({ length: selectedFeedback.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Update Status</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={selectedFeedback.status === "new" ? "default" : "outline"}
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, "new")}
                    >
                      New
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFeedback.status === "in_progress" ? "default" : "outline"}
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, "in_progress")}
                    >
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFeedback.status === "resolved" ? "default" : "outline"}
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, "resolved")}
                    >
                      Resolved
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFeedback.status === "closed" ? "default" : "outline"}
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, "closed")}
                    >
                      Closed
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}