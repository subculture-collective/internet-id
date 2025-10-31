import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_BASE || "https://internet-id.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/profile/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
