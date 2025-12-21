/**
 * Dynamic Pipeline Loader
 */

import path from "path";
import { pathToFileURL } from "url";

const PIPELINES_DIR =
  process.env.PIPELINES_DIR || "/shared/reporting-framework/pipelines";
const PIPELINES_REGISTRY =
  process.env.PIPELINES_REGISTRY || "/shared/reporting-framework/plugins.json";

const pipelineCache = new Map<string, any>();

export interface PipelineConfig {
  id: string;
  packageName: string;
  className: string;
  name: string;
  description?: string;
  supportsKeywordFetching?: boolean;
}

export async function loadPipelinesRegistry(): Promise<PipelineConfig[]> {
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(PIPELINES_REGISTRY, "utf-8");
    const registry = JSON.parse(content);
    return Array.isArray(registry.plugins) ? registry.plugins : [];
  } catch (error) {
    console.error("Failed to load pipelines registry:", error);
    return [];
  }
}

export async function getPipelineConfig(
  pipelineId: string
): Promise<PipelineConfig | null> {
  const pipelines = await loadPipelinesRegistry();
  return pipelines.find((p) => p.id === pipelineId) || null;
}

export async function loadPipeline(pipelineId: string): Promise<any> {
  if (pipelineCache.has(pipelineId)) {
    console.log(`[PipelineLoader] Using cached: ${pipelineId}`);
    return pipelineCache.get(pipelineId);
  }

  const config = await getPipelineConfig(pipelineId);
  if (!config) {
    throw new Error(`Pipeline not found: ${pipelineId}`);
  }

  try {
    console.log(`[PipelineLoader] Loading: ${pipelineId}`);

    const pipelinePath = path.join(
      PIPELINES_DIR,
      `pipeline-${pipelineId}`,
      "dist",
      "index.js"
    );
    const fs = await import("fs/promises");

    try {
      await fs.access(pipelinePath);
      const url = pathToFileURL(pipelinePath).href;
      const module = await import(url);
      const pipeline = module.default;
      pipelineCache.set(pipelineId, pipeline);
      console.log(`[PipelineLoader] ✓ Loaded from filesystem: ${pipelineId}`);
      return pipeline;
    } catch (fsError) {
      console.log(`[PipelineLoader] Trying npm package: ${config.packageName}`);
      const module = await import(config.packageName);
      const pipeline = module.default;
      pipelineCache.set(pipelineId, pipeline);
      console.log(`[PipelineLoader] ✓ Loaded from npm: ${pipelineId}`);
      return pipeline;
    }
  } catch (error: any) {
    console.error(`[PipelineLoader] Failed: ${pipelineId}`, error);
    throw new Error(
      `Failed to load pipeline "${pipelineId}": ${error.message}`
    );
  }
}

export function clearPipelineCache() {
  pipelineCache.clear();
}
