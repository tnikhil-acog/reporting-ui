import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PLUGINS_REGISTRY = "/shared/reporting-framework/plugins.json";

// In-memory cache for plugin schemas
const schemaCache = new Map<
  string,
  {
    schema: any;
    cachedAt: number;
    expiresAt: number | null;
  }
>();

// Cache TTL configuration
const CACHE_TTL =
  process.env.NODE_ENV === "development"
    ? 1 * 60 * 1000 // 1 minute in development
    : null; // Never expire in production (cache until restart)

interface PluginRegistryEntry {
  id: string;
  name: string;
  className: string;
  packageName: string;
  description?: string;
  version?: string;
}

/**
 * Load plugin using require instead of dynamic import
 * This works in Node.js runtime but Next.js build won't analyze it
 */
async function loadPluginModule(pluginPath: string, className: string) {
  try {
    // Use eval to hide the require from Next.js bundler
    const requireFunc = eval("require");
    const pluginModule = requireFunc(pluginPath);

    // Handle both default and named exports
    const PluginClass = pluginModule[className] || pluginModule.default;

    if (!PluginClass) {
      throw new Error(`Plugin class ${className} not found in module`);
    }

    return PluginClass;
  } catch (error) {
    // If require fails, the path might be wrong or plugin not installed
    throw new Error(
      `Failed to load plugin: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pluginId } = await params;

    // Check cache first
    const cached = schemaCache.get(pluginId);
    if (cached) {
      const now = Date.now();
      const isExpired = cached.expiresAt && now > cached.expiresAt;

      if (!isExpired) {
        return NextResponse.json({
          success: true,
          schema: cached.schema,
          cached: true,
          cachedAt: new Date(cached.cachedAt).toISOString(),
        });
      } else {
        // Remove expired cache entry
        schemaCache.delete(pluginId);
      }
    }

    // Read plugins registry to get plugin metadata
    const registryContent = await fs.readFile(PLUGINS_REGISTRY, "utf-8");
    const registry = JSON.parse(registryContent);

    if (!Array.isArray(registry.plugins)) {
      return NextResponse.json(
        { success: false, error: "Invalid plugins registry" },
        { status: 500 }
      );
    }

    // Find the plugin
    const pluginEntry = registry.plugins.find(
      (p: PluginRegistryEntry) => p.id === pluginId
    );

    if (!pluginEntry) {
      return NextResponse.json(
        { success: false, error: `Plugin not found: ${pluginId}` },
        { status: 404 }
      );
    }

    // Construct absolute plugin path
    const pluginPackageName = pluginEntry.packageName.replace("@aganitha/", "");
    const pluginPath = path.resolve(
      "/shared/reporting-framework/plugins",
      pluginPackageName,
      "dist",
      "index.js"
    );

    // Check if plugin file exists
    try {
      await fs.access(pluginPath);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Plugin file not found at: ${pluginPath}`,
        },
        { status: 404 }
      );
    }

    // Load the plugin using require
    let PluginClass;
    try {
      PluginClass = await loadPluginModule(pluginPath, pluginEntry.className);
    } catch (error) {
      console.error(`Error loading plugin ${pluginId}:`, error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to load plugin: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }

    // Instantiate the plugin
    const plugin = new PluginClass();

    // Check if plugin has getAPIQuerySchema method
    if (typeof plugin.getAPIQuerySchema !== "function") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Plugin does not support dynamic forms (missing getAPIQuerySchema method)",
        },
        { status: 501 }
      );
    }

    // Get the schema
    const schema = plugin.getAPIQuerySchema();

    // Cache the schema
    const now = Date.now();
    schemaCache.set(pluginId, {
      schema,
      cachedAt: now,
      expiresAt: CACHE_TTL ? now + CACHE_TTL : null,
    });

    return NextResponse.json({
      success: true,
      schema,
      cached: false,
      pluginId,
      pluginName: pluginEntry.name,
      pluginVersion: pluginEntry.version,
    });
  } catch (error) {
    console.error("Error fetching plugin schema:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch schema",
      },
      { status: 500 }
    );
  }
}

// Optional: Clear cache endpoint (for development/debugging)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pluginId } = await params;

    if (pluginId === "all") {
      // Clear all cache
      schemaCache.clear();
      return NextResponse.json({
        success: true,
        message: "All schema cache cleared",
      });
    } else {
      // Clear specific plugin cache
      const deleted = schemaCache.delete(pluginId);
      return NextResponse.json({
        success: true,
        message: deleted
          ? `Cache cleared for plugin: ${pluginId}`
          : `No cache found for plugin: ${pluginId}`,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to clear cache",
      },
      { status: 500 }
    );
  }
}
