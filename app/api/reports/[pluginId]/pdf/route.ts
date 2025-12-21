import { getReportPdfPath } from "@/lib/report-service";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  try {
    const { pluginId } = await params;

    // Validate plugin ID to prevent directory traversal
    if (!pluginId || pluginId.includes("..") || pluginId.includes("/")) {
      return NextResponse.json({ error: "Invalid plugin ID" }, { status: 400 });
    }

    const pdfPath = await getReportPdfPath(pluginId);

    if (!pdfPath) {
      return NextResponse.json(
        { error: "Report PDF not found" },
        { status: 404 }
      );
    }

    // Read the PDF file
    const fileBuffer = await fs.readFile(pdfPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pluginId}_report.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error downloading report PDF:", error);
    return NextResponse.json(
      { error: "Failed to download PDF" },
      { status: 500 }
    );
  }
}
