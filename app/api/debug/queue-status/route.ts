import { getReportQueue } from "@/lib/report-queue";

/**
 * Diagnostic endpoint to check queue status
 * GET /api/debug/queue-status
 */
export async function GET() {
  try {
    console.log("[DEBUG] Checking queue status...");

    const queue = await getReportQueue();
    const counts = await queue.getJobCounts();

    console.log("[DEBUG] Job counts:", counts);

    // Get sample jobs from each status
    const sampleJobs: any = {};

    for (const status of [
      "waiting",
      "delayed",
      "active",
      "completed",
      "failed",
    ]) {
      try {
        const jobs = await queue.getJobs([status as any], 0, 4);
        console.log(
          `[DEBUG] Jobs in "${status}":`,
          jobs.length,
          jobs.map((j) => ({ id: j.id, name: j.data?.reportName }))
        );
        sampleJobs[status] = jobs.map((j) => ({
          id: j.id,
          name: j.data?.reportName,
          state: status,
          data: j.data,
        }));
      } catch (err) {
        console.error(`[DEBUG] Error fetching ${status} jobs:`, err);
        sampleJobs[status] = { error: String(err) };
      }
    }

    return Response.json({
      success: true,
      counts,
      sampleJobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DEBUG] Error:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
