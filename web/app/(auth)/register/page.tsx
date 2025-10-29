"use client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function RegisterContent() {
  const [mounted, setMounted] = useState(false);
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/profile";
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
        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="btn"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn("twitter", { callbackUrl })}
          className="btn"
        >
          Continue with X / Twitter
        </button>
        <button
          onClick={() => signIn("github", { callbackUrl })}
          className="btn"
        >
          Continue with GitHub
        </button>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
