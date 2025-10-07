"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);
  const [providers, setProviders] = useState<Record<string, any> | null>(null);
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/";
  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const r = await fetch("/api/auth/providers", { cache: "no-store" });
        if (r.ok) {
          const p = await r.json();
          setProviders(p || {});
        } else {
          setProviders({});
        }
      } catch {
        setProviders({});
      }
    })();
  }, []);
  if (!mounted) return null;
  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Sign in</h1>
      <p style={{ color: "#666" }}>
        Sign in with your platform account to prove ownership. You can link
        multiple platforms in your profile.
      </p>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {providers && Object.keys(providers).length === 0 && (
          <div style={{ color: "crimson" }}>
            No auth providers configured. Check your env variables.
          </div>
        )}
        {providers?.google && (
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="btn"
          >
            Sign in with Google
          </button>
        )}
        {providers?.twitter && (
          <a
            href={`/api/auth/signin/twitter?callbackUrl=${encodeURIComponent(
              callbackUrl
            )}`}
            className="btn"
          >
            Sign in with X / Twitter
          </a>
        )}
        {providers?.github && (
          <a
            href={`/api/auth/signin/github?callbackUrl=${encodeURIComponent(
              callbackUrl
            )}`}
            className="btn"
          >
            Sign in with GitHub
          </a>
        )}
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
