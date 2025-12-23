"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Home,
  RefreshCw,
} from "lucide-react";

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
              router.push(`/jobs`);
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "queued":
        return {
          icon: Clock,
          label: "Queued",
          message: "Your report is in the queue...",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          borderColor: "border-yellow-300 dark:border-yellow-800",
          textColor: "text-yellow-700 dark:text-yellow-400",
          badgeBg: "bg-yellow-100 dark:bg-yellow-900",
          progressColor: "bg-yellow-500",
        };
      case "processing":
        return {
          icon: Loader2,
          label: "Processing",
          message: "Fetching data and generating report...",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          borderColor: "border-blue-300 dark:border-blue-800",
          textColor: "text-blue-700 dark:text-blue-400",
          badgeBg: "bg-blue-100 dark:bg-blue-900",
          progressColor: "bg-blue-500",
          iconClass: "animate-spin",
        };
      case "completed":
        return {
          icon: CheckCircle2,
          label: "Completed",
          message: "Report generated successfully! Redirecting...",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          borderColor: "border-green-300 dark:border-green-800",
          textColor: "text-green-700 dark:text-green-400",
          badgeBg: "bg-green-100 dark:bg-green-900",
          progressColor: "bg-green-500",
        };
      case "failed":
        return {
          icon: XCircle,
          label: "Failed",
          message: "Report generation failed",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-300 dark:border-red-800",
          textColor: "text-red-700 dark:text-red-400",
          badgeBg: "bg-red-100 dark:bg-red-900",
          progressColor: "bg-red-500",
        };
      default:
        return {
          icon: Clock,
          label: "Processing",
          message: "Processing...",
          bgColor: "bg-muted/50",
          borderColor: "border-border",
          textColor: "text-muted-foreground",
          badgeBg: "bg-muted",
          progressColor: "bg-primary",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground text-lg">
              Loading job status...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Job Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              The job you're looking for doesn't exist
            </p>
            <Button asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const config = getStatusConfig(job.status);
  const StatusIcon = config.icon;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-center mb-2">
              <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Report Generation Status
              </span>
            </h1>
            <p className="text-center text-muted-foreground">
              Track your report generation progress in real-time
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-8 shadow-lg`}
          >
            {/* Status Icon - Centered */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className={`p-6 rounded-full ${config.badgeBg} mb-4`}
              >
                <StatusIcon
                  className={`h-16 w-16 ${config.textColor} ${
                    config.iconClass || ""
                  }`}
                />
              </motion.div>
              <h2
                className={`text-3xl font-bold ${config.textColor} mb-2 text-center`}
              >
                {config.label}
              </h2>
              <p className="text-lg text-muted-foreground text-center">
                {config.message}
              </p>
            </div>

            {/* Report Name */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground">
                {job.reportName}
              </h3>
            </div>

            {/* Progress Bar */}
            {job.status !== "failed" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {job.progress}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${job.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full ${config.progressColor} rounded-full shadow-sm`}
                  ></motion.div>
                </div>
              </motion.div>
            )}

            {/* Job Details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-xl p-6 space-y-4 border shadow-sm mb-8"
            >
              <h4 className="font-semibold text-foreground text-lg mb-4">
                Job Details
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground font-medium">
                    Job ID:
                  </span>
                  <span className="text-sm font-mono text-foreground bg-muted px-2 py-1 rounded">
                    {job.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground font-medium">
                    Pipeline:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {job.pipelineId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground font-medium">
                    Created:
                  </span>
                  <span className="text-sm text-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </span>
                </div>
                {job.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground font-medium">
                      Completed:
                    </span>
                    <span className="text-sm text-foreground">
                      {new Date(job.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Error Message */}
            {job.status === "failed" && job.error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8 bg-destructive/10 border-2 border-destructive/50 rounded-xl p-6"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-2">
                      Error Details:
                    </h3>
                    <p className="text-sm text-destructive/90">{job.error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4 justify-center pt-4"
            >
              <Button variant="outline" size="lg" asChild>
                <Link href="/jobs">
                  <Home className="h-5 w-5" />
                  <span>View All Jobs</span>
                </Link>
              </Button>
              {job.status === "failed" && (
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                >
                  <Link href="/generate">
                    <RefreshCw className="h-5 w-5" />
                    <span>Try Again</span>
                  </Link>
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
