import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ThumbsUp, Pin, Search, Send, Loader2, CheckCircle, Star } from "lucide-react";

interface Thread {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  is_answered: boolean;
  upvotes_count: number;
  reply_count: number;
  profiles: {
    full_name: string;
    email: string;
    user_roles?: Array<{
      role: string;
    }>;
  };
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  is_instructor_answer: boolean;
  is_helpful: boolean;
  profiles: {
    full_name: string;
    email: string;
    user_roles?: Array<{
      role: string;
    }>;
  };
}

export default function CourseForumPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [threadForm, setThreadForm] = useState({
    title: "",
    content: ""
  });

  const courseIdStr = typeof courseId === 'string' ? courseId : Array.isArray(courseId) ? courseId[0] : '';

  useEffect(() => {
    if (courseIdStr) {
      checkAuth();
    }
  }, [courseIdStr]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
    loadThreads();
  };

  const loadThreads = async () => {
    if (!courseIdStr) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("discussion_threads")
        .select(`
          *,
          profiles (
            full_name, 
            email,
            user_roles (role)
          )
        `)
        .eq("course_template_id", courseIdStr)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get reply counts for each thread
      const threadsWithCounts = await Promise.all(
        (data || []).map(async (thread) => {
          const { count } = await supabase
            .from("discussion_replies")
            .select("*", { count: 'exact', head: true })
            .eq("thread_id", thread.id);

          return {
            ...thread,
            reply_count: count || 0
          } as Thread;
        })
      );

      setThreads(threadsWithCounts);
    } catch (err: any) {
      console.error("Error loading threads:", err);
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from("discussion_replies")
        .select(`
          *,
          profiles (
            full_name, 
            email,
            user_roles (role)
          )
        `)
        .eq("thread_id", threadId)
        .order("is_instructor_answer", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setReplies(data as unknown as Reply[] || []);
    } catch (err: any) {
      console.error("Error loading replies:", err);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseIdStr) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("discussion_threads")
        .insert({
          course_template_id: courseIdStr,
          author_id: session.user.id,
          title: threadForm.title,
          content: threadForm.content
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discussion thread created"
      });

      setThreadForm({ title: "", content: "" });
      setNewThreadOpen(false);
      loadThreads();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create thread",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Check if user is instructor
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      const isInstructor = roleData?.role === 'trainer' || roleData?.role === 'admin' || roleData?.role === 'super_admin';

      const { error } = await supabase
        .from("discussion_replies")
        .insert({
          thread_id: selectedThread.id,
          author_id: session.user.id,
          content: replyContent,
          is_instructor_answer: isInstructor
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply posted"
      });

      setReplyContent("");
      loadReplies(selectedThread.id);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to post reply",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (threadId: string) => {
    try {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;

      const { error } = await supabase
        .from("discussion_threads")
        .update({ upvotes_count: thread.upvotes_count + 1 })
        .eq("id", threadId);

      if (error) throw error;
      loadThreads();
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to upvote",
        variant: "destructive"
      });
    }
  };

  const handleMarkHelpful = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from("discussion_replies")
        .update({ is_helpful: true })
        .eq("id", replyId);

      if (error) throw error;
      if (selectedThread) {
        loadReplies(selectedThread.id);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to mark as helpful",
        variant: "destructive"
      });
    }
  };

  const handleResolve = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from("discussion_threads")
        .update({ is_answered: true })
        .eq("id", threadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thread marked as resolved"
      });

      loadThreads();
      setSelectedThread(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to resolve thread",
        variant: "destructive"
      });
    }
  };

  const filteredThreads = threads.filter(thread => {
    const searchLower = searchQuery.toLowerCase();
    return (
      thread.title.toLowerCase().includes(searchLower) ||
      thread.content.toLowerCase().includes(searchLower) ||
      thread.profiles?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const getUserInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const getUserRole = (roles?: Array<{ role: string }>) => {
    if (!roles || roles.length === 0) return null;
    const role = roles[0].role;
    if (role === 'trainer' || role === 'admin' || role === 'super_admin') {
      return 'Instructor';
    }
    return null;
  };

  return (
    <>
      <SEO
        title="Course Discussion Forum"
        description="Ask questions and discuss course topics"
      />
      <Navigation />
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Course Discussion</h1>
              <p className="text-muted-foreground">
                Ask questions, share insights, and collaborate with peers
              </p>
            </div>

            <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start a Discussion</DialogTitle>
                  <DialogDescription>
                    Ask a question or start a conversation
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateThread} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="What's your question?"
                      value={threadForm.title}
                      onChange={(e) => setThreadForm({ ...threadForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Description</Label>
                    <Textarea
                      id="content"
                      placeholder="Provide more details..."
                      rows={6}
                      value={threadForm.content}
                      onChange={(e) => setThreadForm({ ...threadForm, content: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setNewThreadOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Post Discussion
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Threads List */}
            <div className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading discussions...</p>
                  </CardContent>
                </Card>
              ) : filteredThreads.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery ? "Try adjusting your search" : "Start the conversation by creating a new discussion"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredThreads.map((thread) => (
                  <Card
                    key={thread.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedThread?.id === thread.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedThread(thread);
                      loadReplies(thread.id);
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {getUserInitials(thread.profiles?.full_name, thread.profiles?.email)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{thread.title}</h3>
                                {thread.is_pinned && (
                                  <Pin className="h-4 w-4 text-primary" />
                                )}
                                {thread.is_answered && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {thread.profiles?.full_name || thread.profiles?.email}
                                {getUserRole(thread.profiles?.user_roles) && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {getUserRole(thread.profiles?.user_roles)}
                                  </Badge>
                                )}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm mb-3 line-clamp-2">{thread.content}</p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpvote(thread.id);
                              }}
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              {thread.upvotes_count}
                            </button>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {thread.reply_count}
                            </span>
                            <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Thread Detail & Replies */}
            <div className="lg:sticky lg:top-24 h-fit">
              {selectedThread ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{selectedThread.title}</CardTitle>
                        <CardDescription>
                          Posted by {selectedThread.profiles?.full_name || selectedThread.profiles?.email}
                          {getUserRole(selectedThread.profiles?.user_roles) && (
                            <Badge variant="secondary" className="ml-2">
                              {getUserRole(selectedThread.profiles?.user_roles)}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      {!selectedThread.is_answered && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(selectedThread.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-sm whitespace-pre-wrap">{selectedThread.content}</p>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-4">
                        {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                      </h4>

                      <div className="space-y-4 mb-6">
                        {replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {getUserInitials(reply.profiles?.full_name, reply.profiles?.email)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {reply.profiles?.full_name || reply.profiles?.email}
                                </span>
                                {getUserRole(reply.profiles?.user_roles) && (
                                  <Badge variant="secondary" className="text-xs">
                                    {getUserRole(reply.profiles?.user_roles)}
                                  </Badge>
                                )}
                                {reply.is_instructor_answer && (
                                  <Badge className="text-xs bg-green-600 text-white hover:bg-green-700">
                                    <Star className="h-3 w-3 mr-1" />
                                    Instructor Answer
                                  </Badge>
                                )}
                                {reply.is_helpful && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                    Helpful
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm whitespace-pre-wrap mb-2">{reply.content}</p>

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                                {!reply.is_helpful && (
                                  <button
                                    onClick={() => handleMarkHelpful(reply.id)}
                                    className="hover:text-green-600"
                                  >
                                    Mark as helpful
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleReply} className="space-y-3">
                        <Textarea
                          placeholder="Write a reply..."
                          rows={4}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          required
                        />
                        <div className="flex justify-end">
                          <Button type="submit" disabled={submitting}>
                            {submitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Post Reply
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a discussion</h3>
                    <p className="text-muted-foreground">
                      Click on a discussion thread to view details and replies
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}