/**
 * GET /api/config
 * Get LLM configuration settings
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = {
      llm: {
        provider: process.env.LLM_PROVIDER || "gemini",
        model: process.env.LLM_MODEL || "gemini-1.5-flash",
        apiKey: process.env.LLM_API_KEY ? "***" : null,
        temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.7"),
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || "4000", 10),
      },
      worker: {
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || "2", 10),
        rateLimit: {
          max: parseInt(process.env.WORKER_RATE_LIMIT_MAX || "10", 10),
          duration: parseInt(
            process.env.WORKER_RATE_LIMIT_DURATION || "60000",
            10
          ),
        },
      },
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
      },
      paths: {
        reportsDir:
          process.env.REPORTS_DIR || "/shared/reporting-framework/reports",
        bundlesDir:
          process.env.BUNDLES_DIR || "/shared/reporting-framework/bundles",
        pluginsDir:
          process.env.PLUGINS_DIR || "/shared/reporting-framework/plugins",
      },
    };

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("[API] Error fetching config:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config
 * Update LLM configuration settings (environment-based)
 */

export async function POST() {
  // For now, configuration is environment-based only
  // In a production system, you might want to store this in a database
  return NextResponse.json(
    {
      error:
        "Configuration updates not supported. Please update environment variables and restart the service.",
    },
    { status: 501 }
  );
}
