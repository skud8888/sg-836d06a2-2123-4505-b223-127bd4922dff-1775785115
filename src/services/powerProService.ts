import { supabase } from "@/integrations/supabase/client";

/**
 * Service to interact with the PowerPro API for data import/export.
 */

// Define standard types for PowerPro data structures
export interface PowerProStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface PowerProCourse {
  code: string;
  name: string;
  description?: string;
  durationHours?: number;
}

export class PowerProService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "https://api.powerpro.com.au/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Helper to make authenticated requests to PowerPro
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Note: Since this is a client-side service, actual integration might require a backend proxy 
    // to avoid CORS issues and exposing API keys. We simulate the logic here.
    const url = `${this.baseUrl}${endpoint}`;
    
    // In a real scenario, we'd uncomment this fetch call:
    /*
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`PowerPro API error: ${response.statusText}`);
    }

    return response.json();
    */

    // Simulated mock responses for demonstration:
    if (endpoint === "/students") {
      return [
        { id: "PP001", firstName: "Alice", lastName: "Power", email: "alice.power@example.com" },
        { id: "PP002", firstName: "Bob", lastName: "Pro", email: "bob.pro@example.com" }
      ] as any;
    }

    if (endpoint === "/courses") {
      return [
        { code: "HLTAID011", name: "Provide First Aid", durationHours: 8 },
        { code: "CPCCWHS1001", name: "Prepare to work safely in the construction industry", durationHours: 6 }
      ] as any;
    }

    return [] as any;
  }

  /**
   * Fetch students from PowerPro
   */
  async getStudents(): Promise<PowerProStudent[]> {
    return this.request<PowerProStudent[]>("/students");
  }

  /**
   * Fetch courses from PowerPro
   */
  async getCourses(): Promise<PowerProCourse[]> {
    return this.request<PowerProCourse[]>("/courses");
  }

  /**
   * Import students from PowerPro into Supabase
   */
  async importStudentsToSupabase(students: PowerProStudent[]): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    // Call server-side API to create users safely since it requires admin rights
    for (const student of students) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Use the existing create-user endpoint with a default password for imported users
        const response = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            email: student.email,
            password: "ImportedUser123!", // Temp password, user should be forced to reset
            fullName: `${student.firstName} ${student.lastName}`,
            role: "student"
          })
        });

        if (response.ok) {
          success++;
        } else {
          errors++;
        }
      } catch (err) {
        console.error("Failed to import student:", err);
        errors++;
      }
    }

    return { success, errors };
  }

  /**
   * Import courses from PowerPro into Supabase
   */
  async importCoursesToSupabase(courses: PowerProCourse[]): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    for (const course of courses) {
      try {
        const { error } = await supabase
          .from("course_templates")
          .insert({
            name: course.name,
            code: course.code,
            description: course.description || `Imported from PowerPro`,
            duration_hours: course.durationHours || 0,
            price: 0 // Default price
          });

        if (error) {
          console.error(`Failed to import course ${course.code}:`, error);
          errors++;
        } else {
          success++;
        }
      } catch (err) {
        errors++;
      }
    }

    return { success, errors };
  }
}