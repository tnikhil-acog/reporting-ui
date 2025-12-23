"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

interface Pipeline {
  id: string;
  name: string;
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

export default function SelectPipelinePage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPipeline, setSelectedPipeline] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await fetch("/api/plugins");
        const data = await response.json();

        if (data.success && data.plugins) {
          setPipelines(data.plugins);
        } else {
          setError(data.error || "Failed to fetch pipelines");
        }
      } catch (error) {
        console.error("Error fetching pipelines:", error);
        setError("Unable to load pipelines. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPipelines();
  }, []);

  const handleContinue = () => {
    if (selectedPipeline) {
      router.push(`/generate/${selectedPipeline}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <motion.div variants={item} className="mb-8 text-center">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Back Home</span>
            </Link>

            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
              <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Generate Report
              </span>
            </h1>
            <p className="text-muted-foreground">
              Select a pipeline to get started
            </p>
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
                  1
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Step 1 of 2</p>
                  <p className="text-xl font-semibold text-foreground">
                    Select Pipeline
                  </p>
                </div>
              </div>
            </div>

            {/* Pipeline Selection */}
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-foreground mb-6">
                  Choose the type of report you want to generate
                </h2>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                  </div>
                ) : error ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-destructive/50 bg-destructive/10 p-6"
                  >
                    <div className="flex items-start gap-3">
                      <svg
                        className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-destructive mb-1">
                          Error Loading Pipelines
                        </h3>
                        <p className="text-sm text-destructive/90 mb-3">
                          {error}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.reload()}
                          className="hover:bg-destructive/20"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          <span>Retry</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : pipelines.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border bg-muted/30 p-12 text-center"
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-foreground font-semibold mb-1">
                      No pipelines available
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please contact your administrator to set up pipelines.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    {pipelines.map((pipeline) => (
                      <motion.button
                        key={pipeline.id}
                        variants={item}
                        whileHover={{
                          y: -4,
                          transition: { duration: 0.2, ease: "easeOut" },
                        }}
                        onClick={() => setSelectedPipeline(pipeline.id)}
                        className={`group relative w-full text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                          selectedPipeline === pipeline.id
                            ? "border-primary bg-card shadow-md hover:shadow-lg"
                            : "border-border bg-card hover:border-primary/30 shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start gap-5">
                          <div
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg font-semibold transition-all shadow-sm ${
                              selectedPipeline === pipeline.id
                                ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {getInitials(pipeline.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
                              {pipeline.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {pipeline.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {selectedPipeline === pipeline.id ? (
                              <CheckCircle2 className="h-6 w-6 text-primary" />
                            ) : (
                              <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Continue Button - Now always shows when pipelines are loaded */}
              {!loading && !error && pipelines.length > 0 && (
                <motion.div
                  variants={item}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-end pt-6 border-t"
                >
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedPipeline}
                    size="lg"
                    className="group bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
