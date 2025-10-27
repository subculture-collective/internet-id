"use client";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "24px",
            margin: "16px 0",
            border: "2px solid #ef4444",
            borderRadius: "8px",
            backgroundColor: "#fef2f2",
          }}
        >
          <h2 style={{ color: "#dc2626", marginTop: 0 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#7f1d1d" }}>
            {this.state.error?.message ||
              "An unexpected error occurred. Please try refreshing the page."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "12px",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
