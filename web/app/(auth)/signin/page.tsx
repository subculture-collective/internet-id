"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Sign in</h1>
      <p style={{ color: "#666" }}>
        Sign in with your platform account to prove ownership. You can link
        multiple platforms in your profile.
      </p>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <a href="/api/auth/signin?provider=google" className="btn">
          Sign in with Google
        </a>
        <a href="/api/auth/signin?provider=twitter" className="btn">
          Sign in with X / Twitter
        </a>
        <a href="/api/auth/signin?provider=github" className="btn">
          Sign in with GitHub
        </a>
        {/* Add more providers as you enable them */}
      </div>
      <div style={{ marginTop: 16 }}>
        New here? <Link href="/register">Create an account</Link>
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
