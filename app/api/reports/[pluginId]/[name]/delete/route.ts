/**
 * DELETE /api/reports/[pluginId]/[name]
 * Delete a specific report by plugin ID and report name
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const REPORTS_DIR =
  process.env.REPORTS_DIR || "/shared/reporting-framework/reports";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pluginId: string; name: string }> }
) {
  try {
    const { pluginId, name } = await params;

    console.log(`[API] Deleting report: ${pluginId}/${name}`);

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

    // Find all files matching the report name (including bundle)
    const matchingFiles = files.filter((f) => f.startsWith(name));

    if (matchingFiles.length === 0) {
      return NextResponse.json(
        { error: `Report not found: ${name}` },
        { status: 404 }
      );
    }

    // Delete all matching files
    const deletedFiles: string[] = [];
    for (const file of matchingFiles) {
      const filePath = path.join(reportDir, file);
      await fs.unlink(filePath);
      deletedFiles.push(file);
      console.log(`[API] Deleted: ${file}`);
    }

    // Check if directory is empty and remove it
    const remainingFiles = await fs.readdir(reportDir);
    if (remainingFiles.length === 0) {
      await fs.rmdir(reportDir);
      console.log(`[API] Removed empty directory: ${pluginId}`);
    }

    return NextResponse.json({
      success: true,
      message: `Report deleted: ${name}`,
      deletedFiles,
    });
  } catch (error) {
    console.error("[API] Error deleting report:", error);
    return NextResponse.json(
      {
        error: "Failed to delete report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
