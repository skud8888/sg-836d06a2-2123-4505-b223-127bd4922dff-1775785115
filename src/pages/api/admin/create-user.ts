import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Create admin client with service role key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
  // Set proper JSON headers
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Create user request received");
    console.log("Headers:", req.headers);
    console.log("Body type:", typeof req.body);

    // Get request body
    const body = req.body;
    console.log("Parsed body:", body);

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header");
      return res.status(401).json({ error: "Unauthorized - No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token present:", !!token);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }

    console.log("User authenticated:", user.id);

    // Check if user has Super Admin role
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Roles check error:", rolesError);
      return res.status(500).json({ error: "Failed to verify permissions" });
    }

    console.log("User roles:", userRoles);

    const isSuperAdmin = userRoles?.some(r => r.role === "super_admin");
    if (!isSuperAdmin) {
      console.log("User is not super_admin");
      return res.status(403).json({ error: "Forbidden - Super Admin access required" });
    }

    const { email, password, fullName, role } = body;

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 8) {
      console.log("Password too short");
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    console.log("Creating user with email:", email);

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
      console.error("No user returned from creation");
      return res.status(500).json({ error: "User creation failed - No user returned" });
    }

    console.log("User created:", newUser.user.id);

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Assign role if provided
    if (role) {
      console.log("Assigning role:", role);
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: role
        });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        // Don't fail - user created successfully
      } else {
        console.log("Role assigned successfully");
      }
    }

    console.log("User creation complete");

    return res.status(200).json({ 
      success: true, 
      user: {
        id: newUser.user.id,
        email: newUser.user.email
      }
    });

  } catch (error: any) {
    console.error("Server error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      error: error.message || "Internal server error",
      details: error.toString()
    });
  }
}