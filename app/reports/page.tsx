"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Report {
  pluginId: string;
  pluginName: string;
  reportName: string;
  reportBaseName: string;
  createdAt: string;
}

interface PluginWithCount {
  pluginId: string;
  pluginName: string;
  count: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [plugins, setPlugins] = useState<PluginWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/reports");
        const data = await response.json();

        if (data.success) {
          setReports(data.reports);

          // Group reports by plugin
          const pluginMap = new Map<string, PluginWithCount>();

          for (const report of data.reports) {
            if (!pluginMap.has(report.pluginId)) {
              pluginMap.set(report.pluginId, {
                pluginId: report.pluginId,
                pluginName: report.pluginName,
                count: 0,
              });
            }
            const plugin = pluginMap.get(report.pluginId)!;
            plugin.count += 1;
          }

          setPlugins(Array.from(pluginMap.values()));
        } else {
          setError("Failed to load reports");
        }
      } catch (err) {
        setError("Error fetching reports");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const getPluginIcon = (id: string) => {
    const icons: Record<string, string> = {
      patent: "📋",
      pubmed: "📚",
      staffing: "👥",
    };
    return icons[id] || "📄";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                📊 Reports by Plugin
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a plugin to view its reports
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                ✨ {plugins.length} Plugins
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
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
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/20 dark:bg-red-900/10">
            <h2 className="font-semibold text-red-800 dark:text-red-300">
              Error
            </h2>
            <p className="mt-2 text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : plugins.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-slate-800">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              No reports available yet. Generate your first report using the
              CLI.
            </p>
            <code className="rounded bg-gray-100 px-4 py-2 text-sm dark:bg-gray-700">
              framework-cli run &lt;plugin&gt; -i &lt;input-file&gt;
            </code>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plugins.map((plugin) => (
              <Link key={plugin.pluginId} href={`/reports/${plugin.pluginId}`}>
                <div className="h-full rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 hover:scale-105 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 text-4xl">
                        {getPluginIcon(plugin.pluginId)}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {plugin.pluginName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {plugin.count}{" "}
                        {plugin.count === 1 ? "report" : "reports"} available
                      </p>
                      <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                        <span>View Reports</span>
                        <span>→</span>
                      </div>
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
