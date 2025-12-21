import { promises as fs } from "fs";
import { NextResponse } from "next/server";

const PLUGINS_REGISTRY = "/shared/reporting-framework/plugins.json";

export interface PluginInfo {
  id: string;
  name: string;
  description?: string;
}

export async function GET() {
  try {
    const content = await fs.readFile(PLUGINS_REGISTRY, "utf-8");
    const registry = JSON.parse(content);

    if (!Array.isArray(registry.plugins)) {
      return NextResponse.json(
        { error: "Invalid plugins registry" },
        { status: 500 }
      );
    }

    const plugins: PluginInfo[] = registry.plugins.map((plugin: any) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
    }));

    return NextResponse.json({
      success: true,
      plugins,
    });
  } catch (error) {
    console.error("Error fetching plugins:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch plugins" },
      { status: 500 }
    );
  }
}
