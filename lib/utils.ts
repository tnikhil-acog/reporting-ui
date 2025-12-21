/**
 * Get a visually distinct color for each report type (dynamic)
 */
export function getReportColor(pluginId: string): string {
  // Color palette for different plugins
  const colorPalette = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-blue-500",
    "from-teal-500 to-cyan-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
  ];

  // Generate hash from plugin ID for consistent color assignment
  let hash = 0;
  for (let i = 0; i < pluginId.length; i++) {
    const char = pluginId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

/**
 * Get a gradient background class for report cards
 */
export function getReportGradient(pluginId: string): string {
  return `bg-gradient-to-br ${getReportColor(pluginId)}`;
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Truncate text to a specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}
