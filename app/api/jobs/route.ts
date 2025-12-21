import { NextRequest, NextResponse } from "next/server";
import { getReportQueue } from "@/lib/report-queue";

/**
 * GET /api/jobs
 * Fetch all jobs with their current status
 * Optional query params:
 * - userId: filter by user ID
 * - status: filter by job status (queued, processing, completed, failed)
 * - limit: number of jobs to return (default: 50)
 * - offset: pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("[API] GET /api/jobs called with params:", {
      userId,
      status,
      limit,
      offset,
    });

    const queue = await getReportQueue();

    // Get all counts for different statuses
    const counts = await queue.getJobCounts();
    console.log("[API] Job counts:", counts);

    let jobs: any[] = [];

    // If filtering by status, get jobs in that state
    if (status) {
      const validStatuses = [
        "waiting",
        "delayed",
        "active",
        "completed",
        "failed",
        "paused",
        "repeat",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status filter" },
          { status: 400 }
        );
      }
      // getJobs(states, start, end) gets jobs in specific states
      jobs = await queue.getJobs([status as any], offset, offset + limit - 1);
    } else {
      // Get all jobs across all states
      const allStatuses = [
        "waiting",
        "delayed",
        "active",
        "completed",
        "failed",
      ];
      const jobsByStatus = await Promise.all(
        allStatuses.map((s) => queue.getJobs([s as any], 0, -1).catch(() => []))
      );
      // Combine and deduplicate by job ID
      const allJobs = jobsByStatus.flat();
      const uniqueJobsMap = new Map(allJobs.map((job) => [job.id, job]));
      const uniqueJobs = Array.from(uniqueJobsMap.values()).slice(
        offset,
        offset + limit
      );
      jobs = uniqueJobs;
    }

    // Jobs already fetched

    // Build job data with async processing for state
    console.log("[API] Fetched jobs count:", jobs.length);
    console.log(
      "[API] Sample job IDs:",
      jobs.slice(0, 3).map((j) => j.id)
    );

    const jobsData = await Promise.all(
      jobs
        .filter((job) => job !== null && job !== undefined)
        .map(async (job) => {
          const jobData = job.data as any;
          const state = await job.getState(); // getState() returns Promise<JobState>
          const progressData = job.progress; // progress is a property, not a method

          // Calculate progress percentage safely
          let progressPercent = 0;
          let progressMessage: string | undefined;

          if (typeof progressData === "object" && progressData !== null) {
            const prog = progressData as any;
            if (
              prog.current !== undefined &&
              prog.total !== undefined &&
              prog.total > 0
            ) {
              progressPercent = Math.round((prog.current / prog.total) * 100);
            }
            if (prog.message) {
              progressMessage = prog.message;
            }
          }

          // Map BullMQ state to user-friendly status
          let jobStatus = "queued";
          if (state === "active") jobStatus = "processing";
          else if (state === "completed") jobStatus = "completed";
          else if (state === "failed") jobStatus = "failed";
          else if (state === "waiting" || state === "delayed")
            jobStatus = "queued";

          return {
            id: job.id,
            reportName: jobData.reportName,
            pluginId: jobData.pluginId,
            status: jobStatus,
            progress: progressPercent,
            progressMessage: progressMessage,
            createdAt: jobData.metadata?.createdAt,
            createdBy: jobData.metadata?.createdBy,
            description: jobData.metadata?.description,
            query: jobData.query,
            outputs:
              state === "completed"
                ? (job as any).returnvalue?.outputs || null
                : null,
            error: job.failedReason || null,
            attempts: job.attemptsMade,
            stacktrace: job.stacktrace,
          };
        })
    );

    console.log("[API] Processed jobs data:", {
      count: jobsData.length,
      sample: jobsData.slice(0, 1),
    });

    return NextResponse.json({
      success: true,
      count: jobsData.length,
      total: Object.values(counts).reduce((a: number, b: number) => a + b, 0),
      counts,
      jobs: jobsData,
      pagination: {
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error("[API] Error fetching jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch jobs",
      },
      { status: 500 }
    );
  }
}
