"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "../components/Toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_BASE || "";

interface Content {
  id: string;
  contentHash: string;
  contentUri?: string;
  manifestCid?: string;
  manifestUri?: string;
  creatorAddress: string;
  registryAddress?: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
  bindings: PlatformBinding[];
  verifications?: Verification[];
}

interface PlatformBinding {
  id: string;
  platform: string;
  platformId: string;
  contentId: string;
  createdAt: string;
}

interface Verification {
  id: string;
  contentHash: string;
  manifestUri: string;
  recoveredAddress: string;
  creatorOnchain: string;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  totalContents: number;
  totalVerifications: number;
  successRate: number;
  platformsUsed: string[];
  statusBreakdown: Record<string, number>;
}

function explorerTxUrl(txHash: string | undefined, chainId?: number) {
  if (!txHash) return undefined;
  const id = chainId || 84532; // Default to Base Sepolia
  switch (id) {
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

function ipfsToGateway(uri: string | undefined) {
  if (!uri) return undefined;
  if (uri.startsWith("ipfs://")) {
    const p = uri.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${p}`;
  }
  return uri;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function getStatusBadgeColor(status: string) {
  const s = status.toLowerCase();
  if (s === "ok" || s === "verified") return "#10b981";
  if (s === "warn" || s === "pending") return "#f59e0b";
  if (s === "fail" || s === "failed") return "#ef4444";
  return "#6b7280";
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

export default function DashboardPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [contentsData, verificationsData, networkData] = await Promise.all([
        getJson<Content[]>("/api/contents"),
        getJson<Verification[]>("/api/verifications?limit=100"),
        getJson<{ chainId: number }>("/api/network").catch(() => ({ chainId: 84532 })),
      ]);
      setContents(contentsData);
      setVerifications(verificationsData);
      setChainId(networkData.chainId);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 10 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const stats = useMemo<DashboardStats>(() => {
    const platformsSet = new Set<string>();
    contents.forEach((c) => {
      c.bindings.forEach((b) => platformsSet.add(b.platform));
    });

    const statusBreakdown: Record<string, number> = {};
    verifications.forEach((v) => {
      statusBreakdown[v.status] = (statusBreakdown[v.status] || 0) + 1;
    });

    const successCount = verifications.filter(
      (v) => v.status === "OK" || v.status === "verified"
    ).length;
    const successRate =
      verifications.length > 0 ? (successCount / verifications.length) * 100 : 0;

    return {
      totalContents: contents.length,
      totalVerifications: verifications.length,
      successRate: Math.round(successRate),
      platformsUsed: Array.from(platformsSet),
      statusBreakdown,
    };
  }, [contents, verifications]);

  const filteredContents = useMemo(() => {
    let filtered = [...contents];

    // Filter by platform
    if (filterPlatform !== "all") {
      filtered = filtered.filter((c) =>
        c.bindings.some((b) => b.platform === filterPlatform)
      );
    }

    // Filter by status (based on verification status)
    if (filterStatus !== "all") {
      filtered = filtered.filter((c) => {
        const contentVerifications = verifications.filter(
          (v) => v.contentHash === c.contentHash
        );
        if (contentVerifications.length === 0) return filterStatus === "pending";
        return contentVerifications.some((v) => v.status.toLowerCase() === filterStatus);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        // Sort by status
        const getStatus = (c: Content) => {
          const v = verifications.find((v) => v.contentHash === c.contentHash);
          return v?.status || "pending";
        };
        const statusA = getStatus(a);
        const statusB = getStatus(b);
        return sortOrder === "asc"
          ? statusA.localeCompare(statusB)
          : statusB.localeCompare(statusA);
      }
    });

    return filtered;
  }, [contents, verifications, filterPlatform, filterStatus, sortBy, sortOrder]);

  const exportToJSON = () => {
    const data = filteredContents.map((c) => ({
      contentHash: c.contentHash,
      manifestUri: c.manifestUri,
      creatorAddress: c.creatorAddress,
      txHash: c.txHash,
      createdAt: c.createdAt,
      bindings: c.bindings,
      verifications: verifications.filter((v) => v.contentHash === c.contentHash),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verification-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to JSON");
  };

  const exportToCSV = () => {
    const headers = [
      "Content Hash",
      "Status",
      "Creator",
      "Transaction",
      "Created At",
      "Platforms",
    ];
    const rows = filteredContents.map((c) => {
      const v = verifications.find((v) => v.contentHash === c.contentHash);
      return [
        c.contentHash,
        v?.status || "pending",
        c.creatorAddress,
        c.txHash || "",
        c.createdAt,
        c.bindings.map((b) => b.platform).join("; "),
      ];
    });
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verification-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const downloadBadge = (contentHash: string) => {
    const badgeUrl = `${SITE_BASE || window.location.origin}/api/badge/${contentHash}?theme=light&w=400`;
    window.open(badgeUrl, "_blank");
    toast.success("Badge opened in new tab");
  };

  return (
    <main style={{ maxWidth: 1200, margin: "20px auto", padding: 16 }}>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>Verification Dashboard</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <a
            href="/"
            style={{
              padding: "8px 16px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Home
          </a>
          <a
            href="/profile"
            style={{
              padding: "8px 16px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Profile
          </a>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchData} />}

      {loading && <LoadingSpinner message="Loading dashboard..." />}

      {!loading && (
        <>
          {/* Stats Section */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: "#f9fafb",
              }}
            >
              <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                Total Contents
              </div>
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#111827" }}>
                {stats.totalContents}
              </div>
            </div>
            <div
              style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: "#f9fafb",
              }}
            >
              <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                Total Verifications
              </div>
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#111827" }}>
                {stats.totalVerifications}
              </div>
            </div>
            <div
              style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: "#f9fafb",
              }}
            >
              <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                Success Rate
              </div>
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#10b981" }}>
                {stats.successRate}%
              </div>
            </div>
            <div
              style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: "#f9fafb",
              }}
            >
              <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                Platforms Used
              </div>
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#111827" }}>
                {stats.platformsUsed.length}
              </div>
            </div>
          </section>

          {/* Status Breakdown */}
          {Object.keys(stats.statusBreakdown).length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h3>Status Breakdown</h3>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                  <div
                    key={status}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      backgroundColor: getStatusBadgeColor(status),
                      color: "white",
                    }}
                  >
                    <strong>{status}:</strong> {count}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Controls */}
          <section
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 24,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <label style={{ marginRight: 8 }}>Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 4 }}
              >
                <option value="all">All</option>
                <option value="ok">OK</option>
                <option value="warn">Warn</option>
                <option value="fail">Fail</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label style={{ marginRight: 8 }}>Filter by Platform:</label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 4 }}
              >
                <option value="all">All</option>
                {stats.platformsUsed.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ marginRight: 8 }}>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "status")}
                style={{ padding: "6px 12px", borderRadius: 4 }}
              >
                <option value="date">Date</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label style={{ marginRight: 8 }}>Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                style={{ padding: "6px 12px", borderRadius: 4 }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: autoRefresh ? "#10b981" : "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </button>
              <button
                onClick={fetchData}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Refresh
              </button>
              <button
                onClick={exportToJSON}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Export JSON
              </button>
              <button
                onClick={exportToCSV}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Export CSV
              </button>
            </div>
          </section>

          {/* Content List */}
          <section>
            <h2>
              Content Registrations ({filteredContents.length} of {contents.length})
            </h2>
            {filteredContents.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                No content found. Try adjusting your filters.
              </div>
            )}
            {filteredContents.map((content) => {
              const contentVerifications = verifications.filter(
                (v) => v.contentHash === content.contentHash
              );
              const latestVerification = contentVerifications[0];
              const status = latestVerification?.status || "pending";

              return (
                <div
                  key={content.id}
                  style={{
                    marginBottom: 16,
                    padding: 16,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <strong>Content Hash:</strong>
                        <code
                          style={{
                            fontSize: 12,
                            padding: "2px 6px",
                            backgroundColor: "#f3f4f6",
                            borderRadius: 4,
                          }}
                        >
                          {content.contentHash.slice(0, 20)}...
                        </code>
                        <span
                          style={{
                            padding: "2px 8px",
                            backgroundColor: getStatusBadgeColor(status),
                            color: "white",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        >
                          {status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                        Creator: <code>{content.creatorAddress}</code>
                      </div>
                      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                        Created: {formatDate(content.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => downloadBadge(content.contentHash)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Download Badge
                      </button>
                    </div>
                  </div>

                  {/* Transaction Link */}
                  {content.txHash && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Transaction:</strong>{" "}
                      <a
                        href={explorerTxUrl(content.txHash, chainId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#3b82f6" }}
                      >
                        {content.txHash.slice(0, 20)}...
                      </a>
                    </div>
                  )}

                  {/* Manifest Link */}
                  {content.manifestUri && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Manifest:</strong>{" "}
                      <a
                        href={ipfsToGateway(content.manifestUri)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#3b82f6" }}
                      >
                        {content.manifestUri.slice(0, 30)}...
                      </a>
                    </div>
                  )}

                  {/* Platform Bindings */}
                  {content.bindings.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <strong>Platform Bindings:</strong>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {content.bindings.map((binding) => (
                          <span
                            key={binding.id}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#dbeafe",
                              color: "#1e40af",
                              borderRadius: 4,
                              fontSize: 12,
                            }}
                          >
                            {binding.platform}: {binding.platformId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification History */}
                  {contentVerifications.length > 0 && (
                    <details style={{ marginTop: 12 }}>
                      <summary
                        style={{
                          cursor: "pointer",
                          fontWeight: "bold",
                          color: "#374151",
                        }}
                      >
                        Verification History ({contentVerifications.length})
                      </summary>
                      <div style={{ marginTop: 8, paddingLeft: 16 }}>
                        {contentVerifications.map((v) => (
                          <div
                            key={v.id}
                            style={{
                              padding: 8,
                              marginBottom: 8,
                              backgroundColor: "#f9fafb",
                              borderRadius: 4,
                              fontSize: 13,
                            }}
                          >
                            <div>
                              <strong>Status:</strong>{" "}
                              <span
                                style={{
                                  color: getStatusBadgeColor(v.status),
                                  fontWeight: "bold",
                                }}
                              >
                                {v.status}
                              </span>
                            </div>
                            <div>
                              <strong>Verified:</strong> {formatDate(v.createdAt)}
                            </div>
                            <div>
                              <strong>Recovered Address:</strong>{" "}
                              <code>{v.recoveredAddress}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
