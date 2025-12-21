import { getAvailableReports, formatDate } from "@/lib/report-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get optional pluginId filter from query params
    const pluginId = request.nextUrl.searchParams.get("pluginId");

    const reports = await getAvailableReports();

    // Filter by pluginId if provided
    const filteredReports = pluginId
      ? reports.filter((report) => report.pluginId === pluginId)
      : reports;

    const reportsData = filteredReports.map((report) => ({
      pluginId: report.pluginId,
      pluginName: report.pluginName,
      reportName: report.reportName, // Display name
      reportBaseName: report.reportBaseName, // Actual filename for API calls
      createdAt: formatDate(report.createdAt),
      createdAtIso: report.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      count: reportsData.length,
      reports: reportsData,
      filter: pluginId ? { pluginId } : null,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
