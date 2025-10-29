"use client";
import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/auth/session");
        const s = await r.json();
        setSession(s);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: "20px auto", padding: 16 }}>
      <h1>Profile</h1>
      {error && <ErrorMessage error={error} />}
      {loading && <LoadingSpinner message="Loading profile..." />}
      {!loading && !session && <div>Not signed in</div>}
      {!loading && session && (
        <>
          <div style={{ marginBottom: 12 }}>
            Signed in as <b>{session.user?.email || session.user?.name}</b>
          </div>
          <div>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/signout" className="btn">
              Sign out
            </a>
          </div>
          <section style={{ marginTop: 24 }}>
            <h3>Linked platforms</h3>
            <ul style={{ paddingLeft: 20 }}>
              {(session.accounts || []).map((a: any) => (
                <li key={`${a.provider}:${a.providerAccountId}`}>
                  {a.provider} – {a.username || a.providerAccountId}
                </li>
              ))}
            </ul>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/auth/signin/google" className="btn">
                Link Google
              </a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/auth/signin/github" className="btn">
                Link GitHub
              </a>
              {/* Add more providers (Twitter/X, YouTube via Google OAuth scope) */}
            </div>
          </section>
        </>
      )}
      <style jsx>{`
        .btn {
          display: inline-block;
          padding: 10px 16px;
          min-height: 44px;
          border: 1px solid #ddd;
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
        }
        .btn:hover {
          background: #f9fafb;
        }
      `}</style>
    </main>
  );
}
