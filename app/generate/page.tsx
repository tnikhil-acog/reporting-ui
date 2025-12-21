"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Pipeline {
  id: string;
  name: string;
  description: string;
}

export default function SelectPipelinePage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPipeline, setSelectedPipeline] = useState("");

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await fetch("/api/plugins");
        const data = await response.json();

        if (data.success && data.plugins) {
          setPipelines(data.plugins);
        }
      } catch (error) {
        console.error("Error fetching pipelines:", error);
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

  const getPipelineIcon = (id: string) => {
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
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
            >
              ← Back Home
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Generate Report
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow-lg dark:bg-slate-800 p-8">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  1
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Step 1 of 2
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Select Pipeline
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Choose the type of report you want to generate
            </label>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {pipelines.map((pipeline) => (
                  <button
                    key={pipeline.id}
                    onClick={() => setSelectedPipeline(pipeline.id)}
                    className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                      selectedPipeline === pipeline.id
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">
                        {getPipelineIcon(pipeline.id)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {pipeline.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pipeline.description}
                        </p>
                      </div>
                      {selectedPipeline === pipeline.id && (
                        <div className="text-blue-600 dark:text-blue-400">
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!selectedPipeline}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
