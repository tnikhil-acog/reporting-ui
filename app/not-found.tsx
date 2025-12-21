"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
          404
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          Report not found
        </p>
        <p className="mt-2 text-gray-500 dark:text-gray-500">
          The report you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          ← Back to Reports
        </Link>
      </div>
    </div>
  );
}
