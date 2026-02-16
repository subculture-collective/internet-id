import { Metadata } from "next";
import { getNonce } from "../../lib/csp";

const siteUrl = process.env.NEXT_PUBLIC_SITE_BASE || "https://internet-id.io";

// Breadcrumb structured data - defined outside component to avoid recreation on every render
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Badges",
      item: `${siteUrl}/badges`,
    },
  ],
};

export const metadata: Metadata = {
  title: "Verification Badges",
  description:
    "Explore and customize verification badges to showcase your authenticated content. Multiple themes, sizes, and styles available for embedding on any platform.",
  keywords: [
    "verification badge",
    "content badge",
    "authentication badge",
    "verified content",
    "embed badge",
    "badge customization",
  ],
  openGraph: {
    title: "Verification Badges | Internet-ID",
    description:
      "Explore and customize verification badges to showcase your authenticated content. Multiple themes, sizes, and styles available.",
  },
  twitter: {
    title: "Verification Badges | Internet-ID",
    description:
      "Explore and customize verification badges to showcase your authenticated content.",
  },
  alternates: {
    canonical: "/badges",
  },
};

export default async function BadgesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = await getNonce();
  
  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}
