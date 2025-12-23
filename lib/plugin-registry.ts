/**
 * Plugin Registry - Unified Plugin Management
 *
 * Consolidates plugin loading, caching, and metadata management.
 * Replaces both lib/pipeline-loader.ts and worker/plugin-loader.ts
 *
 * Usage:
 * - API Routes: Use getPluginMetadata() and listAvailablePlugins()
 * - Worker: Use loadPluginInstance() to get plugin instances
 */

import { promises as fs } from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PLUGINS_DIR =
  process.env.PLUGINS_DIR || "/shared/reporting-framework/plugins";
const PLUGINS_REGISTRY = path.join(
  path.dirname(PLUGINS_DIR),
  "plugins.json"
);

// ============================================================================
// TYPES
// ============================================================================

export interface PluginMetadata {
  id: string;
  name: string;
  className: string;
  packageName: string;
  version: string;
  description?: string;
  supportedDataTypes?: string[];
  supportsKeywordFetching?: boolean;
  metadata?: Record<string, any>;
}

interface PluginRegistry {
  plugins: PluginMetadata[];
  updatedAt: string;
  version: string;
}

// ============================================================================
// REGISTRY OPERATIONS (Used by API Routes)
// ============================================================================

let cachedRegistry: PluginRegistry | null = null;

/**
 * Load the plugins registry file
 * Cached for performance - use clearRegistryCache() to invalidate
 */
export async function loadPluginsRegistry(): Promise<PluginRegistry> {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  try {
    const content = await fs.readFile(PLUGINS_REGISTRY, "utf-8");
    cachedRegistry = JSON.parse(content);
    console.log(
      `[PluginRegistry] Loaded ${cachedRegistry.plugins.length} plugins from registry`
    );
    return cachedRegistry;
  } catch (error) {
    console.error("[PluginRegistry] Failed to load plugins registry:", error);
    throw new Error(
      `Plugins registry not found at ${PLUGINS_REGISTRY}. Ensure plugins are installed in ${PLUGINS_DIR}`
    );
  }
}

/**
 * Get metadata for a specific plugin
 * Used by: API routes to get plugin configuration
 */
export async function getPluginMetadata(
  pluginId: string
): Promise<PluginMetadata | null> {
  try {
    const registry = await loadPluginsRegistry();
    const plugin = registry.plugins.find((p) => p.id === pluginId);

    if (plugin) {
      console.log(`[PluginRegistry] Found metadata for plugin: ${pluginId}`);
    } else {
      console.warn(`[PluginRegistry] Plugin not found in registry: ${pluginId}`);
    }

    return plugin || null;
  } catch (error) {
    console.error(
      `[PluginRegistry] Failed to get metadata for plugin ${pluginId}:`,
      error
    );
    return null;
  }
}

/**
 * Get all available plugins
 * Used by: API routes to list available plugins
 */
export async function listAvailablePlugins(): Promise<PluginMetadata[]> {
  try {
    const registry = await loadPluginsRegistry();
    return registry.plugins;
  } catch (error) {
    console.error("[PluginRegistry] Failed to list plugins:", error);
    return [];
  }
}

/**
 * Clear registry cache
 * Useful for hot-reloading or after plugin installation
 */
export function clearRegistryCache(): void {
  cachedRegistry = null;
  pluginInstanceCache.clear();
  console.log("[PluginRegistry] Cache cleared");
}

// ============================================================================
// PLUGIN LOADING (Used by Worker)
// ============================================================================

const pluginInstanceCache = new Map<string, any>();

/**
 * Load and instantiate a plugin
 * Used by: Worker process to get plugin instances for report generation
 *
 * Features:
 * - Caches plugin instances to avoid repeated loading
 * - Validates plugin interface before instantiation
 * - Supports both filesystem and npm package loading
 */
export async function loadPluginInstance(pluginId: string): Promise<any> {
  // Check cache first
  if (pluginInstanceCache.has(pluginId)) {
    console.log(`[PluginRegistry] Using cached plugin instance: ${pluginId}`);
    return pluginInstanceCache.get(pluginId);
  }

  console.log(`[PluginRegistry] Loading plugin: ${pluginId}`);

  // Get plugin metadata
  const metadata = await getPluginMetadata(pluginId);
  if (!metadata) {
    throw new Error(`Plugin not found in registry: ${pluginId}`);
  }

  console.log(`[PluginRegistry] Plugin metadata:`, {
    id: metadata.id,
    name: metadata.name,
    packageName: metadata.packageName,
    className: metadata.className,
    version: metadata.version,
  });

  // Construct path to plugin directory
  const pluginDirName = metadata.packageName.split("/").pop() || metadata.id;
  const pluginDir = path.join(PLUGINS_DIR, pluginDirName);
  const pluginEntryPoint = path.join(pluginDir, "dist", "index.js");

  console.log(`[PluginRegistry] Loading from: ${pluginEntryPoint}`);

  try {
    // Check if file exists
    try {
      await fs.access(pluginEntryPoint);
    } catch (accessError) {
      throw new Error(
        `Plugin entry point not found: ${pluginEntryPoint}. Ensure plugin is built (dist/index.js exists)`
      );
    }

    // Dynamic import of plugin module
    const pluginModule = await import(pluginEntryPoint);

    // Get the plugin class (try named export first, then default)
    const PluginClass =
      pluginModule[metadata.className] || pluginModule.default;

    if (!PluginClass) {
      throw new Error(
        `Plugin ${pluginId} does not export class: ${metadata.className}`
      );
    }

    // Verify the plugin class implements required interface
    if (!verifyPluginClass(PluginClass)) {
      throw new Error(
        `Plugin ${pluginId} class does not implement required interface. Missing methods: ${getMissingMethods(
          PluginClass
        ).join(", ")}`
      );
    }

    // Instantiate the plugin
    const pluginInstance = new PluginClass();

    // Double-check instance methods (some plugins may have instance-only methods)
    if (!verifyPluginInterface(pluginInstance)) {
      throw new Error(
        `Plugin ${pluginId} instance does not implement required interface`
      );
    }

    // Cache the plugin instance
    pluginInstanceCache.set(pluginId, pluginInstance);

    console.log(`[PluginRegistry] ✓ Plugin ${pluginId} loaded successfully`);

    return pluginInstance;
  } catch (error) {
    console.error(`[PluginRegistry] Failed to load plugin ${pluginId}:`, error);

    // Log additional debug info
    if (error && typeof error === "object" && "code" in error) {
      console.error(`[PluginRegistry] Error code:`, error.code);
    }

    throw new Error(
      `Failed to load plugin ${pluginId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Verify plugin class has required methods
 * (Used before instantiation)
 */
function verifyPluginClass(PluginClass: any): boolean {
  try {
    // Create temporary instance to check methods
    const tempInstance = new PluginClass();
    return verifyPluginInterface(tempInstance);
  } catch (error) {
    console.error("[PluginRegistry] Failed to verify plugin class:", error);
    return false;
  }
}

/**
 * Get list of missing required methods
 * (Helper for error messages)
 */
function getMissingMethods(PluginClass: any): string[] {
  const requiredMethods = [
    "generate",
    "getSpecifications",
    "getPromptsDir",
    "getTemplatesDir",
  ];

  const missing: string[] = [];

  try {
    const tempInstance = new PluginClass();

    for (const method of requiredMethods) {
      if (typeof tempInstance[method] !== "function") {
        missing.push(method);
      }
    }
  } catch {
    return requiredMethods; // All methods missing if can't instantiate
  }

  return missing;
}

/**
 * Verify plugin instance implements required interface
 * Used by: Worker after loading plugin
 *
 * Required methods:
 * - generate(): Generate report content
 * - getSpecifications(): Get report specifications
 * - getPromptsDir(): Get prompts directory path
 * - getTemplatesDir(): Get templates directory path
 */
export function verifyPluginInterface(plugin: any): boolean {
  const requiredMethods = [
    "generate",
    "getSpecifications",
    "getPromptsDir",
    "getTemplatesDir",
  ];

  for (const method of requiredMethods) {
    if (typeof plugin[method] !== "function") {
      console.error(
        `[PluginRegistry] Plugin missing required method: ${method}`
      );
      return false;
    }
  }

  return true;
}

/**
 * Clear plugin instance cache
 * Useful for forcing plugin reload during development
 */
export function clearPluginCache(): void {
  const count = pluginInstanceCache.size;
  pluginInstanceCache.clear();
  console.log(`[PluginRegistry] Cleared ${count} cached plugin instances`);
}

// ============================================================================
// LEGACY COMPATIBILITY (For gradual migration)
// ============================================================================

/**
 * @deprecated Use getPluginMetadata() instead
 * Kept for backward compatibility with existing code
 */
export const getPipelineConfig = getPluginMetadata;

/**
 * @deprecated Use loadPluginInstance() instead
 * Kept for backward compatibility with existing code
 */
export const loadPipeline = loadPluginInstance;

/**
 * @deprecated Use listAvailablePlugins() instead
 * Kept for backward compatibility with existing code
 */
export const loadPipelinesRegistry = listAvailablePlugins;

/**
 * @deprecated Use loadPluginInstance() instead
 * Kept for backward compatibility with worker code
 */
export const loadPlugin = loadPluginInstance;
