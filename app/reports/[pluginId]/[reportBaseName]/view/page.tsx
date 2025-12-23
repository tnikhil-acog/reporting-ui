"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function ReportViewerPage({
  params,
}: {
  params: Promise<{ pluginId: string; reportBaseName: string }>;
}) {
  const [pluginId, setPluginId] = useState<string>("");
  const [reportBaseName, setReportBaseName] = useState<string>("");
  const [reportTitle, setReportTitle] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    params.then((resolvedParams) => {
      setPluginId(resolvedParams.pluginId);
      setReportBaseName(resolvedParams.reportBaseName);
      fetchReport(resolvedParams.pluginId, resolvedParams.reportBaseName);
    });

    return () => {
      isMountedRef.current = false;
    };
  }, [params]);

  const fetchReport = async (plugId: string, reportBase: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/reports/${plugId}/${reportBase}?format=html`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      let html = await response.text();

      // Strip out max-width and centering styles from the HTML
      html = html.replace(/max-width\s*:\s*[^;]+;?/gi, "");
      html = html.replace(/margin\s*:\s*[^;]*auto[^;]*;?/gi, "");
      html = html.replace(/margin-left\s*:\s*auto;?/gi, "");
      html = html.replace(/margin-right\s*:\s*auto;?/gi, "");

      setHtmlContent(html);

      // Extract title from HTML if present
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        setReportTitle(titleMatch[1]);
      } else {
        setReportTitle(reportBase);
      }
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
      <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
        <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-slate-700" />
              <Link href={`/reports/${pluginId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading report...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
        <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-slate-700" />
              <Link href={`/reports/${pluginId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
          <div className="rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950 p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                Error Loading Report
              </h3>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      {/* Global Styles for Report Content */}
      <style jsx global>{`
        /* Force full width - override any inline styles */
        .report-content * {
          max-width: 100% !important;
        }

        .report-content {
          color: #374151;
          width: 100%;
        }

        .dark .report-content {
          color: #d1d5db;
        }

        .report-content h1,
        .report-content h2,
        .report-content h3,
        .report-content h4,
        .report-content h5,
        .report-content h6 {
          color: #111827 !important;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
        }

        .dark .report-content h1,
        .dark .report-content h2,
        .dark .report-content h3,
        .dark .report-content h4,
        .dark .report-content h5,
        .dark .report-content h6 {
          color: #f3f4f6 !important;
        }

        .report-content h1 {
          font-size: 2em;
        }
        .report-content h2 {
          font-size: 1.5em;
        }
        .report-content h3 {
          font-size: 1.25em;
        }
        .report-content h4 {
          font-size: 1.1em;
        }

        .report-content p {
          line-height: 1.7;
          margin-bottom: 1em;
          color: #374151;
        }

        .dark .report-content p {
          color: #d1d5db;
        }

        .report-content a {
          color: #2563eb !important;
          text-decoration: none;
          font-weight: 500;
        }

        .dark .report-content a {
          color: #60a5fa !important;
        }

        .report-content a:hover {
          text-decoration: underline;
        }

        .report-content strong,
        .report-content b {
          color: #111827;
          font-weight: 600;
        }

        .dark .report-content strong,
        .dark .report-content b {
          color: #f3f4f6;
        }

        .report-content em,
        .report-content i {
          color: #4b5563;
        }

        .dark .report-content em,
        .dark .report-content i {
          color: #d1d5db;
        }

        .report-content code {
          background: #f3f4f6;
          color: #111827;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: ui-monospace, monospace;
        }

        .dark .report-content code {
          background: #1e293b;
          color: #f1f5f9;
        }

        .report-content pre {
          background: #f3f4f6;
          color: #111827;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5em 0;
          border: 1px solid #e5e7eb;
        }

        .dark .report-content pre {
          background: #1e293b;
          color: #f1f5f9;
          border-color: #334155;
        }

        .report-content pre code {
          background: transparent !important;
          padding: 0;
        }

        .report-content ul,
        .report-content ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
          color: #374151;
        }

        .dark .report-content ul,
        .dark .report-content ol {
          color: #d1d5db;
        }

        .report-content li {
          margin-bottom: 0.5em;
          color: #374151;
        }

        .dark .report-content li {
          color: #d1d5db;
        }

        .report-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1.5em 0;
          color: #6b7280;
          font-style: italic;
        }

        .dark .report-content blockquote {
          border-color: #475569;
          color: #94a3b8;
        }

        .report-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          border: 1px solid #e5e7eb;
        }

        .dark .report-content table {
          border-color: #334155;
        }

        .report-content thead {
          background: #f9fafb;
        }

        .dark .report-content thead {
          background: #1e293b;
        }

        .report-content th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #111827;
          border: 1px solid #e5e7eb;
        }

        .dark .report-content th {
          color: #f3f4f6;
          border-color: #334155;
        }

        .report-content td {
          padding: 0.75rem 1rem;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .dark .report-content td {
          color: #d1d5db;
          border-color: #334155;
        }

        .report-content tr {
          border-bottom: 1px solid #e5e7eb;
        }

        .dark .report-content tr {
          border-color: #334155;
        }

        .report-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5em 0;
        }

        .report-content hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 2em 0;
        }

        .dark .report-content hr {
          border-color: #334155;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Navigation */}
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-slate-700" />
              <Link href={`/reports/${pluginId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Reports
                </Button>
              </Link>
            </div>

            {/* Center: Report Title (on larger screens) */}
            <div className="hidden md:block flex-1 text-center px-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {reportTitle}
              </h2>
            </div>

            {/* Right: Download Button */}
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>
          </div>

          {/* Mobile Title */}
          <div className="md:hidden mt-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {reportTitle}
            </h2>
          </div>
        </div>
      </header>

      {/* Content - Absolutely Full Width, No Constraints */}
      <main className="flex-1 bg-white dark:bg-slate-900">
        <div
          className="report-content"
          style={{ padding: "2rem", width: "100%", boxSizing: "border-box" }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </main>
    </div>
  );
}
