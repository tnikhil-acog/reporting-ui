"use client";

import { useEffect, useState, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileText, Loader2, AlertCircle } from "lucide-react";
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
}

interface PluginWithCount {
  pluginId: string;
  pluginName: string;
  count: number;
}

const PLUGIN_ICONS: Record<string, string> = {
  patent: "📋",
  pubmed: "📚",
  staffing: "👥",
  default: "📄",
};

const PLUGIN_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  patent: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-600",
  },
  pubmed: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-600",
  },
  staffing: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-600",
  },
  default: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    text: "text-gray-600",
  },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [plugins, setPlugins] = useState<PluginWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    fetchReports();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/reports");
      const data = await response.json();

      if (data.success) {
        setReports(data.reports || []);

        // Group reports by plugin
        const pluginMap = new Map<string, PluginWithCount>();

        for (const report of data.reports || []) {
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
        throw new Error("Failed to load reports");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPluginIcon = (id: string) => {
    return PLUGIN_ICONS[id] || PLUGIN_ICONS.default;
  };

  const getPluginColors = (id: string) => {
    return PLUGIN_COLORS[id] || PLUGIN_COLORS.default;
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
            <motion.div
              variants={item}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-bold text-foreground">
                  Reports by Pipeline
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Browse reports organized by the pipeline used to generate them
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary">
                  <FileText className="h-4 w-4 mr-2" />
                  {plugins.length}{" "}
                  {plugins.length === 1 ? "Pipeline" : "Pipelines"}
                </span>
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
            {!error && plugins.length === 0 && (
              <motion.div
                variants={item}
                className="rounded-2xl border border-dashed bg-card/50 p-12 text-center"
              >
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No reports available yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate your first report using the CLI or the generation
                  page
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    <Link href="/generate">Generate Report</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/jobs">View Jobs</Link>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Plugin Cards */}
            {!error && plugins.length > 0 && (
              <motion.div
                variants={container}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {plugins.map((plugin) => {
                  const colors = getPluginColors(plugin.pluginId);
                  return (
                    <motion.div
                      key={plugin.pluginId}
                      variants={item}
                      whileHover={{ y: -4 }}
                    >
                      <Link href={`/reports/${plugin.pluginId}`}>
                        <div className="group h-full rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer">
                          <div className="space-y-4">
                            {/* Icon */}
                            <div
                              className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${colors.bg} border ${colors.border}`}
                            >
                              <span className="text-3xl">
                                {getPluginIcon(plugin.pluginId)}
                              </span>
                            </div>

                            {/* Content */}
                            <div>
                              <h3 className="text-xl font-semibold text-card-foreground mb-2">
                                {plugin.pluginName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {plugin.count}{" "}
                                {plugin.count === 1 ? "report" : "reports"}{" "}
                                available
                              </p>
                            </div>

                            {/* Link */}
                            <div className="inline-flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                              <span>View Reports</span>
                              <span className="transition-transform group-hover:translate-x-1">
                                →
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
