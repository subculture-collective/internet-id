# Internet‑ID in plain English

A simple way for creators to prove “this is really mine” on the internet—without uploading their originals to a platform or trusting a new gatekeeper.

## The problem

- AI can fabricate convincing audio, images, and video.
- Platforms constantly re-encode or crop content; bytes change, links rot, and accounts get compromised.
- Viewers want a quick signal: is this from a real human creator who opted in, or is it likely a fake?

## The idea

Internet‑ID gives each piece of content a durable “fingerprint” (a cryptographic hash) and an attestation from the creator. That fingerprint is anchored to a public blockchain so anyone can check it later.

- If the creator shares a link (YouTube, TikTok, etc.), they can associate that link with their original fingerprint.
- Anyone can click a public Verify link or scan a QR code to see the on‑chain record and the creator’s signed manifest.

It’s like signing the cover of your work and filing a timestamp at a public archive—so anyone can verify your authorship signal, anywhere on the web.

## How it works (human terms)

1. Fingerprint your file

- You pick a master file (video, audio, image).
- The app computes a unique fingerprint of it (a hash) and builds a small manifest that you sign with your wallet.

2. Anchor the fingerprint on‑chain

- The manifest (and optionally the file) is stored on IPFS.
- The on‑chain registry stores just the fingerprint and a pointer (URI) to your manifest.

3. Connect your links

- After you post on platforms, you can bind those URLs/IDs to your fingerprint.
- Now your link points back to an on‑chain proof: “this links to my original.”

4. Share and verify anywhere

- Share a badge and a Verify link. Viewers can scan a QR or click through to confirm it’s anchored by you.
- Advanced users can also download the manifest and re‑check the math, but they don’t have to.

## Why creators like it

- Opt‑in and portable: no platform approval needed; works across YouTube, TikTok, Instagram, X, etc.
- Privacy by default: you don’t have to upload your original unless you choose to. The proof works with just the hash + manifest.
- Public and durable: the anchor lives on an open blockchain; anyone can verify with or without our app.
- Lightweight and fast: it’s a tiny contract and a short manifest—no heavy watermarking or invasive DRM.

## Why audiences like it

- A clear signal: a badge and Verify page that says “The creator anchored this.”
- Click or scan, no crypto required: you don’t need a wallet to verify.
- Platform‑agnostic: the same signal follows a piece of content across the web.

## Example use cases

- Creators publishing a video series and wanting to prove authorship of each episode across multiple platforms.
- Journalists and filmmakers who share source clips publicly and want a durable provenance trail.
- Musicians releasing stems/demos and later remasters; fans can track the lineage.
- Brands combating fake accounts or spoofed announcements with verifiable posts.

## What this is not

- It does not claim “truth” about the content. It proves the creator opted in and signed it.
- It does not prevent copying or re‑uploading. It helps viewers tell original from imposters.
- It’s not DRM. There’s no lock‑in—just an open proof you can host or replicate.

## Quick flow (at a glance)

- One‑shot: Upload (optional) → Manifest → Register on‑chain → Bind links → Share badge/Verify link
- Verify: Paste a link or scan QR → view on‑chain entry and manifest → optional byte‑level check if you have the original

## Sharing

- Badge: include a small “Verified by Internet‑ID” image that links to your Verify page.
- QR: add a scannable code to video outros, captions, or image corners.
- “Copy All”: one click in the app copies your share links, QR image URLs, and embed HTML so you can paste them in descriptions or press kits.

## Who’s it for

- Independent creators, journalists, small studios, and brands who want a portable, platform‑agnostic provenance signal that respects privacy.

If you want a quick demo link or help weaving this into your workflow, open an issue or reach out.
