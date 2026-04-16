import { supabase } from "@/integrations/supabase/client";

export const recommendationService = {
  /**
   * Generate course recommendations for a student
   */
  async generateRecommendations(studentId: string) {
    const { error } = await supabase.rpc("generate_course_recommendations", {
      p_student_id: studentId
    });

    if (error) throw error;
  },

  /**
   * Get personalized course recommendations
   */
  async getRecommendations(studentId: string) {
    const { data, error } = await supabase
      .from("course_recommendations")
      .select(`
        *,
        course_templates (
          id,
          name,
          description,
          duration_hours,
          price_full,
          price_deposit,
          is_featured
        )
      `)
      .eq("student_id", studentId)
      .order("recommendation_score", { ascending: false })
      .limit(6);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get similar courses based on enrollment patterns
   */
  async getSimilarCourses(courseId: string, studentId?: string) {
    // Get students who enrolled in this course
    const { data: enrolledStudents } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("course_template_id", courseId);

    if (!enrolledStudents || enrolledStudents.length === 0) return [];

    const studentIds = enrolledStudents.map(e => e.student_id);

    // Get other courses these students enrolled in
    const { data: similarCourses } = await supabase
      .from("enrollments")
      .select(`
        course_template_id,
        course_templates (
          id,
          name,
          description,
          duration_hours,
          price_full,
          is_featured
        )
      `)
      .in("student_id", studentIds)
      .neq("course_template_id", courseId);

    if (!similarCourses) return [];

    // Count frequency and return top courses
    const courseFrequency = similarCourses.reduce((acc: any, curr) => {
      const id = curr.course_template_id;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    const uniqueCourses = Array.from(
      new Map(
        similarCourses.map(c => [c.course_template_id, c.course_templates])
      ).values()
    );

    return uniqueCourses
      .map((course: any) => ({
        ...course,
        similarity_score: courseFrequency[course.id] / enrolledStudents.length
      }))
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 4);
  }
};