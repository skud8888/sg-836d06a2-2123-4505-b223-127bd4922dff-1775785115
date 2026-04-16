import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Heart,
  Clock,
  Users,
  DollarSign,
  ArrowRight,
  Trash2,
  FileText,
  BookOpen
} from "lucide-react";

interface WishlistItem {
  id: string;
  added_at: string;
  notes: string | null;
  course_templates: {
    id: string;
    name: string;
    description: string;
    duration_hours: number;
    price_full: number;
    price_deposit: number;
    max_students: number;
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }

    setUser(session.user);
    loadWishlist(session.user.id);
  };

  const loadWishlist = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_wishlist")
        .select(`
          *,
          course_templates (
            id,
            name,
            description,
            duration_hours,
            price_full,
            price_deposit,
            max_students
          )
        `)
        .eq("student_id", userId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      setWishlist((data as any) || []);
    } catch (err: any) {
      console.error("Error loading wishlist:", err);
      toast({
        title: "Error",
        description: "Failed to load wishlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from("course_wishlist")
        .delete()
        .eq("id", wishlistId);

      if (error) throw error;

      setWishlist(prev => prev.filter(item => item.id !== wishlistId));
      toast({
        title: "Removed",
        description: "Course removed from wishlist"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist",
        variant: "destructive"
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from("course_wishlist")
        .update({ notes })
        .eq("id", selectedItem.id);

      if (error) throw error;

      setWishlist(prev =>
        prev.map(item =>
          item.id === selectedItem.id ? { ...item, notes } : item
        )
      );

      toast({
        title: "Notes saved",
        description: "Your notes have been updated"
      });

      setNotesDialogOpen(false);
      setSelectedItem(null);
      setNotes("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    }
  };

  const handleEditNotes = (item: WishlistItem) => {
    setSelectedItem(item);
    setNotes(item.notes || "");
    setNotesDialogOpen(true);
  };

  return (
    <>
      <SEO
        title="My Wishlist - The Training Hub"
        description="View your saved courses"
      />
      <Navigation />

      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
                <p className="text-muted-foreground">
                  Courses you&apos;re interested in
                </p>
              </div>
              <Link href="/courses">
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : wishlist.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-12 pb-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
                <p className="text-muted-foreground mb-6">
                  Start adding courses you&apos;re interested in
                </p>
                <Link href="/courses">
                  <Button>
                    Browse Courses
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl">
                        {item.course_templates.name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFromWishlist(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {item.course_templates.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{item.course_templates.duration_hours} hours</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Max {item.course_templates.max_students} students</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-lg">
                          ${item.course_templates.price_full}
                        </span>
                        {item.course_templates.price_deposit > 0 && (
                          <span className="text-sm text-muted-foreground">
                            or ${item.course_templates.price_deposit} deposit
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Added {new Date(item.added_at).toLocaleDateString()}
                      </div>
                    </div>

                    {item.notes && (
                      <div className="bg-muted/50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          <strong>Notes:</strong> {item.notes}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button className="w-full" asChild>
                        <Link href={`/enroll/${item.course_templates.id}`}>
                          Enroll Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleEditNotes(item)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {item.notes ? "Edit Notes" : "Add Notes"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Course Notes</DialogTitle>
            <DialogDescription>
              Add personal notes about why you&apos;re interested in this course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., Need this for career advancement, recommended by colleague..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveNotes} className="flex-1">
                Save Notes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setNotesDialogOpen(false);
                  setSelectedItem(null);
                  setNotes("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}