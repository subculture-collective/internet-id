"use client";
import React, { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export default function VerifyPage() {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [data, setData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runResolve = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      const qs = url
        ? `url=${encodeURIComponent(url)}`
        : `platform=${encodeURIComponent(
            platform
          )}&platformId=${encodeURIComponent(platformId)}`;
      const r = await fetch(`${API_BASE}/api/public-verify?${qs}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Resolve failed");
      setData(j);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const runByteVerify = async () => {
    if (!file || !data?.registryAddress || !data?.manifestURI) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("registryAddress", data.registryAddress);
    fd.append("manifestURI", data.manifestURI);
    const r = await fetch(`${API_BASE}/api/verify`, {
      method: "POST",
      body: fd,
    });
    const j = await r.json();
    if (!r.ok) return alert(j?.error || "Verify failed");
    alert(
      j?.status === "OK"
        ? "Byte-level verification OK ✅"
        : `Verification ${j?.status}`
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <h1>Verify content</h1>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <label>Paste platform URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <div style={{ color: "#999" }}>or choose platform + ID</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">Select platform</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="x">X/Twitter</option>
            <option value="vimeo">Vimeo</option>
            <option value="generic">Generic</option>
          </select>
          <input
            value={platformId}
            onChange={(e) => setPlatformId(e.target.value)}
            placeholder="platform id or URL"
          />
        </div>
        <button onClick={runResolve} disabled={loading}>
          {loading ? "Resolving..." : "Resolve"}
        </button>
      </div>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
      {data && (
        <div style={{ marginTop: 16 }}>
          <h3>Binding</h3>
          <pre
            style={{
              background: "#111",
              color: "#9ef",
              padding: 12,
              borderRadius: 8,
            }}
          >
            {JSON.stringify(
              {
                platform: data.platform,
                platformId: data.platformId,
                creator: data.creator,
                contentHash: data.contentHash,
                manifestURI: data.manifestURI,
                timestamp: data.timestamp,
              },
              null,
              2
            )}
          </pre>

          <h3>Manifest (from IPFS)</h3>
          <pre
            style={{
              background: "#111",
              color: "#9ef",
              padding: 12,
              borderRadius: 8,
            }}
          >
            {JSON.stringify(data.manifest ?? null, null, 2)}
          </pre>

          <h3>Optional: Byte-level verify</h3>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button onClick={runByteVerify} disabled={!file}>
            Verify file against manifest + on-chain
          </button>
        </div>
      )}
    </div>
  );
}
