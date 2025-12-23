import "next";

declare module "next" {
  interface ExperimentalConfig {
    turbopack?: {
      rules?: Record<string, any>;
    };
  }
}
