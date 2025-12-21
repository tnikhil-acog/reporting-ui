import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/lib/job-queue";
import { getJobStatus } from "@/lib/report-queue";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Get both the mapped job and raw status for debugging
    const job = await jobQueue.getJob(jobId);
    const rawStatus = await getJobStatus(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    console.log(`[API] Status check for job ${jobId}:`, {
      mappedStatus: job.status,
      progress: job.progress,
      rawState: rawStatus?.state,
    });

    return NextResponse.json({
      success: true,
      job,
      debug: {
        state: rawStatus?.state,
        progress: rawStatus?.progress,
        result: rawStatus?.result,
        error: rawStatus?.error,
      },
    });
  } catch (error: any) {
    console.error("[API] Error getting job status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
