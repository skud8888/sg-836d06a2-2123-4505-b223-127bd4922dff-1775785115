import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Heart, Trash2, Calendar, Clock, DollarSign } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CourseTemplate = Tables<"course_templates">;
type WishlistItem = Tables<"wishlist"> & {
  course_templates: CourseTemplate;
};

export default function Wishlist() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/student/portal");
        return;
      }

      await loadWishlist(session.user.id);
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: "Failed to load wishlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function loadWishlist(userId: string) {
    try {
      const { data, error } = await supabase
        .from("wishlist" as any)
        .select(`
          *,
          course_templates (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWishlist(data || []);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to load wishlist items",
        variant: "destructive",
      });
    }
  }

  async function removeFromWishlist(itemId: string) {
    try {
      const { error } = await supabase
        .from("wishlist" as any)
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setWishlist(wishlist.filter(item => item.id !== itemId));
      
      toast({
        title: "Removed from wishlist",
        description: "Course has been removed from your wishlist",
      });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive",
      });
    }
  }

  async function enrollInCourse(courseId: string) {
    try {
      // Navigate to enrollment page
      router.push(`/enroll/${courseId}`);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast({
        title: "Error",
        description: "Failed to start enrollment process",
        variant: "destructive",
      });
    }
  }
}