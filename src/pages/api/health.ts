import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type HealthCheck = {
  status: string;
  timestamp: string;
  checks: {
    api: boolean;
    supabase_url: boolean;
    supabase_anon_key: boolean;
    supabase_service_key: boolean;
    supabase_connection: boolean;
    auth_working: boolean;
  };
  errors: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheck>
) {
  res.setHeader('Content-Type', 'application/json');

  const errors: string[] = [];
  const checks = {
    api: true,
    supabase_url: false,
    supabase_anon_key: false,
    supabase_service_key: false,
    supabase_connection: false,
    auth_working: false
  };

  try {
    // Check environment variables
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      checks.supabase_url = true;
    } else {
      errors.push("NEXT_PUBLIC_SUPABASE_URL is missing");
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      checks.supabase_anon_key = true;
    } else {
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      checks.supabase_service_key = true;
    } else {
      errors.push("SUPABASE_SERVICE_ROLE_KEY is missing");
    }

    // Test Supabase connection if keys are present
    if (checks.supabase_url && checks.supabase_service_key) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .limit(1);

        if (!error) {
          checks.supabase_connection = true;
        } else {
          errors.push(`Supabase connection failed: ${error.message}`);
        }
      } catch (err: any) {
        errors.push(`Supabase test failed: ${err.message}`);
      }
    }

    // Test auth if we have auth header
    if (req.headers.authorization && checks.supabase_url && checks.supabase_service_key) {
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
          errors.push(`Auth check failed: ${error?.message || "No user"}`);
        }
      } catch (err: any) {
        errors.push(`Auth test failed: ${err.message}`);
      }
    }

    const status = errors.length === 0 ? "healthy" : "degraded";

    return res.status(200).json({
      status,
      timestamp: new Date().toISOString(),
      checks,
      errors
    });

  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      checks,
      errors: [...errors, error.message]
    });
  }
}