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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // Update existing user's password
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { 
          password,
          email_confirm: true
        }
      );

      if (updateError) {
        console.error("Error updating user:", updateError);
        return res.status(400).json({ error: updateError.message });
      }

      userId = existingUser.id;
    } else {
      // Create new user
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || "Admin User"
        }
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return res.status(400).json({ error: createError.message });
      }

      userId = createData.user!.id;
    }

    // Ensure profile exists
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        email,
        full_name: fullName || "Admin User",
        updated_at: new Date().toISOString()
      }, {
        onConflict: "id"
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // Ensure super_admin role exists
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: "super_admin"
      }, {
        onConflict: "user_id,role"
      });

    if (roleError) {
      console.error("Error creating role:", roleError);
    }

    // Ensure notification preferences exist
    const { error: notifError } = await supabaseAdmin
      .from("notification_preferences")
      .upsert({
        user_id: userId,
        has_seen_admin_tour: false
      }, {
        onConflict: "user_id"
      });

    if (notifError) {
      console.error("Error creating notification preferences:", notifError);
    }

    return res.status(200).json({ 
      success: true,
      userId,
      email,
      message: "Admin user setup complete. You can now login."
    });

  } catch (error: any) {
    console.error("Server error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}