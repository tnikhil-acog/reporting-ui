"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
}

export default function GeneratePluginPage({
  params,
}: {
  params: Promise<{ pluginId: string }>;
}) {
  const router = useRouter();
  const [pluginId, setPluginId] = useState<string>("");
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [reportName, setReportName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numberOfArticles, setNumberOfArticles] = useState("500");

  useEffect(() => {
    params.then((resolvedParams) => {
      setPluginId(resolvedParams.pluginId);
      fetchPlugin(resolvedParams.pluginId);
    });
  }, [params]);

  const fetchPlugin = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/plugins");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch plugin");
      }

      const foundPlugin = data.plugins?.find((p: Plugin) => p.id === id);
      if (!foundPlugin) {
        throw new Error(`Plugin not found: ${id}`);
      }

      setPlugin(foundPlugin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching plugin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!reportName.trim()) {
      setError("Please enter a report name");
      return;
    }

    if (!keywords.trim()) {
      setError("Please enter keywords");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Submit job
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pipelineId: pluginId,
          reportName,
          query: {
            keywords,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            numberOfArticles: parseInt(numberOfArticles) || 500,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create report job");
      }

      // Redirect to status page
      router.push(`/generate/status/${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error creating report:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Link
              href="/generate"
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Plugins
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex justify-center py-24">
            <div className="text-center">
              <div className="mb-4 inline-block">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading plugin details...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !plugin) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Link
              href="/generate"
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Plugins
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/20 dark:bg-red-900/10">
            <h2 className="font-semibold text-red-800 dark:text-red-300">
              Error
            </h2>
            <p className="mt-2 text-red-700 dark:text-red-400">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/generate"
                className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to Plugins
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {plugin?.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {plugin?.description}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                v{plugin?.version}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Generate Report
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Report Name */}
            <div>
              <label
                htmlFor="reportName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Report Name *
              </label>
              <input
                id="reportName"
                type="text"
                value={reportName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setReportName(e.target.value)
                }
                placeholder="Enter a descriptive report name"
                required
                disabled={submitting}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This will be used as the title for your report
              </p>
            </div>

            {/* Keywords */}
            <div>
              <label
                htmlFor="keywords"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Keywords *
              </label>
              <textarea
                id="keywords"
                value={keywords}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setKeywords(e.target.value)
                }
                placeholder="Enter search keywords (comma-separated for multiple)"
                required
                disabled={submitting}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Example: "machine learning, AI, neural networks" or "cancer
                treatment, drug discovery"
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Start Date (Optional)
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setStartDate(e.target.value)
                }
                disabled={submitting}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave blank to include all available articles
              </p>
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                End Date (Optional)
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEndDate(e.target.value)
                }
                disabled={submitting}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave blank to include all available articles
              </p>
            </div>

            {/* Number of Articles */}
            <div>
              <label
                htmlFor="numberOfArticles"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Number of Articles (Default: 500)
              </label>
              <input
                id="numberOfArticles"
                type="number"
                value={numberOfArticles}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNumberOfArticles(e.target.value)
                }
                min="1"
                max="10000"
                disabled={submitting}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum number of articles to fetch and analyze
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/20 dark:bg-red-900/10">
                <p className="text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600 text-white px-6 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating Job..." : "Generate Report"}
              </button>
              <Link href="/generate" className="flex-1">
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-gray-900 px-6 py-2 font-medium transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
              </Link>
            </div>
          </form>

          {/* Profile Management Link */}
          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700">
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Need to manage your LLM profiles?
            </p>
            <Link href="/profiles">
              <button className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-gray-900 px-4 py-2 text-sm font-medium transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600">
                🔐 Manage Profiles
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
