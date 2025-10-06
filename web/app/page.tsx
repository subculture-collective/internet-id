"use client";
import { useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

async function postJson<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function postMultipart<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function Home() {
  const [tab, setTab] = useState<string>("upload");
  return (
    <main>
      <h1>Internet-ID</h1>
      <div className="tabs">
        {[
          ["upload", "Upload"],
          ["manifest", "Manifest"],
          ["register", "Register"],
          ["verify", "Verify"],
          ["proof", "Proof"],
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
      {tab === "upload" && <UploadForm />}
      {tab === "manifest" && <ManifestForm />}
      {tab === "register" && <RegisterForm />}
      {tab === "verify" && <VerifyForm />}
      {tab === "proof" && <ProofForm />}
    </main>
  );
}

function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <section>
      <h2>Upload to IPFS</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <div>
        <button
          disabled={!file}
          onClick={async () => {
            try {
              setErr(null);
              const fd = new FormData();
              if (!file) return;
              fd.append("file", file);
              const r = await postMultipart<{ cid: string; uri: string }>(
                "/api/upload",
                fd
              );
              setResult(r);
            } catch (e: any) {
              setErr(e?.message || String(e));
            }
          }}
        >
          Upload
        </button>
      </div>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
    </section>
  );
}

function ManifestForm() {
  const [file, setFile] = useState<File | null>(null);
  const [contentUri, setContentUri] = useState<string>("");
  const [doUpload, setDoUpload] = useState<boolean>(true);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <section>
      <h2>Create manifest</h2>
      <label>Content URI (ipfs://...)</label>
      <input
        value={contentUri}
        onChange={(e) => setContentUri(e.target.value)}
        placeholder="ipfs://<CID>"
      />
      <label>File</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
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
      <button
        disabled={!file || !contentUri}
        onClick={async () => {
          try {
            setErr(null);
            const fd = new FormData();
            if (!file) return;
            fd.append("file", file);
            fd.append("contentUri", contentUri);
            fd.append("upload", String(doUpload));
            const r = await postMultipart("/api/manifest", fd);
            setResult(r);
          } catch (e: any) {
            setErr(e?.message || String(e));
          }
        }}
      >
        Create
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
    </section>
  );
}

function RegisterForm() {
  const [file, setFile] = useState<File | null>(null);
  const [manifestURI, setManifestURI] = useState<string>("");
  const [registryAddress, setRegistryAddress] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <section>
      <h2>Register on-chain</h2>
      <label>Registry address</label>
      <input
        value={registryAddress}
        onChange={(e) => setRegistryAddress(e.target.value)}
        placeholder="0x..."
      />
      <label>Manifest URI</label>
      <input
        value={manifestURI}
        onChange={(e) => setManifestURI(e.target.value)}
        placeholder="ipfs://<manifestCID>"
      />
      <label>File</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        disabled={!file || !manifestURI || !registryAddress}
        onClick={async () => {
          try {
            setErr(null);
            const fd = new FormData();
            if (!file) return;
            fd.append("file", file);
            fd.append("manifestURI", manifestURI);
            fd.append("registryAddress", registryAddress);
            const r = await postMultipart("/api/register", fd);
            setResult(r);
          } catch (e: any) {
            setErr(e?.message || String(e));
          }
        }}
      >
        Register
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
    </section>
  );
}

function VerifyForm() {
  const [file, setFile] = useState<File | null>(null);
  const [manifestURI, setManifestURI] = useState<string>("");
  const [registryAddress, setRegistryAddress] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <section>
      <h2>Verify</h2>
      <label>Registry address</label>
      <input
        value={registryAddress}
        onChange={(e) => setRegistryAddress(e.target.value)}
        placeholder="0x..."
      />
      <label>Manifest URI</label>
      <input
        value={manifestURI}
        onChange={(e) => setManifestURI(e.target.value)}
        placeholder="ipfs://<manifestCID>"
      />
      <label>File</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        disabled={!file || !manifestURI || !registryAddress}
        onClick={async () => {
          try {
            setErr(null);
            const fd = new FormData();
            if (!file) return;
            fd.append("file", file);
            fd.append("manifestURI", manifestURI);
            fd.append("registryAddress", registryAddress);
            const r = await postMultipart("/api/verify", fd);
            setResult(r);
          } catch (e: any) {
            setErr(e?.message || String(e));
          }
        }}
      >
        Verify
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
    </section>
  );
}

function ProofForm() {
  const [file, setFile] = useState<File | null>(null);
  const [manifestURI, setManifestURI] = useState<string>("");
  const [registryAddress, setRegistryAddress] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <section>
      <h2>Proof</h2>
      <label>Registry address</label>
      <input
        value={registryAddress}
        onChange={(e) => setRegistryAddress(e.target.value)}
        placeholder="0x..."
      />
      <label>Manifest URI</label>
      <input
        value={manifestURI}
        onChange={(e) => setManifestURI(e.target.value)}
        placeholder="ipfs://<manifestCID>"
      />
      <label>File</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        disabled={!file || !manifestURI || !registryAddress}
        onClick={async () => {
          try {
            setErr(null);
            const fd = new FormData();
            if (!file) return;
            fd.append("file", file);
            fd.append("manifestURI", manifestURI);
            fd.append("registryAddress", registryAddress);
            const r = await postMultipart("/api/proof", fd);
            setResult(r);
          } catch (e: any) {
            setErr(e?.message || String(e));
          }
        }}
      >
        Generate
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
    </section>
  );
}
