"use client";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]); // Removed onClose to prevent premature dismissal if callback identity changes

  const colors = {
    success: { bg: "#e6ffed", border: "#1a7f37", text: "#1a7f37" },
    error: { bg: "#fef2f2", border: "#dc2626", text: "#dc2626" },
    warning: { bg: "#fef3c7", border: "#d97706", text: "#92400e" },
    info: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
  };

  const color = colors[type];

  return (
    <div
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      style={{
        backgroundColor: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
        padding: "12px 16px",
        borderRadius: "6px",
        marginBottom: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        minWidth: "300px",
        maxWidth: "500px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div style={{ flex: 1 }}>{message}</div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: color.text,
          cursor: "pointer",
          fontSize: "18px",
          padding: "0 4px",
          lineHeight: 1,
        }}
        aria-label="Close notification"
      >
        ×
      </button>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  useEffect(() => {
    // Add keyboard support to close the most recent toast with Escape key
    // Handler is at container level to avoid multiple listeners
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && toasts.length > 0) {
        // Close the most recent toast (last in array)
        onRemove(toasts[toasts.length - 1].id);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toasts, onRemove]);

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
