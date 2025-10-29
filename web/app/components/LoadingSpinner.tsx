"use client";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  inline?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  message,
  inline = false,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "16px",
    md: "24px",
    lg: "40px",
  };

  const spinnerSize = sizeMap[size];

  const spinner = (
    <div
      style={{
        display: "inline-block",
        width: spinnerSize,
        height: spinnerSize,
        border: "3px solid #e5e7eb",
        borderTopColor: "#3b82f6",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );

  if (inline) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {spinner}
        {message && <span>{message}</span>}
      </span>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "24px",
      }}
    >
      {spinner}
      {message && <div style={{ color: "#6b7280" }}>{message}</div>}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
