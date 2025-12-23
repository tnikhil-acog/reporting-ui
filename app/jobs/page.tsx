"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Trash2,
  Download,
  FileText,
} from "lucide-react";

interface Job {
  id: string;
  reportName: string;
  pluginId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  progressMessage?: string;
  createdAt: string;
  createdBy?: string;
  description?: string;
  query?: {
    keywords?: string;
    numberOfArticles?: number;
  };
  outputs?: {
    html?: string;
    pdf?: string;
  };
  error?: string | null;
}

interface JobsResponse {
  success: boolean;
  count: number;
  total: number;
  counts: {
    [key: string]: number;
  };
  jobs: Job[];
  pagination: {
    offset: number;
    limit: number;
  };
}

type StatusFilter = "all" | "queued" | "processing" | "completed" | "failed";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function JobsPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]); // Store all jobs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [counts, setCounts] = useState<{ [key: string]: number }>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch all jobs (only called once initially and on refresh)
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch ALL jobs, filter client-side
      const response = await fetch(`/api/jobs?limit=100`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data: JobsResponse = await response.json();
      setAllJobs(data.jobs);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle job deletion
  const handleJobDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      setAllJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job. Please try again.");
    }
  };

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const hasActiveJobs = allJobs.some(
      (job) => job.status === "processing" || job.status === "queued"
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      fetchJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, allJobs]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "queued":
        return {
          icon: Clock,
          label: "Queued",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          borderColor: "border-yellow-300 dark:border-yellow-800",
          textColor: "text-yellow-700 dark:text-yellow-400",
          badgeBg: "bg-yellow-100 dark:bg-yellow-900",
        };
      case "processing":
        return {
          icon: Loader2,
          label: "Processing",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          borderColor: "border-blue-300 dark:border-blue-800",
          textColor: "text-blue-700 dark:text-blue-400",
          badgeBg: "bg-blue-100 dark:bg-blue-900",
          iconClass: "animate-spin",
        };
      case "completed":
        return {
          icon: CheckCircle2,
          label: "Completed",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          borderColor: "border-green-300 dark:border-green-800",
          textColor: "text-green-700 dark:text-green-400",
          badgeBg: "bg-green-100 dark:bg-green-900",
        };
      case "failed":
        return {
          icon: XCircle,
          label: "Failed",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-300 dark:border-red-800",
          textColor: "text-red-700 dark:text-red-400",
          badgeBg: "bg-red-100 dark:bg-red-900",
        };
      default:
        return {
          icon: Clock,
          label: "Unknown",
          bgColor: "bg-muted/50",
          borderColor: "border-border",
          textColor: "text-muted-foreground",
          badgeBg: "bg-muted",
        };
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const secondsAgo = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (secondsAgo < 60) return "just now";
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  // ✅ CLIENT-SIDE FILTERING - Instant, no loading
  const filteredJobs =
    statusFilter === "all"
      ? allJobs
      : allJobs.filter((job) => job.status === statusFilter);

  const totalJobs = allJobs.length;
  const completedCount = allJobs.filter((j) => j.status === "completed").length;
  const failedCount = allJobs.filter((j) => j.status === "failed").length;
  const processingCount = allJobs.filter(
    (j) => j.status === "processing"
  ).length;
  const queuedCount = allJobs.filter((j) => j.status === "queued").length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                  My Jobs
                </span>
              </h1>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={fetchJobs}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </Button>
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
                >
                  <Link href="/generate">
                    <Sparkles className="h-5 w-5" />
                    <span>New Report</span>
                  </Link>
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Track and manage your report generation jobs
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          >
            <motion.div
              variants={item}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="text-3xl font-bold text-foreground">
                {totalJobs}
              </div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </motion.div>

            <motion.div
              variants={item}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {queuedCount}
              </div>
              <div className="text-sm text-muted-foreground">Queued</div>
            </motion.div>

            <motion.div
              variants={item}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {processingCount}
              </div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </motion.div>

            <motion.div
              variants={item}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {completedCount}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </motion.div>

            <motion.div
              variants={item}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {failedCount}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </motion.div>
          </motion.div>

          {/* Filters and Auto-refresh */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
          >
            <div className="flex gap-2 flex-wrap">
              {[
                {
                  value: "all" as StatusFilter,
                  label: "All Jobs",
                  count: totalJobs,
                },
                {
                  value: "queued" as StatusFilter,
                  label: "Queued",
                  count: queuedCount,
                },
                {
                  value: "processing" as StatusFilter,
                  label: "Processing",
                  count: processingCount,
                },
                {
                  value: "completed" as StatusFilter,
                  label: "Completed",
                  count: completedCount,
                },
                {
                  value: "failed" as StatusFilter,
                  label: "Failed",
                  count: failedCount,
                },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={
                    statusFilter === option.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setStatusFilter(option.value)}
                  className={
                    statusFilter === option.value
                      ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                      : ""
                  }
                >
                  {option.label} ({option.count})
                </Button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-muted-foreground">Auto-refresh (5s)</span>
            </label>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4"
            >
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          {/* Jobs List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your jobs...</p>
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border bg-card/50 backdrop-blur-sm p-12 text-center shadow-sm"
            >
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No jobs found
              </h3>
              <p className="text-muted-foreground mb-6">
                {statusFilter === "all"
                  ? "You haven't created any jobs yet."
                  : `No ${statusFilter} jobs found.`}
              </p>
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              >
                <Link href="/generate">
                  <Sparkles className="h-5 w-5" />
                  <span>Create Your First Report</span>
                </Link>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={statusFilter}
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-4 grid-cols-1 lg:grid-cols-2"
            >
              {filteredJobs.map((job) => {
                const config = getStatusConfig(job.status);
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={job.id}
                    variants={item}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-6 shadow-sm hover:shadow-md transition-all`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.badgeBg}`}>
                          <StatusIcon
                            className={`h-5 w-5 ${config.textColor} ${
                              config.iconClass || ""
                            }`}
                          />
                        </div>
                        <div>
                          <div
                            className={`text-sm font-semibold ${config.textColor}`}
                          >
                            {config.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getTimeAgo(job.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Job Name */}
                    <h3 className="text-lg font-bold text-foreground mb-4">
                      {job.reportName}
                    </h3>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pipeline:</span>
                        <p className="font-semibold text-foreground">
                          {job.pluginId}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Articles:</span>
                        <p className="font-semibold text-foreground">
                          {job.query?.numberOfArticles || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Keywords:</span>
                        <p className="font-semibold text-foreground truncate">
                          {job.query?.keywords || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(job.status === "processing" ||
                      job.status === "queued") && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-semibold text-foreground">
                            {job.progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                          />
                        </div>
                        {job.progressMessage && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {job.progressMessage}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {job.status === "failed" && job.error && (
                      <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                        <p className="text-xs font-semibold text-destructive mb-1">
                          Error:
                        </p>
                        <p className="text-xs text-destructive/90 line-clamp-2">
                          {job.error}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      {job.status === "completed" && job.outputs ? (
                        <>
                          {job.outputs.html && (
                            <Button size="sm" className="flex-1" asChild>
                              <Link href={job.outputs.html} target="_blank">
                                <FileText className="h-4 w-4" />
                                <span>View Report</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                          {job.outputs.pdf && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              asChild
                            >
                              <a
                                href={job.outputs.pdf}
                                download={`${job.reportName}.pdf`}
                              >
                                <Download className="h-4 w-4" />
                                <span>PDF</span>
                              </a>
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={fetchJobs}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Refresh</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleJobDelete(job.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
