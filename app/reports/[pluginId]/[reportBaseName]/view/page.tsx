"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ReportViewerPage({
  params,
}: {
  params: Promise<{ pluginId: string; reportBaseName: string }>;
}) {
  const [pluginId, setPluginId] = useState<string>("");
  const [reportBaseName, setReportBaseName] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    params.then((resolvedParams) => {
      setPluginId(resolvedParams.pluginId);
      setReportBaseName(resolvedParams.reportBaseName);
      fetchReport(resolvedParams.pluginId, resolvedParams.reportBaseName);
    });
  }, [params]);

  const fetchReport = async (plugId: string, reportBase: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch HTML content
      const response = await fetch(
        `/api/reports/${plugId}/${reportBase}?format=html`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      const html = await response.text();
      setHtmlContent(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);

      const response = await fetch(
        `/api/reports/${pluginId}/${reportBaseName}?format=pdf`
      );

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportBaseName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        "Failed to download PDF: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
      console.error("Error downloading PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Link
              href={`/reports/${pluginId}`}
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
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
                Loading report...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Link
              href={`/reports/${pluginId}`}
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              ← Back to Reports
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
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/reports/${pluginId}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">
              {reportBaseName}
            </h1>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <span>⬇️</span>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900 dark:text-neutral-200 shadow-sm">
          <div
            className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-gray-700 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-slate-800 prose-pre:border dark:prose-pre:border-slate-700 prose-table:border-gray-300 dark:prose-table:border-slate-700 prose-th:bg-gray-100 dark:prose-th:bg-slate-800 prose-th:text-gray-900 dark:prose-th:text-white prose-td:border-gray-300 dark:prose-td:border-slate-700"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </main>
    </div>
  );
}
