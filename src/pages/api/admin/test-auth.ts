import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Content-Type', 'application/json');

  try {
    // Check environment variables
    const checks = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      service_role_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      supabase_url_value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'
    };

    // Try to create admin client
    let adminClientWorks = false;
    let adminClientError = null;

    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      // Try a simple query
      const { data, error } = await supabaseAdmin.from('profiles').select('id').limit(1);
      
      if (error) {
        adminClientError = error.message;
      } else {
        adminClientWorks = true;
      }
    } catch (err: any) {
      adminClientError = err.message;
    }

    // Check auth header
    const authHeader = req.headers.authorization;
    const hasAuthHeader = !!authHeader;
    
    return res.status(200).json({
      checks,
      adminClientWorks,
      adminClientError,
      hasAuthHeader,
      message: adminClientWorks 
        ? "✅ Environment setup looks good!" 
        : "❌ Environment setup has issues - check the details above"
    });

  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      message: "Failed to run diagnostic checks"
    });
  }
}