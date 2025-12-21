"use client";

export function ReportCardSkeleton() {
  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 h-8 w-8 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-700"></div>
        </div>
      </div>
    </div>
  );
}

export function ReportListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <ReportCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReportViewerSkeleton() {
  return (
    <div className="rounded-lg bg-white p-8 dark:bg-slate-800">
      <div className="space-y-4">
        <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700"></div>
        <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-700"></div>
        <div className="mt-6 h-64 rounded bg-gray-100 dark:bg-gray-700"></div>
      </div>
    </div>
  );
}
