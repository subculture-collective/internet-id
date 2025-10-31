import { NextRequest, NextResponse } from "next/server";

// Use the edge runtime for lower latency and global distribution of analytics endpoint.
// This enables faster response times for users worldwide and efficient handling of analytics events.
export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log Web Vitals metrics
    // In production, send to your analytics service (e.g., Google Analytics, Vercel Analytics, etc.)
    console.log("[Analytics] Web Vitals:", {
      name: body.name,
      value: body.value,
      rating: body.rating,
      id: body.id,
    });

    // TODO: Send to analytics service
    // Example: await sendToAnalytics(body);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Analytics] Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
