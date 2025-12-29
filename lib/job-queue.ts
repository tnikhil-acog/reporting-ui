/**
 * Job queue for report generation using BullMQ and Redis
 *
 * This replaces the in-memory implementation with a persistent queue
 * that survives server restarts and can be processed by worker processes.
 */

import {
  addReportJob,
  getJobStatus as getQueueJobStatus,
  type ReportJobData,
  type ReportJobProgress,
  type ReportJobResult,
} from "./report-queue";

// Legacy job status type (for backward compatibility)
export type JobStatus = "queued" | "processing" | "completed" | "failed";

// Legacy job interface (for backward compatibility)
export interface ReportJob {
  id: string;
  status: JobStatus;
  pipelineId: string;
  query: any;
  reportName: string;
  reportType: string;
  format: string;
  createdAt: string;
  completedAt?: string;
  reportUrl?: string;
  error?: string;
  progress: number;
}

/**
 * Map BullMQ job state to legacy JobStatus
 */
function mapJobStatus(state: string): JobStatus {
  switch (state) {
    case "waiting":
    case "delayed":
      return "queued";
    case "active":
      return "processing";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return "queued";
  }
}

class JobQueue {
  /**
   * Create a new report generation job
   */
  async createJob(
    pipelineId: string,
    reportName: string,
    query: any,
    reportType: string,
    format: string
  ): Promise<ReportJob> {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Prepare job data for BullMQ
    const jobData: ReportJobData = {
      pluginId: pipelineId,
      reportName,
      query: query, // ✅ CHANGED: Pass query directly (plugin-specific structure)
      config: {
        llmProvider: query.llmProvider || "gemini",
        llmModel: query.llmModel || "gemini-2.0-flash-exp",
        outputFormats: ["html", "md", "pdf"],
        temperature: query.temperature,
        maxTokens: query.maxTokens,
      },
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: query.userId,
        description: query.description,
      },
    };

    // Add job to BullMQ queue
    const bullJob = await addReportJob(jobData, jobId);

    // Return legacy job format
    return {
      id: bullJob.id!,
      status: "queued",
      pipelineId,
      reportName,
      query,
      reportType,
      format,
      createdAt: new Date().toISOString(),
      progress: 0,
    };
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<ReportJob | undefined> {
    const jobStatus = await getQueueJobStatus(jobId);

    if (!jobStatus) {
      return undefined;
    }

    const progress = jobStatus.progress as ReportJobProgress | null;
    const result = jobStatus.result as ReportJobResult | null;

    // Map to legacy format
    return {
      id: jobStatus.id,
      status: mapJobStatus(jobStatus.state),
      pipelineId: jobStatus.data?.pluginId || "",
      reportName: jobStatus.data?.reportName || "",
      query: jobStatus.data?.query || {}, // ✅ CHANGED: Return raw query
      reportType: "standard",
      format: jobStatus.data?.config.outputFormats[0] || "html",
      createdAt: jobStatus.createdAt
        ? new Date(jobStatus.createdAt).toISOString()
        : new Date().toISOString(),
      completedAt: jobStatus.finishedAt
        ? new Date(jobStatus.finishedAt).toISOString()
        : undefined,
      reportUrl:
        result?.outputs.html || result?.outputs.md || result?.outputs.pdf,
      error: jobStatus.error || undefined,
      progress: progress
        ? Math.round((progress.current / progress.total) * 100)
        : 0,
    };
  }

  /**
   * Update job (for backward compatibility, but not recommended with BullMQ)
   * Note: BullMQ jobs are updated by the worker, not directly
   */
  async updateJob(jobId: string, updates: Partial<ReportJob>): Promise<void> {
    console.warn(
      "[JobQueue] Direct job updates are not supported with BullMQ. Updates should be done by the worker."
    );
  }

  /**
   * Cleanup old jobs (handled automatically by BullMQ retention policies)
   */
  cleanup(olderThanHours: number = 24): void {
    // BullMQ handles cleanup automatically via removeOnComplete/removeOnFail options
    console.log(
      "[JobQueue] Cleanup is handled automatically by BullMQ retention policies"
    );
  }
}

export const jobQueue = new JobQueue();
