/**
 * Report Generator for Worker Process
 *
 * Handles the complete report generation workflow:
 * 1. Load bundle data
 * 2. Load plugin
 * 3. Generate report using ReportEngine
 * 4. Render outputs (HTML, MD, PDF)
 * 5. Save to shared volume
 */

import { promises as fs } from "fs";
import path from "path";
import { loadPlugin, verifyPluginInterface } from "./plugin-loader";
import type {
  ReportJobData,
  ReportJobProgress,
  ReportJobResult,
} from "../lib/report-queue";

const REPORTS_DIR =
  process.env.REPORTS_DIR || "/shared/reporting-framework/reports";
const BUNDLES_DIR =
  process.env.BUNDLES_DIR || "/shared/reporting-framework/bundles";

export interface GenerateReportOptions {
  jobData: ReportJobData;
  onProgress?: (progress: ReportJobProgress) => void;
}

/**
 * Retry utility with exponential backoff
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 1000)
 * @param maxDelay - Maximum delay in milliseconds (default: 10000)
 * @returns The result of the successful function call
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[ReportGenerator] Retry attempt ${attempt}/${maxRetries}`);
      }
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is network-related and should be retried
      const isNetworkError =
        lastError.message.includes("ETIMEDOUT") ||
        lastError.message.includes("ECONNRESET") ||
        lastError.message.includes("ENOTFOUND") ||
        lastError.message.includes("Network error") ||
        lastError.message.includes("rate limit");

      // Don't retry if it's not a network error or we've exhausted retries
      if (!isNetworkError || attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      console.log(
        `[ReportGenerator] Network error (${lastError.message}), retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Load bundle data from file
 */
async function loadBundle(bundlePath: string): Promise<any> {
  console.log(`[ReportGenerator] Loading bundle: ${bundlePath}`);

  try {
    const content = await fs.readFile(bundlePath, "utf-8");
    const bundle = JSON.parse(content);

    console.log(`[ReportGenerator] ✓ Bundle loaded:`, {
      source: bundle.source,
      records: bundle.records?.length || 0,
      hasStats: !!bundle.stats,
    });

    return bundle;
  } catch (error) {
    console.error("[ReportGenerator] Failed to load bundle:", error);
    throw new Error(
      `Failed to load bundle from ${bundlePath}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get LLM configuration from environment, profile config, or job config
 */
async function getLLMConfig(jobConfig: ReportJobData["config"]) {
  const config = {
    provider: jobConfig.llmProvider as "gemini" | "openai" | "deepseek",
    model: jobConfig.llmModel,
    apiKey: "",
  };

  // First, try to get API key from user's profile configuration
  try {
    const os = await import("os");
    const fs = await import("fs/promises");
    const path = await import("path");

    const configPath = path.join(os.homedir(), ".framework-cli", "config.json");
    const configContent = await fs.readFile(configPath, "utf-8");
    const profileConfig = JSON.parse(configContent);

    // Get the default profile or find a profile matching this provider/model
    const defaultProfileName = profileConfig.defaultProfile;
    const profiles = profileConfig.profiles || {};

    if (defaultProfileName && profiles[defaultProfileName]) {
      const profile = profiles[defaultProfileName];
      config.apiKey = profile.apiKey || "";
      console.log(
        `[ReportGenerator] Using API key from profile: ${defaultProfileName}`
      );
    }
  } catch (error) {
    console.warn(
      `[ReportGenerator] Could not read profile config, falling back to environment variables:`,
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  // Fall back to environment variables if no API key from profile
  if (!config.apiKey) {
    switch (config.provider) {
      case "gemini":
        config.apiKey =
          process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
        break;
      case "openai":
        config.apiKey = process.env.OPENAI_API_KEY || "";
        break;
      case "deepseek":
        config.apiKey = process.env.DEEPSEEK_API_KEY || "";
        break;
      default:
        config.apiKey = process.env.LLM_API_KEY || "";
    }
  }

  if (!config.apiKey) {
    throw new Error(
      `API key not configured for provider: ${config.provider}. Set API key in profile (via UI) or environment variable.`
    );
  }

  return config;
}

/**
 * Sanitize filename to remove special characters
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

/**
 * Generate report from query data (fetch data from external source)
 */
export async function generateReport(
  options: GenerateReportOptions
): Promise<ReportJobResult> {
  const { jobData, onProgress } = options;
  const startTime = Date.now();
  let llmCallsCount = 0;

  const updateProgress = (
    step: string,
    current: number,
    total: number,
    message?: string
  ) => {
    if (onProgress) {
      onProgress({ step, current, total, message });
    }
  };

  try {
    // Step 1: Load plugin (10%)
    updateProgress(
      "Loading plugin",
      1,
      10,
      `Loading plugin: ${jobData.pluginId}`
    );
    const plugin = await loadPlugin(jobData.pluginId);

    // Verify plugin interface
    if (!verifyPluginInterface(plugin)) {
      throw new Error(
        `Plugin ${jobData.pluginId} does not implement required interface`
      );
    }

    console.log(
      `[ReportGenerator] ✓ Plugin ${jobData.pluginId} loaded and verified`
    );

    // Step 2: Fetch data from plugin using keywords (20-30%)
    updateProgress(
      "Fetching data",
      2,
      10,
      `Searching for: ${jobData.query.keywords}`
    );

    console.log(`[ReportGenerator] Fetching data with query:`, jobData.query);

    let bundle: any;

    // Fetch data using the plugin's API methods
    try {
      // Step 2a: Fetch raw data from PubMed API with retry logic
      if (typeof plugin.fetchFromAPI === "function") {
        console.log(
          `[ReportGenerator] Calling plugin.fetchFromAPI with keywords: ${jobData.query.keywords}`
        );
        console.log(
          `[ReportGenerator] Query params:`,
          JSON.stringify({
            term: jobData.query.keywords,
            maxResults: jobData.query.numberOfArticles || 500,
          })
        );

        // Wrap API call with retry logic (3 retries with exponential backoff)
        const apiResponse = await retryWithBackoff(
          async () => {
            return await plugin.fetchFromAPI({
              term: jobData.query.keywords,
              maxResults: jobData.query.numberOfArticles || 500,
              email: "reporting-framework@aganitha.ai",
            });
          },
          3, // maxRetries
          2000, // initialDelay: 2 seconds
          15000 // maxDelay: 15 seconds
        );

        console.log(
          `[ReportGenerator] ✓ Fetched ${
            apiResponse.pmids?.length || 0
          } PMIDs with ${apiResponse.xmlData?.length || 0} XML records from API`
        );

        // Step 2b: Process and normalize the API data into a bundle
        if (typeof plugin.processAPIData === "function") {
          console.log(`[ReportGenerator] Processing API data into bundle...`);

          bundle = await plugin.processAPIData(apiResponse);

          console.log(
            `[ReportGenerator] ✓ Bundle created with ${
              bundle.records?.length || 0
            } normalized records`
          );
          console.log(
            `[ReportGenerator] ✓ Bundle stats:`,
            JSON.stringify(bundle.stats || {}, null, 2)
          );
        } else {
          throw new Error(
            "Plugin does not support processAPIData - cannot create bundle"
          );
        }
      } else {
        throw new Error(
          "Plugin does not support fetchFromAPI - cannot fetch data"
        );
      }
    } catch (fetchError) {
      console.error(
        `[ReportGenerator] ❌ Failed to fetch/process data:`,
        fetchError
      );

      // Log additional error details if available
      if (fetchError && typeof fetchError === "object") {
        console.error(`[ReportGenerator] Error details:`, {
          message: (fetchError as any).message,
          response: (fetchError as any).response?.data,
          status: (fetchError as any).response?.status,
          stack: (fetchError as any).stack?.split("\n").slice(0, 3).join("\n"),
        });
      }

      throw new Error(
        `Data fetching failed: ${
          fetchError instanceof Error ? fetchError.message : "Unknown error"
        }. Check if NCBI PubMed API is accessible and rate limits are not exceeded.`
      );
    }

    // Step 3: Get LLM config (40%)
    updateProgress(
      "Configuring LLM",
      3,
      10,
      `Setting up ${jobData.config.llmProvider}`
    );
    const llmConfig = await getLLMConfig(jobData.config);

    console.log(
      `[ReportGenerator] LLM Config: ${llmConfig.provider} / ${llmConfig.model}`
    );

    // Step 4: Initialize ReportEngine (50%)
    updateProgress(
      "Initializing report engine",
      4,
      10,
      "Loading framework modules"
    );

    const { ReportEngine, PluginRegistry } = await import(
      "@aganitha/reporting-framework"
    );

    const registry = new PluginRegistry();
    registry.register(plugin);

    const reportEngine = new ReportEngine(registry);

    console.log("[ReportGenerator] ✓ Report engine initialized");

    // Step 5: Get specifications (60%)
    updateProgress(
      "Loading specifications",
      5,
      10,
      "Getting report specifications"
    );

    const specifications = plugin.getSpecifications();
    const specIds = Object.keys(specifications);

    if (specIds.length === 0) {
      throw new Error(`No specifications found for plugin ${jobData.pluginId}`);
    }

    const specId = specIds[0];
    console.log(`[ReportGenerator] Using specification: ${specId}`);

    // Step 6: Generate report with LLM (70-80%)
    updateProgress(
      "Generating report",
      6,
      10,
      "Processing with LLM (this may take a few minutes)"
    );

    const report = await reportEngine.generateReport({
      pluginId: jobData.pluginId,
      specificationId: specId,
      bundle,
      llmConfig,
    });

    if (!report || !report.content) {
      throw new Error("Report generation returned empty content");
    }

    console.log(
      `[ReportGenerator] ✓ Report generated (${report.content.length} characters)`
    );

    // Estimate LLM calls (this is approximate)
    llmCallsCount = Object.keys((report as any).variables || {}).length;

    // Step 7: Prepare output directory (85%)
    updateProgress("Preparing output", 7, 10, "Creating output directory");

    const reportDir = path.join(REPORTS_DIR, jobData.pluginId);
    await fs.mkdir(reportDir, { recursive: true });

    const sanitizedName = sanitizeFilename(jobData.reportName);
    const timestamp = Date.now();

    const outputs: ReportJobResult["outputs"] = {};

    // Step 8: Render and save outputs (90-100%)
    // Always generate all three formats: HTML, Markdown, and PDF
    const allFormats = ["html", "md", "pdf"] as const;

    for (let i = 0; i < allFormats.length; i++) {
      const format = allFormats[i];
      const progress = 8 + (i + 1) / allFormats.length;
      updateProgress(
        "Rendering outputs",
        progress,
        10,
        `Rendering ${format.toUpperCase()}`
      );

      const reportData = {
        id: `${jobData.pluginId}-${sanitizedName}`,
        title: jobData.reportName,
        content: report.content,
        metadata: report.metadata,
      };

      switch (format) {
        case "html": {
          const filename = `${sanitizedName}.html`;
          const filepath = path.join(reportDir, filename);

          const { HTMLRenderer } = await import(
            "@aganitha/reporting-framework"
          );
          const htmlRenderer = new HTMLRenderer();
          const htmlBuffer = await htmlRenderer.render(reportData, {});

          await fs.writeFile(filepath, htmlBuffer);
          outputs.html = filepath;

          console.log(`[ReportGenerator] ✓ HTML saved: ${filepath}`);
          break;
        }

        case "md": {
          const filename = `${sanitizedName}.md`;
          const filepath = path.join(reportDir, filename);

          // Save markdown directly (framework doesn't have MarkdownRenderer)
          await fs.writeFile(filepath, report.content);
          outputs.md = filepath;

          console.log(`[ReportGenerator] ✓ Markdown saved: ${filepath}`);
          break;
        }

        case "pdf": {
          const filename = `${sanitizedName}.pdf`;
          const filepath = path.join(reportDir, filename);

          try {
            const { PDFRenderer } = await import(
              "@aganitha/reporting-framework"
            );
            const pdfRenderer = new PDFRenderer();
            const pdfBuffer = await pdfRenderer.render(reportData, {});

            await fs.writeFile(filepath, pdfBuffer);
            outputs.pdf = filepath;

            console.log(`[ReportGenerator] ✓ PDF saved: ${filepath}`);
          } catch (pdfError) {
            console.warn(
              `[ReportGenerator] ⚠ PDF generation skipped:`,
              pdfError
            );
            // PDF is optional, don't fail the job
          }
          break;
        }
      }
    }

    // Step 9: Complete (100%)
    updateProgress("Complete", 10, 10, "Report generation complete");

    const duration = Date.now() - startTime;

    const result: ReportJobResult = {
      success: true,
      reportPath: reportDir,
      outputs,
      stats: {
        duration,
        llmCallsCount,
      },
    };

    console.log(
      `[ReportGenerator] ✓ Report generation complete in ${duration}ms`
    );
    console.log(`[ReportGenerator] Outputs:`, Object.keys(outputs));

    return result;
  } catch (error) {
    console.error("[ReportGenerator] ❌ Error generating report:", error);

    const duration = Date.now() - startTime;

    return {
      success: false,
      reportPath: "",
      outputs: {},
      stats: {
        duration,
        llmCallsCount,
      },
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
