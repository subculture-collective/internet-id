/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn about the cookies and tracking technologies used by Internet-ID and how to manage your preferences.",
};

export default function CookiesPage() {
  return (
    <main className="legal-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>Cookie Policy</h1>
      <p className="last-updated">
        <strong>Last Updated:</strong> November 2, 2025
      </p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          This Cookie Policy explains how Internet-ID ("we," "our," or "us") uses cookies and similar tracking technologies when you visit our website. This policy is part of our <a href="/privacy">Privacy Policy</a>.
        </p>
        <p>
          By using our website, you consent to the use of cookies as described in this policy. You can manage your cookie preferences as explained below.
        </p>
      </section>

      <section>
        <h2>2. What Are Cookies?</h2>
        <p>
          Cookies are small text files that are placed on your device (computer, tablet, smartphone) when you visit a website. They help websites remember information about your visit, making your next visit easier and the site more useful to you.
        </p>
        <p>
          Cookies can be "persistent" (remain on your device until deleted or expire) or "session" cookies (deleted when you close your browser).
        </p>
      </section>

      <section>
        <h2>3. Types of Cookies We Use</h2>

        <h3>3.1 Essential Cookies</h3>
        <p>
          <strong>Purpose:</strong> Required for the website to function properly
        </p>
        <p>
          <strong>Examples:</strong>
        </p>
        <ul>
          <li><strong>Session cookies:</strong> Maintain your login state and session</li>
          <li><strong>CSRF tokens:</strong> Protect against cross-site request forgery attacks</li>
          <li><strong>NextAuth session:</strong> Manage authentication state</li>
        </ul>
        <p>
          <strong>Can you opt-out?</strong> No, these are necessary for the website to work.
        </p>
        <p>
          <strong>Duration:</strong> Session (deleted when browser closes) or up to 30 days
        </p>

        <h3>3.2 Analytics Cookies</h3>
        <p>
          <strong>Purpose:</strong> Help us understand how visitors use our website
        </p>
        <p>
          <strong>Provider:</strong> Google Analytics
        </p>
        <p>
          <strong>Information collected:</strong>
        </p>
        <ul>
          <li>Pages visited and time spent on pages</li>
          <li>Navigation paths through the site</li>
          <li>Browser type, device type, and screen resolution</li>
          <li>Geographic location (country/city level)</li>
          <li>Referral source (how you found our site)</li>
        </ul>
        <p>
          <strong>Can you opt-out?</strong> Yes, see Section 6 below.
        </p>
        <p>
          <strong>Duration:</strong> Up to 26 months
        </p>
        <p>
          <strong>More information:</strong>{" "}
          <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
            Google's Cookie Policy
          </a>
        </p>

        <h3>3.3 Functional Cookies</h3>
        <p>
          <strong>Purpose:</strong> Remember your preferences and settings
        </p>
        <p>
          <strong>Examples:</strong>
        </p>
        <ul>
          <li>Language preferences</li>
          <li>Theme selection (dark/light mode)</li>
          <li>Cookie consent preferences</li>
          <li>Recently viewed content</li>
        </ul>
        <p>
          <strong>Can you opt-out?</strong> Yes, but some features may not work as expected.
        </p>
        <p>
          <strong>Duration:</strong> 6-12 months
        </p>

        <h3>3.4 Third-Party Cookies</h3>
        <p>
          We may allow third-party services to set cookies for purposes such as:
        </p>
        <ul>
          <li><strong>OAuth Authentication:</strong> GitHub and Google for sign-in functionality</li>
          <li><strong>CDN Services:</strong> Content delivery and performance optimization</li>
        </ul>
        <p>
          These third parties have their own privacy policies and cookie policies. We do not control these cookies.
        </p>
      </section>

      <section>
        <h2>4. Cookies We Use - Detailed List</h2>

        <h3>Essential Cookies</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Cookie Name</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Purpose</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "0.5rem" }}>next-auth.session-token</td>
              <td style={{ padding: "0.5rem" }}>Authentication session management</td>
              <td style={{ padding: "0.5rem" }}>30 days</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "0.5rem" }}>next-auth.csrf-token</td>
              <td style={{ padding: "0.5rem" }}>Cross-site request forgery protection</td>
              <td style={{ padding: "0.5rem" }}>Session</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "0.5rem" }}>next-auth.callback-url</td>
              <td style={{ padding: "0.5rem" }}>OAuth callback redirect</td>
              <td style={{ padding: "0.5rem" }}>Session</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ marginTop: "2rem" }}>Analytics Cookies</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Cookie Name</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Purpose</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "0.5rem" }}>_ga</td>
              <td style={{ padding: "0.5rem" }}>Distinguish unique users</td>
              <td style={{ padding: "0.5rem" }}>2 years</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "0.5rem" }}>_gid</td>
              <td style={{ padding: "0.5rem" }}>Distinguish unique users</td>
              <td style={{ padding: "0.5rem" }}>24 hours</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "0.5rem" }}>_gat</td>
              <td style={{ padding: "0.5rem" }}>Throttle request rate</td>
              <td style={{ padding: "0.5rem" }}>1 minute</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ marginTop: "2rem" }}>Functional Cookies</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Cookie Name</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Purpose</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "0.5rem" }}>cookie_consent</td>
              <td style={{ padding: "0.5rem" }}>Remember your cookie preferences</td>
              <td style={{ padding: "0.5rem" }}>1 year</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "0.5rem" }}>theme</td>
              <td style={{ padding: "0.5rem" }}>Remember dark/light mode preference</td>
              <td style={{ padding: "0.5rem" }}>1 year</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>5. Other Tracking Technologies</h2>

        <h3>5.1 Local Storage</h3>
        <p>
          We use browser local storage to:
        </p>
        <ul>
          <li>Cache data for performance optimization</li>
          <li>Store user preferences (e.g., recently viewed content)</li>
          <li>Maintain application state</li>
        </ul>
        <p>
          Local storage persists until explicitly deleted by you or the application.
        </p>

        <h3>5.2 Web Beacons (Pixels)</h3>
        <p>
          Google Analytics may use web beacons (transparent pixel images) to track page views and user interactions.
        </p>

        <h3>5.3 Log Files</h3>
        <p>
          Our servers automatically collect certain information in log files, including:
        </p>
        <ul>
          <li>IP addresses</li>
          <li>Browser type and version</li>
          <li>Pages visited and time spent</li>
          <li>Referring URLs</li>
          <li>Operating system</li>
        </ul>
      </section>

      <section>
        <h2>6. How to Manage Cookies</h2>

        <h3>6.1 Cookie Consent Banner</h3>
        <p>
          When you first visit our website, you'll see a cookie consent banner. You can:
        </p>
        <ul>
          <li><strong>Accept All:</strong> Allow all cookies including analytics</li>
          <li><strong>Essential Only:</strong> Only allow necessary cookies</li>
          <li><strong>Customize:</strong> Choose which types of cookies to allow</li>
        </ul>
        <p>
          You can change your preferences at any time by clicking the "Cookie Settings" link in the footer.
        </p>

        <h3>6.2 Browser Settings</h3>
        <p>
          You can control and delete cookies through your browser settings:
        </p>
        <ul>
          <li>
            <strong>Chrome:</strong>{" "}
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
              Cookie settings for Chrome
            </a>
          </li>
          <li>
            <strong>Firefox:</strong>{" "}
            <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">
              Cookie settings for Firefox
            </a>
          </li>
          <li>
            <strong>Safari:</strong>{" "}
            <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">
              Cookie settings for Safari
            </a>
          </li>
          <li>
            <strong>Edge:</strong>{" "}
            <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
              Cookie settings for Edge
            </a>
          </li>
        </ul>
        <p>
          Note: Blocking all cookies may prevent some features from working properly.
        </p>

        <h3>6.3 Opt-Out of Google Analytics</h3>
        <p>
          You can opt-out of Google Analytics by:
        </p>
        <ul>
          <li>
            Installing the{" "}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
              Google Analytics Opt-out Browser Add-on
            </a>
          </li>
          <li>Disabling analytics cookies in our cookie consent banner</li>
          <li>Enabling "Do Not Track" in your browser settings</li>
        </ul>

        <h3>6.4 Mobile Device Settings</h3>
        <p>
          Mobile devices allow you to control tracking through:
        </p>
        <ul>
          <li><strong>iOS:</strong> Settings → Privacy → Tracking → Disable "Allow Apps to Request to Track"</li>
          <li><strong>Android:</strong> Settings → Google → Ads → Opt out of Ads Personalization</li>
        </ul>
      </section>

      <section>
        <h2>7. Do Not Track (DNT)</h2>
        <p>
          Some browsers support "Do Not Track" (DNT) signals. Our website respects DNT signals and will not track users who have DNT enabled in their browser settings. When DNT is detected:
        </p>
        <ul>
          <li>Google Analytics tracking is disabled</li>
          <li>Only essential cookies are used</li>
          <li>No analytics data is collected</li>
        </ul>
      </section>

      <section>
        <h2>8. Third-Party Cookie Policies</h2>
        <p>
          For more information about cookies set by third parties, please refer to their policies:
        </p>
        <ul>
          <li>
            <strong>Google Analytics:</strong>{" "}
            <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
              Google Cookie Policy
            </a>
          </li>
          <li>
            <strong>GitHub OAuth:</strong>{" "}
            <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer">
              GitHub Privacy Statement
            </a>
          </li>
          <li>
            <strong>Google OAuth:</strong>{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google Privacy Policy
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2>9. GDPR and Cookie Consent</h2>
        <p>
          For users in the European Economic Area (EEA), we comply with the EU ePrivacy Directive and GDPR:
        </p>
        <ul>
          <li>We obtain explicit consent before setting non-essential cookies</li>
          <li>You can withdraw consent at any time</li>
          <li>Essential cookies are exempt from consent requirements</li>
          <li>We provide clear information about each cookie's purpose</li>
        </ul>
      </section>

      <section>
        <h2>10. Updates to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time. When we make material changes:
        </p>
        <ul>
          <li>The "Last Updated" date will be revised</li>
          <li>You may see a notification about the changes</li>
          <li>Your continued use constitutes acceptance of the updated policy</li>
        </ul>
      </section>

      <section>
        <h2>11. Contact Us</h2>
        <p>
          If you have questions about our use of cookies, please contact us:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> <a href="mailto:privacy@subculture.io">privacy@subculture.io</a>
          </li>
          <li>
            <strong>Support:</strong> <a href="mailto:support@subculture.io">support@subculture.io</a>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
        <h2>Quick Reference: Cookie Management</h2>
        <ol>
          <li><strong>Change preferences:</strong> Click "Cookie Settings" in the footer</li>
          <li><strong>View details:</strong> Click any cookie name in the tables above</li>
          <li><strong>Opt-out of analytics:</strong> Use our consent banner or install Google's opt-out add-on</li>
          <li><strong>Clear all cookies:</strong> Use your browser's settings (see links in Section 6.2)</li>
          <li><strong>Questions?</strong> Email privacy@subculture.io</li>
        </ol>
      </section>
    </main>
  );
}
