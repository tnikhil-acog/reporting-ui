"use client";

import React from "react";
import Link from "next/link";
import { filePathToApiUrl } from "@/lib/file-utils";

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

interface JobCardProps {
  job: Job;
  onRefresh: () => void;
  onDelete?: (jobId: string) => void;
}

const statusConfig = {
  queued: {
    color:
      "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700",
    textColor: "text-yellow-700 dark:text-yellow-300",
    badge:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: "⏳",
    label: "Queued",
  },
  processing: {
    color:
      "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700",
    textColor: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: "⚙️",
    label: "Processing",
  },
  completed: {
    color:
      "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700",
    textColor: "text-green-700 dark:text-green-300",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: "✓",
    label: "Completed",
  },
  failed: {
    color: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700",
    textColor: "text-red-700 dark:text-red-300",
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: "✗",
    label: "Failed",
  },
};

export function JobCard({ job, onRefresh, onDelete }: JobCardProps) {
  const config = statusConfig[job.status];
  const createdDate = new Date(job.createdAt);
  const timeAgo = getTimeAgo(createdDate);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (
      !confirm(`Are you sure you want to delete the job "${job.reportName}"?`)
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      console.log("Job deleted successfully:", job.id);
      onDelete?.(job.id);
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-all hover:shadow-md ${config.color}`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${config.badge}`}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {job.reportName}
          </h3>
        </div>
      </div>

      {/* Job Details */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Pipeline:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {job.pluginId}
          </p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Keywords:</span>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {job.query?.keywords || "N/A"}
          </p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Articles:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {job.query?.numberOfArticles || "N/A"}
          </p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Job ID:</span>
          <p className="font-mono text-xs text-gray-900 dark:text-white truncate">
            {job.id}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {job.status === "processing" || job.status === "queued" ? (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {job.progress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          {job.progressMessage && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {job.progressMessage}
            </p>
          )}
        </div>
      ) : null}

      {/* Error Message */}
      {job.status === "failed" && job.error ? (
        <div className="mb-4 rounded bg-red-100 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <p className="font-semibold">Error:</p>
          <p className="mt-1 truncate">{job.error}</p>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {job.status === "completed" && job.outputs ? (
          <>
            {job.outputs.html && (
              <Link href={filePathToApiUrl(job.outputs.html, "html")}>
                <button className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                  📄 View HTML
                </button>
              </Link>
            )}
            {job.outputs.pdf && (
              <a
                href={filePathToApiUrl(job.outputs.pdf, "pdf")}
                download={`${job.reportName}.pdf`}
              >
                <button className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">
                  📋 Download PDF
                </button>
              </a>
            )}
          </>
        ) : (
          <button
            onClick={onRefresh}
            className="flex-1 rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600"
          >
            🔄 Refresh
          </button>
        )}

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg bg-gray-400 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-500 disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-700"
          title="Delete this job"
        >
          {isDeleting ? "⏳ Deleting..." : "🗑️ Delete"}
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsAgo < 60) return "just now";
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  return `${Math.floor(secondsAgo / 86400)}d ago`;
}
