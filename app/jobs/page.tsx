"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JobCard } from "@/components/JobCard";

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
  query: {
    keywords: string;
    numberOfArticles: number;
  };
  outputs?: {
    html?: string;
    md?: string;
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [counts, setCounts] = useState<{ [key: string]: number }>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("limit", "50");

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data: JobsResponse = await response.json();
      setJobs(data.jobs);
      setCounts(data.counts);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  // Handle job deletion
  const handleJobDelete = (deletedJobId: string) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== deletedJobId));
  };

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  // Auto-refresh when processing jobs exist
  useEffect(() => {
    if (!autoRefresh) return;

    const hasProcessingJobs = jobs.some(
      (job) => job.status === "processing" || job.status === "queued"
    );

    if (!hasProcessingJobs) return;

    const interval = setInterval(() => {
      fetchJobs();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, jobs]);

  const statusOptions: { value: StatusFilter; label: string; icon: string }[] =
    [
      { value: "all", label: "All Jobs", icon: "📊" },
      {
        value: "queued",
        label: `Queued (${counts.waiting || 0})`,
        icon: "⏳",
      },
      {
        value: "processing",
        label: `Processing (${counts.active || 0})`,
        icon: "⚙️",
      },
      {
        value: "completed",
        label: `Completed (${counts.completed || 0})`,
        icon: "✓",
      },
      {
        value: "failed",
        label: `Failed (${counts.failed || 0})`,
        icon: "✗",
      },
    ];

  const filteredJobs =
    statusFilter === "all"
      ? jobs
      : jobs.filter((job) => {
          if (statusFilter === "queued") return job.status === "queued";
          if (statusFilter === "processing") return job.status === "processing";
          return job.status === statusFilter;
        });

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                📋 My Jobs
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Track all your report generation jobs
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchJobs()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
              <Link href="/generate">
                <button className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-colors dark:bg-green-500 dark:hover:bg-green-600">
                  <span>✨</span>
                  <span>New Report</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Controls */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    statusFilter === option.value
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{option.icon}</span> {option.label}
                </button>
              ))}
            </div>

            {/* Auto-Refresh Toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-refresh
              </span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-300">
              <p className="font-semibold">Error:</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading your jobs...
                </p>
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center dark:bg-slate-800">
              <div className="mb-4 text-5xl">📭</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                No jobs found
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                {statusFilter === "all"
                  ? "You haven't created any jobs yet."
                  : `No ${statusFilter} jobs found.`}
              </p>
              <Link href="/generate">
                <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white font-medium transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                  <span>✨</span>
                  <span>Create Your First Report</span>
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onRefresh={fetchJobs}
                  onDelete={handleJobDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
