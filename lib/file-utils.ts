/**
 * Convert a file path like '/shared/reporting-framework/reports/pubmed/covid-19.html'
 * to an API endpoint like '/api/reports/pubmed/covid-19?format=html'
 */
export function filePathToApiUrl(
  filePath: string,
  type: "html" | "pdf"
): string {
  if (!filePath) return "";

  // Extract the relevant part after 'reports/'
  const reportsIndex = filePath.indexOf("reports/");
  if (reportsIndex === -1) {
    console.warn("[FileUtils] Could not find 'reports/' in path:", filePath);
    return filePath; // Fall back to original path
  }

  const relativePath = filePath.substring(reportsIndex + 8); // 8 = length of 'reports/'

  // Extract pluginId (first directory) and report name (file without extension)
  const parts = relativePath.split("/");
  if (parts.length < 2) {
    console.warn("[FileUtils] Invalid report path structure:", relativePath);
    return filePath;
  }

  const pluginId = parts[0];
  const fileName = parts[1];
  const reportName = fileName.replace(/\.(html|pdf)$/, ""); // Remove file extension

  return `/api/reports/${pluginId}/${reportName}?format=${type}`;
}
