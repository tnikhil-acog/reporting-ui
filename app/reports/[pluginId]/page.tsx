"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Report {
  pluginId: string;
  pluginName: string;
  reportName: string;
  reportBaseName: string;
  createdAt: string;
  createdAtIso: string;
}

export default function PluginReportsPage({
  params,
}: {
  params: Promise<{ pluginId: string }>;
}) {
  const [pluginId, setPluginId] = useState<string>("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setPluginId(resolvedParams.pluginId);
      fetchPluginReports(resolvedParams.pluginId);
    });
  }, [params]);

  const fetchPluginReports = async (plugId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reports?pluginId=${plugId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch reports");
      }

      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPluginIcon = (id: string) => {
    const icons: Record<string, string> = {
      patent: "📋",
      pubmed: "📚",
      staffing: "👥",
    };
    return icons[id] || "📄";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Link
              href="/reports"
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Reports
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="mb-4 inline-block">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading reports...
              </p>
            </div>
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
                href="/reports"
                className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to Reports
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {getPluginIcon(pluginId)} Reports
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {reports.length} report{reports.length !== 1 ? "s" : ""}{" "}
                available
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/20 dark:bg-red-900/10">
            <h2 className="font-semibold text-red-800 dark:text-red-300">
              Error
            </h2>
            <p className="mt-2 text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-slate-800">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              No reports available for this plugin yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Link
                key={`${report.pluginId}-${report.reportBaseName}`}
                href={`/reports/${report.pluginId}/${report.reportBaseName}/view`}
              >
                <div className="h-full rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 hover:scale-105 cursor-pointer">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {report.reportName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Generated on{" "}
                      {new Date(report.createdAtIso).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                    <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium pt-2">
                      <span>View Report</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
