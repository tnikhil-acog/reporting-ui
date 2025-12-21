"use client";

import Link from "next/link";

interface ReportCardProps {
  pluginId: string;
  pluginName: string;
  reportName: string;
  reportBaseName: string;
  createdAt: string;
}

export default function ReportCard({
  pluginId,
  pluginName,
  reportName,
  reportBaseName,
  createdAt,
}: ReportCardProps) {
  const getPluginIcon = (id: string) => {
    const icons: Record<string, string> = {
      patent: "📋",
      pubmed: "📚",
      staffing: "👥",
    };
    return icons[id] || "📄";
  };

  return (
    <Link href={`/reports/${pluginId}/${reportBaseName}`}>
      <div className="h-full rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 hover:scale-105">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 text-4xl">{getPluginIcon(pluginId)}</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {reportName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {pluginName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Generated on {createdAt}
            </p>
            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
              <span>View Report</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
