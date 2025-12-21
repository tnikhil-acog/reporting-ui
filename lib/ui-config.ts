/**
 * UI-specific configuration (icons, form hints)
 * This is separate from pipeline registry and only used by the frontend
 */

export interface PipelineUIConfig {
  icon: string;
  placeholder: string;
  helpText: string;
}

// Simple UI configs - can be modified without touching pipeline code
export const PIPELINE_UI_CONFIG: Record<string, PipelineUIConfig> = {
  patent: {
    icon: "📋",
    placeholder: "e.g., artificial intelligence, machine learning",
    helpText: "Search patents by keywords, assignee, and date range",
  },
  pubmed: {
    icon: "📚",
    placeholder: "e.g., COVID-19, vaccine efficacy, clinical trials",
    helpText: "Search medical literature by keywords and publication date",
  },
  staffing: {
    icon: "👥",
    placeholder: "e.g., ICU nurse, physician assistant",
    helpText: "Search employment data by occupation and location",
  },
};

// Default config for new pipelines
export const DEFAULT_UI_CONFIG: PipelineUIConfig = {
  icon: "📄",
  placeholder: "Enter search keywords",
  helpText: "Search by keywords and filters",
};

export function getUIConfig(pipelineId: string): PipelineUIConfig {
  return PIPELINE_UI_CONFIG[pipelineId] || DEFAULT_UI_CONFIG;
}
