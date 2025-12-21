import { promises as fs } from "fs";

const PIPELINES_REGISTRY =
  process.env.PIPELINES_REGISTRY || "/shared/reporting-framework/plugins.json";

export interface PipelineMetadata {
  id: string;
  name: string;
  description: string;
  className: string;
  packageName: string;
  version: string;
  supportedDataType: string;
}

let cachedRegistry: PipelineMetadata[] | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Load all pipelines from registry
 */
export async function loadPipelinesRegistry(): Promise<PipelineMetadata[]> {
  const now = Date.now();

  if (cachedRegistry && now - cacheTime < CACHE_TTL) {
    return cachedRegistry;
  }

  try {
    const content = await fs.readFile(PIPELINES_REGISTRY, "utf-8");
    const registry = JSON.parse(content);

    if (!Array.isArray(registry.plugins)) {
      console.error("[PipelineService] Invalid registry format");
      return [];
    }

    cachedRegistry = registry.plugins;
    cacheTime = now;
    return cachedRegistry || [];
  } catch (error) {
    console.error("[PipelineService] Failed to load registry:", error);
    return [];
  }
}

/**
 * Get a specific pipeline by ID
 */
export async function getPipelineMetadata(
  pipelineId: string
): Promise<PipelineMetadata | null> {
  const pipelines = await loadPipelinesRegistry();
  return pipelines.find((p) => p.id === pipelineId) || null;
}

/**
 * Clear cache
 */
export function clearCache() {
  cachedRegistry = null;
  cacheTime = 0;
}
