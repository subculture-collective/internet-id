"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/session");
        const s = await r.json();
        setSession(s);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Profile</h1>
      {error && <div style={{ color: "crimson" }}>{error}</div>}
      {!session && <div>Loading…</div>}
      {session && (
        <>
          <div style={{ marginBottom: 12 }}>
            Signed in as <b>{session.user?.email || session.user?.name}</b>
          </div>
          <div>
            <a href="/api/auth/signout" className="btn">
              Sign out
            </a>
          </div>
          <section style={{ marginTop: 24 }}>
            <h3>Linked platforms</h3>
            <ul>
              {(session.accounts || []).map((a: any) => (
                <li key={`${a.provider}:${a.providerAccountId}`}>
                  {a.provider} – {a.username || a.providerAccountId}
                </li>
              ))}
            </ul>
            <div style={{ display: "grid", gap: 8 }}>
              <a href="/api/auth/signin?provider=google" className="btn">
                Link Google
              </a>
              <a href="/api/auth/signin?provider=github" className="btn">
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
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }
      `}</style>
    </main>
  );
}
