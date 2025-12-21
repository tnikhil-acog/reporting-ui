import { promises as fs } from "fs";
import path from "path";

const REPORTS_DIR = "/shared/reporting-framework/reports";
const PLUGINS_REGISTRY = "/shared/reporting-framework/plugins.json";

export interface PluginInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ReportMetadata {
  pluginId: string;
  pluginName: string;
  reportName: string; // Display name (formatted)
  reportBaseName: string; // Actual filename (without extension)
  htmlPath: string;
  pdfPath: string;
  createdAt: Date;
}

interface PipelineMetadata {
  id: string;
  name: string;
  description?: string;
}

async function loadPipelinesRegistry(): Promise<PipelineMetadata[]> {
  try {
    const content = await fs.readFile(PLUGINS_REGISTRY, "utf-8");
    const registry = JSON.parse(content);
    return registry.plugins || [];
  } catch (error) {
    console.error("[ReportService] Failed to load plugins registry:", error);
    return [];
  }
}

/**
 * Get all available reports from the shared directory
 */
export async function getAvailableReports(): Promise<ReportMetadata[]> {
  try {
    const pipelines = await loadPipelinesRegistry();
    const pipelineMap = new Map(
      pipelines.map((p: PipelineMetadata) => [p.id, p])
    );

    const pluginDirs = await fs.readdir(REPORTS_DIR, { withFileTypes: true });
    const reports: ReportMetadata[] = [];

    for (const dir of pluginDirs) {
      if (!dir.isDirectory()) continue;

      const pluginId = dir.name;
      const reportDir = path.join(REPORTS_DIR, pluginId);

      try {
        const files = await fs.readdir(reportDir);

        // Group files by base name (without timestamp)
        const htmlFiles = files.filter((f) => f.endsWith(".html"));

        for (const htmlFile of htmlFiles) {
          const baseName = htmlFile.replace(".html", "");
          const pdfFile = `${baseName}.pdf`;

          // Extract report name from filename (remove timestamp)
          const reportName = baseName
            .replace(/_\d+$/, "") // Remove _timestamp
            .replace(/-/g, " ") // Replace hyphens with spaces
            .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize

          const htmlPath = path.join(reportDir, htmlFile);
          const pdfPath = path.join(reportDir, pdfFile);

          // Check if PDF exists
          try {
            await fs.access(pdfPath);
          } catch {
            continue; // Skip if PDF doesn't exist
          }

          const stats = await fs.stat(htmlPath);
          const pipelineMetadata = pipelineMap.get(pluginId) as
            | PipelineMetadata
            | undefined;

          reports.push({
            pluginId,
            pluginName: pipelineMetadata?.name || pluginId,
            reportName,
            reportBaseName: baseName, // Store actual filename
            htmlPath,
            pdfPath,
            createdAt: stats.mtime,
          });
        }
      } catch (err) {
        console.error(`Error reading reports for ${pluginId}:`, err);
      }
    }

    return reports.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  } catch (err) {
    console.error("Error reading reports directory:", err);
    return [];
  }
}

/**
 * Get HTML content of a specific report
 */
export async function getReportHtml(pluginId: string): Promise<string | null> {
  try {
    const reportDir = path.join(REPORTS_DIR, pluginId);
    const files = await fs.readdir(reportDir);
    const htmlFile = files.find((f) => f.endsWith(".html"));

    if (!htmlFile) return null;

    const htmlPath = path.join(reportDir, htmlFile);
    const content = await fs.readFile(htmlPath, "utf-8");
    return content;
  } catch (err) {
    console.error(`Error reading HTML for plugin ${pluginId}:`, err);
    return null;
  }
}

/**
 * Get PDF file path for download
 */
export async function getReportPdfPath(
  pluginId: string
): Promise<string | null> {
  try {
    const reportDir = path.join(REPORTS_DIR, pluginId);
    const files = await fs.readdir(reportDir);
    const pdfFile = files.find((f) => f.endsWith(".pdf"));

    if (!pdfFile) return null;

    return path.join(reportDir, pdfFile);
  } catch (err) {
    console.error(`Error finding PDF for plugin ${pluginId}:`, err);
    return null;
  }
}

/**
 * Get plugin name from registry (dynamic, not hardcoded)
 */
async function getPluginName(pluginId: string): Promise<string> {
  try {
    const content = await fs.readFile(PLUGINS_REGISTRY, "utf-8");
    const registry = JSON.parse(content);

    if (Array.isArray(registry.plugins)) {
      const plugin = registry.plugins.find((p: any) => p.id === pluginId);
      if (plugin && plugin.name) {
        return plugin.name;
      }
    }
  } catch (err) {
    console.warn(`Could not read plugin registry for ${pluginId}:`, err);
  }

  // Fallback: capitalize plugin ID if registry is unavailable
  return pluginId.charAt(0).toUpperCase() + pluginId.slice(1);
}

/**
 * Get formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
