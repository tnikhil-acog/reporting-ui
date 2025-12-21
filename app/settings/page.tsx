"use client";

import { useState, useEffect } from "react";

interface Config {
  llm: {
    provider: string;
    model: string;
    apiKey: string | null;
    temperature: number;
    maxTokens: number;
  };
  worker: {
    concurrency: number;
    rateLimit: {
      max: number;
      duration: number;
    };
  };
  redis: {
    host: string;
    port: number;
  };
  paths: {
    reportsDir: string;
    bundlesDir: string;
    pluginsDir: string;
  };
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/config");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch configuration");
      }

      setConfig(data.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching config:", err);
    } finally {
      setLoading(false);
    }
  };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      gemini: "Google Gemini",
      openai: "OpenAI",
      deepseek: "DeepSeek",
    };
    return labels[provider] || provider;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error || "Failed to load configuration"}
        </div>
        <button
          onClick={fetchConfig}
          className="bg-white border px-4 py-2 rounded hover:bg-gray-50"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">
          View system configuration and environment settings
        </p>
      </div>

      <div className="space-y-6">
        {/* LLM Configuration */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b px-6 py-4">
            <h2 className="text-xl font-semibold">🤖 LLM Configuration</h2>
            <p className="text-sm text-gray-600">
              Large Language Model settings for report generation
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Provider</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                  {getProviderLabel(config.llm.provider)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Model</p>
                <p className="font-mono text-sm">{config.llm.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Temperature</p>
                <p className="font-mono text-sm">{config.llm.temperature}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Max Tokens</p>
                <p className="font-mono text-sm">{config.llm.maxTokens}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">API Key</p>
                <span
                  className={`inline-block px-3 py-1 text-sm rounded ${
                    config.llm.apiKey
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {config.llm.apiKey ? "✓ Configured" : "✗ Not Set"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Worker Configuration */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b px-6 py-4">
            <h2 className="text-xl font-semibold">⚙️ Worker Configuration</h2>
            <p className="text-sm text-gray-600">
              Background worker process settings
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Concurrency</p>
                <p className="font-mono text-sm">
                  {config.worker.concurrency} workers
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Rate Limit</p>
                <p className="font-mono text-sm">
                  {config.worker.rateLimit.max} jobs /{" "}
                  {config.worker.rateLimit.duration / 1000}s
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Redis Configuration */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b px-6 py-4">
            <h2 className="text-xl font-semibold">💾 Redis Configuration</h2>
            <p className="text-sm text-gray-600">
              Job queue and caching backend
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Host</p>
                <p className="font-mono text-sm">{config.redis.host}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Port</p>
                <p className="font-mono text-sm">{config.redis.port}</p>
              </div>
            </div>
          </div>
        </div>

        {/* File Paths */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b px-6 py-4">
            <h2 className="text-xl font-semibold">📁 File Paths</h2>
            <p className="text-sm text-gray-600">
              Storage locations for reports, bundles, and plugins
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Reports Directory</p>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {config.paths.reportsDir}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Bundles Directory</p>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {config.paths.bundlesDir}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Plugins Directory</p>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {config.paths.pluginsDir}
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
          Configuration is managed through environment variables. To update
          settings, modify the
          <code className="mx-1 px-1 py-0.5 bg-blue-100 rounded text-sm">
            .env
          </code>{" "}
          file and restart the services.
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchConfig}
            className="bg-white border px-4 py-2 rounded hover:bg-gray-50"
          >
            🔄 Refresh Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
