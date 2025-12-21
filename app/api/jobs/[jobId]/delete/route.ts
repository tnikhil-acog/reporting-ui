import { NextRequest, NextResponse } from "next/server";
import { getReportQueue } from "@/lib/report-queue";

/**
 * DELETE /api/jobs/[jobId]/delete
 * Delete a specific job by ID
 */
export async function DELETE(
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

    console.log("[API] DELETE /api/jobs/[jobId]/delete called for:", jobId);

    const queue = await getReportQueue();

    // Get the job
    const job = await queue.getJob(jobId);

    if (!job) {
      console.log("[API] Job not found:", jobId);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get job state before deletion
    const state = await job.getState();
    const jobData = job.data as any;

    console.log("[API] Deleting job:", {
      jobId,
      state,
      reportName: jobData?.reportName,
    });

    // Remove the job from queue
    await job.remove();

    console.log("[API] Job deleted successfully:", jobId);

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
      jobId,
      deletedJob: {
        id: jobId,
        reportName: jobData?.reportName,
        state,
      },
    });
  } catch (error) {
    console.error("[API] Error deleting job:", error);
    return NextResponse.json(
      {
        error: "Failed to delete job",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
