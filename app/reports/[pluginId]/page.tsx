"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileText, Loader2, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface Report {
  pluginId: string;
  pluginName: string;
  reportName: string;
  reportBaseName: string;
  createdAt: string;
  createdAtIso: string;
}

const PLUGIN_ICONS: Record<string, string> = {
  patent: "📋",
  pubmed: "📚",
  staffing: "👥",
  default: "📄",
};

export default function PluginReportsPage({
  params,
}: {
  params: Promise<{ pluginId: string }>;
}) {
  const [pluginId, setPluginId] = useState<string>("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    params.then((resolvedParams) => {
      setPluginId(resolvedParams.pluginId);
      fetchPluginReports(resolvedParams.pluginId);
    });

    return () => {
      isMountedRef.current = false;
    };
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
    return PLUGIN_ICONS[id] || PLUGIN_ICONS.default;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navigation />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading reports...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Header */}
            <motion.div variants={item}>
              <Link
                href="/reports"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 mb-4 transition-colors"
              >
                ← Back to Reports
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getPluginIcon(pluginId)}</span>
                    <h1 className="text-4xl font-bold text-foreground">
                      {pluginId.charAt(0).toUpperCase() + pluginId.slice(1)}{" "}
                      Reports
                    </h1>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {reports.length} report{reports.length !== 1 ? "s" : ""}{" "}
                    available
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                variants={item}
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-destructive">
                    Error
                  </h3>
                  <p className="mt-1 text-sm text-destructive">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!error && reports.length === 0 && (
              <motion.div
                variants={item}
                className="rounded-2xl border border-dashed bg-card/50 p-12 text-center"
              >
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No reports available for this pipeline yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate a report to see it here
                </p>
                <Button
                  asChild
                  className="mt-6 bg-gradient-to-r from-primary to-secondary"
                >
                  <Link href="/generate">Generate Report</Link>
                </Button>
              </motion.div>
            )}

            {/* Reports Grid */}
            {!error && reports.length > 0 && (
              <motion.div
                variants={container}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {reports.map((report) => (
                  <motion.div
                    key={`${report.pluginId}-${report.reportBaseName}`}
                    variants={item}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      href={`/reports/${report.pluginId}/${report.reportBaseName}/view`}
                    >
                      <div className="group h-full rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer">
                        <div className="space-y-3">
                          {/* Report Name */}
                          <h3 className="text-lg font-semibold text-card-foreground line-clamp-2">
                            {report.reportName}
                          </h3>

                          {/* Date */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
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
                            </span>
                          </div>

                          {/* Link */}
                          <div className="inline-flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all pt-2">
                            <span>View Report</span>
                            <span className="transition-transform group-hover:translate-x-1">
                              →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
