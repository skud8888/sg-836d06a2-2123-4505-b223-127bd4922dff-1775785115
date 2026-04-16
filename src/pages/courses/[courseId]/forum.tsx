import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  MessageSquare,
  Plus,
  ThumbsUp,
  CheckCircle,
  Pin,
  Lock,
  Eye,
  ArrowLeft,
  Reply,
  Filter,
  Search
} from "lucide-react";

interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_answered: boolean;
  views_count: number;
  replies_count: number;
  upvotes_count: number;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Reply {
  id: string;
  content: string;
  is_instructor_answer: boolean;
  is_helpful: boolean;
  upvotes_count: number;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function CourseForumPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  
  const [newThread, setNewThread] = useState({
    title: "",
    content: "",
    category: "general"
  });
  
  const [newReply, setNewReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (courseId) {
      checkAccess();
      loadThreads();
    }
  }, [courseId]);

  const checkAccess = async () => {
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }

      // Get course name
      const { data: course } = await supabase
        .from("course_templates")
        .select("name")
        .eq("id", courseId as string)
        .single();

      if (course) {
        setCourseName(course.name);
      }

      // Check enrollment
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", currentUser.id)
        .eq("course_template_id", courseId as string)
        .single();

      setIsEnrolled(!!enrollment);

      // Allow access for enrolled students or admins/trainers
      const canAccess = !!enrollment || roleData?.role === "admin" || roleData?.role === "trainer" || roleData?.role === "super_admin";
      
      if (!canAccess) {
        toast({
          title: "Access Denied",
          description: "You must be enrolled in this course to access the forum",
          variant: "destructive"
        });
        router.push(`/courses`);
        return;
      }

    } catch (err: any) {
      console.error("Error checking access:", err);
      toast({
        title: "Error",
        description: "Failed to verify access",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadThreads = async () => {
    try {
      const { data, error } = await supabase
        .from("discussion_threads")
        .select(`
          *,
          author:profiles!discussion_threads_author_id_fkey(id, full_name, email)
        `)
        .eq("course_template_id", courseId as string)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setThreads((data as any) || []);
    } catch (err: any) {
      console.error("Error loading threads:", err);
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive"
      });
    }
  };

  const loadReplies = async (threadId: string) => {
    setLoadingReplies(true);
    try {
      const { data, error } = await supabase
        .from("discussion_replies")
        .select(`
          *,
          author:profiles!discussion_replies_author_id_fkey(id, full_name, email)
        `)
        .eq("thread_id", threadId)
        .is("parent_reply_id", null)
        .order("is_instructor_answer", { ascending: false })
        .order("is_helpful", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      setReplies((data as any) || []);

      // Increment view count
      await supabase.rpc("increment_thread_views", { thread_id: threadId });
    } catch (err: any) {
      console.error("Error loading replies:", err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleCreateThread = async () => {
    if (!newThread.title || !newThread.content) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("discussion_threads")
        .insert({
          course_template_id: courseId as string,
          author_id: user.id,
          title: newThread.title,
          content: newThread.content,
          category: newThread.category
        });

      if (error) throw error;

      toast({
        title: "Thread created",
        description: "Your discussion thread has been posted"
      });

      setCreateDialogOpen(false);
      setNewThread({ title: "", content: "", category: "general" });
      loadThreads();
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to create thread",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!newReply || !selectedThread) return;

    setSubmitting(true);
    try {
      const isInstructor = userRole === "trainer" || userRole === "admin" || userRole === "super_admin";

      const { error } = await supabase
        .from("discussion_replies")
        .insert({
          thread_id: selectedThread.id,
          author_id: user.id,
          content: newReply,
          is_instructor_answer: isInstructor
        });

      if (error) throw error;

      toast({
        title: "Reply posted",
        description: "Your reply has been added"
      });

      setNewReply("");
      setReplyDialogOpen(false);
      loadReplies(selectedThread.id);
      loadThreads(); // Refresh to update reply count
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (threadId: string) => {
    // Simplified upvote - would need user_thread_votes table for proper implementation
    toast({
      title: "Feature coming soon",
      description: "Upvoting will be available in the next update"
    });
  };

  const handleViewThread = (thread: Thread) => {
    setSelectedThread(thread);
    loadReplies(thread.id);
  };

  const filteredThreads = threads.filter(thread => {
    if (categoryFilter !== "all" && thread.category !== categoryFilter) return false;
    if (searchQuery && !thread.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "popular") return b.replies_count - a.replies_count;
    if (sortBy === "unanswered") return (a.is_answered ? 1 : 0) - (b.is_answered ? 1 : 0);
    return 0;
  });

  if (loading) {
    return (
      <>
        <SEO title="Loading..." />
        <Navigation />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title={`${courseName} - Discussion Forum`}
        description={`Course discussion and Q&A for ${courseName}`}
      />
      
      <Navigation />

      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/courses`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </Link>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{courseName}</h1>
                <p className="text-muted-foreground">Course Discussion Forum</p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Thread
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="question">Questions</SelectItem>
                <SelectItem value="announcement">Announcements</SelectItem>
                <SelectItem value="discussion">Discussions</SelectItem>
                <SelectItem value="resource">Resources</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="unanswered">Unanswered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Thread List */}
          <div className="space-y-4">
            {sortedThreads.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to start a discussion in this course
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start a Discussion
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sortedThreads.map((thread) => (
                <Card 
                  key={thread.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewThread(thread)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {thread.is_pinned && (
                            <Pin className="h-4 w-4 text-primary" />
                          )}
                          {thread.is_locked && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Badge variant={thread.is_answered ? "default" : "secondary"}>
                            {thread.category}
                          </Badge>
                          {thread.is_answered && (
                            <Badge className="bg-green-600">Answered</Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl mb-2">{thread.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {thread.content}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{thread.replies_count} replies</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{thread.views_count} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{thread.upvotes_count}</span>
                      </div>
                      <div className="ml-auto">
                        By {thread.author.full_name || thread.author.email}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Thread Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start a New Discussion</DialogTitle>
            <DialogDescription>
              Ask a question or start a conversation with other students
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="What's your question or topic?"
                value={newThread.title}
                onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={newThread.category}
                onValueChange={(value) => setNewThread({ ...newThread, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Provide details about your question or topic..."
                rows={8}
                value={newThread.content}
                onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateThread}
                disabled={submitting || !newThread.title || !newThread.content}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Thread"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thread View Dialog */}
      <Dialog 
        open={!!selectedThread} 
        onOpenChange={(open) => !open && setSelectedThread(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedThread && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {selectedThread.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                  {selectedThread.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                  <Badge>{selectedThread.category}</Badge>
                  {selectedThread.is_answered && (
                    <Badge className="bg-green-600">Answered</Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl">{selectedThread.title}</DialogTitle>
                <DialogDescription>
                  Posted by {selectedThread.author.full_name || selectedThread.author.email} • {new Date(selectedThread.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{selectedThread.content}</p>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                      {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
                    </h3>
                    <Button 
                      onClick={() => setReplyDialogOpen(true)}
                      disabled={selectedThread.is_locked}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </div>

                  {loadingReplies ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : replies.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No replies yet. Be the first to respond!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {replies.map((reply) => (
                        <div 
                          key={reply.id}
                          className={`border rounded-lg p-4 ${
                            reply.is_instructor_answer ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">
                                  {reply.author.full_name || reply.author.email}
                                </span>
                                {reply.is_instructor_answer && (
                                  <Badge className="bg-primary">Instructor</Badge>
                                )}
                                {reply.is_helpful && (
                                  <Badge className="bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Helpful
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(reply.created_at).toLocaleDateString()} at {new Date(reply.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpvote(reply.id);
                                }}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                {reply.upvotes_count}
                              </Button>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Input - Inline */}
              {replyDialogOpen && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4">Write a Reply</h3>
                  <Textarea
                    placeholder="Share your thoughts or answer..."
                    rows={6}
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    className="mb-4"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setReplyDialogOpen(false);
                        setNewReply("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleReply}
                      disabled={submitting || !newReply}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post Reply"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}