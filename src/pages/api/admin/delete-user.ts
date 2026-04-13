import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

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
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check Super Admin role
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isSuperAdmin = userRoles?.some(r => r.role === "Super Admin");
    if (!isSuperAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Delete user via admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return res.status(400).json({ error: deleteError.message });
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error("Server error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}