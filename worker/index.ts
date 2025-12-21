/**
 * Worker Process - Main Entry Point
 *
 * Listens to the BullMQ queue and processes report generation jobs.
 * This should be run as a separate Node.js process from the Next.js app.
 *
 * Usage:
 *   node worker/index.js
 *   or
 *   npm run worker (if added to package.json scripts)
 */

import { Worker, Job } from "bullmq";
import { getRedisClient, closeRedisConnection } from "../lib/redis";
import { generateReport } from "./report-generator";
import type {
  ReportJobData,
  ReportJobProgress,
  ReportJobResult,
} from "../lib/report-queue";

const QUEUE_NAME = "report-generation";

/**
 * Process a single report generation job
 */
async function processJob(
  job: Job<ReportJobData, ReportJobResult>
): Promise<ReportJobResult> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`[Worker] Processing job: ${job.id}`);
  console.log(`[Worker] Plugin: ${job.data.pluginId}`);
  console.log(`[Worker] Report: ${job.data.reportName}`);
  console.log(`[Worker] Keywords: ${job.data.query.keywords}`);
  console.log(
    `[Worker] Articles: ${job.data.query.numberOfArticles}`,
    job.data.query.startDate && job.data.query.endDate
      ? `(${job.data.query.startDate} to ${job.data.query.endDate})`
      : ""
  );
  console.log(`${"=".repeat(80)}\n`);

  try {
    // Generate the report
    const result = await generateReport({
      jobData: job.data,
      onProgress: (progress: ReportJobProgress) => {
        // Update job progress in Redis
        const percentage = Math.round(
          (progress.current / progress.total) * 100
        );
        job.updateProgress(progress);

        console.log(
          `[Worker] [${job.id}] ${progress.step} (${percentage}%)${
            progress.message ? ": " + progress.message : ""
          }`
        );
      },
    });

    if (result.success) {
      console.log(`\n[Worker] ✓ Job ${job.id} completed successfully`);
      console.log(`[Worker] Duration: ${result.stats.duration}ms`);
      console.log(`[Worker] LLM calls: ${result.stats.llmCallsCount}`);
      console.log(
        `[Worker] Outputs: ${Object.keys(result.outputs).join(", ")}`
      );
    } else {
      console.log(`\n[Worker] ❌ Job ${job.id} failed: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error(
      `[Worker] ❌ Unexpected error processing job ${job.id}:`,
      error
    );

    return {
      success: false,
      reportPath: "",
      outputs: {},
      stats: {
        duration: 0,
        llmCallsCount: 0,
      },
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

/**
 * Start the worker
 */
export function startWorker() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                                                                ║"
  );
  console.log(
    "║          REPORT GENERATION WORKER STARTING...                  ║"
  );
  console.log(
    "║                                                                ║"
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝\n"
  );

  const connection = getRedisClient();

  const worker = new Worker<ReportJobData, ReportJobResult>(
    QUEUE_NAME,
    processJob,
    {
      connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || "2", 10),
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // Per minute
      },
    }
  );

  // Event handlers
  worker.on("ready", () => {
    console.log("[Worker] ✓ Worker is ready and listening for jobs");
    console.log(`[Worker] Queue: ${QUEUE_NAME}`);
    console.log(`[Worker] Concurrency: ${worker.opts.concurrency}`);
    console.log(
      `[Worker] Plugins dir: ${
        process.env.PLUGINS_DIR || "/shared/reporting-framework/plugins"
      }`
    );
    console.log(
      `[Worker] Reports dir: ${
        process.env.REPORTS_DIR || "/shared/reporting-framework/reports"
      }`
    );
    console.log("");
  });

  worker.on("active", (job: Job<ReportJobData, ReportJobResult>) => {
    console.log(`[Worker] Job ${job.id} started processing`);
  });

  worker.on(
    "completed",
    (job: Job<ReportJobData, ReportJobResult>, result: ReportJobResult) => {
      console.log(`[Worker] ✓ Job ${job.id} completed`);
      if (result.success) {
        console.log(
          `[Worker]   Outputs: ${Object.keys(result.outputs).join(", ")}`
        );
      }
    }
  );

  worker.on(
    "failed",
    (job: Job<ReportJobData, ReportJobResult> | undefined, error: Error) => {
      if (job) {
        console.error(`[Worker] ❌ Job ${job.id} failed:`, error.message);
      } else {
        console.error("[Worker] ❌ Job failed:", error.message);
      }
    }
  );

  worker.on("error", (error: Error) => {
    console.error("[Worker] ❌ Worker error:", error);
  });

  worker.on("stalled", (jobId: string) => {
    console.warn(`[Worker] ⚠ Job ${jobId} stalled`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n[Worker] Shutting down gracefully...");

    await worker.close();
    console.log("[Worker] ✓ Worker closed");

    await closeRedisConnection();
    console.log("[Worker] ✓ Redis connection closed");

    console.log("[Worker] ✓ Shutdown complete\n");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.log("[Worker] Press Ctrl+C to stop\n");

  return worker;
}

// If this file is run directly, start the worker
if (require.main === module) {
  startWorker();
}
