/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Internet-ID collects, uses, and protects your personal information and content data.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>Privacy Policy</h1>
      <p className="last-updated">
        <strong>Last Updated:</strong> November 2, 2025
      </p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          Internet-ID ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our blockchain-based content verification platform.
        </p>
        <p>
          By using Internet-ID, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        
        <h3>2.1 Content and Files</h3>
        <ul>
          <li><strong>Uploaded Content:</strong> Files you upload to verify authenticity (images, videos, documents)</li>
          <li><strong>Content Hashes:</strong> Cryptographic hashes of your content stored on blockchain</li>
          <li><strong>Manifest Data:</strong> Metadata about your content including creation dates and signatures</li>
          <li><strong>IPFS URIs:</strong> Decentralized storage identifiers for your content</li>
        </ul>

        <h3>2.2 Blockchain Data</h3>
        <ul>
          <li><strong>Wallet Addresses:</strong> Ethereum-compatible wallet addresses used to sign and register content</li>
          <li><strong>Transaction Hashes:</strong> On-chain registration records and transaction identifiers</li>
          <li><strong>Smart Contract Interactions:</strong> Records of your interactions with our ContentRegistry smart contract</li>
        </ul>

        <h3>2.3 Platform Bindings</h3>
        <ul>
          <li><strong>Platform Identifiers:</strong> Social media and platform URLs or IDs (YouTube, TikTok, Twitter/X, Instagram, etc.) that you bind to verified content</li>
          <li><strong>Verification Records:</strong> History of content verifications and platform bindings</li>
        </ul>

        <h3>2.4 Account Information</h3>
        <ul>
          <li><strong>Authentication Data:</strong> Information from OAuth providers (GitHub, Google) including name, email, and profile information</li>
          <li><strong>Session Data:</strong> Cookies and session tokens for authenticated users</li>
        </ul>

        <h3>2.5 Usage Data</h3>
        <ul>
          <li><strong>Analytics:</strong> Page views, interactions, and usage patterns via Google Analytics</li>
          <li><strong>Technical Information:</strong> IP addresses, browser type, device information, and access times</li>
          <li><strong>Performance Data:</strong> Error logs and performance metrics for service improvement</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use the collected information for the following purposes:</p>
        <ul>
          <li><strong>Content Verification:</strong> To provide on-chain content authentication and provenance tracking</li>
          <li><strong>Service Delivery:</strong> To create, store, and manage your content registrations and verifications</li>
          <li><strong>Platform Integration:</strong> To bind and verify content across supported social media platforms</li>
          <li><strong>Account Management:</strong> To authenticate users and manage account settings</li>
          <li><strong>Analytics and Improvement:</strong> To understand usage patterns and improve our services</li>
          <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security vulnerabilities</li>
          <li><strong>Communication:</strong> To send service-related notifications and updates</li>
          <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our Terms of Service</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Storage and Retention</h2>
        
        <h3>4.1 Storage Locations</h3>
        <ul>
          <li><strong>Blockchain:</strong> Content hashes and registration data are permanently stored on Ethereum-compatible blockchains (immutable)</li>
          <li><strong>IPFS:</strong> Content files and manifests are stored on decentralized IPFS networks via Infura, Web3.Storage, or Pinata</li>
          <li><strong>Database:</strong> Metadata, bindings, and user accounts are stored in our database (PostgreSQL or SQLite)</li>
          <li><strong>Cache:</strong> Temporary data may be stored in Redis for performance optimization</li>
        </ul>

        <h3>4.2 Retention Periods</h3>
        <ul>
          <li><strong>Blockchain Records:</strong> Permanent and immutable by design</li>
          <li><strong>IPFS Content:</strong> Persists as long as pinned by our service or other IPFS nodes</li>
          <li><strong>Database Records:</strong> Retained indefinitely unless you request deletion</li>
          <li><strong>Analytics Data:</strong> Retained according to Google Analytics retention policies (26 months by default)</li>
          <li><strong>Session Data:</strong> Deleted upon logout or session expiration</li>
        </ul>

        <h3>4.3 Data Deletion</h3>
        <p>
          Upon request, we will delete personal information from our databases. However, please note:
        </p>
        <ul>
          <li>Blockchain records cannot be deleted due to their immutable nature</li>
          <li>IPFS content may persist on other nodes even after we unpin it</li>
          <li>Some data may be retained for legal compliance or security purposes</li>
        </ul>
      </section>

      <section>
        <h2>5. Third-Party Services and Data Sharing</h2>
        
        <h3>5.1 Third-Party Services</h3>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>IPFS Providers:</strong> Infura, Web3.Storage, Pinata for decentralized storage</li>
          <li><strong>Blockchain Networks:</strong> Ethereum, Polygon, Base, Arbitrum, Optimism, and testnets</li>
          <li><strong>Authentication:</strong> NextAuth with GitHub and Google OAuth providers</li>
          <li><strong>Analytics:</strong> Google Analytics for usage tracking</li>
          <li><strong>Monitoring:</strong> Prometheus and Grafana for service monitoring (self-hosted)</li>
        </ul>

        <h3>5.2 Data Sharing</h3>
        <p>We do not sell your personal information. We may share data in the following circumstances:</p>
        <ul>
          <li><strong>Public Blockchain:</strong> Content hashes and wallet addresses are publicly visible on blockchain</li>
          <li><strong>IPFS Network:</strong> Uploaded content and manifests are accessible via IPFS gateways</li>
          <li><strong>Service Providers:</strong> Third-party services listed above process data on our behalf</li>
          <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
          <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
        </ul>
      </section>

      <section>
        <h2>6. Your Rights</h2>
        <p>Depending on your location, you may have the following rights:</p>
        
        <h3>6.1 Access and Portability</h3>
        <ul>
          <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
          <li><strong>Data Portability:</strong> Receive your data in a machine-readable format</li>
        </ul>

        <h3>6.2 Correction and Deletion</h3>
        <ul>
          <li><strong>Right to Correction:</strong> Request correction of inaccurate data</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your personal data (subject to limitations)</li>
        </ul>

        <h3>6.3 Control and Consent</h3>
        <ul>
          <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
          <li><strong>Right to Restriction:</strong> Request limitation of data processing</li>
          <li><strong>Withdrawal of Consent:</strong> Withdraw consent for optional data processing</li>
        </ul>

        <h3>6.4 Exercising Your Rights</h3>
        <p>
          To exercise these rights, please contact us at{" "}
          <a href="mailto:privacy@subculture.io">privacy@subculture.io</a>. We will respond within 30 days.
        </p>
      </section>

      <section>
        <h2>7. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws different from those in your jurisdiction. We ensure appropriate safeguards are in place for such transfers.
        </p>
      </section>

      <section>
        <h2>8. Security Measures</h2>
        <p>We implement industry-standard security measures to protect your information:</p>
        <ul>
          <li>HTTPS/TLS encryption for data in transit</li>
          <li>Encrypted storage for sensitive data</li>
          <li>Access controls and authentication requirements</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Rate limiting and DDoS protection</li>
          <li>Security headers (CSP, HSTS, etc.)</li>
        </ul>
        <p>
          However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>9. Children's Privacy</h2>
        <p>
          Our services are not directed to individuals under the age of 13 (or 16 in the European Economic Area). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
        </p>
      </section>

      <section>
        <h2>10. Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies. For detailed information, please see our{" "}
          <a href="/cookies">Cookie Policy</a>.
        </p>
      </section>

      <section>
        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2>12. Contact Information</h2>
        <p>For privacy-related inquiries, please contact us:</p>
        <ul>
          <li>
            <strong>Email:</strong> <a href="mailto:privacy@subculture.io">privacy@subculture.io</a>
          </li>
          <li>
            <strong>Support:</strong> <a href="mailto:support@subculture.io">support@subculture.io</a>
          </li>
          <li>
            <strong>Website:</strong> <a href="https://github.com/subculture-collective/internet-id">GitHub</a>
          </li>
        </ul>
      </section>

      <section>
        <h2>13. GDPR Compliance (EU Users)</h2>
        <p>For users in the European Economic Area (EEA):</p>
        <ul>
          <li><strong>Legal Basis:</strong> We process your data based on consent, contract performance, and legitimate interests</li>
          <li><strong>Data Controller:</strong> Subculture Collective</li>
          <li><strong>Data Protection Officer:</strong> privacy@subculture.io</li>
          <li><strong>Supervisory Authority:</strong> You have the right to lodge a complaint with your local data protection authority</li>
        </ul>
      </section>

      <section>
        <h2>14. CCPA Rights (California Users)</h2>
        <p>California residents have additional rights under the California Consumer Privacy Act (CCPA):</p>
        <ul>
          <li>Right to know what personal information is collected</li>
          <li>Right to know whether personal information is sold or disclosed</li>
          <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
          <li>Right to deletion of personal information</li>
          <li>Right to non-discrimination for exercising CCPA rights</li>
        </ul>
      </section>
    </main>
  );
}
