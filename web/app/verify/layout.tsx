import { Metadata } from "next";

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
      name: "Verify Content",
      item: `${siteUrl}/verify`,
    },
  ],
};

// VerifyAction structured data - defined outside component to avoid recreation on every render
const verifyActionSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Verify Content",
  description:
    "Verify the authenticity and provenance of digital content using blockchain technology",
  url: `${siteUrl}/verify`,
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "Internet-ID Content Verifier",
    applicationCategory: "SecurityApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
};

export const metadata: Metadata = {
  title: "Verify Content",
  description:
    "Verify the authenticity of your content on the blockchain. Check if content has been registered and anchored on-chain with cryptographic proof.",
  openGraph: {
    title: "Verify Content | Internet-ID",
    description:
      "Verify the authenticity of your content on the blockchain. Check if content has been registered and anchored on-chain with cryptographic proof.",
  },
  twitter: {
    title: "Verify Content | Internet-ID",
    description:
      "Verify the authenticity of your content on the blockchain. Check if content has been registered and anchored on-chain.",
  },
  alternates: {
    canonical: "/verify",
  },
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Structured Data - JSON-LD scripts don't execute JavaScript, so they don't need nonces */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(verifyActionSchema),
        }}
      />
      {children}
    </>
  );
}
