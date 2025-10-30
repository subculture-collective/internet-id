import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Internet-ID profile settings and account information.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/profile",
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
