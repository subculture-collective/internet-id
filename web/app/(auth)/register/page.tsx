"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Create account</h1>
      <p style={{ color: "#666" }}>
        Create a local account, then link your platform identities (YouTube,
        X/Twitter, TikTok, etc.) to prove ownership.
      </p>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <a href="/api/auth/signin?provider=google" className="btn">
          Continue with Google
        </a>
        <a href="/api/auth/signin?provider=twitter" className="btn">
          Continue with X / Twitter
        </a>
        <a href="/api/auth/signin?provider=github" className="btn">
          Continue with GitHub
        </a>
      </div>
      <div style={{ marginTop: 16 }}>
        Already have an account? <Link href="/signin">Sign in</Link>
      </div>
      <style jsx>{`
        .btn {
          display: inline-block;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }
      `}</style>
    </main>
  );
}
