import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * GET /api/reports/pdf/[...path]
 * Serve PDF report files with proper content type and download headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;

    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Reconstruct the file path from array
    const filePath = path.join("/");

    // Validate path - ensure it doesn't go outside the reports directory
    if (filePath.includes("..") || filePath.includes("~")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Build full path to the file
    const fullPath = join(
      process.cwd(),
      "..",
      "..",
      "..",
      "shared",
      "reporting-framework",
      "reports",
      filePath
    );

    console.log("[API] Serving PDF file:", { filePath, fullPath });

    // Read the file as binary
    const fileContent = await readFile(fullPath);

    // Extract filename for download header
    const filename = path[path.length - 1] || "report.pdf";

    // Return with proper PDF content type and download headers
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[API] Error serving PDF file:", error);

    if (error instanceof Error && error.message.includes("ENOENT")) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: "Failed to serve file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
