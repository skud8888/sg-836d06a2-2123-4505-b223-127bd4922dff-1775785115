import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Create admin client with service role key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key from env
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify the requesting user is authenticated and has Super Admin role
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user has Super Admin role
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isSuperAdmin = userRoles?.some(r => r.role === "Super Admin");
    if (!isSuperAdmin) {
      return res.status(403).json({ error: "Forbidden - Super Admin access required" });
    }

    const { email, password, fullName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Create user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || ""
      }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return res.status(400).json({ error: createError.message });
    }

    if (!newUser.user) {
      return res.status(500).json({ error: "User creation failed" });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        email: email,
        full_name: fullName || ""
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Don't fail - profile might have been created by trigger
    }

    // Assign role if provided
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: role
        });

      if (roleError) {
        console.error("Error assigning role:", roleError);
      }
    }

    return res.status(200).json({ 
      success: true, 
      user: {
        id: newUser.user.id,
        email: newUser.user.email
      }
    });

  } catch (error: any) {
    console.error("Server error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}