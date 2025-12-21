import { getReportHtml } from "@/lib/report-service";
import { NextResponse } from "next/server";

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

    const html = await getReportHtml(pluginId);

    if (!html) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error fetching report HTML:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
