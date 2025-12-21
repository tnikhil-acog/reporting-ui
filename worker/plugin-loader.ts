/**
 * Plugin Loader for Worker Process
 *
 * Dynamically loads plugins from the shared volume
 * at /shared/reporting-framework/plugins/
 */

import { promises as fs } from "fs";
import path from "path";

const PLUGINS_DIR =
  process.env.PLUGINS_DIR || "/shared/reporting-framework/plugins";
const PLUGINS_REGISTRY = path.join(path.dirname(PLUGINS_DIR), "plugins.json");

export interface PluginMetadata {
  id: string;
  name: string;
  className: string;
  packageName: string;
  version: string;
  description?: string;
  supportedDataTypes?: string[];
  metadata?: Record<string, any>;
}

export interface PluginRegistry {
  plugins: PluginMetadata[];
  updatedAt: string;
  version: string;
}

/**
 * Load the plugins registry file
 */
export async function loadPluginsRegistry(): Promise<PluginRegistry> {
  try {
    const content = await fs.readFile(PLUGINS_REGISTRY, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("[PluginLoader] Failed to load plugins registry:", error);
    throw new Error(
      "Plugins registry not found. Please ensure plugins are installed in /shared/reporting-framework/plugins/"
    );
  }
}

/**
 * Get metadata for a specific plugin
 */
export async function getPluginMetadata(
  pluginId: string
): Promise<PluginMetadata | null> {
  try {
    const registry = await loadPluginsRegistry();
    const plugin = registry.plugins.find((p) => p.id === pluginId);
    return plugin || null;
  } catch (error) {
    console.error(
      `[PluginLoader] Failed to get metadata for plugin ${pluginId}:`,
      error
    );
    return null;
  }
}

/**
 * Load a plugin module dynamically
 */
export async function loadPlugin(pluginId: string): Promise<any> {
  console.log(`[PluginLoader] Loading plugin: ${pluginId}`);

  // Get plugin metadata
  const metadata = await getPluginMetadata(pluginId);
  if (!metadata) {
    throw new Error(`Plugin not found: ${pluginId}`);
  }

  console.log(`[PluginLoader] Plugin metadata:`, {
    id: metadata.id,
    name: metadata.name,
    packageName: metadata.packageName,
    className: metadata.className,
    version: metadata.version,
  });

  // Construct path to plugin directory
  // packageName: @aganitha/plugin-pubmed -> plugin-pubmed
  const pluginDirName = metadata.packageName.split("/").pop() || metadata.id;
  const pluginDir = path.join(PLUGINS_DIR, pluginDirName);
  const pluginEntryPoint = path.join(pluginDir, "dist", "index.js");

  console.log(`[PluginLoader] Loading from path: ${pluginEntryPoint}`);

  // Dynamically import the plugin from file path
  try {
    // Check if file exists
    try {
      await fs.access(pluginEntryPoint);
    } catch (error) {
      throw new Error(
        `Plugin entry point not found: ${pluginEntryPoint}. Make sure the plugin is built (dist/index.js exists).`
      );
    }

    const pluginModule = await import(pluginEntryPoint);

    // Get the plugin class by name
    const PluginClass =
      pluginModule[metadata.className] || pluginModule.default;

    if (!PluginClass) {
      throw new Error(
        `Plugin ${pluginId} does not export class: ${metadata.className}`
      );
    }

    // Instantiate the plugin
    const pluginInstance = new PluginClass();

    console.log(`[PluginLoader] ✓ Plugin ${pluginId} loaded successfully`);

    return pluginInstance;
  } catch (error) {
    console.error(`[PluginLoader] Failed to load plugin ${pluginId}:`, error);
    throw new Error(
      `Failed to load plugin ${pluginId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * List all available plugins
 */
export async function listAvailablePlugins(): Promise<PluginMetadata[]> {
  try {
    const registry = await loadPluginsRegistry();
    return registry.plugins;
  } catch (error) {
    console.error("[PluginLoader] Failed to list plugins:", error);
    return [];
  }
}

/**
 * Verify plugin implements required interface
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
      console.error(`[PluginLoader] Plugin missing required method: ${method}`);
      return false;
    }
  }

  return true;
}
