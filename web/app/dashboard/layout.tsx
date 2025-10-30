import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "View and manage your verified content, track verifications, and monitor platform bindings from your personal dashboard.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/dashboard",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
