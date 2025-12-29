/**
 * Report Queue Module
 *
 * BullMQ queue for managing report generation jobs.
 * Provides job creation, status tracking, and event handling.
 */

import { Queue, QueueEvents, Job } from "bullmq";
import { getRedisClient } from "./redis";

// Job data structure
export interface ReportJobData {
  pluginId: string;
  reportName: string;
  query: Record<string, any>; // ✅ CHANGED: Accept any plugin's query structure
  config: {
    llmProvider: string;
    llmModel: string;
    outputFormats: ("html" | "md" | "pdf")[];
    temperature?: number;
    maxTokens?: number;
  };
  metadata: {
    createdAt: string;
    createdBy?: string;
    description?: string;
  };
}

// Job progress structure
export interface ReportJobProgress {
  step: string;
  current: number;
  total: number;
  message?: string;
}

// Job result structure
export interface ReportJobResult {
  success: boolean;
  reportPath: string;
  outputs: {
    html?: string;
    md?: string;
    pdf?: string;
  };
  stats: {
    duration: number;
    llmCallsCount: number;
    tokensUsed?: number;
  };
  error?: string;
}

let reportQueue: Queue<ReportJobData, ReportJobResult> | null = null;
let queueEvents: QueueEvents | null = null;

/**
 * Get or create the report queue instance
 */
export function getReportQueue(): Queue<ReportJobData, ReportJobResult> {
  if (reportQueue) {
    return reportQueue;
  }

  const connection = getRedisClient();

  reportQueue = new Queue<ReportJobData, ReportJobResult>("report-generation", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
  });

  console.log("[ReportQueue] Queue initialized");

  return reportQueue;
}

/**
 * Get or create queue events listener
 */
export function getQueueEvents(): QueueEvents {
  if (queueEvents) {
    return queueEvents;
  }

  const connection = getRedisClient();

  queueEvents = new QueueEvents("report-generation", {
    connection,
  });

  // Log queue events
  queueEvents.on("completed", ({ jobId }) => {
    console.log(`[ReportQueue] Job ${jobId} completed`);
  });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[ReportQueue] Job ${jobId} failed: ${failedReason}`);
  });

  queueEvents.on("progress", ({ jobId, data }) => {
    console.log(`[ReportQueue] Job ${jobId} progress:`, data);
  });

  console.log("[ReportQueue] Event listener initialized");

  return queueEvents;
}

/**
 * Add a new report generation job to the queue
 */
export async function addReportJob(
  jobData: ReportJobData,
  jobId?: string
): Promise<Job<ReportJobData, ReportJobResult>> {
  const queue = getReportQueue();

  const job = await queue.add("generate-report", jobData, {
    jobId:
      jobId ||
      `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    priority: 1,
  });

  console.log(`[ReportQueue] Job ${job.id} added to queue`);

  return job;
}

/**
 * Get job by ID
 */
export async function getJob(
  jobId: string
): Promise<Job<ReportJobData, ReportJobResult> | undefined> {
  const queue = getReportQueue();
  return await queue.getJob(jobId);
}

/**
 * Get job status and details
 */
export async function getJobStatus(jobId: string): Promise<{
  id: string;
  state: string;
  progress: ReportJobProgress | null;
  result: ReportJobResult | null;
  error: string | null;
  data: ReportJobData | null;
  createdAt: number | null;
  processedAt: number | null;
  finishedAt: number | null;
} | null> {
  const job = await getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = (job.progress as ReportJobProgress) || null;
  const result = job.returnvalue || null;
  const error = job.failedReason || null;

  return {
    id: job.id!,
    state,
    progress,
    result,
    error,
    data: job.data,
    createdAt: job.timestamp,
    processedAt: job.processedOn || null,
    finishedAt: job.finishedOn || null,
  };
}

/**
 * Remove a job from the queue
 */
export async function removeJob(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);

  if (!job) {
    return false;
  }

  await job.remove();
  console.log(`[ReportQueue] Job ${jobId} removed`);

  return true;
}

/**
 * Get all jobs in the queue
 */
export async function getAllJobs(): Promise<
  Job<ReportJobData, ReportJobResult>[]
> {
  const queue = getReportQueue();

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
  ]);

  return [...waiting, ...active, ...completed, ...failed];
}

/**
 * Close queue connections gracefully
 */
export async function closeQueue(): Promise<void> {
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
    console.log("[ReportQueue] Events closed");
  }

  if (reportQueue) {
    await reportQueue.close();
    reportQueue = null;
    console.log("[ReportQueue] Queue closed");
  }
}
