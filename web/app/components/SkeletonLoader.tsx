"use client";

export interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "rectangular" | "circular";
  count?: number;
}

export default function SkeletonLoader({
  width = "100%",
  height = "20px",
  variant = "text",
  count = 1,
}: SkeletonLoaderProps) {
  const getStyle = () => {
    const baseStyle = {
      display: "inline-block",
      backgroundColor: "#e5e7eb",
      animation: "pulse 1.5s ease-in-out infinite",
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
    };

    if (variant === "circular") {
      return { ...baseStyle, borderRadius: "50%" };
    } else if (variant === "rectangular") {
      return { ...baseStyle, borderRadius: "4px" };
    } else {
      return { ...baseStyle, borderRadius: "4px" };
    }
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} style={getStyle()} />
  ));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {skeletons}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
