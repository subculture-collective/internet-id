import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { WebVitals } from "./web-vitals";

export const metadata: Metadata = {
  title: "Internet-ID",
  description: "Anchor and verify human-created content",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Internet-ID",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://ipfs.io" />
        <link rel="dns-prefetch" href="https://ipfs.io" />
      </head>
      <body suppressHydrationWarning>
        <WebVitals />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
