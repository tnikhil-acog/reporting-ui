import { NextRequest, NextResponse } from "next/server";
import { getReportQueue } from "@/lib/report-queue";

/**
 * GET /api/jobs/[jobId]
 * Fetch details for a specific job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const queue = await getReportQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const state = await job.getState(); // getState() returns Promise<JobState>
    const progressData = job.progress; // progress is a property
    const jobData = job.data as any;

    // Calculate progress percentage
    let progressPercent = 0;
    let progressMessage: string | undefined;

    if (typeof progressData === "object" && progressData !== null) {
      const prog = progressData as any;
      if (prog.current && prog.total) {
        progressPercent = Math.round((prog.current / prog.total) * 100);
      }
      progressMessage = prog.message;
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        reportName: jobData.reportName,
        pluginId: jobData.pluginId,
        status: state,
        progress: progressPercent,
        progressMessage: progressMessage,
        createdAt: jobData.metadata?.createdAt,
        createdBy: jobData.metadata?.createdBy,
        description: jobData.metadata?.description,
        query: jobData.query,
        config: jobData.config,
        outputs:
          state === "completed"
            ? (job as any).returnvalue?.outputs || null
            : null,
        error: job.failedReason || null,
        attempts: job.attemptsMade,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
      },
    });
  } catch (error) {
    console.error("[API] Error fetching job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch job",
      },
      { status: 500 }
    );
  }
}
