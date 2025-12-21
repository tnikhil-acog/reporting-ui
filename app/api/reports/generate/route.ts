import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/lib/job-queue";
import { loadPipeline, getPipelineConfig } from "@/lib/pipeline-loader";
import { promises as fs } from "fs";
import path from "path";

const REPORTS_DIR =
  process.env.REPORTS_DIR || "/shared/reporting-framework/reports";
const BUNDLES_DIR =
  process.env.BUNDLES_DIR || "/shared/reporting-framework/bundles";

/**
 * POST /api/reports/generate
 * Create a new report generation job
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/reports/generate called");

    const body = await request.json();
    console.log("[API] Request body:", JSON.stringify(body, null, 2));

    const { pipelineId, reportName, query, reportType, format = "html" } = body;

    // Validate required fields
    if (!pipelineId) {
      return NextResponse.json(
        { error: "Missing required field: pipelineId" },
        { status: 400 }
      );
    }

    if (!reportName) {
      return NextResponse.json(
        { error: "Missing required field: reportName" },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: "Missing required field: query" },
        { status: 400 }
      );
    }

    // Validate report name
    const trimmedReportName = reportName.trim();
    if (trimmedReportName.length < 3) {
      return NextResponse.json(
        { error: "Report name must be at least 3 characters long" },
        { status: 400 }
      );
    }

    if (trimmedReportName.length > 100) {
      return NextResponse.json(
        { error: "Report name must not exceed 100 characters" },
        { status: 400 }
      );
    }

    // Check if pipeline exists
    console.log("[API] Checking if pipeline exists:", pipelineId);
    const config = await getPipelineConfig(pipelineId);
    if (!config) {
      return NextResponse.json(
        { error: `Pipeline not found: ${pipelineId}` },
        { status: 404 }
      );
    }

    console.log("[API] Pipeline config:", config);

    // Create job (now persisted in Redis via BullMQ)
    const job = await jobQueue.createJob(
      pipelineId,
      trimmedReportName,
      query,
      reportType || `${pipelineId}_report`,
      format
    );

    console.log(
      `[API] Created job ${job.id} for report: "${trimmedReportName}"`
    );

    // NOTE: Job processing will be handled by the worker process (Phase 2)
    // For now, jobs are queued in Redis and will be processed when worker is implemented

    // Return job ID immediately
    return NextResponse.json({
      success: true,
      jobId: job.id,
      reportName: trimmedReportName,
      status: "queued",
      message:
        "Report generation job created and queued. Worker will process it.",
    });
  } catch (error: any) {
    console.error("[API] Error in POST /api/reports/generate:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * NOTE: The background job processing logic has been removed from this API route.
 * Report generation will be handled by a separate worker process in Phase 2.
 *
 * The worker will:
 * 1. Listen to the BullMQ queue
 * 2. Load plugins from /shared/reporting-framework/plugins
 * 3. Process jobs and generate reports
 * 4. Update job progress and status
 * 5. Save outputs to /shared/reporting-framework/reports
 */

/**
 * GET /api/reports/generate
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: "Report generation API endpoint",
    status: "active",
    methods: ["POST"],
    usage: {
      endpoint: "/api/reports/generate",
      method: "POST",
      required_fields: {
        pipelineId: 'string - ID of the pipeline to use (e.g., "patent")',
        reportName: "string - User-provided name for the report (3-100 chars)",
        query: "object - Search parameters (keywords, dateRange, limit, etc.)",
      },
      optional_fields: {
        reportType: 'string - Type identifier (default: "{pipelineId}_report")',
        format: 'string - Output format (default: "html")',
      },
      example: {
        pipelineId: "patent",
        reportName: "AI Patents Q4 2024",
        query: {
          keywords: ["artificial intelligence", "machine learning"],
          dateRange: {
            start: "2024-10-01",
            end: "2024-12-31",
          },
          limit: 100,
          assignee: "Google",
        },
        reportType: "patent_report",
        format: "html",
      },
    },
    response: {
      success: "boolean",
      jobId: "string - Use to poll job status at /api/reports/status/{jobId}",
      reportName: "string",
      status: 'string - Initial status (always "queued")',
      message: "string",
    },
  });
}
