"use client";

import { useState, useEffect, FormEvent, ChangeEvent, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  Hash,
  FileText,
  Settings,
} from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function GeneratePluginPage({
  params,
}: {
  params: Promise<{ pluginId: string }>;
}) {
  const { pluginId } = use(params);
  const router = useRouter();
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
    fetchPlugin(pluginId);
  }, [pluginId]);

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
      <div className="flex min-h-screen flex-col bg-background">
        <Navigation />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading plugin details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !plugin) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navigation />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full rounded-xl border border-destructive/50 bg-destructive/10 p-6"
          >
            <h2 className="font-semibold text-destructive mb-2">Error</h2>
            <p className="text-sm text-destructive/90 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push("/generate")}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Pipelines</span>
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-3xl"
        >
          {/* Header */}
          <motion.div variants={item} className="mb-8 text-center">
            <Link
              href="/generate"
              className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Pipelines</span>
            </Link>

            <h1 className="mb-2 text-4xl font-bold sm:text-5xl">
              <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                {plugin?.name}
              </span>
            </h1>
            <p className="text-muted-foreground">{plugin?.description}</p>
            {plugin?.version && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                v{plugin.version}
              </p>
            )}
          </motion.div>

          {/* Main Card */}
          <motion.div
            variants={item}
            className="rounded-2xl border bg-card/50 backdrop-blur-sm p-8 md:p-10 shadow-sm"
          >
            {/* Step Indicator */}
            <div className="mb-10">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-primary-foreground shadow-sm">
                  2
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Step 2 of 2</p>
                  <p className="text-xl font-semibold text-foreground">
                    Configure Report
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Name */}
              <motion.div variants={item}>
                <label
                  htmlFor="reportName"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"
                >
                  <FileText className="h-4 w-4 text-primary" />
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
                  className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  This will be used as the title for your report
                </p>
              </motion.div>

              {/* Keywords */}
              <motion.div variants={item}>
                <label
                  htmlFor="keywords"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
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
                  className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 resize-none"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Example: "machine learning, AI, neural networks" or "cancer
                  treatment, drug discovery"
                </p>
              </motion.div>

              {/* Date Range */}
              <motion.div
                variants={item}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label
                    htmlFor="startDate"
                    className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"
                  >
                    <Calendar className="h-4 w-4 text-primary" />
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setStartDate(e.target.value)
                    }
                    disabled={submitting}
                    className="w-full rounded-lg border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"
                  >
                    <Calendar className="h-4 w-4 text-primary" />
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setEndDate(e.target.value)
                    }
                    disabled={submitting}
                    className="w-full rounded-lg border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>
              </motion.div>

              {/* Number of Articles */}
              <motion.div variants={item}>
                <label
                  htmlFor="numberOfArticles"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"
                >
                  <Hash className="h-4 w-4 text-primary" />
                  Number of Articles
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
                  className="w-full rounded-lg border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Maximum: 10,000 articles (Default: 500)
                </p>
              </motion.div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-destructive/50 bg-destructive/10 p-4"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              {/* Submit Buttons */}
              <motion.div variants={item} className="flex gap-3 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="group flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      <span>Creating Job...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Generate Report</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/generate")}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </motion.div>
            </form>

            {/* Profile Management */}
            <motion.div
              variants={item}
              className="mt-8 border-t pt-6 text-center"
            >
              <p className="mb-3 text-sm text-muted-foreground">
                Need to configure your LLM profiles?
              </p>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hover:bg-accent/10"
              >
                <Link href="/profiles">
                  <Settings className="h-4 w-4" />
                  <span>Manage Profiles</span>
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
