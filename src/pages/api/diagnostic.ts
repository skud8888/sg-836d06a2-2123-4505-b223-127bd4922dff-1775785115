import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type DiagnosticResponse = {
  status: string;
  timestamp: string;
  checks: {
    supabase_url_exists: boolean;
    supabase_anon_key_exists: boolean;
    supabase_service_key_exists: boolean;
    can_connect_to_supabase: boolean;
    can_query_profiles: boolean;
    auth_working: boolean;
  };
  errors: string[];
  suggestions: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiagnosticResponse>
) {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const checks = {
    supabase_url_exists: false,
    supabase_anon_key_exists: false,
    supabase_service_key_exists: false,
    can_connect_to_supabase: false,
    can_query_profiles: false,
    auth_working: false
  };

  try {
    // Check environment variables exist
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      checks.supabase_url_exists = true;
    } else {
      errors.push("NEXT_PUBLIC_SUPABASE_URL is not set");
      suggestions.push("Add NEXT_PUBLIC_SUPABASE_URL to your .env.local file");
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      checks.supabase_anon_key_exists = true;
    } else {
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
      suggestions.push("Add NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file");
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      checks.supabase_service_key_exists = true;
    } else {
      errors.push("SUPABASE_SERVICE_ROLE_KEY is not set");
      suggestions.push("Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file");
    }

    // Try to connect to Supabase if we have the keys
    if (checks.supabase_url_exists && checks.supabase_service_key_exists) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Test connection with a simple query
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .limit(1);

        if (!error) {
          checks.can_connect_to_supabase = true;
          checks.can_query_profiles = true;
        } else {
          errors.push(`Supabase query error: ${error.message}`);
          suggestions.push("Check if your Supabase project is active and database is accessible");
        }
      } catch (err: any) {
        errors.push(`Supabase connection error: ${err.message}`);
        suggestions.push("Verify your Supabase credentials are correct");
      }
    }

    // Test auth if we have a token
    if (req.headers.authorization && checks.supabase_url_exists && checks.supabase_service_key_exists) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const token = req.headers.authorization.replace("Bearer ", "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (!error && user) {
          checks.auth_working = true;
        } else {
          errors.push(`Auth test failed: ${error?.message || "No user"}`);
        }
      } catch (err: any) {
        errors.push(`Auth error: ${err.message}`);
      }
    }

    const status = errors.length === 0 ? "healthy" : "unhealthy";

    return res.status(200).json({
      status,
      timestamp: new Date().toISOString(),
      checks,
      errors,
      suggestions
    });

  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      checks,
      errors: [...errors, error.message],
      suggestions: [...suggestions, "Check server logs for detailed error information"]
    });
  }
}