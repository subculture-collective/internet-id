import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Internet-ID",
  description: "Anchor and verify human-created content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
