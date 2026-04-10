import { supabase } from "@/integrations/supabase/client";

export type SearchResult = {
  result_type: "booking" | "enquiry" | "document" | "course";
  result_id: string;
  title: string;
  subtitle: string;
  metadata: any;
  relevance: number;
};

/**
 * Search Service - Universal search across all entities
 */
export const searchService = {
  /**
   * Universal search across bookings, enquiries, documents, and courses
   */
  async search(query: string, limit = 20): Promise<SearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const { data, error } = await supabase.rpc("universal_search", {
        p_query: query,
        p_limit: limit
      });

      if (error) {
        console.error("Search error:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Search service error:", error);
      return [];
    }
  },

  /**
   * Search bookings only
   */
  async searchBookings(query: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        scheduled_classes(
          start_datetime,
          course_templates(name, code)
        )
      `)
      .or(
        `student_name.ilike.%${query}%,student_email.ilike.%${query}%,student_phone.ilike.%${query}%,usi_number.ilike.%${query}%`
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Search bookings error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Search enquiries only
   */
  async searchEnquiries(query: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .or(
        `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,message.ilike.%${query}%`
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Search enquiries error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Search documents only
   */
  async searchDocuments(query: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("is_latest_version", true)
      .is("deleted_at", null)
      .or(`file_name.ilike.%${query}%,notes.ilike.%${query}%`)
      .order("uploaded_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Search documents error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Search courses only
   */
  async searchCourses(query: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("course_templates")
      .select("*")
      .or(
        `name.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%`
      )
      .order("name", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Search courses error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get recent searches for user (if we add this feature)
   */
  async getRecentSearches(): Promise<string[]> {
    // Could store in local storage or user preferences
    const recent = localStorage.getItem("recent_searches");
    return recent ? JSON.parse(recent) : [];
  },

  /**
   * Save search to recent history
   */
  saveRecentSearch(query: string): void {
    const recent = this.getRecentSearches();
    const updated = [query, ...recent.filter(q => q !== query)].slice(0, 5);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
  }
};