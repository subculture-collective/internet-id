/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the terms and conditions for using Internet-ID's blockchain-based content verification platform.",
};

export default function TermsPage() {
  return (
    <main className="legal-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>Terms of Service</h1>
      <p className="last-updated">
        <strong>Last Updated:</strong> November 2, 2025
      </p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          Welcome to Internet-ID. By accessing or using our blockchain-based content verification platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
        </p>
        <p>
          We reserve the right to modify these Terms at any time. Your continued use of the Service after changes are posted constitutes acceptance of the modified Terms.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          Internet-ID provides a platform for content creators to:
        </p>
        <ul>
          <li>Upload and hash content to create cryptographic proofs of authenticity</li>
          <li>Register content hashes on blockchain networks (Ethereum, Polygon, Base, Arbitrum, Optimism)</li>
          <li>Store content and manifests on decentralized storage (IPFS)</li>
          <li>Bind content to social media platforms (YouTube, TikTok, Twitter/X, Instagram, etc.)</li>
          <li>Verify content authenticity and provenance</li>
          <li>Generate verification badges and proofs</li>
        </ul>
        <p>
          The Service helps distinguish human-created content from AI-generated or manipulated content by providing verifiable on-chain records.
        </p>
      </section>

      <section>
        <h2>3. User Accounts and Registration</h2>
        <h3>3.1 Account Creation</h3>
        <p>
          Some features require account creation via OAuth providers (GitHub, Google). You are responsible for:
        </p>
        <ul>
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access</li>
        </ul>

        <h3>3.2 Eligibility</h3>
        <p>
          You must be at least 13 years old (or 16 in the European Economic Area) to use the Service. By using the Service, you represent and warrant that you meet this age requirement.
        </p>

        <h3>3.3 Wallet Requirements</h3>
        <p>
          To register content on-chain, you must have an Ethereum-compatible wallet. You are solely responsible for:
        </p>
        <ul>
          <li>Securing your private keys and wallet access</li>
          <li>All transactions made from your wallet</li>
          <li>Gas fees and transaction costs</li>
        </ul>
      </section>

      <section>
        <h2>4. Acceptable Use Policy</h2>
        <h3>4.1 Permitted Uses</h3>
        <p>You may use the Service to:</p>
        <ul>
          <li>Verify authenticity of content you created or have rights to</li>
          <li>Register original content for provenance tracking</li>
          <li>Generate verification badges for legitimate content</li>
          <li>Bind your verified content to your social media profiles</li>
        </ul>

        <h3>4.2 Prohibited Uses</h3>
        <p>You agree NOT to:</p>
        <ul>
          <li><strong>Illegal Content:</strong> Upload, register, or verify content that violates any law or regulation</li>
          <li><strong>Infringing Content:</strong> Register content that infringes intellectual property rights of others</li>
          <li><strong>Harmful Content:</strong> Upload content containing malware, viruses, or malicious code</li>
          <li><strong>Fraudulent Activity:</strong> Misrepresent ownership or authenticity of content</li>
          <li><strong>Abusive Behavior:</strong> Harass, threaten, or harm others through the Service</li>
          <li><strong>Spam:</strong> Use the Service for unsolicited advertising or spam</li>
          <li><strong>System Abuse:</strong> Attempt to gain unauthorized access, disrupt service, or circumvent security measures</li>
          <li><strong>False Information:</strong> Provide false or misleading information about content ownership</li>
          <li><strong>Automated Abuse:</strong> Use bots or automated systems to abuse rate limits or service resources</li>
        </ul>

        <h3>4.3 Content Standards</h3>
        <p>All content must comply with applicable laws and must not contain:</p>
        <ul>
          <li>Illegal material (child exploitation, terrorism, etc.)</li>
          <li>Hate speech, discrimination, or incitement to violence</li>
          <li>Private information of others without consent</li>
          <li>Defamatory or libelous statements</li>
        </ul>
      </section>

      <section>
        <h2>5. Content Ownership and Licensing</h2>
        <h3>5.1 Your Content</h3>
        <p>
          You retain all ownership rights to content you upload. By using the Service, you represent and warrant that:
        </p>
        <ul>
          <li>You own or have necessary rights to the content you register</li>
          <li>Your content does not infringe third-party rights</li>
          <li>You have authority to bind the content to platform identifiers you specify</li>
        </ul>

        <h3>5.2 License to Internet-ID</h3>
        <p>
          By uploading content, you grant us a limited, non-exclusive, worldwide license to:
        </p>
        <ul>
          <li>Store and process your content to provide the Service</li>
          <li>Generate hashes, manifests, and verification badges</li>
          <li>Display content metadata in verification results</li>
          <li>Cache content for performance optimization</li>
        </ul>
        <p>
          This license ends when you delete your content, except for:
        </p>
        <ul>
          <li>Blockchain records (which are immutable)</li>
          <li>IPFS content (which may persist on other nodes)</li>
          <li>Cached or backed-up data (deleted within 90 days)</li>
        </ul>

        <h3>5.3 Public Nature of Blockchain</h3>
        <p>
          Content hashes and registration records stored on blockchain are permanently public and cannot be deleted or made private.
        </p>
      </section>

      <section>
        <h2>6. Service Availability and Modifications</h2>
        <h3>6.1 Service Availability</h3>
        <p>
          We strive to provide reliable service but do not guarantee:
        </p>
        <ul>
          <li>Uninterrupted or error-free operation</li>
          <li>Availability during maintenance or upgrades</li>
          <li>Compatibility with all devices or browsers</li>
          <li>Success of blockchain transactions (network congestion, gas prices)</li>
        </ul>

        <h3>6.2 Service Modifications</h3>
        <p>
          We reserve the right to:
        </p>
        <ul>
          <li>Modify, suspend, or discontinue any part of the Service</li>
          <li>Change fees or introduce new fees with 30 days notice</li>
          <li>Update smart contracts and migrate to new contract versions</li>
          <li>Change supported blockchain networks or IPFS providers</li>
        </ul>

        <h3>6.3 Beta Features</h3>
        <p>
          Some features may be designated as "beta" or "experimental" and provided "as is" without warranties.
        </p>
      </section>

      <section>
        <h2>7. Fees and Payment</h2>
        <h3>7.1 Service Fees</h3>
        <p>
          Basic features are currently free. We reserve the right to introduce fees for premium features with advance notice.
        </p>

        <h3>7.2 Blockchain Fees</h3>
        <p>
          You are responsible for all blockchain transaction fees (gas costs) associated with:
        </p>
        <ul>
          <li>Registering content on-chain</li>
          <li>Binding platform identifiers</li>
          <li>Any smart contract interactions</li>
        </ul>
        <p>
          These fees are paid directly to blockchain networks and are non-refundable.
        </p>

        <h3>7.3 Third-Party Costs</h3>
        <p>
          You may incur costs from third-party services (IPFS storage, blockchain node access) which are your responsibility.
        </p>
      </section>

      <section>
        <h2>8. Disclaimers and Limitation of Liability</h2>
        <h3>8.1 "AS IS" Disclaimer</h3>
        <p>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
        </p>
        <ul>
          <li>MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT</li>
          <li>ACCURACY, RELIABILITY, OR AVAILABILITY OF THE SERVICE</li>
          <li>SECURITY OR FREEDOM FROM ERRORS, VIRUSES, OR HARMFUL COMPONENTS</li>
          <li>SUCCESS OF BLOCKCHAIN TRANSACTIONS OR IPFS STORAGE</li>
        </ul>

        <h3>8.2 Limitation of Liability</h3>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, INTERNET-ID AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:
        </p>
        <ul>
          <li><strong>Indirect, Incidental, Special, or Consequential Damages</strong></li>
          <li><strong>Loss of Profits, Revenue, Data, or Use</strong></li>
          <li><strong>Blockchain Transaction Failures:</strong> Failed transactions, lost gas fees, or network congestion</li>
          <li><strong>IPFS Storage Issues:</strong> Content unavailability or data loss on IPFS</li>
          <li><strong>Third-Party Actions:</strong> Issues with OAuth providers, IPFS providers, or blockchain networks</li>
          <li><strong>User Error:</strong> Lost private keys, incorrect transactions, or user mistakes</li>
          <li><strong>Content Disputes:</strong> Disputes over content ownership or intellectual property</li>
        </ul>
        <p>
          IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM (OR $100 IF NO FEES WERE PAID).
        </p>

        <h3>8.3 Blockchain and Crypto Risks</h3>
        <p>
          You acknowledge and accept the risks associated with blockchain technology and cryptocurrencies, including:
        </p>
        <ul>
          <li>Price volatility of cryptocurrencies and gas fees</li>
          <li>Irreversibility of blockchain transactions</li>
          <li>Potential for smart contract bugs or vulnerabilities</li>
          <li>Regulatory uncertainty and potential legal changes</li>
          <li>Network congestion and delayed transactions</li>
        </ul>

        <h3>8.4 No Legal Guarantee</h3>
        <p>
          The Service provides technical proof of content registration but does not:
        </p>
        <ul>
          <li>Guarantee legal ownership or copyright protection</li>
          <li>Provide legal advice or establish legal rights</li>
          <li>Verify the actual identity of content creators</li>
          <li>Guarantee content authenticity beyond cryptographic verification</li>
        </ul>
      </section>

      <section>
        <h2>9. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless Internet-ID, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including legal fees) arising from:
        </p>
        <ul>
          <li>Your use of the Service</li>
          <li>Your content or content registration</li>
          <li>Violation of these Terms</li>
          <li>Infringement of third-party rights</li>
          <li>Your negligence or willful misconduct</li>
        </ul>
      </section>

      <section>
        <h2>10. Termination</h2>
        <h3>10.1 Termination by You</h3>
        <p>
          You may stop using the Service at any time. To delete your account, contact support@subculture.io.
        </p>

        <h3>10.2 Termination by Us</h3>
        <p>
          We may suspend or terminate your access if you:
        </p>
        <ul>
          <li>Violate these Terms or our Acceptable Use Policy</li>
          <li>Engage in fraudulent or illegal activity</li>
          <li>Pose a security risk to the Service or other users</li>
          <li>Fail to pay required fees</li>
        </ul>

        <h3>10.3 Effect of Termination</h3>
        <p>
          Upon termination:
        </p>
        <ul>
          <li>Your account access will be revoked</li>
          <li>Database records may be deleted per our retention policies</li>
          <li>Blockchain records remain permanently (immutable)</li>
          <li>IPFS content may continue to be accessible on other nodes</li>
        </ul>
      </section>

      <section>
        <h2>11. Dispute Resolution and Governing Law</h2>
        <h3>11.1 Governing Law</h3>
        <p>
          These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
        </p>

        <h3>11.2 Arbitration Agreement</h3>
        <p>
          Any dispute arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the American Arbitration Association (AAA) rules, except:
        </p>
        <ul>
          <li>Claims for injunctive or equitable relief</li>
          <li>Claims in small claims court (if eligible)</li>
          <li>Intellectual property disputes</li>
        </ul>

        <h3>11.3 Class Action Waiver</h3>
        <p>
          You agree to resolve disputes on an individual basis only. You waive any right to participate in class actions or representative proceedings.
        </p>

        <h3>11.4 Informal Resolution</h3>
        <p>
          Before initiating arbitration, you agree to contact us at legal@subculture.io to attempt informal resolution for at least 30 days.
        </p>
      </section>

      <section>
        <h2>12. Intellectual Property</h2>
        <h3>12.1 Our IP</h3>
        <p>
          All intellectual property rights in the Service (excluding user content) belong to Internet-ID, including:
        </p>
        <ul>
          <li>Smart contracts and code</li>
          <li>Website design and UI</li>
          <li>Logos, trademarks, and branding</li>
          <li>Documentation and content</li>
        </ul>

        <h3>12.2 Open Source</h3>
        <p>
          Certain components are released under open source licenses (see our GitHub repository). The specific terms of those licenses apply to those components.
        </p>

        <h3>12.3 Copyright Claims</h3>
        <p>
          If you believe your copyright has been infringed, contact us at dmca@subculture.io with:
        </p>
        <ul>
          <li>Identification of the copyrighted work</li>
          <li>Location of the infringing material</li>
          <li>Your contact information</li>
          <li>Statement of good faith belief</li>
          <li>Statement of accuracy and authorization</li>
          <li>Physical or electronic signature</li>
        </ul>
      </section>

      <section>
        <h2>13. Privacy</h2>
        <p>
          Your use of the Service is also governed by our <a href="/privacy">Privacy Policy</a>. Please review it to understand how we collect and use your information.
        </p>
      </section>

      <section>
        <h2>14. Export Control</h2>
        <p>
          The Service may be subject to U.S. export control laws. You agree not to export, re-export, or transfer the Service to prohibited countries or parties.
        </p>
      </section>

      <section>
        <h2>15. Severability</h2>
        <p>
          If any provision of these Terms is found unenforceable, the remaining provisions will continue in full force and effect.
        </p>
      </section>

      <section>
        <h2>16. Entire Agreement</h2>
        <p>
          These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Internet-ID regarding the Service.
        </p>
      </section>

      <section>
        <h2>17. Contact Information</h2>
        <p>For questions about these Terms, contact us:</p>
        <ul>
          <li>
            <strong>Legal Inquiries:</strong> <a href="mailto:legal@subculture.io">legal@subculture.io</a>
          </li>
          <li>
            <strong>General Support:</strong> <a href="mailto:support@subculture.io">support@subculture.io</a>
          </li>
          <li>
            <strong>Copyright Claims:</strong> <a href="mailto:dmca@subculture.io">dmca@subculture.io</a>
          </li>
          <li>
            <strong>GitHub:</strong> <a href="https://github.com/subculture-collective/internet-id">github.com/subculture-collective/internet-id</a>
          </li>
        </ul>
      </section>

      <section>
        <h2>18. Acknowledgment</h2>
        <p>
          BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
        </p>
      </section>
    </main>
  );
}
