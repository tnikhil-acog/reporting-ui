/**
 * GET /api/reports/[pluginId]/[name]
 * Fetch a specific report by plugin ID and report name
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const REPORTS_DIR =
  process.env.REPORTS_DIR || "/shared/reporting-framework/reports";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pluginId: string; name: string }> }
) {
  try {
    const { pluginId, name } = await params;

    console.log(`[API] Fetching report: ${pluginId}/${name}`);

    // Sanitize inputs
    if (!pluginId || !name) {
      return NextResponse.json(
        { error: "Missing required parameters: pluginId and name" },
        { status: 400 }
      );
    }

    // Construct report directory path
    const reportDir = path.join(REPORTS_DIR, pluginId);

    // Check if directory exists
    try {
      await fs.access(reportDir);
    } catch (error) {
      return NextResponse.json(
        { error: `No reports found for plugin: ${pluginId}` },
        { status: 404 }
      );
    }

    // List files in the directory
    const files = await fs.readdir(reportDir);

    // Find files matching the report name
    const matchingFiles = files.filter(
      (f) => f.startsWith(name) && !f.includes("_bundle")
    );

    if (matchingFiles.length === 0) {
      return NextResponse.json(
        { error: `Report not found: ${name}` },
        { status: 404 }
      );
    }

    // Get the most recent file (by timestamp in filename)
    const sortedFiles = matchingFiles.sort().reverse();
    const htmlFile = sortedFiles.find((f) => f.endsWith(".html"));
    const mdFile = sortedFiles.find((f) => f.endsWith(".md"));
    const pdfFile = sortedFiles.find((f) => f.endsWith(".pdf"));

    if (!htmlFile && !mdFile) {
      return NextResponse.json(
        { error: "No viewable report files found" },
        { status: 404 }
      );
    }

    // Return report metadata and paths
    const report = {
      pluginId,
      name,
      files: {
        html: htmlFile ? path.join(reportDir, htmlFile) : null,
        md: mdFile ? path.join(reportDir, mdFile) : null,
        pdf: pdfFile ? path.join(reportDir, pdfFile) : null,
      },
      urls: {
        html: htmlFile ? `/api/reports/${pluginId}/${htmlFile}` : null,
        md: mdFile ? `/api/reports/${pluginId}/${mdFile}` : null,
        pdf: pdfFile ? `/api/reports/${pluginId}/${pdfFile}` : null,
      },
    };

    // If format is requested, serve the file directly
    const format = request.nextUrl.searchParams.get("format");
    if (format) {
      let filePath: string | null = null;
      let contentType = "text/html";

      if (format === "html" && htmlFile) {
        filePath = path.join(reportDir, htmlFile);
        contentType = "text/html";
      } else if (format === "md" && mdFile) {
        filePath = path.join(reportDir, mdFile);
        contentType = "text/markdown";
      } else if (format === "pdf" && pdfFile) {
        filePath = path.join(reportDir, pdfFile);
        contentType = "application/pdf";
      }

      if (filePath) {
        const content = await fs.readFile(filePath);
        return new NextResponse(content, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `inline; filename="${path.basename(
              filePath
            )}"`,
          },
        });
      }

      return NextResponse.json(
        { error: `Format not available: ${format}` },
        { status: 404 }
      );
    }

    // Return metadata
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("[API] Error fetching report:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
