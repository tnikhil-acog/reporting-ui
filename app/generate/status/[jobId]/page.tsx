"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StatusPageProps {
  params: Promise<{ jobId: string }>;
}

export default function JobStatusPage({ params }: StatusPageProps) {
  const { jobId } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/reports/status/${jobId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setJob(data.job);

          if (data.job.status === "completed") {
            // Wait 2 seconds then redirect
            setTimeout(() => {
              router.push(`/reports/${data.job.pipelineId}`);
            }, 2000);
          } else if (data.job.status !== "failed") {
            // Continue polling if not completed or failed
            setTimeout(pollStatus, 2000);
          }
        }
      } catch (error) {
        console.error("Error polling job status:", error);
      } finally {
        setLoading(false);
      }
    };

    pollStatus();
  }, [jobId, router]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued":
        return "⏳";
      case "processing":
        return "⚙️";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      default:
        return "📄";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "queued":
        return "Your report is in the queue...";
      case "processing":
        return "Fetching data and generating report...";
      case "completed":
        return "Report generated successfully! Redirecting...";
      case "failed":
        return "Report generation failed";
      default:
        return "Processing...";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Report Generation Status
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow-lg dark:bg-slate-800 p-8">
          {job ? (
            <>
              {/* Status Icon */}
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">{getStatusIcon(job.status)}</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {getStatusMessage(job.status)}
                </p>
              </div>

              {/* Progress Bar */}
              {job.status !== "failed" && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progress
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {job.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Job Details */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Job ID:
                  </span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {job.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Pipeline:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {job.pipelineId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Created:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(job.createdAt).toLocaleString()}
                  </span>
                </div>
                {job.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Completed:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(job.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {job.status === "failed" && job.error && (
                <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                    Error Details:
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {job.error}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex gap-4 justify-center">
                <Link href="/">
                  <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    Back to Home
                  </button>
                </Link>
                {job.status === "failed" && (
                  <Link href="/generate">
                    <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      Try Again
                    </button>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400">
              Job not found
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
