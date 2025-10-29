"use client";

export interface ErrorMessageProps {
  error: string | Error | unknown;
  onRetry?: () => void;
  title?: string;
}

function parseError(error: string | Error | unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as any).message);
  }
  return "An unexpected error occurred";
}

function getErrorDetails(error: string): {
  title: string;
  message: string;
  suggestion?: string;
} {
  const lowerError = error.toLowerCase();

  // Network errors
  if (
    lowerError.includes("fetch") ||
    lowerError.includes("network") ||
    lowerError.includes("failed to fetch")
  ) {
    return {
      title: "Network Error",
      message: "Unable to connect to the server.",
      suggestion: "Please check your internet connection and try again.",
    };
  }

  // Transaction errors
  if (
    lowerError.includes("user rejected") ||
    lowerError.includes("user denied")
  ) {
    return {
      title: "Transaction Rejected",
      message: "The transaction was rejected.",
      suggestion: "Please approve the transaction in your wallet to continue.",
    };
  }

  if (lowerError.includes("insufficient funds") || lowerError.includes("gas")) {
    return {
      title: "Insufficient Funds",
      message: "Your wallet doesn't have enough funds for this transaction.",
      suggestion:
        "Please add funds to your wallet or reduce the transaction amount.",
    };
  }

  // IPFS errors
  if (lowerError.includes("ipfs") || lowerError.includes("upload")) {
    return {
      title: "Upload Failed",
      message: "Failed to upload file to IPFS.",
      suggestion: "Please check your file and try again.",
    };
  }

  // Validation errors
  if (lowerError.includes("invalid") || lowerError.includes("validation")) {
    return {
      title: "Invalid Input",
      message: error,
      suggestion: "Please check your input and try again.",
    };
  }

  // Unauthorized errors
  if (
    lowerError.includes("unauthorized") ||
    lowerError.includes("403") ||
    lowerError.includes("401")
  ) {
    return {
      title: "Unauthorized",
      message: "You don't have permission to perform this action.",
      suggestion: "Please sign in or check your account permissions.",
    };
  }

  // Generic error
  return {
    title: "Error",
    message: error,
  };
}

export default function ErrorMessage({
  error,
  onRetry,
  title,
}: ErrorMessageProps) {
  const errorString = parseError(error);
  const details = getErrorDetails(errorString);

  return (
    <div
      style={{
        padding: "16px",
        margin: "8px 0",
        border: "1px solid #fca5a5",
        borderRadius: "8px",
        backgroundColor: "#fef2f2",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div style={{ color: "#dc2626", fontSize: "20px" }}>⚠</div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              color: "#dc2626",
              margin: "0 0 8px 0",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            {title || details.title}
          </h3>
          <p
            style={{
              color: "#7f1d1d",
              margin: "0 0 8px 0",
              fontSize: "14px",
            }}
          >
            {details.message}
          </p>
          {details.suggestion && (
            <p
              style={{
                color: "#991b1b",
                margin: "0",
                fontSize: "13px",
                fontStyle: "italic",
              }}
            >
              💡 {details.suggestion}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                marginTop: "12px",
                padding: "6px 12px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
