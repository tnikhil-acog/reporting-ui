"use client";

import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!) || (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/20 dark:bg-red-900/10">
            <h2 className="font-semibold text-red-800 dark:text-red-300">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">
              {this.state.error?.message}
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
