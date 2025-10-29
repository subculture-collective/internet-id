"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useToast } from "./hooks/useToast";
import { ToastContainer } from "./components/Toast";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";
import SkeletonLoader from "./components/SkeletonLoader";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const PLATFORM_OPTIONS = [
  "youtube",
  "tiktok",
  "instagram",
  "x",
  "twitter",
  "vimeo",
  "twitch",
  "facebook",
  "reddit",
  "pinterest",
  "dailymotion",
  "rumble",
  "bilibili",
  "douyin",
  "kuaishou",
  "weibo",
  "threads",
  "bluesky",
  "mastodon",
];

function explorerTxUrl(
  chainId: number | undefined,
  txHash: string | undefined
) {
  if (!txHash) return undefined;
  switch (chainId) {
    case 1:
      return `https://etherscan.io/tx/${txHash}`;
    case 11155111:
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    case 8453:
      return `https://basescan.org/tx/${txHash}`;
    case 84532:
      return `https://sepolia.basescan.org/tx/${txHash}`;
    default:
      return undefined;
  }
}
function explorerAddressUrl(
  chainId: number | undefined,
  address: string | undefined
) {
  if (!address) return undefined;
  switch (chainId) {
    case 1:
      return `https://etherscan.io/address/${address}`;
    case 11155111:
      return `https://sepolia.etherscan.io/address/${address}`;
    case 8453:
      return `https://basescan.org/address/${address}`;
    case 84532:
      return `https://sepolia.basescan.org/address/${address}`;
    default:
      return undefined;
  }
}

function ipfsToGateway(uri: string | undefined) {
  if (!uri) return undefined;
  if (uri.startsWith("ipfs://")) {
    const p = uri.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${p}`;
  }
  return uri;
}

function platformBindingUrl(platform?: string, platformId?: string) {
  if (!platform || !platformId) return undefined;
  // If platformId is already an absolute URL, return it directly
  if (/^https?:\/\//i.test(platformId)) return platformId;
  const p = platform.toLowerCase();
  if (p === "youtube") {
    return `https://www.youtube.com/watch?v=${platformId}`;
  }
  if (p === "x" || p === "twitter") {
    if (/^\d+$/.test(platformId)) return `https://x.com/i/status/${platformId}`;
    return `https://x.com/${platformId}`;
  }
  if (p === "tiktok") {
    // Normalize potential URL-like platformId (strip protocol, domain, query, fragment)
    const raw = platformId.trim();
    // If it's already an absolute URL, return as-is
    if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        // Normalize host variations like m.tiktok.com, vm.tiktok.com -> www.tiktok.com when possible
        const host = /tiktok\.com$/i.test(u.hostname)
          ? "www.tiktok.com"
          : u.hostname;
        // Prefer path /@user/video/<id> if present; also handle /video/<id> short form
        let path = u.pathname.replace(/^\/+/, "");
        // Convert /video/<id> to /@_/video/<id> as a generic canonical if no username
        path = path.replace(/^video\/(\d+)$/i, "@_/video/$1");
        // Strip trailing slashes
        path = path.replace(/\/$/, "");
        return `https://${host}/${path}`;
      } catch {
        return raw;
      }
    }
    // If numeric only, assume it's a video id without a username
    if (/^\d+$/i.test(raw)) return `https://www.tiktok.com/@_/video/${raw}`;
    // If starts with @ and includes /video/<id>
    if (/^@[^/]+\/video\/\d+$/i.test(raw))
      return `https://www.tiktok.com/${raw}`;
    // If just video/<id>
    if (/^video\/\d+$/i.test(raw))
      return `https://www.tiktok.com/@_/video/${raw.split("/")[1]}`;
    // If it's a username only
    if (/^@[^/]+$/i.test(raw)) return `https://www.tiktok.com/${raw}`;
    // Fallback: treat as path segment (e.g., @user/video/123 or other patterns)
    return `https://www.tiktok.com/${raw.replace(/^\/+/, "")}`;
  }
  if (p === "instagram" || p === "ig") {
    // ID can be /p/<shortcode>, /reel/<id>, or username
    if (/^p\//i.test(platformId) || /^reel\//i.test(platformId))
      return `https://www.instagram.com/${platformId}`;
    return `https://www.instagram.com/${platformId}`;
  }
  if (p === "facebook" || p === "fb") {
    return `https://www.facebook.com/${platformId}`;
  }
  if (p === "vimeo") {
    if (/^\d+$/.test(platformId)) return `https://vimeo.com/${platformId}`;
    return `https://vimeo.com/${platformId}`;
  }
  if (p === "twitch") {
    // Could be channel or video
    if (/^videos\//i.test(platformId))
      return `https://www.twitch.tv/${platformId}`;
    return `https://www.twitch.tv/${platformId}`;
  }
  if (p === "linkedin") {
    return `https://www.linkedin.com/${platformId}`;
  }
  if (p === "snapchat" || p === "snap") {
    return `https://www.snapchat.com/add/${platformId}`;
  }
  if (p === "reddit") {
    return `https://www.reddit.com/${platformId}`;
  }
  if (p === "pinterest") {
    return `https://www.pinterest.com/${platformId}`;
  }
  if (p === "dailymotion") {
    return `https://www.dailymotion.com/${platformId}`;
  }
  if (p === "rumble") {
    return `https://rumble.com/${platformId}`;
  }
  if (p === "bilibili") {
    return `https://www.bilibili.com/${platformId}`;
  }
  if (p === "douyin") {
    return `https://www.douyin.com/${platformId}`;
  }
  if (p === "kuaishou") {
    return `https://www.kuaishou.com/${platformId}`;
  }
  if (p === "weibo") {
    return `https://weibo.com/${platformId}`;
  }
  if (p === "threads") {
    return `https://www.threads.net/${platformId}`;
  }
  if (p === "bluesky") {
    return `https://bsky.app/profile/${platformId}`;
  }
  if (p === "mastodon") {
    // Expect instance/path in platformId
    return `https://${platformId}`;
  }
  return undefined;
}

function CopyButton({ text, label }: { text?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const canCopy = Boolean(text);
  return (
    <button
      style={{ marginLeft: 6, fontSize: 12, padding: "2px 6px" }}
      disabled={!canCopy}
      onClick={async () => {
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          // Fire a global event so Home can show a toast
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("copied", { detail: { text, label } })
            );
          }
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      title={canCopy ? `Copy ${label || "value"}` : "Nothing to copy"}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

async function postJson<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function postMultipart<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function Home() {
  const [tab, setTab] = useState<string>("upload");
  const [browseRefreshKey, setBrowseRefreshKey] = useState(0);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const toast = useToast();

  useEffect(() => {
    // Fetch network chainId once for explorer links
    getJson<{ chainId: number }>("/api/network")
      .then((r) => setChainId(r.chainId))
      .catch(() => {});
    // Listen for copy confirmations
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        text?: string;
        label?: string;
      };
      const what = detail?.label || "value";
      toast.success(`${what} copied to clipboard`);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("copied", handler as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("copied", handler as EventListener);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // toast is stable from useToast hook
  return (
    <main>
      <h1>Internet-ID</h1>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <div className="tabs">
        {[
          ["upload", "Upload"],
          ["one", "One-shot"],
          ["manifest", "Manifest"],
          ["register", "Register"],
          ["verify", "Verify"],
          ["proof", "Proof"],
          ["bind", "Bind"],
          ["browse", "Browse"],
          ["verifications", "Verifications"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "upload" && <UploadForm toast={toast} />}
      {tab === "one" && (
        <OneShotForm
          toast={toast}
          onComplete={() => {
            toast.success(
              "One-shot complete: uploaded, manifested, and registered."
            );
            setBrowseRefreshKey((n) => n + 1);
          }}
        />
      )}
      {tab === "manifest" && <ManifestForm toast={toast} />}
      {tab === "register" && <RegisterForm toast={toast} />}
      {tab === "verify" && <VerifyForm toast={toast} />}
      {tab === "proof" && <ProofForm toast={toast} />}
      {tab === "bind" && <BindForm toast={toast} />}
      {tab === "browse" && (
        <BrowseContents refreshKey={browseRefreshKey} chainId={chainId} toast={toast} />
      )}
      {tab === "verifications" && <VerificationsView toast={toast} />}
    </main>
  );
}

function UploadForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    try {
      setErr(null);
      setLoading(true);
      const fd = new FormData();
      if (!file) return;
      fd.append("file", file);
      const r = await postMultipart<{ cid: string; uri: string }>(
        "/api/upload",
        fd
      );
      setResult(r);
      toast.success("File uploaded to IPFS successfully!");
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setErr(errorMsg);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Upload to IPFS</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ width: "100%" }}
      />
      <div>
        <button disabled={!file || loading} onClick={handleUpload} style={{ width: "100%", marginTop: "8px" }}>
          {loading ? <LoadingSpinner size="sm" inline message="Uploading..." /> : "Upload"}
        </button>
      </div>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <ErrorMessage error={err} onRetry={handleUpload} />}
    </section>
  );
}

function OneShotForm({ onComplete, toast }: { onComplete?: () => void; toast: ReturnType<typeof useToast> }) {
  const [file, setFile] = useState<File | null>(null);
  const [registryAddress, setRegistryAddress] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [platformId, setPlatformId] = useState("");
  const [bindingsJson, setBindingsJson] = useState<string>(
    `[{ "platform": "youtube", "platformId": "VIDEO_ID" }]`
  );
  const [platformSelect, setPlatformSelect] = useState<string>("youtube");
  const [platformUrl, setPlatformUrl] = useState<string>("");
  type LinkRow = { platform: string; url: string };
  const [linkRows, setLinkRows] = useState<LinkRow[]>([]);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadContent, setUploadContent] = useState<boolean>(false);
  // Prefill registry if available
  useEffect(() => {
    getJson<{ registryAddress: string; chainId: number }>("/api/registry")
      .then((r) => setRegistryAddress((prev) => prev || r.registryAddress))
      .catch(() => {});
  }, []);
  // Auto-generate bindings JSON from dropdown + URL
  useEffect(() => {
    const items: Array<{ platform: string; platformId: string }> = [];
    if (platformUrl)
      items.push({ platform: platformSelect, platformId: platformUrl });
    for (const r of linkRows) {
      if (r.url) items.push({ platform: r.platform, platformId: r.url });
    }
    if (items.length > 0) setBindingsJson(JSON.stringify(items, null, 2));
  }, [platformSelect, platformUrl, linkRows]);
  return (
    <section>
      <h2>One-shot: Upload → Manifest → Register</h2>
      <label>Registry address</label>
      <input
        value={registryAddress}
        onChange={(e) => setRegistryAddress(e.target.value)}
        placeholder="0x..."
        style={{ width: "100%" }}
      />
      <div
        className="row"
        style={{
          margin: "8px 0",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label style={{ marginTop: 0 }}>Platform</label>
        <select
          value={platformSelect}
          onChange={(e) => setPlatformSelect(e.target.value)}
          style={{ minWidth: "150px" }}
        >
          {[
            "youtube",
            "tiktok",
            "instagram",
            "x",
            "twitter",
            "vimeo",
            "twitch",
            "facebook",
            "reddit",
            "pinterest",
            "dailymotion",
            "rumble",
            "bilibili",
            "douyin",
            "kuaishou",
            "weibo",
            "threads",
            "bluesky",
            "mastodon",
          ].map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <input
          value={platformUrl}
          onChange={(e) => setPlatformUrl(e.target.value)}
          placeholder="Paste a link to your video/post"
          style={{ flex: 1, minWidth: "200px", width: "100%" }}
        />
        <div style={{ fontSize: 12, color: "#666" }}>
          This will auto-generate the Bindings JSON below.
        </div>
      </div>
      <div className="row" style={{ margin: "8px 0", display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Additional links</div>
        {linkRows.map((row: LinkRow, idx: number) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={row.platform}
              onChange={(e) => {
                const v = e.target.value;
                setLinkRows((arr: LinkRow[]) =>
                  arr.map((r: LinkRow, i: number) =>
                    i === idx ? { ...r, platform: v } : r
                  )
                );
              }}
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <input
              value={row.url}
              onChange={(e) => {
                const v = e.target.value;
                setLinkRows((arr: LinkRow[]) =>
                  arr.map((r: LinkRow, i: number) =>
                    i === idx ? { ...r, url: v } : r
                  )
                );
              }}
              placeholder="Paste a link to your video/post"
              style={{ flex: 1, minWidth: "200px" }}
            />
            <button
              type="button"
              title="Remove"
              onClick={() =>
                setLinkRows((arr: LinkRow[]) =>
                  arr.filter((_: LinkRow, i: number) => i !== idx)
                )
              }
              style={{ padding: "4px 8px" }}
            >
              −
            </button>
            {idx === linkRows.length - 1 && (
              <button
                type="button"
                title="Add another"
                onClick={() =>
                  setLinkRows((arr: LinkRow[]) => [
                    ...arr,
                    { platform: "youtube", url: "" },
                  ])
                }
                style={{ padding: "4px 8px" }}
              >
                +
              </button>
            )}
          </div>
        ))}
        {linkRows.length === 0 && (
          <div>
            <button
              type="button"
              onClick={() => setLinkRows([{ platform: "youtube", url: "" }])}
            >
              + Add a link
            </button>
          </div>
        )}
      </div>
      <div className="row" style={{ margin: "8px 0" }}>
        <label>Bindings JSON (optional)</label>
        <textarea
          value={bindingsJson}
          onChange={(e) => setBindingsJson(e.target.value)}
          placeholder='[ { "platform": "youtube", "platformId": "VIDEO_ID" } ]'
          rows={4}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
        <div style={{ fontSize: 12, color: "#666" }}>
          Provide an array of bindings. Each item:{" "}
          <code>
            {'{ "platform": "platform-name", "platformId": "id-or-url" }'}
          </code>
          . Absolute URLs are accepted.
        </div>
      </div>
      <div className="row" style={{ margin: "8px 0" }}>
        <label>
          <input
            type="checkbox"
            checked={uploadContent}
            onChange={(e) => setUploadContent(e.target.checked)}
          />{" "}
          Upload video to IPFS (optional)
        </label>
      </div>
      <label>File</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ width: "100%" }}
      />
      <button
        disabled={!file || !registryAddress || loading}
        onClick={async () => {
          try {
            setErr(null);
            setLoading(true);
            const fd = new FormData();
            if (!file) return;
            fd.append("file", file);
            fd.append("registryAddress", registryAddress);
            fd.append("uploadContent", String(uploadContent));
            if (platform && platformId) {
              fd.append("platform", platform);
              fd.append("platformId", platformId);
            }
            if (bindingsJson) {
              fd.append("bindings", bindingsJson);
            }
            // Use authenticated proxy to enforce ownership checks
            const res = await fetch(`/api/app/one-shot`, {
              method: "POST",
              body: fd,
            });
            if (!res.ok) throw new Error(await res.text());
            const r = await res.json();
            setResult(r);
            onComplete?.();
          } catch (e: any) {
            const errorMsg = e?.message || String(e);
            setErr(errorMsg);
            toast.error("One-shot operation failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? <LoadingSpinner size="sm" inline message="Processing..." /> : "Run one-shot"}
      </button>
      {result && (
        <div>
          <h3>Result</h3>
          <div>
            <b>contentCid:</b> {result.contentCid}
            <CopyButton text={result.contentCid} label="contentCid" />
          </div>
          <div>
            <b>contentUri:</b> {result.contentUri}{" "}
            {ipfsToGateway(result.contentUri) && (
              <a
                href={ipfsToGateway(result.contentUri)}
                target="_blank"
                rel="noreferrer"
              >
                (view)
              </a>
            )}
            <CopyButton text={result.contentUri} label="contentUri" />
          </div>
          <div>
            <b>contentHash:</b> {result.contentHash}
            <CopyButton text={result.contentHash} label="contentHash" />
          </div>
          <div>
            <b>manifestCid:</b> {result.manifestCid}
            <CopyButton text={result.manifestCid} label="manifestCid" />
          </div>
          <div>
            <b>manifestURI:</b> {result.manifestURI}{" "}
            {ipfsToGateway(result.manifestURI) && (
              <a
                href={ipfsToGateway(result.manifestURI)}
                target="_blank"
                rel="noreferrer"
              >
                (view)
              </a>
            )}
            <CopyButton text={result.manifestURI} label="manifestURI" />
          </div>
          <div>
            <b>txHash:</b> {result.txHash}{" "}
            {explorerTxUrl(result.chainId, result.txHash) && (
              <a
                href={explorerTxUrl(result.chainId, result.txHash)}
                target="_blank"
                rel="noreferrer"
              >
                (explorer)
              </a>
            )}
            <CopyButton text={result.txHash} label="txHash" />
          </div>
          {result.bindTxHash && (
            <div>
              <b>bindTxHash:</b> {result.bindTxHash}{" "}
              {explorerTxUrl(result.chainId, result.bindTxHash) && (
                <a
                  href={explorerTxUrl(result.chainId, result.bindTxHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  (explorer)
                </a>
              )}
              <CopyButton text={result.bindTxHash} label="bindTxHash" />
            </div>
          )}
          {result.chainId != null && (
            <div>
              <b>chainId:</b> {result.chainId}
            </div>
          )}
          {Array.isArray(result.bindTxHashes) &&
            result.bindTxHashes.length > 0 && (
              <div>
                <b>bindTxHashes:</b>
                <ul>
                  {result.bindTxHashes.map((h: string, i: number) => (
                    <li key={i}>
                      {h}{" "}
                      {explorerTxUrl(result.chainId, h) && (
                        <a
                          href={explorerTxUrl(result.chainId, h)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          (explorer)
                        </a>
                      )}
                      <CopyButton text={h} label={`bindTxHash #${i + 1}`} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}
      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>Share</h3>
          {(() => {
            const siteBase =
              process.env.NEXT_PUBLIC_SITE_BASE ||
              (typeof window !== "undefined" ? window.location.origin : "");
            const badgeUrl = `${siteBase}/api/badge/${
              result.contentHash || ""
            }`;
            let bindings: Array<{ platform: string; platformId: string }> = [];
            try {
              const arr = JSON.parse(bindingsJson);
              if (Array.isArray(arr)) {
                bindings = arr
                  .filter((b: any) => b && b.platform && b.platformId)
                  .map((b: any) => ({
                    platform: String(b.platform),
                    platformId: String(b.platformId),
                  }));
              }
            } catch {}
            // Fallback to primary dropdown + url if no JSON parsed
            if (bindings.length === 0 && platformSelect && platformUrl) {
              bindings = [
                { platform: platformSelect, platformId: platformUrl },
              ];
            }
            // Build a copy-all bundle string
            const lines: string[] = [];
            lines.push("Verified on-chain");
            if (result.contentHash)
              lines.push(`Content hash: ${result.contentHash}`);
            lines.push(`Badge: ${badgeUrl}`);
            if (Array.isArray(bindings) && bindings.length) {
              lines.push("", "Links:");
              for (const b of bindings) {
                const shareUrl = `${siteBase}/verify?platform=${encodeURIComponent(
                  b.platform
                )}&platformId=${encodeURIComponent(b.platformId)}`;
                const qrUrl = `${siteBase}/api/qr?url=${encodeURIComponent(
                  shareUrl
                )}`;
                const embedHtml = `<a href="${shareUrl}" target="_blank" rel="noopener"><img alt="Verified" src="${badgeUrl}" /></a>`;
                lines.push(
                  `- ${b.platform}: ${b.platformId}`,
                  `  share: ${shareUrl}`,
                  `  qr: ${qrUrl}`,
                  `  embed: ${embedHtml}`
                );
              }
            }
            const copyAll = lines.join("\n");
            return (
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <CopyButton text={copyAll} label="share bundle" />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>Badge</div>
                  <div>
                    <a href={badgeUrl} target="_blank" rel="noreferrer">
                      {badgeUrl}
                    </a>
                    <CopyButton text={badgeUrl} label="badge URL" />
                  </div>
                </div>
                {bindings.length > 0 ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 600 }}>Per-link share</div>
                    <ul>
                      {bindings.map((b, i) => {
                        const shareUrl = `${siteBase}/verify?platform=${encodeURIComponent(
                          b.platform
                        )}&platformId=${encodeURIComponent(b.platformId)}`;
                        const qrUrl = `${siteBase}/api/qr?url=${encodeURIComponent(
                          shareUrl
                        )}`;
                        const embedHtml = `<a href="${shareUrl}" target="_blank" rel="noopener"><img alt="Verified" src="${badgeUrl}" /></a>`;
                        return (
                          <li
                            key={`${b.platform}-${i}`}
                            style={{ marginBottom: 8 }}
                          >
                            <div>
                              <b>{b.platform}:</b> {b.platformId}
                            </div>
                            <div>
                              Link:{" "}
                              <a
                                href={shareUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {shareUrl}
                              </a>
                              <CopyButton
                                text={shareUrl}
                                label={`share link #${i + 1}`}
                              />
                            </div>
                            <div>
                              Embed HTML:{" "}
                              <CopyButton
                                text={embedHtml}
                                label={`embed HTML #${i + 1}`}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span>QR:</span>
                              <img
                                src={qrUrl}
                                alt="QR"
                                width={96}
                                height={96}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div style={{ color: "#666" }}>
                    Add a platform link above to generate share links.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      {err && <ErrorMessage error={err} />}
    </section>
  );
}

function ManifestForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [file, setFile] = useState<File | null>(null);
  const [contentUri, setContentUri] = useState<string>("");
  const [doUpload, setDoUpload] = useState<boolean>(true);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    try {
      setErr(null);
      setLoading(true);
      const fd = new FormData();
      if (!file) return;
      fd.append("file", file);
      fd.append("contentUri", contentUri);
      fd.append("upload", String(doUpload));
      const r = await postMultipart("/api/manifest", fd);
      setResult(r);
      toast.success("Manifest created successfully!");
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setErr(errorMsg);
      toast.error("Manifest creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Create manifest</h2>
      <label>Content URI (ipfs://...)</label>
      <input
        value={contentUri}
        onChange={(e) => setContentUri(e.target.value)}
        placeholder="ipfs://<CID>"
        style={{ width: "100%" }}
      />
      <label>File</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ width: "100%" }}
      />
      <div className="row">
        <label>
          <input
            type="checkbox"
            checked={doUpload}
            onChange={(e) => setDoUpload(e.target.checked)}
          />{" "}
          Upload manifest to IPFS
        </label>
      </div>
      <button disabled={!file || !contentUri || loading} onClick={handleCreate} style={{ width: "100%", marginTop: "8px" }}>
        {loading ? <LoadingSpinner size="sm" inline message="Creating..." /> : "Create"}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <ErrorMessage error={err} onRetry={handleCreate} />}
    </section>
  );
}

function RegisterForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [file, setFile] = useState<File | null>(null);
  const [manifestURI, setManifestURI] = useState<string>("");
  const [registryAddress, setRegistryAddress] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setErr(null);
      setLoading(true);
      const fd = new FormData();
      if (!file) return;
      fd.append("file", file);
      fd.append("manifestURI", manifestURI);
      fd.append("registryAddress", registryAddress);
      const r = await postMultipart("/api/register", fd);
      setResult(r);
      toast.success("Content registered on-chain successfully!");
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setErr(errorMsg);
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Register on-chain</h2>
      <label>Registry address</label>
      <input
        value={registryAddress}
        onChange={(e) => setRegistryAddress(e.target.value)}
        placeholder="0x..."
        style={{ width: "100%" }}
      />
      <label>Manifest URI</label>
      <input
        value={manifestURI}
        onChange={(e) => setManifestURI(e.target.value)}
        placeholder="ipfs://<manifestCID>"
        style={{ width: "100%" }}
      />
      <label>File</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ width: "100%" }}
      />
      <button
        disabled={!file || !manifestURI || !registryAddress || loading}
        onClick={handleRegister}
        style={{ width: "100%", marginTop: "8px" }}
      >
        {loading ? <LoadingSpinner size="sm" inline message="Registering..." /> : "Register"}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <ErrorMessage error={err} onRetry={handleRegister} />}
    </section>
  );
}

function VerifyForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [file, setFile] = useState<File | null>(null);
  const [manifestURI, setManifestURI] = useState<string>("");
  const [registryAddress, setRegistryAddress] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    try {
      setErr(null);
      setLoading(true);
      const fd = new FormData();
      if (!file) return;
      fd.append("file", file);
      fd.append("manifestURI", manifestURI);
      fd.append("registryAddress", registryAddress);
      const r = await postMultipart<{ status: string }>("/api/verify", fd);
      setResult(r);
      if (r.status === "OK") {
        toast.success("Verification successful!");
      } else {
        toast.warning(`Verification completed with status: ${r.status}`);
      }
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setErr(errorMsg);
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Verify</h2>
      <label>Registry address</label>
      <input
        value={registryAddress}
        onChange={(e) => setRegistryAddress(e.target.value)}
        placeholder="0x..."
        style={{ width: "100%" }}
      />
      <label>Manifest URI</label>
      <input
        value={manifestURI}
        onChange={(e) => setManifestURI(e.target.value)}
        placeholder="ipfs://<manifestCID>"
        style={{ width: "100%" }}
      />
      <label>File</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ width: "100%" }}
      />
      <button
        disabled={!file || !manifestURI || !registryAddress || loading}
        onClick={handleVerify}
        style={{ width: "100%", marginTop: "8px" }}
      >
        {loading ? <LoadingSpinner size="sm" inline message="Verifying..." /> : "Verify"}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <ErrorMessage error={err} onRetry={handleVerify} />}
    </section>
  );
}

function ProofForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [file, setFile] = useState<File | null>(null);
  const [manifestURI, setManifestURI] = useState<string>("");
  const [registryAddress, setRegistryAddress] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setErr(null);
      setLoading(true);
      const fd = new FormData();
      if (!file) return;
      fd.append("file", file);
      fd.append("manifestURI", manifestURI);
      fd.append("registryAddress", registryAddress);
      const r = await postMultipart("/api/proof", fd);
      setResult(r);
      toast.success("Proof generated successfully!");
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setErr(errorMsg);
      toast.error("Proof generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Proof</h2>
      <label>Registry address</label>
      <input
        value={registryAddress}
        onChange={(e) => setRegistryAddress(e.target.value)}
        placeholder="0x..."
        style={{ width: "100%" }}
      />
      <label>Manifest URI</label>
      <input
        value={manifestURI}
        onChange={(e) => setManifestURI(e.target.value)}
        placeholder="ipfs://<manifestCID>"
        style={{ width: "100%" }}
      />
      <label>File</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ width: "100%" }}
      />
      <button
        disabled={!file || !manifestURI || !registryAddress || loading}
        onClick={handleGenerate}
        style={{ width: "100%", marginTop: "8px" }}
      >
        {loading ? <LoadingSpinner size="sm" inline message="Generating..." /> : "Generate"}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <ErrorMessage error={err} onRetry={handleGenerate} />}
    </section>
  );
}

function BindForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [registryAddress, setRegistryAddress] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [platformId, setPlatformId] = useState("");
  const [contentHash, setContentHash] = useState("");
  const [bindingsJson, setBindingsJson] = useState<string>(
    `[{ "platform": "youtube", "platformId": "VIDEO_ID" }]`
  );
  const [platformSelect, setPlatformSelect] = useState<string>("youtube");
  const [platformUrl, setPlatformUrl] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getJson<{ registryAddress: string; chainId: number }>("/api/registry")
      .then((r) => setRegistryAddress((prev) => prev || r.registryAddress))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!platformUrl) return;
    const item = { platform: platformSelect, platformId: platformUrl };
    setBindingsJson(JSON.stringify([item], null, 2));
  }, [platformSelect, platformUrl]);
  return (
    <section>
      <h2>Bind Platform</h2>
      <p>
        Bind a platform ID (e.g., YouTube videoId) to a registered content hash.
      </p>
      <label>Registry address</label>
      <input
        value={registryAddress}
        onChange={(e) => setRegistryAddress(e.target.value)}
        placeholder="0x..."
        style={{ width: "100%" }}
      />
      <label>Platform</label>
      <select
        value={platformSelect}
        onChange={(e) => setPlatformSelect(e.target.value)}
        style={{ width: "100%" }}
      >
        {[
          "youtube",
          "tiktok",
          "instagram",
          "x",
          "twitter",
          "vimeo",
          "twitch",
          "facebook",
          "reddit",
          "pinterest",
          "dailymotion",
          "rumble",
          "bilibili",
          "douyin",
          "kuaishou",
          "weibo",
          "threads",
          "bluesky",
          "mastodon",
        ].map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <label>Platform URL or ID</label>
      <input
        value={platformUrl}
        onChange={(e) => setPlatformUrl(e.target.value)}
        placeholder="Paste a link to your video/post"
        style={{ width: "100%" }}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <label>Bindings JSON (optional for multiple)</label>
        <textarea
          value={bindingsJson}
          onChange={(e) => setBindingsJson(e.target.value)}
          placeholder='[ { "platform": "youtube", "platformId": "VIDEO_ID" } ]'
          rows={4}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
        <div style={{ fontSize: 12, color: "#666" }}>
          Leave empty to use single Platform/Platform ID fields above; otherwise
          supply an array to bind multiple in one request.
        </div>
      </div>
      <label>Content Hash</label>
      <input
        value={contentHash}
        onChange={(e) => setContentHash(e.target.value)}
        placeholder="0x... (bytes32)"
        style={{ width: "100%" }}
      />
      <button
        disabled={!registryAddress || !contentHash || loading}
        onClick={async () => {
          try {
            setErr(null);
            setLoading(true);
            let r: any;
            if (bindingsJson && bindingsJson.trim().length > 0) {
              const res = await fetch(`/api/app/bind-many`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  registryAddress,
                  contentHash,
                  bindings: bindingsJson,
                }),
              });
              if (!res.ok) throw new Error(await res.text());
              r = await res.json();
            } else {
              const res = await fetch(`/api/app/bind`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  registryAddress,
                  platform,
                  platformId,
                  contentHash,
                }),
              });
              if (!res.ok) throw new Error(await res.text());
              r = await res.json();
            }
            setResult(r);
            toast.success("Platform binding successful!");
          } catch (e: any) {
            const errorMsg = e?.message || String(e);
            setErr(errorMsg);
            toast.error("Binding failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? <LoadingSpinner size="sm" inline message="Binding..." /> : "Bind"}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <ErrorMessage error={err} />}
    </section>
  );
}

function BrowseContents({
  refreshKey = 0,
  chainId,
  toast,
}: {
  refreshKey?: number;
  chainId?: number;
  toast: ReturnType<typeof useToast>;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getJson<any[]>("/api/contents");
      setItems(r);
      setErr(null);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setErr(errorMsg);
      toast.error("Failed to fetch contents");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [refreshKey, fetchItems]);

  return (
    <section>
      <h2>Browse Contents</h2>
      <button
        disabled={loading}
        onClick={fetchItems}
      >
        {loading ? <LoadingSpinner size="sm" inline message="Loading..." /> : "Refresh"}
      </button>
      {loading && items.length === 0 && (
        <SkeletonLoader height="60px" count={3} />
      )}
      {err && <ErrorMessage error={err} onRetry={fetchItems} />}
      <ul>
        {items.map((c) => (
          <li key={c.id}>
            <div>
              <b>hash:</b> {c.contentHash}
            </div>
            {c.manifestUri && (
              <div>
                <b>manifest:</b> {c.manifestUri}{" "}
                {ipfsToGateway(c.manifestUri) && (
                  <a
                    href={ipfsToGateway(c.manifestUri)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    (view)
                  </a>
                )}
                <CopyButton text={c.manifestUri} label="manifestURI" />
              </div>
            )}
            {c.registryAddress && (
              <div>
                <b>registry:</b> {c.registryAddress}{" "}
                {explorerAddressUrl(chainId, c.registryAddress) && (
                  <a
                    href={explorerAddressUrl(chainId, c.registryAddress)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    (explorer)
                  </a>
                )}
                <CopyButton text={c.registryAddress} label="registry" />
              </div>
            )}
            {c.txHash && (
              <div>
                <b>tx:</b> {c.txHash}{" "}
                {explorerTxUrl(chainId, c.txHash) && (
                  <a
                    href={explorerTxUrl(chainId, c.txHash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    (explorer)
                  </a>
                )}
                <CopyButton text={c.txHash} label="txHash" />
              </div>
            )}
            {Array.isArray((c as any).bindings) &&
              (c as any).bindings.length > 0 && (
                <div>
                  <b>bindings:</b>
                  <ul>
                    {(c as any).bindings.map((b: any) => {
                      const href = platformBindingUrl(b.platform, b.platformId);
                      return (
                        <li key={b.id}>
                          {b.platform}: {b.platformId}{" "}
                          {href && (
                            <a href={href} target="_blank" rel="noreferrer">
                              (open)
                            </a>
                          )}
                          <CopyButton
                            text={b.platformId}
                            label={`${b.platform} id`}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            <VerifyInline
              manifestUri={c.manifestUri}
              registryAddress={c.registryAddress}
            />
            <ShareBlock
              contentHash={c.contentHash}
              bindings={(c as any).bindings || []}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function VerifyInline({
  manifestUri,
  registryAddress,
}: {
  manifestUri?: string;
  registryAddress?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canVerify = Boolean(file && manifestUri && registryAddress);
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee" }}>
      <div style={{ marginBottom: 4 }}>Inline Verify</div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ width: "100%" }}
      />
      <button
        disabled={!canVerify || loading}
        onClick={async () => {
          try {
            setErr(null);
            setLoading(true);
            if (!file || !manifestUri || !registryAddress) return;
            const fd = new FormData();
            fd.append("file", file);
            fd.append("manifestURI", manifestUri);
            fd.append("registryAddress", registryAddress);
            const r = await postMultipart("/api/verify", fd);
            setResult(r);
          } catch (e: any) {
            setErr(e?.message || String(e));
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
      {result && (
        <div>
          <b>status:</b> {result.status}
        </div>
      )}
      {err && <div style={{ color: "crimson" }}>{err}</div>}
    </div>
  );
}

function ShareBlock({
  contentHash,
  bindings,
}: {
  contentHash?: string;
  bindings?: Array<{ platform: string; platformId: string }>;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [width, setWidth] = useState<number>(240);
  const siteBase =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_BASE) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  if (!contentHash) return null;
  const badgeUrl = `${siteBase}/api/badge/${contentHash}?theme=${theme}&w=${width}`;
  const list = Array.isArray(bindings) ? bindings : [];
  // Build copy-all bundle
  const bundleLines: string[] = [];
  bundleLines.push("Verified on-chain");
  bundleLines.push(`Content hash: ${contentHash}`);
  bundleLines.push(`Badge: ${badgeUrl}`);
  if (list.length) {
    bundleLines.push("", "Links:");
    for (const b of list) {
      const shareUrl = `${siteBase}/verify?platform=${encodeURIComponent(
        b.platform
      )}&platformId=${encodeURIComponent(b.platformId)}`;
      const qrUrl = `${siteBase}/api/qr?url=${encodeURIComponent(shareUrl)}`;
      const embedHtml = `<a href="${shareUrl}" target="_blank" rel="noopener"><img alt="Verified" src="${badgeUrl}" /></a>`;
      bundleLines.push(
        `- ${b.platform}: ${b.platformId}`,
        `  share: ${shareUrl}`,
        `  qr: ${qrUrl}`,
        `  embed: ${embedHtml}`
      );
    }
  }
  const copyAll = bundleLines.join("\n");
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #ddd" }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <b>Share</b>
        <CopyButton text={copyAll} label="share bundle" />
        <label>
          Theme:{" "}
          <select
            value={theme}
            onChange={(e) => setTheme((e.target.value as any) || "dark")}
          >
            <option value="dark">dark</option>
            <option value="light">light</option>
          </select>
        </label>
        <label>
          Width:{" "}
          <input
            type="number"
            min={120}
            max={640}
            value={width}
            onChange={(e) =>
              setWidth(
                Math.max(
                  120,
                  Math.min(640, parseInt(e.target.value || "240", 10))
                )
              )
            }
            style={{ width: 90 }}
          />
          px
        </label>
      </div>
      <div style={{ marginTop: 6 }}>
        <div style={{ fontWeight: 600 }}>Badge</div>
        <div>
          <a href={badgeUrl} target="_blank" rel="noreferrer">
            {badgeUrl}
          </a>
          <CopyButton text={badgeUrl} label="badge URL" />
        </div>
      </div>
      {list.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600 }}>Per-link share</div>
          <ul>
            {list.map((b, i) => {
              const shareUrl = `${siteBase}/verify?platform=${encodeURIComponent(
                b.platform
              )}&platformId=${encodeURIComponent(b.platformId)}`;
              const qrUrl = `${siteBase}/api/qr?url=${encodeURIComponent(
                shareUrl
              )}`;
              const embedHtml = `<a href="${shareUrl}" target="_blank" rel="noopener"><img alt="Verified" src="${badgeUrl}" /></a>`;
              return (
                <li key={`${b.platform}-${i}`} style={{ marginBottom: 6 }}>
                  <div>
                    <b>{b.platform}:</b> {b.platformId}
                  </div>
                  <div>
                    Link:{" "}
                    <a href={shareUrl} target="_blank" rel="noreferrer">
                      {shareUrl}
                    </a>
                    <CopyButton
                      text={shareUrl}
                      label={`share link #${i + 1}`}
                    />
                  </div>
                  <div>
                    Embed HTML:{" "}
                    <CopyButton
                      text={embedHtml}
                      label={`embed HTML #${i + 1}`}
                    />
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span>QR:</span>
                    <img src={qrUrl} alt="QR" width={72} height={72} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div style={{ marginTop: 8, color: "#666" }}>
          No bindings yet — bind a platform to generate share links.
        </div>
      )}
    </div>
  );
}

function VerificationsView({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [contentHash, setContentHash] = useState("");
  const [limit, setLimit] = useState(50);
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    try {
      setErr(null);
      setLoading(true);
      const qs = new URLSearchParams();
      if (contentHash) qs.set("contentHash", contentHash);
      if (limit) qs.set("limit", String(limit));
      const r = await getJson<any[]>(
        `/api/verifications?${qs.toString()}`
      );
      setItems(r);
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setErr(errorMsg);
      toast.error("Failed to fetch verifications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Verifications</h2>
      <label>Content Hash</label>
      <input
        value={contentHash}
        onChange={(e) => setContentHash(e.target.value)}
        placeholder="0x... (optional)"
        style={{ width: "100%" }}
      />
      <label>Limit</label>
      <input
        type="number"
        value={limit}
        onChange={(e) => setLimit(parseInt(e.target.value || "0", 10))}
        min={1}
        max={100}
        style={{ width: "100%" }}
      />
      <button disabled={loading} onClick={handleFetch} style={{ width: "100%", marginTop: "8px" }}>
        {loading ? <LoadingSpinner size="sm" inline message="Fetching..." /> : "Fetch"}
      </button>
      {err && <ErrorMessage error={err} onRetry={handleFetch} />}
      <ul>
        {items.map((v) => (
          <li key={v.id}>
            <div>
              <b>status:</b> {v.status} <b>hash:</b> {v.contentHash}
            </div>
            <div>
              <b>recovered:</b> {v.recoveredAddress} <b>onchain:</b>{" "}
              {v.creatorOnchain}
            </div>
            <div style={{ wordBreak: "break-all" }}>
              <b>manifest:</b> {v.manifestUri}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
