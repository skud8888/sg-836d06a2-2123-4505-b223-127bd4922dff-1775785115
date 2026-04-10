import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: ServiceHealth;
    auth: ServiceHealth;
    storage: ServiceHealth;
    api: ServiceHealth;
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

interface ServiceHealth {
  status: "operational" | "degraded" | "down";
  responseTime: number;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const healthStatus: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      auth: await checkAuth(),
      storage: await checkStorage(),
      api: await checkAPI()
    },
    system: {
      uptime: process.uptime(),
      memory: getMemoryUsage()
    }
  };

  // Determine overall status
  const serviceStatuses = Object.values(healthStatus.services).map(s => s.status);
  if (serviceStatuses.some(s => s === "down")) {
    healthStatus.status = "unhealthy";
  } else if (serviceStatuses.some(s => s === "degraded")) {
    healthStatus.status = "degraded";
  }

  const statusCode = healthStatus.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(healthStatus);
}

async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    const { error } = await supabase
      .from("courses")
      .select("id")
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: "down",
        responseTime,
        message: error.message
      };
    }

    return {
      status: responseTime > 1000 ? "degraded" : "operational",
      responseTime
    };
  } catch (error: any) {
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      message: error.message
    };
  }
}

async function checkAuth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check if we can get session (doesn't require authenticated user)
    const { error } = await supabase.auth.getSession();
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: "down",
        responseTime,
        message: error.message
      };
    }

    return {
      status: responseTime > 1000 ? "degraded" : "operational",
      responseTime
    };
  } catch (error: any) {
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      message: error.message
    };
  }
}

async function checkStorage(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Try to list buckets (public operation)
    const { error } = await supabase.storage.listBuckets();
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: "down",
        responseTime,
        message: error.message
      };
    }

    return {
      status: responseTime > 1000 ? "degraded" : "operational",
      responseTime
    };
  } catch (error: any) {
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      message: error.message
    };
  }
}

async function checkAPI(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check if API route is responsive
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/hello`);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: "degraded",
        responseTime,
        message: `HTTP ${response.status}`
      };
    }

    return {
      status: responseTime > 1000 ? "degraded" : "operational",
      responseTime
    };
  } catch (error: any) {
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      message: error.message
    };
  }
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  const total = usage.heapTotal;
  const used = usage.heapUsed;
  
  return {
    used: Math.round(used / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage: Math.round((used / total) * 100)
  };
}