"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              📊 Report Hub
            </h1>
            <Link href="/profiles">
              <button className="inline-flex items-center gap-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 text-sm font-medium transition-colors dark:bg-slate-700 dark:hover:bg-slate-600">
                <span>🔐</span>
                <span>Manage Profiles</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h2 className="mb-6 text-5xl font-bold text-gray-900 dark:text-white sm:text-6xl">
              AI-Powered Report Generation
            </h2>
            <p className="mb-8 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Generate comprehensive analysis reports using advanced language
              models. Simply provide keywords and filters, and let our AI do the
              heavy lifting.
            </p>

            {/* Features Grid */}
            <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                <div className="mb-3 text-4xl">🔍</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Smart Search
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Fetch data from external sources using keywords
                </p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                <div className="mb-3 text-4xl">🤖</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI Analysis
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  LLM-powered insights and summaries
                </p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                <div className="mb-3 text-4xl">📥</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Export Options
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Download as HTML or PDF
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/generate">
                <button className="w-full sm:w-auto inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600">
                  <span>✨</span>
                  <span>Generate Report</span>
                  <span>→</span>
                </button>
              </Link>

              <Link href="/jobs">
                <button className="w-full sm:w-auto inline-flex items-center gap-2 rounded-lg bg-purple-600 border-2 border-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:bg-purple-700 hover:shadow-lg active:scale-95 dark:bg-purple-500 dark:border-purple-500 dark:hover:bg-purple-600">
                  <span>📋</span>
                  <span>My Jobs</span>
                </button>
              </Link>

              <Link href="/reports">
                <button className="w-full sm:w-auto inline-flex items-center gap-2 rounded-lg bg-white border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-lg active:scale-95 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                  <span>📖</span>
                  <span>View Reports</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div>
                <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Select Pipeline
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Choose from patent analysis, medical literature, or staffing
                  reports
                </p>
              </div>
              <div>
                <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Enter Keywords
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Provide search terms, date ranges, and filters for your
                  analysis
                </p>
              </div>
              <div>
                <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-4">
                  3
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Get Your Report
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  AI generates comprehensive analysis with insights and
                  visualizations
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
